export type MacroM2HorizonKey = 'ALL_TIME' | 'D180' | 'Y1' | 'Y2' | 'Y4';
export type M2SeriesKey = 'KAS' | 'BTC' | 'GOLD' | 'SPX' | 'M2';
export type M2ComparisonMode = 'INDEXED' | 'REAL_DIV_M2';

export interface HistoricalPriceBar {
  tsMs: number;
  price: number;
}

export interface FredM2Row {
  tsMs: number;
  dateStr: string;
  billions: number;
}

export interface M2ChartPoint {
  tsMs: number;
  label: string;
  event: string;
  m2Trillions: number;
  m2Mult: number;
  kasMult: number;
  btcMult: number;
  ethMult?: number;
  spxMult: number;
  goldMult: number;
  kasPrice: number;
  btcPrice: number;
  ethPrice?: number;
  spxPrice: number;
  goldPrice: number;
}

export interface M2SeriesMeta {
  key: M2SeriesKey;
  ticker: string;
  name: string;
  color: string;
  dashed?: boolean;
}

export const M2_SERIES_META: Record<M2SeriesKey, M2SeriesMeta> = {
  KAS: {
    key: 'KAS',
    ticker: 'KAS',
    name: 'Kaspa',
    color: '#49EACB'
  },
  BTC: {
    key: 'BTC',
    ticker: 'BTC',
    name: 'Bitcoin',
    color: '#F59E0B'
  },
  GOLD: {
    key: 'GOLD',
    ticker: 'XAU',
    name: 'Gold',
    color: '#FACC15'
  },
  SPX: {
    key: 'SPX',
    ticker: 'S&P 500',
    name: 'S&P 500 Index',
    color: '#60A5FA'
  },
  M2: {
    key: 'M2',
    ticker: 'US M2',
    name: 'US M2 Money Supply',
    color: '#CBD5E1',
    dashed: true
  }
};

export interface M2AssetSummary {
  key: Exclude<M2SeriesKey, 'M2'>;
  ticker: string;
  name: string;
  color: string;
  startPrice: number;
  currentPrice: number;
  nominalMult: number;
  nominalPct: number;
  m2AdjustedMult: number;
  m2AdjustedPct: number;
  beatsM2: boolean;
}

export interface M2HorizonSummary {
  m2StartTrillions: number;
  m2EndTrillions: number;
  m2Mult: number;
  m2Pct: number;
  assets: M2AssetSummary[];
}

export interface M2BenchmarkDataset {
  updatedAtMs: number;
  sourceLabel: string;
  isLive: boolean;
  latestM2Trillions: number;
  latestM2Date: string;
  seriesByHorizon: Record<MacroM2HorizonKey, M2ChartPoint[]>;
}

export const KAS_GENESIS_MAY22_PRICE = 0.0001859;
export const KAS_GENESIS_MAY22_MS = Date.UTC(2022, 4, 30, 0, 0, 0);
const DAY_MS = 24 * 60 * 60 * 1000;

export function parseFredM2Csv(csvText: string): FredM2Row[] {
  if (!csvText || typeof csvText !== 'string') return [];
  const lines = csvText.trim().split(/\r?\n/);
  const rows: FredM2Row[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    const [dateStr, rawVal] = line.split(',');
    if (!dateStr || !rawVal || rawVal === '.') continue;
    const tsMs = Date.parse(`${dateStr.trim()}T00:00:00Z`);
    const billions = Number(rawVal.trim());
    if (Number.isFinite(tsMs) && Number.isFinite(billions) && billions > 0) {
      rows.push({ tsMs, dateStr: dateStr.trim(), billions });
    }
  }
  rows.sort((a, b) => a.tsMs - b.tsMs);
  return rows;
}

export function findM2BillionsAt(rows: FredM2Row[], targetMs: number): FredM2Row | null {
  if (!rows || rows.length === 0) return null;
  let chosen = rows[0];
  for (const row of rows) {
    if (row.tsMs <= targetMs) {
      chosen = row;
    } else {
      break;
    }
  }
  return chosen;
}

export function findClosestBarPrice(
  bars: HistoricalPriceBar[],
  targetMs: number
): number | null {
  if (!bars || bars.length === 0) return null;
  let best = bars[0];
  let bestDiff = Math.abs(best.tsMs - targetMs);
  for (let i = 1; i < bars.length; i += 1) {
    const diff = Math.abs(bars[i].tsMs - targetMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = bars[i];
    }
  }
  return Number.isFinite(best.price) && best.price > 0 ? best.price : null;
}

