import type { CohortAssetEntry, GainsCohortRecord } from './gainsCohortData.ts';
import {
  KAS_GENESIS_MAY22_MS,
  findClosestBarPrice,
  type M2ChartPoint,
  type MacroM2HorizonKey
} from './m2BenchmarkData.ts';

export type BtcSeriesKey = 'KAS' | 'ETH' | 'GOLD' | 'SPX' | 'BTC';
export type BtcComparisonMode = 'INDEXED' | 'PRICED_IN_BTC';

export interface BtcSeriesMeta {
  key: BtcSeriesKey;
  ticker: string;
  name: string;
  color: string;
  dashed?: boolean;
}

export const BTC_SERIES_META: Record<BtcSeriesKey, BtcSeriesMeta> = {
  KAS: {
    key: 'KAS',
    ticker: 'KAS',
    name: 'Kaspa',
    color: '#49EACB'
  },
  ETH: {
    key: 'ETH',
    ticker: 'ETH',
    name: 'Ethereum',
    color: '#A78BFA'
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
  BTC: {
    key: 'BTC',
    ticker: 'BTC',
    name: 'Bitcoin',
    color: '#F59E0B',
    dashed: true
  }
};

export interface BtcAssetSummary {
  key: Exclude<BtcSeriesKey, 'BTC'>;
  ticker: string;
  name: string;
  color: string;
  startPrice: number;
  currentPrice: number;
  nominalMult: number;
  nominalPct: number;
  btcAdjustedMult: number;
  btcAdjustedPct: number;
  beatsBtc: boolean;
}

export interface BtcMatrixAssetItem {
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
  btcAdjustedMult: number;
  btcAdjustedPct: number;
  beatsBtc: boolean;
}

export interface BtcHorizonSummary {
  btcStartPrice: number;
  btcEndPrice: number;
  btcMult: number;
  btcPct: number;
  assets: BtcAssetSummary[];
  cohortMatrix: BtcMatrixAssetItem[];
}

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
    const yr = 2000 + Number(monthYearMatch[2]);
    if (monIdx !== undefined && Number.isFinite(yr)) {
      return Date.UTC(yr, monIdx, 15);
    }
  }
  const yearOnlyMatch = label.match(/\(\s*'(\d{2})\b/i);
  if (yearOnlyMatch) {
    const yr = 2000 + Number(yearOnlyMatch[1]);
    if (Number.isFinite(yr)) {
      return Date.UTC(yr, 2, 15);
    }
  }
  return null;
}

export function transformBtcPointForMode(
  pt: M2ChartPoint,
  mode: BtcComparisonMode
): Record<BtcSeriesKey, number> {
  const ethRaw = pt.ethMult && pt.ethMult > 0 ? pt.ethMult : 1.0;
  if (mode === 'PRICED_IN_BTC') {
    const denom = Math.max(0.05, pt.btcMult);
    return {
      KAS: Math.max(0.005, pt.kasMult / denom),
      ETH: Math.max(0.005, ethRaw / denom),
      GOLD: Math.max(0.005, pt.goldMult / denom),
      SPX: Math.max(0.005, pt.spxMult / denom),
      BTC: 1.0
    };
  }
  return {
    KAS: Math.max(0.01, pt.kasMult),
    ETH: Math.max(0.01, ethRaw),
    GOLD: Math.max(0.01, pt.goldMult),
    SPX: Math.max(0.01, pt.spxMult),
    BTC: Math.max(0.01, pt.btcMult)
  };
}

export function computeBtcHorizonSummary(params: {
  points: M2ChartPoint[];
  horizon: MacroM2HorizonKey;
  cohortRecord?: Pick<GainsCohortRecord, 'passed' | 'failed'> | null;
  liveSpots?: Record<string, number>;
  feedMode?: 'SNAPSHOT' | 'LIVE';
}): BtcHorizonSummary {
  const { points, horizon, cohortRecord, liveSpots = {}, feedMode = 'LIVE' } = params;
  if (!points || points.length === 0) {
    return {
      btcStartPrice: 29907,
      btcEndPrice: 63004,
      btcMult: 2.1067,
      btcPct: 110.67,
      assets: [],
      cohortMatrix: []
    };
  }

  const first = points[0];
  const last = points[points.length - 1];
  const btcMult = last.btcMult > 0 ? last.btcMult : 1.0;
  const btcPct = (btcMult - 1) * 100;

  const makeCoreEntry = (
    key: Exclude<BtcSeriesKey, 'BTC'>,
    startPrice: number,
    currentPrice: number,
    rawMult: number
  ): BtcAssetSummary => {
    const nominalMult = rawMult > 0 ? rawMult : 1.0;
    const nominalPct = (nominalMult - 1) * 100;
    const btcAdjustedMult = nominalMult / btcMult;
    const btcAdjustedPct = (btcAdjustedMult - 1) * 100;
    const meta = BTC_SERIES_META[key];
    return {
      key,
      ticker: meta.ticker,
      name: meta.name,
      color: meta.color,
      startPrice,
      currentPrice,
      nominalMult,
      nominalPct,
      btcAdjustedMult,
      btcAdjustedPct,
      beatsBtc: btcAdjustedMult >= 1.0
    };
  };

  const firstEthPrice = first.ethPrice && first.ethPrice > 0 ? first.ethPrice : 1940;
  const lastEthPrice = last.ethPrice && last.ethPrice > 0 ? last.ethPrice : 1782.23;
  const lastEthMult =
    last.ethMult && last.ethMult > 0
      ? last.ethMult
      : firstEthPrice > 0
      ? lastEthPrice / firstEthPrice
      : 1.0;

  const assets: BtcAssetSummary[] = [
    makeCoreEntry('KAS', first.kasPrice, last.kasPrice, last.kasMult),
    makeCoreEntry('ETH', firstEthPrice, lastEthPrice, lastEthMult),
    makeCoreEntry('GOLD', first.goldPrice, last.goldPrice, last.goldMult),
    makeCoreEntry('SPX', first.spxPrice, last.spxPrice, last.spxMult)
  ];

  // Build full synchronized cohort matrix (all liquid basket assets + S&P 500) vs BTC
  const btcBarsFromPoints = points.map((p) => ({ tsMs: p.tsMs, price: p.btcPrice }));
  const cohortMatrix: BtcMatrixAssetItem[] = [];
  const seenTickers = new Set<string>();

  const pushCoreMacroSpx = () => {
    const spx = assets.find((a) => a.key === 'SPX');
    if (!spx) return;
    cohortMatrix.push({
      id: 'MACRO:SPX',
      ticker: 'S&P 500',
      auditTicker: null,
      name: 'S&P 500 Index',
      grade: 'INDEX',
      side: 'MACRO',
      color: '#60A5FA',
      isIndexPoints: true,
      startPrice: spx.startPrice,
      currentPrice: spx.currentPrice,
      nominalMult: spx.nominalMult,
      nominalPct: spx.nominalPct,
      btcAdjustedMult: spx.btcAdjustedMult,
      btcAdjustedPct: spx.btcAdjustedPct,
      beatsBtc: spx.beatsBtc
    });
    seenTickers.add('SPX');
  };

  const resolveCohortItemVsBtc = (
    item: CohortAssetEntry,
    side: 'PASSED' | 'FAILED'
  ): BtcMatrixAssetItem | null => {
    if (item.ticker === 'BTC' || seenTickers.has(item.ticker)) return null;

    // Synchronize exact series endpoints for flagship chart tickers so top cards & matrix match 1:1
    if (item.ticker === 'KAS' || item.ticker === 'ETH' || item.ticker === 'XAU') {
      const coreKey = item.ticker === 'XAU' ? 'GOLD' : (item.ticker as 'KAS' | 'ETH');
      const core = assets.find((a) => a.key === coreKey);
      if (core) {
        seenTickers.add(item.ticker);
        return {
          id: `${side}:${item.ticker}`,
          ticker: item.ticker,
          auditTicker: item.ticker,
          name: item.name,
          grade: item.grade,
          side,
          color: core.color,
          startPrice: core.startPrice,
          currentPrice: core.currentPrice,
          nominalMult: core.nominalMult,
          nominalPct: core.nominalPct,
          btcAdjustedMult: core.btcAdjustedMult,
          btcAdjustedPct: core.btcAdjustedPct,
          beatsBtc: core.beatsBtc
        };
      }
    }

    const liveVal = feedMode === 'LIVE' ? Number(liveSpots[item.ticker]) : NaN;
    const spotPrice =
      feedMode === 'LIVE' && Number.isFinite(liveVal) && liveVal > 0
        ? liveVal
        : item.snapshotSpot;
    if (!spotPrice || spotPrice <= 0) return null;

    let startPrice: number | null = null;
    let matchingBtcMult = btcMult;
    let windowNote: string | undefined;

    if (horizon === 'D180') {
      startPrice = item.price180d ?? null;
    } else if (horizon === 'Y1') {
      startPrice = item.price1y ?? null;
    } else if (horizon === 'Y2') {
      startPrice = item.price2y ?? null;
    } else if (horizon === 'Y4') {
      startPrice = item.price4y ?? null;
    } else {
      // ALL_TIME: May '22 Common Launch window (or exact post-May-'22 launch date vs BTC over same span)
      const launchTs = parseReleaseLabelTimestampMs(item.releaseLabel);
      if (launchTs && launchTs > KAS_GENESIS_MAY22_MS + 30 * 86400000) {
        startPrice = item.releasePrice ?? item.basePrice ?? null;
        const btcAtLaunch = findClosestBarPrice(btcBarsFromPoints, launchTs) ?? first.btcPrice;
        if (btcAtLaunch > 0 && last.btcPrice > 0) {
          matchingBtcMult = last.btcPrice / btcAtLaunch;
        }
        const m = item.releaseLabel?.match(/\(([^)]+)\)/);
        if (m) windowNote = `Since ${m[1]}`;
      } else {
        startPrice = item.basePrice ?? item.releasePrice ?? null;
      }
    }

    if (!startPrice || startPrice <= 0) return null;

    const nominalMult = spotPrice / startPrice;
    const nominalPct = (nominalMult - 1) * 100;
    const btcAdjustedMult = nominalMult / Math.max(0.01, matchingBtcMult);
    const btcAdjustedPct = (btcAdjustedMult - 1) * 100;

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
      btcAdjustedMult,
      btcAdjustedPct,
      beatsBtc: btcAdjustedMult >= 1.0
    };
  };

  if (cohortRecord) {
    for (const p of cohortRecord.passed) {
      const row = resolveCohortItemVsBtc(p, 'PASSED');
      if (row) cohortMatrix.push(row);
    }
    for (const f of cohortRecord.failed) {
      const row = resolveCohortItemVsBtc(f, 'FAILED');
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
        grade: core.key === 'KAS' ? 'A+' : core.key === 'GOLD' ? 'B' : 'F',
        side: core.key === 'ETH' ? 'FAILED' : 'PASSED',
        color: core.color,
        startPrice: core.startPrice,
        currentPrice: core.currentPrice,
        nominalMult: core.nominalMult,
        nominalPct: core.nominalPct,
        btcAdjustedMult: core.btcAdjustedMult,
        btcAdjustedPct: core.btcAdjustedPct,
        beatsBtc: core.beatsBtc
      });
    }
  }

  pushCoreMacroSpx();

  cohortMatrix.sort((a, b) => b.btcAdjustedPct - a.btcAdjustedPct);

  return {
    btcStartPrice: first.btcPrice,
    btcEndPrice: last.btcPrice,
    btcMult,
    btcPct,
    assets,
    cohortMatrix
  };
}
