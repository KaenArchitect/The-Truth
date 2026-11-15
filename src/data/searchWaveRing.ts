export interface GradeWaveSpec {
  gradeLabel: string;
  color: string;
  outwardOffset: number;
  cyclesMain: number;
  cyclesSub: number;
  cyclesHarmonic: number;
  amplitude: number;
  speed: number;
  strokeWidth: number;
  opacity: number;
  phaseDir: 1 | -1;
}

/**
 * Pure single-color thermodynamic grade rings whose troughs all touch the
 * search textbox perimeter while crests intersect outward—from calm inner F Red
 * up to violent high-energy outer A+ Cyan.
 */
export const GENIUS_SEARCH_WAVE_SPECS: readonly GradeWaveSpec[] = [
  {
    gradeLabel: 'F',
    color: '#EF4444',
    outwardOffset: 0.2,
    cyclesMain: 5,
    cyclesSub: 3,
    cyclesHarmonic: 7,
    amplitude: 6.5,
    speed: 0.02,
    strokeWidth: 1.0,
    opacity: 0.56,
    phaseDir: 1
  },
  {
    gradeLabel: 'D',
    color: '#FB923C',
    outwardOffset: 0.2,
    cyclesMain: 7,
    cyclesSub: 4,
    cyclesHarmonic: 10,
    amplitude: 10.5,
    speed: 0.028,
    strokeWidth: 1.1,
    opacity: 0.62,
    phaseDir: -1
  },
  {
    gradeLabel: 'C-',
    color: '#F59E0B',
    outwardOffset: 0.2,
    cyclesMain: 9,
    cyclesSub: 5,
    cyclesHarmonic: 14,
    amplitude: 15.0,
    speed: 0.036,
    strokeWidth: 1.2,
    opacity: 0.68,
    phaseDir: 1
  },
  {
    gradeLabel: 'C+',
    color: '#FACC15',
    outwardOffset: 0.2,
    cyclesMain: 12,
    cyclesSub: 6,
    cyclesHarmonic: 18,
    amplitude: 20.0,
    speed: 0.045,
    strokeWidth: 1.3,
    opacity: 0.74,
    phaseDir: -1
  },
  {
    gradeLabel: 'B',
    color: '#22C55E',
    outwardOffset: 0.2,
    cyclesMain: 15,
    cyclesSub: 8,
    cyclesHarmonic: 22,
    amplitude: 25.5,
    speed: 0.055,
    strokeWidth: 1.4,
    opacity: 0.82,
    phaseDir: 1
  },
  {
    gradeLabel: 'A',
    color: '#34D399',
    outwardOffset: 0.2,
    cyclesMain: 18,
    cyclesSub: 9,
    cyclesHarmonic: 27,
    amplitude: 31.5,
    speed: 0.068,
    strokeWidth: 1.5,
    opacity: 0.9,
    phaseDir: -1
  },
  {
    gradeLabel: 'A+',
    color: '#49EACB',
    outwardOffset: 0.2,
    cyclesMain: 22,
    cyclesSub: 11,
    cyclesHarmonic: 33,
    amplitude: 38.5,
    speed: 0.085,
    strokeWidth: 1.7,
    opacity: 0.98,
    phaseDir: 1
  }
];

export interface StadiumSamplePoint {
  x: number;
  y: number;
  nx: number;
  ny: number;
  t: number; // normalized [0..1) arc position around closed stadium
}

/**
 * Samples N evenly spaced arc-length coordinates + outward unit normals
 * along the perimeter of a capsule/pill centered inside a padded SVG box.
 */
