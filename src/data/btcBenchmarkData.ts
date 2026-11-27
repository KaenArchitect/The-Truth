import {
  resolveCohortBaselinePrice,
  resolveTimelineBaselineMode,
  type CohortAssetEntry,
  type GainsCohortRecord
} from './gainsCohortData.ts';
import {
  BTC_GENESIS_JUL10_MS,
  BTC_GENESIS_JUL10_PRICE,
  JUL_2010_BENCHMARK_OPEN_PRICES,
  KAS_GENESIS_MAY22_MS,
  KAS_GENESIS_MAY22_PRICE,
  findClosestBarPrice,
  findHistoricalBtcPriceAt,
  parseReleaseLabelTimestampMs,
  type M2ChartPoint,
  type MacroM2HorizonKey
} from './m2BenchmarkData.ts';

export { parseReleaseLabelTimestampMs };

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
  available?: boolean;
  windowNote?: string;
  launchNote?: string;
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

export interface BtcBasketCohortSummary {
  side: 'PASSED' | 'FAILED';
  count: number;
  beatsCount: number;
  avgNominalPct: number;
  avgAdjustedPct: number;
  avgAdjustedMult: number;
}

export interface BtcHorizonSummary {
  btcStartPrice: number;
  btcEndPrice: number;
  btcMult: number;
  btcPct: number;
  windowTag?: string;
  headingLabel?: string;
  assets: BtcAssetSummary[];
  coreCards?: BtcAssetSummary[];
  cohortMatrix: BtcMatrixAssetItem[];
  passedBasketSummary?: BtcBasketCohortSummary;
  failedBasketSummary?: BtcBasketCohortSummary;
}

function summarizeBtcBasketRows(
  rows: BtcMatrixAssetItem[],
  side: 'PASSED' | 'FAILED'
): BtcBasketCohortSummary {
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
  const beatsCount = rows.filter((r) => r.beatsBtc).length;
  const avgNominalPct = rows.reduce((s, r) => s + r.nominalPct, 0) / rows.length;
  const avgAdjustedMult = rows.reduce((s, r) => s + r.btcAdjustedMult, 0) / rows.length;
  const avgAdjustedPct = rows.reduce((s, r) => s + r.btcAdjustedPct, 0) / rows.length;
  return {
    side,
    count: rows.length,
    beatsCount,
    avgNominalPct,
    avgAdjustedPct,
    avgAdjustedMult
  };
}

