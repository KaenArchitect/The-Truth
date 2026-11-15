import test from 'node:test';
import assert from 'node:assert/strict';
import {
  type AuditData,
  type InvariantData,
  clampSingleInvariantByPhysics,
  deriveGradeFromTotal,
  enforceEnergyArbitrageLawOnAudit,
  getGradeAccent,
  getHarmonizedScoreStyle,
  getScoreStyle,
  inspectStreamedAuditProgress,
  isResponseTextTruncated,
  normalizeAuditPayload,
  safeParseAuditJson,
  sortAuditTickersByGrade
} from './rubricSpec.ts';

function makeDummyInvariants(scores: [number, number, number, number, number, number]): InvariantData[] {
  const ids = ['01', '02', '03', '04', '05', '06'];
  return ids.map((id, idx) => ({
    id,
    shortName: `Inv ${id}`,
    title: `Invariant ${id}`,
    telemetry: 'Benchmark telemetry record',
    score: scores[idx],
    quickSummary: 'Summary record.',
    paragraph:
      'Protocol architecture evaluated against irreversible thermodynamic work, physical cost floor, and entity decoupling with complete ledger verification.',
    geniusParagraph:
      'Evaluating the cryptographic and thermodynamic structure of the protocol reveals verifiable physical properties across electricity consumption, state transitions, partition resilience, and zero-rent validation dynamics over continuous cycles of mining and settlement without administrative capture.',
    receipts: ['Genesis Fair Launch Check', 'Thermodynamic Work Receipt']
  }));
}

function makeDummyAudit(
  overrides: Partial<AuditData> = {},
  scores: [number, number, number, number, number, number] = [1, 1, 1, 1, 1, 1]
): AuditData {
  const totalScore = Number(scores.reduce((a, b) => a + b, 0).toFixed(2));
  return {
    ticker: 'TEST',
    name: 'Test Protocol',
    consensusFamily: 'BLOCKDAG_POW',
    architecture: 'Pure Proof-of-Work BlockDAG',
    grade: deriveGradeFromTotal(totalScore, scores[1], scores[0]),
    totalScore,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluating Test Protocol through the GRADE evidence certainty framework yields complete compliance across all six physical invariants.',
    invariants: makeDummyInvariants(scores),
    ...overrides
  };
}

test('deriveGradeFromTotal enforces E=0 -> F and sovereignty=0 D+/D/D- caps', () => {
  assert.equal(deriveGradeFromTotal(6.0, 0, 1), 'F');
  assert.equal(deriveGradeFromTotal(0.95, 0.5, 1), 'F');

  // Sovereignty = 0 caps terminal grade at D+ even if totalScore is high
  assert.equal(deriveGradeFromTotal(4.2, 0.35, 0), 'D+');
  assert.equal(deriveGradeFromTotal(2.3, 0.35, 0), 'D+');
  assert.equal(deriveGradeFromTotal(1.85, 0.35, 0), 'D');
  assert.equal(deriveGradeFromTotal(1.2, 0.35, 0), 'D-');

  // Normal grade thresholds
  assert.equal(deriveGradeFromTotal(6.0, 1.0, 1.0), 'A+');
  assert.equal(deriveGradeFromTotal(4.4, 1.0, 1.0), 'B+');
  assert.equal(deriveGradeFromTotal(3.5, 1.0, 1.0), 'C+');
  assert.equal(deriveGradeFromTotal(1.5, 0.5, 0.5), 'D');
});

