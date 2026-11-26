import fs from 'node:fs';
import {
  FAILED_COHORT_GAINS,
  PASSED_COHORT_GAINS,
  applySpotPricesToCohortRecord,
  buildBasketSyncedCohortRecord,
  classifyAuditBasketSide,
  formatCohortTimestampLabel,
  formatUsdPrice,
  normalizeCohortTicker,
  sanitizeCohortAssetEntry,
  sanitizeGainsCohortRecord,
  type CohortAssetEntry,
  type GainsCohortRecord,
  type GainsWindowHorizonKey,
  type MacroTrajectoryPoint,
  type ReleaseBaselineOverride,
  type WindowTrajectoriesMap
} from '../data/gainsCohortData.ts';
import { PRELOADED_AUDITS } from '../data/preloadedAudits.ts';

const GAINS_COHORT_FILE = '/tmp/truth_gains_cohort.json';
const LIVE_SYNC_TTL_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

interface HistoricalBar {
  tsMs: number;
  price: number;
}

let memoryCohort: GainsCohortRecord | null = null;
let lastLiveSyncCompletedAtMs = 0;
let lastLiveSpotMap: Record<string, number> = {};
const cachedBarsByTicker = new Map<string, HistoricalBar[]>();
let cachedWindowTrajectories: WindowTrajectoriesMap = {};
let inFlightLiveSync: Promise<{
  record: GainsCohortRecord;
  syncedTickers: string[];
  liveSpotMap: Record<string, number>;
  windowTrajectories: WindowTrajectoriesMap;
  extraResolvedEntries: Record<string, CohortAssetEntry>;
}> | null = null;

const CATALOG_META_BY_TICKER = new Map<string, CohortAssetEntry>(
  [...PASSED_COHORT_GAINS, ...FAILED_COHORT_GAINS].map((item) => [item.ticker, item])
);

function backfillCatalogMetadata(record: GainsCohortRecord): GainsCohortRecord {
  const enrich = (item: CohortAssetEntry): CohortAssetEntry => {
    const cat = CATALOG_META_BY_TICKER.get(item.ticker);
    if (!cat) return item;
    const releasePrice = item.releasePrice ?? cat.releasePrice ?? null;
    const releaseLabel = item.releaseLabel || cat.releaseLabel;
    const price180d = item.price180d !== undefined ? item.price180d : cat.price180d ?? null;
    const price1y = item.price1y !== undefined ? item.price1y : cat.price1y ?? null;
    const price2y = item.price2y !== undefined ? item.price2y : cat.price2y ?? null;
    const price4y = item.price4y !== undefined ? item.price4y : cat.price4y ?? null;
    const yahooSymbol =
      item.yahooSymbol !== undefined && item.yahooSymbol !== null
        ? item.yahooSymbol
        : cat.yahooSymbol ?? null;
    const hasBaseline =
      (item.basePrice !== null && item.basePrice > 0) ||
      (releasePrice !== null && releasePrice > 0) ||
      (price180d !== null && price180d > 0) ||
      (price1y !== null && price1y > 0) ||
      (price2y !== null && price2y > 0) ||
      (price4y !== null && price4y > 0);
    return {
      ...item,
      releasePrice,
      releaseLabel,
      price180d,
      price1y,
      price2y,
      price4y,
      yahooSymbol,
      liquidCycle: Boolean(item.liquidCycle || (hasBaseline && item.snapshotSpot && item.snapshotSpot > 0))
    };
  };

  return {
    ...record,
    passed: record.passed.map(enrich),
    failed: record.failed.map(enrich)
  };
}

function getDefaultSyncedCohort(): GainsCohortRecord {
  return buildBasketSyncedCohortRecord(PRELOADED_AUDITS);
}

