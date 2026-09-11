import path from 'path';
import { devices, type Project } from '@playwright/test';
import { env } from './env';

export const fileEditTestPattern = /ordenamiento-gpo-mod[\\/](?:CP2|CP14|CP26|CP38)[\\/].*\.spec\.ts/;
export const chainedDownloadTestPattern = /ordenamiento-gpo-mod[\\/](?:CP1|CP13|CP25|CP37)[\\/].*\.spec\.ts/;
export const chainedEditTestPattern = fileEditTestPattern;
export const chainedFilterLoadTestPattern = /ordenamiento-gpo-mod[\\/](?:CP3|CP15|CP27|CP39)[\\/].*\.spec\.ts/;
export const chainedMenuLoadTestPattern = /ordenamiento-gpo-mod[\\/](?:CP4|CP16|CP28|CP40)[\\/].*\.spec\.ts/;
export const chainedCoreViewerTestPattern = /ordenamiento-gpo-mod[\\/](?:CP5|CP17|CP29|CP41)[\\/].*\.spec\.ts/;
export const chainedOrdenamientoTestPattern = /ordenamiento-gpo-mod[\\/](?:CP1|CP2|CP3|CP4|CP5|CP13|CP14|CP15|CP16|CP17|CP25|CP26|CP27|CP28|CP29|CP37|CP38|CP39|CP40|CP41)[\\/].*\.spec\.ts/;

export function getRoleProjectConfigs(): Project[] {
  return [{
    name: 'chromium',
    testMatch: '**/*.spec.ts',
    testIgnore: chainedOrdenamientoTestPattern,
    use: {
      ...devices['Desktop Chrome'],
      storageState: env.authEnabled ? path.resolve(env.authStatePath) : undefined,
    },
    metadata: { roleName: env.authRole },
  }];
}
