export const ARCHIVE_PULL_STAGE_MS = 1000;
export const ARCHIVE_PULL_DURATION_MS = ARCHIVE_PULL_STAGE_MS * 6; // 6,000 ms (6 seconds)

export interface AuditChaosBandSpec {
  gradeLabel: 'F' | 'D' | 'C-' | 'C+' | 'B' | 'A' | 'A+';
  color: string;
  baseCycles: number;
  chaosCyclesA: number;
  chaosCyclesB: number;
  chaosAmp: number;
  chaosSpeed: number;
  strokeWidth: number;
  phaseDir: 1 | -1;
}

export const AUDIT_CHAOS_BANDS: readonly AuditChaosBandSpec[] = [
  {
    gradeLabel: 'F',
    color: '#EF4444',
    baseCycles: 4,
    chaosCyclesA: 11,
    chaosCyclesB: 17,
    chaosAmp: 20,
    chaosSpeed: 0.085,
    strokeWidth: 1.25,
    phaseDir: 1
  },
  {
    gradeLabel: 'D',
    color: '#FB923C',
    baseCycles: 5,
    chaosCyclesA: 13,
    chaosCyclesB: 19,
    chaosAmp: 24,
    chaosSpeed: 0.098,
    strokeWidth: 1.3,
    phaseDir: -1
  },
  {
    gradeLabel: 'C-',
    color: '#F59E0B',
    baseCycles: 6,
    chaosCyclesA: 14,
    chaosCyclesB: 23,
    chaosAmp: 28,
    chaosSpeed: 0.112,
    strokeWidth: 1.35,
    phaseDir: 1
  },
  {
    gradeLabel: 'C+',
    color: '#FACC15',
    baseCycles: 7,
    chaosCyclesA: 16,
    chaosCyclesB: 25,
    chaosAmp: 32,
    chaosSpeed: 0.128,
    strokeWidth: 1.45,
    phaseDir: -1
  },
  {
    gradeLabel: 'B',
    color: '#22C55E',
    baseCycles: 8,
    chaosCyclesA: 19,
    chaosCyclesB: 29,
    chaosAmp: 36,
    chaosSpeed: 0.145,
    strokeWidth: 1.55,
    phaseDir: 1
  },
  {
    gradeLabel: 'A',
    color: '#34D399',
    baseCycles: 10,
    chaosCyclesA: 21,
    chaosCyclesB: 31,
    chaosAmp: 41,
    chaosSpeed: 0.165,
    strokeWidth: 1.65,
    phaseDir: -1
  },
  {
    gradeLabel: 'A+',
    color: '#49EACB',
    baseCycles: 12,
    chaosCyclesA: 24,
    chaosCyclesB: 37,
    chaosAmp: 46,
    chaosSpeed: 0.188,
    strokeWidth: 1.85,
    phaseDir: 1
  }
];

export interface SettledHarmonyProfile {
  targetBandIndex: number;
  settledAmplitude: number;
  settledCycles: number;
  settledSpeed: number;
  color: string;
}

export function resolveSettledHarmonyProfile(
  grade: string,
  projectedScore: number | null
): SettledHarmonyProfile {
  const norm = String(grade || '').trim().toUpperCase();
  const clampedScore =
    typeof projectedScore === 'number' && Number.isFinite(projectedScore)
      ? Math.max(0, Math.min(6, projectedScore))
      : null;

  if (norm === 'F' || clampedScore === 0) {
    return {
      targetBandIndex: 0,
      settledAmplitude: 0,
      settledCycles: 4,
      settledSpeed: 0.015,
      color: '#EF4444'
    };
  }

  let targetBandIndex = 6;
  if (norm === 'A+') targetBandIndex = 6;
  else if (norm === 'A') targetBandIndex = 5;
  else if (norm === 'B+' || norm === 'B') targetBandIndex = 4;
  else if (norm === 'C+') targetBandIndex = 3;
  else if (norm === 'C-' || norm === 'C') targetBandIndex = 2;
  else targetBandIndex = 1;

  const band = AUDIT_CHAOS_BANDS[targetBandIndex];
  const scoreRatio = clampedScore !== null ? clampedScore / 6 : (targetBandIndex + 1) / 7;
  const settledAmplitude = 8.5 + Math.pow(Math.max(0.1, scoreRatio), 1.05) * 15.5;

  return {
    targetBandIndex,
    settledAmplitude,
    settledCycles: band.baseCycles,
    settledSpeed: 0.028 + scoreRatio * 0.036,
    color: band.color
  };
}

/**
 * Computes normalized turbulence `[0..1]` from overall audit progress `[0..1]`.
 * Early stages stay fiercely chaotic (1.0 through 40%), smoothly damp down across
 * 40%..82%, and leave the final ~1.1s cleanly settled on the asset's grade harmony.
 */
export function computeChaosLevel(progress01: number): number {
  const p = Math.max(0, Math.min(1, progress01));
  if (p <= 0.40) return 1;
  if (p >= 0.82) return 0;
  const u = (p - 0.40) / 0.42;
  const smooth = u * u * (3 - 2 * u);
  return Math.max(0, 1 - smooth);
}

export interface ChaosWaveSampleResult {
  offset: number;
  opacity: number;
}

/**
 * Evaluates a single ring's outward radial displacement from the sphere rim
 * and stroke opacity as it transitions from chaotic multi-band interference to
 * settled grade harmony. All troughs touch the sphere rim cleanly (>= 0.2px).
 */