function formatCheckpointDate(tsMs: number, horizon: MacroM2HorizonKey): string {
  const d = new Date(tsMs);
  const mon = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = d.getUTCDate();
  const yr = String(d.getUTCFullYear()).slice(-2);
  if (horizon === 'D180') {
    return `${mon} ${day}`;
  }
  return `${mon} '${yr}`;
}

export function buildM2SeriesFromBars(params: {
  m2Rows: FredM2Row[];
  btcBars: HistoricalPriceBar[];
  kasBars: HistoricalPriceBar[];
  ethBars?: HistoricalPriceBar[];
  spxBars: HistoricalPriceBar[];
  goldBars: HistoricalPriceBar[];
  spots: { btc: number; kas: number; eth?: number; spx: number; gold: number };
  nowMs?: number;
}): Record<MacroM2HorizonKey, M2ChartPoint[]> {
  const { m2Rows, btcBars, kasBars, ethBars, spxBars, goldBars, spots } = params;
  const nowMs = params.nowMs ?? Date.now();

  const horizons: Array<{
    key: MacroM2HorizonKey;
    startMs: number;
    steps: number;
    startEvent: string;
    endEvent: string;
  }> = [
    {
      key: 'ALL_TIME',
      startMs: KAS_GENESIS_MAY22_MS,
      steps: 17,
      startEvent: 'May 2022 Common Open (KAS Fair Launch)',
      endEvent: 'Live Spot vs FRED US M2'
    },
    {
      key: 'D180',
      startMs: nowMs - 180 * DAY_MS,
      steps: 13,
      startEvent: '180-Day Window Open',
      endEvent: 'Live 180D Spot vs US M2'
    },
    {
      key: 'Y1',
      startMs: nowMs - 365 * DAY_MS,
      steps: 13,
      startEvent: '1-Year Window Open',
      endEvent: 'Live 1Y Spot vs US M2'
    },
    {
      key: 'Y2',
      startMs: nowMs - 730 * DAY_MS,
      steps: 13,
      startEvent: '2-Year Window Open',
      endEvent: 'Live 2Y Spot vs US M2'
    },
    {
      key: 'Y4',
      startMs: nowMs - 1461 * DAY_MS,
      steps: 17,
      startEvent: '4-Year Cycle Window Open',
      endEvent: 'Live 4Y Spot vs US M2'
    }
  ];

  const out = {} as Record<MacroM2HorizonKey, M2ChartPoint[]>;

  for (const h of horizons) {
    const startTs = Math.min(h.startMs, nowMs - 7 * DAY_MS);
    const m2BaseRow = findM2BillionsAt(m2Rows, startTs);
    const m2BaseB = m2BaseRow?.billions ?? 21700.2;

    const btcBase = findClosestBarPrice(btcBars, startTs) ?? spots.btc;
    const kasBase =
      h.key === 'ALL_TIME'
        ? KAS_GENESIS_MAY22_PRICE
        : findClosestBarPrice(kasBars, startTs) ?? spots.kas;
    const ethSpotFallback = spots.eth && spots.eth > 0 ? spots.eth : 1782.23;
    const ethBase =
      ethBars && ethBars.length > 0
        ? findClosestBarPrice(ethBars, startTs) ?? ethSpotFallback
        : h.key === 'ALL_TIME'
        ? 1940.0
        : ethSpotFallback;
    const spxBase = findClosestBarPrice(spxBars, startTs) ?? spots.spx;
    const goldBase = findClosestBarPrice(goldBars, startTs) ?? spots.gold;

    const points: M2ChartPoint[] = [];
    for (let i = 0; i < h.steps; i += 1) {
      const frac = i / Math.max(1, h.steps - 1);
      const tsMs = startTs + frac * (nowMs - startTs);
      const isStart = i === 0;
      const isEnd = i === h.steps - 1;

      const m2Row = findM2BillionsAt(m2Rows, tsMs);
      const m2Billions = isStart ? m2BaseB : m2Row?.billions ?? m2BaseB;
      const btcPrice = isStart
        ? btcBase
        : isEnd
        ? spots.btc
        : findClosestBarPrice(btcBars, tsMs) ?? btcBase;
      const kasPrice = isStart
        ? kasBase
        : isEnd
        ? spots.kas
        : findClosestBarPrice(kasBars, tsMs) ?? kasBase;
      const ethPrice = isStart
        ? ethBase
        : isEnd
        ? ethSpotFallback
        : ethBars && ethBars.length > 0
        ? findClosestBarPrice(ethBars, tsMs) ?? ethBase
        : ethBase;
      const spxPrice = isStart
        ? spxBase
        : isEnd
        ? spots.spx
        : findClosestBarPrice(spxBars, tsMs) ?? spxBase;
      const goldPrice = isStart
        ? goldBase
        : isEnd
        ? spots.gold
        : findClosestBarPrice(goldBars, tsMs) ?? goldBase;

      const m2Mult = m2Billions / m2BaseB;
      const btcMult = btcPrice / btcBase;
      const kasMult = kasPrice / kasBase;
      const ethMult = ethBase > 0 ? ethPrice / ethBase : 1.0;
      const spxMult = spxPrice / spxBase;
      const goldMult = goldPrice / goldBase;

      const dateText = isEnd ? 'Now' : formatCheckpointDate(tsMs, h.key);
      points.push({
        tsMs,
        label: dateText,
        event: isStart
          ? h.startEvent
          : isEnd
          ? h.endEvent
          : `${formatCheckpointDate(tsMs, h.key)} Benchmark`,
        m2Trillions: Number((m2Billions / 1000).toFixed(2)),
        m2Mult: Number(m2Mult.toFixed(4)),
        kasMult: Number(Math.max(0.01, kasMult).toFixed(4)),
        btcMult: Number(Math.max(0.01, btcMult).toFixed(4)),
        ethMult: Number(Math.max(0.01, ethMult).toFixed(4)),
        spxMult: Number(Math.max(0.01, spxMult).toFixed(4)),
        goldMult: Number(Math.max(0.01, goldMult).toFixed(4)),
        kasPrice,
        btcPrice,
        ethPrice,
        spxPrice,
        goldPrice
      });
    }
    out[h.key] = points;
  }

  return out;
}

