import { memo, useEffect, useRef, useState } from 'react';
import { Pin, X } from 'lucide-react';
import {
  ORBIT_ANGLES_DEG,
  formatScore,
  getGradeAccent,
  getHarmonizedScoreStyle,
  type AuditData
} from '../data/rubricSpec.ts';
import type { PinOrientationMode } from '../data/constellationOrientation.ts';

export interface WaveLut {
  steps: number;
  cos1: Float32Array;
  sin1: Float32Array;
  sinFA: Float32Array;
  cosFA: Float32Array;
  cosFB: Float32Array;
  sinFB: Float32Array;
  sinFC: Float32Array;
  cosFC: Float32Array;
}

export function createWaveLut(steps: number, fA: number, fB: number, fC: number): WaveLut {
  const cos1 = new Float32Array(steps + 1);
  const sin1 = new Float32Array(steps + 1);
  const sinFA = new Float32Array(steps + 1);
  const cosFA = new Float32Array(steps + 1);
  const cosFB = new Float32Array(steps + 1);
  const sinFB = new Float32Array(steps + 1);
  const sinFC = new Float32Array(steps + 1);
  const cosFC = new Float32Array(steps + 1);

  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    cos1[i] = Math.cos(theta);
    sin1[i] = Math.sin(theta);
    sinFA[i] = Math.sin(fA * theta);
    cosFA[i] = Math.cos(fA * theta);
    cosFB[i] = Math.cos(fB * theta);
    sinFB[i] = Math.sin(fB * theta);
    sinFC[i] = Math.sin(fC * theta);
    cosFC[i] = Math.cos(fC * theta);
  }

  return { steps, cos1, sin1, sinFA, cosFA, cosFB, sinFB, sinFC, cosFC };
}

export const MINI_LUT_MAIN = createWaveLut(32, 6, 3, 9);
export const MINI_LUT_ECHO = createWaveLut(28, 6, 4, 8);
export const MINI_LUT_INNER = createWaveLut(24, 6, 3, 12);

export const NUCLEUS_LUT_MAIN = createWaveLut(72, 6, 3, 9);
export const NUCLEUS_LUT_ECHO = createWaveLut(64, 6, 4, 8);
export const NUCLEUS_LUT_INNER = createWaveLut(56, 6, 3, 12);

