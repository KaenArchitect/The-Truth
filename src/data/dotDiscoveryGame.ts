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
