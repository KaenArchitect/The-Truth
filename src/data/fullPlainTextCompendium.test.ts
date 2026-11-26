import test from 'node:test';
import assert from 'node:assert/strict';
import { PRELOADED_AUDITS } from './preloadedAudits.ts';
import { buildFullPlainTextCompendium } from './fullPlainTextCompendium.ts';

test('buildFullPlainTextCompendium packs Thesis, Rubric, Gains, all 8 Time Machine epochs, and Full Genius Audits into one ultra-light plain-text document', () => {
  const txt = buildFullPlainTextCompendium('https://the-truth.ai.studio', PRELOADED_AUDITS);

  // Zero HTML markup bloat
  assert.doesNotMatch(txt, /<section\b|<table\b|<div\b|style="/i);

  // Contains all 5 master sections
  assert.match(txt, /SECTION 1 — FIRST-PRINCIPLES ORIGIN THESIS/);
  assert.match(txt, /SECTION 2 — DETERMINISTIC 6-INVARIANT GRADING RUBRIC/);
  assert.match(txt, /SECTION 3 — LIVE THERMODYNAMIC GAINS/);
  assert.match(txt, /SECTION 4 — GLOBAL TIME MACHINE CHRONOLOGICAL EPOCH SCOREBOARDS/);
  assert.match(txt, /SECTION 5 — COMPLETE ARCHIVE: FULL GENIUS & NORMIE AUDITS ACROSS ALL YEARS/);

  // Includes corrected 28 MJ deficit math in Origin Thesis
  assert.match(txt, /28 MJ DEFICIT/);
  assert.match(txt, /Claims \(40 MJ\) − W_net \(12 MJ\) ⇒ Theft \(28 MJ\)/);

  // Includes all 8 historical epochs (1913, 1971, 2000, 2008, 2016, 2020, 2024, Present)
  for (const yr of ['1913', '1971', '2000', '2008', '2016', '2020', '2024', 'Present']) {
    assert.ok(txt.includes(`[EPOCH ${yr}`), `Expected Epoch ${yr} scoreboard in plain-text compendium`);
  }

  // Includes historical phase transitions with full Genius forensic audits
  assert.match(txt, /HISTORICAL EPOCH 1913: US Dollar \(Fiat USD\) \(\$USD\) \| Grade D \(1\.8 \/ 6\.00\)/);
  assert.match(txt, /HISTORICAL EPOCH 1971: US Dollar \(Fiat USD\) \(\$USD\) \| Grade D- \(1\.1 \/ 6\.00\)/);
  assert.match(txt, /HISTORICAL EPOCH 2008: Bitcoin \(\$BTC\) \| Grade A\+ \(6\.0 \/ 6\.00\)/);
  assert.match(txt, /HISTORICAL EPOCH 2016: Ethereum \(\$ETH\) \| Grade D\+/);
  assert.match(txt, /HISTORICAL EPOCH 2024: Kaspa \(\$KAS\) \| Grade A \(5\.75 \/ 6\.00\)/);
  assert.match(txt, /EPOCH PRESENT \(2026 LIVE FRONTIER\): Kaspa \(\$KAS\) \| Grade A\+ \(6\.0 \/ 6\.00\)/);

  // Stays lightweight (< 600 KB plain text for fast single-pass LLM ingestion)
  assert.ok(
    Buffer.byteLength(txt, 'utf8') < 600 * 1024,
    `Expected ultra-light plain-text compendium < 600KB, got ${Math.round(Buffer.byteLength(txt, 'utf8') / 1024)}KB`
  );
});
