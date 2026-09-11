import fs from 'fs';
import path from 'path';
import { google, type gmail_v1 } from 'googleapis';
import { env, validateGmailEnv } from '@config/env';
import { saveCaseExcel, type ArtifactScope } from '@utils/case-artifact-manager';

type OAuthClientDefinition = {
  client_id?: string;
  client_secret?: string;
  redirect_uris?: string[];
};

type OAuthCredentialsFile = {
  installed?: OAuthClientDefinition;
  web?: OAuthClientDefinition;
};

type StoredToken = {
  token?: string;
  refresh_token?: string;
  expiry?: string;
  scopes?: string[];
};

type ExcelAttachment = {
  filename: string;
  attachmentId?: string;
  inlineData?: string;
};

export type TemplateEmailExpectation = {
  caseId: string;
  country: string | string[];
  brand: string | string[];
  branch: string | string[];
  menuType: string | string[];
  artifactScope: ArtifactScope;
};

export type EmailBodyExpectation = {
  label: string;
  values: string | string[];
  extractPattern?: RegExp;
};

export type CaseEmailExpectation = {
  caseId: string;
  subject: string | RegExp;
  bodyFields: EmailBodyExpectation[];
  requireExcelAttachment?: boolean;
  artifactScope: ArtifactScope;
};

export type EmailValidationResult = {
  label: string;
  expected: string;
  actual: string;
  passed: boolean;
};

export type TemplateEmailResult = {
  messageId: string;
  threadId?: string;
  receivedAt: string;
  from: string;
  subject: string;
  attachmentName?: string;
  savedPath?: string;
  bodyPreview: string;
  validations: EmailValidationResult[];
};

export class GmailClient {
  private constructor(private readonly gmail: gmail_v1.Gmail) {}

  static async create(): Promise<GmailClient> {
    validateGmailEnv();

    const credentials = readJson<OAuthCredentialsFile>(env.gmail.credentialsPath);
    const token = readJson<StoredToken>(env.gmail.tokenPath);
    const client = credentials.installed ?? credentials.web;

    if (!client?.client_id || !client.client_secret) {
      throw new Error('El archivo de credenciales no contiene un cliente OAuth valido.');
    }

    if (!token.refresh_token) {
      throw new Error('El token de Google no contiene refresh_token.');
    }

    const oauth = new google.auth.OAuth2(
      client.client_id,
      client.client_secret,
      client.redirect_uris?.[0],
    );

    oauth.setCredentials({
      access_token: token.token,
      refresh_token: token.refresh_token,
      expiry_date: token.expiry ? Date.parse(token.expiry) : undefined,
      scope: token.scopes?.join(' '),
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth });
    const profile = await gmail.users.getProfile({ userId: env.gmail.userId });
    const actualAccount = profile.data.emailAddress?.toLowerCase();

    if (actualAccount !== env.gmail.account.toLowerCase()) {
      throw new Error(
        `El token de Gmail corresponde a ${profile.data.emailAddress ?? 'una cuenta desconocida'}, no a ${env.gmail.account}.`,
      );
    }

    return new GmailClient(gmail);
  }

  async captureTemplateEmailBaseline(): Promise<Set<string>> {
    return new Set(await this.findTemplateMessageIds(100));
  }

  async captureCaseEmailBaseline(): Promise<Set<string>> {
    return new Set(await this.findCaseMessageIds(100));
  }

  async waitForTemplateEmail(
    baselineIds: ReadonlySet<string>,
    expectation: TemplateEmailExpectation,
  ): Promise<TemplateEmailResult> {
    return this.waitForCaseEmail(baselineIds, {
      caseId: expectation.caseId,
      subject: env.gmail.expectedSubject,
      bodyFields: [
        { label: 'Pais', values: expectation.country },
        { label: 'Marca', values: expectation.brand },
        { label: 'Sucursal', values: expectation.branch },
        { label: 'Tipo menu', values: expectation.menuType },
      ],
      requireExcelAttachment: true,
      artifactScope: expectation.artifactScope,
    });
  }

  async waitForCaseEmail(
    baselineIds: ReadonlySet<string>,
    expectation: CaseEmailExpectation,
  ): Promise<TemplateEmailResult> {
    const deadline = Date.now() + env.gmail.pollTimeoutMs;
    const mismatches: string[] = [];

    while (Date.now() < deadline) {
      const newMessageIds = (await this.findCaseMessageIds(20))
        .filter((id) => !baselineIds.has(id));

      for (const messageId of newMessageIds) {
        const message = await this.gmail.users.messages.get({
          userId: env.gmail.userId,
          id: messageId,
          format: 'full',
        });
        const result = await this.matchCaseEmail(message.data, expectation);

        if (result.status === 'matched') {
          return result.email;
        }

        mismatches.push(result.reason);
      }

      await wait(Math.min(env.gmail.pollIntervalMs, Math.max(deadline - Date.now(), 0)));
    }

    const detail = Array.from(new Set(mismatches)).slice(-5).join(' | ');
    throw new Error(
      `No se recibio el correo esperado para ${expectation.caseId} en ${Math.round(env.gmail.pollTimeoutMs / 60_000)} minutos.${detail ? ` Mensajes descartados: ${detail}` : ''}`,
    );
  }

