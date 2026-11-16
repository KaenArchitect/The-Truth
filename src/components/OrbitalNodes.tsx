import { memo, useEffect, useRef, useState } from 'react';
import { Pin, X } from 'lucide-react';
import {
  ORBIT_ANGLES_DEG,
  formatScore,
  getGradeAccent,
  getHarmonizedScoreStyle,
  type AuditData
} from '../data/rubricSpec.ts';
import {
  getConstellationLayout,
  type ConstellationClearanceMetrics,
  type ConstellationFitOptions,
  type ConstellationLayout,
  type FourFormationMode,
  type ThreeFormationMode
} from '../data/constellationLayout.ts';

export interface WaveLut {
  steps: number;
  cos1: Float64Array;
  sin1: Float64Array;
  sinFA: Float64Array;
  cosFA: Float64Array;
  cosFB: Float64Array;
  sinFB: Float64Array;
  sinFC: Float64Array;
  cosFC: Float64Array;
  i0: Int32Array;
  i2: Int32Array;
  i3: Int32Array;
  xs: Float64Array;
  ys: Float64Array;
  parts: string[];
}

export function createWaveLut(steps: number, fA: number, fB: number, fC: number): WaveLut {
  const n = Math.max(16, steps | 0);
  const cos1 = new Float64Array(n);
  const sin1 = new Float64Array(n);
  const sinFA = new Float64Array(n);
  const cosFA = new Float64Array(n);
  const cosFB = new Float64Array(n);
  const sinFB = new Float64Array(n);
  const sinFC = new Float64Array(n);
  const cosFC = new Float64Array(n);
  const i0 = new Int32Array(n);
  const i2 = new Int32Array(n);
  const i3 = new Int32Array(n);

  for (let i = 0; i < n; i++) {
    const theta = (i / n) * Math.PI * 2;
    cos1[i] = Math.cos(theta);
    sin1[i] = Math.sin(theta);
    sinFA[i] = Math.sin(fA * theta);
    cosFA[i] = Math.cos(fA * theta);
    cosFB[i] = Math.cos(fB * theta);
    sinFB[i] = Math.sin(fB * theta);
    sinFC[i] = Math.sin(fC * theta);
    cosFC[i] = Math.cos(fC * theta);
    i0[i] = (i - 1 + n) % n;
    i2[i] = (i + 1) % n;
    i3[i] = (i + 2) % n;
  }

  return {
    steps: n,
    cos1,
    sin1,
    sinFA,
    cosFA,
    cosFB,
    sinFB,
    sinFC,
    cosFC,
    i0,
    i2,
    i3,
    xs: new Float64Array(n),
    ys: new Float64Array(n),
    parts: new Array<string>(n + 2)
  };
}

function fmtWaveCoord(v: number): string {
  const n = Math.round(v * 100);
  if (n < 0) {
    const a = -n;
    const whole = (a / 100) | 0;
    const frac = a - whole * 100;
    return frac === 0
      ? `-${whole}`
      : frac < 10
      ? `-${whole}.0${frac}`
      : `-${whole}.${frac}`;
  }
  const whole = (n / 100) | 0;
  const frac = n - whole * 100;
  return frac === 0
    ? `${whole}`
    : frac < 10
    ? `${whole}.0${frac}`
    : `${whole}.${frac}`;
}

export const MINI_LUT_MAIN = createWaveLut(40, 6, 3, 9);
export const MINI_LUT_ECHO = createWaveLut(36, 6, 4, 8);
export const MINI_LUT_INNER = createWaveLut(36, 6, 3, 12);

export const NUCLEUS_LUT_MAIN = createWaveLut(84, 6, 3, 9);
export const NUCLEUS_LUT_ECHO = createWaveLut(76, 6, 4, 8);
export const NUCLEUS_LUT_INNER = createWaveLut(72, 6, 3, 12);

export const SAT_LUT_MAIN = createWaveLut(56, 5, 3, 8);
export const SAT_LUT_ECHO = createWaveLut(48, 5, 4, 7);
export const SAT_LUT_INNER = createWaveLut(48, 5, 3, 10);

