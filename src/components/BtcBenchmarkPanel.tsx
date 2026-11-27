import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildNiceYGridTicks,
  formatMultipleCompact,
  formatPctSigned,
  formatSimOutcomeUsd,
  formatUsdPrice,
  type GainsCohortRecord
} from '../data/gainsCohortData.ts';
import {
  BTC_SERIES_META,
  computeBtcHorizonSummary,
  transformBtcPointNullable,
  type BtcComparisonMode,
  type BtcMatrixAssetItem,
  type BtcSeriesKey
} from '../data/btcBenchmarkData.ts';
import {
  resolveBenchmarkSeriesForTimeline,
  type M2BenchmarkDataset,
  type M2ChartPoint,
  type MacroM2HorizonKey
} from '../data/m2BenchmarkData.ts';
import type { GlobalTimelineYear } from '../data/globalTimeMachine.ts';
import { formatScore } from '../data/rubricSpec.ts';

export interface BtcBenchmarkPanelProps {
  horizon: MacroM2HorizonKey;
  timelineYear?: GlobalTimelineYear;
  useLogScale: boolean;
  onChangeLogScale: (next: boolean) => void;
  dataset: M2BenchmarkDataset;
  cohortRecord: GainsCohortRecord;
  liveSpots: Record<string, number>;
  feedMode: 'SNAPSHOT' | 'LIVE';
  allocPerAsset: number;
  onSelectOrAuditTicker: (ticker: string) => void;
}

const ALL_SERIES_KEYS: BtcSeriesKey[] = ['KAS', 'ETH', 'GOLD', 'SPX', 'BTC'];

function formatMatrixPrice(val: number, isIndexPoints?: boolean): string {
  if (isIndexPoints) {
    return val.toLocaleString(undefined, { maximumFractionDigits: val < 100 ? 1 : 0 });
  }
  return formatUsdPrice(val);
}

interface BtcChartCardProps {
  horizon: MacroM2HorizonKey;
  timelineYear: GlobalTimelineYear;
  useLogScale: boolean;
  onChangeLogScale: (next: boolean) => void;
  rawPoints: M2ChartPoint[];
  headingLabel: string;
  beatsBtcCount: number;
  cohortMatrixCount: number;
}

