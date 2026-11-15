import { useEffect, useMemo, useRef, useState } from 'react';
import {
  GENIUS_SEARCH_WAVE_SPECS,
  buildStadiumPerimeterSamples,
  buildStadiumWavePath
} from '../data/searchWaveRing.ts';
import { subscribeSharedWave } from './OrbitalNodes.tsx';

interface GeniusSearchWaveRingsProps {
  active: boolean;
  isAuditing: boolean;
  targetRef: { current: HTMLDivElement | null };
}

const WAVE_SVG_PAD = 46;

export function GeniusSearchWaveRings({
  active,
  isAuditing,
  targetRef
}: GeniusSearchWaveRingsProps) {
  const [boxSize, setBoxSize] = useState<{ width: number; height: number }>({
    width: 576,
    height: 46
  });
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const phasesRef = useRef<number[]>(
    GENIUS_SEARCH_WAVE_SPECS.map((_, idx) => idx * 0.85)
  );

  useEffect(() => {
    if (!active) return undefined;
    const el = targetRef.current;
    if (!el) return undefined;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 40 && rect.height > 20) {
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);
        setBoxSize((prev) =>
          prev.width === w && prev.height === h ? prev : { width: w, height: h }
        );
      }
    };

    updateSize();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateSize);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [active, targetRef]);

  const samples = useMemo(
    () => buildStadiumPerimeterSamples(boxSize.width, boxSize.height, WAVE_SVG_PAD, 168),
    [boxSize.width, boxSize.height]
  );

  const radialScale = boxSize.width < 430 ? 0.5 : 1;

  const initialPaths = useMemo(
    () =>
      GENIUS_SEARCH_WAVE_SPECS.map((spec, idx) =>
        buildStadiumWavePath(samples, spec, phasesRef.current[idx] || 0, 1, radialScale)
      ),
    [samples, radialScale]
  );

  useEffect(() => {
    if (!active) return undefined;

    const speedMul = isAuditing ? 1.85 : 1;
    const ampMul = isAuditing ? 1.15 : 1;

    const renderAll = (dt = 0) => {
      for (let i = 0; i < GENIUS_SEARCH_WAVE_SPECS.length; i++) {
        const spec = GENIUS_SEARCH_WAVE_SPECS[i];
        if (dt > 0) {
          phasesRef.current[i] =
            (phasesRef.current[i] || 0) + spec.speed * speedMul * Math.min(1.5, dt);
        }
        const pathEl = pathRefs.current[i];
        if (pathEl) {
          pathEl.setAttribute(
            'd',
            buildStadiumWavePath(samples, spec, phasesRef.current[i], ampMul, radialScale)
          );
        }
      }
    };

    renderAll(0);
    return subscribeSharedWave((dt) => renderAll(dt), 24);
  }, [active, isAuditing, samples, radialScale]);

  if (!active) return null;

  const svgWidth = boxSize.width + WAVE_SVG_PAD * 2;
  const svgHeight = boxSize.height + WAVE_SVG_PAD * 2;

  return (
    <svg
      data-testid="genius-search-harmonic-wave"
      aria-hidden="true"
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      style={{
        left: `-${WAVE_SVG_PAD}px`,
        top: `-${WAVE_SVG_PAD}px`,
        width: `calc(100% + ${WAVE_SVG_PAD * 2}px)`,
        height: `calc(100% + ${WAVE_SVG_PAD * 2}px)`
      }}
      className="pointer-events-none absolute z-0 overflow-visible"
    >
      {GENIUS_SEARCH_WAVE_SPECS.map((spec, idx) => (
        <path
          key={spec.gradeLabel}
          ref={(el) => {
            pathRefs.current[idx] = el;
          }}
          d={initialPaths[idx]}
          fill="none"
          stroke={spec.color}
          strokeWidth={spec.strokeWidth}
          strokeOpacity={isAuditing ? Math.min(1, spec.opacity + 0.12) : spec.opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
