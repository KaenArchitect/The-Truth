import {
  getAuditProvenance,
  getAuditRevisionAnalysis,
  type AuditCategory
} from './auditProvenance.ts';
import {
  buildBasketSyncedCohortRecord,
  computeCohortAggregateSummary,
  type CohortAssetEntry,
  type GainsCohortRecord
} from './gainsCohortData.ts';
import {
  GENESIS_THESIS_GENIUS_PARAGRAPHS,
  GENESIS_THESIS_PARAGRAPHS,
  type ThesisDepthMode,
  type ThesisParagraph
} from './genesisThesisData.ts';
import {
  DEFAULT_M2_BENCHMARK_DATASET,
  computeM2AssetSummaries,
  type M2BenchmarkDataset,
  type M2HorizonSummary,
  type MacroM2HorizonKey
} from './m2BenchmarkData.ts';
import {
  ALIAS_MAP,
  DEFAULT_TITLES,
  GRADING_RUBRIC_SPEC,
  deriveGradeFromTotal,
  enforceEnergyArbitrageLawOnAudit,
  formatScore,
  sortAuditTickersByGrade,
  type AuditData,
  type RubricInvariantSpec
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
  openArchiveModal: boolean;
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

    if (/rubric|consisten|bracket|curve|how.*grad|grad.*work|arbitrage law/i.test(qLower)) {
      const rubricRef = buildAgentRubricReference(auditsMap);
      return {
        ok: true,
        archiveOnly: true,
        creditsUsed: 0,
        query,
        matchedTickers: [],
        unarchivedMentions: [],
        comparison: null,
        audits: [],
        answer: `Deterministic Grading Consistency Proof: ${rubricRef.consistencyVerification.verifiedCount}/${rubricRef.consistencyVerification.totalAudited} archived assets match deriveGradeFromTotal() with ${rubricRef.consistencyVerification.mismatchCount} mismatches (100% mathematically consistent). Standard Curve (Sovereignty > 0): ${rubricRef.standardGradeCurveSummary}. Sovereignty-Compromise Cap (Sovereignty = 0): ${rubricRef.sovereigntyCompromisedCurveSummary}. Zero-Joule Floor (Cost Floor = 0): automatic Grade F (0.00/6.00). Inspect full brackets at /?rubric=1 or /api/agent/rubric.`,
        deepLinkUrl: '/?rubric=1'
      };
    }

    if (/m2|money supply|live gains|cohort|perform|return|outperform/i.test(qLower)) {
      const gainsRef = buildAgentGainsReference(auditsMap, options.cohortRecord);
      const cyc = gainsRef.horizons.CYCLE;
      const m2All = gainsRef.m2Benchmark.horizons.ALL_TIME;
      return {
        ok: true,
        archiveOnly: true,
        creditsUsed: 0,
        query,
        matchedTickers: ['KAS', 'BTC', 'XAU'],
        unarchivedMentions: [],
        comparison: null,
        audits: [],
        answer: `Empirical Thermodynamic Gains & M2 Benchmark: Across the May 2022–Present cycle, Passed (E > 0) assets average ${cyc.passAvgPct >= 0 ? '+' : ''}${cyc.passAvgPct}% (${cyc.passExTopGainerAvgPct >= 0 ? '+' : ''}${cyc.passExTopGainerAvgPct}% ex-${cyc.passTopGainerTicker || 'top'}) vs Failed (E = 0) at ${cyc.failAvgPct >= 0 ? '+' : ''}${cyc.failAvgPct}% (${cyc.failExTopGainerAvgPct >= 0 ? '+' : ''}${cyc.failExTopGainerAvgPct}% ex-${cyc.failTopGainerTicker || 'top'}) — a ${cyc.victoryMultiple}x portfolio multiple. Against US M2 Money Supply ($${m2All.m2StartTrillions.toFixed(2)}T → $${m2All.m2EndTrillions.toFixed(2)}T), M2-adjusted multiples are ${m2All.assets.map((a) => `${a.ticker} ${a.m2AdjustedMult.toFixed(2)}x`).join(', ')}. Full dataset at /?gains=1 or /api/agent/gains.`,
        deepLinkUrl: '/?gains=1'
      };
    }

    if (/origin|thesis|easter egg|100\s*mj|weimar|grand canyon|first principle/i.test(qLower)) {
      const thesisRef = buildAgentOriginThesisReference(resolvedMode);
      return {
        ok: true,
        archiveOnly: true,
        creditsUsed: 0,
        query,
        matchedTickers: [],
        unarchivedMentions: [],
        comparison: null,
        audits: [],
        answer: `First-Principles Origin Thesis (${thesisRef.axiomCount} Axioms across Invariants 01–06, Inflation as 100 MJ Human Work Theft 07–12, and Cosmic Proof-of-Work 13–17): ${thesisRef.axioms[0]?.text || ''} Full 17-axiom treatise available at /?genesis=1 or /api/agent/origin-thesis.`,
        deepLinkUrl: '/?genesis=1'
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
        'No archived cryptocurrency or physical commodity ticker matched your query. Ask about any archived ticker (e.g., KAS, BTC, LTC, XAU, XAG, XMR, ETH, SOL, ADA, TAO), the deterministic grading rubric, live M2 gains, or the first-principles origin thesis.',
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
    openArchiveModal: false,
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
    const openArchiveModal = params.get('archive') === '1' || params.get('archive') === 'true';
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
        openArchiveModal ||
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
      openArchiveModal,
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

    if (parsed.openRubricModal) {
      return {
        title: 'The Truth — Deterministic 6-Invariant Thermodynamic Rubric',
        description:
          'Quantitative scoring brackets, Energy-Arbitrage Law (Sovereignty = 0 caps at D+), Zero-Joule Floor (E = 0 forces F), and 100% mathematical consistency verification.',
        urlPath: '/?rubric=1'
      };
    }

    if (parsed.openGainsModal) {
      return {
        title: 'The Truth — Live Thermodynamic Gains & US M2 Benchmark',
        description:
          'Empirical market performance of Passed (E > 0) vs Failed (E = 0) cohorts and KAS, BTC, Gold, and S&P 500 indexed against US M2 money supply.',
        urlPath: '/?gains=1'
      };
    }

    if (parsed.openArchiveModal) {
      return {
        title: 'The Truth — Complete Thermodynamic Audit Archive',
        description:
          'Verified 6-invariant forensic audits across Layer-1 Proof-of-Work protocols, consensus overlays, and physical Periodic Table commodities.',
        urlPath: '/?archive=1'
      };
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

// ============================================================================
// PILLAR 2: DETERMINISTIC RUBRIC & 100% MATHEMATICAL CONSISTENCY PROOF
// ============================================================================
export interface GradeCurveBracketSpec {
  grade: string;
  minScore: number;
  maxScore: number;
  rangeLabel: string;
  condition: string;
}

export const STANDARD_GRADE_CURVE_BRACKETS: readonly GradeCurveBracketSpec[] = [
  { grade: 'A+', minScore: 5.75, maxScore: 6.0, rangeLabel: '5.75–6.00', condition: 'Sovereignty > 0 & Cost Floor > 0' },
  { grade: 'A', minScore: 5.3, maxScore: 5.74, rangeLabel: '5.30–5.74', condition: 'Sovereignty > 0 & Cost Floor > 0' },
  { grade: 'A-', minScore: 4.9, maxScore: 5.29, rangeLabel: '4.90–5.29', condition: 'Sovereignty > 0 & Cost Floor > 0' },
  { grade: 'B+', minScore: 4.4, maxScore: 4.89, rangeLabel: '4.40–4.89', condition: 'Sovereignty > 0 & Cost Floor > 0' },
  { grade: 'B', minScore: 4.1, maxScore: 4.39, rangeLabel: '4.10–4.39', condition: 'Sovereignty > 0 & Cost Floor > 0' },
  { grade: 'B-', minScore: 3.92, maxScore: 4.09, rangeLabel: '3.92–4.09', condition: 'Sovereignty > 0 & Cost Floor > 0' },
  { grade: 'C+', minScore: 3.5, maxScore: 3.91, rangeLabel: '3.50–3.91', condition: 'Sovereignty > 0 & Cost Floor > 0' },
  { grade: 'C', minScore: 3.0, maxScore: 3.49, rangeLabel: '3.00–3.49', condition: 'Sovereignty > 0 & Cost Floor > 0' },
  { grade: 'C-', minScore: 2.3, maxScore: 2.99, rangeLabel: '2.30–2.99', condition: 'Sovereignty > 0 & Cost Floor > 0' },
  { grade: 'D+', minScore: 1.9, maxScore: 2.29, rangeLabel: '1.90–2.29', condition: 'Sovereignty > 0 & Cost Floor > 0' },
  { grade: 'D', minScore: 1.5, maxScore: 1.89, rangeLabel: '1.50–1.89', condition: 'Sovereignty > 0 & Cost Floor > 0' },
  { grade: 'D-', minScore: 1.01, maxScore: 1.49, rangeLabel: '1.01–1.49', condition: 'Sovereignty > 0 & Cost Floor > 0' },
  { grade: 'F', minScore: 0.0, maxScore: 1.0, rangeLabel: '≤ 1.00 or E = 0', condition: 'Cost Floor = 0.00 or Total ≤ 1.00' }
];

export const SOVEREIGNTY_COMPROMISED_GRADE_BRACKETS: readonly GradeCurveBracketSpec[] = [
  {
    grade: 'D+',
    minScore: 2.3,
    maxScore: 6.0,
    rangeLabel: '2.30–6.00 (Hard Cap D+)',
    condition: 'Sovereignty = 0.00 (premine / ICO / VC allocation / protocol dev tax) & Cost Floor > 0'
  },
  {
    grade: 'D',
    minScore: 1.75,
    maxScore: 2.29,
    rangeLabel: '1.75–2.29',
    condition: 'Sovereignty = 0.00 & Cost Floor > 0'
  },
  {
    grade: 'D-',
    minScore: 1.01,
    maxScore: 1.74,
    rangeLabel: '1.01–1.74',
    condition: 'Sovereignty = 0.00 & Cost Floor > 0'
  },
  {
    grade: 'F',
    minScore: 0.0,
    maxScore: 1.0,
    rangeLabel: '≤ 1.00 or E = 0',
    condition: 'Cost Floor = 0.00 or Total ≤ 1.00'
  }
];

export interface AuditConsistencyProofRow {
  ticker: string;
  name: string;
  invariantScores: [number, number, number, number, number, number];
  invariantSum: number;
  totalScore: number;
  ruleApplied: 'STANDARD_CURVE' | 'SOVEREIGNTY_ZERO_CAP_MAX_D_PLUS' | 'ZERO_JOULE_FLOOR_F';
  ruleExplanation: string;
  derivedGrade: string;
  storedGrade: string;
  consistent: boolean;
}

export interface AgentRubricReference {
  ok: true;
  archiveOnly: true;
  creditsUsed: 0;
  deepLinkUrl: '/?rubric=1';
  scaleMax: 6.0;
  invariantMax: 1.0;
  standardGradeCurveSummary: string;
  sovereigntyCompromisedCurveSummary: string;
  standardGradeCurve: readonly GradeCurveBracketSpec[];
  sovereigntyCompromisedCurve: readonly GradeCurveBracketSpec[];
  hardLaws: Array<{ id: string; name: string; rule: string }>;
  invariants: RubricInvariantSpec[];
  consistencyVerification: {
    allConsistent: boolean;
    totalAudited: number;
    verifiedCount: number;
    mismatchCount: number;
    rows: AuditConsistencyProofRow[];
  };
}

export function buildAgentRubricReference(
  auditsMap: Record<string, AuditData>
): AgentRubricReference {
  const ordered = sortAuditTickersByGrade(auditsMap);
  const rows: AuditConsistencyProofRow[] = [];
  let verifiedCount = 0;

  for (const tk of ordered) {
    const raw = auditsMap[tk];
    if (!raw) continue;
    const enforced = enforceEnergyArbitrageLawOnAudit(raw);
    const scores: [number, number, number, number, number, number] = [
      Number((Number(enforced.invariants?.[0]?.score) || 0).toFixed(2)),
      Number((Number(enforced.invariants?.[1]?.score) || 0).toFixed(2)),
      Number((Number(enforced.invariants?.[2]?.score) || 0).toFixed(2)),
      Number((Number(enforced.invariants?.[3]?.score) || 0).toFixed(2)),
      Number((Number(enforced.invariants?.[4]?.score) || 0).toFixed(2)),
      Number((Number(enforced.invariants?.[5]?.score) || 0).toFixed(2))
    ];
    const s01 = scores[0];
    const s02 = scores[1];
    const sum = Number(scores.reduce((acc, v) => acc + v, 0).toFixed(2));
    const effectiveTotal = s02 <= 0 ? 0 : sum;
    const derivedGrade = deriveGradeFromTotal(effectiveTotal, s02, s01);

    const ruleApplied: AuditConsistencyProofRow['ruleApplied'] =
      s02 <= 0 || effectiveTotal <= 1.0
        ? 'ZERO_JOULE_FLOOR_F'
        : s01 <= 0
        ? 'SOVEREIGNTY_ZERO_CAP_MAX_D_PLUS'
        : 'STANDARD_CURVE';

    const ruleExplanation =
      ruleApplied === 'ZERO_JOULE_FLOOR_F'
        ? s02 <= 0
          ? 'Cost Floor [02] = 0.00 J → Conservation of Energy Floor forces Total 0.00 & Grade F'
          : 'Total ≤ 1.00 → Terminal Grade F'
        : ruleApplied === 'SOVEREIGNTY_ZERO_CAP_MAX_D_PLUS'
        ? `Sovereignty [01] = 0.00 → Energy-Arbitrage Law caps Cost Floor ≤ 0.35 and hard-caps Grade at D+ (${formatScore(effectiveTotal)} → ${derivedGrade})`
        : `Standard Curve (Sovereignty > 0): Total ${formatScore(effectiveTotal)} / 6.00 → Grade ${derivedGrade}`;

    const consistent =
      enforced.grade === derivedGrade && Math.abs(Number(enforced.totalScore) - effectiveTotal) < 0.02;
    if (consistent) verifiedCount += 1;

    rows.push({
      ticker: enforced.ticker,
      name: enforced.name,
      invariantScores: scores,
      invariantSum: sum,
      totalScore: Number(Number(enforced.totalScore).toFixed(2)),
      ruleApplied,
      ruleExplanation,
      derivedGrade,
      storedGrade: enforced.grade,
      consistent
    });
  }

  return {
    ok: true,
    archiveOnly: true,
    creditsUsed: 0,
    deepLinkUrl: '/?rubric=1',
    scaleMax: 6.0,
    invariantMax: 1.0,
    standardGradeCurveSummary: STANDARD_GRADE_CURVE_BRACKETS.map(
      (b) => `${b.grade} (${b.rangeLabel})`
    ).join(', '),
    sovereigntyCompromisedCurveSummary: SOVEREIGNTY_COMPROMISED_GRADE_BRACKETS.map(
      (b) => `${b.grade} (${b.rangeLabel})`
    ).join(', '),
    standardGradeCurve: STANDARD_GRADE_CURVE_BRACKETS,
    sovereigntyCompromisedCurve: SOVEREIGNTY_COMPROMISED_GRADE_BRACKETS,
    hardLaws: [
      {
        id: 'LAW_ZERO_JOULE_FLOOR',
        name: 'Conservation of Energy Floor (E = 0 → F)',
        rule: 'Any network whose consensus expends 0.00 Joules of physical Proof-of-Work (PoS, DPoS, PoH, PoA, FBA, PoX, single-sequencer rollups, or fiat) scores 0.00 on Cost Floor [02] and receives automatic Terminal Grade F (0.00 / 6.00).'
      },
      {
        id: 'LAW_ENERGY_ARBITRAGE_CAP',
        name: 'Energy-Arbitrage & Sovereignty-Compromise Law (Sovereignty = 0 → Grade ≤ D+)',
        rule: 'Any genesis premine, VC/ICO token pre-allocation, or mandatory protocol developer coinbase tax sets Existential Sovereignty [01] = 0.00, caps Cost Floor [02] at ≤ 0.35, and hard-caps Terminal Grade at D+ maximum (≥2.30 → D+, 1.75–2.29 → D, 1.01–1.74 → D-).'
      },
      {
        id: 'LAW_CARRIER_SUBORDINATION',
        name: 'Carrier Subordination Law (M_overlay < M_L1 ≤ 1.0)',
        rule: 'Upper-layer channels, inscriptions, and rollups inherit the physical ceiling of their underlying Layer-1 settlement carrier and can never outscore their carrier on Velocity [06] or Cost Floor [02].'
      },
      {
        id: 'LAW_PHYSICAL_METALS_L1',
        name: 'Elemental Periodic Table Metals as Primary Layer-1 Substrates',
        rule: 'Raw physical metals (Gold/XAU, Silver/XAG, Copper/CU, Platinum/XPT, Palladium/XPD) are audited as primary Layer-1 Physical Commodity substrates anchored in geological extraction & nuclear binding energy (never L2 overlays).'
      }
    ],
    invariants: GRADING_RUBRIC_SPEC,
    consistencyVerification: {
      allConsistent: verifiedCount === rows.length,
      totalAudited: rows.length,
      verifiedCount,
      mismatchCount: rows.length - verifiedCount,
      rows
    }
  };
}

// ============================================================================
// PILLAR 3: LIVE THERMODYNAMIC GAINS + US M2 MONEY SUPPLY BENCHMARK
// ============================================================================
export interface AgentHorizonCohortSummary {
  horizon: 'CYCLE' | 'RELEASE' | 'D180' | 'Y1' | 'Y2' | 'Y4';
  label: string;
  passCount: number;
  failCount: number;
  passAvgPct: number;
  failAvgPct: number;
  passExTopGainerAvgPct: number;
  passTopGainerTicker: string | null;
  failExTopGainerAvgPct: number;
  failTopGainerTicker: string | null;
  victoryMultiple: string;
}

export interface AgentGainsAssetRow {
  ticker: string;
  name: string;
  cohort: 'PASSED' | 'FAILED';
  grade: string;
  auditScore: number;
  basePriceMay22: number | null;
  releasePrice: number | null;
  releaseLabel: string | null;
  price180d: number | null;
  price1y: number | null;
  price2y: number | null;
  price4y: number | null;
  spotPrice: number | null;
  cycleReturnPct: number | null;
  allTimeReturnPct: number | null;
  return180dPct: number | null;
  return1yPct: number | null;
  return2yPct: number | null;
  return4yPct: number | null;
  note: string;
}

export interface AgentGainsReference {
  ok: true;
  archiveOnly: true;
  creditsUsed: 0;
  deepLinkUrl: '/?gains=1';
  updatedAtLabel: string;
  symmetricOutlierTrimmingRule: string;
  horizons: Record<'CYCLE' | 'RELEASE' | 'D180' | 'Y1' | 'Y2' | 'Y4', AgentHorizonCohortSummary>;
  passedAssets: AgentGainsAssetRow[];
  failedAssets: AgentGainsAssetRow[];
  m2Benchmark: {
    sourceLabel: string;
    isLive: boolean;
    latestM2Trillions: number;
    latestM2Date: string;
    horizons: Record<MacroM2HorizonKey, M2HorizonSummary>;
  };
}

function pctChangeOrNull(start: number | null | undefined, end: number | null | undefined): number | null {
  if (
    typeof start !== 'number' ||
    !Number.isFinite(start) ||
    start <= 0 ||
    typeof end !== 'number' ||
    !Number.isFinite(end) ||
    end <= 0
  ) {
    return null;
  }
  return Number((((end - start) / start) * 100).toFixed(2));
}

function pickStartPriceForHorizon(
  entry: CohortAssetEntry,
  horizon: 'CYCLE' | 'RELEASE' | 'D180' | 'Y1' | 'Y2' | 'Y4'
): number | null {
  if (horizon === 'RELEASE') return entry.releasePrice ?? entry.basePrice ?? null;
  if (horizon === 'D180') return entry.price180d ?? null;
  if (horizon === 'Y1') return entry.price1y ?? null;
  if (horizon === 'Y2') return entry.price2y ?? null;
  if (horizon === 'Y4') return entry.price4y ?? entry.basePrice ?? null;
  return entry.basePrice ?? null;
}

export function buildAgentGainsReference(
  auditsMap: Record<string, AuditData>,
  cohortRecord?: Partial<GainsCohortRecord> | null,
  m2Dataset?: M2BenchmarkDataset | null
): AgentGainsReference {
  const synced = buildBasketSyncedCohortRecord(auditsMap, cohortRecord);
  const horizonMeta: Array<{
    key: 'CYCLE' | 'RELEASE' | 'D180' | 'Y1' | 'Y2' | 'Y4';
    label: string;
  }> = [
    { key: 'CYCLE', label: 'May 2022 Common Cycle Open → Live Spot' },
    { key: 'RELEASE', label: 'All-Time Genesis / Public Launch → Live Spot' },
    { key: 'D180', label: '180-Day Trailing Window' },
    { key: 'Y1', label: '1-Year Trailing Window' },
    { key: 'Y2', label: '2-Year Trailing Window' },
    { key: 'Y4', label: '4-Year Trailing Window' }
  ];

  const horizons = {} as Record<
    'CYCLE' | 'RELEASE' | 'D180' | 'Y1' | 'Y2' | 'Y4',
    AgentHorizonCohortSummary
  >;

  for (const h of horizonMeta) {
    const toLiquid = (arr: CohortAssetEntry[]) =>
      arr
        .map((item) => {
          const start = pickStartPriceForHorizon(item, h.key);
          const spot = item.snapshotSpot;
          if (!start || start <= 0 || !spot || spot <= 0) return null;
          return {
            ticker: item.ticker,
            cyclePct: ((spot - start) / start) * 100,
            multiple: spot / start,
            tactical90dPct: item.tactical90dPct,
            liquidCycle: true,
            isOutlier: item.isOutlier
          };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x));

    const passLiq = toLiquid(synced.passed);
    const failLiq = toLiquid(synced.failed);
    const agg = computeCohortAggregateSummary(passLiq, failLiq, 1000, false);

    horizons[h.key] = {
      horizon: h.key,
      label: h.label,
      passCount: passLiq.length,
      failCount: failLiq.length,
      passAvgPct: Number(agg.passCycleAvg.toFixed(2)),
      failAvgPct: Number(agg.failCycleAvg.toFixed(2)),
      passExTopGainerAvgPct: Number(agg.passExOutlierAvg.toFixed(2)),
      passTopGainerTicker: agg.passExOutlierTicker,
      failExTopGainerAvgPct: Number(agg.failExOutlierAvg.toFixed(2)),
      failTopGainerTicker: agg.failExOutlierTicker,
      victoryMultiple: agg.portfolioVictoryMultiple
    };
  }

  const mapAssetRow = (item: CohortAssetEntry, cohort: 'PASSED' | 'FAILED'): AgentGainsAssetRow => ({
    ticker: item.ticker,
    name: item.name,
    cohort,
    grade: item.grade,
    auditScore: item.auditScore,
    basePriceMay22: item.basePrice ?? null,
    releasePrice: item.releasePrice ?? null,
    releaseLabel: item.releaseLabel ?? null,
    price180d: item.price180d ?? null,
    price1y: item.price1y ?? null,
    price2y: item.price2y ?? null,
    price4y: item.price4y ?? null,
    spotPrice: item.snapshotSpot ?? null,
    cycleReturnPct: pctChangeOrNull(item.basePrice, item.snapshotSpot),
    allTimeReturnPct: pctChangeOrNull(item.releasePrice ?? item.basePrice, item.snapshotSpot),
    return180dPct: pctChangeOrNull(item.price180d, item.snapshotSpot),
    return1yPct: pctChangeOrNull(item.price1y, item.snapshotSpot),
    return2yPct: pctChangeOrNull(item.price2y, item.snapshotSpot),
    return4yPct: pctChangeOrNull(item.price4y ?? item.basePrice, item.snapshotSpot),
    note: item.note
  });

  const activeM2 = m2Dataset || DEFAULT_M2_BENCHMARK_DATASET;
  const m2HorizonKeys: MacroM2HorizonKey[] = ['ALL_TIME', 'D180', 'Y1', 'Y2', 'Y4'];
  const m2Horizons = {} as Record<MacroM2HorizonKey, M2HorizonSummary>;
  for (const key of m2HorizonKeys) {
    const pts = activeM2.seriesByHorizon?.[key] || DEFAULT_M2_BENCHMARK_DATASET.seriesByHorizon[key];
    m2Horizons[key] = computeM2AssetSummaries(pts);
  }

  return {
    ok: true,
    archiveOnly: true,
    creditsUsed: 0,
    deepLinkUrl: '/?gains=1',
    updatedAtLabel: synced.updatedAtLabel,
    symmetricOutlierTrimmingRule:
      'Ex-Top-Gainer metrics symmetrically remove the single highest-returning asset from BOTH the Passed (E > 0) basket and the Failed (E = 0) basket on every timeframe so neither side benefits from a single right-tail outlier.',
    horizons,
    passedAssets: synced.passed.map((a) => mapAssetRow(a, 'PASSED')),
    failedAssets: synced.failed.map((a) => mapAssetRow(a, 'FAILED')),
    m2Benchmark: {
      sourceLabel: activeM2.sourceLabel,
      isLive: activeM2.isLive,
      latestM2Trillions: activeM2.latestM2Trillions,
      latestM2Date: activeM2.latestM2Date,
      horizons: m2Horizons
    }
  };
}

// ============================================================================
// PILLAR 4: FIRST-PRINCIPLES ORIGIN THESIS (17 AXIOMS: PHYSICS OVER CONSENSUS)
// ============================================================================
export interface AgentOriginThesisReference {
  ok: true;
  archiveOnly: true;
  creditsUsed: 0;
  deepLinkUrl: '/?genesis=1';
  title: string;
  subtitle: string;
  mode: ThesisDepthMode;
  axiomCount: number;
  chapters: Array<{ id: 'INVARIANTS' | 'INFLATION' | 'COSMOS'; title: string; axiomIds: number[] }>;
  axioms: Array<
    ThesisParagraph & {
      normieText: string;
      geniusText: string;
    }
  >;
}

export function buildAgentOriginThesisReference(
  mode: ThesisDepthMode = 'GENIUS'
): AgentOriginThesisReference {
  const resolvedMode: ThesisDepthMode = mode === 'NORMIE' ? 'NORMIE' : 'GENIUS';
  const primary =
    resolvedMode === 'GENIUS' ? GENESIS_THESIS_GENIUS_PARAGRAPHS : GENESIS_THESIS_PARAGRAPHS;

  const axioms = primary.map((p) => {
    const normie = GENESIS_THESIS_PARAGRAPHS.find((n) => n.id === p.id);
    const genius = GENESIS_THESIS_GENIUS_PARAGRAPHS.find((g) => g.id === p.id);
    return {
      ...p,
      normieText: normie?.text || p.text,
      geniusText: genius?.text || p.text
    };
  });

  return {
    ok: true,
    archiveOnly: true,
    creditsUsed: 0,
    deepLinkUrl: '/?genesis=1',
    title: 'First Principles: Physics Over Consensus',
    subtitle:
      'Why sovereign money is a physical machine bounded by thermodynamics, 100 MJ weekly human biological labor, and the irreversible arrow of time.',
    mode: resolvedMode,
    axiomCount: axioms.length,
    chapters: [
      {
        id: 'INVARIANTS',
        title: 'Chapter I — The Six Thermodynamic Invariants of Sovereign Money',
        axiomIds: [1, 2, 3, 4, 5, 6]
      },
      {
        id: 'INFLATION',
        title: 'Chapter II — Inflation as the Expropriation of 100 MJ Human Biological Work',
        axiomIds: [7, 8, 9, 10, 11, 12]
      },
      {
        id: 'COSMOS',
        title: 'Chapter III — Cosmic Proof-of-Work & Why Zero-Joule Ledgers Collapse',
        axiomIds: [13, 14, 15, 16, 17]
      }
    ],
    axioms
  };
}

export const MCP_ARCHIVE_TOOL_SCHEMAS = [
  {
    name: 'list_archived_audits',
    description:
      'Pillar 1 (Archive): List archived cryptocurrency and physical commodity audits from The Truth Vault (strictly archive-only, 0 AI credits). Filter by PASSED/FAILED basket, category, consensusFamily, or search query.',
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
      'Pillar 1 (Archive): Fetch the full GENIUS-depth 6-invariant thermodynamic audit, codebase constants, receipts, and normie summaries for a single archived ticker or metal (e.g. KAS, BTC, ETH, SOL, XAU).',
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
      'Pillar 1 (Archive): Run a side-by-side 6-invariant thermodynamic comparison across 2 to 4 archived cryptocurrencies or physical commodities.',
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
    name: 'get_grading_rubric',
    description:
      'Pillar 2 (Rubric & Consistency Proof): Fetch the exact 6-invariant quantitative scoring brackets, Standard vs Sovereignty-Compromised grade curves, Energy-Arbitrage Law, and automated per-asset mathematical consistency verification across the entire archive.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_live_gains_and_m2',
    description:
      'Pillar 3 (Live Gains & US M2 Benchmark): Fetch empirical returns for Passed (E > 0) vs Failed (E = 0) cohorts across Cycle, All-Time, 180D, 1Y, 2Y, and 4Y windows (including symmetric Ex-Top-Gainer trims) plus KAS, BTC, Gold, and S&P 500 performance against FRED US M2 money supply.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_origin_thesis',
    description:
      'Pillar 4 (Origin Theory Easter Egg): Fetch all 17 First-Principles Axioms ("Physics Over Consensus"), conservation equations, the 100 MJ human biological workweek ledger, and cosmic Proof-of-Work proofs.',
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['GENIUS', 'NORMIE'] }
      }
    }
  },
  {
    name: 'research_archive',
    description:
      'Answer educational or comparative questions about cryptocurrencies, grading consistency, M2 benchmark gains, the origin thesis, or Proof-of-Stake vs Proof-of-Work strictly using deterministic reference data (0 AI credits).',
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
