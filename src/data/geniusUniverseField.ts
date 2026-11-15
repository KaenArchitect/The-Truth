export interface PhysicsEquationSprite {
  id: string;
  formula: string;
  lawName: string;
  xPct: number;
  yPct: number;
  driftX: number;
  driftY: number;
  rotDeg: number;
  durationSec: number;
  delaySec: number;
  scale: number;
  opacity: number;
  tone: 'primary' | 'secondary' | 'neutral';
  gradeTierIndex: number;
  showOnMobile: boolean;
}

export interface GradeStarColorSpec {
  grade: string;
  hex: string;
  rgb: string;
  rgbTuple: [number, number, number];
}

export const GRADE_STAR_SPECTRUM: GradeStarColorSpec[] = [
  { grade: 'A+', hex: '#49EACB', rgb: '73, 234, 203', rgbTuple: [73, 234, 203] },
  { grade: 'A-', hex: '#34D399', rgb: '52, 211, 153', rgbTuple: [52, 211, 153] },
  { grade: 'B+', hex: '#4ADE80', rgb: '74, 222, 128', rgbTuple: [74, 222, 128] },
  { grade: 'B', hex: '#22C55E', rgb: '34, 197, 94', rgbTuple: [34, 197, 94] },
  { grade: 'B-', hex: '#84CC16', rgb: '132, 204, 22', rgbTuple: [132, 204, 22] },
  { grade: 'C+', hex: '#FACC15', rgb: '250, 204, 21', rgbTuple: [250, 204, 21] },
  { grade: 'C', hex: '#EAB308', rgb: '234, 179, 8', rgbTuple: [234, 179, 8] },
  { grade: 'C-', hex: '#F59E0B', rgb: '245, 158, 11', rgbTuple: [245, 158, 11] },
  { grade: 'D+', hex: '#FB923C', rgb: '251, 146, 60', rgbTuple: [251, 146, 60] },
  { grade: 'D-', hex: '#F97316', rgb: '249, 115, 22', rgbTuple: [249, 115, 22] },
  { grade: 'F', hex: '#EF4444', rgb: '239, 68, 68', rgbTuple: [239, 68, 68] }
];

export interface UniverseStar {
  index: number;
  radiusNorm: number;
  baseAngle: number;
  armOffset: number;
  zDepth: number;
  size: number;
  baseAlpha: number;
  twinklePhase: number;
  tone: 'primary' | 'secondary' | 'neutral';
  gradeColorRgb: string;
  gradeColorTuple: [number, number, number];
  gradeColorHex: string;
  gradeTier: string;
  isDeepField: boolean;
}

export interface ProjectedStar {
  x: number;
  y: number;
  size: number;
  alpha: number;
  tone: 'primary' | 'secondary' | 'neutral';
  gradeColorRgb: string;
  angleRad: number;
  tailLength: number;
}

export interface UniverseTelemetryInput {
  hasActiveAudit: boolean;
  isAuditing: boolean;
  totalScore?: number;
  grade?: string;
  scanProgressPct?: number;
  isMobile?: boolean;
}

export interface UniverseTelemetry {
  starCount: number;
  motionSpeed: number;
  vortexDurationSec: number;
  equationSpeedMult: number;
  nebulaIntensity: number;
  useMultiGradeStarColors: boolean;
  isZeroMotion: boolean;
  scoreNorm: number;
}

function inferScoreFromGrade(grade?: string): number {
  const g = String(grade || '').trim().toUpperCase();
  if (g === 'A+') return 6.0;
  if (g === 'A') return 5.5;
  if (g === 'A-') return 5.1;
  if (g === 'B+') return 4.5;
  if (g === 'B') return 4.1;
  if (g === 'B-') return 3.85;
  if (g === 'C+') return 3.65;
  if (g === 'C') return 3.15;
  if (g === 'C-') return 2.65;
  if (g === 'D+') return 2.1;
  if (g === 'D') return 1.75;
  if (g === 'D-') return 1.35;
  if (g === 'F') return 0.0;
  return 4.0;
}

