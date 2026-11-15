import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI, ThinkingLevel, type GenerateContentResponse } from '@google/genai';
import {
  GEMINI_SYSTEM_PROMPT,
  GEMINI_SCHEMA,
  SINGLE_INVARIANT_SCHEMA,
  CHALLENGE_INVARIANT_SCHEMA
} from './src/server/geminiSchemas.ts';
import { PRELOADED_AUDITS } from './src/data/preloadedAudits.ts';
import {
  ALIAS_MAP,
  GRADING_RUBRIC_SPEC,
  enforceEnergyArbitrageLawOnAudit,
  formatScore,
  isResponseTextTruncated,
  isValidCompleteAuditPayload,
  normalizeAuditPayload,
  resolveCanonicalAssetTicker,
  safeParseAuditJson,
  sortAuditTickersByGrade,
  type AuditData,
  type GroundingSource,
  type RawGeminiAuditPayload
} from './src/data/rubricSpec.ts';
import {
  DAILY_NEW_FULL_PULL_LIMIT,
  TOKENIZED_COMMODITY_WRAPPER_TICKERS,
  consumeDailyPull,
  evaluateMarketScope,
  getUserDailyQuotaStatus,
  pruneStaleQuotaDays,
  refundDailyPull,
  resolvePhysicalCommodityQuery,
  resolveQuotaPrincipalKeys,
  type DailyQuotaLedger
} from './src/data/auditQuotaAndScope.ts';
import { getMarketCapDirectory } from './src/server/cmcTop150.ts';
import {
  getPersistedGainsCohort,
  resetPersistedGainsCohort,
  savePersistedGainsCohort,
  syncLivePricesAndPersistGainsCohort
} from './src/server/gainsCohortStore.ts';
import { initializeApp as initFirebaseApp, getApps as getFirebaseApps, getApp as getFirebaseApp } from 'firebase/app';
import {
  getFirestore as getClientFirestore,
  collection as fsCollection,
  query as fsQuery,
  where as fsWhere,
  getDocs as fsGetDocs
} from 'firebase/firestore';
import { classifyAuditQueryForSandbox } from './src/data/auditProvenance.ts';
import {
  MCP_ARCHIVE_TOOL_SCHEMAS,
  answerArchiveResearchQuestion,
  buildArchiveComparison,
  buildOpenGraphMetaForUrl,
  findArchivedAudit,
  listArchivedAudits,
  summarizeArchivedAudit
} from './src/data/agentArchiveApi.ts';
import { buildSsrRootInnerHtml, injectSsrRootHtml } from './src/data/ssrSnapshotHtml.ts';
import {
  verifyFirebaseBearerToken,
  type VerifiedFirebaseUser
} from './src/server/firebaseTokenVerifier.ts';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const CACHE_FILE_PATH = '/tmp/truth_audit_cache.json';
const DAILY_QUOTA_FILE_PATH = '/tmp/truth_daily_pull_ledger.json';

function isStrictCreditLockActive(): boolean {
  return String(process.env.STRICT_CREDIT_LOCK || '').toLowerCase() === 'true';
}

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// ============================================================================
// PERSISTENT SERVER CACHE + PER-IP SLIDING WINDOW RATE LIMITER
// ============================================================================
const serverAuditCache = new Map<string, AuditData>();
const serverAliasCache = new Map<string, string>();

function normalizeLookupKey(raw: string): string {
  return String(raw || '')
    .replace(/^\$/, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function indexAuditAliases(audit: AuditData): void {
  const enforced = enforceEnergyArbitrageLawOnAudit(audit);
  const tk = resolveCanonicalAssetTicker(enforced.ticker) || normalizeLookupKey(enforced.ticker);
  if (!tk) return;
  const normalizedAudit: AuditData = { ...enforced, ticker: tk };
  serverAuditCache.set(tk, normalizedAudit);
  serverAliasCache.set(tk, tk);
  const origNorm = normalizeLookupKey(audit.ticker);
  if (origNorm && origNorm !== tk) {
    serverAliasCache.set(origNorm, tk);
  }
  const nameNorm = normalizeLookupKey(normalizedAudit.name);
  if (nameNorm) serverAliasCache.set(nameNorm, tk);
  if (Array.isArray(normalizedAudit.queryAliases)) {
    normalizedAudit.queryAliases.forEach((al) => {
      const norm = normalizeLookupKey(al);
      if (norm) serverAliasCache.set(norm, tk);
    });
  }
}

function hydrateServerCacheFromDisk(): void {
  Object.values(PRELOADED_AUDITS).forEach((item) => indexAuditAliases(item));
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Record<string, AuditData>;
      if (parsed && typeof parsed === 'object') {
        Object.values(parsed).forEach((entry) => {
          if (entry && entry.ticker && Array.isArray(entry.invariants) && entry.invariants.length === 6) {
            indexAuditAliases(entry);
          }
        });
      }
    }
  } catch (err) {
    console.warn('Could not load disk cache (starting fresh):', err);
  }
}

function persistServerCacheToDisk(): void {
  try {
    const customEntries: Record<string, AuditData> = {};
    serverAuditCache.forEach((val, key) => {
      if (!PRELOADED_AUDITS[key] || val.lastFreshAuditAt) {
        customEntries[key] = val;
      }
    });
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(customEntries), 'utf8');
  } catch (err) {
    console.warn('Could not persist audit disk cache:', err);
  }
}

hydrateServerCacheFromDisk();

let lastFirestoreSyncMs = 0;
let inflightFirestoreSync: Promise<void> | null = null;
const FIRESTORE_SYNC_TTL_MS = 5 * 60 * 1000;

async function syncFirestoreArchivedAuditsToCache(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastFirestoreSyncMs < FIRESTORE_SYNC_TTL_MS) return;
  if (inflightFirestoreSync) return inflightFirestoreSync;

  inflightFirestoreSync = (async () => {
    try {
      const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (!fs.existsSync(cfgPath)) return;
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as {
        projectId?: string;
        appId?: string;
        apiKey?: string;
        authDomain?: string;
        firestoreDatabaseId?: string;
      };
      if (!cfg.projectId || !cfg.apiKey) return;
      const fbApp = getFirebaseApps().length ? getFirebaseApp() : initFirebaseApp(cfg);
      const db = getClientFirestore(fbApp, cfg.firestoreDatabaseId || '(default)');
      const snap = await Promise.race([
        fsGetDocs(fsQuery(fsCollection(db, 'archived_audits'), fsWhere('isArchived', '==', true))),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore archive sync timeout')), 4000)
        )
      ]);
      snap.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        if (!data || !data.ticker || !Array.isArray(data.invariants) || data.invariants.length < 6) {
          return;
        }
        const tk = normalizeLookupKey(String(data.ticker));
        if (!tk) return;
        const candidate = {
          ...(data as unknown as AuditData),
          ticker: tk,
          isArchived: true
        };
        indexAuditAliases(candidate);
      });
      lastFirestoreSyncMs = Date.now();
    } catch {
      // Non-fatal: preloaded benchmarks + local disk cache remain immediately available
    } finally {
      inflightFirestoreSync = null;
    }
  })();

  return inflightFirestoreSync;
}

void syncFirestoreArchivedAuditsToCache(true);

function lookupCachedAudit(rawQuery: string): AuditData | null {
  const norm = normalizeLookupKey(rawQuery);
  if (!norm) return null;
  if (serverAuditCache.has(norm)) return serverAuditCache.get(norm) || null;
  const canonical = resolveCanonicalAssetTicker(norm);
  if (canonical && serverAuditCache.has(canonical)) {
    return serverAuditCache.get(canonical) || null;
  }
  const staticAlias = ALIAS_MAP[norm];
  if (staticAlias && serverAuditCache.has(staticAlias)) {
    return serverAuditCache.get(staticAlias) || null;
  }
  const dynAlias = serverAliasCache.get(norm);
  if (dynAlias && serverAuditCache.has(dynAlias)) {
    return serverAuditCache.get(dynAlias) || null;
  }
  return null;
}

interface RateBucket {
  timestamps: number[];
}

const rateBuckets = new Map<string, RateBucket>();

function checkIpRateLimit(
  req: Request,
  bucketKey: 'audit' | 'invariant',
  limit: number,
  windowMs = 60 * 60 * 1000
): { allowed: boolean; retryAfterSec: number } {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || req.ip || req.socket.remoteAddress || 'unknown';
  const key = `${bucketKey}:${ip}`;
  const now = Date.now();
  const bucket = rateBuckets.get(key) || { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    rateBuckets.set(key, bucket);
    return { allowed: false, retryAfterSec };
  }

  bucket.timestamps.push(now);
  rateBuckets.set(key, bucket);
  return { allowed: true, retryAfterSec: 0 };
}

// ============================================================================
// HARD DAILY FULL-PULL QUOTA LEDGER (2 NEW FULL PULLS / USER / UTC DAY)
// ============================================================================
let dailyQuotaLedger: DailyQuotaLedger = {};

