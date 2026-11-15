import {
  getAuditProvenance,
  getAuditRevisionAnalysis,
  type AuditCategory
} from './auditProvenance.ts';
import {
  buildBasketSyncedCohortRecord,
  computeCohortAggregateSummary,
  type GainsCohortRecord
} from './gainsCohortData.ts';
import {
  ALIAS_MAP,
  DEFAULT_TITLES,
  formatScore,
  sortAuditTickersByGrade,
  type AuditData
} from './rubricSpec.ts';

export interface ArchivedAuditListFilters {
  basket?: 'PASSED' | 'FAILED' | 'ALL';
  category?: AuditCategory | 'ALL';
  family?: string;
  q?: string;
}

export interface ArchivedAuditSummary {
  ticker: string;
  name: string;
  grade: string;
  totalScore: number;
  maxScore: number;
  consensusFamily: string;
  architecture: string;
  certainty: string;
  basket: 'PASSED' | 'FAILED';
  category: AuditCategory;
  categoryLabel: 'Ecosystem / Overlays' | 'Physical Commodity' | 'Core Sovereign L1';
  provenanceBadge: 'Deterministic Reference Audit' | 'Live AI Heuristic Audit';
  isDeterministicReference: boolean;
  isZeroJoule: boolean;
  deepLinkUrl: string;
  invariantScores: Array<{
    id: string;
    shortName: string;
    title: string;
    score: number;
    telemetry: string;
  }>;
}

export interface DeepLinkSelectionState {
  hasDeepLink: boolean;
  assetTicker: string | null;
  compareTickers: string[];
  mode: 'NORMIE' | 'GENIUS' | null;
  openWartimeLab: boolean;
  openGainsModal: boolean;
  openRubricModal: boolean;
  openGenesisModal: boolean;
  invariantId: string | null;
}

export interface OpenGraphMeta {
  title: string;
  description: string;
  urlPath: string;
}

