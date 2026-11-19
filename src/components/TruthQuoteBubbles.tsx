import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GradeAccent } from '../data/rubricSpec.ts';
import {
  TRUTH_HOME_QUOTES,
  parseQuoteAroundTitle,
  type ParsedHeroQuote,
  type SpokenWordToken,
  type TruthQuoteItem
} from '../data/truthQuotes.ts';

export interface HeroQuoteReaderState {
  active: boolean;
  quoteIndex: number;
  item: TruthQuoteItem;
  parsed: ParsedHeroQuote;
  stepIndex: number;
  reducedMotion: boolean;
  nextQuote: () => void;
  prevQuote: () => void;
  setHovered: (hovered: boolean) => void;
}

const POST_QUOTE_HOLD_MS = 2350;

export function useHeroTruthQuoteReader(active: boolean): HeroQuoteReaderState {
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
      : false
  );
  const hoveredRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    return undefined;
  }, []);

  const item = TRUTH_HOME_QUOTES[quoteIndex % TRUTH_HOME_QUOTES.length];
  const parsed = useMemo(() => parseQuoteAroundTitle(item.quote), [item.quote]);

  const nextQuote = useCallback(() => {
    setQuoteIndex((prev) => (prev + 1) % TRUTH_HOME_QUOTES.length);
    setStepIndex(0);
  }, []);

  const prevQuote = useCallback(() => {
    setQuoteIndex((prev) => (prev - 1 + TRUTH_HOME_QUOTES.length) % TRUTH_HOME_QUOTES.length);
    setStepIndex(0);
  }, []);

  const setHovered = useCallback((hovered: boolean) => {
    hoveredRef.current = hovered;
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    if (reducedMotion) {
      setStepIndex(parsed.totalSteps);
      return undefined;
    }

    if (stepIndex < parsed.totalSteps) {
      const waitMs = parsed.stepDurationsMs[stepIndex] ?? 220;
      const timerId = window.setTimeout(() => {
        setStepIndex((s) => s + 1);
      }, waitMs);
      return () => window.clearTimeout(timerId);
    }

    // Finished speaking all words — hold the completed quote, then advance unless hovered
    const holdTimer = window.setTimeout(() => {
      if (!hoveredRef.current && (typeof document === 'undefined' || !document.hidden)) {
        setQuoteIndex((prev) => (prev + 1) % TRUTH_HOME_QUOTES.length);
        setStepIndex(0);
      } else {
        // Re-check gently if hovered so unhovering resumes smoothly
        const pollId = window.setInterval(() => {
          if (!hoveredRef.current && (typeof document === 'undefined' || !document.hidden)) {
            window.clearInterval(pollId);
            setQuoteIndex((prev) => (prev + 1) % TRUTH_HOME_QUOTES.length);
            setStepIndex(0);
          }
        }, 650);
        return () => window.clearInterval(pollId);
      }
      return undefined;
    }, POST_QUOTE_HOLD_MS);

    return () => window.clearTimeout(holdTimer);
  }, [active, reducedMotion, stepIndex, parsed]);

  return {
    active,
    quoteIndex,
    item,
    parsed,
    stepIndex: reducedMotion ? parsed.totalSteps : stepIndex,
    reducedMotion,
    nextQuote,
    prevQuote,
    setHovered
  };
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
  reader: HeroQuoteReaderState;
  accent: GradeAccent;
  compact: boolean;
}

export const HeroQuoteLeadInBubble = memo(function HeroQuoteLeadInBubble({
  reader,
  accent,
  compact
}: HeroQuoteLeadInBubbleProps) {
  const { parsed, stepIndex, item, nextQuote, setHovered } = reader;
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
  reader: HeroQuoteReaderState;
  accent: GradeAccent;
}

export const HeroQuoteTitleText = memo(function HeroQuoteTitleText({
  isLandingIdle,
  reader,
  accent
}: HeroQuoteTitleTextProps) {
  if (!isLandingIdle) {
    return (
      <h1 className="font-display text-2xl sm:text-[30px] font-bold tracking-tight text-white leading-none">
        The Truth
      </h1>
    );
  }

  const { parsed, stepIndex } = reader;
  const isTheCurrent = parsed.hasLeadingThe && parsed.theStepIndex !== null && stepIndex === parsed.theStepIndex;
  const isTruthCurrent = stepIndex === parsed.truthStepIndex;
  const isTitleCurrent = isTheCurrent || isTruthCurrent;
  const isTheSpoken = parsed.hasLeadingThe && parsed.theStepIndex !== null && stepIndex >= parsed.theStepIndex;
  const isTruthSpoken = stepIndex >= parsed.truthStepIndex;

  return (
    <h1
      data-testid="hero-incorporated-title"
      data-speaking-title={isTitleCurrent ? 'true' : 'false'}
      className="font-display text-[36px] sm:text-[46px] lg:text-[52px] xl:text-[58px] font-bold tracking-tight leading-none inline-flex items-baseline whitespace-nowrap select-none"
    >
      {parsed.titleLeadingPunct ? (
        <span className="text-neutral-400 mr-0.5">{parsed.titleLeadingPunct}</span>
      ) : null}

      <span
        className="inline-block transition-[color,opacity,transform,text-shadow] duration-150 ease-out"
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
        The
      </span>

      <span>&nbsp;</span>

      <span
        className="inline-block transition-[color,opacity,transform,text-shadow] duration-150 ease-out"
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
        Truth{parsed.isPlural ? 's' : ''}
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
    </h1>
  );
});

interface HeroQuoteFollowThroughProps {
  reader: HeroQuoteReaderState;
  accent: GradeAccent;
  compact: boolean;
}

export const HeroQuoteFollowThrough = memo(function HeroQuoteFollowThrough({
  reader,
  accent,
  compact
}: HeroQuoteFollowThroughProps) {
  const { parsed, stepIndex, item, nextQuote, prevQuote, setHovered } = reader;
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
