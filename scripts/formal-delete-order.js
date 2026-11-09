#!/usr/bin/env node
'use strict';

// Finite check of projectDeleteDocs and projectDeleteBatches.
// 8192 DeleteFound values from the pool, plus four named cases.

const Sync = require('../public/sync.js');

const PROJECT = 'p';

/** @type {DeleteDoc} */
const projectDoc = { collection: 'projects', id: PROJECT };

/**
 * @param {string} collection
 * @param {string} id
 * @returns {DeleteDoc}
 */
function doc(collection, id) {
  return { collection, id };
}

/**
 * @param {DeleteDoc} row
 * @returns {string}
 */
function docKey(row) {
  return row.collection + '/' + row.id;
}

/**
 * @param {readonly string[]} ids
 * @returns {string[][]}
 */
function subsets(ids) {
  /** @type {string[][]} */
  let out = [[]];
  for (const id of ids) {
    const added = out.map(row => row.concat(id));
    out = out.concat(added);
  }
  return out;
}

/**
 * @param {DeleteDoc | undefined} left
 * @param {DeleteDoc | undefined} right
 * @returns {boolean}
 */
function sameDoc(left, right) {
  return !!left && !!right && left.collection === right.collection && left.id === right.id;
}

/**
 * @param {readonly DeleteDoc[]} left
 * @param {readonly DeleteDoc[]} right
 * @returns {boolean}
 */
function sameDocs(left, right) {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i++) {
    if (!sameDoc(left[i], right[i])) return false;
  }
  return true;
}

/**
 * @param {readonly (readonly DeleteDoc[])[]} left
 * @param {readonly (readonly DeleteDoc[])[]} right
 * @returns {boolean}
 */
function sameBatches(left, right) {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i++) {
    const a = left[i];
    const b = right[i];
    if (!a || !b || !sameDocs(a, b)) return false;
  }
  return true;
}

/**
 * @param {readonly number[]} left
 * @param {readonly number[]} right
 * @returns {boolean}
 */