export function buildStadiumPerimeterSamples(
  pillWidth: number,
  pillHeight: number,
  pad: number,
  steps = 128
): StadiumSamplePoint[] {
  const w = Math.max(80, pillWidth);
  const h = Math.max(24, pillHeight);
  const r = h / 2;
  const straight = Math.max(0, w - h);
  const arcLen = Math.PI * r;
  const totalLen = 2 * straight + 2 * arcLen;

  const leftCx = pad + r;
  const rightCx = pad + w - r;
  const cy = pad + r;

  const samples: StadiumSamplePoint[] = [];
  for (let i = 0; i < steps; i++) {
    const u = i / steps;
    let d = u * totalLen;

    let x = 0;
    let y = 0;
    let nx = 0;
    let ny = 0;

    if (d <= straight) {
      // Top edge: left -> right
      x = leftCx + d;
      y = pad;
      nx = 0;
      ny = -1;
    } else if (d <= straight + arcLen) {
      // Right semicircle: -PI/2 -> +PI/2
      const theta = -Math.PI / 2 + ((d - straight) / arcLen) * Math.PI;
      nx = Math.cos(theta);
      ny = Math.sin(theta);
      x = rightCx + nx * r;
      y = cy + ny * r;
    } else if (d <= 2 * straight + arcLen) {
      // Bottom edge: right -> left
      const seg = d - (straight + arcLen);
      x = rightCx - seg;
      y = pad + h;
      nx = 0;
      ny = 1;
    } else {
      // Left semicircle: +PI/2 -> +3PI/2
      const seg = d - (2 * straight + arcLen);
      const theta = Math.PI / 2 + (seg / arcLen) * Math.PI;
      nx = Math.cos(theta);
      ny = Math.sin(theta);
      x = leftCx + nx * r;
      y = cy + ny * r;
    }

    samples.push({ x, y, nx, ny, t: u });
  }
  return samples;
}

/**
 * Evaluates the outward normal displacement (in px) for a single wave ring at
 * normalized perimeter position `t in [0, 1)`. The raised-carrier product ensures
 * every primary trough drops cleanly down to touch the textbox edge (~0.2px)
 * while crests surge outward and intersect lower-grade bands smoothly.
 */
export function evaluateWaveOutwardOffset(
  spec: GradeWaveSpec,
  t: number,
  phase: number,
  ampMultiplier = 1,
  offsetScale = 1
): number {
  const theta = t * Math.PI * 2;
  const p1 = phase * spec.phaseDir;
  const p2 = -p1 * 0.85;
  const p3 = p1 * 1.3;

  const carrier = 0.5 + 0.5 * Math.sin(spec.cyclesMain * theta + p1);
  const subWave = 0.5 + 0.5 * Math.cos(spec.cyclesSub * theta + p2);
  const harmonicRipple = 0.5 + 0.5 * Math.sin(spec.cyclesHarmonic * theta + p3);
  const wave = carrier * (0.58 + 0.28 * subWave + 0.14 * harmonicRipple);

  return spec.outwardOffset + spec.amplitude * ampMultiplier * offsetScale * wave;
}

interface StadiumTrigLut {
  sinMain: Float64Array;
  cosMain: Float64Array;
  cosSub: Float64Array;
  sinSub: Float64Array;
  sinHarm: Float64Array;
  cosHarm: Float64Array;
  i0: Int32Array;
  i2: Int32Array;
  i3: Int32Array;
  xs: Float64Array;
  ys: Float64Array;
  parts: string[];
}

const stadiumLutCache = new WeakMap<StadiumSamplePoint[], Map<string, StadiumTrigLut>>();

function getStadiumTrigLut(samples: StadiumSamplePoint[], spec: GradeWaveSpec): StadiumTrigLut {
  let bySpec = stadiumLutCache.get(samples);
  if (!bySpec) {
    bySpec = new Map<string, StadiumTrigLut>();
    stadiumLutCache.set(samples, bySpec);
  }
  const key = `${spec.cyclesMain}:${spec.cyclesSub}:${spec.cyclesHarmonic}`;
  let lut = bySpec.get(key);
  if (lut) return lut;

  const n = samples.length;
  const sinMain = new Float64Array(n);
  const cosMain = new Float64Array(n);
  const cosSub = new Float64Array(n);
  const sinSub = new Float64Array(n);
  const sinHarm = new Float64Array(n);
  const cosHarm = new Float64Array(n);
  const i0 = new Int32Array(n);
  const i2 = new Int32Array(n);
  const i3 = new Int32Array(n);

  for (let i = 0; i < n; i++) {
    const theta = samples[i].t * Math.PI * 2;
    sinMain[i] = Math.sin(spec.cyclesMain * theta);
    cosMain[i] = Math.cos(spec.cyclesMain * theta);
    cosSub[i] = Math.cos(spec.cyclesSub * theta);
    sinSub[i] = Math.sin(spec.cyclesSub * theta);
    sinHarm[i] = Math.sin(spec.cyclesHarmonic * theta);
    cosHarm[i] = Math.cos(spec.cyclesHarmonic * theta);
    i0[i] = (i - 1 + n) % n;
    i2[i] = (i + 1) % n;
    i3[i] = (i + 2) % n;
  }

  lut = {
    sinMain,
    cosMain,
    cosSub,
    sinSub,
    sinHarm,
    cosHarm,
    i0,
    i2,
    i3,
    xs: new Float64Array(n),
    ys: new Float64Array(n),
    parts: new Array<string>(n + 2)
  };
  bySpec.set(key, lut);
  return lut;
}

