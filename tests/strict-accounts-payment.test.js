const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

test('accounts-payment.js passes tsc strict with checkJs', () => {
  const tsc = path.join(ROOT, 'node_modules/typescript/lib/tsc.js');
  const result = spawnSync(process.execPath, [
    tsc,
    '-p', path.join(ROOT, 'tsconfig.strict-accounts-payment.json'),
    '--pretty', 'false',
    '--noEmit',
  ], { encoding: 'utf8' });
  const out = (result.stdout || '') + (result.stderr || '');
  assert.equal(result.status, 0, out);
});
