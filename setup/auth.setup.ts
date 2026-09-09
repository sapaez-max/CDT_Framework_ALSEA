import path from 'path';
import { test as setup } from '@fixtures/base.fixture';
import { env } from '@config/env';
import { inspectCognitoAuthState, type AuthStateInspection } from '@utils/auth-state';

function sessionError(inspection: AuthStateInspection): string {
  const regenerate = 'Ejecuta: npm run auth:manual';

  switch (inspection.status) {
    case 'missing':
      return `No existe ${env.authStatePath}. ${regenerate}`;
    case 'empty':
      return `La sesion ${env.authStatePath} esta vacia. ${regenerate}`;
    case 'invalid-json':
      return `La sesion ${env.authStatePath} no contiene JSON valido. ${regenerate}`;
    case 'token-not-found':
      return `La sesion ${env.authStatePath} no contiene tokens Cognito reconocibles. ${regenerate}`;
    case 'token-invalid':
      return `La sesion ${env.authStatePath} contiene un JWT Cognito invalido. ${regenerate}`;
    case 'expired':
      return `La sesion ${env.authStatePath} expiro el ${new Date(inspection.expiresAtMs).toISOString()}. ${regenerate}`;
    case 'expiring':
      return `La sesion ${env.authStatePath} esta por expirar (${new Date(inspection.expiresAtMs).toISOString()}). ${regenerate}`;
    case 'valid':
      return '';
  }
}

setup('la sesion Admin manual esta disponible', async () => {
  setup.skip(!env.authEnabled, 'AUTH_ENABLED=false; no se requiere sesion guardada.');

  const statePath = path.resolve(env.authStatePath);
  const inspection = inspectCognitoAuthState(
    statePath,
    Date.now(),
    env.authMinimumValidityMs,
  );

  if (inspection.status !== 'valid') {
    throw new Error(sessionError(inspection));
  }
});
