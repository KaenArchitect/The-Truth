import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAuthoritativeGeniusTemplateSection,
  buildSingleInvariantSecretGeniusDirective,
  resolveSecretGeniusTemplateFromEnv
} from './secretGeniusTemplate.ts';
import { buildGeminiSystemPrompt } from './geminiSchemas.ts';

test('resolveSecretGeniusTemplateFromEnv matches Secret_Genius_paragr* env keys regardless of suffix and injects verbatim template', () => {
  const emptyResult = resolveSecretGeniusTemplateFromEnv({
    GEMINI_API_KEY: 'abc',
    PORT: '3000'
  });
  assert.equal(emptyResult, null);

  const mockSecretBody =
    'PARAGRAPH TEMPLATE:\n1. Sovereignty opening...\nLEXICON:\nThermodynamic Cost Floor, Landauer heat wall, M = 1.0';
  const mockLexiconBody = 'EXTRA LEXICON:\nCantillon siphon, Blue Work mass';

  const resolved = resolveSecretGeniusTemplateFromEnv({
    GEMINI_API_KEY: 'abc',
    Secret_Genius_paragraph_template: mockSecretBody,
    Secret_Genius_lexicon: mockLexiconBody
  });

  assert.ok(resolved);
  assert.deepEqual(resolved.keyNames, [
    'Secret_Genius_paragraph_template',
    'Secret_Genius_lexicon'
  ]);
  assert.ok(resolved.content.includes(mockSecretBody));
  assert.ok(resolved.content.includes(mockLexiconBody));

  // Works for truncated prefix variations like Secret_Genius_paragraphs or Secret_Genius_paragr_v2
  const altResolved = resolveSecretGeniusTemplateFromEnv({
    Secret_Genius_paragr_v2: 'CUSTOM SECRET PARAGRAPH TEMPLATE'
  });
  assert.ok(altResolved);
  assert.equal(altResolved.content, 'CUSTOM SECRET PARAGRAPH TEMPLATE');

  // Authoritative prompt section uses the Secret verbatim and does NOT inject conflicting Origin Thesis opening frames
  const authSection = buildAuthoritativeGeniusTemplateSection({
    Secret_Genius_paragraph_template: mockSecretBody
  });
  assert.ok(authSection.includes('AUTHORITATIVE SECRET GENIUS PARAGRAPH TEMPLATE & LEXICON'));
  assert.ok(authSection.includes(mockSecretBody));
  assert.ok(!authSection.includes('SECRET ORIGIN THESIS PARAGRAPH TEMPLATE & LEXICON'));

  // System prompt dynamically adopts the runtime Secret template
  const systemPrompt = buildGeminiSystemPrompt({
    Secret_Genius_paragraph_template: mockSecretBody
  });
  assert.ok(systemPrompt.includes(mockSecretBody));
  assert.ok(
    systemPrompt.includes(
      'conform verbatim in opening cadence, paragraph structure, sentence rhythm, and vocabulary to the AUTHORITATIVE SECRET GENIUS PARAGRAPH TEMPLATE & LEXICON'
    )
  );
  assert.ok(!systemPrompt.includes('SECRET ORIGIN THESIS PARAGRAPH TEMPLATE & LEXICON'));

  // Single-invariant directive embeds the exact Secret template & lexicon cleanly
  const singleDirective = buildSingleInvariantSecretGeniusDirective('03', 'BTC', {
    Secret_Genius_paragraphs: mockSecretBody
  });
  assert.ok(singleDirective.includes('INVARIANT 03 for $BTC'));
  assert.ok(singleDirective.includes(mockSecretBody));
});
