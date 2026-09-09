const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline/promises');
const { chromium } = require('playwright');

require('dotenv').config({ quiet: true });

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Configura ${name} en el archivo .env.`);
  return value;
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function resolveChromeExecutable() {
  const configured = process.env.BROWSER_EXECUTABLE_PATH;
  const candidates = [
    configured,
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ].filter(Boolean);

  const executable = candidates.find(candidate => fs.existsSync(candidate));
  if (!executable) {
    throw new Error('No se encontro Google Chrome. Configura BROWSER_EXECUTABLE_PATH en .env.');
  }

  return executable;
}

function ensureCaptureProfileIsSafe(profilePath) {
  const authRoot = path.resolve('.auth');
  const expectedPrefix = `${authRoot}${path.sep}`;
  if (!profilePath.startsWith(expectedPrefix)) {
    throw new Error('AUTH_CAPTURE_PROFILE_PATH debe estar dentro de .auth.');
  }
}

async function endpointIsAvailable(endpoint) {
  try {
    const response = await fetch(`${endpoint}/json/version`);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForEndpoint(endpoint, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await endpointIsAvailable(endpoint)) return;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Chrome no habilito la depuracion local en ${endpoint}.`);
}

function jwtExpirationMs(token) {
  const payload = token.split('.')[1];
  if (!payload) return undefined;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof decoded.exp === 'number' ? decoded.exp * 1_000 : undefined;
  } catch {
    return undefined;
  }
}

function validateCapturedTokens(localStorage, minimumValidityMs) {
  const tokens = localStorage
    .filter(entry => /\.(accessToken|idToken)$/.test(entry.name))
    .map(entry => entry.value);

  if (tokens.length === 0) {
    throw new Error('La landing no contiene tokens Cognito. Verifica que el login haya finalizado.');
  }

  const expirations = tokens.map(jwtExpirationMs);
  if (expirations.some(expiration => expiration === undefined)) {
    throw new Error('La landing contiene un token Cognito que no puede validarse.');
  }

  const expiresAtMs = Math.min(...expirations);
  if (expiresAtMs <= Date.now() + minimumValidityMs) {
    throw new Error(`La sesion capturada ya expiro o esta por expirar (${new Date(expiresAtMs).toISOString()}).`);
  }

  return expiresAtMs;
}

async function waitForEnter(message, timeoutMs) {
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  let timeoutId;
  try {
    await Promise.race([
      terminal.question(`${message}\nPresiona Enter cuando veas la pantalla de inicio... `),
      new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`El acceso manual no se completo en ${Math.round(timeoutMs / 60_000)} minutos.`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
    terminal.close();
  }
}

async function main() {
  const baseUrl = required('BASE_URL');
  const accountName = required('APP_ACCOUNT_DISPLAY_NAME');
  const loginUrl = new URL(process.env.LOGIN_PATH || '/login/', baseUrl).toString();
  const landingUrl = new URL(process.env.LANDING_PATH || '/landing/', baseUrl);
  const statePath = path.resolve(process.env.AUTH_STATE_PATH || '.auth/admin.json');
  const profilePath = path.resolve(process.env.AUTH_CAPTURE_PROFILE_PATH || '.auth/chrome-capture-profile');
  const port = numberFromEnv('AUTH_CDP_PORT', 9222);
  const endpoint = `http://127.0.0.1:${port}`;
  const timeout = numberFromEnv('MANUAL_AUTH_TIMEOUT_MS', 300_000);
  const minimumValidityMs = numberFromEnv('AUTH_MINIMUM_VALIDITY_MS', 60_000);

  ensureCaptureProfileIsSafe(profilePath);
  if (await endpointIsAvailable(endpoint)) {
    throw new Error(`El puerto ${port} ya esta siendo utilizado por otra sesion de depuracion.`);
  }

  fs.mkdirSync(profilePath, { recursive: true });

  const chrome = spawn(resolveChromeExecutable(), [
    '--remote-debugging-address=127.0.0.1',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profilePath}`,
    '--no-first-run',
    '--no-default-browser-check',
    loginUrl,
  ], { stdio: 'ignore' });

  let browser;
  try {
    await waitForEndpoint(endpoint, 30_000);
    await waitForEnter(
      'Chrome se abrio fuera de Playwright. Completa manualmente el login de Alsea y espera a llegar a /landing/.',
      timeout,
    );

    browser = await chromium.connectOverCDP(endpoint);
    const contexts = browser.contexts();
    const pages = contexts.flatMap(context => context.pages());
    const page = pages.find(candidate => {
      try {
        const current = new URL(candidate.url());
        return current.origin === landingUrl.origin && current.pathname === landingUrl.pathname;
      } catch {
        return false;
      }
    });

    if (!page) {
      throw new Error(`No se encontro una pestana autenticada en ${landingUrl.pathname}.`);
    }

    await page.getByText(accountName, { exact: true }).waitFor({ state: 'visible', timeout: 30_000 });

    const context = page.context();
    const cookies = await context.cookies([landingUrl.origin]);
    const localStorage = await page.evaluate(() =>
      Object.keys(window.localStorage).map(name => ({ name, value: window.localStorage.getItem(name) ?? '' })),
    );
    const expiresAtMs = validateCapturedTokens(localStorage, minimumValidityMs);

    const state = {
      cookies,
      origins: [{ origin: landingUrl.origin, localStorage }],
    };

    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

    console.log(`Sesion Admin guardada en ${path.relative(process.cwd(), statePath)}.`);
    console.log(`Tokens validos hasta ${new Date(expiresAtMs).toISOString()}.`);
    console.log('Ya puedes ejecutar: npm run test:session');
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    } else if (!chrome.killed) {
      chrome.kill();
    }

    try {
      fs.rmSync(profilePath, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
    } catch {
      console.warn(`No se pudo eliminar el perfil temporal ${profilePath}. Eliminalo cuando Chrome este cerrado.`);
    }
  }
}

main().catch(error => {
  console.error(`No se pudo capturar la sesion manual: ${error.message}`);
  process.exitCode = 1;
});
