import { GRADE_RANK, ORBIT_ANGLES_DEG } from './rubricSpec.ts';
import type { PinOrientationMode } from './constellationOrientation.ts';

export interface ConstellationLayout {
  width: number;
  height: number;
  nodeScale: number;
  positions: Array<{ x: number; y: number }>;
  edges: Array<[number, number]>;
  diagonals: Array<[number, number]>;
}

export interface ConstellationDeltaLink {
  id: string;
  fromIdx: number;
  toIdx: number;
  isDiagonal: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  pillX: number;
  pillY: number;
  pillWidth: number;
  pillHeight: number;
  fontSize: number;
  strokeWidth: number;
}

export interface ConstellationFitOptions {
  wrapWidth: number;
  viewportHeight: number;
  pinMaxScale?: number;
  overlapBufferPx?: number;
}

export interface ConstellationClearanceMetrics {
  minSatWaveGapPx: number;
  minSatButtonGapPx: number;
  minNucleusGapPx: number;
}

// Geometry constants in PinnedOrbitalNode local coordinates (nodeScale = 1.0)
export const PIN_STAGE_SIZE_PX = 440;
export const PIN_STAGE_CENTER_PX = 220;
export const PIN_ORBIT_RADIUS_PX = 152;
export const PIN_SAT_BUTTON_RADIUS_PX = 46;
// Satellite wave echo/main crest extends up to ~10px beyond the 46px button border
export const PIN_SAT_WAVE_RADIUS_PX = 56;
export const PIN_NUCLEUS_SPLIT_RADIUS_PX = 75;
export const PIN_NUCLEUS_UNSPLIT_WAVE_RADIUS_PX = 124;

// Split hex constellation bounding half-extents (at nodeScale = 1.0)
export const PIN_HEX_HALF_WIDTH_PX = Math.ceil(
  PIN_ORBIT_RADIUS_PX * Math.cos(Math.PI / 6) + PIN_SAT_WAVE_RADIUS_PX
); // 188
export const PIN_HEX_HALF_HEIGHT_PX = PIN_ORBIT_RADIUS_PX + PIN_SAT_WAVE_RADIUS_PX; // 208

export const PIN_HEX_SAT_OFFSETS: ReadonlyArray<{ x: number; y: number }> = ORBIT_ANGLES_DEG.map(
  (deg) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: Math.cos(rad) * PIN_ORBIT_RADIUS_PX,
      y: Math.sin(rad) * PIN_ORBIT_RADIUS_PX
    };
  }
);

function resolveDesiredWaveBufferPx(scale: number, explicitBufferPx?: number): number {
  if (typeof explicitBufferPx === 'number' && Number.isFinite(explicitBufferPx) && explicitBufferPx >= 0) {
    return explicitBufferPx;
  }
  return Math.max(8, 14 * scale);
}

/**
 * Computes exact minimum screen-pixel clearance between all pairs of pinned bubbles
 * in a constellation, accounting for expanded 6-satellite hex orbits, wave crests,
 * and split central nuclei.
 */
export function measureConstellationClearance(
  positions: ReadonlyArray<{ x: number; y: number }>,
  effectiveScale: number
): ConstellationClearanceMetrics {
  if (positions.length < 2) {
    return {
      minSatWaveGapPx: Infinity,
      minSatButtonGapPx: Infinity,
      minNucleusGapPx: Infinity
    };
  }

  let minSatWaveGapPx = Infinity;
  let minSatButtonGapPx = Infinity;
  let minNucleusGapPx = Infinity;

  const satWaveR = PIN_SAT_WAVE_RADIUS_PX * effectiveScale;
  const satBtnR = PIN_SAT_BUTTON_RADIUS_PX * effectiveScale;
  const nucleusSplitR = PIN_NUCLEUS_SPLIT_RADIUS_PX * effectiveScale;

  for (let i = 0; i < positions.length; i++) {
    const a = positions[i];
    for (let j = i + 1; j < positions.length; j++) {
      const b = positions[j];

      const centerDist = Math.hypot(a.x - b.x, a.y - b.y);
      minNucleusGapPx = Math.min(minNucleusGapPx, centerDist - 2 * nucleusSplitR);

      for (let sa = 0; sa < PIN_HEX_SAT_OFFSETS.length; sa++) {
        const ax = a.x + PIN_HEX_SAT_OFFSETS[sa].x * effectiveScale;
        const ay = a.y + PIN_HEX_SAT_OFFSETS[sa].y * effectiveScale;

        const dSatB = Math.hypot(ax - b.x, ay - b.y);
        minNucleusGapPx = Math.min(minNucleusGapPx, dSatB - satWaveR - nucleusSplitR);

        for (let sb = 0; sb < PIN_HEX_SAT_OFFSETS.length; sb++) {
          const bx = b.x + PIN_HEX_SAT_OFFSETS[sb].x * effectiveScale;
          const by = b.y + PIN_HEX_SAT_OFFSETS[sb].y * effectiveScale;
          const satDist = Math.hypot(ax - bx, ay - by);
          minSatWaveGapPx = Math.min(minSatWaveGapPx, satDist - 2 * satWaveR);
          minSatButtonGapPx = Math.min(minSatButtonGapPx, satDist - 2 * satBtnR);
        }
      }
    }
  }

  return { minSatWaveGapPx, minSatButtonGapPx, minNucleusGapPx };
}

