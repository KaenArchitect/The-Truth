import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI, ThinkingLevel, type GenerateContentResponse } from '@google/genai';
import {
  buildGeminiSystemPrompt,
  GEMINI_SCHEMA,
  SINGLE_INVARIANT_SCHEMA,
  CHALLENGE_INVARIANT_SCHEMA
} from './src/server/geminiSchemas.ts';
import { PRELOADED_AUDITS } from './src/data/preloadedAudits.ts';
import {
  buildSingleInvariantSecretGeniusDirective,
  resolveSecretGeniusTemplateFromEnv
} from './src/server/secretGeniusTemplate.ts';
import {
  ALIAS_MAP,
  GRADING_RUBRIC_SPEC,
  enforceEnergyArbitrageLawOnAudit,
  formatScore,
  isResponseTextTruncated,
  isValidCompleteAuditPayload,
  mergeHistoricalSnapshots,
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
  SIGNED_IN_DAILY_NEW_FULL_PULL_LIMIT,
  TOKENIZED_COMMODITY_WRAPPER_TICKERS,
  consumeDailyPull,
  evaluateMarketScope,
  getUserDailyQuotaStatus,
  pruneStaleQuotaDays,
  refundDailyPull,
  resolveDailyPullLimit,
  resolveFiatCurrencyQuery,
  resolvePhysicalCommodityQuery,
  resolveQuotaPrincipalKeys,
  type DailyQuotaLedger
} from './src/data/auditQuotaAndScope.ts';
import { getMarketCapDirectory } from './src/server/cmcTop150.ts';
import {
  ensureFreshLiveGainsCohort,
  getCachedWindowTrajectories,
  getPersistedGainsCohort,
  resetPersistedGainsCohort,
  savePersistedGainsCohort,
  syncLivePricesAndPersistGainsCohort
} from './src/server/gainsCohortStore.ts';
import {
  getCachedM2BenchmarkDataset,
  getLiveM2BenchmarkDataset
} from './src/server/m2BenchmarkStore.ts';
import { initializeApp as initFirebaseApp, getApps as getFirebaseApps, getApp as getFirebaseApp } from 'firebase/app';
import {
  getFirestore as getClientFirestore,
  collection as fsCollection,
  query as fsQuery,
  where as fsWhere,
  getDocs as fsGetDocs
} from 'firebase/firestore';
import { classifyAuditQueryForSandbox } from './src/data/auditProvenance.ts';
import { buildOpenGraphMetaForUrl } from './src/data/agentArchiveApi.ts';
import { buildFullPlainTextCompendium } from './src/data/fullPlainTextCompendium.ts';
import { buildSsrRootInnerHtml, injectSsrRootHtml } from './src/data/ssrSnapshotHtml.ts';
import {
  verifyFirebaseBearerToken,
  type VerifiedFirebaseUser
} from './src/server/firebaseTokenVerifier.ts';
import {
  injectCanonicalSocialMeta,
  resolvePublicOriginFromHeaders
} from './src/server/socialOrigin.ts';
import {
  parseGlobalTimelineYear,
  projectAuditAtYear,
  resolveAssetGenesisYear,
  type GlobalTimelineYear
} from './src/data/globalTimeMachine.ts';
import {
  attachHistoricalAuditToBaseline,
  findAnachronisticYearsInPayload,
  getHistoricalAuditHorizon,
  hasDedicatedTimelineCoverage,
  scrubResidualAnachronisticReferences
} from './src/data/historicalAuditScope.ts';

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
let serverCacheRevision = 1;

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
  const existing = serverAuditCache.get(tk) || PRELOADED_AUDITS[tk];
  const mergedSnapshots = mergeHistoricalSnapshots(
    enforced.historicalSnapshots,
    existing?.historicalSnapshots
  );
  const normalizedAudit: AuditData = {
    ...enforced,
    ticker: tk,
    ...(mergedSnapshots && mergedSnapshots.length > 0
      ? { historicalSnapshots: mergedSnapshots }
      : {})
  };
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
  serverCacheRevision++;
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

let cacheWriteTimer: ReturnType<typeof setTimeout> | null = null;

function persistServerCacheToDisk(): void {
  if (cacheWriteTimer) clearTimeout(cacheWriteTimer);
  cacheWriteTimer = setTimeout(() => {
    cacheWriteTimer = null;
    try {
      const customEntries: Record<string, AuditData> = {};
      serverAuditCache.forEach((val, key) => {
        if (!PRELOADED_AUDITS[key] || val.lastFreshAuditAt) {
          customEntries[key] = val;
        }
      });
      void fs.promises
        .writeFile(CACHE_FILE_PATH, JSON.stringify(customEntries), 'utf8')
        .catch((err) => console.warn('Could not persist audit disk cache:', err));
    } catch (err) {
      console.warn('Could not serialize audit disk cache:', err);
    }
  }, 120);
}

hydrateServerCacheFromDisk();

let lastFirestoreSyncMs = 0;
let inflightFirestoreSync: Promise<void> | null = null;
const FIRESTORE_SYNC_TTL_MS = 5 * 60 * 1000;
let cachedFirebaseCfg: {
  projectId?: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
} | null | undefined;

