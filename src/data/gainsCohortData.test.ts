import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FAILED_COHORT_GAINS,
  MACRO_CYCLE_TRAJECTORY,
  PASSED_COHORT_GAINS,
  RELEASE_COHORT_TRAJECTORY,
  TACTICAL_90D_TRAJECTORY,
  applySpotPricesToCohortRecord,
  buildAuditedCohortSuggestion,
  buildBasketSyncedCohortRecord,
  buildFallbackWindowTrajectory,
  buildNiceYGridTicks,
  computeCohortAggregateSummary,
  computeCohortLiquidMetricsList,
  computeMedian,
  formatBasketUsd,
  formatPctSigned,
  formatUsdPrice,
  getCohortSyncSignature,
  getDefaultGainsCohortRecord,
  removeAssetFromCohortRecord,
  resolveCohortBaselinePrice,
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

  assert.equal(RELEASE_COHORT_TRAJECTORY.length, 7);
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

  assert.equal(formatBasketUsd(1_420_000_000), '$1.42B');
  assert.equal(formatBasketUsd(2540000), '$2.54M');
  assert.equal(formatBasketUsd(42500), '$42.5K');
  assert.equal(formatBasketUsd(1500), '$1,500');
  assert.equal(formatBasketUsd(-250), '-$250');

  assert.equal(formatPctSigned(null), '—');
  assert.equal(formatPctSigned(14_100_000), '+14.1M%');
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
      { ticker: 'KAS', cyclePct: 1000, multiple: 11, tactical90dPct: 10, liquidCycle: true, isOutlier: false }
    ],
    [
      { ticker: 'TAO', cyclePct: 250, multiple: 3.5, tactical90dPct: 8, liquidCycle: true, isOutlier: false },
      { ticker: 'ADA', cyclePct: -50, multiple: 0.5, tactical90dPct: -5, liquidCycle: true, isOutlier: false }
    ],
    1000,
    false
  );
  // E > 0 trims its highest percentage gain (KAS +1000% -> leaves BTC +200%)
  assert.equal(dynamicSummary.passExOutlierTicker, 'KAS');
  assert.equal(dynamicSummary.passExOutlierAvg, 200);
  // E = 0 trims its highest percentage gain (TAO +250% -> leaves ADA -50%)
  assert.equal(dynamicSummary.failExOutlierTicker, 'TAO');
  assert.equal(dynamicSummary.failExOutlierAvg, -50);
  assert.equal(dynamicSummary.passEndDollars, 14000);
  assert.equal(dynamicSummary.passExEndDollars, 3000);
  assert.equal(dynamicSummary.failEndDollars, 4000);
  assert.equal(dynamicSummary.failExEndDollars, 500);
  assert.equal(dynamicSummary.portfolioVictoryMultiple, '3.5');
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
  assert.equal(syncedExtended.failed.find((a) => a.ticker === 'PI')?.liquidCycle, true);
  assert.equal(syncedExtended.passed.find((a) => a.ticker === 'BTC')?.snapshotSpot, 88888);
  assert.notEqual(
    getCohortSyncSignature(syncedBase),
    getCohortSyncSignature(syncedExtended)
  );
});

test('resolveCohortBaselinePrice, computeCohortLiquidMetricsList, and releaseOverrides default to Since-Release baselines', () => {
  const btc = PASSED_COHORT_GAINS.find((a) => a.ticker === 'BTC')!;
  const rel = resolveCohortBaselinePrice(btc, 'RELEASE');
  const cyc = resolveCohortBaselinePrice(btc, 'CYCLE');
  assert.equal(rel.price, 0.05);
  assert.equal(cyc.price, 29455.76);

  const releaseMetrics = computeCohortLiquidMetricsList(PASSED_COHORT_GAINS, 'RELEASE', {
    BTC: 65000
  });
  const btcMetric = releaseMetrics.find((m) => m.ticker === 'BTC')!;
  assert.equal(btcMetric.multiple, 65000 / 0.05);
  assert.ok((btcMetric.cyclePct || 0) > 100_000_000);

  // Dynamic asset without catalog releasePrice gets unlocked via releaseOverrides
  const customRecord = upsertAssetInCohortRecord(getDefaultGainsCohortRecord(), 'PASSED', {
    ticker: 'DOGE',
    name: 'Dogecoin',
    grade: 'C',
    auditScore: 3.1
  });
  assert.equal(customRecord.passed.find((a) => a.ticker === 'DOGE')?.liquidCycle, false);

  const { nextRecord, updatedTickers } = applySpotPricesToCohortRecord(
    customRecord,
    { DOGE: 0.18 },
    'Live Sync',
    {
      DOGE: {
        releasePrice: 0.0005,
        releaseLabel: "$0.0005 (Dec '13)",
        price180d: 0.11,
        price1y: 0.14,
        price2y: 0.2,
        price4y: 0.08,
        yahooSymbol: 'DOGE-USD'
      }
    }
  );
  assert.deepEqual(updatedTickers, ['DOGE']);
  const doge = nextRecord.passed.find((a) => a.ticker === 'DOGE')!;
  assert.equal(doge.releasePrice, 0.0005);
  assert.equal(doge.price180d, 0.11);
  assert.equal(doge.price1y, 0.14);
  assert.equal(doge.price2y, 0.2);
  assert.equal(doge.price4y, 0.08);
  assert.equal(doge.snapshotSpot, 0.18);
  assert.equal(doge.liquidCycle, true);
});