function pairFitsWithBuffer(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  scale: number,
  waveBufferPx: number
): boolean {
  const satWaveR = PIN_SAT_WAVE_RADIUS_PX * scale;
  const nucleusUnsplitR = PIN_NUCLEUS_UNSPLIT_WAVE_RADIUS_PX * scale;
  const minSatCenterDist = 2 * satWaveR + waveBufferPx;
  const centerDist = Math.hypot(ax - bx, ay - by);

  if (centerDist < 2 * nucleusUnsplitR + waveBufferPx) return false;

  for (let sa = 0; sa < PIN_HEX_SAT_OFFSETS.length; sa++) {
    const sax = ax + PIN_HEX_SAT_OFFSETS[sa].x * scale;
    const say = ay + PIN_HEX_SAT_OFFSETS[sa].y * scale;
    for (let sb = 0; sb < PIN_HEX_SAT_OFFSETS.length; sb++) {
      const sbx = bx + PIN_HEX_SAT_OFFSETS[sb].x * scale;
      const sby = by + PIN_HEX_SAT_OFFSETS[sb].y * scale;
      if (Math.hypot(sax - sbx, say - sby) < minSatCenterDist) {
        return false;
      }
    }
  }
  return true;
}

function minCenterStepAlongAxis(
  ux: number,
  uy: number,
  scale: number,
  waveBufferPx: number
): number {
  let lo = 2 * PIN_NUCLEUS_UNSPLIT_WAVE_RADIUS_PX * scale + waveBufferPx;
  let hi = (2 * PIN_HEX_HALF_HEIGHT_PX + 80) * scale + waveBufferPx;
  for (let iter = 0; iter < 22; iter++) {
    const mid = (lo + hi) * 0.5;
    if (pairFitsWithBuffer(0, 0, ux * mid, uy * mid, scale, waveBufferPx)) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return hi;
}

function normalizeAndRoundLayout(
  rawPositions: Array<{ x: number; y: number }>,
  nodeScale: number,
  edges: Array<[number, number]>,
  diagonals: Array<[number, number]>
): ConstellationLayout {
  if (rawPositions.length === 0) {
    return { width: 440, height: 440, nodeScale: 1, positions: [], edges, diagonals };
  }

  const hw = PIN_HEX_HALF_WIDTH_PX * nodeScale;
  const hh = PIN_HEX_HALF_HEIGHT_PX * nodeScale;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of rawPositions) {
    minX = Math.min(minX, p.x - hw);
    maxX = Math.max(maxX, p.x + hw);
    minY = Math.min(minY, p.y - hh);
    maxY = Math.max(maxY, p.y + hh);
  }

  const width = Math.max(1, Math.ceil(maxX - minX));
  const height = Math.max(1, Math.ceil(maxY - minY));
  const shiftX = (width - (maxX + minX)) / 2;
  const shiftY = (height - (maxY + minY)) / 2;

  return {
    width,
    height,
    nodeScale: Math.round(nodeScale * 1000) / 1000,
    positions: rawPositions.map((p) => ({
      x: Math.round((p.x + shiftX) * 10) / 10,
      y: Math.round((p.y + shiftY) * 10) / 10
    })),
    edges,
    diagonals
  };
}

