// ============================================================================
// 6-UNIQUE-INTERACTIONS DISCOVERY GAME FOR THE TRUTH DOT EASTER EGG
// ============================================================================

export const DOT_DISCOVERY_STORAGE_KEY = 'truth_dot_discovery_game_v1';

export const DOT_DISCOVERY_INTERACTIONS = [
  'inspect_asset',
  'switch_depth',
  'explore_invariant',
  'pin_constellation',
  'open_vault_or_charts',
  'hands_on_tool'
] as const;

export type DotDiscoveryInteraction = (typeof DOT_DISCOVERY_INTERACTIONS)[number];

export const DOT_DISCOVERY_TARGET_COUNT = DOT_DISCOVERY_INTERACTIONS.length;

export interface DotDiscoveryGameState {
  discovered: DotDiscoveryInteraction[];
  unlockedAtMs: number | null;
  genesisDiscoveredAtMs: number | null;
}

export function createInitialDotDiscoveryState(): DotDiscoveryGameState {
  return {
    discovered: [],
    unlockedAtMs: null,
    genesisDiscoveredAtMs: null
  };
}

export function isValidDotDiscoveryInteraction(
  value: unknown
): value is DotDiscoveryInteraction {
  return (
    typeof value === 'string' &&
    (DOT_DISCOVERY_INTERACTIONS as readonly string[]).includes(value)
  );
}

export function sanitizeDotDiscoveryState(raw: unknown): DotDiscoveryGameState {
  if (!raw || typeof raw !== 'object') {
    return createInitialDotDiscoveryState();
  }
  const obj = raw as Record<string, unknown>;
  const seen = new Set<DotDiscoveryInteraction>();
  const discovered: DotDiscoveryInteraction[] = [];
  if (Array.isArray(obj.discovered)) {
    for (const item of obj.discovered) {
      if (isValidDotDiscoveryInteraction(item) && !seen.has(item)) {
        seen.add(item);
        discovered.push(item);
      }
    }
  }
  const unlockedAtMs =
    typeof obj.unlockedAtMs === 'number' && Number.isFinite(obj.unlockedAtMs)
      ? obj.unlockedAtMs
      : discovered.length >= DOT_DISCOVERY_TARGET_COUNT
      ? Date.now()
      : null;
  const genesisDiscoveredAtMs =
    typeof obj.genesisDiscoveredAtMs === 'number' && Number.isFinite(obj.genesisDiscoveredAtMs)
      ? obj.genesisDiscoveredAtMs
      : null;

  return {
    discovered,
    unlockedAtMs,
    genesisDiscoveredAtMs
  };
}

export function recordDotDiscoveryInteraction(
  state: DotDiscoveryGameState,
  interaction: DotDiscoveryInteraction,
  nowMs = Date.now()
): DotDiscoveryGameState {
  if (!isValidDotDiscoveryInteraction(interaction)) return state;
  if (state.discovered.includes(interaction)) {
    return state;
  }
  const nextDiscovered = [...state.discovered, interaction];
  const justUnlocked =
    nextDiscovered.length >= DOT_DISCOVERY_TARGET_COUNT && state.unlockedAtMs === null;

  return {
    discovered: nextDiscovered,
    unlockedAtMs: justUnlocked ? nowMs : state.unlockedAtMs,
    genesisDiscoveredAtMs: state.genesisDiscoveredAtMs
  };
}

export function markDotGenesisDiscovered(
  state: DotDiscoveryGameState,
  nowMs = Date.now()
): DotDiscoveryGameState {
  if (state.genesisDiscoveredAtMs !== null) {
    return state;
  }
  return {
    ...state,
    genesisDiscoveredAtMs: nowMs
  };
}

export function getDotDiscoveryCount(state: DotDiscoveryGameState): number {
  return state.discovered.length;
}

export function formatMysteryCounterValue(state: DotDiscoveryGameState): string {
  return `${getDotDiscoveryCount(state)}/${DOT_DISCOVERY_TARGET_COUNT}`;
}

export function isDotPulseUnlocked(state: DotDiscoveryGameState): boolean {
  return state.discovered.length >= DOT_DISCOVERY_TARGET_COUNT;
}

export function isDotPulseActive(state: DotDiscoveryGameState): boolean {
  return isDotPulseUnlocked(state) && state.genesisDiscoveredAtMs === null;
}

export function isMysteryCounterFlashing(state: DotDiscoveryGameState): boolean {
  return isDotPulseActive(state);
}

