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
  RELEASE_COHORT_TRAJECTORY,
  buildBasketSyncedCohortRecord,
  buildFallbackWindowTrajectory,
  buildNiceYGridTicks,
  computeCohortAggregateSummary,
  formatBasketUsd,
  formatPctSigned,
  formatUsdPrice,
  getCohortSyncSignature,
  mergeResolvedEntriesIntoCohortRecord,
  resolveCohortBaselinePrice,
  sanitizeGainsCohortRecord,
  type CohortAssetEntry,
  type GainsBaselineMode,
  type GainsCohortRecord,
  type WindowTrajectoriesMap
} from '../data/gainsCohortData.ts';
import {
  DEFAULT_M2_BENCHMARK_DATASET,
  applyLiveSpotsToM2Dataset,
  computeM2AssetSummaries,
  type M2BenchmarkDataset
} from '../data/m2BenchmarkData.ts';
import { computeBtcHorizonSummary } from '../data/btcBenchmarkData.ts';
import { BtcBenchmarkPanel } from './BtcBenchmarkPanel.tsx';
import { M2BenchmarkPanel } from './M2BenchmarkPanel.tsx';
import { formatScore, type AuditData } from '../data/rubricSpec.ts';
import {
  firebaseAuth,
  getFirebaseIdToken,
  persistGainsCohortToFirestore,
  subscribeGainsCohortFromFirestore
} from '../lib/firebase.ts';

export type GainsHorizon = 'ALL_TIME' | 'D180' | 'Y1' | 'Y2' | 'Y4';
export type GainsFeedMode = 'SNAPSHOT' | 'LIVE';
export type GainsChartView = 'COHORTS' | 'BTC_BENCHMARK' | 'M2_BENCHMARK';

export interface ThermodynamicGainsModalProps {
  onClose: () => void;
  auditsMap: Record<string, AuditData>;
  onSelectOrAuditTicker: (ticker: string) => void;
  onCopyReport: (text: string, label: string) => void;
  copiedTarget: string | null;
  initialCohortRecord?: GainsCohortRecord | null;
  initialLiveSpots?: Record<string, number>;
  onCohortSynced?: (record: GainsCohortRecord, liveSpots: Record<string, number>) => void;
}

interface EnrichedCohortAsset extends CohortAssetEntry {
  spotPrice: number | null;
  isLiveTick: boolean;
  cyclePct: number | null;
  multiple: number | null;
  activeBaselinePrice: number | null;
  activeBaselineLabel: string;
}

const HORIZON_META: Record<
  GainsHorizon,
  { tabLabel: string; heading: string; banner: string }
> = {
  ALL_TIME: {
    tabLabel: 'All Time',
    heading: 'ALL TIME (SINCE RELEASE)',
    banner: 'EMPIRICAL MARKET VERIFICATION // INCEPTION RELEASE → LIVE SPOT'
  },
  D180: {
    tabLabel: '180 Days',
    heading: '180 DAYS',
    banner: 'EMPIRICAL MARKET VERIFICATION // 180-DAY ROLLING WINDOW → LIVE SPOT'
  },
  Y1: {
    tabLabel: '1 Year',
    heading: '1 YEAR',
    banner: 'EMPIRICAL MARKET VERIFICATION // 1-YEAR ROLLING WINDOW → LIVE SPOT'
  },
  Y2: {
    tabLabel: '2 Years',
    heading: '2 YEARS',
    banner: 'EMPIRICAL MARKET VERIFICATION // 2-YEAR ROLLING WINDOW → LIVE SPOT'
  },
  Y4: {
    tabLabel: '4 Years',
    heading: '4 YEARS',
    banner: 'EMPIRICAL MARKET VERIFICATION // 4-YEAR CYCLE WINDOW → LIVE SPOT'
  }
};

