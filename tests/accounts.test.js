const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const Accounts = require('../public/accounts.js');

const bricks = { method: 'unit', unitRate: 300000, unitQty: 4000, unitName: 'طابوقة' };

function posted(result) {
  assert.deepEqual(result.errors, []);
  assert.equal(result.doc == null, false);
  if (!result.doc) throw new Error('missing doc');
  return result.doc;
}

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
  const missing = Accounts.post('payment', { id: 'pay-missing', amount: 600000 });
  assert.equal(missing.doc, null);
  assert.deepEqual(missing.errors, ['paidAs']);
  const wages = Accounts.post('payment', { id: 'pay-wages', paidAs: 'payLabor', amount: 600000 });
  assert.equal(wages.doc && wages.doc.purpose, 'payLabor');
  assert.equal(wages.doc && wages.doc.effect.cost, 0);
  const advance = Accounts.post('payment', { id: 'pay-advance', paidAs: 'advanceLabor', amount: 600000 });
  assert.equal(advance.doc && advance.doc.purpose, 'advanceLabor');
});

test('a method outside lump, unit, daily, and milestone is refused', () => {
  const percent = Accounts.workPosition({ method: 'percent', lumpAmount: 1 }, { approved: true });
  assert.deepEqual(percent.errors, ['method']);
});

test('an amount milestone earns its amount, and percent stays refused', () => {
  /** @type {{ method: string, milestoneMode: 'amount', milestoneAmount: number }} */
  const amount = { method: 'milestone', milestoneMode: 'amount', milestoneAmount: 250000 };
  const whole = Accounts.workPosition(amount, { approved: true });
  assert.equal(whole.earned, 250000);
  assert.deepEqual(whole.errors, []);
  const partial = Accounts.workPosition(amount, { approved: true, amount: 100 });
  assert.equal(partial.earned, 0);
  assert.deepEqual(partial.errors, ['milestone']);
  const percent = Accounts.workPosition(
    { method: 'milestone', milestoneMode: 'percent', milestoneAmount: 250000 },
    { approved: true },
  );
  assert.equal(percent.earned, 0);
  assert.deepEqual(percent.errors, ['percent']);
  const missingMode = Accounts.workPosition({ method: 'milestone', milestoneAmount: 250000 }, { approved: true });
  assert.equal(missingMode.earned, 0);
  assert.deepEqual(missingMode.errors, ['milestone']);
  const otherMode = Accounts.workPosition(
    { method: 'milestone', milestoneMode: 'foo', milestoneAmount: 250000 },
    { approved: true },
  );
  assert.equal(otherMode.earned, 0);
  assert.deepEqual(otherMode.errors, ['milestone']);
  const mixed = Accounts.workPosition(
    { method: 'milestone', milestoneMode: 'amount', milestoneAmount: 250000, lumpAmount: 1 },
    { approved: true },
  );
  assert.deepEqual(mixed.errors, ['method']);
  const modeOnly = Accounts.workPosition(
    { method: 'lump', lumpAmount: 1, milestoneMode: 'amount' },
    { approved: true },
  );
  assert.deepEqual(modeOnly.errors, ['method']);
  const zero = Accounts.workPosition(
    { method: 'milestone', milestoneMode: 'amount', milestoneAmount: 0 },
    { approved: true },
  );
  assert.equal(zero.earned, 0);
  assert.deepEqual(zero.errors, ['range']);
  const above = Accounts.workPosition(
    { method: 'milestone', milestoneMode: 'amount', milestoneAmount: 10000000001 },
    { approved: true },
  );
  assert.equal(above.earned, 0);
  assert.deepEqual(above.errors, ['range']);
  const old = Accounts.workPosition({ method: 'milestone', lumpAmount: 1 }, { approved: true });
  assert.deepEqual(old.errors, ['milestone']);
});

test('every built milestone payload has milestoneMode', () => {
  const bare = { method: 'milestone', milestoneAmount: 250000 };
  const missing = Accounts.post('laborQty', { id: 'ms-qty', agreement: bare });
  assert.equal(missing.doc, null);
  assert.deepEqual(missing.errors, ['milestone']);
  assert.equal(Object.prototype.hasOwnProperty.call(bare, 'milestoneMode'), false);
  /** @type {{ method: string, milestoneMode: 'amount', milestoneAmount: number }} */
  const named = { method: 'milestone', milestoneMode: 'amount', milestoneAmount: 250000 };
  const qty = posted(Accounts.post('laborQty', { id: 'ms-named', agreement: named }));
  const approved = posted(Accounts.post('approveLabor', {
    id: 'ms-appr',
    targetId: qty.id,
    target: qty,
    agreement: named,
  }));
  for (const doc of [qty, approved]) {
    assert.equal(doc.agreement && doc.agreement.milestoneMode, 'amount');
  }
  assert.equal(approved.amount, 250000);
  const percent = Accounts.post('approveLabor', {
    id: 'ms-pct',
    targetId: qty.id,
    target: qty,
    agreement: { method: 'milestone', milestoneMode: 'percent', milestoneAmount: 250000 },
  });
  assert.equal(percent.doc, null);
  assert.deepEqual(percent.errors, ['percent']);
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
  const atApproval = Object.assign({}, Accounts.PURPOSES, {
    payLabor: Object.assign({}, Accounts.PURPOSES.payLabor, { points: { targetId: ['approveLabor'] } }),
  });
  assert.notDeepEqual(Accounts.cashPointerErrors(atApproval), []);
  const atDeductApproval = Object.assign({}, Accounts.PURPOSES, {
    payLabor: Object.assign({}, Accounts.PURPOSES.payLabor, { points: { targetId: ['approveDeduct'] } }),
  });
  assert.notDeepEqual(Accounts.cashPointerErrors(atDeductApproval), []);
});

test('while the start date is null, approved work does not change project cost', () => {
  assert.equal(Accounts.CONTRACTOR_COST_START, null);
  assert.equal(
    Accounts.projectCost(
      'p',
      0,
      [{ id: 'appr', projectId: 'p', purpose: 'approveLabor', amount: 600000, txnDate: '2026-12-01' }],
      null,
      null,
    ),
    0,
  );
});

function measure(id) {
  return posted(Accounts.post('laborQty', { id, agreement: bricks, approvedQty: 8000 }));
}

function approvalOf(id, measurement) {
  return posted(Accounts.post('approveLabor', {
    id,
    targetId: measurement.id,
    target: measurement,
    agreement: bricks,
    approvedQty: 8000,
  }));
}

test('payLabor 600000 after approveLabor 600000 leaves the person at 0 and project cost at 0', () => {
  const measurement = measure('m-brick');
  const approval = approvalOf('a-brick', measurement);
  assert.equal(approval.amount, 600000);
  assert.equal(approval.purpose, 'approveLabor');
  const payment = posted(Accounts.post('payment', { id: 'pay-brick', paidAs: 'payLabor', amount: 600000 }));
  assert.equal(payment.purpose, 'payLabor');
  assert.equal(Accounts.personBalance([approval, payment]), 0);
  assert.equal(Accounts.projectCost('p-brick', 0, [approval, payment], null, null), 0);
});

test('payLabor 700000 after that approval is a negative balance and stays payLabor', () => {
  const approval = approvalOf('a-over', measure('m-over'));
  const payment = posted(Accounts.post('payment', { id: 'pay-over', paidAs: 'payLabor', amount: 700000 }));
  const docs = [approval, payment];
  assert.equal(Accounts.personBalance(docs), -100000);
  assert.equal(payment.purpose, 'payLabor');
  assert.equal(docs.some((doc) => doc.purpose === 'advanceLabor'), false);
});

test('returnAdvance gives the cash back up to the named advance', () => {
  const advance = posted(Accounts.post('payment', { id: 'adv-1', paidAs: 'advanceLabor', amount: 100000 }));
  const returned = posted(Accounts.post('returnAdvance', {
    id: 'ret-1', targetId: 'adv-1', target: advance, amount: 30000,
  }));
  assert.equal(returned.effect.person, 1);
  assert.equal(returned.effect.cash, -1);
  assert.equal(returned.effect.cost, 0);
  const over = Accounts.post('returnAdvance', { id: 'ret-2', targetId: 'adv-1', target: advance, amount: 100001 });
  assert.equal(over.doc, null);
  assert.deepEqual(over.errors, ['cap']);
});

