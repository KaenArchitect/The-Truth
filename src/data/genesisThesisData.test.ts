import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GENESIS_THESIS_PARAGRAPHS,
  GENESIS_THESIS_GENIUS_PARAGRAPHS,
  SECRET_GENIUS_PARAGRAPH_SPECS,
  buildSecretGeniusInvariantPromptHint,
  buildSecretGeniusTemplatePromptSection,
  getGenesisThesisParagraphs
} from './genesisThesisData.ts';

test('GENESIS_THESIS preserves all 17 NORMIE and GENIUS axioms across matching chapters', () => {
  assert.equal(GENESIS_THESIS_PARAGRAPHS.length, 17);
  assert.equal(GENESIS_THESIS_GENIUS_PARAGRAPHS.length, 17);

  assert.deepEqual(getGenesisThesisParagraphs('NORMIE'), GENESIS_THESIS_PARAGRAPHS);
  assert.deepEqual(getGenesisThesisParagraphs('GENIUS'), GENESIS_THESIS_GENIUS_PARAGRAPHS);

  for (let i = 0; i < 17; i += 1) {
    const normie = GENESIS_THESIS_PARAGRAPHS[i];
    const genius = GENESIS_THESIS_GENIUS_PARAGRAPHS[i];
    assert.equal(normie.id, i + 1);
    assert.equal(genius.id, i + 1);
    assert.equal(normie.chapter, genius.chapter);
    assert.ok(normie.laws.length >= 1, `NORMIE section #${i + 1} must include at least one physical law/equation`);
    assert.ok(genius.laws.length >= 1, `GENIUS section #${i + 1} must include at least one physical law/equation`);
    assert.ok(normie.laws[0].law.trim().length > 5);
    assert.ok(normie.laws[0].equation.trim().length > 5);
    assert.ok(
      genius.text.length > normie.text.length,
      `Axiom #${i + 1} GENIUS length (${genius.text.length}) must exceed NORMIE length (${normie.text.length})`
    );
  }
});

test('GENIUS genesis thesis preserves verbatim manifesto openings and physical telemetry terms', () => {
  assert.ok(
    GENESIS_THESIS_GENIUS_PARAGRAPHS[0].text.startsWith(
      'A sovereign monetary ledger is not a social construct, a corporate software product, or a democratic agreement'
    )
  );
  const fullGenius = GENESIS_THESIS_GENIUS_PARAGRAPHS.map((p) => p.text).join('\n');
  for (const term of [
    'Landauer',
    '4,184 Joules',
    '100 megajoules',
    '20 MJ',
    '8 MJ',
    '40 MJ',
    '$35 trillion',
    '1923 Weimar',
    '16 MJ/kg',
    'Grand Canyon',
    'Giant Sequoia',
    'Fe2O3',
    'GHOSTDAG',
    'DAGKNIGHT [Roadmap / KIP-2 Proposed — In Testnet-13 Review]'
  ]) {
    assert.ok(fullGenius.includes(term), `Expected GENIUS thesis to contain "${term}"`);
  }
});

test('SECRET_GENIUS_PARAGRAPH_SPECS exposes all 7 Secret Origin Thesis templates and builds non-drifting prompt hints', () => {
  assert.deepEqual(
    SECRET_GENIUS_PARAGRAPH_SPECS.map((s) => s.id),
    ['01', '02', '03', '04', '05', '06', 'CONCLUSION']
  );

  for (const spec of SECRET_GENIUS_PARAGRAPH_SPECS) {
    assert.ok(spec.law.length > 5);
    assert.ok(spec.equation.length > 2);
    assert.ok(spec.openingFrame.length > 20);
    assert.ok(spec.requiredLexicon.length >= 5);
    assert.ok(spec.thesisAnchor.length > 200);
  }

  const promptSection = buildSecretGeniusTemplatePromptSection();
  assert.ok(promptSection.includes('SECRET ORIGIN THESIS PARAGRAPH TEMPLATE & LEXICON'));
  assert.ok(promptSection.includes('[01 • Existential Sovereignty & Entity Decoupling]'));
  assert.ok(promptSection.includes('[06 • Thermodynamic Velocity (M = 1.0)]'));
  assert.ok(promptSection.includes('[CONCLUSION • GRADE Evidence Certainty Synthesis]'));

  const btcVelHint = buildSecretGeniusInvariantPromptHint('06', 'BTC');
  assert.ok(btcVelHint.includes('INVARIANT 06 (Thermodynamic Velocity (M = 1.0))'));
  assert.ok(!btcVelHint.includes('Do NOT contrast Kaspa against itself'));

  const kasVelHint = buildSecretGeniusInvariantPromptHint('06', 'KAS');
  assert.ok(kasVelHint.includes('Do NOT contrast Kaspa against itself'));
});
