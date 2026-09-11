import path from 'path';
import { env } from '../src/config/env';
import { inspectCognitoAuthState, type AuthStateInspection } from '../src/utils/auth-state';

function sessionError(inspection: AuthStateInspection): string {
  const regenerate = 'Ejecute: npm run auth:manual';

  switch (inspection.status) {
    case 'missing':
      return `La sesion Admin no esta disponible. No existe ${env.authStatePath}. ${regenerate}`;
    case 'empty':
      return `La sesion Admin no esta disponible. ${env.authStatePath} esta vacia. ${regenerate}`;
    case 'invalid-json':
      return `La sesion Admin no esta disponible. ${env.authStatePath} no contiene JSON valido. ${regenerate}`;
    case 'token-not-found':
      return `La sesion Admin no esta disponible. ${env.authStatePath} no contiene tokens Cognito reconocibles. ${regenerate}`;
    case 'token-invalid':
      return `La sesion Admin no esta disponible. ${env.authStatePath} contiene un JWT Cognito invalido. ${regenerate}`;
    case 'expired':
      return `La sesion Admin esta expirada desde ${new Date(inspection.expiresAtMs).toISOString()}. ${regenerate}`;
    case 'expiring':
      return `La sesion Admin esta por expirar (${new Date(inspection.expiresAtMs).toISOString()}). ${regenerate}`;
    case 'valid':
      return '';
  }
}

export default async function globalAuthCheck(): Promise<void> {
  if (!env.authEnabled) return;

  const inspection = inspectCognitoAuthState(
    path.resolve(env.authStatePath),
    Date.now(),
    env.authMinimumValidityMs,
  );

  if (inspection.status !== 'valid') {
    throw new Error(sessionError(inspection));
  }
}
