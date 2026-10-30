const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SCRIPT = path.join(__dirname, '../scripts/secret-guard.sh');
const MARKER = ['private', 'key'].join('_');

function git(cwd, args) {
  execFileSync('git', args, { cwd, stdio: 'pipe' });
}

function repo() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-guard-'));
  git(cwd, ['init', '-q']);
  git(cwd, ['config', 'user.email', 'guard@example.invalid']);
  git(cwd, ['config', 'user.name', 'guard']);
  return cwd;
}

function run(cwd) {
  return execFileSync('bash', [SCRIPT], { cwd, encoding: 'utf8' });
}

test('secret-guard passes a repository with no key material', () => {
  const cwd = repo();
  fs.writeFileSync(path.join(cwd, 'note.txt'), 'hello\n');
  git(cwd, ['add', 'note.txt']);
  git(cwd, ['commit', '-q', '-m', 'note']);
  const out = run(cwd);
  assert.match(out, /secret-guard: ok/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('secret-guard fails when a removed commit still holds a private key', () => {
  const cwd = repo();
  fs.writeFileSync(path.join(cwd, 'leak.json'), '{"' + MARKER + '":"not-a-real-key"}\n');
  git(cwd, ['add', 'leak.json']);
  git(cwd, ['commit', '-q', '-m', 'leak']);
  git(cwd, ['rm', '-q', 'leak.json']);
  git(cwd, ['commit', '-q', '-m', 'remove']);
  assert.equal(fs.existsSync(path.join(cwd, 'leak.json')), false);
  let failed = false;
  try { run(cwd); } catch (err) {
    failed = true;
    assert.equal(err.status, 1);
    assert.match(String(err.stdout || ''), new RegExp(MARKER));
  }
  assert.equal(failed, true);
  fs.rmSync(cwd, { recursive: true, force: true });
});