export function normalizeAgentLookupToken(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/^\$/, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function buildArchiveDeepLinkUrl(
  tickers: string[],
  options: { mode?: 'NORMIE' | 'GENIUS'; lab?: 'wartime'; invId?: string } = {}
): string {
  const clean = tickers.map((t) => normalizeAgentLookupToken(t)).filter(Boolean);
  const params = new URLSearchParams();
  if (clean.length === 1) {
    params.set('asset', clean[0]);
  } else if (clean.length > 1) {
    params.set('compare', clean.slice(0, 4).join(','));
  }
  if (options.mode) {
    params.set('mode', options.mode);
  }
  if (options.lab === 'wartime') {
    params.set('lab', 'wartime');
  }
  if (options.invId) {
    params.set('inv', options.invId);
  }
  const qs = params.toString();
  return qs ? `/?${qs}` : '/';
}

export function summarizeArchivedAudit(
  audit: AuditData,
  preloadedTickers?: Set<string>
): ArchivedAuditSummary {
  const prov = getAuditProvenance(audit, { preloadedTickers });
  const score = Number(audit.totalScore) || 0;
  const basket: 'PASSED' | 'FAILED' =
    score > 1.0 && String(audit.grade || '').toUpperCase() !== 'F' ? 'PASSED' : 'FAILED';
  const isZeroJoule =
    audit.consensusFamily === 'ZERO_JOULE_BFT' ||
    Number(audit.invariants?.[1]?.score ?? 0) <= 0;
  const categoryLabel =
    prov.category === 'ECOSYSTEM_OVERLAY'
      ? 'Ecosystem / Overlays'
      : prov.category === 'PHYSICAL_COMMODITY'
      ? 'Physical Commodity'
      : 'Core Sovereign L1';

  return {
    ticker: audit.ticker,
    name: audit.name,
    grade: audit.grade,
    totalScore: Number(score.toFixed(2)),
    maxScore: 6.0,
    consensusFamily: audit.consensusFamily,
    architecture: audit.architecture,
    certainty: audit.certainty,
    basket,
    category: prov.category,
    categoryLabel,
    provenanceBadge: prov.provenanceBadge,
    isDeterministicReference: prov.isDeterministicReference,
    isZeroJoule,
    deepLinkUrl: buildArchiveDeepLinkUrl([audit.ticker]),
    invariantScores: (audit.invariants || []).slice(0, 6).map((inv, idx) => ({
      id: inv.id || `0${idx + 1}`,
      shortName: inv.shortName,
      title: inv.title || DEFAULT_TITLES[idx] || inv.shortName,
      score: Number((Number(inv.score) || 0).toFixed(2)),
      telemetry: inv.telemetry
    }))
  };
}

export function findArchivedAudit(
  auditsMap: Record<string, AuditData>,
  rawQuery: string,
  dynamicAliases: Record<string, string> = {}
): AuditData | null {
  const norm = normalizeAgentLookupToken(rawQuery);
  if (!norm) return null;

  if (auditsMap[norm]) return auditsMap[norm];

  const staticTarget = ALIAS_MAP[norm];
  if (staticTarget && auditsMap[staticTarget]) {
    return auditsMap[staticTarget];
  }

  const dynTarget = dynamicAliases[norm];
  if (dynTarget && auditsMap[dynTarget]) {
    return auditsMap[dynTarget];
  }

  for (const key of Object.keys(auditsMap)) {
    const candidate = auditsMap[key];
    if (!candidate) continue;
    if (normalizeAgentLookupToken(candidate.ticker) === norm) return candidate;
    if (normalizeAgentLookupToken(candidate.name) === norm) return candidate;
    if (
      Array.isArray(candidate.queryAliases) &&
      candidate.queryAliases.some((al) => normalizeAgentLookupToken(al) === norm)
    ) {
      return candidate;
    }
  }

  return null;
}

export function listArchivedAudits(
  auditsMap: Record<string, AuditData>,
  filters: ArchivedAuditListFilters = {},
  preloadedTickers?: Set<string>
): ArchivedAuditSummary[] {
  const orderedTickers = sortAuditTickersByGrade(auditsMap);
  const queryNorm = filters.q ? normalizeAgentLookupToken(filters.q) : '';
  const queryRawLower = filters.q ? String(filters.q).trim().toLowerCase() : '';
  const basketFilter = filters.basket && filters.basket !== 'ALL' ? filters.basket : null;
  const catFilter = filters.category && filters.category !== 'ALL' ? filters.category : null;
  const famFilter = filters.family ? String(filters.family).trim().toUpperCase() : null;

  const results: ArchivedAuditSummary[] = [];
  for (const tk of orderedTickers) {
    const audit = auditsMap[tk];
    if (!audit) continue;
    const summary = summarizeArchivedAudit(audit, preloadedTickers);

    if (basketFilter && summary.basket !== basketFilter) continue;
    if (catFilter && summary.category !== catFilter) continue;
    if (famFilter && famFilter !== 'ALL' && summary.consensusFamily.toUpperCase() !== famFilter) {
      continue;
    }
    if (queryNorm || queryRawLower) {
      const hay = `${audit.ticker} ${audit.name} ${audit.architecture} ${audit.consensusFamily}`.toLowerCase();
      const hayNorm = normalizeAgentLookupToken(hay);
      const matches =
        (queryRawLower && hay.includes(queryRawLower)) ||
        (queryNorm && hayNorm.includes(queryNorm));
      if (!matches) continue;
    }

    results.push(summary);
  }
  return results;
}

export interface ArchiveComparisonSuccess {
  ok: true;
  archiveOnly: true;
  creditsUsed: 0;
  mode: 'NORMIE' | 'GENIUS';
  tickers: string[];
  deepLinkUrl: string;
  leaderTicker: string;
  spreadScore: number;
  assets: Array<
    ArchivedAuditSummary & {
      conclusion: string;
      invariants: Array<{
        id: string;
        shortName: string;
        title: string;
        score: number;
        telemetry: string;
        quickSummary: string;
        analysis: string;
        receipts: string[];
      }>;
    }
  >;
  invariantMatrix: Array<{
    id: string;
    title: string;
    shortName: string;
    winnerTickers: string[];
    highestScore: number;
    scoresByTicker: Record<string, { score: number; telemetry: string; analysis: string }>;
  }>;
  posVsPowContrast: {
    hasZeroJoulePos: boolean;
    hasThermodynamicPow: boolean;
    zeroJouleTickers: string[];
    thermodynamicTickers: string[];
    physicsVerdict: string;
  };
  cohortGainsContext: {
    passCycleAvgPct: number;
    failCycleAvgPct: number;
    failExOutlierAvgPct: number;
    victoryMultiple: string;
  };
  summaryMarkdown: string;
}

export interface ArchiveComparisonFailure {
  ok: false;
  archiveOnly: true;
  creditsUsed: 0;
  error: string;
  missingTickers: string[];
  availableTickers: string[];
}

export type ArchiveComparisonResult = ArchiveComparisonSuccess | ArchiveComparisonFailure;

export function buildArchiveComparison(
  auditsMap: Record<string, AuditData>,
  rawTickers: string[],
  options: {
    mode?: 'NORMIE' | 'GENIUS';
    dynamicAliases?: Record<string, string>;
    preloadedTickers?: Set<string>;
    cohortRecord?: Partial<GainsCohortRecord> | null;
  } = {}
): ArchiveComparisonResult {
  const mode: 'NORMIE' | 'GENIUS' = options.mode === 'NORMIE' ? 'NORMIE' : 'GENIUS';
  const dynAliases = options.dynamicAliases || {};

  const resolvedAudits: AuditData[] = [];
  const missingTickers: string[] = [];
  const seen = new Set<string>();

  for (const rawTk of rawTickers || []) {
    const clean = String(rawTk || '').trim();
    if (!clean) continue;
    const hit = findArchivedAudit(auditsMap, clean, dynAliases);
    if (!hit) {
      missingTickers.push(normalizeAgentLookupToken(clean) || clean);
      continue;
    }
    if (!seen.has(hit.ticker)) {
      seen.add(hit.ticker);
      resolvedAudits.push(hit);
    }
  }

  if (missingTickers.length > 0) {
    return {
      ok: false,
      archiveOnly: true,
      creditsUsed: 0,
      error: `Archive-only strict mode: unarchived asset(s) requested (${missingTickers.join(
        ', '
      )}). No live Gemini pull was triggered and no scores were fabricated.`,
      missingTickers,
      availableTickers: sortAuditTickersByGrade(auditsMap)
    };
  }

  if (resolvedAudits.length < 2 || resolvedAudits.length > 4) {
    return {
      ok: false,
      archiveOnly: true,
      creditsUsed: 0,
      error: 'Provide between 2 and 4 archived tickers or asset names to run a side-by-side comparison.',
      missingTickers: [],
      availableTickers: sortAuditTickersByGrade(auditsMap)
    };
  }

  const orderedByScore = [...resolvedAudits].sort(
    (a, b) => (Number(b.totalScore) || 0) - (Number(a.totalScore) || 0)
  );
  const leaderTicker = orderedByScore[0].ticker;
  const lowestScore = Number(orderedByScore[orderedByScore.length - 1].totalScore) || 0;
  const highestScore = Number(orderedByScore[0].totalScore) || 0;
  const spreadScore = Number((highestScore - lowestScore).toFixed(2));

  const assets = resolvedAudits.map((audit) => {
    const base = summarizeArchivedAudit(audit, options.preloadedTickers);
    return {
      ...base,
      conclusion: audit.conclusion,
      invariants: (audit.invariants || []).slice(0, 6).map((inv, idx) => ({
        id: inv.id || `0${idx + 1}`,
        shortName: inv.shortName,
        title: inv.title || DEFAULT_TITLES[idx] || inv.shortName,
        score: Number((Number(inv.score) || 0).toFixed(2)),
        telemetry: inv.telemetry,
        quickSummary: inv.quickSummary,
        normieParagraph: inv.paragraph,
        geniusParagraph: inv.geniusParagraph || inv.paragraph,
        analysis:
          mode === 'GENIUS' && inv.geniusParagraph ? inv.geniusParagraph : inv.paragraph,
        receipts: inv.receipts || []
      }))
    };
  });

  const invariantMatrix = [0, 1, 2, 3, 4, 5].map((idx) => {
    const id = `0${idx + 1}`;
    const firstInv = resolvedAudits[0]?.invariants?.[idx];
    const title = firstInv?.title || DEFAULT_TITLES[idx] || `Invariant ${id}`;
    const shortName = firstInv?.shortName || `Inv ${id}`;
    const scoresByTicker: Record<
      string,
      { score: number; telemetry: string; analysis: string }
    > = {};
    let highest = -1;

    for (const a of assets) {
      const inv = a.invariants[idx];
      const sc = Number(inv?.score ?? 0);
      if (sc > highest) highest = sc;
      scoresByTicker[a.ticker] = {
        score: sc,
        telemetry: inv?.telemetry || '',
        analysis: inv?.analysis || ''
      };
    }

    const winnerTickers = assets
      .filter((a) => Math.abs((a.invariants[idx]?.score ?? 0) - highest) < 1e-6)
      .map((a) => a.ticker);

    return {
      id,
      title,
      shortName,
      winnerTickers,
      highestScore: Number(Math.max(0, highest).toFixed(2)),
      scoresByTicker
    };
  });

  const zeroJouleTickers = assets.filter((a) => a.isZeroJoule).map((a) => a.ticker);
  const thermodynamicTickers = assets.filter((a) => !a.isZeroJoule).map((a) => a.ticker);
  const hasZeroJoulePos = zeroJouleTickers.length > 0;
  const hasThermodynamicPow = thermodynamicTickers.length > 0;

  const physicsVerdict =
    hasZeroJoulePos && hasThermodynamicPow
      ? `Conservation of Energy Decouple: ${zeroJouleTickers.join(
          ', '
        )} register 0.00 Joules of protocol Cost Floor (Grade F — weak subjectivity & weightless staking yield) whereas ${thermodynamicTickers.join(
          ', '
        )} anchor scarcity to irreversible physical work (E > 0).`
      : hasZeroJoulePos
      ? `Zero-Joule Illusion Cluster: ${zeroJouleTickers.join(
          ', '
        )} all verify consensus via 0-Joule signatures/validators, collapsing Cost Floor, Landauer Immutability, and Velocity M to 0.00 (Grade F).`
      : `All compared assets operate above the E > 0 floor; spread (${formatScore(
          spreadScore
        )}) is governed by DAA survivability, UTXO parallelism, and BlockDAG velocity M.`;

  const syncedCohort = buildBasketSyncedCohortRecord(auditsMap, options.cohortRecord);
  const toLiquid = (arr: typeof syncedCohort.passed) =>
    arr
      .filter((i) => i.liquidCycle && i.basePrice && i.snapshotSpot)
      .map((i) => ({
        ticker: i.ticker,
        cyclePct: ((i.snapshotSpot! - i.basePrice!) / i.basePrice!) * 100,
        multiple: i.snapshotSpot! / i.basePrice!,
        tactical90dPct: i.tactical90dPct,
        liquidCycle: i.liquidCycle,
        isOutlier: i.isOutlier
      }));
  const aggregate = computeCohortAggregateSummary(
    toLiquid(syncedCohort.passed),
    toLiquid(syncedCohort.failed),
    1000,
    false
  );

  const tickers = assets.map((a) => a.ticker);
  const deepLinkUrl = buildArchiveDeepLinkUrl(tickers, { mode });

  const headerLine = `THE TRUTH // ARCHIVE SIDE-BY-SIDE (${tickers.join(' vs ')}) [${mode} MODE]`;
  const scoreLines = assets.map(
    (a) => `- $${a.ticker} (${a.name}): Grade ${a.grade} (${formatScore(a.totalScore)}/6.00) • ${a.architecture}`
  );
  const matrixLines = invariantMatrix.map((row) => {
    const rowScores = tickers
      .map((tk) => `$${tk} ${formatScore(row.scoresByTicker[tk]?.score ?? 0)}`)
      .join(' | ');
    return `  ${row.id} ${row.shortName}: ${rowScores}`;
  });

  const summaryMarkdown = [
    headerLine,
    ...scoreLines,
    'Invariant Breakdown:',
    ...matrixLines,
    `Physics Verdict: ${physicsVerdict}`,
    `Deep Link: ${deepLinkUrl}`
  ].join('\n');

  return {
    ok: true,
    archiveOnly: true,
    creditsUsed: 0,
    mode,
    tickers,
    deepLinkUrl,
    leaderTicker,
    spreadScore,
    assets,
    invariantMatrix,
    posVsPowContrast: {
      hasZeroJoulePos,
      hasThermodynamicPow,
      zeroJouleTickers,
      thermodynamicTickers,
      physicsVerdict
    },
    cohortGainsContext: {
      passCycleAvgPct: Number(aggregate.passCycleAvg.toFixed(1)),
      failCycleAvgPct: Number(aggregate.failCycleAvg.toFixed(1)),
      failExOutlierAvgPct: Number(aggregate.failExOutlierAvg.toFixed(1)),
      victoryMultiple: aggregate.portfolioVictoryMultiple
    },
    summaryMarkdown
  };
}

export interface ArchiveResearchResult {
  ok: boolean;
  archiveOnly: true;
  creditsUsed: 0;
  query: string;
  matchedTickers: string[];
  unarchivedMentions: string[];
  comparison: ArchiveComparisonSuccess | null;
  audits: Array<
    ArchivedAuditSummary & {
      conclusion: string;
      revisionAnalysis: ReturnType<typeof getAuditRevisionAnalysis>;
    }
  >;
  answer: string;
  deepLinkUrl: string | null;
}

const STOP_WORDS = new Set<string>([
  'THE',
  'AND',
  'FOR',
  'VS',
  'VERSUS',
  'WITH',
  'FROM',
  'ABOUT',
  'WHAT',
  'WHICH',
  'HOW',
  'WHY',
  'COMPARE',
  'CHECK',
  'SHOW',
  'TELL',
  'AUDIT',
  'ARCHIVED',
  'TRUTH',
  'COIN',
  'COINS',
  'CRYPTO',
  'PROOF',
  'STAKE',
  'WORK',
  'POS',
  'POW',
  'GRADE',
  'SCORE',
  'BETTER',
  'IS',
  'ARE',
  'IN',
  'ON',
  'OF',
  'TO',
  'DOES',
  'DO',
  'CAN',
  'YOU',
  'ME',
  'A',
  'AN'
]);

export function answerArchiveResearchQuestion(
  auditsMap: Record<string, AuditData>,
  rawQuestion: string,
  options: {
    mode?: 'NORMIE' | 'GENIUS';
    dynamicAliases?: Record<string, string>;
    preloadedTickers?: Set<string>;
    cohortRecord?: Partial<GainsCohortRecord> | null;
  } = {}
): ArchiveResearchResult {
  const resolvedMode: 'NORMIE' | 'GENIUS' = options.mode === 'NORMIE' ? 'NORMIE' : 'GENIUS';
  const resolvedOptions = { ...options, mode: resolvedMode };
  const query = String(rawQuestion || '').trim();
  const dynAliases = options.dynamicAliases || {};
  const matchedAudits: AuditData[] = [];
  const seenTickers = new Set<string>();

  // 1) Scan tokens and multi-word names against strictly archived assets
  const explicitDollarMatches = [...query.matchAll(/\$([A-Za-z0-9_-]{2,14})/g)].map((m) => m[1]);
  const wordTokens = query
    .split(/[^A-Za-z0-9_-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);

  // Also check consecutive two-word phrases (e.g. "Physical Gold", "Pi Network", "Bitcoin Cash", "Lightning Network")
  const twoWordPhrases: string[] = [];
  for (let i = 0; i < wordTokens.length - 1; i++) {
    twoWordPhrases.push(`${wordTokens[i]} ${wordTokens[i + 1]}`);
  }

  const candidates = [...explicitDollarMatches, ...twoWordPhrases, ...wordTokens];
  const unarchivedMentions: string[] = [];

  for (const cand of candidates) {
    const norm = normalizeAgentLookupToken(cand);
    if (!norm || STOP_WORDS.has(norm)) continue;
    const hit = findArchivedAudit(auditsMap, cand, dynAliases);
    if (hit) {
      if (!seenTickers.has(hit.ticker)) {
        seenTickers.add(hit.ticker);
        matchedAudits.push(hit);
      }
    } else if (/^\$[A-Za-z0-9]{2,12}$/.test(`$${cand}`) && explicitDollarMatches.includes(cand)) {
      if (!unarchivedMentions.includes(norm)) unarchivedMentions.push(norm);
    }
  }

  // If the whole query resolves directly as a single asset string (e.g., "FAKECOIN999")
  if (matchedAudits.length === 0 && wordTokens.length <= 2) {
    const directNorm = normalizeAgentLookupToken(query);
    if (directNorm && !STOP_WORDS.has(directNorm) && !/POS|STAKE|PASS|FAIL|ALL/.test(directNorm)) {
      return {
        ok: false,
        archiveOnly: true,
        creditsUsed: 0,
        query,
        matchedTickers: [],
        unarchivedMentions: [directNorm],
        comparison: null,
        audits: [],
        answer: `Archive-only boundary: "${query}" is not in the verified Thermodynamic Archive. No live Gemini audit was executed and no score was fabricated.`,
        deepLinkUrl: null
      };
    }
  }

  // Handle topic queries like "Why do Proof of Stake networks fail?" or "Which coins passed?"
  if (matchedAudits.length === 0) {
    const qLower = query.toLowerCase();
    const allOrdered = sortAuditTickersByGrade(auditsMap).map((tk) => auditsMap[tk]);
    const passed = allOrdered.filter((a) => Number(a.totalScore) > 1.0 && a.grade !== 'F');
    const failed = allOrdered.filter((a) => Number(a.totalScore) <= 1.0 || a.grade === 'F');

    if (/pos|stake|illusion|0-joule|zero[- ]joule|bft|slash|cantillon/.test(qLower)) {
      const posSample = failed.slice(0, 4).map((a) => a.ticker);
      const benchmarkTickers = ['KAS', ...posSample.filter((t) => t !== 'KAS')].slice(0, 4);
      const comp =
        benchmarkTickers.length >= 2
          ? buildArchiveComparison(auditsMap, benchmarkTickers, resolvedOptions)
          : null;
      return {
        ok: true,
        archiveOnly: true,
        creditsUsed: 0,
        query,
        matchedTickers: benchmarkTickers,
        unarchivedMentions: [],
        comparison: comp && comp.ok ? comp : null,
        audits: benchmarkTickers
          .map((tk) => auditsMap[tk])
          .filter(Boolean)
          .map((a) => {
            const sum = summarizeArchivedAudit(a, options.preloadedTickers);
            return {
              ...sum,
              conclusion: a.conclusion,
              revisionAnalysis: getAuditRevisionAnalysis(a, sum.isDeterministicReference)
            };
          }),
        answer: `In the Thermodynamic Archive (${failed.length} Failed / E = 0 assets vs ${passed.length} Passed / E > 0 assets), every Proof-of-Stake protocol scores 0.00 / 6.00 (Grade F) because stake signatures expend 0.00 Joules of physical energy (Invariant 02). Without an irreversible thermodynamic cost floor, history lacks Landauer weight (Weak Subjectivity), wartime >33.4% BFT splits flatline consensus, and staking rewards compound zero-work Cantillon dilution. Compare benchmark leaders ${passed
          .slice(0, 3)
          .map((a) => `$${a.ticker} (${a.grade})`)
          .join(', ')} against PoS cohorts ${failed
          .slice(0, 4)
          .map((a) => `$${a.ticker}`)
          .join(', ')}.`,
        deepLinkUrl: comp && comp.ok ? comp.deepLinkUrl : buildArchiveDeepLinkUrl(benchmarkTickers, { mode: resolvedMode })
      };
    }

    if (/pass|best|top|fail|list|basket/.test(qLower)) {
      const picked = (/fail/.test(qLower) ? failed : passed).slice(0, 4);
      const tickers = picked.map((a) => a.ticker);
      return {
        ok: true,
        archiveOnly: true,
        creditsUsed: 0,
        query,
        matchedTickers: tickers,
        unarchivedMentions: [],
        comparison: null,
        audits: picked.map((a) => {
          const sum = summarizeArchivedAudit(a, options.preloadedTickers);
          return {
            ...sum,
            conclusion: a.conclusion,
            revisionAnalysis: getAuditRevisionAnalysis(a, sum.isDeterministicReference)
          };
        }),
        answer: `Archived Summary (${allOrdered.length} total audits • ${passed.length} Passed E > 0 • ${failed.length} Failed E = 0): Top Passed assets are ${passed
          .slice(0, 5)
          .map((a) => `$${a.ticker} ${a.grade} (${formatScore(a.totalScore)})`)
          .join(', ')}. Failed assets in archive include ${failed
          .slice(0, 5)
          .map((a) => `$${a.ticker}`)
          .join(', ')}.`,
        deepLinkUrl: buildArchiveDeepLinkUrl(tickers.slice(0, 4))
      };
    }

    return {
      ok: false,
      archiveOnly: true,
      creditsUsed: 0,
      query,
      matchedTickers: [],
      unarchivedMentions,
      comparison: null,
      audits: [],
      answer:
        'No archived cryptocurrency or physical commodity ticker matched your query. Ask about any archived ticker (e.g., KAS, BTC, LTC, XAU, XAG, XMR, ETH, SOL, ADA, TAO) or Proof-of-Stake vs Proof-of-Work comparisons.',
      deepLinkUrl: null
    };
  }

  const topMatched = matchedAudits.slice(0, 4);
  const matchedTickers = topMatched.map((a) => a.ticker);
  const compResult =
    matchedAudits.length >= 2
      ? buildArchiveComparison(auditsMap, matchedTickers, resolvedOptions)
      : null;

  const auditDetails = topMatched.map((a) => {
    const sum = summarizeArchivedAudit(a, options.preloadedTickers);
    return {
      ...sum,
      conclusion: a.conclusion,
      revisionAnalysis: getAuditRevisionAnalysis(a, sum.isDeterministicReference),
      invariants: (a.invariants || []).slice(0, 6).map((inv, idx) => ({
        id: inv.id || `0${idx + 1}`,
        shortName: inv.shortName,
        title: inv.title || DEFAULT_TITLES[idx] || inv.shortName,
        score: Number((Number(inv.score) || 0).toFixed(2)),
        telemetry: inv.telemetry,
        quickSummary: inv.quickSummary,
        normieParagraph: inv.paragraph,
        geniusParagraph: inv.geniusParagraph || inv.paragraph,
        receipts: inv.receipts || []
      }))
    };
  });

  const answer =
    compResult && compResult.ok
      ? compResult.summaryMarkdown
      : `${auditDetails[0].name} ($${auditDetails[0].ticker}) — Terminal Grade ${
          auditDetails[0].grade
        } (${formatScore(auditDetails[0].totalScore)}/6.00) • ${auditDetails[0].provenanceBadge}.\nArchitecture: ${
          auditDetails[0].architecture
        }\n${auditDetails[0].invariants
          .map(
            (i) =>
              `- ${i.id} ${i.shortName}: ${formatScore(i.score)}/1.0 (${i.telemetry})\n  ${
                resolvedMode === 'NORMIE' ? i.normieParagraph : i.geniusParagraph
              }`
          )
          .join('\n')}\nConclusion: ${auditDetails[0].conclusion}`;

  return {
    ok: true,
    archiveOnly: true,
    creditsUsed: 0,
    query,
    matchedTickers,
    unarchivedMentions,
    comparison: compResult && compResult.ok ? compResult : null,
    audits: auditDetails,
    answer,
    deepLinkUrl: buildArchiveDeepLinkUrl(matchedTickers, { mode: resolvedMode })
  };
}

export function parseDeepLinkSearchParams(search: string): DeepLinkSelectionState {
  const empty: DeepLinkSelectionState = {
    hasDeepLink: false,
    assetTicker: null,
    compareTickers: [],
    mode: null,
    openWartimeLab: false,
    openGainsModal: false,
    openRubricModal: false,
    openGenesisModal: false,
    invariantId: null
  };
  if (!search) return empty;

  try {
    const params = new URLSearchParams(search);
    const rawAsset = (params.get('asset') || '').trim();
    const rawCompare = (params.get('compare') || params.get('tickers') || '').trim();
    const rawMode = (params.get('mode') || '').trim().toUpperCase();
    const rawLab = (params.get('lab') || '').trim().toLowerCase();
    const rawInv = (params.get('inv') || '').trim();
    const openGainsModal = params.get('gains') === '1' || params.get('gains') === 'true';
    const openRubricModal = params.get('rubric') === '1' || params.get('rubric') === 'true';
    const openGenesisModal = params.get('genesis') === '1' || params.get('genesis') === 'true';
    const openWartimeLab = rawLab === 'wartime';

    const assetTicker = rawAsset ? normalizeAgentLookupToken(rawAsset) || null : null;
    const compareTickers = rawCompare
      ? rawCompare
          .split(',')
          .map((s) => normalizeAgentLookupToken(s))
          .filter(Boolean)
          .slice(0, 4)
      : [];
    const mode = rawMode === 'GENIUS' ? 'GENIUS' : rawMode === 'NORMIE' ? 'NORMIE' : null;
    const invariantId =
      rawInv && /^0?[1-6]$/.test(rawInv) ? rawInv.padStart(2, '0') : null;

    const hasDeepLink = Boolean(
      assetTicker ||
        compareTickers.length > 0 ||
        openWartimeLab ||
        openGainsModal ||
        openRubricModal ||
        openGenesisModal ||
        invariantId
    );

    return {
      hasDeepLink,
      assetTicker,
      compareTickers,
      mode,
      openWartimeLab,
      openGainsModal,
      openRubricModal,
      openGenesisModal,
      invariantId
    };
  } catch {
    return empty;
  }
}

export function buildOpenGraphMetaForUrl(
  originalUrl: string,
  auditsMap: Record<string, AuditData>,
  dynamicAliases: Record<string, string> = {}
): OpenGraphMeta {
  const defaultMeta: OpenGraphMeta = {
    title: 'The Truth — Thermodynamic Audit',
    description:
      'Sovereign Thermodynamic Verification Engine grading Layer-1 protocols, overlays, and physical commodities across six immutable laws of physics.',
    urlPath: '/'
  };

  try {
    const qIdx = originalUrl.indexOf('?');
    if (qIdx === -1) return defaultMeta;
    const search = originalUrl.slice(qIdx);
    const parsed = parseDeepLinkSearchParams(search);

    if (parsed.compareTickers.length >= 2) {
      const comp = buildArchiveComparison(auditsMap, parsed.compareTickers, {
        mode: parsed.mode || 'GENIUS',
        dynamicAliases
      });
      if (comp.ok) {
        const tickerLine = comp.assets
          .map((a) => `$${a.ticker} ${a.grade} (${formatScore(a.totalScore)}/6.0)`)
          .join(' vs ');
        return {
          title: `The Truth — ${comp.tickers.join(' vs ')} Thermodynamic Comparison`,
          description: `${tickerLine}. ${comp.posVsPowContrast.physicsVerdict}`.slice(0, 260),
          urlPath: comp.deepLinkUrl
        };
      }
    }

    if (parsed.assetTicker) {
      const hit = findArchivedAudit(auditsMap, parsed.assetTicker, dynamicAliases);
      if (hit) {
        return {
          title: `The Truth — ${hit.name} ($${hit.ticker}): Grade ${hit.grade} (${formatScore(
            hit.totalScore
          )}/6.0)`,
          description: `${hit.architecture}. Evaluated across Existential Sovereignty, E > 0 Cost Floor, Landauer Immutability, Wartime Availability, State Topology, and Velocity M.`.slice(
            0,
            260
          ),
          urlPath: buildArchiveDeepLinkUrl([hit.ticker], {
            mode: parsed.mode || undefined,
            lab: parsed.openWartimeLab ? 'wartime' : undefined
          })
        };
      }
    }

    if (parsed.openGenesisModal) {
      return {
        title: 'The Truth — First Principles: Physics Over Consensus',
        description:
          'Why sovereign money is a physical machine bounded by thermodynamics, 100 MJ of human labor, and the arrow of time.',
        urlPath: '/?genesis=1'
      };
    }

    return defaultMeta;
  } catch {
    return defaultMeta;
  }
}

export const MCP_ARCHIVE_TOOL_SCHEMAS = [
  {
    name: 'list_archived_audits',
    description:
      'List archived cryptocurrency and physical commodity audits from The Truth Vault (strictly archive-only, 0 AI credits). Filter by PASSED/FAILED basket, category, consensusFamily, or search query.',
    inputSchema: {
      type: 'object',
      properties: {
        basket: { type: 'string', enum: ['ALL', 'PASSED', 'FAILED'] },
        category: {
          type: 'string',
          enum: ['ALL', 'SOVEREIGN_L1_BENCHMARK', 'PHYSICAL_COMMODITY', 'ECOSYSTEM_OVERLAY']
        },
        family: { type: 'string' },
        q: { type: 'string' }
      }
    }
  },
  {
    name: 'get_archived_audit',
    description:
      'Fetch the full GENIUS-depth 6-invariant thermodynamic audit, codebase constants, receipts, and normie summaries for a single archived ticker or metal (e.g. KAS, BTC, ETH, SOL, XAU). Returns both full forensic geniusParagraph and plain-English paragraph so the AI decides the best depth for its user.',
    inputSchema: {
      type: 'object',
      required: ['ticker'],
      properties: {
        ticker: { type: 'string', description: 'Ticker symbol or asset name (e.g. KAS, BTC, SOL, Gold)' }
      }
    }
  },
  {
    name: 'compare_archived_audits',
    description:
      'Run a side-by-side 6-invariant thermodynamic comparison across 2 to 4 archived cryptocurrencies or physical commodities, defaulting to GENIUS mode so the AI gets complete forensic mechanics and can adapt explanations for its user.',
    inputSchema: {
      type: 'object',
      required: ['tickers'],
      properties: {
        tickers: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          maxItems: 4
        },
        mode: { type: 'string', enum: ['GENIUS', 'NORMIE'] }
      }
    }
  },
  {
    name: 'research_archive',
    description:
      'Answer educational or comparative questions about cryptocurrencies, Proof-of-Stake vs Proof-of-Work, or specific coins strictly using archived audits (never calls external AI generation). Defaults to GENIUS mode so the calling AI receives complete receipts and decides what level of detail its user will understand.',
    inputSchema: {
      type: 'object',
      required: ['question'],
      properties: {
        question: { type: 'string' },
        mode: { type: 'string', enum: ['GENIUS', 'NORMIE'] }
      }
    }
  }
];