export function computeUniverseTelemetryForGrade(input: UniverseTelemetryInput): UniverseTelemetry {
  const {
    hasActiveAudit,
    isAuditing,
    totalScore,
    grade,
    scanProgressPct = 0,
    isMobile = false
  } = input;

  const cleanGrade = String(grade || '').trim().toUpperCase();
  const numericScore =
    typeof totalScore === 'number' && Number.isFinite(totalScore)
      ? totalScore
      : inferScoreFromGrade(cleanGrade);
  const scoreNorm = Math.max(0, Math.min(1, numericScore / 6));
  const isGradeF = cleanGrade === 'F' || (typeof totalScore === 'number' && totalScore <= 0);

  // Before an audit runs: rich full-spectrum starfield showcasing all thermodynamic grade colors.
  if (!hasActiveAudit && !isAuditing) {
    return {
      starCount: isMobile ? 140 : 220,
      motionSpeed: 1.0,
      vortexDurationSec: 52,
      equationSpeedMult: 1.0,
      nebulaIntensity: 1.0,
      useMultiGradeStarColors: true,
      isZeroMotion: false,
      scoreNorm: 4 / 6
    };
  }

  // While actively auditing: smoothly track running invariant progress toward settled grade.
  if (isAuditing) {
    if (isGradeF && scanProgressPct >= 25) {
      return {
        starCount: 0,
        motionSpeed: 0,
        vortexDurationSec: 0,
        equationSpeedMult: 0,
        nebulaIntensity: 0.14,
        useMultiGradeStarColors: false,
        isZeroMotion: true,
        scoreNorm: 0
      };
    }
    const baseMin = isMobile ? 64 : 96;
    const baseSpan = isMobile ? 166 : 264;
    const starCount = Math.round(baseMin + Math.pow(scoreNorm, 0.92) * baseSpan);
    const motionSpeed = Number((0.65 + Math.pow(scoreNorm, 0.95) * 1.25).toFixed(3));
    const vortexDurationSec = Math.max(22, Math.round(52 / Math.max(0.45, motionSpeed)));
    return {
      starCount,
      motionSpeed,
      vortexDurationSec,
      equationSpeedMult: Number(Math.max(0.65, motionSpeed).toFixed(3)),
      nebulaIntensity: Number((0.45 + scoreNorm * 0.85).toFixed(3)),
      useMultiGradeStarColors: scanProgressPct < 35,
      isZeroMotion: false,
      scoreNorm
    };
  }

  // Settled Grade F (E = 0): zero stars, zero movement (thermodynamic heat death).
  if (isGradeF) {
    return {
      starCount: 0,
      motionSpeed: 0,
      vortexDurationSec: 0,
      equationSpeedMult: 0,
      nebulaIntensity: 0.14,
      useMultiGradeStarColors: false,
      isZeroMotion: true,
      scoreNorm: 0
    };
  }

  // Settled passing/non-F grades (D- through A+): star density, speed, and aura scale smoothly with score.
  const minStars = isMobile ? 28 : 42;
  const maxExtraStars = isMobile ? 202 : 318;
  const starCount = Math.round(minStars + Math.pow(scoreNorm, 0.95) * maxExtraStars);
  const motionSpeed = Number((0.2 + Math.pow(scoreNorm, 1.08) * 1.6).toFixed(3));
  const vortexDurationSec = Math.max(24, Math.min(190, Math.round(52 / Math.max(0.28, motionSpeed))));
  const equationSpeedMult = Number(Math.max(0.32, motionSpeed).toFixed(3));
  const nebulaIntensity = Number((0.35 + scoreNorm * 0.95).toFixed(3));

  return {
    starCount,
    motionSpeed,
    vortexDurationSec,
    equationSpeedMult,
    nebulaIntensity,
    useMultiGradeStarColors: false,
    isZeroMotion: false,
    scoreNorm
  };
}

