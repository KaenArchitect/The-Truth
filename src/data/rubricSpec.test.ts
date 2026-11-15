import test from 'node:test';
import assert from 'node:assert/strict';
import {
  type AuditData,
  type InvariantData,
  canonicalizeAuditsCollection,
  clampSingleInvariantByPhysics,
  coerceDisplayText,
  computeRunningAuditAccent,
  deriveGradeFromTotal,
  enforceEnergyArbitrageLawOnAudit,
  getGradeAccent,
  getHarmonizedScoreStyle,
  getScoreStyle,
  inspectStreamedAuditProgress,
  isResponseTextTruncated,
  normalizeAuditPayload,
  resolveCanonicalAssetTicker,
  safeParseAuditJson,
  sanitizeAuditData,
  sanitizeInvLogsMap,
  sortAuditTickersByGrade
} from './rubricSpec.ts';
import { partitionTickersByEcosystem } from './auditProvenance.ts';

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

test('computeRunningAuditAccent tracks running average step by step and converges to terminal grade accent', () => {
  const initial = computeRunningAuditAccent({});
  assert.equal(initial.auditedCount, 0);
  assert.equal(initial.averageScore, null);
  assert.equal(initial.projectedGrade, null);
  assert.equal(initial.accent.primary, '#49EACB');

  // Mixed scores progressing 1 invariant at a time
  // Step 1: 0.95 -> avg 0.95 -> projected 5.70 (A) -> #49EACB
  const step1 = computeRunningAuditAccent({ 0: 0.95 });
  assert.equal(step1.auditedCount, 1);
  assert.equal(step1.projectedTotal, 5.7);
  assert.equal(step1.projectedGrade, 'A');
  assert.equal(step1.accent.primary, getGradeAccent('A').primary);

  // Step 2: 0.55 -> avg 0.75 -> projected 4.50 (B+) -> #4ADE80
  const step2 = computeRunningAuditAccent({ 0: 0.95, 1: 0.55 });
  assert.equal(step2.auditedCount, 2);
  assert.equal(step2.projectedTotal, 4.5);
  assert.equal(step2.projectedGrade, 'B+');
  assert.equal(step2.accent.primary, '#4ADE80');

  // Step 3: 0.30 -> avg 0.60 -> projected 3.60 (C+) -> #FACC15
  const step3 = computeRunningAuditAccent({ 0: 0.95, 1: 0.55, 2: 0.3 });
  assert.equal(step3.projectedTotal, 3.6);
  assert.equal(step3.projectedGrade, 'C+');
  assert.equal(step3.accent.primary, '#FACC15');

  // Step 4: 0.20 -> avg 0.50 -> projected 3.00 (C) -> #EAB308
  const step4 = computeRunningAuditAccent({ 0: 0.95, 1: 0.55, 2: 0.3, 3: 0.2 });
  assert.equal(step4.projectedTotal, 3.0);
  assert.equal(step4.projectedGrade, 'C');
  assert.equal(step4.accent.primary, '#EAB308');

  // Step 5: 0.10 -> avg 0.42 -> projected 2.52 (C-) -> #F59E0B
  const step5 = computeRunningAuditAccent({ 0: 0.95, 1: 0.55, 2: 0.3, 3: 0.2, 4: 0.1 });
  assert.equal(step5.projectedTotal, 2.52);
  assert.equal(step5.projectedGrade, 'C-');
  assert.equal(step5.accent.primary, '#F59E0B');

  // Step 6: 0.12 -> total 2.22 -> projected 2.22 (D+) -> #FB923C (exact terminal grade match)
  const step6 = computeRunningAuditAccent({ 0: 0.95, 1: 0.55, 2: 0.3, 3: 0.2, 4: 0.1, 5: 0.12 });
  assert.equal(step6.auditedCount, 6);
  assert.equal(step6.projectedTotal, 2.22);
  assert.equal(step6.projectedGrade, deriveGradeFromTotal(2.22, 0.55, 0.95));
  assert.equal(step6.accent.primary, getGradeAccent('D+').primary);

  // Zero cost floor immediately triggers F (#EF4444)
  const zeroCost = computeRunningAuditAccent({ 0: 0.8, 1: 0 });
  assert.equal(zeroCost.projectedGrade, 'F');
  assert.equal(zeroCost.accent.primary, '#EF4444');

  // Sovereignty = 0 caps running projected grade at D+
  const sovZero = computeRunningAuditAccent({ 0: 0, 1: 0.35, 2: 0.9, 3: 0.9 });
  assert.equal(sovZero.projectedGrade, 'D+');
  assert.equal(sovZero.accent.primary, getGradeAccent('D+').primary);
});

