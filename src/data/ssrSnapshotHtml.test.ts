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

test('index.html hides .truth-ssr-snapshot synchronously in head for JS-enabled browsers and sets dark background before CSS loads', () => {
  const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
  assert.match(indexHtml, /document\.documentElement\.dataset\.js\s*=\s*['"]1['"]/);
  assert.match(indexHtml, /html,\s*body\s*\{\s*background-color:\s*#0B0C0E;\s*color:\s*#FFFFFF;\s*\}/i);
  assert.match(indexHtml, /html\[data-js=["']1["']\]\s*\.truth-ssr-snapshot\s*\{\s*display:\s*none\s*!important;\s*\}/);
  assert.match(indexHtml, /<div id="root"><\/div>/);
});

