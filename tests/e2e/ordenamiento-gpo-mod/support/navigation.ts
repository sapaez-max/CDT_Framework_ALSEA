import { env } from '@config/env';
import type { Page } from '@fixtures/base.fixture';

export async function goToLanding(page: Page): Promise<void> {
  await page.goto(env.login.landingPath, { waitUntil: 'commit' }).catch((error: Error) => {
    if (!/ERR_ABORTED/i.test(error.message)) throw error;
  });
}

