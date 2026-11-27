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
  M2_SERIES_META,
  computeM2AssetSummaries,
  formatM2SupplyLabel,
  resolveBenchmarkSeriesForTimeline,
  transformM2PointNullable,
  type M2BenchmarkDataset,
  type M2ChartPoint,
  type M2ComparisonMode,
  type M2MatrixAssetItem,
  type M2SeriesKey,
  type MacroM2HorizonKey
} from '../data/m2BenchmarkData.ts';
import type { GlobalTimelineYear } from '../data/globalTimeMachine.ts';
import { formatScore } from '../data/rubricSpec.ts';

export interface M2BenchmarkPanelProps {
  horizon: MacroM2HorizonKey;
  timelineYear?: GlobalTimelineYear;
  cohortRecord?: GainsCohortRecord;
  liveSpots?: Record<string, number>;
  feedMode?: 'SNAPSHOT' | 'LIVE';
  useLogScale: boolean;
  onChangeLogScale: (next: boolean) => void;
  dataset: M2BenchmarkDataset;
  allocPerAsset: number;
  onSelectOrAuditTicker: (ticker: string) => void;
}

const ALL_SERIES_KEYS: M2SeriesKey[] = ['KAS', 'BTC', 'GOLD', 'SPX', 'M2'];

function formatM2MatrixPrice(val: number, isIndexPoints?: boolean): string {
  if (isIndexPoints) {
    return val.toLocaleString(undefined, { maximumFractionDigits: val < 100 ? 1 : 0 });
  }
  return formatUsdPrice(val);
}

interface M2ChartCardProps {
  horizon: MacroM2HorizonKey;
  timelineYear: GlobalTimelineYear;
  useLogScale: boolean;
  onChangeLogScale: (next: boolean) => void;
  rawPoints: M2ChartPoint[];
  headingLabel: string;
  sourceLabel: string;
  beatsM2Count: number;
  cohortMatrixCount: number;
}

