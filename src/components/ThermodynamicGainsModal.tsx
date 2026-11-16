import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Database,
  DollarSign,
  RefreshCw,
  X
} from 'lucide-react';
import {
  MACRO_CYCLE_TRAJECTORY,
  TACTICAL_90D_TRAJECTORY,
  buildBasketSyncedCohortRecord,
  computeCohortAggregateSummary,
  formatBasketUsd,
  formatPctSigned,
  formatUsdPrice,
  getCohortSyncSignature,
  sanitizeGainsCohortRecord,
  type CohortAssetEntry,
  type GainsCohortRecord
} from '../data/gainsCohortData.ts';
import { formatScore, type AuditData } from '../data/rubricSpec.ts';
import {
  firebaseAuth,
  persistGainsCohortToFirestore,
  subscribeGainsCohortFromFirestore
} from '../lib/firebase.ts';

export type GainsHorizon = 'CYCLE' | 'EX_OUTLIER' | 'TACTICAL_90D';
export type GainsFeedMode = 'SNAPSHOT' | 'LIVE';

export interface ThermodynamicGainsModalProps {
  onClose: () => void;
  auditsMap: Record<string, AuditData>;
  onSelectOrAuditTicker: (ticker: string) => void;
  onCopyReport: (text: string, label: string) => void;
  copiedTarget: string | null;
}

interface EnrichedCohortAsset extends CohortAssetEntry {
  spotPrice: number | null;
  isLiveTick: boolean;
  cyclePct: number | null;
  multiple: number | null;
}

