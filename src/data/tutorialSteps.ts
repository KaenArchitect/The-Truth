import { DOT_DISCOVERY_TARGET_COUNT } from './dotDiscoveryGame.ts';

export const LEGACY_TUTORIAL_STORAGE_KEYS = ['truth_tutorial_seen_v1'] as const;
export const TUTORIAL_STORAGE_KEY = 'truth_tutorial_seen_v2';
export const TUTORIAL_RELEASE_STAMP = '2026-11-27-living-ai-v2';

export function hasSeenCurrentTutorial(
  storage: Pick<Storage, 'getItem'> | null | undefined
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(TUTORIAL_STORAGE_KEY) === TUTORIAL_RELEASE_STAMP;
  } catch {
    return false;
  }
}

export function markCurrentTutorialSeen(
  storage: Pick<Storage, 'setItem' | 'removeItem'> | null | undefined
): void {
  if (!storage) return;
  try {
    storage.setItem(TUTORIAL_STORAGE_KEY, TUTORIAL_RELEASE_STAMP);
    for (const legacyKey of LEGACY_TUTORIAL_STORAGE_KEYS) {
      storage.removeItem(legacyKey);
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
}

/**
 * Minimum clearance (in CSS px) reserved at the bottom of mobile viewports (< 768px)
 * so sticky bottom toolbars and in-app browser ad banners (e.g. Facebook / Instagram
 * WebViews) never cover the tutorial text box or its Back / Next / Done buttons.
 */
export const MOBILE_BOTTOM_AD_SAFE_OFFSET_PX = 136;
export const IN_APP_AD_BROWSER_BOTTOM_OFFSET_PX = 160;

export function isBottomChromeInAppBrowser(userAgent = ''): boolean {
  if (!userAgent) return false;
  return /FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram|BytedanceWebview|musical_ly|TikTok|Line\/|MicroMessenger/i.test(
    userAgent
  );
}

export function getMobileBottomClearancePx(userAgent = ''): number {
  return isBottomChromeInAppBrowser(userAgent)
    ? IN_APP_AD_BROWSER_BOTTOM_OFFSET_PX
    : MOBILE_BOTTOM_AD_SAFE_OFFSET_PX;
}

export type TutorialTargetId =
  | 'search-dock'
  | 'passed-sidebar'
  | 'failed-sidebar'
  | 'center-arena'
  | 'mode-controls'
  | 'time-machine'
  | 'rubric-button'
  | 'pin-compare'
  | 'gains-archive'
  | 'mystery-beacon';

export type TutorialActionId =
  | 'focus-search'
  | 'load-btc-fission'
  | 'toggle-genius'
  | 'demo-time-machine'
  | 'demo-constellation'
  | 'open-wartime-sim'
  | 'open-gains-modal';

export interface TutorialStep {
  id: string;
  stepNumber: number;
  targetId: TutorialTargetId;
  title: string;
  summary: string;
  instructions: string[];
  actionLabel?: string;
  actionId?: TutorialActionId;
  preferredPlacement?: 'bottom' | 'right' | 'left' | 'top';
  isEasterEggStep?: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'search-engine',
    stepNumber: 1,
    targetId: 'search-dock',
    title: '1. Living, Learning Cached AI — Challenge It',
    summary:
      'This site relies on you interacting with it. It is an unbiased, living, learning cached AI system that sharpens its shared memory only when people use the Challenge consoles and pull fresh era intel on the Time Machine. Do not just take it for its word—challenge it.',
    instructions: [
      'Pull New Intel: Search any crypto, metal, or fiat (e.g., BTC, ETH, USD, GOLD) or scrub the Time Machine (1913 → Present) to stream fresh consensus intel into the shared cache.',
      'Use the Challenge Systems: Click into any invariant bubble to submit counter-evidence, commits, or postmortems (7 daily challenges signed out • 13 signed in, tracked beside daily audits in Archive).',
      'Shared Living Vault: Cached reads cost 0 credits, while verified challenges and fresh pulls continuously upgrade the archive for everyone—test every claim.'
    ],
    actionLabel: 'Focus Search Bar',
    actionId: 'focus-search',
    preferredPlacement: 'bottom'
  },
  {
    id: 'harmonic-cohorts',
    stepNumber: 2,
    targetId: 'passed-sidebar',
    title: '2. Harmonic (E > 0) vs. Flatlined (E = 0)',
    summary:
      'Protocols anchored in irreversible electrical work oscillate as living harmonic waves on the left. Zero-joule Proof-of-Stake and premined tokens flatline to Grade F on the right.',
    instructions: [
      'Wave amplitude scales strictly with the asset’s thermodynamic score across all 6 invariants.',
      'Click any orb in either column to load its full center breakdown, or click the pin icon to compare it.',
      'Use the cycle return link beneath each column header to inspect real market divergence between cohorts.'
    ],
    actionLabel: 'Inspect $BTC Breakdown',
    actionId: 'load-btc-fission',
    preferredPlacement: 'right'
  },
  {
    id: 'radial-fission',
    stepNumber: 3,
    targetId: 'center-arena',
    title: '3. 6-Invariant Radial Fission',
    summary:
      'Hover or tap the central sphere to split an asset into its six physical invariants: Sovereignty, Cost Floor, Immutability, Availability, State Topology, and Velocity.',
    instructions: [
      'Each satellite displays its individual score (0.0 to 1.0) and oscillates at its own thermodynamic amplitude.',
      'Click any satellite bubble to open its codebase receipts, forensic narrative, and 1-invariant Challenge Console.',
      'Submit counter-evidence or click the invariant symbol next to the title inside any modal to challenge or re-verify a single score.'
    ],
    actionLabel: 'Open $BTC Fission',
    actionId: 'load-btc-fission',
    preferredPlacement: 'bottom'
  },
  {
    id: 'depth-and-rubric',
    stepNumber: 4,
    targetId: 'mode-controls',
    title: '4. Normie vs. Genius Depth & Scoring Rubric',
    summary:
      'Switch between concise executive takeaways and unabridged forensic engineering evidence, or inspect the deterministic scoring brackets at any time.',
    instructions: [
      'NORMIE gives a clear 1-paragraph physics verdict for every invariant.',
      'GENIUS unlocks full engineering essays citing repositories, consensus constants, and dated postmortems.',
      'Open Rubric to inspect the Energy-Arbitrage Law (Sovereignty = 0 caps grade at D+) and Carrier Subordination Law.'
    ],
    actionLabel: 'Switch to Genius Mode',
    actionId: 'toggle-genius',
    preferredPlacement: 'bottom'
  },
  {
    id: 'time-machine',
    stepNumber: 5,
    targetId: 'time-machine',
    title: '5. Thermodynamic Time Machine (1913 → Present)',
    summary:
      'Scrub across eight historical monetary epochs (1913, 1971, 2000, 2008, 2016, 2020, 2024, and Present) to evaluate every asset and cohort strictly within its era.',
    instructions: [
      'Click or drag any year stop—or click and hold the active year pill—to inspect monetary shifts like the 1971 gold severance or 2016 Proof-of-Work Ethereum.',
      'Protocols that had not launched yet automatically filter out, while active assets re-score using era-authentic consensus rules (e.g., $ETH in 2016 vs. Present).',
      'Inside any multi-era asset modal, tap its Epoch Scrubber pills—or click Present on the timeline—to jump back to live consensus.'
    ],
    actionLabel: 'Preview 2016 Epoch',
    actionId: 'demo-time-machine',
    preferredPlacement: 'bottom'
  },
  {
    id: 'constellation-compare',
    stepNumber: 6,
    targetId: 'pin-compare',
    title: '6. Multi-Asset Constellation Compare',
    summary:
      'Pin two to four assets simultaneously to contrast their waveforms, total score deltas, and invariant-by-invariant evidence side by side.',
    instructions: [
      'Click the pin button on any sidebar orb—or Pin to Compare beneath the center sphere—to add up to 4 assets.',
      'Constellations automatically arrange pinned bubbles (including horizontal zig-zag at 4 pins) to fit the largest bubbles on your screen.',
      'Select any button in the Sync Invariant bar below the stage to expand synchronized comparison cards.'
    ],
    actionLabel: 'Demo $BTC vs $ETH',
    actionId: 'demo-constellation',
    preferredPlacement: 'bottom'
  },
  {
    id: 'simulators-and-vault',
    stepNumber: 7,
    targetId: 'gains-archive',
    title: '7. Wartime Partition Lab, Live Gains & Vault',
    summary:
      'Stress-test consensus availability under undersea fiber cuts, explore 4.5-year market returns across cohorts, and browse the shared archive.',
    instructions: [
      'Click Contest / Wartime Sim under any audited asset to run the interactive Continent Partition & Cable Resplice lab.',
      'Open Live Gains to compare the E > 0 cohort against E = 0, Bitcoin, and US M2 across All Time, 180-Day, 1-Year, 2-Year, and 4-Year timeframes.',
      'Open Archive to browse cached audits, export JSON snapshots, or sign in with Google to publish new audits.'
    ],
    actionLabel: 'Launch Live Gains',
    actionId: 'open-gains-modal',
    preferredPlacement: 'bottom'
  },
  {
    id: 'easter-egg-signal',
    stepNumber: 8,
    targetId: 'mystery-beacon',
    isEasterEggStep: true,
    title: '8. Signal Detected · Hidden Easter Egg',
    summary: `Notice the cryptic 0/${DOT_DISCOVERY_TARGET_COUNT} counter—echoing the 6 physical invariants—and glowing dot beside The Truth? Something deeper is sealed behind the interface.`,
    instructions: [
      `Explore any ${DOT_DISCOVERY_TARGET_COUNT} distinct capabilities across the terminal—including scrubbing the Time Machine—to increment the 0/${DOT_DISCOVERY_TARGET_COUNT} anomaly counter toward resonance.`,
      `Watch what starts pulsing beside the title at ${DOT_DISCOVERY_TARGET_COUNT}/${DOT_DISCOVERY_TARGET_COUNT}, and remember: applying sustained coherent energy (or persistent impulses) at the point of origin breaks containment.`
    ],
    preferredPlacement: 'bottom'
  }
];

export const MOBILE_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'mobile-search',
    stepNumber: 1,
    targetId: 'search-dock',
    title: '1. Living Cached AI — Challenge It',
    summary:
      'Unbiased, living cached AI that relies on you: use Challenge consoles & pull Time Machine intel. Don’t take its word—test it.',
    instructions: [],
    actionLabel: 'Focus Search',
    actionId: 'focus-search',
    preferredPlacement: 'bottom'
  },
  {
    id: 'mobile-vault-stream',
    stepNumber: 2,
    targetId: 'search-dock',
    title: '2. Cached Vault vs. Live Scan',
    summary:
      'Archived assets load instantly at 0 credits. New tickers stream a live 6-invariant Gemini audit.',
    instructions: [],
    preferredPlacement: 'bottom'
  },
  {
    id: 'mobile-passed-cohort',
    stepNumber: 3,
    targetId: 'passed-sidebar',
    title: '3. Harmonic Cohort (E > 0)',
    summary:
      'Proof-of-Work assets anchored in irreversible energy oscillate as living waves. Tap any orb to inspect.',
    instructions: [],
    actionLabel: 'Inspect $BTC',
    actionId: 'load-btc-fission',
    preferredPlacement: 'top'
  },
  {
    id: 'mobile-failed-cohort',
    stepNumber: 4,
    targetId: 'failed-sidebar',
    title: '4. Flatlined Cohort (E = 0)',
    summary:
      'Zero-joule PoS and premined tokens flatline to Grade F. Tap header returns to compare cohorts.',
    instructions: [],
    preferredPlacement: 'top'
  },
  {
    id: 'mobile-radial-fission',
    stepNumber: 5,
    targetId: 'center-arena',
    title: '5. 6-Invariant Radial Fission',
    summary:
      'Tap the sphere to split Sovereignty, Cost Floor, Immutability, Availability, Topology, and Velocity.',
    instructions: [],
    actionLabel: 'Split $BTC',
    actionId: 'load-btc-fission',
    preferredPlacement: 'top'
  },
  {
    id: 'mobile-challenge-console',
    stepNumber: 6,
    targetId: 'center-arena',
    title: '6. Receipts & 1-Inv Challenge',
    summary:
      'Tap any outer invariant bubble for codebase receipts or to re-verify a single score at low cost.',
    instructions: [],
    preferredPlacement: 'top'
  },
  {
    id: 'mobile-mode-switch',
    stepNumber: 7,
    targetId: 'mode-controls',
    title: '7. Normie vs. Genius Depth',
    summary:
      'NORMIE gives concise 1-paragraph verdicts. GENIUS unlocks full forensic essays with citations.',
    instructions: [],
    actionLabel: 'Try Genius',
    actionId: 'toggle-genius',
    preferredPlacement: 'bottom'
  },
  {
    id: 'mobile-rubric-laws',
    stepNumber: 8,
    targetId: 'rubric-button',
    title: '8. Physics Scoring Rubric',
    summary:
      'Open Rubric anytime to inspect Energy-Arbitrage (E = 0 → F) and Carrier Subordination caps.',
    instructions: [],
    preferredPlacement: 'bottom'
  },
  {
    id: 'mobile-time-machine',
    stepNumber: 9,
    targetId: 'time-machine',
    title: '9. Time Machine (1913–Present)',
    summary:
      'Scrub 1913 to Present to audit historical monetary eras (1971 fiat shift, 2016 PoW ETH) vs. today.',
    instructions: [],
    actionLabel: 'Preview 2016',
    actionId: 'demo-time-machine',
    preferredPlacement: 'bottom'
  },
  {
    id: 'mobile-pin-compare',
    stepNumber: 10,
    targetId: 'pin-compare',
    title: '10. Pin & Compare Assets',
    summary:
      'Pin 2–4 assets to compare score deltas in formations and expand Sync Invariant breakdown cards.',
    instructions: [],
    actionLabel: 'Demo BTC vs ETH',
    actionId: 'demo-constellation',
    preferredPlacement: 'top'
  },
  {
    id: 'mobile-sim-gains',
    stepNumber: 11,
    targetId: 'gains-archive',
    title: '11. Wartime Lab, Gains & Vault',
    summary:
      'Test cable cuts in Wartime Sim, view cohort returns in Live Gains, or export/publish in Archive.',
    instructions: [],
    actionLabel: 'Open Gains',
    actionId: 'open-gains-modal',
    preferredPlacement: 'top'
  },
  {
    id: 'mobile-easter-egg',
    stepNumber: 12,
    targetId: 'mystery-beacon',
    isEasterEggStep: true,
    title: `12. Hidden Easter Egg (0/${DOT_DISCOVERY_TARGET_COUNT})`,
    summary: `Spot the 0/${DOT_DISCOVERY_TARGET_COUNT} counter & dot by The Truth? Explore any ${DOT_DISCOVERY_TARGET_COUNT} tools (including Time Machine) to unlock a secret vault.`,
    instructions: [],
    preferredPlacement: 'bottom'
  }
];