export const PHYSICS_EQUATION_SPRITES: PhysicsEquationSprite[] = [
  {
    id: 'landauer',
    formula: 'ΔQ ≥ k_B · T · ln 2',
    lawName: 'Landauer Limit',
    xPct: 24,
    yPct: 22,
    driftX: 22,
    driftY: -16,
    rotDeg: -3,
    durationSec: 26,
    delaySec: -4,
    scale: 1.04,
    opacity: 0.24,
    tone: 'primary',
    gradeTierIndex: 0,
    showOnMobile: true
  },
  {
    id: 'einstein-field',
    formula: 'G_μν + Λg_μν = (8πG / c⁴) T_μν',
    lawName: 'Einstein Field Equations',
    xPct: 68,
    yPct: 19,
    driftX: -24,
    driftY: 14,
    rotDeg: 2.5,
    durationSec: 32,
    delaySec: -9,
    scale: 0.96,
    opacity: 0.2,
    tone: 'neutral',
    gradeTierIndex: 2,
    showOnMobile: true
  },
  {
    id: 'first-law',
    formula: 'ΔU = Q − W',
    lawName: 'First Law of Thermodynamics',
    xPct: 21,
    yPct: 43,
    driftX: 18,
    driftY: 20,
    rotDeg: -2,
    durationSec: 23,
    delaySec: -2,
    scale: 1.08,
    opacity: 0.23,
    tone: 'primary',
    gradeTierIndex: 4,
    showOnMobile: true
  },
  {
    id: 'second-law',
    formula: 'ΔS_total = ΔS_sys + ΔS_env ≥ 0',
    lawName: 'Second Law & Arrow of Time',
    xPct: 72,
    yPct: 37,
    driftX: -20,
    driftY: -18,
    rotDeg: 3,
    durationSec: 29,
    delaySec: -14,
    scale: 0.94,
    opacity: 0.2,
    tone: 'secondary',
    gradeTierIndex: 9,
    showOnMobile: false
  },
  {
    id: 'relativistic-energy',
    formula: 'E² = (pc)² + (m₀c²)²',
    lawName: 'Relativistic Energy–Momentum',
    xPct: 28,
    yPct: 64,
    driftX: 24,
    driftY: -14,
    rotDeg: 2,
    durationSec: 28,
    delaySec: -7,
    scale: 1.02,
    opacity: 0.22,
    tone: 'neutral',
    gradeTierIndex: 5,
    showOnMobile: true
  },
  {
    id: 'boltzmann',
    formula: 'S = k_B · ln Ω',
    lawName: 'Boltzmann Entropy',
    xPct: 74,
    yPct: 58,
    driftX: -18,
    driftY: 22,
    rotDeg: -2.5,
    durationSec: 24,
    delaySec: -11,
    scale: 1.08,
    opacity: 0.23,
    tone: 'primary',
    gradeTierIndex: 1,
    showOnMobile: true
  },
  {
    id: 'schrodinger',
    formula: 'iℏ ∂ψ/∂t = Ĥψ',
    lawName: 'Schrödinger Wave Equation',
    xPct: 23,
    yPct: 82,
    driftX: 20,
    driftY: 16,
    rotDeg: -1.8,
    durationSec: 27,
    delaySec: -5,
    scale: 1.02,
    opacity: 0.21,
    tone: 'secondary',
    gradeTierIndex: 3,
    showOnMobile: true
  },
  {
    id: 'shannon-entropy',
    formula: 'H(X) = −∑ p(x) log₂ p(x)',
    lawName: 'Shannon Information Entropy',
    xPct: 70,
    yPct: 77,
    driftX: -22,
    driftY: -16,
    rotDeg: 2.2,
    durationSec: 31,
    delaySec: -17,
    scale: 0.96,
    opacity: 0.2,
    tone: 'neutral',
    gradeTierIndex: 7,
    showOnMobile: true
  },
  {
    id: 'shannon-hartley',
    formula: 'C = B · log₂(1 + S/N)',
    lawName: 'Shannon–Hartley Channel Limit',
    xPct: 47,
    yPct: 86,
    driftX: 16,
    driftY: -18,
    rotDeg: -1.5,
    durationSec: 25,
    delaySec: -6,
    scale: 0.98,
    opacity: 0.21,
    tone: 'primary',
    gradeTierIndex: 6,
    showOnMobile: true
  },
  {
    id: 'maxwell-ampere',
    formula: '∇ × B = μ₀J + μ₀ε₀ ∂E/∂t',
    lawName: 'Maxwell–Ampère Electrodynamics',
    xPct: 37,
    yPct: 28,
    driftX: -16,
    driftY: 18,
    rotDeg: 1.8,
    durationSec: 30,
    delaySec: -12,
    scale: 0.92,
    opacity: 0.17,
    tone: 'neutral',
    gradeTierIndex: 8,
    showOnMobile: false
  },
  {
    id: 'bekenstein-hawking',
    formula: 'S_BH = k_Bc³A / (4ℏG)',
    lawName: 'Bekenstein–Hawking Horizon Entropy',
    xPct: 60,
    yPct: 29,
    driftX: 18,
    driftY: 14,
    rotDeg: -2.4,
    durationSec: 33,
    delaySec: -19,
    scale: 0.92,
    opacity: 0.17,
    tone: 'secondary',
    gradeTierIndex: 10,
    showOnMobile: false
  },
  {
    id: 'heisenberg',
    formula: 'Δx · Δp ≥ ℏ / 2',
    lawName: 'Heisenberg Uncertainty Principle',
    xPct: 34,
    yPct: 75,
    driftX: -18,
    driftY: -12,
    rotDeg: 2.8,
    durationSec: 24,
    delaySec: -8,
    scale: 1.0,
    opacity: 0.2,
    tone: 'neutral',
    gradeTierIndex: 4,
    showOnMobile: false
  },
  {
    id: 'carrier-velocity',
    formula: 'M_overlay < M_L1 ≤ 1.0',
    lawName: 'Carrier-Subordinated Velocity',
    xPct: 63,
    yPct: 68,
    driftX: 19,
    driftY: -14,
    rotDeg: -1.6,
    durationSec: 26,
    delaySec: -3,
    scale: 0.95,
    opacity: 0.21,
    tone: 'primary',
    gradeTierIndex: 0,
    showOnMobile: false
  },
  {
    id: 'chromatic-decay',
    formula: 'λ(m) = λ₀ · (½)^(m/12)',
    lawName: 'Geometric Chromatic Emission',
    xPct: 16,
    yPct: 55,
    driftX: 14,
    driftY: -18,
    rotDeg: 3.2,
    durationSec: 28,
    delaySec: -15,
    scale: 0.94,
    opacity: 0.16,
    tone: 'secondary',
    gradeTierIndex: 5,
    showOnMobile: true
  },
  {
    id: 'lagrangian',
    formula: 'δ ∫ (T − V) dt = 0',
    lawName: 'Principle of Least Action',
    xPct: 83,
    yPct: 48,
    driftX: -15,
    driftY: 16,
    rotDeg: -2.2,
    durationSec: 27,
    delaySec: -10,
    scale: 0.98,
    opacity: 0.18,
    tone: 'neutral',
    gradeTierIndex: 8,
    showOnMobile: true
  },
  {
    id: 'gauss-grav',
    formula: '∇²Φ = 4πGρ',
    lawName: 'Poisson Gravitational Potential',
    xPct: 52,
    yPct: 14,
    driftX: 16,
    driftY: 12,
    rotDeg: 1.4,
    durationSec: 30,
    delaySec: -13,
    scale: 0.94,
    opacity: 0.16,
    tone: 'primary',
    gradeTierIndex: 10,
    showOnMobile: false
  }
];

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createUniverseStars(count = 360, seed = 20261115): UniverseStar[] {
  const safeCount = Math.max(0, Math.floor(count));
  const rng = mulberry32(seed);
  const arms = 3;
  const stars: UniverseStar[] = [];

  for (let i = 0; i < safeCount; i++) {
    const isDeepField = i % 5 === 0;
    const armIndex = i % arms;
    const u = rng();
    const radiusNorm = isDeepField ? 0.15 + rng() * 0.98 : 0.04 + Math.pow(u, 0.72) * 0.94;
    const spiralTwist = radiusNorm * 5.2;
    const scatter = (rng() - 0.5) * (0.42 + radiusNorm * 0.55);
    const armOffset = (armIndex * Math.PI * 2) / arms;
    const baseAngle = isDeepField ? rng() * Math.PI * 2 : armOffset + spiralTwist + scatter;

    const zDepth = (rng() - 0.5) * 0.18;
    const size = isDeepField ? 0.8 + rng() * 1.1 : 0.95 + (1 - radiusNorm * 0.45) * 1.7;
    const baseAlpha = isDeepField
      ? 0.22 + rng() * 0.34
      : Math.min(0.9, 0.3 + (1 - radiusNorm * 0.55) * 0.54);
    const twinklePhase = rng() * Math.PI * 2;
    const tonePick = rng();
    const tone: UniverseStar['tone'] =
      tonePick < 0.42 ? 'primary' : tonePick < 0.72 ? 'neutral' : 'secondary';
    const gradeSpec = GRADE_STAR_SPECTRUM[i % GRADE_STAR_SPECTRUM.length];

    stars.push({
      index: i,
      radiusNorm,
      baseAngle,
      armOffset,
      zDepth,
      size,
      baseAlpha,
      twinklePhase,
      tone,
      gradeColorRgb: gradeSpec.rgb,
      gradeColorTuple: gradeSpec.rgbTuple,
      gradeColorHex: gradeSpec.hex,
      gradeTier: gradeSpec.grade,
      isDeepField
    });
  }

  return stars;
}