  private async matchCaseEmail(
    message: gmail_v1.Schema$Message,
    expectation: CaseEmailExpectation,
  ): Promise<{ status: 'matched'; email: TemplateEmailResult } | { status: 'mismatch'; reason: string }> {
    const from = messageHeader(message, 'From');
    const subject = messageHeader(message, 'Subject');
    const fromValidation: EmailValidationResult = {
      label: 'Remitente',
      expected: env.gmail.expectedFrom,
      actual: from,
      passed: from.toLowerCase().includes(env.gmail.expectedFrom.toLowerCase()),
    };

    if (!fromValidation.passed) {
      return { status: 'mismatch', reason: `remitente inesperado: ${from}` };
    }

    const subjectValidation: EmailValidationResult = {
      label: 'Asunto',
      expected: displayExpectedSubject(expectation.subject),
      actual: subject,
      passed: subjectMatches(subject, expectation.subject),
    };

    if (!subjectValidation.passed) {
      return { status: 'mismatch', reason: `asunto inesperado: ${subject}` };
    }

    const content = collectMessageContent(message.payload);
    const bodyText = content.bodyParts.join(' ');
    const normalizedBody = normalize(bodyText);
    const bodyValidations = expectation.bodyFields
      .map(field => bodyFieldValidation(field, bodyText, normalizedBody));
    const missing = bodyValidations
      .filter(validation => !validation.passed)
      .map(validation => `${validation.label} esperado="${validation.expected}" encontrado="${validation.actual}"`);

    if (missing.length > 0) {
      return { status: 'mismatch', reason: `correo candidato descartado: ${missing.join('; ')}` };
    }

    const attachment = expectation.requireExcelAttachment
      ? selectExcelAttachment(content.attachments, expectation)
      : undefined;
    if (expectation.requireExcelAttachment && !attachment) {
      return { status: 'mismatch', reason: 'el correo no contiene un adjunto .xls o .xlsx' };
    }
    const attachmentValidation: EmailValidationResult | undefined = attachment
      ? {
          label: 'Adjunto Excel',
          expected: '.xls o .xlsx',
          actual: attachment.filename,
          passed: /\.xlsx?$/i.test(attachment.filename),
        }
      : undefined;

    const outputPath = attachment
      ? saveCaseExcel(
          expectation.caseId,
          attachment.filename,
          await this.readAttachment(message.id, attachment),
          expectation.artifactScope,
        )
      : undefined;

    return {
      status: 'matched',
      email: {
        messageId: message.id ?? '',
        threadId: message.threadId ?? undefined,
        receivedAt: message.internalDate
          ? new Date(Number(message.internalDate)).toISOString()
          : '',
        from,
        subject,
        attachmentName: attachment?.filename,
        savedPath: outputPath,
        bodyPreview: evidenceBody(content.bodyParts.join('\n\n')),
        validations: [
          fromValidation,
          subjectValidation,
          ...bodyValidations,
          ...(attachmentValidation ? [attachmentValidation] : []),
        ],
      },
    };
  }

  private async findTemplateMessageIds(maxResults: number): Promise<string[]> {
    return this.findMessageIds(this.templateEmailQuery(), maxResults);
  }

  private async findCaseMessageIds(maxResults: number): Promise<string[]> {
    return this.findMessageIds(`from:${env.gmail.expectedFrom}`, maxResults);
  }

  private async findMessageIds(query: string, maxResults: number): Promise<string[]> {
    const response = await this.gmail.users.messages.list({
      userId: env.gmail.userId,
      q: query,
      maxResults,
    });

    return (response.data.messages ?? [])
      .map(message => message.id)
      .filter((id): id is string => typeof id === 'string');
  }

  private async readAttachment(messageId: string | null | undefined, attachment: ExcelAttachment): Promise<Buffer> {
    if (attachment.inlineData) {
      return Buffer.from(attachment.inlineData, 'base64url');
    }

    if (!messageId || !attachment.attachmentId) {
      throw new Error(`El adjunto ${attachment.filename} no contiene datos descargables.`);
    }

    const response = await this.gmail.users.messages.attachments.get({
      userId: env.gmail.userId,
      messageId,
      id: attachment.attachmentId,
    });

    if (!response.data.data) {
      throw new Error(`Gmail no devolvio contenido para el adjunto ${attachment.filename}.`);
    }

    return Buffer.from(response.data.data, 'base64url');
  }