export function getTutorialStepsForViewport(viewportWidth: number): TutorialStep[] {
  return viewportWidth < 768 ? MOBILE_TUTORIAL_STEPS : TUTORIAL_STEPS;
}

const HEADER_TUTORIAL_TARGETS = new Set<TutorialTargetId>([
  'search-dock',
  'mode-controls',
  'time-machine',
  'mystery-beacon'
]);

export function computeMobileScrollTargetY(
  targetId: TutorialTargetId,
  elementDocTop: number,
  elementHeight: number,
  viewportHeight: number,
  cardHeight = 198,
  maxScrollY = Number.POSITIVE_INFINITY,
  bottomClearancePx = MOBILE_BOTTOM_AD_SAFE_OFFSET_PX
): number {
  const vh = Math.max(480, viewportHeight);
  const clampScroll = (y: number) => Math.max(0, Math.min(maxScrollY, Math.round(y)));

  if (HEADER_TUTORIAL_TARGETS.has(targetId)) {
    return 0;
  }

  const mobileCardH = Math.min(cardHeight || 198, Math.round(vh * 0.38));
  const safeBottomOffset = Math.max(MOBILE_BOTTOM_AD_SAFE_OFFSET_PX, bottomClearancePx);
  const bottomSlotTop = Math.max(12, vh - mobileCardH - safeBottomOffset);
  const safeAboveSheetBottom = bottomSlotTop - 20;
  const topSlotClearTop = 12 + mobileCardH + 24;

  if (elementHeight + 20 <= safeAboveSheetBottom - 16) {
    const desiredViewportTop = Math.max(
      16,
      Math.round((safeAboveSheetBottom - elementHeight) / 2)
    );
    const scrollY = clampScroll(elementDocTop - desiredViewportTop);
    const resultingBottom = elementDocTop - scrollY + elementHeight + 10;

    if (resultingBottom > bottomSlotTop - 8) {
      return clampScroll(elementDocTop - topSlotClearTop);
    }
    return scrollY;
  }

  // When an element is too tall to fit above the elevated bottom sheet (e.g. inside a shrunk
  // mobile WebView), place it cleanly beneath the top coach-card slot so the card docks at top: 12px.
  if (topSlotClearTop + elementHeight + 12 <= vh) {
    return clampScroll(elementDocTop - topSlotClearTop);
  }

  return clampScroll(elementDocTop + elementHeight / 2 - vh / 2);
}

export interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Builds a single even-odd SVG path string covering the viewport with a rounded spotlight cutout.
 * Replaces offscreen <svg><mask> alpha rasterization for zero-jank 60fps spotlight transitions.
 */
export function buildSpotlightCutoutPath(
  viewportWidth: number,
  viewportHeight: number,
  rect: SpotlightRect | null,
  radius = 18
): string {
  const vw = Math.max(1, Math.round(viewportWidth));
  const vh = Math.max(1, Math.round(viewportHeight));
  const outer = `M0 0H${vw}V${vh}H0Z`;
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    return outer;
  }
  const x = Number(rect.left.toFixed(2));
  const y = Number(rect.top.toFixed(2));
  const w = Number(rect.width.toFixed(2));
  const h = Number(rect.height.toFixed(2));
  const r = Number(Math.max(0, Math.min(radius, w / 2, h / 2)).toFixed(2));
  const xRight = Number((x + w).toFixed(2));
  const yBottom = Number((y + h).toFixed(2));
  const xInL = Number((x + r).toFixed(2));
  const xInR = Number((x + w - r).toFixed(2));
  const yInT = Number((y + r).toFixed(2));
  const yInB = Number((y + h - r).toFixed(2));
  return `${outer}M${xInL} ${y}H${xInR}A${r} ${r} 0 0 1 ${xRight} ${yInT}V${yInB}A${r} ${r} 0 0 1 ${xInR} ${yBottom}H${xInL}A${r} ${r} 0 0 1 ${x} ${yInB}V${yInT}A${r} ${r} 0 0 1 ${xInL} ${y}Z`;
}

