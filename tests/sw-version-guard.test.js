const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SCRIPT = path.join(__dirname, '../scripts/sw-version-guard.sh');

function git(cwd, args) {
  execFileSync('git', args, { cwd, stdio: 'pipe' });
}

function repo() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-sw-'));
  git(cwd, ['init', '-q']);
  git(cwd, ['config', 'user.email', 'guard@example.invalid']);
  git(cwd, ['config', 'user.name', 'guard']);
  fs.mkdirSync(path.join(cwd, 'public'));
  fs.writeFileSync(path.join(cwd, 'public/sw.js'), "const VERSION = 'aj-p0-v1';\n");
  fs.writeFileSync(path.join(cwd, 'public/app.js'), 'const app = 1;\n');
  git(cwd, ['add', 'public']);
  git(cwd, ['commit', '-q', '-m', 'base']);
  return cwd;
}

function run(cwd) {
  return execFileSync('bash', [SCRIPT, 'HEAD^'], { cwd, encoding: 'utf8' });
}

test('a public change without a service worker version bump fails the guard', () => {
  const cwd = repo();
  fs.writeFileSync(path.join(cwd, 'public/app.js'), 'const app = 2;\n');
  git(cwd, ['add', 'public/app.js']);
  git(cwd, ['commit', '-q', '-m', 'edit app']);
  let failed = false;
  try {
    run(cwd);
  } catch (err) {
    failed = true;
    assert.equal(err.status, 1);
    assert.match(String(err.stderr || ''), /VERSION is still aj-p0-v1/);
  }
  assert.equal(failed, true);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('a public change that bumps the service worker version passes', () => {
  const cwd = repo();
  fs.writeFileSync(path.join(cwd, 'public/app.js'), 'const app = 2;\n');
  fs.writeFileSync(path.join(cwd, 'public/sw.js'), "const VERSION = 'aj-p0-v2';\n");
  git(cwd, ['add', 'public']);
  git(cwd, ['commit', '-q', '-m', 'edit app and version']);
  const out = run(cwd);
  assert.match(out, /aj-p0-v1 -> aj-p0-v2/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('a change outside public/ does not need a service worker bump', () => {
  const cwd = repo();
  fs.writeFileSync(path.join(cwd, 'README.md'), 'note\n');
  git(cwd, ['add', 'README.md']);
  git(cwd, ['commit', '-q', '-m', 'readme']);
  const out = run(cwd);
  assert.match(out, /public\/ unchanged/);
  fs.rmSync(cwd, { recursive: true, force: true });
});
