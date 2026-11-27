import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  Check,
  Clock,
  Copy,
  Database,
  DollarSign,
  RefreshCw,
  X
} from 'lucide-react';
import {
  FAILED_COHORT_GAINS,
  PASSED_COHORT_GAINS,
  RELEASE_COHORT_TRAJECTORY,
  applySpotPricesToCohortRecord,
  buildBasketSyncedCohortRecord,
  buildFallbackWindowTrajectory,
  buildHistoricalTimelineCohortTrajectory,
  buildNiceYGridTicks,
  computeCohortAggregateSummary,
  formatBasketUsd,
  formatPctSigned,
  formatUsdPrice,
  getCohortSyncSignature,
  mergeResolvedEntriesIntoCohortRecord,
  preserveCustomCohortEntries,
  resolveCohortBaselinePrice,
  resolveTimelineBaselineMode,
  sanitizeGainsCohortRecord,
  type CohortAssetEntry,
  type GainsBaselineMode,
  type GainsCohortRecord,
  type GainsHistoricalStopKey,
  type WindowTrajectoriesMap
} from '../data/gainsCohortData.ts';
import {
  DEFAULT_M2_BENCHMARK_DATASET,
  applyLiveSpotsToM2Dataset,
  computeM2AssetSummaries,
  formatM2SupplyLabel,
  resolveBenchmarkSeriesForTimeline,
  type M2BenchmarkDataset
} from '../data/m2BenchmarkData.ts';
import { computeBtcHorizonSummary } from '../data/btcBenchmarkData.ts';
import {
  resolveInitialGainsChartView,
  resolveInitialGainsFeedMode,
  resolveManualLiveSyncTarget,
  resolveTabLazyFetchPlan,
  type GainsChartView,
  type GainsFeedMode,
  type GainsHorizon
} from '../data/gainsFeedController.ts';
import { GlobalTimeMachineSlider } from './GlobalTimeMachineSlider.tsx';
import {
  getGlobalTimelineStop,
  type GlobalTimelineYear
} from '../data/globalTimeMachine.ts';
import { formatScore, getGradeAccent, type AuditData } from '../data/rubricSpec.ts';
import {
  firebaseAuth,
  getFirebaseIdToken,
  persistGainsCohortToFirestore,
  subscribeGainsCohortFromFirestore
} from '../lib/firebase.ts';

export type { GainsHorizon, GainsFeedMode, GainsChartView };

const loadBtcBenchmarkPanel = () =>
  import('./BtcBenchmarkPanel.tsx').then((m) => ({ default: m.BtcBenchmarkPanel }));
const loadM2BenchmarkPanel = () =>
  import('./M2BenchmarkPanel.tsx').then((m) => ({ default: m.M2BenchmarkPanel }));

const LazyBtcBenchmarkPanel = lazy(loadBtcBenchmarkPanel);
const LazyM2BenchmarkPanel = lazy(loadM2BenchmarkPanel);

const PRELOADED_COHORT_TICKERS = new Set<string>([
  ...PASSED_COHORT_GAINS.map((i) => i.ticker),
  ...FAILED_COHORT_GAINS.map((i) => i.ticker)
]);

