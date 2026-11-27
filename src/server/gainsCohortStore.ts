import fs from 'node:fs';
import {
  FAILED_COHORT_GAINS,
  KNOWN_AUDIT_COHORT_METADATA,
  MAX_ASSETS_PER_COHORT,
  PASSED_COHORT_GAINS,
  applySpotPricesToCohortRecord,
  buildBasketSyncedCohortRecord,
  classifyAuditBasketSide,
  formatCohortTimestampLabel,
  formatUsdPrice,
  mergeResolvedEntriesIntoCohortRecord,
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
const cachedExtraResolvedByTicker = new Map<string, CohortAssetEntry>();
let cachedWindowTrajectories: WindowTrajectoriesMap = {};
let inFlightLiveSync: Promise<{
  record: GainsCohortRecord;
  syncedTickers: string[];
  liveSpotMap: Record<string, number>;
  windowTrajectories: WindowTrajectoriesMap;
  extraResolvedEntries: Record<string, CohortAssetEntry>;
}> | null = null;

const CATALOG_META_BY_TICKER = new Map<string, CohortAssetEntry>();
const CURATED_YAHOO_SYMBOL_BY_TICKER = new Map<string, string | null>();

for (const item of [...PASSED_COHORT_GAINS, ...FAILED_COHORT_GAINS]) {
  CATALOG_META_BY_TICKER.set(item.ticker, item);
  CURATED_YAHOO_SYMBOL_BY_TICKER.set(item.ticker, item.yahooSymbol ?? null);
}
for (const [tk, meta] of Object.entries(KNOWN_AUDIT_COHORT_METADATA)) {
  const side = classifyAuditBasketSide({
    ticker: tk,
    grade: meta.grade,
    totalScore: meta.auditScore
  });
  const cleaned = sanitizeCohortAssetEntry({ ...meta, ticker: tk }, side);
  if (cleaned && !CATALOG_META_BY_TICKER.has(tk)) {
    CATALOG_META_BY_TICKER.set(tk, cleaned);
  }
  if (meta.yahooSymbol !== undefined && !CURATED_YAHOO_SYMBOL_BY_TICKER.has(tk)) {
    CURATED_YAHOO_SYMBOL_BY_TICKER.set(tk, meta.yahooSymbol ?? null);
  }
}

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
    const curatedYahoo = CURATED_YAHOO_SYMBOL_BY_TICKER.get(item.ticker);
    const isGenericYahoo =
      item.yahooSymbol === `${item.ticker}-USD` &&
      curatedYahoo !== undefined &&
      curatedYahoo !== `${item.ticker}-USD`;
    const yahooSymbol = isGenericYahoo
      ? curatedYahoo
      : item.yahooSymbol !== undefined && item.yahooSymbol !== null
      ? item.yahooSymbol
      : cat.yahooSymbol ?? null;
    const snapshotSpot = item.snapshotSpot ?? cat.snapshotSpot ?? null;
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
      snapshotSpot,
      yahooSymbol,
      liquidCycle: Boolean(item.liquidCycle || (hasBaseline && snapshotSpot && snapshotSpot > 0))
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

let cohortWriteTimer: ReturnType<typeof setTimeout> | null = null;

function saveToDisk(record: GainsCohortRecord): void {
  if (cohortWriteTimer) clearTimeout(cohortWriteTimer);
  cohortWriteTimer = setTimeout(() => {
    cohortWriteTimer = null;
    void fs.promises
      .writeFile(GAINS_COHORT_FILE, JSON.stringify(record), 'utf8')
      .catch((err) => console.warn('Could not persist gains cohort file:', err));
  }, 120);
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

export function getCachedExtraResolvedEntries(): Record<string, CohortAssetEntry> {
  return Object.fromEntries(cachedExtraResolvedByTicker.entries());
}

export function getLastLiveSpotMap(): Record<string, number> {
  return { ...lastLiveSpotMap };
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

export interface YahooChartParsed {
  resolvedSymbol: string;
  spotPrice: number | null;
  releasePrice: number | null;
  releaseLabel?: string;
  price180d: number | null;
  price1y: number | null;
  price2y: number | null;
  price4y: number | null;
  bars: HistoricalBar[];
}

export interface YahooSymbolMatchContext {
  ticker: string;
  name: string;
  isCuratedSymbol: boolean;
}

const yahooChartResponseCache = new Map<
  string,
  { fetchedAtMs: number; parsed: YahooChartParsed }
>();
const inFlightYahooCharts = new Map<string, Promise<YahooChartParsed | null>>();
const yahooSymbolSearchCache = new Map<
  string,
  { fetchedAtMs: number; symbol: string | null }
>();

function doesYahooMetaMatchAssetName(
  metaShortOrLongName: string,
  expectedTicker: string,
  expectedAssetName: string
): boolean {
  const cleanMeta = metaShortOrLongName
    .replace(/\bUSD\b/gi, '')
    .replace(/\([^)]*\)/g, ' ')
    .trim()
    .toLowerCase();
  if (!cleanMeta) return true;

  const lowerName = expectedAssetName.trim().toLowerCase();
  const lowerTicker = expectedTicker.trim().toLowerCase();

  if (/\.(vip|io|finance|meme|club|xyz)\b/i.test(metaShortOrLongName) && !lowerName.includes('.')) {
    return false;
  }
  if (/prev\.\s*toncoin/i.test(metaShortOrLongName) && !lowerName.includes('toncoin')) {
    return false;
  }

  if (!lowerName || lowerName === lowerTicker) return true;
  if (cleanMeta.includes(lowerName) || lowerName.includes(cleanMeta)) return true;

  const nameTokens = lowerName
    .split(/[^a-z0-9]+/)
    .filter((tok) => tok.length >= 3 && tok !== 'network' && tok !== 'protocol' && tok !== 'coin' && tok !== 'token');
  if (nameTokens.length === 0) return true;

  return nameTokens.some((tok) => cleanMeta.includes(tok));
}

async function searchYahooNumberedCryptoSymbol(
  ticker: string,
  assetName: string
): Promise<string | null> {
  const cacheKey = `${ticker}:${assetName.trim().toLowerCase()}`;
  const cached = yahooSymbolSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAtMs < 60 * 60 * 1000) {
    return cached.symbol;
  }
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
        assetName
      )}&quotesCount=6&newsCount=0`,
      {
        signal: AbortSignal.timeout(4500),
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; ThermodynamicTruthBot/1.0)'
        }
      }
    );
    if (!res.ok) {
      yahooSymbolSearchCache.set(cacheKey, { fetchedAtMs: Date.now(), symbol: null });
      return null;
    }
    const json = (await res.json()) as {
      quotes?: Array<{
        symbol?: string;
        quoteType?: string;
        shortname?: string;
        longname?: string;
      }>;
    };
    const numberedRe = new RegExp(`^${ticker}\\d+-USD$`, 'i');
    const exactRe = new RegExp(`^${ticker}-USD$`, 'i');
    const quotes = Array.isArray(json?.quotes) ? json.quotes : [];
    for (const q of quotes) {
      const sym = String(q?.symbol || '').trim().toUpperCase();
      if (!sym || (!numberedRe.test(sym) && !exactRe.test(sym))) continue;
      const label = `${q?.shortname || ''} ${q?.longname || ''}`.trim();
      if (doesYahooMetaMatchAssetName(label, ticker, assetName)) {
        yahooSymbolSearchCache.set(cacheKey, { fetchedAtMs: Date.now(), symbol: sym });
        return sym;
      }
    }
    yahooSymbolSearchCache.set(cacheKey, { fetchedAtMs: Date.now(), symbol: null });
    return null;
  } catch {
    return null;
  }
}

async function fetchYahooChartRaw(
  symbol: string,
  forceRefresh = false,
  matchCtx?: YahooSymbolMatchContext
): Promise<{ parsed: YahooChartParsed | null; collidedOrMissing: boolean }> {
  const key = symbol.trim().toUpperCase();
  const cached = yahooChartResponseCache.get(key);
  if (!forceRefresh && cached && Date.now() - cached.fetchedAtMs < LIVE_SYNC_TTL_MS) {
    return { parsed: cached.parsed, collidedOrMissing: false };
  }
  const existingFlight = inFlightYahooCharts.get(key);
  if (existingFlight) {
    const awaited = await existingFlight;
    return { parsed: awaited, collidedOrMissing: awaited === null };
  }

  let collidedOrMissing = false;
  const reqPromise = (async (): Promise<YahooChartParsed | null> => {
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
      if (!res.ok) {
        if (res.status === 404) collidedOrMissing = true;
        return cached?.parsed ?? null;
      }

      const json = (await res.json()) as {
        chart?: {
          result?: Array<{
            meta?: {
              regularMarketPrice?: number;
              shortName?: string;
              longName?: string;
            };
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
      if (!result) {
        collidedOrMissing = true;
        return cached?.parsed ?? null;
      }

      if (matchCtx && !matchCtx.isCuratedSymbol) {
        const metaTitle = `${result.meta?.shortName || ''} ${result.meta?.longName || ''}`.trim();
        if (
          metaTitle &&
          !doesYahooMetaMatchAssetName(metaTitle, matchCtx.ticker, matchCtx.name)
        ) {
          collidedOrMissing = true;
          return null;
        }
      }

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

      const parsed: YahooChartParsed = {
        resolvedSymbol: key,
        spotPrice,
        releasePrice,
        releaseLabel,
        price180d,
        price1y,
        price2y,
        price4y,
        bars
      };
      yahooChartResponseCache.set(key, { fetchedAtMs: nowMs, parsed });
      return parsed;
    } catch {
      return cached?.parsed ?? null;
    } finally {
      inFlightYahooCharts.delete(key);
    }
  })();

  inFlightYahooCharts.set(key, reqPromise);
  const parsed = await reqPromise;
  return { parsed, collidedOrMissing };
}

export async function fetchYahooReleaseAndSpot(
  symbol: string,
  forceRefresh = false,
  matchCtx?: YahooSymbolMatchContext
): Promise<YahooChartParsed | null> {
  const initial = await fetchYahooChartRaw(symbol, forceRefresh, matchCtx);
  if (initial.parsed) return initial.parsed;

  if (
    initial.collidedOrMissing &&
    matchCtx &&
    !matchCtx.isCuratedSymbol &&
    matchCtx.name &&
    matchCtx.name.toUpperCase() !== matchCtx.ticker.toUpperCase()
  ) {
    const discovered = await searchYahooNumberedCryptoSymbol(matchCtx.ticker, matchCtx.name);
    if (discovered && discovered.toUpperCase() !== symbol.trim().toUpperCase()) {
      const retry = await fetchYahooChartRaw(discovered, forceRefresh, {
        ...matchCtx,
        isCuratedSymbol: true
      });
      return retry.parsed;
    }
  }
  return null;
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

    const cat = CATALOG_META_BY_TICKER.get(tk);
    const hasCuratedYahoo = CURATED_YAHOO_SYMBOL_BY_TICKER.has(tk);
    const curatedYahoo = CURATED_YAHOO_SYMBOL_BY_TICKER.get(tk);
    const cachedPrev = cachedExtraResolvedByTicker.get(tk);

    const side = classifyAuditBasketSide({
      ticker: tk,
      grade: raw.grade ?? cat?.grade ?? cachedPrev?.grade,
      totalScore: raw.auditScore ?? cat?.auditScore ?? cachedPrev?.auditScore
    });

    const rawCbCandidate =
      raw.coinbasePair !== undefined ? raw.coinbasePair : cat?.coinbasePair;
    const isGenericCb =
      typeof rawCbCandidate === 'string' &&
      rawCbCandidate.trim().toUpperCase() === `${tk}-USD` &&
      cat !== undefined &&
      cat.coinbasePair === null;
    const resolvedCb = isGenericCb
      ? null
      : rawCbCandidate !== undefined
      ? rawCbCandidate
        ? String(rawCbCandidate).trim().toUpperCase()
        : null
      : `${tk}-USD`;

    const rawGeckoCandidate =
      raw.geckoId !== undefined ? raw.geckoId : cat?.geckoId ?? cachedPrev?.geckoId ?? null;
    const resolvedGecko = rawGeckoCandidate
      ? String(rawGeckoCandidate).trim().toLowerCase()
      : null;

    let resolvedYahoo: string | null;
    if (hasCuratedYahoo) {
      const clientStr = raw.yahooSymbol ? String(raw.yahooSymbol).trim().toUpperCase() : null;
      resolvedYahoo =
        clientStr && clientStr !== `${tk}-USD`
          ? clientStr
          : curatedYahoo ?? null;
    } else if (cachedPrev?.yahooSymbol) {
      resolvedYahoo = cachedPrev.yahooSymbol;
    } else if (raw.yahooSymbol !== undefined) {
      resolvedYahoo = raw.yahooSymbol ? String(raw.yahooSymbol).trim().toUpperCase() : null;
    } else {
      resolvedYahoo = `${tk}-USD`;
    }

    const cleaned = sanitizeCohortAssetEntry(
      {
        ...cachedPrev,
        ...cat,
        ...raw,
        ticker: tk,
        name: String(raw.name || cat?.name || cachedPrev?.name || tk),
        basePrice: raw.basePrice ?? cachedPrev?.basePrice ?? cat?.basePrice ?? null,
        baselineLabel: raw.baselineLabel || cachedPrev?.baselineLabel || cat?.baselineLabel,
        releasePrice: raw.releasePrice ?? cachedPrev?.releasePrice ?? cat?.releasePrice ?? null,
        releaseLabel: raw.releaseLabel || cachedPrev?.releaseLabel || cat?.releaseLabel,
        price180d: raw.price180d ?? cachedPrev?.price180d ?? cat?.price180d ?? null,
        price1y: raw.price1y ?? cachedPrev?.price1y ?? cat?.price1y ?? null,
        price2y: raw.price2y ?? cachedPrev?.price2y ?? cat?.price2y ?? null,
        price4y: raw.price4y ?? cachedPrev?.price4y ?? cat?.price4y ?? null,
        snapshotSpot: raw.snapshotSpot ?? cachedPrev?.snapshotSpot ?? cat?.snapshotSpot ?? null,
        coinbasePair: resolvedCb && safePairRe.test(resolvedCb) ? resolvedCb : null,
        geckoId: resolvedGecko && safeGeckoRe.test(resolvedGecko) ? resolvedGecko : null,
        yahooSymbol: resolvedYahoo && safeYahooRe.test(resolvedYahoo) ? resolvedYahoo : null
      },
      side
    );
    if (cleaned) {
      out.push(cleaned);
      if (out.length >= MAX_ASSETS_PER_COHORT * 2) break;
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
  const currentSnapshot = getPersistedGainsCohort();
  const initialExistingSet = new Set(
    [...currentSnapshot.passed, ...currentSnapshot.failed].map((i) => i.ticker)
  );
  const incomingNewExtras = sanitizeExtraSyncItems(extraItems, initialExistingSet).filter(
    (item) => {
      const prev = cachedExtraResolvedByTicker.get(item.ticker);
      return !prev || (!prev.liquidCycle && Boolean(item.yahooSymbol || item.geckoId || item.coinbasePair));
    }
  );
  const hasClientOverrides = Boolean(
    clientSpotOverrides && Object.keys(clientSpotOverrides).length > 0
  );
  const hasUncachedExtras = incomingNewExtras.length > 0;

  if (!hasClientOverrides && !hasUncachedExtras) {
    if (inFlightLiveSync) {
      return inFlightLiveSync;
    }
    if (lastLiveSyncCompletedAtMs > 0 && Date.now() - lastLiveSyncCompletedAtMs < 4_000) {
      return {
        record: currentSnapshot,
        syncedTickers: [],
        liveSpotMap: { ...lastLiveSpotMap },
        windowTrajectories: cachedWindowTrajectories,
        extraResolvedEntries: getCachedExtraResolvedEntries()
      };
    }
  }

  const runSync = async () => {
    const current = getPersistedGainsCohort();
    const persistedItems: CohortAssetEntry[] = [...current.passed, ...current.failed];
    const existingTickerSet = new Set(persistedItems.map((i) => i.ticker));
    const combinedRawExtras: Array<Partial<CohortAssetEntry>> = [
      ...(Array.isArray(extraItems) ? extraItems : []),
      ...Array.from(cachedExtraResolvedByTicker.values())
    ];
    const sanitizedExtras = sanitizeExtraSyncItems(combinedRawExtras, existingTickerSet);
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
    //    covers physical metals, fiat FX, fallbacks, earliest releasePrice for custom assets,
    //    AND 180d/1y/2y/4y rolling window baselines + weekly bars for real equity curves.
    const needsYahooRefresh = cachedBarsByTicker.size < 8;
    const yahooTargets = allItems
      .map((item) => {
        const hasExplicitNull =
          CURATED_YAHOO_SYMBOL_BY_TICKER.has(item.ticker) &&
          CURATED_YAHOO_SYMBOL_BY_TICKER.get(item.ticker) === null;
        const yahooSym = hasExplicitNull
          ? null
          : item.yahooSymbol ||
            (item.yahooSymbol !== null && (item.coinbasePair || item.geckoId)
              ? `${item.ticker}-USD`
              : null);
        const isCuratedSymbol = Boolean(
          CURATED_YAHOO_SYMBOL_BY_TICKER.get(item.ticker) ||
            (yahooSym && yahooSym !== `${item.ticker}-USD`)
        );
        return { item, yahooSym, isCuratedSymbol };
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
        yahooTargets.map(async ({ item, yahooSym, isCuratedSymbol }) => {
          const parsed = await fetchYahooReleaseAndSpot(yahooSym!, false, {
            ticker: item.ticker,
            name: item.name,
            isCuratedSymbol
          });
          if (!parsed) return;
          if (!liveSpotMap[item.ticker] && parsed.spotPrice) {
            liveSpotMap[item.ticker] = parsed.spotPrice;
          }
          if (parsed.bars.length > 0) {
            cachedBarsByTicker.set(item.ticker, parsed.bars);
          }
          const ov: ReleaseBaselineOverride = {
            yahooSymbol: parsed.resolvedSymbol || yahooSym!,
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

    // Resolve custom extraItems and persist them in cachedExtraResolvedByTicker across syncs
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
        cachedExtraResolvedByTicker.set(resolvedItem.ticker, resolvedItem);
      }
      // Also preserve curated catalog extras that were already liquid without needing a fresh tick
      for (const rawExtra of sanitizedExtras) {
        if (!cachedExtraResolvedByTicker.has(rawExtra.ticker)) {
          cachedExtraResolvedByTicker.set(rawExtra.ticker, rawExtra);
        }
      }
    }

    const extraResolvedEntries = getCachedExtraResolvedEntries();
    const activeRecord = updatedTickers.length > 0 ? nextRecord : current;
    const trajectoryInputRecord = mergeResolvedEntriesIntoCohortRecord(
      activeRecord,
      extraResolvedEntries
    );
    const nextTraj = computeWindowTrajectoriesFromBars(trajectoryInputRecord, liveSpotMap);
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

  if (hasClientOverrides || hasUncachedExtras) {
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
      extraResolvedEntries: getCachedExtraResolvedEntries()
    };
  }
  return syncLivePricesAndPersistGainsCohort();
}

function updatedTickersLabel(count: number): string {
  return count > 0
    ? `Live Multi-Window Sync (${count} assets)`
    : 'Persisted Backend Cohort';
}

