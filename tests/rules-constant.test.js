const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Ledger = require('../public/ledger.js');
const Sync = require('../public/sync.js');

test('firestore.rules names the IQD amount ceiling and the id alphabet', () => {
  const src = fs.readFileSync(path.join(__dirname, '../firestore.rules'), 'utf8');
  assert.match(src, /function MAX_AMOUNT_IQD\(\) \{\s*return 10000000000;\s*\}/);
  assert.match(src, /function idOk\(id\) \{ return id is string && id\.matches\('\^\[A-Za-z0-9_-\]\{1,64\}\$'\)/);
  assert.match(src, /allowlisted\(\)/);
  assert.match(src, /status == 'active'/);
});

test('the rules ceiling equals the one JS amount constant', () => {
  const rules = fs.readFileSync(path.join(__dirname, '../firestore.rules'), 'utf8');
  const named = rules.match(/function MAX_AMOUNT_IQD\(\) \{\s*return (\d+);\s*\}/);
  assert.ok(named, 'rules expose MAX_AMOUNT_IQD');
  assert.equal(Number(named[1]), Ledger.MAX_AMOUNT_IQD);
  const syncSrc = fs.readFileSync(path.join(__dirname, '../public/sync.js'), 'utf8');
  assert.equal(syncSrc.includes(String(Ledger.MAX_AMOUNT_IQD)), false);
  assert.equal(Sync.contractAmountOf({ contractAmount: Ledger.MAX_AMOUNT_IQD }), Ledger.MAX_AMOUNT_IQD);
  assert.equal(Sync.contractAmountOf({ contractAmount: Ledger.MAX_AMOUNT_IQD + 1 }), null);
  const terms = Sync.termsPayload(Ledger.MAX_AMOUNT_IQD);
  assert.equal(terms && terms.originalAmount, Ledger.MAX_AMOUNT_IQD);
  assert.equal(Sync.termsPayload(Ledger.MAX_AMOUNT_IQD + 1), null);
  const split = Sync.splitProjectSave({ id: 'p', name: 'n', currency: 'IQD' }, Ledger.MAX_AMOUNT_IQD);
  assert.equal(split.finance.contractAmount, Ledger.MAX_AMOUNT_IQD);
  assert.equal(Sync.splitProjectSave({ id: 'p' }, Ledger.MAX_AMOUNT_IQD + 1).finance, null);
});
