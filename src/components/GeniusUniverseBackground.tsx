import { useEffect, useMemo, useRef, useState } from 'react';
import {
  GRADE_STAR_SPECTRUM,
  PHYSICS_EQUATION_SPRITES,
  computeUniverseTelemetryForGrade,
  createUniverseStars,
  projectGalaxyPoint
} from '../data/geniusUniverseField.ts';

interface GeniusUniverseBackgroundProps {
  active: boolean;
  isAuditing: boolean;
  hasActiveAudit: boolean;
  grade: string;
  totalScore: number;
  scanProgressPct?: number;
  paused: boolean;
  primaryColor: string;
  secondaryColor: string;
}

function hexToRgbTuple(hex: string): [number, number, number] {
  const clean = String(hex || '').replace('#', '').trim();
  if (clean.length === 6) {
    const r = Number.parseInt(clean.slice(0, 2), 16);
    const g = Number.parseInt(clean.slice(2, 4), 16);
    const b = Number.parseInt(clean.slice(4, 6), 16);
    if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
      return [r, g, b];
    }
  }
  return [73, 234, 203];
}

interface SmoothUniverseState {
  pR: number;
  pG: number;
  pB: number;
  sR: number;
  sG: number;
  sB: number;
  speedMult: number;
  starCountFloat: number;
  nebulaMult: number;
  multiGradeMix: number;
}