const BtcInteractiveChartCard = memo(function BtcInteractiveChartCard({
  horizon,
  timelineYear,
  useLogScale,
  onChangeLogScale,
  rawPoints,
  headingLabel,
  beatsBtcCount,
  cohortMatrixCount
}: BtcChartCardProps) {
  const [comparisonMode, setComparisonMode] = useState<BtcComparisonMode>('PRICED_IN_BTC');
  const [visibleSeries, setVisibleSeries] = useState<Record<BtcSeriesKey, boolean>>({
    KAS: true,
    ETH: true,
    GOLD: true,
    SPX: true,
    BTC: true
  });
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(860);

  useEffect(() => {
    setHoverIdx(null);
  }, [horizon, timelineYear, comparisonMode]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    let rafId: number | null = null;
    const commitMeasure = () => {
      rafId = null;
      const w = el.clientWidth;
      if (w > 220) {
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

  const seriesData = useMemo(
    () =>
      rawPoints.map((pt) => ({
        raw: pt,
        vals: transformBtcPointNullable(pt, comparisonMode)
      })),
    [rawPoints, comparisonMode]
  );

  const svgH = 264;
  const padL = (horizon === 'ALL_TIME' || timelineYear !== 'PRESENT') && useLogScale ? 64 : 58;
  const padR = 20;
  const padT = 20;
  const padB = 34;
  const plotW = Math.max(180, chartWidth - padL - padR);
  const plotH = svgH - padT - padB;
  const floorClamp = comparisonMode === 'PRICED_IN_BTC' ? 1e-7 : 0.04;

  const { minVal, maxVal } = useMemo(() => {
    const activeKeys = ALL_SERIES_KEYS.filter((k) => visibleSeries[k]);
    const allPlotVals = seriesData.flatMap((d) =>
      activeKeys
        .map((k) => d.vals[k])
        .filter((v): v is number => v !== null && Number.isFinite(v))
        .concat([1.0])
    );
    return {
      minVal: Math.max(floorClamp, Math.min(...allPlotVals) * 0.88),
      maxVal: Math.max(1.05, ...allPlotVals) * 1.12
    };
  }, [seriesData, visibleSeries, floorClamp]);

  const mapX = useCallback(
    (idx: number) => {
      if (seriesData.length <= 1) return padL + plotW / 2;
      return padL + (idx / (seriesData.length - 1)) * plotW;
    },
    [seriesData.length, padL, plotW]
  );

  const mapY = useCallback(
    (mult: number) => {
      const safeMult = Number.isFinite(mult) ? Math.max(floorClamp, mult) : 1.0;
      if (useLogScale) {
        const lo = Math.log10(Math.max(floorClamp, minVal));
        const hi = Math.log10(Math.max(minVal * 1.15, maxVal));
        const v = Math.log10(Math.max(floorClamp, safeMult));
        const frac = (v - lo) / Math.max(0.0001, hi - lo);
        return padT + plotH - frac * plotH;
      }
      const frac = (safeMult - minVal) / Math.max(0.0001, maxVal - minVal);
      return padT + plotH - frac * plotH;
    },
    [floorClamp, useLogScale, minVal, maxVal, padT, plotH]
  );

  const polylines = useMemo(() => {
    const build = (key: BtcSeriesKey) => {
      let started = false;
      const cmds: string[] = [];
      seriesData.forEach((d, i) => {
        const v = d.vals[key];
        if (v === null || !Number.isFinite(v)) {
          started = false;
          return;
        }
        cmds.push(`${started ? 'L' : 'M'} ${mapX(i).toFixed(1)} ${mapY(v).toFixed(1)}`);
        started = true;
      });
      return cmds.join(' ');
    };
    return {
      BTC: build('BTC'),
      SPX: build('SPX'),
      GOLD: build('GOLD'),
      ETH: build('ETH'),
      KAS: build('KAS')
    };
  }, [seriesData, mapX, mapY]);

  const yGridTicks = useMemo(() => {
    let raw: number[];
    if (useLogScale && minVal < 0.04) {
      const widePowers = [1e-6, 1e-5, 1e-4, 1e-3, 1e-2, 0.1, 1, 10, 100, 1000];
      raw = widePowers.filter((t) => t >= minVal * 0.75 && t <= maxVal * 1.15);
      if (raw.length < 2) raw = [minVal, 1.0, maxVal];
    } else {
      raw = buildNiceYGridTicks(minVal, maxVal, useLogScale);
    }
    if (raw.length <= 6) return raw;
    const breakeven = raw.find((t) => Math.abs(t - 1.0) < 0.001);
    const kept: number[] = [];
    if (breakeven !== undefined) kept.push(breakeven);
    for (const t of raw) {
      if (breakeven !== undefined && Math.abs(t - breakeven) < 0.001) continue;
      const y = mapY(t);
      if (kept.every((k) => Math.abs(mapY(k) - y) >= 22)) {
        kept.push(t);
      }
    }
    return kept.sort((a, b) => a - b);
  }, [minVal, maxVal, useLogScale, mapY]);

  const toggleSeries = (key: BtcSeriesKey) => {
    setVisibleSeries((prev) => {
      const enabledCount = ALL_SERIES_KEYS.filter((k) => prev[k]).length;
      if (prev[key] && enabledCount <= 1) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const xLabelStride =
    seriesData.length > 10 && chartWidth < 560
      ? 3
      : seriesData.length > 12 && chartWidth < 860
      ? 2
      : 1;

  const activeIdx =
    hoverIdx !== null && hoverIdx >= 0 && hoverIdx < seriesData.length
      ? hoverIdx
      : Math.max(0, seriesData.length - 1);
  const activePoint = seriesData[activeIdx] || seriesData[0];

  return (
    <div className="rounded-2xl bg-[#07080A] border border-white/[0.08] p-4 sm:p-5 space-y-3">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 min-h-[28px]">
          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 leading-tight">
            KAS • ETH • S&amp;P 500 • GOLD VS. BITCOIN ($BTC) ({headingLabel})
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <div className="p-0.5 rounded-full bg-[#121418] border border-white/10 flex items-center font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setComparisonMode('PRICED_IN_BTC')}
                className={`px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 whitespace-nowrap ${
                  comparisonMode === 'PRICED_IN_BTC'
                    ? 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/40'
                    : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                }`}
              >
                Priced in BTC (÷ BTC)
              </button>
              <button
                type="button"
                onClick={() => setComparisonMode('INDEXED')}
                className={`px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 whitespace-nowrap ${
                  comparisonMode === 'INDEXED'
                    ? 'bg-[#1D212A] text-white border-white/15'
                    : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                }`}
              >
                Indexed in USD
              </button>
            </div>

            <div className="p-0.5 rounded-full bg-[#121418] border border-white/10 flex items-center font-mono text-[10px]">
              <button
                type="button"
                onClick={() => onChangeLogScale(true)}
                className={`px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 whitespace-nowrap ${
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
                className={`px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 whitespace-nowrap ${
                  !useLogScale
                    ? 'bg-[#1D212A] text-white border-white/15'
                    : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                }`}
              >
                Linear Scale
              </button>
            </div>
          </div>
        </div>

        {activePoint && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tabular-nums min-h-[20px]">
            <span className="text-white font-bold">
              [
              {activePoint.raw.label} —{' '}
              {activePoint.raw.event
                .replace('vs FRED US M2', 'vs BTC')
                .replace('vs US M2', 'vs BTC')}
              ]
            </span>
            {visibleSeries.KAS && activePoint.vals.KAS !== null && (
              <span className="text-[#49EACB] font-semibold">
                KAS: {formatPctSigned((activePoint.vals.KAS - 1) * 100)} (
                {formatMultipleCompact(activePoint.vals.KAS)})
              </span>
            )}
            {visibleSeries.ETH && activePoint.vals.ETH !== null && (
              <span className="text-[#A78BFA] font-semibold">
                ETH: {formatPctSigned((activePoint.vals.ETH - 1) * 100)} (
                {formatMultipleCompact(activePoint.vals.ETH)})
              </span>
            )}
            {visibleSeries.GOLD && activePoint.vals.GOLD !== null && (
              <span className="text-[#FACC15] font-semibold">
                Gold: {formatPctSigned((activePoint.vals.GOLD - 1) * 100)} (
                {formatMultipleCompact(activePoint.vals.GOLD)})
              </span>
            )}
            {visibleSeries.SPX && activePoint.vals.SPX !== null && (
              <span className="text-[#60A5FA] font-semibold">
                S&amp;P 500: {formatPctSigned((activePoint.vals.SPX - 1) * 100)} (
                {formatMultipleCompact(activePoint.vals.SPX)})
              </span>
            )}
            {visibleSeries.BTC && activePoint.vals.BTC !== null && (
              <span className="text-[#F59E0B] font-semibold">
                {comparisonMode === 'PRICED_IN_BTC'
                  ? `BTC Base: 1.00x (${formatUsdPrice(activePoint.raw.btcPrice)})`
                  : `BTC: ${formatPctSigned((activePoint.vals.BTC - 1) * 100)} (${formatUsdPrice(activePoint.raw.btcPrice)})`}
              </span>
            )}
          </div>
        )}
      </div>

      <div
        ref={boxRef}
        onMouseLeave={() => setHoverIdx(null)}
        className="w-full overflow-hidden rounded-xl bg-[#0B0C0E] border border-white/[0.05] relative"
      >
        <svg
          width={chartWidth}
          height={svgH}
          viewBox={`0 0 ${chartWidth} ${svgH}`}
          className="block w-full select-none"
        >
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
                  stroke={isBreakeven ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.05)'}
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
                    ? `${(tickVal / 1_000_000).toFixed(tickVal % 1_000_000 === 0 ? 0 : 1)}Mx`
                    : tickVal >= 1_000
                    ? `${(tickVal / 1_000).toFixed(0)}Kx`
                    : tickVal >= 2
                    ? `${Number(tickVal.toFixed(1)).toString().replace(/\.0$/, '')}x`
                    : tickVal < 0.01
                    ? `${tickVal.toExponential(0)}x`
                    : formatPctSigned((tickVal - 1) * 100)}
                </text>
              </g>
            );
          })}

          {visibleSeries.BTC && polylines.BTC && (
            <path
              d={polylines.BTC}
              fill="none"
              stroke={BTC_SERIES_META.BTC.color}
              strokeWidth="2.2"
              strokeDasharray="6 4"
              strokeOpacity="0.95"
            />
          )}

          {visibleSeries.SPX && polylines.SPX && (
            <path
              d={polylines.SPX}
              fill="none"
              stroke={BTC_SERIES_META.SPX.color}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          )}

          {visibleSeries.GOLD && polylines.GOLD && (
            <path
              d={polylines.GOLD}
              fill="none"
              stroke={BTC_SERIES_META.GOLD.color}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          )}

          {visibleSeries.ETH && polylines.ETH && (
            <path
              d={polylines.ETH}
              fill="none"
              stroke={BTC_SERIES_META.ETH.color}
              strokeWidth="2.3"
              strokeLinecap="round"
            />
          )}

          {visibleSeries.KAS && polylines.KAS && (
            <path
              d={polylines.KAS}
              fill="none"
              stroke={BTC_SERIES_META.KAS.color}
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          )}

          {seriesData.map((pt, idx) => {
            const x = mapX(idx);
            const isActive = idx === activeIdx;
            const isLast = idx === seriesData.length - 1;
            const showLabel = isActive || isLast || idx % xLabelStride === 0;
            const colW = plotW / Math.max(1, seriesData.length - 1);

            return (
              <g key={`${pt.raw.label}-${idx}`}>
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

                {(isActive || isLast) &&
                  (['BTC', 'SPX', 'GOLD', 'ETH', 'KAS'] as BtcSeriesKey[]).map((key) => {
                    const val = pt.vals[key];
                    if (!visibleSeries[key] || val === null || !Number.isFinite(val)) return null;
                    return (
                      <circle
                        key={key}
                        cx={x}
                        cy={mapY(val)}
                        r={isActive ? 4.5 : 3}
                        fill="#0B0C0E"
                        stroke={BTC_SERIES_META[key].color}
                        strokeWidth={isActive ? 2.4 : 1.8}
                      />
                    );
                  })}

                {showLabel && (
                  <text
                    x={x}
                    y={svgH - 11}
                    textAnchor="middle"
                    fill={isActive ? '#FFFFFF' : '#6B7280'}
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight={isActive ? '700' : '400'}
                  >
                    {pt.raw.label}
                  </text>
                )}

                <rect
                  x={x - colW / 2}
                  y={0}
                  width={colW}
                  height={svgH}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() =>
                    setHoverIdx((prev) => (prev === idx ? prev : idx))
                  }
                  onClick={() => setHoverIdx(idx)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px]">
        <div className="flex flex-wrap items-center gap-2">
          {ALL_SERIES_KEYS.map((key) => {
            const meta = BTC_SERIES_META[key];
            const isOn = visibleSeries[key];
            const latestVal = seriesData[seriesData.length - 1]?.vals[key] ?? null;
            const isPreGenesis = latestVal === null;
            return (
              <button
                key={key}
                type="button"
                disabled={isPreGenesis}
                onClick={() => toggleSeries(key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors duration-150 whitespace-nowrap ${
                  isPreGenesis
                    ? 'bg-[#0B0C0E] text-neutral-600 border-white/[0.04] opacity-50 cursor-not-allowed'
                    : isOn
                    ? 'bg-[#121418] text-neutral-100 border-white/15'
                    : 'bg-[#0B0C0E] text-neutral-500 border-white/[0.06] opacity-60'
                }`}
              >
                <span
                  className={`w-3 inline-block ${
                    meta.dashed ? 'border-t-2 border-dashed' : 'h-0.5'
                  }`}
                  style={
                    meta.dashed
                      ? { borderColor: meta.color }
                      : { backgroundColor: meta.color }
                  }
                />
                <span style={{ color: isOn && !isPreGenesis ? meta.color : undefined }}>
                  {meta.ticker}
                </span>
                <span className="text-neutral-400 tabular-nums">
                  {isPreGenesis
                    ? '(Pre-Genesis)'
                    : key === 'BTC' && comparisonMode === 'PRICED_IN_BTC'
                    ? '(1.00x Base)'
                    : `(${formatPctSigned((latestVal - 1) * 100)})`}
                </span>
              </button>
            );
          })}
        </div>
        <span className="text-neutral-500">
          Click legend items to isolate series • {beatsBtcCount}/{cohortMatrixCount} Audited Assets Beat BTC
        </span>
      </div>
    </div>
  );
});

export const BtcBenchmarkPanel = memo(function BtcBenchmarkPanel({
  horizon,
  timelineYear = 'PRESENT',
  useLogScale,
  onChangeLogScale,
  dataset,
  cohortRecord,
  liveSpots,
  feedMode,
  allocPerAsset,
  onSelectOrAuditTicker
}: BtcBenchmarkPanelProps) {
  const [matrixScope, setMatrixScope] = useState<'CORE' | 'ALL'>('ALL');

  const rawPoints = useMemo(
    () => resolveBenchmarkSeriesForTimeline(dataset, timelineYear, horizon),
    [dataset, timelineYear, horizon]
  );

  const summary = useMemo(
    () =>
      computeBtcHorizonSummary({
        points: rawPoints,
        horizon,
        timelineYear,
        cohortRecord,
        liveSpots,
        feedMode
      }),
    [rawPoints, horizon, timelineYear, cohortRecord, liveSpots, feedMode]
  );

  const cohortLookup = useMemo(() => {
    const map = new Map<string, { grade: string; score: number; side: 'PASSED' | 'FAILED' }>();
    for (const p of cohortRecord.passed) {
      map.set(p.ticker, { grade: p.grade, score: p.auditScore, side: 'PASSED' });
    }
    for (const f of cohortRecord.failed) {
      map.set(f.ticker, { grade: f.grade, score: f.auditScore, side: 'FAILED' });
    }
    return map;
  }, [cohortRecord]);

  const cardsSource = summary.coreCards || summary.assets;
  const kasSummary = cardsSource.find((a) => a.key === 'KAS');
  const ethSummary = cardsSource.find((a) => a.key === 'ETH');
  const goldSummary = cardsSource.find((a) => a.key === 'GOLD');
  const spxSummary = cardsSource.find((a) => a.key === 'SPX');

  const kasMeta = cohortLookup.get('KAS');
  const ethMeta = cohortLookup.get('ETH');
  const goldMeta = cohortLookup.get('XAU');

  const coreMatrixRows: BtcMatrixAssetItem[] = useMemo(
    () =>
      summary.assets.map((a) => {
        const auditTk = a.key === 'SPX' ? null : a.key === 'GOLD' ? 'XAU' : a.ticker;
        const found = auditTk ? cohortLookup.get(auditTk) : undefined;
        return {
          id: `CORE:${a.key}`,
          ticker: a.ticker,
          auditTicker: auditTk,
          name: a.name,
          grade:
            found?.grade ??
            (a.key === 'KAS' ? 'A+' : a.key === 'GOLD' ? 'B' : a.key === 'ETH' ? 'F' : 'INDEX'),
          side:
            found?.side ??
            (a.key === 'ETH' ? 'FAILED' : a.key === 'SPX' ? 'MACRO' : 'PASSED'),
          color: a.color,
          isIndexPoints: a.key === 'SPX',
          windowNote: a.windowNote,
          startPrice: a.startPrice,
          currentPrice: a.currentPrice,
          nominalMult: a.nominalMult,
          nominalPct: a.nominalPct,
          btcAdjustedMult: a.btcAdjustedMult,
          btcAdjustedPct: a.btcAdjustedPct,
          beatsBtc: a.beatsBtc
        };
      }),
    [summary.assets, cohortLookup]
  );

  const visibleMatrixRows = matrixScope === 'ALL' ? summary.cohortMatrix : coreMatrixRows;
  const beatsBtcCount = summary.cohortMatrix.filter((r) => r.beatsBtc).length;
  const windowTag = summary.windowTag || "Jul '10 Genesis";
  const headingLabel = summary.headingLabel || "ALL-TIME GENESIS (JUL '10) → LIVE SPOT";

  return (
    <div className="space-y-5" data-testid="btc-benchmark-panel" data-timeline-year={timelineYear}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            title: 'KASPA ($KAS) VS. BTC',
            badge: kasMeta ? `${kasMeta.grade} • ${formatScore(kasMeta.score)}` : 'Pre-Genesis',
            item: kasSummary,
            accent: '#49EACB',
            grad: 'linear-gradient(135deg, #49EACB 0%, #34D399 100%)'
          },
          {
            title: 'ETHEREUM ($ETH) VS. BTC',
            badge: ethMeta ? `${ethMeta.grade} • ${formatScore(ethMeta.score)}` : 'Pre-Genesis',
            item: ethSummary,
            accent: '#A78BFA',
            grad: 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 100%)'
          },
          {
            title: 'GOLD ($XAU) VS. BTC',
            badge: goldMeta ? `${goldMeta.grade} • ${formatScore(goldMeta.score)}` : 'B • 4.1',
            item: goldSummary,
            accent: '#FACC15',
            grad: 'linear-gradient(135deg, #FEF08A 0%, #EAB308 100%)'
          }
        ].map((card) => {
          const item = card.item;
          const isUnavailable = item?.available === false;
          return (
            <div
              key={card.title}
              className={`rounded-2xl bg-[#0B0C0E] p-4 space-y-1 min-w-0 overflow-hidden border ${
                isUnavailable ? 'opacity-70' : ''
              }`}
              style={{ borderColor: isUnavailable ? 'rgba(255,255,255,0.08)' : `${card.accent}40` }}
            >
              <div
                className="font-mono text-[10px] uppercase tracking-wider flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5"
                style={{ color: isUnavailable ? '#9CA3AF' : card.accent }}
              >
                <span>{card.title}</span>
                <span className="shrink-0 opacity-85">
                  {isUnavailable ? 'N/A' : card.badge}
                </span>
              </div>
              {isUnavailable ? (
                <>
                  <div className="font-display text-xl sm:text-2xl font-bold text-neutral-500 leading-tight">
                    Pre-Genesis
                  </div>
                  <div className="font-mono text-[11px] text-neutral-500 leading-snug">
                    {item?.launchNote || `Not yet launched in ${timelineYear}`}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span
                      className="font-display text-2xl sm:text-3xl font-bold leading-tight tabular-nums"
                      style={{
                        backgroundImage: card.grad,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      {formatPctSigned(item?.btcAdjustedPct ?? null)}
                    </span>
                    <span
                      className={`font-mono text-xs font-semibold whitespace-nowrap tabular-nums ${
                        item?.beatsBtc ? 'text-[#34D399]' : 'text-[#F97316]'
                      }`}
                    >
                      (₿ {formatMultipleCompact(item?.btcAdjustedMult ?? 0)})
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-neutral-400 leading-snug tabular-nums">
                    <span className="text-neutral-200 font-semibold">
                      {formatPctSigned(item?.nominalPct ?? null)} in USD
                    </span>{' '}
                    • {formatMultipleCompact(item?.nominalMult ?? 0)}
                    {item?.windowNote ? (
                      <span className="whitespace-nowrap">
                        {' '}
                        · {item.windowNote.replace(/^Since\s+/i, '')}
                      </span>
                    ) : null}
                  </div>
                  <div
                    className="pt-1.5 mt-1 border-t border-white/[0.06] font-mono text-[10.5px] xl:text-[11px] flex flex-wrap items-center justify-between gap-x-1.5 gap-y-0.5 tabular-nums"
                    data-testid="btc-kpi-sim-outcome"
                  >
                    <span className="text-neutral-200 font-semibold whitespace-nowrap">
                      ${allocPerAsset.toLocaleString()} →{' '}
                      {formatSimOutcomeUsd(allocPerAsset * (item?.nominalMult ?? 0))}
                    </span>
                    <span
                      className={`font-semibold whitespace-nowrap ${
                        item?.beatsBtc ? 'text-[#34D399]' : 'text-[#F97316]'
                      }`}
                    >
                      ({formatSimOutcomeUsd(allocPerAsset * (item?.btcAdjustedMult ?? 0))} vs BTC)
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}

        <div className="rounded-2xl bg-[#0B0C0E] border border-[#60A5FA]/35 p-4 space-y-1 min-w-0 overflow-hidden">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#60A5FA] flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
            <span>S&amp;P 500 VS. BITCOIN</span>
            <span className="shrink-0 text-[#F59E0B] tabular-nums">
              BTC {formatPctSigned(summary.btcPct)}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className="font-display text-2xl sm:text-3xl font-bold leading-tight tabular-nums"
              style={{
                backgroundImage: 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {formatPctSigned(spxSummary?.btcAdjustedPct ?? null)}
            </span>
            <span
              className={`font-mono text-xs font-semibold whitespace-nowrap tabular-nums ${
                spxSummary?.beatsBtc ? 'text-[#34D399]' : 'text-[#F97316]'
              }`}
            >
              (₿ {formatMultipleCompact(spxSummary?.btcAdjustedMult ?? 0)})
            </span>
          </div>
          <div className="font-mono text-[11px] text-neutral-400 leading-snug tabular-nums">
            <span className="text-neutral-200 font-semibold">
              {formatPctSigned(spxSummary?.nominalPct ?? null)} in USD
            </span>{' '}
            • {formatMultipleCompact(spxSummary?.nominalMult ?? 0)}
            {spxSummary?.windowNote ? (
              <span className="whitespace-nowrap">
                {' '}
                · {spxSummary.windowNote.replace(/^Since\s+/i, '')}
              </span>
            ) : null}
          </div>
          <div
            className="pt-1.5 mt-1 border-t border-white/[0.06] font-mono text-[10.5px] xl:text-[11px] flex flex-wrap items-center justify-between gap-x-1.5 gap-y-0.5 tabular-nums"
            data-testid="btc-kpi-sim-outcome"
          >
            <span className="text-neutral-200 font-semibold whitespace-nowrap">
              ${allocPerAsset.toLocaleString()} →{' '}
              {formatSimOutcomeUsd(allocPerAsset * (spxSummary?.nominalMult ?? 0))}
            </span>
            <span
              className={`font-semibold whitespace-nowrap ${
                spxSummary?.beatsBtc ? 'text-[#34D399]' : 'text-[#F97316]'
              }`}
            >
              ({formatSimOutcomeUsd(allocPerAsset * (spxSummary?.btcAdjustedMult ?? 0))} vs BTC)
            </span>
          </div>
        </div>
      </div>

      <BtcInteractiveChartCard
        horizon={horizon}
        timelineYear={timelineYear}
        useLogScale={useLogScale}
        onChangeLogScale={onChangeLogScale}
        rawPoints={rawPoints}
        headingLabel={headingLabel}
        beatsBtcCount={beatsBtcCount}
        cohortMatrixCount={summary.cohortMatrix.length}
      />

      <div
        className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-3"
        data-testid="btc-purchasing-power-matrix"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/[0.07]">
          <div className="font-mono text-xs font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
            <span>
              PURCHASING POWER MATRIX VS. BITCOIN ($BTC) ({formatPctSigned(summary.btcPct)})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="font-mono text-[10.5px] text-neutral-400 tabular-nums"
              data-testid="btc-matrix-baseline-label"
            >
              BTC ({windowTag} → Spot): {formatUsdPrice(summary.btcStartPrice)} →{' '}
              {formatUsdPrice(summary.btcEndPrice)}
            </span>
            <div className="p-0.5 rounded-full bg-[#121418] border border-white/10 flex items-center font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setMatrixScope('ALL')}
                className={`px-2 py-0.5 rounded-full border font-semibold transition-colors duration-150 whitespace-nowrap ${
                  matrixScope === 'ALL'
                    ? 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/35'
                    : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                }`}
              >
                All Baskets ({summary.cohortMatrix.length})
              </button>
              <button
                type="button"
                onClick={() => setMatrixScope('CORE')}
                className={`px-2 py-0.5 rounded-full border font-semibold transition-colors duration-150 whitespace-nowrap ${
                  matrixScope === 'CORE'
                    ? 'bg-[#1D212A] text-white border-white/15'
                    : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                }`}
              >
                Core ({coreMatrixRows.length})
              </button>
            </div>
          </div>
        </div>

        {matrixScope === 'ALL' &&
          ((summary.passedBasketSummary?.count ?? 0) > 0 ||
            (summary.failedBasketSummary?.count ?? 0) > 0) && (
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-2.5"
              data-testid="btc-basket-cohort-summary"
            >
              {summary.passedBasketSummary && summary.passedBasketSummary.count > 0 && (
                <div className="rounded-xl bg-[#121418] border border-[#49EACB]/30 p-3 space-y-1">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#49EACB] flex items-center justify-between gap-2">
                    <span>PASSED // E &gt; 0 BASKET VS. BTC</span>
                    <span className="text-neutral-400 normal-case tracking-normal">
                      Ex-BTC • {summary.passedBasketSummary.count} Liquid
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 tabular-nums">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-lg sm:text-xl font-bold text-[#49EACB]">
                        {formatPctSigned(summary.passedBasketSummary.avgAdjustedPct)}
                      </span>
                      <span className="font-mono text-[11px] text-neutral-300">
                        (₿ {formatMultipleCompact(summary.passedBasketSummary.avgAdjustedMult)})
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-neutral-400">
                      {summary.passedBasketSummary.beatsCount}/{summary.passedBasketSummary.count}{' '}
                      Beat BTC • Avg Nominal{' '}
                      <strong className="text-neutral-200">
                        {formatPctSigned(summary.passedBasketSummary.avgNominalPct)}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              {summary.failedBasketSummary && summary.failedBasketSummary.count > 0 && (
                <div className="rounded-xl bg-[#121418] border border-[#EF4444]/30 p-3 space-y-1">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#EF4444] flex items-center justify-between gap-2">
                    <span>FAILED // E = 0 BASKET VS. BTC</span>
                    <span className="text-neutral-400 normal-case tracking-normal">
                      {summary.failedBasketSummary.count} Liquid
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 tabular-nums">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-lg sm:text-xl font-bold text-[#EF4444]">
                        {formatPctSigned(summary.failedBasketSummary.avgAdjustedPct)}
                      </span>
                      <span className="font-mono text-[11px] text-neutral-400">
                        (₿ {formatMultipleCompact(summary.failedBasketSummary.avgAdjustedMult)})
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-neutral-400">
                      {summary.failedBasketSummary.beatsCount}/{summary.failedBasketSummary.count}{' '}
                      Beat BTC • Avg Nominal{' '}
                      <strong className="text-neutral-200">
                        {formatPctSigned(summary.failedBasketSummary.avgNominalPct)}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {visibleMatrixRows.map((asset) => {
            const canAudit = Boolean(asset.auditTicker);
            const nominalEndUsd = allocPerAsset * asset.nominalMult;
            const btcAdjustedEndUsd = allocPerAsset * asset.btcAdjustedMult;
            const sideBadgeClass =
              asset.side === 'PASSED'
                ? 'bg-[#49EACB]/10 text-[#49EACB] border-[#49EACB]/30'
                : asset.side === 'FAILED'
                ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                : 'bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/30';
            const sideBadgeLabel =
              asset.side === 'PASSED' ? 'E > 0' : asset.side === 'FAILED' ? 'E = 0' : 'INDEX';

            const inner = (
              <div className="flex flex-col gap-2.5 font-mono text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: asset.color }}
                    />
                    <span className="text-[13px] font-bold text-white truncate">{asset.name}</span>
                    <span className="text-[11px] text-neutral-500 shrink-0">
                      ({asset.ticker}
                      {asset.grade !== 'INDEX' ? ` · ${asset.grade}` : ''})
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold border shrink-0 whitespace-nowrap ${sideBadgeClass}`}
                    >
                      {sideBadgeLabel}
                    </span>
                    {asset.windowNote && (
                      <span className="text-[10px] text-neutral-500 hidden sm:inline shrink-0">
                        · {asset.windowNote}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 whitespace-nowrap tabular-nums ${
                      asset.beatsBtc
                        ? 'bg-[#34D399]/12 text-[#34D399] border-[#34D399]/35'
                        : 'bg-[#F97316]/12 text-[#F97316] border-[#F97316]/35'
                    }`}
                  >
                    {asset.beatsBtc ? 'Beats BTC' : 'Lags BTC'} (
                    {formatPctSigned(asset.btcAdjustedPct)})
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px]">
                  <span className="text-neutral-400 tabular-nums">
                    {formatMatrixPrice(asset.startPrice, asset.isIndexPoints)} →{' '}
                    <strong className="text-neutral-200">
                      {formatMatrixPrice(asset.currentPrice, asset.isIndexPoints)}
                    </strong>
                  </span>
                  <div className="flex items-center gap-1.5 tabular-nums">
                    <span style={{ color: asset.color }} className="font-bold">
                      Nominal {formatPctSigned(asset.nominalPct)}
                    </span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-neutral-300">
                      ${allocPerAsset.toLocaleString()} → {formatSimOutcomeUsd(nominalEndUsd)} (
                      {formatSimOutcomeUsd(btcAdjustedEndUsd)} vs BTC)
                    </span>
                  </div>
                </div>
              </div>
            );

            return canAudit ? (
              <button
                key={asset.id}
                type="button"
                onClick={() => onSelectOrAuditTicker(asset.auditTicker!)}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 84px' }}
                className="w-full text-left rounded-xl bg-[#121418] hover:bg-[#171B22] border border-white/[0.07] hover:border-[#F59E0B]/35 p-3.5 transition-colors duration-150"
              >
                {inner}
              </button>
            ) : (
              <div
                key={asset.id}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 84px' }}
                className="w-full text-left rounded-xl bg-[#121418] border border-white/[0.07] p-3.5"
              >
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
