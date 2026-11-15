import { useEffect, useMemo, useRef } from 'react';
import {
  PHYSICS_EQUATION_SPRITES,
  createUniverseStars,
  projectGalaxyPoint
} from '../data/geniusUniverseField.ts';

interface GeniusUniverseBackgroundProps {
  active: boolean;
  isAuditing: boolean;
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

export function GeniusUniverseBackground({
  active,
  isAuditing,
  paused,
  primaryColor,
  secondaryColor
}: GeniusUniverseBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);

  const stars = useMemo(() => createUniverseStars(220, 20261115), []);

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
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    syncSize();

    const [pR, pG, pB] = hexToRgbTuple(primaryColor);
    const [sR, sG, sB] = hexToRgbTuple(secondaryColor);
    const speedMult = isAuditing ? 1.7 : 1;

    const drawFrame = (elapsedSec: number) => {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.47;
      const coreR = Math.min(width, height) * 0.44;

      // Soft galactic accretion nebula wash centered behind orbital stage
      const coreGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, coreR);
      coreGrad.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${isAuditing ? 0.19 : 0.13})`);
      coreGrad.addColorStop(0.36, `rgba(${sR}, ${sG}, ${sB}, ${isAuditing ? 0.1 : 0.065})`);
      coreGrad.addColorStop(0.72, 'rgba(20, 32, 48, 0.045)');
      coreGrad.addColorStop(1, 'rgba(11, 12, 14, 0)');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle spiral gravitational wave rings
      for (let arm = 0; arm < 3; arm++) {
        ctx.beginPath();
        const armBase = (arm * Math.PI * 2) / 3 + elapsedSec * 0.045 * speedMult;
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
        ctx.strokeStyle =
          arm % 2 === 0
            ? `rgba(${pR}, ${pG}, ${pB}, 0.045)`
            : `rgba(${sR}, ${sG}, ${sB}, 0.035)`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      const activeStars = width < 768 ? stars.slice(0, 140) : stars;
      for (let i = 0; i < activeStars.length; i++) {
        const star = activeStars[i];
        const proj = projectGalaxyPoint(star, elapsedSec, width, height, speedMult);
        if (proj.x < -20 || proj.x > width + 20 || proj.y < -20 || proj.y > height + 20) {
          continue;
        }
        const rgb =
          proj.tone === 'primary'
            ? `${pR}, ${pG}, ${pB}`
            : proj.tone === 'secondary'
            ? `${sR}, ${sG}, ${sB}`
            : '226, 232, 240';

        if (proj.tailLength > 1.5) {
          const x0 = proj.x - Math.cos(proj.angleRad) * proj.tailLength;
          const y0 = proj.y - Math.sin(proj.angleRad) * proj.tailLength;
          const grad = ctx.createLinearGradient(x0, y0, proj.x, proj.y);
          grad.addColorStop(0, `rgba(${rgb}, 0)`);
          grad.addColorStop(1, `rgba(${rgb}, ${(proj.alpha * 0.62).toFixed(3)})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = Math.max(0.7, proj.size * 0.72);
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(proj.x, proj.y);
          ctx.stroke();
        }

        ctx.fillStyle = `rgba(${rgb}, ${proj.alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    drawFrame(elapsedRef.current);

    if (paused || prefersReducedMotion) {
      window.addEventListener('resize', syncSize);
      return () => window.removeEventListener('resize', syncSize);
    }

    let rafId = 0;
    let lastDrawMs = 0;
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
      const dt = Math.min(0.1, Math.max(0, (nowMs - prev) / 1000));
      lastTimeRef.current = nowMs;
      elapsedRef.current += dt;
      drawFrame(elapsedRef.current);
    };

    rafId = window.requestAnimationFrame(tick);
    window.addEventListener('resize', syncSize);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', syncSize);
    };
  }, [active, isAuditing, paused, primaryColor, secondaryColor, stars]);

  return (
    <div
      data-testid="genius-universe-bg"
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

      {/* Ambient galactic core rotation aura (compositor-only GPU rotation) */}
      <div
        className={`genius-vortex-spin absolute left-1/2 top-[47%] w-[780px] h-[780px] sm:w-[1160px] sm:h-[1160px] rounded-full opacity-35 ${
          paused ? 'bg-anim-paused' : ''
        }`}
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, ${primaryColor}16 48deg, transparent 120deg, ${secondaryColor}14 185deg, transparent 250deg, ${primaryColor}12 315deg, transparent 360deg)`
        }}
      />

      {/* Lightly floating mathematical laws of physics strictly behind objects & buttons */}
      <div data-testid="genius-physics-equations" className="absolute inset-0 overflow-hidden">
        {PHYSICS_EQUATION_SPRITES.map((sprite) => {
          const color =
            sprite.tone === 'primary'
              ? primaryColor
              : sprite.tone === 'secondary'
              ? secondaryColor
              : '#E5E7EB';

          return (
            <span
              key={sprite.id}
              className={`genius-math-float absolute select-none whitespace-nowrap font-mono italic tracking-wide text-[11px] sm:text-[13px] ${
                sprite.showOnMobile ? 'block' : 'hidden md:block'
              } ${paused ? 'bg-anim-paused' : ''}`}
              style={{
                left: `${sprite.xPct}%`,
                top: `${sprite.yPct}%`,
                color,
                opacity: sprite.opacity,
                textShadow: `0 0 18px ${color}33`,
                ['--math-dx' as string]: `${sprite.driftX}px`,
                ['--math-dy' as string]: `${sprite.driftY}px`,
                ['--math-rot' as string]: `${sprite.rotDeg}deg`,
                ['--math-scale' as string]: String(sprite.scale),
                ['--math-dur' as string]: `${sprite.durationSec}s`,
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