function loadFromDisk(): GainsCohortRecord {
  try {
    if (fs.existsSync(GAINS_COHORT_FILE)) {
      const raw = fs.readFileSync(GAINS_COHORT_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<GainsCohortRecord>;
      return backfillCatalogMetadata(sanitizeGainsCohortRecord(parsed));
    }
  } catch (err) {
    console.warn('Could not read persisted gains cohort file (using defaults):', err);
  }
  return getDefaultSyncedCohort();
}

function saveToDisk(record: GainsCohortRecord): void {
  try {
    fs.writeFileSync(GAINS_COHORT_FILE, JSON.stringify(record), 'utf8');
  } catch (err) {
    console.warn('Could not persist gains cohort file:', err);
  }
}

export function getPersistedGainsCohort(): GainsCohortRecord {
  if (!memoryCohort) {
    memoryCohort = loadFromDisk();
  }
  return memoryCohort;
}

export function getCachedWindowTrajectories(): WindowTrajectoriesMap {
  return cachedWindowTrajectories;
}

export function savePersistedGainsCohort(
  rawPayload: Partial<GainsCohortRecord>
): GainsCohortRecord {
  const prev = getPersistedGainsCohort();
  const now = Date.now();
  const sanitized = backfillCatalogMetadata(
    sanitizeGainsCohortRecord({
      ...rawPayload,
      updatedAtMs: now,
      updatedAtLabel: formatCohortTimestampLabel(now),
      revision: Math.max((prev.revision || 1) + 1, Number(rawPayload.revision) || 1),
      isCustomized:
        rawPayload.isCustomized !== undefined ? Boolean(rawPayload.isCustomized) : false
    })
  );
  memoryCohort = sanitized;
  saveToDisk(sanitized);
  return sanitized;
}

export function resetPersistedGainsCohort(): GainsCohortRecord {
  const defaults = getDefaultSyncedCohort();
  memoryCohort = defaults;
  lastLiveSyncCompletedAtMs = 0;
  lastLiveSpotMap = {};
  cachedWindowTrajectories = {};
  saveToDisk(defaults);
  return defaults;
}

function findBarPriceNear(
  bars: HistoricalBar[],
  targetMs: number,
  maxDeltaDays = 35
): number | null {
  if (!bars || bars.length === 0) return null;
  if (bars[0].tsMs > targetMs + maxDeltaDays * DAY_MS) {
    // Asset had not launched yet at targetMs
    return null;
  }
  let best: HistoricalBar | null = null;
  let bestDiff = Infinity;
  for (const bar of bars) {
    const diff = Math.abs(bar.tsMs - targetMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = bar;
    }
  }
  if (!best || bestDiff > maxDeltaDays * DAY_MS) return null;
  return best.price;
}

interface YahooChartParsed {
  spotPrice: number | null;
  releasePrice: number | null;
  releaseLabel?: string;
  price180d: number | null;
  price1y: number | null;
  price2y: number | null;
  price4y: number | null;
  bars: HistoricalBar[];
}

async function fetchYahooReleaseAndSpot(symbol: string): Promise<YahooChartParsed | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        symbol
      )}?range=max&interval=1wk`,
      {
        signal: AbortSignal.timeout(6000),
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; ThermodynamicTruthBot/1.0)'
        }
      }
    );
    if (!res.ok) return null;

    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          meta?: { regularMarketPrice?: number };
          timestamp?: number[];
          indicators?: {
            quote?: Array<{
              open?: Array<number | null>;
              close?: Array<number | null>;
            }>;
          };
        }>;
      };
    };

    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const rawSpot = Number(result.meta?.regularMarketPrice);
    const spotPrice = Number.isFinite(rawSpot) && rawSpot > 0 ? rawSpot : null;

    const timestamps = Array.isArray(result.timestamp) ? result.timestamp : [];
    const quote = result.indicators?.quote?.[0];
    const opens = Array.isArray(quote?.open) ? quote.open : [];
    const closes = Array.isArray(quote?.close) ? quote.close : [];

    let releasePrice: number | null = null;
    let releaseLabel: string | undefined;
    const bars: HistoricalBar[] = [];

    for (let i = 0; i < timestamps.length; i += 1) {
      const tsSec = Number(timestamps[i]);
      if (!Number.isFinite(tsSec) || tsSec <= 0) continue;
      const openVal = Number(opens[i]);
      const closeVal = Number(closes[i]);
      const firstCandidate =
        Number.isFinite(openVal) && openVal > 0
          ? openVal
          : Number.isFinite(closeVal) && closeVal > 0
          ? closeVal
          : null;
      const closeCandidate =
        Number.isFinite(closeVal) && closeVal > 0 ? closeVal : firstCandidate;

      if (releasePrice === null && firstCandidate !== null) {
        releasePrice = firstCandidate;
        const d = new Date(tsSec * 1000);
        const mon = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
        const yr = String(d.getUTCFullYear()).slice(-2);
        releaseLabel = `${formatUsdPrice(firstCandidate)} (${mon} '${yr})`;
      }

      if (closeCandidate !== null) {
        bars.push({ tsMs: tsSec * 1000, price: closeCandidate });
      }
    }

    const nowMs = Date.now();
    const price180d = findBarPriceNear(bars, nowMs - 180 * DAY_MS);
    const price1y = findBarPriceNear(bars, nowMs - 365 * DAY_MS);
    const price2y = findBarPriceNear(bars, nowMs - 730 * DAY_MS);
    const price4y = findBarPriceNear(bars, nowMs - 1461 * DAY_MS);

    return {
      spotPrice,
      releasePrice,
      releaseLabel,
      price180d,
      price1y,
      price2y,
      price4y,
      bars
    };
  } catch {
    return null;
  }
}

