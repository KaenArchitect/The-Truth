import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildNiceYGridTicks,
  formatBasketUsd,
  formatPctSigned,
  formatUsdPrice
} from '../data/gainsCohortData.ts';
import {
  M2_SERIES_META,
  computeM2AssetSummaries,
  transformM2PointForMode,
  type M2BenchmarkDataset,
  type M2ComparisonMode,
  type M2SeriesKey,
  type MacroM2HorizonKey
} from '../data/m2BenchmarkData.ts';

export interface M2BenchmarkPanelProps {
  horizon: MacroM2HorizonKey;
  useLogScale: boolean;
  onChangeLogScale: (next: boolean) => void;
  dataset: M2BenchmarkDataset;
  allocPerAsset: number;
  onSelectOrAuditTicker: (ticker: string) => void;
}

const HORIZON_M2_HEADING: Record<MacroM2HorizonKey, string> = {
  ALL_TIME: "MAY '22 COMMON LAUNCH → LIVE SPOT",
  D180: '180-DAY ROLLING WINDOW → LIVE SPOT',
  Y1: '1-YEAR ROLLING WINDOW → LIVE SPOT',
  Y2: '2-YEAR ROLLING WINDOW → LIVE SPOT',
  Y4: '4-YEAR CYCLE WINDOW → LIVE SPOT'
};

const ALL_SERIES_KEYS: M2SeriesKey[] = ['KAS', 'BTC', 'GOLD', 'SPX', 'M2'];

function formatMultipleCompact(mult: number): string {
  if (!Number.isFinite(mult) || mult <= 0) return '—';
  if (mult >= 1000) return `${(mult / 1000).toFixed(1).replace(/\.0$/, '')}Kx`;
  if (mult >= 100) return `${Math.round(mult).toLocaleString()}x`;
  if (mult >= 10) return `${mult.toFixed(1)}x`;
  return `${mult.toFixed(2)}x`;
}