function sameNumbers(left, right) {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

/**
 * @param {readonly (readonly DeleteDoc[])[]} batches
 * @returns {DeleteDoc[]}
 */
function flatten(batches) {
  /** @type {DeleteDoc[]} */
  const out = [];
  for (const batch of batches) {
    for (const row of batch) out.push(row);
  }
  return out;
}

/**
 * @param {readonly (readonly DeleteDoc[])[]} batches
 * @returns {number[]}
 */
function batchLengths(batches) {
  return batches.map(batch => batch.length);
}

/**
 * @param {readonly DeleteDoc[]} docs
 * @param {readonly (readonly DeleteDoc[])[]} batches
 * @returns {boolean}
 */
function orderHolds(docs, batches) {
  const first = docs[0];
  const lead = batches[0];
  if (!first || first.collection !== 'projects' || first.id !== PROJECT) return false;
  if (!lead || !sameDocs(lead, [first])) return false;
  for (let i = 1; i < batches.length; i++) {
    const batch = batches[i];
    if (!batch) return false;
    for (const row of batch) {
      if (row.collection === 'projects') return false;
    }
  }
  return true;
}

/**
 * Terms are emitted before the other children, so the batch concatenation is
 * not the same sequence as docs. Partition means nothing lost and nothing repeated.
 * @param {readonly DeleteDoc[]} rows
 * @returns {Map<string, number>}
 */
function countsOf(rows) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const row of rows) {
    const key = docKey(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

/**
 * @param {readonly DeleteDoc[]} docs
 * @param {readonly (readonly DeleteDoc[])[]} batches
 * @returns {boolean}
 */
function partitionHolds(docs, batches) {
  const left = countsOf(docs);
  const right = countsOf(flatten(batches));
  if (left.size !== right.size) return false;
  for (const [key, count] of left) {
    if (right.get(key) !== count) return false;
  }
  return true;
}

/**
 * @param {readonly DeleteDoc[]} expected
 * @param {readonly DeleteDoc[]} actual
 * @returns {{ missing?: string, extra?: string }}
 */
function firstGap(expected, actual) {
  const n = Math.min(expected.length, actual.length);
  for (let i = 0; i < n; i++) {
    const want = expected[i];
    const got = actual[i];
    if (!sameDoc(want, got) && want && got) return { missing: docKey(want), extra: docKey(got) };
  }
  if (expected.length > actual.length) {
    const want = expected[actual.length];
    if (want) return { missing: docKey(want) };
  }
  if (actual.length > expected.length) {
    const got = actual[expected.length];
    if (got) return { extra: docKey(got) };
  }
  return {};
}

/**
 * @param {readonly DeleteDoc[]} docs
 * @param {readonly (readonly DeleteDoc[])[]} batches
 * @returns {{ missing?: string, extra?: string }}
 */
function multisetGap(docs, batches) {
  const left = countsOf(docs);
  const flat = flatten(batches);
  const right = countsOf(flat);
  /** @type {string | undefined} */
  let missing;
  /** @type {Map<string, number>} */
  const seenLeft = new Map();
  for (const row of docs) {
    const key = docKey(row);
    const seen = (seenLeft.get(key) || 0) + 1;
    seenLeft.set(key, seen);
    if (seen > (right.get(key) || 0)) {
      missing = key;
      break;
    }
  }
  /** @type {string | undefined} */
  let extra;
  /** @type {Map<string, number>} */
  const seenRight = new Map();
  for (const row of flat) {
    const key = docKey(row);
    const seen = (seenRight.get(key) || 0) + 1;
    seenRight.set(key, seen);
    if (seen > (left.get(key) || 0)) {
      extra = key;
      break;
    }
  }
  if (missing && extra) return { missing, extra };
  if (missing) return { missing };
  if (extra) return { extra };
  return {};
}

const duplicateDocs = [projectDoc, doc('ledgerEntries', 'e-a')];

const sevenIds = ['t0', 't1', 't2', 't3', 't4', 't5', 't6'];
const sevenBatches = [
  [projectDoc],
  sevenIds.slice(0, 6).map(id => doc('subcontractTerms', id)),
  [doc('subcontractTerms', 't6')],
];

/** @type {string[]} */
const restIds = [];
for (let i = 0; i <= 400; i++) restIds.push('e' + i);
const restBatches = [
  [projectDoc],
  restIds.slice(0, 400).map(id => doc('ledgerEntries', id)),
  [doc('ledgerEntries', 'e400')],
];

let ran = 0;
let poolFailures = 0;

/**
 * @typedef {Object} PoolFailure
 * @property {string} projectId
 * @property {DeleteFound} found
 * @property {DeleteDoc[]} docs
 * @property {DeleteDoc[][]} batches
 * @property {string[]} reasons
 */

/** @type {PoolFailure | null} */
let firstPool = null;

/**
 * @typedef {Object} NamedFailure
 * @property {string} label
 * @property {number[]} lengths
 * @property {string} [missing]
 * @property {string} [extra]
 */

/** @type {NamedFailure[]} */
const namedFailures = [];

/**
 * @param {string} projectId
 * @param {DeleteFound} found
 * @returns {{ docs: DeleteDoc[], batches: DeleteDoc[][] }}
 */
function callDelete(projectId, found) {
  const docs = Sync.projectDeleteDocs(projectId, found);
  const batches = Sync.projectDeleteBatches(docs);
  ran += 1;
  return { docs, batches };
}

/**
 * @param {string} label
 * @param {readonly DeleteDoc[]} docs
 * @param {readonly (readonly DeleteDoc[])[]} batches
 * @returns {string[]}
 */
function check(label, docs, batches) {
  /** @type {string[]} */
  const reasons = [];
  if (label === 'bad-project') {
    if (docs.length !== 0 || batches.length !== 0) reasons.push('empty');
    return reasons;
  }
  if (!orderHolds(docs, batches)) reasons.push('order');
  if (!partitionHolds(docs, batches)) reasons.push('partition');
  if (label === 'duplicate-entry' && !sameDocs(docs, duplicateDocs)) reasons.push('docs');
  if (label === 'seven-terms') {
    if (!sameNumbers(batchLengths(batches), [1, 6, 1])) reasons.push('lengths');
    if (!sameBatches(batches, sevenBatches)) reasons.push('batches');
  }
  if (label === 'rest-401') {
    if (docs.length !== 402) reasons.push('docs');
    if (!sameNumbers(batchLengths(batches), [1, 400, 1])) reasons.push('lengths');
    if (!sameBatches(batches, restBatches)) reasons.push('batches');
  }
  return reasons;
}

/**
 * @param {string} label
 * @param {readonly DeleteDoc[]} docs
 * @param {readonly (readonly DeleteDoc[])[]} batches
 * @returns {{ missing?: string, extra?: string }}
 */
function gapFor(label, docs, batches) {
  const flat = flatten(batches);
  if (label === 'bad-project') {
    if (docs.length && docs[0]) return { extra: docKey(docs[0]) };
    if (flat.length && flat[0]) return { extra: docKey(flat[0]) };
    return {};
  }
  const againstDocs = multisetGap(docs, batches);
  if (againstDocs.missing || againstDocs.extra) return againstDocs;
  if (label === 'duplicate-entry') return firstGap(duplicateDocs, docs);
  return {};
}

/**
 * @param {string} label
 * @param {DeleteDoc[]} docs
 * @param {DeleteDoc[][]} batches
 */
function recordNamed(label, docs, batches) {
  const reasons = check(label, docs, batches);
  if (!reasons.length) return;
  const gap = gapFor(label, docs, batches);
  namedFailures.push({
    label,
    lengths: batchLengths(batches),
    missing: gap.missing,
    extra: gap.extra,
  });
}

function runPool() {
  const entrySets = subsets(['e-a', 'e-b', 'e-c']);
  const subcontractSets = subsets(['s-a', 's-b', 's-c']);
  const amendmentSets = subsets(['m-a', 'm-b', 'm-c']);
  const termSets = subsets(['t-a', 't-b', 't-c']);
  for (const entryIds of entrySets) {
    for (const subcontractIds of subcontractSets) {
      for (const amendmentIds of amendmentSets) {
        for (const termIds of termSets) {
          for (const finance of [false, true]) {
            const found = { entryIds, subcontractIds, amendmentIds, termIds, finance };
            const { docs, batches } = callDelete(PROJECT, found);
            const reasons = check('pool', docs, batches);
            if (!reasons.length) continue;
            poolFailures += 1;
            if (!firstPool) firstPool = { projectId: PROJECT, found, docs, batches, reasons };
          }
        }
      }
    }
  }
}

function runBadProject() {
  const { docs, batches } = callDelete('p p', {});
  recordNamed('bad-project', docs, batches);
}

function runDuplicateEntry() {
  const { docs, batches } = callDelete(PROJECT, { entryIds: ['e-a', 'e-a'] });
  recordNamed('duplicate-entry', docs, batches);
}

function runSevenTerms() {
  const { docs, batches } = callDelete(PROJECT, { termIds: ['t0', 't1', 't2', 't3', 't4', 't5', 't6'] });
  recordNamed('seven-terms', docs, batches);
}

function runRest401() {
  const { docs, batches } = callDelete(PROJECT, { entryIds: restIds });
  recordNamed('rest-401', docs, batches);
}

function report() {
  if (ran !== 8196) console.log('ran ' + ran);
  if (firstPool) {
    console.log('pool failure');
    console.log('projectId ' + firstPool.projectId);
    console.log('found ' + JSON.stringify(firstPool.found));
    console.log('reason ' + firstPool.reasons.join(' '));
    console.log('docs ' + JSON.stringify(firstPool.docs));
    console.log('batches ' + JSON.stringify(firstPool.batches));
  }
  console.log('pool failures ' + poolFailures);
  for (const item of namedFailures) {
    console.log('named ' + item.label);
    console.log('lengths ' + item.lengths.join(','));
    if (item.missing) console.log('missing ' + item.missing);
    if (item.extra) console.log('extra ' + item.extra);
  }
}

function main() {
  runPool();
  runBadProject();
  runDuplicateEntry();
  runSevenTerms();
  runRest401();
  if (ran !== 8196 || poolFailures !== 0 || namedFailures.length !== 0) {
    report();
    process.exitCode = 1;
    return;
  }
  console.log('ok 8196');
}

main();
