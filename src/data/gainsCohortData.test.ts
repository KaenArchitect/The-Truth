import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FAILED_COHORT_GAINS,
  MACRO_CYCLE_TRAJECTORY,
  PASSED_COHORT_GAINS,
  TACTICAL_90D_TRAJECTORY,
  applySpotPricesToCohortRecord,
  buildAuditedCohortSuggestion,
  buildBasketSyncedCohortRecord,
  computeCohortAggregateSummary,
  computeMedian,
  formatBasketUsd,
  formatPctSigned,
  formatUsdPrice,
  getCohortSyncSignature,
  getDefaultGainsCohortRecord,
  removeAssetFromCohortRecord,
  sanitizeGainsCohortRecord,
  upsertAssetInCohortRecord
} from './gainsCohortData.ts';
import { PRELOADED_AUDITS } from './preloadedAudits.ts';

test('empirical cohort asset counts and terminal trajectory invariants match spec', () => {
  assert.equal(PASSED_COHORT_GAINS.length, 14);
  assert.equal(FAILED_COHORT_GAINS.length, 13);

  const liquidPassed = PASSED_COHORT_GAINS.filter((a) => a.liquidCycle);
  const liquidFailed = FAILED_COHORT_GAINS.filter((a) => a.liquidCycle);
  assert.equal(liquidPassed.length, 12);
  assert.equal(liquidFailed.length, 13);

  assert.equal(MACRO_CYCLE_TRAJECTORY.length, 9);
  assert.equal(TACTICAL_90D_TRAJECTORY.length, 7);
});

test('computeMedian calculates odd, even, and empty collections accurately', () => {
  assert.equal(computeMedian([]), 0);
  assert.equal(computeMedian([10]), 10);
  assert.equal(computeMedian([30, 10, 20]), 20);
  assert.equal(computeMedian([40, 10, 30, 20]), 25);
});

test('price, basket, and signed percentage formatters render clean display strings', () => {
  assert.equal(formatUsdPrice(null), '—');
  assert.equal(formatUsdPrice(75835), '$75,835');
  assert.equal(formatUsdPrice(12.5), '$12.50');
  assert.equal(formatUsdPrice(0.042), '$0.0420');
  assert.equal(formatUsdPrice(0.0001859), '$0.0001859');

  assert.equal(formatBasketUsd(2540000), '$2.54M');
  assert.equal(formatBasketUsd(42500), '$42.5K');
  assert.equal(formatBasketUsd(1500), '$1,500');
  assert.equal(formatBasketUsd(-250), '-$250');

  assert.equal(formatPctSigned(null), '—');
  assert.equal(formatPctSigned(2015.4), '+2,015%');
  assert.equal(formatPctSigned(-11.74), '-11.7%');
  assert.equal(formatPctSigned(18.5), '+18.5%');
});

test('upsertAssetInCohortRecord adds, moves, and updates cohort assets cleanly', () => {
  const base = getDefaultGainsCohortRecord();
  const added = upsertAssetInCohortRecord(base, 'FAILED', {
    ticker: '$pi',
    name: 'Pi Network',
    grade: 'F',
    auditScore: 0,
    basePrice: 1.5,
    snapshotSpot: 0.45,
    tactical90dPct: -12.4,
    note: 'Mobile FBA clicker token'
  });

  assert.equal(added.isCustomized, true);
  assert.equal(added.revision, base.revision + 1);
  assert.equal(added.failed.length, 14);
  assert.equal(added.failed[0].ticker, 'PI');
  assert.equal(added.failed[0].liquidCycle, true);

  // Moving same ticker to PASSED removes from FAILED without duplicating
  const moved = upsertAssetInCohortRecord(added, 'PASSED', {
    ticker: 'PI',
    name: 'Pi Network',
    grade: 'C',
    auditScore: 3.1,
    basePrice: 1.5,
    snapshotSpot: 2.0
  });
  assert.equal(moved.passed.some((a) => a.ticker === 'PI'), true);
  assert.equal(moved.failed.some((a) => a.ticker === 'PI'), false);

  const removed = removeAssetFromCohortRecord(moved, 'PI');
  assert.equal(removed.passed.length, 14);
  assert.equal(removed.failed.length, 13);
});

