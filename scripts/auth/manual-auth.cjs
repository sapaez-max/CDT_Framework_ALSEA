const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

require('dotenv').config({ quiet: true });

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Configura ${name} en el archivo .env.`);
  return value;
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function main() {
  const baseUrl = required('BASE_URL');
  const accountName = required('APP_ACCOUNT_DISPLAY_NAME');
  const loginUrl = new URL(process.env.LOGIN_PATH || '/login/', baseUrl).toString();
  const landingUrl = new URL(process.env.LANDING_PATH || '/landing/', baseUrl);
  const statePath = path.resolve(process.env.AUTH_STATE_PATH || '.auth/admin.json');
  const timeout = numberFromEnv('MANUAL_AUTH_TIMEOUT_MS', 300_000);

  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || 'chrome',
    headless: false,
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Chrome se abrira en el login de Alsea Delivery.');
    console.log('Completa manualmente el usuario, la contrasena y el inicio de sesion.');
    console.log(`La sesion se guardara al detectar ${landingUrl.pathname}.`);

    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(
      url => url.origin === landingUrl.origin && url.pathname === landingUrl.pathname,
      { timeout },
    );
    await page.getByText(accountName, { exact: true }).waitFor({ state: 'visible', timeout: 30_000 });

    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    await context.storageState({ path: statePath });

    console.log(`Sesion Admin guardada en ${path.relative(process.cwd(), statePath)}.`);
    console.log('Ya puedes ejecutar: npm run test:session');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(`No se pudo guardar la sesion manual: ${error.message}`);
  process.exitCode = 1;
});
