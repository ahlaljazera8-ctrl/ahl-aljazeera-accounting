const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('firestore.rules names the IQD amount ceiling and the id alphabet', () => {
  const src = fs.readFileSync(path.join(__dirname, '../firestore.rules'), 'utf8');
  assert.match(src, /function MAX_AMOUNT_IQD\(\) \{\s*return 10000000000;\s*\}/);
  assert.match(src, /function idOk\(id\) \{ return id is string && id\.matches\('\^\[A-Za-z0-9_-\]\{1,64\}\$'\)/);
  assert.match(src, /allowlisted\(\)/);
  assert.match(src, /status == 'active'/);
});