const WINDOW_SPECS: Array<{
  key: GainsWindowHorizonKey;
  days: number;
  checkpoints: Array<{ label: string; event: string }>;
}> = [
  {
    key: 'D180',
    days: 180,
    checkpoints: [
      { label: 'T-180d', event: '180-Day Window Open' },
      { label: 'T-150d', event: 'Month 1 Repricing' },
      { label: 'T-120d', event: 'Month 2 Equilibrium' },
      { label: 'T-90d', event: '90-Day Checkpoint' },
      { label: 'T-60d', event: 'Late-Window Divergence' },
      { label: 'T-30d', event: 'Final 30D Compression' },
      { label: 'Now', event: 'Live 180D Spot' }
    ]
  },
  {
    key: 'Y1',
    days: 365,
    checkpoints: [
      { label: 'T-12m', event: '1-Year Window Open' },
      { label: 'T-10m', event: 'Early Cycle Flow' },
      { label: 'T-8m', event: 'Mid-Year Consolidation' },
      { label: 'T-6m', event: '180D Midpoint' },
      { label: 'T-4m', event: 'Unlock vs Scarcity Split' },
      { label: 'T-2m', event: 'Pre-Current Leg' },
      { label: 'Now', event: 'Live 1Y Spot' }
    ]
  },
  {
    key: 'Y2',
    days: 730,
    checkpoints: [
      { label: 'T-24m', event: '2-Year Window Open' },
      { label: 'T-20m', event: 'Early Re-Accumulation' },
      { label: 'T-16m', event: 'Macro Expansion Test' },
      { label: 'T-12m', event: '1-Year Midpoint' },
      { label: 'T-8m', event: 'Supply Absorption' },
      { label: 'T-4m', event: 'Late Window Trend' },
      { label: 'Now', event: 'Live 2Y Spot' }
    ]
  },
  {
    key: 'Y4',
    days: 1461,
    checkpoints: [
      { label: 'T-4Y', event: '4-Year Cycle Open' },
      { label: 'T-40m', event: 'Post-Drawdown Recovery' },
      { label: 'T-32m', event: 'Halving Era Advance' },
      { label: 'T-24m', event: '2-Year Midpoint' },
      { label: 'T-16m', event: 'Mature Cycle Dispersion' },
      { label: 'T-8m', event: 'Recent Cohort Separation' },
      { label: 'Now', event: 'Live 4Y Spot' }
    ]
  }
];