export function ThermodynamicGainsModal({
  onClose,
  auditsMap,
  onSelectOrAuditTicker,
  onCopyReport,
  copiedTarget,
  initialCohortRecord,
  initialLiveSpots,
  onCohortSynced
}: ThermodynamicGainsModalProps) {
  const [persistedCohortRecord, setPersistedCohortRecord] = useState<GainsCohortRecord | null>(
    initialCohortRecord ?? null
  );
  const [hasLoadedBackend, setHasLoadedBackend] = useState(Boolean(initialCohortRecord));
  const [chartView, setChartView] = useState<GainsChartView>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const v = (sp.get('view') || sp.get('tab') || '').toLowerCase();
      if (v === 'btc' || v === 'bitcoin') return 'BTC_BENCHMARK';
      if (v === 'm2') return 'M2_BENCHMARK';
    }
    return 'COHORTS';
  });
  const [rawM2Dataset, setRawM2Dataset] = useState<M2BenchmarkDataset>(
    DEFAULT_M2_BENCHMARK_DATASET
  );
  const [horizon, setHorizon] = useState<GainsHorizon>('ALL_TIME');
  const [allocPerAsset, setAllocPerAsset] = useState(1000);
  const [useLogScale, setUseLogScale] = useState(true);
  const [feedMode, setFeedMode] = useState<GainsFeedMode>('LIVE');
  const [liveSpots, setLiveSpots] = useState<Record<string, number>>(() => ({
    ...(initialLiveSpots || {})
  }));

  useEffect(() => {
    if (!initialLiveSpots || Object.keys(initialLiveSpots).length === 0) return;
    setLiveSpots((prev) => ({ ...prev, ...initialLiveSpots }));
  }, [initialLiveSpots]);
  const [windowTrajectories, setWindowTrajectories] = useState<WindowTrajectoriesMap>({});
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [lastLiveSyncLabel, setLastLiveSyncLabel] = useState<string | null>(null);
  const [backendStatusMsg, setBackendStatusMsg] = useState<string | null>(null);
  const [hoverPointIdx, setHoverPointIdx] = useState<number | null>(null);
  const lastAutoSyncedSigRef = useRef<string | null>(null);
  const onCohortSyncedRef = useRef(onCohortSynced);
  onCohortSyncedRef.current = onCohortSynced;

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
  const cohortRecordRef = useRef(cohortRecord);
  cohortRecordRef.current = cohortRecord;
  const auditsMapRef = useRef(auditsMap);
  auditsMapRef.current = auditsMap;
  const isSyncingRef = useRef(false);

  // Hydrate saved spot prices from backend API + subscribe to Firestore snapshot
  useEffect(() => {
    let active = true;
    fetch('/api/gains-cohort')
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          payload: {
            record?: Partial<GainsCohortRecord>;
            liveSpotMap?: Record<string, number>;
            windowTrajectories?: WindowTrajectoriesMap;
          } | null
        ) => {
          if (!active) return;
          if (payload?.record) {
            const hydrated = sanitizeGainsCohortRecord(payload.record);
            setPersistedCohortRecord((prev) =>
              !prev || hydrated.updatedAtMs >= prev.updatedAtMs ? hydrated : prev
            );
            if (payload.liveSpotMap && Object.keys(payload.liveSpotMap).length > 0) {
              setLiveSpots((prev) => ({ ...prev, ...payload.liveSpotMap }));
            }
            if (payload.windowTrajectories) {
              setWindowTrajectories(payload.windowTrajectories);
            }
            onCohortSyncedRef.current?.(hydrated, payload.liveSpotMap || {});
          }
          setHasLoadedBackend(true);
        }
      )
      .catch(() => {
        if (active) setHasLoadedBackend(true);
      });

    fetch('/api/m2-benchmark')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { dataset?: M2BenchmarkDataset } | null) => {
        if (!active || !payload?.dataset?.seriesByHorizon) return;
        setRawM2Dataset(payload.dataset);
      })
      .catch(() => {});

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

  // Automatically keep backend & Firestore cohort storage synced with the live PASSED/FAILED baskets for verified signed-in users
  useEffect(() => {
    if (!hasLoadedBackend || !firebaseAuth?.currentUser?.emailVerified) return undefined;
    const syncedSig = getCohortSyncSignature(cohortRecord);
    const persistedSig = persistedCohortRecord ? getCohortSyncSignature(persistedCohortRecord) : '';
    if (syncedSig === persistedSig || lastAutoSyncedSigRef.current === syncedSig) {
      return undefined;
    }

    lastAutoSyncedSigRef.current = syncedSig;
    let active = true;
    void (async () => {
      try {
        const idToken = await getFirebaseIdToken();
        if (!active || !idToken) return;
        const res = await fetch('/api/gains-cohort', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`
          },
          body: JSON.stringify({
            passed: cohortRecord.passed,
            failed: cohortRecord.failed,
            sourceLabel: cohortRecord.sourceLabel,
            isCustomized: Boolean(persistedCohortRecord?.isCustomized)
          })
        });
        const payload = res.ok
          ? ((await res.json()) as { record?: Partial<GainsCohortRecord> } | null)
          : null;
        if (!active || !payload?.record) return;
        const saved = sanitizeGainsCohortRecord(payload.record);
        lastAutoSyncedSigRef.current = getCohortSyncSignature(
          buildBasketSyncedCohortRecord(auditsMap, saved)
        );
        setPersistedCohortRecord(saved);
        if (firebaseAuth?.currentUser?.emailVerified) {
          void persistGainsCohortToFirestore(saved).catch(() => {});
        }
      } catch {
        // Non-fatal
      }
    })();

    return () => {
      active = false;
    };
  }, [hasLoadedBackend, cohortRecord, persistedCohortRecord, auditsMap]);

  const syncLiveExchangeSpots = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncingLive(true);
    const clientSpots: Record<string, number> = {};
    const snapshotCohort = cohortRecordRef.current;
    const allItems = [...snapshotCohort.passed, ...snapshotCohort.failed];

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
            clientSpots[item.ticker] = amt;
          }
        })
      );

      // Refresh FRED M2 + Yahoo S&P500 / Gold / BTC / KAS benchmark alongside cohort spots
      void fetch('/api/m2-benchmark?refresh=1')
        .then((res) => (res.ok ? res.json() : null))
        .then((payload: { dataset?: M2BenchmarkDataset } | null) => {
          if (payload?.dataset?.seriesByHorizon) {
            setRawM2Dataset(payload.dataset);
          }
        })
        .catch(() => {});

      // Persist synced basket lists + backend CoinGecko & Yahoo Finance spots/release baselines
      const idToken = firebaseAuth?.currentUser?.emailVerified ? await getFirebaseIdToken() : null;
      const syncHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) {
        syncHeaders.Authorization = `Bearer ${idToken}`;
      }
      const syncRes = await fetch('/api/gains-cohort/sync', {
        method: 'POST',
        headers: syncHeaders,
        body: JSON.stringify({
          spotOverrides: clientSpots,
          extraItems: allItems.map((it) => ({
            ticker: it.ticker,
            name: it.name,
            grade: it.grade,
            auditScore: it.auditScore,
            coinbasePair: it.coinbasePair,
            geckoId: it.geckoId,
            yahooSymbol: it.yahooSymbol
          }))
        })
      });
      if (syncRes.ok) {
        const syncJson = (await syncRes.json()) as {
          record?: GainsCohortRecord;
          syncedTickers?: string[];
          liveSpotMap?: Record<string, number>;
          windowTrajectories?: WindowTrajectoriesMap;
          extraResolvedEntries?: Record<string, CohortAssetEntry>;
        };
        const mergedSpots = { ...clientSpots, ...(syncJson.liveSpotMap || {}) };
        if (syncJson.windowTrajectories) {
          setWindowTrajectories(syncJson.windowTrajectories);
        }
        if (Object.keys(mergedSpots).length > 0) {
          setLiveSpots((prev) => ({ ...prev, ...mergedSpots }));
          setLastLiveSyncLabel(
            new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          );
        }
        if (syncJson?.record) {
          const updatedRecord = mergeResolvedEntriesIntoCohortRecord(
            sanitizeGainsCohortRecord(syncJson.record),
            syncJson.extraResolvedEntries
          );
          lastAutoSyncedSigRef.current = getCohortSyncSignature(
            buildBasketSyncedCohortRecord(auditsMapRef.current, updatedRecord)
          );
          setPersistedCohortRecord(updatedRecord);
          onCohortSyncedRef.current?.(updatedRecord, mergedSpots);
          if (firebaseAuth?.currentUser?.emailVerified && (syncJson.syncedTickers?.length || 0) > 0) {
            void persistGainsCohortToFirestore(updatedRecord).catch(() => {});
          }
          if ((syncJson.syncedTickers?.length || 0) > 0) {
            setBackendStatusMsg(
              `Synced ${syncJson.syncedTickers!.length} live spots`
            );
          }
        }
      } else if (Object.keys(clientSpots).length > 0) {
        setLiveSpots((prev) => ({ ...prev, ...clientSpots }));
      }
    } catch {
      // Graceful fallback to verified snapshot prices on any network block
    } finally {
      isSyncingRef.current = false;
      setIsSyncingLive(false);
    }
  }, []);

  const initialSpotCountRef = useRef(Object.keys(initialLiveSpots || {}).length);

  useEffect(() => {
    if (feedMode !== 'LIVE') return undefined;
    if (initialSpotCountRef.current < 8) {
      void syncLiveExchangeSpots();
    } else if (!lastLiveSyncLabel) {
      setLastLiveSyncLabel(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    }
    const timer = setInterval(syncLiveExchangeSpots, 30000);
    return () => clearInterval(timer);
  }, [feedMode, syncLiveExchangeSpots, lastLiveSyncLabel]);

  const m2Dataset = useMemo(
    () =>
      feedMode === 'LIVE'
        ? applyLiveSpotsToM2Dataset(rawM2Dataset, liveSpots)
        : rawM2Dataset,
    [rawM2Dataset, feedMode, liveSpots]
  );

  const baselineMode: GainsBaselineMode =
    horizon === 'ALL_TIME' ? 'RELEASE' : horizon;

  const { passedEnriched, failedEnriched, passedLiquid, failedLiquid } = useMemo(() => {
    const enrichAsset = (item: CohortAssetEntry): EnrichedCohortAsset => {
      const liveAudit = auditsMap?.[item.ticker];
      const resolvedGrade = liveAudit?.grade || item.grade;
      const resolvedScore =
        liveAudit && Number.isFinite(Number(liveAudit.totalScore))
          ? Number(liveAudit.totalScore)
          : item.auditScore;

      const { price: activeBaselinePrice, label: activeBaselineLabel } =
        resolveCohortBaselinePrice(item, baselineMode);

      const liveVal = feedMode === 'LIVE' ? liveSpots[item.ticker] : undefined;
      const hasLive = feedMode === 'LIVE' && Number.isFinite(liveVal);
      const spotPrice = hasLive
        ? (liveVal as number)
        : item.snapshotSpot !== null && Number.isFinite(item.snapshotSpot)
        ? item.snapshotSpot
        : null;

      if (!activeBaselinePrice || !spotPrice) {
        return {
          ...item,
          grade: resolvedGrade,
          auditScore: resolvedScore,
          spotPrice,
          isLiveTick: hasLive,
          liquidCycle: false,
          cyclePct: null,
          multiple: null,
          activeBaselinePrice,
          activeBaselineLabel
        };
      }

      const cyclePct = ((spotPrice - activeBaselinePrice) / activeBaselinePrice) * 100;
      const multiple = spotPrice / activeBaselinePrice;

      return {
        ...item,
        grade: resolvedGrade,
        auditScore: resolvedScore,
        spotPrice,
        isLiveTick: hasLive,
        liquidCycle: true,
        cyclePct,
        multiple,
        activeBaselinePrice,
        activeBaselineLabel
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
  }, [cohortRecord.passed, cohortRecord.failed, auditsMap, feedMode, liveSpots, baselineMode]);

  const summary = useMemo(
    () => computeCohortAggregateSummary(passedLiquid, failedLiquid, allocPerAsset, false),
    [passedLiquid, failedLiquid, allocPerAsset]
  );
  const {
    passCycleAvg,
    passExOutlierAvg,
    passExOutlierTicker,
    failCycleAvg,
    failExOutlierAvg,
    failExOutlierTicker,
    passPositiveCount,
    failNegativeCount,
    passEndDollars,
    failEndDollars,
    portfolioVictoryMultiple
  } = summary;

  const passExLabel = passExOutlierTicker ? `Ex-Top ($${passExOutlierTicker})` : 'Ex-Top Gain';
  const failExLabel = failExOutlierTicker ? `Ex-Top ($${failExOutlierTicker})` : 'Ex-Top Gain';

  const { maxPassMultiple, minFailCyclePct, topPassAsset, worstFailAsset } = useMemo(() => {
    const topPass =
      passedLiquid.length > 0
        ? passedLiquid.reduce((best, cur) =>
            (cur.cyclePct ?? -Infinity) > (best.cyclePct ?? -Infinity) ? cur : best
          )
        : null;
    const worstFail =
      failedLiquid.length > 0
        ? failedLiquid.reduce((worst, cur) =>
            (cur.cyclePct ?? Infinity) < (worst.cyclePct ?? Infinity) ? cur : worst
          )
        : null;
    return {
      maxPassMultiple: passedLiquid.reduce((max, a) => Math.max(max, a.multiple ?? 0), 0),
      minFailCyclePct: failedLiquid.reduce((min, a) => Math.min(min, a.cyclePct ?? 0), 0),
      topPassAsset: topPass,
      worstFailAsset: worstFail
    };
  }, [passedLiquid, failedLiquid]);

  const passInvested = passedLiquid.length * allocPerAsset;
  const failInvested = failedLiquid.length * allocPerAsset;

  const rawSeries = useMemo(() => {
    const baseTraj =
      horizon === 'ALL_TIME'
        ? RELEASE_COHORT_TRAJECTORY
        : windowTrajectories[horizon] && windowTrajectories[horizon]!.length >= 2
        ? windowTrajectories[horizon]!
        : buildFallbackWindowTrajectory(horizon, summary);

    return baseTraj.map((pt, idx, arr) => {
      const isLast = idx === arr.length - 1;
      const livePassMult = isLast ? Math.max(0.05, 1 + passCycleAvg / 100) : pt.passAll;
      const livePassExMult = isLast ? Math.max(0.05, 1 + passExOutlierAvg / 100) : pt.passEx;
      const liveFailMult = isLast ? Math.max(0.05, 1 + failCycleAvg / 100) : pt.failAll;
      const liveFailExMult = isLast
        ? Math.max(0.05, 1 + failExOutlierAvg / 100)
        : pt.failEx;

      return {
        label: pt.label,
        event: pt.event,
        passPrimary: livePassMult,
        passSecondary: livePassExMult as number | null,
        failPrimary: liveFailMult,
        failSecondary: liveFailExMult as number | null
      };
    });
  }, [
    horizon,
    windowTrajectories,
    summary,
    passCycleAvg,
    passExOutlierAvg,
    failCycleAvg,
    failExOutlierAvg
  ]);

  const svgH = 248;
  const padL = horizon === 'ALL_TIME' ? 68 : 60;
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
  const minVal = Math.max(0.03, Math.min(...allMultValues) * 0.88);
  const maxVal = Math.max(...allMultValues) * 1.12;

  const effectiveLog = useLogScale;
  const mapY = (mult: number) => {
    const safeMult = Number.isFinite(mult) ? mult : 1.0;
    const clamped = Math.max(0.03, safeMult);
    if (effectiveLog) {
      const logMin = Math.log10(Math.max(0.03, minVal));
      const logMax = Math.log10(Math.max(0.1, maxVal));
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
    if (!item.liquidCycle) return -9999999;
    return item.cyclePct ?? -9999999;
  };

  const sortedPassed = [...passedEnriched].sort(
    (a, b) => getMetricForAsset(b) - getMetricForAsset(a)
  );
  const sortedFailed = [...failedEnriched].sort(
    (a, b) => getMetricForAsset(b) - getMetricForAsset(a)
  );

  const buildShareableGainsReport = () => {
    if (chartView === 'BTC_BENCHMARK') {
      const pts = m2Dataset.seriesByHorizon[horizon] || m2Dataset.seriesByHorizon.ALL_TIME;
      const btcSum = computeBtcHorizonSummary({
        points: pts,
        horizon,
        cohortRecord,
        liveSpots,
        feedMode
      });
      const horizonTitle =
        horizon === 'ALL_TIME' ? "MAY '22 COMMON LAUNCH" : HORIZON_META[horizon].heading;
      const assetLines = btcSum.assets
        .map(
          (a) =>
            `• ${a.name} (${a.ticker}): Nominal ${formatPctSigned(a.nominalPct)} (${a.nominalMult.toFixed(2)}x) | vs BTC: ${formatPctSigned(a.btcAdjustedPct)} (₿ ${a.btcAdjustedMult.toFixed(2)}x)`
        )
        .join('\n');
      const beatCount = btcSum.cohortMatrix.filter((r) => r.beatsBtc).length;
      return `THE TRUTH — PERFORMANCE & PURCHASING POWER VS BITCOIN ($BTC) (${horizonTitle})

BITCOIN ($BTC) BENCHMARK: ${formatUsdPrice(btcSum.btcStartPrice)} → ${formatUsdPrice(btcSum.btcEndPrice)} (${formatPctSigned(btcSum.btcPct)} • ${btcSum.btcMult.toFixed(2)}x)

${assetLines}

BASKET BREADTH VS BTC: ${beatCount} of ${btcSum.cohortMatrix.length} liquid audited assets outperformed $BTC over this window.`;
    }

    if (chartView === 'M2_BENCHMARK') {
      const pts = m2Dataset.seriesByHorizon[horizon] || m2Dataset.seriesByHorizon.ALL_TIME;
      const m2Sum = computeM2AssetSummaries(pts);
      const horizonTitle =
        horizon === 'ALL_TIME' ? "MAY '22 COMMON LAUNCH" : HORIZON_META[horizon].heading;
      const assetLines = m2Sum.assets
        .map(
          (a) =>
            `• ${a.name} (${a.ticker}): Nominal ${formatPctSigned(a.nominalPct)} (${a.nominalMult.toFixed(2)}x) | Real vs M2: ${formatPctSigned(a.m2AdjustedPct)} (${a.m2AdjustedMult.toFixed(2)}x)`
        )
        .join('\n');
      return `THE TRUTH — MACRO PURCHASING POWER VS US M2 (${horizonTitle})

US M2 MONEY SUPPLY (FRED M2SL): $${m2Sum.m2StartTrillions.toFixed(2)}T → $${m2Sum.m2EndTrillions.toFixed(2)}T (${formatPctSigned(m2Sum.m2Pct)})

${assetLines}

BENCHMARK: Assets above ${formatPctSigned(m2Sum.m2Pct)} expanded real purchasing power faster than US M2 monetary debasement.`;
    }

    const topPassAnchors = [...passedLiquid]
      .sort((a, b) => (b.cyclePct ?? -Infinity) - (a.cyclePct ?? -Infinity))
      .slice(0, 6)
      .map((a) => `$${a.ticker} (${formatPctSigned(a.cyclePct)})`)
      .join(', ');
    const bleedAssets = [...failedLiquid]
      .filter((a) => (a.cyclePct || 0) < 0)
      .sort((a, b) => (a.cyclePct ?? Infinity) - (b.cyclePct ?? Infinity))
      .slice(0, 6)
      .map((a) => `$${a.ticker} ${formatPctSigned(a.cyclePct)}`)
      .join(', ');

    const horizonHeading = HORIZON_META[horizon].heading;

    return `THE TRUTH — THERMODYNAMIC GAINS AUDIT (${horizonHeading} • ${cohortRecord.updatedAtLabel.toUpperCase()})

PASSED // E > 0 (${cohortRecord.passed.length} Harmonic — PoW & Physical Commodities):
• ${HORIZON_META[horizon].tabLabel} Equal-Weight Avg: ${formatPctSigned(passCycleAvg)} (${formatPctSigned(passExOutlierAvg)} ${passExLabel})
• $${allocPerAsset.toLocaleString()}/Asset Basket (${passedLiquid.length} Active): $${passInvested.toLocaleString()} → ~${formatBasketUsd(passEndDollars)}
• Breadth: ${passPositiveCount} of ${passedLiquid.length} Active Assets Positive
• Top Performers: ${topPassAnchors}

FAILED // E = 0 (${cohortRecord.failed.length} Flatlined — PoS & Premined):
• ${HORIZON_META[horizon].tabLabel} Equal-Weight Avg: ${formatPctSigned(failCycleAvg)} (${formatPctSigned(failExOutlierAvg)} ${failExLabel})
• $${allocPerAsset.toLocaleString()}/Asset Basket (${failedLiquid.length} Active): $${failInvested.toLocaleString()} → ~${formatBasketUsd(failEndDollars)}
• Drawdown Breadth: ${failNegativeCount} of ${failedLiquid.length} Negative${bleedAssets ? ` (${bleedAssets})` : ''}

VERDICT: ${portfolioVictoryMultiple}x Total Portfolio Victory for Unforgeable Physical Costliness (E > 0).`;
  };

  const yGridTicks = buildNiceYGridTicks(minVal, maxVal, effectiveLog);

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
                  <span>
                    {chartView === 'BTC_BENCHMARK'
                      ? 'HARD MONEY BENCHMARK // ASSETS & COHORTS PRICED VS. BITCOIN ($BTC)'
                      : chartView === 'M2_BENCHMARK'
                      ? 'MACRO DEBASEMENT BENCHMARK // ASSETS VS. FRED US M2 MONEY SUPPLY'
                      : HORIZON_META[horizon].banner}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[9px] text-neutral-300 normal-case tracking-normal">
                  <Database className="w-2.5 h-2.5 text-[#49EACB] shrink-0" />
                  <span>
                    {chartView === 'M2_BENCHMARK' || chartView === 'BTC_BENCHMARK'
                      ? m2Dataset.sourceLabel
                      : backendStatusMsg || cohortRecord.sourceLabel}
                  </span>
                </span>
              </div>
              <h2 className="font-display text-base sm:text-xl font-bold text-white mt-0.5 leading-snug">
                {chartView === 'BTC_BENCHMARK'
                  ? 'Hard Money Benchmark: KAS, ETH, Gold, S&P 500 & Baskets vs. Bitcoin'
                  : chartView === 'M2_BENCHMARK'
                  ? 'Macro Purchasing Power: BTC, KAS, S&P 500 & Gold vs. US M2'
                  : 'Thermodynamic Gains Divergence: Passed (E > 0) vs. Failed (E = 0)'}
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

          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="p-0.5 rounded-full bg-[#121418] border border-white/10 flex items-center font-mono text-[10px] sm:text-[10.5px] shrink-0">
                <button
                  type="button"
                  onClick={() => setChartView('COHORTS')}
                  className={`px-2 sm:px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 whitespace-nowrap ${
                    chartView === 'COHORTS'
                      ? 'bg-[#1D212A] text-white border-white/15'
                      : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                  }`}
                >
                  Cohort Equity
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('BTC_BENCHMARK')}
                  className={`px-2 sm:px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 whitespace-nowrap ${
                    chartView === 'BTC_BENCHMARK'
                      ? 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/40'
                      : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                  }`}
                >
                  Assets vs. BTC
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('M2_BENCHMARK')}
                  className={`px-2 sm:px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 whitespace-nowrap ${
                    chartView === 'M2_BENCHMARK'
                      ? 'bg-[#49EACB]/15 text-[#49EACB] border-[#49EACB]/40'
                      : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                  }`}
                >
                  Assets vs. M2
                </button>
              </div>

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
                  <span className="hidden sm:inline">Saved Snapshot</span>
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
                      feedMode === 'LIVE'
                        ? 'bg-[#49EACB] shadow-[0_0_8px_#49EACB]'
                        : 'bg-neutral-500'
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
                  { id: 'ALL_TIME', label: 'All Time' },
                  { id: 'D180', label: '180 Days' },
                  { id: 'Y1', label: '1 Year' },
                  { id: 'Y2', label: '2 Years' },
                  { id: 'Y4', label: '4 Years' }
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
                      setUseLogScale(tab.id === 'ALL_TIME');
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

          {chartView === 'BTC_BENCHMARK' ? (
            <BtcBenchmarkPanel
              horizon={horizon}
              useLogScale={useLogScale}
              onChangeLogScale={setUseLogScale}
              dataset={m2Dataset}
              cohortRecord={cohortRecord}
              liveSpots={liveSpots}
              feedMode={feedMode}
              allocPerAsset={allocPerAsset}
              onSelectOrAuditTicker={onSelectOrAuditTicker}
            />
          ) : chartView === 'M2_BENCHMARK' ? (
            <M2BenchmarkPanel
              horizon={horizon}
              useLogScale={useLogScale}
              onChangeLogScale={setUseLogScale}
              dataset={m2Dataset}
              allocPerAsset={allocPerAsset}
              onSelectOrAuditTicker={onSelectOrAuditTicker}
            />
          ) : (
            <>
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
                {formatPctSigned(passCycleAvg)}
              </div>
              <div className="font-mono text-[11px] text-neutral-300">
                {formatPctSigned(passExOutlierAvg)} {passExLabel} • {passPositiveCount}/{passedLiquid.length} Positive
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
                {formatPctSigned(failCycleAvg)}
              </div>
              <div className="font-mono text-[11px] text-neutral-400">
                {formatPctSigned(failExOutlierAvg)} {failExLabel} • {failNegativeCount}/{failedLiquid.length} Negative
              </div>
            </div>

            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1 min-w-0 overflow-hidden">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 leading-tight">
                ${allocPerAsset.toLocaleString()}/ASSET BASKET OUTCOME
              </div>
              <div
                title={`~$${passEndDollars.toLocaleString()} vs ~$${failEndDollars.toLocaleString()}`}
                className="font-display text-lg sm:text-xl xl:text-2xl font-bold text-white flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 leading-tight"
              >
                <span className="text-[#49EACB] whitespace-nowrap">
                  ~{formatBasketUsd(passEndDollars)}
                </span>
                <span className="text-xs font-mono text-neutral-500">vs</span>
                <span className="text-[#F97316] whitespace-nowrap">
                  ~{formatBasketUsd(failEndDollars)}
                </span>
              </div>
              <div className="font-mono text-[11px] text-[#34D399] font-semibold">
                {passedLiquid.length === failedLiquid.length
                  ? `${portfolioVictoryMultiple}x Total Portfolio Victory for E > 0`
                  : `${portfolioVictoryMultiple}x Equal-Cap Victory (${formatBasketUsd(passInvested)} vs ${formatBasketUsd(failInvested)} basis)`}
              </div>
            </div>

            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1 min-w-0 overflow-hidden">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 leading-tight">
                RIGHT-TAIL LEAD VS. WORST FLOOR
              </div>
              <div className="font-display text-lg sm:text-xl xl:text-2xl font-bold text-white flex flex-wrap items-baseline gap-x-2 gap-y-0.5 leading-tight">
                <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
                  <span className="text-[#49EACB]">
                    {maxPassMultiple >= 1_000_000
                      ? `${(maxPassMultiple / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}Mx`
                      : maxPassMultiple >= 1_000
                      ? `${(maxPassMultiple / 1_000).toFixed(1).replace(/\.0$/, '')}Kx`
                      : maxPassMultiple > 0
                      ? `${maxPassMultiple.toFixed(1)}x`
                      : '—'}
                  </span>
                  <span className="font-mono text-xs text-neutral-500">
                    {topPassAsset ? `$${topPassAsset.ticker}` : 'Top E>0'}
                  </span>
                </span>
                <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
                  <span className="text-[#EF4444]">
                    {formatPctSigned(minFailCyclePct)}
                  </span>
                  <span className="font-mono text-xs text-neutral-500">
                    {worstFailAsset ? `$${worstFailAsset.ticker}` : 'Low E=0'}
                  </span>
                </span>
              </div>
              <div className="font-mono text-[11px] text-neutral-400 leading-snug">
                {HORIZON_META[horizon].tabLabel} top gainers trimmed from both lists above
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#07080A] border border-white/[0.08] p-4 sm:p-5 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 min-h-[28px]">
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 min-w-0 truncate">
                  {horizon === 'ALL_TIME'
                    ? 'ALL-TIME EQUITY CURVE (SINCE RELEASE → LIVE) // SCRUB TIMELINE'
                    : `${HORIZON_META[horizon].heading} EQUITY CURVE // SCRUB TIMELINE TO INSPECT`}
                </div>

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
                    Linear Scale
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tabular-nums min-h-[20px]">
                <span className="text-white font-bold">
                  [{activePoint.label} — {activePoint.event}]
                </span>
                <span className="text-[#49EACB] font-bold">
                  E &gt; 0: {formatPctSigned((activePoint.passPrimary - 1) * 100)} (
                  {activePoint.passPrimary >= 1000
                    ? `${(activePoint.passPrimary / 1000).toFixed(1)}Kx`
                    : `${activePoint.passPrimary.toFixed(2)}x`}
                  )
                </span>
                {activePoint.passSecondary !== null && (
                  <span className="text-[#34D399]">
                    {passExLabel}: {formatPctSigned((activePoint.passSecondary - 1) * 100)}
                  </span>
                )}
                <span className="text-[#EF4444] font-bold">
                  E = 0: {formatPctSigned((activePoint.failPrimary - 1) * 100)} (
                  {activePoint.failPrimary.toFixed(2)}x)
                </span>
                {activePoint.failSecondary !== null && (
                  <span className="text-[#F97316]">
                    {failExLabel}: {formatPctSigned((activePoint.failSecondary - 1) * 100)}
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
                        {tickVal >= 1_000_000
                          ? `${(tickVal / 1_000_000).toFixed(0)}Mx`
                          : tickVal >= 1_000
                          ? `${(tickVal / 1_000).toFixed(0)}Kx`
                          : tickVal >= 2
                          ? `${Number(tickVal.toFixed(1)).toString().replace(/\.0$/, '')}x`
                          : formatPctSigned((tickVal - 1) * 100)}
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
                  <span>PASSED E &gt; 0 Equal-Weight</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#34D399]">
                  <span className="w-3 border-t border-dashed border-[#34D399] inline-block" />
                  <span>
                    PASSED {passExLabel} ({formatPctSigned(passExOutlierAvg)})
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#EF4444]">
                  <span className="w-3 h-0.5 bg-[#EF4444] inline-block" />
                  <span>FAILED E = 0 Equal-Weight</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#F97316]">
                  <span className="w-3 border-t border-dashed border-[#F97316] inline-block" />
                  <span>
                    FAILED {failExLabel} ({formatPctSigned(failExOutlierAvg)})
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
                  const pct = item.cyclePct;
                  const maxWindowPct = Math.max(
                    120,
                    ...passedLiquid.map((a) => Math.abs(a.cyclePct || 0)),
                    ...failedLiquid.map((a) => Math.abs(a.cyclePct || 0))
                  );
                  const barPct =
                    pct === null
                      ? 0
                      : horizon === 'ALL_TIME'
                      ? pct >= 0
                        ? Math.min(100, (Math.log10(1 + pct / 10) / Math.log10(15_000_000)) * 100)
                        : Math.min(100, (Math.abs(pct) / 100) * 65)
                      : maxWindowPct > 400 && pct >= 0
                      ? Math.min(
                          100,
                          (Math.log10(1 + pct / 10) / Math.log10(1 + maxWindowPct / 10)) * 100
                        )
                      : pct >= 0
                      ? Math.min(100, (pct / maxWindowPct) * 100)
                      : Math.min(100, (Math.abs(pct) / 100) * 85);
                  const isPositive = pct === null || pct >= 0;

                  return (
                    <button
                      key={item.ticker}
                      type="button"
                      onClick={() => onSelectOrAuditTicker(item.ticker)}
                      className="w-full text-left rounded-xl bg-[#121418] hover:bg-[#171B22] border border-white/[0.06] hover:border-[#49EACB]/40 p-2.5 transition space-y-1.5"
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
                          {item.spotPrice !== null && item.activeBaselinePrice !== null ? (
                            <span className="text-[10.5px] text-neutral-400">
                              {item.activeBaselineLabel} →{' '}
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
                              {item.activeBaselineLabel}
                            </span>
                          )}
                          <span
                            className="font-bold min-w-[68px] text-right"
                            style={{
                              color:
                                pct === null
                                  ? '#9CA3AF'
                                  : isPositive
                                  ? '#49EACB'
                                  : '#F97316'
                            }}
                          >
                            {pct !== null
                              ? formatPctSigned(pct)
                              : item.ticker === 'LN' || item.ticker === 'IGRA'
                              ? 'Carrier'
                              : item.spotPrice !== null && horizon !== 'ALL_TIME'
                              ? 'Pre-Launch'
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
                        {item.multiple !== null && (
                          <span className="shrink-0 text-neutral-300">
                            {item.multiple >= 1000
                              ? `${Math.round(item.multiple).toLocaleString()}x`
                              : item.multiple >= 10
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
                  const pct = item.cyclePct;
                  const maxWindowPct = Math.max(
                    120,
                    ...passedLiquid.map((a) => Math.abs(a.cyclePct || 0)),
                    ...failedLiquid.map((a) => Math.abs(a.cyclePct || 0))
                  );
                  const barPct =
                    pct === null
                      ? 0
                      : horizon === 'ALL_TIME'
                      ? pct >= 0
                        ? Math.min(100, (Math.log10(1 + pct / 10) / Math.log10(15_000_000)) * 100)
                        : Math.min(100, (Math.abs(pct) / 100) * 85)
                      : maxWindowPct > 400 && pct >= 0
                      ? Math.min(
                          100,
                          (Math.log10(1 + pct / 10) / Math.log10(1 + maxWindowPct / 10)) * 100
                        )
                      : pct >= 0
                      ? Math.min(100, (pct / maxWindowPct) * 100)
                      : Math.min(100, (Math.abs(pct) / 100) * 85);
                  const isPositive = pct === null || pct >= 0;

                  return (
                    <button
                      key={item.ticker}
                      type="button"
                      onClick={() => onSelectOrAuditTicker(item.ticker)}
                      className="w-full text-left rounded-xl bg-[#121418] hover:bg-[#191416] border border-white/[0.06] hover:border-[#EF4444]/40 p-2.5 transition space-y-1.5"
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
                          {item.spotPrice !== null && item.activeBaselinePrice !== null ? (
                            <span className="text-[10.5px] text-neutral-400">
                              {item.activeBaselineLabel} →{' '}
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
                              {item.activeBaselineLabel}
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
                              : item.spotPrice !== null && horizon !== 'ALL_TIME'
                              ? 'Pre-Launch'
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
                        {item.multiple !== null && (
                          <span className="shrink-0 text-neutral-400">
                            {item.multiple >= 1000
                              ? `${Math.round(item.multiple).toLocaleString()}x`
                              : item.multiple >= 10
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1.5">
              <div className="font-mono text-[10.5px] font-bold text-[#49EACB]">
                01 // ASYMMETRIC RIGHT-TAIL COMPOUNDING
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {horizon === 'ALL_TIME'
                  ? `Measured from initial public release open to live spot, unforgeable Proof-of-Work leaders like $BTC ($0.05) and $KAS ($0.0001859) turn $${allocPerAsset.toLocaleString()}/asset into ~${formatBasketUsd(passEndDollars)} vs ~${formatBasketUsd(failEndDollars)} on E = 0 (${portfolioVictoryMultiple}x portfolio victory).`
                  : `Over the ${HORIZON_META[horizon].tabLabel.toLowerCase()} horizon, the E > 0 basket turns $${passInvested.toLocaleString()} into ~${formatBasketUsd(passEndDollars)} vs ~${formatBasketUsd(failEndDollars)} on E = 0 (${portfolioVictoryMultiple}x portfolio spread), led by $${topPassAsset?.ticker || 'BTC'} (${formatPctSigned(topPassAsset?.cyclePct ?? 0)}).`}
              </p>
            </div>

            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1.5">
              <div className="font-mono text-[10.5px] font-bold text-[#EF4444]">
                02 // ELIMINATING THE &ldquo;VC BLEED-TO-ZERO&rdquo; LEFT TAIL
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {failNegativeCount} of {failedLiquid.length} active E = 0 tokens remain underwater
                in the {HORIZON_META[horizon].tabLabel.toLowerCase()} window
                {worstFailAsset
                  ? `, led on the downside by $${worstFailAsset.ticker} (${formatPctSigned(worstFailAsset.cyclePct)}) as zero-joule supply dilution weighs on price discovery.`
                  : ' as zero-joule insider unlocks weigh on price discovery.'}
              </p>
            </div>

            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1.5">
              <div className="font-mono text-[10.5px] font-bold text-[#34D399]">
                03 // SYMMETRIC EX-OUTLIER STRESS TEST
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                To keep comparisons symmetric, removing the top percentage gainer from both lists (
                {passExLabel} on E &gt; 0 and {failExLabel} on E = 0) leaves E &gt; 0 at{' '}
                {formatPctSigned(passExOutlierAvg)} versus {formatPctSigned(failExOutlierAvg)} for E
                = 0.
              </p>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