test('refundLabor undoes person and not cost, and cannot pass the named payment', () => {
  const payment = posted(Accounts.post('payment', { id: 'pay-rf', paidAs: 'payLabor', amount: 600000 }));
  const refund = posted(Accounts.post('refundLabor', {
    id: 'rf-1', targetId: 'pay-rf', target: payment, amount: 50000,
  }));
  assert.equal(refund.effect.person, 1);
  assert.equal(refund.effect.cost, 0);
  assert.equal(refund.effect.cash, -1);
  const over = Accounts.post('refundLabor', { id: 'rf-2', targetId: 'pay-rf', target: payment, amount: 600001 });
  assert.equal(over.doc, null);
  assert.deepEqual(over.errors, ['cap']);
});

test('a deduct changes the person balance only after approveDeduct, and that approval stores no amount', () => {
  const approval = approvalOf('a-ded', measure('m-ded'));
  const deduct = posted(Accounts.post('deduct', {
    id: 'ded-1', targetId: approval.id, target: approval, amount: 50000,
  }));
  assert.equal(Accounts.personBalance([approval, deduct]), 600000);
  const approved = posted(Accounts.post('approveDeduct', {
    id: 'ad-1', targetId: 'ded-1', target: deduct, siblings: [approval],
  }));
  assert.equal(Object.prototype.hasOwnProperty.call(approved, 'amount'), false);
  assert.equal(approved.purpose, 'approveDeduct');
  assert.equal(Accounts.personBalance([approval, deduct, approved]), 550000);
  assert.equal(Accounts.projectCost('p-ded', 0, [approval, deduct, approved], null, null), 0);
});

function kApproval(fields) {
  return doc(Object.assign({
    id: 'appr',
    purpose: 'approveLabor',
    amount: 600000,
    projectId: 'p',
    txnDate: '2026-12-01',
  }, fields));
}

test('k equality: legacySpent 100000 and approveLabor 600000 with start null is 100000', () => {
  assert.equal(Accounts.CONTRACTOR_COST_START, null);
  assert.equal(Accounts.projectCost('p', 100000, [kApproval()], null, Accounts.CONTRACTOR_COST_START), 100000);
});

test('k equality: the same rows with start on or before the approval date is 700000', () => {
  const rows = [
    kApproval(),
    doc({ id: 'pay', purpose: 'payLabor', amount: 600000, projectId: 'p', txnDate: '2026-12-01' }),
  ];
  assert.equal(Accounts.projectCost('p', 100000, rows, null, '2026-12-01'), 700000);
});

test('k equality: a deduct of 50000 does not change 100000 or 700000', () => {
  const rows = [
    kApproval(),
    doc({ id: 'ded', purpose: 'deduct', amount: 50000, targetId: 'appr', projectId: 'p', txnDate: '2026-12-01' }),
    doc({ id: 'ad', purpose: 'approveDeduct', targetId: 'ded' }),
  ];
  assert.equal(Accounts.projectCost('p', 100000, rows, null, null), 100000);
  assert.equal(Accounts.projectCost('p', 100000, rows, null, '2026-12-01'), 700000);
});

test('k equality: a materials row of 50000 inside legacySpent is 150000 when start is null and 750000 when start is set', () => {
  assert.equal(Accounts.projectCost('p', 150000, [kApproval()], null, null), 150000);
  assert.equal(Accounts.projectCost('p', 150000, [kApproval()], null, '2026-12-01'), 750000);
});

test('k equality: approval id in syncErrors stays 100000', () => {
  assert.equal(Accounts.projectCost('p', 100000, [kApproval()], { appr: 'رُفض الإرسال' }, '2026-12-01'), 100000);
});

test('k equality: a live reversal of the approval stays 100000', () => {
  const rows = [kApproval(), doc({ id: 'rev_appr', kind: 'rev', reversesId: 'appr' })];
  assert.equal(Accounts.projectCost('p', 100000, rows, null, '2026-12-01'), 100000);
});

test('k equality: one approval id counted once is 700000', () => {
  assert.equal(Accounts.projectCost('p', 100000, [kApproval(), kApproval()], null, '2026-12-01'), 700000);
});

test('k equality: txnDate before the start stays 100000', () => {
  assert.equal(Accounts.projectCost('p', 100000, [kApproval({ txnDate: '2026-11-30' })], null, '2026-12-01'), 100000);
});

test('k equality: a non-date start stays 100000', () => {
  assert.equal(Accounts.projectCost('p', 100000, [kApproval()], null, 'soon'), 100000);
});

test('k equality: an approval on another project stays 100000', () => {
  assert.equal(Accounts.projectCost('p', 100000, [kApproval({ projectId: 'q' })], null, '2026-12-01'), 100000);
});

test('k equality: a rejected approval (rej_) stays 100000', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty', projectId: 'p', txnDate: '2026-12-01' }),
    kApproval({ targetId: 'm' }),
    doc({ id: 'rej_m', kind: 'rej', targetId: 'm' }),
  ];
  assert.equal(Accounts.projectCost('p', 100000, rows, null, '2026-12-01'), 100000);
});

test('k equality: an approval reversed after a deduct stays 100000', () => {
  const rows = [
    kApproval(),
    doc({ id: 'ded', purpose: 'deduct', amount: 50000, targetId: 'appr', projectId: 'p', txnDate: '2026-12-01' }),
    doc({ id: 'ad', purpose: 'approveDeduct', targetId: 'ded' }),
    doc({ id: 'rev_appr', kind: 'rev', reversesId: 'appr' }),
  ];
  assert.equal(Accounts.projectCost('p', 100000, rows, null, null), 100000);
  assert.equal(Accounts.projectCost('p', 100000, rows, null, '2026-12-01'), 100000);
});

test('settle has a zero effect and cannot pass the named advance', () => {
  const advance = posted(Accounts.post('payment', { id: 'adv-s', paidAs: 'advanceLabor', amount: 100000 }));
  const before = Accounts.personBalance([advance]);
  const settled = posted(Accounts.post('settle', {
    id: 'stl-1', settlesId: 'adv-s', target: advance, amount: 40000,
  }));
  assert.equal(settled.effect.cost, 0);
  assert.equal(settled.effect.person, 0);
  assert.equal(settled.effect.cash, 0);
  assert.equal(Accounts.personBalance([advance, settled]), before);
  const over = Accounts.post('settle', { id: 'stl-2', settlesId: 'adv-s', target: advance, amount: 100001 });
  assert.equal(over.doc, null);
  assert.deepEqual(over.errors, ['cap']);
});

test('caps refuse a quantity, a product, an amount, or a payment outside the bounds', () => {
  assert.deepEqual(
    Accounts.workPosition({ method: 'unit', unitRate: 1, unitQty: 1000001 }, { approvedQty: 1 }).errors,
    ['range'],
  );
  assert.deepEqual(Accounts.workPosition(bricks, { approvedQty: 100000001 }).errors, ['range']);
  const atProduct = Accounts.workPosition(
    { method: 'unit', unitRate: 100000000, unitQty: 1000000 },
    { approvedQty: 100000000 },
  );
  assert.equal(atProduct.earned, 10000000000);
  assert.deepEqual(atProduct.errors, []);
  assert.deepEqual(
    Accounts.workPosition({ method: 'unit', unitRate: 100000000, unitQty: 1 }, { approvedQty: 100000000 }).errors,
    ['amount'],
  );
  assert.deepEqual(
    Accounts.workPosition({ method: 'unit', unitRate: 100000001, unitQty: 1 }, { approvedQty: 100000000 }).errors,
    ['range'],
  );
  assert.deepEqual(
    Accounts.workPosition({ method: 'unit', unitRate: 10, unitQty: 4 }, { approvedQty: -1 }).errors,
    ['range'],
  );
  assert.deepEqual(
    Accounts.workPosition({ method: 'unit', unitRate: 10, unitQty: 4 }, { approvedQty: 1.5 }).errors,
    ['range'],
  );
  const measurement = measure('m-zero');
  const earned0 = Accounts.post('approveLabor', {
    id: 'a-zero',
    targetId: measurement.id,
    target: measurement,
    agreement: { method: 'unit', unitRate: 300000, unitQty: 4000 },
    approvedQty: 0,
  });
  assert.equal(earned0.doc, null);
  assert.deepEqual(earned0.errors, ['earned']);
  assert.deepEqual(Accounts.post('payment', { id: 'pay-0', paidAs: 'payLabor', amount: 0 }).errors, ['range']);
  assert.deepEqual(Accounts.post('payment', { id: 'pay-neg', paidAs: 'payLabor', amount: -5 }).errors, ['range']);
  assert.deepEqual(Accounts.post('payment', { id: 'pay-frac', paidAs: 'payLabor', amount: 1.5 }).errors, ['range']);
  assert.deepEqual(Accounts.post('payment', { id: 'pay-big', paidAs: 'payLabor', amount: 10000000001 }).errors, ['range']);
  const top = posted(Accounts.post('payment', { id: 'pay-top', paidAs: 'payLabor', amount: 10000000000 }));
  assert.equal(top.amount, 10000000000);
});