test('canonicalizeAuditsCollection merges COPPER and stale overlay CU into one Layer-1 CU bubble', () => {
  assert.equal(resolveCanonicalAssetTicker('copper'), 'CU');
  assert.equal(resolveCanonicalAssetTicker('Platinum'), 'XPT');
  assert.equal(resolveCanonicalAssetTicker('Bitcoin'), 'BTC');
  assert.equal(resolveCanonicalAssetTicker('Ethereum'), 'ETH');

  const staleOverlayCu = makeDummyAudit(
    {
      ticker: 'CU',
      name: 'Copper Tokenized Derivative Overlay',
      consensusFamily: 'CARRIER_SUBORDINATED_OVERLAY',
      isUpperLayerOverlayOrChannel: true,
      grade: 'C-',
      totalScore: 2.65
    },
    [0.5, 0.5, 0.5, 0.45, 0.4, 0.3]
  );

  const l1Copper = makeDummyAudit(
    {
      ticker: 'COPPER',
      name: 'Physical Copper (COMEX)',
      consensusFamily: 'PHYSICAL_COMMODITY',
      isUpperLayerOverlayOrChannel: false,
      grade: 'C+',
      totalScore: 3.7,
      archiveRevision: 2
    },
    [0.7, 0.65, 0.65, 0.6, 0.55, 0.55]
  );

  const canonical = canonicalizeAuditsCollection({
    COPPER: l1Copper,
    CU: staleOverlayCu
  });

  assert.equal(canonical.COPPER, undefined);
  assert.ok(canonical.CU);
  assert.equal(canonical.CU.ticker, 'CU');
  assert.equal(canonical.CU.consensusFamily, 'PHYSICAL_COMMODITY');
  assert.equal(canonical.CU.isUpperLayerOverlayOrChannel, false);
  assert.equal(canonical.CU.grade, 'C+');
  assert.equal(canonical.CU.totalScore, 3.7);
  assert.ok(canonical.CU.queryAliases?.includes('COPPER'));

  const { coreTickers, ecosystemTickers } = partitionTickersByEcosystem(
    Object.keys(canonical),
    canonical
  );
  assert.deepEqual(coreTickers, ['CU']);
  assert.deepEqual(ecosystemTickers, []);
});

test('Fiat currencies enforce ZERO_JOULE_BFT, Grade F (0.0 / 6.0), and isUpperLayerOverlayOrChannel = true across normalizer and clamps', () => {
  const inflatedFiatRaw = {
    ticker: 'usdollar',
    name: 'US Dollar',
    consensusFamily: 'LINEAR_POW',
    isUpperLayerOverlayOrChannel: false,
    architecture: 'Federal Reserve Legal Tender & Fedwire Credit Overlay',
    invariants: makeDummyInvariants([0.5, 0.4, 0.7, 0.8, 0.6, 0.9])
  };
  const normalizedFiat = normalizeAuditPayload(inflatedFiatRaw, 'US Dollar', 'USDOLLAR', null);
  assert.equal(normalizedFiat.ticker, 'USD');
  assert.equal(normalizedFiat.consensusFamily, 'ZERO_JOULE_BFT');
  assert.equal(normalizedFiat.isUpperLayerOverlayOrChannel, true);
  assert.equal(normalizedFiat.grade, 'F');
  assert.equal(normalizedFiat.totalScore, 0);
  assert.ok(normalizedFiat.invariants.every((inv) => inv.score === 0));

  // Even direct single-invariant re-audit proposals cannot raise fiat above 0.00
  assert.equal(clampSingleInvariantByPhysics(normalizedFiat, 1, 0.9), 0);
  assert.equal(clampSingleInvariantByPhysics(normalizedFiat, 5, 0.8), 0);

  const euroEnforced = enforceEnergyArbitrageLawOnAudit(
    makeDummyAudit(
      {
        ticker: 'euro',
        name: 'Euro',
        consensusFamily: 'LINEAR_POW',
        isUpperLayerOverlayOrChannel: false,
        architecture: 'ECB Fractional Reserve Fiat'
      },
      [0.3, 0.3, 0.3, 0.3, 0.3, 0.3]
    )
  );
  assert.equal(euroEnforced.ticker, 'EUR');
  assert.equal(euroEnforced.consensusFamily, 'ZERO_JOULE_BFT');
  assert.equal(euroEnforced.isUpperLayerOverlayOrChannel, true);
  assert.equal(euroEnforced.grade, 'F');
  assert.equal(euroEnforced.totalScore, 0);
});