export function ThermodynamicGainsModal({
  onClose,
  auditsMap,
  onSelectOrAuditTicker,
  onCopyReport,
  copiedTarget
}: ThermodynamicGainsModalProps) {
  const [persistedCohortRecord, setPersistedCohortRecord] = useState<GainsCohortRecord | null>(null);
  const [hasLoadedBackend, setHasLoadedBackend] = useState(false);
  const [horizon, setHorizon] = useState<GainsHorizon>('CYCLE');
  const [allocPerAsset, setAllocPerAsset] = useState(1000);
  const [useLogScale, setUseLogScale] = useState(true);
  const [feedMode, setFeedMode] = useState<GainsFeedMode>('SNAPSHOT');
  const [liveSpots, setLiveSpots] = useState<Record<string, number>>({});
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [lastLiveSyncLabel, setLastLiveSyncLabel] = useState<string | null>(null);
  const [backendStatusMsg, setBackendStatusMsg] = useState<string | null>(null);
  const [hoverPointIdx, setHoverPointIdx] = useState<number | null>(null);
  const lastAutoSyncedSigRef = useRef<string | null>(null);

  const chartBoxRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(860);

  useEffect(() => {
    const el = chartBoxRef.current;
    if (!el) return undefined;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 240) setChartWidth(Math.floor(w));
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const cohortRecord = useMemo(
    () => buildBasketSyncedCohortRecord(auditsMap, persistedCohortRecord),
    [auditsMap, persistedCohortRecord]
  );

  // Hydrate saved spot prices from backend API + subscribe to Firestore snapshot
  useEffect(() => {
    let active = true;
    fetch('/api/gains-cohort')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { record?: Partial<GainsCohortRecord> } | null) => {
        if (!active) return;
        if (payload?.record) {
          const hydrated = sanitizeGainsCohortRecord(payload.record);
          setPersistedCohortRecord((prev) =>
            !prev || hydrated.updatedAtMs >= prev.updatedAtMs ? hydrated : prev
          );
        }
        setHasLoadedBackend(true);
      })
      .catch(() => {
        if (active) setHasLoadedBackend(true);
      });

    const unsub = subscribeGainsCohortFromFirestore('default', (remoteRecord) => {
      if (!active) return;
      setPersistedCohortRecord((prev) =>
        !prev || remoteRecord.updatedAtMs >= prev.updatedAtMs ? remoteRecord : prev
      );
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  // Automatically keep backend & Firestore cohort storage synced with the live PASSED/FAILED baskets
  useEffect(() => {
    if (!hasLoadedBackend) return undefined;
    const syncedSig = getCohortSyncSignature(cohortRecord);
    const persistedSig = persistedCohortRecord ? getCohortSyncSignature(persistedCohortRecord) : '';
    if (syncedSig === persistedSig || lastAutoSyncedSigRef.current === syncedSig) {
      return undefined;
    }

    lastAutoSyncedSigRef.current = syncedSig;
    let active = true;
    fetch('/api/gains-cohort', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passed: cohortRecord.passed,
        failed: cohortRecord.failed,
        sourceLabel: cohortRecord.sourceLabel,
        isCustomized: Boolean(persistedCohortRecord?.isCustomized)
      })
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { record?: Partial<GainsCohortRecord> } | null) => {
        if (!active || !payload?.record) return;
        const saved = sanitizeGainsCohortRecord(payload.record);
        lastAutoSyncedSigRef.current = getCohortSyncSignature(
          buildBasketSyncedCohortRecord(auditsMap, saved)
        );
        setPersistedCohortRecord(saved);
        if (firebaseAuth?.currentUser?.emailVerified) {
          void persistGainsCohortToFirestore(saved).catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [hasLoadedBackend, cohortRecord, persistedCohortRecord, auditsMap]);

  const syncLiveExchangeSpots = useCallback(async () => {
    setIsSyncingLive(true);
    const nextSpots: Record<string, number> = {};
    const allItems = [...cohortRecord.passed, ...cohortRecord.failed];

    try {
      const cbTargets = allItems.filter((item) => Boolean(item.coinbasePair));
      await Promise.allSettled(
        cbTargets.map(async (item) => {
          const res = await fetch(
            `https://api.coinbase.com/v2/prices/${item.coinbasePair}/spot`
          );
          if (!res.ok) return;
          const json = (await res.json()) as { data?: { amount?: string } };
          const amt = Number(json?.data?.amount);
          if (Number.isFinite(amt) && amt > 0) {
            nextSpots[item.ticker] = amt;
          }
        })
      );

      const geckoTargets = allItems.filter(
        (item) => item.geckoId && !nextSpots[item.ticker]
      );
      if (geckoTargets.length > 0) {
        const idsParam = geckoTargets.map((i) => i.geckoId).join(',');
        const gRes = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`
        );
        if (gRes.ok) {
          const gJson = (await gRes.json()) as Record<string, { usd?: number }>;
          geckoTargets.forEach((item) => {
            if (!item.geckoId) return;
            const p = Number(gJson?.[item.geckoId]?.usd);
            if (Number.isFinite(p) && p > 0) {
              nextSpots[item.ticker] = p;
            }
          });
        }
      }

      if (Object.keys(nextSpots).length > 0) {
        setLiveSpots((prev) => ({ ...prev, ...nextSpots }));
        setLastLiveSyncLabel(
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        );
      }

      // Persist synced basket lists + live spot prices to backend disk store (+ Firestore if signed in)
      const syncRes = await fetch('/api/gains-cohort/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotOverrides: nextSpots })
      });
      if (syncRes.ok) {
        const syncJson = (await syncRes.json()) as {
          record?: GainsCohortRecord;
          syncedTickers?: string[];
        };
        if (syncJson?.record) {
          const updatedRecord = sanitizeGainsCohortRecord(syncJson.record);
          setPersistedCohortRecord(updatedRecord);
          if (firebaseAuth?.currentUser?.emailVerified && (syncJson.syncedTickers?.length || 0) > 0) {
            void persistGainsCohortToFirestore(updatedRecord).catch(() => {});
          }
          if ((syncJson.syncedTickers?.length || 0) > 0) {
            setBackendStatusMsg(
              `Synced & saved ${syncJson.syncedTickers!.length} live spots`
            );
          }
        }
      }
    } catch {
      // Graceful fallback to verified snapshot prices on any network block
    } finally {
      setIsSyncingLive(false);
    }
  }, [cohortRecord.passed, cohortRecord.failed]);

  useEffect(() => {
    if (feedMode !== 'LIVE') return undefined;
    syncLiveExchangeSpots();
    const timer = setInterval(syncLiveExchangeSpots, 30000);
    return () => clearInterval(timer);
  }, [feedMode, syncLiveExchangeSpots]);

  const { passedEnriched, failedEnriched, passedLiquid, failedLiquid } = useMemo(() => {
    const enrichAsset = (item: CohortAssetEntry): EnrichedCohortAsset => {
      const liveAudit = auditsMap?.[item.ticker];
      const resolvedGrade = liveAudit?.grade || item.grade;
      const resolvedScore =
        liveAudit && Number.isFinite(Number(liveAudit.totalScore))
          ? Number(liveAudit.totalScore)
          : item.auditScore;

      const liveVal = feedMode === 'LIVE' ? liveSpots[item.ticker] : undefined;
      const hasLive = feedMode === 'LIVE' && Number.isFinite(liveVal);
      const spotPrice = hasLive
        ? (liveVal as number)
        : item.snapshotSpot !== null && Number.isFinite(item.snapshotSpot)
        ? item.snapshotSpot
        : null;

      if (!item.liquidCycle || !item.basePrice || !spotPrice) {
        return {
          ...item,
          grade: resolvedGrade,
          auditScore: resolvedScore,
          spotPrice,
          isLiveTick: hasLive,
          cyclePct: null,
          multiple: null
        };
      }

      const cyclePct = ((spotPrice - item.basePrice) / item.basePrice) * 100;
      const multiple = spotPrice / item.basePrice;

      return {
        ...item,
        grade: resolvedGrade,
        auditScore: resolvedScore,
        spotPrice,
        isLiveTick: hasLive,
        cyclePct,
        multiple
      };
    };

    const pEnriched = cohortRecord.passed.map(enrichAsset);
    const fEnriched = cohortRecord.failed.map(enrichAsset);
    return {
      passedEnriched: pEnriched,
      failedEnriched: fEnriched,
      passedLiquid: pEnriched.filter((i) => i.liquidCycle),
      failedLiquid: fEnriched.filter((i) => i.liquidCycle)
    };
  }, [cohortRecord.passed, cohortRecord.failed, auditsMap, feedMode, liveSpots]);

  const summary = useMemo(
    () => computeCohortAggregateSummary(passedLiquid, failedLiquid, allocPerAsset, false),
    [passedLiquid, failedLiquid, allocPerAsset]
  );
  const {
    passCycleAvg,
    passExKasAvg,
    failCycleAvg,
    failExOutlierAvg,
    pass90dAvg,
    fail90dAvg,
    pass90dMedian,
    fail90dMedian,
    passPositiveCount,
    failNegativeCount,
    passEndDollars,
    failEndDollars,
    passExEndDollars,
    failExEndDollars,
    portfolioVictoryMultiple
  } = summary;

  const { btcCyclePct, failedLagBtcCount, maxPassMultiple, minFailCyclePct } = useMemo(() => {
    const btcPct = passedEnriched.find((a) => a.ticker === 'BTC')?.cyclePct ?? null;
    return {
      btcCyclePct: btcPct,
      failedLagBtcCount:
        btcPct !== null
          ? failedLiquid.filter((a) => (a.cyclePct ?? 0) < btcPct).length
          : failNegativeCount,
      maxPassMultiple: passedLiquid.reduce((max, a) => Math.max(max, a.multiple ?? 0), 0),
      minFailCyclePct: failedLiquid.reduce((min, a) => Math.min(min, a.cyclePct ?? 0), 0)
    };
  }, [passedEnriched, passedLiquid, failedLiquid, failNegativeCount]);

  const passInvested = passedLiquid.length * allocPerAsset;
  const failInvested = failedLiquid.length * allocPerAsset;

  const rawSeries = useMemo(
    () =>
      horizon === 'TACTICAL_90D'
        ? TACTICAL_90D_TRAJECTORY.map((pt) => ({
            label: pt.label,
            event: pt.event,
            passPrimary: pt.passAll,
            passSecondary: pt.passMed as number | null,
            failPrimary: pt.failAll,
            failSecondary: pt.failMed as number | null
          }))
        : MACRO_CYCLE_TRAJECTORY.map((pt, idx, arr) => {
            const isLast = idx === arr.length - 1;
            const livePassMult = isLast ? Math.max(0.2, 1 + passCycleAvg / 100) : pt.passAll;
            const livePassExMult = isLast ? Math.max(0.2, 1 + passExKasAvg / 100) : pt.passEx;
            const liveFailMult = isLast ? Math.max(0.2, 1 + failCycleAvg / 100) : pt.failAll;
            const liveFailExMult = isLast
              ? Math.max(0.2, 1 + failExOutlierAvg / 100)
              : pt.failEx;

            return horizon === 'EX_OUTLIER'
              ? {
                  label: pt.label,
                  event: pt.event,
                  passPrimary: livePassExMult,
                  passSecondary: null as number | null,
                  failPrimary: liveFailExMult,
                  failSecondary: liveFailMult as number | null
                }
              : {
                  label: pt.label,
                  event: pt.event,
                  passPrimary: livePassMult,
                  passSecondary: livePassExMult as number | null,
                  failPrimary: liveFailMult,
                  failSecondary: liveFailExMult as number | null
                };
          }),
    [horizon, passCycleAvg, passExKasAvg, failCycleAvg, failExOutlierAvg]
  );

  const svgH = 248;
  const padL = 58;
  const padR = 22;
  const padT = 20;
  const padB = 34;
  const plotW = Math.max(180, chartWidth - padL - padR);
  const plotH = svgH - padT - padB;

  const allMultValues = rawSeries.flatMap((d) =>
    [d.passPrimary, d.passSecondary, d.failPrimary, d.failSecondary, 1.0].filter(
      (v): v is number => v !== null && Number.isFinite(v)
    )
  );
  const minVal = Math.min(...allMultValues) * 0.88;
  const maxVal = Math.max(...allMultValues) * 1.08;

  const effectiveLog = horizon === 'CYCLE' ? useLogScale : false;
  const mapY = (mult: number) => {
    const safeMult = Number.isFinite(mult) ? mult : 1.0;
    const clamped = Math.max(0.1, safeMult);
    if (effectiveLog) {
      const logMin = Math.log10(Math.max(0.1, minVal));
      const logMax = Math.log10(Math.max(0.2, maxVal));
      const ratio = (Math.log10(clamped) - logMin) / Math.max(0.0001, logMax - logMin);
      const yVal = padT + plotH * (1 - ratio);
      return Number.isFinite(yVal) ? yVal : padT + plotH * 0.5;
    }
    const ratio = (clamped - minVal) / Math.max(0.0001, maxVal - minVal);
    const yVal = padT + plotH * (1 - ratio);
    return Number.isFinite(yVal) ? yVal : padT + plotH * 0.5;
  };

  const mapX = (idx: number) =>
    padL + (idx / Math.max(1, rawSeries.length - 1)) * plotW;

  const buildPolyline = (key: 'passPrimary' | 'passSecondary' | 'failPrimary' | 'failSecondary') => {
    const pts = rawSeries
      .map((d, i) => {
        const val = d[key];
        return val !== null ? `${mapX(i).toFixed(1)},${mapY(val).toFixed(1)}` : null;
      })
      .filter((p): p is string => Boolean(p));
    return pts.length > 1 ? `M ${pts.join(' L ')}` : '';
  };

  const passAreaPath = (() => {
    const line = buildPolyline('passPrimary');
    if (!line) return '';
    return `${line} L ${mapX(rawSeries.length - 1).toFixed(1)},${(padT + plotH).toFixed(
      1
    )} L ${mapX(0).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;
  })();

  const activePointIdx =
    hoverPointIdx !== null ? hoverPointIdx : rawSeries.length - 1;
  const activePoint = rawSeries[activePointIdx] || rawSeries[rawSeries.length - 1];

  const getMetricForAsset = (item: EnrichedCohortAsset) => {
    if (!item.liquidCycle) return -99999;
    return horizon === 'TACTICAL_90D' ? item.tactical90dPct || 0 : item.cyclePct || 0;
  };

  const sortedPassed = [...passedEnriched].sort(
    (a, b) => getMetricForAsset(b) - getMetricForAsset(a)
  );
  const sortedFailed = [...failedEnriched].sort(
    (a, b) => getMetricForAsset(b) - getMetricForAsset(a)
  );

  const buildShareableGainsReport = () => {
    const topPassAnchors = passedLiquid
      .slice(0, 6)
      .map((a) => `$${a.ticker} (${formatPctSigned(a.cyclePct)})`)
      .join(', ');
    const bleedAssets = failedLiquid
      .filter((a) => (a.cyclePct || 0) < 0)
      .slice(0, 6)
      .map((a) => `$${a.ticker} ${formatPctSigned(a.cyclePct)}`)
      .join(', ');

    return `THE TRUTH — THERMODYNAMIC GAINS AUDIT (${cohortRecord.updatedAtLabel.toUpperCase()})

PASSED // E > 0 (${cohortRecord.passed.length} Harmonic — PoW & Physical Commodities):
• Full-Cycle Equal-Weight Avg: ${formatPctSigned(passCycleAvg)} (${formatPctSigned(passExKasAvg)} Ex-KAS)
• $${allocPerAsset.toLocaleString()}/Asset Basket (${passedLiquid.length} Liquid): $${passInvested.toLocaleString()} → ~$${passEndDollars.toLocaleString()}
• Breadth: ${passPositiveCount} of ${passedLiquid.length} Liquid Assets Positive • 90D Median: ${formatPctSigned(pass90dMedian)}
• Top Anchors: ${topPassAnchors}

FAILED // E = 0 (${cohortRecord.failed.length} Flatlined — PoS & Premined):
• Full-Cycle Equal-Weight Avg: ${formatPctSigned(failCycleAvg)} (${formatPctSigned(failExOutlierAvg)} Ex-Outliers)
• $${allocPerAsset.toLocaleString()}/Asset Basket (${failedLiquid.length} Assets): $${failInvested.toLocaleString()} → ~$${failEndDollars.toLocaleString()}
• Left-Tail VC Bleed: ${failNegativeCount} of ${failedLiquid.length} Negative${bleedAssets ? ` (${bleedAssets})` : ''}

VERDICT: ${portfolioVictoryMultiple}x Total Portfolio Victory for Unforgeable Physical Costliness (E > 0).`;
  };

  const yGridTicks =
    horizon === 'CYCLE' && effectiveLog
      ? [0.5, 1, 2, 5, 10, 22]
      : horizon === 'EX_OUTLIER'
      ? [0.6, 1.0, 1.5, 2.0, 2.6]
      : [0.95, 1.0, 1.15, 1.3, 1.45];

  return (
    <div
      onClick={onClose}
      className="animate-modal-backdrop fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-5"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Thermodynamic Gains Divergence"
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-sheet w-full max-w-6xl max-h-[93vh] rounded-3xl bg-[#121418] border border-white/15 flex flex-col overflow-hidden shadow-[0_28px_90px_rgba(0,0,0,0.92)]"
      >
        <div className="px-3.5 sm:px-7 py-3.5 sm:py-4 bg-[#0B0C0E]/95 border-b border-white/[0.08] space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-[9.5px] sm:text-[10px] uppercase tracking-widest text-[#49EACB] flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#49EACB] shadow-[0_0_8px_#49EACB] shrink-0" />
                  <span>EMPIRICAL MARKET VERIFICATION // MAY 2022 → NOV 2026</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[9px] text-neutral-300 normal-case tracking-normal">
                  <Database className="w-2.5 h-2.5 text-[#49EACB] shrink-0" />
                  <span>{backendStatusMsg || cohortRecord.sourceLabel}</span>
                </span>
              </div>
              <h2 className="font-display text-base sm:text-xl font-bold text-white mt-0.5 leading-snug">
                Thermodynamic Gains Divergence: Passed (E &gt; 0) vs. Failed (E = 0)
              </h2>
            </div>

            <button
              type="button"
              aria-label="Close Live Gains Modal"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#121418] hover:bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors duration-150 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="p-0.5 rounded-full bg-[#121418] border border-white/10 flex items-center font-mono text-[10px] sm:text-[10.5px] shrink-0">
                <button
                  type="button"
                  onClick={() => setFeedMode('SNAPSHOT')}
                  className={`px-2 sm:px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 whitespace-nowrap ${
                    feedMode === 'SNAPSHOT'
                      ? 'bg-[#1D212A] text-white border-white/15'
                      : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                  }`}
                >
                  <span className="sm:hidden">Saved</span>
                  <span className="hidden sm:inline">Nov &apos;26 Benchmark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFeedMode('LIVE')}
                  className={`px-2 sm:px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 flex items-center gap-1.5 whitespace-nowrap ${
                    feedMode === 'LIVE'
                      ? 'bg-[#49EACB]/15 text-[#49EACB] border-[#49EACB]/40'
                      : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      feedMode === 'LIVE' ? 'bg-[#49EACB] animate-ping' : 'bg-neutral-500'
                    }`}
                  />
                  <span className="sm:hidden">Live</span>
                  <span className="hidden sm:inline">Live Spot Feed</span>
                </button>
              </div>

              {feedMode === 'LIVE' && (
                <button
                  type="button"
                  disabled={isSyncingLive}
                  onClick={syncLiveExchangeSpots}
                  title="Sync live spot prices and save to backend"
                  className="px-2 sm:px-2.5 py-1 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[10px] sm:text-[10.5px] text-neutral-300 flex items-center justify-center gap-1 tabular-nums transition-colors duration-150 shrink-0 whitespace-nowrap"
                >
                  <RefreshCw
                    className={`w-3 h-3 text-[#49EACB] shrink-0 ${isSyncingLive ? 'animate-spin' : ''}`}
                  />
                  <span className="hidden md:inline">{lastLiveSyncLabel || 'Syncing...'}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => onCopyReport(buildShareableGainsReport(), 'gains-report')}
              className="ml-auto px-2.5 sm:px-3.5 py-1.5 rounded-full font-mono text-[10.5px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap transition-opacity duration-150 hover:brightness-110"
              style={{
                backgroundImage: 'linear-gradient(135deg, #49EACB 0%, #34D399 100%)',
                color: '#041713'
              }}
            >
              {copiedTarget === 'gains-report' ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span className="sm:hidden">Copied!</span>
                  <span className="hidden sm:inline">Copied Report!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span className="sm:hidden">Copy</span>
                  <span className="hidden sm:inline">Copy Gains Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="p-1 rounded-2xl sm:rounded-full bg-[#0B0C0E] border border-white/[0.08] flex flex-wrap items-center gap-1 font-mono text-xs">
              {(
                [
                  { id: 'CYCLE', label: "1. Full Macro Cycle (May '22 → Nov '26)" },
                  { id: 'EX_OUTLIER', label: '2. Ex-Outlier Stress Test (Ex-KAS vs Ex-TAO)' },
                  { id: 'TACTICAL_90D', label: "3. 90-Day Tactical (Aug – Nov '26)" }
                ] as const
              ).map((tab) => {
                const active = horizon === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setHoverPointIdx(null);
                      setHorizon(tab.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl sm:rounded-full border font-semibold transition-colors duration-150 ${
                      active
                        ? 'bg-[#171B24] text-white border-white/15 shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-start gap-1 bg-[#0B0C0E] px-2.5 py-1.5 rounded-2xl sm:rounded-full border border-white/[0.08] font-mono text-[10.5px] sm:text-[11px]">
              <span className="inline-flex items-center gap-1 text-neutral-400 mr-0.5 shrink-0">
                <DollarSign className="w-3.5 h-3.5 text-[#49EACB] shrink-0" />
                <span>Sim:</span>
              </span>
              <div className="flex items-center gap-1">
                {[100, 1000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAllocPerAsset(amt)}
                    className={`px-1.5 sm:px-2 py-0.5 rounded-full border font-semibold tabular-nums transition-colors duration-150 ${
                      allocPerAsset === amt
                        ? 'bg-[#49EACB]/15 text-[#49EACB] border-[#49EACB]/40'
                        : 'text-neutral-400 hover:text-white border-transparent'
                    }`}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#0B0C0E] border border-[#49EACB]/35 p-4 space-y-1 min-w-0 overflow-hidden">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#49EACB] flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                <span>PASSED // E &gt; 0 ({cohortRecord.passed.length})</span>
                <span className="shrink-0 opacity-85">PoW + Metals</span>
              </div>
              <div
                className="font-display text-2xl sm:text-3xl font-bold"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #49EACB 0%, #34D399 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {horizon === 'EX_OUTLIER'
                  ? formatPctSigned(passExKasAvg)
                  : horizon === 'TACTICAL_90D'
                  ? formatPctSigned(pass90dMedian)
                  : formatPctSigned(passCycleAvg)}
              </div>
              <div className="font-mono text-[11px] text-neutral-300">
                {horizon === 'TACTICAL_90D'
                  ? `${formatPctSigned(pass90dAvg)} Equal-Wt • ${passedLiquid.length}/${passedLiquid.length} Active`
                  : `${formatPctSigned(passExKasAvg)} Ex-KAS • ${passPositiveCount}/${passedLiquid.length} Positive`}
              </div>
            </div>

            <div className="rounded-2xl bg-[#0B0C0E] border border-[#EF4444]/35 p-4 space-y-1 min-w-0 overflow-hidden">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#EF4444] flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                <span>FAILED // E = 0 ({cohortRecord.failed.length})</span>
                <span className="shrink-0 opacity-85">PoS + Premine</span>
              </div>
              <div
                className="font-display text-2xl sm:text-3xl font-bold"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {horizon === 'EX_OUTLIER'
                  ? formatPctSigned(failExOutlierAvg)
                  : horizon === 'TACTICAL_90D'
                  ? formatPctSigned(fail90dMedian)
                  : formatPctSigned(failCycleAvg)}
              </div>
              <div className="font-mono text-[11px] text-neutral-400">
                {horizon === 'TACTICAL_90D'
                  ? `${formatPctSigned(fail90dAvg)} Mean • ${failedLagBtcCount}/${failedLiquid.length} Lag BTC`
                  : `${formatPctSigned(failExOutlierAvg)} Ex-TAO • ${failNegativeCount}/${failedLiquid.length} Negative`}
              </div>
            </div>

            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1 min-w-0 overflow-hidden">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 truncate">
                ${allocPerAsset.toLocaleString()}/ASSET BASKET OUTCOME
              </div>
              <div
                title={`~$${(horizon === 'EX_OUTLIER'
                  ? passExEndDollars
                  : passEndDollars
                ).toLocaleString()} vs ~$${(horizon === 'EX_OUTLIER'
                  ? failExEndDollars
                  : failEndDollars
                ).toLocaleString()}`}
                className="font-display text-lg sm:text-xl xl:text-2xl font-bold text-white flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 leading-tight"
              >
                <span className="text-[#49EACB] whitespace-nowrap">
                  ~{formatBasketUsd(horizon === 'EX_OUTLIER' ? passExEndDollars : passEndDollars)}
                </span>
                <span className="text-xs font-mono text-neutral-500">vs</span>
                <span className="text-[#F97316] whitespace-nowrap">
                  ~{formatBasketUsd(horizon === 'EX_OUTLIER' ? failExEndDollars : failEndDollars)}
                </span>
              </div>
              <div className="font-mono text-[11px] text-[#34D399] font-semibold">
                {horizon === 'EX_OUTLIER'
                  ? 'E > 0 Nearly Triples Capital While E = 0 Loses Principal'
                  : `${portfolioVictoryMultiple}x Total Portfolio Victory for E > 0`}
              </div>
            </div>

            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1 min-w-0 overflow-hidden">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 truncate">
                CONVEXITY VS. VC CLIFF BLEED
              </div>
              <div className="font-display text-lg sm:text-xl xl:text-2xl font-bold text-white leading-tight">
                <span className="text-[#49EACB]">
                  {maxPassMultiple > 0 ? `${maxPassMultiple.toFixed(1)}x` : '—'}
                </span>{' '}
                <span className="font-mono text-xs text-neutral-500">Right-Tail</span>{' '}
                <span className="text-[#EF4444]">
                  {formatPctSigned(minFailCyclePct)}
                </span>{' '}
                <span className="font-mono text-xs text-neutral-500">PoS Floor</span>
              </div>
              <div className="font-mono text-[11px] text-neutral-400">
                0 VC unlocks on $KAS vs endless 0-Joule dilution
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#07080A] border border-white/[0.08] p-4 sm:p-5 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 min-h-[28px]">
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 min-w-0 truncate">
                  {horizon === 'TACTICAL_90D'
                    ? '90-DAY TACTICAL WINDOW (AUG 15 – NOV 14, 2026) // MEDIAN CONSISTENCY VS SQUEEZE NOISE'
                    : horizon === 'EX_OUTLIER'
                    ? `EX-OUTLIER STRUCTURAL CURVE // PASSED EX-KAS (${formatPctSigned(passExKasAvg)}) VS FAILED EX-TAO (${formatPctSigned(failExOutlierAvg)})`
                    : 'CUMULATIVE COHORT EQUITY MULTIPLIER // SCRUB TIMELINE TO INSPECT'}
                </div>

                {horizon === 'CYCLE' ? (
                  <div className="p-0.5 rounded-full bg-[#121418] border border-white/10 flex items-center font-mono text-[10px] shrink-0">
                    <button
                      type="button"
                      onClick={() => setUseLogScale(true)}
                      className={`px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 ${
                        useLogScale
                          ? 'bg-[#1D212A] text-white border-white/15'
                          : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                      }`}
                    >
                      Log Scale
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseLogScale(false)}
                      className={`px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 ${
                        !useLogScale
                          ? 'bg-[#1D212A] text-white border-white/15'
                          : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                      }`}
                    >
                      Linear (12x Gap)
                    </button>
                  </div>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-[#121418] border border-white/[0.07] font-mono text-[10px] text-neutral-400 shrink-0">
                    Linear Scale
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tabular-nums min-h-[20px]">
                <span className="text-white font-bold">
                  [{activePoint.label} — {activePoint.event}]
                </span>
                <span className="text-[#49EACB] font-bold">
                  E &gt; 0: {formatPctSigned((activePoint.passPrimary - 1) * 100)} (
                  {activePoint.passPrimary.toFixed(2)}x)
                </span>
                {activePoint.passSecondary !== null && (
                  <span className="text-[#34D399]">
                    {horizon === 'TACTICAL_90D' ? 'E>0 Median' : 'E>0 Ex-KAS'}:{' '}
                    {formatPctSigned((activePoint.passSecondary - 1) * 100)}
                  </span>
                )}
                <span className="text-[#EF4444] font-bold">
                  E = 0: {formatPctSigned((activePoint.failPrimary - 1) * 100)} (
                  {activePoint.failPrimary.toFixed(2)}x)
                </span>
                {activePoint.failSecondary !== null && (
                  <span className="text-[#F97316]">
                    {horizon === 'TACTICAL_90D'
                      ? 'E=0 Median'
                      : horizon === 'EX_OUTLIER'
                      ? 'E=0 All'
                      : 'E=0 Ex-TAO'}
                    : {formatPctSigned((activePoint.failSecondary - 1) * 100)}
                  </span>
                )}
              </div>
            </div>

            <div
              ref={chartBoxRef}
              onMouseLeave={() => setHoverPointIdx(null)}
              className="w-full overflow-hidden rounded-xl bg-[#0B0C0E] border border-white/[0.05] relative"
            >
              <svg
                width={chartWidth}
                height={svgH}
                viewBox={`0 0 ${chartWidth} ${svgH}`}
                className="block w-full select-none"
              >
                <defs>
                  <linearGradient id="gainsPassArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#49EACB" stopOpacity="0.26" />
                    <stop offset="100%" stopColor="#34D399" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="gainsPassStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#49EACB" />
                    <stop offset="100%" stopColor="#34D399" />
                  </linearGradient>
                  <linearGradient id="gainsFailStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#F97316" />
                  </linearGradient>
                </defs>

                {yGridTicks.map((tickVal) => {
                  const y = mapY(tickVal);
                  if (y < padT - 4 || y > padT + plotH + 4) return null;
                  const isBreakeven = Math.abs(tickVal - 1.0) < 0.001;
                  return (
                    <g key={tickVal}>
                      <line
                        x1={padL}
                        y1={y}
                        x2={chartWidth - padR}
                        y2={y}
                        stroke={
                          isBreakeven
                            ? 'rgba(255,255,255,0.22)'
                            : 'rgba(255,255,255,0.05)'
                        }
                        strokeDasharray={isBreakeven ? '4 4' : undefined}
                        strokeWidth={isBreakeven ? '1.2' : '1'}
                      />
                      <text
                        x={padL - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        fill={isBreakeven ? '#E5E7EB' : '#6B7280'}
                        fontSize="9.5"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {tickVal >= 2 ? `${tickVal}x` : formatPctSigned((tickVal - 1) * 100)}
                      </text>
                    </g>
                  );
                })}

                <path d={passAreaPath} fill="url(#gainsPassArea)" />

                {buildPolyline('failSecondary') && (
                  <path
                    d={buildPolyline('failSecondary')}
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    strokeOpacity="0.78"
                  />
                )}
                {buildPolyline('passSecondary') && (
                  <path
                    d={buildPolyline('passSecondary')}
                    fill="none"
                    stroke="#34D399"
                    strokeWidth="1.7"
                    strokeDasharray="5 4"
                    strokeOpacity="0.88"
                  />
                )}

                <path
                  d={buildPolyline('failPrimary')}
                  fill="none"
                  stroke="url(#gainsFailStroke)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />

                <path
                  d={buildPolyline('passPrimary')}
                  fill="none"
                  stroke="url(#gainsPassStroke)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {rawSeries.map((pt, idx) => {
                  const x = mapX(idx);
                  const yPass = mapY(pt.passPrimary);
                  const yFail = mapY(pt.failPrimary);
                  const isActive = idx === activePointIdx;
                  const colW = plotW / Math.max(1, rawSeries.length - 1);

                  return (
                    <g key={pt.label}>
                      {isActive && (
                        <line
                          x1={x}
                          y1={padT}
                          x2={x}
                          y2={padT + plotH}
                          stroke="rgba(255,255,255,0.22)"
                          strokeWidth="1"
                          strokeDasharray="3 3"
                        />
                      )}

                      <circle
                        cx={x}
                        cy={yFail}
                        r={isActive ? 5 : 3}
                        fill="#0B0C0E"
                        stroke="#EF4444"
                        strokeWidth={isActive ? 2.4 : 1.6}
                      />
                      <circle
                        cx={x}
                        cy={yPass}
                        r={isActive ? 5.5 : 3.4}
                        fill="#0B0C0E"
                        stroke="#49EACB"
                        strokeWidth={isActive ? 2.6 : 1.8}
                      />

                      <text
                        x={x}
                        y={svgH - 11}
                        textAnchor="middle"
                        fill={isActive ? '#FFFFFF' : '#6B7280'}
                        fontSize="9.5"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight={isActive ? '700' : '400'}
                      >
                        {pt.label}
                      </text>

                      <rect
                        x={x - colW / 2}
                        y={0}
                        width={colW}
                        height={svgH}
                        fill="transparent"
                        className="cursor-crosshair"
                        onMouseEnter={() => setHoverPointIdx(idx)}
                        onClick={() => setHoverPointIdx(idx)}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] text-neutral-400">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-[#49EACB]">
                  <span className="w-3 h-0.5 bg-[#49EACB] inline-block" />
                  <span>
                    {horizon === 'EX_OUTLIER'
                      ? `PASSED Ex-KAS (${formatPctSigned(passExKasAvg)})`
                      : 'PASSED E > 0 Equal-Weight'}
                  </span>
                </span>
                {horizon !== 'EX_OUTLIER' && (
                  <span className="inline-flex items-center gap-1.5 text-[#34D399]">
                    <span className="w-3 border-t border-dashed border-[#34D399] inline-block" />
                    <span>
                      {horizon === 'TACTICAL_90D'
                        ? `PASSED 90D Median (${formatPctSigned(pass90dMedian)})`
                        : `PASSED Ex-KAS (${formatPctSigned(passExKasAvg)})`}
                    </span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-[#EF4444]">
                  <span className="w-3 h-0.5 bg-[#EF4444] inline-block" />
                  <span>
                    {horizon === 'EX_OUTLIER'
                      ? `FAILED Ex-Outliers (${formatPctSigned(failExOutlierAvg)})`
                      : 'FAILED E = 0 Equal-Weight'}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#F97316]">
                  <span className="w-3 border-t border-dashed border-[#F97316] inline-block" />
                  <span>
                    {horizon === 'TACTICAL_90D'
                      ? `FAILED 90D Median (${formatPctSigned(fail90dMedian)})`
                      : horizon === 'EX_OUTLIER'
                      ? `FAILED All (${formatPctSigned(failCycleAvg)})`
                      : `FAILED Ex-Outliers (${formatPctSigned(failExOutlierAvg)})`}
                  </span>
                </span>
              </div>
              <span className="text-neutral-500">
                Click any asset row below to inspect or pull its 6-invariant audit
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#0B0C0E] border border-[#49EACB]/25 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.07]">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#49EACB]">
                  <span className="w-2 h-2 rounded-full bg-[#49EACB] shadow-[0_0_8px_#49EACB]" />
                  <span>PASSED // E &gt; 0 ({cohortRecord.passed.length} Harmonic)</span>
                </div>
                <span className="font-mono text-[10.5px] text-neutral-400">
                  PoW &amp; Physical Commodities
                </span>
              </div>

              <div className="space-y-2">
                {sortedPassed.map((item) => {
                  const pct =
                    horizon === 'TACTICAL_90D' ? item.tactical90dPct : item.cyclePct;
                  const isDimmedOutlier = horizon === 'EX_OUTLIER' && item.isOutlier;
                  const barPct =
                    pct === null
                      ? 0
                      : horizon === 'TACTICAL_90D'
                      ? Math.min(100, (Math.abs(pct) / 240) * 100)
                      : pct >= 0
                      ? Math.min(100, (Math.log10(1 + pct / 10) / Math.log10(2260)) * 100)
                      : Math.min(100, (Math.abs(pct) / 100) * 65);
                  const isPositive = pct === null || pct >= 0;

                  return (
                    <button
                      key={item.ticker}
                      type="button"
                      onClick={() => onSelectOrAuditTicker(item.ticker)}
                      className={`w-full text-left rounded-xl bg-[#121418] hover:bg-[#171B22] border border-white/[0.06] hover:border-[#49EACB]/40 p-2.5 transition space-y-1.5 ${
                        isDimmedOutlier ? 'opacity-45' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-mono text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-white">${item.ticker}</span>
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#49EACB]/12 text-[#49EACB] border border-[#49EACB]/35">
                            {item.grade} • {formatScore(item.auditScore)}
                          </span>
                          <span className="text-[11px] text-neutral-400 truncate hidden sm:inline">
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.spotPrice !== null && item.basePrice !== null ? (
                            <span className="text-[10.5px] text-neutral-400">
                              {item.baselineLabel} →{' '}
                              <strong className="text-neutral-200">
                                {formatUsdPrice(item.spotPrice)}
                              </strong>
                            </span>
                          ) : item.spotPrice !== null ? (
                            <span className="text-[10.5px] text-neutral-400">
                              Live Spot →{' '}
                              <strong className="text-neutral-200">
                                {formatUsdPrice(item.spotPrice)}
                              </strong>
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-500">
                              {item.baselineLabel}
                            </span>
                          )}
                          <span
                            className="font-bold min-w-[68px] text-right"
                            style={{ color: isPositive ? '#49EACB' : '#F97316' }}
                          >
                            {pct !== null
                              ? formatPctSigned(pct)
                              : item.ticker === 'LN' || item.ticker === 'IGRA'
                              ? 'Carrier'
                              : item.spotPrice !== null
                              ? 'Tracked'
                              : 'Audited'}
                          </span>
                        </div>
                      </div>

                      {pct !== null && (
                        <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(3, barPct)}%`,
                              backgroundImage: isPositive
                                ? 'linear-gradient(90deg, #49EACB 0%, #34D399 100%)'
                                : 'linear-gradient(90deg, #F97316 0%, #EF4444 100%)'
                            }}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-neutral-500">
                        <span className="truncate">{item.note}</span>
                        {item.multiple !== null && horizon !== 'TACTICAL_90D' && (
                          <span className="shrink-0 text-neutral-300">
                            {item.multiple >= 10
                              ? `${item.multiple.toFixed(1)}x`
                              : `${item.multiple.toFixed(2)}x`}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-[#0B0C0E] border border-[#EF4444]/25 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.07]">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#EF4444]">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]" />
                  <span>FAILED // E = 0 ({cohortRecord.failed.length} Flatlined)</span>
                </div>
                <span className="font-mono text-[10.5px] text-neutral-400">
                  PoS &amp; Premined Ledgers (All Grade F)
                </span>
              </div>

              <div className="space-y-2">
                {sortedFailed.map((item) => {
                  const pct =
                    horizon === 'TACTICAL_90D' ? item.tactical90dPct : item.cyclePct;
                  const isDimmedOutlier = horizon === 'EX_OUTLIER' && item.isOutlier;
                  const barPct =
                    pct === null
                      ? 0
                      : horizon === 'TACTICAL_90D'
                      ? Math.min(100, (Math.abs(pct) / 240) * 100)
                      : pct >= 0
                      ? Math.min(100, (Math.log10(1 + pct / 10) / Math.log10(2260)) * 100)
                      : Math.min(100, (Math.abs(pct) / 100) * 85);
                  const isPositive = pct === null || pct >= 0;

                  return (
                    <button
                      key={item.ticker}
                      type="button"
                      onClick={() => onSelectOrAuditTicker(item.ticker)}
                      className={`w-full text-left rounded-xl bg-[#121418] hover:bg-[#191416] border border-white/[0.06] hover:border-[#EF4444]/40 p-2.5 transition space-y-1.5 ${
                        isDimmedOutlier ? 'opacity-45' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-mono text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-white">${item.ticker}</span>
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#EF4444]/12 text-[#EF4444] border border-[#EF4444]/35">
                            {item.grade} • {formatScore(item.auditScore)}
                          </span>
                          <span className="text-[11px] text-neutral-400 truncate hidden sm:inline">
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.spotPrice !== null && item.basePrice !== null ? (
                            <span className="text-[10.5px] text-neutral-400">
                              {item.baselineLabel} →{' '}
                              <strong className="text-neutral-200">
                                {formatUsdPrice(item.spotPrice)}
                              </strong>
                            </span>
                          ) : item.spotPrice !== null ? (
                            <span className="text-[10.5px] text-neutral-400">
                              Live Spot →{' '}
                              <strong className="text-neutral-200">
                                {formatUsdPrice(item.spotPrice)}
                              </strong>
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-500">
                              {item.baselineLabel}
                            </span>
                          )}
                          <span
                            className="font-bold min-w-[68px] text-right"
                            style={{
                              color:
                                pct === null
                                  ? '#9CA3AF'
                                  : isPositive
                                  ? '#F97316'
                                  : '#EF4444'
                            }}
                          >
                            {pct !== null
                              ? formatPctSigned(pct)
                              : item.spotPrice !== null
                              ? 'Tracked'
                              : 'Audited'}
                          </span>
                        </div>
                      </div>

                      {pct !== null && (
                        <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(3, barPct)}%`,
                              backgroundImage: isPositive
                                ? 'linear-gradient(90deg, #F97316 0%, #FB923C 100%)'
                                : 'linear-gradient(90deg, #EF4444 0%, #991B1B 100%)'
                            }}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-neutral-500">
                        <span className="truncate">{item.note}</span>
                        {item.multiple !== null && horizon !== 'TACTICAL_90D' && (
                          <span className="shrink-0 text-neutral-400">
                            {item.multiple.toFixed(2)}x
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1.5">
              <div className="font-mono text-[10.5px] font-bold text-[#49EACB]">
                01 // ASYMMETRIC RIGHT-TAIL MONSTER ($KAS)
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Starting from a $0.00 fair-launch genesis with zero VC overhang, 100% of organic
                adoption flowed into vertical price discovery (+22,492% / 225.9x) rather than
                funding Silicon Valley seed-round exit liquidity—turning ${allocPerAsset.toLocaleString()}/asset into
                ~${passEndDollars.toLocaleString()} vs ~${failEndDollars.toLocaleString()} on E = 0 ({portfolioVictoryMultiple}x portfolio victory).
              </p>
            </div>

            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1.5">
              <div className="font-mono text-[10.5px] font-bold text-[#EF4444]">
                02 // ELIMINATING THE &ldquo;VC BLEED-TO-ZERO&rdquo; LEFT TAIL
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Nearly half of the E = 0 cohort suffered catastrophic multi-year liquidation: ALGO
                (-73.2%), ADA (-70.9%), AVAX (-69.6%), ICP (-43.5% / -99% ATH), SUI (-39.3%), and
                NEAR (-34.7%). Tokens conjured at 0 Joules bleed endless insider unlocks and staking
                dilution into every rally.
              </p>
            </div>

            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1.5">
              <div className="font-mono text-[10.5px] font-bold text-[#34D399]">
                03 // THERMODYNAMIC FLOOR PROTECTION (EX-OUTLIERS)
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Physical commodities (XAU, XAG) and Proof-of-Work ledgers (BTC, KAS, XMR, ZEC)
                cannot be printed for free. Even stripping KAS out of Passed and TAO out of Failed,
                the remaining E &gt; 0 basket averages {formatPctSigned(passExKasAvg)} across the cycle versus{' '}
                {formatPctSigned(failExOutlierAvg)} for E = 0.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