function computeWindowTrajectoriesFromBars(
  record: GainsCohortRecord,
  liveSpotMap: Record<string, number>
): WindowTrajectoriesMap {
  const out: WindowTrajectoriesMap = {};
  const nowMs = Date.now();

  const avgOf = (vals: number[], fallback = 1.0) =>
    vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : fallback;

  for (const spec of WINDOW_SPECS) {
    const startMs = nowMs - spec.days * DAY_MS;
    const count = spec.checkpoints.length;
    const points: MacroTrajectoryPoint[] = [];

    const resolveBaselineField = (item: CohortAssetEntry): number | null => {
      if (spec.key === 'D180') return item.price180d ?? null;
      if (spec.key === 'Y1') return item.price1y ?? null;
      if (spec.key === 'Y2') return item.price2y ?? null;
      return item.price4y ?? null;
    };

    const getAssetMultipleAt = (item: CohortAssetEntry, tsMs: number, isEnd: boolean): number | null => {
      const base = resolveBaselineField(item);
      if (!base || base <= 0) return null;
      if (isEnd) {
        const spot = liveSpotMap[item.ticker] ?? item.snapshotSpot;
        return spot && spot > 0 ? spot / base : null;
      }
      const bars = cachedBarsByTicker.get(item.ticker);
      if (!bars || bars.length === 0) return null;
      const p = findBarPriceNear(bars, tsMs, 42);
      return p && p > 0 ? p / base : null;
    };

    // Dynamically determine highest percentage-gain outlier on both E > 0 and E = 0 in this window
    const eligiblePassEnd = record.passed
      .map((a) => ({ ticker: a.ticker, mult: getAssetMultipleAt(a, nowMs, true) }))
      .filter((x): x is { ticker: string; mult: number } => x.mult !== null && Number.isFinite(x.mult));
    const passTopTicker =
      eligiblePassEnd.length > 1
        ? eligiblePassEnd.reduce((best, cur) => (cur.mult > best.mult ? cur : best)).ticker
        : null;

    const eligibleFailEnd = record.failed
      .map((a) => ({ ticker: a.ticker, mult: getAssetMultipleAt(a, nowMs, true) }))
      .filter((x): x is { ticker: string; mult: number } => x.mult !== null && Number.isFinite(x.mult));
    const failTopTicker =
      eligibleFailEnd.length > 1
        ? eligibleFailEnd.reduce((best, cur) => (cur.mult > best.mult ? cur : best)).ticker
        : null;

    for (let idx = 0; idx < count; idx += 1) {
      const frac = idx / Math.max(1, count - 1);
      const tsMs = startMs + frac * (nowMs - startMs);
      const isStart = idx === 0;
      const isEnd = idx === count - 1;

      if (isStart) {
        points.push({
          label: spec.checkpoints[idx].label,
          event: spec.checkpoints[idx].event,
          passAll: 1.0,
          passEx: 1.0,
          failAll: 1.0,
          failEx: 1.0
        });
        continue;
      }

      const passAllMults = record.passed
        .map((a) => getAssetMultipleAt(a, tsMs, isEnd))
        .filter((v): v is number => v !== null && Number.isFinite(v));
      const passExMults = record.passed
        .filter((a) => a.ticker !== passTopTicker)
        .map((a) => getAssetMultipleAt(a, tsMs, isEnd))
        .filter((v): v is number => v !== null && Number.isFinite(v));

      const failAllMults = record.failed
        .map((a) => getAssetMultipleAt(a, tsMs, isEnd))
        .filter((v): v is number => v !== null && Number.isFinite(v));
      const failExMults = record.failed
        .filter((a) => a.ticker !== failTopTicker)
        .map((a) => getAssetMultipleAt(a, tsMs, isEnd))
        .filter((v): v is number => v !== null && Number.isFinite(v));

      points.push({
        label: spec.checkpoints[idx].label,
        event: spec.checkpoints[idx].event,
        passAll: Math.max(0.05, avgOf(passAllMults, 1.0)),
        passEx: Math.max(0.05, avgOf(passExMults.length > 0 ? passExMults : passAllMults, 1.0)),
        failAll: Math.max(0.05, avgOf(failAllMults, 1.0)),
        failEx: Math.max(0.05, avgOf(failExMults.length > 0 ? failExMults : failAllMults, 1.0))
      });
    }

    // Only include trajectory if at least middle checkpoints resolved from real Yahoo bars
    const hasMidBars = cachedBarsByTicker.size >= 8;
    if (hasMidBars) {
      out[spec.key] = points;
    }
  }

  return out;
}