function hydrateDailyQuotaLedger(): void {
  try {
    if (fs.existsSync(DAILY_QUOTA_FILE_PATH)) {
      const raw = fs.readFileSync(DAILY_QUOTA_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as DailyQuotaLedger;
      if (parsed && typeof parsed === 'object') {
        dailyQuotaLedger = pruneStaleQuotaDays(parsed);
      }
    }
  } catch (err) {
    console.warn('Could not load daily quota ledger (starting fresh):', err);
    dailyQuotaLedger = {};
  }
}

function persistDailyQuotaLedger(): void {
  try {
    dailyQuotaLedger = pruneStaleQuotaDays(dailyQuotaLedger);
    fs.writeFileSync(DAILY_QUOTA_FILE_PATH, JSON.stringify(dailyQuotaLedger), 'utf8');
  } catch (err) {
    console.warn('Could not persist daily quota ledger:', err);
  }
}

hydrateDailyQuotaLedger();

// Warm Top-150 market cap directory on startup in the background (0 Gemini credits)
void getMarketCapDirectory().catch(() => {});

interface ResolvedServerPrincipal {
  primaryKey: string;
  allKeys: string[];
  normalizedIp: string;
  verifiedUser: VerifiedFirebaseUser | null;
  isAdmin: boolean;
  verifiedEmail: string | null;
}

async function resolveVerifiedRequestPrincipal(
  req: Request,
  body?: { userId?: unknown; clientId?: unknown }
): Promise<ResolvedServerPrincipal> {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || req.ip || req.socket.remoteAddress || 'unknown';
  const verifiedUser = await verifyFirebaseBearerToken(req.headers.authorization);
  const rawUserId =
    verifiedUser?.uid ||
    (typeof body?.userId === 'string' && body.userId) ||
    (typeof req.headers['x-truth-user-id'] === 'string' && req.headers['x-truth-user-id']) ||
    (typeof req.query.userId === 'string' && req.query.userId) ||
    null;
  const clientId =
    (typeof body?.clientId === 'string' && body.clientId) ||
    (typeof req.headers['x-truth-client-id'] === 'string' && req.headers['x-truth-client-id']) ||
    (typeof req.query.clientId === 'string' && req.query.clientId) ||
    null;
  const keys = resolveQuotaPrincipalKeys({ userId: rawUserId, clientId, ip });
  return {
    ...keys,
    verifiedUser,
    isAdmin: Boolean(verifiedUser?.isAdmin),
    verifiedEmail: verifiedUser?.email || null
  };
}

async function requireVerifiedAdmin(
  req: Request,
  res: Response
): Promise<VerifiedFirebaseUser | null> {
  const verifiedUser = await verifyFirebaseBearerToken(req.headers.authorization);
  if (!verifiedUser) {
    res.status(401).json({
      error: 'Authentication required. Sign in with your verified Google Admin account.'
    });
    return null;
  }
  if (!verifiedUser.isAdmin) {
    res.status(403).json({
      error: 'Admin privileges required.'
    });
    return null;
  }
  return verifiedUser;
}

// ============================================================================
// GROUNDING METADATA + RETRY HELPERS
// ============================================================================
function extractGroundingSources(
  response: GenerateContentResponse | undefined,
  maxSources = 6
): GroundingSource[] {
  const candidate = response?.candidates?.[0];
  const metadata = candidate?.groundingMetadata as
    | {
        groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
        groundingAttributions?: Array<{ web?: { uri?: string; title?: string } }>;
      }
    | undefined;

  const combined: Array<{ uri?: string; title?: string }> = [
    ...(metadata?.groundingChunks || []).map((c) => ({ uri: c?.web?.uri, title: c?.web?.title })),
    ...(metadata?.groundingAttributions || []).map((a) => ({
      uri: a?.web?.uri,
      title: a?.web?.title
    }))
  ];

  const seen = new Set<string>();
  const unique: GroundingSource[] = [];
  for (const item of combined) {
    if (item.uri && item.title && !seen.has(item.uri)) {
      seen.add(item.uri);
      unique.push({ uri: item.uri, title: item.title });
      if (unique.length >= maxSources) break;
    }
  }
  return unique;
}

async function withBackoff<T>(fn: () => Promise<T>): Promise<T> {
  const delays = [1000, 2000, 4000];
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const status = Number((err as { status?: number })?.status || 0);
      if (status >= 400 && status < 500 && status !== 429 && attempt >= 1) {
        throw err;
      }
      if (attempt < delays.length) {
        await new Promise((r) => setTimeout(r, delays[attempt]));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Gemini API request failed.');
}

function formatGeminiErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/API_KEY_INVALID|API key not valid|401|PERMISSION_DENIED/i.test(msg)) {
    return 'Gemini API key rejected or missing — check Settings > Secrets.';
  }
  if (/RESOURCE_EXHAUSTED|429/i.test(msg)) {
    return 'Gemini API rate limit reached — please wait a moment or check quota in Settings > Secrets.';
  }
  return msg || 'Gemini API request failed.';
}

async function fetchFreshGroundedWebIntel(
  ai: GoogleGenAI,
  targetQuery: string,
  existingBaseline: AuditData | null
): Promise<{ intelText: string; sources: GroundingSource[] }> {
  const groundingQuery = `Perform an exhaustive forensic engineering & GitHub intelligence pull up through November 2026 for "${targetQuery}"${
    existingBaseline ? ` (${existingBaseline.name} / $${existingBaseline.ticker})` : ''
  }. Gather exact, verifiable receipts across all 6 physical invariants:
1. Genesis & Sovereignty: Exact premine/ICO/VC/foundation token splits, coinbase developer taxes/lockboxes, founding corporations, governance wars, and bridge/admin multisig keys.
2. Consensus & Cost Floor: Exact LIVE active mainnet block production mechanism (PoW hash algorithm, ASIC vs CPU share, block subsidy, max supply cap, fee burns/clawbacks—explicitly distinguishing live mainnet consensus from unactivated future proposals!).
3. Immutability: Exact GitHub repositories & source/config flags, header/PoPoW sync vs S3/snapshot sync, rolling finality checkpoints or max-reorg depth caps, node pruning horizon, and dated inflation/counterfeiting CVEs or ZK circuit soundness bugs.
4. Wartime Partition & Outages: Exact difficulty adjustment window or BFT supermajority halt threshold, behavior on >2h cable cut & resplice, and dated mainnet blackouts, stalls, chain splits, or bridge freezes.
5. State Topology: UTXO vs shared-account VM, covenant/script opcodes, unprunable nullifier/key-image bloat, mandatory state rent/reserves, and native Freeze/Clawback/DenyList hooks.
6. Velocity: Exact block interval (seconds & BPS), block size/weight cap, real non-vote L1 TPS, wallet spend locks, and linear orphan waste or indexer/attester lag.`;

  try {
    const response = await withBackoff(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: groundingQuery,
        config: {
          systemInstruction:
            'You are a forensic cryptocurrency codebase and physical commodity researcher. Produce a detailed, high-density 6-section technical dossier packed with exact GitHub repository names, config constants, genesis/supply numbers, upgrade heights, CVEs, and dated incident postmortems from live Google Search results. Clearly separate live mainnet consensus from unactivated roadmap proposals.',
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          maxOutputTokens: 16384
        }
      })
    );

    const intelText = (response.text || '').trim();
    const sources = extractGroundingSources(response, 6);
    return { intelText, sources };
  } catch (err) {
    console.warn('Stage 0 Google Search grounding skipped/failed:', err);
    return { intelText: '', sources: [] };
  }
}

async function fetchSingleInvariantWebIntel(
  ai: GoogleGenAI,
  targetAudit: AuditData,
  invObj: { id: string; title?: string; shortName?: string; telemetry: string },
  customClaim = ''
): Promise<{ intelText: string; sources: GroundingSource[] }> {
  const invTitle = invObj.title || invObj.shortName || `Invariant ${invObj.id}`;
  const focusPrompt = customClaim
    ? `Fact-check this specific user claim/evidence regarding ${targetAudit.name} ($${targetAudit.ticker}) concerning ${invTitle}: "${customClaim}". Verify exact GitHub commits, PRs, consensus parameters, mainnet status (live active mainnet vs unactivated proposal), CVEs, or postmortems up through November 2026.`
    : `Pull fresh engineering, GitHub repository, consensus parameter, and live mainnet intelligence up through November 2026 for ${targetAudit.name} ($${targetAudit.ticker}) strictly focused on ${invTitle} (Current telemetry: ${invObj.telemetry}). Separate live active mainnet behavior from unactivated proposals.`;

  try {
    const response = await withBackoff(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: focusPrompt,
        config: {
          systemInstruction:
            'You are a concise forensic cryptocurrency codebase and commodity researcher. Return dense, verifiable facts citing exact repository names, config constants, block heights, dates, and live mainnet status.',
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          maxOutputTokens: 16384
        }
      })
    );

    return {
      intelText: (response.text || '').trim(),
      sources: extractGroundingSources(response, 4)
    };
  } catch (err) {
    console.warn('Single-invariant grounding skipped/failed:', err);
    return { intelText: '', sources: [] };
  }
}

