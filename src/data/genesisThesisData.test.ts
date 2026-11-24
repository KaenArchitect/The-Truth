import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';
import {
  GENESIS_THESIS_GENIUS_RAW_MARKDOWN,
  GENESIS_THESIS_PARAGRAPHS,
  GENESIS_THESIS_GENIUS_PARAGRAPHS,
  SECRET_GENIUS_PARAGRAPH_SPECS,
  buildSecretGeniusInvariantPromptHint,
  buildSecretGeniusTemplatePromptSection,
  getGenesisThesisParagraphs
} from './genesisThesisData.ts';

test('GENESIS_THESIS preserves verbatim equality with the 23-axiom GENIUS edition source', () => {
  const sourcePath = path.resolve(
    process.cwd(),
    'public/assets/aistudio/Paste_November_23__2026_-_10_27PM_3f459f03'
  );
  const expectedRaw = fs.readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n').trim();
  assert.equal(GENESIS_THESIS_GENIUS_RAW_MARKDOWN.trim(), expectedRaw);
});

test('GENESIS_THESIS preserves all 23 NORMIE and GENIUS axioms across 5 matching chapters', () => {
  assert.equal(GENESIS_THESIS_PARAGRAPHS.length, 23);
  assert.equal(GENESIS_THESIS_GENIUS_PARAGRAPHS.length, 23);

  assert.deepEqual(getGenesisThesisParagraphs('NORMIE'), GENESIS_THESIS_PARAGRAPHS);
  assert.deepEqual(getGenesisThesisParagraphs('GENIUS'), GENESIS_THESIS_GENIUS_PARAGRAPHS);

  const seenChapters = new Set<string>();
  for (let i = 0; i < 23; i += 1) {
    const normie = GENESIS_THESIS_PARAGRAPHS[i];
    const genius = GENESIS_THESIS_GENIUS_PARAGRAPHS[i];
    assert.equal(normie.id, i + 1);
    assert.equal(genius.id, i + 1);
    assert.equal(normie.chapter, genius.chapter);
    assert.equal(normie.partTitle, genius.partTitle);
    seenChapters.add(genius.chapter);
    assert.ok(normie.laws.length >= 1, `NORMIE section #${i + 1} must include at least one physical law/equation`);
    assert.ok(genius.laws.length >= 1, `GENIUS section #${i + 1} must include at least one physical law/equation`);
    assert.ok(normie.laws[0].law.trim().length > 5);
    assert.ok(normie.laws[0].equation.trim().length > 5);
    assert.ok(
      genius.text.length > normie.text.length,
      `Axiom #${i + 1} GENIUS length (${genius.text.length}) must exceed NORMIE length (${normie.text.length})`
    );
  }

  assert.deepEqual(Array.from(seenChapters), [
    'INVARIANTS',
    'INFLATION',
    'COSMOS',
    'BETRAYAL',
    'UNIFIED'
  ]);
});

test('GENIUS genesis thesis preserves verbatim manifesto openings, quantum observer sections, and valid KaTeX math', () => {
  assert.ok(
    GENESIS_THESIS_GENIUS_PARAGRAPHS[0].text.startsWith(
      'A sovereign monetary ledger is not a social construct, a corporate software product, or a democratic agreement'
    )
  );
  const fullGenius = GENESIS_THESIS_GENIUS_PARAGRAPHS.map(
    (p) => `${p.tag}\n${p.laws.map((l) => `${l.law} ${l.equation}`).join('\n')}\n${p.text}`
  ).join('\n\n');
  for (const term of [
    'Landauer',
    '4{,}184\\text{ Joules}',
    '100 megajoules',
    '\\$35\\text{ trillion}',
    '1923 Weimar',
    'Grand Canyon',
    'Giant Sequoia',
    '\\text{Fe}_2\\text{O}_3',
    'OBSERVER PHYSICS',
    'Quantum Darwinism',
    'Maxwell’s Demon',
    'Theorem of Thermodynamic State Persistence',
    'Paleontological Blind Spot',
    'Satoshi’s Betrayal',
    'GHOSTDAG',
    'DAGKNIGHT',
    'Dynamic Pareto-Frontier Normalization'
  ]) {
    assert.ok(
      fullGenius.toLowerCase().includes(term.toLowerCase()),
      `Expected GENIUS thesis to contain "${term}"`
    );
  }

  const displayMatches = Array.from(fullGenius.matchAll(/\$\$([\s\S]+?)\$\$/g));
  assert.equal(displayMatches.length, 6);
  for (const [, expr] of displayMatches) {
    const html = katex.renderToString(expr.trim(), { displayMode: true, throwOnError: true, strict: 'ignore' });
    assert.ok(html.includes('katex-display'));
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
