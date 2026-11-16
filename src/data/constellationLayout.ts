import { ORBIT_ANGLES_DEG } from './rubricSpec.ts';
import type { PinOrientationMode } from './constellationOrientation.ts';

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
): ConstellationLayout {
  const edges: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [2, 0]
  ];

  const computeGeometry = (s: number) => {
    const buf = resolveDesiredWaveBufferPx(s, explicitBufferPx);
    const hw = PIN_HEX_HALF_WIDTH_PX * s;
    const hh = PIN_HEX_HALF_HEIGHT_PX * s;
    const maxDy = availH - 2 * hh;
    const maxDx = availW / 2 - hw;
    const minHorizStep = minCenterStepAlongAxis(1, 0, s, buf);
    if (maxDy <= 0 || maxDx < minHorizStep * 0.5) return null;

    // Keep balanced triangle proportions across both widescreen and tall-crop displays
    const dx = Math.min(maxDx, maxDy * 1.65);
    const dy = Math.min(maxDy, Math.max(dx * 1.12, 220 * s));
    if (2 * dx < minHorizStep) return null;

    const top = { x: 0, y: 0 };
    const botL = { x: -dx, y: dy };
    const botR = { x: dx, y: dy };

    if (!pairFitsWithBuffer(top.x, top.y, botL.x, botL.y, s, buf)) return null;
    if (!pairFitsWithBuffer(botL.x, botL.y, botR.x, botR.y, s, buf)) return null;

    return { positions: [top, botL, botR] };
  };

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
  if (!best) {
    return solveRowLayout(3, availW, availH, lo, explicitBufferPx);
  }
  return normalizeAndRoundLayout(best.positions, lo, edges, []);
}

function solveSquareLayout(
  availW: number,
  availH: number,
  maxScale: number,
  explicitBufferPx?: number
): ConstellationLayout {
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
    const maxDx = availW - 2 * hw;
    const maxDy = availH - 2 * hh;
    const minDx = minCenterStepAlongAxis(1, 0, s, buf);
    const minDy = minCenterStepAlongAxis(0, 1, s, buf);
    if (maxDx < minDx || maxDy < minDy) return null;

    const dy = Math.min(maxDy, Math.max(minDy, maxDx * 1.05));
    const dx = Math.min(maxDx, Math.max(minDx, dy * 1.42));

    const positions = [
      { x: 0, y: 0 },
      { x: dx, y: 0 },
      { x: 0, y: dy },
      { x: dx, y: dy }
    ];
    return { positions };
  };

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
  if (!best) {
    return solveRowLayout(4, availW, availH, lo, explicitBufferPx);
  }
  return normalizeAndRoundLayout(best.positions, lo, edges, diagonals);
}

function solveRhombusLayout(
  availW: number,
  availH: number,
  maxScale: number,
  explicitBufferPx?: number
): ConstellationLayout {
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
    const maxDxHalf = availW / 2 - hw;
    const maxDyHalf = (availH - 2 * hh) / 2;
    const minVertDist = minCenterStepAlongAxis(0, 1, s, buf);
    const minHorizDist = minCenterStepAlongAxis(1, 0, s, buf);

    if (2 * maxDyHalf < minVertDist || 2 * maxDxHalf < minHorizDist) return null;

    const minDyHalf = minVertDist * 0.5;
    const dxHalf = Math.min(maxDxHalf, Math.max(minHorizDist * 0.5, maxDyHalf * 2.35));
    const dyHalf = Math.min(maxDyHalf, Math.max(minDyHalf, dxHalf * 1.12));

    const top = { x: 0, y: -dyHalf };
    const left = { x: -dxHalf, y: 0 };
    const right = { x: dxHalf, y: 0 };
    const bottom = { x: 0, y: dyHalf };

    if (!pairFitsWithBuffer(top.x, top.y, bottom.x, bottom.y, s, buf)) return null;
    if (!pairFitsWithBuffer(left.x, left.y, right.x, right.y, s, buf)) return null;
    if (!pairFitsWithBuffer(top.x, top.y, left.x, left.y, s, buf)) return null;

    return { positions: [top, left, right, bottom] };
  };

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
  if (!best) {
    return solveRowLayout(4, availW, availH, lo, explicitBufferPx);
  }
  return normalizeAndRoundLayout(best.positions, lo, edges, diagonals);
}