export function buildFastWavePath(
  lut: WaveLut,
  cx: number,
  cy: number,
  baseR: number,
  amp: number,
  ph: number,
  mulB = 0.82,
  mulC = 1.35
): string {
  const { steps, cos1, sin1, sinFA, cosFA, cosFB, sinFB, sinFC, cosFC, i0, i2, i3, xs, ys, parts } =
    lut;
  if (amp <= 0.005) {
    const r = fmtWaveCoord(baseR);
    const rightX = fmtWaveCoord(cx + baseR);
    const leftX = fmtWaveCoord(cx - baseR);
    const centerY = fmtWaveCoord(cy);
    return `M ${rightX} ${centerY} A ${r} ${r} 0 1 1 ${leftX} ${centerY} A ${r} ${r} 0 1 1 ${rightX} ${centerY} Z`;
  }

  const cP1 = Math.cos(ph);
  const sP1 = Math.sin(ph);
  const p2 = ph * mulB;
  const cP2 = Math.cos(p2);
  const sP2 = Math.sin(p2);
  const p3 = ph * mulC;
  const cP3 = Math.cos(p3);
  const sP3 = Math.sin(p3);

  for (let i = 0; i < steps; i++) {
    const termA = sinFA[i] * cP1 + cosFA[i] * sP1;
    const termB = cosFB[i] * cP2 + sinFB[i] * sP2;
    const termC = sinFC[i] * cP3 + cosFC[i] * sP3;
    const r = baseR + amp * (0.54 * termA + 0.31 * termB + 0.15 * termC);
    xs[i] = cx + cos1[i] * r;
    ys[i] = cy + sin1[i] * r;
  }

  parts[0] = `M${fmtWaveCoord(xs[0])} ${fmtWaveCoord(ys[0])}`;
  const k = 1 / 6;
  for (let i = 0; i < steps; i++) {
    const idx0 = i0[i];
    const idx2 = i2[i];
    const idx3 = i3[i];

    const x1 = xs[i];
    const y1 = ys[i];
    const x2 = xs[idx2];
    const y2 = ys[idx2];

    const cp1x = fmtWaveCoord(x1 + (x2 - xs[idx0]) * k);
    const cp1y = fmtWaveCoord(y1 + (y2 - ys[idx0]) * k);
    const cp2x = fmtWaveCoord(x2 - (xs[idx3] - x1) * k);
    const cp2y = fmtWaveCoord(y2 - (ys[idx3] - y1) * k);

    parts[i + 1] = `C${cp1x} ${cp1y} ${cp2x} ${cp2y} ${fmtWaveCoord(x2)} ${fmtWaveCoord(y2)}`;
  }
  parts[steps + 1] = 'Z';
  return parts.join('');
}

export const DEFAULT_MINI_MAIN_D = buildFastWavePath(MINI_LUT_MAIN, 44, 44, 30, 0, 0);
export const DEFAULT_MINI_ECHO_D = buildFastWavePath(MINI_LUT_ECHO, 44, 44, 31.8, 0, 0);
export const DEFAULT_MINI_INNER_D = buildFastWavePath(MINI_LUT_INNER, 44, 44, 25.5, 0, 0);
export const DEFAULT_NUCLEUS_MAIN_D = buildFastWavePath(NUCLEUS_LUT_MAIN, 140, 140, 102, 0, 0);
export const DEFAULT_NUCLEUS_ECHO_D = buildFastWavePath(NUCLEUS_LUT_ECHO, 140, 140, 106, 0, 0);
export const DEFAULT_NUCLEUS_INNER_D = buildFastWavePath(NUCLEUS_LUT_INNER, 140, 140, 90, 0, 0);
export const DEFAULT_SAT_MAIN_D = buildFastWavePath(SAT_LUT_MAIN, 70, 70, 45, 0, 0);
export const DEFAULT_SAT_ECHO_D = buildFastWavePath(SAT_LUT_ECHO, 70, 70, 47.5, 0, 0);
export const DEFAULT_SAT_INNER_D = buildFastWavePath(SAT_LUT_INNER, 70, 70, 39, 0, 0);

interface WaveSubscriberEntry {
  cb: (dt: number) => void;
  minIntervalMs: number;
  lastCall: number;
}

const waveSubscribers = new Set<WaveSubscriberEntry>();
let sharedWaveRafId: number | null = null;
let sharedWavePaused = false;
let lastSharedFrameMs = 0;

let reducedMotionMql: MediaQueryList | null = null;
let reducedMotionActive = false;

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  reducedMotionMql = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotionActive = reducedMotionMql.matches;
  const onMotionChange = (e: MediaQueryListEvent) => {
    reducedMotionActive = e.matches;
    if (reducedMotionActive && sharedWaveRafId !== null) {
      cancelAnimationFrame(sharedWaveRafId);
      sharedWaveRafId = null;
    } else if (!reducedMotionActive) {
      ensureSharedWaveLoop();
    }
  };
  if (reducedMotionMql.addEventListener) {
    reducedMotionMql.addEventListener('change', onMotionChange);
  } else if (reducedMotionMql.addListener) {
    reducedMotionMql.addListener(onMotionChange);
  }
}

function isReducedMotionPreferred(): boolean {
  return reducedMotionActive;
}

function runSharedWaveLoop(now: number): void {
  if (
    waveSubscribers.size === 0 ||
    sharedWavePaused ||
    reducedMotionActive ||
    (typeof document !== 'undefined' && document.hidden)
  ) {
    sharedWaveRafId = null;
    return;
  }
  const dt = lastSharedFrameMs ? Math.min(2.2, (now - lastSharedFrameMs) / 16.667) : 1;
  lastSharedFrameMs = now;

  waveSubscribers.forEach((entry) => {
    if (now - entry.lastCall >= entry.minIntervalMs) {
      entry.lastCall = now;
      entry.cb(dt);
    }
  });

  sharedWaveRafId = requestAnimationFrame(runSharedWaveLoop);
}