function sanitizeExtraSyncItems(
  rawExtraItems: Array<Partial<CohortAssetEntry>> | undefined,
  existingTickers: Set<string>
): CohortAssetEntry[] {
  if (!Array.isArray(rawExtraItems) || rawExtraItems.length === 0) return [];
  const safeTickerRe = /^[A-Z0-9-]{1,14}$/;
  const safePairRe = /^[A-Z0-9-]{3,16}$/;
  const safeGeckoRe = /^[a-z0-9-]{1,48}$/;
  const safeYahooRe = /^[A-Z0-9.=^-]{1,18}$/;

  const out: CohortAssetEntry[] = [];
  const seen = new Set<string>(existingTickers);

  for (const raw of rawExtraItems) {
    if (!raw || typeof raw !== 'object') continue;
    const tk = normalizeCohortTicker(raw.ticker);
    if (!tk || !safeTickerRe.test(tk) || seen.has(tk)) continue;
    seen.add(tk);

    const side = classifyAuditBasketSide({
      ticker: tk,
      grade: raw.grade,
      totalScore: raw.auditScore
    });
    const rawCb = raw.coinbasePair ? String(raw.coinbasePair).trim().toUpperCase() : `${tk}-USD`;
    const rawGecko = raw.geckoId ? String(raw.geckoId).trim().toLowerCase() : null;
    const rawYahoo = raw.yahooSymbol ? String(raw.yahooSymbol).trim().toUpperCase() : `${tk}-USD`;

    const cleaned = sanitizeCohortAssetEntry(
      {
        ...raw,
        ticker: tk,
        coinbasePair: rawCb && safePairRe.test(rawCb) ? rawCb : null,
        geckoId: rawGecko && safeGeckoRe.test(rawGecko) ? rawGecko : null,
        yahooSymbol: rawYahoo && safeYahooRe.test(rawYahoo) ? rawYahoo : null
      },
      side
    );
    if (cleaned) {
      out.push(cleaned);
      if (out.length >= 30) break;
    }
  }
  return out;
}

