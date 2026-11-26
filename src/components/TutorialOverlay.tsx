import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Play, Sparkles, X } from 'lucide-react';
import type { GradeAccent } from '../data/rubricSpec.ts';
import {
  TUTORIAL_STEPS,
  computeMobileScrollTargetY,
  computeSpotlightCardPosition,
  getMobileBottomClearancePx,
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
  mysteryCounterText?: string;
  isEasterEggFound?: boolean;
  onChangeStep: (nextIndex: number) => void;
  onExecuteAction: (actionId: TutorialActionId) => void;
  onClose: (markSeen?: boolean) => void;
}

function readEffectiveViewport(): { width: number; height: number; offsetTop: number } {
  if (typeof window === 'undefined') {
    return { width: 1440, height: 900, offsetTop: 0 };
  }
  const vv = window.visualViewport;
  const width = Math.round(
    vv && vv.width > 0 ? Math.min(window.innerWidth, vv.width) : window.innerWidth
  );
  const height = Math.round(
    vv && vv.height > 0 ? Math.min(window.innerHeight, vv.height) : window.innerHeight
  );
  const offsetTop = vv && vv.offsetTop > 0 ? Math.round(vv.offsetTop) : 0;
  return { width, height, offsetTop };
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

function measureTargetUnionRect(targetId: string, viewportWidth: number): SpotlightRect | null {
  const el = findVisibleTarget(targetId);
  if (!el) return null;

  let minLeft = el.getBoundingClientRect().left;
  let minTop = el.getBoundingClientRect().top;
  let maxRight = el.getBoundingClientRect().right;
  let maxBottom = el.getBoundingClientRect().bottom;

  if (targetId === 'mystery-beacon' && typeof document !== 'undefined') {
    const extras = [
      document.querySelector<HTMLElement>('[data-testid="truth-dot-trigger"]'),
      document.querySelector<HTMLElement>('[data-testid="truth-mystery-counter"]')
    ];
    for (const extra of extras) {
      if (!extra) continue;
      const er = extra.getBoundingClientRect();
      if (er.width > 0 && er.height > 0) {
        minLeft = Math.min(minLeft, er.left);
        minTop = Math.min(minTop, er.top);
        maxRight = Math.max(maxRight, er.right);
        maxBottom = Math.max(maxBottom, er.bottom);
      }
    }
  }

  const pad = 10;
  const clampedLeft = Math.max(4, Math.round(minLeft - pad));
  const clampedRight = Math.min(Math.max(320, viewportWidth) - 4, Math.round(maxRight + pad));
  const clampedTop = Math.max(4, Math.round(minTop - pad));
  const clampedBottom = Math.round(maxBottom + pad);

  return {
    top: clampedTop,
    left: clampedLeft,
    width: Math.max(24, clampedRight - clampedLeft),
    height: Math.max(24, clampedBottom - clampedTop)
  };
}

export function TutorialOverlay({
  isOpen,
  stepIndex,
  steps,
  accent,
  mysteryCounterText = '0/6',
  isEasterEggFound = false,
  onChangeStep,
  onExecuteAction,
  onClose
}: TutorialOverlayProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [targetRect, setTargetRect] = useState<SpotlightRect | null>(null);
  const [viewport, setViewport] = useState(readEffectiveViewport);
  const isMobile = viewport.width < 768;
  const mobileBottomClearancePx = getMobileBottomClearancePx(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );
  const activeSteps = steps && steps.length > 0 ? steps : getTutorialStepsForViewport(viewport.width);
  const safeIndex = Math.max(0, Math.min(activeSteps.length - 1, stepIndex));
  const step: TutorialStep = activeSteps[safeIndex] || activeSteps[0] || TUTORIAL_STEPS[0];
  const easterEggStepIdx = activeSteps.findIndex((s) => Boolean(s.isEasterEggStep));
  const isFirst = safeIndex <= 0;
  const isLast = safeIndex >= activeSteps.length - 1;
  const [cardHeight, setCardHeight] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 175 : 360
  );

  const measureTarget = useCallback(() => {
    if (!isOpen) return;
    const nextVp = readEffectiveViewport();
    setViewport((prev) =>
      prev.width === nextVp.width &&
      prev.height === nextVp.height &&
      prev.offsetTop === nextVp.offsetTop
        ? prev
        : nextVp
    );

    const nextRect = measureTargetUnionRect(step.targetId, nextVp.width);
    if (!nextRect) {
      setTargetRect((prev) => (prev === null ? prev : null));
      return;
    }
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
      const el = findVisibleTarget(step.targetId);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vp = readEffectiveViewport();
      const docTop = window.scrollY + r.top;
      const maxScrollY = Math.max(
        0,
        document.documentElement.scrollHeight - vp.height
      );
      if (vp.width >= 768) {
        // When zoomed to 150%+, baskets stack below the stage even at >= 768px width; scroll offscreen targets cleanly into view
        const isOffscreen = r.bottom > vp.height - 24 || r.top < 16;
        if (!isOffscreen) return;
        const desiredTop = Math.max(
          0,
          Math.min(maxScrollY, Math.round(docTop - Math.max(24, (vp.height - r.height) / 2)))
        );
        if (Math.abs(window.scrollY - desiredTop) > 8) {
          window.scrollTo({ top: desiredTop, behavior: 'auto' });
        }
        return;
      }
      const targetScrollY = computeMobileScrollTargetY(
        step.targetId,
        docTop,
        r.height,
        vp.height,
        measuredCardH > 80 ? measuredCardH : cardHeight,
        maxScrollY,
        mobileBottomClearancePx
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
  }, [isOpen, stepIndex, step.targetId, measureTarget, mobileBottomClearancePx]);

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
    window.visualViewport?.addEventListener('resize', scheduleMeasure, { passive: true });
    window.visualViewport?.addEventListener('scroll', scheduleMeasure, { passive: true });
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
      window.visualViewport?.removeEventListener('resize', scheduleMeasure);
      window.visualViewport?.removeEventListener('scroll', scheduleMeasure);
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
    { width: viewport.width, height: viewport.height },
    { width: 380, height: cardHeight },
    step.preferredPlacement || 'bottom',
    mobileBottomClearancePx
  );

  const cardTop = isMobile ? coords.top + viewport.offsetTop : coords.top;
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
        data-testid="tutorial-coach-card"
        data-placement={coords.placement}
        onClick={(e) => e.stopPropagation()}
        style={{
          top: cardTop,
          left: coords.left,
          width: coords.width,
          borderColor: accent.border,
          boxShadow: `0 22px 56px rgba(0, 0, 0, 0.85), 0 0 32px ${accent.glow}`
        }}
        className={`fixed pointer-events-auto rounded-2xl bg-[#101216]/98 border text-white transition-[top,left,width,border-color,box-shadow] duration-200 ease-out overflow-y-auto ${
          isMobile ? 'p-3.5 max-h-[36vh]' : 'p-5 max-h-[calc(100vh-24px)]'
        }`}
      >
        {/* Top editorial step counter, subtle Easter Egg signal pill & dismiss */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`font-mono font-semibold tracking-wider uppercase tabular-nums whitespace-nowrap ${
                isMobile ? 'text-[10.5px]' : 'text-[11px]'
              }`}
              style={{ color: accent.primary }}
            >
              {isMobile
                ? `Guide · ${step.stepNumber} / ${activeSteps.length}`
                : `Step ${step.stepNumber} / ${activeSteps.length}`}
            </span>

            {step.isEasterEggStep ? (
              <span
                data-testid="tutorial-easter-egg-active-badge"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-mono text-[10px] font-semibold tracking-wider uppercase tabular-nums whitespace-nowrap"
                style={{
                  backgroundColor: accent.softBg,
                  borderColor: accent.border,
                  color: accent.primary
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                  style={{
                    backgroundColor: accent.primary,
                    boxShadow: `0 0 8px ${accent.primary}`
                  }}
                />
                <span>{isEasterEggFound ? 'Vault Unlocked' : `Signal · ${mysteryCounterText}`}</span>
              </span>
            ) : (
              easterEggStepIdx >= 0 && (
                <button
                  type="button"
                  data-testid="tutorial-easter-egg-hint-btn"
                  onClick={() => onChangeStep(easterEggStepIdx)}
                  title="Jump to the hidden Easter Egg clue"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.09] border border-white/12 font-mono text-[10px] font-medium text-neutral-300 hover:text-white transition whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49EACB]"
                >
                  <Sparkles
                    className="w-2.5 h-2.5 shrink-0"
                    style={{ color: accent.primary }}
                  />
                  <span>
                    {isMobile
                      ? `Secret · ${mysteryCounterText}`
                      : `Easter Egg · ${mysteryCounterText}`}
                  </span>
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => onClose(true)}
            aria-label="Close tutorial"
            className="shrink-0 w-8 h-8 rounded-lg bg-[#171A21] hover:bg-[#1F242D] border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49EACB]"
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
            const isMysteryTab = Boolean(s.isEasterEggStep);
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
                      : isMysteryTab
                      ? `${accent.primary}40`
                      : 'rgba(255, 255, 255, 0.12)',
                    boxShadow:
                      isMysteryTab && !isDone
                        ? `0 0 8px ${accent.glow}`
                        : undefined
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
