// app.js is held to tsc strict.
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('app.js passes tsc strict with checkJs', () => {
  const tsc = path.join(ROOT, 'node_modules/typescript/lib/tsc.js');
  const result = spawnSync(process.execPath, [
    tsc,
    '-p', path.join(ROOT, 'tsconfig.strict-app.json'),
    '--pretty', 'false',
    '--noEmit',
  ], { encoding: 'utf8' });
  const out = (result.stdout || '') + (result.stderr || '');
  assert.equal(result.status, 0, out);
});
