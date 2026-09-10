import fs from 'fs';
import path from 'path';
import { google, type gmail_v1 } from 'googleapis';
import { env, validateGmailEnv } from '@config/env';

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
};

export type TemplateEmailResult = {
  receivedAt: string;
  from: string;
  subject: string;
  attachmentName: string;
  savedPath: string;
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
    const response = await this.gmail.users.messages.list({
      userId: env.gmail.userId,
      q: this.templateEmailQuery(),
      maxResults: 100,
    });

    return new Set(
      (response.data.messages ?? [])
        .map(message => message.id)
        .filter((id): id is string => Boolean(id)),
    );
  }

  async waitForTemplateEmail(
    baselineIds: ReadonlySet<string>,
    expectation: TemplateEmailExpectation,
  ): Promise<TemplateEmailResult> {
    const deadline = Date.now() + env.gmail.pollTimeoutMs;
    const mismatches: string[] = [];

    while (Date.now() < deadline) {
      const response = await this.gmail.users.messages.list({
        userId: env.gmail.userId,
        q: this.templateEmailQuery(),
        maxResults: 20,
      });

      const newMessageIds = (response.data.messages ?? [])
        .map(message => message.id)
        .filter((id): id is string => typeof id === 'string' && !baselineIds.has(id));

      for (const messageId of newMessageIds) {
        const message = await this.gmail.users.messages.get({
          userId: env.gmail.userId,
          id: messageId,
          format: 'full',
        });
        const result = await this.matchAndSaveTemplate(message.data, expectation);

        if (result.status === 'matched') {
          return result.email;
        }

        mismatches.push(result.reason);
      }

      await wait(env.gmail.pollIntervalMs);
    }

    const detail = Array.from(new Set(mismatches)).slice(-5).join(' | ');
    throw new Error(
      `No se recibio el correo esperado para ${expectation.caseId} en ${Math.round(env.gmail.pollTimeoutMs / 60_000)} minutos.${detail ? ` Mensajes descartados: ${detail}` : ''}`,
    );
  }

  private async matchAndSaveTemplate(
    message: gmail_v1.Schema$Message,
    expectation: TemplateEmailExpectation,
  ): Promise<{ status: 'matched'; email: TemplateEmailResult } | { status: 'mismatch'; reason: string }> {
    const from = messageHeader(message, 'From');
    const subject = messageHeader(message, 'Subject');

    if (!from.toLowerCase().includes(env.gmail.expectedFrom.toLowerCase())) {
      return { status: 'mismatch', reason: `remitente inesperado: ${from}` };
    }

    if (normalize(subject) !== normalize(env.gmail.expectedSubject)) {
      return { status: 'mismatch', reason: `asunto inesperado: ${subject}` };
    }

    const content = collectMessageContent(message.payload);
    const normalizedBody = normalize(content.bodyParts.join(' '));
    const expectedFields: Array<[string, string | string[]]> = [
      ['pais', expectation.country],
      ['marca', expectation.brand],
      ['sucursal', expectation.branch],
      ['tipo de menu', expectation.menuType],
    ];
    const missing = expectedFields
      .filter(([, values]) => !includesAny(normalizedBody, values))
      .map(([label, values]) => `${label}=${asArray(values).join(' o ')}`);

    if (missing.length > 0) {
      return { status: 'mismatch', reason: `el cuerpo no contiene ${missing.join(', ')}` };
    }

    const attachment = content.attachments.find(candidate => /\.xlsx?$/i.test(candidate.filename));
    if (!attachment) {
      return { status: 'mismatch', reason: 'el correo no contiene un adjunto .xls o .xlsx' };
    }

    const attachmentData = await this.readAttachment(message.id, attachment);
    const outputDirectory = path.resolve('artifacts', 'downloads', safeSegment(expectation.caseId));
    const outputPath = path.join(outputDirectory, path.basename(attachment.filename));
    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(outputPath, attachmentData);

    return {
      status: 'matched',
      email: {
        receivedAt: message.internalDate
          ? new Date(Number(message.internalDate)).toISOString()
          : '',
        from,
        subject,
        attachmentName: attachment.filename,
        savedPath: outputPath,
      },
    };
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

  return decoded
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú');
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

function includesAny(normalizedBody: string, values: string | string[]): boolean {
  return asArray(values).some(value => normalizedBody.includes(normalize(value)));
}

function asArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function wait(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