export function applyLiveSpotsToM2Dataset(
  dataset: M2BenchmarkDataset,
  liveSpots: Record<string, number>
): M2BenchmarkDataset {
  const btcSpot = Number(liveSpots.BTC);
  const kasSpot = Number(liveSpots.KAS);
  const ethSpot = Number(liveSpots.ETH);
  const goldSpot = Number(liveSpots.XAU);
  const spxSpot = Number(liveSpots.SPX);

  const hasAny =
    (Number.isFinite(btcSpot) && btcSpot > 0) ||
    (Number.isFinite(kasSpot) && kasSpot > 0) ||
    (Number.isFinite(ethSpot) && ethSpot > 0) ||
    (Number.isFinite(goldSpot) && goldSpot > 0) ||
    (Number.isFinite(spxSpot) && spxSpot > 0);
  if (!hasAny) return dataset;

  const updatedSeries = {} as Record<MacroM2HorizonKey, M2ChartPoint[]>;
  for (const key of Object.keys(dataset.seriesByHorizon) as MacroM2HorizonKey[]) {
    const arr = dataset.seriesByHorizon[key];
    if (!arr || arr.length < 2) {
      updatedSeries[key] = arr;
      continue;
    }
    const first = arr[0];
    const last = arr[arr.length - 1];
    const nextBtcPrice = Number.isFinite(btcSpot) && btcSpot > 0 ? btcSpot : last.btcPrice;
    const nextKasPrice = Number.isFinite(kasSpot) && kasSpot > 0 ? kasSpot : last.kasPrice;
    const nextEthPrice =
      Number.isFinite(ethSpot) && ethSpot > 0 ? ethSpot : last.ethPrice ?? 1782.23;
    const nextGoldPrice = Number.isFinite(goldSpot) && goldSpot > 0 ? goldSpot : last.goldPrice;
    const nextSpxPrice = Number.isFinite(spxSpot) && spxSpot > 0 ? spxSpot : last.spxPrice;
    const firstEthPrice = first.ethPrice && first.ethPrice > 0 ? first.ethPrice : nextEthPrice;

    const nextLast: M2ChartPoint = {
      ...last,
      btcPrice: nextBtcPrice,
      kasPrice: nextKasPrice,
      ethPrice: nextEthPrice,
      goldPrice: nextGoldPrice,
      spxPrice: nextSpxPrice,
      btcMult: first.btcPrice > 0 ? Number((nextBtcPrice / first.btcPrice).toFixed(4)) : last.btcMult,
      kasMult: first.kasPrice > 0 ? Number((nextKasPrice / first.kasPrice).toFixed(4)) : last.kasMult,
      ethMult:
        firstEthPrice > 0
          ? Number((nextEthPrice / firstEthPrice).toFixed(4))
          : last.ethMult ?? 1.0,
      goldMult:
        first.goldPrice > 0 ? Number((nextGoldPrice / first.goldPrice).toFixed(4)) : last.goldMult,
      spxMult: first.spxPrice > 0 ? Number((nextSpxPrice / first.spxPrice).toFixed(4)) : last.spxMult
    };
    updatedSeries[key] = [...arr.slice(0, -1), nextLast];
  }

  return {
    ...dataset,
    seriesByHorizon: updatedSeries
  };
}