test('enforceEnergyArbitrageLawOnAudit zeroes E=0 and caps Cost Floor on Sovereignty=0', () => {
  const zeroJouleAudit = makeDummyAudit({}, [0.8, 0, 0.9, 0.8, 0.7, 0.5]);
  const enforcedZero = enforceEnergyArbitrageLawOnAudit(zeroJouleAudit);
  assert.equal(enforcedZero.grade, 'F');
  assert.equal(enforcedZero.totalScore, 0);
  assert.ok(enforcedZero.invariants.every((inv) => inv.score === 0));

  // Premine sets Cost Floor ceiling to 0.30 and caps grade at D+
  const premineAudit = makeDummyAudit(
    {
      name: 'PremineCoin',
      architecture: 'Premine PoW Chain'
    },
    [0, 0.9, 0.8, 0.7, 0.8, 0.4]
  );
  const enforcedPremine = enforceEnergyArbitrageLawOnAudit(premineAudit);
  assert.equal(enforcedPremine.invariants[1].score, 0.3);
  assert.equal(enforcedPremine.grade, 'D+');
  assert.equal(enforcedPremine.totalScore, 3.0);

  // Protocol dev tax without premine/ICO caps Cost Floor at 0.35
  const devTaxAudit = makeDummyAudit(
    {
      name: 'TaxCoin',
      architecture: 'PoW with 20% Founders Reward'
    },
    [0, 0.9, 0.8, 0.7, 0.8, 0.4]
  );
  const enforcedDevTax = enforceEnergyArbitrageLawOnAudit(devTaxAudit);
  assert.equal(enforcedDevTax.invariants[1].score, 0.35);
  assert.equal(enforcedDevTax.grade, 'D+');
  assert.equal(enforcedDevTax.totalScore, 3.05);
});

test('clampSingleInvariantByPhysics enforces carrier subordination across LN, IGRA, and Physical Commodities', () => {
  const lnAudit = makeDummyAudit(
    {
      ticker: 'LN',
      name: 'Lightning Network',
      consensusFamily: 'LINEAR_POW',
      architecture: 'Bitcoin Layer-2 Payment Channel Mesh'
    },
    [0.75, 0.35, 0.65, 0.3, 0.25, 0.05]
  );
  assert.equal(
    clampSingleInvariantByPhysics(lnAudit, 5, 0.9, { carrierLayerOneVelocityCap: 0.2 }),
    0.15
  );
  assert.equal(clampSingleInvariantByPhysics(lnAudit, 3, 0.9), 0.5);
  assert.equal(clampSingleInvariantByPhysics(lnAudit, 4, 0.9), 0.45);

  const igraAudit = makeDummyAudit(
    {
      ticker: 'IGRA',
      name: 'Igra Network',
      consensusFamily: 'BLOCKDAG_POW',
      architecture: 'Kaspa Layer-2 Based EVM Rollup'
    },
    [0.65, 0.3, 0.8, 0.75, 0.3, 0.15]
  );
  assert.equal(clampSingleInvariantByPhysics(igraAudit, 5, 0.8), 0.2);
  assert.equal(clampSingleInvariantByPhysics(igraAudit, 2, 0.95), 0.85);
  assert.equal(clampSingleInvariantByPhysics(igraAudit, 3, 0.95), 0.9);

  const goldAudit = makeDummyAudit(
    {
      ticker: 'XAU',
      name: 'Physical Gold',
      consensusFamily: 'PHYSICAL_COMMODITY',
      architecture: 'Elemental Specie'
    },
    [1.0, 0.95, 0.92, 0.6, 0.6, 0.03]
  );
  assert.equal(clampSingleInvariantByPhysics(goldAudit, 5, 0.5), 0.1);
  assert.equal(clampSingleInvariantByPhysics(goldAudit, 5, 0.0), 0.03);
  assert.equal(clampSingleInvariantByPhysics(goldAudit, 1, 1.0), 0.95);
});

test('safeParseAuditJson strips markdown fences and repairs truncated JSON only when allowed', () => {
  const fenced = '```json\n{"ticker":"KAS","totalScore":6}\n```';
  const parsedFenced = safeParseAuditJson<{ ticker: string; totalScore: number }>(fenced);
  assert.equal(parsedFenced.ticker, 'KAS');
  assert.equal(parsedFenced.totalScore, 6);

  const truncated = '{"ticker":"BCH","invariants":[{"id":"01","score":0.85';
  assert.throws(() => safeParseAuditJson(truncated, { strictComplete: true }), /Truncated JSON/);

  const repaired = safeParseAuditJson<{ ticker: string; invariants: Array<{ id: string; score: number }> }>(
    truncated,
    { strictComplete: false }
  );
  assert.equal(repaired.ticker, 'BCH');
  assert.equal(repaired.invariants[0].score, 0.85);
});