  private templateEmailQuery(): string {
    return [
      `from:${env.gmail.expectedFrom}`,
      `subject:"${env.gmail.expectedSubject}"`,
      'has:attachment',
      '{filename:xls filename:xlsx}',
    ].join(' ');
  }
}

function readJson<T>(filePath: string): T {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`No existe el archivo requerido ${resolved}.`);
  }

  try {
    return JSON.parse(fs.readFileSync(resolved, 'utf8')) as T;
  } catch {
    throw new Error(`El archivo ${resolved} no contiene JSON valido.`);
  }
}

function collectMessageContent(
  part: gmail_v1.Schema$MessagePart | undefined,
  result: { bodyParts: string[]; attachments: ExcelAttachment[] } = { bodyParts: [], attachments: [] },
): { bodyParts: string[]; attachments: ExcelAttachment[] } {
  if (!part) return result;

  if (/^text\/(plain|html)$/i.test(part.mimeType ?? '') && part.body?.data) {
    result.bodyParts.push(decodeBodyPart(part.body.data));
  }

  if (part.filename) {
    result.attachments.push({
      filename: part.filename,
      attachmentId: part.body?.attachmentId ?? undefined,
      inlineData: part.body?.data ?? undefined,
    });
  }

  for (const child of part.parts ?? []) {
    collectMessageContent(child, result);
  }

  return result;
}

function decodeBodyPart(data: string): string {
  const bytes = Buffer.from(data, 'base64url');
  const decoded = bytes.toString('utf8');

  return decodeHtmlEntities(decoded
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' '));
}

function messageHeader(message: gmail_v1.Schema$Message, name: string): string {
  return message.payload?.headers?.find(
    header => header.name?.toLowerCase() === name.toLowerCase(),
  )?.value ?? '';
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/M[^A-Z0-9]*XICO/g, 'MEXICO');
}

function asArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

function bodyFieldValidation(
  expectation: EmailBodyExpectation,
  bodyText: string,
  normalizedBody: string,
): EmailValidationResult {
  const expectedValues = asArray(expectation.values);

  if (expectation.extractPattern) {
    const actual = expectation.extractPattern.exec(bodyText)?.[1]?.trim() ?? 'No encontrado';

    return {
      label: expectation.label,
      expected: expectedValues.join(' o '),
      actual,
      passed: expectedValues.some(value => normalize(actual) === normalize(value)),
    };
  }

  const foundValues = expectedValues.filter(value => normalizedBody.includes(normalize(value)));

  return {
    label: expectation.label,
    expected: expectedValues.join(' o '),
    actual: foundValues.length > 0 ? foundValues.join(', ') : 'No encontrado',
    passed: foundValues.length > 0,
  };
}

function selectExcelAttachment(
  attachments: ExcelAttachment[],
  expectation: CaseEmailExpectation,
): ExcelAttachment | undefined {
  const excelAttachments = attachments.filter(candidate => /\.xlsx?$/i.test(candidate.filename));

  if (excelAttachments.length <= 1) {
    return excelAttachments[0];
  }

  const scored = excelAttachments.map((attachment) => ({
    attachment,
    score: expectation.bodyFields
      .reduce((total, field) => total + scoreFilenameMatch(attachment.filename, field.values), 0),
  }));
  const bestScore = Math.max(...scored.map(candidate => candidate.score));
  const bestMatches = scored.filter(candidate => candidate.score === bestScore);

  if (bestScore > 0 && bestMatches.length === 1) {
    return bestMatches[0].attachment;
  }

  throw new Error(
    `El correo contiene multiples adjuntos Excel y no hay una coincidencia unica para ${expectation.caseId}: ${excelAttachments.map(attachment => attachment.filename).join(', ')}`,
  );
}

function scoreFilenameMatch(filename: string, values: string | string[]): number {
  const normalizedFilename = normalize(filename);

  return asArray(values).filter(value => normalizedFilename.includes(normalize(value))).length;
}

function subjectMatches(actual: string, expected: string | RegExp): boolean {
  if (typeof expected === 'string') {
    return normalize(actual) === normalize(expected);
  }

  return expected.test(actual);
}

function displayExpectedSubject(expected: string | RegExp): string {
  return typeof expected === 'string' ? expected : expected.toString();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&aacute;|&#225;|&#xE1;/gi, 'a')
    .replace(/&eacute;|&#233;|&#xE9;/gi, 'e')
    .replace(/&iacute;|&#237;|&#xED;/gi, 'i')
    .replace(/&oacute;|&#243;|&#xF3;/gi, 'o')
    .replace(/&uacute;|&#250;|&#xFA;/gi, 'u')
    .replace(/&ntilde;|&#241;|&#xF1;/gi, 'n')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function evidenceBody(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
