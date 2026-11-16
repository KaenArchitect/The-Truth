import test from 'node:test';
import assert from 'node:assert/strict';
import { GEMINI_SYSTEM_PROMPT } from './geminiSchemas.ts';
import { SECRET_GENIUS_PARAGRAPH_SPECS } from '../data/genesisThesisData.ts';

test('GEMINI_SYSTEM_PROMPT embeds the complete Secret Origin Thesis paragraph template and forbids self-contrasting KAS', () => {
  assert.ok(GEMINI_SYSTEM_PROMPT.includes('SECRET ORIGIN THESIS PARAGRAPH TEMPLATE & LEXICON'));
  assert.ok(GEMINI_SYSTEM_PROMPT.includes('never contrast $KAS against itself'));

  for (const spec of SECRET_GENIUS_PARAGRAPH_SPECS) {
    assert.ok(
      GEMINI_SYSTEM_PROMPT.includes(`[${spec.id} • ${spec.label}]`),
      `Expected GEMINI_SYSTEM_PROMPT to include section [${spec.id} • ${spec.label}]`
    );
    assert.ok(
      GEMINI_SYSTEM_PROMPT.includes(spec.openingFrame),
      `Expected GEMINI_SYSTEM_PROMPT to include opening frame for ${spec.id}`
    );
  }
});
