import { memo, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { GradeAccent } from '../data/rubricSpec.ts';
import {
  TRUTH_HOME_QUOTES,
  parseQuoteAroundTitle,
  type ParsedHeroQuote,
  type SpokenWordToken,
  type TruthQuoteItem
} from '../data/truthQuotes.ts';

export interface HeroQuoteSnapshot {
  quoteIndex: number;
  item: TruthQuoteItem;
  parsed: ParsedHeroQuote;
  stepIndex: number;
  reducedMotion: boolean;
}

export interface HeroQuoteController {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => HeroQuoteSnapshot;
  nextQuote: () => void;
  prevQuote: () => void;
  setHovered: (hovered: boolean) => void;
}

const POST_QUOTE_HOLD_MS = 2350;

const PARSED_QUOTES_CACHE: ParsedHeroQuote[] = TRUTH_HOME_QUOTES.map((q) =>
  parseQuoteAroundTitle(q.quote)
);

function buildQuoteSnapshot(
  quoteIndex: number,
  rawStepIndex: number,
  reducedMotion: boolean
): HeroQuoteSnapshot {
  const safeIdx =
    ((quoteIndex % TRUTH_HOME_QUOTES.length) + TRUTH_HOME_QUOTES.length) %
    TRUTH_HOME_QUOTES.length;
  const item = TRUTH_HOME_QUOTES[safeIdx];
  const parsed = PARSED_QUOTES_CACHE[safeIdx];
  return {
    quoteIndex: safeIdx,
    item,
    parsed,
    stepIndex: reducedMotion ? parsed.totalSteps : rawStepIndex,
    reducedMotion
  };
}

export function useHeroTruthQuoteReader(active: boolean): HeroQuoteController {
  const listenersRef = useRef<Set<() => void>>(new Set());
  const hoveredRef = useRef<boolean>(false);
  const stateRef = useRef<{
    quoteIndex: number;
    stepIndex: number;
    reducedMotion: boolean;
    snapshot: HeroQuoteSnapshot;
  } | null>(null);

  if (stateRef.current === null) {
    const initialReduced =
      typeof window !== 'undefined'
        ? Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
        : false;
    stateRef.current = {
      quoteIndex: 0,
      stepIndex: 0,
      reducedMotion: initialReduced,
      snapshot: buildQuoteSnapshot(0, 0, initialReduced)
    };
  }

  const controller = useMemo<HeroQuoteController>(() => {
    const notify = () => {
      listenersRef.current.forEach((fn) => fn());
    };
    return {
      subscribe: (listener: () => void) => {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
      getSnapshot: () => stateRef.current!.snapshot,
      nextQuote: () => {
        const st = stateRef.current!;
        st.quoteIndex = (st.quoteIndex + 1) % TRUTH_HOME_QUOTES.length;
        st.stepIndex = 0;
        st.snapshot = buildQuoteSnapshot(st.quoteIndex, 0, st.reducedMotion);
        notify();
      },
      prevQuote: () => {
        const st = stateRef.current!;
        st.quoteIndex =
          (st.quoteIndex - 1 + TRUTH_HOME_QUOTES.length) % TRUTH_HOME_QUOTES.length;
        st.stepIndex = 0;
        st.snapshot = buildQuoteSnapshot(st.quoteIndex, 0, st.reducedMotion);
        notify();
      },
      setHovered: (hovered: boolean) => {
        hoveredRef.current = hovered;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => {
      const st = stateRef.current!;
      if (st.reducedMotion === e.matches) return;
      st.reducedMotion = e.matches;
      st.snapshot = buildQuoteSnapshot(st.quoteIndex, st.stepIndex, st.reducedMotion);
      listenersRef.current.forEach((fn) => fn());
    };
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    let stepTimer: number | null = null;
    let holdTimer: number | null = null;
    let pollId: number | null = null;
    let cancelled = false;

    const clearAll = () => {
      if (stepTimer !== null) window.clearTimeout(stepTimer);
      if (holdTimer !== null) window.clearTimeout(holdTimer);
      if (pollId !== null) window.clearInterval(pollId);
      stepTimer = null;
      holdTimer = null;
      pollId = null;
    };

    const scheduleNext = () => {
      if (cancelled) return;
      const st = stateRef.current!;
      const parsed = PARSED_QUOTES_CACHE[st.quoteIndex];
      if (st.reducedMotion) {
        if (st.stepIndex !== parsed.totalSteps) {
          st.stepIndex = parsed.totalSteps;
          st.snapshot = buildQuoteSnapshot(st.quoteIndex, st.stepIndex, st.reducedMotion);
          listenersRef.current.forEach((fn) => fn());
        }
        return;
      }

      if (st.stepIndex < parsed.totalSteps) {
        const waitMs = parsed.stepDurationsMs[st.stepIndex] ?? 220;
        stepTimer = window.setTimeout(() => {
          stepTimer = null;
          if (cancelled) return;
          st.stepIndex += 1;
          st.snapshot = buildQuoteSnapshot(st.quoteIndex, st.stepIndex, st.reducedMotion);
          listenersRef.current.forEach((fn) => fn());
          scheduleNext();
        }, waitMs);
        return;
      }

      holdTimer = window.setTimeout(() => {
        holdTimer = null;
        if (cancelled) return;
        const advanceQuote = () => {
          st.quoteIndex = (st.quoteIndex + 1) % TRUTH_HOME_QUOTES.length;
          st.stepIndex = 0;
          st.snapshot = buildQuoteSnapshot(st.quoteIndex, 0, st.reducedMotion);
          listenersRef.current.forEach((fn) => fn());
          scheduleNext();
        };

        if (!hoveredRef.current && (typeof document === 'undefined' || !document.hidden)) {
          advanceQuote();
        } else {
          pollId = window.setInterval(() => {
            if (!hoveredRef.current && (typeof document === 'undefined' || !document.hidden)) {
              if (pollId !== null) {
                window.clearInterval(pollId);
                pollId = null;
              }
              advanceQuote();
            }
          }, 650);
        }
      }, POST_QUOTE_HOLD_MS);
    };

    scheduleNext();
    return () => {
      cancelled = true;
      clearAll();
    };
  }, [active]);

  return controller;
}

function renderSpokenWordSpan(
  token: SpokenWordToken,
  wordStepIndex: number,
  currentStepIndex: number,
  accent: GradeAccent,
  key: number
) {
  const isCurrent = currentStepIndex === wordStepIndex;
  const isPast = currentStepIndex > wordStepIndex;

  return (
    <span
      key={key}
      data-spoken-state={isCurrent ? 'speaking' : isPast ? 'spoken' : 'upcoming'}
      className="inline-block transition-[color,opacity,transform,text-shadow] duration-150 ease-out"
      style={{
        color: isCurrent
          ? '#FFFFFF'
          : isPast
          ? token.isSecondaryTruth
            ? accent.primary
            : '#E5E7EB'
          : 'rgba(163, 163, 163, 0.38)',
        opacity: isCurrent ? 1 : isPast ? 0.96 : 0.52,
        transform: isCurrent ? 'translate3d(0, -1px, 0) scale(1.045)' : 'translate3d(0, 0, 0) scale(1)',
        textShadow: isCurrent
          ? `0 0 14px ${accent.primary}, 0 0 24px ${accent.glow}`
          : isPast && token.isSecondaryTruth
          ? `0 0 10px ${accent.glow}`
          : 'none',
        fontWeight: isCurrent || token.isSecondaryTruth ? 600 : 400
      }}
    >
      {token.text}
    </span>
  );
}

interface HeroQuoteLeadInBubbleProps {
  reader: HeroQuoteController;
  accent: GradeAccent;
  compact: boolean;
}

export const HeroQuoteLeadInBubble = memo(function HeroQuoteLeadInBubble({
  reader,
  accent,
  compact
}: HeroQuoteLeadInBubbleProps) {
  const { parsed, stepIndex, item } = useSyncExternalStore(
    reader.subscribe,
    reader.getSnapshot,
    reader.getSnapshot
  );
  const { nextQuote, setHovered } = reader;
  const hasBefore = parsed.beforeWords.length > 0;

  return (
    <div
      data-testid="hero-quote-leadin-slot"
      className={`w-full max-w-[92vw] md:max-w-[356px] lg:max-w-[500px] xl:max-w-[580px] ${
        compact ? 'h-[54px]' : 'h-[62px] sm:h-[64px]'
      } flex items-end justify-center px-2 pointer-events-none`}
    >
      {hasBefore ? (
        <button
          type="button"
          key={`lead-${item.id}`}
          data-testid="truth-quote-chat-bubble"
          data-quote-id={item.id}
          data-quote-part="before"
          onClick={nextQuote}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          title="Click to skip to the next quote"
          aria-label={`${item.quote} — ${item.speaker}. Click for next quote.`}
          className={`truth-quote-pop pointer-events-auto relative rounded-2xl rounded-bl-[6px] bg-[#121418]/[0.92] border border-white/10 hover:border-white/20 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#49EACB]/60 ${
            compact ? 'px-3.5 py-1.5' : 'px-4 py-2'
          } shadow-[0_10px_28px_rgba(0,0,0,0.48)] text-center cursor-pointer transition-colors duration-150 mb-1.5`}
        >
          <p
            className={`${
              compact ? 'text-[12px] leading-[1.35]' : 'text-[13px] sm:text-[14px] leading-[1.38]'
            } flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5`}
          >
            {parsed.beforeWords.map((w, idx) =>
              renderSpokenWordSpan(w, idx, stepIndex, accent, idx)
            )}
          </p>

          {/* Downward speech tail pointing directly into "The Truth" */}
          <svg
            aria-hidden="true"
            width="14"
            height="9"
            viewBox="0 0 14 9"
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-[8px]"
          >
            <path d="M1 0 L13 0 L7 8 Z" fill="#121418" fillOpacity="0.94" />
            <path
              d="M1 0 L7 8 L13 0"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
});

interface HeroQuoteTitleTextProps {
  isLandingIdle: boolean;
  reader: HeroQuoteController;
  accent: GradeAccent;
}

export const HeroQuoteTitleText = memo(function HeroQuoteTitleText({
  isLandingIdle,
  reader,
  accent
}: HeroQuoteTitleTextProps) {
  const { parsed, stepIndex } = useSyncExternalStore(
    reader.subscribe,
    reader.getSnapshot,
    reader.getSnapshot
  );

  if (!isLandingIdle) {
    return (
      <h1 className="font-display text-2xl sm:text-[30px] font-bold tracking-tight text-white leading-none">
        The Truth
      </h1>
    );
  }
  const isTheCurrent = parsed.hasLeadingThe && parsed.theStepIndex !== null && stepIndex === parsed.theStepIndex;
  const isTruthCurrent = stepIndex === parsed.truthStepIndex;
  const isTitleCurrent = isTheCurrent || isTruthCurrent;
  const isTheSpoken = parsed.hasLeadingThe && parsed.theStepIndex !== null && stepIndex >= parsed.theStepIndex;
  const isTruthSpoken = stepIndex >= parsed.truthStepIndex;
  const trailingSuffix = `${parsed.isPlural ? 's' : ''}${parsed.titleTrailingPunct}`;

  return (
    <h1
      data-testid="hero-incorporated-title"
      data-speaking-title={isTitleCurrent ? 'true' : 'false'}
      className="font-display text-[36px] sm:text-[46px] lg:text-[52px] xl:text-[58px] font-bold tracking-tight leading-none inline-flex items-baseline whitespace-nowrap select-none"
    >
      <span
        className="relative inline-block transition-[color,opacity,transform,text-shadow] duration-150 ease-out"
        style={{
          color: !parsed.hasLeadingThe
            ? 'rgba(163, 163, 163, 0.45)'
            : isTheCurrent || isTruthCurrent
            ? accent.primary
            : isTheSpoken
            ? '#FFFFFF'
            : 'rgba(255, 255, 255, 0.48)',
          opacity: !parsed.hasLeadingThe ? 0.16 : isTheSpoken ? 1 : 0.62,
          transform:
            isTheCurrent || isTruthCurrent
              ? 'translate3d(0, -1px, 0) scale(1.035)'
              : 'translate3d(0, 0, 0) scale(1)',
          textShadow:
            isTheCurrent || isTruthCurrent
              ? `0 0 26px ${accent.primary}, 0 0 48px ${accent.glow}`
              : isTheSpoken && parsed.hasLeadingThe
              ? `0 0 16px ${accent.glow}`
              : 'none'
        }}
      >
        {parsed.titleLeadingPunct ? (
          <span
            data-testid="hero-title-leading-punct"
            className="pointer-events-none absolute right-full top-0 pr-0.5 whitespace-nowrap text-neutral-400"
          >
            {parsed.titleLeadingPunct}
          </span>
        ) : null}
        The
      </span>

      <span>&nbsp;</span>

      <span
        className="relative inline-block transition-[color,opacity,transform,text-shadow] duration-150 ease-out"
        style={{
          color: isTruthCurrent
            ? accent.primary
            : isTruthSpoken
            ? '#FFFFFF'
            : 'rgba(255, 255, 255, 0.52)',
          opacity: isTruthSpoken ? 1 : 0.66,
          transform: isTruthCurrent
            ? 'translate3d(0, -1.5px, 0) scale(1.045)'
            : 'translate3d(0, 0, 0) scale(1)',
          textShadow: isTruthCurrent
            ? `0 0 30px ${accent.primary}, 0 0 56px ${accent.glow}`
            : isTruthSpoken
            ? `0 0 18px ${accent.glow}`
            : 'none'
        }}
      >
        Truth
        {trailingSuffix ? (
          <span
            data-testid="hero-title-trailing-suffix"
            className="pointer-events-none absolute left-full top-0 whitespace-nowrap"
          >
            {parsed.isPlural ? 's' : ''}
            {parsed.titleTrailingPunct ? (
              <span
                style={{
                  color: isTruthCurrent || isTruthSpoken ? accent.primary : 'rgba(255,255,255,0.42)'
                }}
              >
                {parsed.titleTrailingPunct}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </h1>
  );
});

interface HeroQuoteFollowThroughProps {
  reader: HeroQuoteController;
  accent: GradeAccent;
  compact: boolean;
}

export const HeroQuoteFollowThrough = memo(function HeroQuoteFollowThrough({
  reader,
  accent,
  compact
}: HeroQuoteFollowThroughProps) {
  const { parsed, stepIndex, item } = useSyncExternalStore(
    reader.subscribe,
    reader.getSnapshot,
    reader.getSnapshot
  );
  const { nextQuote, prevQuote, setHovered } = reader;
  const hasAfter = parsed.afterWords.length > 0;

  return (
    <div
      data-testid="hero-quote-follow-slot"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-full max-w-[92vw] md:max-w-[356px] lg:max-w-[500px] xl:max-w-[580px] ${
        compact ? 'h-[78px]' : 'h-[88px] sm:h-[92px]'
      } flex flex-col items-center justify-start px-2 pointer-events-none`}
    >
      {hasAfter ? (
        <button
          type="button"
          key={`after-${item.id}`}
          data-testid="truth-quote-chat-bubble"
          data-quote-id={item.id}
          data-quote-part="after"
          onClick={nextQuote}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          title="Click to skip to the next quote"
          aria-label={`${item.quote} — ${item.speaker}. Click for next quote.`}
          className={`truth-quote-pop pointer-events-auto relative mt-2 rounded-2xl rounded-tr-[6px] bg-[#121418]/[0.92] border border-white/10 hover:border-white/20 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#49EACB]/60 ${
            compact ? 'px-3.5 py-1.5' : 'px-4 py-2'
          } shadow-[0_10px_28px_rgba(0,0,0,0.48)] text-center cursor-pointer transition-colors duration-150`}
        >
          {/* Upward speech tail emerging directly from "The Truth" */}
          <svg
            aria-hidden="true"
            width="14"
            height="9"
            viewBox="0 0 14 9"
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-[8px]"
          >
            <path d="M1 9 L7 1 L13 9 Z" fill="#121418" fillOpacity="0.94" />
            <path
              d="M1 9 L7 1 L13 9"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <p
            className={`${
              compact ? 'text-[12px] leading-[1.35]' : 'text-[13px] sm:text-[14px] leading-[1.38]'
            } flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5`}
          >
            {parsed.afterWords.map((w, idx) =>
              renderSpokenWordSpan(w, parsed.afterStartStepIndex + idx, stepIndex, accent, idx)
            )}
          </p>
        </button>
      ) : null}

      {/* Quiet unboxed attribution & Prev / Next quote controls */}
      <div
        className={`pointer-events-auto flex items-center justify-center gap-2 font-mono text-[10.5px] text-neutral-400 ${
          hasAfter ? 'mt-1.5' : 'mt-2.5'
        }`}
      >
        <button
          type="button"
          onClick={prevQuote}
          aria-label="Previous quote"
          title="Previous quote"
          className="px-1.5 py-0.5 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer focus:outline-none focus-visible:text-white whitespace-nowrap shrink-0"
        >
          &larr;
        </button>

        <button
          type="button"
          data-testid="hero-quote-attribution"
          onClick={nextQuote}
          title="Click for next quote"
          className="hover:text-neutral-200 transition-colors cursor-pointer truncate max-w-[250px] sm:max-w-[380px] focus:outline-none"
        >
          <span>&mdash; {item.speaker}</span>
          {item.work ? (
            <>
              <span className="mx-1 text-neutral-600" aria-hidden="true">
                {' '}&middot;{' '}
              </span>
              <span className="text-neutral-500">{item.work}</span>
            </>
          ) : null}
        </button>

        <button
          type="button"
          onClick={nextQuote}
          aria-label="Next quote"
          title="Next quote"
          className="px-1.5 py-0.5 hover:brightness-125 transition-colors cursor-pointer focus:outline-none whitespace-nowrap shrink-0"
          style={{ color: accent.secondary }}
        >
          &rarr;
        </button>
      </div>
    </div>
  );
});
