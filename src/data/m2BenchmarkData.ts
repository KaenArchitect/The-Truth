import {
  resolveCohortBaselinePrice,
  resolveTimelineBaselineMode,
  type CohortAssetEntry,
  type GainsCohortRecord
} from './gainsCohortData.ts';

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
  kasActive?: boolean;
  btcActive?: boolean;
  ethActive?: boolean;
  kasStartBtcPrice?: number;
  ethStartBtcPrice?: number;
  kasStartM2Trillions?: number;
  btcStartM2Trillions?: number;
  ethStartM2Trillions?: number;
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
  available?: boolean;
  windowNote?: string;
  launchNote?: string;
  startPrice: number;
  currentPrice: number;
  nominalMult: number;
  nominalPct: number;
  m2AdjustedMult: number;
  m2AdjustedPct: number;
  beatsM2: boolean;
}

export interface M2MatrixAssetItem {
  id: string;
  ticker: string;
  auditTicker: string | null;
  name: string;
  grade: string;
  side: 'PASSED' | 'FAILED' | 'MACRO';
  color: string;
  isIndexPoints?: boolean;
  windowNote?: string;
  startPrice: number;
  currentPrice: number;
  nominalMult: number;
  nominalPct: number;
  m2AdjustedMult: number;
  m2AdjustedPct: number;
  beatsM2: boolean;
}

export interface M2BasketCohortSummary {
  side: 'PASSED' | 'FAILED';
  count: number;
  beatsCount: number;
  avgNominalPct: number;
  avgAdjustedPct: number;
  avgAdjustedMult: number;
}

export interface M2HorizonSummary {
  m2StartTrillions: number;
  m2EndTrillions: number;
  m2Mult: number;
  m2Pct: number;
  windowTag?: string;
  headingLabel?: string;
  assets: M2AssetSummary[];
  coreCards?: M2AssetSummary[];
  cohortMatrix: M2MatrixAssetItem[];
  passedBasketSummary?: M2BasketCohortSummary;
  failedBasketSummary?: M2BasketCohortSummary;
}

export interface M2BenchmarkDataset {
  updatedAtMs: number;
  sourceLabel: string;
  isLive: boolean;
  latestM2Trillions: number;
  latestM2Date: string;
  spots?: {
    btc: number;
    kas: number;
    eth: number;
    spx: number;
    gold: number;
  };
  seriesByHorizon: Record<MacroM2HorizonKey, M2ChartPoint[]>;
}

export const BTC_GENESIS_JUL10_PRICE = 0.05;
export const BTC_GENESIS_JUL10_MS = Date.UTC(2010, 6, 18, 0, 0, 0);
export const KAS_GENESIS_MAY22_PRICE = 0.0001859;
export const KAS_GENESIS_MAY22_MS = Date.UTC(2022, 4, 30, 0, 0, 0);
const DAY_MS = 24 * 60 * 60 * 1000;

export const JUL_2010_BENCHMARK_OPEN_PRICES: Readonly<Record<string, number>> = {
  XAG: 17.85,
  CU: 3.0,
  XPT: 1525.0,
  XPD: 455.0,
  EUR: 1.29,
  GBP: 1.53,
  CHF: 0.95,
  CAD: 0.96,
  AUD: 0.88,
  JPY: 0.0114,
  CNY: 0.1475
};

const MONTH_INDEX_BY_SHORT: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11
};

