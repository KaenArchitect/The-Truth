import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DOT_CLICKS_TO_FILL,
  DOT_CLICK_INCREMENT,
  DOT_DISCHARGE_DELAY_MS,
  DOT_DISCOVERY_INTERACTIONS,
  DOT_DISCOVERY_STORAGE_KEY,
  DOT_DISCOVERY_TARGET_COUNT,
  DOT_HOLD_DURATION_MS,
  DOT_HOLD_ENGAGE_DELAY_MS,
  advanceDotClickCharge,
  computeDotDischargedCharge,
  computeDotHoldProgress,
  computeDotTimeToZeroMs,
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

test('Discrete dot clicks fill charge very slowly (200 clicks) while continuous holding reaches 100% in 5s', () => {
  assert.equal(DOT_CLICKS_TO_FILL, 200);
  assert.equal(DOT_CLICK_INCREMENT, 0.005);

  let charge = 0;
  for (let i = 1; i < DOT_CLICKS_TO_FILL; i++) {
    const step = advanceDotClickCharge(charge);
    assert.equal(step.triggered, false);
    assert.ok(step.nextCharge > charge);
    charge = step.nextCharge;
  }
  assert.ok(Math.abs(charge - 0.995) < 1e-6);

  const finalClick = advanceDotClickCharge(charge);
  assert.equal(finalClick.triggered, true);
  assert.equal(finalClick.nextCharge, 1);

  // Continuous hold from 0 hits exact tap increment at engage threshold and 1.0 at 5000ms
  assert.equal(computeDotHoldProgress(0, 0), 0);
  assert.ok(Math.abs(computeDotHoldProgress(0, DOT_HOLD_ENGAGE_DELAY_MS) - DOT_CLICK_INCREMENT) < 1e-6);
  assert.ok(computeDotHoldProgress(0, 2500) > 0.45 && computeDotHoldProgress(0, 2500) < 0.55);
  assert.equal(computeDotHoldProgress(0, DOT_HOLD_DURATION_MS), 1);

  // Pre-banked click charge carries smoothly into a subsequent continuous hold without backward jump
  const preBanked = 0.25;
  assert.equal(computeDotHoldProgress(preBanked, 0), 0.25);
  assert.ok(computeDotHoldProgress(preBanked, 100) >= 0.25);
  assert.equal(computeDotHoldProgress(preBanked, 4000), 1);
});

test('Dot discharges smoothly back to 0 when no energy is being put into it', () => {
  assert.equal(computeDotDischargedCharge(0, 1000), 0);
  assert.equal(computeDotTimeToZeroMs(0), 0);

  // Within brief thermal relaxation window, charge holds steady so rapid clicks accumulate
  assert.equal(computeDotDischargedCharge(0.5, 0), 0.5);
  assert.equal(computeDotDischargedCharge(0.5, DOT_DISCHARGE_DELAY_MS), 0.5);

  // Once idle beyond the onset window, charge monotonically decreases to exact 0
  let prev = 0.5;
  for (const t of [350, 800, 1600, 2800, 4000]) {
    const cur = computeDotDischargedCharge(0.5, t);
    assert.ok(cur < prev, `expected charge at ${t}ms (${cur}) < ${prev}`);
    prev = cur;
  }

  const zeroAtHalf = computeDotTimeToZeroMs(0.5);
  assert.ok(zeroAtHalf > 2500 && zeroAtHalf < 6000, `unexpected zero time: ${zeroAtHalf}ms`);
  assert.equal(computeDotDischargedCharge(0.5, zeroAtHalf + 25), 0);

  // Single click impulse also completely discharges to 0 when left idle
  const singleClickZeroMs = computeDotTimeToZeroMs(DOT_CLICK_INCREMENT);
  assert.ok(singleClickZeroMs > DOT_DISCHARGE_DELAY_MS && singleClickZeroMs < 800);
  assert.equal(computeDotDischargedCharge(DOT_CLICK_INCREMENT, singleClickZeroMs + 25), 0);

  // Catching a discharging dot mid-drain and holding resumes smoothly from exact remaining charge
  const midDrain = computeDotDischargedCharge(0.6, 1500);
  assert.ok(midDrain > 0.1 && midDrain < 0.6);
  assert.equal(computeDotHoldProgress(midDrain, 0), midDrain);
  assert.ok(computeDotHoldProgress(midDrain, 500) > midDrain);
});


