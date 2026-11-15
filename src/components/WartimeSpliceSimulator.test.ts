import test from 'node:test';
import assert from 'node:assert/strict';
import { PRELOADED_AUDITS } from '../data/preloadedAudits.ts';
import {
  DAGKNIGHT_ROADMAP_TAG,
  DURATION_OPTIONS,
  getKaspaConsensusRegime,
  getKip14ShardTrajectory,
  getMercenaryAttackTelemetry,
  getSimulatorTelemetry,
  getWartimeDaaKpiMetrics
} from './WartimeSpliceSimulator.tsx';

test('getKaspaConsensusRegime models all 3 rusty-kaspa Post-Crescendo (10 BPS) bounds accurately', () => {
  const rA15 = getKaspaConsensusRegime(15);
  assert.equal(rA15.id, 'A');
  assert.equal(rA15.estimatedBlocks, 9000);
  assert.equal(rA15.statusBadge, '100% DAG Convergence (Zero-Orphan Merge)');
  assert.match(rA15.mechanicsCopy, /merge_depth = 36,000/);
  assert.match(rA15.mechanicsCopy, /mergeset_size_limit = 248/);
  assert.match(rA15.mechanicsCopy, /k = 124/);
  assert.match(rA15.mechanicsCopy, /26,410-DAA-block/);

  // 59m is still inside 36,000-block merge_depth
  const rA59 = getKaspaConsensusRegime(59);
  assert.equal(rA59.id, 'A');

  // 60m (36,000 blocks) enters Regime B (1 to 12h)
  const rB60 = getKaspaConsensusRegime(60);
  assert.equal(rB60.id, 'B');
  assert.equal(
    rB60.statusBadge,
    'Heavier Blue-Work Reorg (Bounded Merge Depth Exceeded)'
  );
  assert.match(rB60.mechanicsCopy, /ViolatingBoundedMergeDepth/);
  assert.match(rB60.mechanicsCopy, /cumulative Blue Work/);

  // 12h (720m = 432,000 blocks) still inside finality_depth bound
  const rB720 = getKaspaConsensusRegime(720);
  assert.equal(rB720.id, 'B');

  // > 12h (e.g. 721m or 48h = 2880m) enters Regime C
  const rC721 = getKaspaConsensusRegime(721);
  assert.equal(rC721.id, 'C');
  assert.equal(
    rC721.statusBadge,
    'Finality Lock Triggered (Manual Coordination Required)'
  );
  assert.match(rC721.mechanicsCopy, /finality_depth = 432,000/);
  assert.match(rC721.mechanicsCopy, /FinalityConflict/);
  assert.match(rC721.mechanicsCopy, /--override-params/);
  assert.match(rC721.mechanicsCopy, /pruning_depth = 1,080,000/);
});

test('DURATION_OPTIONS exposes all 3 consensus regimes including <1h, 1-12h, and >12h', () => {
  const mins = DURATION_OPTIONS.map((o) => o.mins);
  assert.ok(mins.some((m) => m < 60), 'Expected a <1h duration option');
  assert.ok(mins.some((m) => m >= 60 && m <= 720), 'Expected a 1-12h duration option');
  assert.ok(mins.some((m) => m > 720), 'Expected a >12h duration option');
});

test('getWartimeDaaKpiMetrics contrasts Kaspa KIP-14 10.0 BPS vs Bitcoin 100-min blocks / ~10 weeks at 10% shard', () => {
  const kpi = getWartimeDaaKpiMetrics(90);
  assert.equal(kpi.minorityPct, 10);
  assert.equal(kpi.bitcoinSlowBlockMins, 100);
  assert.equal(kpi.bitcoinMinorityEpochWeeks, '~10');
  assert.match(kpi.bitcoinBenchmarkCopy, /100-minute blocks/);
  assert.match(kpi.bitcoinBenchmarkCopy, /~10 weeks/);
});