function fmtStadiumCoord(v: number): string {
  const n = Math.round(v * 10);
  if (n < 0) {
    const a = -n;
    const whole = (a / 10) | 0;
    const frac = a - whole * 10;
    return frac === 0 ? `-${whole}.0` : `-${whole}.${frac}`;
  }
  const whole = (n / 10) | 0;
  const frac = n - whole * 10;
  return frac === 0 ? `${whole}.0` : `${whole}.${frac}`;
}

/**
 * Generates a C1-smooth closed cubic Bezier SVG path string for one
 * pure-wavelength harmonic wave orbiting strictly outside the search pill.
 */
export function buildStadiumWavePath(
  samples: StadiumSamplePoint[],
  spec: GradeWaveSpec,
  phase: number,
  ampMultiplier = 1,
  offsetScale = 1
): string {
  const n = samples.length;
  if (n < 3) return '';

  const { sinMain, cosMain, cosSub, sinSub, sinHarm, cosHarm, i0, i2, i3, xs, ys, parts } =
    getStadiumTrigLut(samples, spec);

  const p1 = phase * spec.phaseDir;
  const p2 = -p1 * 0.85;
  const p3 = p1 * 1.3;
  const cP1 = Math.cos(p1);
  const sP1 = Math.sin(p1);
  const cP2 = Math.cos(p2);
  const sP2 = Math.sin(p2);
  const cP3 = Math.cos(p3);
  const sP3 = Math.sin(p3);

  const baseOff = spec.outwardOffset;
  const ampScale = spec.amplitude * ampMultiplier * offsetScale;

  for (let i = 0; i < n; i++) {
    const pt = samples[i];
    const carrier = 0.5 + 0.5 * (sinMain[i] * cP1 + cosMain[i] * sP1);
    const subWave = 0.5 + 0.5 * (cosSub[i] * cP2 - sinSub[i] * sP2);
    const harmonicRipple = 0.5 + 0.5 * (sinHarm[i] * cP3 + cosHarm[i] * sP3);
    const wave = carrier * (0.58 + 0.28 * subWave + 0.14 * harmonicRipple);
    const offset = baseOff + ampScale * wave;
    xs[i] = pt.x + pt.nx * offset;
    ys[i] = pt.y + pt.ny * offset;
  }

  parts[0] = `M${fmtStadiumCoord(xs[0])} ${fmtStadiumCoord(ys[0])}`;

  const k = 1 / 6;
  for (let i = 0; i < n; i++) {
    const idx0 = i0[i];
    const idx2 = i2[i];
    const idx3 = i3[i];

    const x1 = xs[i];
    const y1 = ys[i];
    const x2 = xs[idx2];
    const y2 = ys[idx2];

    const cp1x = fmtStadiumCoord(x1 + (x2 - xs[idx0]) * k);
    const cp1y = fmtStadiumCoord(y1 + (y2 - ys[idx0]) * k);
    const cp2x = fmtStadiumCoord(x2 - (xs[idx3] - x1) * k);
    const cp2y = fmtStadiumCoord(y2 - (ys[idx3] - y1) * k);

    parts[i + 1] = `C${cp1x} ${cp1y} ${cp2x} ${cp2y} ${fmtStadiumCoord(x2)} ${fmtStadiumCoord(
      y2
    )}`;
  }

  parts[n + 1] = 'Z';
  return parts.join('');
}