export interface CardCoords {
  top: number;
  left: number;
  width: number;
  placement: 'bottom' | 'right' | 'left' | 'top' | 'mobile-sheet' | 'mobile-top';
}

export function clampTutorialStepIndex(index: number, total = TUTORIAL_STEPS.length): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(total - 1, Math.floor(index)));
}

export function computeSpotlightCardPosition(
  targetRect: SpotlightRect | null,
  viewport: { width: number; height: number },
  cardSize: { width: number; height: number } = { width: 380, height: 320 },
  preferred: 'bottom' | 'right' | 'left' | 'top' = 'bottom',
  mobileBottomClearancePx = MOBILE_BOTTOM_AD_SAFE_OFFSET_PX
): CardCoords {
  const vw = Math.max(320, viewport.width);
  const vh = Math.max(480, viewport.height);

  if (vw < 768) {
    const mobileCardH = Math.min(cardSize.height || 180, Math.round(vh * 0.38));
    const safeBottomOffset = Math.max(MOBILE_BOTTOM_AD_SAFE_OFFSET_PX, mobileBottomClearancePx);
    const bottomTop = Math.max(12, vh - mobileCardH - safeBottomOffset);
    const topSlotBottom = 12 + mobileCardH;

    if (targetRect && targetRect.height > 0) {
      const targetBottom = targetRect.top + targetRect.height;
      const overlapsBottom = targetBottom > bottomTop - 8 && targetRect.top < vh - 12;
      const overlapsTop = targetRect.top < topSlotBottom + 8 && targetBottom > 12;
      if (overlapsBottom && !overlapsTop) {
        return {
          top: 12,
          left: 12,
          width: vw - 24,
          placement: 'mobile-top'
        };
      }
      if (overlapsBottom && overlapsTop) {
        // Choose whichever slot leaves more room for the target
        const bottomOverlap = Math.max(
          0,
          Math.min(targetBottom, bottomTop + mobileCardH) - Math.max(targetRect.top, bottomTop)
        );
        const topOverlap = Math.max(
          0,
          Math.min(targetBottom, topSlotBottom) - Math.max(targetRect.top, 12)
        );
        if (topOverlap <= bottomOverlap) {
          return {
            top: 12,
            left: 12,
            width: vw - 24,
            placement: 'mobile-top'
          };
        }
      }
    }

    return {
      top: bottomTop,
      left: 12,
      width: vw - 24,
      placement: 'mobile-sheet'
    };
  }

  const cardW = Math.min(cardSize.width, vw - 32);
  const cardH = Math.min(cardSize.height, vh - 32);
  const gap = 18;
  const pad = 16;

  if (!targetRect || targetRect.width <= 0 || targetRect.height <= 0) {
    return {
      top: Math.round((vh - cardH) / 2),
      left: Math.round((vw - cardW) / 2),
      width: cardW,
      placement: 'bottom'
    };
  }

  const clampX = (x: number) => Math.max(pad, Math.min(vw - cardW - pad, Math.round(x)));
  const clampY = (y: number) => Math.max(pad, Math.min(vh - cardH - pad, Math.round(y)));

  const centerX = targetRect.left + targetRect.width / 2 - cardW / 2;
  const centerY = targetRect.top + targetRect.height / 2 - cardH / 2;

  const candidates: Array<{
    mode: 'bottom' | 'right' | 'left' | 'top';
    fits: boolean;
    top: number;
    left: number;
  }> = [
    {
      mode: 'bottom',
      fits: targetRect.top + targetRect.height + gap + cardH <= vh - pad,
      top: targetRect.top + targetRect.height + gap,
      left: clampX(centerX)
    },
    {
      mode: 'top',
      fits: targetRect.top - gap - cardH >= pad,
      top: targetRect.top - gap - cardH,
      left: clampX(centerX)
    },
    {
      mode: 'right',
      fits: targetRect.left + targetRect.width + gap + cardW <= vw - pad,
      top: clampY(centerY),
      left: targetRect.left + targetRect.width + gap
    },
    {
      mode: 'left',
      fits: targetRect.left - gap - cardW >= pad,
      top: clampY(centerY),
      left: targetRect.left - gap - cardW
    }
  ];

  const ordered = [
    ...candidates.filter((c) => c.mode === preferred),
    ...candidates.filter((c) => c.mode !== preferred)
  ];

  const chosen = ordered.find((c) => c.fits) || ordered[0];
  return {
    top: clampY(chosen.top),
    left: clampX(chosen.left),
    width: cardW,
    placement: chosen.mode
  };
}

const HOME_RESET_STRIP_PARAMS = [
  'asset',
  'compare',
  'tickers',
  'mode',
  'lab',
  'inv',
  'archive',
  'gains',
  'rubric',
  'genesis',
  'year'
] as const;

/**
 * Strips asset, comparison, modal, and timeline deep-link query parameters so
 * returning to Home after completing/closing the tutorial restores a clean root URL.
 */
export function buildCleanHomeUrl(pathname = '/', search = ''): string {
  const safePath = pathname && pathname.startsWith('/') ? pathname : '/';
  if (!search) return safePath;
  try {
    const params = new URLSearchParams(search);
    for (const key of HOME_RESET_STRIP_PARAMS) {
      params.delete(key);
    }
    const remaining = params.toString();
    return remaining ? `${safePath}?${remaining}` : safePath;
  } catch {
    return safePath;
  }
}

