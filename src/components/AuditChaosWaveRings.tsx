import { useEffect, useMemo, useRef } from 'react';
import {
  AUDIT_CHAOS_BANDS,
  buildCircularChaosWavePath,
  computeChaosLevel,
  resolveSettledHarmonyProfile
} from '../data/auditChaosWave.ts';
import { subscribeSharedWave } from './OrbitalNodes.tsx';

interface AuditChaosWaveRingsProps {
  active: boolean;
  progressPct: number;
  projectedGrade: string;
  projectedTotal: number | null;
}

const CANVAS_SIZE = 340;
const CENTER = CANVAS_SIZE / 2;
const SPHERE_RADIUS = 118; // Matches 236px auditing center nucleus radius

export function AuditChaosWaveRings({
  active,
  progressPct,
  projectedGrade,
  projectedTotal
}: AuditChaosWaveRingsProps) {
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const phasesRef = useRef<number[]>(AUDIT_CHAOS_BANDS.map((_, i) => i * 0.91));
  const chaosSmoothRef = useRef<number>(1);
  const progressRef = useRef<number>(progressPct);
  const settledRef = useRef(resolveSettledHarmonyProfile(projectedGrade, projectedTotal));

  progressRef.current = progressPct;
  settledRef.current = resolveSettledHarmonyProfile(projectedGrade, projectedTotal);

  useEffect(() => {
    if (active) {
      chaosSmoothRef.current = 1;
    }
  }, [active]);

  const initialPaths = useMemo(() => {
    const initialSettled = resolveSettledHarmonyProfile(projectedGrade, projectedTotal);
    return AUDIT_CHAOS_BANDS.map((_, idx) =>
      buildCircularChaosWavePath(idx, CENTER, CENTER, SPHERE_RADIUS, 0, 1, initialSettled, 128)
    );
  }, []);

  useEffect(() => {
    if (!active) return undefined;

    const renderFrame = (dt = 0) => {
      const targetChaos = computeChaosLevel(progressRef.current / 100);
      chaosSmoothRef.current += (targetChaos - chaosSmoothRef.current) * 0.26;
      if (targetChaos === 0 && chaosSmoothRef.current < 0.015) {
        chaosSmoothRef.current = 0;
      }
      const chaosNow = Math.max(0, Math.min(1, chaosSmoothRef.current));
      const settled = settledRef.current;

      for (let i = 0; i < AUDIT_CHAOS_BANDS.length; i++) {
        const band = AUDIT_CHAOS_BANDS[i];
        if (dt > 0) {
          const speedNow =
            chaosNow * band.chaosSpeed + (1 - chaosNow) * settled.settledSpeed;
          phasesRef.current[i] =
            (phasesRef.current[i] || 0) + speedNow * Math.min(1.5, dt);
        }

        const { d, opacity } = buildCircularChaosWavePath(
          i,
          CENTER,
          CENTER,
          SPHERE_RADIUS,
          phasesRef.current[i] || 0,
          chaosNow,
          settled,
          128
        );

        const el = pathRefs.current[i];
        if (el) {
          el.setAttribute('d', d);
          el.setAttribute('stroke-opacity', opacity.toFixed(3));
        }
      }
    };

    renderFrame(0);
    return subscribeSharedWave((dt) => renderFrame(dt), 28);
  }, [active]);

  if (!active) return null;

  return (
    <svg
      data-testid="audit-chaos-waves"
      aria-hidden="true"
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] z-[19] overflow-visible"
    >
      {AUDIT_CHAOS_BANDS.map((band, idx) => (
        <path
          key={band.gradeLabel}
          ref={(el) => {
            pathRefs.current[idx] = el;
          }}
          d={initialPaths[idx]?.d || ''}
          fill="none"
          stroke={band.color}
          strokeWidth={band.strokeWidth}
          strokeOpacity={initialPaths[idx]?.opacity ?? 0.65}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
