import {
  DEFAULT_M2_BENCHMARK_DATASET,
  buildM2SeriesFromBars,
  parseFredM2Csv,
  type FredM2Row,
  type HistoricalPriceBar,
  type M2BenchmarkDataset
} from '../data/m2BenchmarkData.ts';
import { fetchYahooReleaseAndSpot } from './gainsCohortStore.ts';

const M2_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const ASSET_CACHE_TTL_MS = 5 * 60 * 1000;
const FIVE_YEARS_MS = Math.round(5.2 * 365.25 * 24 * 60 * 60 * 1000);

let cachedFredM2Rows: FredM2Row[] = [];
let fredFetchedAtMs = 0;

let cachedDataset: M2BenchmarkDataset | null = null;
let datasetBuiltAtMs = 0;
let inFlightM2Sync: Promise<M2BenchmarkDataset> | null = null;

interface YahooAssetHistory {
  spot: number | null;
  bars: HistoricalPriceBar[];
}

async function fetchFredM2Rows(): Promise<FredM2Row[]> {
  if (cachedFredM2Rows.length > 0 && Date.now() - fredFetchedAtMs < M2_CACHE_TTL_MS) {
    return cachedFredM2Rows;
  }
  try {
    const res = await fetch('https://fred.stlouisfed.org/graph/fredgraph.csv?id=M2SL', {
      signal: AbortSignal.timeout(6000),
      headers: {
        Accept: 'text/csv,text/plain',
        'User-Agent': 'Mozilla/5.0 (compatible; ThermodynamicTruthBot/1.0)'
      }
    });
    if (res.ok) {
      const csv = await res.text();
      const parsed = parseFredM2Csv(csv);
      if (parsed.length > 100) {
        cachedFredM2Rows = parsed;
        fredFetchedAtMs = Date.now();
        return parsed;
      }
    }
  } catch {
    // Fall back to cached rows or empirical dataset
  }
  return cachedFredM2Rows;
}

async function fetchYahooAssetSeries(
  symbol: string,
  forceRefresh = false
): Promise<YahooAssetHistory | null> {
  const parsed = await fetchYahooReleaseAndSpot(symbol, forceRefresh);
  if (!parsed || parsed.bars.length === 0) return null;
  const cutoffMs = Date.now() - FIVE_YEARS_MS;
  const recentBars = parsed.bars.filter((b) => b.tsMs >= cutoffMs);
  return {
    spot: parsed.spotPrice,
    bars: recentBars.length > 0 ? recentBars : parsed.bars
  };
}

export async function getLiveM2BenchmarkDataset(forceRefresh = false): Promise<M2BenchmarkDataset> {
  if (
    !forceRefresh &&
    cachedDataset &&
    Date.now() - datasetBuiltAtMs < ASSET_CACHE_TTL_MS
  ) {
    return cachedDataset;
  }
  if (inFlightM2Sync) return inFlightM2Sync;

  const run = async (): Promise<M2BenchmarkDataset> => {
    const [m2Rows, btcHist, kasHist, ethHist, spxHist, goldHist] = await Promise.all([
      fetchFredM2Rows(),
      fetchYahooAssetSeries('BTC-USD', forceRefresh),
      fetchYahooAssetSeries('KAS-USD', forceRefresh),
      fetchYahooAssetSeries('ETH-USD', forceRefresh),
      fetchYahooAssetSeries('^GSPC', forceRefresh),
      fetchYahooAssetSeries('GC=F', forceRefresh)
    ]);

    if (
      m2Rows.length === 0 ||
      !btcHist?.bars.length ||
      !kasHist?.bars.length ||
      !spxHist?.bars.length ||
      !goldHist?.bars.length
    ) {
      return cachedDataset ?? DEFAULT_M2_BENCHMARK_DATASET;
    }

    const latestM2 = m2Rows[m2Rows.length - 1];
    const nowMs = Date.now();
    const spots = {
      btc: btcHist.spot ?? btcHist.bars[btcHist.bars.length - 1].price,
      kas: kasHist.spot ?? kasHist.bars[kasHist.bars.length - 1].price,
      eth:
        ethHist?.spot ??
        (ethHist?.bars.length ? ethHist.bars[ethHist.bars.length - 1].price : 1782.23),
      spx: spxHist.spot ?? spxHist.bars[spxHist.bars.length - 1].price,
      gold: goldHist.spot ?? goldHist.bars[goldHist.bars.length - 1].price
    };

    const seriesByHorizon = buildM2SeriesFromBars({
      m2Rows,
      btcBars: btcHist.bars,
      kasBars: kasHist.bars,
      ethBars: ethHist?.bars || [],
      spxBars: spxHist.bars,
      goldBars: goldHist.bars,
      spots,
      nowMs
    });

    const next: M2BenchmarkDataset = {
      updatedAtMs: nowMs,
      sourceLabel: `Live FRED M2SL (${latestM2.dateStr}) + Yahoo Market Feed`,
      isLive: true,
      latestM2Trillions: Number((latestM2.billions / 1000).toFixed(2)),
      latestM2Date: latestM2.dateStr,
      spots,
      seriesByHorizon
    };

    cachedDataset = next;
    datasetBuiltAtMs = nowMs;
    return next;
  };

  inFlightM2Sync = run().finally(() => {
    inFlightM2Sync = null;
  });

  return inFlightM2Sync;
}

export function getCachedM2BenchmarkDataset(): M2BenchmarkDataset {
  return cachedDataset ?? DEFAULT_M2_BENCHMARK_DATASET;
}