export function parseReleaseLabelTimestampMs(label?: string | null): number | null {
  if (!label) return null;
  const monthYearMatch = label.match(
    /\(\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*'(\d{2})\s*\)/i
  );
  if (monthYearMatch) {
    const monIdx = MONTH_INDEX_BY_SHORT[monthYearMatch[1].toLowerCase()];
    const twoDigit = Number(monthYearMatch[2]);
    const yr = twoDigit >= 70 ? 1900 + twoDigit : 2000 + twoDigit;
    if (monIdx !== undefined && Number.isFinite(yr)) {
      return Date.UTC(yr, monIdx, 15);
    }
  }
  const comexYearMatch = label.match(/comex\s*'(\d{2})/i);
  if (comexYearMatch) {
    const twoDigit = Number(comexYearMatch[1]);
    const yr = twoDigit >= 70 ? 1900 + twoDigit : 2000 + twoDigit;
    if (Number.isFinite(yr)) {
      return Date.UTC(yr, 0, 3);
    }
  }
  const fourDigitOpenMatch = label.match(/\(\s*(19\d{2}|20\d{2})\s+open/i);
  if (fourDigitOpenMatch) {
    return Date.UTC(Number(fourDigitOpenMatch[1]), 0, 1);
  }
  const yearOnlyMatch = label.match(/\(\s*'(\d{2})\b/i);
  if (yearOnlyMatch) {
    const twoDigit = Number(yearOnlyMatch[1]);
    const yr = twoDigit >= 70 ? 1900 + twoDigit : 2000 + twoDigit;
    if (Number.isFinite(yr)) {
      return Date.UTC(yr, 2, 15);
    }
  }
  if (/krc-20/i.test(label)) {
    return Date.UTC(2024, 5, 15);
  }
  return null;
}

export function formatM2SupplyLabel(trillions: number): string {
  if (!Number.isFinite(trillions) || trillions <= 0) return '—';
  if (trillions < 0.1) {
    return `$${(trillions * 1000).toFixed(1)}B`;
  }
  if (trillions < 1.0) {
    return `$${Math.round(trillions * 1000)}B`;
  }
  return `$${trillions.toFixed(2)}T`;
}

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

  const allTimeArr = updatedSeries.ALL_TIME;
  const terminalPt =
    allTimeArr && allTimeArr.length > 0 ? allTimeArr[allTimeArr.length - 1] : null;

  return {
    ...dataset,
    spots: {
      btc:
        Number.isFinite(btcSpot) && btcSpot > 0
          ? btcSpot
          : dataset.spots?.btc ?? terminalPt?.btcPrice ?? 63004,
      kas:
        Number.isFinite(kasSpot) && kasSpot > 0
          ? kasSpot
          : dataset.spots?.kas ?? terminalPt?.kasPrice ?? 0.02725,
      eth:
        Number.isFinite(ethSpot) && ethSpot > 0
          ? ethSpot
          : dataset.spots?.eth ?? terminalPt?.ethPrice ?? 1782.23,
      gold:
        Number.isFinite(goldSpot) && goldSpot > 0
          ? goldSpot
          : dataset.spots?.gold ?? terminalPt?.goldPrice ?? 3778,
      spx:
        Number.isFinite(spxSpot) && spxSpot > 0
          ? spxSpot
          : dataset.spots?.spx ?? terminalPt?.spxPrice ?? 7322
    },
    seriesByHorizon: updatedSeries
  };
}

export function transformM2PointForMode(
  pt: M2ChartPoint,
  mode: M2ComparisonMode
): Record<M2SeriesKey, number> {
  if (mode === 'REAL_DIV_M2') {
    const denom = Math.max(0.05, pt.m2Mult);
    const kasDenom =
      pt.kasStartM2Trillions && pt.kasStartM2Trillions > 0
        ? Math.max(0.05, pt.m2Trillions / pt.kasStartM2Trillions)
        : denom;
    const btcDenom =
      pt.btcStartM2Trillions && pt.btcStartM2Trillions > 0
        ? Math.max(0.05, pt.m2Trillions / pt.btcStartM2Trillions)
        : denom;
    return {
      KAS: Math.max(0.01, pt.kasMult / kasDenom),
      BTC: Math.max(0.01, pt.btcMult / btcDenom),
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

export function transformM2PointNullable(
  pt: M2ChartPoint,
  mode: M2ComparisonMode
): Record<M2SeriesKey, number | null> {
  const base = transformM2PointForMode(pt, mode);
  return {
    KAS: pt.kasActive === false ? null : base.KAS,
    BTC: pt.btcActive === false ? null : base.BTC,
    GOLD: base.GOLD,
    SPX: base.SPX,
    M2: base.M2
  };
}

interface MacroHistoricalMilestone {
  id: string;
  year: number;
  tsMs: number;
  label: string;
  event: string;
  m2Trillions: number;
  btcPrice: number | null;
  kasPrice: number | null;
  ethPrice: number | null;
  goldPrice: number;
  spxPrice: number;
}

const MACRO_HISTORICAL_MILESTONES: readonly MacroHistoricalMilestone[] = [
  {
    id: '1913',
    year: 1913,
    tsMs: Date.UTC(1913, 11, 23),
    label: '1913',
    event: '1913 Pre-Fed Classical Gold Specie Open',
    m2Trillions: 0.0158,
    btcPrice: null,
    kasPrice: null,
    ethPrice: null,
    goldPrice: 20.67,
    spxPrice: 9.5
  },
  {
    id: '1944',
    year: 1944,
    tsMs: Date.UTC(1944, 6, 22),
    label: '1944',
    event: 'Bretton Woods $35/oz Accord',
    m2Trillions: 0.106,
    btcPrice: null,
    kasPrice: null,
    ethPrice: null,
    goldPrice: 35.0,
    spxPrice: 13.3
  },
  {
    id: '1971',
    year: 1971,
    tsMs: Date.UTC(1971, 7, 15),
    label: '1971',
    event: '1971 Bretton Woods $35/oz Window Open',
    m2Trillions: 0.6329,
    btcPrice: null,
    kasPrice: null,
    ethPrice: null,
    goldPrice: 35.0,
    spxPrice: 92.15
  },
  {
    id: '1980',
    year: 1980,
    tsMs: Date.UTC(1980, 0, 21),
    label: '1980',
    event: 'Stagflation Bullion Repricing',
    m2Trillions: 1.4827,
    btcPrice: null,
    kasPrice: null,
    ethPrice: null,
    goldPrice: 675.0,
    spxPrice: 111.0
  },
  {
    id: '2000',
    year: 2000,
    tsMs: Date.UTC(2000, 0, 3),
    label: '2000',
    event: '2000 Post-Bretton Woods Fiat Era Open',
    m2Trillions: 4.6662,
    btcPrice: null,
    kasPrice: null,
    ethPrice: null,
    goldPrice: 277.0,
    spxPrice: 1469
  },
  {
    id: '2008',
    year: 2008,
    tsMs: Date.UTC(2008, 9, 31),
    label: '2008',
    event: '2008 GFC & Bitcoin Genesis Open',
    m2Trillions: 7.9485,
    btcPrice: 0.05,
    kasPrice: null,
    ethPrice: null,
    goldPrice: 865.0,
    spxPrice: 1411
  },
  {
    id: '2010',
    year: 2010,
    tsMs: BTC_GENESIS_JUL10_MS,
    label: "Jul '10",
    event: 'BTC First Exchange Open ($0.05)',
    m2Trillions: 8.6224,
    btcPrice: 0.05,
    kasPrice: null,
    ethPrice: null,
    goldPrice: 1190.0,
    spxPrice: 1065
  },
  {
    id: '2013',
    year: 2013,
    tsMs: Date.UTC(2013, 10, 30),
    label: '2013',
    event: 'First BTC Halving Cycle',
    m2Trillions: 10.967,
    btcPrice: 750.0,
    kasPrice: null,
    ethPrice: null,
    goldPrice: 1250.0,
    spxPrice: 1805
  },
  {
    id: '2015',
    year: 2015,
    tsMs: Date.UTC(2015, 7, 15),
    label: "Aug '15",
    event: 'ETH Mainnet Launch ($2.77)',
    m2Trillions: 12.104,
    btcPrice: 279.0,
    kasPrice: null,
    ethPrice: 2.77,
    goldPrice: 1094.0,
    spxPrice: 2077
  },
  {
    id: '2016',
    year: 2016,
    tsMs: Date.UTC(2016, 0, 1),
    label: '2016',
    event: '2016 Sequential PoW & DAO Era Open',
    m2Trillions: 12.4902,
    btcPrice: 434.0,
    kasPrice: null,
    ethPrice: 0.95,
    goldPrice: 1061.0,
    spxPrice: 2044
  },
  {
    id: '2017',
    year: 2017,
    tsMs: Date.UTC(2017, 11, 15),
    label: '2017',
    event: '2017 ICO Boom & SegWit Era',
    m2Trillions: 13.852,
    btcPrice: 17600.0,
    kasPrice: null,
    ethPrice: 685.0,
    goldPrice: 1255.0,
    spxPrice: 2675
  },
  {
    id: '2020',
    year: 2020,
    tsMs: Date.UTC(2020, 0, 1),
    label: '2020',
    event: '2020 DeFi & QE Surge Open',
    m2Trillions: 15.4168,
    btcPrice: 7200.0,
    kasPrice: null,
    ethPrice: 129.6,
    goldPrice: 1517.0,
    spxPrice: 3231
  },
  {
    id: '2021',
    year: 2021,
    tsMs: Date.UTC(2021, 4, 15),
    label: '2021',
    event: 'Pandemic Liquidity Peak ($20.3T M2)',
    m2Trillions: 20.328,
    btcPrice: 46700.0,
    kasPrice: null,
    ethPrice: 3580.0,
    goldPrice: 1843.0,
    spxPrice: 4173
  },
  {
    id: '2022',
    year: 2022,
    tsMs: KAS_GENESIS_MAY22_MS,
    label: "May '22",
    event: 'KAS Public Open ($0.0001859) & QT Cycle',
    m2Trillions: 21.7,
    btcPrice: 29907.0,
    kasPrice: KAS_GENESIS_MAY22_PRICE,
    ethPrice: 1940.0,
    goldPrice: 1850.0,
    spxPrice: 4109
  },
  {
    id: '2024',
    year: 2024,
    tsMs: Date.UTC(2024, 0, 1),
    label: '2024',
    event: '2024 Post-Merge PoS & 1-BPS BlockDAG Open',
    m2Trillions: 20.8417,
    btcPrice: 42265.0,
    kasPrice: 0.1118,
    ethPrice: 2282.0,
    goldPrice: 2063.0,
    spxPrice: 4770
  },
  {
    id: '2024_NOV',
    year: 2024,
    tsMs: Date.UTC(2024, 10, 15),
    label: "Nov '24",
    event: 'M2 Re-Expansion & Post-Halving Bid',
    m2Trillions: 21.43,
    btcPrice: 90917.0,
    kasPrice: 0.1524,
    ethPrice: 3207.9,
    goldPrice: 2642.0,
    spxPrice: 5950
  },
  {
    id: '2025_MAY',
    year: 2025,
    tsMs: Date.UTC(2025, 4, 15),
    label: "May '25",
    event: 'Crescendo 10 BPS Live & Gold Surge',
    m2Trillions: 21.84,
    btcPrice: 101983.0,
    kasPrice: 0.0952,
    ethPrice: 2540.0,
    goldPrice: 3293.0,
    spxPrice: 5909
  },
  {
    id: '2025_NOV',
    year: 2025,
    tsMs: Date.UTC(2025, 10, 15),
    label: "Nov '25",
    event: 'Liquidity Tightening vs Gold Highs',
    m2Trillions: 22.25,
    btcPrice: 93010.0,
    kasPrice: 0.0433,
    ethPrice: 3123.0,
    goldPrice: 4066.0,
    spxPrice: 6706
  },
  {
    id: '2026_MAY',
    year: 2026,
    tsMs: Date.UTC(2026, 4, 15),
    label: "May '26",
    event: 'US M2 New Highs ($22.98T)',
    m2Trillions: 22.98,
    btcPrice: 75485.0,
    kasPrice: 0.0337,
    ethPrice: 2064.6,
    goldPrice: 4523.0,
    spxPrice: 7569
  }
];

const HISTORICAL_BTC_PRICE_CURVE: ReadonlyArray<{ tsMs: number; price: number }> = [
  { tsMs: Date.UTC(2008, 9, 31), price: 0.05 },
  { tsMs: BTC_GENESIS_JUL10_MS, price: 0.05 },
  { tsMs: Date.UTC(2013, 3, 15), price: 118.0 },
  { tsMs: Date.UTC(2013, 7, 15), price: 109.0 },
  { tsMs: Date.UTC(2013, 11, 15), price: 750.0 },
  { tsMs: Date.UTC(2014, 4, 15), price: 490.0 },
  { tsMs: Date.UTC(2014, 7, 15), price: 515.0 },
  { tsMs: Date.UTC(2015, 7, 15), price: 279.0 },
  { tsMs: Date.UTC(2016, 0, 1), price: 434.0 },
  { tsMs: Date.UTC(2016, 9, 15), price: 640.0 },
  { tsMs: Date.UTC(2017, 7, 15), price: 4180.0 },
  { tsMs: Date.UTC(2017, 9, 15), price: 5650.0 },
  { tsMs: Date.UTC(2018, 2, 15), price: 8300.0 },
  { tsMs: Date.UTC(2018, 7, 15), price: 6400.0 },
  { tsMs: Date.UTC(2019, 5, 15), price: 8900.0 },
  { tsMs: Date.UTC(2019, 7, 15), price: 10350.0 },
  { tsMs: Date.UTC(2019, 9, 15), price: 8200.0 },
  { tsMs: Date.UTC(2020, 0, 1), price: 7200.0 },
  { tsMs: Date.UTC(2020, 3, 15), price: 6900.0 },
  { tsMs: Date.UTC(2020, 8, 15), price: 10800.0 },
  { tsMs: Date.UTC(2020, 9, 15), price: 11450.0 },
  { tsMs: Date.UTC(2021, 4, 15), price: 46700.0 },
  { tsMs: Date.UTC(2021, 7, 15), price: 46500.0 },
  { tsMs: KAS_GENESIS_MAY22_MS, price: 29907.0 },
  { tsMs: Date.UTC(2022, 10, 15), price: 16628.0 },
  { tsMs: Date.UTC(2023, 2, 15), price: 24700.0 },
  { tsMs: Date.UTC(2023, 4, 15), price: 27156.0 },
  { tsMs: Date.UTC(2023, 10, 15), price: 37145.0 },
  { tsMs: Date.UTC(2024, 0, 1), price: 42265.0 },
  { tsMs: Date.UTC(2024, 5, 15), price: 66200.0 },
  { tsMs: Date.UTC(2024, 10, 15), price: 90917.0 },
  { tsMs: Date.UTC(2025, 1, 15), price: 96500.0 },
  { tsMs: Date.UTC(2025, 4, 15), price: 101983.0 },
  { tsMs: Date.UTC(2025, 10, 15), price: 93010.0 },
  { tsMs: Date.UTC(2026, 4, 15), price: 75485.0 }
];

export function findHistoricalBtcPriceAt(
  targetTsMs: number,
  extraBars?: HistoricalPriceBar[],
  latestSpot?: number
): number {
  if (!Number.isFinite(targetTsMs) || targetTsMs <= BTC_GENESIS_JUL10_MS) {
    return BTC_GENESIS_JUL10_PRICE;
  }
  const combined: HistoricalPriceBar[] = [...HISTORICAL_BTC_PRICE_CURVE];
  if (Array.isArray(extraBars)) {
    for (const b of extraBars) {
      if (b && Number.isFinite(b.tsMs) && Number.isFinite(b.price) && b.price > 0) {
        combined.push(b);
      }
    }
  }
  if (latestSpot && Number.isFinite(latestSpot) && latestSpot > 0) {
    combined.push({ tsMs: Date.UTC(2026, 10, 26), price: latestSpot });
  }
  combined.sort((a, b) => a.tsMs - b.tsMs);

  if (targetTsMs <= combined[0].tsMs) return combined[0].price;
  if (targetTsMs >= combined[combined.length - 1].tsMs) {
    return combined[combined.length - 1].price;
  }

  for (let i = 1; i < combined.length; i += 1) {
    const prev = combined[i - 1];
    const curr = combined[i];
    if (targetTsMs <= curr.tsMs) {
      const span = Math.max(1, curr.tsMs - prev.tsMs);
      const t = (targetTsMs - prev.tsMs) / span;
      return Math.exp(Math.log(prev.price) + t * (Math.log(curr.price) - Math.log(prev.price)));
    }
  }
  return combined[combined.length - 1].price;
}

export function findHistoricalM2TrillionsAt(
  targetTsMs: number,
  extraPoints?: ReadonlyArray<{ tsMs: number; m2Trillions: number }>,
  latestM2Trillions?: number
): number {
  const combined: Array<{ tsMs: number; m2Trillions: number }> = MACRO_HISTORICAL_MILESTONES.map(
    (m) => ({ tsMs: m.tsMs, m2Trillions: m.m2Trillions })
  );
  if (Array.isArray(extraPoints)) {
    for (const p of extraPoints) {
      if (p && Number.isFinite(p.tsMs) && Number.isFinite(p.m2Trillions) && p.m2Trillions > 0) {
        combined.push({ tsMs: p.tsMs, m2Trillions: p.m2Trillions });
      }
    }
  }
  if (latestM2Trillions && Number.isFinite(latestM2Trillions) && latestM2Trillions > 0) {
    combined.push({ tsMs: Date.UTC(2026, 10, 26), m2Trillions: latestM2Trillions });
  }
  combined.sort((a, b) => a.tsMs - b.tsMs);

  if (combined.length === 0) return 21.7;
  if (!Number.isFinite(targetTsMs) || targetTsMs <= combined[0].tsMs) {
    return combined[0].m2Trillions;
  }
  if (targetTsMs >= combined[combined.length - 1].tsMs) {
    return combined[combined.length - 1].m2Trillions;
  }

  for (let i = 1; i < combined.length; i += 1) {
    const prev = combined[i - 1];
    const curr = combined[i];
    if (targetTsMs <= curr.tsMs) {
      const span = Math.max(1, curr.tsMs - prev.tsMs);
      const t = (targetTsMs - prev.tsMs) / span;
      return prev.m2Trillions + t * (curr.m2Trillions - prev.m2Trillions);
    }
  }
  return combined[combined.length - 1].m2Trillions;
}

const TIMELINE_STOP_MILESTONE_IDS: Record<string, string[]> = {
  '1913': ['1913', '1944', '1971', '2000', '2008', '2016', '2020', '2024'],
  '1971': ['1971', '1980', '2000', '2008', '2016', '2020', '2024'],
  '2000': ['2000', '2008', '2013', '2016', '2020', '2022', '2024', '2025_MAY'],
  '2008': ['2008', '2010', '2013', '2016', '2020', '2022', '2024', '2025_MAY'],
  '2016': ['2016', '2017', '2020', '2021', '2022', '2024', '2025_MAY', '2026_MAY'],
  '2020': ['2020', '2021', '2022', '2024', '2024_NOV', '2025_MAY', '2026_MAY'],
  '2024': ['2024', '2024_NOV', '2025_MAY', '2025_NOV', '2026_MAY'],
  PRESENT_ALL_TIME: [
    '2010',
    '2013',
    '2015',
    '2017',
    '2020',
    '2022',
    '2024',
    '2025_MAY',
    '2026_MAY'
  ]
};

export function resolveBenchmarkSeriesForTimeline(
  dataset: M2BenchmarkDataset,
  timelineYear: string | null | undefined,
  horizon: MacroM2HorizonKey
): M2ChartPoint[] {
  const cleanYear = String(timelineYear || 'PRESENT')
    .trim()
    .toUpperCase();

  // Rolling windows on PRESENT use the live dataset rolling series directly
  if (cleanYear === 'PRESENT' && horizon !== 'ALL_TIME') {
    const rolling = dataset.seriesByHorizon[horizon] || dataset.seriesByHorizon.ALL_TIME;
    return rolling.map((pt) => ({
      ...pt,
      kasActive: true,
      btcActive: true,
      ethActive: true
    }));
  }

  const allTimeRaw = dataset.seriesByHorizon.ALL_TIME || [];
  const terminalRaw =
    allTimeRaw.length > 0
      ? allTimeRaw[allTimeRaw.length - 1]
      : DEFAULT_M2_BENCHMARK_DATASET.seriesByHorizon.ALL_TIME[
          DEFAULT_M2_BENCHMARK_DATASET.seriesByHorizon.ALL_TIME.length - 1
        ];

  const latestM2Trillions =
    dataset.latestM2Trillions > 0 ? dataset.latestM2Trillions : terminalRaw.m2Trillions;
  const latestBtc = dataset.spots?.btc ?? terminalRaw.btcPrice;
  const latestKas = dataset.spots?.kas ?? terminalRaw.kasPrice;
  const latestEth = dataset.spots?.eth ?? terminalRaw.ethPrice ?? 1782.23;
  const latestGold = dataset.spots?.gold ?? terminalRaw.goldPrice;
  const latestSpx = dataset.spots?.spx ?? terminalRaw.spxPrice;

  const scheduleKey =
    cleanYear === 'PRESENT'
      ? 'PRESENT_ALL_TIME'
      : TIMELINE_STOP_MILESTONE_IDS[cleanYear]
      ? cleanYear
      : 'PRESENT_ALL_TIME';
  const milestoneIds = TIMELINE_STOP_MILESTONE_IDS[scheduleKey];
  const milestoneMap = new Map(MACRO_HISTORICAL_MILESTONES.map((m) => [m.id, m]));
  const chosenMilestones = milestoneIds
    .map((id) => milestoneMap.get(id))
    .filter((m): m is MacroHistoricalMilestone => Boolean(m));

  if (chosenMilestones.length === 0) {
    return allTimeRaw;
  }

  const isHistoricalStop = cleanYear !== 'PRESENT';
  const numericStopYear = isHistoricalStop ? Number(cleanYear) : 2026;

  // At historical Time Machine stops, only assets that existed by numericStopYear are active
  const allowKas = !isHistoricalStop || numericStopYear >= 2021;
  const allowEth = !isHistoricalStop || numericStopYear >= 2015;
  const allowBtcFromStart = !isHistoricalStop || numericStopYear >= 2008;

  const startMilestone = chosenMilestones[0];
  const m2Base = startMilestone.m2Trillions;
  const goldBase = startMilestone.goldPrice;
  const spxBase = startMilestone.spxPrice;

  // Determine each digital asset's inception baseline within this window
  const btcGenesisMilestone = chosenMilestones.find((m) => m.btcPrice !== null) ?? null;
  const btcStartMilestone = allowBtcFromStart ? btcGenesisMilestone : null;
  const ethStartMilestone = allowEth
    ? chosenMilestones.find((m) => m.ethPrice !== null) ?? null
    : null;
  const kasStartMilestone = allowKas
    ? chosenMilestones.find((m) => m.kasPrice !== null) ?? null
    : null;

  const btcBase =
    (btcStartMilestone?.btcPrice ?? btcGenesisMilestone?.btcPrice) ?? BTC_GENESIS_JUL10_PRICE;
  const btcBaseM2 =
    (btcStartMilestone?.m2Trillions ?? btcGenesisMilestone?.m2Trillions) ?? 8.6224;

  const ethBase = ethStartMilestone?.ethPrice ?? 2.77;
  const ethBaseBtc = ethStartMilestone?.btcPrice ?? 279.0;
  const ethBaseM2 = ethStartMilestone?.m2Trillions ?? 12.104;

  const kasBase = kasStartMilestone?.kasPrice ?? KAS_GENESIS_MAY22_PRICE;
  const kasBaseBtc = kasStartMilestone?.btcPrice ?? 29907.0;
  const kasBaseM2 = kasStartMilestone?.m2Trillions ?? 21.7;

  const points: M2ChartPoint[] = chosenMilestones.map((m) => {
    const hasBtcQuote = Boolean(
      btcGenesisMilestone && m.tsMs >= btcGenesisMilestone.tsMs && m.btcPrice !== null
    );
    const btcActive = Boolean(
      btcStartMilestone && m.tsMs >= btcStartMilestone.tsMs && m.btcPrice !== null
    );
    const ethActive = Boolean(
      ethStartMilestone && m.tsMs >= ethStartMilestone.tsMs && m.ethPrice !== null
    );
    const kasActive = Boolean(
      kasStartMilestone && m.tsMs >= kasStartMilestone.tsMs && m.kasPrice !== null
    );

    const curBtc = hasBtcQuote && m.btcPrice ? m.btcPrice : btcBase;
    const curEth = ethActive && m.ethPrice ? m.ethPrice : ethBase;
    const curKas = kasActive && m.kasPrice ? m.kasPrice : kasBase;

    return {
      tsMs: m.tsMs,
      label: m.label,
      event: m.event,
      m2Trillions: m.m2Trillions,
      m2Mult: Number((m.m2Trillions / m2Base).toFixed(4)),
      btcMult: hasBtcQuote ? Number((curBtc / btcBase).toFixed(4)) : 1.0,
      ethMult: ethActive ? Number((curEth / ethBase).toFixed(4)) : 1.0,
      kasMult: kasActive ? Number((curKas / kasBase).toFixed(4)) : 1.0,
      goldMult: Number((m.goldPrice / goldBase).toFixed(4)),
      spxMult: Number((m.spxPrice / spxBase).toFixed(4)),
      btcPrice: curBtc,
      ethPrice: curEth,
      kasPrice: curKas,
      goldPrice: m.goldPrice,
      spxPrice: m.spxPrice,
      btcActive,
      ethActive,
      kasActive,
      btcStartM2Trillions: btcBaseM2,
      ethStartBtcPrice: ethBaseBtc,
      ethStartM2Trillions: ethBaseM2,
      kasStartBtcPrice: kasBaseBtc,
      kasStartM2Trillions: kasBaseM2
    };
  });

  const nowTsMs = Math.max(dataset.updatedAtMs || Date.now(), Date.UTC(2026, 10, 18));
  const endEvent =
    cleanYear === 'PRESENT'
      ? 'Live Spot (All Time Since Genesis)'
      : `Live Spot (${cleanYear} → Today)`;

  points.push({
    tsMs: nowTsMs,
    label: 'Now',
    event: endEvent,
    m2Trillions: latestM2Trillions,
    m2Mult: Number((latestM2Trillions / m2Base).toFixed(4)),
    btcMult: Number((latestBtc / btcBase).toFixed(4)),
    ethMult: ethStartMilestone ? Number((latestEth / ethBase).toFixed(4)) : 1.0,
    kasMult: kasStartMilestone ? Number((latestKas / kasBase).toFixed(4)) : 1.0,
    goldMult: Number((latestGold / goldBase).toFixed(4)),
    spxMult: Number((latestSpx / spxBase).toFixed(4)),
    btcPrice: latestBtc,
    ethPrice: latestEth,
    kasPrice: latestKas,
    goldPrice: latestGold,
    spxPrice: latestSpx,
    btcActive: Boolean(btcStartMilestone),
    ethActive: Boolean(ethStartMilestone),
    kasActive: Boolean(kasStartMilestone),
    btcStartM2Trillions: btcBaseM2,
    ethStartBtcPrice: ethBaseBtc,
    ethStartM2Trillions: ethBaseM2,
    kasStartBtcPrice: kasBaseBtc,
    kasStartM2Trillions: kasBaseM2
  });

  return points;
}

export interface ComputeM2AssetSummariesOptions {
  cohortRecord?: Pick<GainsCohortRecord, 'passed' | 'failed'> | null;
  liveSpots?: Record<string, number>;
  feedMode?: 'SNAPSHOT' | 'LIVE';
}

function summarizeM2BasketRows(
  rows: M2MatrixAssetItem[],
  side: 'PASSED' | 'FAILED'
): M2BasketCohortSummary {
  if (rows.length === 0) {
    return {
      side,
      count: 0,
      beatsCount: 0,
      avgNominalPct: 0,
      avgAdjustedPct: 0,
      avgAdjustedMult: 1.0
    };
  }
  const beatsCount = rows.filter((r) => r.beatsM2).length;
  const avgNominalPct = rows.reduce((s, r) => s + r.nominalPct, 0) / rows.length;
  const avgAdjustedMult = rows.reduce((s, r) => s + r.m2AdjustedMult, 0) / rows.length;
  const avgAdjustedPct = rows.reduce((s, r) => s + r.m2AdjustedPct, 0) / rows.length;
  return {
    side,
    count: rows.length,
    beatsCount,
    avgNominalPct,
    avgAdjustedPct,
    avgAdjustedMult
  };
}

export function computeM2AssetSummaries(
  points: M2ChartPoint[],
  timelineYear?: string | null,
  horizon: MacroM2HorizonKey = 'ALL_TIME',
  options?: ComputeM2AssetSummariesOptions
): M2HorizonSummary {
  if (!points || points.length === 0) {
    return {
      m2StartTrillions: 21.7,
      m2EndTrillions: 23.41,
      m2Mult: 1.079,
      m2Pct: 7.9,
      assets: [],
      cohortMatrix: []
    };
  }
  const first = points[0];
  const last = points[points.length - 1];
  const m2Mult = last.m2Mult > 0 ? last.m2Mult : 1;
  const m2Pct = (m2Mult - 1) * 100;

  const hasExplicitTimeline = timelineYear !== undefined && timelineYear !== null;
  const cleanYear = String(timelineYear || 'PRESENT')
    .trim()
    .toUpperCase();
  const isHistoricalStop = hasExplicitTimeline && cleanYear !== 'PRESENT';
  const numericYear = isHistoricalStop ? Number(cleanYear) : 2026;

  const windowTag = isHistoricalStop
    ? `${cleanYear} Open`
    : horizon === 'ALL_TIME'
    ? hasExplicitTimeline
      ? "Jul '10 Genesis"
      : "May '22 Open"
    : ({
        D180: '180D Open',
        Y1: '1Y Open',
        Y2: '2Y Open',
        Y4: '4Y Open'
      } as const)[horizon];

  const headingLabel = isHistoricalStop
    ? `${cleanYear} EPOCH OPEN → LIVE SPOT`
    : horizon === 'ALL_TIME'
    ? hasExplicitTimeline
      ? "ALL-TIME GENESIS (JUL '10) → LIVE SPOT"
      : "MAY '22 COMMON LAUNCH → LIVE SPOT"
    : ({
        D180: '180-DAY ROLLING WINDOW → LIVE SPOT',
        Y1: '1-YEAR ROLLING WINDOW → LIVE SPOT',
        Y2: '2-YEAR ROLLING WINDOW → LIVE SPOT',
        Y4: '4-YEAR CYCLE WINDOW → LIVE SPOT'
      } as const)[horizon];

  const makeEntry = (
    key: Exclude<M2SeriesKey, 'M2'>,
    startPrice: number,
    currentPrice: number,
    rawMult: number,
    opts?: {
      available?: boolean;
      customM2StartTrillions?: number;
      windowNote?: string;
      launchNote?: string;
    }
  ): M2AssetSummary => {
    const available = opts?.available ?? true;
    const effectiveM2Mult =
      opts?.customM2StartTrillions && opts.customM2StartTrillions > 0
        ? Math.max(0.01, last.m2Trillions / opts.customM2StartTrillions)
        : m2Mult;
    const nominalMult = available && rawMult > 0 ? rawMult : 1;
    const nominalPct = (nominalMult - 1) * 100;
    const m2AdjustedMult = available ? nominalMult / effectiveM2Mult : 1;
    const m2AdjustedPct = (m2AdjustedMult - 1) * 100;
    const meta = M2_SERIES_META[key];
    return {
      key,
      ticker: meta.ticker,
      name: meta.name,
      color: meta.color,
      available,
      windowNote: opts?.windowNote,
      launchNote: opts?.launchNote,
      startPrice,
      currentPrice,
      nominalMult,
      nominalPct,
      m2AdjustedMult,
      m2AdjustedPct,
      beatsM2: available && m2AdjustedMult >= 1.0
    };
  };

  let assets: M2AssetSummary[];
  let coreCards: M2AssetSummary[];

  if (!hasExplicitTimeline) {
    assets = [
      makeEntry('KAS', first.kasPrice, last.kasPrice, last.kasMult),
      makeEntry('BTC', first.btcPrice, last.btcPrice, last.btcMult),
      makeEntry('GOLD', first.goldPrice, last.goldPrice, last.goldMult),
      makeEntry('SPX', first.spxPrice, last.spxPrice, last.spxMult)
    ];
    coreCards = assets;
  } else {
    const kasFirstActive = points.find((p) => p.kasActive !== false);
    const btcFirstActive = points.find((p) => p.btcActive !== false);

    const kasAvailable = Boolean(kasFirstActive && last.kasActive !== false);
    const btcAvailable = Boolean(btcFirstActive && last.btcActive !== false);

    const kasCard = makeEntry(
      'KAS',
      kasFirstActive?.kasPrice ?? KAS_GENESIS_MAY22_PRICE,
      last.kasPrice,
      last.kasMult,
      {
        available: kasAvailable,
        customM2StartTrillions:
          kasAvailable && kasFirstActive && kasFirstActive.tsMs > first.tsMs
            ? last.kasStartM2Trillions
            : undefined,
        windowNote:
          kasAvailable && kasFirstActive && kasFirstActive.tsMs > first.tsMs
            ? `Since ${kasFirstActive.label}`
            : undefined,
        launchNote: !kasAvailable ? `Pre-Genesis in ${cleanYear} (Nov '21)` : undefined
      }
    );

    const btcCard = makeEntry(
      'BTC',
      btcFirstActive?.btcPrice ?? BTC_GENESIS_JUL10_PRICE,
      last.btcPrice,
      last.btcMult,
      {
        available: btcAvailable,
        customM2StartTrillions:
          btcAvailable && btcFirstActive && btcFirstActive.tsMs > first.tsMs
            ? last.btcStartM2Trillions
            : undefined,
        windowNote:
          btcAvailable && btcFirstActive && btcFirstActive.tsMs > first.tsMs
            ? `Since ${btcFirstActive.label}`
            : undefined,
        launchNote: !btcAvailable ? `Pre-Genesis in ${cleanYear} (Oct '08)` : undefined
      }
    );

    const goldCard = makeEntry('GOLD', first.goldPrice, last.goldPrice, last.goldMult);
    const spxCard = makeEntry('SPX', first.spxPrice, last.spxPrice, last.spxMult);

    coreCards = [kasCard, btcCard, goldCard, spxCard];
    assets = coreCards.filter((c) => c.available !== false);
  }

  // Synchronize full Passed (E > 0) and Failed (E = 0) audited baskets + S&P 500 vs US M2
  const cohortRecord = options?.cohortRecord ?? null;
  const liveSpots = options?.liveSpots || {};
  const feedMode = options?.feedMode || 'LIVE';

  const cohortMatrix: M2MatrixAssetItem[] = [];
  const seenTickers = new Set<string>();
  const timelineBaselineMode = hasExplicitTimeline
    ? resolveTimelineBaselineMode(cleanYear, horizon === 'ALL_TIME' ? 'ALL_TIME' : horizon)
    : null;

  const resolveCohortItemVsM2 = (
    item: CohortAssetEntry,
    side: 'PASSED' | 'FAILED'
  ): M2MatrixAssetItem | null => {
    if (seenTickers.has(item.ticker)) return null;

    if (item.ticker === 'KAS' || item.ticker === 'BTC' || item.ticker === 'XAU') {
      const coreKey = item.ticker === 'XAU' ? 'GOLD' : (item.ticker as 'KAS' | 'BTC');
      const core = assets.find((a) => a.key === coreKey);
      seenTickers.add(item.ticker);
      if (!core) return null;
      return {
        id: `${side}:${item.ticker}`,
        ticker: item.ticker,
        auditTicker: item.ticker,
        name: item.name,
        grade: item.grade,
        side,
        color: core.color,
        windowNote: core.windowNote,
        startPrice: core.startPrice,
        currentPrice: core.currentPrice,
        nominalMult: core.nominalMult,
        nominalPct: core.nominalPct,
        m2AdjustedMult: core.m2AdjustedMult,
        m2AdjustedPct: core.m2AdjustedPct,
        beatsM2: core.beatsM2
      };
    }

    if (item.ticker === 'ETH') {
      const ethFirstActive = hasExplicitTimeline
        ? points.find((p) => p.ethActive !== false)
        : first;
      const ethAvailable = hasExplicitTimeline
        ? Boolean(ethFirstActive && last.ethActive !== false)
        : true;
      seenTickers.add('ETH');
      if (!ethAvailable || !ethFirstActive) return null;

      const startPrice =
        ethFirstActive.ethPrice && ethFirstActive.ethPrice > 0
          ? ethFirstActive.ethPrice
          : hasExplicitTimeline
          ? 2.77
          : 1940;
      const liveEth = feedMode === 'LIVE' ? Number(liveSpots.ETH) : NaN;
      const currentPrice =
        feedMode === 'LIVE' && Number.isFinite(liveEth) && liveEth > 0
          ? liveEth
          : last.ethPrice && last.ethPrice > 0
          ? last.ethPrice
          : item.snapshotSpot ?? 1782.23;
      const customM2Start =
        hasExplicitTimeline &&
        ethFirstActive.tsMs > first.tsMs &&
        (last.ethStartM2Trillions ?? 0) > 0
          ? last.ethStartM2Trillions!
          : first.m2Trillions;
      const effectiveM2Mult =
        customM2Start > 0 ? Math.max(0.01, last.m2Trillions / customM2Start) : m2Mult;
      const nominalMult = currentPrice / startPrice;
      const nominalPct = (nominalMult - 1) * 100;
      const m2AdjustedMult = nominalMult / effectiveM2Mult;
      const m2AdjustedPct = (m2AdjustedMult - 1) * 100;

      return {
        id: `${side}:ETH`,
        ticker: 'ETH',
        auditTicker: 'ETH',
        name: item.name,
        grade: item.grade,
        side,
        color: '#A78BFA',
        windowNote:
          hasExplicitTimeline && ethFirstActive.tsMs > first.tsMs
            ? `Since ${ethFirstActive.label}`
            : undefined,
        startPrice,
        currentPrice,
        nominalMult,
        nominalPct,
        m2AdjustedMult,
        m2AdjustedPct,
        beatsM2: m2AdjustedMult >= 1.0
      };
    }

    const liveVal = feedMode === 'LIVE' ? Number(liveSpots[item.ticker]) : NaN;
    const spotPrice =
      feedMode === 'LIVE' && Number.isFinite(liveVal) && liveVal > 0
        ? liveVal
        : item.snapshotSpot;
    if (!spotPrice || spotPrice <= 0) return null;

    let startPrice: number | null = null;
    let matchingM2Mult = m2Mult;
    let windowNote: string | undefined;

    if (!hasExplicitTimeline) {
      if (horizon === 'D180') {
        startPrice = item.price180d ?? null;
      } else if (horizon === 'Y1') {
        startPrice = item.price1y ?? null;
      } else if (horizon === 'Y2') {
        startPrice = item.price2y ?? null;
      } else if (horizon === 'Y4') {
        startPrice = item.price4y ?? null;
      } else {
        const launchTs = parseReleaseLabelTimestampMs(item.releaseLabel);
        if (launchTs && launchTs > KAS_GENESIS_MAY22_MS + 30 * DAY_MS) {
          startPrice = item.releasePrice ?? item.basePrice ?? null;
          const m2AtLaunch = findHistoricalM2TrillionsAt(launchTs, points, last.m2Trillions);
          if (m2AtLaunch > 0 && last.m2Trillions > 0) {
            matchingM2Mult = Math.max(0.01, last.m2Trillions / m2AtLaunch);
          }
          const m = item.releaseLabel?.match(/\(([^)]+)\)/);
          if (m) windowNote = `Since ${m[1]}`;
        } else {
          startPrice = item.basePrice ?? item.releasePrice ?? null;
        }
      }
    } else if (timelineBaselineMode === 'RELEASE') {
      const jul2010Open = JUL_2010_BENCHMARK_OPEN_PRICES[item.ticker];
      if (jul2010Open !== undefined) {
        startPrice = jul2010Open;
        windowNote = "Since Jul '10";
      } else {
        const resolved = resolveCohortBaselinePrice(item, 'RELEASE');
        startPrice = resolved.price;
        const launchTs = parseReleaseLabelTimestampMs(item.releaseLabel);
        if (launchTs && launchTs > BTC_GENESIS_JUL10_MS + 15 * DAY_MS) {
          const m2AtLaunch = findHistoricalM2TrillionsAt(launchTs, points, last.m2Trillions);
          if (m2AtLaunch > 0 && last.m2Trillions > 0) {
            matchingM2Mult = Math.max(0.01, last.m2Trillions / m2AtLaunch);
          }
          const m = item.releaseLabel?.match(/\(([^)]+)\)/);
          if (m) {
            windowNote = /krc-20/i.test(m[1]) ? "Since Jun '24" : `Since ${m[1]}`;
          }
        }
      }
    } else if (timelineBaselineMode) {
      const resolved = resolveCohortBaselinePrice(item, timelineBaselineMode);
      startPrice = resolved.price;
      if (isHistoricalStop && startPrice && startPrice > 0) {
        const launchTs = parseReleaseLabelTimestampMs(resolved.label);
        if (launchTs && launchTs > first.tsMs + 20 * DAY_MS) {
          const m2AtLaunch = findHistoricalM2TrillionsAt(launchTs, points, last.m2Trillions);
          if (m2AtLaunch > 0 && last.m2Trillions > 0) {
            matchingM2Mult = Math.max(0.01, last.m2Trillions / m2AtLaunch);
          }
          const m = resolved.label.match(/\(([^)]+)\)/);
          if (m && !/open|est/i.test(m[1])) {
            windowNote = `Since ${m[1]}`;
          }
        } else if (numericYear < 2008 && !windowNote) {
          windowNote = `Since ${cleanYear}`;
        }
      }
    }

    if (!startPrice || startPrice <= 0) return null;

    const nominalMult = spotPrice / startPrice;
    const nominalPct = (nominalMult - 1) * 100;
    const m2AdjustedMult = nominalMult / Math.max(0.01, matchingM2Mult);
    const m2AdjustedPct = (m2AdjustedMult - 1) * 100;

    seenTickers.add(item.ticker);
    return {
      id: `${side}:${item.ticker}`,
      ticker: item.ticker,
      auditTicker: item.ticker,
      name: item.name,
      grade: item.grade,
      side,
      color: side === 'PASSED' ? '#34D399' : '#EF4444',
      windowNote,
      startPrice,
      currentPrice: spotPrice,
      nominalMult,
      nominalPct,
      m2AdjustedMult,
      m2AdjustedPct,
      beatsM2: m2AdjustedMult >= 1.0
    };
  };

  if (cohortRecord) {
    for (const p of cohortRecord.passed) {
      const row = resolveCohortItemVsM2(p, 'PASSED');
      if (row) cohortMatrix.push(row);
    }
    for (const f of cohortRecord.failed) {
      const row = resolveCohortItemVsM2(f, 'FAILED');
      if (row) cohortMatrix.push(row);
    }
  } else {
    for (const core of assets) {
      if (core.key === 'SPX') continue;
      cohortMatrix.push({
        id: `CORE:${core.key}`,
        ticker: core.ticker,
        auditTicker: core.key === 'GOLD' ? 'XAU' : core.ticker,
        name: core.name,
        grade: core.key === 'KAS' ? 'A+' : core.key === 'BTC' ? 'B+' : 'B',
        side: 'PASSED',
        color: core.color,
        windowNote: core.windowNote,
        startPrice: core.startPrice,
        currentPrice: core.currentPrice,
        nominalMult: core.nominalMult,
        nominalPct: core.nominalPct,
        m2AdjustedMult: core.m2AdjustedMult,
        m2AdjustedPct: core.m2AdjustedPct,
        beatsM2: core.beatsM2
      });
    }
  }

  const spxCore = assets.find((a) => a.key === 'SPX');
  if (spxCore) {
    cohortMatrix.push({
      id: 'MACRO:SPX',
      ticker: 'S&P 500',
      auditTicker: null,
      name: 'S&P 500 Index',
      grade: 'INDEX',
      side: 'MACRO',
      color: '#60A5FA',
      isIndexPoints: true,
      windowNote: spxCore.windowNote,
      startPrice: spxCore.startPrice,
      currentPrice: spxCore.currentPrice,
      nominalMult: spxCore.nominalMult,
      nominalPct: spxCore.nominalPct,
      m2AdjustedMult: spxCore.m2AdjustedMult,
      m2AdjustedPct: spxCore.m2AdjustedPct,
      beatsM2: spxCore.beatsM2
    });
  }

  cohortMatrix.sort((a, b) => b.m2AdjustedPct - a.m2AdjustedPct);

  const passedBasketSummary = summarizeM2BasketRows(
    cohortMatrix.filter((r) => r.side === 'PASSED'),
    'PASSED'
  );
  const failedBasketSummary = summarizeM2BasketRows(
    cohortMatrix.filter((r) => r.side === 'FAILED'),
    'FAILED'
  );

  return {
    m2StartTrillions: first.m2Trillions,
    m2EndTrillions: last.m2Trillions,
    m2Mult,
    m2Pct,
    windowTag,
    headingLabel,
    assets,
    coreCards,
    cohortMatrix,
    passedBasketSummary,
    failedBasketSummary
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
