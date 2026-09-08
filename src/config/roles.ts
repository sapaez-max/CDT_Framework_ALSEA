import fs from 'fs';
import path from 'path';
import { devices, type Project } from '@playwright/test';
import roles from './roles.json';

type RoleConfig = {
  id: string;
  name: string;
  projectName: string;
  storageState?: string;
  testMatch?: string[];
  testIgnore?: string[];
};

export function getRoles(): RoleConfig[] {
  return roles as RoleConfig[];
}

export function resolveStorageState(storageState?: string): string | undefined {
  if (!storageState) return undefined;
  const absolutePath = path.resolve(storageState);
  return fs.existsSync(absolutePath) ? absolutePath : undefined;
}

export function getRoleProjectConfigs(): Project[] {
  return getRoles().map((role) => ({
    name: role.projectName,
    testMatch: role.testMatch,
    testIgnore: role.testIgnore,
    use: {
      ...devices['Desktop Chrome'],
      storageState: resolveStorageState(role.storageState),
    },
    metadata: {
      roleId: role.id,
      roleName: role.name,
      storageState: role.storageState,
    },
  }));
}