function buildFullAuditPrompt(
  targetQuery: string,
  intelText: string,
  existingBaseline: AuditData | null
): string {
  const baselineContext = existingBaseline
    ? `\nEXISTING VERIFIED TECHNICAL EVIDENCE FOR $${existingBaseline.ticker} (${existingBaseline.name}):
Architecture: ${existingBaseline.architecture} | Consensus Family: ${existingBaseline.consensusFamily}
Verified Codebase & Mainnet Receipts: ${existingBaseline.invariants
        .flatMap((i) => i.receipts || [])
        .join(' • ')}.
Verified Technical Evidence Per Invariant:
${existingBaseline.invariants
  .map(
    (i) =>
      `[${i.id} ${i.shortName} (${i.telemetry})]: ${(i.geniusParagraph || i.paragraph).replace(
        /\(\d+\.\d+\s*\/\s*1\.00?\)/g,
        ''
      )}`
  )
  .join('\n')}

RE-AUDIT CALIBRATION & DEPTH RULES:
1. DO NOT blindly copy prior scores—independently grade EVERY single invariant ("01" through "06") strictly against the canonical quantitative rubric brackets in your system instructions using both verified codebase facts and newly retrieved 2026 intelligence!
2. Set hasGenesisPremineOrVcOrIco = true if this specific asset pre-minted/pre-allocated genesis or token supply to founders, foundations, ICO buyers, or VCs; set hasProtocolDevTaxOrKillSwitch = true if protocol consensus enforces a mandatory coinbase dev/treasury tax or on-chain asset freeze/kill-switch.
3. NEVER downgrade an active Proof-of-Work hardware mainnet chain (E > 0) into ZERO_JOULE_BFT or 0.00 Cost Floor merely because of unactivated hybrid-PoS research proposals—evaluate live active mainnet block production today!
4. Every single invariant's "geniusParagraph" (01 through 06) MUST be a full, unabridged 180–240 word forensic deep-dive (never summarize into short 2-3 sentence blurbs!).\n`
    : '';

  const freshIntelContext = intelText
    ? `\nLIVE GOOGLE SEARCH GROUNDED INTELLIGENCE (RETRIEVED TODAY):\n${intelText}\n`
    : '';

  return `Run a complete, rigorous 6-Invariant Thermodynamic Audit on the cryptocurrency network, token, Layer-2 overlay/channel protocol, OR physical metal/commodity: "${targetQuery}".
${baselineContext}${freshIntelContext}
IMPORTANT:
- CRITICAL PHYSICAL METAL / ELEMENT RULE: All physical Periodic Table metals and elements (such as Gold/Au/XAU, Silver/Ag/XAG, Copper/Cu/XCU, Platinum/Pt/XPT, Palladium/Pd/XPD, Titanium/Ti, Tungsten/W, Rhodium/Rh, Uranium/U, Nickel/Ni, Aluminum/Al, Zinc/Zn, Lithium/Li, etc.) are PRIMARY LAYER-1 substrates ("PHYSICAL_COMMODITY"). Always set consensusFamily = "PHYSICAL_COMMODITY", isUpperLayerOverlayOrChannel = false, hasGenesisPremineOrVcOrIco = false, and hasProtocolDevTaxOrKillSwitch = false—NEVER classify a physical metal as an overlay or tokenized wrapper unless the user explicitly requested a custodial/wrapped token like PAXG or XAUT. Always set "ticker" to the canonical short symbol ("CU" for Copper, "XAU" for Gold, "XAG" for Silver, "XPT" for Platinum, "XPD" for Palladium, "BTC" for Bitcoin, etc.) rather than a full word. Note: "CU" / "XCU" means Physical Copper (Cu-29).
- Classify consensusFamily strictly as "BLOCKDAG_POW", "LINEAR_POW", "PHYSICAL_COMMODITY", or "ZERO_JOULE_BFT" based on LIVE ACTIVE MAINNET consensus today (never classify live hardware PoW as ZERO_JOULE_BFT due to unactivated roadmap proposals, and NEVER classify a payment-channel mesh or state-channel overlay over sequential PoW as BLOCKDAG_POW—set isUpperLayerOverlayOrChannel = true and consensusFamily = "LINEAR_POW"!).
- CARRIER-SUBORDINATED VELOCITY LAW (M_overlay < M_carrier < 1.0): Off-chain HTLC/PTLC channel signature exchanges burn 0.0 Joules (deferred IOUs, NOT M = 1.0 Proof-of-Work!). If "${targetQuery}" is a Layer-2 payment-channel network, state-channel protocol, rollup, or inscription overlay, set isUpperLayerOverlayOrChannel = true, set carrierLayerOneVelocityCap to its base Layer-1 carrier's Velocity score (e.g., 0.20 for Bitcoin, 1.00 for Kaspa), and score Invariant 06 STRICTLY BELOW its sequential L1 carrier (0.05–0.18, e.g., 0.15)!
- Strictly obey the project-agnostic quantitative rubric brackets in your system instructions!
- MANDATORY LENGTH & FORENSIC RIGOR FOR ALL 6 INVARIANTS ("01" through "06"):
  * "paragraph": Concise, clear 55–75 word Normie Mode explanation.
  * "geniusParagraph": Uncompromising, exhaustive 180–240 word (minimum 1,000 characters EACH) Genius Mode forensic audit paragraph citing exact GitHub repositories, source files/config flags, genesis/supply/tax numbers, mathematical consensus/retarget/quorum/reorg formulas, wartime partition + cable resplice mechanics, and dated CVEs/outage postmortems (ending with a simple dash "-").
  * "conclusion": Comprehensive 130–180 word GRADE Evidence Certainty synthesis enumerating key codebase/mainnet receipts, all 6 individual invariant scores (01 through 06), total score out of 6.00, and terminal compliance grade.
Examine in exact order (01 through 06) and put a simple dash "-" at the end of each invariant's paragraph/geniusParagraph and as the last element of each invariant's receipts array ("-") to separate the invariants:
1. Existential Sovereignty & Entity Decoupling -
2. Thermodynamic Cost Floor E > 0 -
3. Historical Immutability & Arrow of Time -
4. Dynamic Availability (Wartime Partition & Cable Resplice) -
5. State Machine Topology -
6. Thermodynamic Velocity M = 1.0 -
Return strict valid JSON matching the schema with all 6 complete invariants ("01" through "06").`;
}