test('a missing or wrong-purpose target is targetId, or settlesId for settle', () => {
  const payment = posted(Accounts.post('payment', { id: 'pay-t', paidAs: 'payLabor', amount: 600000 }));
  const advance = posted(Accounts.post('payment', { id: 'adv-t', paidAs: 'advanceLabor', amount: 100000 }));
  assert.deepEqual(
    Accounts.post('refundLabor', { id: 'rf-miss', targetId: 'missing', amount: 1 }).errors,
    ['targetId'],
  );
  assert.deepEqual(
    Accounts.post('refundLabor', { id: 'rf-wrong', targetId: advance.id, target: advance, amount: 1 }).errors,
    ['targetId'],
  );
  assert.deepEqual(Accounts.post('settle', { id: 'stl-miss', settlesId: 'missing', amount: 1 }).errors, ['settlesId']);
  assert.deepEqual(
    Accounts.post('settle', { id: 'stl-wrong', settlesId: payment.id, target: payment, amount: 1 }).errors,
    ['settlesId'],
  );
  assert.deepEqual(
    Accounts.post('approveLabor', { id: 'a-miss', agreement: bricks, approvedQty: 8000 }).errors,
    ['targetId'],
  );
  const both = Accounts.post('refundLabor', {
    id: 'rf-both',
    targetId: payment.id,
    amount: 1,
    ledger: [payment],
    target: payment,
  });
  assert.equal(both.doc, null);
  assert.deepEqual(both.errors, ['ledger']);
  const other = posted(Accounts.post('payment', { id: 'pay-other', paidAs: 'payLabor', amount: 600000 }));
  const otherRefund = posted(Accounts.post('refundLabor', {
    id: 'rf-other', targetId: other.id, target: other, amount: 400000,
  }));
  const same = posted(Accounts.post('refundLabor', {
    id: 'rf-same',
    targetId: payment.id,
    target: payment,
    amount: 400000,
    siblings: [otherRefund],
  }));
  assert.equal(same.purpose, 'refundLabor');
  assert.equal(same.amount, 400000);
});

test('a second live refund, deduct, or advance draw that passes the line is cumulative', () => {
  const payment = posted(Accounts.post('payment', { id: 'pay-c', paidAs: 'payLabor', amount: 600000 }));
  const first = posted(Accounts.post('refundLabor', {
    id: 'rf-c1', targetId: payment.id, target: payment, amount: 400000,
  }));
  const second = Accounts.post('refundLabor', {
    id: 'rf-c2', targetId: payment.id, target: payment, amount: 400000, siblings: [first],
  });
  assert.equal(second.doc, null);
  assert.deepEqual(second.errors, ['cumulative']);
  const exact = posted(Accounts.post('refundLabor', {
    id: 'rf-c3', targetId: payment.id, target: payment, amount: 200000, siblings: [first],
  }));
  assert.equal(exact.amount, 200000);
  const viaLedger = Accounts.post('refundLabor', {
    id: 'rf-c4', targetId: payment.id, amount: 400000, ledger: [payment, first],
  });
  assert.deepEqual(viaLedger.errors, ['cumulative']);

  const approval = approvalOf('a-c', measure('m-c'));
  const deduct1 = posted(Accounts.post('deduct', {
    id: 'ded-c1', targetId: approval.id, target: approval, amount: 400000,
  }));
  const deduct2 = Accounts.post('deduct', {
    id: 'ded-c2', targetId: approval.id, target: approval, amount: 400000, siblings: [deduct1],
  });
  assert.deepEqual(deduct2.errors, ['cumulative']);

  const advance = posted(Accounts.post('payment', { id: 'adv-c', paidAs: 'advanceLabor', amount: 100000 }));
  const returned = posted(Accounts.post('returnAdvance', {
    id: 'ret-c', targetId: advance.id, target: advance, amount: 60000,
  }));
  const settled = Accounts.post('settle', {
    id: 'stl-c', settlesId: advance.id, target: advance, amount: 50000, siblings: [returned],
  });
  assert.deepEqual(settled.errors, ['cumulative']);

  /** @type {{ id: string, purpose: string, ledger: 'labor', amount: number, targetId: string, effect: { cost: number, person: number, cash: number } }} */
  const rejected = {
    id: 'ded-rej',
    purpose: 'deduct',
    ledger: 'labor',
    amount: 400000,
    targetId: approval.id,
    effect: { cost: -1, person: -1, cash: 0 },
  };
  /** @type {{ id: string, purpose: string, ledger: 'labor', effect: { cost: number, person: number, cash: number } }} */
  const rejection = { id: 'rej_ded-rej', purpose: 'reject', ledger: 'labor', effect: { cost: 0, person: 0, cash: 0 } };
  const afterReject = posted(Accounts.post('deduct', {
    id: 'ded-c3',
    targetId: approval.id,
    target: approval,
    amount: 400000,
    siblings: [rejected, rejection],
  }));
  assert.equal(afterReject.amount, 400000);
  const pendingBlocks = Accounts.post('deduct', {
    id: 'ded-c4',
    targetId: approval.id,
    target: approval,
    amount: 400000,
    siblings: [afterReject],
  });
  assert.deepEqual(pendingBlocks.errors, ['cumulative']);

  const approvedDeduct = posted(Accounts.post('approveDeduct', {
    id: 'ad-c1', targetId: deduct1.id, target: deduct1, siblings: [approval],
  }));
  const otherDeduct = posted(Accounts.post('deduct', {
    id: 'ded-c5', targetId: approval.id, target: approval, amount: 400000,
  }));
  const overApprove = Accounts.post('approveDeduct', {
    id: 'ad-c2',
    targetId: otherDeduct.id,
    target: otherDeduct,
    siblings: [approval, deduct1, approvedDeduct],
  });
  assert.equal(overApprove.doc, null);
  assert.deepEqual(overApprove.errors, ['cumulative']);
  const exactDeduct = posted(Accounts.post('deduct', {
    id: 'ded-exact', targetId: approval.id, target: approval, amount: 200000,
  }));
  const exactApprove = posted(Accounts.post('approveDeduct', {
    id: 'ad-exact',
    targetId: exactDeduct.id,
    target: exactDeduct,
    siblings: [approval, deduct1, approvedDeduct],
  }));
  assert.equal(exactApprove.purpose, 'approveDeduct');

  const reversedOk = posted(Accounts.post('refundLabor', {
    id: 'rf-c5',
    targetId: payment.id,
    target: payment,
    amount: 600000,
    siblings: [first],
    reversedIds: new Set([first.id]),
  }));
  assert.equal(reversedOk.amount, 600000);
});

function marker(id) {
  return { id, purpose: 'mark', ledger: /** @type {'labor'} */ ('labor'), effect: { cost: 0, person: 0, cash: 0 } };
}

test('a rejected or reversed target is refused, and a rejected deduct does not lower the balance', () => {
  const measurement = measure('m-live');
  const approval = approvalOf('a-live', measurement);
  const payment = posted(Accounts.post('payment', { id: 'pay-live', paidAs: 'payLabor', amount: 600000 }));
  const advance = posted(Accounts.post('payment', { id: 'adv-live', paidAs: 'advanceLabor', amount: 100000 }));
  const deduct = posted(Accounts.post('deduct', {
    id: 'ded-live', targetId: approval.id, target: approval, amount: 50000,
  }));
  assert.deepEqual(Accounts.post('refundLabor', {
    id: 'rf-dead', targetId: payment.id, amount: 1, ledger: [payment, marker('rev_' + payment.id)],
  }).errors, ['targetId']);
  assert.deepEqual(Accounts.post('deduct', {
    id: 'ded-dead', targetId: approval.id, amount: 1, ledger: [approval, marker('rev_' + approval.id)],
  }).errors, ['targetId']);
  assert.deepEqual(Accounts.post('approveLabor', {
    id: 'ap-dead',
    targetId: measurement.id,
    agreement: bricks,
    approvedQty: 8000,
    ledger: [measurement, marker('rev_' + measurement.id)],
  }).errors, ['targetId']);
  assert.deepEqual(Accounts.post('approveDeduct', {
    id: 'ad-rej', targetId: deduct.id, ledger: [approval, deduct, marker('rej_' + deduct.id)],
  }).errors, ['targetId']);
  assert.deepEqual(Accounts.post('approveDeduct', {
    id: 'ad-rev', targetId: deduct.id, ledger: [approval, deduct, marker('rev_' + deduct.id)],
  }).errors, ['targetId']);
  assert.deepEqual(Accounts.post('returnAdvance', {
    id: 'ret-dead', targetId: advance.id, amount: 1, ledger: [advance, marker('rev_' + advance.id)],
  }).errors, ['targetId']);
  assert.deepEqual(Accounts.post('settle', {
    id: 'stl-dead', settlesId: advance.id, amount: 1, ledger: [advance, marker('rev_' + advance.id)],
  }).errors, ['settlesId']);
  const hand = {
    id: 'ad-hand',
    purpose: 'approveDeduct',
    ledger: /** @type {'labor'} */ ('labor'),
    targetId: deduct.id,
    effect: { cost: 0, person: 0, cash: 0 },
  };
  assert.equal(Accounts.personBalance([approval, deduct, marker('rej_' + deduct.id), hand]), 600000);
});