function solveRowLayout(
  count: number,
  availW: number,
  availH: number,
  maxScale: number,
  explicitBufferPx?: number
): ConstellationLayout {
  const edges: Array<[number, number]> = Array.from(
    { length: Math.max(0, count - 1) },
    (_, idx) => [idx, idx + 1]
  );

  const buildAtScale = (s: number) => {
    const buf = resolveDesiredWaveBufferPx(s, explicitBufferPx);
    const minStepX = minCenterStepAlongAxis(1, 0, s, buf);
    const totalNeededW = 2 * PIN_HEX_HALF_WIDTH_PX * s + (count - 1) * minStepX;
    const totalNeededH = 2 * PIN_HEX_HALF_HEIGHT_PX * s;
    return { buf, minStepX, totalNeededW, totalNeededH };
  };

  let lo = 0.25;
  let hi = Math.max(lo, maxScale);
  for (let iter = 0; iter < 24; iter++) {
    const mid = (lo + hi) * 0.5;
    const m = buildAtScale(mid);
    if (m.totalNeededW <= availW && m.totalNeededH <= availH) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const s = lo;
  const m = buildAtScale(s);
  const maxStepInWrap =
    count > 1 ? Math.max(m.minStepX, (availW - 2 * PIN_HEX_HALF_WIDTH_PX * s) / (count - 1)) : 0;
  // Allow modest proportional breathing if height-limited, without floating nodes far into corners
  const stepX = Math.min(maxStepInWrap, m.minStepX * 1.14);

  const positions = Array.from({ length: count }, (_, idx) => ({
    x: idx * stepX,
    y: 0
  }));

  return normalizeAndRoundLayout(positions, s, edges, []);
}

function solveVerticalLayout(
  count: number,
  availW: number,
  availH: number,
  maxScale: number,
  explicitBufferPx?: number
): ConstellationLayout {
  const edges: Array<[number, number]> = Array.from(
    { length: Math.max(0, count - 1) },
    (_, idx) => [idx, idx + 1]
  );

  const buildAtScale = (s: number) => {
    const buf = resolveDesiredWaveBufferPx(s, explicitBufferPx);
    const minStepY = minCenterStepAlongAxis(0, 1, s, buf);
    const totalNeededW = 2 * PIN_HEX_HALF_WIDTH_PX * s;
    const totalNeededH = 2 * PIN_HEX_HALF_HEIGHT_PX * s + (count - 1) * minStepY;
    return { buf, minStepY, totalNeededW, totalNeededH };
  };

  let lo = 0.25;
  let hi = Math.max(lo, maxScale);
  for (let iter = 0; iter < 24; iter++) {
    const mid = (lo + hi) * 0.5;
    const m = buildAtScale(mid);
    if (m.totalNeededW <= availW && m.totalNeededH <= availH) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const s = lo;
  const m = buildAtScale(s);
  const positions = Array.from({ length: count }, (_, idx) => ({
    x: 0,
    y: idx * m.minStepY
  }));

  return normalizeAndRoundLayout(positions, s, edges, []);
}

function solveTriangleLayout(
  availW: number,
  availH: number,
  maxScale: number,
  explicitBufferPx?: number
): ConstellationLayout | null {
  const edges: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [2, 0]
  ];

  const computeGeometry = (s: number) => {
    const buf = resolveDesiredWaveBufferPx(s, explicitBufferPx);
    const hw = PIN_HEX_HALF_WIDTH_PX * s;
    const hh = PIN_HEX_HALF_HEIGHT_PX * s;
    const maxDy = availH - 1 - 2 * hh;
    const maxDx = (availW - 1) / 2 - hw;
    const minHorizStep = minCenterStepAlongAxis(1, 0, s, buf);
    if (maxDy <= 0 || maxDx < minHorizStep * 0.5) return null;

    const minTriDy = Math.min(maxDy, 120 * s);
    let bestCandidate: { dx: number; dy: number; score: number } | null = null;
    const idealDy = Math.min(maxDy, 290 * s);

    for (let k = 0; k <= 20; k++) {
      const dy = minTriDy + (maxDy - minTriDy) * (k / 20);
      if (!pairFitsWithBuffer(0, 0, maxDx, dy, s, buf)) continue;

      let loX = minHorizStep * 0.5;
      let hiX = maxDx;
      for (let iter = 0; iter < 18; iter++) {
        const midX = (loX + hiX) * 0.5;
        if (pairFitsWithBuffer(0, 0, midX, dy, s, buf)) {
          hiX = midX;
        } else {
          loX = midX;
        }
      }

      const dx = Math.min(maxDx, Math.max(hiX, hiX * 1.12));
      const balancePenalty = Math.abs(dy - idealDy);
      if (!bestCandidate || balancePenalty < bestCandidate.score) {
        bestCandidate = { dx, dy, score: balancePenalty };
      }
    }

    if (!bestCandidate) return null;
    const { dx, dy } = bestCandidate;
    return {
      positions: [
        { x: 0, y: 0 },
        { x: -dx, y: dy },
        { x: dx, y: dy }
      ]
    };
  };

  if (!computeGeometry(0.25)) {
    return null;
  }

  let lo = 0.25;
  let hi = Math.max(lo, maxScale);
  for (let iter = 0; iter < 24; iter++) {
    const mid = (lo + hi) * 0.5;
    if (computeGeometry(mid)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const best = computeGeometry(lo);
  if (!best) return null;
  return normalizeAndRoundLayout(best.positions, lo, edges, []);
}

function solveSquareLayout(
  availW: number,
  availH: number,
  maxScale: number,
  explicitBufferPx?: number
): ConstellationLayout | null {
  const edges: Array<[number, number]> = [
    [0, 1],
    [1, 3],
    [3, 2],
    [2, 0]
  ];
  const diagonals: Array<[number, number]> = [
    [0, 3],
    [1, 2]
  ];

  const computeGeometry = (s: number) => {
    const buf = resolveDesiredWaveBufferPx(s, explicitBufferPx);
    const hw = PIN_HEX_HALF_WIDTH_PX * s;
    const hh = PIN_HEX_HALF_HEIGHT_PX * s;
    const maxDx = availW - 1 - 2 * hw;
    const maxDy = availH - 1 - 2 * hh;
    const minDx = minCenterStepAlongAxis(1, 0, s, buf);
    const minDy = minCenterStepAlongAxis(0, 1, s, buf);
    if (maxDx < minDx || maxDy < minDy) return null;

    const dy = Math.min(maxDy, Math.max(minDy, minDy * 1.12));
    const dx = Math.min(maxDx, Math.max(minDx, minDx * 1.15));

    const positions = [
      { x: 0, y: 0 },
      { x: dx, y: 0 },
      { x: 0, y: dy },
      { x: dx, y: dy }
    ];
    return { positions };
  };

  if (!computeGeometry(0.25)) {
    return null;
  }

  let lo = 0.25;
  let hi = Math.max(lo, maxScale);
  for (let iter = 0; iter < 24; iter++) {
    const mid = (lo + hi) * 0.5;
    if (computeGeometry(mid)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const best = computeGeometry(lo);
  if (!best) return null;
  return normalizeAndRoundLayout(best.positions, lo, edges, diagonals);
}

function solveHorizZigZagLayout(
  availW: number,
  availH: number,
  maxScale: number,
  explicitBufferPx?: number
): ConstellationLayout | null {
  const edges: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3]
  ];
  const diagonals: Array<[number, number]> = [
    [0, 2],
    [1, 3]
  ];

  const computeGeometry = (s: number) => {
    const buf = resolveDesiredWaveBufferPx(s, explicitBufferPx);
    const hw = PIN_HEX_HALF_WIDTH_PX * s;
    const hh = PIN_HEX_HALF_HEIGHT_PX * s;
    const maxDy = availH - 1 - 2 * hh;
    const maxDx = (availW - 1 - 2 * hw) / 3;
    if (maxDy <= 0 || maxDx <= 0) return null;

    const minSameRowDx = minCenterStepAlongAxis(1, 0, s, buf) * 0.5;
    if (maxDx < minSameRowDx) return null;

    const minZigDy = Math.min(maxDy, 120 * s);
    const idealDy = Math.min(maxDy, 295 * s);
    let bestCandidate: { dx: number; dy: number; score: number } | null = null;

    for (let k = 0; k <= 24; k++) {
      const dy = minZigDy + (maxDy - minZigDy) * (k / 24);
      if (
        !pairFitsWithBuffer(0, -dy * 0.5, maxDx, dy * 0.5, s, buf) ||
        !pairFitsWithBuffer(0, -dy * 0.5, 3 * maxDx, dy * 0.5, s, buf)
      ) {
        continue;
      }

      let loX = minSameRowDx;
      let hiX = maxDx;
      for (let iter = 0; iter < 18; iter++) {
        const midX = (loX + hiX) * 0.5;
        if (
          pairFitsWithBuffer(0, -dy * 0.5, midX, dy * 0.5, s, buf) &&
          pairFitsWithBuffer(0, -dy * 0.5, 3 * midX, dy * 0.5, s, buf)
        ) {
          hiX = midX;
        } else {
          loX = midX;
        }
      }

      const dx = Math.min(maxDx, hiX * 1.12);
      const balancePenalty = Math.abs(dy - idealDy);
      if (!bestCandidate || balancePenalty < bestCandidate.score) {
        bestCandidate = { dx, dy, score: balancePenalty };
      }
    }

    if (!bestCandidate) return null;
    const { dx, dy } = bestCandidate;
    return {
      positions: [
        { x: 0, y: -dy * 0.5 },
        { x: dx, y: dy * 0.5 },
        { x: 2 * dx, y: -dy * 0.5 },
        { x: 3 * dx, y: dy * 0.5 }
      ]
    };
  };

  if (!computeGeometry(0.25)) {
    return null;
  }

  let lo = 0.25;
  let hi = Math.max(lo, maxScale);
  for (let iter = 0; iter < 24; iter++) {
    const mid = (lo + hi) * 0.5;
    if (computeGeometry(mid)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const best = computeGeometry(lo);
  if (!best) return null;
  return normalizeAndRoundLayout(best.positions, lo, edges, diagonals);
}

function solveVertZigZagLayout(
  availW: number,
  availH: number,
  maxScale: number,
  explicitBufferPx?: number
): ConstellationLayout | null {
  const edges: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3]
  ];
  const diagonals: Array<[number, number]> = [
    [0, 2],
    [1, 3]
  ];

  const computeGeometry = (s: number) => {
    const buf = resolveDesiredWaveBufferPx(s, explicitBufferPx);
    const hw = PIN_HEX_HALF_WIDTH_PX * s;
    const hh = PIN_HEX_HALF_HEIGHT_PX * s;
    const maxDx = availW - 1 - 2 * hw;
    const maxDy = (availH - 1 - 2 * hh) / 3;
    if (maxDx <= 0 || maxDy <= 0) return null;

    const minSameColDy = minCenterStepAlongAxis(0, 1, s, buf) * 0.5;
    if (maxDy < minSameColDy) return null;

    const minZigDx = Math.min(maxDx, 120 * s);
    const idealDx = Math.min(maxDx, 285 * s);
    let bestCandidate: { dx: number; dy: number; score: number } | null = null;

    for (let k = 0; k <= 24; k++) {
      const dx = minZigDx + (maxDx - minZigDx) * (k / 24);
      if (
        !pairFitsWithBuffer(-dx * 0.5, 0, dx * 0.5, maxDy, s, buf) ||
        !pairFitsWithBuffer(-dx * 0.5, 0, dx * 0.5, 3 * maxDy, s, buf)
      ) {
        continue;
      }

      let loY = minSameColDy;
      let hiY = maxDy;
      for (let iter = 0; iter < 18; iter++) {
        const midY = (loY + hiY) * 0.5;
        if (
          pairFitsWithBuffer(-dx * 0.5, 0, dx * 0.5, midY, s, buf) &&
          pairFitsWithBuffer(-dx * 0.5, 0, dx * 0.5, 3 * midY, s, buf)
        ) {
          hiY = midY;
        } else {
          loY = midY;
        }
      }

      const dy = Math.min(maxDy, hiY * 1.1);
      const balancePenalty = Math.abs(dx - idealDx);
      if (!bestCandidate || balancePenalty < bestCandidate.score) {
        bestCandidate = { dx, dy, score: balancePenalty };
      }
    }

    if (!bestCandidate) return null;
    const { dx, dy } = bestCandidate;
    return {
      positions: [
        { x: -dx * 0.5, y: 0 },
        { x: dx * 0.5, y: dy },
        { x: -dx * 0.5, y: 2 * dy },
        { x: dx * 0.5, y: 3 * dy }
      ]
    };
  };

  if (!computeGeometry(0.25)) {
    return null;
  }

  let lo = 0.25;
  let hi = Math.max(lo, maxScale);
  for (let iter = 0; iter < 24; iter++) {
    const mid = (lo + hi) * 0.5;
    if (computeGeometry(mid)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const best = computeGeometry(lo);
  if (!best) return null;
  return normalizeAndRoundLayout(best.positions, lo, edges, diagonals);
}

function pickLargestBubbleLayout(
  candidates: Array<ConstellationLayout | null>,
  fallback: ConstellationLayout
): ConstellationLayout {
  let best: ConstellationLayout | null = null;
  for (const cand of candidates) {
    if (!cand) continue;
    if (!best || cand.nodeScale > best.nodeScale + 0.004) {
      best = cand;
    }
  }
  return best ?? fallback;
}

/**
 * Deterministically places 2–4 pinned bubbles into whichever formation fits
 * the available arena with the largest harmonic bubble scale and guaranteed overlap buffer:
 * - 2 pins: horizontal pair (or vertical stack on narrow-tall desktop viewports)
 * - 3 pins: adaptive triangle / row / vertical stack
 * - 4 pins: horizontal zig-zag on widescreen displays, falling back to 2x2 square / vertical zig-zag / row where taller or wider viewports allow larger bubbles
 */
export function getConstellationLayout(
  count: number,
  orientationMode: PinOrientationMode | boolean = 'desktop',
  fitOptions?: ConstellationFitOptions
): ConstellationLayout {
  const mode: PinOrientationMode =
    typeof orientationMode === 'boolean'
      ? orientationMode
        ? 'vertical'
        : 'desktop'
      : orientationMode;

  if (fitOptions) {
    const safeWrap = Math.max(240, Number(fitOptions.wrapWidth) || 240);
    const safeViewH = Math.max(480, Number(fitOptions.viewportHeight) || 900);
    const explicitBuf = fitOptions.overlapBufferPx;

    if (mode === 'vertical' && count >= 2) {
      const availW = Math.max(240, safeWrap - 4);
      const baseTwoH = Math.max(460, safeViewH - 184);
      const availH =
        count === 2 ? baseTwoH : Math.max(540, Math.round(baseTwoH * (1 + (count - 2) * 0.62)));
      const maxScale = Math.min(1.25, Math.max(0.6, fitOptions.pinMaxScale ?? 1.15));
      const vert = solveVerticalLayout(count, availW, availH, maxScale, explicitBuf);
      if (count >= 4) {
        return pickLargestBubbleLayout(
          [vert, solveVertZigZagLayout(availW, availH, maxScale, explicitBuf)],
          vert
        );
      }
      return vert;
    }

    if (mode === 'horizontal' && count >= 2) {
      const availW = Math.max(280, safeWrap - 8);
      const availH = Math.max(250, safeViewH - 210);
      const maxScale = Math.min(1.65, Math.max(0.55, fitOptions.pinMaxScale ?? 1.35));
      const rowFallback = solveRowLayout(count, availW, availH, maxScale, explicitBuf);
      if (count === 2) return rowFallback;
      if (count === 3) {
        return pickLargestBubbleLayout(
          [solveTriangleLayout(availW, availH, maxScale, explicitBuf), rowFallback],
          rowFallback
        );
      }
      return pickLargestBubbleLayout(
        [
          solveHorizZigZagLayout(availW, availH, maxScale, explicitBuf),
          rowFallback,
          solveSquareLayout(availW, availH, maxScale, explicitBuf)
        ],
        rowFallback
      );
    }

    // Desktop: deterministically pick the formation that yields the largest bubbles
    const availW = Math.max(280, safeWrap - 8);
    const availH = Math.max(360, safeViewH - 326);
    const maxScale = Math.min(2.9, Math.max(0.75, fitOptions.pinMaxScale ?? 2.8));

    if (count === 2) {
      const row2 = solveRowLayout(2, availW, availH, maxScale, explicitBuf);
      const vert2 = solveVerticalLayout(2, availW, availH, maxScale, explicitBuf);
      return pickLargestBubbleLayout([row2, vert2], row2);
    }

    if (count === 3) {
      const row3 = solveRowLayout(3, availW, availH, maxScale, explicitBuf);
      return pickLargestBubbleLayout(
        [
          solveTriangleLayout(availW, availH, maxScale, explicitBuf),
          row3,
          solveVerticalLayout(3, availW, availH, maxScale, explicitBuf)
        ],
        row3
      );
    }

    const row4 = solveRowLayout(4, availW, availH, maxScale, explicitBuf);
    return pickLargestBubbleLayout(
      [
        solveHorizZigZagLayout(availW, availH, maxScale, explicitBuf),
        row4,
        solveSquareLayout(availW, availH, maxScale, explicitBuf),
        solveVertZigZagLayout(availW, availH, maxScale, explicitBuf)
      ],
      row4
    );
  }

  // Canonical un-fitted layouts (used by pure scaling callers without container bounds)
  if (mode === 'vertical' && count >= 2) {
    const stepY = 428;
    const width = PIN_HEX_HALF_WIDTH_PX * 2;
    const positions = Array.from({ length: count }, (_, idx) => ({
      x: PIN_HEX_HALF_WIDTH_PX,
      y: PIN_HEX_HALF_HEIGHT_PX + idx * stepY
    }));
    const edges: Array<[number, number]> = Array.from(
      { length: Math.max(0, count - 1) },
      (_, idx) => [idx, idx + 1]
    );
    return {
      width,
      height: PIN_HEX_HALF_HEIGHT_PX * 2 + Math.max(0, count - 1) * stepY,
      nodeScale: 1,
      positions,
      edges,
      diagonals: []
    };
  }

  if (mode === 'horizontal' && count >= 2) {
    return solveRowLayout(count, 1180, 420, 1.0);
  }

  if (count === 2) {
    const stepX = 394;
    return {
      width: PIN_HEX_HALF_WIDTH_PX * 2 + stepX,
      height: PIN_HEX_HALF_HEIGHT_PX * 2,
      nodeScale: 1,
      positions: [
        { x: PIN_HEX_HALF_WIDTH_PX, y: PIN_HEX_HALF_HEIGHT_PX },
        { x: PIN_HEX_HALF_WIDTH_PX + stepX, y: PIN_HEX_HALF_HEIGHT_PX }
      ],
      edges: [[0, 1]],
      diagonals: []
    };
  }

  if (count === 3) {
    return solveTriangleLayout(1120, 760, 1.0) ?? solveRowLayout(3, 1280, 500, 1.0);
  }

  return solveHorizZigZagLayout(1332, 754, 1.0) ?? solveRowLayout(4, 1580, 500, 1.0);
}

function pointToSegmentDist(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const vx = bx - ax;
  const vy = by - ay;
  const lenSq = vx * vx + vy * vy;
  if (lenSq <= 1e-6) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / lenSq));
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}

function pillNodeWaveClearance(
  pillX: number,
  pillY: number,
  pillW: number,
  pillH: number,
  nodeX: number,
  nodeY: number,
  waveRadius: number
): number {
  const qx = Math.max(pillX - pillW * 0.5, Math.min(pillX + pillW * 0.5, nodeX));
  const qy = Math.max(pillY - pillH * 0.5, Math.min(pillY + pillH * 0.5, nodeY));
  return Math.hypot(nodeX - qx, nodeY - qy) - waveRadius;
}

/**
 * Computes enlarged, collision-free delta connector links and Δ pill coordinates
 * for the collapsed harmonic wave constellation view.
 */
export function computeCollapsedDeltaLinks(layout: ConstellationLayout): ConstellationDeltaLink[] {
  const positions = layout.positions;
  if (positions.length < 2) return [];

  const s = Math.max(0.25, layout.nodeScale);
  const badgeScale = Math.max(0.96, Math.min(1.52, s * 1.12));
  const lineScale = Math.max(0.95, Math.min(1.45, s));

  const pillWidth = Math.round(92 * badgeScale);
  const pillHeight = Math.round(32 * badgeScale);
  const fontSize = Math.round(14.5 * badgeScale * 10) / 10;
  const strokeWidth = Math.round(2.5 * lineScale * 10) / 10;

  const waveRadius = PIN_NUCLEUS_UNSPLIT_WAVE_RADIUS_PX * s;
  const trimDist = 104 * s;

  const rawPairs: Array<{ fromIdx: number; toIdx: number; isDiagonal: boolean }> = [
    ...layout.edges.map(([fromIdx, toIdx]) => ({ fromIdx, toIdx, isDiagonal: false })),
    ...layout.diagonals.map(([fromIdx, toIdx]) => ({ fromIdx, toIdx, isDiagonal: true }))
  ];

  const placedPills: Array<{ x: number; y: number; w: number; h: number }> = [];
  const results: ConstellationDeltaLink[] = [];

  for (const pair of rawPairs) {
    const p1 = positions[pair.fromIdx];
    const p2 = positions[pair.toIdx];
    if (!p1 || !p2) continue;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) continue;

    // Skip any bridge (edge or diagonal) whose chord passes behind or grazes an intermediate node's collapsed wave crest
    const minIntermediateClearance = waveRadius + Math.max(12 * s, pillHeight * 0.5 + 8 * s);
    let slicesIntermediate = false;
    for (let k = 0; k < positions.length; k++) {
      if (k === pair.fromIdx || k === pair.toIdx) continue;
      const nk = positions[k];
      if (pointToSegmentDist(nk.x, nk.y, p1.x, p1.y, p2.x, p2.y) < minIntermediateClearance) {
        slicesIntermediate = true;
        break;
      }
    }
    if (slicesIntermediate) continue;

    const ux = dx / dist;
    const uy = dy / dist;
    const trim = Math.min(trimDist, dist * 0.34);
    const x1 = Math.round((p1.x + ux * trim) * 10) / 10;
    const y1 = Math.round((p1.y + uy * trim) * 10) / 10;
    const x2 = Math.round((p2.x - ux * trim) * 10) / 10;
    const y2 = Math.round((p2.y - uy * trim) * 10) / 10;

    // Candidate fractional positions along the chord (center first, then symmetric offsets for crossing diagonals)
    const candidateTs = pair.isDiagonal ? [0.5, 0.34, 0.66] : [0.5, 0.42, 0.58];
    let chosenPill: { x: number; y: number } | null = null;
    let bestFallback: { x: number; y: number; score: number } | null = null;

    for (const t of candidateTs) {
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      let minWaveClr = Infinity;
      for (let k = 0; k < positions.length; k++) {
        const nk = positions[k];
        minWaveClr = Math.min(
          minWaveClr,
          pillNodeWaveClearance(cx, cy, pillWidth, pillHeight, nk.x, nk.y, waveRadius)
        );
      }

      let overlapsSiblingPill = false;
      for (const prev of placedPills) {
        if (
          Math.abs(cx - prev.x) < (pillWidth + prev.w) * 0.5 + 8 &&
          Math.abs(cy - prev.y) < (pillHeight + prev.h) * 0.5 + 8
        ) {
          overlapsSiblingPill = true;
          break;
        }
      }

      if (!overlapsSiblingPill && minWaveClr >= 6) {
        chosenPill = { x: cx, y: cy };
        break;
      }

      const fallbackScore = (overlapsSiblingPill ? -1000 : 0) + minWaveClr;
      if (!bestFallback || fallbackScore > bestFallback.score) {
        bestFallback = { x: cx, y: cy, score: fallbackScore };
      }
    }

    const finalPill = chosenPill ?? bestFallback;
    if (!finalPill) continue;

    // If a diagonal pill still overlaps another pill even after offset candidates, omit it cleanly
    if (
      pair.isDiagonal &&
      placedPills.some(
        (prev) =>
          Math.abs(finalPill.x - prev.x) < (pillWidth + prev.w) * 0.5 + 4 &&
          Math.abs(finalPill.y - prev.y) < (pillHeight + prev.h) * 0.5 + 4
      )
    ) {
      continue;
    }

    placedPills.push({ x: finalPill.x, y: finalPill.y, w: pillWidth, h: pillHeight });
    results.push({
      id: `${pair.isDiagonal ? 'diag' : 'edge'}-${pair.fromIdx}-${pair.toIdx}`,
      fromIdx: pair.fromIdx,
      toIdx: pair.toIdx,
      isDiagonal: pair.isDiagonal,
      x1,
      y1,
      x2,
      y2,
      pillX: Math.round(finalPill.x * 10) / 10,
      pillY: Math.round(finalPill.y * 10) / 10,
      pillWidth,
      pillHeight,
      fontSize,
      strokeWidth
    });
  }

  return results;
}

export type DeltaFlowDirection = 'toA' | 'toB' | 'tie';

/**
 * Determines which endpoint of a delta bridge holds the better grade (or higher
 * score on identical letter grades) so dash flow animates toward the stronger network.
 */
export function resolveDeltaFlowDirection(
  assetA: { grade?: unknown; totalScore?: unknown } | null | undefined,
  assetB: { grade?: unknown; totalScore?: unknown } | null | undefined
): DeltaFlowDirection {
  const rankA = GRADE_RANK[String(assetA?.grade || 'F').toUpperCase()] ?? 99;
  const rankB = GRADE_RANK[String(assetB?.grade || 'F').toUpperCase()] ?? 99;
  if (rankA !== rankB) {
    return rankA < rankB ? 'toA' : 'toB';
  }

  const scoreA = Number(assetA?.totalScore);
  const scoreB = Number(assetB?.totalScore);
  const safeA = Number.isFinite(scoreA) ? scoreA : 0;
  const safeB = Number.isFinite(scoreB) ? scoreB : 0;
  if (Math.abs(safeA - safeB) > 1e-6) {
    return safeA > safeB ? 'toA' : 'toB';
  }

  return 'tie';
}