// ============================================================================
// EXPRESS APPLICATION & ROUTES
// ============================================================================
async function createApp(): Promise<express.Express> {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      strictCreditLock: isStrictCreditLockActive(),
      cachedCount: serverAuditCache.size,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  app.get('/api/config', async (req: Request, res: Response) => {
    const principal = await resolveVerifiedRequestPrincipal(req);
    const dailyQuota = getUserDailyQuotaStatus(
      dailyQuotaLedger,
      principal.allKeys,
      Date.now(),
      DAILY_NEW_FULL_PULL_LIMIT,
      principal.isAdmin
    );
    res.json({
      strictCreditLock: isStrictCreditLockActive() && !principal.isAdmin,
      isAdmin: principal.isAdmin,
      adminEmail: principal.isAdmin ? principal.verifiedEmail : null,
      dailyPullLimit: DAILY_NEW_FULL_PULL_LIMIT,
      unrestrictedMetalsAndNetworks: true,
      dailyQuota,
      models: {
        audit: 'gemini-4-hydrogen',
        reaudit: 'gemini-4-hydrogen',
        breakdown: 'gemini-4-hydrogen',
        challenge: 'gemini-4-carbon'
      },
      donate: {
        kasAddress: (process.env.DONATE_KAS_ADDRESS || '').trim(),
        btcAddress: (process.env.DONATE_BTC_ADDRESS || '').trim(),
        ethAddress: (process.env.DONATE_ETH_ADDRESS || '').trim(),
        solAddress: (process.env.DONATE_SOL_ADDRESS || '').trim()
      }
    });
  });

  app.get('/api/quota', async (req: Request, res: Response) => {
    const principal = await resolveVerifiedRequestPrincipal(req);
    const dailyQuota = getUserDailyQuotaStatus(
      dailyQuotaLedger,
      principal.allKeys,
      Date.now(),
      DAILY_NEW_FULL_PULL_LIMIT,
      principal.isAdmin
    );
    res.json({
      isAdmin: principal.isAdmin,
      adminEmail: principal.isAdmin ? principal.verifiedEmail : null,
      dailyPullLimit: DAILY_NEW_FULL_PULL_LIMIT,
      unrestrictedMetalsAndNetworks: true,
      dailyQuota
    });
  });

  app.post('/api/admin/clear-quota', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;
    dailyQuotaLedger = {};
    rateBuckets.clear();
    persistDailyQuotaLedger();
    const principal = await resolveVerifiedRequestPrincipal(req);
    const dailyQuota = getUserDailyQuotaStatus(
      dailyQuotaLedger,
      principal.allKeys,
      Date.now(),
      DAILY_NEW_FULL_PULL_LIMIT,
      true
    );
    res.json({
      ok: true,
      clearedBy: admin.email,
      dailyQuota
    });
  });

  app.post('/api/admin/purge-cache', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;
    serverAuditCache.clear();
    serverAliasCache.clear();
    Object.values(PRELOADED_AUDITS).forEach((item) => indexAuditAliases(item));
    try {
      if (fs.existsSync(CACHE_FILE_PATH)) {
        fs.unlinkSync(CACHE_FILE_PATH);
      }
    } catch {
      // Non-fatal
    }
    await syncFirestoreArchivedAuditsToCache(true);
    persistServerCacheToDisk();
    res.json({
      ok: true,
      clearedBy: admin.email,
      cachedCount: serverAuditCache.size
    });
  });

  app.post('/api/admin/delete-audit', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;
    const body = (req.body || {}) as { ticker?: unknown };
    const rawTicker = typeof body.ticker === 'string' ? body.ticker : '';
    const tk = resolveCanonicalAssetTicker(rawTicker) || normalizeLookupKey(rawTicker);
    if (!tk) {
      res.status(400).json({ error: 'Valid asset ticker is required.' });
      return;
    }

    for (const [aliasKey, mappedTk] of serverAliasCache.entries()) {
      if (mappedTk === tk) {
        serverAliasCache.delete(aliasKey);
      }
    }

    if (PRELOADED_AUDITS[tk]) {
      indexAuditAliases(PRELOADED_AUDITS[tk]);
    } else {
      serverAuditCache.delete(tk);
    }
    persistServerCacheToDisk();
    res.json({
      ok: true,
      deletedBy: admin.email,
      ticker: tk,
      restoredBaseline: Boolean(PRELOADED_AUDITS[tk])
    });
  });

  app.get('/api/cache', (_req: Request, res: Response) => {
    const customAudits: Record<string, AuditData> = {};
    serverAuditCache.forEach((val, key) => {
      if (!PRELOADED_AUDITS[key] || val.lastFreshAuditAt) {
        customAudits[key] = val;
      }
    });
    res.json({ audits: customAudits });
  });

  app.get('/api/gains-cohort', (_req: Request, res: Response) => {
    const record = getPersistedGainsCohort();
    res.json({ record });
  });

  app.put('/api/gains-cohort', (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      passed?: unknown[];
      failed?: unknown[];
      sourceLabel?: string;
      isCustomized?: boolean;
    };
    if (!Array.isArray(body.passed) || !Array.isArray(body.failed)) {
      res.status(400).json({ error: 'Both passed and failed arrays are required.' });
      return;
    }
    const saved = savePersistedGainsCohort({
      passed: body.passed as never,
      failed: body.failed as never,
      sourceLabel: typeof body.sourceLabel === 'string' ? body.sourceLabel : 'User-Updated Cohort Vault',
      isCustomized: body.isCustomized !== undefined ? Boolean(body.isCustomized) : true
    });
    res.json({ record: saved });
  });

  app.post('/api/gains-cohort/sync', async (req: Request, res: Response) => {
    try {
      const body = (req.body || {}) as { spotOverrides?: Record<string, number> };
      const result = await syncLivePricesAndPersistGainsCohort(body.spotOverrides);
      res.json(result);
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Failed to sync live prices.'
      });
    }
  });

  app.post('/api/gains-cohort/reset', (_req: Request, res: Response) => {
    const record = resetPersistedGainsCohort();
    res.json({ record });
  });

  // POST /api/audit — SSE streaming 6-invariant grounded audit on gemini-4-hydrogen
  app.post('/api/audit', async (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      query?: string;
      existingBaseline?: AuditData | null;
      bypassCache?: boolean;
      sandbox?: boolean;
      userId?: string | null;
      clientId?: string | null;
    };

    const rawQuery = String(body.query || '').trim();
    if (!rawQuery || rawQuery.length > 120) {
      res.status(400).json({ error: 'Query must be between 1 and 120 characters.' });
      return;
    }

    const principal = await resolveVerifiedRequestPrincipal(req, body);
    const existingBaseline =
      body.existingBaseline && Array.isArray(body.existingBaseline.invariants)
        ? body.existingBaseline
        : null;
    const bypassCache = Boolean(body.bypassCache) || Boolean(existingBaseline);
    const sandboxClassification = classifyAuditQueryForSandbox(
      rawQuery,
      '',
      Boolean(body.sandbox),
      PRELOADED_AUDITS[normalizeLookupKey(rawQuery)]
        ? new Set([normalizeLookupKey(rawQuery)])
        : new Set()
    );
    const isSandboxRequest = Boolean(body.sandbox) || (!existingBaseline && sandboxClassification.isSandbox);

    if (!bypassCache) {
      const hit = lookupCachedAudit(rawQuery);
      if (hit) {
        const currentQuota = getUserDailyQuotaStatus(
          dailyQuotaLedger,
          principal.allKeys,
          Date.now(),
          DAILY_NEW_FULL_PULL_LIMIT,
          principal.isAdmin
        );
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.write(
          `data: ${JSON.stringify({
            type: 'done',
            audit: hit,
            sources: hit.freshSources || hit.sources || [],
            cachedHit: true,
            sandbox: Boolean(body.sandbox),
            quota: currentQuota
          })}\n\n`
        );
        res.end();
        return;
      }
    }

    if (isStrictCreditLockActive() && !principal.isAdmin) {
      res.status(423).json({
        error: 'STRICT_CREDIT_LOCK is active on the server. Cached and archived lookups remain unlimited.'
      });
      return;
    }

    // 1) UNRESTRICTED METALS & NETWORKS SCOPE VALIDATION (only rejects empty/invalid inputs)
    const scopeQuery = existingBaseline ? existingBaseline.ticker || rawQuery : rawQuery;
    const marketDir = await getMarketCapDirectory();
    const scopeResult = evaluateMarketScope({
      query: scopeQuery,
      cachedAuditHit: false,
      isExplicitReaudit: Boolean(existingBaseline),
      marketEntries: marketDir.entries
    });

    if (!scopeResult.allowed) {
      const currentQuota = getUserDailyQuotaStatus(
        dailyQuotaLedger,
        principal.allKeys,
        Date.now(),
        DAILY_NEW_FULL_PULL_LIMIT,
        principal.isAdmin
      );
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          audit: null,
          outOfScope: true,
          maxRank: scopeResult.maxRank,
          detectedRank: scopeResult.rank,
          matchedSymbol: scopeResult.matchedSymbol,
          matchedName: scopeResult.matchedName,
          message: scopeResult.message,
          quota: currentQuota
        })}\n\n`
      );
      res.end();
      return;
    }

    // 2) HARD DAILY LIMIT: MAX 2 NEW FULL PULLS PER USER PER UTC DAY (UNLIMITED FOR VERIFIED ADMIN)
    const quotaAttempt = consumeDailyPull(
      dailyQuotaLedger,
      principal.allKeys,
      Date.now(),
      DAILY_NEW_FULL_PULL_LIMIT,
      principal.isAdmin
    );
    if (!quotaAttempt.allowed) {
      res.status(429).json({
        error: `Daily limit of ${DAILY_NEW_FULL_PULL_LIMIT} new full pulls reached for today. Cached & archived assets remain unlimited (0 credits). Resets at 00:00 UTC.`,
        dailyLimitReached: true,
        quota: quotaAttempt.status
      });
      return;
    }

    if (!principal.isAdmin) {
      const rate = checkIpRateLimit(req, 'audit', 12);
      if (!rate.allowed) {
        res.status(429).json({
          error: `Rate limit reached for live full audits. Please retry in ${rate.retryAfterSec}s.`
        });
        return;
      }
    }

    let ai: GoogleGenAI;
    try {
      ai = createGeminiClient();
    } catch (err) {
      res.status(503).json({ error: formatGeminiErrorMessage(err) });
      return;
    }

    // Commit daily quota slot only once we are actually invoking Gemini (never consume ledger for admin)
    if (!principal.isAdmin) {
      dailyQuotaLedger = quotaAttempt.nextLedger;
      persistDailyQuotaLedger();
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendEvent = (payload: Record<string, unknown>) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    };

    try {
      const commodityMatch = !existingBaseline
        ? resolvePhysicalCommodityQuery(rawQuery, normalizeLookupKey(rawQuery))
        : null;
      const isRawPhysicalMetalQuery = Boolean(
        commodityMatch && !TOKENIZED_COMMODITY_WRAPPER_TICKERS.has(commodityMatch.symbol)
      );
      const querySubject = existingBaseline
        ? `${existingBaseline.name} (${existingBaseline.ticker})`
        : isRawPhysicalMetalQuery && commodityMatch
        ? `${commodityMatch.name} (${commodityMatch.symbol})`
        : rawQuery;

      const freshBundle = await fetchFreshGroundedWebIntel(ai, querySubject, existingBaseline);
      sendEvent({
        type: 'intel',
        sources: freshBundle.sources,
        hasIntel: Boolean(freshBundle.intelText)
      });

      const userPrompt = buildFullAuditPrompt(querySubject, freshBundle.intelText, existingBaseline);

      let parsed: RawGeminiAuditPayload | null = null;
      let accumulatedJson = '';

      try {
        const stream = await withBackoff(() =>
          ai.models.generateContentStream({
            model: 'gemini-4-hydrogen',
            contents: userPrompt,
            config: {
              systemInstruction: GEMINI_SYSTEM_PROMPT,
              responseMimeType: 'application/json',
              responseSchema: GEMINI_SCHEMA,
              thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
              maxOutputTokens: 32768
            }
          })
        );

        for await (const chunk of stream) {
          const text = chunk.text || '';
          if (text) {
            accumulatedJson += text;
            sendEvent({ type: 'chunk', text });
          }
        }

        if (accumulatedJson.trim()) {
          const candidateParsed = safeParseAuditJson<RawGeminiAuditPayload>(accumulatedJson);
          if (isValidCompleteAuditPayload(candidateParsed)) {
            parsed = candidateParsed;
          }
        }
      } catch (streamErr) {
        console.warn('Streaming audit fell back to generateContent:', streamErr);
      }

      if (!parsed) {
        const fallbackResp = await withBackoff(() =>
          ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: userPrompt,
            config: {
              systemInstruction: GEMINI_SYSTEM_PROMPT,
              responseMimeType: 'application/json',
              responseSchema: GEMINI_SCHEMA,
              thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
              maxOutputTokens: 32768
            }
          })
        );
        const textPart = (fallbackResp.text || '').trim();
        if (textPart) {
          sendEvent({ type: 'chunk', text: textPart });
          parsed = safeParseAuditJson<RawGeminiAuditPayload>(textPart);
        }
      }

      if (!parsed || !Array.isArray(parsed.invariants) || parsed.invariants.length < 6) {
        throw new Error('Incomplete 6-invariant payload returned — please retry.');
      }

      const normalizedQuery = normalizeLookupKey(rawQuery);
      const previousScore = existingBaseline ? Number(existingBaseline.totalScore) : null;
      const cleanTickerGuess = existingBaseline?.ticker || normalizedQuery.slice(0, 8);
      const builtAudit = normalizeAuditPayload(
        parsed,
        rawQuery,
        normalizedQuery,
        existingBaseline,
        freshBundle.sources,
        previousScore,
        Boolean(PRELOADED_AUDITS[cleanTickerGuess])
      );

      if (!isSandboxRequest) {
        indexAuditAliases(builtAudit);
        persistServerCacheToDisk();
      }

      const updatedQuota = getUserDailyQuotaStatus(
        dailyQuotaLedger,
        principal.allKeys,
        Date.now(),
        DAILY_NEW_FULL_PULL_LIMIT,
        principal.isAdmin
      );
      sendEvent({
        type: 'done',
        audit: builtAudit,
        sources: freshBundle.sources,
        cachedHit: false,
        sandbox: isSandboxRequest,
        quota: updatedQuota
      });
      res.end();
    } catch (err) {
      // Refund daily quota slot if upstream audit failed before delivering a valid payload
      if (!principal.isAdmin) {
        dailyQuotaLedger = refundDailyPull(dailyQuotaLedger, principal.allKeys);
        persistDailyQuotaLedger();
      }
      sendEvent({
        type: 'error',
        message: formatGeminiErrorMessage(err),
        quota: getUserDailyQuotaStatus(
          dailyQuotaLedger,
          principal.allKeys,
          Date.now(),
          DAILY_NEW_FULL_PULL_LIMIT,
          principal.isAdmin
        )
      });
      res.end();
    }
  });

  // POST /api/invariant — Low-token single-invariant REAUDIT (hydrogen), BREAKDOWN (hydrogen), CHALLENGE (carbon)
  app.post('/api/invariant', async (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      mode?: 'REAUDIT' | 'CHALLENGE' | 'BREAKDOWN';
      targetAudit?: AuditData;
      invId?: string;
      userInput?: string;
      isGeniusMode?: boolean;
    };

    const mode = body.mode;
    const targetAudit = body.targetAudit;
    const invId = String(body.invId || '').trim();
    const userInput = String(body.userInput || '').trim();
    const isGeniusMode = Boolean(body.isGeniusMode);

    if (!mode || !['REAUDIT', 'CHALLENGE', 'BREAKDOWN'].includes(mode)) {
      res.status(400).json({ error: 'Invalid mode. Expected REAUDIT, CHALLENGE, or BREAKDOWN.' });
      return;
    }
    if (!targetAudit || !Array.isArray(targetAudit.invariants) || targetAudit.invariants.length < 6) {
      res.status(400).json({ error: 'Valid 6-invariant targetAudit is required.' });
      return;
    }

    const invIdx = targetAudit.invariants.findIndex((i) => i.id === invId);
    if (invIdx === -1) {
      res.status(400).json({ error: `Invariant "${invId}" not found.` });
      return;
    }

    if (mode === 'CHALLENGE' && !userInput) {
      res.status(400).json({ error: 'Challenge evidence or prompt cannot be empty.' });
      return;
    }

    const principal = await resolveVerifiedRequestPrincipal(req);
    if (isStrictCreditLockActive() && !principal.isAdmin) {
      res.status(423).json({
        error: 'STRICT_CREDIT_LOCK is active on the server. Cached reads remain unlimited.'
      });
      return;
    }

    if (!principal.isAdmin) {
      const rate = checkIpRateLimit(req, 'invariant', 40);
      if (!rate.allowed) {
        res.status(429).json({
          error: `Rate limit reached for invariant operations. Please retry in ${rate.retryAfterSec}s.`
        });
        return;
      }
    }

    let ai: GoogleGenAI;
    try {
      ai = createGeminiClient();
    } catch (err) {
      res.status(503).json({ error: formatGeminiErrorMessage(err) });
      return;
    }

    const targetInv = targetAudit.invariants[invIdx];
    const rubricSpec = GRADING_RUBRIC_SPEC[invIdx];

    try {
      if (mode === 'REAUDIT') {
        const freshBundle = await fetchSingleInvariantWebIntel(ai, targetAudit, targetInv);
        const singlePrompt = `Perform a surgical, low-token SINGLE-INVARIANT Thermodynamic Re-Audit ONLY for Invariant ${targetInv.id} ("${targetInv.title}") on ${targetAudit.name} ($${targetAudit.ticker}).
