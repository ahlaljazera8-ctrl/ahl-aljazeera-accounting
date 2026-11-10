const test = require('node:test');
const assert = require('node:assert/strict');
const Accounts = require('../public/accounts.js');

const bricks = { method: 'unit', unitRate: 300000, unitQty: 4000, unitName: 'طابوقة' };

test('spec 1: 300000 per 4000 bricks is 75, and 8000 approved is 600000', () => {
  assert.deepEqual(Accounts.unitPrice(bricks), { amount: 75, errors: [] });
  const pos = Accounts.workPosition(bricks, { approvedQty: 8000 });
  assert.equal(pos.earned, 600000);
  assert.deepEqual(pos.errors, []);
});

test('spec 2: delivered bricks are not treated as completed work', () => {
  const pos = Accounts.workPosition(bricks, { approvedQty: 8000, deliveredQty: 16000 });
  assert.equal(pos.deliveredQty, 16000);
  assert.equal(pos.approvedQty, 8000);
  assert.equal(pos.notCompleted, 8000);
  assert.notEqual(pos.deliveredQty, pos.approvedQty);
  assert.equal(pos.earned, 600000);
});

test('an inexact unit split is refused', () => {
  const pos = Accounts.workPosition({ method: 'unit', unitRate: 10, unitQty: 4 }, { approvedQty: 1 });
  assert.equal(pos.earned, 0);
  assert.deepEqual(pos.errors, ['inexact']);
});

test('spec 6: a lump is the full amount, and a partial amount is refused', () => {
  const agreement = { method: 'lump', lumpAmount: 2500000 };
  const whole = Accounts.workPosition(agreement, { approved: true });
  assert.equal(whole.earned, 2500000);
  assert.deepEqual(whole.errors, []);
  const partial = Accounts.workPosition(agreement, { approved: true, amount: 100 });
  assert.equal(partial.earned, 0);
  assert.deepEqual(partial.errors, ['lump']);
});

test('spec 7: approved days times the day rate', () => {
  const pos = Accounts.workPosition({ method: 'daily', dayRate: 50000 }, { approvedQty: 3 });
  assert.equal(pos.earned, 150000);
  assert.deepEqual(pos.errors, []);
});

test('a payment records paidAs and does not guess advance versus wages', () => {
  const missing = Accounts.post('payment', { amount: 600000 });
  assert.equal(missing.doc, null);
  assert.deepEqual(missing.errors, ['paidAs']);
  const wages = Accounts.post('payment', { paidAs: 'payLabor', amount: 600000 });
  assert.equal(wages.doc && wages.doc.purpose, 'payLabor');
  assert.equal(wages.doc && wages.doc.effect.cost, 0);
  const advance = Accounts.post('payment', { paidAs: 'advanceLabor', amount: 600000 });
  assert.equal(advance.doc && advance.doc.purpose, 'advanceLabor');
});

test('percent and amount milestones are not in this cut', () => {
  const percent = Accounts.workPosition({ method: 'percent', lumpAmount: 1 }, { approved: true });
  assert.deepEqual(percent.errors, ['method']);
  const milestone = Accounts.workPosition({ method: 'milestone', lumpAmount: 1 }, { approved: true });
  assert.deepEqual(milestone.errors, ['method']);
});

test('the nine purposes are labor, and a cash pointer targets only an effective purpose', () => {
  assert.deepEqual(Object.keys(Accounts.PURPOSES), [
    'laborQty', 'approveLabor', 'advanceLabor', 'payLabor', 'returnAdvance', 'refundLabor', 'deduct', 'approveDeduct', 'settle',
  ]);
  for (const purpose of Object.values(Accounts.PURPOSES)) {
    assert.equal(purpose.ledger, 'labor');
    assert.equal(purpose.statementSign, purpose.effect.person);
  }
  assert.deepEqual(Accounts.cashPointerErrors(Accounts.PURPOSES), []);
  const broken = Object.assign({}, Accounts.PURPOSES, {
    refundLabor: Object.assign({}, Accounts.PURPOSES.refundLabor, { points: { targetId: ['laborQty'] } }),
  });
  assert.deepEqual(Accounts.cashPointerErrors(broken), ['refundLabor targetId laborQty']);
});

test('while the start date is null, approved work does not change project cost', () => {
  assert.equal(Accounts.CONTRACTOR_COST_START, null);
  assert.equal(Accounts.projectCost('p', [{ projectId: 'p', purpose: 'approveLabor', amount: 600000, txnDate: '2026-12-01' }]), 0);
});
