import {
  buildSecretGeniusInvariantPromptHint,
  buildSecretGeniusTemplatePromptSection
} from '../data/genesisThesisData.ts';

export interface ResolvedSecretGeniusTemplate {
  keyNames: string[];
  content: string;
}

const IGNORED_SYSTEM_KEYS = new Set([
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'APP_URL',
  'PORT',
  'NODE_ENV',
  'PATH',
  'HOME',
  'PWD',
  'ADMIN_EMAILS',
  'STRICT_CREDIT_LOCK'
]);

function isParagraphTemplateKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (IGNORED_SYSTEM_KEYS.has(key)) return false;
  if (lower.startsWith('secret_genius_paragr')) return true;
  if (lower.startsWith('secret_genius')) return true;
  if (lower.includes('genius') && (lower.includes('paragr') || lower.includes('template') || lower.includes('lexicon'))) {
    return true;
  }
  return false;
}

function keyPriority(key: string): number {
  const lower = key.toLowerCase();
  if (lower.startsWith('secret_genius_paragr')) return 0;
  if (lower.startsWith('secret_genius_lexicon')) return 1;
  if (lower.startsWith('secret_genius')) return 2;
  return 3;
}

/**
 * Resolves any user-configured Genius Paragraph Template & Lexicon secret(s)
 * from runtime environment variables (e.g. AI Studio Secrets such as
 * `Secret_Genius_paragraph_template` / `Secret_Genius_paragr*`).
 * Never exposes secret values to client bundles.
 */
export function resolveSecretGeniusTemplateFromEnv(
  env: Record<string, string | undefined> = process.env
): ResolvedSecretGeniusTemplate | null {
  const matched = Object.entries(env)
    .filter(([key, val]) => isParagraphTemplateKey(key) && typeof val === 'string' && val.trim().length > 0)
    .sort(([keyA], [keyB]) => {
      const diff = keyPriority(keyA) - keyPriority(keyB);
      return diff !== 0 ? diff : keyA.localeCompare(keyB);
    });

  if (matched.length === 0) return null;

  const seenBodies = new Set<string>();
  const keyNames: string[] = [];
  const sections: string[] = [];

  for (const [key, rawVal] of matched) {
    const trimmed = String(rawVal || '').trim();
    if (!trimmed || seenBodies.has(trimmed)) continue;
    seenBodies.add(trimmed);
    keyNames.push(key);
    sections.push(trimmed);
  }

  if (sections.length === 0) return null;

  return {
    keyNames,
    content: sections.join('\n\n')
  };
}

/**
 * Builds the authoritative Genius Paragraph Template & Lexicon block for Gemini prompts.
 * Strictly prioritizes the user's configured `Secret_Genius_*` runtime Secret when present,
 * falling back to the built-in Origin Thesis template only if no Secret is configured.
 */
export function buildAuthoritativeGeniusTemplateSection(
  env: Record<string, string | undefined> = process.env
): string {
  const secretTemplate = resolveSecretGeniusTemplateFromEnv(env);
  if (!secretTemplate) {
    return buildSecretGeniusTemplatePromptSection();
  }

  return `AUTHORITATIVE SECRET GENIUS PARAGRAPH TEMPLATE & LEXICON (MANDATORY — FOLLOW VERBATIM SO WORDING AND STRUCTURE NEVER DRIFT):
You MUST strictly derive every single "geniusParagraph" ("01" through "06"), "conclusion", and Genius forensic breakdown from the exact Secret template and lexicon provided below:
- Match its exact paragraph architecture, opening cadence, sentence structure, section sequencing, and verbatim lexicon/terminology—never substitute generic phrasing or invent a different essay structure.
- Replace asset-specific placeholders/metrics cleanly with verified live facts and rubric scores for the asset being audited while keeping every canonical phrase, transition, law, and lexicon term faithful to the template below.

--- BEGIN SECRET TEMPLATE & LEXICON ---
${secretTemplate.content}
--- END SECRET TEMPLATE & LEXICON ---`;
}

/**
 * Builds single-invariant Genius prompt guidance (REAUDIT, CHALLENGE, Genius BREAKDOWN).
 * Strictly prioritizes the runtime `Secret_Genius_*` Secret when present.
 */
export function buildSingleInvariantSecretGeniusDirective(
  invId: string,
  ticker = '',
  env: Record<string, string | undefined> = process.env
): string {
  const secretTemplate = resolveSecretGeniusTemplateFromEnv(env);
  if (!secretTemplate) {
    return buildSecretGeniusInvariantPromptHint(invId, ticker);
  }

  const normalizedId = ['01', '02', '03', '04', '05', '06'].includes(invId) ? invId : '01';
  const tickerTag = ticker ? ` for $${String(ticker).toUpperCase()}` : '';

  return `AUTHORITATIVE SECRET GENIUS PARAGRAPH TEMPLATE & LEXICON FOR INVARIANT ${normalizedId}${tickerTag} (MANDATORY — NO WORDING OR STRUCTURE DRIFT):
Apply ONLY the portion of the Secret template & lexicon below corresponding to Invariant ${normalizedId}, matching its exact phrasing, structural flow, and lexicon verbatim:

--- BEGIN SECRET TEMPLATE & LEXICON ---
${secretTemplate.content}
--- END SECRET TEMPLATE & LEXICON ---`;
}