test('settle and return share one cap, and a settle doc names settlesId', () => {
  const advance = posted(Accounts.post('payment', { id: 'adv-order', paidAs: 'advanceLabor', amount: 100000 }));
  const settled = posted(Accounts.post('settle', {
    id: 'stl-first', settlesId: advance.id, target: advance, amount: 60000,
  }));
  assert.equal(settled.settlesId, advance.id);
  assert.equal(Object.prototype.hasOwnProperty.call(settled, 'targetId'), false);
  assert.deepEqual(Accounts.post('returnAdvance', {
    id: 'ret-second', targetId: advance.id, target: advance, amount: 50000, siblings: [settled],
  }).errors, ['cumulative']);
  const viaLedger = posted(Accounts.post('settle', {
    id: 'stl-ledger', settlesId: advance.id, amount: 1000, ledger: [advance],
  }));
  assert.equal(viaLedger.settlesId, advance.id);
});

test('approveDeduct counts only live approved deducts, and not the deduct being approved twice', () => {
  const approval = approvalOf('a-only', measure('m-only'));
  const pending = posted(Accounts.post('deduct', {
    id: 'ded-pending', targetId: approval.id, target: approval, amount: 500000,
  }));
  const small = posted(Accounts.post('deduct', {
    id: 'ded-small', targetId: approval.id, target: approval, amount: 200000,
  }));
  const approvedSmall = posted(Accounts.post('approveDeduct', {
    id: 'ad-small', targetId: small.id, target: small, siblings: [approval, pending, small],
  }));
  assert.equal(approvedSmall.purpose, 'approveDeduct');
  const first = posted(Accounts.post('deduct', {
    id: 'ded-first', targetId: approval.id, target: approval, amount: 400000,
  }));
  const firstApproval = posted(Accounts.post('approveDeduct', {
    id: 'ad-first', targetId: first.id, target: first, siblings: [approval],
  }));
  const again = posted(Accounts.post('approveDeduct', {
    id: 'ad-again', targetId: first.id, target: first, siblings: [approval, first, firstApproval],
  }));
  assert.equal(again.purpose, 'approveDeduct');
  const second = posted(Accounts.post('deduct', {
    id: 'ded-second', targetId: approval.id, target: approval, amount: 400000,
  }));
  const afterReversal = posted(Accounts.post('approveDeduct', {
    id: 'ad-second',
    targetId: second.id,
    target: second,
    siblings: [approval, first, firstApproval, marker('rev_' + firstApproval.id), second],
  }));
  assert.equal(afterReversal.purpose, 'approveDeduct');
  const wrongTarget = Object.assign({}, approval, { id: 'not-the-approval' });
  assert.deepEqual(Accounts.post('deduct', {
    id: 'ded-mismatch', targetId: approval.id, target: wrongTarget, amount: 1,
  }).errors, ['targetId']);
  const later = posted(Accounts.post('deduct', {
    id: 'ded-later', targetId: approval.id, target: approval, amount: 10000,
  }));
  assert.deepEqual(Accounts.post('approveDeduct', {
    id: 'ad-later',
    targetId: later.id,
    ledger: [approval, later, marker('rev_' + approval.id)],
  }).errors, ['targetId']);
});

test('a capped amount outside 1 through the row is range, and a bad stored amount does not move the balance', () => {
  const payment = posted(Accounts.post('payment', { id: 'pay-range', paidAs: 'payLabor', amount: 600000 }));
  const advance = posted(Accounts.post('payment', { id: 'adv-range', paidAs: 'advanceLabor', amount: 100000 }));
  const approval = approvalOf('a-range', measure('m-range'));
  const samples = [0, -1, NaN, Infinity, -Infinity];
  for (const amount of samples) {
    assert.deepEqual(Accounts.post('refundLabor', {
      id: 'rf-bad', targetId: payment.id, target: payment, amount,
    }).errors, ['range']);
    assert.deepEqual(Accounts.post('returnAdvance', {
      id: 'ret-bad', targetId: advance.id, target: advance, amount,
    }).errors, ['range']);
    assert.deepEqual(Accounts.post('deduct', {
      id: 'ded-bad', targetId: approval.id, target: approval, amount,
    }).errors, ['range']);
    assert.deepEqual(Accounts.post('settle', {
      id: 'stl-bad', settlesId: advance.id, target: advance, amount,
    }).errors, ['range']);
  }
  const weird = {
    id: 'pay-inf',
    purpose: 'payLabor',
    ledger: /** @type {'labor'} */ ('labor'),
    amount: Infinity,
    effect: { cost: 0, person: -1, cash: 1 },
  };
  assert.equal(Accounts.personBalance([weird]), 0);
  const wages = posted(Accounts.post('payment', { id: 'pay-copy', paidAs: 'payLabor', amount: 10 }));
  wages.effect.cost = 7;
  const again = posted(Accounts.post('payment', { id: 'pay-copy-2', paidAs: 'payLabor', amount: 10 }));
  assert.equal(again.effect.cost, 0);
  assert.equal(Accounts.PURPOSES.payLabor.effect.cost, 0);
  // @ts-expect-error id is required at runtime
  assert.deepEqual(Accounts.post('payment', { paidAs: 'payLabor', amount: 1 }).errors, ['id']);
  assert.deepEqual(Accounts.post('laborQty', { id: 'no-ag' }).errors, ['agreement']);
});

function doc(fields) {
  return Object.assign({ ledger: /** @type {'labor'} */ ('labor') }, fields);
}

function deleteGuard(net) {
  if (typeof net !== 'number' || !Number.isFinite(net) || net === 0) return { block: false, stringId: 0, amount: 0 };
  if (net > 0) return { block: true, stringId: 87, amount: net };
  return { block: true, stringId: 86, amount: -net };
}

function fixture480(withDeductApproval) {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty', partyId: 'person', projectId: 'job', txnDate: '2026-11-01' }),
    doc({ id: 'appr_m', purpose: 'approveLabor', amount: 600000, targetId: 'm', partyId: 'person', projectId: 'job', txnDate: '2026-11-01' }),
    doc({ id: 'd', purpose: 'deduct', amount: 50000, targetId: 'appr_m', partyId: 'person', projectId: 'job', txnDate: '2026-11-02' }),
    doc({ id: 'adv', purpose: 'advanceLabor', amount: 100000, partyId: 'person', projectId: 'job', txnDate: '2026-11-03' }),
    doc({ id: 'ret', purpose: 'returnAdvance', amount: 30000, targetId: 'adv', partyId: 'person', projectId: 'job', txnDate: '2026-11-04' }),
  ];
  if (withDeductApproval) {
    rows.push(doc({ id: 'ad', purpose: 'approveDeduct', targetId: 'd', partyId: 'person', projectId: 'job', txnDate: '2026-11-05' }));
  }
  return rows;
}

function lineBy(statement, key) {
  const line = statement.lines.find((item) => item.key === key);
  assert.ok(line);
  return line;
}

test('spec 15: 600000, deduct 50000, advance 100000, return 30000, with approveDeduct', () => {
  const rows = fixture480(true);
  const balance = Accounts.balances(rows, { partyId: 'person', projectId: 'job', currency: 'IQD' });
  assert.equal(balance.net, 480000);
  assert.equal(balance.payableGross, 550000);
  assert.equal(balance.payable, 550000);
  assert.equal(balance.recoverable, 0);
  assert.equal(balance.netAdvances, 70000);
  assert.equal(balance.openAdvances, 70000);
  assert.equal(balance.payableGross - balance.openAdvances, 480000);
  assert.deepEqual(deleteGuard(balance.net), { block: true, stringId: 87, amount: 480000 });
  assert.equal(Accounts.personBalance(rows), 480000);
});

test('spec 15: the 530000 case when that appr_ is absent', () => {
  const rows = fixture480(false);
  const balance = Accounts.balances(rows);
  assert.equal(balance.net, 530000);
  assert.equal(balance.pendingIds.includes('d'), true);
  assert.equal(balance.openAdvances, 70000);
  const statement = Accounts.statementLines(rows);
  assert.equal(lineBy(statement, 'deduct').amount, 0);
});