export interface ThermodynamicGainsModalProps {
  onClose: () => void;
  auditsMap: Record<string, AuditData>;
  fullAuditsMap?: Record<string, AuditData>;
  timelineYear?: GlobalTimelineYear;
  onChangeTimelineYear?: (next: GlobalTimelineYear) => void;
  onInteractTimeMachine?: () => void;
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

function extractSpotsFromM2Dataset(ds?: M2BenchmarkDataset | null): Record<string, number> {
  const out: Record<string, number> = {};
  if (!ds) return out;
  const s = ds.spots;
  if (s) {
    if (Number.isFinite(s.btc) && s.btc > 0) out.BTC = s.btc;
    if (Number.isFinite(s.kas) && s.kas > 0) out.KAS = s.kas;
    if (Number.isFinite(s.eth) && s.eth > 0) out.ETH = s.eth;
    if (Number.isFinite(s.gold) && s.gold > 0) out.XAU = s.gold;
    if (Number.isFinite(s.spx) && s.spx > 0) out.SPX = s.spx;
  }
  return out;
}

function stampCohortSnapshotWithSpots(
  audits: Record<string, AuditData>,
  baseRecord: GainsCohortRecord | null,
  spots: Record<string, number>,
  sourceLabel?: string
): GainsCohortRecord | null {
  if (!spots || Object.keys(spots).length === 0) return baseRecord;
  const syncedBasket = buildBasketSyncedCohortRecord(audits, baseRecord);
  const applied = applySpotPricesToCohortRecord(
    syncedBasket,
    spots,
    sourceLabel || baseRecord?.sourceLabel || 'Synced Live Snapshot'
  );
  const preserved = preserveCustomCohortEntries(applied.nextRecord, baseRecord);
  return {
    ...preserved,
    isCustomized: Boolean(baseRecord?.isCustomized)
  };
}

interface CohortChartSeriesPoint {
  label: string;
  event: string;
  passPrimary: number;
  passSecondary: number | null;
  failPrimary: number;
  failSecondary: number | null;
}

interface CohortEquityChartCardProps {
  rawSeries: CohortChartSeriesPoint[];
  horizon: GainsHorizon;
  activeTimelineYear: GlobalTimelineYear;
  isHistoricalStop: boolean;
  useLogScale: boolean;
  onChangeLogScale: (next: boolean) => void;
  passExLabel: string;
  passExOutlierAvg: number;
  failExLabel: string;
  failExOutlierAvg: number;
}

const CohortEquityChartCard = memo(function CohortEquityChartCard({
  rawSeries,
  horizon,
  activeTimelineYear,
  isHistoricalStop,
  useLogScale,
  onChangeLogScale,
  passExLabel,
  passExOutlierAvg,
  failExLabel,
  failExOutlierAvg
}: CohortEquityChartCardProps) {
  const [hoverPointIdx, setHoverPointIdx] = useState<number | null>(null);
  const chartBoxRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(860);

  useEffect(() => {
    setHoverPointIdx(null);
  }, [horizon, activeTimelineYear]);

  useEffect(() => {
    const el = chartBoxRef.current;
    if (!el) return undefined;
    let rafId: number | null = null;
    const commitMeasure = () => {
      rafId = null;
      const w = el.clientWidth;
      if (w > 240) {
        setChartWidth((prev) => (prev === w ? prev : w));
      }
    };
    const scheduleMeasure = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(commitMeasure);
    };
    commitMeasure();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(scheduleMeasure);
      ro.observe(el);
      return () => {
        if (rafId !== null) window.cancelAnimationFrame(rafId);
        ro.disconnect();
      };
    }
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, []);

  const svgH = 248;
  const padL = horizon === 'ALL_TIME' ? 68 : 60;
  const padR = 22;
  const padT = 20;
  const padB = 34;
  const plotW = Math.max(180, chartWidth - padL - padR);
  const plotH = svgH - padT - padB;

  const { minVal, maxVal } = useMemo(() => {
    const allMultValues = rawSeries.flatMap((d) =>
      [d.passPrimary, d.passSecondary, d.failPrimary, d.failSecondary, 1.0].filter(
        (v): v is number => v !== null && Number.isFinite(v)
      )
    );
    return {
      minVal: Math.max(0.03, Math.min(...allMultValues) * 0.88),
      maxVal: Math.max(...allMultValues) * 1.12
    };
  }, [rawSeries]);

  const effectiveLog = useLogScale;
  const mapY = useCallback(
    (mult: number) => {
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
    },
    [effectiveLog, minVal, maxVal, padT, plotH]
  );

  const mapX = useCallback(
    (idx: number) => padL + (idx / Math.max(1, rawSeries.length - 1)) * plotW,
    [padL, plotW, rawSeries.length]
  );

  const polylines = useMemo(() => {
    const build = (key: 'passPrimary' | 'passSecondary' | 'failPrimary' | 'failSecondary') => {
      const pts = rawSeries
        .map((d, i) => {
          const val = d[key];
          return val !== null ? `${mapX(i).toFixed(1)},${mapY(val).toFixed(1)}` : null;
        })
        .filter((p): p is string => Boolean(p));
      return pts.length > 1 ? `M ${pts.join(' L ')}` : '';
    };
    const passPrimary = build('passPrimary');
    const passAreaPath = passPrimary
      ? `${passPrimary} L ${mapX(rawSeries.length - 1).toFixed(1)},${(padT + plotH).toFixed(
          1
        )} L ${mapX(0).toFixed(1)},${(padT + plotH).toFixed(1)} Z`
      : '';
    return {
      passPrimary,
      passSecondary: build('passSecondary'),
      failPrimary: build('failPrimary'),
      failSecondary: build('failSecondary'),
      passAreaPath
    };
  }, [rawSeries, mapX, mapY, padT, plotH]);

  const yGridTicks = useMemo(
    () => buildNiceYGridTicks(minVal, maxVal, effectiveLog),
    [minVal, maxVal, effectiveLog]
  );

  const activePointIdx =
    hoverPointIdx !== null && hoverPointIdx >= 0 && hoverPointIdx < rawSeries.length
      ? hoverPointIdx
      : rawSeries.length - 1;
  const activePoint = rawSeries[activePointIdx] || rawSeries[rawSeries.length - 1];

  return (
    <div className="rounded-2xl bg-[#07080A] border border-white/[0.08] p-4 sm:p-5 space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3 min-h-[28px]">
          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 min-w-0 truncate">
            {isHistoricalStop
              ? `${activeTimelineYear} EPOCH EQUITY CURVE (${activeTimelineYear} OPEN → LIVE) // SCRUB TIMELINE`
              : horizon === 'ALL_TIME'
              ? 'ALL-TIME EQUITY CURVE (SINCE RELEASE → LIVE) // SCRUB TIMELINE'
              : `${HORIZON_META[horizon].heading} EQUITY CURVE // SCRUB TIMELINE TO INSPECT`}
          </div>

          <div className="p-0.5 rounded-full bg-[#121418] border border-white/10 flex items-center font-mono text-[10px] shrink-0">
            <button
              type="button"
              onClick={() => onChangeLogScale(true)}
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
              onClick={() => onChangeLogScale(false)}
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
                    isBreakeven ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.05)'
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

          {polylines.passAreaPath && (
            <path d={polylines.passAreaPath} fill="url(#gainsPassArea)" />
          )}

          {polylines.failSecondary && (
            <path
              d={polylines.failSecondary}
              fill="none"
              stroke="#F97316"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeOpacity="0.78"
            />
          )}
          {polylines.passSecondary && (
            <path
              d={polylines.passSecondary}
              fill="none"
              stroke="#34D399"
              strokeWidth="1.7"
              strokeDasharray="5 4"
              strokeOpacity="0.88"
            />
          )}

          {polylines.failPrimary && (
            <path
              d={polylines.failPrimary}
              fill="none"
              stroke="url(#gainsFailStroke)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          )}

          {polylines.passPrimary && (
            <path
              d={polylines.passPrimary}
              fill="none"
              stroke="url(#gainsPassStroke)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}

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
                  onMouseEnter={() =>
                    setHoverPointIdx((prev) => (prev === idx ? prev : idx))
                  }
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
  );
});

interface CohortAssetListsGridProps {
  passedEnriched: EnrichedCohortAsset[];
  failedEnriched: EnrichedCohortAsset[];
  passedLiquid: EnrichedCohortAsset[];
  failedLiquid: EnrichedCohortAsset[];
  passedTotalCount: number;
  failedTotalCount: number;
  horizon: GainsHorizon;
  onSelectAsset: (ticker: string) => void;
}

const CohortAssetListsGrid = memo(function CohortAssetListsGrid({
  passedEnriched,
  failedEnriched,
  passedLiquid,
  failedLiquid,
  passedTotalCount,
  failedTotalCount,
  horizon,
  onSelectAsset
}: CohortAssetListsGridProps) {
  const { sortedPassed, sortedFailed, maxWindowPct } = useMemo(() => {
    const metric = (item: EnrichedCohortAsset) =>
      item.liquidCycle ? (item.cyclePct ?? -9999999) : -9999999;
    let maxAbs = 120;
    for (const a of passedLiquid) {
      const abs = Math.abs(a.cyclePct || 0);
      if (abs > maxAbs) maxAbs = abs;
    }
    for (const a of failedLiquid) {
      const abs = Math.abs(a.cyclePct || 0);
      if (abs > maxAbs) maxAbs = abs;
    }
    return {
      sortedPassed: [...passedEnriched].sort((a, b) => metric(b) - metric(a)),
      sortedFailed: [...failedEnriched].sort((a, b) => metric(b) - metric(a)),
      maxWindowPct: maxAbs
    };
  }, [passedEnriched, failedEnriched, passedLiquid, failedLiquid]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl bg-[#0B0C0E] border border-[#49EACB]/25 p-4 space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.07]">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#49EACB]">
            <span className="w-2 h-2 rounded-full bg-[#49EACB] shadow-[0_0_8px_#49EACB]" />
            <span>PASSED // E &gt; 0 ({passedTotalCount} Harmonic)</span>
          </div>
          <span className="font-mono text-[10.5px] text-neutral-400">
            PoW &amp; Physical Commodities
          </span>
        </div>

        <div className="space-y-2">
          {sortedPassed.map((item) => {
            const pct = item.cyclePct;
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
                onClick={() => onSelectAsset(item.ticker)}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 76px' }}
                className="w-full text-left rounded-xl bg-[#121418] hover:bg-[#171B22] border border-white/[0.06] hover:border-[#49EACB]/40 p-2.5 transition-colors duration-150 space-y-1.5"
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
                        : item.ticker === 'LN' || item.ticker === 'IGRA' || item.ticker === 'ZKAS'
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
                      className="h-full rounded-full transition-[width] duration-300"
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
            <span>FAILED // E = 0 ({failedTotalCount} Flatlined)</span>
          </div>
          <span className="font-mono text-[10.5px] text-neutral-400">
            PoS &amp; Premined Ledgers (All Grade F)
          </span>
        </div>

        <div className="space-y-2">
          {sortedFailed.map((item) => {
            const pct = item.cyclePct;
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
                onClick={() => onSelectAsset(item.ticker)}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 76px' }}
                className="w-full text-left rounded-xl bg-[#121418] hover:bg-[#191416] border border-white/[0.06] hover:border-[#EF4444]/40 p-2.5 transition-colors duration-150 space-y-1.5"
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
                      className="h-full rounded-full transition-[width] duration-300"
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
  );
});

export function ThermodynamicGainsModal({
  onClose,
  auditsMap,
  fullAuditsMap,
  timelineYear = 'PRESENT',
  onChangeTimelineYear,
  onInteractTimeMachine,
  onSelectOrAuditTicker,
  onCopyReport,
  copiedTarget,
  initialCohortRecord,
  initialLiveSpots,
  onCohortSynced
}: ThermodynamicGainsModalProps) {
  const activeTimelineYear: GlobalTimelineYear = timelineYear || 'PRESENT';
  const isHistoricalStop = activeTimelineYear !== 'PRESENT';
  const activeStopMeta = getGlobalTimelineStop(activeTimelineYear);
  const canonicalAuditsMap = fullAuditsMap || auditsMap;
  const serverPersistedTickersRef = useRef<Set<string>>(
    new Set(
      initialCohortRecord
        ? [
            ...initialCohortRecord.passed.map((i) => i.ticker),
            ...initialCohortRecord.failed.map((i) => i.ticker)
          ]
        : []
    )
  );
  const [persistedCohortRecord, setPersistedCohortRecord] = useState<GainsCohortRecord | null>(
    () =>
      stampCohortSnapshotWithSpots(
        canonicalAuditsMap,
        initialCohortRecord ?? null,
        initialLiveSpots || {},
        initialCohortRecord?.sourceLabel
      )
  );
  const persistedCohortRecordRef = useRef<GainsCohortRecord | null>(persistedCohortRecord);
  persistedCohortRecordRef.current = persistedCohortRecord;
  const [hasLoadedBackend, setHasLoadedBackend] = useState(Boolean(initialCohortRecord));
  const [chartView, setChartView] = useState<GainsChartView>(() =>
    resolveInitialGainsChartView(typeof window !== 'undefined' ? window.location.search : '')
  );
  const [rawM2Dataset, setRawM2Dataset] = useState<M2BenchmarkDataset>(
    DEFAULT_M2_BENCHMARK_DATASET
  );
  const [horizon, setHorizon] = useState<GainsHorizon>('ALL_TIME');
  const [allocPerAsset, setAllocPerAsset] = useState(1000);
  const [useLogScale, setUseLogScale] = useState(true);
  const [feedMode, setFeedMode] = useState<GainsFeedMode>(() =>
    resolveInitialGainsFeedMode(typeof window !== 'undefined' ? window.location.search : '')
  );
  const feedModeRef = useRef<GainsFeedMode>(feedMode);
  feedModeRef.current = feedMode;
  const [snapshotSpots, setSnapshotSpots] = useState<Record<string, number>>(() => ({
    ...(initialLiveSpots || {})
  }));
  const snapshotSpotsRef = useRef<Record<string, number>>(snapshotSpots);
  snapshotSpotsRef.current = snapshotSpots;
  const [liveSpots, setLiveSpots] = useState<Record<string, number>>(() => ({
    ...(initialLiveSpots || {})
  }));
  const liveSpotsRef = useRef<Record<string, number>>(liveSpots);
  liveSpotsRef.current = liveSpots;

  const [windowTrajectories, setWindowTrajectories] = useState<WindowTrajectoriesMap>({});
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [lastLiveSyncLabel, setLastLiveSyncLabel] = useState<string | null>(null);
  const [backendStatusMsg, setBackendStatusMsg] = useState<string | null>(null);

  const [hasLoadedCohortSnapshot, setHasLoadedCohortSnapshot] = useState(false);
  const [hasLoadedM2Snapshot, setHasLoadedM2Snapshot] = useState(false);
  const [hasSyncedOpenSnapshot, setHasSyncedOpenSnapshot] = useState(false);
  const [hasSyncedCohortLive, setHasSyncedCohortLive] = useState(false);
  const [hasSyncedM2Live, setHasSyncedM2Live] = useState(false);
  const lastLiveSyncAtMsRef = useRef<number>(0);

  useEffect(() => {
    if (!initialLiveSpots || Object.keys(initialLiveSpots).length === 0) return;
    setLiveSpots((prev) => ({ ...prev, ...initialLiveSpots }));
    if (!hasSyncedOpenSnapshot) {
      setSnapshotSpots((prev) => ({ ...initialLiveSpots, ...prev }));
      setPersistedCohortRecord((prev) =>
        stampCohortSnapshotWithSpots(
          canonicalAuditsMapRef.current,
          prev,
          { ...initialLiveSpots, ...snapshotSpotsRef.current },
          prev?.sourceLabel
        )
      );
    }
  }, [initialLiveSpots, hasSyncedOpenSnapshot]);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const lastAutoSyncedSigRef = useRef<string | null>(null);
  const onCohortSyncedRef = useRef(onCohortSynced);
  onCohortSyncedRef.current = onCohortSynced;

  // Buffer parent App.tsx updates while modal is open so live refreshes never cause full-app re-renders
  const pendingParentSyncRef = useRef<{
    record: GainsCohortRecord;
    spots: Record<string, number>;
  } | null>(null);

  const queueParentCohortSync = useCallback(
    (record: GainsCohortRecord, spots: Record<string, number>) => {
      const prevSpots = pendingParentSyncRef.current?.spots || {};
      pendingParentSyncRef.current = {
        record,
        spots: { ...prevSpots, ...spots }
      };
    },
    []
  );

  const flushPendingParentSync = useCallback(() => {
    const pending = pendingParentSyncRef.current;
    if (!pending) return;
    pendingParentSyncRef.current = null;
    onCohortSyncedRef.current?.(pending.record, pending.spots);
  }, []);

  useEffect(() => {
    return () => {
      flushPendingParentSync();
    };
  }, [flushPendingParentSync]);

  const handleCloseModal = useCallback(() => {
    flushPendingParentSync();
    onClose();
  }, [flushPendingParentSync, onClose]);

  const handleSelectAsset = useCallback(
    (ticker: string) => {
      flushPendingParentSync();
      onSelectOrAuditTicker(ticker);
    },
    [flushPendingParentSync, onSelectOrAuditTicker]
  );

  const cohortRecord = useMemo(
    () => buildBasketSyncedCohortRecord(auditsMap, persistedCohortRecord),
    [auditsMap, persistedCohortRecord]
  );
  const canonicalSyncRecord = useMemo(
    () => buildBasketSyncedCohortRecord(canonicalAuditsMap, persistedCohortRecord),
    [canonicalAuditsMap, persistedCohortRecord]
  );
  const canonicalSyncRecordRef = useRef(canonicalSyncRecord);
  canonicalSyncRecordRef.current = canonicalSyncRecord;
  const canonicalAuditsMapRef = useRef(canonicalAuditsMap);
  canonicalAuditsMapRef.current = canonicalAuditsMap;

  const cohortSnapshotInFlightRef = useRef(false);
  const m2SnapshotInFlightRef = useRef(false);
  const cohortLiveSyncInFlightRef = useRef(false);
  const m2LiveSyncInFlightRef = useRef(false);

  useEffect(() => {
    if (isHistoricalStop && horizon !== 'ALL_TIME') {
      setHorizon('ALL_TIME');
      setUseLogScale(true);
    }
  }, [isHistoricalStop, horizon]);

  const fetchCohortSnapshot = useCallback(async () => {
    if (cohortSnapshotInFlightRef.current) return;
    cohortSnapshotInFlightRef.current = true;
    try {
      const res = await fetch('/api/gains-cohort?live=0', { cache: 'no-store' });
      const payload = res.ok
        ? ((await res.json()) as {
            record?: Partial<GainsCohortRecord>;
            liveSpotMap?: Record<string, number>;
            windowTrajectories?: WindowTrajectoriesMap;
            extraResolvedEntries?: Record<string, CohortAssetEntry>;
          } | null)
        : null;
      if (!mountedRef.current) return;
      if (payload?.record) {
        const hydrated = mergeResolvedEntriesIntoCohortRecord(
          sanitizeGainsCohortRecord(payload.record),
          payload.extraResolvedEntries
        );
        serverPersistedTickersRef.current = new Set([
          ...hydrated.passed.map((i) => i.ticker),
          ...hydrated.failed.map((i) => i.ticker)
        ]);
        const payloadSpots = payload.liveSpotMap || {};
        if (Object.keys(payloadSpots).length > 0) {
          setLiveSpots((prev) => ({ ...payloadSpots, ...prev }));
          setSnapshotSpots((prev) => ({ ...payloadSpots, ...prev }));
        }
        const combinedSnapSpots = { ...payloadSpots, ...snapshotSpotsRef.current };
        const prevSnap = persistedCohortRecordRef.current;
        const mergedHydratedSnap = preserveCustomCohortEntries(hydrated, prevSnap);
        const baseSnap =
          !prevSnap || mergedHydratedSnap.updatedAtMs >= prevSnap.updatedAtMs
            ? mergedHydratedSnap
            : preserveCustomCohortEntries(prevSnap, mergedHydratedSnap);
        const nextParentRecord =
          stampCohortSnapshotWithSpots(
            canonicalAuditsMapRef.current,
            baseSnap,
            combinedSnapSpots,
            baseSnap.sourceLabel
          ) ?? mergedHydratedSnap;
        setPersistedCohortRecord((prev) => preserveCustomCohortEntries(nextParentRecord, prev));
        if (payload.windowTrajectories) {
          setWindowTrajectories(payload.windowTrajectories);
        }
        queueParentCohortSync(nextParentRecord, combinedSnapSpots);
      }
      setHasLoadedBackend(true);
      setHasLoadedCohortSnapshot(true);
    } catch {
      if (mountedRef.current) {
        setHasLoadedBackend(true);
        setHasLoadedCohortSnapshot(true);
      }
    } finally {
      cohortSnapshotInFlightRef.current = false;
    }
  }, [queueParentCohortSync]);

  const fetchM2Snapshot = useCallback(async () => {
    if (m2SnapshotInFlightRef.current) return;
    m2SnapshotInFlightRef.current = true;
    try {
      const res = await fetch('/api/m2-benchmark', { cache: 'no-store' });
      const payload = res.ok
        ? ((await res.json()) as { dataset?: M2BenchmarkDataset } | null)
        : null;
      if (!mountedRef.current) return;
      if (payload?.dataset?.seriesByHorizon) {
        setRawM2Dataset(payload.dataset);
        const dsSpots = extractSpotsFromM2Dataset(payload.dataset);
        if (Object.keys(dsSpots).length > 0) {
          setSnapshotSpots((prev) => ({
            ...dsSpots,
            ...prev,
            ...(dsSpots.SPX && !prev.SPX ? { SPX: dsSpots.SPX } : {})
          }));
          setLiveSpots((prev) => ({
            ...dsSpots,
            ...prev,
            ...(dsSpots.SPX ? { SPX: dsSpots.SPX } : {})
          }));
        }
      }
      setHasLoadedM2Snapshot(true);
    } catch {
      if (mountedRef.current) {
        setHasLoadedM2Snapshot(true);
      }
    } finally {
      m2SnapshotInFlightRef.current = false;
    }
  }, []);

  const syncCohortLiveSpots = useCallback(
    async (updateSnapshot = false) => {
      if (cohortLiveSyncInFlightRef.current) return;
      cohortLiveSyncInFlightRef.current = true;
      setIsSyncingLive(true);
      const snapshotCohort = canonicalSyncRecordRef.current;
      const allItems = [...snapshotCohort.passed, ...snapshotCohort.failed];
      const customExtraItems = allItems
        .filter((it) => !PRELOADED_COHORT_TICKERS.has(it.ticker))
        .map((it) => ({
          ticker: it.ticker,
          name: it.name,
          grade: it.grade,
          auditScore: it.auditScore,
          coinbasePair: it.coinbasePair,
          geckoId: it.geckoId,
          yahooSymbol: it.yahooSymbol
        }));

      try {
        const idToken = firebaseAuth?.currentUser?.emailVerified
          ? await getFirebaseIdToken()
          : null;
        const syncHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (idToken) {
          syncHeaders.Authorization = `Bearer ${idToken}`;
        }
        const syncRes = await fetch('/api/gains-cohort/sync', {
          method: 'POST',
          headers: syncHeaders,
          body: JSON.stringify(
            customExtraItems.length > 0 ? { extraItems: customExtraItems } : {}
          )
        });
        if (syncRes.ok && mountedRef.current) {
          const syncJson = (await syncRes.json()) as {
            record?: GainsCohortRecord;
            syncedTickers?: string[];
            liveSpotMap?: Record<string, number>;
            windowTrajectories?: WindowTrajectoriesMap;
            extraResolvedEntries?: Record<string, CohortAssetEntry>;
          };
          const mergedSpots = { ...(syncJson.liveSpotMap || {}) };
          if (syncJson.windowTrajectories) {
            setWindowTrajectories(syncJson.windowTrajectories);
          }
          const shouldSyncSnapshot = updateSnapshot || feedModeRef.current === 'SNAPSHOT';
          if (Object.keys(mergedSpots).length > 0) {
            setLiveSpots((prev) => ({ ...prev, ...mergedSpots }));
            if (shouldSyncSnapshot) {
              setSnapshotSpots((prev) => ({ ...prev, ...mergedSpots }));
            }
            lastLiveSyncAtMsRef.current = Date.now();
            setLastLiveSyncLabel(
              new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })
            );
          }
          if (syncJson?.record) {
            const serverRecord = mergeResolvedEntriesIntoCohortRecord(
              sanitizeGainsCohortRecord(syncJson.record),
              syncJson.extraResolvedEntries
            );
            serverPersistedTickersRef.current = new Set([
              ...serverRecord.passed.map((i) => i.ticker),
              ...serverRecord.failed.map((i) => i.ticker)
            ]);
            const nextSpotPool = shouldSyncSnapshot
              ? { ...snapshotSpotsRef.current, ...mergedSpots }
              : mergedSpots;
            const updatedRecord =
              stampCohortSnapshotWithSpots(
                canonicalAuditsMapRef.current,
                serverRecord,
                nextSpotPool,
                serverRecord.sourceLabel
              ) ?? serverRecord;
            const syncedFinalRecord = preserveCustomCohortEntries(
              updatedRecord,
              persistedCohortRecordRef.current
            );
            setPersistedCohortRecord((prev) => preserveCustomCohortEntries(syncedFinalRecord, prev));
            lastAutoSyncedSigRef.current = getCohortSyncSignature(
              buildBasketSyncedCohortRecord(canonicalAuditsMapRef.current, syncedFinalRecord)
            );
            pendingParentSyncRef.current = null;
            onCohortSyncedRef.current?.(syncedFinalRecord, nextSpotPool);
            if (
              firebaseAuth?.currentUser?.emailVerified &&
              (syncJson.syncedTickers?.length || 0) > 0
            ) {
              void persistGainsCohortToFirestore(serverRecord).catch(() => {});
            }
            if ((syncJson.syncedTickers?.length || 0) > 0) {
              setBackendStatusMsg(
                shouldSyncSnapshot
                  ? `Snapshot synced (${syncJson.syncedTickers!.length} live spots)`
                  : `Synced ${syncJson.syncedTickers!.length} live spots`
              );
            }
          }
          setHasLoadedBackend(true);
          setHasLoadedCohortSnapshot(true);
          setHasSyncedCohortLive(true);
          setHasSyncedOpenSnapshot(true);
        } else if (mountedRef.current) {
          setHasSyncedCohortLive(true);
          setHasSyncedOpenSnapshot(true);
        }
      } catch {
        if (mountedRef.current) {
          setHasSyncedCohortLive(true);
          setHasSyncedOpenSnapshot(true);
        }
      } finally {
        cohortLiveSyncInFlightRef.current = false;
        if (mountedRef.current && !m2LiveSyncInFlightRef.current) {
          setIsSyncingLive(false);
        }
      }
    },
    [queueParentCohortSync]
  );

  const syncM2LiveSpots = useCallback(async (updateSnapshot = false) => {
    if (m2LiveSyncInFlightRef.current) return;
    m2LiveSyncInFlightRef.current = true;
    setIsSyncingLive(true);
    try {
      const res = await fetch('/api/m2-benchmark?refresh=1', { cache: 'no-store' });
      const payload = res.ok
        ? ((await res.json()) as { dataset?: M2BenchmarkDataset } | null)
        : null;
      if (!mountedRef.current) return;
      const shouldSyncSnapshot = updateSnapshot || feedModeRef.current === 'SNAPSHOT';
      if (payload?.dataset?.seriesByHorizon) {
        setRawM2Dataset(payload.dataset);
        const dsSpots = extractSpotsFromM2Dataset(payload.dataset);
        if (Object.keys(dsSpots).length > 0) {
          setLiveSpots((prev) => ({
            ...dsSpots,
            ...prev,
            ...(dsSpots.SPX ? { SPX: dsSpots.SPX } : {})
          }));
          if (shouldSyncSnapshot) {
            setSnapshotSpots((prev) => ({
              ...dsSpots,
              ...prev,
              ...(dsSpots.SPX ? { SPX: dsSpots.SPX } : {})
            }));
          }
        }
        lastLiveSyncAtMsRef.current = Date.now();
        setLastLiveSyncLabel(
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        );
      }
      setHasLoadedM2Snapshot(true);
      setHasSyncedM2Live(true);
      if (shouldSyncSnapshot) {
        setHasSyncedOpenSnapshot(true);
      }
    } catch {
      if (mountedRef.current) {
        setHasSyncedM2Live(true);
        setHasSyncedOpenSnapshot(true);
      }
    } finally {
      m2LiveSyncInFlightRef.current = false;
      if (mountedRef.current && !cohortLiveSyncInFlightRef.current) {
        setIsSyncingLive(false);
      }
    }
  }, []);

  const syncActiveTabLive = useCallback(() => {
    const syncSnap = feedModeRef.current === 'SNAPSHOT';
    const target = resolveManualLiveSyncTarget(chartView);
    if (target === 'BENCHMARK_ONLY') {
      void syncM2LiveSpots(syncSnap);
      void syncCohortLiveSpots(syncSnap);
    } else {
      void syncCohortLiveSpots(syncSnap);
    }
  }, [chartView, syncCohortLiveSpots, syncM2LiveSpots]);

  const handleSelectFeedMode = useCallback((nextMode: GainsFeedMode) => {
    if (nextMode === feedModeRef.current) return;
    if (nextMode === 'SNAPSHOT') {
      const currentLive = liveSpotsRef.current;
      if (Object.keys(currentLive).length > 0) {
        setSnapshotSpots((prev) => ({ ...prev, ...currentLive }));
        setPersistedCohortRecord((prev) =>
          stampCohortSnapshotWithSpots(
            canonicalAuditsMapRef.current,
            prev,
            currentLive,
            prev?.sourceLabel
          )
        );
      }
      setFeedMode('SNAPSHOT');
      return;
    }
    if (Date.now() - lastLiveSyncAtMsRef.current > 15_000) {
      setHasSyncedCohortLive(false);
      setHasSyncedM2Live(false);
    }
    setFeedMode('LIVE');
  }, []);

  // Tab-isolated lazy snapshot loading + one-shot open snapshot sync + on-demand LIVE feed sync
  useEffect(() => {
    const plan = resolveTabLazyFetchPlan({
      chartView,
      feedMode,
      hasLoadedCohortSnapshot,
      hasLoadedM2Snapshot,
      hasSyncedOpenSnapshot,
      hasSyncedCohortLive,
      hasSyncedM2Live
    });
    if (plan.fetchCohortSnapshot) {
      void fetchCohortSnapshot();
    }
    if (plan.fetchM2Snapshot) {
      void fetchM2Snapshot();
    }
    const isInitialOpenSync = !hasSyncedOpenSnapshot;
    if (plan.syncCohortLive || plan.syncM2Live) {
      if (isInitialOpenSync && typeof window !== 'undefined') {
        const rafId = window.requestAnimationFrame(() => {
          if (plan.syncCohortLive) {
            void syncCohortLiveSpots(true);
          }
          if (plan.syncM2Live) {
            void syncM2LiveSpots(true);
          }
        });
        return () => window.cancelAnimationFrame(rafId);
      }
      if (plan.syncCohortLive) {
        void syncCohortLiveSpots(false);
      }
      if (plan.syncM2Live) {
        void syncM2LiveSpots(false);
      }
    }
    return undefined;
  }, [
    chartView,
    feedMode,
    hasLoadedCohortSnapshot,
    hasLoadedM2Snapshot,
    hasSyncedOpenSnapshot,
    hasSyncedCohortLive,
    hasSyncedM2Live,
    fetchCohortSnapshot,
    fetchM2Snapshot,
    syncCohortLiveSpots,
    syncM2LiveSpots
  ]);

  // Subscribe to Firestore live cohort updates & background poll ONLY when user enables LIVE feed
  useEffect(() => {
    if (feedMode !== 'LIVE') return undefined;
    let active = true;
    const unsub = subscribeGainsCohortFromFirestore('default', (remoteRecord) => {
      if (!active) return;
      setPersistedCohortRecord((prev) =>
        !prev || remoteRecord.updatedAtMs >= prev.updatedAtMs
          ? preserveCustomCohortEntries(remoteRecord, prev)
          : prev
      );
    });
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      syncActiveTabLive();
    }, 60000);
    return () => {
      active = false;
      unsub();
      clearInterval(timer);
    };
  }, [feedMode, syncActiveTabLive]);

  // Automatically keep backend & Firestore cohort storage synced when verified user enables LIVE mode
  useEffect(() => {
    if (
      feedMode !== 'LIVE' ||
      isHistoricalStop ||
      !hasLoadedBackend ||
      !firebaseAuth?.currentUser?.emailVerified
    ) {
      return undefined;
    }
    const syncedSig = getCohortSyncSignature(canonicalSyncRecord);
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
            passed: canonicalSyncRecord.passed,
            failed: canonicalSyncRecord.failed,
            sourceLabel: canonicalSyncRecord.sourceLabel,
            isCustomized: Boolean(persistedCohortRecord?.isCustomized)
          })
        });
        const payload = res.ok
          ? ((await res.json()) as { record?: Partial<GainsCohortRecord> } | null)
          : null;
        if (!active || !payload?.record) return;
        const saved = sanitizeGainsCohortRecord(payload.record);
        setPersistedCohortRecord((prev) => {
          const preserved = preserveCustomCohortEntries(saved, prev);
          lastAutoSyncedSigRef.current = getCohortSyncSignature(
            buildBasketSyncedCohortRecord(canonicalAuditsMap, preserved)
          );
          return preserved;
        });
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
  }, [
    feedMode,
    isHistoricalStop,
    hasLoadedBackend,
    canonicalSyncRecord,
    persistedCohortRecord,
    canonicalAuditsMap
  ]);

  const m2Dataset = useMemo(
    () =>
      applyLiveSpotsToM2Dataset(
        rawM2Dataset,
        feedMode === 'LIVE' ? liveSpots : snapshotSpots
      ),
    [rawM2Dataset, feedMode, liveSpots, snapshotSpots]
  );

  const baselineMode: GainsBaselineMode = resolveTimelineBaselineMode(
    activeTimelineYear,
    horizon
  );

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

  const hasLiquidFailed = failedLiquid.length > 0;

  const rawSeries = useMemo(() => {
    const baseTraj = isHistoricalStop
      ? buildHistoricalTimelineCohortTrajectory(
          baselineMode as GainsHistoricalStopKey,
          summary,
          hasLiquidFailed
        )
      : horizon === 'ALL_TIME'
      ? RELEASE_COHORT_TRAJECTORY
      : windowTrajectories[horizon] && windowTrajectories[horizon]!.length >= 2
      ? windowTrajectories[horizon]!
      : buildFallbackWindowTrajectory(horizon, summary);

    return baseTraj.map((pt, idx, arr) => {
      const isLast = idx === arr.length - 1;
      const livePassMult = isLast ? Math.max(0.05, 1 + passCycleAvg / 100) : pt.passAll;
      const livePassExMult = isLast ? Math.max(0.05, 1 + passExOutlierAvg / 100) : pt.passEx;
      const liveFailMult = !hasLiquidFailed
        ? 1.0
        : isLast
        ? Math.max(0.05, 1 + failCycleAvg / 100)
        : pt.failAll;
      const liveFailExMult = !hasLiquidFailed
        ? null
        : isLast
        ? Math.max(0.05, 1 + failExOutlierAvg / 100)
        : pt.failEx;

      return {
        label: pt.label,
        event: pt.event,
        passPrimary: livePassMult,
        passSecondary: passedLiquid.length > 1 ? (livePassExMult as number | null) : null,
        failPrimary: liveFailMult,
        failSecondary: failedLiquid.length > 1 ? (liveFailExMult as number | null) : null
      };
    });
  }, [
    isHistoricalStop,
    baselineMode,
    hasLiquidFailed,
    passedLiquid.length,
    failedLiquid.length,
    horizon,
    windowTrajectories,
    summary,
    passCycleAvg,
    passExOutlierAvg,
    failCycleAvg,
    failExOutlierAvg
  ]);

  const buildShareableGainsReport = () => {
    if (chartView === 'BTC_BENCHMARK') {
      const pts = resolveBenchmarkSeriesForTimeline(m2Dataset, activeTimelineYear, horizon);
      const btcSum = computeBtcHorizonSummary({
        points: pts,
        horizon,
        timelineYear: activeTimelineYear,
        cohortRecord,
        liveSpots,
        feedMode
      });
      const horizonTitle =
        btcSum.headingLabel ||
        (isHistoricalStop
          ? `${activeTimelineYear} EPOCH OPEN → LIVE SPOT`
          : horizon === 'ALL_TIME'
          ? "ALL-TIME GENESIS (JUL '10) → LIVE SPOT"
          : HORIZON_META[horizon].heading);
      const assetLines = btcSum.assets
        .map(
          (a) =>
            `• ${a.name} (${a.ticker}): Nominal ${formatPctSigned(a.nominalPct)} (${a.nominalMult.toFixed(2)}x) | vs BTC: ${formatPctSigned(a.btcAdjustedPct)} (₿ ${a.btcAdjustedMult.toFixed(2)}x)`
        )
        .join('\n');
      const beatCount = btcSum.cohortMatrix.filter((r) => r.beatsBtc).length;
      return `THE TRUTH — PERFORMANCE & PURCHASING POWER VS BITCOIN ($BTC) (${horizonTitle})

BITCOIN ($BTC) BENCHMARK (${btcSum.windowTag || 'Genesis'} → Spot): ${formatUsdPrice(btcSum.btcStartPrice)} → ${formatUsdPrice(btcSum.btcEndPrice)} (${formatPctSigned(btcSum.btcPct)} • ${btcSum.btcMult.toFixed(2)}x)

${assetLines}

BASKET BREADTH VS BTC: ${beatCount} of ${btcSum.cohortMatrix.length} liquid audited assets outperformed $BTC over this window.`;
    }

    if (chartView === 'M2_BENCHMARK') {
      const pts = resolveBenchmarkSeriesForTimeline(m2Dataset, activeTimelineYear, horizon);
      const m2Sum = computeM2AssetSummaries(pts, activeTimelineYear, horizon, {
        cohortRecord,
        liveSpots,
        feedMode
      });
      const horizonTitle =
        m2Sum.headingLabel ||
        (isHistoricalStop
          ? `${activeTimelineYear} EPOCH OPEN → LIVE SPOT`
          : horizon === 'ALL_TIME'
          ? "ALL-TIME GENESIS (JUL '10) → LIVE SPOT"
          : HORIZON_META[horizon].heading);
      const assetLines = m2Sum.assets
        .map(
          (a) =>
            `• ${a.name} (${a.ticker}): Nominal ${formatPctSigned(a.nominalPct)} (${a.nominalMult.toFixed(2)}x) | Real vs M2: ${formatPctSigned(a.m2AdjustedPct)} (${a.m2AdjustedMult.toFixed(2)}x)`
        )
        .join('\n');
      const beatCount = m2Sum.cohortMatrix.filter((r) => r.beatsM2).length;
      return `THE TRUTH — MACRO PURCHASING POWER VS US M2 (${horizonTitle})

US M2 MONEY SUPPLY (${m2Sum.windowTag || 'Open'} → Spot): ${formatM2SupplyLabel(m2Sum.m2StartTrillions)} → ${formatM2SupplyLabel(m2Sum.m2EndTrillions)} (${formatPctSigned(m2Sum.m2Pct)})

${assetLines}

BASKET BREADTH VS US M2: ${beatCount} of ${m2Sum.cohortMatrix.length} liquid audited assets outperformed US M2 monetary expansion.`;
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

    const horizonHeading = isHistoricalStop
      ? `${activeTimelineYear} EPOCH OPEN → LIVE SPOT`
      : HORIZON_META[horizon].heading;
    const windowShortLabel = isHistoricalStop
      ? `${activeTimelineYear} → Spot`
      : HORIZON_META[horizon].tabLabel;

    return `THE TRUTH — THERMODYNAMIC GAINS AUDIT (${horizonHeading} • ${cohortRecord.updatedAtLabel.toUpperCase()})

PASSED // E > 0 (${cohortRecord.passed.length} Harmonic — PoW & Physical Commodities):
• ${windowShortLabel} Equal-Weight Avg: ${formatPctSigned(passCycleAvg)} (${formatPctSigned(passExOutlierAvg)} ${passExLabel})
• $${allocPerAsset.toLocaleString()}/Asset Basket (${passedLiquid.length} Active): $${passInvested.toLocaleString()} → ~${formatBasketUsd(passEndDollars)}
• Breadth: ${passPositiveCount} of ${passedLiquid.length} Active Assets Positive
• Top Performers: ${topPassAnchors}

FAILED // E = 0 (${cohortRecord.failed.length} Flatlined — PoS & Premined):
• ${windowShortLabel} Equal-Weight Avg: ${formatPctSigned(failCycleAvg)} (${formatPctSigned(failExOutlierAvg)} ${failExLabel})
• $${allocPerAsset.toLocaleString()}/Asset Basket (${failedLiquid.length} Active): $${failInvested.toLocaleString()} → ~${formatBasketUsd(failEndDollars)}
• Drawdown Breadth: ${failNegativeCount} of ${failedLiquid.length} Negative${bleedAssets ? ` (${bleedAssets})` : ''}

VERDICT: ${portfolioVictoryMultiple}x Total Portfolio Victory for Unforgeable Physical Costliness (E > 0).`;
  };

  const modalSliderAccent = useMemo(
    () => getGradeAccent(chartView === 'BTC_BENCHMARK' ? 'B+' : 'A+'),
    [chartView]
  );
  const activeWindowLabel = isHistoricalStop
    ? `${activeTimelineYear} → Spot`
    : HORIZON_META[horizon].tabLabel;

  return (
    <div
      onClick={handleCloseModal}
      className="animate-modal-backdrop fixed inset-0 z-50 bg-[#050608]/92 flex items-center justify-center p-2.5 sm:p-5"
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
              onClick={handleCloseModal}
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
                  onMouseEnter={() => {
                    void loadBtcBenchmarkPanel();
                  }}
                  onFocus={() => {
                    void loadBtcBenchmarkPanel();
                  }}
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
                  onMouseEnter={() => {
                    void loadM2BenchmarkPanel();
                  }}
                  onFocus={() => {
                    void loadM2BenchmarkPanel();
                  }}
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
                  onClick={() => handleSelectFeedMode('SNAPSHOT')}
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
                  onClick={() => handleSelectFeedMode('LIVE')}
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

              {(feedMode === 'LIVE' || isSyncingLive || Boolean(lastLiveSyncLabel)) && (
                <button
                  type="button"
                  disabled={isSyncingLive}
                  onClick={syncActiveTabLive}
                  title={
                    feedMode === 'LIVE'
                      ? 'Sync live spot prices for the active tab'
                      : 'Snapshot synced on open — click to refresh snapshot from live feed'
                  }
                  className="px-2 sm:px-2.5 py-1 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[10px] sm:text-[10.5px] text-neutral-300 flex items-center justify-center gap-1 tabular-nums transition-colors duration-150 shrink-0 whitespace-nowrap"
                >
                  <RefreshCw
                    className={`w-3 h-3 text-[#49EACB] shrink-0 ${isSyncingLive ? 'animate-spin' : ''}`}
                  />
                  <span className="hidden md:inline">
                    {isSyncingLive
                      ? feedMode === 'SNAPSHOT'
                        ? 'Syncing snapshot...'
                        : 'Syncing...'
                      : feedMode === 'SNAPSHOT'
                      ? `Synced ${lastLiveSyncLabel}`
                      : lastLiveSyncLabel || 'Sync'}
                  </span>
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
          {onChangeTimelineYear && (
            <div
              className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] px-3.5 py-2.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5"
              data-testid="gains-modal-timeline-bar"
            >
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-300 shrink-0">
                  <Clock
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: modalSliderAccent.primary }}
                  />
                  <span>Time Machine Baseline:</span>
                </span>
                <span
                  className="font-mono text-[10.5px] font-semibold truncate"
                  style={{ color: modalSliderAccent.primary }}
                >
                  {activeStopMeta.buttonLabel} &middot; {activeStopMeta.epochTitle}
                </span>
                {isHistoricalStop && (
                  <button
                    type="button"
                    onClick={() => {
                      onInteractTimeMachine?.();
                      onChangeTimelineYear('PRESENT');
                    }}
                    className="px-2 py-0.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 font-mono text-[9.5px] text-neutral-300 hover:text-white transition-colors duration-150 shrink-0"
                  >
                    Reset to Present
                  </button>
                )}
              </div>

              <div className="flex justify-center lg:justify-end w-full lg:w-auto">
                <GlobalTimeMachineSlider
                  value={activeTimelineYear}
                  onChange={(nextYr) => {
                    setHorizon('ALL_TIME');
                    setUseLogScale(true);
                    onChangeTimelineYear(nextYr);
                  }}
                  onInteract={onInteractTimeMachine}
                  accent={modalSliderAccent}
                  testIdPrefix="modal-time-machine"
                  omitTutorialId
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="p-1 rounded-2xl sm:rounded-full bg-[#0B0C0E] border border-white/[0.08] flex flex-wrap items-center gap-1 font-mono text-xs">
              {(
                [
                  {
                    id: 'ALL_TIME',
                    label: isHistoricalStop ? `${activeTimelineYear} → Spot` : 'All Time'
                  },
                  { id: 'D180', label: '180 Days' },
                  { id: 'Y1', label: '1 Year' },
                  { id: 'Y2', label: '2 Years' },
                  { id: 'Y4', label: '4 Years' }
                ] as const
              ).map((tab) => {
                const active =
                  tab.id === 'ALL_TIME'
                    ? horizon === 'ALL_TIME'
                    : !isHistoricalStop && horizon === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (tab.id !== 'ALL_TIME' && isHistoricalStop) {
                        onChangeTimelineYear?.('PRESENT');
                      }
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
            <Suspense
              fallback={
                <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-8 font-mono text-xs text-neutral-400 text-center">
                  Loading Bitcoin Benchmark...
                </div>
              }
            >
              <LazyBtcBenchmarkPanel
                horizon={horizon}
                timelineYear={activeTimelineYear}
                useLogScale={useLogScale}
                onChangeLogScale={setUseLogScale}
                dataset={m2Dataset}
                cohortRecord={cohortRecord}
                liveSpots={liveSpots}
                feedMode={feedMode}
                allocPerAsset={allocPerAsset}
                onSelectOrAuditTicker={handleSelectAsset}
              />
            </Suspense>
          ) : chartView === 'M2_BENCHMARK' ? (
            <Suspense
              fallback={
                <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-8 font-mono text-xs text-neutral-400 text-center">
                  Loading US M2 Benchmark...
                </div>
              }
            >
              <LazyM2BenchmarkPanel
                horizon={horizon}
                timelineYear={activeTimelineYear}
                cohortRecord={cohortRecord}
                liveSpots={liveSpots}
                feedMode={feedMode}
                useLogScale={useLogScale}
                onChangeLogScale={setUseLogScale}
                dataset={m2Dataset}
                allocPerAsset={allocPerAsset}
                onSelectOrAuditTicker={handleSelectAsset}
              />
            </Suspense>
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
              {hasLiquidFailed ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="font-display text-xl sm:text-2xl font-bold text-neutral-400">
                    Fiat Numeraire
                  </div>
                  <div className="font-mono text-[11px] text-neutral-500">
                    No liquid 0-Joule tokens in {activeTimelineYear} ($USD unit)
                  </div>
                </>
              )}
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
                  {hasLiquidFailed ? `~${formatBasketUsd(failEndDollars)}` : `$${allocPerAsset.toLocaleString()} Fiat`}
                </span>
              </div>
              <div className="font-mono text-[11px] text-[#34D399] font-semibold">
                {!hasLiquidFailed
                  ? `E > 0 Hard Assets (${activeWindowLabel})`
                  : passedLiquid.length === failedLiquid.length
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
                {hasLiquidFailed && (
                  <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
                    <span className="text-[#EF4444]">
                      {formatPctSigned(minFailCyclePct)}
                    </span>
                    <span className="font-mono text-xs text-neutral-500">
                      {worstFailAsset ? `$${worstFailAsset.ticker}` : 'Low E=0'}
                    </span>
                  </span>
                )}
              </div>
              <div className="font-mono text-[11px] text-neutral-400 leading-snug">
                {activeWindowLabel} top gainers trimmed from both lists above
              </div>
            </div>
          </div>

          <CohortEquityChartCard
            rawSeries={rawSeries}
            horizon={horizon}
            activeTimelineYear={activeTimelineYear}
            isHistoricalStop={isHistoricalStop}
            useLogScale={useLogScale}
            onChangeLogScale={setUseLogScale}
            passExLabel={passExLabel}
            passExOutlierAvg={passExOutlierAvg}
            failExLabel={failExLabel}
            failExOutlierAvg={failExOutlierAvg}
          />

          <CohortAssetListsGrid
            passedEnriched={passedEnriched}
            failedEnriched={failedEnriched}
            passedLiquid={passedLiquid}
            failedLiquid={failedLiquid}
            passedTotalCount={cohortRecord.passed.length}
            failedTotalCount={cohortRecord.failed.length}
            horizon={horizon}
            onSelectAsset={handleSelectAsset}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1.5">
              <div className="font-mono text-[10.5px] font-bold text-[#49EACB]">
                01 // ASYMMETRIC RIGHT-TAIL COMPOUNDING
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {!isHistoricalStop && horizon === 'ALL_TIME'
                  ? `Measured from initial public release open to live spot, unforgeable Proof-of-Work leaders like $BTC ($0.05) and $KAS ($0.0001859) turn $${allocPerAsset.toLocaleString()}/asset into ~${formatBasketUsd(passEndDollars)} vs ~${formatBasketUsd(failEndDollars)} on E = 0 (${portfolioVictoryMultiple}x portfolio victory).`
                  : `Over the ${activeWindowLabel} horizon, the E > 0 basket turns $${passInvested.toLocaleString()} into ~${formatBasketUsd(passEndDollars)}${hasLiquidFailed ? ` vs ~${formatBasketUsd(failEndDollars)} on E = 0 (${portfolioVictoryMultiple}x portfolio spread)` : ''}, led by $${topPassAsset?.ticker || 'BTC'} (${formatPctSigned(topPassAsset?.cyclePct ?? 0)}).`}
              </p>
            </div>

            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1.5">
              <div className="font-mono text-[10.5px] font-bold text-[#EF4444]">
                02 // ELIMINATING THE &ldquo;VC BLEED-TO-ZERO&rdquo; LEFT TAIL
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {hasLiquidFailed
                  ? `${failNegativeCount} of ${failedLiquid.length} active E = 0 tokens remain underwater in the ${activeWindowLabel} window${
                      worstFailAsset
                        ? `, led on the downside by $${worstFailAsset.ticker} (${formatPctSigned(worstFailAsset.cyclePct)}) as zero-joule supply dilution weighs on price discovery.`
                        : ' as zero-joule insider unlocks weigh on price discovery.'
                    }`
                  : `In the ${activeTimelineYear} epoch, unbacked fiat credit ($USD) served as the sole 0-Joule ledger while physical bullion and Proof-of-Work preserved long-horizon purchasing power.`}
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
