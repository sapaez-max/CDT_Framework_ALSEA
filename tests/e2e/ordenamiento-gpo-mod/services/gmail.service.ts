import type {
  CaseEmailExpectation,
  GmailClient,
  TemplateEmailExpectation,
  TemplateEmailResult,
} from '@src/integrations/google/gmail-client';

export class GmailService {
  constructor(private readonly client: GmailClient) {}

  captureTemplateBaseline(): Promise<Set<string>> {
    return this.client.captureTemplateEmailBaseline();
  }

  captureCaseBaseline(): Promise<Set<string>> {
    return this.client.captureCaseEmailBaseline();
  }

  waitForTemplate(
    baseline: ReadonlySet<string>,
    expectation: TemplateEmailExpectation,
  ): Promise<TemplateEmailResult> {
    return this.client.waitForTemplateEmail(baseline, expectation);
  }

  waitForCase(
    baseline: ReadonlySet<string>,
    expectation: CaseEmailExpectation,
  ): Promise<TemplateEmailResult> {
    return this.client.waitForCaseEmail(baseline, expectation);
  }
}

