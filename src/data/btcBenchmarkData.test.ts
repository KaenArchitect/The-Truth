import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BTC_SERIES_META,
  computeBtcHorizonSummary,
  parseReleaseLabelTimestampMs,
  transformBtcPointForMode,
  transformBtcPointNullable
} from './btcBenchmarkData.ts';
import {
  BTC_GENESIS_JUL10_PRICE,
  DEFAULT_M2_BENCHMARK_DATASET,
  applyLiveSpotsToM2Dataset,
  resolveBenchmarkSeriesForTimeline
} from './m2BenchmarkData.ts';
import { buildBasketSyncedCohortRecord } from './gainsCohortData.ts';
import { projectAuditsCollectionAtYear } from './globalTimeMachine.ts';
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

test('timelineYear PRESENT + ALL_TIME anchors BTC to Jul 10 Genesis ($0.05) and matches each asset active lifespan', () => {
  const pts = resolveBenchmarkSeriesForTimeline(
    DEFAULT_M2_BENCHMARK_DATASET,
    'PRESENT',
    'ALL_TIME'
  );
  const summary = computeBtcHorizonSummary({
    points: pts,
    horizon: 'ALL_TIME',
    timelineYear: 'PRESENT',
    cohortRecord: buildBasketSyncedCohortRecord(PRELOADED_AUDITS),
    feedMode: 'SNAPSHOT'
  });

  assert.equal(summary.windowTag, "Jul '10 Genesis");
  assert.equal(summary.btcStartPrice, BTC_GENESIS_JUL10_PRICE);

  const kas = summary.coreCards?.find((c) => c.key === 'KAS')!;
  const eth = summary.coreCards?.find((c) => c.key === 'ETH')!;
  assert.equal(kas.available, true);
  assert.equal(kas.windowNote, "Since May '22");
  assert.equal(eth.available, true);
  assert.equal(eth.windowNote, "Since Aug '15");

  // Pre-launch points return null on transformBtcPointNullable for KAS & ETH
  const jul10Nullable = transformBtcPointNullable(pts[0], 'PRICED_IN_BTC');
  assert.equal(jul10Nullable.KAS, null);
  assert.equal(jul10Nullable.ETH, null);
  assert.equal(jul10Nullable.BTC, 1.0);
});

test('historical Time Machine stops (2024, 2020, 1971) dynamically update BTC baselines, Pre-Genesis flags, and ETH historical grade', () => {
  // 2024 Open -> KAS active ($0.1118), BTC $42,265
  const pts2024 = resolveBenchmarkSeriesForTimeline(
    DEFAULT_M2_BENCHMARK_DATASET,
    '2024',
    'ALL_TIME'
  );
  const cohort2024 = buildBasketSyncedCohortRecord(
    projectAuditsCollectionAtYear(PRELOADED_AUDITS, '2024')
  );
  const sum2024 = computeBtcHorizonSummary({
    points: pts2024,
    horizon: 'ALL_TIME',
    timelineYear: '2024',
    cohortRecord: cohort2024,
    feedMode: 'SNAPSHOT'
  });
  assert.equal(sum2024.windowTag, '2024 Open');
  assert.equal(sum2024.btcStartPrice, 42265);
  assert.equal(sum2024.coreCards?.find((c) => c.key === 'KAS')?.available, true);
  assert.equal(sum2024.coreCards?.find((c) => c.key === 'KAS')?.startPrice, 0.1118);
  assert.equal(sum2024.cohortMatrix.find((r) => r.ticker === 'ETH')?.grade, 'F');

  // 2020 Open -> KAS Pre-Genesis, BTC $7,200, ETH D+ (PoW)
  const pts2020 = resolveBenchmarkSeriesForTimeline(
    DEFAULT_M2_BENCHMARK_DATASET,
    '2020',
    'ALL_TIME'
  );
  const cohort2020 = buildBasketSyncedCohortRecord(
    projectAuditsCollectionAtYear(PRELOADED_AUDITS, '2020')
  );
  const sum2020 = computeBtcHorizonSummary({
    points: pts2020,
    horizon: 'ALL_TIME',
    timelineYear: '2020',
    cohortRecord: cohort2020,
    feedMode: 'SNAPSHOT'
  });
  assert.equal(sum2020.windowTag, '2020 Open');
  assert.equal(sum2020.btcStartPrice, 7200);
  assert.equal(sum2020.coreCards?.find((c) => c.key === 'KAS')?.available, false);
  assert.equal(sum2020.assets.some((a) => a.key === 'KAS'), false);
  assert.equal(sum2020.cohortMatrix.some((r) => r.ticker === 'KAS'), false);
  const eth2020 = sum2020.cohortMatrix.find((r) => r.ticker === 'ETH')!;
  assert.equal(eth2020.grade, 'D+');
  assert.equal(eth2020.side, 'PASSED');

  // 1971 Bretton Woods -> KAS & ETH Pre-Genesis, Gold $35 (Since 1971), SPX 92.15
  const pts1971 = resolveBenchmarkSeriesForTimeline(
    DEFAULT_M2_BENCHMARK_DATASET,
    '1971',
    'ALL_TIME'
  );
  const cohort1971 = buildBasketSyncedCohortRecord(
    projectAuditsCollectionAtYear(PRELOADED_AUDITS, '1971')
  );
  const sum1971 = computeBtcHorizonSummary({
    points: pts1971,
    horizon: 'ALL_TIME',
    timelineYear: '1971',
    cohortRecord: cohort1971,
    feedMode: 'SNAPSHOT'
  });
  assert.equal(sum1971.windowTag, "Jul '10 Genesis");
  assert.equal(sum1971.btcStartPrice, BTC_GENESIS_JUL10_PRICE);
  assert.equal(sum1971.coreCards?.find((c) => c.key === 'KAS')?.available, false);
  assert.equal(sum1971.coreCards?.find((c) => c.key === 'ETH')?.available, false);
  const gold1971 = sum1971.coreCards?.find((c) => c.key === 'GOLD')!;
  assert.equal(gold1971.startPrice, 35);
  assert.equal(gold1971.windowNote, 'Since 1971');
  const spx1971 = sum1971.coreCards?.find((c) => c.key === 'SPX')!;
  assert.equal(spx1971.startPrice, 92.15);
});

