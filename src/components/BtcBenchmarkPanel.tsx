import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildNiceYGridTicks,
  formatBasketUsd,
  formatPctSigned,
  formatUsdPrice,
  type GainsCohortRecord,
  type GainsWindowHorizonKey
} from '../data/gainsCohortData.ts';
import {
  BTC_SERIES_META,
  computeBtcHorizonSummary,
  transformBtcPointForMode,
  type BtcComparisonMode,
  type BtcMatrixAssetItem,
  type BtcSeriesKey
} from '../data/btcBenchmarkData.ts';
import type { M2BenchmarkDataset, MacroM2HorizonKey } from '../data/m2BenchmarkData.ts';

export interface BtcBenchmarkPanelProps {
  horizon: MacroM2HorizonKey;
  useLogScale: boolean;
  onChangeLogScale: (next: boolean) => void;
  dataset: M2BenchmarkDataset;
  cohortRecord: GainsCohortRecord;
  liveSpots: Record<string, number>;
  feedMode: 'SNAPSHOT' | 'LIVE';
  allocPerAsset: number;
  onSelectOrAuditTicker: (ticker: string) => void;
}

const HORIZON_BTC_HEADING: Record<MacroM2HorizonKey, string> = {
  ALL_TIME: "MAY '22 COMMON LAUNCH → LIVE SPOT",
  D180: '180-DAY ROLLING WINDOW → LIVE SPOT',
  Y1: '1-YEAR ROLLING WINDOW → LIVE SPOT',
  Y2: '2-YEAR ROLLING WINDOW → LIVE SPOT',
  Y4: '4-YEAR CYCLE WINDOW → LIVE SPOT'
};

const ALL_SERIES_KEYS: BtcSeriesKey[] = ['KAS', 'ETH', 'GOLD', 'SPX', 'BTC'];

function formatMultipleCompact(mult: number): string {
  if (!Number.isFinite(mult) || mult <= 0) return '—';
  if (mult >= 1000) return `${(mult / 1000).toFixed(1).replace(/\.0$/, '')}Kx`;
  if (mult >= 100) return `${Math.round(mult).toLocaleString()}x`;
  if (mult >= 10) return `${mult.toFixed(1)}x`;
  return `${mult.toFixed(2)}x`;
}