export function transformBtcPointForMode(
  pt: M2ChartPoint,
  mode: BtcComparisonMode
): Record<BtcSeriesKey, number> {
  const ethRaw = pt.ethMult && pt.ethMult > 0 ? pt.ethMult : 1.0;
  if (mode === 'PRICED_IN_BTC') {
    const denom = Math.max(0.05, pt.btcMult);
    const kasDenom =
      pt.kasStartBtcPrice && pt.kasStartBtcPrice > 0 && pt.btcPrice > 0
        ? Math.max(0.05, pt.btcPrice / pt.kasStartBtcPrice)
        : denom;
    const ethDenom =
      pt.ethStartBtcPrice && pt.ethStartBtcPrice > 0 && pt.btcPrice > 0
        ? Math.max(0.05, pt.btcPrice / pt.ethStartBtcPrice)
        : denom;
    return {
      KAS: Math.max(1e-7, pt.kasMult / kasDenom),
      ETH: Math.max(1e-7, ethRaw / ethDenom),
      GOLD: Math.max(1e-7, pt.goldMult / denom),
      SPX: Math.max(1e-7, pt.spxMult / denom),
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

export function transformBtcPointNullable(
  pt: M2ChartPoint,
  mode: BtcComparisonMode
): Record<BtcSeriesKey, number | null> {
  const base = transformBtcPointForMode(pt, mode);
  const preBtcGenesis = pt.tsMs < Date.UTC(2008, 9, 1);
  return {
    KAS: pt.kasActive === false ? null : base.KAS,
    ETH: pt.ethActive === false ? null : base.ETH,
    GOLD: preBtcGenesis && mode === 'PRICED_IN_BTC' ? null : base.GOLD,
    SPX: preBtcGenesis && mode === 'PRICED_IN_BTC' ? null : base.SPX,
    BTC: preBtcGenesis ? null : base.BTC
  };
}

export function computeBtcHorizonSummary(params: {
  points: M2ChartPoint[];
  horizon: MacroM2HorizonKey;
  timelineYear?: string | null;
  cohortRecord?: Pick<GainsCohortRecord, 'passed' | 'failed'> | null;
  liveSpots?: Record<string, number>;
  feedMode?: 'SNAPSHOT' | 'LIVE';
}): BtcHorizonSummary {
  const {
    points,
    horizon,
    timelineYear,
    cohortRecord,
    liveSpots = {},
    feedMode = 'LIVE'
  } = params;
  if (!points || points.length === 0) {
    return {
      btcStartPrice: BTC_GENESIS_JUL10_PRICE,
      btcEndPrice: 63004,
      btcMult: 1260080,
      btcPct: 126007900,
      assets: [],
      cohortMatrix: []
    };
  }

  const hasExplicitTimeline = timelineYear !== undefined && timelineYear !== null;
  const cleanYear = String(timelineYear || 'PRESENT')
    .trim()
    .toUpperCase();
  const isHistoricalStop = hasExplicitTimeline && cleanYear !== 'PRESENT';
  const numericYear = isHistoricalStop ? Number(cleanYear) : 2026;

  const first = points[0];
  const last = points[points.length - 1];

  const btcFirstPoint = hasExplicitTimeline
    ? points.find((p) => p.tsMs >= Date.UTC(2008, 9, 1) && p.btcPrice > 0) ?? first
    : first;
  const btcStartPrice =
    btcFirstPoint.btcPrice > 0 ? btcFirstPoint.btcPrice : BTC_GENESIS_JUL10_PRICE;
  const btcEndPrice = last.btcPrice;
  const btcMult = hasExplicitTimeline
    ? btcStartPrice > 0
      ? btcEndPrice / btcStartPrice
      : 1.0
    : last.btcMult > 0
    ? last.btcMult
    : 1.0;
  const btcPct = (btcMult - 1) * 100;

  const windowTag = isHistoricalStop
    ? numericYear >= 2016
      ? `${cleanYear} Open`
      : numericYear === 2008
      ? '2008 Genesis'
      : "Jul '10 Genesis"
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

  const makeCoreEntry = (
    key: Exclude<BtcSeriesKey, 'BTC'>,
    startPrice: number,
    currentPrice: number,
    rawMult: number,
    opts?: {
      available?: boolean;
      customBtcMult?: number;
      windowNote?: string;
      launchNote?: string;
    }
  ): BtcAssetSummary => {
    const available = opts?.available ?? true;
    const effectiveBtcMult =
      opts?.customBtcMult && opts.customBtcMult > 0 ? opts.customBtcMult : btcMult;
    const nominalMult = available && rawMult > 0 ? rawMult : 1.0;
    const nominalPct = (nominalMult - 1) * 100;
    const btcAdjustedMult = available ? nominalMult / Math.max(0.0001, effectiveBtcMult) : 1.0;
    const btcAdjustedPct = (btcAdjustedMult - 1) * 100;
    const meta = BTC_SERIES_META[key];
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
      btcAdjustedMult,
      btcAdjustedPct,
      beatsBtc: available && btcAdjustedMult >= 1.0
    };
  };

  let assets: BtcAssetSummary[];
  let coreCards: BtcAssetSummary[];

  if (!hasExplicitTimeline) {
    const firstEthPrice = first.ethPrice && first.ethPrice > 0 ? first.ethPrice : 1940;
    const lastEthPrice = last.ethPrice && last.ethPrice > 0 ? last.ethPrice : 1782.23;
    const lastEthMult =
      last.ethMult && last.ethMult > 0
        ? last.ethMult
        : firstEthPrice > 0
        ? lastEthPrice / firstEthPrice
        : 1.0;

    assets = [
      makeCoreEntry('KAS', first.kasPrice, last.kasPrice, last.kasMult),
      makeCoreEntry('ETH', firstEthPrice, lastEthPrice, lastEthMult),
      makeCoreEntry('GOLD', first.goldPrice, last.goldPrice, last.goldMult),
      makeCoreEntry('SPX', first.spxPrice, last.spxPrice, last.spxMult)
    ];
    coreCards = assets;
  } else {
    const kasFirstActive = points.find((p) => p.kasActive !== false);
    const ethFirstActive = points.find((p) => p.ethActive !== false);
    const kasAvailable = Boolean(kasFirstActive && last.kasActive !== false);
    const ethAvailable = Boolean(ethFirstActive && last.ethActive !== false);

    const kasStart = kasFirstActive?.kasPrice ?? KAS_GENESIS_MAY22_PRICE;
    const kasNomMult = kasAvailable && kasStart > 0 ? last.kasPrice / kasStart : 1.0;
    const kasCustomBtcMult =
      kasAvailable &&
      kasFirstActive &&
      kasFirstActive.tsMs > btcFirstPoint.tsMs &&
      (last.kasStartBtcPrice ?? 0) > 0
        ? last.btcPrice / last.kasStartBtcPrice!
        : undefined;

    const ethStart = ethFirstActive?.ethPrice ?? 2.77;
    const lastEthPrice = last.ethPrice && last.ethPrice > 0 ? last.ethPrice : 1782.23;
    const ethNomMult = ethAvailable && ethStart > 0 ? lastEthPrice / ethStart : 1.0;
    const ethCustomBtcMult =
      ethAvailable &&
      ethFirstActive &&
      ethFirstActive.tsMs > btcFirstPoint.tsMs &&
      (last.ethStartBtcPrice ?? 0) > 0
        ? last.btcPrice / last.ethStartBtcPrice!
        : undefined;

    const pre2008Note = isHistoricalStop && numericYear < 2008 ? `Since ${cleanYear}` : undefined;

    const kasCard = makeCoreEntry('KAS', kasStart, last.kasPrice, kasNomMult, {
      available: kasAvailable,
      customBtcMult: kasCustomBtcMult,
      windowNote:
        kasAvailable && kasFirstActive && kasFirstActive.tsMs > first.tsMs
          ? `Since ${kasFirstActive.label}`
          : undefined,
      launchNote: !kasAvailable ? `Pre-Genesis in ${cleanYear} (Nov '21)` : undefined
    });

    const ethCard = makeCoreEntry('ETH', ethStart, lastEthPrice, ethNomMult, {
      available: ethAvailable,
      customBtcMult: ethCustomBtcMult,
      windowNote:
        ethAvailable && ethFirstActive && ethFirstActive.tsMs > first.tsMs
          ? `Since ${ethFirstActive.label}`
          : undefined,
      launchNote: !ethAvailable ? `Pre-Genesis in ${cleanYear} (Aug '15)` : undefined
    });

    const goldCard = makeCoreEntry('GOLD', first.goldPrice, last.goldPrice, last.goldMult, {
      windowNote: pre2008Note
    });

    const spxCard = makeCoreEntry('SPX', first.spxPrice, last.spxPrice, last.spxMult, {
      windowNote: pre2008Note
    });

    coreCards = [kasCard, ethCard, goldCard, spxCard];
    assets = coreCards.filter((c) => c.available !== false);
  }

  // Build full synchronized cohort matrix (all liquid basket assets + S&P 500) vs BTC
  const btcBarsFromPoints = points
    .filter((p) => p.tsMs >= Date.UTC(2008, 9, 1) && p.btcPrice > 0)
    .map((p) => ({ tsMs: p.tsMs, price: p.btcPrice }));
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
      windowNote: spx.windowNote,
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

  const timelineBaselineMode = hasExplicitTimeline
    ? resolveTimelineBaselineMode(cleanYear, horizon === 'ALL_TIME' ? 'ALL_TIME' : horizon)
    : null;

  const resolveCohortItemVsBtc = (
    item: CohortAssetEntry,
    side: 'PASSED' | 'FAILED'
  ): BtcMatrixAssetItem | null => {
    if (item.ticker === 'BTC' || seenTickers.has(item.ticker)) return null;

    // Synchronize exact series endpoints for flagship chart tickers so top cards & matrix match 1:1
    if (item.ticker === 'KAS' || item.ticker === 'ETH' || item.ticker === 'XAU') {
      const coreKey = item.ticker === 'XAU' ? 'GOLD' : (item.ticker as 'KAS' | 'ETH');
      const core = assets.find((a) => a.key === coreKey);
      if (!core) {
        seenTickers.add(item.ticker);
        return null;
      }
      seenTickers.add(item.ticker);
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
        btcAdjustedMult: core.btcAdjustedMult,
        btcAdjustedPct: core.btcAdjustedPct,
        beatsBtc: core.beatsBtc
      };
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
    } else if (timelineBaselineMode === 'RELEASE') {
      // PRESENT + ALL_TIME: align pre-2010 metals & fiat currencies to Jul '10 BTC Genesis, and post-2010 assets to exact inception
      const jul2010Open = JUL_2010_BENCHMARK_OPEN_PRICES[item.ticker];
      if (jul2010Open !== undefined) {
        startPrice = jul2010Open;
        windowNote = "Since Jul '10";
      } else {
        const resolved = resolveCohortBaselinePrice(item, 'RELEASE');
        startPrice = resolved.price;
        const launchTs = parseReleaseLabelTimestampMs(item.releaseLabel);
        if (launchTs && launchTs > BTC_GENESIS_JUL10_MS + 15 * 86400000) {
          const btcAtLaunch = findHistoricalBtcPriceAt(launchTs, btcBarsFromPoints, last.btcPrice);
          if (btcAtLaunch > 0 && last.btcPrice > 0) {
            matchingBtcMult = last.btcPrice / btcAtLaunch;
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
        if (numericYear < 2008) {
          windowNote = `Since ${cleanYear}`;
        } else {
          const launchTs = parseReleaseLabelTimestampMs(resolved.label);
          if (launchTs && launchTs > first.tsMs + 20 * 86400000) {
            const btcAtLaunch = findHistoricalBtcPriceAt(
              launchTs,
              btcBarsFromPoints,
              last.btcPrice
            );
            if (btcAtLaunch > 0 && last.btcPrice > 0) {
              matchingBtcMult = last.btcPrice / btcAtLaunch;
            }
            const m = resolved.label.match(/\(([^)]+)\)/);
            if (m && !/open|est/i.test(m[1])) {
              windowNote = `Since ${m[1]}`;
            }
          }
        }
      }
    }

    if (!startPrice || startPrice <= 0) return null;

    const nominalMult = spotPrice / startPrice;
    const nominalPct = (nominalMult - 1) * 100;
    const btcAdjustedMult = nominalMult / Math.max(0.0001, matchingBtcMult);
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
        windowNote: core.windowNote,
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

  const passedBasketSummary = summarizeBtcBasketRows(
    cohortMatrix.filter((r) => r.side === 'PASSED'),
    'PASSED'
  );
  const failedBasketSummary = summarizeBtcBasketRows(
    cohortMatrix.filter((r) => r.side === 'FAILED'),
    'FAILED'
  );

  return {
    btcStartPrice,
    btcEndPrice,
    btcMult,
    btcPct,
    windowTag,
    headingLabel,
    assets,
    coreCards,
    cohortMatrix,
    passedBasketSummary,
    failedBasketSummary
  };
}