function formatIndexValue(seriesKey: M2SeriesKey, val: number): string {
  if (seriesKey === 'SPX') {
    return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  return formatUsdPrice(val);
}

export function M2BenchmarkPanel({
  horizon,
  useLogScale,
  onChangeLogScale,
  dataset,
  allocPerAsset,
  onSelectOrAuditTicker
}: M2BenchmarkPanelProps) {
  const [comparisonMode, setComparisonMode] = useState<M2ComparisonMode>('INDEXED');
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

  const summary = useMemo(() => computeM2AssetSummaries(rawPoints), [rawPoints]);

  const seriesData = useMemo(
    () =>
      rawPoints.map((pt) => ({
        raw: pt,
        vals: transformM2PointForMode(pt, comparisonMode)
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

  const buildPolyline = (key: M2SeriesKey) =>
    seriesData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i).toFixed(1)} ${mapY(d.vals[key]).toFixed(1)}`)
      .join(' ');

  const yGridTicks = buildNiceYGridTicks(minVal, maxVal, useLogScale);

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

  const kasSummary = summary.assets.find((a) => a.key === 'KAS');
  const btcSummary = summary.assets.find((a) => a.key === 'BTC');
  const goldSummary = summary.assets.find((a) => a.key === 'GOLD');
  const spxSummary = summary.assets.find((a) => a.key === 'SPX');

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            title: 'KASPA ($KAS) VS. M2',
            badge: 'A+ • 6.0',
            item: kasSummary,
            accent: '#49EACB',
            grad: 'linear-gradient(135deg, #49EACB 0%, #34D399 100%)'
          },
          {
            title: 'BITCOIN ($BTC) VS. M2',
            badge: 'B+ • 4.4',
            item: btcSummary,
            accent: '#F59E0B',
            grad: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)'
          },
          {
            title: 'GOLD ($XAU) VS. M2',
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
                  className="font-display text-2xl sm:text-3xl font-bold leading-tight"
                  style={{
                    backgroundImage: card.grad,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {formatPctSigned(item?.nominalPct ?? null)}
                </span>
                <span className="font-mono text-xs text-neutral-400 whitespace-nowrap">
                  ({formatMultipleCompact(item?.nominalMult ?? 0)})
                </span>
              </div>
              <div className="font-mono text-[11px] text-neutral-300 leading-snug">
                <span className={item?.beatsM2 ? 'text-[#34D399] font-semibold' : 'text-[#F97316] font-semibold'}>
                  {formatPctSigned(item?.m2AdjustedPct ?? null)} vs M2
                </span>{' '}
                • Real {formatMultipleCompact(item?.m2AdjustedMult ?? 0)}
              </div>
            </div>
          );
        })}

        <div className="rounded-2xl bg-[#0B0C0E] border border-[#60A5FA]/35 p-4 space-y-1 min-w-0 overflow-hidden">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#60A5FA] flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
            <span>S&amp;P 500 VS. US M2</span>
            <span className="shrink-0 text-neutral-400">
              M2 {formatPctSigned(summary.m2Pct)}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className="font-display text-2xl sm:text-3xl font-bold leading-tight"
              style={{
                backgroundImage: 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {formatPctSigned(spxSummary?.nominalPct ?? null)}
            </span>
            <span className="font-mono text-xs text-neutral-400 whitespace-nowrap">
              (${summary.m2StartTrillions.toFixed(1)}T→${summary.m2EndTrillions.toFixed(1)}T M2)
            </span>
          </div>
          <div className="font-mono text-[11px] text-neutral-300 leading-snug">
            <span className={spxSummary?.beatsM2 ? 'text-[#34D399] font-semibold' : 'text-[#F97316] font-semibold'}>
              {formatPctSigned(spxSummary?.m2AdjustedPct ?? null)} vs M2
            </span>{' '}
            • Real {formatMultipleCompact(spxSummary?.m2AdjustedMult ?? 0)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[#07080A] border border-white/[0.08] p-4 sm:p-5 space-y-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 min-h-[28px]">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 leading-tight">
              BTC • KAS • S&amp;P 500 • GOLD VS. US M2 MONEY SUPPLY ({HORIZON_M2_HEADING[horizon]})
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <div className="p-0.5 rounded-full bg-[#121418] border border-white/10 flex items-center font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => setComparisonMode('INDEXED')}
                  className={`px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 ${
                    comparisonMode === 'INDEXED'
                      ? 'bg-[#1D212A] text-white border-white/15'
                      : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                  }`}
                >
                  Indexed vs M2
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonMode('REAL_DIV_M2')}
                  className={`px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 ${
                    comparisonMode === 'REAL_DIV_M2'
                      ? 'bg-[#49EACB]/15 text-[#49EACB] border-[#49EACB]/35'
                      : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                  }`}
                >
                  Deflated ÷ M2
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
              {visibleSeries.KAS && (
                <span className="text-[#49EACB] font-semibold">
                  KAS: {formatPctSigned((activePoint.vals.KAS - 1) * 100)} ({formatMultipleCompact(activePoint.vals.KAS)})
                </span>
              )}
              {visibleSeries.BTC && (
                <span className="text-[#F59E0B] font-semibold">
                  BTC: {formatPctSigned((activePoint.vals.BTC - 1) * 100)} ({formatMultipleCompact(activePoint.vals.BTC)})
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
              {visibleSeries.M2 && (
                <span className="text-neutral-300">
                  {comparisonMode === 'REAL_DIV_M2'
                    ? `M2 Base: 1.00x ($${activePoint.raw.m2Trillions.toFixed(2)}T)`
                    : `US M2: ${formatPctSigned((activePoint.vals.M2 - 1) * 100)} ($${activePoint.raw.m2Trillions.toFixed(2)}T)`}
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

            {visibleSeries.M2 && (
              <path
                d={buildPolyline('M2')}
                fill="none"
                stroke={M2_SERIES_META.M2.color}
                strokeWidth="2"
                strokeDasharray="6 4"
                strokeOpacity="0.9"
              />
            )}

            {visibleSeries.SPX && (
              <path
                d={buildPolyline('SPX')}
                fill="none"
                stroke={M2_SERIES_META.SPX.color}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            )}

            {visibleSeries.GOLD && (
              <path
                d={buildPolyline('GOLD')}
                fill="none"
                stroke={M2_SERIES_META.GOLD.color}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            )}

            {visibleSeries.BTC && (
              <path
                d={buildPolyline('BTC')}
                fill="none"
                stroke={M2_SERIES_META.BTC.color}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {visibleSeries.KAS && (
              <path
                d={buildPolyline('KAS')}
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
                      if (!visibleSeries[key]) return null;
                      return (
                        <circle
                          key={key}
                          cx={x}
                          cy={mapY(pt.vals[key])}
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
              const meta = M2_SERIES_META[key];
              const isOn = visibleSeries[key];
              const latestVal = seriesData[seriesData.length - 1]?.vals[key] ?? 1;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSeries(key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors duration-150 ${
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
                  <span className="text-neutral-400">
                    ({formatPctSigned((latestVal - 1) * 100)})
                  </span>
                </button>
              );
            })}
          </div>
          <span className="text-neutral-500">
            Click legend items to isolate series • {dataset.sourceLabel}
          </span>
        </div>
      </div>

      <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/[0.07]">
          <div className="font-mono text-xs font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#49EACB] shadow-[0_0_8px_#49EACB]" />
            <span>PURCHASING POWER MATRIX VS. US M2 EXPANSION ({formatPctSigned(summary.m2Pct)})</span>
          </div>
          <span className="font-mono text-[10.5px] text-neutral-400">
            FRED M2SL: ${summary.m2StartTrillions.toFixed(2)}T → ${summary.m2EndTrillions.toFixed(2)}T
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {summary.assets.map((asset) => {
            const canAudit = asset.key === 'KAS' || asset.key === 'BTC' || asset.key === 'GOLD';
            const auditTicker = asset.key === 'GOLD' ? 'XAU' : asset.ticker;
            const nominalEndUsd = allocPerAsset * asset.nominalMult;
            const realM2EndUsd = allocPerAsset * asset.m2AdjustedMult;

            const inner = (
              <div className="flex flex-col gap-2 font-mono text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: asset.color }}
                    />
                    <span className="font-bold text-white">{asset.name}</span>
                    <span className="text-[10.5px] text-neutral-500">({asset.ticker})</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      asset.beatsM2
                        ? 'bg-[#34D399]/12 text-[#34D399] border-[#34D399]/35'
                        : 'bg-[#F97316]/12 text-[#F97316] border-[#F97316]/35'
                    }`}
                  >
                    {asset.beatsM2 ? 'Beats M2' : 'Lags M2'} ({formatPctSigned(asset.m2AdjustedPct)})
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-neutral-400">
                    {formatIndexValue(asset.key, asset.startPrice)} →{' '}
                    <strong className="text-neutral-200">
                      {formatIndexValue(asset.key, asset.currentPrice)}
                    </strong>
                  </span>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span style={{ color: asset.color }} className="font-bold">
                      Nominal {formatPctSigned(asset.nominalPct)}
                    </span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-neutral-300">
                      ${allocPerAsset.toLocaleString()} → {formatBasketUsd(nominalEndUsd)} ({formatBasketUsd(realM2EndUsd)} real)
                    </span>
                  </div>
                </div>
              </div>
            );

            return canAudit ? (
              <button
                key={asset.key}
                type="button"
                onClick={() => onSelectOrAuditTicker(auditTicker)}
                className="w-full text-left rounded-xl bg-[#121418] hover:bg-[#171B22] border border-white/[0.07] hover:border-[#49EACB]/35 p-3 transition-colors duration-150"
              >
                {inner}
              </button>
            ) : (
              <div
                key={asset.key}
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
