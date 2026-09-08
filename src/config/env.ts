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

function firstDefined(...values: Array<string | undefined>): string {
  return values.find((value) => value !== undefined && value !== '') ?? '';
}

export const env = {
  baseUrl: process.env.BASE_URL ?? 'https://gl-woe.appdevalsea.com',

  appEnv: process.env.APP_ENV ?? 'local',

  username: firstDefined(
    process.env.APP_USERNAME,
    process.env.TEST_USERNAME
  ),

  password: firstDefined(
    process.env.APP_PASSWORD,
    process.env.TEST_PASSWORD
  ),

  accountDisplayName: firstDefined(
    process.env.APP_ACCOUNT_DISPLAY_NAME,
    process.env.TEST_ACCOUNT_DISPLAY_NAME,
    process.env.APP_USERNAME,
    process.env.TEST_USERNAME
  ),

  company: process.env.APP_COMPANY ?? '',
  context: process.env.APP_CONTEXT ?? '',

  authEnabled: booleanFromEnv('AUTH_ENABLED', false),
  authRole: process.env.AUTH_ROLE ?? 'default',

  autoGoto: booleanFromEnv('E2E_AUTO_GOTO', true),

  headless: booleanFromEnv('HEADLESS', true),
  video: videoFromEnv(),
  workers: numberFromEnv('WORKERS', 1),
  retries: numberFromEnv('RETRIES', 0),

  actionTimeoutMs: numberFromEnv('ACTION_TIMEOUT_MS', 10_000),
  expectTimeoutMs: numberFromEnv('EXPECT_TIMEOUT_MS', 15_000),
  navigationTimeoutMs: numberFromEnv('NAVIGATION_TIMEOUT_MS', 30_000),

  login: {
    path: process.env.LOGIN_PATH ?? '/Login',

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

export function validateRequiredEnv(
  options: { requireAuth?: boolean } = {}
): void {
  const missing: string[] = [];

  if (!env.baseUrl) {
    missing.push('BASE_URL');
  }

  if (options.requireAuth || env.authEnabled) {
    if (!env.username) {
      missing.push('TEST_USERNAME o APP_USERNAME');
    }

    if (!env.password) {
      missing.push('TEST_PASSWORD o APP_PASSWORD');
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Configura las variables requeridas antes de ejecutar: ${missing.join(', ')}`
    );
  }
}