function formatCompactBtcUsd(val: number): string {
  if (!Number.isFinite(val) || val <= 0) return '—';
  if (val >= 1000) return `$${(val / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return formatUsdPrice(val);
}

function formatMatrixPrice(val: number, isIndexPoints?: boolean): string {
  if (isIndexPoints) {
    return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  return formatUsdPrice(val);
}

export function BtcBenchmarkPanel({
  horizon,
  useLogScale,
  onChangeLogScale,
  dataset,
  cohortRecord,
  liveSpots,
  feedMode,
  allocPerAsset,
  onSelectOrAuditTicker
}: BtcBenchmarkPanelProps) {
  const [comparisonMode, setComparisonMode] = useState<BtcComparisonMode>('INDEXED');
  const [matrixScope, setMatrixScope] = useState<'CORE' | 'ALL'>('CORE');
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
  }, [horizon, comparisonMode]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 220) setChartWidth(Math.floor(w));
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

  const rawPoints = useMemo(
    () => dataset.seriesByHorizon[horizon] || dataset.seriesByHorizon.ALL_TIME,
    [dataset, horizon]
  );

  const summary = useMemo(
    () =>
      computeBtcHorizonSummary({
        points: rawPoints,
        horizon,
        cohortRecord,
        liveSpots,
        feedMode
      }),
    [rawPoints, horizon, cohortRecord, liveSpots, feedMode]
  );

  const seriesData = useMemo(
    () =>
      rawPoints.map((pt) => ({
        raw: pt,
        vals: transformBtcPointForMode(pt, comparisonMode)
      })),
    [rawPoints, comparisonMode]
  );

  const activeIdx =
    hoverIdx !== null && hoverIdx >= 0 && hoverIdx < seriesData.length
      ? hoverIdx
      : Math.max(0, seriesData.length - 1);
  const activePoint = seriesData[activeIdx] || seriesData[0];

  const svgH = 264;
  const padL = horizon === 'ALL_TIME' && visibleSeries.KAS && useLogScale ? 58 : 56;
  const padR = 20;
  const padT = 20;
  const padB = 34;
  const plotW = Math.max(180, chartWidth - padL - padR);
  const plotH = svgH - padT - padB;

  const activeKeys = ALL_SERIES_KEYS.filter((k) => visibleSeries[k]);
  const allPlotVals = seriesData.flatMap((d) =>
    activeKeys.map((k) => d.vals[k]).concat([1.0])
  );
  const minVal = Math.max(0.04, Math.min(...allPlotVals) * 0.9);
  const maxVal = Math.max(1.05, ...allPlotVals) * 1.1;

  const mapX = (idx: number) => {
    if (seriesData.length <= 1) return padL + plotW / 2;
    return padL + (idx / (seriesData.length - 1)) * plotW;
  };

  const mapY = (mult: number) => {
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
  };

  const buildPolyline = (key: BtcSeriesKey) =>
    seriesData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i).toFixed(1)} ${mapY(d.vals[key]).toFixed(1)}`)
      .join(' ');

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
  }, [minVal, maxVal, useLogScale, plotH]);

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

  const kasSummary = summary.assets.find((a) => a.key === 'KAS');
  const ethSummary = summary.assets.find((a) => a.key === 'ETH');
  const goldSummary = summary.assets.find((a) => a.key === 'GOLD');
  const spxSummary = summary.assets.find((a) => a.key === 'SPX');

  const coreMatrixRows: BtcMatrixAssetItem[] = useMemo(
    () =>
      summary.assets.map((a) => ({
        id: `CORE:${a.key}`,
        ticker: a.ticker,
        auditTicker: a.key === 'SPX' ? null : a.key === 'GOLD' ? 'XAU' : a.ticker,
        name: a.name,
        grade: a.key === 'KAS' ? 'A+' : a.key === 'GOLD' ? 'B' : a.key === 'ETH' ? 'F' : 'INDEX',
        side: a.key === 'ETH' ? 'FAILED' : a.key === 'SPX' ? 'MACRO' : 'PASSED',
        color: a.color,
        isIndexPoints: a.key === 'SPX',
        startPrice: a.startPrice,
        currentPrice: a.currentPrice,
        nominalMult: a.nominalMult,
        nominalPct: a.nominalPct,
        btcAdjustedMult: a.btcAdjustedMult,
        btcAdjustedPct: a.btcAdjustedPct,
        beatsBtc: a.beatsBtc
      })),
    [summary.assets]
  );

  const visibleMatrixRows = matrixScope === 'ALL' ? summary.cohortMatrix : coreMatrixRows;
  const beatsBtcCount = summary.cohortMatrix.filter((r) => r.beatsBtc).length;
  const windowTag =
    horizon === 'ALL_TIME'
      ? "May '22 Open"
      : ({
          D180: '180D Open',
          Y1: '1Y Open',
          Y2: '2Y Open',
          Y4: '4Y Open'
        } as Record<GainsWindowHorizonKey, string>)[horizon];

  return (
    <div className="space-y-5" data-testid="btc-benchmark-panel">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            title: 'KASPA ($KAS) VS. BTC',
            badge: 'A+ • 6.0',
            item: kasSummary,
            accent: '#49EACB',
            grad: 'linear-gradient(135deg, #49EACB 0%, #34D399 100%)'
          },
          {
            title: 'ETHEREUM ($ETH) VS. BTC',
            badge: 'F • 0.0',
            item: ethSummary,
            accent: '#A78BFA',
            grad: 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 100%)'
          },
          {
            title: 'GOLD ($XAU) VS. BTC',
            badge: 'B • 4.1',
            item: goldSummary,
            accent: '#FACC15',
            grad: 'linear-gradient(135deg, #FEF08A 0%, #EAB308 100%)'
          }
        ].map((card) => {
          const item = card.item;
          return (
            <div
              key={card.title}
              className="rounded-2xl bg-[#0B0C0E] p-4 space-y-1 min-w-0 overflow-hidden border"
              style={{ borderColor: `${card.accent}40` }}
            >
              <div
                className="font-mono text-[10px] uppercase tracking-wider flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5"
                style={{ color: card.accent }}
              >
                <span>{card.title}</span>
                <span className="shrink-0 opacity-85">{card.badge}</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span
                  className="font-display text-2xl sm:text-3xl font-bold leading-tight tabular-nums"
                  style={{
                    backgroundImage: card.grad,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {formatPctSigned(item?.nominalPct ?? null)}
                </span>
                <span className="font-mono text-xs text-neutral-400 whitespace-nowrap tabular-nums">
                  ({formatMultipleCompact(item?.nominalMult ?? 0)})
                </span>
              </div>
              <div className="font-mono text-[11px] text-neutral-300 leading-snug tabular-nums">
                <span
                  className={
                    item?.beatsBtc ? 'text-[#34D399] font-semibold' : 'text-[#F97316] font-semibold'
                  }
                >
                  {formatPctSigned(item?.btcAdjustedPct ?? null)} vs BTC
                </span>{' '}
                • ₿ {formatMultipleCompact(item?.btcAdjustedMult ?? 0)}
              </div>
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
              {formatPctSigned(spxSummary?.nominalPct ?? null)}
            </span>
            <span className="font-mono text-xs text-neutral-400 whitespace-nowrap tabular-nums">
              ({formatCompactBtcUsd(summary.btcStartPrice)}→{formatCompactBtcUsd(summary.btcEndPrice)} BTC)
            </span>
          </div>
          <div className="font-mono text-[11px] text-neutral-300 leading-snug tabular-nums">
            <span
              className={
                spxSummary?.beatsBtc
                  ? 'text-[#34D399] font-semibold'
                  : 'text-[#F97316] font-semibold'
              }
            >
              {formatPctSigned(spxSummary?.btcAdjustedPct ?? null)} vs BTC
            </span>{' '}
            • ₿ {formatMultipleCompact(spxSummary?.btcAdjustedMult ?? 0)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[#07080A] border border-white/[0.08] p-4 sm:p-5 space-y-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 min-h-[28px]">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 leading-tight">
              KAS • ETH • S&amp;P 500 • GOLD VS. BITCOIN ($BTC) ({HORIZON_BTC_HEADING[horizon]})
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <div className="p-0.5 rounded-full bg-[#121418] border border-white/10 flex items-center font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => setComparisonMode('INDEXED')}
                  className={`px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 whitespace-nowrap ${
                    comparisonMode === 'INDEXED'
                      ? 'bg-[#1D212A] text-white border-white/15'
                      : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                  }`}
                >
                  Indexed vs BTC
                </button>
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
                [{activePoint.raw.label} — {activePoint.raw.event.replace('vs FRED US M2', 'vs BTC').replace('vs US M2', 'vs BTC')}]
              </span>
              {visibleSeries.KAS && (
                <span className="text-[#49EACB] font-semibold">
                  KAS: {formatPctSigned((activePoint.vals.KAS - 1) * 100)} ({formatMultipleCompact(activePoint.vals.KAS)})
                </span>
              )}
              {visibleSeries.ETH && (
                <span className="text-[#A78BFA] font-semibold">
                  ETH: {formatPctSigned((activePoint.vals.ETH - 1) * 100)} ({formatMultipleCompact(activePoint.vals.ETH)})
                </span>
              )}
              {visibleSeries.GOLD && (
                <span className="text-[#FACC15] font-semibold">
                  Gold: {formatPctSigned((activePoint.vals.GOLD - 1) * 100)} ({formatMultipleCompact(activePoint.vals.GOLD)})
                </span>
              )}
              {visibleSeries.SPX && (
                <span className="text-[#60A5FA] font-semibold">
                  S&amp;P 500: {formatPctSigned((activePoint.vals.SPX - 1) * 100)} ({formatMultipleCompact(activePoint.vals.SPX)})
                </span>
              )}
              {visibleSeries.BTC && (
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
                    {tickVal >= 1_000
                      ? `${(tickVal / 1_000).toFixed(0)}Kx`
                      : tickVal >= 2
                      ? `${Number(tickVal.toFixed(1)).toString().replace(/\.0$/, '')}x`
                      : formatPctSigned((tickVal - 1) * 100)}
                  </text>
                </g>
              );
            })}

            {visibleSeries.BTC && (
              <path
                d={buildPolyline('BTC')}
                fill="none"
                stroke={BTC_SERIES_META.BTC.color}
                strokeWidth="2.2"
                strokeDasharray="6 4"
                strokeOpacity="0.95"
              />
            )}

            {visibleSeries.SPX && (
              <path
                d={buildPolyline('SPX')}
                fill="none"
                stroke={BTC_SERIES_META.SPX.color}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            )}

            {visibleSeries.GOLD && (
              <path
                d={buildPolyline('GOLD')}
                fill="none"
                stroke={BTC_SERIES_META.GOLD.color}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            )}

            {visibleSeries.ETH && (
              <path
                d={buildPolyline('ETH')}
                fill="none"
                stroke={BTC_SERIES_META.ETH.color}
                strokeWidth="2.3"
                strokeLinecap="round"
              />
            )}

            {visibleSeries.KAS && (
              <path
                d={buildPolyline('KAS')}
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
                      if (!visibleSeries[key]) return null;
                      return (
                        <circle
                          key={key}
                          cx={x}
                          cy={mapY(pt.vals[key])}
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
                    onMouseEnter={() => setHoverIdx(idx)}
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
              const latestVal = seriesData[seriesData.length - 1]?.vals[key] ?? 1;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSeries(key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors duration-150 whitespace-nowrap ${
                    isOn
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
                  <span style={{ color: isOn ? meta.color : undefined }}>{meta.ticker}</span>
                  <span className="text-neutral-400 tabular-nums">
                    ({formatPctSigned((latestVal - 1) * 100)})
                  </span>
                </button>
              );
            })}
          </div>
          <span className="text-neutral-500">
            Click legend items to isolate series • {beatsBtcCount}/{summary.cohortMatrix.length} Audited Assets Beat BTC
          </span>
        </div>
      </div>

      <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/[0.07]">
          <div className="font-mono text-xs font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
            <span>
              PURCHASING POWER MATRIX VS. BITCOIN ($BTC) ({formatPctSigned(summary.btcPct)})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10.5px] text-neutral-400 tabular-nums">
              BTC ({windowTag} → Spot): {formatUsdPrice(summary.btcStartPrice)} → {formatUsdPrice(summary.btcEndPrice)}
            </span>
            <div className="p-0.5 rounded-full bg-[#121418] border border-white/10 flex items-center font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setMatrixScope('CORE')}
                className={`px-2 py-0.5 rounded-full border font-semibold transition-colors duration-150 whitespace-nowrap ${
                  matrixScope === 'CORE'
                    ? 'bg-[#1D212A] text-white border-white/15'
                    : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                }`}
              >
                Core (4)
              </button>
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
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {visibleMatrixRows.map((asset) => {
            const canAudit = Boolean(asset.auditTicker);
            const nominalEndUsd = allocPerAsset * asset.nominalMult;
            const btcAdjustedEndUsd = allocPerAsset * asset.btcAdjustedMult;

            const inner = (
              <div className="flex flex-col gap-2 font-mono text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: asset.color }}
                    />
                    <span className="font-bold text-white truncate">{asset.name}</span>
                    <span className="text-[10.5px] text-neutral-500 shrink-0">
                      ({asset.ticker}{asset.grade !== 'INDEX' ? ` · ${asset.grade}` : ''})
                    </span>
                    {asset.windowNote && (
                      <span className="text-[9.5px] text-neutral-500 hidden sm:inline shrink-0">
                        · {asset.windowNote}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 whitespace-nowrap tabular-nums ${
                      asset.beatsBtc
                        ? 'bg-[#34D399]/12 text-[#34D399] border-[#34D399]/35'
                        : 'bg-[#F97316]/12 text-[#F97316] border-[#F97316]/35'
                    }`}
                  >
                    {asset.beatsBtc ? 'Beats BTC' : 'Lags BTC'} ({formatPctSigned(asset.btcAdjustedPct)})
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-neutral-400 tabular-nums">
                    {formatMatrixPrice(asset.startPrice, asset.isIndexPoints)} →{' '}
                    <strong className="text-neutral-200">
                      {formatMatrixPrice(asset.currentPrice, asset.isIndexPoints)}
                    </strong>
                  </span>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span style={{ color: asset.color }} className="font-bold">
                      Nominal {formatPctSigned(asset.nominalPct)}
                    </span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-neutral-300">
                      ${allocPerAsset.toLocaleString()} → {formatBasketUsd(nominalEndUsd)} ({formatBasketUsd(btcAdjustedEndUsd)} vs BTC)
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
                className="w-full text-left rounded-xl bg-[#121418] hover:bg-[#171B22] border border-white/[0.07] hover:border-[#F59E0B]/35 p-3 transition-colors duration-150"
              >
                {inner}
              </button>
            ) : (
              <div
                key={asset.id}
                className="w-full text-left rounded-xl bg-[#121418] border border-white/[0.07] p-3"
              >
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