test('applySpotPricesToCohortRecord updates spots and sanitizeGainsCohortRecord guards bounds', () => {
  const base = getDefaultGainsCohortRecord();
  const { nextRecord, updatedTickers } = applySpotPricesToCohortRecord(base, {
    BTC: 91250,
    ETH: 3100,
    NONEXISTENT: 123
  });
  assert.deepEqual(updatedTickers, ['BTC', 'ETH']);
  assert.equal(nextRecord.passed.find((a) => a.ticker === 'BTC')?.snapshotSpot, 91250);
  assert.equal(nextRecord.failed.find((a) => a.ticker === 'ETH')?.snapshotSpot, 3100);

  const sanitized = sanitizeGainsCohortRecord({
    passed: [{ ticker: 'kas', name: 'Kaspa', basePrice: 0.0001859, snapshotSpot: 0.05 } as never],
    failed: []
  });
  assert.equal(sanitized.passed.length, 1);
  assert.equal(sanitized.passed[0].ticker, 'KAS');
  assert.equal(sanitized.failed.length, FAILED_COHORT_GAINS.length);
});

test('buildAuditedCohortSuggestion and computeCohortAggregateSummary derive dynamic metrics', () => {
  const suggestion = buildAuditedCohortSuggestion({
    ticker: 'PI',
    name: 'Pi Network',
    grade: 'F',
    totalScore: 0,
    consensusFamily: 'ZERO_JOULE_BFT',
    invariants: [{ id: '01', score: 0 }, { id: '02', score: 0 }]
  });
  assert.equal(suggestion?.suggestedCohort, 'FAILED');
  assert.equal(suggestion?.ticker, 'PI');

  const dynamicSummary = computeCohortAggregateSummary(
    [
      { ticker: 'BTC', cyclePct: 200, multiple: 3, tactical90dPct: 20, liquidCycle: true, isOutlier: false },
      { ticker: 'KAS', cyclePct: 1000, multiple: 11, tactical90dPct: 10, liquidCycle: true, isOutlier: true }
    ],
    [
      { ticker: 'ADA', cyclePct: -50, multiple: 0.5, tactical90dPct: -5, liquidCycle: true, isOutlier: false }
    ],
    1000,
    false
  );
  assert.equal(dynamicSummary.passCycleAvg, 600);
  assert.equal(dynamicSummary.passExKasAvg, 200);
  assert.equal(dynamicSummary.passEndDollars, 14000);
  assert.equal(dynamicSummary.passExEndDollars, 3000);
  assert.equal(dynamicSummary.failEndDollars, 500);
  assert.equal(dynamicSummary.portfolioVictoryMultiple, '28.0');
});

test('buildBasketSyncedCohortRecord mirrors audited baskets 1:1 and preserves persisted spots', () => {
  const syncedBase = buildBasketSyncedCohortRecord(PRELOADED_AUDITS);
  const preloadedPassCount = Object.values(PRELOADED_AUDITS).filter(
    (a) => a.totalScore > 1 && a.grade !== 'F'
  ).length;
  const preloadedFailCount = Object.values(PRELOADED_AUDITS).filter(
    (a) => a.totalScore <= 1 || a.grade === 'F'
  ).length;

  assert.equal(syncedBase.passed.length, preloadedPassCount);
  assert.equal(syncedBase.failed.length, preloadedFailCount);
  assert.equal(syncedBase.failed.some((a) => a.ticker === 'PI'), true);
  assert.equal(syncedBase.passed.some((a) => a.ticker === 'QUAI'), false);

  // Adding a new audit automatically syncs it into the matching cohort list and retains empirical prices if cataloged
  const extendedMap = {
    ...PRELOADED_AUDITS,
    QUAI: {
      ticker: 'QUAI',
      name: 'Quai Network',
      grade: 'D+',
      totalScore: 2.05,
      consensusFamily: 'LINEAR_POW',
      architecture: 'PoEM Merged Mining',
      invariants: [{ id: '01', score: 0.4 }, { id: '02', score: 0.5 }]
    },
    DOGE: {
      ticker: 'DOGE',
      name: 'Dogecoin',
      grade: 'C',
      totalScore: 3.1,
      consensusFamily: 'LINEAR_POW',
      architecture: 'AuxPoW Scrypt',
      invariants: [{ id: '01', score: 0.9 }, { id: '02', score: 0.6 }]
    }
  };

  const persistedWithBtcLive = applySpotPricesToCohortRecord(syncedBase, { BTC: 88888 }).nextRecord;
  const syncedExtended = buildBasketSyncedCohortRecord(extendedMap, persistedWithBtcLive);

  assert.equal(syncedExtended.passed.length, preloadedPassCount + 2);
  assert.equal(syncedExtended.passed.find((a) => a.ticker === 'QUAI')?.liquidCycle, true);
  assert.equal(syncedExtended.passed.find((a) => a.ticker === 'DOGE')?.liquidCycle, false);
  assert.equal(syncedExtended.passed.find((a) => a.ticker === 'BTC')?.snapshotSpot, 88888);
  assert.notEqual(
    getCohortSyncSignature(syncedBase),
    getCohortSyncSignature(syncedExtended)
  );
});


