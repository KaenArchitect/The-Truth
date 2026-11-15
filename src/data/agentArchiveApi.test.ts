import test from 'node:test';
import assert from 'node:assert/strict';
import { PRELOADED_AUDITS } from './preloadedAudits.ts';
import {
  answerArchiveResearchQuestion,
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
    ['GEEK', 'IGRA', 'LN', 'STX']
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

test('answerArchiveResearchQuestion answers coin comparisons & PoS vs PoW strictly from archive', () => {
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

test('parseDeepLinkSearchParams & buildOpenGraphMetaForUrl handle compare, asset, and genesis links', () => {
  const parsedCompare = parseDeepLinkSearchParams('?compare=KAS,ETH,SOL&mode=GENIUS');
  assert.equal(parsedCompare.hasDeepLink, true);
  assert.deepEqual(parsedCompare.compareTickers, ['KAS', 'ETH', 'SOL']);
  assert.equal(parsedCompare.mode, 'GENIUS');

  const parsedLab = parseDeepLinkSearchParams('?asset=SOL&lab=wartime&genesis=1');
  assert.equal(parsedLab.assetTicker, 'SOL');
  assert.equal(parsedLab.openWartimeLab, true);
  assert.equal(parsedLab.openGenesisModal, true);

  const ogCompare = buildOpenGraphMetaForUrl('/?compare=KAS,ETH&mode=GENIUS', PRELOADED_AUDITS);
  assert.match(ogCompare.title, /KAS vs ETH/);
  assert.match(ogCompare.description, /\$KAS A\+ \(6\.0\/6\.0\) vs \$ETH F \(0\.0\/6\.0\)/);

  const ogAsset = buildOpenGraphMetaForUrl('/?asset=BTC', PRELOADED_AUDITS);
  assert.match(ogAsset.title, /Bitcoin \(\$BTC\): Grade B\+/);
});
