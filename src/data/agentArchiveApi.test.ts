import test from 'node:test';
import assert from 'node:assert/strict';
import { PRELOADED_AUDITS } from './preloadedAudits.ts';
import {
  answerArchiveResearchQuestion,
  buildAgentGainsReference,
  buildAgentOriginThesisReference,
  buildAgentRubricReference,
  buildArchiveComparison,
  buildOpenGraphMetaForUrl,
  findArchivedAudit,
  listArchivedAudits,
  parseDeepLinkSearchParams
} from './agentArchiveApi.ts';

const preloadedTickers = new Set(Object.keys(PRELOADED_AUDITS));

test('findArchivedAudit resolves aliases cleanly and refuses unarchived tokens', () => {
  const kas = findArchivedAudit(PRELOADED_AUDITS, 'kaspa');
  assert.equal(kas?.ticker, 'KAS');

  const gold = findArchivedAudit(PRELOADED_AUDITS, 'Gold');
  assert.equal(gold?.ticker, 'XAU');

  const stx = findArchivedAudit(PRELOADED_AUDITS, 'Stacks');
  assert.equal(stx?.ticker, 'STX');

  const usd = findArchivedAudit(PRELOADED_AUDITS, 'US Dollar');
  assert.equal(usd?.ticker, 'USD');

  const missing = findArchivedAudit(PRELOADED_AUDITS, 'UNKNOWNCOIN999');
  assert.equal(missing, null);
});

test('listArchivedAudits supports basket, category, and query filters strictly from archive', () => {
  const all = listArchivedAudits(PRELOADED_AUDITS, {}, preloadedTickers);
  assert.equal(all.length, Object.keys(PRELOADED_AUDITS).length);

  const overlays = listArchivedAudits(
    PRELOADED_AUDITS,
    { category: 'ECOSYSTEM_OVERLAY' },
    preloadedTickers
  );
  assert.deepEqual(
    overlays.map((a) => a.ticker).sort(),
    ['GEEK', 'IGRA', 'LN', 'STX', 'USD']
  );

  const failedZeroJoule = listArchivedAudits(
    PRELOADED_AUDITS,
    { basket: 'FAILED', family: 'ZERO_JOULE_BFT' },
    preloadedTickers
  );
  assert.ok(failedZeroJoule.length >= 8);
  assert.ok(failedZeroJoule.every((a) => a.isZeroJoule && a.grade === 'F'));
});

test('buildArchiveComparison computes side-by-side matrix and enforces archive-only rejection', () => {
  const comp = buildArchiveComparison(PRELOADED_AUDITS, ['KAS', 'ETH', 'SOL'], {
    mode: 'GENIUS',
    preloadedTickers
  });
  assert.equal(comp.ok, true);
  if (comp.ok) {
    assert.equal(comp.creditsUsed, 0);
    assert.equal(comp.leaderTicker, 'KAS');
    assert.equal(comp.posVsPowContrast.hasZeroJoulePos, true);
    assert.equal(comp.posVsPowContrast.hasThermodynamicPow, true);
    assert.deepEqual(comp.posVsPowContrast.zeroJouleTickers.sort(), ['ETH', 'SOL']);
    assert.deepEqual(comp.posVsPowContrast.thermodynamicTickers, ['KAS']);
    assert.equal(comp.invariantMatrix.length, 6);
    assert.equal(comp.deepLinkUrl, '/?compare=KAS%2CETH%2CSOL&mode=GENIUS');
    assert.ok(comp.cohortGainsContext.victoryMultiple);
  }

  const rejected = buildArchiveComparison(PRELOADED_AUDITS, ['KAS', 'NONEXISTENTCOIN']);
  assert.equal(rejected.ok, false);
  if (!rejected.ok) {
    assert.deepEqual(rejected.missingTickers, ['NONEXISTENTCOIN']);
    assert.match(rejected.error, /archive-only strict mode/i);
  }
});