Asset Architecture: ${targetAudit.architecture} | Consensus Family: ${targetAudit.consensusFamily} | Current Invariant 02 Cost Floor: ${formatScore(
          targetAudit.invariants[1]?.score
        )}/1.0.
Existing Verified Evidence for Invariant ${targetInv.id}:
- Telemetry: ${targetInv.telemetry}
- Normie Summary: ${targetInv.paragraph}
- Genius Forensic Evidence: ${targetInv.geniusParagraph || targetInv.paragraph}
- Receipts: ${(targetInv.receipts || []).join(' • ')}

CANONICAL PROJECT-AGNOSTIC RUBRIC BRACKETS FOR INVARIANT ${rubricSpec.id} (${rubricSpec.name}):
${rubricSpec.brackets.map((b) => `- [${b.range}]: ${b.rule}`).join('\n')}

${
  freshBundle.intelText
    ? `FRESH GOOGLE SEARCH & GITHUB INTEL (RETRIEVED TODAY):\n${freshBundle.intelText}\n`
    : ''
}
INSTRUCTIONS:
1. Grade ONLY Invariant ${targetInv.id} strictly against the rubric brackets above and live active mainnet reality (never credit unactivated proposals as live, and obey M_overlay < M_L1 < 1.0 on overlays and E = 0 => 0.00 on zero-joule networks).
2. Keep internal reasoning concise so output is never cut off. Return a complete 55–75 word "paragraph" (Normie Mode), a complete 180–230 word "geniusParagraph" citing exact repos/constants/dates, up to 4 "receipts", and a complete 2–3 sentence "verdictNote" explaining what fresh intel confirmed or changed.`;

        let parsed: Record<string, unknown> | null = null;
        for (let pass = 0; pass < 2; pass++) {
          const promptForPass =
            pass === 0
              ? singlePrompt
              : `${singlePrompt}\n\nCRITICAL: Keep internal thinking brief and ensure every JSON field and sentence is 100% finished with terminal punctuation.`;

          const response = await withBackoff(() =>
            ai.models.generateContent({
              model: 'gemini-4-hydrogen',
              contents: promptForPass,
              config: {
                systemInstruction: GEMINI_SYSTEM_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: SINGLE_INVARIANT_SCHEMA,
                thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
                maxOutputTokens: pass === 0 ? 24576 : 32768
              }
            })
          );

          const finishReason = response.candidates?.[0]?.finishReason;
          const rawText = (response.text || '').trim();
          try {
            const attemptParsed = safeParseAuditJson<Record<string, unknown>>(rawText, {
              strictComplete: pass === 0
            });
            const noteTruncated = isResponseTextTruncated(attemptParsed?.verdictNote);
            if ((!noteTruncated && finishReason !== 'MAX_TOKENS') || pass === 1) {
              parsed = attemptParsed;
              break;
            }
          } catch (parseErr) {
            if (pass === 1) throw parseErr;
          }
        }

        res.json({ parsed, sources: freshBundle.sources });
        return;
      }

      if (mode === 'CHALLENGE') {
        const freshBundle = await fetchSingleInvariantWebIntel(
          ai,
          targetAudit,
          targetInv,
          userInput
        );

        const challengePrompt = `A user is CHALLENGING the thermodynamic audit of ${targetAudit.name} ($${targetAudit.ticker}) on Invariant ${targetInv.id}: "${targetInv.title}" (Current Score: ${formatScore(
          targetInv.score
        )} / 1.0 • Current Invariant 02 Cost Floor: ${formatScore(
          targetAudit.invariants[1]?.score
        )} / 1.0 • Consensus Family: ${targetAudit.consensusFamily}).

USER CHALLENGE / NEW EVIDENCE SUBMITTED:
"${userInput}"

CURRENT VERIFIED AUDIT BASELINE FOR INVARIANT ${targetInv.id}:
- Telemetry: ${targetInv.telemetry}
- Normie Audit: ${targetInv.paragraph}
- Genius Audit: ${targetInv.geniusParagraph || targetInv.paragraph}
- Verified Receipts: ${(targetInv.receipts || []).join(' • ')}

