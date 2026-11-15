export const TUTORIAL_STORAGE_KEY = 'truth_tutorial_seen_v1';

export type TutorialTargetId =
  | 'search-dock'
  | 'passed-sidebar'
  | 'failed-sidebar'
  | 'center-arena'
  | 'mode-controls'
  | 'rubric-button'
  | 'pin-compare'
  | 'gains-archive';

export type TutorialActionId =
  | 'focus-search'
  | 'load-kas-fission'
  | 'toggle-genius'
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
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'search-engine',
    stepNumber: 1,
    targetId: 'search-dock',
    title: '1. Audit Any Asset, Metal, or Fiat',
    summary:
      'Evaluate cryptocurrencies, Layer-2 networks, fiat currencies, or physical commodities against six non-negotiable laws of thermodynamics on a strict 0.0 to 6.0 scale.',
    instructions: [
      'Type any ticker or name (e.g., KAS, BTC, USD, EUR, GOLD, SILVER, LIGHTNING) and press Audit / Pull.',
      'Preloaded and community-archived assets load instantaneously at zero API credit cost.',
      'Unarchived assets trigger a live Gemini 4 + Google Search forensic audit streamed invariant by invariant.'
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
    actionLabel: 'Inspect $KAS Breakdown',
    actionId: 'load-kas-fission',
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
      'Submit counter-evidence or click Fresh 1-Inv Pull inside any modal to challenge or re-verify a single score.'
    ],
    actionLabel: 'Open $KAS Fission',
    actionId: 'load-kas-fission',
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
    id: 'constellation-compare',
    stepNumber: 5,
    targetId: 'pin-compare',
    title: '5. Multi-Asset Constellation Compare',
    summary:
      'Pin two to four assets simultaneously to contrast their waveforms, total score deltas, and invariant-by-invariant evidence side by side.',
    instructions: [
      'Click the pin button on any sidebar orb—or Pin to Compare beneath the center sphere—to add up to 4 assets.',
      'Switch formations between Side-by-Side, Triangle, Rhombus, and Square as more assets are pinned.',
      'Select any button in the Sync Invariant bar below the stage to expand synchronized comparison cards.'
    ],
    actionLabel: 'Demo $KAS vs $SOL',
    actionId: 'demo-constellation',
    preferredPlacement: 'bottom'
  },
  {
    id: 'simulators-and-vault',
    stepNumber: 6,
    targetId: 'gains-archive',
    title: '6. Wartime Partition Lab, Live Gains & Vault',
    summary:
      'Stress-test consensus availability under undersea fiber cuts, explore 4.5-year market returns across cohorts, and browse the shared archive.',
    instructions: [
      'Click Contest / Wartime Sim under any audited asset to run the interactive Continent Partition & Cable Resplice lab.',
      'Open Live Gains to compare the E > 0 cohort against E = 0 across Macro Cycle, Ex-Outlier, and 90-Day horizons.',
      'Open Archive to browse cached audits, export JSON snapshots, or sign in with Google to publish new audits.'
    ],
    actionLabel: 'Launch Live Gains',
    actionId: 'open-gains-modal',
    preferredPlacement: 'bottom'
  }
];

export const MOBILE_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'mobile-search',
    stepNumber: 1,
    targetId: 'search-dock',
    title: '1. Audit Any Asset',
    summary: 'Enter any crypto, fiat (USD, EUR), L2, or physical metal (KAS, BTC, GOLD) and tap Audit / Pull.',
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
    actionLabel: 'Inspect $KAS',
    actionId: 'load-kas-fission',
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
    actionLabel: 'Split $KAS',
    actionId: 'load-kas-fission',
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
    id: 'mobile-pin-compare',
    stepNumber: 9,
    targetId: 'pin-compare',
    title: '9. Pin & Compare Assets',
    summary:
      'Pin 2–4 assets to compare score deltas in formations and expand Sync Invariant breakdown cards.',
    instructions: [],
    actionLabel: 'Demo KAS vs SOL',
    actionId: 'demo-constellation',
    preferredPlacement: 'top'
  },
  {
    id: 'mobile-sim-gains',
    stepNumber: 10,
    targetId: 'gains-archive',
    title: '10. Wartime Lab, Gains & Vault',
    summary:
      'Test cable cuts in Wartime Sim, view cohort returns in Live Gains, or export/publish in Archive.',
    instructions: [],
    actionLabel: 'Open Gains',
    actionId: 'open-gains-modal',
    preferredPlacement: 'bottom'
  }
];

export function getTutorialStepsForViewport(viewportWidth: number): TutorialStep[] {
  return viewportWidth < 768 ? MOBILE_TUTORIAL_STEPS : TUTORIAL_STEPS;
}

const HEADER_TUTORIAL_TARGETS = new Set<TutorialTargetId>([
  'search-dock',
  'mode-controls',
  'rubric-button',
  'gains-archive'
]);

export function computeMobileScrollTargetY(
  targetId: TutorialTargetId,
  elementDocTop: number,
  elementHeight: number,
  viewportHeight: number,
  cardHeight = 198,
  maxScrollY = Number.POSITIVE_INFINITY
): number {
  const vh = Math.max(480, viewportHeight);
  const clampScroll = (y: number) => Math.max(0, Math.min(maxScrollY, Math.round(y)));

  if (HEADER_TUTORIAL_TARGETS.has(targetId)) {
    return 0;
  }

  const mobileCardH = Math.min(cardHeight || 198, Math.round(vh * 0.4));
  const bottomSlotTop = Math.max(12, vh - mobileCardH - 12);
  const safeAboveSheetBottom = bottomSlotTop - 20;

  if (elementHeight + 20 <= safeAboveSheetBottom - 16) {
    const desiredViewportTop = Math.max(
      16,
      Math.round((safeAboveSheetBottom - elementHeight) / 2)
    );
    const scrollY = clampScroll(elementDocTop - desiredViewportTop);
    const resultingBottom = elementDocTop - scrollY + elementHeight + 10;

    if (resultingBottom > bottomSlotTop - 8) {
      const topSlotClearTop = 12 + mobileCardH + 24;
      return clampScroll(elementDocTop - topSlotClearTop);
    }
    return scrollY;
  }

  return clampScroll(elementDocTop + elementHeight / 2 - vh / 2);
}

export interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
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
  preferred: 'bottom' | 'right' | 'left' | 'top' = 'bottom'
): CardCoords {
  const vw = Math.max(320, viewport.width);
  const vh = Math.max(480, viewport.height);

  if (vw < 768) {
    const mobileCardH = Math.min(cardSize.height || 180, Math.round(vh * 0.4));
    const bottomTop = Math.max(12, vh - mobileCardH - 12);
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
        const bottomOverlap = Math.max(0, Math.min(targetBottom, vh - 12) - Math.max(targetRect.top, bottomTop));
        const topOverlap = Math.max(0, Math.min(targetBottom, topSlotBottom) - Math.max(targetRect.top, 12));
        if (topOverlap < bottomOverlap) {
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
