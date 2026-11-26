import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Play, Sparkles, X } from 'lucide-react';
import { DOT_DISCOVERY_TARGET_COUNT } from '../data/dotDiscoveryGame.ts';
import type { GradeAccent } from '../data/rubricSpec.ts';
import { setTutorialWaveHold } from './OrbitalNodes.tsx';
import {
  TUTORIAL_STEPS,
  buildSpotlightCutoutPath,
  computeMobileScrollTargetY,
  computeSpotlightCardPosition,
  getMobileBottomClearancePx,
  getTutorialStepsForViewport,
  type SpotlightRect,
  type TutorialActionId,
  type TutorialStep,
  type TutorialTargetId
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

  const baseRect = el.getBoundingClientRect();
  let minLeft = baseRect.left;
  let minTop = baseRect.top;
  let maxRight = baseRect.right;
  let maxBottom = baseRect.bottom;

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
        maxRight = Math.max(maxRight, er.right);
      }
    }

    // Optically center on "The Truth" cap-height (trimming unused descender space below baseline)
    const headingEl = el.querySelector('h1');
    const titleRect = headingEl ? headingEl.getBoundingClientRect() : baseRect;
    if (headingEl) {
      if (titleRect.width > 0 && titleRect.height > 0) {
        minLeft = Math.min(minLeft, titleRect.left);
        maxRight = Math.max(maxRight, titleRect.right);
      }
      const spans = headingEl.querySelectorAll<HTMLElement>('span');
      for (const sp of spans) {
        const sr = sp.getBoundingClientRect();
        if (sr.width > 0 && sr.height > 0) {
          minLeft = Math.min(minLeft, sr.left);
          maxRight = Math.max(maxRight, sr.right);
        }
      }
    }
    const visualTop = titleRect.top + titleRect.height * 0.04;
    const visualBottom = titleRect.bottom - titleRect.height * 0.1;
    const visualMidY = (visualTop + visualBottom) / 2;
    const halfGlyphH = (visualBottom - visualTop) / 2;

    let minAllowedTop = 4;
    const prevSib = el.previousElementSibling as HTMLElement | null;
    if (prevSib) {
      const prevRect = prevSib.getBoundingClientRect();
      if (prevRect.height > 0 && prevRect.bottom <= titleRect.top + 4) {
        minAllowedTop = Math.max(4, prevRect.bottom + 5);
      }
    }

    let maxAllowedBottom = Infinity;
    const nextSib = el.nextElementSibling as HTMLElement | null;
    if (nextSib) {
      const sibRect = nextSib.getBoundingClientRect();
      if (sibRect.height > 0 && sibRect.top >= titleRect.bottom - 4) {
        maxAllowedBottom = sibRect.top - 5;
      }
    }

    const desiredHalfH = halfGlyphH + 7;
    const maxSymHalfH = Math.min(
      desiredHalfH,
      Math.max(halfGlyphH + 2, visualMidY - minAllowedTop),
      Math.max(halfGlyphH + 2, maxAllowedBottom - visualMidY)
    );

    const symTop = Math.max(4, Math.round(visualMidY - maxSymHalfH));
    const symBottom = Math.min(
      Math.round(maxAllowedBottom),
      Math.round(visualMidY + maxSymHalfH)
    );

    const padLeft = titleRect.height > 40 ? 18 : 14;
    const padRight = titleRect.height > 40 ? 22 : 16;
    const clampedLeft = Math.max(4, Math.round(minLeft - padLeft));
    const clampedRight = Math.min(Math.max(320, viewportWidth) - 4, Math.round(maxRight + padRight));

    return {
      top: symTop,
      left: clampedLeft,
      width: Math.max(24, clampedRight - clampedLeft),
      height: Math.max(24, symBottom - symTop)
    };
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

type TutorialFadePhase = 'hidden' | 'visible' | 'fading-out';

const FADE_OUT_DURATION_MS = 145;

