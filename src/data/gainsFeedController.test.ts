import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isBenchmarkChartView,
  resolveInitialGainsChartView,
  resolveInitialGainsFeedMode,
  resolveManualLiveSyncTarget,
  resolveTabLazyFetchPlan
} from './gainsFeedController.ts';

test('resolveInitialGainsFeedMode defaults to SNAPSHOT until Live Spot Feed is clicked', () => {
  assert.equal(resolveInitialGainsFeedMode(''), 'SNAPSHOT');
  assert.equal(resolveInitialGainsFeedMode('?gains=1'), 'SNAPSHOT');
  assert.equal(resolveInitialGainsFeedMode('?gains=1&view=btc'), 'SNAPSHOT');
  assert.equal(resolveInitialGainsFeedMode('?gains=1&feed=live'), 'LIVE');
});

test('resolveInitialGainsChartView parses tab query params cleanly', () => {
  assert.equal(resolveInitialGainsChartView(''), 'COHORTS');
  assert.equal(resolveInitialGainsChartView('?view=btc'), 'BTC_BENCHMARK');
  assert.equal(resolveInitialGainsChartView('?tab=bitcoin'), 'BTC_BENCHMARK');
  assert.equal(resolveInitialGainsChartView('?view=m2'), 'M2_BENCHMARK');
  assert.equal(isBenchmarkChartView('COHORTS'), false);
  assert.equal(isBenchmarkChartView('BTC_BENCHMARK'), true);
  assert.equal(isBenchmarkChartView('M2_BENCHMARK'), true);
});

test('resolveTabLazyFetchPlan syncs Saved Snapshot with live feed once on panel open while keeping other tabs lazy', () => {
  // 1. Initial open on Cohort Equity in default SNAPSHOT mode:
  // Loads cached cohort trajectories AND syncs cohort snapshot with live feed once; zero M2 fetch.
  const openCohorts = resolveTabLazyFetchPlan({
    chartView: 'COHORTS',
    feedMode: 'SNAPSHOT',
    hasLoadedCohortSnapshot: false,
    hasLoadedM2Snapshot: false,
    hasSyncedOpenSnapshot: false,
    hasSyncedCohortLive: false,
    hasSyncedM2Live: false
  });
  assert.deepEqual(openCohorts, {
    fetchCohortSnapshot: true,
    fetchM2Snapshot: false,
    syncCohortLive: true,
    syncM2Live: false
  });

  // 2. Once open snapshot sync completes, staying in SNAPSHOT mode triggers zero polling or fetches.
  const idleCohorts = resolveTabLazyFetchPlan({
    chartView: 'COHORTS',
    feedMode: 'SNAPSHOT',
    hasLoadedCohortSnapshot: true,
    hasLoadedM2Snapshot: false,
    hasSyncedOpenSnapshot: true,
    hasSyncedCohortLive: true,
    hasSyncedM2Live: false
  });
  assert.deepEqual(idleCohorts, {
    fetchCohortSnapshot: false,
    fetchM2Snapshot: false,
    syncCohortLive: false,
    syncM2Live: false
  });

  // 3. Clicking "Assets vs. BTC" in SNAPSHOT mode lazily loads M2/BTC dataset once without background polling.
  const clickBtcSnapshot = resolveTabLazyFetchPlan({
    chartView: 'BTC_BENCHMARK',
    feedMode: 'SNAPSHOT',
    hasLoadedCohortSnapshot: true,
    hasLoadedM2Snapshot: false,
    hasSyncedOpenSnapshot: true,
    hasSyncedCohortLive: true,
    hasSyncedM2Live: false
  });
  assert.deepEqual(clickBtcSnapshot, {
    fetchCohortSnapshot: false,
    fetchM2Snapshot: true,
    syncCohortLive: false,
    syncM2Live: false
  });

  // 4. Direct open on M2_BENCHMARK syncs M2 benchmark snapshot with live feed on open without cohort sync.
  const directOpenM2 = resolveTabLazyFetchPlan({
    chartView: 'M2_BENCHMARK',
    feedMode: 'SNAPSHOT',
    hasLoadedCohortSnapshot: false,
    hasLoadedM2Snapshot: false,
    hasSyncedOpenSnapshot: false,
    hasSyncedCohortLive: false,
    hasSyncedM2Live: false
  });
  assert.deepEqual(directOpenM2, {
    fetchCohortSnapshot: false,
    fetchM2Snapshot: true,
    syncCohortLive: false,
    syncM2Live: true
  });

  // 5. Switching to "Assets vs. M2" while LIVE feed is active lazily loads & syncs M2 benchmark.
  const switchToM2WhileLive = resolveTabLazyFetchPlan({
    chartView: 'M2_BENCHMARK',
    feedMode: 'LIVE',
    hasLoadedCohortSnapshot: true,
    hasLoadedM2Snapshot: false,
    hasSyncedOpenSnapshot: true,
    hasSyncedCohortLive: true,
    hasSyncedM2Live: false
  });
  assert.deepEqual(switchToM2WhileLive, {
    fetchCohortSnapshot: false,
    fetchM2Snapshot: true,
    syncCohortLive: false,
    syncM2Live: true
  });
});

test('resolveManualLiveSyncTarget scopes manual refresh and polling to the active tab', () => {
  assert.equal(resolveManualLiveSyncTarget('COHORTS'), 'COHORT_ONLY');
  assert.equal(resolveManualLiveSyncTarget('BTC_BENCHMARK'), 'BENCHMARK_ONLY');
  assert.equal(resolveManualLiveSyncTarget('M2_BENCHMARK'), 'BENCHMARK_ONLY');
});