CANONICAL PROJECT-AGNOSTIC RUBRIC BRACKETS FOR INVARIANT ${rubricSpec.id} (${rubricSpec.name}):
${rubricSpec.brackets.map((b) => `- [${b.range}]: ${b.rule}`).join('\n')}

${
  freshBundle.intelText
    ? `LIVE GOOGLE SEARCH FACT-CHECK OF USER CLAIM:\n${freshBundle.intelText}\n`
    : ''
}
ADJUDICATION RULES (ZERO SYCOPHANCY — PURE PHYSICS & CODEBASE LAW):
1. Fact-check the user's claim rigorously. Do NOT cave to marketing hype, unactivated roadmap promises, or category errors (e.g., off-chain 0-Joule signatures do NOT produce M = 1.0; if Invariant 02 Cost Floor E = 0, all non-Cost-Floor invariants MUST stay 0.00; any genesis premine/ICO/VC/dev-tax forces 01 Sovereignty = 0.00; overlays obey M_overlay < M_L1 < 1.0).
2. ENERGY-ARBITRAGE COUPLING LAW: NEVER claim that genesis distribution (Invariant 01) is decoupled from Thermodynamic Cost Floor (Invariant 02)! Any genesis premine, token pre-allocation, VC/ICO mint, or mandatory protocol developer tax (Invariant 01 = 0.00) injects 0-Joule units into the fungible supply, creating a parasitic energy arbitrage within the Cost Floor where people who put in zero work benefit from and dilute the physical electricity burned by miners—capping Invariant 02 at <= 0.30 (premine/pre-allocation) or <= 0.35 (dev tax) and capping Terminal Grade at <= D+. If a user challenges an inflated Cost Floor (>0.35) on a premined, pre-allocated, or dev-taxed network, ACCEPT the challenge and recalibrate Invariant 02 into 0.15–0.35!
3. If the user provides genuinely verifiable live mainnet evidence or exposes a real factual/calibration error under the canonical rubric brackets above, set verdict = "ACCEPTED" or "PARTIAL", set scoreChanged = true (or false if only telemetry/text updates), provide the calibrated updatedScore, and update the invariant's paragraph, geniusParagraph (180–230 words), telemetry, quickSummary, and receipts.
4. If the user's claim fails physics or rubric rules, set verdict = "REJECTED", scoreChanged = false, updatedScore = ${
          targetInv.score
        }, and deliver an uncompromising forensic rebuttal in "rebuttalOrAnalysis" (${
          isGeniusMode
            ? '140–220 words citing exact codebase constants, math, and rubric brackets'
            : '75–120 words in clear, direct Normie-friendly plain English backed by hard facts'
        }).
5. COMPLETENESS & EFFICIENCY RULE: Keep internal thinking concise so your JSON output NEVER hits the token ceiling or cuts off mid-sentence. Every sentence in "rebuttalOrAnalysis" MUST finish cleanly with terminal punctuation. When verdict = "REJECTED" and scoreChanged = false, pass "" for updatedTelemetry, updatedQuickSummary, updatedParagraph, and updatedGeniusParagraph, and [] for updatedReceipts.`;

        let parsed: Record<string, unknown> | null = null;
        for (let pass = 0; pass < 2; pass++) {
          const promptForPass =
            pass === 0
              ? challengePrompt
              : `${challengePrompt}\n\nCRITICAL: Your previous attempt cut off mid-sentence. Keep internal reasoning brief and return complete, unabridged JSON where "rebuttalOrAnalysis" finishes its final sentence cleanly with a period.`;

          const response = await withBackoff(() =>
            ai.models.generateContent({
              model: 'gemini-4-carbon',
              contents: promptForPass,
              config: {
                systemInstruction: GEMINI_SYSTEM_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: CHALLENGE_INVARIANT_SCHEMA,
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
                maxOutputTokens: pass === 0 ? 24576 : 32768
              }
            })
          );

          const finishReason = response.candidates?.[0]?.finishReason;
          const rawText = (response.text || '').trim();
          try {
            const attemptParsed = safeParseAuditJson<Record<string, unknown>>(rawText, {
              strictComplete: pass === 0
            });
            const rebuttalCutOff = isResponseTextTruncated(attemptParsed?.rebuttalOrAnalysis);
            if ((!rebuttalCutOff && finishReason !== 'MAX_TOKENS') || pass === 1) {
              parsed = attemptParsed;
              break;
            }
          } catch (parseErr) {
            if (pass === 1) throw parseErr;
          }
        }

        res.json({ parsed, sources: freshBundle.sources });
        return;
      }

      // BREAKDOWN on gemini-4-hydrogen
      const breakdownPrompt = `Provide a deeper, surgical technical breakdown for ${targetAudit.name} ($${targetAudit.ticker}) strictly focused on Invariant ${targetInv.id}: "${targetInv.title}" (Score: ${formatScore(
        targetInv.score
      )} / 1.0 • Telemetry: ${targetInv.telemetry}).

EXISTING AUDIT CONTEXT:
- Normie Summary: ${targetInv.paragraph}
- Genius Dossier: ${targetInv.geniusParagraph || targetInv.paragraph}
- Verified Receipts: ${(targetInv.receipts || []).join(' • ')}
- Rubric Brackets: ${rubricSpec.brackets.map((b) => `[${b.range}] ${b.rule}`).join(' | ')}

SPECIFIC USER BREAKDOWN REQUEST:
${
  userInput
    ? `"${userInput}"`
    : `"Unpack the deeper architectural mechanics, exact codebase/protocol rules, edge-case failure modes, and mathematical trade-offs explaining why $${targetAudit.ticker} scores ${formatScore(
        targetInv.score
      )}/1.0 on ${targetInv.title}."`
}

