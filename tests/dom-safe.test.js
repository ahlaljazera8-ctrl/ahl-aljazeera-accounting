const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Dom = require('../public/dom-safe.js');

const HOSTILE = '"><img src=x onerror=alert(1)>';

test('a hostile project id is omitted from attributes', () => {
  assert.equal(Dom.projectButton(HOSTILE, 'اسم', false), '');
  assert.equal(Dom.projectAttr(HOSTILE), '');
  assert.equal(Dom.projectHref('project', HOSTILE), '#projects');
  assert.equal(Dom.projectHref('entry', 'a/b'), '#projects');
  assert.equal(Dom.projectHref('project', 'bad id'), '#projects');
  const html = Dom.projectButton(HOSTILE, 'اسم', true) + Dom.projectHref('project', HOSTILE);
  assert.equal(html.includes('onerror'), false);
  assert.equal(html.includes('<img'), false);
  assert.equal(html.includes(HOSTILE), false);
});

test('entry detail href keeps a safe id and drops a hostile one', () => {
  assert.equal(Dom.entryHref('seed-4'), '#detail/seed-4');
  assert.equal(Dom.entryHref('rev_seed-4'), '#detail/rev_seed-4');
  assert.equal(Dom.entryHref(HOSTILE), '#home');
  assert.equal(Dom.entryHref('bad id'), '#home');
  assert.equal(Dom.entryHref('a'.repeat(65)), '#home');
  assert.equal(Dom.entryHref(HOSTILE).includes('onerror'), false);
});
test('a safe project id stays in the attribute and the name is escaped', () => {
  const html = Dom.projectButton('p-school', 'مدرسة <script>', true);
  assert.match(html, /data-proj="p-school"/);
  assert.match(html, /class="pill on"/);
  assert.match(html, /مدرسة &lt;script&gt;/);
  assert.equal(html.includes('<script>'), false);
  assert.equal(Dom.projectHref('project', 'p-school'), '#project/p-school');
  assert.equal(Dom.projectHref('entry', 'p_road'), '#entry/p_road');
  assert.equal(Dom.isSafeId('a'.repeat(64)), true);
  assert.equal(Dom.isSafeId('a'.repeat(65)), false);
});

test('app.js puts project ids through DomSafe, not raw into attributes', () => {
  const app = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
  assert.match(app, /DomSafe\.projectButton/);
  assert.match(app, /DomSafe\.projectHref\('project'/);
  assert.match(app, /DomSafe\.projectHref\('entry'/);
  assert.equal(app.includes('data-proj="${p.id}"'), false);
  assert.equal(app.includes('href="#project/${p.id}"'), false);
  assert.equal(app.includes('href="#entry/${p.id}"'), false);
});