export function projectGalaxyPoint(
  star: UniverseStar,
  elapsedSec: number,
  width: number,
  height: number,
  speedMultiplier = 1,
  streakScale = speedMultiplier
): ProjectedStar {
  const cx = width * 0.5;
  const cy = height * 0.47;
  const maxRadius = Math.hypot(width, height) * 0.52;

  // Differential Keplerian orbital spin: inner core swirls faster than outer spiral arms
  const angularVel = star.isDeepField
    ? 0.015
    : 0.115 / (0.24 + Math.pow(star.radiusNorm, 0.85));
  const angle = star.baseAngle + elapsedSec * angularVel * speedMultiplier;

  const r = star.radiusNorm * maxRadius;
  const cosTilt = -0.24; // subtle -14 deg galactic plane tilt
  const sinTilt = 0.97;
  const localX = Math.cos(angle) * r;
  const localY = Math.sin(angle) * r * 0.58; // elliptical 3D foreshortening

  const rx = localX * sinTilt - localY * cosTilt;
  const ry = localX * cosTilt + localY * sinTilt + star.zDepth * r * 0.35;

  const twinkleRate = 0.85 + Math.min(1.6, Math.max(0, streakScale) * 0.55);
  const twinkle = streakScale <= 0.01 ? 0.85 : 0.74 + 0.26 * Math.sin(elapsedSec * twinkleRate + star.twinklePhase);
  const alpha = Math.max(0.05, Math.min(0.95, star.baseAlpha * twinkle));

  // Tangent velocity direction for subtle relativistic orbital streaks
  const tanLocalX = -Math.sin(angle);
  const tanLocalY = Math.cos(angle) * 0.58;
  const tanX = tanLocalX * sinTilt - tanLocalY * cosTilt;
  const tanY = tanLocalX * cosTilt + tanLocalY * sinTilt;
  const angleRad = Math.atan2(tanY, tanX);

  const tailLength =
    star.isDeepField || streakScale <= 0.01
      ? 0
      : Math.min(18, (1.5 + (1 - star.radiusNorm) * 7.5) * Math.min(2.2, streakScale));

  return {
    x: cx + rx,
    y: cy + ry,
    size: star.size,
    alpha,
    tone: star.tone,
    gradeColorRgb: star.gradeColorRgb,
    angleRad,
    tailLength
  };
}