test('answerArchiveResearchQuestion answers coin comparisons, grading consistency, M2 gains, & origin thesis from archive', () => {
  const defaultResearch = answerArchiveResearchQuestion(
    PRELOADED_AUDITS,
    'Tell me about Bitcoin vs Ethereum'
  );
  assert.equal(defaultResearch.ok, true);
  assert.equal(defaultResearch.comparison?.mode, 'GENIUS');

  const compareAns = answerArchiveResearchQuestion(
    PRELOADED_AUDITS,
    'Compare $KAS vs Solana on wartime availability',
    { mode: 'NORMIE', preloadedTickers }
  );
  assert.equal(compareAns.ok, true);
  assert.equal(compareAns.creditsUsed, 0);
  assert.equal(compareAns.comparison?.mode, 'NORMIE');
  assert.deepEqual(compareAns.matchedTickers, ['KAS', 'SOL']);
  assert.ok(compareAns.comparison);

  const consistencyAns = answerArchiveResearchQuestion(
    PRELOADED_AUDITS,
    'Is your grading rubric consistent across all assets?'
  );
  assert.equal(consistencyAns.ok, true);
  assert.equal(consistencyAns.deepLinkUrl, '/?rubric=1');
  assert.match(consistencyAns.answer, /0 mismatches \(100% mathematically consistent\)/i);

  const m2Ans = answerArchiveResearchQuestion(
    PRELOADED_AUDITS,
    'How do live gains compare against M2 money supply?'
  );
  assert.equal(m2Ans.ok, true);
  assert.equal(m2Ans.deepLinkUrl, '/?gains=1');

  const thesisAns = answerArchiveResearchQuestion(
    PRELOADED_AUDITS,
    'Explain the 100 MJ origin thesis easter egg'
  );
  assert.equal(thesisAns.ok, true);
  assert.equal(thesisAns.deepLinkUrl, '/?genesis=1');

  const posAns = answerArchiveResearchQuestion(
    PRELOADED_AUDITS,
    'Why is Proof of Stake an illusion compared to PoW?',
    { preloadedTickers }
  );
  assert.equal(posAns.ok, true);
  assert.equal(posAns.creditsUsed, 0);
  assert.match(posAns.answer, /0\.00 Joules/i);

  const unknownAns = answerArchiveResearchQuestion(PRELOADED_AUDITS, 'FAKECOIN999');
  assert.equal(unknownAns.ok, false);
  assert.match(unknownAns.answer, /not in the verified Thermodynamic Archive/i);
});

test('Pillar 2, 3, and 4 reference builders return complete deterministic payloads with 0 mismatches', () => {
  const rubric = buildAgentRubricReference(PRELOADED_AUDITS);
  assert.equal(rubric.ok, true);
  assert.equal(rubric.invariants.length, 6);
  assert.equal(rubric.consistencyVerification.allConsistent, true);
  assert.equal(rubric.consistencyVerification.mismatchCount, 0);
  assert.equal(
    rubric.consistencyVerification.verifiedCount,
    Object.keys(PRELOADED_AUDITS).length
  );
  assert.match(rubric.standardGradeCurveSummary, /A\+ \(5\.75–6\.00\)/);
  assert.match(rubric.sovereigntyCompromisedCurveSummary, /D\+ \(2\.30–6\.00/);

  const gains = buildAgentGainsReference(PRELOADED_AUDITS);
  assert.equal(gains.ok, true);
  assert.ok(gains.passedAssets.length > 0);
  assert.ok(gains.failedAssets.length > 0);
  assert.ok(gains.m2Benchmark.horizons.ALL_TIME.assets.length === 4);

  const thesis = buildAgentOriginThesisReference('GENIUS');
  assert.equal(thesis.ok, true);
  assert.equal(thesis.axiomCount, 23);
  assert.equal(thesis.chapters.length, 5);
  assert.match(thesis.axioms[6].geniusText, /100 megajoules/i);
  assert.match(thesis.axioms[16].geniusText, /Quantum Darwinism/i);
  assert.match(thesis.axioms[22].geniusText, /Dynamic Pareto-Frontier Normalization/i);
});

test('parseDeepLinkSearchParams & buildOpenGraphMetaForUrl handle all 4 canonical pillars', () => {
  const parsedCompare = parseDeepLinkSearchParams('?compare=KAS,ETH,SOL&mode=GENIUS');
  assert.equal(parsedCompare.hasDeepLink, true);
  assert.deepEqual(parsedCompare.compareTickers, ['KAS', 'ETH', 'SOL']);
  assert.equal(parsedCompare.mode, 'GENIUS');

  const parsedArchive = parseDeepLinkSearchParams('?archive=1');
  assert.equal(parsedArchive.hasDeepLink, true);
  assert.equal(parsedArchive.openArchiveModal, true);

  const parsedLab = parseDeepLinkSearchParams('?asset=SOL&lab=wartime&genesis=1');
  assert.equal(parsedLab.assetTicker, 'SOL');
  assert.equal(parsedLab.openWartimeLab, true);
  assert.equal(parsedLab.openGenesisModal, true);

  const ogCompare = buildOpenGraphMetaForUrl('/?compare=KAS,ETH&mode=GENIUS', PRELOADED_AUDITS);
  assert.match(ogCompare.title, /KAS vs ETH/);
  assert.match(ogCompare.description, /\$KAS A\+ \(6\.0\/6\.0\) vs \$ETH F \(0\.0\/6\.0\)/);

  const ogRubric = buildOpenGraphMetaForUrl('/?rubric=1', PRELOADED_AUDITS);
  assert.equal(ogRubric.urlPath, '/?rubric=1');
  assert.match(ogRubric.title, /Rubric/);

  const ogGains = buildOpenGraphMetaForUrl('/?gains=1', PRELOADED_AUDITS);
  assert.equal(ogGains.urlPath, '/?gains=1');
  assert.match(ogGains.title, /M2 Benchmark/);

  const ogAsset = buildOpenGraphMetaForUrl('/?asset=BTC', PRELOADED_AUDITS);
  assert.match(ogAsset.title, /Bitcoin \(\$BTC\): Grade B\+/);
});

