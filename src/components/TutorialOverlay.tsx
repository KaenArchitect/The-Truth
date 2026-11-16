import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Play, X } from 'lucide-react';
import type { GradeAccent } from '../data/rubricSpec.ts';
import {
  TUTORIAL_STEPS,
  computeMobileScrollTargetY,
  computeSpotlightCardPosition,
  getTutorialStepsForViewport,
  type SpotlightRect,
  type TutorialActionId,
  type TutorialStep
} from '../data/tutorialSteps.ts';

export interface TutorialOverlayProps {
  isOpen: boolean;
  stepIndex: number;
  steps?: TutorialStep[];
  accent: GradeAccent;
  onChangeStep: (nextIndex: number) => void;
  onExecuteAction: (actionId: TutorialActionId) => void;
  onClose: (markSeen?: boolean) => void;
}

function findVisibleTarget(targetId: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const candidates = document.querySelectorAll<HTMLElement>(`[data-tutorial-id="${targetId}"]`);
  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return el;
    }
  }
  return null;
}

export function TutorialOverlay({
  isOpen,
  stepIndex,
  steps,
  accent,
  onChangeStep,
  onExecuteAction,
  onClose
}: TutorialOverlayProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [targetRect, setTargetRect] = useState<SpotlightRect | null>(null);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900
  }));
  const isMobile = viewport.width < 768;
  const activeSteps = steps && steps.length > 0 ? steps : getTutorialStepsForViewport(viewport.width);
  const safeIndex = Math.max(0, Math.min(activeSteps.length - 1, stepIndex));
  const step: TutorialStep = activeSteps[safeIndex] || activeSteps[0] || TUTORIAL_STEPS[0];
  const isFirst = safeIndex <= 0;
  const isLast = safeIndex >= activeSteps.length - 1;
  const [cardHeight, setCardHeight] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 175 : 360
  );

  const measureTarget = useCallback(() => {
    if (!isOpen) return;
    const nextVw = window.innerWidth;
    const nextVh = window.innerHeight;
    setViewport((prev) =>
      prev.width === nextVw && prev.height === nextVh ? prev : { width: nextVw, height: nextVh }
    );

    const el = findVisibleTarget(step.targetId);
    if (!el) {
      setTargetRect((prev) => (prev === null ? prev : null));
      return;
    }
    const r = el.getBoundingClientRect();
    const pad = 10;
    const nextRect: SpotlightRect = {
      top: Math.max(4, Math.round(r.top - pad)),
      left: Math.max(4, Math.round(r.left - pad)),
      width: Math.round(r.width + pad * 2),
      height: Math.round(r.height + pad * 2)
    };
    setTargetRect((prev) =>
      prev &&
      Math.abs(prev.top - nextRect.top) <= 1 &&
      Math.abs(prev.left - nextRect.left) <= 1 &&
      Math.abs(prev.width - nextRect.width) <= 1 &&
      Math.abs(prev.height - nextRect.height) <= 1
        ? prev
        : nextRect
    );
  }, [isOpen, step.targetId]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const measuredCardH = cardRef.current
      ? Math.round(cardRef.current.getBoundingClientRect().height)
      : cardHeight;
    if (measuredCardH > 80) {
      setCardHeight(measuredCardH);
    }

    const alignMobileScroll = () => {
      if (window.innerWidth >= 768) return;
      const el = findVisibleTarget(step.targetId);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const docTop = window.scrollY + r.top;
      const maxScrollY = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const targetScrollY = computeMobileScrollTargetY(
        step.targetId,
        docTop,
        r.height,
        window.innerHeight,
        measuredCardH > 80 ? measuredCardH : cardHeight,
        maxScrollY
      );
      if (Math.abs(window.scrollY - targetScrollY) > 6) {
        window.scrollTo({ top: targetScrollY, behavior: 'auto' });
      }
    };

    alignMobileScroll();
    measureTarget();

    // Track continuously past the 740ms hero dock transform and settle cleanly afterwards
    let frameCount = 0;
    let rafId = 0;
    const track = () => {
      if (frameCount < 4) {
        alignMobileScroll();
      }
      measureTarget();
      frameCount++;
      if (frameCount < 75) {
        rafId = requestAnimationFrame(track);
      }
    };
    rafId = requestAnimationFrame(track);
    const t820 = window.setTimeout(measureTarget, 820);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.clearTimeout(t820);
    };
  }, [isOpen, stepIndex, step.targetId, measureTarget]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let rafPending = 0;
    const scheduleMeasure = () => {
      if (rafPending) return;
      rafPending = window.requestAnimationFrame(() => {
        rafPending = 0;
        measureTarget();
      });
    };
    const onTransitionEnd = (e: TransitionEvent) => {
      if (
        e.propertyName === 'transform' ||
        e.propertyName === 'translate' ||
        e.propertyName === 'width' ||
        e.propertyName === 'height'
      ) {
        scheduleMeasure();
      }
    };
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    window.addEventListener('scroll', scheduleMeasure, { capture: true, passive: true });
    document.addEventListener('transitionend', onTransitionEnd, true);
    const syncInterval = window.setInterval(scheduleMeasure, 450);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && cardRef.current) {
      ro = new ResizeObserver(() => {
        if (cardRef.current) {
          const h = Math.round(cardRef.current.getBoundingClientRect().height);
          if (h > 80) {
            setCardHeight((prev) => (Math.abs(prev - h) > 2 ? h : prev));
          }
        }
        scheduleMeasure();
      });
      ro.observe(cardRef.current);
    }

    return () => {
      if (rafPending) window.cancelAnimationFrame(rafPending);
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('scroll', scheduleMeasure, true);
      document.removeEventListener('transitionend', onTransitionEnd, true);
      window.clearInterval(syncInterval);
      if (ro) ro.disconnect();
    };
  }, [isOpen, measureTarget]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isTyping = activeTag === 'input' || activeTag === 'textarea';
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose(true);
      } else if (!isTyping && e.key === 'ArrowRight') {
        e.preventDefault();
        if (isLast) onClose(true);
        else onChangeStep(safeIndex + 1);
      } else if (!isTyping && e.key === 'ArrowLeft' && !isFirst) {
        e.preventDefault();
        onChangeStep(safeIndex - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isFirst, isLast, safeIndex, onChangeStep, onClose]);

  if (!isOpen) return null;

  const coords = computeSpotlightCardPosition(
    targetRect,
    viewport,
    { width: 380, height: cardHeight },
    step.preferredPlacement || 'bottom'
  );

  const maskId = 'truth-tutorial-spotlight-mask';

  return (
    <div
      className="fixed inset-0 z-[120] pointer-events-none"
      role="dialog"
      aria-modal="false"
      aria-label={`Interactive Tutorial — ${step.title}`}
      data-testid="tutorial-overlay"
    >
      {/* Dimmed SVG spotlight backdrop (click outside to dismiss) */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto cursor-pointer"
        onClick={() => onClose(true)}
        aria-hidden="true"
      >
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx={18}
                ry={18}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(6, 7, 9, 0.72)"
          mask={`url(#${maskId})`}
        />
      </svg>

      {/* Luminous focus ring around active UI region */}
      {targetRect && (
        <div
          aria-hidden="true"
          className="fixed pointer-events-none rounded-[18px] transition-all duration-300 ease-out"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            border: `1.5px solid ${accent.primary}`,
            boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 28px ${accent.glow}`
          }}
        />
      )}

      {/* Tutorial Coach Card */}
      <div
        ref={cardRef}
        data-placement={coords.placement}
        onClick={(e) => e.stopPropagation()}
        style={{
          top: coords.top,
          left: coords.left,
          width: coords.width,
          borderColor: accent.border,
          boxShadow: `0 22px 56px rgba(0, 0, 0, 0.85), 0 0 32px ${accent.glow}`
        }}
        className={`fixed pointer-events-auto rounded-2xl bg-[#101216]/98 border text-white transition-[top,left,width,border-color,box-shadow] duration-200 ease-out overflow-y-auto ${
          isMobile ? 'p-3.5 max-h-[38vh]' : 'p-5 max-h-[calc(100vh-24px)]'
        }`}
      >
        {/* Top editorial step counter & dismiss */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`font-mono font-semibold tracking-wider uppercase tabular-nums whitespace-nowrap ${
              isMobile ? 'text-[10.5px]' : 'text-[11px]'
            }`}
            style={{ color: accent.primary }}
          >
            {isMobile
              ? `Guide · ${step.stepNumber} / ${activeSteps.length}`
              : `Walkthrough · Step ${step.stepNumber} of ${activeSteps.length}`}
          </span>
          <button
            type="button"
            onClick={() => onClose(true)}
            aria-label="Close tutorial"
            className={`shrink-0 rounded-lg bg-[#171A21] hover:bg-[#1F242D] border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49EACB] ${
              isMobile ? 'w-8 h-8' : 'w-10 h-10'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented progress indicator (clickable step switcher) */}
        <div
          className={`grid ${isMobile ? 'gap-1 mt-1' : 'gap-1.5 mt-1.5'}`}
          style={{ gridTemplateColumns: `repeat(${activeSteps.length}, minmax(0, 1fr))` }}
          role="tablist"
          aria-label="Tutorial steps"
        >
          {activeSteps.map((s, idx) => {
            const isCurrent = idx === safeIndex;
            const isDone = idx < safeIndex;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                aria-label={`Jump to ${s.title}`}
                onClick={() => onChangeStep(idx)}
                className={`flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49EACB] ${
                  isMobile ? 'py-1' : 'py-1.5'
                }`}
              >
                <span
                  className={`block w-full rounded-full transition-all ${
                    isMobile ? 'h-1' : 'h-1.5'
                  }`}
                  style={{
                    backgroundColor: isCurrent
                      ? accent.primary
                      : isDone
                      ? `${accent.primary}66`
                      : 'rgba(255, 255, 255, 0.12)'
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Title & Summary */}
        <h2
          className={`font-display font-bold text-white leading-snug ${
            isMobile ? 'text-[15px] mt-1.5' : 'text-[17px] mt-2'
          }`}
        >
          {step.title}
        </h2>
        <p
          className={`text-neutral-300 ${
            isMobile ? 'text-[12.5px] leading-snug mt-1' : 'text-[13px] leading-relaxed mt-1'
          }`}
        >
          {step.summary}
        </p>

        {/* Step-by-step instructions (compact mobile omits secondary list) */}
        {step.instructions.length > 0 && (
          <ol className="mt-3 space-y-1.5 border-t border-white/[0.08] pt-3">
            {step.instructions.map((line, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[12px] text-neutral-200 leading-relaxed"
              >
                <span
                  className="font-mono text-[11px] font-bold shrink-0 mt-0.5 tabular-nums"
                  style={{ color: accent.primary }}
                >
                  0{i + 1}.
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        )}

        {/* Interactive action button + Navigation footer */}
        <div
          className={`border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 ${
            isMobile ? 'mt-2.5 pt-2.5' : 'mt-3.5 pt-3'
          }`}
        >
          <div className="flex items-center gap-2">
            {step.actionLabel && step.actionId && (
              <button
                type="button"
                onClick={() => onExecuteAction(step.actionId!)}
                className={`rounded-lg bg-[#171A21] hover:bg-[#1F242E] border border-white/15 font-mono font-semibold text-white transition inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49EACB] ${
                  isMobile ? 'min-h-[34px] px-2.5 py-1.5 text-[11px]' : 'min-h-[40px] px-3.5 py-2 text-xs'
                }`}
              >
                <Play className="w-3 h-3 shrink-0" style={{ color: accent.primary }} />
                <span>{step.actionLabel}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {!isFirst ? (
              <button
                type="button"
                onClick={() => onChangeStep(safeIndex - 1)}
                className={`rounded-lg bg-[#171A21] hover:bg-[#1F242E] border border-white/10 font-mono text-neutral-200 hover:text-white transition inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49EACB] ${
                  isMobile ? 'min-h-[34px] px-2.5 py-1.5 text-[11px]' : 'min-h-[40px] px-3.5 py-2 text-xs'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onClose(true)}
                className={`rounded-lg font-mono text-neutral-400 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49EACB] ${
                  isMobile ? 'min-h-[34px] px-2 py-1.5 text-[11px]' : 'min-h-[40px] px-3 py-2 text-xs'
                }`}
              >
                Skip
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isLast) onClose(true);
                else onChangeStep(safeIndex + 1);
              }}
              style={{
                backgroundImage: accent.gradientCss,
                color: accent.textOnAccent
              }}
              className={`rounded-lg font-mono font-bold hover:brightness-110 transition inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                isMobile ? 'min-h-[34px] px-3 py-1.5 text-[11px]' : 'min-h-[40px] px-4 py-2 text-xs'
              }`}
            >
              {isLast ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isMobile ? 'Done' : 'Finish Tutorial'}</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