test('coerceDisplayText, sanitizeAuditData, and sanitizeInvLogsMap convert Firestore Timestamps and strip render-unsafe objects', () => {
  const tsText = coerceDisplayText({ seconds: 1700000000, nanoseconds: 123000000 });
  assert.equal(typeof tsText, 'string');
  assert.ok(tsText.length > 0);
  assert.equal(coerceDisplayText({ bad: 'object' }, 'fallback'), 'fallback');

  const dirtyAudit = makeDummyAudit(
    {
      ticker: 'USD',
      name: ({ nested: true } as unknown) as string,
      lastFreshAuditAt: ({ seconds: 1700000000, nanoseconds: 0 } as unknown) as string,
      archivedAtLabel: ({ toDate: () => new Date('2026-11-15T12:00:00Z') } as unknown) as string,
      conclusion: ({ unexpected: 1 } as unknown) as string
    },
    [0, 0, 0, 0, 0, 0]
  );
  dirtyAudit.invariants[0].telemetry = ({ obj: 'bad' } as unknown) as string;
  dirtyAudit.invariants[0].receipts = [
    'Valid',
    ({ broken: true } as unknown) as string
  ];

  const sanitized = sanitizeAuditData(dirtyAudit);
  assert.equal(typeof sanitized.name, 'string');
  assert.equal(typeof sanitized.lastFreshAuditAt, 'string');
  assert.ok((sanitized.lastFreshAuditAt || '').length > 0);
  assert.equal(typeof sanitized.archivedAtLabel, 'string');
  assert.ok((sanitized.archivedAtLabel || '').length > 0);
  assert.equal(sanitized.conclusion, '');
  assert.equal(sanitized.invariants[0].telemetry, '');
  assert.deepEqual(sanitized.invariants[0].receipts, ['Valid']);

  const canonical = canonicalizeAuditsCollection({ USD: dirtyAudit });
  assert.equal(typeof canonical.USD.lastFreshAuditAt, 'string');

  const dirtyLogs = sanitizeInvLogsMap({
    'KAS:01': [
      {
        id: 'log-1',
        kind: 'CHALLENGE',
        timestamp: { seconds: 1700000000, nanoseconds: 0 },
        verdictTag: { label: 'REJECTED' },
        verdictState: 'REJECTED',
        headline: { text: 'Preserved' },
        userPrompt: { bad: 1 },
        body: 'Evidence checked.',
        sources: [{ uri: 'https://example.com', title: { nested: 1 } }]
      }
    ],
    corruptKey: 'not-an-array'
  });

  assert.equal(dirtyLogs.corruptKey, undefined);
  assert.equal(dirtyLogs['KAS:01'].length, 1);
  assert.equal(typeof dirtyLogs['KAS:01'][0].timestamp, 'string');
  assert.equal(dirtyLogs['KAS:01'][0].verdictTag, 'REJECTED');
  assert.equal(dirtyLogs['KAS:01'][0].headline, 'Preserved');
  assert.equal(dirtyLogs['KAS:01'][0].userPrompt, null);
  assert.equal(dirtyLogs['KAS:01'][0].sources[0].title, 'https://example.com');
});