test('property: closing equals net on the 480000 fixture', () => {
  const filter = { partyId: 'person', projectId: 'job', currency: /** @type {'IQD'} */ ('IQD') };
  const rows = fixture480(true);
  const statement = Accounts.statementLines(rows, filter);
  assert.equal(statement.closing, 480000);
  assert.equal(statement.closing, Accounts.balances(rows, filter).net);
});

test('property: closing equals net on the 530000 case', () => {
  const rows = fixture480(false);
  const filter = { partyId: 'person', projectId: 'job', currency: /** @type {'IQD'} */ ('IQD') };
  assert.equal(Accounts.statementLines(rows, filter).closing, 530000);
  assert.equal(Accounts.balances(rows, filter).net, 530000);
});

test('property: closing equals net through periodEnd', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm', txnDate: '2026-11-01' }),
    doc({ id: 'pay', purpose: 'payLabor', amount: 100000, txnDate: '2026-11-15' }),
    doc({ id: 'later', purpose: 'payLabor', amount: 50000, txnDate: '2026-11-21' }),
  ];
  const filter = { periodStart: '2026-11-14', periodEnd: '2026-11-20', currency: /** @type {'IQD'} */ ('IQD') };
  const statement = Accounts.statementLines(rows, filter);
  const closed = Accounts.balances(rows, { periodEnd: '2026-11-20', currency: 'IQD' });
  assert.equal(statement.closing, closed.net);
  assert.equal(closed.net, 500000);
  assert.equal(Accounts.balances(rows, { periodEnd: '2026-11-20' }).payments, 100000);
});

test('second fixture: settle 40000', () => {
  const rows = fixture480(true);
  rows.push(doc({
    id: 'stl_m_1',
    purpose: 'settle',
    amount: 40000,
    targetId: 'm',
    settlesId: 'adv',
    partyId: 'person',
    projectId: 'job',
  }));
  const balance = Accounts.balances(rows);
  assert.equal(balance.net, 480000);
  assert.equal(balance.payableGross, 510000);
  assert.equal(balance.payable, 510000);
  assert.equal(balance.netAdvances, 70000);
  assert.equal(balance.openAdvances, 30000);
  const statement = Accounts.statementLines(rows);
  assert.equal(statement.closing, 480000);
  const entered = statement.lines.reduce((sum, line) => sum + (line.entersClosing ? line.amount * line.sign : 0), 0);
  assert.equal(entered, 480000);
  const asOpen = statement.lines.reduce((sum, line) => {
    if (line.key === 'netAdvances') return sum + lineBy(statement, 'openAdvances').amount * -1;
    return sum + (line.entersClosing ? line.amount * line.sign : 0);
  }, 0);
  assert.equal(asOpen, 520000);
});

test('advance 100 returned in full', () => {
  const rows = [
    doc({ id: 'adv', purpose: 'advanceLabor', amount: 100 }),
    doc({ id: 'ret', purpose: 'returnAdvance', amount: 100, targetId: 'adv' }),
  ];
  const statement = Accounts.statementLines(rows);
  assert.equal(statement.closing, 0);
  assert.equal(lineBy(statement, 'netAdvances').amount, 0);
  assert.equal(lineBy(statement, 'cashReturned').key, 'cashReturned');
  assert.notEqual(lineBy(statement, 'cashReturned').key, 'deduct');
});

test('payments term, labor shape of plan line 350', () => {
  const rows = [
    doc({ id: 'pay', purpose: 'payLabor', amount: 200000 }),
    doc({ id: 'rf', purpose: 'refundLabor', amount: 50000, targetId: 'pay' }),
  ];
  const statement = Accounts.statementLines(rows);
  assert.equal(statement.closing, -150000);
  assert.equal(lineBy(statement, 'payments').amount * lineBy(statement, 'payments').sign, -200000);
  assert.equal(lineBy(statement, 'paymentRefund').amount * lineBy(statement, 'paymentRefund').sign, 50000);
  assert.equal(rows.some((row) => row.purpose === 'refundPayment'), false);
});

test('spec 9 and 13: opening is the live fold before periodStart', () => {
  const filter = { periodStart: '2026-11-14', periodEnd: '2026-11-20' };
  const first = [
    doc({ id: 'm', purpose: 'laborQty', txnDate: '2026-11-13' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm', txnDate: '2026-11-13' }),
    doc({ id: 'pay', purpose: 'payLabor', amount: 100000, txnDate: '2026-11-15' }),
    doc({ id: 'old-adv', purpose: 'advanceLabor', amount: 10000, txnDate: '2026-11-01' }),
  ];
  const statement = Accounts.statementLines(first, filter);
  assert.equal(statement.opening, 590000);
  assert.equal(lineBy(statement, 'approvedLabor').amount, 0);
  assert.equal(lineBy(statement, 'payments').amount, 100000);
  assert.equal(statement.closing, 490000);
  assert.equal(lineBy(statement, 'openAdvances').amount, 10000);
  const again = Accounts.statementLines(first.concat([
    doc({ id: 'm2', purpose: 'laborQty', txnDate: '2026-11-13' }),
    doc({ id: 'appr2', purpose: 'approveLabor', amount: 1000, targetId: 'm2', txnDate: '2026-11-13' }),
  ]), filter);
  assert.equal(again.opening, 591000);
  assert.equal(statement.opening, 590000);
});

test('spec 9 and 13: opening uses txnDate < periodStart', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty', txnDate: '2026-11-14' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm', txnDate: '2026-11-14' }),
  ];
  const statement = Accounts.statementLines(rows, { periodStart: '2026-11-14', periodEnd: '2026-11-20' });
  assert.equal(statement.opening, 0);
  assert.equal(lineBy(statement, 'approvedLabor').amount, 600000);
});

test('spec 13: the week starts Saturday, and February has 28 days in 2026', () => {
  for (const day of ['2026-11-15', '2026-11-14', '2026-11-20']) {
    assert.deepEqual(Accounts.periodBounds('week', day), { periodStart: '2026-11-14', periodEnd: '2026-11-20' });
  }
  assert.deepEqual(Accounts.periodBounds('week', '2026-11-21'), { periodStart: '2026-11-21', periodEnd: '2026-11-27' });
  assert.deepEqual(Accounts.periodBounds('month', '2026-11-15'), { periodStart: '2026-11-01', periodEnd: '2026-11-30' });
  assert.deepEqual(Accounts.periodBounds('month', '2026-02-15'), { periodStart: '2026-02-01', periodEnd: '2026-02-28' });
  assert.equal(Accounts.periodBounds('week', '2026-02-31'), null);
  assert.equal(Accounts.periodBounds('month', 'nope'), null);
  const script = `
    const Accounts = require(${JSON.stringify(path.join(__dirname, '../public/accounts.js'))});
    const week = Accounts.periodBounds('week', '2026-11-15');
    const month = Accounts.periodBounds('month', '2026-02-15');
    if (!week || week.periodStart !== '2026-11-14' || week.periodEnd !== '2026-11-20') process.exit(2);
    if (!month || month.periodStart !== '2026-02-01' || month.periodEnd !== '2026-02-28') process.exit(3);
  `;
  const child = spawnSync(process.execPath, ['-e', script], { env: Object.assign({}, process.env, { TZ: 'Asia/Baghdad' }) });
  assert.equal(child.status, 0, String(child.stderr || child.stdout));
});

test('spec 10: IQD only, balances come from the rows', () => {
  const iqd = [doc({ id: 'pay', purpose: 'payLabor', amount: 100 })];
  const usd = iqd.concat([doc({ id: 'usd', purpose: 'payLabor', amount: 100, currency: 'USD' })]);
  assert.equal(Accounts.balances(usd).net, -100);
  assert.equal(Accounts.balances(iqd).net, Accounts.balances([doc({ id: 'pay', purpose: 'payLabor', amount: 100 })]).net);
  const bare = [doc({ id: 'pay', purpose: 'payLabor', amount: 100 })];
  delete bare[0].currency;
  assert.equal(Accounts.balances(bare).net, -100);
  const before = bare[0].amount;
  Accounts.balances(bare);
  assert.equal(bare[0].amount, before);
  assert.notEqual(Accounts.balances([doc({ id: 'pay', purpose: 'payLabor', amount: 50 })]).net, Accounts.balances(bare).net);
});

