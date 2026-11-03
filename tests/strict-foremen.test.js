// foremen.js is the next file held to tsc strict. It may use RenderApi only.
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('foremen.js passes tsc strict with checkJs', () => {
  const tsc = path.join(ROOT, 'node_modules/typescript/lib/tsc.js');
  const result = spawnSync(process.execPath, [
    tsc,
    '-p', path.join(ROOT, 'tsconfig.strict-foremen.json'),
    '--pretty', 'false',
    '--noEmit',
  ], { encoding: 'utf8' });
  const out = (result.stdout || '') + (result.stderr || '');
  assert.equal(result.status, 0, out);
});

test('a bare views name is not declared for the foremen script', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-foremen-'));
  fs.writeFileSync(path.join(dir, 'bare.js'), 'const leaked = views;\n');
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      allowJs: true,
      checkJs: true,
      strict: true,
      noEmit: true,
      target: 'ES2022',
      module: 'node16',
      moduleResolution: 'node16',
      lib: ['ES2022', 'DOM'],
      types: [],
    },
    include: ['bare.js'],
  }));
  const tsc = path.join(ROOT, 'node_modules/typescript/lib/tsc.js');
  const result = spawnSync(process.execPath, [tsc, '-p', dir, '--pretty', 'false', '--noEmit'], { encoding: 'utf8' });
  const out = (result.stdout || '') + (result.stderr || '');
  assert.notEqual(result.status, 0);
  assert.match(out, /views/);
});
