import * as dotenv from 'dotenv';

dotenv.config();

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];

  if (!raw) return fallback;

  const parsed = Number(raw);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanFromEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];

  if (!raw) return fallback;

  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

function videoFromEnv(): 'off' | 'on' | 'retain-on-failure' | 'on-first-retry' {
  const raw = process.env.VIDEO?.toLowerCase();

  if (raw === 'off' || raw === 'on' || raw === 'retain-on-failure' || raw === 'on-first-retry') {
    return raw;
  }

  return 'retain-on-failure';
}

export const env = {
  baseUrl: process.env.BASE_URL ?? '',

  appEnv: process.env.APP_ENV ?? 'local',

  accountDisplayName: process.env.APP_ACCOUNT_DISPLAY_NAME ?? '',

  company: process.env.APP_COMPANY ?? '',
  context: process.env.APP_CONTEXT ?? '',

  authEnabled: booleanFromEnv('AUTH_ENABLED', false),
  authRole: process.env.AUTH_ROLE ?? 'admin',
  authStatePath: process.env.AUTH_STATE_PATH ?? '.auth/admin.json',
  authMinimumValidityMs: numberFromEnv('AUTH_MINIMUM_VALIDITY_MS', 60_000),

  autoGoto: booleanFromEnv('E2E_AUTO_GOTO', true),

  headless: booleanFromEnv('HEADLESS', true),
  browserChannel: process.env.BROWSER_CHANNEL || undefined,
  video: videoFromEnv(),
  workers: numberFromEnv('WORKERS', 1),
  retries: numberFromEnv('RETRIES', 0),

  actionTimeoutMs: numberFromEnv('ACTION_TIMEOUT_MS', 10_000),
  expectTimeoutMs: numberFromEnv('EXPECT_TIMEOUT_MS', 15_000),
  navigationTimeoutMs: numberFromEnv('NAVIGATION_TIMEOUT_MS', 30_000),
  manualAuthTimeoutMs: numberFromEnv('MANUAL_AUTH_TIMEOUT_MS', 300_000),

  gmail: {
    enabled: booleanFromEnv('GMAIL_ENABLED', false),
    account: process.env.GMAIL_ACCOUNT ?? '',
    userId: process.env.GMAIL_USER_ID ?? 'me',
    credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH ?? '',
    tokenPath: process.env.GOOGLE_TOKEN_PATH ?? '',
    expectedFrom: process.env.GMAIL_EXPECTED_FROM ?? '',
    expectedSubject: process.env.GMAIL_EXPECTED_SUBJECT ?? '',
    pollTimeoutMs: numberFromEnv('GMAIL_POLL_TIMEOUT_MS', 300_000),
    pollIntervalMs: numberFromEnv('GMAIL_POLL_INTERVAL_MS', 5_000),
  },

  login: {
    path: process.env.LOGIN_PATH ?? '/login/',
    landingPath: process.env.LANDING_PATH ?? '/landing/',

    usernameSelector:
      process.env.LOGIN_USERNAME_SELECTOR ?? '',

    passwordSelector:
      process.env.LOGIN_PASSWORD_SELECTOR ?? '',

    submitSelector:
      process.env.LOGIN_SUBMIT_SELECTOR ?? '',

    successSelector:
      process.env.LOGIN_SUCCESS_SELECTOR ?? '',

    accountSelector:
      process.env.LOGIN_ACCOUNT_SELECTOR ?? '',
  },
} as const;

export function validateRequiredEnv(): void {
  const missing: string[] = [];

  if (!env.baseUrl) {
    missing.push('BASE_URL');
  }

  if (!env.accountDisplayName) {
    missing.push('APP_ACCOUNT_DISPLAY_NAME');
  }

  if (missing.length > 0) {
    throw new Error(
      `Configura las variables requeridas antes de ejecutar: ${missing.join(', ')}`
    );
  }
}

export function validateGmailEnv(): void {
  if (!env.gmail.enabled) {
    throw new Error('GMAIL_ENABLED=false; habilita Gmail para validar la recepcion de plantillas.');
  }

  const required = [
    ['GMAIL_ACCOUNT', env.gmail.account],
    ['GOOGLE_CREDENTIALS_PATH', env.gmail.credentialsPath],
    ['GOOGLE_TOKEN_PATH', env.gmail.tokenPath],
    ['GMAIL_EXPECTED_FROM', env.gmail.expectedFrom],
    ['GMAIL_EXPECTED_SUBJECT', env.gmail.expectedSubject],
  ];
  const missing = required.filter(([, value]) => !value).map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Configura las variables de Gmail requeridas: ${missing.join(', ')}`);
  }
}
