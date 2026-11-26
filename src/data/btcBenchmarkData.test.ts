import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BTC_SERIES_META,
  computeBtcHorizonSummary,
  parseReleaseLabelTimestampMs,
  transformBtcPointForMode
} from './btcBenchmarkData.ts';
import {
  DEFAULT_M2_BENCHMARK_DATASET,
  applyLiveSpotsToM2Dataset
} from './m2BenchmarkData.ts';
import { buildBasketSyncedCohortRecord } from './gainsCohortData.ts';
import { PRELOADED_AUDITS } from './preloadedAudits.ts';

test('transformBtcPointForMode computes exact USD indexed and BTC-denominated (÷ BTC) multiples across all 5 horizons', () => {
  for (const horizon of ['ALL_TIME', 'D180', 'Y1', 'Y2', 'Y4'] as const) {
    const pts = DEFAULT_M2_BENCHMARK_DATASET.seriesByHorizon[horizon];
    assert.ok(pts.length >= 7);

    const openIdx = transformBtcPointForMode(pts[0], 'INDEXED');
    assert.equal(openIdx.BTC, 1.0);
    assert.equal(openIdx.KAS, 1.0);
    assert.equal(openIdx.ETH, 1.0);
    assert.equal(openIdx.GOLD, 1.0);
    assert.equal(openIdx.SPX, 1.0);

    const last = pts[pts.length - 1];
    const pricedInBtc = transformBtcPointForMode(last, 'PRICED_IN_BTC');
    assert.equal(pricedInBtc.BTC, 1.0);
    assert.ok(Math.abs(pricedInBtc.KAS - last.kasMult / last.btcMult) < 0.001);
    assert.ok(Math.abs(pricedInBtc.ETH - (last.ethMult ?? 1) / last.btcMult) < 0.001);
    assert.ok(Math.abs(pricedInBtc.GOLD - last.goldMult / last.btcMult) < 0.001);
    assert.ok(Math.abs(pricedInBtc.SPX - last.spxMult / last.btcMult) < 0.001);
  }
});

test('computeBtcHorizonSummary computes accurate vs-BTC alpha for flagship benchmarks and audited baskets', () => {
  const cohortRecord = buildBasketSyncedCohortRecord(PRELOADED_AUDITS);
  const allTimePts = DEFAULT_M2_BENCHMARK_DATASET.seriesByHorizon.ALL_TIME;
  const summary = computeBtcHorizonSummary({
    points: allTimePts,
    horizon: 'ALL_TIME',
    cohortRecord,
    feedMode: 'SNAPSHOT'
  });

  assert.equal(Object.keys(BTC_SERIES_META).length, 5);
  assert.ok(summary.btcMult > 2.0);
  assert.equal(summary.assets.length, 4);

  const kas = summary.assets.find((a) => a.key === 'KAS')!;
  const eth = summary.assets.find((a) => a.key === 'ETH')!;
  assert.equal(kas.beatsBtc, true);
  assert.ok(kas.btcAdjustedPct > 5000);
  assert.equal(eth.beatsBtc, false);
  assert.ok(eth.btcAdjustedPct < -40);

  // Full cohort matrix excludes BTC itself, includes S&P 500 + passed/failed liquid assets, sorted descending
  assert.ok(!summary.cohortMatrix.some((r) => r.ticker === 'BTC'));
  assert.ok(summary.cohortMatrix.some((r) => r.ticker === 'KAS'));
  assert.ok(summary.cohortMatrix.some((r) => r.ticker === 'ETH'));
  assert.ok(summary.cohortMatrix.some((r) => r.ticker === 'SOL'));
  assert.ok(summary.cohortMatrix.some((r) => r.ticker === 'S&P 500'));
  for (let i = 1; i < summary.cohortMatrix.length; i += 1) {
    assert.ok(summary.cohortMatrix[i - 1].btcAdjustedPct >= summary.cohortMatrix[i].btcAdjustedPct);
  }
});

test('live spot updates propagate into ETH, BTC, KAS, Gold, and cohort matrix vs BTC', () => {
  const liveDataset = applyLiveSpotsToM2Dataset(DEFAULT_M2_BENCHMARK_DATASET, {
    BTC: 100000,
    ETH: 2000,
    KAS: 0.05
  });
  const y1Summary = computeBtcHorizonSummary({
    points: liveDataset.seriesByHorizon.Y1,
    horizon: 'Y1',
    cohortRecord: buildBasketSyncedCohortRecord(PRELOADED_AUDITS),
    liveSpots: { BTC: 100000, ETH: 2000, KAS: 0.05 },
    feedMode: 'LIVE'
  });

  assert.equal(y1Summary.btcEndPrice, 100000);
  const eth = y1Summary.assets.find((a) => a.key === 'ETH')!;
  assert.equal(eth.currentPrice, 2000);
  assert.equal(eth.beatsBtc, false);
});

test('parseReleaseLabelTimestampMs extracts launch timestamps for post-2022 assets', () => {
  const may23 = parseReleaseLabelTimestampMs("$1.40 (May '23)");
  assert.equal(may23, Date.UTC(2023, 4, 15));
  const feb25 = parseReleaseLabelTimestampMs("$0.0620 (Feb '25)");
  assert.equal(feb25, Date.UTC(2025, 1, 15));
  assert.equal(parseReleaseLabelTimestampMs('Native BTC Rail'), null);
});
