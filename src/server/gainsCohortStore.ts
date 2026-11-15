import fs from 'node:fs';
import {
  applySpotPricesToCohortRecord,
  buildBasketSyncedCohortRecord,
  formatCohortTimestampLabel,
  sanitizeGainsCohortRecord,
  type CohortAssetEntry,
  type GainsCohortRecord
} from '../data/gainsCohortData.ts';
import { PRELOADED_AUDITS } from '../data/preloadedAudits.ts';

const GAINS_COHORT_FILE = '/tmp/truth_gains_cohort.json';

let memoryCohort: GainsCohortRecord | null = null;

function getDefaultSyncedCohort(): GainsCohortRecord {
  return buildBasketSyncedCohortRecord(PRELOADED_AUDITS);
}

function loadFromDisk(): GainsCohortRecord {
  try {
    if (fs.existsSync(GAINS_COHORT_FILE)) {
      const raw = fs.readFileSync(GAINS_COHORT_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<GainsCohortRecord>;
      return sanitizeGainsCohortRecord(parsed);
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

export function savePersistedGainsCohort(
  rawPayload: Partial<GainsCohortRecord>
): GainsCohortRecord {
  const prev = getPersistedGainsCohort();
  const now = Date.now();
  const sanitized = sanitizeGainsCohortRecord({
    ...rawPayload,
    updatedAtMs: now,
    updatedAtLabel: formatCohortTimestampLabel(now),
    revision: Math.max((prev.revision || 1) + 1, Number(rawPayload.revision) || 1),
    isCustomized:
      rawPayload.isCustomized !== undefined ? Boolean(rawPayload.isCustomized) : false
  });
  memoryCohort = sanitized;
  saveToDisk(sanitized);
  return sanitized;
}

export function resetPersistedGainsCohort(): GainsCohortRecord {
  const defaults = getDefaultSyncedCohort();
  memoryCohort = defaults;
  saveToDisk(defaults);
  return defaults;
}

export async function syncLivePricesAndPersistGainsCohort(
  clientSpotOverrides?: Record<string, number>
): Promise<{
  record: GainsCohortRecord;
  syncedTickers: string[];
  liveSpotMap: Record<string, number>;
}> {
  const current = getPersistedGainsCohort();
  const allItems: CohortAssetEntry[] = [...current.passed, ...current.failed];
  const liveSpotMap: Record<string, number> = {};

  if (clientSpotOverrides && typeof clientSpotOverrides === 'object') {
    Object.entries(clientSpotOverrides).forEach(([tk, val]) => {
      const n = Number(val);
      if (Number.isFinite(n) && n > 0) {
        liveSpotMap[String(tk).trim().toUpperCase()] = n;
      }
    });
  }

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
      // Graceful fallback
    }
  }

  const { nextRecord, updatedTickers } = applySpotPricesToCohortRecord(
    current,
    liveSpotMap,
    updatedTickersLabel(Object.keys(liveSpotMap).length)
  );

  if (updatedTickers.length > 0) {
    memoryCohort = nextRecord;
    saveToDisk(nextRecord);
  }

  return {
    record: updatedTickers.length > 0 ? nextRecord : current,
    syncedTickers: updatedTickers,
    liveSpotMap
  };
}

function updatedTickersLabel(count: number): string {
  return count > 0
    ? `Live Exchange Sync (${count} assets saved)`
    : 'Persisted Backend Cohort';
}
