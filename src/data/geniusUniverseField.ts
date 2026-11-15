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
  showOnMobile: boolean;
}

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
  isDeepField: boolean;
}

export interface ProjectedStar {
  x: number;
  y: number;
  size: number;
  alpha: number;
  tone: 'primary' | 'secondary' | 'neutral';
  angleRad: number;
  tailLength: number;
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

export function createUniverseStars(count = 220, seed = 20261115): UniverseStar[] {
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
    const size = isDeepField ? 0.8 + rng() * 1.1 : 0.9 + (1 - radiusNorm * 0.45) * 1.65;
    const baseAlpha = isDeepField
      ? 0.18 + rng() * 0.3
      : Math.min(0.85, 0.25 + (1 - radiusNorm * 0.55) * 0.52);
    const twinklePhase = rng() * Math.PI * 2;
    const tonePick = rng();
    const tone: UniverseStar['tone'] =
      tonePick < 0.42 ? 'primary' : tonePick < 0.72 ? 'neutral' : 'secondary';

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
  speedMultiplier = 1
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

  const twinkle = 0.74 + 0.26 * Math.sin(elapsedSec * 1.35 + star.twinklePhase);
  const alpha = Math.max(0.05, Math.min(0.95, star.baseAlpha * twinkle));

  // Tangent velocity direction for subtle relativistic orbital streaks
  const tanLocalX = -Math.sin(angle);
  const tanLocalY = Math.cos(angle) * 0.58;
  const tanX = tanLocalX * sinTilt - tanLocalY * cosTilt;
  const tanY = tanLocalX * cosTilt + tanLocalY * sinTilt;
  const angleRad = Math.atan2(tanY, tanX);

  const tailLength = star.isDeepField
    ? 0
    : Math.min(16, (1.5 + (1 - star.radiusNorm) * 7.5) * Math.min(2, speedMultiplier));

  return {
    x: cx + rx,
    y: cy + ry,
    size: star.size,
    alpha,
    tone: star.tone,
    angleRad,
    tailLength
  };
}