export const SAT_LUT_MAIN = createWaveLut(48, 5, 3, 8);
export const SAT_LUT_ECHO = createWaveLut(44, 5, 4, 7);
export const SAT_LUT_INNER = createWaveLut(40, 5, 3, 10);

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
  const { steps, cos1, sin1, sinFA, cosFA, cosFB, sinFB, sinFC, cosFC } = lut;
  if (amp <= 0.005) {
    const r = baseR.toFixed(1);
    return `M ${(cx + baseR).toFixed(1)} ${cy.toFixed(1)} A ${r} ${r} 0 1 1 ${(cx - baseR).toFixed(
      1
    )} ${cy.toFixed(1)} A ${r} ${r} 0 1 1 ${(cx + baseR).toFixed(1)} ${cy.toFixed(1)} Z`;
  }

  const cP1 = Math.cos(ph);
  const sP1 = Math.sin(ph);
  const p2 = ph * mulB;
  const cP2 = Math.cos(p2);
  const sP2 = Math.sin(p2);
  const p3 = ph * mulC;
  const cP3 = Math.cos(p3);
  const sP3 = Math.sin(p3);

  const parts = new Array<string>(steps + 2);
  for (let i = 0; i <= steps; i++) {
    const termA = sinFA[i] * cP1 + cosFA[i] * sP1;
    const termB = cosFB[i] * cP2 + sinFB[i] * sP2;
    const termC = sinFC[i] * cP3 + cosFC[i] * sP3;
    const r = baseR + amp * (0.54 * termA + 0.31 * termB + 0.15 * termC);
    const x = ((cx + cos1[i] * r) * 10 | 0) * 0.1;
    const y = ((cy + sin1[i] * r) * 10 | 0) * 0.1;
    parts[i] = i === 0 ? `M${x} ${y}` : `L${x} ${y}`;
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

function runSharedWaveLoop(now: number): void {
  if (
    waveSubscribers.size === 0 ||
    sharedWavePaused ||
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
  const mainPathRef = useRef<SVGPathElement | null>(null);
  const echoPathRef = useRef<SVGPathElement | null>(null);
  const innerPathRef = useRef<SVGPathElement | null>(null);

  const rawScore = Math.max(0, Math.min(6, Number(item?.totalScore) || 0));
  const isZeroFlat = rawScore === 0;
  const itemAccent = getGradeAccent(item?.grade);
  const isHighlighted = isSelected || isPinnedItem;
  const effectiveSize = Math.max(60, Math.round(sizePx || 68));
  const svgOutsetPx = Math.round(effectiveSize * (10 / 68));

  useEffect(() => {
    if (isZeroFlat) return undefined;

    let phase = seedIndex * 0.95;
    // +25% harmonic wave amplitude upgrade (1.25x crest multiplier); E=0 remains flatlined (0)
    const amp = 1.25 * (1.6 + Math.pow(rawScore / 6.0, 1.12) * 5.0);
    const speed = (0.018 + (rawScore / 6.0) * 0.028) * 1.85;

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

    renderMini(phase);
    return subscribeSharedWave((dt) => {
      phase += speed * Math.min(1.5, dt);
      renderMini(phase);
    }, 12);
  }, [rawScore, isZeroFlat, isHighlighted, seedIndex]);

  return (
    <div className="group relative inline-flex items-center justify-center">
      <span
        className="pointer-events-none absolute inset-[4px] rounded-full transition-all duration-300 ease-out"
        style={{
          boxShadow: isHighlighted
            ? `0 8px 18px rgba(0,0,0,0.85), 0 0 16px ${itemAccent.glow}`
            : '0 6px 14px rgba(0,0,0,0.68)',
          border: isHighlighted ? `1px solid ${itemAccent.border}` : '1px solid transparent',
          transform: isHighlighted ? 'scale(1.16)' : 'scale(1)'
        }}
      />

      <button
        type="button"
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
          style={{
            left: `-${svgOutsetPx}px`,
            top: `-${svgOutsetPx}px`,
            width: `${effectiveSize + svgOutsetPx * 2}px`,
            height: `${effectiveSize + svgOutsetPx * 2}px`
          }}
          className="absolute pointer-events-none"
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
              />
              <path
                ref={mainPathRef}
                d={DEFAULT_MINI_MAIN_D}
                fill={`url(#projBubbleGrad-${item.ticker})`}
                stroke={`url(#projRingGrad-${item.ticker})`}
                strokeOpacity={isHighlighted ? 1 : 0.8}
                strokeWidth={isHighlighted ? '2.1' : '1.55'}
              />
              <path
                ref={innerPathRef}
                d={DEFAULT_MINI_INNER_D}
                fill="none"
                stroke={itemAccent.secondary}
                strokeWidth="0.85"
                strokeDasharray="3 3"
                strokeOpacity={isHighlighted ? 0.32 : 0.18}
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

export type ThreeFormationMode = 'TRIANGLE' | 'SIDE_BY_SIDE';
export type FourFormationMode = 'RHOMBUS' | 'SQUARE' | 'SIDE_BY_SIDE';

export interface ConstellationLayout {
  width: number;
  height: number;
  nodeScale: number;
  positions: Array<{ x: number; y: number }>;
  edges: Array<[number, number]>;
  diagonals: Array<[number, number]>;
}

export function getConstellationLayout(
  count: number,
  threeMode: ThreeFormationMode = 'TRIANGLE',
  fourMode: FourFormationMode = 'RHOMBUS',
  orientationMode: PinOrientationMode | boolean = 'desktop'
): ConstellationLayout {
  const mode: PinOrientationMode =
    typeof orientationMode === 'boolean'
      ? orientationMode
        ? 'vertical'
        : 'desktop'
      : orientationMode;

  if (mode === 'vertical' && count >= 2) {
    const width = 440;
    const topPad = 212;
    const stepY = 420;
    const positions = Array.from({ length: count }, (_, idx) => ({
      x: 220,
      y: topPad + idx * stepY
    }));
    const edges: Array<[number, number]> = Array.from(
      { length: Math.max(0, count - 1) },
      (_, idx) => [idx, idx + 1]
    );
    return {
      width,
      height: topPad * 2 + Math.max(0, count - 1) * stepY,
      nodeScale: 0.96,
      positions,
      edges,
      diagonals: []
    };
  }

  if (mode === 'horizontal' && count >= 2) {
    if (count === 2) {
      return {
        width: 780,
        height: 385,
        nodeScale: 0.84,
        positions: [
          { x: 195, y: 192 },
          { x: 585, y: 192 }
        ],
        edges: [[0, 1]],
        diagonals: []
      };
    }
    if (count === 3) {
      return {
        width: 1040,
        height: 350,
        nodeScale: 0.72,
        positions: [
          { x: 175, y: 175 },
          { x: 520, y: 175 },
          { x: 865, y: 175 }
        ],
        edges: [
          [0, 1],
          [1, 2]
        ],
        diagonals: []
      };
    }
    return {
      width: 1140,
      height: 320,
      nodeScale: 0.58,
      positions: [
        { x: 150, y: 160 },
        { x: 430, y: 160 },
        { x: 710, y: 160 },
        { x: 990, y: 160 }
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3]
      ],
      diagonals: []
    };
  }

  if (count === 2) {
    return {
      width: 940,
      height: 420,
      nodeScale: 0.86,
      positions: [
        { x: 250, y: 210 },
        { x: 690, y: 210 }
      ],
      edges: [[0, 1]],
      diagonals: []
    };
  }

  if (count === 3) {
    if (threeMode === 'SIDE_BY_SIDE') {
      return {
        width: 1120,
        height: 380,
        nodeScale: 0.73,
        positions: [
          { x: 195, y: 190 },
          { x: 560, y: 190 },
          { x: 925, y: 190 }
        ],
        edges: [
          [0, 1],
          [1, 2]
        ],
        diagonals: []
      };
    }
    return {
      width: 960,
      height: 680,
      nodeScale: 0.75,
      positions: [
        { x: 480, y: 175 },
        { x: 245, y: 505 },
        { x: 715, y: 505 }
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 0]
      ],
      diagonals: []
    };
  }

  if (fourMode === 'SQUARE') {
    return {
      width: 960,
      height: 720,
      nodeScale: 0.74,
      positions: [
        { x: 285, y: 185 },
        { x: 675, y: 185 },
        { x: 285, y: 535 },
        { x: 675, y: 535 }
      ],
      edges: [
        [0, 1],
        [1, 3],
        [3, 2],
        [2, 0]
      ],
      diagonals: [
        [0, 3],
        [1, 2]
      ]
    };
  }

  if (fourMode === 'SIDE_BY_SIDE') {
    return {
      width: 1180,
      height: 336,
      nodeScale: 0.59,
      positions: [
        { x: 155, y: 168 },
        { x: 445, y: 168 },
        { x: 735, y: 168 },
        { x: 1025, y: 168 }
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3]
      ],
      diagonals: []
    };
  }

  return {
    width: 1040,
    height: 770,
    nodeScale: 0.7,
    positions: [
      { x: 520, y: 162 },
      { x: 210, y: 385 },
      { x: 830, y: 385 },
      { x: 520, y: 608 }
    ],
    edges: [
      [0, 1],
      [1, 3],
      [3, 2],
      [2, 0]
    ],
    diagonals: [
      [0, 3],
      [1, 2]
    ]
  };
}

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

export function PinnedOrbitalNode({
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
                className="absolute inset-[-24px] w-[calc(100%+48px)] h-[calc(100%+48px)] pointer-events-none"
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
              className="absolute inset-[-34px] w-[calc(100%+68px)] h-[calc(100%+68px)] pointer-events-none"
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
              />

              <path
                ref={mainWaveRef}
                d={DEFAULT_NUCLEUS_MAIN_D}
                fill={`url(#pinNucleusGrad-${isExiting ? 'ghost-' : ''}${auditObj.ticker})`}
                stroke={`url(#pinRingGrad-${isExiting ? 'ghost-' : ''}${auditObj.ticker})`}
                strokeWidth={isFocused ? '2.7' : '2.1'}
              />

              <path
                ref={innerWaveRef}
                d={DEFAULT_NUCLEUS_INNER_D}
                fill="none"
                stroke={nodeAccent.secondary}
                strokeWidth="1"
                strokeDasharray="4 4"
                strokeOpacity={!isSplit && Number(auditObj.totalScore) > 0 ? 0.24 : 0.1}
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
}