function ensureSharedWaveLoop(): void {
  if (
    sharedWaveRafId === null &&
    !sharedWavePaused &&
    !reducedMotionActive &&
    waveSubscribers.size > 0 &&
    (typeof document === 'undefined' || !document.hidden)
  ) {
    lastSharedFrameMs = 0;
    sharedWaveRafId = requestAnimationFrame(runSharedWaveLoop);
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && sharedWaveRafId !== null) {
      cancelAnimationFrame(sharedWaveRafId);
      sharedWaveRafId = null;
    } else if (!document.hidden) {
      ensureSharedWaveLoop();
    }
  });
}

export function subscribeSharedWave(cb: (dt: number) => void, fps = 30): () => void {
  const entry: WaveSubscriberEntry = { cb, minIntervalMs: 1000 / fps, lastCall: 0 };
  waveSubscribers.add(entry);
  ensureSharedWaveLoop();
  return () => {
    waveSubscribers.delete(entry);
    if (waveSubscribers.size === 0 && sharedWaveRafId !== null) {
      cancelAnimationFrame(sharedWaveRafId);
      sharedWaveRafId = null;
    }
  };
}

export function setGlobalWavePaused(paused: boolean): void {
  sharedWavePaused = paused;
  if (paused && sharedWaveRafId !== null) {
    cancelAnimationFrame(sharedWaveRafId);
    sharedWaveRafId = null;
  } else if (!paused) {
    ensureSharedWaveLoop();
  }
}

export interface HarmonicProjectBubbleProps {
  item: AuditData;
  isSelected: boolean;
  isPinnedItem?: boolean;
  onSelectTicker: (ticker: string) => void;
  onTogglePin?: (ticker: string) => void;
  seedIndex?: number;
  sizePx?: number;
}

