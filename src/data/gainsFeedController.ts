export type GainsHorizon = 'ALL_TIME' | 'D180' | 'Y1' | 'Y2' | 'Y4';
export type GainsFeedMode = 'SNAPSHOT' | 'LIVE';
export type GainsChartView = 'COHORTS' | 'BTC_BENCHMARK' | 'M2_BENCHMARK';

export interface TabLazyFetchState {
  chartView: GainsChartView;
  feedMode: GainsFeedMode;
  hasLoadedCohortSnapshot: boolean;
  hasLoadedM2Snapshot: boolean;
  hasSyncedOpenSnapshot: boolean;
  hasSyncedCohortLive: boolean;
  hasSyncedM2Live: boolean;
}

export interface TabLazyFetchPlan {
  fetchCohortSnapshot: boolean;
  fetchM2Snapshot: boolean;
  syncCohortLive: boolean;
  syncM2Live: boolean;
}

export function isBenchmarkChartView(view: GainsChartView): boolean {
  return view === 'BTC_BENCHMARK' || view === 'M2_BENCHMARK';
}

/**
 * Resolves initial tab from URL query params (?view=btc | ?view=m2), defaulting to COHORTS.
 */
export function resolveInitialGainsChartView(search = ''): GainsChartView {
  const clean = search.startsWith('?') ? search.slice(1) : search;
  const sp = new URLSearchParams(clean);
  const v = (sp.get('view') || sp.get('tab') || '').trim().toLowerCase();
  if (v === 'btc' || v === 'bitcoin') return 'BTC_BENCHMARK';
  if (v === 'm2') return 'M2_BENCHMARK';
  return 'COHORTS';
}

/**
 * Defaults Live Gains modal to SNAPSHOT mode (synced once on panel open) so switching tabs
 * and inspecting charts stays free of continuous background polling until "Live Spot Feed"
 * is clicked (unless ?feed=live is explicitly requested in URL).
 */
export function resolveInitialGainsFeedMode(search = ''): GainsFeedMode {
  const clean = search.startsWith('?') ? search.slice(1) : search;
  const sp = new URLSearchParams(clean);
  const f = (sp.get('feed') || '').trim().toLowerCase();
  if (f === 'live' || f === '1') return 'LIVE';
  return 'SNAPSHOT';
}

/**
 * Pure controller that syncs the Saved Snapshot with the live gains feed once when the panel
 * opens while keeping inactive tabs separated until clicked:
 * - Opening on COHORTS hydrates cached trajectories immediately AND runs a one-shot live cohort
 *   sync to update the Saved Snapshot, without fetching M2/BTC benchmark series until clicked.
 * - Opening directly on BTC_BENCHMARK or M2_BENCHMARK syncs the benchmark snapshot on open.
 * - After the initial open sync, SNAPSHOT mode performs zero background polling; clicking into
 *   a benchmark tab lazily fetches /api/m2-benchmark once.
 * - Switching to LIVE mode enables continuous active-tab live syncing.
 */
export function resolveTabLazyFetchPlan(state: TabLazyFetchState): TabLazyFetchPlan {
  const isBench = isBenchmarkChartView(state.chartView);

  const fetchCohortSnapshot = !isBench && !state.hasLoadedCohortSnapshot;
  const fetchM2Snapshot = isBench && !state.hasLoadedM2Snapshot;

  if (!state.hasSyncedOpenSnapshot) {
    return {
      fetchCohortSnapshot,
      fetchM2Snapshot,
      syncCohortLive:
        (!isBench || state.chartView === 'BTC_BENCHMARK') && !state.hasSyncedCohortLive,
      syncM2Live: isBench && !state.hasSyncedM2Live
    };
  }

  const syncCohortLive =
    state.feedMode === 'LIVE' && !isBench && !state.hasSyncedCohortLive;
  const syncM2Live =
    state.feedMode === 'LIVE' && isBench && !state.hasSyncedM2Live;

  return {
    fetchCohortSnapshot,
    fetchM2Snapshot,
    syncCohortLive,
    syncM2Live
  };
}

/**
 * Determines which live endpoint a manual Sync button click or background poll tick
 * should refresh based on the currently visible tab.
 */
export function resolveManualLiveSyncTarget(
  chartView: GainsChartView
): 'COHORT_ONLY' | 'BENCHMARK_ONLY' {
  return isBenchmarkChartView(chartView) ? 'BENCHMARK_ONLY' : 'COHORT_ONLY';
}