export function TutorialOverlay({
  isOpen,
  stepIndex,
  steps,
  accent,
  mysteryCounterText = `0/${DOT_DISCOVERY_TARGET_COUNT}`,
  isEasterEggFound = false,
  onChangeStep,
  onExecuteAction,
  onClose
}: TutorialOverlayProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const cutoutDimRef = useRef<HTMLDivElement | null>(null);
  const focusRingRef = useRef<HTMLDivElement | null>(null);
  const focusGlowRef = useRef<HTMLDivElement | null>(null);

  const [viewport, setViewport] = useState(readEffectiveViewport);
  const isMobile = viewport.width < 768;
  const mobileBottomClearancePx = getMobileBottomClearancePx(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );
  const activeSteps = steps && steps.length > 0 ? steps : getTutorialStepsForViewport(viewport.width);
  const safeTargetIndex = Math.max(0, Math.min(activeSteps.length - 1, stepIndex));

  const [displayedIndex, setDisplayedIndex] = useState(safeTargetIndex);
  const [fadePhase, setFadePhase] = useState<TutorialFadePhase>('hidden');
  const [displayedRect, setDisplayedRect] = useState<SpotlightRect | null>(null);

  const latestTargetIndexRef = useRef(safeTargetIndex);
  latestTargetIndexRef.current = safeTargetIndex;

  const fadeTimerRef = useRef<number | null>(null);
  const enterTimerRef = useRef<number | null>(null);
  const settleTimersRef = useRef<number[]>([]);
  const wasOpenRef = useRef(false);

  const clampedDisplayedIndex = Math.max(0, Math.min(activeSteps.length - 1, displayedIndex));
  const step: TutorialStep =
    activeSteps[clampedDisplayedIndex] || activeSteps[0] || TUTORIAL_STEPS[0];
  const easterEggStepIdx = activeSteps.findIndex((s) => Boolean(s.isEasterEggStep));
  const isFirst = safeTargetIndex <= 0;
  const isLast = safeTargetIndex >= activeSteps.length - 1;

  const [cardHeight, setCardHeight] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 175 : 360
  );

  const cancelPendingTimers = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    if (enterTimerRef.current !== null) {
      window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    for (const id of settleTimersRef.current) {
      window.clearTimeout(id);
    }
    settleTimersRef.current = [];
  }, []);

  const triggerFadeInNextFrame = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (enterTimerRef.current !== null) {
      window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    // Synchronously commit before-change style (transition: none, opacity: 0, new translate3d)
    if (cutoutDimRef.current) void window.getComputedStyle(cutoutDimRef.current).opacity;
    if (focusRingRef.current) void window.getComputedStyle(focusRingRef.current).opacity;
    if (focusGlowRef.current) void window.getComputedStyle(focusGlowRef.current).opacity;
    if (cardRef.current) void window.getComputedStyle(cardRef.current).opacity;

    enterTimerRef.current = window.setTimeout(() => {
      enterTimerRef.current = null;
      setFadePhase('visible');
    }, 24);
  }, []);

  const snapMeasureDisplayedTarget = useCallback(
    (targetId: TutorialTargetId, currentCardH: number) => {
      if (typeof window === 'undefined') return;
      const vp = readEffectiveViewport();
      setViewport((prev) =>
        prev.width === vp.width && prev.height === vp.height && prev.offsetTop === vp.offsetTop
          ? prev
          : vp
      );

      const el = findVisibleTarget(targetId);
      if (el) {
        const r = el.getBoundingClientRect();
        const docTop = window.scrollY + r.top;
        const maxScrollY = Math.max(0, document.documentElement.scrollHeight - vp.height);
        if (vp.width >= 768) {
          const isOffscreen = r.bottom > vp.height - 24 || r.top < 16;
          if (isOffscreen) {
            const desiredTop = Math.max(
              0,
              Math.min(maxScrollY, Math.round(docTop - Math.max(24, (vp.height - r.height) / 2)))
            );
            if (Math.abs(window.scrollY - desiredTop) > 8) {
              window.scrollTo({ top: desiredTop, behavior: 'auto' });
            }
          }
        } else {
          const targetScrollY = computeMobileScrollTargetY(
            targetId,
            docTop,
            r.height,
            vp.height,
            currentCardH > 80 ? currentCardH : cardHeight,
            maxScrollY,
            mobileBottomClearancePx
          );
          if (Math.abs(window.scrollY - targetScrollY) > 6) {
            window.scrollTo({ top: targetScrollY, behavior: 'auto' });
          }
        }
      }

      const nextRect = measureTargetUnionRect(targetId, vp.width);
      setDisplayedRect(nextRect);
    },
    [cardHeight, mobileBottomClearancePx]
  );

  const latestSnapCtxRef = useRef({
    activeSteps,
    cardHeight,
    snapMeasureDisplayedTarget
  });
  latestSnapCtxRef.current = {
    activeSteps,
    cardHeight,
    snapMeasureDisplayedTarget
  };

  // Handle opening & closing lifecycle
  useLayoutEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      cancelPendingTimers();
      setFadePhase('hidden');
      return;
    }

    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      cancelPendingTimers();
      setDisplayedIndex(safeTargetIndex);
      setFadePhase('hidden');
      const initialStep =
        activeSteps[safeTargetIndex] || activeSteps[0] || TUTORIAL_STEPS[0];
      const measuredH = cardRef.current
        ? Math.round(cardRef.current.getBoundingClientRect().height)
        : cardHeight;
      if (measuredH > 80) {
        setCardHeight((prev) => (Math.abs(prev - measuredH) > 2 ? measuredH : prev));
      }
      snapMeasureDisplayedTarget(initialStep.targetId, measuredH);
      triggerFadeInNextFrame();
    }
  }, [
    isOpen,
    safeTargetIndex,
    activeSteps,
    cardHeight,
    cancelPendingTimers,
    snapMeasureDisplayedTarget,
    triggerFadeInNextFrame
  ]);

  // When user clicks Next / Back / Step Tab: fade out in place -> snap while hidden -> fade in to glow
  useEffect(() => {
    if (!isOpen || !wasOpenRef.current) return undefined;

    if (safeTargetIndex === displayedIndex) {
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
        setFadePhase('visible');
      }
      return undefined;
    }

    if (enterTimerRef.current !== null) {
      window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }

    setFadePhase('fading-out');

    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
    }

    fadeTimerRef.current = window.setTimeout(() => {
      fadeTimerRef.current = null;
      const nextIdx = latestTargetIndexRef.current;
      const {
        activeSteps: curSteps,
        cardHeight: curCardH,
        snapMeasureDisplayedTarget: snapMeasure
      } = latestSnapCtxRef.current;
      const nextStep = curSteps[nextIdx] || curSteps[0] || TUTORIAL_STEPS[0];
      const measuredH = cardRef.current
        ? Math.round(cardRef.current.getBoundingClientRect().height)
        : curCardH;
      setFadePhase('hidden');
      setDisplayedIndex(nextIdx);
      snapMeasure(nextStep.targetId, measuredH);
    }, FADE_OUT_DURATION_MS);

    return undefined;
  }, [isOpen, safeTargetIndex, displayedIndex]);

  // Whenever displayedIndex updates while open, snap target coordinates invisibly
  useLayoutEffect(() => {
    if (!isOpen || !wasOpenRef.current) return;
    const measuredH = cardRef.current
      ? Math.round(cardRef.current.getBoundingClientRect().height)
      : cardHeight;
    if (measuredH > 80) {
      setCardHeight((prev) => (Math.abs(prev - measuredH) > 2 ? measuredH : prev));
    }
    snapMeasureDisplayedTarget(step.targetId, measuredH);
  }, [isOpen, clampedDisplayedIndex, step.targetId]);

  // Guarantee hidden snap frames always bloom into visible glow on the next frame
  useLayoutEffect(() => {
    if (!isOpen || !wasOpenRef.current) return;
    if (fadePhase === 'hidden') {
      triggerFadeInNextFrame();
    }
  }, [isOpen, clampedDisplayedIndex, fadePhase, triggerFadeInNextFrame]);

  // Keep static alignment accurate on window resize / manual scroll without animating box coordinates
  useEffect(() => {
    if (!isOpen) return undefined;
    let rafId = 0;
    const onViewportChange = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const vp = readEffectiveViewport();
        setViewport((prev) =>
          prev.width === vp.width && prev.height === vp.height && prev.offsetTop === vp.offsetTop
            ? prev
            : vp
        );
        const nextRect = measureTargetUnionRect(step.targetId, vp.width);
        setDisplayedRect((prev) => {
          if (!nextRect) return null;
          if (
            prev &&
            Math.abs(prev.top - nextRect.top) <= 2 &&
            Math.abs(prev.left - nextRect.left) <= 2 &&
            Math.abs(prev.width - nextRect.width) <= 2 &&
            Math.abs(prev.height - nextRect.height) <= 2
          ) {
            return prev;
          }
          return nextRect;
        });
      });
    };

    window.addEventListener('resize', onViewportChange, { passive: true });
    window.addEventListener('scroll', onViewportChange, { capture: true, passive: true });
    window.visualViewport?.addEventListener('resize', onViewportChange, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && cardRef.current) {
      ro = new ResizeObserver(() => {
        if (cardRef.current) {
          const h = Math.round(cardRef.current.getBoundingClientRect().height);
          if (h > 80) {
            setCardHeight((prev) => (Math.abs(prev - h) > 2 ? h : prev));
          }
        }
      });
      ro.observe(cardRef.current);
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
      window.visualViewport?.removeEventListener('resize', onViewportChange);
      if (ro) ro.disconnect();
    };
  }, [isOpen, step.targetId]);

  // Re-check target cleanly if an in-step demo action shifts page layout (fade out -> snap -> fade in, never drag)
  const schedulePostActionSettle = useCallback(() => {
    if (typeof window === 'undefined') return;
    for (const id of settleTimersRef.current) {
      window.clearTimeout(id);
    }
    settleTimersRef.current = [];

    const checkAt = (delayMs: number) => {
      const tid = window.setTimeout(() => {
        const vp = readEffectiveViewport();
        const nextRect = measureTargetUnionRect(step.targetId, vp.width);
        if (!nextRect) return;
        setDisplayedRect((prev) => {
          if (
            prev &&
            Math.abs(prev.top - nextRect.top) <= 6 &&
            Math.abs(prev.left - nextRect.left) <= 6 &&
            Math.abs(prev.width - nextRect.width) <= 6 &&
            Math.abs(prev.height - nextRect.height) <= 6
          ) {
            return prev;
          }
          setFadePhase('hidden');
          triggerFadeInNextFrame();
          return nextRect;
        });
      }, delayMs);
      settleTimersRef.current.push(tid);
    };

    checkAt(120);
    checkAt(740);
  }, [step.targetId, triggerFadeInNextFrame]);

  // Hold CPU SVG wave path mutations during the opacity fade-out & glow bloom window for 60/120fps compositor smoothness
  useEffect(() => {
    if (!isOpen) {
      setTutorialWaveHold(false);
      return undefined;
    }
    if (fadePhase !== 'visible') {
      setTutorialWaveHold(true);
      return undefined;
    }
    const resumeId = window.setTimeout(() => {
      setTutorialWaveHold(false);
    }, 390);
    return () => {
      window.clearTimeout(resumeId);
    };
  }, [isOpen, fadePhase]);

  useEffect(() => {
    return () => {
      setTutorialWaveHold(false);
      cancelPendingTimers();
    };
  }, [cancelPendingTimers]);

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
        else onChangeStep(safeTargetIndex + 1);
      } else if (!isTyping && e.key === 'ArrowLeft' && !isFirst) {
        e.preventDefault();
        onChangeStep(safeTargetIndex - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isFirst, isLast, safeTargetIndex, onChangeStep, onClose]);

  if (!isOpen) return null;

  let cardAnchorRect = displayedRect;
  if (step.targetId === 'mystery-beacon' && displayedRect && typeof document !== 'undefined') {
    const beaconEl = findVisibleTarget('mystery-beacon');
    const nextSib = beaconEl?.nextElementSibling as HTMLElement | null;
    const sibRect = nextSib?.getBoundingClientRect();
    const lockupEl = beaconEl?.parentElement as HTMLElement | null;
    const lockupRect = lockupEl?.getBoundingClientRect();
    const candidateBottom = Math.max(
      displayedRect.top + displayedRect.height,
      sibRect && sibRect.height > 0 ? Math.round(sibRect.bottom) : 0,
      lockupRect && lockupRect.height > 0 ? Math.round(lockupRect.bottom) : 0
    );
    const headingEl = beaconEl?.querySelector('h1');
    const centerAxisX = headingEl
      ? Math.round((headingEl.getBoundingClientRect().left + headingEl.getBoundingClientRect().right) / 2)
      : Math.round(viewport.width / 2);
    cardAnchorRect = {
      top: displayedRect.top,
      left: Math.round(centerAxisX - displayedRect.width / 2),
      width: displayedRect.width,
      height: Math.max(displayedRect.height, candidateBottom - displayedRect.top)
    };
  }

  const coords = computeSpotlightCardPosition(
    cardAnchorRect,
    { width: viewport.width, height: viewport.height },
    { width: 380, height: cardHeight },
    step.preferredPlacement || 'bottom',
    mobileBottomClearancePx
  );

  const cardTop = isMobile ? coords.top + viewport.offsetTop : coords.top;
  const isVisible = fadePhase === 'visible';
  const isInstantSnap = fadePhase === 'hidden';

  const elementOpacityTransition = isInstantSnap
    ? 'none'
    : fadePhase === 'fading-out'
    ? `opacity ${FADE_OUT_DURATION_MS}ms ease-out, transform ${FADE_OUT_DURATION_MS}ms ease-out`
    : 'opacity 230ms cubic-bezier(0.22, 1, 0.36, 1), transform 230ms cubic-bezier(0.22, 1, 0.36, 1)';

  const glowBloomTransition = isInstantSnap
    ? 'none'
    : fadePhase === 'fading-out'
    ? `opacity ${FADE_OUT_DURATION_MS}ms ease-out`
    : 'opacity 340ms cubic-bezier(0.16, 1, 0.3, 1) 35ms';

  const cutoutDimTransition = isInstantSnap
    ? 'none'
    : fadePhase === 'fading-out'
    ? `opacity ${FADE_OUT_DURATION_MS}ms ease-out`
    : 'opacity 230ms cubic-bezier(0.22, 1, 0.36, 1)';

  return (
    <div
      className="fixed inset-0 z-[120] pointer-events-none"
      role="dialog"
      aria-modal="false"
      aria-label={`Interactive Tutorial — ${step.title}`}
      data-testid="tutorial-overlay"
      data-fade-phase={fadePhase}
    >
      {/* Steady spotlight backdrop (rest of screen stays completely constant — never fades in/out) */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto cursor-pointer"
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        preserveAspectRatio="none"
        onClick={() => onClose(true)}
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          fill="rgba(6, 7, 9, 0.58)"
          d={buildSpotlightCutoutPath(viewport.width, viewport.height, displayedRect, 18)}
        />
      </svg>

      {/* Target-only cutout softener + stationary highlighted border & luminous glow (only tutorial elements fade) */}
      {displayedRect && (
        <>
          <div
            ref={cutoutDimRef}
            data-testid="tutorial-cutout-dim"
            aria-hidden="true"
            className="fixed top-0 left-0 pointer-events-none rounded-[18px] will-change-[opacity]"
            style={{
              transform: `translate3d(${displayedRect.left}px, ${displayedRect.top}px, 0)`,
              width: displayedRect.width,
              height: displayedRect.height,
              backgroundColor: 'rgba(6, 7, 9, 0.58)',
              opacity: isVisible ? 0 : 1,
              transition: cutoutDimTransition
            }}
          />

          <div
            ref={focusRingRef}
            data-testid="tutorial-focus-ring"
            aria-hidden="true"
            className="fixed top-0 left-0 pointer-events-none rounded-[18px] will-change-[opacity,transform]"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: `translate3d(${displayedRect.left}px, ${displayedRect.top}px, 0) scale(${
                isVisible ? 1 : 0.988
              })`,
              width: displayedRect.width,
              height: displayedRect.height,
              border: `1.5px solid ${accent.primary}`,
              transition: elementOpacityTransition
            }}
          >
            {/* Dedicated GPU-composited glow halo layer (animates opacity only, zero box-shadow repaint) */}
            <div
              ref={focusGlowRef}
              data-testid="tutorial-focus-glow"
              className="absolute -inset-[2px] rounded-[20px] pointer-events-none will-change-[opacity]"
              style={{
                opacity: isVisible ? 1 : 0,
                boxShadow: `0 0 24px ${accent.primary}66, 0 0 48px ${accent.glow}, inset 0 0 16px ${accent.primary}29`,
                transition: glowBloomTransition
              }}
            />
          </div>
        </>
      )}

      {/* Stationary Tutorial Coach Card (fades out & fades in at target slot — never drags across screen) */}
      <div
        ref={cardRef}
        data-testid="tutorial-coach-card"
        data-placement={coords.placement}
        onClick={(e) => e.stopPropagation()}
        style={{
          top: 0,
          left: 0,
          width: coords.width,
          opacity: isVisible ? 1 : 0,
          transform: `translate3d(${coords.left}px, ${
            isVisible ? cardTop : cardTop + 6
          }px, 0) scale(${isVisible ? 1 : 0.988})`,
          willChange: 'opacity, transform',
          transition: elementOpacityTransition,
          borderColor: accent.border,
          boxShadow: `0 22px 52px rgba(0, 0, 0, 0.86), 0 0 28px ${accent.glow}`
        }}
        className={`fixed pointer-events-auto rounded-2xl bg-[#101216]/[0.98] border text-white overflow-y-auto ${
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
                  className="w-1.5 h-1.5 rounded-full shrink-0"
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
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.09] border border-white/12 font-mono text-[10px] font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49EACB]"
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
            className="shrink-0 w-8 h-8 rounded-lg bg-[#171A21] hover:bg-[#1F242D] border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49EACB]"
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
            const isCurrent = idx === clampedDisplayedIndex;
            const isDone = idx < clampedDisplayedIndex;
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
                onClick={() => {
                  onExecuteAction(step.actionId!);
                  schedulePostActionSettle();
                }}
                className={`rounded-lg bg-[#171A21] hover:bg-[#1F242E] border border-white/15 font-mono font-semibold text-white transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49EACB] ${
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
                onClick={() => onChangeStep(safeTargetIndex - 1)}
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
                else onChangeStep(safeTargetIndex + 1);
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