export function loadDotDiscoveryState(
  storage: Pick<Storage, 'getItem'> | null | undefined =
    typeof window !== 'undefined' ? window.localStorage : null
): DotDiscoveryGameState {
  if (!storage) return createInitialDotDiscoveryState();
  try {
    const raw = storage.getItem(DOT_DISCOVERY_STORAGE_KEY);
    if (!raw) return createInitialDotDiscoveryState();
    return sanitizeDotDiscoveryState(JSON.parse(raw));
  } catch {
    return createInitialDotDiscoveryState();
  }
}

export function saveDotDiscoveryState(
  state: DotDiscoveryGameState,
  storage: Pick<Storage, 'setItem'> | null | undefined =
    typeof window !== 'undefined' ? window.localStorage : null
): void {
  if (!storage) return;
  try {
    storage.setItem(DOT_DISCOVERY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

// ============================================================================
// ENERGY-EFFICIENCY CHARGE PHYSICS: DISCRETE CLICKS VS CONTINUOUS HOLD
// ============================================================================
// Holding applies coherent, continuous power (5.0s from 0 -> 100%).
// Clicking applies fragmented, start-stop impulses (200 clicks = 0.5% per click)
// that bank tiny irreversible quanta of work toward the exact same supernova.
export const DOT_HOLD_DURATION_MS = 5000;
export const DOT_HOLD_ENGAGE_DELAY_MS = 180;
export const DOT_CLICKS_TO_FILL = 200;
export const DOT_CLICK_INCREMENT = 1 / DOT_CLICKS_TO_FILL;

// When no energy is being put into the dot, stored charge dissipates back to 0
// following dC/dt = -(DOT_DISCHARGE_FLOOR_RATE + DOT_DISCHARGE_RC_RATE * C)
// after a brief thermal relaxation onset (DOT_DISCHARGE_DELAY_MS).
export const DOT_DISCHARGE_DELAY_MS = 180;
export const DOT_DISCHARGE_FLOOR_RATE = 0.04;
export const DOT_DISCHARGE_RC_RATE = 0.45;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function advanceDotClickCharge(currentCharge: number): {
  nextCharge: number;
  triggered: boolean;
} {
  const base = clamp01(currentCharge);
  const rawNext = Number((base + DOT_CLICK_INCREMENT).toFixed(6));
  if (rawNext >= 1 - 1e-6) {
    return { nextCharge: 1, triggered: true };
  }
  return { nextCharge: rawNext, triggered: false };
}

export function computeDotHoldProgress(baseCharge: number, elapsedMs: number): number {
  const safeBase = clamp01(baseCharge);
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return safeBase;
  }
  const postTapTarget = Math.min(1, safeBase + DOT_CLICK_INCREMENT);
  if (elapsedMs <= DOT_HOLD_ENGAGE_DELAY_MS) {
    const tapRatio = elapsedMs / DOT_HOLD_ENGAGE_DELAY_MS;
    return clamp01(safeBase + (postTapTarget - safeBase) * tapRatio);
  }
  if (postTapTarget >= 1) {
    return 1;
  }
  const remainingHoldWindowMs = Math.max(
    240,
    (DOT_HOLD_DURATION_MS - DOT_HOLD_ENGAGE_DELAY_MS) * (1 - safeBase)
  );
  const holdRatio = (elapsedMs - DOT_HOLD_ENGAGE_DELAY_MS) / remainingHoldWindowMs;
  return clamp01(postTapTarget + (1 - postTapTarget) * holdRatio);
}

export function computeDotDischargedCharge(peakCharge: number, idleElapsedMs: number): number {
  const safePeak = clamp01(peakCharge);
  if (safePeak <= 0) return 0;
  if (!Number.isFinite(idleElapsedMs) || idleElapsedMs <= DOT_DISCHARGE_DELAY_MS) {
    return safePeak;
  }
  const activeSec = (idleElapsedMs - DOT_DISCHARGE_DELAY_MS) / 1000;
  const ratio = DOT_DISCHARGE_FLOOR_RATE / DOT_DISCHARGE_RC_RATE;
  const next = (safePeak + ratio) * Math.exp(-DOT_DISCHARGE_RC_RATE * activeSec) - ratio;
  if (next <= 1e-5) return 0;
  return clamp01(next);
}

export function computeDotTimeToZeroMs(peakCharge: number): number {
  const safePeak = clamp01(peakCharge);
  if (safePeak <= 0) return 0;
  const drainSec =
    Math.log(1 + (DOT_DISCHARGE_RC_RATE / DOT_DISCHARGE_FLOOR_RATE) * safePeak) /
    DOT_DISCHARGE_RC_RATE;
  return DOT_DISCHARGE_DELAY_MS + drainSec * 1000;
}


