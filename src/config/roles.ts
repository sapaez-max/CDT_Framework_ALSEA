import path from 'path';
import { devices, type Project } from '@playwright/test';
import { env } from './env';

export const fileEditTestPattern = /ordenamiento-gpo-mod[\\/](?:CP2|CP14|CP26|CP38)[\\/].*\.spec\.ts/;

export function getRoleProjectConfigs(): Project[] {
  return [{
    name: 'chromium',
    testMatch: '**/*.spec.ts',
    testIgnore: fileEditTestPattern,
    dependencies: env.authEnabled ? ['setup'] : [],
    use: {
      ...devices['Desktop Chrome'],
      storageState: env.authEnabled ? path.resolve(env.authStatePath) : undefined,
    },
    metadata: { roleName: env.authRole },
  }];
}
