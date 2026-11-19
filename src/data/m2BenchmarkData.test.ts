import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_M2_BENCHMARK_DATASET,
  KAS_GENESIS_MAY22_PRICE,
  applyLiveSpotsToM2Dataset,
  buildM2SeriesFromBars,
  computeM2AssetSummaries,
  findM2BillionsAt,
  parseFredM2Csv,
  transformM2PointForMode
} from './m2BenchmarkData.ts';

test('parseFredM2Csv parses valid FRED rows, skips missing dots, and sorts chronologically', () => {
  const sampleCsv = [
    'observation_date,M2SL',
    '2024-11-01,21429.3',
    '2025-01-01,.',
    '2022-05-01,21700.2',
    '2026-09-01,23413.9'
  ].join('\n');

  const rows = parseFredM2Csv(sampleCsv);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].dateStr, '2022-05-01');
  assert.equal(rows[0].billions, 21700.2);
  assert.equal(rows[2].dateStr, '2026-09-01');
  assert.equal(rows[2].billions, 23413.9);

  const hit = findM2BillionsAt(rows, Date.parse('2025-06-15T00:00:00Z'));
  assert.equal(hit?.dateStr, '2024-11-01');
  assert.equal(hit?.billions, 21429.3);
});

test('buildM2SeriesFromBars aligns all 4 assets + US M2 across 5 horizons and computes real M2 returns', () => {
  const m2Rows = parseFredM2Csv(
    [
      'observation_date,M2SL',
      '2022-05-01,21700',
      '2024-11-01,21400',
      '2025-11-01,22250',
      '2026-05-01,23000',
      '2026-09-01,23870'
    ].join('\n')
  );

  const nowMs = Date.UTC(2026, 10, 18);
  const day = 86400000;
  const btcBars = [
    { tsMs: Date.UTC(2022, 4, 30), price: 30000 },
    { tsMs: nowMs - 1461 * day, price: 16500 },
    { tsMs: nowMs - 730 * day, price: 90000 },
    { tsMs: nowMs - 365 * day, price: 85000 },
    { tsMs: nowMs - 180 * day, price: 72000 },
    { tsMs: nowMs, price: 63000 }
  ];
  const kasBars = [
    { tsMs: Date.UTC(2022, 4, 30), price: 0.0005 },
    { tsMs: nowMs - 1461 * day, price: 0.009 },
    { tsMs: nowMs - 730 * day, price: 0.15 },
    { tsMs: nowMs - 365 * day, price: 0.04 },
    { tsMs: nowMs - 180 * day, price: 0.03 },
    { tsMs: nowMs, price: 0.027 }
  ];
  const spxBars = [
    { tsMs: Date.UTC(2022, 4, 30), price: 4100 },
    { tsMs: nowMs - 1461 * day, price: 4000 },
    { tsMs: nowMs - 730 * day, price: 5950 },
    { tsMs: nowMs - 365 * day, price: 6600 },
    { tsMs: nowMs - 180 * day, price: 7500 },
    { tsMs: nowMs, price: 7300 }
  ];
  const goldBars = [
    { tsMs: Date.UTC(2022, 4, 30), price: 1850 },
    { tsMs: nowMs - 1461 * day, price: 1750 },
    { tsMs: nowMs - 730 * day, price: 2700 },
    { tsMs: nowMs - 365 * day, price: 4050 },
    { tsMs: nowMs - 180 * day, price: 4550 },
    { tsMs: nowMs, price: 3780 }
  ];

  const built = buildM2SeriesFromBars({
    m2Rows,
    btcBars,
    kasBars,
    spxBars,
    goldBars,
    spots: { btc: 63000, kas: 0.027, spx: 7300, gold: 3780 },
    nowMs
  });

  // ALL_TIME starts at 1.0x across all 5 series with KAS anchored at May '22 genesis open
  assert.equal(built.ALL_TIME.length, 17);
  assert.equal(built.ALL_TIME[0].kasPrice, KAS_GENESIS_MAY22_PRICE);
  assert.equal(built.ALL_TIME[0].m2Mult, 1);
  assert.equal(built.ALL_TIME[0].btcMult, 1);
  assert.equal(built.ALL_TIME[0].spxMult, 1);
  assert.equal(built.ALL_TIME[0].goldMult, 1);

  const last = built.ALL_TIME[built.ALL_TIME.length - 1];
  assert.equal(last.label, 'Now');
  assert.ok(Math.abs(last.m2Mult - 23870 / 21700) < 0.001);
  assert.ok(Math.abs(last.btcMult - 63000 / 30000) < 0.001);

  const summary = computeM2AssetSummaries(built.ALL_TIME);
  assert.ok(Math.abs(summary.m2Pct - 10.0) < 0.1);
  const btcSummary = summary.assets.find((a) => a.key === 'BTC')!;
  // Nominal BTC 2.1x, M2 1.1x -> Real M2-Adjusted = 2.1 / 1.1 = 1.909x (+90.9%)
  assert.ok(Math.abs(btcSummary.m2AdjustedMult - 2.1 / 1.1) < 0.01);
  assert.equal(btcSummary.beatsM2, true);

  const deflated = transformM2PointForMode(last, 'REAL_DIV_M2');
  assert.equal(deflated.M2, 1.0);
  assert.ok(Math.abs(deflated.BTC - last.btcMult / last.m2Mult) < 0.001);
});

test('DEFAULT_M2_BENCHMARK_DATASET and applyLiveSpotsToM2Dataset maintain valid baselines', () => {
  for (const key of ['ALL_TIME', 'D180', 'Y1', 'Y2', 'Y4'] as const) {
    const pts = DEFAULT_M2_BENCHMARK_DATASET.seriesByHorizon[key];
    assert.ok(pts.length >= 7);
    assert.equal(pts[0].m2Mult, 1);
    assert.equal(pts[pts.length - 1].label, 'Now');
  }

  const synced = applyLiveSpotsToM2Dataset(DEFAULT_M2_BENCHMARK_DATASET, {
    BTC: 90000,
    KAS: 0.05
  });
  const allTimeLast = synced.seriesByHorizon.ALL_TIME[synced.seriesByHorizon.ALL_TIME.length - 1];
  assert.equal(allTimeLast.btcPrice, 90000);
  assert.equal(allTimeLast.kasPrice, 0.05);
  assert.ok(allTimeLast.btcMult > 3.0);
});
