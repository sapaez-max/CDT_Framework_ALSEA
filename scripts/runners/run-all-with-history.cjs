const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const startedAt = new Date();
const runId = startedAt.toISOString().replace(/[:.]/g, '-');
const historyDir = path.resolve('reports', 'history', runId);
fs.mkdirSync(historyDir, { recursive: true });

const result = spawnSync('npx', ['playwright', 'test'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, ALSEA_RUN_ID: runId },
});

const summary = {
  runId,
  startedAt: startedAt.toISOString(),
  finishedAt: new Date().toISOString(),
  exitCode: result.status ?? 1,
};

fs.writeFileSync(path.join(historyDir, 'summary.json'), JSON.stringify(summary, null, 2));
process.exit(summary.exitCode);
