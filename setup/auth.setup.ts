import fs from 'fs';
import path from 'path';
import { expect, test as setup } from '@fixtures/base.fixture';
import { env } from '@config/env';

setup('la sesion Admin manual esta disponible', async () => {
  setup.skip(!env.authEnabled, 'AUTH_ENABLED=false; no se requiere sesion guardada.');

  const statePath = path.resolve(env.authStatePath);
  expect(
    fs.existsSync(statePath),
    `No existe ${env.authStatePath}. Ejecuta primero: npm run auth:manual`,
  ).toBeTruthy();

  const state = JSON.parse(fs.readFileSync(statePath, 'utf8')) as {
    cookies?: unknown[];
    origins?: unknown[];
  };

  expect(
    (state.cookies?.length ?? 0) + (state.origins?.length ?? 0),
    `La sesion ${env.authStatePath} esta vacia. Ejecuta nuevamente: npm run auth:manual`,
  ).toBeGreaterThan(0);
});
