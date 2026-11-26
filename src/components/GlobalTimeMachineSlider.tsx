import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState
} from 'react';
import { type GradeAccent } from '../data/rubricSpec.ts';
import {
  GLOBAL_TIMELINE_STOPS,
  type GlobalTimelineYear,
  getGlobalTimelineStopIndex
} from '../data/globalTimeMachine.ts';

interface GlobalTimeMachineSliderProps {
  value: GlobalTimelineYear;
  onChange: (nextYear: GlobalTimelineYear) => void;
  accent: GradeAccent;
  disabled?: boolean;
}

const HOLD_POPUP_DELAY_MS = 220;

export function GlobalTimeMachineSlider({
  value,
  onChange,
  accent,
  disabled = false
}: GlobalTimeMachineSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const pointerStartXRef = useRef<number | null>(null);
  const didDragMoveRef = useRef(false);
  const holdTimerRef = useRef<number | null>(null);

  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const [isHoldPopupOpen, setIsHoldPopupOpen] = useState(false);

  const stopCount = GLOBAL_TIMELINE_STOPS.length; // 8 stops: 1913, 1971, 2000, 2008, 2016, 2020, 2024, Present
  const maxIndex = stopCount - 1;
  const committedIndex = getGlobalTimelineStopIndex(value);

  const activeVisualRatio = dragRatio !== null ? dragRatio : committedIndex;
  const nearestStopIndex = Math.max(0, Math.min(maxIndex, Math.round(activeVisualRatio)));
  const activeThumbStop = GLOBAL_TIMELINE_STOPS[nearestStopIndex];
  const isHistoricalActive = activeThumbStop.id !== 'PRESENT';
  const isPresentThumb = activeThumbStop.id === 'PRESENT';

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  useEffect(() => {
    const dismissOnWindowBlur = () => {
      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      setIsHoldPopupOpen(false);
      setDragRatio(null);
    };
    window.addEventListener('blur', dismissOnWindowBlur);
    return () => {
      dismissOnWindowBlur();
      window.removeEventListener('blur', dismissOnWindowBlur);
    };
  }, []);

  const startHoldTimer = () => {
    clearHoldTimer();
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
      setIsHoldPopupOpen(true);
    }, HOLD_POPUP_DELAY_MS);
  };

  const computeRatioFromClientX = (clientX: number): number => {
    const el = trackRef.current;
    if (!el) return committedIndex;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return committedIndex;
    const slotWidth = rect.width / stopCount;
    const firstCenter = rect.left + slotWidth * 0.5;
    const lastCenter = rect.right - slotWidth * 0.5;
    const span = Math.max(1, lastCenter - firstCenter);
    const normalized = (clientX - firstCenter) / span;
    return Math.max(0, Math.min(maxIndex, normalized * maxIndex));
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    const targetEl = e.target as HTMLElement | null;
    const startedOnThumb = Boolean(targetEl?.closest('[data-testid="time-machine-thumb-btn"]'));

    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointerStartXRef.current = e.clientX;
    didDragMoveRef.current = false;

    const initialRatio = startedOnThumb ? committedIndex : computeRatioFromClientX(e.clientX);
    setDragRatio(initialRatio);

    if (startedOnThumb) {
      startHoldTimer();
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRatio === null || disabled) return;
    if (pointerStartXRef.current !== null && Math.abs(e.clientX - pointerStartXRef.current) > 4) {
      didDragMoveRef.current = true;
    }
    if (!didDragMoveRef.current && isHoldPopupOpen) {
      return;
    }
    const nextRatio = computeRatioFromClientX(e.clientX);
    setDragRatio(nextRatio);
    const snappedIdx = Math.max(0, Math.min(maxIndex, Math.round(nextRatio)));
    const snappedYear = GLOBAL_TIMELINE_STOPS[snappedIdx].id;
    if (snappedYear !== value) {
      onChange(snappedYear);
    }
  };

  const finishPointerInteraction = (e: ReactPointerEvent<HTMLDivElement>) => {
    clearHoldTimer();
    setIsHoldPopupOpen(false);
    if (dragRatio === null) return;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const finalRatio = didDragMoveRef.current
      ? computeRatioFromClientX(e.clientX)
      : dragRatio;
    const snappedIdx = Math.max(0, Math.min(maxIndex, Math.round(finalRatio)));
    const targetYear = GLOBAL_TIMELINE_STOPS[snappedIdx].id;
    setDragRatio(null);
    pointerStartXRef.current = null;
    didDragMoveRef.current = false;
    if (targetYear !== value) {
      onChange(targetYear);
    }
  };

  const cancelPointerInteraction = () => {
    clearHoldTimer();
    setIsHoldPopupOpen(false);
    setDragRatio(null);
    pointerStartXRef.current = null;
    didDragMoveRef.current = false;
  };

  const handleSliderKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!isHoldPopupOpen) {
        setIsHoldPopupOpen(true);
      }
      return;
    }
    let nextIdx = committedIndex;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      nextIdx = Math.max(0, committedIndex - 1);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      nextIdx = Math.min(maxIndex, committedIndex + 1);
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = maxIndex;
    } else if (e.key === 'Escape') {
      setIsHoldPopupOpen(false);
      return;
    } else {
      return;
    }
    e.preventDefault();
    const targetYear = GLOBAL_TIMELINE_STOPS[nextIdx].id;
    if (targetYear !== value) {
      onChange(targetYear);
    }
  };

  const handleSliderKeyUp = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      setIsHoldPopupOpen(false);
    }
  };

  const slotPct = 100 / stopCount; // 12.5% for 8 stops
  const firstSlotCenterPct = slotPct * 0.5; // 6.25%
  const fullSpanPct = slotPct * maxIndex; // 87.5%

  // 7 discrete floating connector segments strictly in the open air between the 8 year labels
  const connectorSegments = Array.from({ length: maxIndex }, (_, segIdx) => {
    const startCenterPct = (segIdx + 0.5) * slotPct;
    const isIntoPresent = segIdx === maxIndex - 1;
    return {
      left: `calc(${startCenterPct.toFixed(4)}% + var(--tm-pad-num))`,
      width: isIntoPresent
        ? `calc(${slotPct.toFixed(4)}% - var(--tm-pad-num) - var(--tm-pad-end))`
        : `calc(${slotPct.toFixed(4)}% - (var(--tm-pad-num) * 2))`
    };
  });

  const thumbLayerShiftPct =
    maxIndex > 0 ? (activeVisualRatio / maxIndex) * fullSpanPct : fullSpanPct;
  const rawCaretLeftPct = firstSlotCenterPct + thumbLayerShiftPct;
  const popupCaretLeftPct = Math.max(7.5, Math.min(92.5, rawCaretLeftPct));

  return (
    <div
      data-testid="global-time-machine-slider"
      data-active-year={value}
      onContextMenu={(e) => {
        e.preventDefault();
      }}
      className={`relative pointer-events-auto w-full max-w-[496px] xl:max-w-[528px] sm:w-[496px] md:w-[342px] lg:w-[468px] xl:w-[528px] select-none [--tm-pad-num:12px] [--tm-pad-end:17.5px] sm:[--tm-pad-num:16px] sm:[--tm-pad-end:24px] md:[--tm-pad-num:13.5px] md:[--tm-pad-end:20.5px] lg:[--tm-pad-num:16.5px] lg:[--tm-pad-end:24.5px] xl:[--tm-pad-num:17.5px] xl:[--tm-pad-end:25.5px] ${
        disabled ? 'opacity-55 pointer-events-none' : ''
      }`}
    >
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerInteraction}
        onPointerCancel={cancelPointerInteraction}
        className="relative h-7 w-full flex items-center touch-none cursor-pointer bg-transparent"
      >
        {/* 7 Floating Connector Line Segments between the 8 Year Stops */}
        {connectorSegments.map((seg, segIdx) => {
          const segFill = Math.max(0, Math.min(1, activeVisualRatio - segIdx));
          const segStyle: CSSProperties = {
            left: seg.left,
            width: seg.width
          };
          return (
            <div
              key={segIdx}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-[1.5px] rounded-full bg-white/[0.13] overflow-hidden z-[2]"
              style={segStyle}
            >
              <div
                className="w-full h-full origin-left rounded-full"
                style={{
                  transform: `scaleX(${segFill.toFixed(4)})`,
                  backgroundColor: accent.primary,
                  opacity: isHistoricalActive ? 0.85 : 0.5,
                  transition:
                    dragRatio !== null
                      ? 'none'
                      : 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), background-color 200ms ease, opacity 180ms ease'
                }}
              />
            </div>
          );
        })}

        {/* 8 Floating Year Stops: 1913, 1971, 2000, 2008, 2016, 2020, 2024, Present */}
        <div className="relative z-[5] grid grid-cols-8 w-full h-full items-center">
          {GLOBAL_TIMELINE_STOPS.map((stop, idx) => {
            const isCoveredByThumb = idx === nearestStopIndex;
            const isReached = idx <= nearestStopIndex;
            return (
              <button
                key={stop.id}
                type="button"
                tabIndex={-1}
                data-testid={`time-machine-stop-${stop.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled && stop.id !== value) {
                    onChange(stop.id);
                  }
                }}
                title={`Switch to ${stop.buttonLabel} (${stop.epochTitle})`}
                className={`h-full w-full flex items-center justify-center font-mono text-[8.5px] sm:text-[10.5px] md:text-[9.5px] lg:text-[10.5px] leading-none tracking-tight tabular-nums whitespace-nowrap bg-transparent transition-opacity duration-150 focus:outline-none cursor-pointer ${
                  isCoveredByThumb
                    ? 'opacity-0 pointer-events-none'
                    : isReached
                    ? 'text-neutral-300 hover:text-white'
                    : 'text-neutral-500 hover:text-neutral-200'
                }`}
              >
                <span className="block leading-none">{stop.buttonLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Draggable / Click-and-Hold Year Slider Pill (only encloses the selected year) */}
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center"
          style={{
            transform: `translate3d(${thumbLayerShiftPct.toFixed(3)}%, 0, 0)`,
            transition:
              dragRatio !== null
                ? 'none'
                : 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <button
            type="button"
            role="slider"
            data-testid="time-machine-thumb-btn"
            aria-label="Thermodynamic Time Machine Year"
            aria-valuemin={0}
            aria-valuemax={maxIndex}
            aria-valuenow={committedIndex}
            aria-valuetext={`${activeThumbStop.buttonLabel} — ${activeThumbStop.epochTitle}: ${activeThumbStop.frontierSummary}`}
            aria-expanded={isHoldPopupOpen}
            onKeyDown={handleSliderKeyDown}
            onKeyUp={handleSliderKeyUp}
            onBlur={() => setIsHoldPopupOpen(false)}
            title={`Click or drag to scrub years · Click & hold to inspect ${activeThumbStop.buttonLabel} epoch`}
            className={`pointer-events-auto absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-[23px] sm:h-[24px] lg:h-[25px] ${
              isPresentThumb
                ? 'w-[44px] sm:w-[58px] md:w-[48px] lg:w-[58px] xl:w-[64px]'
                : 'w-[34px] sm:w-[48px] md:w-[38px] lg:w-[48px] xl:w-[52px]'
            } rounded-full font-mono text-[8.5px] sm:text-[10.5px] md:text-[9.5px] lg:text-[10.5px] font-bold leading-none text-white flex items-center justify-center whitespace-nowrap tabular-nums cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-white/45`}
            style={{
              left: `${firstSlotCenterPct.toFixed(4)}%`,
              backgroundColor: '#14171E',
              backgroundImage: isHistoricalActive
                ? `linear-gradient(135deg, ${accent.softBg} 0%, rgba(20, 23, 30, 0.96) 100%)`
                : undefined,
              border: `1px solid ${
                isHoldPopupOpen || isHistoricalActive ? accent.primary : accent.border
              }`,
              boxShadow: isHoldPopupOpen
                ? `0 6px 18px rgba(0,0,0,0.65), 0 0 18px ${accent.glow}`
                : isHistoricalActive
                ? `0 4px 14px rgba(0,0,0,0.55), 0 0 12px ${accent.glow}`
                : '0 4px 12px rgba(0,0,0,0.48)',
              transform: isHoldPopupOpen ? 'scale(1.03)' : undefined,
              transition:
                'width 150ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease, transform 150ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <span className="block leading-none">{activeThumbStop.buttonLabel}</span>
          </button>
        </div>
      </div>

      {/* Click-and-Hold Historical Epoch Popup */}
      {isHoldPopupOpen && (
        <div
          role="tooltip"
          data-testid="time-machine-epoch-popup"
          data-epoch-id={activeThumbStop.id}
          className="pointer-events-none absolute left-0 right-0 top-[calc(100%+10px)] z-50 rounded-2xl bg-[#0E1117]/[0.97] backdrop-blur-md p-4 text-left shadow-[0_20px_48px_rgba(0,0,0,0.78)]"
          style={{
            border: `1px solid ${accent.border}`,
            boxShadow: `0 20px 48px rgba(0,0,0,0.78), 0 0 24px ${accent.glow}`
          }}
        >
          {/* Caret Notch Tracking the Held Slider Tab */}
          <div
            aria-hidden="true"
            className="absolute -top-[5.5px] -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#0E1117]"
            style={{
              left: `${popupCaretLeftPct.toFixed(2)}%`,
              borderTop: `1px solid ${accent.border}`,
              borderLeft: `1px solid ${accent.border}`,
              transition:
                dragRatio !== null
                  ? 'none'
                  : 'left 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease'
            }}
          />

          <div className="flex items-baseline justify-between gap-2 pb-2 border-b border-white/[0.07]">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span
                className="font-mono text-xs font-bold tabular-nums shrink-0"
                style={{ color: accent.primary }}
              >
                {activeThumbStop.buttonLabel}
              </span>
              <span aria-hidden="true" className="text-neutral-600 text-xs shrink-0">
                &middot;
              </span>
              <span className="text-xs font-semibold text-white truncate">
                {activeThumbStop.epochTitle}
              </span>
            </div>
            <span className="hidden sm:inline font-mono text-[9.5px] text-neutral-500 whitespace-nowrap shrink-0">
              Slide to inspect
            </span>
          </div>

          <div
            className="mt-2 font-mono text-[10.5px] leading-snug tabular-nums"
            style={{ color: accent.secondary }}
          >
            {activeThumbStop.frontierSummary}
          </div>

          <p className="mt-2 text-xs text-neutral-300 leading-relaxed">
            {activeThumbStop.significance}
          </p>

          <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between font-mono text-[9px] sm:text-[10px] tabular-nums">
            {GLOBAL_TIMELINE_STOPS.map((stop, idx) => {
              const isCurrent = idx === nearestStopIndex;
              return (
                <span
                  key={stop.id}
                  className={`whitespace-nowrap ${isCurrent ? 'font-bold text-white' : 'text-neutral-500'}`}
                  style={isCurrent ? { color: accent.primary } : undefined}
                >
                  {stop.buttonLabel}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