test('180D, 1Y, 2Y, and 4Y baselines resolve accurately and exclude pre-launch assets', () => {
  const quai = PASSED_COHORT_GAINS.find((a) => a.ticker === 'QUAI')!;
  assert.ok(resolveCohortBaselinePrice(quai, 'D180').price! > 0);
  assert.ok(resolveCohortBaselinePrice(quai, 'Y1').price! > 0);
  assert.equal(resolveCohortBaselinePrice(quai, 'Y2').price, null);
  assert.equal(resolveCohortBaselinePrice(quai, 'Y4').price, null);
  assert.equal(resolveCohortBaselinePrice(quai, 'Y4').label, 'Pre-Launch / N/A');

  const y4Pass = computeCohortLiquidMetricsList(PASSED_COHORT_GAINS, 'Y4');
  assert.equal(y4Pass.some((m) => m.ticker === 'QUAI'), false);
  assert.equal(y4Pass.some((m) => m.ticker === 'BTC'), true);
  assert.equal(y4Pass.some((m) => m.ticker === 'KAS'), true);

  const y4Fail = computeCohortLiquidMetricsList(FAILED_COHORT_GAINS, 'Y4');
  assert.equal(y4Fail.some((m) => m.ticker === 'TAO'), false);
  assert.equal(y4Fail.some((m) => m.ticker === 'SUI'), false);
  assert.equal(y4Fail.some((m) => m.ticker === 'ETH'), true);

  const logTicks = buildNiceYGridTicks(0.5, 140000, true);
  assert.ok(logTicks.includes(1));
  assert.ok(logTicks.includes(1000));

  const linTicks = buildNiceYGridTicks(0.42, 1.85, false);
  assert.ok(linTicks.includes(1));
  assert.ok(linTicks.length >= 3);

  const fallbackY1 = buildFallbackWindowTrajectory('Y1', {
    passCycleAvg: 42,
    passExOutlierAvg: 18,
    failCycleAvg: -35,
    failExOutlierAvg: -22
  });
  assert.equal(fallbackY1.length, 7);
  assert.equal(fallbackY1[0].passAll, 1.0);
  assert.equal(fallbackY1[6].label, 'Now');
  assert.ok(Math.abs(fallbackY1[6].passAll - 1.42) < 0.001);
});

test('portfolioVictoryMultiple normalizes by equal capital invested when active cohort counts differ', () => {
  const unequalSummary = computeCohortAggregateSummary(
    [{ ticker: 'BTC', cyclePct: 10, multiple: 1.1, tactical90dPct: null, liquidCycle: true, isOutlier: false }],
    [
      { ticker: 'ETH', cyclePct: -20, multiple: 0.8, tactical90dPct: null, liquidCycle: true, isOutlier: false },
      { ticker: 'SOL', cyclePct: -30, multiple: 0.7, tactical90dPct: null, liquidCycle: true, isOutlier: false }
    ],
    1000,
    false
  );
  // $1,100 / $1,000 = 1.10x vs $1,500 / $2,000 = 0.75x -> 1.10 / 0.75 = 1.466... -> '1.5' (not raw 1100/1500 = '0.7')
  assert.equal(unequalSummary.passEndDollars, 1100);
  assert.equal(unequalSummary.failEndDollars, 1500);
  assert.equal(unequalSummary.portfolioVictoryMultiple, '1.5');
});





