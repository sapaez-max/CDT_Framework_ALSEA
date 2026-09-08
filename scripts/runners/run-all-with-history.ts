import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const startedAt = new Date();
const runId = startedAt.toISOString().replace(/[:.]/g, '-');
const historyDir = path.resolve('reports', 'history', runId);
fs.mkdirSync(historyDir, { recursive: true });

const result = spawnSync('npx', ['playwright', 'test'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const summary = {
  runId,
  startedAt: startedAt.toISOString(),
  finishedAt: new Date().toISOString(),
  exitCode: result.status ?? 1,
};

fs.writeFileSync(path.join(historyDir, 'summary.json'), JSON.stringify(summary, null, 2));
process.exit(summary.exitCode);
