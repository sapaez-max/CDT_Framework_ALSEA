import fs from 'fs';

type StorageEntry = {
  name?: unknown;
  value?: unknown;
};

type StorageOrigin = {
  localStorage?: StorageEntry[];
};

type PlaywrightStorageState = {
  cookies?: unknown[];
  origins?: StorageOrigin[];
};

export type AuthStateInspection =
  | { status: 'valid'; expiresAtMs: number }
  | { status: 'missing' | 'empty' | 'invalid-json' | 'token-not-found' | 'token-invalid' }
  | { status: 'expired' | 'expiring'; expiresAtMs: number };

function jwtExpirationMs(token: string): number | undefined {
  const payload = token.split('.')[1];
  if (!payload) return undefined;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: unknown };
    return typeof decoded.exp === 'number' && Number.isFinite(decoded.exp)
      ? decoded.exp * 1_000
      : undefined;
  } catch {
    return undefined;
  }
}

export function inspectCognitoAuthState(
  statePath: string,
  nowMs = Date.now(),
  minimumValidityMs = 60_000,
): AuthStateInspection {
  if (!fs.existsSync(statePath)) return { status: 'missing' };

  let state: PlaywrightStorageState;
  try {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8')) as PlaywrightStorageState;
  } catch {
    return { status: 'invalid-json' };
  }

  if ((state.cookies?.length ?? 0) + (state.origins?.length ?? 0) === 0) {
    return { status: 'empty' };
  }

  const tokens = (state.origins ?? [])
    .flatMap(origin => origin.localStorage ?? [])
    .filter(entry =>
      typeof entry.name === 'string'
      && typeof entry.value === 'string'
      && /\.(accessToken|idToken)$/.test(entry.name),
    )
    .map(entry => entry.value as string);

  if (tokens.length === 0) return { status: 'token-not-found' };

  const expirations = tokens.map(jwtExpirationMs);
  if (expirations.some(expiration => expiration === undefined)) {
    return { status: 'token-invalid' };
  }

  const expiresAtMs = Math.min(...(expirations as number[]));
  if (expiresAtMs <= nowMs) return { status: 'expired', expiresAtMs };
  if (expiresAtMs <= nowMs + minimumValidityMs) return { status: 'expiring', expiresAtMs };

  return { status: 'valid', expiresAtMs };
}