export function transformM2PointForMode(
  pt: M2ChartPoint,
  mode: M2ComparisonMode
): Record<M2SeriesKey, number> {
  if (mode === 'REAL_DIV_M2') {
    const denom = Math.max(0.05, pt.m2Mult);
    return {
      KAS: Math.max(0.01, pt.kasMult / denom),
      BTC: Math.max(0.01, pt.btcMult / denom),
      GOLD: Math.max(0.01, pt.goldMult / denom),
      SPX: Math.max(0.01, pt.spxMult / denom),
      M2: 1.0
    };
  }
  return {
    KAS: Math.max(0.01, pt.kasMult),
    BTC: Math.max(0.01, pt.btcMult),
    GOLD: Math.max(0.01, pt.goldMult),
    SPX: Math.max(0.01, pt.spxMult),
    M2: Math.max(0.01, pt.m2Mult)
  };
}

export function computeM2AssetSummaries(points: M2ChartPoint[]): M2HorizonSummary {
  if (!points || points.length === 0) {
    return {
      m2StartTrillions: 21.7,
      m2EndTrillions: 23.41,
      m2Mult: 1.079,
      m2Pct: 7.9,
      assets: []
    };
  }
  const first = points[0];
  const last = points[points.length - 1];
  const m2Mult = last.m2Mult > 0 ? last.m2Mult : 1;
  const m2Pct = (m2Mult - 1) * 100;

  const makeEntry = (
    key: Exclude<M2SeriesKey, 'M2'>,
    startPrice: number,
    currentPrice: number,
    rawMult: number
  ): M2AssetSummary => {
    const nominalMult = rawMult > 0 ? rawMult : 1;
    const nominalPct = (nominalMult - 1) * 100;
    const m2AdjustedMult = nominalMult / m2Mult;
    const m2AdjustedPct = (m2AdjustedMult - 1) * 100;
    const meta = M2_SERIES_META[key];
    return {
      key,
      ticker: meta.ticker,
      name: meta.name,
      color: meta.color,
      startPrice,
      currentPrice,
      nominalMult,
      nominalPct,
      m2AdjustedMult,
      m2AdjustedPct,
      beatsM2: m2AdjustedMult >= 1.0
    };
  };

  const assets: M2AssetSummary[] = [
    makeEntry('KAS', first.kasPrice, last.kasPrice, last.kasMult),
    makeEntry('BTC', first.btcPrice, last.btcPrice, last.btcMult),
    makeEntry('GOLD', first.goldPrice, last.goldPrice, last.goldMult),
    makeEntry('SPX', first.spxPrice, last.spxPrice, last.spxMult)
  ];

  return {
    m2StartTrillions: first.m2Trillions,
    m2EndTrillions: last.m2Trillions,
    m2Mult,
    m2Pct,
    assets
  };
}