test('spec 15: one project and the consolidated person', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty', partyId: 'person', projectId: 'a' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm', partyId: 'person', projectId: 'a' }),
    doc({ id: 'adv', purpose: 'advanceLabor', amount: 100000, partyId: 'person', projectId: 'b' }),
    doc({ id: 'other', purpose: 'payLabor', amount: 1, partyId: 'someone', projectId: 'a' }),
  ];
  assert.equal(Accounts.balances(rows, { partyId: 'person', projectId: 'a' }).net, 600000);
  assert.equal(Accounts.balances(rows, { partyId: 'person', projectId: 'b' }).net, -100000);
  assert.equal(Accounts.balances(rows, { partyId: 'person' }).net, 500000);
});

test('one statement line per purpose', () => {
  const tokens = Object.values(Accounts.PURPOSES).map((purpose) => purpose.statementLine);
  assert.equal(new Set(tokens).size, tokens.length);
  assert.equal(tokens.every((token) => token.length > 0), true);
  for (const purpose of Object.values(Accounts.PURPOSES)) {
    assert.equal(purpose.statementSign, purpose.effect.person);
  }
  const keys = Accounts.statementLines(fixture480(true)).lines.map((line) => line.key);
  assert.deepEqual(keys, [
    'opening', 'approvedLabor', 'payments', 'paymentRefund', 'advancesPaid', 'cashReturned',
    'netAdvances', 'deduct', 'settle', 'closing', 'openAdvances',
  ]);
  assert.equal(keys.includes('outside'), false);
  assert.equal(keys.includes('notInSum'), false);
  assert.equal(keys.includes('approvedMaterials'), false);
  const statement = Accounts.statementLines(fixture480(true));
  const entered = statement.lines.reduce((sum, line) => sum + (line.entersClosing ? line.amount * line.sign : 0), 0);
  assert.equal(entered, 480000);
  assert.equal(lineBy(statement, 'approvedLabor').label, 'عمل معتمد');
});

test('a reversed approval of 600000 nets to 0', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'rev_appr', purpose: 'approveLabor', amount: 600000, reversesId: 'appr' }),
  ];
  const balance = Accounts.balances(rows);
  assert.equal(balance.net, 0);
  assert.equal(Accounts.statementLines(rows).lines.find((line) => line.key === 'approvedLabor').amount, 0);
});

test('syncErrors drops the approval and not a second copy', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
  ];
  const syncErrors = { appr: 'رُفض الإرسال' };
  assert.equal(Accounts.balances(rows, { syncErrors }).net, 0);
  assert.equal(Accounts.personBalance(rows, syncErrors), 0);
});

test('M2: a sup_ replaces an unapproved deduct', () => {
  const rows = fixture480(false);
  rows.push(
    doc({ id: 'd-new', purpose: 'deduct', amount: 50000, targetId: 'appr_m', supersedesId: 'd' }),
    doc({ id: 'sup_d-new', purpose: 'deduct', amount: 40000, targetId: 'appr_m', supersedesId: 'd-new' }),
    doc({ id: 'ad-sup', purpose: 'approveDeduct', targetId: 'sup_d-new' }),
  );
  const balance = Accounts.balances(rows);
  assert.equal(balance.net, 490000);
  const index = Accounts.rowIndex(rows);
  assert.equal(Accounts.rowCounts(rows.find((row) => row.id === 'd'), index), false);
  assert.equal(Accounts.rowCounts(rows.find((row) => row.id === 'sup_d-new'), index), true);
  assert.equal(Accounts.rowCounts(doc({ id: 'rev_x', kind: 'rev' }), index), false);
});

test('rejection wins over approveDeduct', () => {
  const rows = fixture480(true);
  rows.push(doc({ id: 'rej_d', kind: 'rej', targetId: 'd' }));
  assert.equal(Accounts.balances(rows).net, 530000);
});

test('M1: rejection wins over approveLabor', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'rej_m', kind: 'rej', targetId: 'm' }),
  ];
  const index = Accounts.rowIndex(rows);
  assert.equal(Accounts.rowCounts(rows[1], index), false);
  assert.equal(Accounts.balances(rows).net, 0);
  assert.equal(Accounts.statementLines(rows).lines.find((line) => line.key === 'approvedLabor').amount, 0);
  rows.push(
    doc({ id: 'd', purpose: 'deduct', amount: 50000, targetId: 'appr' }),
    doc({ id: 'ad', purpose: 'approveDeduct', targetId: 'd' }),
  );
  assert.equal(Accounts.balances(rows).net, 0);
});

test('L1: a settle drops when the measurement is rejected', () => {
  const before = [
    doc({ id: 'adv', purpose: 'advanceLabor', amount: 100000 }),
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr_m', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'stl_m_1', purpose: 'settle', amount: 40000, targetId: 'm', settlesId: 'adv' }),
  ];
  const open = Accounts.balances(before);
  assert.equal(open.net, 500000);
  assert.equal(open.settlements, 40000);
  assert.equal(open.openAdvances, 60000);
  const after = before.concat([doc({ id: 'rej_m', kind: 'rej', targetId: 'm' })]);
  const shut = Accounts.balances(after);
  assert.equal(shut.net, -100000);
  assert.equal(shut.settlements, 0);
  assert.equal(shut.openAdvances, 100000);
});

test('L1: a settle drops when the approval is reversed', () => {
  const rows = [
    doc({ id: 'adv', purpose: 'advanceLabor', amount: 100000 }),
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr_m', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'stl_m_1', purpose: 'settle', amount: 40000, targetId: 'm', settlesId: 'adv' }),
    doc({ id: 'rev_appr_m', kind: 'rev', reversesId: 'appr_m' }),
  ];
  const balance = Accounts.balances(rows);
  assert.equal(balance.net, -100000);
  assert.equal(balance.settlements, 0);
  assert.equal(balance.openAdvances, 100000);
});

test('rev-of-rev puts the approval back, and D denies that path', () => {
  const once = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'rev_appr', kind: 'rev', reversesId: 'appr' }),
  ];
  assert.equal(Accounts.balances(once).net, 0);
  const twice = once.concat([doc({ id: 'rev_rev_appr', kind: 'rev', reversesId: 'rev_appr' })]);
  assert.equal(Accounts.balances(twice).net, 600000);
  const index = Accounts.rowIndex(twice);
  assert.equal(Accounts.rowCounts(twice[2], index), false);
  assert.equal(Accounts.rowCounts(twice[3], index), false);
});

test('rowCounts is false for a marker', () => {
  const rows = [
    doc({ id: 'rej_x', kind: 'rej' }),
    doc({ id: 'rev_x', kind: 'rev' }),
    doc({ id: 'revw_x', kind: 'revw' }),
    doc({ id: 'sup_body', purpose: 'laborQty', kind: 'sup' }),
  ];
  const index = Accounts.rowIndex(rows);
  assert.equal(Accounts.rowCounts(rows[0], index), false);
  assert.equal(Accounts.rowCounts(rows[1], index), false);
  assert.equal(Accounts.rowCounts(rows[2], index), false);
});

test('M1: a refused rej_ does not drop the approval', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'rej_m', kind: 'rej', targetId: 'm' }),
  ];
  assert.equal(Accounts.balances(rows, { syncErrors: { rej_m: 'رُفض الإرسال' } }).net, 600000);
});

test('M1: a refused rev_ does not drop the approval', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'rev_appr', kind: 'rev', reversesId: 'appr' }),
  ];
  assert.equal(Accounts.balances(rows, { syncErrors: { rev_appr: 'رُفض الإرسال' } }).net, 600000);
});

test('M1: a refused rev-of-rev does not restore', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'rev_appr', kind: 'rev', reversesId: 'appr' }),
    doc({ id: 'rev_rev_appr', kind: 'rev', reversesId: 'rev_appr' }),
  ];
  assert.equal(Accounts.balances(rows, { syncErrors: { rev_rev_appr: 'رُفض الإرسال' } }).net, 0);
});

test('M3: the index is the full list', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty', partyId: 'person' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm', partyId: 'person' }),
    doc({ id: 'rej_m', kind: 'rej', targetId: 'm', partyId: 'other' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm', partyId: 'person' }),
  ];
  assert.equal(Accounts.balances(rows, { partyId: 'person' }).net, 0);
  const doubled = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
  ];
  assert.equal(Accounts.balances(doubled).net, 600000);
});

test('M3: a rev_ after periodEnd still removes the original', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty', txnDate: '2026-11-15' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm', txnDate: '2026-11-15' }),
    doc({ id: 'rev_appr', kind: 'rev', reversesId: 'appr', txnDate: '2026-11-28' }),
  ];
  assert.equal(Accounts.statementLines(rows, { periodStart: '2026-11-14', periodEnd: '2026-11-20' }).closing, 0);
});