export const HarmonicProjectBubble = memo(function HarmonicProjectBubble({
  item,
  isSelected,
  isPinnedItem = false,
  onSelectTicker,
  onTogglePin,
  seedIndex = 0,
  sizePx = 68
}: HarmonicProjectBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const mainPathRef = useRef<SVGPathElement | null>(null);
  const echoPathRef = useRef<SVGPathElement | null>(null);
  const innerPathRef = useRef<SVGPathElement | null>(null);
  const phaseRef = useRef(seedIndex * 0.95);

  const rawScore = Math.max(0, Math.min(6, Number(item?.totalScore) || 0));
  const isZeroFlat = rawScore === 0;
  const itemAccent = getGradeAccent(item?.grade);
  const isHighlighted = isSelected || isPinnedItem;
  const shouldAnimateWave = isHighlighted || isHovered;
  const effectiveSize = Math.max(60, Math.round(sizePx || 68));
  const svgOutsetPx = (effectiveSize * 10) / 68;
  const haloInsetPx = (effectiveSize * 4) / 68;

  useEffect(() => {
    if (isZeroFlat) return undefined;

    // +25% harmonic wave amplitude upgrade (1.25x crest multiplier); E=0 remains flatlined (0)
    const amp = 1.25 * (1.6 + Math.pow(rawScore / 6.0, 1.12) * 5.0);
    const speed = (0.018 + (rawScore / 6.0) * 0.028) * 1.15;

    if (!isHighlighted && innerPathRef.current) {
      innerPathRef.current.setAttribute('d', DEFAULT_MINI_INNER_D);
    }

    const renderMini = (ph: number) => {
      if (mainPathRef.current) {
        mainPathRef.current.setAttribute(
          'd',
          buildFastWavePath(MINI_LUT_MAIN, 44, 44, 30, amp, ph, 0.82, 1.35)
        );
      }
      if (echoPathRef.current) {
        echoPathRef.current.setAttribute(
          'd',
          buildFastWavePath(MINI_LUT_ECHO, 44, 44, 31.8, amp * 0.76, -ph * 0.9, 0.82, 1.35)
        );
      }
      if (isHighlighted && innerPathRef.current) {
        innerPathRef.current.setAttribute(
          'd',
          buildFastWavePath(MINI_LUT_INNER, 44, 44, 25.5, amp * 0.44, ph * 1.22, 0.82, 1.35)
        );
      }
    };

    renderMini(phaseRef.current);
    if (!shouldAnimateWave) return undefined;

    return subscribeSharedWave((dt) => {
      phaseRef.current += speed * Math.min(1.5, dt);
      renderMini(phaseRef.current);
    }, 20);
  }, [rawScore, isZeroFlat, isHighlighted, shouldAnimateWave]);

  return (
    <div
      onMouseEnter={() => {
        if (!isZeroFlat) setIsHovered(true);
      }}
      onMouseLeave={() => {
        if (!isZeroFlat) setIsHovered(false);
      }}
      style={{ contain: 'layout style' }}
      className="group relative inline-flex items-center justify-center"
    >
      <span
        className="pointer-events-none absolute rounded-full transition-all duration-300 ease-out"
        style={{
          inset: `${haloInsetPx.toFixed(2)}px`,
          boxShadow: isHighlighted
            ? `0 8px 18px rgba(0,0,0,0.85), 0 0 18px ${itemAccent.glow}`
            : '0 6px 14px rgba(0,0,0,0.68)',
          border:
            isHighlighted && isZeroFlat
              ? `1px solid ${itemAccent.border}`
              : '1px solid transparent',
          transform: isHighlighted ? 'scale(1.12)' : 'scale(1)'
        }}
      />

      <button
        type="button"
        onFocus={() => {
          if (!isZeroFlat) setIsHovered(true);
        }}
        onBlur={() => {
          if (!isZeroFlat) setIsHovered(false);
        }}
        onClick={() => onSelectTicker(item.ticker)}
        title={`${item.name} ($${item.ticker}) — Grade ${item.grade} (${formatScore(
          item.totalScore
        )}/6.0)`}
        style={{ width: `${effectiveSize}px`, height: `${effectiveSize}px` }}
        className={`relative rounded-full flex flex-col items-center justify-center text-center cursor-pointer select-none transition-transform duration-300 ease-out focus:outline-none ${
          isHighlighted ? 'scale-110 z-20' : 'opacity-90 hover:opacity-100 group-hover:scale-105 z-10'
        }`}
      >
        <svg
          viewBox="0 0 88 88"
          shapeRendering="geometricPrecision"
          style={{
            left: `-${svgOutsetPx.toFixed(2)}px`,
            top: `-${svgOutsetPx.toFixed(2)}px`,
            width: `${(effectiveSize + svgOutsetPx * 2).toFixed(2)}px`,
            height: `${(effectiveSize + svgOutsetPx * 2).toFixed(2)}px`
          }}
          className="absolute pointer-events-none overflow-visible"
        >
          <defs>
            <radialGradient id={`projBubbleGrad-${item.ticker}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#121418" />
              <stop offset="70%" stopColor="#121418" />
              <stop
                offset="100%"
                stopColor={itemAccent.secondary}
                stopOpacity={isHighlighted ? '0.3' : isZeroFlat ? '0.08' : '0.18'}
              />
            </radialGradient>
            <linearGradient
              id={`projRingGrad-${item.ticker}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={itemAccent.primary} />
              <stop offset="100%" stopColor={itemAccent.secondary} />
            </linearGradient>
          </defs>

          {isZeroFlat ? (
            <>
              <circle
                cx="44"
                cy="44"
                r="30"
                fill={`url(#projBubbleGrad-${item.ticker})`}
                stroke={`url(#projRingGrad-${item.ticker})`}
                strokeOpacity={isHighlighted ? 0.95 : 0.45}
                strokeWidth={isHighlighted ? '2.1' : '1.4'}
              />
              <circle
                cx="44"
                cy="44"
                r="25.5"
                fill="none"
                stroke={itemAccent.secondary}
                strokeWidth="0.8"
                strokeDasharray="3 3"
                strokeOpacity={isHighlighted ? 0.28 : 0.1}
              />
            </>
          ) : (
            <>
              <path
                ref={echoPathRef}
                d={DEFAULT_MINI_ECHO_D}
                fill="none"
                stroke={itemAccent.secondary}
                strokeWidth="1"
                strokeOpacity={isHighlighted ? 0.52 : 0.3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                ref={mainPathRef}
                d={DEFAULT_MINI_MAIN_D}
                fill={`url(#projBubbleGrad-${item.ticker})`}
                stroke={`url(#projRingGrad-${item.ticker})`}
                strokeOpacity={isHighlighted ? 1 : 0.8}
                strokeWidth={isHighlighted ? '2.1' : '1.55'}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                ref={innerPathRef}
                d={DEFAULT_MINI_INNER_D}
                fill="none"
                stroke={itemAccent.secondary}
                strokeWidth="0.85"
                strokeDasharray="3 3"
                strokeOpacity={isHighlighted ? 0.32 : 0.18}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>

        <div className="relative z-10 flex flex-col items-center justify-center leading-none">
          <span
            className={`font-mono tracking-tight transition-colors duration-300 ${
              effectiveSize >= 96
                ? 'text-xs'
                : effectiveSize >= 80
                ? 'text-[11px]'
                : effectiveSize >= 74
                ? 'text-[10.5px]'
                : 'text-[10px]'
            } ${isHighlighted ? 'text-white font-bold' : 'text-neutral-200 font-semibold'}`}
          >
            {item.ticker}
          </span>
          <span
            className={`font-display font-bold mt-0.5 color-glide ${
              effectiveSize >= 96
                ? 'text-xl'
                : effectiveSize >= 80
                ? 'text-base'
                : effectiveSize >= 74
                ? 'text-[15px]'
                : 'text-sm'
            }`}
            style={{ color: itemAccent.primary }}
          >
            {item.grade}
          </span>
          <span
            className={`font-mono text-neutral-400 mt-0.5 transition-colors duration-300 ${
              effectiveSize >= 96
                ? 'text-[10.5px]'
                : effectiveSize >= 80
                ? 'text-[9.5px]'
                : effectiveSize >= 74
                ? 'text-[9px]'
                : 'text-[8.5px]'
            }`}
          >
            {formatScore(item.totalScore)}
          </span>
        </div>
      </button>

      {onTogglePin && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(item.ticker);
          }}
          aria-label={
            isPinnedItem
              ? `Unpin $${item.ticker} from comparison`
              : `Pin $${item.ticker} to compare`
          }
          title={
            isPinnedItem
              ? `Unpin $${item.ticker} from comparison`
              : `Pin $${item.ticker} to compare (up to 4)`
          }
          className={`color-glide absolute -top-1 -right-1 z-30 w-5 h-5 rounded-full flex items-center justify-center border ${
            isPinnedItem
              ? 'opacity-100 scale-100 shadow-md'
              : 'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 bg-[#121418]/95 border-white/15 text-neutral-400 hover:text-white'
          }`}
          style={
            isPinnedItem
              ? {
                  backgroundColor: '#121418',
                  color: itemAccent.primary,
                  borderColor: itemAccent.primary,
                  boxShadow: `0 0 10px ${itemAccent.glow}`
                }
              : undefined
          }
        >
          <Pin className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
});

export {
  getConstellationLayout,
  type ConstellationClearanceMetrics,
  type ConstellationFitOptions,
  type ConstellationLayout,
  type FourFormationMode,
  type ThreeFormationMode
};

export interface PinnedOrbitalNodeProps {
  auditObj: AuditData;
  x: number;
  y: number;
  nodeScale: number;
  isFocused: boolean;
  isExiting?: boolean;
  expandOrbits: boolean;
  hoveredInvId: string | null;
  onHoverInv: (invId: string | null) => void;
  onFocusBubble: () => void;
  onUnpin: () => void;
  onOpenInvariantModal: (invId: string) => void;
  seedOffset?: number;
}

export const PinnedOrbitalNode = memo(function PinnedOrbitalNode({
  auditObj,
  x,
  y,
  nodeScale,
  isFocused,
  isExiting = false,
  expandOrbits,
  hoveredInvId,
  onHoverInv,
  onFocusBubble,
  onUnpin,
  onOpenInvariantModal,
  seedOffset = 0
}: PinnedOrbitalNodeProps) {
  const [localHovered, setLocalHovered] = useState(false);
  const mainWaveRef = useRef<SVGPathElement | null>(null);
  const echoWaveRef = useRef<SVGPathElement | null>(null);
  const innerWaveRef = useRef<SVGPathElement | null>(null);
  const waveStateRef = useRef({ phase: seedOffset * 1.3, amp: 0 });

  const satMainRefs = useRef<Array<SVGPathElement | null>>([]);
  const satEchoRefs = useRef<Array<SVGPathElement | null>>([]);
  const satInnerRefs = useRef<Array<SVGPathElement | null>>([]);
  const satStatesRef = useRef(
    Array.from({ length: 6 }, (_, i) => ({ phase: seedOffset + i * 1.05, amp: 0 }))
  );

  const nodeAccent = getGradeAccent(auditObj.grade);
  const isSplit = expandOrbits || localHovered || Boolean(hoveredInvId);
  const stageSize = 440;
  const centerCoord = 220;
  const orbitRadius = 152;

  useEffect(() => {
    const rawScore = Math.max(0, Math.min(6, Number(auditObj?.totalScore) || 0));
    const isZeroFlat = rawScore === 0;

    // +25% harmonic wave amplitude upgrade (1.25x crest multiplier); E=0 remains flatlined (0)
    const targetCenterAmp =
      isSplit || isZeroFlat ? 0 : 1.25 * (3.5 + Math.pow(rawScore / 6.0, 1.12) * 14.5);

    const invList = auditObj?.invariants || [];
    const targetSatAmps = Array.from({ length: 6 }, (_, idx) => {
      const invScore = Math.max(0, Math.min(1, Number(invList[idx]?.score) || 0));
      if (!isSplit || invScore <= 0) return 0;
      return 1.25 * (1.8 + Math.pow(invScore, 1.12) * 6.8);
    });

    let centerSettledZero = false;
    const satSettledZero = [false, false, false, false, false, false];

    const stepWaves = (dt = 1) => {
      let active = false;
      const st = waveStateRef.current;
      st.amp += (targetCenterAmp - st.amp) * 0.16;
      if (Math.abs(targetCenterAmp - st.amp) < 0.04) st.amp = targetCenterAmp;

      const centerSpeed = (0.018 + (rawScore / 6.0) * 0.028) * 1.35 * Math.min(1.6, dt);
      if (st.amp > 0.01) st.phase += centerSpeed;

      const centerNeedsUpdate = st.amp > 0.01 || targetCenterAmp > 0.01 || !centerSettledZero;
      if (centerNeedsUpdate) {
        if (mainWaveRef.current) {
          mainWaveRef.current.setAttribute(
            'd',
            buildFastWavePath(NUCLEUS_LUT_MAIN, 140, 140, 102, st.amp, st.phase, 0.82, 1.35)
          );
        }
        if (echoWaveRef.current) {
          echoWaveRef.current.setAttribute(
            'd',
            buildFastWavePath(NUCLEUS_LUT_ECHO, 140, 140, 106, st.amp * 0.78, -st.phase * 0.9, 0.82, 1.35)
          );
        }
        if (innerWaveRef.current) {
          innerWaveRef.current.setAttribute(
            'd',
            buildFastWavePath(NUCLEUS_LUT_INNER, 140, 140, 90, st.amp * 0.45, st.phase * 1.25, 0.82, 1.35)
          );
        }
        centerSettledZero = st.amp <= 0.01 && targetCenterAmp <= 0.01;
      }

      if (st.amp > 0.01 || Math.abs(targetCenterAmp - st.amp) > 0.01) active = true;

      for (let idx = 0; idx < 6; idx++) {
        const satSt = satStatesRef.current[idx];
        const tAmp = targetSatAmps[idx];
        const invScore = Math.max(0, Math.min(1, Number(invList[idx]?.score) || 0));

        satSt.amp += (tAmp - satSt.amp) * 0.16;
        if (Math.abs(tAmp - satSt.amp) < 0.03) satSt.amp = tAmp;

        const satSpeed = (0.02 + invScore * 0.032) * 1.35 * Math.min(1.6, dt);
        if (satSt.amp > 0.01) satSt.phase += satSpeed;

        const satNeedsUpdate = satSt.amp > 0.01 || tAmp > 0.01 || !satSettledZero[idx];
        if (satNeedsUpdate) {
          const mRef = satMainRefs.current[idx];
          const eRef = satEchoRefs.current[idx];
          const iRef = satInnerRefs.current[idx];

          if (mRef) {
            mRef.setAttribute(
              'd',
              buildFastWavePath(SAT_LUT_MAIN, 70, 70, 45, satSt.amp, satSt.phase, 0.82, 1.35)
            );
          }
          if (eRef) {
            eRef.setAttribute(
              'd',
              buildFastWavePath(SAT_LUT_ECHO, 70, 70, 47.5, satSt.amp * 0.76, -satSt.phase * 0.88, 0.82, 1.35)
            );
          }
          if (iRef) {
            iRef.setAttribute(
              'd',
              buildFastWavePath(SAT_LUT_INNER, 70, 70, 39, satSt.amp * 0.44, satSt.phase * 1.22, 0.82, 1.35)
            );
          }
          satSettledZero[idx] = satSt.amp <= 0.01 && tAmp <= 0.01;
        }

        if (satSt.amp > 0.01 || Math.abs(tAmp - satSt.amp) > 0.01) active = true;
      }

      return active;
    };

    if (!stepWaves(1)) return undefined;
    let unsub: (() => void) | null = null;
    unsub = subscribeSharedWave((dt) => {
      if (!stepWaves(dt) && unsub) {
        unsub();
        unsub = null;
      }
    }, 24);

    return () => {
      if (unsub) unsub();
    };
  }, [auditObj, isSplit]);

  return (
    <div
      onMouseEnter={() => {
        if (!isExiting) setLocalHovered(true);
      }}
      onMouseLeave={() => {
        setLocalHovered(false);
        if (!isExiting) onHoverInv(null);
      }}
      className={`absolute flex items-center justify-center select-none ${
        isExiting ? 'pointer-events-none' : ''
      }`}
      style={{
        width: `${stageSize}px`,
        height: `${stageSize}px`,
        left: `${x - centerCoord}px`,
        top: `${y - centerCoord}px`,
        transform: `scale(${isExiting ? nodeScale * 0.76 : nodeScale})`,
        opacity: isExiting ? 0 : isFocused || localHovered ? 1 : 0.88,
        transformOrigin: 'center center',
        zIndex: isExiting ? 12 : localHovered ? 35 : isFocused ? 25 : 20,
        transition:
          'left 520ms cubic-bezier(0.20, 1.22, 0.32, 1), top 520ms cubic-bezier(0.20, 1.22, 0.32, 1), transform 460ms cubic-bezier(0.20, 1.22, 0.32, 1), opacity 340ms ease'
      }}
    >
      <div className="animate-pin-enter relative w-full h-full flex items-center justify-center">
        <svg
          width={stageSize}
          height={stageSize}
          viewBox={`0 0 ${stageSize} ${stageSize}`}
          className="absolute inset-0 pointer-events-none"
        >
          <circle
            cx={centerCoord}
            cy={centerCoord}
            r={isSplit ? orbitRadius : 76}
            fill="none"
            stroke={nodeAccent.primary}
            strokeOpacity={isSplit ? 0.16 : 0.06}
            strokeDasharray="3 6"
            style={{ transition: 'all 460ms cubic-bezier(0.20, 1.22, 0.32, 1)' }}
          />

          {auditObj.invariants.map((inv, idx) => {
            const rad = (ORBIT_ANGLES_DEG[idx] * Math.PI) / 180;
            const targetX = centerCoord + (isSplit ? Math.cos(rad) * orbitRadius : 0);
            const targetY = centerCoord + (isSplit ? Math.sin(rad) * orbitRadius : 0);
            const invStyle = getHarmonizedScoreStyle(inv.score, nodeAccent);
            const isHighlighted = hoveredInvId === inv.id;

            return (
              <line
                key={inv.id}
                x1={centerCoord}
                y1={centerCoord}
                x2={targetX}
                y2={targetY}
                stroke={isHighlighted ? invStyle.color : nodeAccent.primary}
                strokeWidth={isHighlighted ? 2.4 : 1.15}
                strokeOpacity={isSplit ? (isHighlighted ? 0.95 : 0.28) : 0}
                style={{
                  transition:
                    'x2 460ms cubic-bezier(0.20, 1.22, 0.32, 1), y2 460ms cubic-bezier(0.20, 1.22, 0.32, 1), stroke 420ms ease, stroke-opacity 260ms ease'
                }}
              />
            );
          })}
        </svg>

        {auditObj.invariants.map((inv, idx) => {
          const rad = (ORBIT_ANGLES_DEG[idx] * Math.PI) / 180;
          const dx = isSplit ? Math.cos(rad) * orbitRadius : 0;
          const dy = isSplit ? Math.sin(rad) * orbitRadius : 0;
          const invStyle = getHarmonizedScoreStyle(inv.score, nodeAccent);
          const isHovered = hoveredInvId === inv.id;
          const hasEnergy = Number(inv.score) > 0;
          const idPrefix = isExiting ? `ghost-${auditObj.ticker}` : auditObj.ticker;
          const satGradId = `pinSatGrad-${idPrefix}-${inv.id}`;

          return (
            <button
              key={inv.id}
              type="button"
              onMouseEnter={() => onHoverInv(inv.id)}
              onFocus={() => onHoverInv(inv.id)}
              onClick={(e) => {
                e.stopPropagation();
                onOpenInvariantModal(inv.id);
              }}
              aria-label={`$${auditObj.ticker} ${inv.id} ${inv.title}`}
              className="spring-orbit absolute w-[92px] h-[92px] rounded-full bg-transparent overflow-visible flex flex-col items-center justify-center text-center px-1.5 cursor-pointer focus:outline-none"
              style={{
                left: `${centerCoord - 46}px`,
                top: `${centerCoord - 46}px`,
                transform: `translate(${dx}px, ${dy}px) scale(${
                  isSplit ? (isHovered ? 1.15 : 1) : 0.35
                })`,
                opacity: isSplit ? 1 : 0,
                pointerEvents: isSplit && !isExiting ? 'auto' : 'none',
                zIndex: isHovered ? 32 : 20
              }}
            >
              <span
                className="pointer-events-none absolute inset-[8px] rounded-full transition-shadow duration-300"
                style={{
                  boxShadow: isHovered
                    ? `0 12px 26px rgba(0,0,0,0.88), 0 0 20px ${invStyle.color}66`
                    : `0 8px 20px rgba(0,0,0,0.72), 0 0 10px ${invStyle.bg}`
                }}
              />

              <svg
                viewBox="0 0 140 140"
                shapeRendering="geometricPrecision"
                className="absolute inset-[-24px] w-[calc(100%+48px)] h-[calc(100%+48px)] pointer-events-none overflow-visible"
              >
                <defs>
                  <radialGradient id={satGradId} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#121418" />
                    <stop offset="70%" stopColor="#121418" />
                    <stop
                      offset="100%"
                      stopColor={invStyle.color}
                      stopOpacity={isHovered ? '0.32' : hasEnergy ? '0.18' : '0.08'}
                    />
                  </radialGradient>
                </defs>

                <path
                  ref={(el) => {
                    satEchoRefs.current[idx] = el;
                  }}
                  d={DEFAULT_SAT_ECHO_D}
                  fill="none"
                  stroke={invStyle.color}
                  strokeWidth="1.05"
                  strokeOpacity={isSplit && hasEnergy ? (isHovered ? 0.58 : 0.34) : 0}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  ref={(el) => {
                    satMainRefs.current[idx] = el;
                  }}
                  d={DEFAULT_SAT_MAIN_D}
                  fill={`url(#${satGradId})`}
                  stroke={invStyle.color}
                  strokeOpacity={isHovered ? 1 : hasEnergy ? 0.92 : 0.5}
                  strokeWidth={isHovered ? '2.3' : '1.65'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  ref={(el) => {
                    satInnerRefs.current[idx] = el;
                  }}
                  d={DEFAULT_SAT_INNER_D}
                  fill="none"
                  stroke={invStyle.color}
                  strokeWidth="0.85"
                  strokeDasharray="3 3"
                  strokeOpacity={isSplit && hasEnergy ? 0.25 : 0.09}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="relative z-10 flex flex-col items-center justify-center">
                <span className="font-mono text-[10px] tracking-widest text-neutral-400">
                  {inv.id}
                </span>
                <span className="text-[11px] font-medium text-neutral-100 leading-tight line-clamp-1 mt-0.5">
                  {inv.shortName}
                </span>
                <span
                  className="color-glide font-mono text-[11px] font-bold mt-1 px-1.5 py-0.5 rounded-full"
                  style={{
                    color: invStyle.color,
                    backgroundColor: invStyle.bg
                  }}
                >
                  {formatScore(inv.score)}/1.0
                </span>
              </div>
            </button>
          );
        })}

        <div
          className="spring-orbit relative z-[25] flex items-center justify-center"
          style={{
            width: isSplit ? '150px' : '212px',
            height: isSplit ? '150px' : '212px',
            transition:
              'width 420ms cubic-bezier(0.20, 1.22, 0.32, 1), height 420ms cubic-bezier(0.20, 1.22, 0.32, 1)'
          }}
        >
          <span
            className="pointer-events-none absolute inset-[6px] rounded-full transition-shadow duration-500"
            style={{
              boxShadow: `0 18px 36px rgba(0,0,0,0.84), 0 0 ${
                isFocused ? '34px' : '20px'
              } ${nodeAccent.glow}`
            }}
          />

          <span
            className="pointer-events-none absolute inset-[-10px] rounded-full transition-all duration-500 ease-out"
            style={{
              opacity: isFocused ? 0.85 : 0,
              transform: isFocused ? 'scale(1)' : 'scale(0.9)',
              border: `1px dashed ${nodeAccent.border}`
            }}
          />

          <button
            type="button"
            onClick={onFocusBubble}
            aria-label={`Focus $${auditObj.ticker}`}
            className="relative w-full h-full rounded-full bg-transparent overflow-visible flex flex-col items-center justify-center text-center cursor-pointer focus:outline-none"
          >
            <svg
              viewBox="0 0 280 280"
              shapeRendering="geometricPrecision"
              className="absolute inset-[-34px] w-[calc(100%+68px)] h-[calc(100%+68px)] pointer-events-none overflow-visible"
            >
              <defs>
                <radialGradient
                  id={`pinNucleusGrad-${isExiting ? 'ghost-' : ''}${auditObj.ticker}`}
                  cx="50%"
                  cy="50%"
                  r="50%"
                >
                  <stop offset="0%" stopColor="#121418" />
                  <stop offset="72%" stopColor="#121418" />
                  <stop
                    offset="100%"
                    stopColor={nodeAccent.secondary}
                    stopOpacity={isFocused ? '0.28' : '0.18'}
                  />
                </radialGradient>
                <linearGradient
                  id={`pinRingGrad-${isExiting ? 'ghost-' : ''}${auditObj.ticker}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={nodeAccent.primary} />
                  <stop offset="100%" stopColor={nodeAccent.secondary} />
                </linearGradient>
              </defs>

              <path
                ref={echoWaveRef}
                d={DEFAULT_NUCLEUS_ECHO_D}
                fill="none"
                stroke={nodeAccent.secondary}
                strokeWidth="1.2"
                strokeOpacity={!isSplit && Number(auditObj.totalScore) > 0 ? 0.38 : 0}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                ref={mainWaveRef}
                d={DEFAULT_NUCLEUS_MAIN_D}
                fill={`url(#pinNucleusGrad-${isExiting ? 'ghost-' : ''}${auditObj.ticker})`}
                stroke={`url(#pinRingGrad-${isExiting ? 'ghost-' : ''}${auditObj.ticker})`}
                strokeWidth={isFocused ? '2.7' : '2.1'}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                ref={innerWaveRef}
                d={DEFAULT_NUCLEUS_INNER_D}
                fill="none"
                stroke={nodeAccent.secondary}
                strokeWidth="1"
                strokeDasharray="4 4"
                strokeOpacity={!isSplit && Number(auditObj.totalScore) > 0 ? 0.24 : 0.1}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div className="relative z-10 flex flex-col items-center justify-center px-3">
              <div className="flex items-center justify-center gap-1.5 font-mono text-xs uppercase tracking-[0.16em] text-neutral-200">
                <span className="font-bold mr-[-0.16em]">${auditObj.ticker}</span>
                <Pin className="w-3 h-3 color-glide" style={{ color: nodeAccent.secondary }} />
              </div>

              <div
                className={`color-glide font-display font-bold leading-none tracking-tight my-1.5 px-1 ${
                  isSplit ? 'text-5xl' : 'text-7xl'
                }`}
                style={{
                  backgroundImage: nodeAccent.gradientCss,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: nodeAccent.primary
                }}
              >
                {auditObj.grade}
              </div>

              <div className="font-mono text-xs text-neutral-300 font-semibold">
                {formatScore(auditObj.totalScore)}{' '}
                <span className="text-neutral-500">/ 6.0</span>
              </div>

              {!isSplit && (
                <div className="mt-2.5 px-2.5 py-0.5 rounded-full bg-white/[0.035] border border-white/[0.08] font-mono text-[10px] text-neutral-400 max-w-[144px] truncate transition-opacity duration-300">
                  {auditObj.name}
                </div>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUnpin();
            }}
            aria-label={`Unpin $${auditObj.ticker}`}
            title={`Unpin $${auditObj.ticker}`}
            className="color-glide absolute -top-1.5 -right-1.5 z-30 w-7 h-7 rounded-full bg-[#121418] hover:bg-[#1E222B] border border-white/20 flex items-center justify-center text-neutral-300 hover:text-white shadow-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});