export async function syncLivePricesAndPersistGainsCohort(
  clientSpotOverrides?: Record<string, number>,
  extraItems?: Array<Partial<CohortAssetEntry>>
): Promise<{
  record: GainsCohortRecord;
  syncedTickers: string[];
  liveSpotMap: Record<string, number>;
  windowTrajectories: WindowTrajectoriesMap;
  extraResolvedEntries: Record<string, CohortAssetEntry>;
}> {
  const hasClientOverrides = Boolean(
    clientSpotOverrides && Object.keys(clientSpotOverrides).length > 0
  );
  const hasExtraItems = Boolean(Array.isArray(extraItems) && extraItems.length > 0);
  if (inFlightLiveSync && !hasClientOverrides && !hasExtraItems) {
    return inFlightLiveSync;
  }

  const runSync = async () => {
    const current = getPersistedGainsCohort();
    const persistedItems: CohortAssetEntry[] = [...current.passed, ...current.failed];
    const existingTickerSet = new Set(persistedItems.map((i) => i.ticker));
    const sanitizedExtras = sanitizeExtraSyncItems(extraItems, existingTickerSet);
    const allItems: CohortAssetEntry[] = [...persistedItems, ...sanitizedExtras];

    const liveSpotMap: Record<string, number> = {};
    const releaseOverrides: Record<string, ReleaseBaselineOverride> = {};

    if (clientSpotOverrides && typeof clientSpotOverrides === 'object') {
      Object.entries(clientSpotOverrides).forEach(([tk, val]) => {
        const n = Number(val);
        if (Number.isFinite(n) && n > 0) {
          liveSpotMap[String(tk).trim().toUpperCase()] = n;
        }
      });
    }

    // 1. Coinbase spot prices (fast direct pairs)
    const cbTargets = allItems.filter((item) => Boolean(item.coinbasePair));
    await Promise.allSettled(
      cbTargets.map(async (item) => {
        const res = await fetch(
          `https://api.coinbase.com/v2/prices/${encodeURIComponent(item.coinbasePair!)}/spot`,
          {
            signal: AbortSignal.timeout(4500),
            headers: { Accept: 'application/json' }
          }
        );
        if (!res.ok) return;
        const json = (await res.json()) as { data?: { amount?: string } };
        const amt = Number(json?.data?.amount);
        if (Number.isFinite(amt) && amt > 0) {
          liveSpotMap[item.ticker] = amt;
        }
      })
    );

    // 2. CoinGecko simple price batch (covers KAS, XMR, ERG, RVN, PI, and newly pulled alts)
    const geckoTargets = allItems.filter(
      (item) => item.geckoId && !liveSpotMap[item.ticker]
    );
    if (geckoTargets.length > 0) {
      try {
        const idsParam = geckoTargets.map((i) => encodeURIComponent(i.geckoId!)).join(',');
        const gRes = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`,
          {
            signal: AbortSignal.timeout(5000),
            headers: { Accept: 'application/json' }
          }
        );
        if (gRes.ok) {
          const gJson = (await gRes.json()) as Record<string, { usd?: number }>;
          geckoTargets.forEach((item) => {
            if (!item.geckoId) return;
            const p = Number(gJson?.[item.geckoId]?.usd);
            if (Number.isFinite(p) && p > 0) {
              liveSpotMap[item.ticker] = p;
            }
          });
        }
      } catch {
        // Graceful fallback to Yahoo Finance below
      }
    }

    // 3. Yahoo Finance chart endpoint (?range=max&interval=1wk):
    //    covers physical metals, fallbacks, earliest releasePrice for custom assets,
    //    AND 180d/1y/2y/4y rolling window baselines + weekly bars for real equity curves.
    const needsYahooRefresh = cachedBarsByTicker.size < 8;
    const yahooTargets = allItems
      .map((item) => {
        const yahooSym =
          item.yahooSymbol ||
          (item.yahooSymbol !== null && (item.coinbasePair || item.geckoId)
            ? `${item.ticker}-USD`
            : null);
        return { item, yahooSym };
      })
      .filter(
        ({ item, yahooSym }) =>
          Boolean(yahooSym) &&
          (needsYahooRefresh ||
            !liveSpotMap[item.ticker] ||
            item.releasePrice == null ||
            item.price180d == null)
      );

    if (yahooTargets.length > 0) {
      await Promise.allSettled(
        yahooTargets.map(async ({ item, yahooSym }) => {
          const parsed = await fetchYahooReleaseAndSpot(yahooSym!);
          if (!parsed) return;
          if (!liveSpotMap[item.ticker] && parsed.spotPrice) {
            liveSpotMap[item.ticker] = parsed.spotPrice;
          }
          if (parsed.bars.length > 0) {
            cachedBarsByTicker.set(item.ticker, parsed.bars);
          }
          const ov: ReleaseBaselineOverride = {
            yahooSymbol: yahooSym!,
            price180d: parsed.price180d,
            price1y: parsed.price1y,
            price2y: parsed.price2y,
            price4y: parsed.price4y
          };
          if (item.releasePrice == null && parsed.releasePrice) {
            ov.releasePrice = parsed.releasePrice;
            ov.releaseLabel = parsed.releaseLabel;
          }
          if (
            ov.releasePrice ||
            ov.price180d ||
            ov.price1y ||
            ov.price2y ||
            ov.price4y
          ) {
            releaseOverrides[item.ticker] = ov;
          }
        })
      );
    }

    const { nextRecord, updatedTickers } = applySpotPricesToCohortRecord(
      current,
      liveSpotMap,
      updatedTickersLabel(Object.keys(liveSpotMap).length),
      releaseOverrides
    );

    // Resolve newly pulled custom extraItems so basket percentages update immediately
    const extraResolvedEntries: Record<string, CohortAssetEntry> = {};
    if (sanitizedExtras.length > 0) {
      const tempExtrasRecord: GainsCohortRecord = {
        ...current,
        passed: sanitizedExtras.filter(
          (e) =>
            classifyAuditBasketSide({
              ticker: e.ticker,
              grade: e.grade,
              totalScore: e.auditScore
            }) === 'PASSED'
        ),
        failed: sanitizedExtras.filter(
          (e) =>
            classifyAuditBasketSide({
              ticker: e.ticker,
              grade: e.grade,
              totalScore: e.auditScore
            }) === 'FAILED'
        )
      };
      const { nextRecord: resolvedExtrasRecord } = applySpotPricesToCohortRecord(
        tempExtrasRecord,
        liveSpotMap,
        'Extra Audit Sync',
        releaseOverrides
      );
      for (const resolvedItem of [
        ...resolvedExtrasRecord.passed,
        ...resolvedExtrasRecord.failed
      ]) {
        extraResolvedEntries[resolvedItem.ticker] = resolvedItem;
      }
    }

    const activeRecord = updatedTickers.length > 0 ? nextRecord : current;
    const nextTraj = computeWindowTrajectoriesFromBars(activeRecord, liveSpotMap);
    if (Object.keys(nextTraj).length > 0) {
      cachedWindowTrajectories = nextTraj;
    }

    if (updatedTickers.length > 0) {
      memoryCohort = nextRecord;
      saveToDisk(nextRecord);
    }
    if (Object.keys(liveSpotMap).length > 0) {
      lastLiveSpotMap = { ...lastLiveSpotMap, ...liveSpotMap };
    }
    lastLiveSyncCompletedAtMs = Date.now();

    return {
      record: activeRecord,
      syncedTickers: [
        ...updatedTickers,
        ...Object.keys(extraResolvedEntries).filter((tk) => !updatedTickers.includes(tk))
      ],
      liveSpotMap: { ...lastLiveSpotMap, ...liveSpotMap },
      windowTrajectories: cachedWindowTrajectories,
      extraResolvedEntries
    };
  };

  if (hasClientOverrides || hasExtraItems) {
    return runSync();
  }

  const promise = runSync().finally(() => {
    if (inFlightLiveSync === promise) {
      inFlightLiveSync = null;
    }
  });
  inFlightLiveSync = promise;
  return promise;
}

export async function ensureFreshLiveGainsCohort(
  forceRefresh = false
): Promise<{
  record: GainsCohortRecord;
  syncedTickers: string[];
  liveSpotMap: Record<string, number>;
  windowTrajectories: WindowTrajectoriesMap;
  extraResolvedEntries: Record<string, CohortAssetEntry>;
}> {
  const current = getPersistedGainsCohort();
  const minReuseAgeMs = forceRefresh ? 4_000 : LIVE_SYNC_TTL_MS;
  if (
    lastLiveSyncCompletedAtMs > 0 &&
    Date.now() - lastLiveSyncCompletedAtMs < minReuseAgeMs
  ) {
    return {
      record: current,
      syncedTickers: [],
      liveSpotMap: { ...lastLiveSpotMap },
      windowTrajectories: cachedWindowTrajectories,
      extraResolvedEntries: {}
    };
  }
  return syncLivePricesAndPersistGainsCohort();
}

function updatedTickersLabel(count: number): string {
  return count > 0
    ? `Live Multi-Window Sync (${count} assets)`
    : 'Persisted Backend Cohort';
}