test('isResponseTextTruncated detects incomplete trailing prose', () => {
  assert.equal(isResponseTextTruncated('Too short'), true);
  assert.equal(
    isResponseTextTruncated('This sentence cuts off abruptly without ending punctuation'),
    true
  );
  assert.equal(
    isResponseTextTruncated('This analytical conclusion completes cleanly with physical certainty.'),
    false
  );
});

test('inspectStreamedAuditProgress tracks completed invariant milestones deterministically', () => {
  const partialStream = `{"ticker":"ERG","invariants":[
    {"id":"01","score":0.85,"receipts":["Fair Launch","No Premine"]},
    {"id":"02","score":0.75,"receipts":["Autolykos PoW"]},
    {"id":"03","score":0.65`;
  const progress = inspectStreamedAuditProgress(partialStream);
  assert.equal(progress.completedCount, 2);
  assert.equal(progress.completedScores[0], 0.85);
  assert.equal(progress.completedScores[1], 0.75);
});

test('normalizeAuditPayload calibrates consensus family, physics caps, and grade', () => {
  const raw = {
    ticker: 'eth',
    name: 'Ethereum',
    consensusFamily: 'ZERO_JOULE_BFT',
    architecture: 'Proof-of-Stake',
    invariants: makeDummyInvariants([0.5, 0, 0.4, 0.4, 0.3, 0.2])
  };
  const normalizedZero = normalizeAuditPayload(raw, 'ETH', 'ETH', null);
  assert.equal(normalizedZero.ticker, 'ETH');
  assert.equal(normalizedZero.grade, 'F');
  assert.equal(normalizedZero.totalScore, 0);
  assert.ok(normalizedZero.invariants.every((i) => i.score === 0));

  const powRaw = {
    ticker: 'bch',
    name: 'Bitcoin Cash',
    consensusFamily: 'LINEAR_POW',
    architecture: 'Sequential SHA-256d PoW',
    invariants: makeDummyInvariants([0.85, 0.9, 0.85, 0.95, 0.95, 0.9])
  };
  const normalizedPow = normalizeAuditPayload(powRaw, 'BCH', 'BCH', null);
  assert.equal(normalizedPow.invariants[3].score, 0.75);
  assert.equal(normalizedPow.invariants[4].score, 0.9);
  assert.equal(normalizedPow.invariants[5].score, 0.45);
  assert.equal(normalizedPow.totalScore, 4.7);
  assert.equal(normalizedPow.grade, 'B+');
});

test('sortAuditTickersByGrade ranks higher grades and scores first', () => {
  const audits: Record<string, AuditData> = {
    ETH: makeDummyAudit({ ticker: 'ETH', grade: 'F', totalScore: 0 }, [0, 0, 0, 0, 0, 0]),
    KAS: makeDummyAudit({ ticker: 'KAS', grade: 'A+', totalScore: 6.0 }, [1, 1, 1, 1, 1, 1]),
    BTC: makeDummyAudit({ ticker: 'BTC', grade: 'B+', totalScore: 4.4 }, [1, 1, 0.9, 0.65, 0.65, 0.2])
  };
  assert.deepEqual(sortAuditTickersByGrade(audits), ['KAS', 'BTC', 'ETH']);
});

test('getHarmonizedScoreStyle matches invariant score grade color instead of parent gradient step', () => {
  const btcAccent = getGradeAccent('B+');
  const igAccent = getGradeAccent('D+');

  assert.deepEqual(getHarmonizedScoreStyle(1.0, btcAccent), getScoreStyle(1.0));
  assert.equal(getHarmonizedScoreStyle(1.0, btcAccent).color, '#49EACB');
  assert.equal(getHarmonizedScoreStyle(0.95, btcAccent).color, '#4ADE80');
  assert.equal(getHarmonizedScoreStyle(0.65, btcAccent).color, '#FACC15');
  assert.equal(getHarmonizedScoreStyle(0.2, btcAccent).color, '#F97316');
  assert.equal(getHarmonizedScoreStyle(0.0, btcAccent).color, '#EF4444');
  assert.equal(getHarmonizedScoreStyle(0.9, igAccent).color, '#4ADE80');
  assert.equal(getHarmonizedScoreStyle(0.0, igAccent).color, '#EF4444');
});

