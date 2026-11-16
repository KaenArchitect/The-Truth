import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DOT_DISCOVERY_INTERACTIONS,
  DOT_DISCOVERY_STORAGE_KEY,
  DOT_DISCOVERY_TARGET_COUNT,
  createInitialDotDiscoveryState,
  formatMysteryCounterValue,
  getDotDiscoveryCount,
  isDotPulseActive,
  isDotPulseUnlocked,
  isMysteryCounterFlashing,
  loadDotDiscoveryState,
  markDotGenesisDiscovered,
  recordDotDiscoveryInteraction,
  sanitizeDotDiscoveryState,
  saveDotDiscoveryState
} from './dotDiscoveryGame.ts';

test('Target interaction count is strictly 6 unique interactions', () => {
  assert.equal(DOT_DISCOVERY_TARGET_COUNT, 6);
  assert.equal(new Set(DOT_DISCOVERY_INTERACTIONS).size, 6);
});

test('Repeated interactions of the same category never count twice or unlock pulse prematurely', () => {
  let state = createInitialDotDiscoveryState();
  assert.equal(getDotDiscoveryCount(state), 0);
  assert.equal(formatMysteryCounterValue(state), '0/6');
  assert.equal(isDotPulseUnlocked(state), false);
  assert.equal(isDotPulseActive(state), false);
  assert.equal(isMysteryCounterFlashing(state), false);

  for (let i = 0; i < 12; i++) {
    state = recordDotDiscoveryInteraction(state, 'inspect_asset', 1000 + i);
  }
  assert.equal(getDotDiscoveryCount(state), 1);
  assert.equal(formatMysteryCounterValue(state), '1/6');
  assert.equal(isDotPulseUnlocked(state), false);
  assert.equal(isDotPulseActive(state), false);
  assert.equal(isMysteryCounterFlashing(state), false);
});

test('Pulse and mystery counter flash stay inactive through 5 unique interactions and activate at 6/6', () => {
  let state = createInitialDotDiscoveryState();
  for (let i = 0; i < 5; i++) {
    state = recordDotDiscoveryInteraction(state, DOT_DISCOVERY_INTERACTIONS[i], 2000 + i * 100);
    assert.equal(getDotDiscoveryCount(state), i + 1);
    assert.equal(formatMysteryCounterValue(state), `${i + 1}/6`);
    assert.equal(isDotPulseUnlocked(state), false);
    assert.equal(isDotPulseActive(state), false);
    assert.equal(isMysteryCounterFlashing(state), false);
    assert.equal(state.unlockedAtMs, null);
  }

  state = recordDotDiscoveryInteraction(state, DOT_DISCOVERY_INTERACTIONS[5], 3000);
  assert.equal(getDotDiscoveryCount(state), 6);
  assert.equal(formatMysteryCounterValue(state), '6/6');
  assert.equal(isDotPulseUnlocked(state), true);
  assert.equal(isDotPulseActive(state), true);
  assert.equal(isMysteryCounterFlashing(state), true);
  assert.equal(state.unlockedAtMs, 3000);
});

test('Discovering the Origin Thesis stops counter flashing and calms pulse while preserving 6/6 unlocked state', () => {
  let state = createInitialDotDiscoveryState();
  for (const action of DOT_DISCOVERY_INTERACTIONS) {
    state = recordDotDiscoveryInteraction(state, action, 5000);
  }
  assert.equal(isDotPulseActive(state), true);
  assert.equal(isMysteryCounterFlashing(state), true);

  state = markDotGenesisDiscovered(state, 9000);
  assert.equal(isDotPulseUnlocked(state), true);
  assert.equal(formatMysteryCounterValue(state), '6/6');
  assert.equal(isDotPulseActive(state), false);
  assert.equal(isMysteryCounterFlashing(state), false);
  assert.equal(state.genesisDiscoveredAtMs, 9000);
});

test('State sanitizes corrupt inputs and round-trips cleanly with storage', () => {
  const map = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    }
  };

  let state = createInitialDotDiscoveryState();
  state = recordDotDiscoveryInteraction(state, 'switch_depth', 100);
  state = recordDotDiscoveryInteraction(state, 'explore_invariant', 200);
  saveDotDiscoveryState(state, mockStorage);

  const loaded = loadDotDiscoveryState(mockStorage);
  assert.deepEqual(loaded.discovered, ['switch_depth', 'explore_invariant']);
  assert.equal(isDotPulseActive(loaded), false);

  map.set(
    DOT_DISCOVERY_STORAGE_KEY,
    JSON.stringify({
      discovered: ['inspect_asset', 'invalid_key', 'inspect_asset', 'hands_on_tool'],
      unlockedAtMs: 'bad',
      genesisDiscoveredAtMs: null
    })
  );
  const sanitized = sanitizeDotDiscoveryState(JSON.parse(map.get(DOT_DISCOVERY_STORAGE_KEY)!));
  assert.deepEqual(sanitized.discovered, ['inspect_asset', 'hands_on_tool']);
  assert.equal(sanitized.unlockedAtMs, null);
});
