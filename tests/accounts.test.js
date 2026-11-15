const test = require('node:test');
const assert = require('node:assert/strict');
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
  assert.equal(missingMode.earned, 250000);
  assert.deepEqual(missingMode.errors, []);
  const mixed = Accounts.workPosition(
    { method: 'milestone', milestoneAmount: 250000, lumpAmount: 1 },
    { approved: true },
  );
  assert.deepEqual(mixed.errors, ['method']);
  const zero = Accounts.workPosition({ method: 'milestone', milestoneAmount: 0 }, { approved: true });
  assert.equal(zero.earned, 0);
  assert.deepEqual(zero.errors, ['range']);
  const above = Accounts.workPosition({ method: 'milestone', milestoneAmount: 10000000001 }, { approved: true });
  assert.equal(above.earned, 0);
  assert.deepEqual(above.errors, ['range']);
  const old = Accounts.workPosition({ method: 'milestone', lumpAmount: 1 }, { approved: true });
  assert.deepEqual(old.errors, ['milestone']);
});

test('every built milestone payload has milestoneMode', () => {
  const bare = { method: 'milestone', milestoneAmount: 250000 };
  const qty = posted(Accounts.post('laborQty', { id: 'ms-qty', agreement: bare }));
  const approved = posted(Accounts.post('approveLabor', {
    id: 'ms-appr',
    targetId: qty.id,
    target: qty,
    agreement: bare,
  }));
  /** @type {{ method: string, milestoneMode: 'amount', milestoneAmount: number }} */
  const named = { method: 'milestone', milestoneMode: 'amount', milestoneAmount: 250000 };
  const explicit = posted(Accounts.post('laborQty', { id: 'ms-named', agreement: named }));
  for (const doc of [qty, approved, explicit]) {
    assert.equal(doc.agreement && doc.agreement.milestoneMode, 'amount');
  }
  assert.equal(Object.prototype.hasOwnProperty.call(bare, 'milestoneMode'), false);
  assert.equal(Accounts.workPosition(bare, { approved: true }).earned, 250000);
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
  assert.equal(Accounts.projectCost('p', [{ projectId: 'p', purpose: 'approveLabor', amount: 600000, txnDate: '2026-12-01' }]), 0);
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
  assert.equal(Accounts.projectCost('p-brick', [approval, payment]), 0);
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
  assert.equal(Accounts.projectCost('p-ded', [approval, deduct, approved]), 0);
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