async function syncFirestoreArchivedAuditsToCache(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastFirestoreSyncMs < FIRESTORE_SYNC_TTL_MS) return;
  if (inflightFirestoreSync) return inflightFirestoreSync;

  inflightFirestoreSync = (async () => {
    try {
      if (cachedFirebaseCfg === undefined) {
        const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        cachedFirebaseCfg = fs.existsSync(cfgPath)
          ? (JSON.parse(await fs.promises.readFile(cfgPath, 'utf8')) as typeof cachedFirebaseCfg)
          : null;
      }
      const cfg = cachedFirebaseCfg;
      if (!cfg?.projectId || !cfg?.apiKey) return;
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

let quotaWriteTimer: ReturnType<typeof setTimeout> | null = null;

function persistDailyQuotaLedger(): void {
  dailyQuotaLedger = pruneStaleQuotaDays(dailyQuotaLedger);
  if (quotaWriteTimer) clearTimeout(quotaWriteTimer);
  quotaWriteTimer = setTimeout(() => {
    quotaWriteTimer = null;
    void fs.promises
      .writeFile(DAILY_QUOTA_FILE_PATH, JSON.stringify(dailyQuotaLedger), 'utf8')
      .catch((err) => console.warn('Could not persist daily quota ledger:', err));
  }, 120);
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
  existingBaseline: AuditData | null,
  isFiatQuery = false,
  timelineYear: GlobalTimelineYear = 'PRESENT'
): Promise<{ intelText: string; sources: GroundingSource[] }> {
  const horizon = getHistoricalAuditHorizon(timelineYear);
  const cutoffPhrase = horizon.isHistorical
    ? `STRICTLY ON OR BEFORE ${horizon.cutoffDateLabel} (<= ${horizon.numericYear})`
    : 'up through November 2026';

  const groundingQuery = isFiatQuery
    ? horizon.isHistorical
      ? `Perform an exhaustive forensic central-bank, coinage/bank-act, convertibility, reserve-requirement, and clearing-rail historical intelligence pull ${cutoffPhrase} for sovereign currency "${targetQuery}".
CRITICAL CHRONOLOGY RULE: Gather ONLY statutes, Bank Acts, gold/silver convertibility or float regimes, statutory cash/secondary reserve ratios, money-supply figures, and clearinghouse rails that existed ON OR BEFORE ${horizon.numericYear}! DO NOT include ANY Bank Act, reserve phase-out, RTGS system, crisis, or event from ${horizon.numericYear + 1} or later (for example, if <= 1971, cite the 1934 Bank of Canada Act, 1933 gold suspension, May 1970 float, and 1967 Bank Act reserve ratios—NEVER cite the 1980 or 1992 Bank Act, 1999 LVTS, 2008 QE, 2020 COVID QE, or 2021 Lynx!).
1. Genesis & Sovereignty (<= ${horizon.numericYear}): Exact central-bank or Dominion/Treasury statutory charter/legislation in force in ${horizon.numericYear}, legal-tender statutes, and sovereign issuance/confiscation powers up to ${horizon.numericYear}.
2. Cost Floor & Convertibility (<= ${horizon.numericYear}): Exact gold/silver specie convertibility status as of ${horizon.numericYear} (on-demand citizen specie parity vs suspended domestic redemption / free float), exact statutory commercial-bank reserve-requirement percentages in force in ${horizon.numericYear}, and money-supply expansion up to ${horizon.numericYear}.
3. Immutability (<= ${horizon.numericYear}): Historical parity changes, devaluations, or gold-window suspensions on or before ${horizon.numericYear}, plus reversible bank-ledger / clearinghouse settlement rules as of ${horizon.numericYear}.
4. Availability (<= ${horizon.numericYear}): Exact clearinghouse / telegraph / central-bank settlement operating hours, weekend/holiday closures, exchange controls, or bank holidays on or before ${horizon.numericYear}.
5. State Topology (<= ${horizon.numericYear}): Tiered central-bank + chartered commercial-bank account ledger structure, statutory seizure/garnishment/exchange-control powers in force in ${horizon.numericYear}.
6. Velocity (<= ${horizon.numericYear}): Contemporaneous cheque/draft/telegraph clearinghouse settlement lag (multi-day regional clearing) vs physical specie transport as of ${horizon.numericYear}.`
      : `Perform an exhaustive forensic central-bank, legal-tender, and clearing-rail intelligence pull up through November 2026 for sovereign fiat currency "${targetQuery}". Gather exact, verifiable historical & current receipts across all 6 invariants:
1. Genesis & Sovereignty: Central bank statutory charter/legislation (e.g., 1913 Federal Reserve Act, Maastricht Treaty, BOJ Act), Treasury/finance-ministry issuance control, legal-tender coercion statutes, and executive freeze/confiscation or bail-in frameworks.
2. Cost Floor (E = 0): Historical & recent Quantitative Easing / balance-sheet expansion totals, commercial bank reserve-requirement rules (e.g. 0% reserves), broad M2 money-supply expansion rates, and zero marginal issuance cost of electronic central-bank/commercial credit.
3. Immutability: Historical debasements & broken commodity pegs (e.g. 1933 EO 6102 gold seizure, 1971 Nixon Shock closing gold convertibility, ERM/peg breaks, currency redenominations), plus reversible bank ledger / chargeback & court-ordered clawback mechanics.
4. Availability: Payment-rail operating hours & holidays (Fedwire/CHIPS/TARGET2/BOJ-NET weekend closures), SWIFT sanctions cutoffs, domestic capital controls, bank holidays, and ATM withdrawal freezes during crises.
5. State Topology: Permissioned tiered ledger topology (central-bank Tier-1 master accounts vs fractional-reserve commercial bank IOUs), native OFAC/sanctions blacklists, freezes, garnishments, and AML/KYC identity gating.
6. Velocity: Real settlement finality vs credit-IOU messaging across Fedwire, CHIPS, SWIFT, ACH, SEPA, or CIPS (T+1 to T+3 batch finality delays, zero thermodynamic Proof-of-Work finality).`
    : `Perform an exhaustive forensic engineering, monetary, & codebase intelligence pull ${cutoffPhrase} for "${targetQuery}"${
        existingBaseline ? ` (${existingBaseline.name} / $${existingBaseline.ticker})` : ''
      }.${
        horizon.isHistorical
          ? ` CRITICAL CHRONOLOGY RULE: Gather ONLY codebase commits, consensus rules, mining hardware, CVEs, outages, or commodity extraction facts that existed ON OR BEFORE ${horizon.numericYear}. NEVER mention any year, hardfork, upgrade, exploit, or protocol from ${horizon.numericYear + 1} or later!`
          : ''
      } Gather exact, verifiable receipts across all 6 physical invariants:
1. Genesis & Sovereignty: Exact premine/ICO/VC/foundation token splits, coinbase developer taxes/lockboxes, founding corporations, governance wars, and bridge/admin multisig keys${horizon.isHistorical ? ` as of <= ${horizon.numericYear}` : ''}.
2. Consensus & Cost Floor: Exact ACTIVE block production or physical extraction mechanism ${horizon.isHistorical ? `as of ${horizon.numericYear}` : 'today'} (PoW hash algorithm, ASIC vs GPU/CPU share, block subsidy, max supply cap, fee burns/clawbacks).
3. Immutability: Exact GitHub repositories & source/config flags, header/PoPoW sync vs snapshot sync, checkpoints or max-reorg depth caps, node pruning horizon, and dated inflation/counterfeiting CVEs ${horizon.isHistorical ? `on or before ${horizon.numericYear}` : ''}.
4. Wartime Partition & Outages: Exact difficulty adjustment window or BFT supermajority halt threshold, behavior on >2h cable cut & resplice, and dated mainnet blackouts, stalls, chain splits, or bridge freezes ${horizon.isHistorical ? `on or before ${horizon.numericYear}` : ''}.
5. State Topology: UTXO vs shared-account VM, covenant/script opcodes, unprunable nullifier/key-image bloat, mandatory state rent/reserves, and native Freeze/Clawback/DenyList hooks ${horizon.isHistorical ? `as of ${horizon.numericYear}` : ''}.
6. Velocity: Exact block interval (seconds & BPS), block size/weight cap, real non-vote L1 TPS, wallet spend locks, and linear orphan waste or physical freight lag ${horizon.isHistorical ? `as of ${horizon.numericYear}` : ''}.`;

  try {
    const response = await withBackoff(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: groundingQuery,
        config: {
          systemInstruction: horizon.isHistorical
            ? `You are a strict historical monetary, protocol, and commodity forensic researcher locked to the year ${horizon.numericYear} (${horizon.cutoffDateLabel}). Report ONLY statutes, reserve ratios, clearinghouses, codebase parameters, and events that occurred ON OR BEFORE ${horizon.numericYear}. Filter out and OMIT every single statute, Bank Act, clearing rail, protocol upgrade, or event dated ${horizon.numericYear + 1} or later—never mention future years even for comparison.`
            : isFiatQuery
            ? 'You are a forensic monetary-history, central-bank, and payment-rail researcher. Produce a detailed, high-density 6-section dossier packed with exact central-bank statutes, M2/balance-sheet expansion figures, broken gold-window dates, payment-rail batch windows (Fedwire, CHIPS, TARGET2, SWIFT, ACH), and real asset-freeze/capital-control precedents from live Google Search results.'
            : 'You are a forensic cryptocurrency codebase and physical commodity researcher. Produce a detailed, high-density 6-section technical dossier packed with exact GitHub repository names, config constants, genesis/supply numbers, upgrade heights, CVEs, and dated incident postmortems from live Google Search results. Clearly separate live mainnet consensus from unactivated roadmap proposals.',
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
  customClaim = '',
  timelineYear: GlobalTimelineYear = 'PRESENT'
): Promise<{ intelText: string; sources: GroundingSource[] }> {
  const horizon = getHistoricalAuditHorizon(timelineYear);
  const invTitle = invObj.title || invObj.shortName || `Invariant ${invObj.id}`;
  const cutoffNote = horizon.isHistorical
    ? `STRICTLY ON OR BEFORE ${horizon.cutoffDateLabel} (<= ${horizon.numericYear}; OMIT any statutes, upgrades, or events from ${horizon.numericYear + 1} or later!)`
    : 'up through November 2026 (separate live active mainnet behavior from unactivated proposals)';
  const focusPrompt = customClaim
    ? `Fact-check this specific user claim/evidence regarding ${targetAudit.name} ($${targetAudit.ticker}) concerning ${invTitle}: "${customClaim}". Verify exact statutes, reserve rules, GitHub commits, consensus parameters, or postmortems ${cutoffNote}.`
    : `Pull fresh forensic intelligence ${cutoffNote} for ${targetAudit.name} ($${targetAudit.ticker}) strictly focused on ${invTitle} (Current telemetry: ${invObj.telemetry}).`;

  try {
    const response = await withBackoff(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: focusPrompt,
        config: {
          systemInstruction: horizon.isHistorical
            ? `You are a concise forensic monetary and protocol researcher locked strictly to <= ${horizon.numericYear}. Return ONLY verifiable facts, statutes, reserve rules, or codebase constants existing on or before ${horizon.numericYear}. Never mention any year > ${horizon.numericYear}.`
            : 'You are a concise forensic cryptocurrency codebase and commodity researcher. Return dense, verifiable facts citing exact repository names, config constants, block heights, dates, and live mainnet status.',
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
  existingBaseline: AuditData | null,
  isFiatQuery = false,
  timelineYear: GlobalTimelineYear = 'PRESENT'
): string {
  const horizon = getHistoricalAuditHorizon(timelineYear);
  const baselineContext = existingBaseline
    ? `\nEXISTING VERIFIED ${horizon.isHistorical ? `<= ${horizon.numericYear} HISTORICAL ` : ''}TECHNICAL EVIDENCE FOR $${existingBaseline.ticker} (${existingBaseline.name}):
Architecture: ${existingBaseline.architecture} | Consensus Family: ${existingBaseline.consensusFamily}
Verified Receipts: ${existingBaseline.invariants
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
1. DO NOT blindly copy prior scores—independently grade EVERY single invariant ("01" through "06") strictly against the canonical quantitative rubric brackets in your system instructions using verified ${
        horizon.isHistorical ? `<= ${horizon.numericYear} historical` : 'live 2026'
      } intelligence!
2. Set hasGenesisPremineOrVcOrIco = true if this specific asset pre-minted/pre-allocated genesis or token supply to founders, foundations, ICO buyers, VCs, or central-bank monopolies; set hasProtocolDevTaxOrKillSwitch = true if consensus/law enforces a mandatory coinbase tax or sovereign asset freeze/kill-switch.
3. Evaluate active production state ${horizon.isHistorical ? `strictly as of ${horizon.numericYear} (zero post-${horizon.numericYear} facts!)` : 'today on live mainnet'}.
4. Every single invariant's "geniusParagraph" (01 through 06) MUST be a full, unabridged 180–240 word forensic deep-dive (never summarize into short 2-3 sentence blurbs!).\n`
    : '';

  const freshIntelContext = intelText
    ? `\nGOOGLE SEARCH GROUNDED INTELLIGENCE (${
        horizon.isHistorical ? `FILTERED STRICTLY TO <= ${horizon.numericYear} — IGNORE ANY POST-${horizon.numericYear} ITEM IF PRESENT` : 'RETRIEVED TODAY'
      }):\n${intelText}\n`
    : '';

  const historicalHorizonBlock = horizon.isHistorical
    ? `\nMANDATORY GLOBAL TIME MACHINE HORIZON (${horizon.cutoffDateLabel}):
- ${horizon.strictChronologyDirective}
- ${horizon.eraMonetaryRule}
- ZERO POST-${horizon.numericYear} YEARS ALLOWED: Every single calendar year mentioned anywhere in your JSON output MUST be <= ${horizon.numericYear}. Do NOT mention any year >= ${horizon.numericYear + 1} even in passing!\n`
    : '';

  const fiatGuidance = isFiatQuery
    ? horizon.isHistorical && (timelineYear === '1913' || timelineYear === '1971')
      ? `- CRITICAL ${timelineYear} SOVEREIGN CURRENCY RULE: "${targetQuery}" is a sovereign currency audited strictly at the ${timelineYear} historical stop (${horizon.cutoffDateLabel}). Always set "ticker" to the canonical 3-letter ISO-4217 currency code (e.g., "CAD", "USD", "GBP", "CHF", "JPY") and set isUpperLayerOverlayOrChannel = true, hasGenesisPremineOrVcOrIco = true, hasProtocolDevTaxOrKillSwitch = true. Apply ${horizon.eraMonetaryRule} Ground every paragraph and receipt strictly in <= ${horizon.numericYear} legislation, reserve ratios, convertibility status, and contemporaneous clearinghouses—NEVER cite post-${horizon.numericYear} Bank Acts (such as the 1992 Bank Act on a 1971 CAD audit!), post-${horizon.numericYear} electronic RTGS rails, or blockchain repos.\n`
      : `- CRITICAL FIAT CURRENCY OVERLAY RULE: "${targetQuery}" is a sovereign fiat currency audited under the exact same 6-invariant thermodynamic rubric and placed in ECOSYSTEM OVERLAYS. Always set consensusFamily = "ZERO_JOULE_BFT", isUpperLayerOverlayOrChannel = true, hasGenesisPremineOrVcOrIco = true, hasProtocolDevTaxOrKillSwitch = true, carrierLayerOneVelocityCap = 0, grade = "F", totalScore = 0.0, and every invariant score ("01" through "06") = 0.00. Always set "ticker" to the canonical 3-letter ISO-4217 currency code (e.g., "USD", "EUR", "GBP", "JPY", "CHF", "CNY", "CAD", etc.). Ground each paragraph in real central-bank legislation, reserve-requirement rules, M2/balance-sheet expansion metrics, broken commodity/gold pegs, correspondent clearing-rail schedules, sanctions/freeze authorities, and fractional-reserve credit mechanics${
          horizon.isHistorical ? ` strictly on or before ${horizon.numericYear} (zero post-${horizon.numericYear} laws or rails!)` : ''
        }—do NOT invent GitHub repositories or blockchain CVEs.\n`
    : '';

  const inv06ContrastRule = resolveSecretGeniusTemplateFromEnv(process.env)
    ? 'AUTHORITATIVE SECRET GENIUS PARAGRAPH TEMPLATE & LEXICON in your system instructions word-for-word in structure, opening cadence, sentence sequence, and vocabulary—do NOT drift from that Secret template or lexicon'
    : horizon.isHistorical
    ? `Secret Origin Thesis Paragraph Template in your system instructions (exact canonical opening cadence, physics laws/equations, and vocabulary for each invariant 01–06; never add generic AI intros; conclude Invariant 06 with a contemporaneous <= ${horizon.numericYear} contrast such as "${horizon.contemporaryVelocityContrast}" and NEVER mention post-${horizon.numericYear} protocols or years!)`
    : 'Secret Origin Thesis Paragraph Template in your system instructions (exact canonical opening cadence, physics laws/equations, and vocabulary for each invariant 01–06; never add generic AI intros; for non-KAS assets, conclude Invariant 06 with a direct contrast against Kaspa’s stateless, contention-free Proof-of-Work BlockDAG at 10+ BPS, M = 1.0, and NEVER self-contrast $KAS)';

  return `Run a complete, rigorous 6-Invariant Thermodynamic Audit${
    horizon.isHistorical ? ` STRICTLY AT THE HISTORICAL YEAR ${horizon.numericYear} (${horizon.cutoffDateLabel})` : ''
  } on the cryptocurrency network, token, sovereign currency, Layer-2 overlay/channel protocol, OR physical metal/commodity: "${targetQuery}".
${historicalHorizonBlock}${baselineContext}${freshIntelContext}
IMPORTANT:
${fiatGuidance}- CRITICAL PHYSICAL METAL / ELEMENT RULE: All physical Periodic Table metals and elements (such as Gold/Au/XAU, Silver/Ag/XAG, Copper/Cu/XCU, Platinum/Pt/XPT, Palladium/Pd/XPD, Titanium/Ti, Tungsten/W, Rhodium/Rh, Uranium/U, Nickel/Ni, Aluminum/Al, Zinc/Zn, Lithium/Li, etc.) are PRIMARY LAYER-1 substrates ("PHYSICAL_COMMODITY"). Always set consensusFamily = "PHYSICAL_COMMODITY", isUpperLayerOverlayOrChannel = false, hasGenesisPremineOrVcOrIco = false, and hasProtocolDevTaxOrKillSwitch = false—NEVER classify a physical metal as an overlay or tokenized wrapper unless the user explicitly requested a custodial/wrapped token like PAXG or XAUT. Always set "ticker" to the canonical short symbol ("CU" for Copper, "XAU" for Gold, "XAG" for Silver, "XPT" for Platinum, "XPD" for Palladium, "BTC" for Bitcoin, etc.) rather than a full word. Note: "CU" / "XCU" means Physical Copper (Cu-29).
- Classify consensusFamily strictly as "BLOCKDAG_POW", "LINEAR_POW", "PHYSICAL_COMMODITY", "ENERGY_ARBITRAGED_POW", or "ZERO_JOULE_BFT" based on ACTIVE consensus/backing ${
    horizon.isHistorical ? `in ${horizon.numericYear}` : 'today'
  } (never classify active hardware PoW as ZERO_JOULE_BFT due to unactivated proposals, and NEVER classify a payment-channel mesh or state-channel overlay over sequential PoW as BLOCKDAG_POW—set isUpperLayerOverlayOrChannel = true and consensusFamily = "LINEAR_POW"!).
- CARRIER-SUBORDINATED VELOCITY LAW (M_overlay < M_carrier < 1.0): Off-chain HTLC/PTLC channel signature exchanges burn 0.0 Joules (deferred IOUs, NOT M = 1.0 Proof-of-Work!). If "${targetQuery}" is a Layer-2 payment-channel network, state-channel protocol, rollup, or inscription overlay, set isUpperLayerOverlayOrChannel = true, set carrierLayerOneVelocityCap to its base Layer-1 carrier's Velocity score (e.g., 0.20 for Bitcoin, 1.00 for Kaspa), and score Invariant 06 STRICTLY BELOW its sequential L1 carrier (0.05–0.18, e.g., 0.15)!
- Strictly obey the project-agnostic quantitative rubric brackets in your system instructions!
- MANDATORY LENGTH & FORENSIC RIGOR FOR ALL 6 INVARIANTS ("01" through "06"):
  * "paragraph": Concise, clear 55–75 word Normie Mode explanation${horizon.isHistorical ? ` strictly grounded in <= ${horizon.numericYear} facts` : ''}.
  * "geniusParagraph": Uncompromising, exhaustive 180–240 word (minimum 1,000 characters EACH) Genius Mode forensic audit paragraph strictly following the ${inv06ContrastRule}, citing exact primary institutional/codebase receipts, statutory/config constants, supply/tax/expansion numbers, mathematical consensus/retarget/quorum/clearing formulas, partition + freeze/resplice behavior, and dated historical incidents/postmortems${
    horizon.isHistorical ? ` on or before ${horizon.numericYear}` : ''
  } (ending with a simple dash "-").
  * "conclusion": Comprehensive 130–180 word GRADE Evidence Certainty synthesis following the ${
    resolveSecretGeniusTemplateFromEnv(process.env)
      ? 'AUTHORITATIVE SECRET GENIUS PARAGRAPH TEMPLATE & LEXICON in your system instructions'
      : 'canonical CONCLUSION cadence ("Evaluating these findings through the GRADE evidence certainty framework yields a <CERTAINTY> rating...")'
  }, enumerating key codebase/institutional receipts${horizon.isHistorical ? ` (strictly <= ${horizon.numericYear})` : ''}, all 6 individual invariant scores (01 through 06), total score out of 6.00, and terminal compliance grade.
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
    const userPullLimit = resolveDailyPullLimit({
      isAuthenticated: Boolean(principal.verifiedUser),
      isAdmin: principal.isAdmin
    });
    const dailyQuota = getUserDailyQuotaStatus(
      dailyQuotaLedger,
      principal.allKeys,
      Date.now(),
      userPullLimit,
      principal.isAdmin
    );
    res.json({
      strictCreditLock: isStrictCreditLockActive() && !principal.isAdmin,
      isAuthenticated: Boolean(principal.verifiedUser),
      isAdmin: principal.isAdmin,
      adminEmail: principal.isAdmin ? principal.verifiedEmail : null,
      dailyPullLimit: userPullLimit,
      anonymousDailyPullLimit: DAILY_NEW_FULL_PULL_LIMIT,
      signedInDailyPullLimit: SIGNED_IN_DAILY_NEW_FULL_PULL_LIMIT,
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
    const userPullLimit = resolveDailyPullLimit({
      isAuthenticated: Boolean(principal.verifiedUser),
      isAdmin: principal.isAdmin
    });
    const dailyQuota = getUserDailyQuotaStatus(
      dailyQuotaLedger,
      principal.allKeys,
      Date.now(),
      userPullLimit,
      principal.isAdmin
    );
    res.json({
      isAuthenticated: Boolean(principal.verifiedUser),
      isAdmin: principal.isAdmin,
      adminEmail: principal.isAdmin ? principal.verifiedEmail : null,
      dailyPullLimit: userPullLimit,
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
    const userPullLimit = resolveDailyPullLimit({
      isAuthenticated: true,
      isAdmin: true
    });
    const dailyQuota = getUserDailyQuotaStatus(
      dailyQuotaLedger,
      principal.allKeys,
      Date.now(),
      userPullLimit,
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
    serverCacheRevision++;
    Object.values(PRELOADED_AUDITS).forEach((item) => indexAuditAliases(item));
    try {
      if (fs.existsSync(CACHE_FILE_PATH)) {
        await fs.promises.unlink(CACHE_FILE_PATH);
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
      serverCacheRevision++;
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

  app.get('/api/gains-cohort', async (req: Request, res: Response) => {
    try {
      const wantsLive = req.query.live !== '0';
      if (wantsLive) {
        const result = await Promise.race([
          ensureFreshLiveGainsCohort(),
          new Promise<{
            record: ReturnType<typeof getPersistedGainsCohort>;
            liveSpotMap: Record<string, number>;
            windowTrajectories: ReturnType<typeof getCachedWindowTrajectories>;
          }>((resolve) =>
            setTimeout(
              () =>
                resolve({
                  record: getPersistedGainsCohort(),
                  liveSpotMap: {},
                  windowTrajectories: getCachedWindowTrajectories()
                }),
              4500
            )
          )
        ]);
        res.json({
          record: result.record,
          liveSpotMap: result.liveSpotMap,
          windowTrajectories: result.windowTrajectories
        });
        return;
      }
    } catch {
      // Fallback cleanly to persisted record
    }
    const record = getPersistedGainsCohort();
    res.json({ record, windowTrajectories: getCachedWindowTrajectories() });
  });

  app.put('/api/gains-cohort', async (req: Request, res: Response) => {
    const verifiedUser = await verifyFirebaseBearerToken(req.headers.authorization);
    if (!verifiedUser) {
      res.status(401).json({
        error: 'Verified sign-in is required to persist shared cohort updates.'
      });
      return;
    }
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
      const verifiedUser = await verifyFirebaseBearerToken(req.headers.authorization);
      const body = (req.body || {}) as { spotOverrides?: Record<string, number> };
      const trustedSpotOverrides = verifiedUser ? body.spotOverrides : undefined;
      const result = await syncLivePricesAndPersistGainsCohort(trustedSpotOverrides);
      res.json(result);
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Failed to sync live prices.'
      });
    }
  });

  app.post('/api/gains-cohort/reset', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;
    const record = resetPersistedGainsCohort();
    res.json({ record });
  });

  app.get('/api/m2-benchmark', async (req: Request, res: Response) => {
    try {
      const force = req.query.refresh === '1';
      const dataset = await Promise.race([
        getLiveM2BenchmarkDataset(force),
        new Promise<ReturnType<typeof getCachedM2BenchmarkDataset>>((resolve) =>
          setTimeout(() => resolve(getCachedM2BenchmarkDataset()), 4500)
        )
      ]);
      res.json({ dataset });
    } catch {
      res.json({ dataset: getCachedM2BenchmarkDataset() });
    }
  });

  // POST /api/audit — SSE streaming 6-invariant grounded audit on gemini-4-hydrogen
  app.post('/api/audit', async (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      query?: string;
      existingBaseline?: AuditData | null;
      bypassCache?: boolean;
      sandbox?: boolean;
      timelineYear?: string | null;
      userId?: string | null;
      clientId?: string | null;
    };

    const rawQuery = String(body.query || '').trim();
    if (!rawQuery || rawQuery.length > 120) {
      res.status(400).json({ error: 'Query must be between 1 and 120 characters.' });
      return;
    }

    const timelineYear = parseGlobalTimelineYear(
      typeof body.timelineYear === 'string' ? body.timelineYear : 'PRESENT'
    );
    const horizon = getHistoricalAuditHorizon(timelineYear);

    const principal = await resolveVerifiedRequestPrincipal(req, body);
    const userPullLimit = resolveDailyPullLimit({
      isAuthenticated: Boolean(principal.verifiedUser),
      isAdmin: principal.isAdmin
    });
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
      if (hit && hasDedicatedTimelineCoverage(hit, timelineYear)) {
        const currentQuota = getUserDailyQuotaStatus(
          dailyQuotaLedger,
          principal.allKeys,
          Date.now(),
          userPullLimit,
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
            timelineYear,
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
    const existingRootAudit = existingBaseline || lookupCachedAudit(rawQuery);
    const scopeQuery = existingRootAudit ? existingRootAudit.ticker || rawQuery : rawQuery;
    const marketDir = await getMarketCapDirectory();
    const scopeResult = evaluateMarketScope({
      query: scopeQuery,
      cachedAuditHit: false,
      isExplicitReaudit: Boolean(existingRootAudit),
      marketEntries: marketDir.entries
    });

    if (!scopeResult.allowed) {
      const currentQuota = getUserDailyQuotaStatus(
        dailyQuotaLedger,
        principal.allKeys,
        Date.now(),
        userPullLimit,
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

    // 2) HARD DAILY LIMIT: 2 ANONYMOUS / 5 SIGNED-IN FULL PULLS PER UTC DAY (UNLIMITED FOR ADMIN)
    const quotaAttempt = consumeDailyPull(
      dailyQuotaLedger,
      principal.allKeys,
      Date.now(),
      userPullLimit,
      principal.isAdmin
    );
    if (!quotaAttempt.allowed) {
      const signInHint = !principal.verifiedUser
        ? ` Sign in with Google to unlock ${SIGNED_IN_DAILY_NEW_FULL_PULL_LIMIT} daily audits.`
        : '';
      res.status(429).json({
        error: `Daily limit of ${userPullLimit} new full pulls reached for today.${signInHint} Cached & archived assets remain unlimited (0 credits). Resets at 00:00 UTC.`,
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
      // Never feed Present-era (e.g. 1992/2026) baseline prose into Gemini when pulling a historical stop!
      const promptBaseline: AuditData | null = horizon.isHistorical
        ? existingRootAudit && hasDedicatedTimelineCoverage(existingRootAudit, timelineYear)
          ? projectAuditAtYear(existingRootAudit, timelineYear)
          : null
        : existingBaseline;

      const commodityMatch = !existingRootAudit
        ? resolvePhysicalCommodityQuery(rawQuery, normalizeLookupKey(rawQuery))
        : null;
      const isRawPhysicalMetalQuery = Boolean(
        commodityMatch && !TOKENIZED_COMMODITY_WRAPPER_TICKERS.has(commodityMatch.symbol)
      );
      const fiatMatch =
        !existingRootAudit && !commodityMatch
          ? resolveFiatCurrencyQuery(rawQuery, normalizeLookupKey(rawQuery))
          : null;
      const isFiatQuery =
        Boolean(fiatMatch) ||
        (Boolean(existingRootAudit) &&
          resolveFiatCurrencyQuery(
            existingRootAudit?.ticker || '',
            normalizeLookupKey(existingRootAudit?.ticker || '')
          ) !== null);
      const querySubject = existingRootAudit
        ? `${existingRootAudit.name} (${existingRootAudit.ticker})`
        : isRawPhysicalMetalQuery && commodityMatch
        ? `${commodityMatch.name} (${commodityMatch.symbol})`
        : fiatMatch
        ? `${fiatMatch.name} (${fiatMatch.symbol})`
        : rawQuery;

      const freshBundle = await fetchFreshGroundedWebIntel(
        ai,
        querySubject,
        promptBaseline,
        isFiatQuery,
        timelineYear
      );
      sendEvent({
        type: 'intel',
        sources: freshBundle.sources,
        hasIntel: Boolean(freshBundle.intelText)
      });

      const userPrompt = buildFullAuditPrompt(
        querySubject,
        freshBundle.intelText,
        promptBaseline,
        isFiatQuery,
        timelineYear
      );

      const runtimeSystemInstruction = buildGeminiSystemPrompt(process.env, timelineYear);
      const hasSecretTemplate = Boolean(resolveSecretGeniusTemplateFromEnv(process.env));

      let parsed: RawGeminiAuditPayload | null = null;
      let accumulatedJson = '';

      try {
        const stream = await withBackoff(() =>
          ai.models.generateContentStream({
            model: 'gemini-4-hydrogen',
            contents: userPrompt,
            config: {
              systemInstruction: runtimeSystemInstruction,
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
              systemInstruction: runtimeSystemInstruction,
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

      // Enforce strict <= horizon.numericYear chronological integrity on historical Time Machine pulls
      if (horizon.isHistorical) {
        const candidateTicker = String(parsed.ticker || existingRootAudit?.ticker || rawQuery);
        const estimatedGenesis = resolveAssetGenesisYear(candidateTicker, {
          ticker: candidateTicker,
          name: String(parsed.name || existingRootAudit?.name || ''),
          architecture: String(parsed.architecture || '')
        } as AuditData);

        if (estimatedGenesis <= horizon.numericYear) {
          const leakedYears = findAnachronisticYearsInPayload(parsed, horizon.numericYear);
          if (leakedYears.length > 0) {
            try {
              const repairPrompt = `CRITICAL CHRONOLOGY VIOLATION DETECTED IN YOUR ${horizon.numericYear} HISTORICAL AUDIT:
Your JSON draft contained post-${horizon.numericYear} anachronistic year references: ${leakedYears.join(', ')}.
${horizon.strictChronologyDirective}
${horizon.eraMonetaryRule}
Rewrite ONLY the affected fields in the JSON below so EVERY single statute, Bank Act, reserve ratio, clearing rail, protocol detail, receipt, and date is STRICTLY on or before ${horizon.numericYear} (ZERO calendar years > ${horizon.numericYear} anywhere in the JSON!), while preserving full 180–240 word geniusParagraph forensic depth and trailing "-" separators:

${JSON.stringify(parsed)}`;

              const repairResp = await withBackoff(() =>
                ai.models.generateContent({
                  model: 'gemini-4-hydrogen',
                  contents: repairPrompt,
                  config: {
                    systemInstruction: runtimeSystemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: GEMINI_SCHEMA,
                    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
                    maxOutputTokens: 32768
                  }
                })
              );
              const repairedText = (repairResp.text || '').trim();
              if (repairedText) {
                const repairedCandidate = safeParseAuditJson<RawGeminiAuditPayload>(repairedText);
                if (isValidCompleteAuditPayload(repairedCandidate)) {
                  parsed = repairedCandidate;
                }
              }
            } catch (repairErr) {
              console.warn('Historical chronology repair pass skipped:', repairErr);
            }
            parsed = scrubResidualAnachronisticReferences(parsed, horizon.numericYear);
          }
        }
      }

      const normalizedQuery = normalizeLookupKey(rawQuery);
      const previousScore = promptBaseline ? Number(promptBaseline.totalScore) : null;
      const cleanTickerGuess =
        existingRootAudit?.ticker || normalizedQuery.slice(0, 8);
      const builtAudit = normalizeAuditPayload(
        parsed,
        rawQuery,
        normalizedQuery,
        promptBaseline,
        freshBundle.sources,
        previousScore,
        Boolean(PRELOADED_AUDITS[cleanTickerGuess]),
        {
          preserveSecretGeniusProse: hasSecretTemplate,
          timelineYear,
          contemporaryVelocityContrast: horizon.contemporaryVelocityContrast
        }
      );

      const mergedAudit = attachHistoricalAuditToBaseline(
        existingRootAudit,
        builtAudit,
        timelineYear
      );

      if (!isSandboxRequest) {
        indexAuditAliases(mergedAudit);
        persistServerCacheToDisk();
      }

      const updatedQuota = getUserDailyQuotaStatus(
        dailyQuotaLedger,
        principal.allKeys,
        Date.now(),
        userPullLimit,
        principal.isAdmin
      );
      sendEvent({
        type: 'done',
        audit: mergedAudit,
        sources: freshBundle.sources,
        cachedHit: false,
        timelineYear,
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
          userPullLimit,
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
      timelineYear?: string | null;
    };

    const mode = body.mode;
    const targetAudit = body.targetAudit;
    const invId = String(body.invId || '').trim();
    const userInput = String(body.userInput || '').trim();
    const isGeniusMode = Boolean(body.isGeniusMode);
    const timelineYear = parseGlobalTimelineYear(
      typeof body.timelineYear === 'string' ? body.timelineYear : 'PRESENT'
    );
    const horizon = getHistoricalAuditHorizon(timelineYear);
    const invChronologyBlock = horizon.isHistorical
      ? `\nGLOBAL TIME MACHINE HORIZON LOCK (<= ${horizon.numericYear} — ${horizon.cutoffDateLabel}):
- ${horizon.strictChronologyDirective}
- ${horizon.eraMonetaryRule}
- NEVER cite any calendar year > ${horizon.numericYear}!\n`
      : '';

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
    const runtimeSystemInstruction = buildGeminiSystemPrompt(process.env, timelineYear);
    const singleInvTemplateDirective = buildSingleInvariantSecretGeniusDirective(
      targetInv.id,
      targetAudit.ticker,
      process.env
    );

    try {
      if (mode === 'REAUDIT') {
        const freshBundle = await fetchSingleInvariantWebIntel(
          ai,
          targetAudit,
          targetInv,
          '',
          timelineYear
        );
        const singlePrompt = `Perform a surgical, low-token SINGLE-INVARIANT Thermodynamic Re-Audit${
          horizon.isHistorical ? ` STRICTLY AT YEAR ${horizon.numericYear} (<= ${horizon.numericYear})` : ''
        } ONLY for Invariant ${targetInv.id} ("${targetInv.title}") on ${targetAudit.name} ($${targetAudit.ticker}).
${invChronologyBlock}Asset Architecture: ${targetAudit.architecture} | Consensus Family: ${targetAudit.consensusFamily} | Current Invariant 02 Cost Floor: ${formatScore(
          targetAudit.invariants[1]?.score
        )}/1.0.
Existing Verified Evidence for Invariant ${targetInv.id}:
- Telemetry: ${targetInv.telemetry}
- Normie Summary: ${targetInv.paragraph}
- Genius Forensic Evidence: ${targetInv.geniusParagraph || targetInv.paragraph}
- Receipts: ${(targetInv.receipts || []).join(' • ')}

CANONICAL PROJECT-AGNOSTIC RUBRIC BRACKETS FOR INVARIANT ${rubricSpec.id} (${rubricSpec.name}):
${rubricSpec.brackets.map((b) => `- [${b.range}]: ${b.rule}`).join('\n')}

${singleInvTemplateDirective}

${
  freshBundle.intelText
    ? `FRESH GOOGLE SEARCH INTEL (${horizon.isHistorical ? `<= ${horizon.numericYear} HORIZON` : 'RETRIEVED TODAY'}):\n${freshBundle.intelText}\n`
    : ''
}
INSTRUCTIONS:
1. Grade ONLY Invariant ${targetInv.id} strictly against the rubric brackets above and ${
          horizon.isHistorical ? `<= ${horizon.numericYear} historical reality (zero post-${horizon.numericYear} facts!)` : 'live active mainnet reality'
        }.
2. Keep internal reasoning concise so output is never cut off. Return a complete 55–75 word "paragraph" (Normie Mode), a complete 180–230 word "geniusParagraph" matching the template cadence and structure above (citing exact <= ${
          horizon.numericYear
        } statutes/repos/constants/dates), up to 4 "receipts", and a complete 2–3 sentence "verdictNote" explaining what fresh intel confirmed or changed.`;

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
                systemInstruction: runtimeSystemInstruction,
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
          userInput,
          timelineYear
        );

        const challengePrompt = `A user is CHALLENGING the thermodynamic audit${
          horizon.isHistorical ? ` AT HISTORICAL YEAR ${horizon.numericYear} (<= ${horizon.numericYear})` : ''
        } of ${targetAudit.name} ($${targetAudit.ticker}) on Invariant ${targetInv.id}: "${targetInv.title}" (Current Score: ${formatScore(
          targetInv.score
        )} / 1.0 • Current Invariant 02 Cost Floor: ${formatScore(
          targetAudit.invariants[1]?.score
        )} / 1.0 • Consensus Family: ${targetAudit.consensusFamily}).
${invChronologyBlock}
USER CHALLENGE / NEW EVIDENCE SUBMITTED:
"${userInput}"

CURRENT VERIFIED AUDIT BASELINE FOR INVARIANT ${targetInv.id}:
- Telemetry: ${targetInv.telemetry}
- Normie Audit: ${targetInv.paragraph}
- Genius Audit: ${targetInv.geniusParagraph || targetInv.paragraph}
- Verified Receipts: ${(targetInv.receipts || []).join(' • ')}

CANONICAL PROJECT-AGNOSTIC RUBRIC BRACKETS FOR INVARIANT ${rubricSpec.id} (${rubricSpec.name}):
${rubricSpec.brackets.map((b) => `- [${b.range}]: ${b.rule}`).join('\n')}

${singleInvTemplateDirective}

${
  freshBundle.intelText
    ? `LIVE GOOGLE SEARCH FACT-CHECK OF USER CLAIM (${horizon.isHistorical ? `<= ${horizon.numericYear}` : 'CURRENT'}):\n${freshBundle.intelText}\n`
    : ''
}
ADJUDICATION RULES (ZERO SYCOPHANCY — PURE PHYSICS & CODEBASE LAW):
1. Fact-check the user's claim rigorously${horizon.isHistorical ? ` strictly within the <= ${horizon.numericYear} historical horizon` : ''}. Do NOT cave to marketing hype, unactivated roadmap promises, post-${horizon.numericYear} anachronisms, or category errors (e.g., off-chain 0-Joule signatures do NOT produce M = 1.0; if Invariant 02 Cost Floor E = 0, all non-Cost-Floor invariants MUST stay 0.00; any genesis premine/ICO/VC/statutory monopoly/dev-tax forces 01 Sovereignty = 0.00; overlays obey M_overlay < M_L1 < 1.0).
2. ENERGY-ARBITRAGE COUPLING LAW: NEVER claim that genesis distribution (Invariant 01) is decoupled from Thermodynamic Cost Floor (Invariant 02)! Any genesis premine, token pre-allocation, VC/ICO mint, statutory monopoly, or mandatory protocol developer tax (Invariant 01 = 0.00) injects 0-Joule units into the fungible supply, capping Invariant 02 at <= 0.30 (premine/pre-allocation/specie monopoly) or <= 0.35 (dev tax) and capping Terminal Grade at <= D+.
3. If the user provides genuinely verifiable ${horizon.isHistorical ? `<= ${horizon.numericYear}` : 'live mainnet'} evidence or exposes a real factual/calibration error under the canonical rubric brackets above, set verdict = "ACCEPTED" or "PARTIAL", set scoreChanged = true (or false if only telemetry/text updates), provide the calibrated updatedScore, and update the invariant's paragraph, updatedGeniusParagraph (180–230 words strictly preserving the template cadence, structure, and <= ${horizon.numericYear} horizon), telemetry, quickSummary, and receipts.
4. If the user's claim fails physics or rubric rules, set verdict = "REJECTED", scoreChanged = false, updatedScore = ${
          targetInv.score
        }, and deliver an uncompromising forensic rebuttal in "rebuttalOrAnalysis" (${
          isGeniusMode
            ? '140–220 words using the exact template lexicon, physics laws, constants, math, and rubric brackets'
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
                systemInstruction: runtimeSystemInstruction,
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
      const breakdownPrompt = `Provide a deeper, surgical technical breakdown${
        horizon.isHistorical ? ` STRICTLY AT HISTORICAL YEAR ${horizon.numericYear} (<= ${horizon.numericYear})` : ''
      } for ${targetAudit.name} ($${targetAudit.ticker}) strictly focused on Invariant ${targetInv.id}: "${targetInv.title}" (Score: ${formatScore(
        targetInv.score
      )} / 1.0 • Telemetry: ${targetInv.telemetry}).
${invChronologyBlock}
EXISTING AUDIT CONTEXT:
- Normie Summary: ${targetInv.paragraph}
- Genius Dossier: ${targetInv.geniusParagraph || targetInv.paragraph}
- Verified Receipts: ${(targetInv.receipts || []).join(' • ')}
- Rubric Brackets: ${rubricSpec.brackets.map((b) => `[${b.range}] ${b.rule}`).join(' | ')}

${isGeniusMode ? `${singleInvTemplateDirective}\n\n` : ''}SPECIFIC USER BREAKDOWN REQUEST:
${
  userInput
    ? `"${userInput}"`
    : `"Unpack the deeper architectural mechanics, exact ${horizon.isHistorical ? `<= ${horizon.numericYear} statutes/protocol rules` : 'codebase/protocol rules'}, edge-case failure modes, and mathematical trade-offs explaining why $${targetAudit.ticker} scores ${formatScore(
        targetInv.score
      )}/1.0 on ${targetInv.title}."`
}

OUTPUT STYLE (${isGeniusMode ? 'GENIUS FORENSIC MODE' : 'NORMIE PLAIN-ENGLISH MODE'}):
${
  isGeniusMode
    ? `Write 2–3 dense, uncompromising forensic paragraphs (180–280 words total) anchored directly in the template structure, canonical voice, and exact <= ${horizon.numericYear} historical/technical facts without fluff or markdown headers. Keep internal thinking concise so every paragraph finishes cleanly.`
    : `Write 2 clear, vivid, plain-English paragraphs (110–170 words total) using intuitive real-world analogies and concrete <= ${horizon.numericYear} facts so anyone can immediately grasp the exact engineering reality without jargon. Keep internal thinking concise so every paragraph finishes cleanly.`
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
              systemInstruction: isGeniusMode
                ? 'You are "The Truth — thermodynamic audit". Deliver crystal-clear, technically unimpeachable Genius Mode single-invariant breakdowns anchored verbatim in the provided Secret paragraph template and lexicon, Nakamoto Proof-of-Work, Landauer’s Principle, and verified codebase mechanics. Output clean plain-text paragraphs only, ensuring every sentence finishes completely.'
                : 'You are "The Truth — thermodynamic audit". Deliver crystal-clear, technically unimpeachable single-invariant breakdowns anchored in Nakamoto Proof-of-Work, Landauer’s Principle, and verified codebase mechanics. Output clean plain-text paragraphs only, ensuring every sentence finishes completely.',
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
  let cachedArchiveMapRev = -1;
  let cachedArchiveMap: Record<string, AuditData> = {};
  let cachedAliasObjRev = -1;
  let cachedAliasObj: Record<string, string> = {};

  const getServerArchiveMap = (): Record<string, AuditData> => {
    if (cachedArchiveMapRev === serverCacheRevision) return cachedArchiveMap;
    const out: Record<string, AuditData> = {};
    serverAuditCache.forEach((val, key) => {
      out[key] = val;
    });
    cachedArchiveMap = out;
    cachedArchiveMapRev = serverCacheRevision;
    return out;
  };

  const getServerAliasObject = (): Record<string, string> => {
    if (cachedAliasObjRev === serverCacheRevision) return cachedAliasObj;
    const out: Record<string, string> = {};
    serverAliasCache.forEach((val, key) => {
      out[key] = val;
    });
    cachedAliasObj = out;
    cachedAliasObjRev = serverCacheRevision;
    return out;
  };

  app.use(['/compendium', '/llms.txt', '/llms-full.txt', '/truth.txt', '/sitemap.xml'], (_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    if (_req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // Single ultra-light plain-text compendium containing 100% of the Origin Thesis,
  // Deterministic Grading Rubric, Live Cohort & US M2 Gains, all 8 Global Time Machine
  // Epoch Scoreboards (1913–Present), and Full Genius & Normie Audits across every year.
  app.get(
    ['/compendium', '/llms.txt', '/llms-full.txt', '/truth.txt'],
    async (req: Request, res: Response) => {
      await syncFirestoreArchivedAuditsToCache();
      const origin = resolvePublicOrigin(req);
      const plainText = buildFullPlainTextCompendium(origin, getServerArchiveMap(), {
        cohortRecord: getPersistedGainsCohort(),
        m2Dataset: getCachedM2BenchmarkDataset()
      });
      res
        .status(200)
        .setHeader('Content-Type', 'text/plain; charset=utf-8')
        .setHeader('Cache-Control', 'public, max-age=300')
        .send(plainText);
    }
  );

  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    await syncFirestoreArchivedAuditsToCache();
    const origin = resolvePublicOrigin(req);
    const ordered = sortAuditTickersByGrade(getServerArchiveMap());
    const urls = [
      `${origin}/`,
      `${origin}/compendium`,
      `${origin}/llms.txt`,
      `${origin}/?archive=1`,
      `${origin}/?rubric=1`,
      `${origin}/?gains=1`,
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

  const resolvePublicOrigin = (req: Request): string =>
    resolvePublicOriginFromHeaders({
      host: req.get('host'),
      xForwardedHost: typeof req.headers['x-forwarded-host'] === 'string'
        ? req.headers['x-forwarded-host']
        : Array.isArray(req.headers['x-forwarded-host'])
        ? req.headers['x-forwarded-host'][0]
        : undefined,
      xForwardedProto: typeof req.headers['x-forwarded-proto'] === 'string'
        ? req.headers['x-forwarded-proto']
        : Array.isArray(req.headers['x-forwarded-proto'])
        ? req.headers['x-forwarded-proto'][0]
        : undefined,
      xOriginalHost: typeof req.headers['x-original-host'] === 'string'
        ? req.headers['x-original-host']
        : undefined,
      forwarded: typeof req.headers.forwarded === 'string' ? req.headers.forwarded : undefined,
      protocol: req.protocol,
      configuredAppUrl: process.env.APP_URL
    });

  const injectSocialOrigin = (html: string, req: Request): string => {
    const origin = resolvePublicOrigin(req);
    const archiveMap = getServerArchiveMap();
    const aliasObj = getServerAliasObject();
    const meta = buildOpenGraphMetaForUrl(
      req.originalUrl || '/',
      archiveMap,
      aliasObj
    );
    const withMeta = injectCanonicalSocialMeta(html, {
      origin,
      title: meta.title,
      description: meta.description,
      urlPath: meta.urlPath
    });
    const ssrInnerHtml = buildSsrRootInnerHtml(
      req.originalUrl || '/',
      origin,
      archiveMap,
      aliasObj,
      {
        cohortRecord: getPersistedGainsCohort(),
        m2Dataset: getCachedM2BenchmarkDataset()
      }
    );
    return injectSsrRootHtml(withMeta, ssrInnerHtml);
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

  const SOCIAL_STATIC_ASSETS: Record<string, { file: string; contentType: string }> = {
    '/og-card.jpg': { file: 'og-card.jpg', contentType: 'image/jpeg' },
    '/logo-512.png': { file: 'logo-512.png', contentType: 'image/png' },
    '/apple-touch-icon.png': { file: 'apple-touch-icon.png', contentType: 'image/png' },
    '/favicon.ico': { file: 'favicon.ico', contentType: 'image/png' }
  };

  for (const [routePath, assetMeta] of Object.entries(SOCIAL_STATIC_ASSETS)) {
    app.get(routePath, (req: Request, res: Response, next) => {
      const distAsset = path.resolve(process.cwd(), 'dist', assetMeta.file);
      const publicAsset = path.resolve(process.cwd(), 'public', assetMeta.file);
      const resolvedPath =
        IS_PROD && fs.existsSync(distAsset)
          ? distAsset
          : fs.existsSync(publicAsset)
          ? publicAsset
          : fs.existsSync(distAsset)
          ? distAsset
          : null;
      if (!resolvedPath) {
        next();
        return;
      }
      res.setHeader('Content-Type', assetMeta.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, no-transform');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Robots-Tag', 'all');
      if (req.method === 'HEAD') {
        const stat = fs.statSync(resolvedPath);
        res.setHeader('Content-Length', String(stat.size));
        res.status(200).end();
        return;
      }
      res.sendFile(resolvedPath);
    });
  }

  const syncArchiveForSsrIfNeeded = async (originalUrl: string): Promise<void> => {
    const qIdx = originalUrl.indexOf('?');
    if (qIdx === -1) {
      // Do not stall `/` or social card crawlers on Firestore cold-start sync when preloaded audits are ready.
      void syncFirestoreArchivedAuditsToCache();
      return;
    }
    const qs = originalUrl.slice(qIdx);
    if (!/(?:^|[?&])(?:asset|compare|tickers)=/i.test(qs)) {
      void syncFirestoreArchivedAuditsToCache();
      return;
    }
    await Promise.race([
      syncFirestoreArchivedAuditsToCache(),
      new Promise<void>((resolve) => setTimeout(resolve, 400))
    ]);
  };

  // Frontend Hosting (Vite middleware in dev; dist static in prod)
  if (!IS_PROD) {
    const vite = await import('vite');
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(viteServer.middlewares);

    const indexPath = path.resolve(process.cwd(), 'index.html');
    app.get('*', async (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      try {
        await syncArchiveForSsrIfNeeded(req.originalUrl || '/');
        const template = await fs.promises.readFile(indexPath, 'utf8');
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
    const distIndexPath = path.join(distDir, 'index.html');
    let cachedProdIndexHtml: string | null = null;
    app.use(express.static(distDir, { index: false, maxAge: '1h' }));
    app.get('*', async (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      try {
        await syncArchiveForSsrIfNeeded(req.originalUrl || '/');
        if (cachedProdIndexHtml === null) {
          cachedProdIndexHtml = await fs.promises.readFile(distIndexPath, 'utf8');
        }
        const html = injectSocialOrigin(cachedProdIndexHtml, req);
        res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').end(html);
      } catch {
        res.sendFile(distIndexPath);
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
