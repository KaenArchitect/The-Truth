import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PRELOADED_AUDITS } from './preloadedAudits.ts';
import { ALIAS_MAP } from './rubricSpec.ts';
import { buildSsrRootInnerHtml, injectSsrRootHtml } from './ssrSnapshotHtml.ts';

test('buildSsrRootInnerHtml renders readable semantic archive scores and rules for non-JS crawlers on /', () => {
  const html = buildSsrRootInnerHtml('/', 'https://example.com', PRELOADED_AUDITS, ALIAS_MAP);
  assert.match(html, /The Truth — Sovereign Thermodynamic Verification Engine/);
  assert.match(html, /\$KAS<\/a>/);
  assert.match(html, /6\.0 \/ 6\.00/);
  assert.match(html, /\$ETH<\/a>/);
  assert.match(html, /\$ZEC<\/a>/);
  assert.match(html, /\$XAU<\/a>/);
  assert.doesNotMatch(html, /display\s*:\s*none/i);
  assert.doesNotMatch(html, /<noscript/i);
});

test('buildSsrRootInnerHtml renders full side-by-side comparison and 6-invariant analyses for ?compare=ETH,ZEC', () => {
  const html = buildSsrRootInnerHtml(
    '/?compare=ETH,ZEC&mode=GENIUS',
    'https://example.com',
    PRELOADED_AUDITS,
    ALIAS_MAP
  );
  assert.match(html, /Side-by-Side Thermodynamic Comparison: \$ETH vs \$ZEC/);
  assert.match(html, /Ethereum \(\$ETH\) — Grade F/);
  assert.match(html, /Zcash \(\$ZEC\) — Grade/);
  assert.match(html, /Existential Sovereignty/);
  assert.match(html, /Thermodynamic Cost Floor/);
  assert.match(html, /Physics Verdict:/);
});

test('buildSsrRootInnerHtml renders single asset forensic audit for ?asset=ETH', () => {
  const html = buildSsrRootInnerHtml('/?asset=ETH', 'https://example.com', PRELOADED_AUDITS, ALIAS_MAP);
  assert.match(html, /Ethereum \(\$ETH\) — Grade F \(0\.0 \/ 6\.00\)/);
  assert.match(html, /GENIUS Forensic Audit:/);
  assert.match(html, /GRADE Conclusion:/);
});

test('injectSsrRootHtml preserves $ ticker tokens cleanly without RegExp backreference corruption', () => {
  const shell = '<!doctype html><html><body><div id="root"></div><script src="/main.js"></script></body></html>';
  const ssr = buildSsrRootInnerHtml('/?asset=KAS', 'https://example.com', PRELOADED_AUDITS, ALIAS_MAP);
  const out = injectSsrRootHtml(shell, ssr);
  assert.ok(out.includes('$KAS'));
  assert.ok(out.includes('truth-ssr-snapshot'));
  assert.ok(out.includes('<script src="/main.js"></script>'));
});

test('buildSsrRootInnerHtml renders exact live rubric grade brackets with 0 mismatches and dedicated SSR views for all 4 pillars', () => {
  const homeHtml = buildSsrRootInnerHtml('/', 'https://example.com', PRELOADED_AUDITS, ALIAS_MAP);
  // Must match live deriveGradeFromTotal brackets, never stale 5.70 / 4.20 cutoffs
  assert.match(homeHtml, /A\+ \(5\.75–6\.00\)/);
  assert.match(homeHtml, /B\+ \(4\.40–4\.89\)/);
  assert.match(homeHtml, /0 Mismatches/);
  assert.doesNotMatch(homeHtml, /5\.70–6\.00/);

  const rubricHtml = buildSsrRootInnerHtml('/?rubric=1', 'https://example.com', PRELOADED_AUDITS, ALIAS_MAP);
  assert.match(rubricHtml, /Pillar 2 — Deterministic 6-Invariant Grading Rubric/);
  assert.match(rubricHtml, /100% Mathematically Consistent/);
  assert.match(rubricHtml, /VERIFIED/);

  const gainsHtml = buildSsrRootInnerHtml('/?gains=1', 'https://example.com', PRELOADED_AUDITS, ALIAS_MAP);
  assert.match(gainsHtml, /Pillar 3 — Live Thermodynamic Gains/);
  assert.match(gainsHtml, /Macro Purchasing-Power Benchmark vs FRED US M2 Money Supply/);

  const genesisHtml = buildSsrRootInnerHtml('/?genesis=1', 'https://example.com', PRELOADED_AUDITS, ALIAS_MAP);
  assert.match(genesisHtml, /Pillar 4 — First Principles: Physics Over Consensus/);
  assert.match(genesisHtml, /100 megajoules/i);

  const archiveHtml = buildSsrRootInnerHtml('/?archive=1', 'https://example.com', PRELOADED_AUDITS, ALIAS_MAP);
  assert.match(archiveHtml, /Pillar 1 — Complete Verified Thermodynamic Archive/);
});

test('index.html hides .truth-ssr-snapshot synchronously in head for JS-enabled browsers and exposes 4-pillar alternate links', () => {
  const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
  assert.match(indexHtml, /document\.documentElement\.dataset\.js\s*=\s*['"]1['"]/);
  assert.match(indexHtml, /html,\s*body\s*\{\s*background-color:\s*#0B0C0E;\s*color:\s*#FFFFFF;\s*\}/i);
  assert.match(indexHtml, /html\[data-js=["']1["']\]\s*\.truth-ssr-snapshot\s*\{\s*display:\s*none\s*!important;\s*\}/);
  assert.match(indexHtml, /href="\/api\/agent\/rubric"/);
  assert.match(indexHtml, /href="\/api\/agent\/gains"/);
  assert.match(indexHtml, /href="\/api\/agent\/origin-thesis"/);
  assert.match(indexHtml, /<div id="root"><\/div>/);
});