const M2InteractiveChartCard = memo(function M2InteractiveChartCard({
  horizon,
  timelineYear,
  useLogScale,
  onChangeLogScale,
  rawPoints,
  headingLabel,
  sourceLabel,
  beatsM2Count,
  cohortMatrixCount
}: M2ChartCardProps) {
  const [comparisonMode, setComparisonMode] = useState<M2ComparisonMode>('REAL_DIV_M2');
  const [visibleSeries, setVisibleSeries] = useState<Record<M2SeriesKey, boolean>>({
    KAS: true,
    BTC: true,
    GOLD: true,
    SPX: true,
    M2: true
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
        vals: transformM2PointNullable(pt, comparisonMode)
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

  const { minVal, maxVal } = useMemo(() => {
    const activeKeys = ALL_SERIES_KEYS.filter((k) => visibleSeries[k]);
    const allPlotVals = seriesData.flatMap((d) =>
      activeKeys
        .map((k) => d.vals[k])
        .filter((v): v is number => v !== null && Number.isFinite(v))
        .concat([1.0])
    );
    return {
      minVal: Math.max(0.04, Math.min(...allPlotVals) * 0.9),
      maxVal: Math.max(1.05, ...allPlotVals) * 1.1
    };
  }, [seriesData, visibleSeries]);

  const mapX = useCallback(
    (idx: number) => {
      if (seriesData.length <= 1) return padL + plotW / 2;
      return padL + (idx / (seriesData.length - 1)) * plotW;
    },
    [seriesData.length, padL, plotW]
  );

  const mapY = useCallback(
    (mult: number) => {
      const safeMult = Number.isFinite(mult) ? Math.max(0.01, mult) : 1.0;
      if (useLogScale) {
        const lo = Math.log10(Math.max(0.04, minVal));
        const hi = Math.log10(Math.max(minVal * 1.15, maxVal));
        const v = Math.log10(Math.max(0.04, safeMult));
        const frac = (v - lo) / Math.max(0.0001, hi - lo);
        return padT + plotH - frac * plotH;
      }
      const frac = (safeMult - minVal) / Math.max(0.01, maxVal - minVal);
      return padT + plotH - frac * plotH;
    },
    [useLogScale, minVal, maxVal, padT, plotH]
  );

  const polylines = useMemo(() => {
    const build = (key: M2SeriesKey) => {
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
      M2: build('M2'),
      SPX: build('SPX'),
      GOLD: build('GOLD'),
      BTC: build('BTC'),
      KAS: build('KAS')
    };
  }, [seriesData, mapX, mapY]);

  const yGridTicks = useMemo(() => {
    const raw = buildNiceYGridTicks(minVal, maxVal, useLogScale);
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

  const toggleSeries = (key: M2SeriesKey) => {
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
            BTC • KAS • S&amp;P 500 • GOLD VS. US M2 MONEY SUPPLY ({headingLabel})
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <div className="p-0.5 rounded-full bg-[#121418] border border-white/10 flex items-center font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setComparisonMode('REAL_DIV_M2')}
                className={`px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 whitespace-nowrap ${
                  comparisonMode === 'REAL_DIV_M2'
                    ? 'bg-[#49EACB]/15 text-[#49EACB] border-[#49EACB]/35'
                    : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                }`}
              >
                Deflated ÷ M2
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
        </div>

        {activePoint && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tabular-nums min-h-[20px]">
            <span className="text-white font-bold">
              [{activePoint.raw.label} — {activePoint.raw.event}]
            </span>
            {visibleSeries.KAS && activePoint.vals.KAS !== null && (
              <span className="text-[#49EACB] font-semibold">
                KAS: {formatPctSigned((activePoint.vals.KAS - 1) * 100)} (
                {formatMultipleCompact(activePoint.vals.KAS)})
              </span>
            )}
            {visibleSeries.BTC && activePoint.vals.BTC !== null && (
              <span className="text-[#F59E0B] font-semibold">
                BTC: {formatPctSigned((activePoint.vals.BTC - 1) * 100)} (
                {formatMultipleCompact(activePoint.vals.BTC)})
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
            {visibleSeries.M2 && activePoint.vals.M2 !== null && (
              <span className="text-neutral-300">
                {comparisonMode === 'REAL_DIV_M2'
                  ? `M2 Base: 1.00x (${formatM2SupplyLabel(activePoint.raw.m2Trillions)})`
                  : `US M2: ${formatPctSigned((activePoint.vals.M2 - 1) * 100)} (${formatM2SupplyLabel(activePoint.raw.m2Trillions)})`}
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
                    : formatPctSigned((tickVal - 1) * 100)}
                </text>
              </g>
            );
          })}

          {visibleSeries.M2 && polylines.M2 && (
            <path
              d={polylines.M2}
              fill="none"
              stroke={M2_SERIES_META.M2.color}
              strokeWidth="2"
              strokeDasharray="6 4"
              strokeOpacity="0.9"
            />
          )}

          {visibleSeries.SPX && polylines.SPX && (
            <path
              d={polylines.SPX}
              fill="none"
              stroke={M2_SERIES_META.SPX.color}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          )}

          {visibleSeries.GOLD && polylines.GOLD && (
            <path
              d={polylines.GOLD}
              fill="none"
              stroke={M2_SERIES_META.GOLD.color}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          )}

          {visibleSeries.BTC && polylines.BTC && (
            <path
              d={polylines.BTC}
              fill="none"
              stroke={M2_SERIES_META.BTC.color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {visibleSeries.KAS && polylines.KAS && (
            <path
              d={polylines.KAS}
              fill="none"
              stroke={M2_SERIES_META.KAS.color}
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
                  (['M2', 'SPX', 'GOLD', 'BTC', 'KAS'] as M2SeriesKey[]).map((key) => {
                    const val = pt.vals[key];
                    if (!visibleSeries[key] || val === null || !Number.isFinite(val)) return null;
                    return (
                      <circle
                        key={key}
                        cx={x}
                        cy={mapY(val)}
                        r={isActive ? 4.5 : 3}
                        fill="#0B0C0E"
                        stroke={M2_SERIES_META[key].color}
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
            const meta = M2_SERIES_META[key];
            const isOn = visibleSeries[key];
            const latestVal = seriesData[seriesData.length - 1]?.vals[key] ?? null;
            const isPreGenesis = latestVal === null;
            return (
              <button
                key={key}
                type="button"
                disabled={isPreGenesis}
                onClick={() => toggleSeries(key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors duration-150 ${
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
                    : key === 'M2' && comparisonMode === 'REAL_DIV_M2'
                    ? '(1.00x Base)'
                    : `(${formatPctSigned((latestVal - 1) * 100)})`}
                </span>
              </button>
            );
          })}
        </div>
        <span className="text-neutral-500">
          Click legend items to isolate series • {beatsM2Count}/{cohortMatrixCount} Audited Assets Beat US M2 • {sourceLabel}
        </span>
      </div>
    </div>
  );
});

export const M2BenchmarkPanel = memo(function M2BenchmarkPanel({
  horizon,
  timelineYear = 'PRESENT',
  cohortRecord,
  liveSpots = {},
  feedMode = 'LIVE',
  useLogScale,
  onChangeLogScale,
  dataset,
  allocPerAsset,
  onSelectOrAuditTicker
}: M2BenchmarkPanelProps) {
  const [matrixScope, setMatrixScope] = useState<'CORE' | 'ALL'>('ALL');

  const rawPoints = useMemo(
    () => resolveBenchmarkSeriesForTimeline(dataset, timelineYear, horizon),
    [dataset, timelineYear, horizon]
  );

  const summary = useMemo(
    () =>
      computeM2AssetSummaries(rawPoints, timelineYear, horizon, {
        cohortRecord,
        liveSpots,
        feedMode
      }),
    [rawPoints, timelineYear, horizon, cohortRecord, liveSpots, feedMode]
  );

  const cohortLookup = useMemo(() => {
    const map = new Map<string, { grade: string; score: number; side: 'PASSED' | 'FAILED' }>();
    if (!cohortRecord) return map;
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
  const btcSummary = cardsSource.find((a) => a.key === 'BTC');
  const goldSummary = cardsSource.find((a) => a.key === 'GOLD');
  const spxSummary = cardsSource.find((a) => a.key === 'SPX');

  const kasMeta = cohortLookup.get('KAS');
  const btcMeta = cohortLookup.get('BTC');
  const goldMeta = cohortLookup.get('XAU');

  const coreMatrixRows: M2MatrixAssetItem[] = useMemo(
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
            (a.key === 'KAS' ? 'A+' : a.key === 'BTC' ? 'B+' : a.key === 'GOLD' ? 'B' : 'INDEX'),
          side: found?.side ?? (a.key === 'SPX' ? 'MACRO' : 'PASSED'),
          color: a.color,
          isIndexPoints: a.key === 'SPX',
          windowNote: a.windowNote,
          startPrice: a.startPrice,
          currentPrice: a.currentPrice,
          nominalMult: a.nominalMult,
          nominalPct: a.nominalPct,
          m2AdjustedMult: a.m2AdjustedMult,
          m2AdjustedPct: a.m2AdjustedPct,
          beatsM2: a.beatsM2
        };
      }),
    [summary.assets, cohortLookup]
  );

  const visibleMatrixRows = matrixScope === 'ALL' ? summary.cohortMatrix : coreMatrixRows;
  const beatsM2Count = summary.cohortMatrix.filter((r) => r.beatsM2).length;
  const headingLabel = summary.headingLabel || "ALL-TIME GENESIS (JUL '10) → LIVE SPOT";
  const windowTag = summary.windowTag || "Jul '10 Genesis";

  return (
    <div className="space-y-5" data-testid="m2-benchmark-panel" data-timeline-year={timelineYear}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            title: 'KASPA ($KAS) VS. M2',
            badge: kasMeta ? `${kasMeta.grade} • ${formatScore(kasMeta.score)}` : 'A+ • 6.0',
            item: kasSummary,
            accent: '#49EACB',
            grad: 'linear-gradient(135deg, #49EACB 0%, #34D399 100%)'
          },
          {
            title: 'BITCOIN ($BTC) VS. M2',
            badge: btcMeta ? `${btcMeta.grade} • ${formatScore(btcMeta.score)}` : 'B+ • 4.4',
            item: btcSummary,
            accent: '#F59E0B',
            grad: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)'
          },
          {
            title: 'GOLD ($XAU) VS. M2',
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
                      {formatPctSigned(item?.m2AdjustedPct ?? null)}
                    </span>
                    <span
                      className={`font-mono text-xs font-semibold whitespace-nowrap tabular-nums ${
                        item?.beatsM2 ? 'text-[#34D399]' : 'text-[#F97316]'
                      }`}
                    >
                      ({formatMultipleCompact(item?.m2AdjustedMult ?? 0)} real)
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
                    data-testid="m2-kpi-sim-outcome"
                  >
                    <span className="text-neutral-200 font-semibold whitespace-nowrap">
                      ${allocPerAsset.toLocaleString()} →{' '}
                      {formatSimOutcomeUsd(allocPerAsset * (item?.nominalMult ?? 0))}
                    </span>
                    <span
                      className={`font-semibold whitespace-nowrap ${
                        item?.beatsM2 ? 'text-[#34D399]' : 'text-[#F97316]'
                      }`}
                    >
                      ({formatSimOutcomeUsd(allocPerAsset * (item?.m2AdjustedMult ?? 0))} real)
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}

        <div className="rounded-2xl bg-[#0B0C0E] border border-[#60A5FA]/35 p-4 space-y-1 min-w-0 overflow-hidden">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#60A5FA] flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
            <span>S&amp;P 500 VS. US M2</span>
            <span className="shrink-0 text-neutral-400 tabular-nums">
              M2 {formatPctSigned(summary.m2Pct)}
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
              {formatPctSigned(spxSummary?.m2AdjustedPct ?? null)}
            </span>
            <span
              className={`font-mono text-xs font-semibold whitespace-nowrap tabular-nums ${
                spxSummary?.beatsM2 ? 'text-[#34D399]' : 'text-[#F97316]'
              }`}
            >
              ({formatMultipleCompact(spxSummary?.m2AdjustedMult ?? 0)} real)
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
            data-testid="m2-kpi-sim-outcome"
          >
            <span className="text-neutral-200 font-semibold whitespace-nowrap">
              ${allocPerAsset.toLocaleString()} →{' '}
              {formatSimOutcomeUsd(allocPerAsset * (spxSummary?.nominalMult ?? 0))}
            </span>
            <span
              className={`font-semibold whitespace-nowrap ${
                spxSummary?.beatsM2 ? 'text-[#34D399]' : 'text-[#F97316]'
              }`}
            >
              ({formatSimOutcomeUsd(allocPerAsset * (spxSummary?.m2AdjustedMult ?? 0))} real)
            </span>
          </div>
        </div>
      </div>

      <M2InteractiveChartCard
        horizon={horizon}
        timelineYear={timelineYear}
        useLogScale={useLogScale}
        onChangeLogScale={onChangeLogScale}
        rawPoints={rawPoints}
        headingLabel={headingLabel}
        sourceLabel={dataset.sourceLabel}
        beatsM2Count={beatsM2Count}
        cohortMatrixCount={summary.cohortMatrix.length}
      />

      <div
        className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-3"
        data-testid="m2-purchasing-power-matrix"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/[0.07]">
          <div className="font-mono text-xs font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#49EACB] shadow-[0_0_8px_#49EACB]" />
            <span>
              PURCHASING POWER MATRIX VS. US M2 EXPANSION ({formatPctSigned(summary.m2Pct)})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="font-mono text-[10.5px] text-neutral-400 tabular-nums"
              data-testid="m2-matrix-baseline-label"
            >
              FRED M2SL ({windowTag} → Spot): {formatM2SupplyLabel(summary.m2StartTrillions)} →{' '}
              {formatM2SupplyLabel(summary.m2EndTrillions)}
            </span>
            <div className="p-0.5 rounded-full bg-[#121418] border border-white/10 flex items-center font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setMatrixScope('ALL')}
                className={`px-2 py-0.5 rounded-full border font-semibold transition-colors duration-150 whitespace-nowrap ${
                  matrixScope === 'ALL'
                    ? 'bg-[#49EACB]/15 text-[#49EACB] border-[#49EACB]/35'
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
              data-testid="m2-basket-cohort-summary"
            >
              {summary.passedBasketSummary && summary.passedBasketSummary.count > 0 && (
                <div className="rounded-xl bg-[#121418] border border-[#49EACB]/30 p-3 space-y-1">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#49EACB] flex items-center justify-between gap-2">
                    <span>PASSED // E &gt; 0 BASKET VS. US M2</span>
                    <span className="text-neutral-400 normal-case tracking-normal">
                      {summary.passedBasketSummary.count} Liquid
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 tabular-nums">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-lg sm:text-xl font-bold text-[#49EACB]">
                        {formatPctSigned(summary.passedBasketSummary.avgAdjustedPct)}
                      </span>
                      <span className="font-mono text-[11px] text-neutral-300">
                        ({formatMultipleCompact(summary.passedBasketSummary.avgAdjustedMult)} real)
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-neutral-400">
                      {summary.passedBasketSummary.beatsCount}/{summary.passedBasketSummary.count}{' '}
                      Beat M2 • Avg Nominal{' '}
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
                    <span>FAILED // E = 0 BASKET VS. US M2</span>
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
                        ({formatMultipleCompact(summary.failedBasketSummary.avgAdjustedMult)} real)
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-neutral-400">
                      {summary.failedBasketSummary.beatsCount}/{summary.failedBasketSummary.count}{' '}
                      Beat M2 • Avg Nominal{' '}
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
            const realM2EndUsd = allocPerAsset * asset.m2AdjustedMult;
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
                      asset.beatsM2
                        ? 'bg-[#34D399]/12 text-[#34D399] border-[#34D399]/35'
                        : 'bg-[#F97316]/12 text-[#F97316] border-[#F97316]/35'
                    }`}
                  >
                    {asset.beatsM2 ? 'Beats M2' : 'Lags M2'} ({formatPctSigned(asset.m2AdjustedPct)})
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px]">
                  <span className="text-neutral-400 tabular-nums">
                    {formatM2MatrixPrice(asset.startPrice, asset.isIndexPoints)} →{' '}
                    <strong className="text-neutral-200">
                      {formatM2MatrixPrice(asset.currentPrice, asset.isIndexPoints)}
                    </strong>
                  </span>
                  <div className="flex items-center gap-1.5 tabular-nums">
                    <span style={{ color: asset.color }} className="font-bold">
                      Nominal {formatPctSigned(asset.nominalPct)}
                    </span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-neutral-300">
                      ${allocPerAsset.toLocaleString()} → {formatSimOutcomeUsd(nominalEndUsd)} (
                      {formatSimOutcomeUsd(realM2EndUsd)} real)
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
                className="w-full text-left rounded-xl bg-[#121418] hover:bg-[#171B22] border border-white/[0.07] hover:border-[#49EACB]/35 p-3.5 transition-colors duration-150"
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