test('L4: order does not matter, and a rev_ alone is 0', () => {
  const rows = fixture480(true);
  assert.equal(Accounts.balances(rows).net, Accounts.balances(rows.slice().reverse()).net);
  const alone = [doc({ id: 'rev_missing', purpose: 'approveLabor', amount: 600000, reversesId: 'missing' })];
  assert.equal(Accounts.balances(alone).net, 0);
});

test('L4: a reversed approveDeduct returns 480000 to 530000', () => {
  const rows = fixture480(true).concat([doc({ id: 'rev_ad', kind: 'rev', reversesId: 'ad' })]);
  assert.equal(Accounts.balances(rows).net, 530000);
});

test('L4: an approveLabor whose body is reversed or refused is out', () => {
  const body = doc({ id: 'm', purpose: 'laborQty' });
  const approval = doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' });
  assert.equal(Accounts.balances([body, approval, doc({ id: 'rev_m', kind: 'rev', reversesId: 'm' })]).net, 0);
  assert.equal(Accounts.balances([body, approval], { syncErrors: { m: 'رُفض الإرسال' } }).net, 0);
  assert.equal(Accounts.balances([approval]).net, 600000);
});

test('overLimit keeps both rows', () => {
  const rows = [
    doc({ id: 'pay', purpose: 'payLabor', amount: 600000 }),
    doc({ id: 'rf1', purpose: 'refundLabor', amount: 400000, targetId: 'pay' }),
    doc({ id: 'rf2', purpose: 'refundLabor', amount: 400000, targetId: 'pay' }),
  ];
  const balance = Accounts.balances(rows);
  assert.equal(balance.net, 200000);
  assert.equal(balance.overLimitIds.includes('pay'), true);
});

test('personBalance matches balances().net', () => {
  assert.equal(Accounts.personBalance(fixture480(true)), Accounts.balances(fixture480(true)).net);
  const measurement = doc({ id: 'm', purpose: 'laborQty' });
  const approval = doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' });
  const paid = doc({ id: 'pay', purpose: 'payLabor', amount: 600000 });
  assert.equal(Accounts.personBalance([measurement, approval, paid]), 0);
  assert.equal(Accounts.personBalance([measurement, approval, doc({ id: 'pay', purpose: 'payLabor', amount: 700000 })]), -100000);
  const deduct = doc({ id: 'd', purpose: 'deduct', amount: 50000, targetId: 'appr' });
  assert.equal(Accounts.personBalance([measurement, approval, deduct]), 600000);
  assert.equal(Accounts.personBalance([
    measurement, approval, deduct, doc({ id: 'ad', purpose: 'approveDeduct', targetId: 'd' }),
  ]), 550000);
});

test('an unreviewed payment still counts', () => {
  const pay = doc({ id: 'pay', purpose: 'payLabor', amount: 100000 });
  assert.equal(Accounts.balances([pay]).net, -100000);
  assert.equal(Accounts.balances([pay]).unreviewedCashIds.includes('pay'), true);
  const reviewed = [pay, doc({ id: 'revw_pay', kind: 'revw' })];
  assert.equal(Accounts.balances(reviewed).net, -100000);
  assert.equal(Accounts.balances(reviewed).unreviewedCashIds.includes('pay'), false);
  const undone = reviewed.concat([doc({ id: 'rev_revw_pay', kind: 'rev', reversesId: 'revw_pay' })]);
  assert.equal(Accounts.balances(undone).net, -100000);
  assert.equal(Accounts.balances(undone).unreviewedCashIds.includes('pay'), true);
  const later = undone.concat([doc({ id: 'revw_pay_1', kind: 'revw' })]);
  assert.equal(Accounts.balances(later).net, -100000);
  assert.equal(Accounts.balances(later).unreviewedCashIds.includes('pay'), false);
});

test('B-L1 A9: a deduct on another approval does not count toward the cap', () => {
  const first = approvalOf('a9-first', measure('a9-m1'));
  const second = approvalOf('a9-second', measure('a9-m2'));
  const onSecond = posted(Accounts.post('deduct', {
    id: 'a9-d2', targetId: second.id, target: second, amount: second.amount, siblings: [first, second],
  }));
  const onFirst = Accounts.post('deduct', {
    id: 'a9-d1', targetId: first.id, target: first, amount: first.amount, siblings: [first, second, onSecond],
  });
  assert.deepEqual(onFirst.errors, []);
  assert.equal(onFirst.doc && onFirst.doc.amount, first.amount);
});

test('B-L1 A29: a reversed approved deduct is not inside approveDeduct', () => {
  const approval = approvalOf('a29-a', measure('a29-m'));
  const deduct = posted(Accounts.post('deduct', {
    id: 'a29-d', targetId: approval.id, target: approval, amount: 400000,
  }));
  const approved = posted(Accounts.post('approveDeduct', {
    id: 'a29-ad', targetId: deduct.id, target: deduct, siblings: [approval],
  }));
  const reversed = marker('rev_' + deduct.id);
  const next = posted(Accounts.post('deduct', {
    id: 'a29-d2', targetId: approval.id, amount: 400000, ledger: [approval, deduct, approved, reversed],
  }));
  const again = posted(Accounts.post('approveDeduct', {
    id: 'a29-ad2',
    targetId: next.id,
    ledger: [approval, deduct, approved, reversed, next],
  }));
  assert.equal(again.purpose, 'approveDeduct');
});

test('B-L1 A10: a rejected deduct that also has approveDeduct is not in that sum', () => {
  const approval = approvalOf('a10-a', measure('a10-m'));
  const deduct = posted(Accounts.post('deduct', {
    id: 'a10-d', targetId: approval.id, target: approval, amount: 400000,
  }));
  const approved = posted(Accounts.post('approveDeduct', {
    id: 'a10-ad', targetId: deduct.id, target: deduct, siblings: [approval],
  }));
  const next = posted(Accounts.post('deduct', {
    id: 'a10-d2', targetId: approval.id, target: approval, amount: 400000,
  }));
  const again = Accounts.post('approveDeduct', {
    id: 'a10-ad2',
    targetId: next.id,
    ledger: [approval, deduct, approved, marker('rej_' + deduct.id), next],
  });
  assert.deepEqual(again.errors, []);
});

test('B-L1 A14: a reversed approveDeduct does not approve the deduct', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'd', purpose: 'deduct', amount: 50000, targetId: 'appr' }),
    doc({ id: 'ad', purpose: 'approveDeduct', targetId: 'd' }),
    doc({ id: 'rev_ad', kind: 'rev', reversesId: 'ad' }),
  ];
  assert.equal(Accounts.balances(rows).net, 600000);
});

test('B-L1 A15: the approval of a reversed deduct does not lower net', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'd', purpose: 'deduct', amount: 50000, targetId: 'appr' }),
    doc({ id: 'ad', purpose: 'approveDeduct', targetId: 'd' }),
    doc({ id: 'rev_d', kind: 'rev', reversesId: 'd' }),
  ];
  assert.equal(Accounts.balances(rows).net, 600000);
});

test('B-L1 A16: a rejected deduct stays out of net', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'd', purpose: 'deduct', amount: 50000, targetId: 'appr' }),
    doc({ id: 'ad', purpose: 'approveDeduct', targetId: 'd' }),
    doc({ id: 'rej_d', kind: 'rej', targetId: 'd' }),
  ];
  assert.equal(Accounts.balances(rows).net, 600000);
});

test('B-L1 A19: an empty id is id', () => {
  assert.deepEqual(Accounts.post('payment', { id: '', paidAs: 'payLabor', amount: 100 }).errors, ['id']);
});

test('B-L1 A24: a target with no numeric amount is targetId', () => {
  const payment = doc({ id: 'pay', purpose: 'payLabor', ledger: 'labor', effect: { cost: 0, person: -1, cash: 1 } });
  const advance = doc({ id: 'adv', purpose: 'advanceLabor', ledger: 'labor', effect: { cost: 0, person: -1, cash: 1 } });
  assert.deepEqual(Accounts.post('refundLabor', {
    id: 'rf', targetId: 'pay', amount: 1, ledger: [payment],
  }).errors, ['targetId']);
  assert.deepEqual(Accounts.post('settle', {
    id: 'stl', settlesId: 'adv', amount: 1, ledger: [advance],
  }).errors, ['settlesId']);
});

