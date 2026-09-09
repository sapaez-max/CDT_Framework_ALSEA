import path from 'path';
import { devices, type Project } from '@playwright/test';
import { env } from './env';

export function getRoleProjectConfigs(): Project[] {
  return [{
    name: 'chromium',
    testMatch: '**/auth/session.spec.ts',
    dependencies: env.authEnabled ? ['setup'] : [],
    use: {
      ...devices['Desktop Chrome'],
      storageState: env.authEnabled ? path.resolve(env.authStatePath) : undefined,
    },
    metadata: { roleName: env.authRole },
  }];
}