test('getKip14ShardTrajectory computes initial shard BPS ramp to 10.0 BPS over 44m Sampled DAA', () => {
  const t10 = getKip14ShardTrajectory(90);
  assert.equal(t10.minorityPct, 10);
  assert.equal(t10.initialShardBps, 1.0);
  assert.equal(t10.restoredBps, 10.0);
  assert.equal(t10.bitcoinSlowBlockMins, 100);
  assert.match(t10.trajectoryNote, /1\.0 BPS/);
  assert.match(t10.trajectoryNote, /KIP-14/);

  const t42 = getKip14ShardTrajectory(58);
  assert.equal(t42.minorityPct, 42);
  assert.equal(t42.initialShardBps, 4.2);
});

test('getMercenaryAttackTelemetry accurately contrasts KAS ASIC barrier vs XMR Qubic, BCH <1%, BTC Sv2, and PoS cartels', () => {
  const kasM = getMercenaryAttackTelemetry(PRELOADED_AUDITS.KAS);
  assert.match(kasM.hardwareProfile, />95% Dedicated Optical kHeavyHash/i);
  assert.match(kasM.summaryCopy, /GHOSTDAG/);

  const xmrM = getMercenaryAttackTelemetry(PRELOADED_AUDITS.XMR);
  assert.match(xmrM.attackPrecedentOrCost, /Aug 11–12, 2025 Qubic/i);
  assert.match(xmrM.reorgContainment, /pre-FCMP\+\+/i);

  const bchM = getMercenaryAttackTelemetry(PRELOADED_AUDITS.BCH);
  assert.match(bchM.hardwareProfile, /<1% Minority Share/i);
  assert.match(bchM.reorgContainment, /-maxreorgdepth=10/);

  const btcM = getMercenaryAttackTelemetry(PRELOADED_AUDITS.BTC);
  assert.match(btcM.hardwareProfile, />99% Global SHA-256d/i);
  assert.match(btcM.summaryCopy, /Stratum v2 Job Declaration/i);

  const solM = getMercenaryAttackTelemetry(PRELOADED_AUDITS.SOL);
  assert.match(solM.verdictBadge, /0-JOULE VALIDATOR CARTEL/i);
});

test('Kaspa Splice telemetry never shows 100% Merged at 48h and always tags DAGKnight as Roadmap', () => {
  const splice45m = getSimulatorTelemetry(PRELOADED_AUDITS.KAS, 'SPLICE', 58, 45);
  assert.equal(splice45m.statusLabel, '100% DAG Convergence (Zero-Orphan Merge)');

  const splice4h = getSimulatorTelemetry(PRELOADED_AUDITS.KAS, 'SPLICE', 58, 240);
  assert.equal(splice4h.statusLabel, 'Heavier Blue-Work Reorg (Bounded Merge Depth Exceeded)');
  assert.ok(!splice4h.metrics.some((m) => m.value.includes('100% Merged')));

  const splice48h = getSimulatorTelemetry(PRELOADED_AUDITS.KAS, 'SPLICE', 58, 2880);
  assert.equal(splice48h.statusLabel, 'Finality Lock Triggered (Manual Coordination Required)');
  assert.ok(!splice48h.metrics.some((m) => m.value.includes('100% Merged')));
  assert.ok(splice48h.caption.includes(DAGKNIGHT_ROADMAP_TAG));
});

test('Bitcoin reconnection telemetry enforces exact bitcoind C++ mechanics without claiming pre-cut balance wipeouts', () => {
  const btcSplice = getSimulatorTelemetry(PRELOADED_AUDITS.BTC, 'SPLICE', 58, 240);
  assert.match(btcSplice.caption, /Pre-partition UTXOs survive/i);
  assert.match(btcSplice.caption, /nChainWork/);
  assert.match(btcSplice.caption, /COINBASE_MATURITY=100/);
  assert.match(btcSplice.caption, /disconnectpool/);
  assert.doesNotMatch(btcSplice.caption, /erases every payment|wipes out pre-cut/i);
});