test('B-L1 A25: a rev_ of a refund copies purpose and targetId, and neither field reverses the payment', () => {
  const rows = [
    doc({ id: 'P', purpose: 'payLabor', amount: 600000 }),
    doc({ id: 'R', purpose: 'refundLabor', amount: 100000, targetId: 'P' }),
    doc({ id: 'rev_R', purpose: 'refundLabor', amount: 100000, targetId: 'P', reversesId: 'R' }),
  ];
  const index = Accounts.rowIndex(rows);
  assert.equal(Accounts.balances(rows).net, -600000);
  assert.equal(Accounts.rowLive(rows[0], index), true);
  const payment = posted(Accounts.post('payment', { id: 'A25-P', paidAs: 'payLabor', amount: 100 }));
  const copied = doc({ id: 'rev_A25-R', purpose: 'refundLabor', amount: 100, targetId: 'A25-P' });
  const full = Accounts.post('refundLabor', {
    id: 'A25-full', targetId: 'A25-P', target: payment, amount: 100, siblings: [copied],
  });
  assert.deepEqual(full.errors, []);
});

test('B-L2: a rev_ or rej_ with purpose approveDeduct does not approve the deduct', () => {
  const labor = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'd', purpose: 'deduct', amount: 50000, targetId: 'appr' }),
  ];
  const reversed = labor.concat([doc({
    id: 'rev_ad', purpose: 'approveDeduct', targetId: 'd', reversesId: 'other',
  })]);
  const revIndex = Accounts.rowIndex(reversed);
  assert.equal(Accounts.balances(reversed).net, 600000);
  assert.equal(Accounts.personBalance(reversed), 600000);
  assert.equal(Accounts.rowLive(reversed[2], revIndex), true);
  const rejected = labor.concat([doc({ id: 'rej_ad', purpose: 'approveDeduct', targetId: 'd' })]);
  const rejIndex = Accounts.rowIndex(rejected);
  assert.equal(Accounts.rowLive(rejected[2], rejIndex), false);
  assert.equal(Accounts.balances(rejected).net, 600000);
  assert.equal(Accounts.balances(rejected).pendingIds.includes('d'), false);
});

test('N5: a rev_ targetId does not reverse the payment, and the delete blocks', () => {
  const rows = [
    doc({ id: 'P', purpose: 'payLabor', amount: 600000 }),
    doc({ id: 'R', purpose: 'refundLabor', amount: 100000, targetId: 'P' }),
    doc({ id: 'rev_R', purpose: 'refundLabor', targetId: 'P', reversesId: 'R' }),
  ];
  const index = Accounts.rowIndex(rows);
  assert.equal(Accounts.rowLive(rows[0], index), true);
  assert.equal(Accounts.rowLive(rows[1], index), false);
  assert.equal(Accounts.balances(rows).net, -600000);
  assert.deepEqual(deleteGuard(Accounts.balances(rows).net), { block: true, stringId: 86, amount: 600000 });
  const byId = [
    doc({ id: 'P', purpose: 'payLabor', amount: 600000 }),
    doc({ id: 'R', purpose: 'refundLabor', amount: 100000, targetId: 'P' }),
    doc({ id: 'rev_R', purpose: 'refundLabor', targetId: 'P' }),
  ];
  assert.equal(Accounts.balances(byId).net, -600000);
  const labor = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr_m', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'd', purpose: 'deduct', amount: 50000, targetId: 'appr_m' }),
    doc({ id: 'ad', purpose: 'approveDeduct', targetId: 'd' }),
    doc({ id: 'rev_d', purpose: 'deduct', reversesId: 'd', targetId: 'appr_m' }),
  ];
  assert.equal(Accounts.balances(labor).net, 600000);
  assert.equal(Accounts.rowLive(labor[1], Accounts.rowIndex(labor)), true);
});

test('B-L3: a missing milestoneMode is milestone', () => {
  const missing = Accounts.workPosition({ method: 'milestone', milestoneAmount: 250000 }, { approved: true });
  assert.equal(missing.earned, 0);
  assert.deepEqual(missing.errors, ['milestone']);
});

test('B-L4: a fractional, negative, huge, NaN, Infinity, or string amount adds 0', () => {
  for (const amount of [1.5, -100, 1e20, NaN, Infinity, '100']) {
    const row = doc({ id: 'bad', purpose: 'payLabor', amount });
    assert.equal(Accounts.balances([row]).net, 0);
    const payment = posted(Accounts.post('payment', { id: 'cap-pay', paidAs: 'payLabor', amount: 100 }));
    const sibling = doc({ id: 'cap-bad', purpose: 'refundLabor', amount, targetId: 'cap-pay' });
    const postedRefund = Accounts.post('refundLabor', {
      id: 'cap-ok', targetId: 'cap-pay', target: payment, amount: 100, siblings: [sibling],
    });
    assert.deepEqual(postedRefund.errors, []);
  }
  assert.equal(Accounts.balances([doc({ id: 'ok', purpose: 'payLabor', amount: 100 })]).net, -100);
});

test('N2: a pending row is live and does not count', () => {
  const pending = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'd', purpose: 'deduct', amount: 50000, targetId: 'missing' }),
  ];
  const index = Accounts.rowIndex(pending);
  assert.equal(Accounts.rowLive(pending[0], index), true);
  assert.equal(Accounts.rowCounts(pending[0], index), false);
  assert.equal(Accounts.rowLive(pending[1], index), true);
  assert.equal(Accounts.rowCounts(pending[1], index), false);
  const rejected = pending.concat([
    doc({ id: 'rej_m', kind: 'rej', targetId: 'm' }),
    doc({ id: 'rej_d', kind: 'rej', targetId: 'd' }),
  ]);
  const rejectedIndex = Accounts.rowIndex(rejected);
  assert.equal(Accounts.rowLive(rejected[0], rejectedIndex), false);
  assert.equal(Accounts.rowCounts(rejected[0], rejectedIndex), false);
  assert.equal(Accounts.rowLive(rejected[1], rejectedIndex), false);
  assert.equal(Accounts.rowCounts(rejected[1], rejectedIndex), false);
  const refusedIndex = Accounts.rowIndex(pending, { m: 'رُفض الإرسال', d: 'رُفض الإرسال' });
  assert.equal(Accounts.rowLive(pending[0], refusedIndex), false);
  assert.equal(Accounts.rowCounts(pending[0], refusedIndex), false);
  assert.equal(Accounts.rowLive(pending[1], refusedIndex), false);
  assert.equal(Accounts.rowCounts(pending[1], refusedIndex), false);
  const superseded = [doc({ id: 'm', purpose: 'laborQty' }), doc({ id: 'sup_m', purpose: 'laborQty' })];
  const supIndex = Accounts.rowIndex(superseded);
  assert.equal(Accounts.rowLive(superseded[0], supIndex), false);
  assert.equal(Accounts.rowCounts(superseded[0], supIndex), false);
});

test('N3: supersede wins', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty' }),
    doc({ id: 'appr_m', purpose: 'approveLabor', amount: 600000, targetId: 'm' }),
    doc({ id: 'sup_m', purpose: 'laborQty' }),
    doc({ id: 'appr_sup_m', purpose: 'approveLabor', amount: 500000, targetId: 'sup_m' }),
  ];
  assert.equal(Accounts.balances(rows).net, 500000);
  assert.equal(Accounts.balances(rows.slice().reverse()).net, 500000);
  const waiting = rows.slice(0, 3);
  const waitingBalance = Accounts.balances(waiting);
  assert.equal(waitingBalance.net, 0);
  assert.equal(waitingBalance.pendingIds.includes('sup_m'), true);
});

test('N4: the 480000 fixture with effect removed is still 480000', () => {
  const rows = fixture480(true).map((row) => {
    const copy = Object.assign({}, row);
    delete copy.effect;
    return copy;
  });
  assert.equal(Accounts.balances(rows).net, 480000);
});

test('L-e: a reversal inside the period of an earlier approval', () => {
  const rows = [
    doc({ id: 'm', purpose: 'laborQty', txnDate: '2026-11-01' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm', txnDate: '2026-11-01' }),
    doc({ id: 'rev_appr', kind: 'rev', reversesId: 'appr', txnDate: '2026-11-15' }),
  ];
  const filter = { periodStart: '2026-11-14', periodEnd: '2026-11-20' };
  const statement = Accounts.statementLines(rows, filter);
  assert.equal(statement.opening, 0);
  assert.equal(lineBy(statement, 'approvedLabor').amount, 0);
  assert.equal(statement.closing, 0);
  const refused = [
    doc({ id: 'm', purpose: 'laborQty', txnDate: '2026-11-01' }),
    doc({ id: 'appr', purpose: 'approveLabor', amount: 600000, targetId: 'm', txnDate: '2026-11-01' }),
  ];
  const shut = Accounts.statementLines(refused, Object.assign({ syncErrors: { appr: 'رُفض الإرسال' } }, filter));
  assert.equal(shut.opening, 0);
  assert.equal(shut.closing, 0);
});