OUTPUT STYLE (${isGeniusMode ? 'GENIUS FORENSIC MODE' : 'NORMIE PLAIN-ENGLISH MODE'}):
${
  isGeniusMode
    ? 'Write 2–3 dense, uncompromising forensic paragraphs (180–280 words total) citing exact repository files, config parameters, equations, attack vectors, and physical trade-offs without fluff or markdown headers. Keep internal thinking concise so every paragraph finishes cleanly.'
    : 'Write 2 clear, vivid, plain-English paragraphs (110–170 words total) using intuitive real-world analogies and concrete facts so anyone can immediately grasp the exact engineering reality without jargon. Keep internal thinking concise so every paragraph finishes cleanly.'
}`;

      let bodyText = 'Detailed breakdown generated.';
      for (let pass = 0; pass < 2; pass++) {
        const promptForPass =
          pass === 0
            ? breakdownPrompt
            : `${breakdownPrompt}\n\nCRITICAL: Keep internal thinking brief and ensure your final sentence finishes completely with a period.`;

        const response = await withBackoff(() =>
          ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: promptForPass,
            config: {
              systemInstruction:
                'You are "The Truth — thermodynamic audit". Deliver crystal-clear, technically unimpeachable single-invariant breakdowns anchored in Nakamoto Proof-of-Work, Landauer’s Principle, and verified codebase mechanics. Output clean plain-text paragraphs only, ensuring every sentence finishes completely.',
              thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
              maxOutputTokens: pass === 0 ? 24576 : 32768
            }
          })
        );

        const finishReason = response.candidates?.[0]?.finishReason;
        const candidateText = (response.text || '').trim();
        if (candidateText) bodyText = candidateText;
        if ((finishReason !== 'MAX_TOKENS' && !isResponseTextTruncated(bodyText)) || pass === 1) {
          break;
        }
      }

      res.json({ bodyText, sources: [] });
    } catch (err) {
      res.status(502).json({ error: formatGeminiErrorMessage(err) });
    }
  });

  // ==========================================================================
  // STRICTLY ARCHIVE-ONLY AI AGENT HOOKS, MCP, OPENAPI & DISCOVERY ENDPOINTS
  // ==========================================================================
  const getServerArchiveMap = (): Record<string, AuditData> => {
    const out: Record<string, AuditData> = {};
    serverAuditCache.forEach((val, key) => {
      out[key] = val;
    });
    return out;
  };

  const getServerAliasObject = (): Record<string, string> => {
    const out: Record<string, string> = {};
    serverAliasCache.forEach((val, key) => {
      out[key] = val;
    });
    return out;
  };

  const preloadedTickerSet = new Set(Object.keys(PRELOADED_AUDITS));

  app.use(['/api/agent', '/mcp', '/sitemap.xml', '/llms.txt'], (_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id');
    if (_req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/api/agent/archive', async (req: Request, res: Response) => {
    await syncFirestoreArchivedAuditsToCache();
    const map = getServerArchiveMap();
    const basket =
      typeof req.query.basket === 'string'
        ? (req.query.basket.toUpperCase() as 'ALL' | 'PASSED' | 'FAILED')
        : 'ALL';
    const category =
      typeof req.query.category === 'string'
        ? (req.query.category.toUpperCase() as never)
        : 'ALL';
    const family = typeof req.query.family === 'string' ? req.query.family : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;

    const audits = listArchivedAudits(map, { basket, category, family, q }, preloadedTickerSet);
    const origin = resolvePublicOrigin(req);
    res.json({
      ok: true,
      archiveOnly: true,
      creditsUsed: 0,
      totalArchived: Object.keys(map).length,
      returnedCount: audits.length,
      passedCount: audits.filter((a) => a.basket === 'PASSED').length,
      failedCount: audits.filter((a) => a.basket === 'FAILED').length,
      audits: audits.map((a) => ({
        ...a,
        absoluteUrl: `${origin}${a.deepLinkUrl}`
      }))
    });
  });

  app.get('/api/agent/audit/:ticker', async (req: Request, res: Response) => {
    await syncFirestoreArchivedAuditsToCache();
    const map = getServerArchiveMap();
    const aliases = getServerAliasObject();
    const rawTicker = String(req.params.ticker || '').trim();
    const hit = findArchivedAudit(map, rawTicker, aliases);
    if (!hit) {
      res.status(404).json({
        ok: false,
        archiveOnly: true,
        archived: false,
        creditsUsed: 0,
        error: `Asset "${rawTicker}" is not in The Truth Archive. Strictly archive-only mode never triggers AI generation or fabricates scores.`,
        availableCount: Object.keys(map).length
      });
      return;
    }

    const origin = resolvePublicOrigin(req);
    const summary = summarizeArchivedAudit(hit, preloadedTickerSet);
    res.json({
      ok: true,
      archiveOnly: true,
      archived: true,
      defaultMode: 'GENIUS',
      creditsUsed: 0,
      absoluteUrl: `${origin}${summary.deepLinkUrl}`,
      summary,
      audit: hit
    });
  });

  app.get('/api/agent/compare', async (req: Request, res: Response) => {
    await syncFirestoreArchivedAuditsToCache();
    const map = getServerArchiveMap();
    const aliases = getServerAliasObject();
    const rawTickers = String(req.query.tickers || req.query.compare || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const mode = String(req.query.mode || '').toUpperCase() === 'NORMIE' ? 'NORMIE' : 'GENIUS';

    const result = buildArchiveComparison(map, rawTickers, {
      mode,
      dynamicAliases: aliases,
      preloadedTickers: preloadedTickerSet,
      cohortRecord: getPersistedGainsCohort()
    });

    if (!result.ok) {
      res.status(result.missingTickers.length > 0 ? 404 : 400).json(result);
      return;
    }

    const origin = resolvePublicOrigin(req);
    res.json({
      ...result,
      absoluteUrl: `${origin}${result.deepLinkUrl}`
    });
  });

  app.post('/api/agent/research', async (req: Request, res: Response) => {
    await syncFirestoreArchivedAuditsToCache();
    const body = (req.body || {}) as { question?: string; query?: string; mode?: string };
    const question = String(body.question || body.query || '').trim();
    if (!question || question.length > 500) {
      res.status(400).json({
        ok: false,
        archiveOnly: true,
        creditsUsed: 0,
        error: 'Provide a research question between 1 and 500 characters.'
      });
      return;
    }

    const mode = String(body.mode || '').toUpperCase() === 'NORMIE' ? 'NORMIE' : 'GENIUS';
    const map = getServerArchiveMap();
    const aliases = getServerAliasObject();
    const answer = answerArchiveResearchQuestion(map, question, {
      mode,
      dynamicAliases: aliases,
      preloadedTickers: preloadedTickerSet,
      cohortRecord: getPersistedGainsCohort()
    });

    const origin = resolvePublicOrigin(req);
    res.status(answer.ok ? 200 : 404).json({
      ...answer,
      absoluteUrl: answer.deepLinkUrl ? `${origin}${answer.deepLinkUrl}` : null
    });
  });

  app.get('/mcp', (req: Request, res: Response) => {
    const origin = resolvePublicOrigin(req);
    res.json({
      name: 'the-truth-thermodynamic-archive',
      version: '1.0.0',
      transport: 'streamable-http-jsonrpc',
      archiveOnly: true,
      creditsUsedPerCall: 0,
      endpoint: `${origin}/mcp`,
      tools: MCP_ARCHIVE_TOOL_SCHEMAS
    });
  });

  app.post('/mcp', async (req: Request, res: Response) => {
    await syncFirestoreArchivedAuditsToCache();
    const rpc = (req.body || {}) as {
      jsonrpc?: string;
      id?: string | number | null;
      method?: string;
      params?: Record<string, unknown>;
    };
    const id = rpc.id ?? null;
    const method = String(rpc.method || '');
    const map = getServerArchiveMap();
    const aliases = getServerAliasObject();
    const origin = resolvePublicOrigin(req);

    if (method === 'initialize') {
      res.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2025-03-26',
          capabilities: { tools: { listChanged: false } },
          serverInfo: {
            name: 'The Truth Thermodynamic Archive MCP',
            version: '1.0.0'
          }
        }
      });
      return;
    }

    if (method === 'notifications/initialized') {
      res.status(204).end();
      return;
    }

    if (method === 'tools/list') {
      res.json({
        jsonrpc: '2.0',
        id,
        result: { tools: MCP_ARCHIVE_TOOL_SCHEMAS }
      });
      return;
    }

    if (method === 'tools/call') {
      const toolName = String(rpc.params?.name || '');
      const args = (rpc.params?.arguments || {}) as Record<string, unknown>;

      if (toolName === 'list_archived_audits') {
        const list = listArchivedAudits(
          map,
          {
            basket: typeof args.basket === 'string' ? (args.basket.toUpperCase() as never) : 'ALL',
            category:
              typeof args.category === 'string' ? (args.category.toUpperCase() as never) : 'ALL',
            family: typeof args.family === 'string' ? args.family : undefined,
            q: typeof args.q === 'string' ? args.q : undefined
          },
          preloadedTickerSet
        );
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    archiveOnly: true,
                    creditsUsed: 0,
                    count: list.length,
                    audits: list.map((a) => ({ ...a, absoluteUrl: `${origin}${a.deepLinkUrl}` }))
                  },
                  null,
                  2
                )
              }
            ]
          }
        });
        return;
      }

      if (toolName === 'get_archived_audit') {
        const hit = findArchivedAudit(map, String(args.ticker || ''), aliases);
        if (!hit) {
          res.json({
            jsonrpc: '2.0',
            id,
            result: {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: `Asset "${String(
                    args.ticker || ''
                  )}" is not in The Truth Archive. Strictly archive-only MCP refuses to run live AI pulls.`
                }
              ]
            }
          });
          return;
        }
        const summary = summarizeArchivedAudit(hit, preloadedTickerSet);
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    archiveOnly: true,
                    creditsUsed: 0,
                    absoluteUrl: `${origin}${summary.deepLinkUrl}`,
                    summary,
                    audit: hit
                  },
                  null,
                  2
                )
              }
            ]
          }
        });
        return;
      }

      if (toolName === 'compare_archived_audits') {
        const tickers = Array.isArray(args.tickers) ? args.tickers.map(String) : [];
        const mode = String(args.mode || '').toUpperCase() === 'NORMIE' ? 'NORMIE' : 'GENIUS';
        const comp = buildArchiveComparison(map, tickers, {
          mode,
          dynamicAliases: aliases,
          preloadedTickers: preloadedTickerSet,
          cohortRecord: getPersistedGainsCohort()
        });
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            isError: !comp.ok,
            content: [
              {
                type: 'text',
                text: comp.ok
                  ? JSON.stringify({ ...comp, absoluteUrl: `${origin}${comp.deepLinkUrl}` }, null, 2)
                  : comp.error
              }
            ]
          }
        });
        return;
      }

      if (toolName === 'research_archive') {
        const mode = String(args.mode || '').toUpperCase() === 'NORMIE' ? 'NORMIE' : 'GENIUS';
        const ans = answerArchiveResearchQuestion(map, String(args.question || ''), {
          mode,
          dynamicAliases: aliases,
          preloadedTickers: preloadedTickerSet,
          cohortRecord: getPersistedGainsCohort()
        });
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            isError: !ans.ok,
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    ...ans,
                    absoluteUrl: ans.deepLinkUrl ? `${origin}${ans.deepLinkUrl}` : null
                  },
                  null,
                  2
                )
              }
            ]
          }
        });
        return;
      }

      res.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Unknown archive tool "${toolName}".` }
      });
      return;
    }

    res.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Unsupported MCP method "${method}".` }
    });
  });

  app.get('/openapi.json', (req: Request, res: Response) => {
    const origin = resolvePublicOrigin(req);
    res.json({
      openapi: '3.1.0',
      info: {
        title: 'The Truth — Thermodynamic Archive Agent API',
        version: '1.0.0',
        description:
          'Strictly read-only, 0-credit API exposing verified cryptocurrency and physical commodity audits from The Truth Vault for AI agent comparisons, education, and deep-linking.'
      },
      servers: [{ url: origin }],
      paths: {
        '/api/agent/archive': {
          get: {
            operationId: 'listArchivedAudits',
            summary: 'List all archived audits (strictly archive-only, 0 AI credits).',
            parameters: [
              { name: 'basket', in: 'query', schema: { type: 'string', enum: ['ALL', 'PASSED', 'FAILED'] } },
              { name: 'category', in: 'query', schema: { type: 'string' } },
              { name: 'family', in: 'query', schema: { type: 'string' } },
              { name: 'q', in: 'query', schema: { type: 'string' } }
            ],
            responses: { '200': { description: 'List of archived audit summaries' } }
          }
        },
        '/api/agent/audit/{ticker}': {
          get: {
            operationId: 'getArchivedAudit',
            summary: 'Fetch full 6-invariant thermodynamic audit for an archived asset.',
            parameters: [{ name: 'ticker', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              '200': { description: 'Full archived audit' },
              '404': { description: 'Not archived (strictly refuses live AI pull)' }
            }
          }
        },
        '/api/agent/compare': {
          get: {
            operationId: 'compareArchivedAudits',
            summary: 'Run side-by-side 6-invariant comparison across 2–4 archived assets.',
            parameters: [
              { name: 'tickers', in: 'query', required: true, schema: { type: 'string' } },
              { name: 'mode', in: 'query', schema: { type: 'string', enum: ['NORMIE', 'GENIUS'] } }
            ],
            responses: {
              '200': { description: 'Side-by-side comparison matrix and PoS vs PoW analysis' },
              '404': { description: 'One or more requested tickers are not archived' }
            }
          }
        },
        '/api/agent/research': {
          post: {
            operationId: 'researchThermodynamicArchive',
            summary: 'Answer coin comparison or PoS-vs-PoW questions using strictly archived audits.',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['question'],
                    properties: {
                      question: { type: 'string' },
                      mode: { type: 'string', enum: ['NORMIE', 'GENIUS'] }
                    }
                  }
                }
              }
            },
            responses: {
              '200': { description: 'Grounded archive-only answer with comparison matrix and deep-link' },
              '404': { description: 'Unarchived asset requested' }
            }
          }
        }
      }
    });
  });

  app.get('/llms.txt', async (req: Request, res: Response) => {
    await syncFirestoreArchivedAuditsToCache();
    const origin = resolvePublicOrigin(req);
    const ordered = sortAuditTickersByGrade(getServerArchiveMap());
    const content = `# The Truth — Thermodynamic Audit
> Sovereign Thermodynamic Verification Engine grading Layer-1 protocols, overlays, and physical commodities strictly against six immutable laws of physics.

## Strictly Archive-Only AI Agent Policy (Zero Credit Guarantee & GENIUS Default)
- External AI assistants, MCP clients, and browser agents may read, compare, and cite ONLY verified audits stored in the Archive.
- All agent endpoints and MCP tools default to **GENIUS** mode (delivering complete codebase constants, mathematical proofs, consensus mechanics, receipts, AND concise normie summaries) so the calling AI has full understanding and can adapt its explanation to what its user will best understand.
- Agent endpoints NEVER call Gemini generation, spend API credits, or invent scores for unarchived coins.

## Live Machine Endpoints
- Archive Directory JSON: ${origin}/api/agent/archive
- Single Archived Audit: ${origin}/api/agent/audit/{TICKER}
- Side-by-Side Comparison: ${origin}/api/agent/compare?tickers=KAS,ETH,SOL&mode=GENIUS
- Archive Research QA (POST): ${origin}/api/agent/research
- Streamable HTTP MCP Endpoint: ${origin}/mcp
- OpenAPI 3.1 Spec: ${origin}/openapi.json
- XML Sitemap: ${origin}/sitemap.xml

## Deep-Link UI Routes (Shareable Comparisons)
- Side-by-side constellation: ${origin}/?compare=KAS,ETH,SOL&mode=GENIUS
- Single archived asset: ${origin}/?asset=BTC&mode=GENIUS
- Wartime partition lab: ${origin}/?asset=SOL&lab=wartime
- Empirical Cycle Gains chart: ${origin}/?gains=1
- First-Principles Origin Thesis: ${origin}/?genesis=1

## Currently Archived Tickers (${ordered.length})
${ordered.join(', ')}
`;
    res.status(200).setHeader('Content-Type', 'text/plain; charset=utf-8').send(content);
  });

  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    await syncFirestoreArchivedAuditsToCache();
    const origin = resolvePublicOrigin(req);
    const ordered = sortAuditTickersByGrade(getServerArchiveMap());
    const urls = [
      `${origin}/`,
      `${origin}/?gains=1`,
      `${origin}/?rubric=1`,
      `${origin}/?genesis=1`,
      `${origin}/?compare=KAS,BTC,ETH,SOL&mode=GENIUS`,
      `${origin}/?compare=KAS,ETH&mode=GENIUS`,
      `${origin}/?compare=KAS,SOL&mode=GENIUS`,
      ...ordered.map((tk) => `${origin}/?asset=${encodeURIComponent(tk)}`)
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${u.replace(/&/g, '&amp;')}</loc></url>`)
      .join('\n')}\n</urlset>\n`;
    res.status(200).setHeader('Content-Type', 'application/xml; charset=utf-8').send(xml);
  });

  const escapeHtmlAttr = (val: string): string =>
    val
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const resolvePublicOrigin = (req: Request): string => {
    const xfHost = String(req.headers['x-forwarded-host'] || '')
      .split(',')[0]
      .trim();
    const configured = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
    const rawHost = xfHost || req.get('host') || '';
    const isLocal = /^localhost(?::|$)|^127\.0\.0\.1(?::|$)|^0\.0\.0\.0(?::|$)/.test(rawHost);
    if (!xfHost && configured) return configured;
    const host = rawHost;
    if (!host) return configured || 'https://the-truth.ai.studio';
    const xfProto = String(req.headers['x-forwarded-proto'] || '')
      .split(',')[0]
      .trim();
    const proto = xfProto || (isLocal ? req.protocol || 'http' : 'https');
    return `${proto}://${host}`;
  };

  const injectSocialOrigin = (html: string, req: Request): string => {
    const origin = resolvePublicOrigin(req);
    let out = html.replace(/https:\/\/the-truth\.ai\.studio/g, () => origin);
    const archiveMap = getServerArchiveMap();
    const aliasObj = getServerAliasObject();
    const meta = buildOpenGraphMetaForUrl(
      req.originalUrl || '/',
      archiveMap,
      aliasObj
    );
    const safeTitle = escapeHtmlAttr(meta.title);
    const safeDesc = escapeHtmlAttr(meta.description);
    const safeUrl = escapeHtmlAttr(`${origin}${meta.urlPath}`);
    out = out
      .replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${safeTitle}</title>`)
      .replace(
        /<meta name="description" content="[^"]*"\s*\/?>/i,
        () => `<meta name="description" content="${safeDesc}" />`
      )
      .replace(
        /<meta property="og:url" content="[^"]*"\s*\/?>/i,
        () => `<meta property="og:url" content="${safeUrl}" />`
      )
      .replace(
        /<meta property="og:title" content="[^"]*"\s*\/?>/i,
        () => `<meta property="og:title" content="${safeTitle}" />`
      )
      .replace(
        /<meta property="og:description" content="[^"]*"\s*\/?>/i,
        () => `<meta property="og:description" content="${safeDesc}" />`
      )
      .replace(
        /<meta name="twitter:title" content="[^"]*"\s*\/?>/i,
        () => `<meta name="twitter:title" content="${safeTitle}" />`
      )
      .replace(
        /<meta name="twitter:description" content="[^"]*"\s*\/?>/i,
        () => `<meta name="twitter:description" content="${safeDesc}" />`
      );
    const ssrInnerHtml = buildSsrRootInnerHtml(
      req.originalUrl || '/',
      origin,
      archiveMap,
      aliasObj
    );
    return injectSsrRootHtml(out, ssrInnerHtml);
  };

  app.get('/robots.txt', (req: Request, res: Response) => {
    const origin = resolvePublicOrigin(req);
    res
      .status(200)
      .setHeader('Content-Type', 'text/plain; charset=utf-8')
      .send(
        [
          'User-agent: GPTBot',
          'Allow: /',
          '',
          'User-agent: ChatGPT-User',
          'Allow: /',
          '',
          'User-agent: OAI-SearchBot',
          'Allow: /',
          '',
          'User-agent: ClaudeBot',
          'Allow: /',
          '',
          'User-agent: PerplexityBot',
          'Allow: /',
          '',
          'User-agent: Googlebot',
          'Allow: /',
          '',
          'User-agent: Twitterbot',
          'Allow: /',
          '',
          'User-agent: *',
          'Allow: /',
          '',
          `Sitemap: ${origin}/sitemap.xml`,
          ''
        ].join('\n')
      );
  });

  const syncArchiveForSsrTimeout = () =>
    Promise.race([
      syncFirestoreArchivedAuditsToCache(),
      new Promise<void>((resolve) => setTimeout(resolve, 1200))
    ]);

  // Frontend Hosting (Vite middleware in dev; dist static in prod)
  if (!IS_PROD) {
    const vite = await import('vite');
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(viteServer.middlewares);

    app.get('*', async (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      try {
        await syncArchiveForSsrTimeout();
        const indexPath = path.resolve(process.cwd(), 'index.html');
        const template = fs.readFileSync(indexPath, 'utf8');
        const transformed = await viteServer.transformIndexHtml(req.originalUrl, template);
        const html = injectSocialOrigin(transformed, req);
        res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').end(html);
      } catch (err) {
        viteServer.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir, { index: false }));
    app.get('*', async (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      try {
        await syncArchiveForSsrTimeout();
        const indexPath = path.join(distDir, 'index.html');
        const template = fs.readFileSync(indexPath, 'utf8');
        const html = injectSocialOrigin(template, req);
        res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').end(html);
      } catch {
        res.sendFile(path.join(distDir, 'index.html'));
      }
    });
  }

  return app;
}

createApp()
  .then((app) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`The Truth — thermodynamic audit listening on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