export function evaluateChaosWaveBand(
  bandIndex: number,
  t: number,
  phase: number,
  chaosLevel: number,
  settled: SettledHarmonyProfile
): ChaosWaveSampleResult {
  const band = AUDIT_CHAOS_BANDS[bandIndex];
  const theta = t * Math.PI * 2;
  const p = phase * band.phaseDir;

  // Chaotic multi-frequency raised-carrier superposition: troughs kiss 0.2px,
  // while intersecting spikes surge unpredictably across all 7 bands.
  const carrierA = 0.5 + 0.5 * Math.sin(band.chaosCyclesA * theta + p * 1.45);
  const carrierB = 0.5 + 0.5 * Math.cos(band.chaosCyclesB * theta - p * 1.85);
  const beatPacket = 0.42 + 0.58 * (0.5 + 0.5 * Math.sin(band.baseCycles * theta + p * 0.92));
  const chaoticWave = carrierA * (0.52 + 0.48 * carrierB) * beatPacket;

  // Pure settled standing harmony on the target grade band.
  const harmonyCarrier = 0.5 + 0.5 * Math.sin(settled.settledCycles * theta + phase * 0.9);
  const harmonyEnvelope = 0.78 + 0.22 * (0.5 + 0.5 * Math.cos(settled.settledCycles * 0.5 * theta - phase * 0.5));
  const settledWave = harmonyCarrier * harmonyEnvelope;

  const chaosContribution = chaosLevel * band.chaosAmp * chaoticWave;
  const isTargetBand = bandIndex === settled.targetBandIndex;
  const settleWeight = 1 - chaosLevel;
  const targetContribution = isTargetBand ? settleWeight * settled.settledAmplitude * settledWave : 0;

  const opacity = isTargetBand
    ? 0.45 + 0.5 * chaosLevel + 0.52 * settleWeight
    : Math.max(0, (0.28 + 0.56 * chaosLevel) * Math.pow(chaosLevel, 1.35));

  return {
    offset: 0.25 + chaosContribution + targetContribution,
    opacity: Math.min(1, Math.max(0, opacity))
  };
}

interface CircularChaosGridCache {
  cosTheta: Float64Array;
  sinTheta: Float64Array;
  tArr: Float64Array;
  i0: Int32Array;
  i2: Int32Array;
  i3: Int32Array;
  xs: Float64Array;
  ys: Float64Array;
  parts: string[];
}

const chaosGridCache = new Map<number, CircularChaosGridCache>();

function getCircularChaosGrid(steps: number): CircularChaosGridCache {
  let cached = chaosGridCache.get(steps);
  if (cached) return cached;

  const cosTheta = new Float64Array(steps);
  const sinTheta = new Float64Array(steps);
  const tArr = new Float64Array(steps);
  const i0 = new Int32Array(steps);
  const i2 = new Int32Array(steps);
  const i3 = new Int32Array(steps);

  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const theta = t * Math.PI * 2;
    tArr[i] = t;
    cosTheta[i] = Math.cos(theta);
    sinTheta[i] = Math.sin(theta);
    i0[i] = (i - 1 + steps) % steps;
    i2[i] = (i + 1) % steps;
    i3[i] = (i + 2) % steps;
  }

  cached = {
    cosTheta,
    sinTheta,
    tArr,
    i0,
    i2,
    i3,
    xs: new Float64Array(steps),
    ys: new Float64Array(steps),
    parts: new Array<string>(steps + 2)
  };
  chaosGridCache.set(steps, cached);
  return cached;
}

function fmtChaosCoord(v: number): string {
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

/**
 * Generates a C1-smooth closed cubic Bezier circular SVG path around `(cx, cy)`
 * at `baseRadius + waveOffset` across `steps` evenly spaced angles.
 */
export function buildCircularChaosWavePath(
  bandIndex: number,
  cx: number,
  cy: number,
  baseRadius: number,
  phase: number,
  chaosLevel: number,
  settled: SettledHarmonyProfile,
  steps = 224
): { d: string; opacity: number } {
  const n = Math.max(24, steps | 0);
  const { cosTheta, sinTheta, tArr, i0, i2, i3, xs, ys, parts } = getCircularChaosGrid(n);
  let opacitySample = 0;

  for (let i = 0; i < n; i++) {
    const sample = evaluateChaosWaveBand(bandIndex, tArr[i], phase, chaosLevel, settled);
    if (i === 0) opacitySample = sample.opacity;
    const r = baseRadius + sample.offset;
    xs[i] = cx + cosTheta[i] * r;
    ys[i] = cy + sinTheta[i] * r;
  }

  parts[0] = `M${fmtChaosCoord(xs[0])} ${fmtChaosCoord(ys[0])}`;

  const k = 1 / 6;
  for (let i = 0; i < n; i++) {
    const idx0 = i0[i];
    const idx2 = i2[i];
    const idx3 = i3[i];

    const x1 = xs[i];
    const y1 = ys[i];
    const x2 = xs[idx2];
    const y2 = ys[idx2];

    const cp1x = fmtChaosCoord(x1 + (x2 - xs[idx0]) * k);
    const cp1y = fmtChaosCoord(y1 + (y2 - ys[idx0]) * k);
    const cp2x = fmtChaosCoord(x2 - (xs[idx3] - x1) * k);
    const cp2y = fmtChaosCoord(y2 - (ys[idx3] - y1) * k);

    parts[i + 1] = `C${cp1x} ${cp1y} ${cp2x} ${cp2y} ${fmtChaosCoord(x2)} ${fmtChaosCoord(y2)}`;
  }

  parts[n + 1] = 'Z';
  return { d: parts.join(''), opacity: opacitySample };
}