// Empirical fallback built from FRED M2SL + Yahoo Finance BTC-USD / KAS-USD / ^GSPC / GC=F
export const DEFAULT_M2_BENCHMARK_DATASET: M2BenchmarkDataset = {
  updatedAtMs: Date.UTC(2026, 10, 18, 0, 0, 0),
  sourceLabel: 'Empirical FRED M2SL + Market Benchmark',
  isLive: false,
  latestM2Trillions: 23.41,
  latestM2Date: '2026-09-01',
  seriesByHorizon: {
    ALL_TIME: [
      { tsMs: Date.UTC(2022, 4, 30), label: "May '22", event: 'May 2022 Common Open (KAS Fair Launch)', m2Trillions: 21.7, m2Mult: 1.0, kasMult: 1.0, btcMult: 1.0, ethMult: 1.0, spxMult: 1.0, goldMult: 1.0, kasPrice: 0.0001859, btcPrice: 29907, ethPrice: 1940, spxPrice: 4109, goldPrice: 1850 },
      { tsMs: Date.UTC(2022, 10, 15), label: "Nov '22", event: 'FTX Contagion / QT Contraction', m2Trillions: 21.39, m2Mult: 0.9857, kasMult: 48.0, btcMult: 0.556, ethMult: 0.628, spxMult: 0.962, goldMult: 0.948, kasPrice: 0.0089, btcPrice: 16628, ethPrice: 1218.4, spxPrice: 3953, goldPrice: 1754 },
      { tsMs: Date.UTC(2023, 4, 15), label: "May '23", event: 'KAS ASIC Transition / US Bank Stress', m2Trillions: 20.82, m2Mult: 0.9594, kasMult: 108.0, btcMult: 0.908, ethMult: 0.9402, spxMult: 1.012, goldMult: 1.084, kasPrice: 0.0201, btcPrice: 27156, ethPrice: 1824, spxPrice: 4158, goldPrice: 2005 },
      { tsMs: Date.UTC(2023, 10, 15), label: "Nov '23", event: 'KAS Breakout / ETF Anticipation', m2Trillions: 20.77, m2Mult: 0.9571, kasMult: 645.0, btcMult: 1.242, ethMult: 1.0577, spxMult: 1.098, goldMult: 1.074, kasPrice: 0.1199, btcPrice: 37145, ethPrice: 2052, spxPrice: 4511, goldPrice: 1987 },
      { tsMs: Date.UTC(2024, 2, 15), label: "Mar '24", event: 'BTC Spot ETF Inflows + Halving', m2Trillions: 20.91, m2Mult: 0.9636, kasMult: 765.0, btcMult: 2.285, ethMult: 1.8134, spxMult: 1.258, goldMult: 1.185, kasPrice: 0.1422, btcPrice: 68337, ethPrice: 3518, spxPrice: 5169, goldPrice: 2192 },
      { tsMs: Date.UTC(2024, 10, 15), label: "Nov '24", event: 'M2 Re-Expansion / Post-Election Bid', m2Trillions: 21.43, m2Mult: 0.9876, kasMult: 820.0, btcMult: 3.04, ethMult: 1.6536, spxMult: 1.448, goldMult: 1.428, kasPrice: 0.1524, btcPrice: 90917, ethPrice: 3207.9, spxPrice: 5950, goldPrice: 2642 },
      { tsMs: Date.UTC(2025, 4, 15), label: "May '25", event: 'Crescendo 10 BPS Live / Gold Surge', m2Trillions: 21.84, m2Mult: 1.0065, kasMult: 512.0, btcMult: 3.41, ethMult: 1.3093, spxMult: 1.438, goldMult: 1.78, kasPrice: 0.0952, btcPrice: 101983, ethPrice: 2540, spxPrice: 5909, goldPrice: 3293 },
      { tsMs: Date.UTC(2025, 10, 15), label: "Nov '25", event: 'Liquidity Tightening vs Gold Highs', m2Trillions: 22.25, m2Mult: 1.0253, kasMult: 232.8, btcMult: 3.11, ethMult: 1.6098, spxMult: 1.632, goldMult: 2.198, kasPrice: 0.0433, btcPrice: 93010, ethPrice: 3123, spxPrice: 6706, goldPrice: 4066 },
      { tsMs: Date.UTC(2026, 4, 15), label: "May '26", event: 'M2 New All-Time Highs ($22.98T)', m2Trillions: 22.98, m2Mult: 1.059, kasMult: 181.3, btcMult: 2.524, ethMult: 1.0642, spxMult: 1.842, goldMult: 2.445, kasPrice: 0.0337, btcPrice: 75485, ethPrice: 2064.6, spxPrice: 7569, goldPrice: 4523 },
      { tsMs: Date.UTC(2026, 10, 18), label: 'Now', event: 'Live Spot vs FRED US M2', m2Trillions: 23.41, m2Mult: 1.079, kasMult: 146.56, btcMult: 2.107, ethMult: 0.9187, spxMult: 1.782, goldMult: 2.042, kasPrice: 0.02725, btcPrice: 63004, ethPrice: 1782.23, spxPrice: 7322, goldPrice: 3778 }
    ],
    D180: [
      { tsMs: Date.UTC(2026, 4, 22), label: 'May 22', event: '180-Day Window Open', m2Trillions: 22.98, m2Mult: 1.0, kasMult: 1.0, btcMult: 1.0, ethMult: 1.0, spxMult: 1.0, goldMult: 1.0, kasPrice: 0.0307, btcPrice: 73580, ethPrice: 2064.6, spxPrice: 7580, goldPrice: 4593 },
      { tsMs: Date.UTC(2026, 5, 21), label: 'Jun 21', event: 'Early Summer Liquidity Shift', m2Trillions: 23.08, m2Mult: 1.0044, kasMult: 1.052, btcMult: 0.964, ethMult: 0.9648, spxMult: 0.992, goldMult: 0.958, kasPrice: 0.0323, btcPrice: 70931, ethPrice: 1992, spxPrice: 7519, goldPrice: 4400 },
      { tsMs: Date.UTC(2026, 6, 21), label: 'Jul 21', event: 'Mid-Summer Consolidation', m2Trillions: 23.18, m2Mult: 1.0087, kasMult: 0.985, btcMult: 0.931, ethMult: 0.9387, spxMult: 1.012, goldMult: 0.915, kasPrice: 0.0302, btcPrice: 68503, ethPrice: 1938, spxPrice: 7671, goldPrice: 4203 },
      { tsMs: Date.UTC(2026, 7, 20), label: 'Aug 20', event: '90-Day Checkpoint', m2Trillions: 23.3, m2Mult: 1.0139, kasMult: 0.934, btcMult: 0.892, ethMult: 0.9125, spxMult: 0.988, goldMult: 0.884, kasPrice: 0.0287, btcPrice: 65633, ethPrice: 1884, spxPrice: 7489, goldPrice: 4060 },
      { tsMs: Date.UTC(2026, 8, 19), label: 'Sep 19', event: 'Autumn M2 Expansion ($23.41T)', m2Trillions: 23.41, m2Mult: 1.0187, kasMult: 0.91, btcMult: 0.875, ethMult: 0.8888, spxMult: 0.974, goldMult: 0.852, kasPrice: 0.0279, btcPrice: 64383, ethPrice: 1835, spxPrice: 7383, goldPrice: 3913 },
      { tsMs: Date.UTC(2026, 9, 19), label: 'Oct 19', event: 'Late-Window Rotation', m2Trillions: 23.41, m2Mult: 1.0187, kasMult: 0.896, btcMult: 0.862, ethMult: 0.8738, spxMult: 0.969, goldMult: 0.834, kasPrice: 0.0275, btcPrice: 63426, ethPrice: 1804, spxPrice: 7345, goldPrice: 3831 },
      { tsMs: Date.UTC(2026, 10, 18), label: 'Now', event: 'Live 180D Spot vs US M2', m2Trillions: 23.41, m2Mult: 1.0188, kasMult: 0.888, btcMult: 0.856, ethMult: 0.8632, spxMult: 0.966, goldMult: 0.822, kasPrice: 0.02725, btcPrice: 63004, ethPrice: 1782.23, spxPrice: 7322, goldPrice: 3778 }
    ],
    Y1: [
      { tsMs: Date.UTC(2025, 10, 18), label: "Nov '25", event: '1-Year Window Open', m2Trillions: 22.25, m2Mult: 1.0, kasMult: 1.0, btcMult: 1.0, ethMult: 1.0, spxMult: 1.0, goldMult: 1.0, kasPrice: 0.04, btcPrice: 86805, ethPrice: 3123, spxPrice: 6603, goldPrice: 4080 },
      { tsMs: Date.UTC(2026, 0, 17), label: "Jan '26", event: 'New Year Macro Repricing', m2Trillions: 22.39, m2Mult: 1.0063, kasMult: 0.925, btcMult: 0.965, ethMult: 0.9254, spxMult: 1.032, goldMult: 1.045, kasPrice: 0.037, btcPrice: 83767, ethPrice: 2890, spxPrice: 6814, goldPrice: 4264 },
      { tsMs: Date.UTC(2026, 2, 18), label: "Mar '26", event: 'Spring Liquidity Surge', m2Trillions: 22.61, m2Mult: 1.0162, kasMult: 0.86, btcMult: 0.912, ethMult: 0.7893, spxMult: 1.078, goldMult: 1.092, kasPrice: 0.0344, btcPrice: 79166, ethPrice: 2465, spxPrice: 7118, goldPrice: 4455 },
      { tsMs: Date.UTC(2026, 4, 18), label: "May '26", event: '180D Midpoint', m2Trillions: 22.98, m2Mult: 1.0328, kasMult: 0.768, btcMult: 0.848, ethMult: 0.6611, spxMult: 1.148, goldMult: 1.126, kasPrice: 0.0307, btcPrice: 73580, ethPrice: 2064.6, spxPrice: 7580, goldPrice: 4593 },
      { tsMs: Date.UTC(2026, 6, 18), label: "Jul '26", event: 'Summer Rotation', m2Trillions: 23.18, m2Mult: 1.0418, kasMult: 0.742, btcMult: 0.794, ethMult: 0.6206, spxMult: 1.132, goldMult: 1.028, kasPrice: 0.0297, btcPrice: 68923, ethPrice: 1938, spxPrice: 7475, goldPrice: 4194 },
      { tsMs: Date.UTC(2026, 8, 18), label: "Sep '26", event: 'M2 Print Acceleration', m2Trillions: 23.41, m2Mult: 1.0521, kasMult: 0.7, btcMult: 0.742, ethMult: 0.5876, spxMult: 1.116, goldMult: 0.964, kasPrice: 0.028, btcPrice: 64409, ethPrice: 1835, spxPrice: 7369, goldPrice: 3933 },
      { tsMs: Date.UTC(2026, 10, 18), label: 'Now', event: 'Live 1Y Spot vs US M2', m2Trillions: 23.41, m2Mult: 1.0522, kasMult: 0.681, btcMult: 0.726, ethMult: 0.5707, spxMult: 1.109, goldMult: 0.926, kasPrice: 0.02725, btcPrice: 63004, ethPrice: 1782.23, spxPrice: 7322, goldPrice: 3778 }
    ],
    Y2: [
      { tsMs: Date.UTC(2024, 10, 18), label: "Nov '24", event: '2-Year Window Open', m2Trillions: 21.43, m2Mult: 1.0, kasMult: 1.0, btcMult: 1.0, ethMult: 1.0, spxMult: 1.0, goldMult: 1.0, kasPrice: 0.1524, btcPrice: 98014, ethPrice: 3207.9, spxPrice: 5969, goldPrice: 2712 },
      { tsMs: Date.UTC(2025, 2, 18), label: "Mar '25", event: 'Post-Peak Crypto Consolidation', m2Trillions: 21.71, m2Mult: 1.0131, kasMult: 0.562, btcMult: 0.875, ethMult: 0.6811, spxMult: 0.968, goldMult: 1.115, kasPrice: 0.0856, btcPrice: 85762, ethPrice: 2185, spxPrice: 5778, goldPrice: 3024 },
      { tsMs: Date.UTC(2025, 6, 18), label: "Jul '25", event: 'Gold Monetary Breakout', m2Trillions: 22.0, m2Mult: 1.0266, kasMult: 0.445, btcMult: 0.942, ethMult: 0.9165, spxMult: 1.045, goldMult: 1.248, kasPrice: 0.0678, btcPrice: 92329, ethPrice: 2940, spxPrice: 6238, goldPrice: 3385 },
      { tsMs: Date.UTC(2025, 10, 18), label: "Nov '25", event: '1-Year Midpoint', m2Trillions: 22.25, m2Mult: 1.0383, kasMult: 0.262, btcMult: 0.886, ethMult: 0.9735, spxMult: 1.106, goldMult: 1.504, kasPrice: 0.04, btcPrice: 86805, ethPrice: 3123, spxPrice: 6603, goldPrice: 4080 },
      { tsMs: Date.UTC(2026, 2, 18), label: "Mar '26", event: 'US M2 Passes $22.6T', m2Trillions: 22.61, m2Mult: 1.0551, kasMult: 0.226, btcMult: 0.808, ethMult: 0.7684, spxMult: 1.192, goldMult: 1.642, kasPrice: 0.0344, btcPrice: 79166, ethPrice: 2465, spxPrice: 7118, goldPrice: 4455 },
      { tsMs: Date.UTC(2026, 6, 18), label: "Jul '26", event: 'Equities & Gold Lead Liquidity', m2Trillions: 23.18, m2Mult: 1.0817, kasMult: 0.195, btcMult: 0.703, ethMult: 0.6041, spxMult: 1.252, goldMult: 1.546, kasPrice: 0.0297, btcPrice: 68923, ethPrice: 1938, spxPrice: 7475, goldPrice: 4194 },
      { tsMs: Date.UTC(2026, 10, 18), label: 'Now', event: 'Live 2Y Spot vs US M2', m2Trillions: 23.41, m2Mult: 1.0926, kasMult: 0.179, btcMult: 0.643, ethMult: 0.5556, spxMult: 1.227, goldMult: 1.393, kasPrice: 0.02725, btcPrice: 63004, ethPrice: 1782.23, spxPrice: 7322, goldPrice: 3778 }
    ],
    Y4: [
      { tsMs: Date.UTC(2022, 10, 18), label: "Nov '22", event: '4-Year Cycle Open (Cycle Low)', m2Trillions: 21.39, m2Mult: 1.0, kasMult: 1.0, btcMult: 1.0, ethMult: 1.0, spxMult: 1.0, goldMult: 1.0, kasPrice: 0.0094, btcPrice: 16445, ethPrice: 1218.4, spxPrice: 4026, goldPrice: 1754 },
      { tsMs: Date.UTC(2023, 4, 18), label: "May '23", event: 'Post-FTX Recovery', m2Trillions: 20.82, m2Mult: 0.9734, kasMult: 2.138, btcMult: 1.651, ethMult: 1.497, spxMult: 1.033, goldMult: 1.143, kasPrice: 0.0201, btcPrice: 27156, ethPrice: 1824, spxPrice: 4158, goldPrice: 2005 },
      { tsMs: Date.UTC(2023, 10, 18), label: "Nov '23", event: 'KAS Mainnet Explosion', m2Trillions: 20.77, m2Mult: 0.971, kasMult: 12.755, btcMult: 2.259, ethMult: 1.6842, spxMult: 1.12, goldMult: 1.133, kasPrice: 0.0094 * 12.755, btcPrice: 37145, ethPrice: 2052, spxPrice: 4511, goldPrice: 1987 },
      { tsMs: Date.UTC(2024, 4, 18), label: "May '24", event: 'Post-Halving Expansion', m2Trillions: 20.96, m2Mult: 0.9799, kasMult: 13.84, btcMult: 4.086, ethMult: 2.5542, spxMult: 1.312, goldMult: 1.368, kasPrice: 0.1301, btcPrice: 67194, ethPrice: 3112, spxPrice: 5282, goldPrice: 2399 },
      { tsMs: Date.UTC(2024, 10, 18), label: "Nov '24", event: '2-Year Midpoint ($98K BTC)', m2Trillions: 21.43, m2Mult: 1.0019, kasMult: 16.213, btcMult: 5.96, ethMult: 2.6329, spxMult: 1.483, goldMult: 1.546, kasPrice: 0.1524, btcPrice: 98014, ethPrice: 3207.9, spxPrice: 5969, goldPrice: 2712 },
      { tsMs: Date.UTC(2025, 4, 18), label: "May '25", event: 'Gold & S&P Broadening', m2Trillions: 21.84, m2Mult: 1.021, kasMult: 10.128, btcMult: 6.201, ethMult: 2.0847, spxMult: 1.468, goldMult: 1.877, kasPrice: 0.0952, btcPrice: 101983, ethPrice: 2540, spxPrice: 5909, goldPrice: 3293 },
      { tsMs: Date.UTC(2025, 10, 18), label: "Nov '25", event: 'Monetary Re-Acceleration', m2Trillions: 22.25, m2Mult: 1.0402, kasMult: 4.255, btcMult: 5.278, ethMult: 2.5632, spxMult: 1.64, goldMult: 2.326, kasPrice: 0.04, btcPrice: 86805, ethPrice: 3123, spxPrice: 6603, goldPrice: 4080 },
      { tsMs: Date.UTC(2026, 4, 18), label: "May '26", event: 'Peak Gold & Equity Print', m2Trillions: 22.98, m2Mult: 1.0743, kasMult: 3.266, btcMult: 4.474, ethMult: 1.6945, spxMult: 1.883, goldMult: 2.619, kasPrice: 0.0307, btcPrice: 73580, ethPrice: 2064.6, spxPrice: 7580, goldPrice: 4593 },
      { tsMs: Date.UTC(2026, 10, 18), label: 'Now', event: 'Live 4Y Spot vs US M2', m2Trillions: 23.41, m2Mult: 1.0947, kasMult: 2.891, btcMult: 3.831, ethMult: 1.4628, spxMult: 1.819, goldMult: 2.154, kasPrice: 0.02725, btcPrice: 63004, ethPrice: 1782.23, spxPrice: 7322, goldPrice: 3778 }
    ]
  }
};
