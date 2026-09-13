import path from 'path';
import { devices, type Project } from '@playwright/test';
import { env } from './env';

const scenarioPath = 'ordenamiento-gpo-mod[\\\\/]scenarios[\\\\/]';

export const fileEditTestPattern = new RegExp(`${scenarioPath}02-edit-template\\.spec\\.ts`);
export const chainedDownloadTestPattern = new RegExp(`${scenarioPath}01-download-template\\.spec\\.ts`);
export const chainedEditTestPattern = fileEditTestPattern;
export const chainedFilterLoadTestPattern = new RegExp(`${scenarioPath}03-upload-filters\\.spec\\.ts`);
export const chainedMenuLoadTestPattern = new RegExp(`${scenarioPath}04-upload-menu\\.spec\\.ts`);
export const chainedCoreViewerTestPattern = new RegExp(`${scenarioPath}05-validate-visor\\.spec\\.ts`);
export const chainedJsonValidationTestPattern = new RegExp(`${scenarioPath}06-validate-json\\.spec\\.ts`);
export const chainedReorderGroupsTestPattern = new RegExp(`${scenarioPath}07-reorder-groups\\.spec\\.ts`);
export const chainedReorderModifiersTestPattern = new RegExp(`${scenarioPath}08-reorder-modifiers\\.spec\\.ts`);
export const chainedReorderGroupsAndModifiersTestPattern = new RegExp(`${scenarioPath}09-reorder-groups-and-modifiers\\.spec\\.ts`);
export const chainedUpdateExistingMenuTestPattern = new RegExp(`${scenarioPath}10-update-existing-menu\\.spec\\.ts`);
export const chainedOrdenamientoTestPattern = new RegExp(`${scenarioPath}.*\\.spec\\.ts`);

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