/**
 * Computes optimal pinned constellation positions & bubble scale.
 * When `fitOptions` is supplied (runtime arena width & height), dynamically maximizes
 * harmonic bubble size to fill available space while maintaining a guaranteed overlap buffer.
 */
export function getConstellationLayout(
  count: number,
  threeMode: ThreeFormationMode = 'TRIANGLE',
  fourMode: FourFormationMode = 'RHOMBUS',
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
      return solveVerticalLayout(count, availW, availH, maxScale, explicitBuf);
    }

    if (mode === 'horizontal' && count >= 2) {
      const availW = Math.max(280, safeWrap - 8);
      const availH = Math.max(250, safeViewH - 210);
      const maxScale = Math.min(1.65, Math.max(0.55, fitOptions.pinMaxScale ?? 1.35));
      return solveRowLayout(count, availW, availH, maxScale, explicitBuf);
    }

    // Desktop formations
    const availW = Math.max(280, safeWrap - 8);
    const availH = Math.max(380, safeViewH - 284);
    const maxScale = Math.min(2.9, Math.max(0.75, fitOptions.pinMaxScale ?? 2.8));

    if (count === 2) {
      return solveRowLayout(2, availW, availH, maxScale, explicitBuf);
    }
    if (count === 3) {
      if (threeMode === 'SIDE_BY_SIDE') {
        return solveRowLayout(3, availW, availH, maxScale, explicitBuf);
      }
      return solveTriangleLayout(availW, availH, maxScale, explicitBuf);
    }
    if (fourMode === 'SQUARE') {
      return solveSquareLayout(availW, availH, maxScale, explicitBuf);
    }
    if (fourMode === 'SIDE_BY_SIDE') {
      return solveRowLayout(4, availW, availH, maxScale, explicitBuf);
    }
    return solveRhombusLayout(availW, availH, maxScale, explicitBuf);
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
    if (threeMode === 'SIDE_BY_SIDE') {
      const stepX = 394;
      return {
        width: PIN_HEX_HALF_WIDTH_PX * 2 + stepX * 2,
        height: PIN_HEX_HALF_HEIGHT_PX * 2,
        nodeScale: 1,
        positions: [
          { x: PIN_HEX_HALF_WIDTH_PX, y: PIN_HEX_HALF_HEIGHT_PX },
          { x: PIN_HEX_HALF_WIDTH_PX + stepX, y: PIN_HEX_HALF_HEIGHT_PX },
          { x: PIN_HEX_HALF_WIDTH_PX + stepX * 2, y: PIN_HEX_HALF_HEIGHT_PX }
        ],
        edges: [
          [0, 1],
          [1, 2]
        ],
        diagonals: []
      };
    }
    return solveTriangleLayout(1120, 760, 1.0);
  }

  if (fourMode === 'SQUARE') {
    return solveSquareLayout(1120, 760, 1.0);
  }

  if (fourMode === 'SIDE_BY_SIDE') {
    const stepX = 394;
    return {
      width: PIN_HEX_HALF_WIDTH_PX * 2 + stepX * 3,
      height: PIN_HEX_HALF_HEIGHT_PX * 2,
      nodeScale: 1,
      positions: [
        { x: PIN_HEX_HALF_WIDTH_PX, y: PIN_HEX_HALF_HEIGHT_PX },
        { x: PIN_HEX_HALF_WIDTH_PX + stepX, y: PIN_HEX_HALF_HEIGHT_PX },
        { x: PIN_HEX_HALF_WIDTH_PX + stepX * 2, y: PIN_HEX_HALF_HEIGHT_PX },
        { x: PIN_HEX_HALF_WIDTH_PX + stepX * 3, y: PIN_HEX_HALF_HEIGHT_PX }
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3]
      ],
      diagonals: []
    };
  }

  return solveRhombusLayout(1120, 760, 1.0);
}
