// The reprint is the proof a cast did not become a different program.
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SCRIPT = path.join(__dirname, '../scripts/public-canon-diff.sh');

function git(cwd, args) {
  return spawnSync('git', ['-c', 'user.email=canon@example.invalid', '-c', 'user.name=canon', ...args], {
    cwd,
    encoding: 'utf8',
  });
}

function writeTree(dir, files) {
  fs.rmSync(path.join(dir, 'public'), { recursive: true, force: true });
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body);
  }
}

function commit(dir, files) {
  writeTree(dir, files);
  const add = git(dir, ['add', '-A']);
  assert.equal(add.status, 0, add.stderr);
  const committed = git(dir, ['commit', '-q', '-m', 'canon']);
  assert.equal(committed.status, 0, committed.stderr);
  const sha = git(dir, ['rev-parse', 'HEAD']);
  assert.equal(sha.status, 0, sha.stderr);
  return sha.stdout.trim();
}

function pair(baseFiles, headFiles) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'canon-'));
  const init = git(dir, ['init', '-q']);
  assert.equal(init.status, 0, init.stderr);
  const base = commit(dir, baseFiles);
  const head = commit(dir, headFiles);
  return { dir, base, head };
}

function run(dir, base, head) {
  return spawnSync('bash', [SCRIPT, base, head], { cwd: dir, encoding: 'utf8' });
}

function sw(version) {
  return `const VERSION = '${version}';\n`;
}

const app = `'use strict';
function g(a, b) { return a; }
const stored = { originalAmount: 1 };
const x = stored && stored.originalAmount;
function S(local) { return local; }
function f() { return function Inner() {}; }
const foo = { bar() { return 1; } };
const clean = S(1);
g(1, 2);
let begin;
begin();
const esc = s => String(s).replace(/[&<>"']/g, c => c);
can = !!(navigator.share && typeof navigator.canShare === 'function');
const made = new (f());
void 0, foo.bar();
function take() {
  return
  (foo).bar();
}
`;

function withVersion(body, version) {
  return { 'public/app.js': body, 'public/sw.js': sw(version) };
}

test('a cast and the v56 literal reprint as the same program', () => {
  const headApp = `'use strict';
function g(a, b) { return a; }
const stored = { originalAmount: 1 };
const x = stored && stored.originalAmount;
function S(local) { return local; }
function f() { return function Inner() {}; }
const foo = { bar() { return 1; } };
const clean = /** @type {number} */ (S(1));
g(1, 2);
/** @type {number} */
let begin;
/** @type {() => void} */ (/** @type {unknown} */ (begin))();
const esc = s => String(s).replace(/[&<>"']/g, c => /** @type {string} */ (c));
can = !!(/** @type {Function | undefined} */ (navigator.share) && typeof navigator.canShare === 'function');
const made = new (f());
void 0, foo.bar();
function take() {
  return
  (foo).bar();
}
`;
  const { dir, base, head } = pair(withVersion(app, 'aj-p0-v55'), withVersion(headApp, 'aj-p0-v56'));
  const result = run(dir, base, head);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), 'public-canon-diff: ok');
});

function expectDiff(headApp) {
  const { dir, base, head } = pair(withVersion(app, 'aj-p0-v55'), withVersion(headApp, 'aj-p0-v56'));
  const result = run(dir, base, head);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /public\/app\.js/);
}

test('a comma inside the call is a different program', () => {
  expectDiff(app.replace('g(1, 2);', 'g((1, 2));'));
});

test('precedence around && is a different program', () => {
  expectDiff(app.replace('stored && stored.originalAmount', '(stored && stored).originalAmount'));
});

test('automatic semicolon insertion is a different program', () => {
  expectDiff(app.replace('return\n  (foo).bar();', 'return (foo).bar();'));
});

test('new (f()) is a different program from new f()', () => {
  expectDiff(app.replace('new (f())', 'new f()'));
});

test('void parentheses change which expression is voided', () => {
  expectDiff(app.replace('void 0, foo.bar();', 'void (0, foo.bar());'));
});

test('if (!clean) return is a different program', () => {
  expectDiff(app.replace('const clean = S(1);\n', 'const clean = S(1);\nif (!clean) return;\n'));
});

test('typeof navigator.share is a different program', () => {
  expectDiff(app.replace(
    'navigator.share && typeof navigator.canShare',
    "typeof navigator.share === 'function' && typeof navigator.canShare",
  ));
});

test('a non-js file under public fails', () => {
  const baseFiles = withVersion(app, 'aj-p0-v55');
  baseFiles['public/index.html'] = '<p>base</p>\n';
  const headFiles = withVersion(app, 'aj-p0-v56');
  headFiles['public/index.html'] = '<p>head</p>\n';
  const { dir, base, head } = pair(baseFiles, headFiles);
  const result = run(dir, base, head);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /public\/index\.html/);
});

test('an added public file fails', () => {
  const headFiles = withVersion(app, 'aj-p0-v56');
  headFiles['public/extra.js'] = "'use strict';\n";
  const { dir, base, head } = pair(withVersion(app, 'aj-p0-v55'), headFiles);
  const result = run(dir, base, head);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /public\/extra\.js/);
});
