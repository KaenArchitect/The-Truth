import fs from 'node:fs';
import {
  STATIC_TOP_150_FALLBACK_ENTRIES,
  type MarketCapEntry
} from '../data/auditQuotaAndScope.ts';

const TOP150_CACHE_FILE = '/tmp/truth_cmc_top150_cache.json';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface CachedMarketDirectory {
  fetchedAtMs: number;
  source: string;
  entries: MarketCapEntry[];
}

let memoryDirectory: CachedMarketDirectory | null = null;
let refreshPromise: Promise<CachedMarketDirectory> | null = null;

function hydrateFromDisk(): CachedMarketDirectory | null {
  try {
    if (!fs.existsSync(TOP150_CACHE_FILE)) return null;
    const raw = fs.readFileSync(TOP150_CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as CachedMarketDirectory;
    if (
      parsed &&
      typeof parsed.fetchedAtMs === 'number' &&
      Array.isArray(parsed.entries) &&
      parsed.entries.length >= 50
    ) {
      return parsed;
    }
  } catch {
    // Ignore corrupt cache file
  }
  return null;
}

function saveToDisk(dir: CachedMarketDirectory): void {
  try {
    fs.writeFileSync(TOP150_CACHE_FILE, JSON.stringify(dir), 'utf8');
  } catch {
    // Ignore transient disk write errors
  }
}

async function fetchCoinPaprikaRanks(): Promise<MarketCapEntry[]> {
  const resp = await fetch('https://api.coinpaprika.com/v1/tickers?quotes=USD', {
    signal: AbortSignal.timeout(5000),
    headers: { Accept: 'application/json' }
  });
  if (!resp.ok) throw new Error(`CoinPaprika HTTP ${resp.status}`);
  const rows = (await resp.json()) as Array<{
    id?: string;
    name?: string;
    symbol?: string;
    rank?: number;
  }>;
  if (!Array.isArray(rows) || rows.length < 50) {
    throw new Error('CoinPaprika returned insufficient rows');
  }
  return rows
    .filter((r) => r && Number.isFinite(r.rank) && Number(r.rank) > 0 && r.symbol && r.name)
    .map((r) => ({
      rank: Number(r.rank),
      symbol: String(r.symbol).trim().toUpperCase(),
      name: String(r.name).trim(),
      id: r.id ? String(r.id).trim() : undefined
    }))
    .sort((a, b) => a.rank - b.rank);
}

async function fetchCoinGeckoTop150(): Promise<MarketCapEntry[]> {
  const resp = await fetch(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=150&page=1',
    {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: 'application/json' }
    }
  );
  if (!resp.ok) throw new Error(`CoinGecko HTTP ${resp.status}`);
  const rows = (await resp.json()) as Array<{
    id?: string;
    symbol?: string;
    name?: string;
    market_cap_rank?: number;
  }>;
  if (!Array.isArray(rows) || rows.length < 50) {
    throw new Error('CoinGecko returned insufficient rows');
  }
  return rows
    .filter(
      (r) =>
        r &&
        Number.isFinite(r.market_cap_rank) &&
        Number(r.market_cap_rank) > 0 &&
        r.symbol &&
        r.name
    )
    .map((r) => ({
      rank: Number(r.market_cap_rank),
      symbol: String(r.symbol).trim().toUpperCase(),
      name: String(r.name).trim(),
      id: r.id ? String(r.id).trim() : undefined
    }))
    .sort((a, b) => a.rank - b.rank);
}

async function refreshDirectory(): Promise<CachedMarketDirectory> {
  const [cpResult, cgResult] = await Promise.allSettled([
    fetchCoinPaprikaRanks(),
    fetchCoinGeckoTop150()
  ]);

  const cpEntries = cpResult.status === 'fulfilled' ? cpResult.value : [];
  const cgEntries = cgResult.status === 'fulfilled' ? cgResult.value : [];

  if (cpEntries.length > 0 && cgEntries.length > 0) {
    // Combine CoinPaprika's deep rank directory (1..2500+) with CoinGecko's Top 150 cross-check
    const merged = [...cgEntries, ...cpEntries];
    const dir: CachedMarketDirectory = {
      fetchedAtMs: Date.now(),
      source: 'coinpaprika+coingecko',
      entries: merged
    };
    memoryDirectory = dir;
    saveToDisk(dir);
    return dir;
  }

  if (cpEntries.length > 0) {
    const dir: CachedMarketDirectory = {
      fetchedAtMs: Date.now(),
      source: 'coinpaprika',
      entries: cpEntries
    };
    memoryDirectory = dir;
    saveToDisk(dir);
    return dir;
  }

  if (cgEntries.length > 0) {
    const dir: CachedMarketDirectory = {
      fetchedAtMs: Date.now(),
      source: 'coingecko',
      entries: cgEntries
    };
    memoryDirectory = dir;
    saveToDisk(dir);
    return dir;
  }

  if (memoryDirectory && memoryDirectory.entries.length > 0) {
    return memoryDirectory;
  }

  const disk = hydrateFromDisk();
  if (disk) {
    memoryDirectory = disk;
    return disk;
  }

  return {
    fetchedAtMs: Date.now(),
    source: 'static-fallback',
    entries: STATIC_TOP_150_FALLBACK_ENTRIES
  };
}

export async function getMarketCapDirectory(): Promise<{
  entries: MarketCapEntry[];
  source: string;
}> {
  if (!memoryDirectory) {
    memoryDirectory = hydrateFromDisk();
  }

  const now = Date.now();
  if (memoryDirectory && now - memoryDirectory.fetchedAtMs < CACHE_TTL_MS) {
    return {
      entries: memoryDirectory.entries,
      source: memoryDirectory.source
    };
  }

  if (!refreshPromise) {
    refreshPromise = refreshDirectory().finally(() => {
      refreshPromise = null;
    });
  }

  const dir = await refreshPromise;
  return {
    entries: dir.entries,
    source: dir.source
  };
}
