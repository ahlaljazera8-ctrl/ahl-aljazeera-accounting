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

function compile(dir, file) {
  const tsc = path.join(ROOT, 'node_modules/typescript/lib/tsc.js');
  fs.copyFileSync(path.join(ROOT, 'types/checkjs.d.ts'), path.join(dir, 'checkjs.d.ts'));
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      allowJs: true,
      checkJs: true,
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      target: 'ES2022',
      module: 'node16',
      moduleResolution: 'node16',
      lib: ['ES2022', 'DOM'],
      types: [],
    },
    files: [file, 'checkjs.d.ts'],
  }));
  return spawnSync(process.execPath, [tsc, '-p', dir, '--pretty', 'false', '--noEmit'], { encoding: 'utf8' });
}

test('bare views fails against the foremen types, and RenderApi.views compiles', () => {
  const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-foremen-bare-'));
  fs.writeFileSync(path.join(bareDir, 'bare.js'), 'const leaked = views;\n');
  const bare = compile(bareDir, 'bare.js');
  const bareOut = (bare.stdout || '') + (bare.stderr || '');
  assert.notEqual(bare.status, 0);
  assert.match(bareOut, /Cannot find name 'views'/);

  const apiDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-foremen-api-'));
  fs.writeFileSync(path.join(apiDir, 'via-api.js'), 'function take(/** @type {RenderApi} */ api) { return api.views; }\ntake;\n');
  const via = compile(apiDir, 'via-api.js');
  const viaOut = (via.stdout || '') + (via.stderr || '');
  assert.equal(via.status, 0, viaOut);

  const src = fs.readFileSync(path.join(ROOT, 'public/foremen.js'), 'utf8');
  assert.equal(/(^|[^.\w])views\b/.test(src), false);
});