export function GeniusUniverseBackground({
  active,
  isAuditing,
  hasActiveAudit,
  grade,
  totalScore,
  scanProgressPct = 0,
  paused,
  primaryColor,
  secondaryColor
}: GeniusUniverseBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const orbitalClockRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const [viewportIsMobile, setViewportIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? (window.innerWidth || 1440) < 768 : false
  );

  // Full deterministic 360-star cosmic pool so density scales seamlessly from F (0) to A+ (360)
  const stars = useMemo(() => createUniverseStars(360, 20261115), []);

  const telemetry = useMemo(
    () =>
      computeUniverseTelemetryForGrade({
        hasActiveAudit,
        isAuditing,
        totalScore,
        grade,
        scanProgressPct,
        isMobile: viewportIsMobile
      }),
    [hasActiveAudit, isAuditing, totalScore, grade, scanProgressPct, viewportIsMobile]
  );

  const initialPrimary = hexToRgbTuple(primaryColor);
  const initialSecondary = hexToRgbTuple(secondaryColor);

  const smoothRef = useRef<SmoothUniverseState>({
    pR: initialPrimary[0],
    pG: initialPrimary[1],
    pB: initialPrimary[2],
    sR: initialSecondary[0],
    sG: initialSecondary[1],
    sB: initialSecondary[2],
    speedMult: telemetry.motionSpeed,
    starCountFloat: telemetry.starCount,
    nebulaMult: telemetry.nebulaIntensity,
    multiGradeMix: telemetry.useMultiGradeStarColors ? 1 : 0
  });

  const targetRef = useRef({
    hasActiveAudit,
    isAuditing,
    totalScore,
    grade,
    scanProgressPct,
    primaryRgb: initialPrimary,
    secondaryRgb: initialSecondary
  });

  targetRef.current = {
    hasActiveAudit,
    isAuditing,
    totalScore,
    grade,
    scanProgressPct,
    primaryRgb: hexToRgbTuple(primaryColor),
    secondaryRgb: hexToRgbTuple(secondaryColor)
  };

  useEffect(() => {
    if (!active) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth || 1440;
    let height = window.innerHeight || 900;
    let dpr = Math.min(1.5, window.devicePixelRatio || 1);

    const syncSize = () => {
      width = window.innerWidth || 1440;
      height = window.innerHeight || 900;
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      setViewportIsMobile(width < 768);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    syncSize();

    const drawFrame = (dtSec: number) => {
      const tgt = targetRef.current;
      const tgtTelemetry = computeUniverseTelemetryForGrade({
        hasActiveAudit: tgt.hasActiveAudit,
        isAuditing: tgt.isAuditing,
        totalScore: tgt.totalScore,
        grade: tgt.grade,
        scanProgressPct: tgt.scanProgressPct,
        isMobile: width < 768
      });

      const sm = smoothRef.current;
      // Exponential smoothing (~0.7s convergence) prevents abrupt color, speed, or star pops during live audits
      const k = dtSec > 0 ? 1 - Math.exp(-dtSec * 4.2) : 1;

      sm.pR += (tgt.primaryRgb[0] - sm.pR) * k;
      sm.pG += (tgt.primaryRgb[1] - sm.pG) * k;
      sm.pB += (tgt.primaryRgb[2] - sm.pB) * k;
      sm.sR += (tgt.secondaryRgb[0] - sm.sR) * k;
      sm.sG += (tgt.secondaryRgb[1] - sm.sG) * k;
      sm.sB += (tgt.secondaryRgb[2] - sm.sB) * k;
      sm.speedMult += (tgtTelemetry.motionSpeed - sm.speedMult) * k;
      sm.starCountFloat += (tgtTelemetry.starCount - sm.starCountFloat) * k;
      sm.nebulaMult += (tgtTelemetry.nebulaIntensity - sm.nebulaMult) * k;
      const targetMultiMix = tgtTelemetry.useMultiGradeStarColors ? 1 : 0;
      sm.multiGradeMix += (targetMultiMix - sm.multiGradeMix) * k;

      if (dtSec > 0 && sm.speedMult > 0.002) {
        orbitalClockRef.current += dtSec * sm.speedMult;
      }

      const pR = Math.round(sm.pR);
      const pG = Math.round(sm.pG);
      const pB = Math.round(sm.pB);
      const sR = Math.round(sm.sR);
      const sG = Math.round(sm.sG);
      const sB = Math.round(sm.sB);
      const mix = Math.max(0, Math.min(1, sm.multiGradeMix));
      const nebulaMult = Math.max(0.08, sm.nebulaMult);

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.5;
      const coreR = Math.min(width, height) * 0.44;

      // Smoothly cross-fading galactic nebula wash
      const coreGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, coreR);
      const c0R = Math.round(pR + (73 - pR) * mix);
      const c0G = Math.round(pG + (234 - pG) * mix);
      const c0B = Math.round(pB + (203 - pB) * mix);
      const c1R = Math.round(sR + (250 - sR) * mix);
      const c1G = Math.round(sG + (204 - sG) * mix);
      const c1B = Math.round(sB + (21 - sB) * mix);

      coreGrad.addColorStop(0, `rgba(${c0R}, ${c0G}, ${c0B}, ${(0.14 * nebulaMult).toFixed(3)})`);
      coreGrad.addColorStop(0.34, `rgba(${c1R}, ${c1G}, ${c1B}, ${(0.075 * nebulaMult).toFixed(3)})`);
      coreGrad.addColorStop(
        0.68,
        mix > 0.05
          ? `rgba(239, 68, 68, ${(0.036 * mix * nebulaMult).toFixed(3)})`
          : 'rgba(20, 32, 48, 0.04)'
      );
      coreGrad.addColorStop(1, 'rgba(11, 12, 14, 0)');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(0, 0, width, height);

      const visibleCount = Math.min(stars.length, Math.ceil(sm.starCountFloat));

      // Subtle spiral wave rings fade out cleanly when F grade extinguishes motion & stars
      const ringVisibility = Math.min(1, visibleCount / 40);
      if (ringVisibility > 0.02) {
        for (let arm = 0; arm < 3; arm++) {
          ctx.beginPath();
          const armBase = (arm * Math.PI * 2) / 3 + orbitalClockRef.current * 0.045;
          for (let step = 0; step <= 44; step++) {
            const frac = step / 44;
            const ang = armBase + frac * 4.8;
            const rad = (0.04 + frac * 0.48) * Math.hypot(width, height);
            const lx = Math.cos(ang) * rad;
            const ly = Math.sin(ang) * rad * 0.58;
            const x = cx + lx * 0.97 + ly * 0.24;
            const y = cy - lx * 0.24 + ly * 0.97;
            if (step === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          const armTargetRgb =
            arm === 0 ? [73, 234, 203] : arm === 1 ? [250, 204, 21] : [239, 68, 68];
          const baseRgb = arm % 2 === 0 ? [pR, pG, pB] : [sR, sG, sB];
          const rRgb = Math.round(baseRgb[0] + (armTargetRgb[0] - baseRgb[0]) * mix);
          const gRgb = Math.round(baseRgb[1] + (armTargetRgb[1] - baseRgb[1]) * mix);
          const bRgb = Math.round(baseRgb[2] + (armTargetRgb[2] - baseRgb[2]) * mix);
          const alpha = (0.048 * nebulaMult * ringVisibility).toFixed(3);
          ctx.strokeStyle = `rgba(${rRgb}, ${gRgb}, ${bRgb}, ${alpha})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }

      // Draw smoothed star count with smooth RGB cross-fade & per-star fade visibility
      if (sm.starCountFloat > 0.2) {
        for (let i = 0; i < visibleCount; i++) {
          const starVisibility = Math.max(0, Math.min(1, sm.starCountFloat - i));
          if (starVisibility <= 0.02) continue;

          const star = stars[i];
          const proj = projectGalaxyPoint(
            star,
            orbitalClockRef.current,
            width,
            height,
            1,
            sm.speedMult,
            cx,
            cy
          );
          if (proj.x < -20 || proj.x > width + 20 || proj.y < -20 || proj.y > height + 20) {
            continue;
          }

          const resR =
            proj.tone === 'primary' ? pR : proj.tone === 'secondary' ? sR : 226;
          const resG =
            proj.tone === 'primary' ? pG : proj.tone === 'secondary' ? sG : 232;
          const resB =
            proj.tone === 'primary' ? pB : proj.tone === 'secondary' ? sB : 240;

          const mgTuple =
            star.isDeepField && i % 10 === 0 ? [226, 232, 240] : star.gradeColorTuple;

          const r = Math.round(resR + (mgTuple[0] - resR) * mix);
          const g = Math.round(resG + (mgTuple[1] - resG) * mix);
          const b = Math.round(resB + (mgTuple[2] - resB) * mix);
          const rgb = `${r}, ${g}, ${b}`;

          if (proj.tailLength > 1.5) {
            const x0 = proj.x - Math.cos(proj.angleRad) * proj.tailLength;
            const y0 = proj.y - Math.sin(proj.angleRad) * proj.tailLength;
            const grad = ctx.createLinearGradient(x0, y0, proj.x, proj.y);
            grad.addColorStop(0, `rgba(${rgb}, 0)`);
            grad.addColorStop(1, `rgba(${rgb}, ${(proj.alpha * 0.65 * starVisibility).toFixed(3)})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = Math.max(0.7, proj.size * 0.72);
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(proj.x, proj.y);
            ctx.stroke();
          }

          const starAlpha = Math.min(0.95, proj.alpha * (1 + 0.12 * mix) * starVisibility);
          ctx.fillStyle = `rgba(${rgb}, ${starAlpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    };

    drawFrame(0);

    if (paused || prefersReducedMotion) {
      window.addEventListener('resize', syncSize);
      return () => window.removeEventListener('resize', syncSize);
    }

    let rafId = 0;
    let lastDrawMs = 0;
    let settledZeroDrawn = false;
    lastTimeRef.current = performance.now();

    const tick = (nowMs: number) => {
      rafId = window.requestAnimationFrame(tick);
      if (document.hidden) {
        lastTimeRef.current = nowMs;
        return;
      }
      if (nowMs - lastDrawMs < 32) return; // smooth ~30fps backdrop budget
      lastDrawMs = nowMs;
      const prev = lastTimeRef.current ?? nowMs;
      const dt = Math.min(0.08, Math.max(0, (nowMs - prev) / 1000));
      lastTimeRef.current = nowMs;

      const tgt = targetRef.current;
      const tgtTel = computeUniverseTelemetryForGrade({
        hasActiveAudit: tgt.hasActiveAudit,
        isAuditing: tgt.isAuditing,
        totalScore: tgt.totalScore,
        grade: tgt.grade,
        scanProgressPct: tgt.scanProgressPct,
        isMobile: width < 768
      });
      const sm = smoothRef.current;
      const atZeroRest =
        tgtTel.isZeroMotion &&
        sm.starCountFloat < 0.15 &&
        sm.speedMult < 0.005 &&
        Math.abs(tgt.primaryRgb[0] - sm.pR) < 1;

      if (atZeroRest) {
        sm.starCountFloat = 0;
        sm.speedMult = 0;
        if (settledZeroDrawn) return;
        settledZeroDrawn = true;
      } else {
        settledZeroDrawn = false;
      }

      drawFrame(dt);
    };

    rafId = window.requestAnimationFrame(tick);
    window.addEventListener('resize', syncSize);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', syncSize);
    };
  }, [active, paused, stars]);

  const isZeroMotion = telemetry.isZeroMotion;
  const vortexGradient = telemetry.useMultiGradeStarColors
    ? 'conic-gradient(from 0deg, transparent 0deg, #49EACB18 42deg, #4ADE8014 96deg, #FACC1516 156deg, #FB923C14 218deg, #EF444416 282deg, #34D39914 330deg, transparent 360deg)'
    : `conic-gradient(from 0deg, transparent 0deg, ${primaryColor}16 48deg, transparent 120deg, ${secondaryColor}14 185deg, transparent 250deg, ${primaryColor}12 315deg, transparent 360deg)`;

  return (
    <div
      data-testid="genius-universe-bg"
      data-star-count={telemetry.starCount}
      data-motion-speed={telemetry.motionSpeed.toFixed(2)}
      data-vortex-dur={`${telemetry.vortexDurationSec}s`}
      data-star-palette={telemetry.useMultiGradeStarColors ? 'all-grades' : 'grade-locked'}
      data-grade={grade}
      data-zero-motion={isZeroMotion ? 'true' : 'false'}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 overflow-hidden z-0 transition-opacity duration-700 ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Swirling galactic spiral starfield + gravitational vortex */}
      <canvas
        ref={canvasRef}
        data-testid="genius-universe-canvas"
        className="absolute inset-0 w-full h-full block"
      />

      {/* Ambient galactic core rotation aura (hidden/motionless on Grade F) */}
      <div
        className={`genius-vortex-spin absolute left-1/2 top-1/2 w-[780px] h-[780px] sm:w-[1160px] sm:h-[1160px] rounded-full transition-opacity duration-700 ${
          paused || isZeroMotion ? 'bg-anim-paused' : ''
        }`}
        style={{
          opacity: isZeroMotion ? 0 : Math.min(0.46, 0.24 * telemetry.nebulaIntensity + 0.1),
          ['--vortex-dur' as string]: `${Math.max(24, telemetry.vortexDurationSec)}s`,
          background: vortexGradient
        }}
      />

      {/* Lightly floating mathematical laws of physics strictly behind objects & buttons */}
      <div data-testid="genius-physics-equations" className="absolute inset-0 overflow-hidden">
        {PHYSICS_EQUATION_SPRITES.map((sprite) => {
          const gradeTierColor =
            GRADE_STAR_SPECTRUM[sprite.gradeTierIndex % GRADE_STAR_SPECTRUM.length]?.hex || primaryColor;
          const color = telemetry.useMultiGradeStarColors
            ? gradeTierColor
            : sprite.tone === 'primary'
            ? primaryColor
            : sprite.tone === 'secondary'
            ? secondaryColor
            : '#E5E7EB';
          const scaledDurSec =
            telemetry.equationSpeedMult > 0
              ? Math.max(12, Math.round(sprite.durationSec / telemetry.equationSpeedMult))
              : 120;

          return (
            <span
              key={sprite.id}
              className={`genius-math-float absolute select-none whitespace-nowrap font-mono italic tracking-wide text-[11px] sm:text-[13px] transition-colors duration-700 ${
                sprite.showOnMobile ? 'block' : 'hidden md:block'
              } ${paused || isZeroMotion ? 'bg-anim-paused' : ''}`}
              style={{
                left: `${sprite.xPct}%`,
                top: `${sprite.yPct}%`,
                color,
                opacity: isZeroMotion
                  ? 0.14
                  : Math.max(0.11, Math.min(0.28, sprite.opacity * (0.68 + telemetry.nebulaIntensity * 0.34))),
                textShadow: `0 0 18px ${color}33`,
                ['--math-dx' as string]: `${sprite.driftX}px`,
                ['--math-dy' as string]: `${sprite.driftY}px`,
                ['--math-rot' as string]: `${sprite.rotDeg}deg`,
                ['--math-scale' as string]: String(sprite.scale),
                ['--math-dur' as string]: `${scaledDurSec}s`,
                ['--math-delay' as string]: `${sprite.delaySec}s`
              }}
            >
              {sprite.formula}
            </span>
          );
        })}
      </div>
    </div>
  );
}
