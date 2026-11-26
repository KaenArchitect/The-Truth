import {
  buildAgentGainsReference,
  buildAgentRubricReference,
  summarizeArchivedAudit
} from './agentArchiveApi.ts';
import type { GainsCohortRecord } from './gainsCohortData.ts';
import {
  GENESIS_THESIS_GENIUS_RAW_MARKDOWN,
  GENESIS_THESIS_PARAGRAPHS
} from './genesisThesisData.ts';
import {
  GLOBAL_TIMELINE_STOPS,
  projectAuditAtYear,
  projectAuditsCollectionAtYear,
  resolveAssetGenesisYear,
  type GlobalTimelineYear
} from './globalTimeMachine.ts';
import type { M2BenchmarkDataset } from './m2BenchmarkData.ts';
import {
  formatScore,
  sortAuditTickersByGrade,
  type AuditData
} from './rubricSpec.ts';

export interface CompendiumOptions {
  cohortRecord?: Partial<GainsCohortRecord> | null;
  m2Dataset?: M2BenchmarkDataset | null;
}

function fmtPct(v: number | null | undefined): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 'N/A';
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}

function buildAuditFingerprint(audit: AuditData): string {
  const invKey = (audit.invariants || [])
    .slice(0, 6)
    .map(
      (inv) =>
        `${formatScore(inv.score)}|${inv.status || ''}|${inv.telemetry || ''}|${inv.paragraph || ''}|${
          inv.geniusParagraph || ''
        }`
    )
    .join('||');
  return `${audit.grade}|${formatScore(audit.totalScore)}|${audit.consensusFamily}|${invKey}`;
}

interface AssetDedupeTracker {
  seenConclusions: Map<string, string>;
  seenVerdicts: Map<string, string>;
  seenNormie: Map<string, string>;
  seenGenius: Map<string, string>;
  seenReceipts: Map<string, string>;
}

function createAssetDedupeTracker(): AssetDedupeTracker {
  return {
    seenConclusions: new Map(),
    seenVerdicts: new Map(),
    seenNormie: new Map(),
    seenGenius: new Map(),
    seenReceipts: new Map()
  };
}

function stripCalibrationPrefix(text: string): string {
  return text
    .replace(/^\[[^\]]*(?:Pareto-Frontier Calibration|Historical Reconstruction)[^\]]*\]:?\s*/i, '')
    .trim();
}

function renderPlainTextAuditBlock(
  audit: AuditData,
  epochHeading: string,
  tracker?: AssetDedupeTracker
): string {
  const lines: string[] = [];
  lines.push(
    `--- ${epochHeading}: ${audit.name} ($${audit.ticker}) | Grade ${audit.grade} (${formatScore(
      audit.totalScore
    )} / 6.00) ---`
  );
  lines.push(
    `Consensus: ${audit.consensusFamily} | Architecture: ${audit.architecture} | Certainty: ${audit.certainty}`
  );
  if (audit.conclusion) {
    const cleanConclusion = stripCalibrationPrefix(audit.conclusion);
    const prevEpoch = tracker?.seenConclusions.get(cleanConclusion);
    if (prevEpoch) {
      lines.push(`Conclusion: [Unchanged from ${prevEpoch}]`);
    } else {
      lines.push(`Conclusion: ${audit.conclusion}`);
      tracker?.seenConclusions.set(cleanConclusion, epochHeading);
    }
  }

  for (let i = 0; i < 6; i += 1) {
    const inv = audit.invariants?.[i];
    if (!inv) continue;
    const id = inv.id || `0${i + 1}`;
    const statusSuffix =
      inv.status === 'VOID_UNANCHORED' ? ' [VOID — E = 0 Unanchored]' : '';
    lines.push(
      `[${id}] ${inv.title} — ${formatScore(inv.score)} / 1.00${statusSuffix}`
    );
    if (inv.telemetry) {
      lines.push(`  Telemetry: ${inv.telemetry}`);
    }
    if (inv.quickSummary) {
      const cleanV = stripCalibrationPrefix(inv.quickSummary);
      const prevV = tracker?.seenVerdicts.get(cleanV);
      if (!prevV) {
        lines.push(`  Verdict: ${inv.quickSummary}`);
        tracker?.seenVerdicts.set(cleanV, epochHeading);
      }
    }
    if (inv.paragraph) {
      const cleanN = stripCalibrationPrefix(inv.paragraph);
      const prevN = tracker?.seenNormie.get(cleanN);
      if (!prevN) {
        lines.push(`  Normie: ${inv.paragraph}`);
        tracker?.seenNormie.set(cleanN, epochHeading);
      }
    }
    const genius = inv.geniusParagraph || audit.geniusParagraphs?.[i] || '';
    if (genius && genius !== inv.paragraph) {
      const cleanG = stripCalibrationPrefix(genius);
      const prevG = tracker?.seenGenius.get(cleanG);
      if (prevG) {
        lines.push(`  Forensic Prose: [Calibrated to ${formatScore(inv.score)} / 1.00; base forensic audit in ${prevG} Invariant ${id}]`);
      } else {
        lines.push(`  Genius: ${genius}`);
        tracker?.seenGenius.set(cleanG, epochHeading);
      }
    }
    const receipts = (inv.receipts || []).filter(Boolean);
    if (receipts.length > 0) {
      const rJoined = receipts.join(' ; ');
      const prevR = tracker?.seenReceipts.get(rJoined);
      if (!prevR) {
        lines.push(`  Receipts: ${rJoined}`);
        tracker?.seenReceipts.set(rJoined, epochHeading);
      }
    }
  }

  return lines.join('\n');
}

export function buildFullPlainTextCompendium(
  origin: string,
  auditsMap: Record<string, AuditData>,
  options: CompendiumOptions = {}
): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const orderedTickers = sortAuditTickersByGrade(auditsMap);
  const rubric = buildAgentRubricReference(auditsMap);
  const gains = buildAgentGainsReference(auditsMap, options.cohortRecord, options.m2Dataset);

  const out: string[] = [];

  // =========================================================================
  // HEADER & MANIFEST
  // =========================================================================
  out.push('# THE TRUTH — COMPLETE PLAIN-TEXT THERMODYNAMIC COMPENDIUM');
  out.push(`Canonical Origin: ${cleanOrigin}`);
  out.push(`Single-Fetch Plain-Text URL: ${cleanOrigin}/compendium (alias: ${cleanOrigin}/llms.txt)`);
  out.push(
    `Scope: Complete 23-Axiom Origin Thesis (Genius + Normie) | Deterministic 6-Invariant Grading Rubric & Consistency Proof (${rubric.consistencyVerification.verifiedCount}/${rubric.consistencyVerification.totalAudited} Verified, ${rubric.consistencyVerification.mismatchCount} Mismatches) | Live Cohort & US M2 Gains | All 8 Global Time Machine Epochs (1913, 1971, 2000, 2008, 2016, 2020, 2024, Present) | Full Genius & Normie 6-Invariant Audits for All ${orderedTickers.length} Archived Assets.`
  );
  out.push(`Archived Tickers (${orderedTickers.length}): ${orderedTickers.map((t) => `$${t}`).join(', ')}`);
  out.push('');

  // =========================================================================
  // SECTION 1: COMPLETE ORIGIN THESIS (GENIUS + NORMIE)
  // =========================================================================
  out.push('================================================================================');
  out.push('SECTION 1 — FIRST-PRINCIPLES ORIGIN THESIS (23 AXIOMS • UNABRIDGED GENIUS EDITION)');
  out.push('================================================================================');
  out.push(GENESIS_THESIS_GENIUS_RAW_MARKDOWN.trim());
  out.push('');
  out.push('--- CONCISE NORMIE EDITION SUMMARIES (23 AXIOMS) ---');
  for (const p of GENESIS_THESIS_PARAGRAPHS) {
    out.push(`[${p.tag}] ${p.text}`);
  }
  out.push('');

  // =========================================================================
  // SECTION 2: DETERMINISTIC GRADING RUBRIC & CONSISTENCY PROOF
  // =========================================================================
  out.push('================================================================================');
  out.push('SECTION 2 — DETERMINISTIC 6-INVARIANT GRADING RUBRIC & CONSISTENCY PROOF');
  out.push('================================================================================');
  out.push(`Standard Grade Curve (Sovereignty > 0 & Cost Floor > 0): ${rubric.standardGradeCurveSummary}`);
  out.push(
    `Sovereignty-Compromised Curve (Sovereignty = 0 & Cost Floor > 0): ${rubric.sovereigntyCompromisedCurveSummary}`
  );
  out.push(
    'Zero-Joule Floor (Cost Floor = 0): Any PoS, DPoS, PoA, BFT, or unbacked fiat ledger with E = 0 receives 0.00 / 6.00 (Grade F) with Invariants 04–06 locked to VOID.'
  );
  out.push(
    `Automated Consistency Proof: ${rubric.consistencyVerification.verifiedCount}/${rubric.consistencyVerification.totalAudited} archived assets verified with ${rubric.consistencyVerification.mismatchCount} mismatches.`
  );
  out.push('');
  for (const inv of rubric.invariants) {
    out.push(`[${inv.id}] ${inv.name} (0.00–1.00)`);
    for (const b of inv.brackets) {
      out.push(`  • ${b.range}: ${b.rule}`);
    }
  }
  out.push('');
  out.push('Per-Asset Mathematical Consistency Table (Present):');
  for (const row of rubric.consistencyVerification.rows) {
    out.push(
      `  $${row.ticker}: [${row.invariantScores.map((s) => formatScore(s)).join(', ')}] = ${formatScore(
        row.totalScore
      )} / 6.00 -> Grade ${row.storedGrade} (${row.consistent ? 'VERIFIED' : 'MISMATCH'} | ${row.ruleExplanation})`
    );
  }
  out.push('');

  // =========================================================================
  // SECTION 3: LIVE COHORT GAINS & US M2 BENCHMARK
  // =========================================================================
  out.push('================================================================================');
  out.push('SECTION 3 — LIVE THERMODYNAMIC GAINS (E > 0 VS E = 0) & US M2 BENCHMARK');
  out.push('================================================================================');
  out.push(gains.symmetricOutlierTrimmingRule);
  for (const key of ['CYCLE', 'RELEASE', 'D180', 'Y1', 'Y2', 'Y4'] as const) {
    const h = gains.horizons[key];
    out.push(
      `  ${h.horizon} (${h.label}): Passed (E>0) Avg ${fmtPct(h.passAvgPct)} (ex-$${
        h.passTopGainerTicker || 'N/A'
      }: ${fmtPct(h.passExTopGainerAvgPct)}) vs Failed (E=0) Avg ${fmtPct(h.failAvgPct)} (ex-$${
        h.failTopGainerTicker || 'N/A'
      }: ${fmtPct(h.failExTopGainerAvgPct)}) | E>0 Victory Multiple: ${h.victoryMultiple}x`
    );
  }
  out.push('');
  out.push(`FRED US M2 Money Supply Benchmark (Latest M2: $${gains.m2Benchmark.latestM2Trillions.toFixed(2)}T):`);
  for (const key of ['ALL_TIME', 'Y4', 'Y2', 'Y1', 'D180'] as const) {
    const m2h = gains.m2Benchmark.horizons[key];
    const assetStr = m2h.assets
      .map((a) => `${a.ticker}: ${a.nominalMult.toFixed(2)}x nominal (${a.m2AdjustedMult.toFixed(2)}x vs M2)`)
      .join(' | ');
    out.push(
      `  ${key}: M2 $${m2h.m2StartTrillions.toFixed(2)}T -> $${m2h.m2EndTrillions.toFixed(2)}T (${m2h.m2Mult.toFixed(
        3
      )}x) | ${assetStr}`
    );
  }
  out.push('');
  out.push('Audited Cohort Asset Returns:');
  for (const a of [...gains.passedAssets, ...gains.failedAssets]) {
    out.push(
      `  $${a.ticker} (${a.grade}, ${a.cohort}): Spot ${
        a.spotPrice !== null ? `$${a.spotPrice}` : 'N/A'
      } | Cycle ${fmtPct(a.cycleReturnPct)} | All-Time ${fmtPct(a.allTimeReturnPct)} | 1Y ${fmtPct(
        a.return1yPct
      )} | ${a.note}`
    );
  }
  out.push('');

  // =========================================================================
  // SECTION 4: GLOBAL TIME MACHINE EPOCH SCOREBOARDS (1913 -> PRESENT)
  // =========================================================================
  out.push('================================================================================');
  out.push('SECTION 4 — GLOBAL TIME MACHINE CHRONOLOGICAL EPOCH SCOREBOARDS (1913–PRESENT)');
  out.push('================================================================================');
  for (const stop of GLOBAL_TIMELINE_STOPS) {
    const projectedMap = projectAuditsCollectionAtYear(auditsMap, stop.id);
    const ranked = sortAuditTickersByGrade(projectedMap);
    out.push(`[EPOCH ${stop.buttonLabel} (${stop.numericYear})] ${stop.epochTitle}`);
    out.push(`  Frontier: ${stop.frontierSummary}`);
    out.push(`  Historical Significance: ${stop.significance}`);
    out.push(`  Active Assets at <= ${stop.numericYear} (${ranked.length}):`);
    for (const tk of ranked) {
      const item = projectedMap[tk];
      if (!item) continue;
      const scores = [0, 1, 2, 3, 4, 5]
        .map((idx) => formatScore(item.invariants?.[idx]?.score ?? 0))
        .join(', ');
      out.push(
        `    • $${item.ticker} (${item.name}): Grade ${item.grade} (${formatScore(
          item.totalScore
        )} / 6.00) [${scores}] — ${item.architecture}`
      );
    }
    out.push('');
  }

  // =========================================================================
  // SECTION 5: COMPLETE ARCHIVE — FULL GENIUS & NORMIE AUDITS FOR EVERY YEAR
  // =========================================================================
  out.push('================================================================================');
  out.push(
    `SECTION 5 — COMPLETE ARCHIVE: FULL GENIUS & NORMIE AUDITS ACROSS ALL YEARS (${orderedTickers.length} ASSETS)`
  );
  out.push('================================================================================');

  const historicalStops = GLOBAL_TIMELINE_STOPS.filter(
    (s): s is (typeof GLOBAL_TIMELINE_STOPS)[number] & { id: Exclude<GlobalTimelineYear, 'PRESENT'> } =>
      s.id !== 'PRESENT'
  );

  for (const tk of orderedTickers) {
    const presentAudit = auditsMap[tk];
    if (!presentAudit) continue;
    const summary = summarizeArchivedAudit(presentAudit);
    const genesisYear = resolveAssetGenesisYear(tk, presentAudit);

    out.push('################################################################################');
    out.push(
      `ASSET: ${presentAudit.name} ($${presentAudit.ticker}) | Category: ${summary.categoryLabel} | Genesis/Anchor Year: ${
        genesisYear === 0 ? 'Cosmic / Elemental' : genesisYear
      }`
    );

    // Trajectory line across all 8 stops
    const trajectoryParts = GLOBAL_TIMELINE_STOPS.map((stop) => {
      const proj = projectAuditAtYear(presentAudit, stop.id);
      if (!proj) return `${stop.buttonLabel}: Not Yet Launched`;
      return `${stop.buttonLabel}: ${proj.grade} (${formatScore(proj.totalScore)})`;
    });
    out.push(`Chronological Trajectory: ${trajectoryParts.join(' | ')}`);
    out.push('');

    // Full Present Audit + per-asset deduplication tracker for unchanged historical prose
    const assetTracker = createAssetDedupeTracker();
    const presentFp = buildAuditFingerprint(presentAudit);
    out.push(
      renderPlainTextAuditBlock(
        presentAudit,
        'EPOCH PRESENT (2026 LIVE FRONTIER)',
        assetTracker
      )
    );
    out.push('');

    // Group historical epochs by distinct audit fingerprint so every unique historical
    // audit (1913, 1971, 2000, 2008, 2016, 2020, 2024, or custom tm-<year>) is printed
    // in full without repeating byte-identical zero-joule blocks verbatim.
    const groupedHistorical: Array<{
      years: string[];
      sample: AuditData;
      fingerprint: string;
    }> = [];

    for (const stop of historicalStops) {
      const histAudit = projectAuditAtYear(presentAudit, stop.id);
      if (!histAudit) continue;
      const fp = buildAuditFingerprint(histAudit);
      const existing = groupedHistorical.find((g) => g.fingerprint === fp);
      if (existing) {
        existing.years.push(stop.buttonLabel);
      } else {
        groupedHistorical.push({
          years: [stop.buttonLabel],
          sample: histAudit,
          fingerprint: fp
        });
      }
    }

    for (const group of groupedHistorical) {
      const label =
        group.years.length === 1
          ? `HISTORICAL EPOCH ${group.years[0]}`
          : `HISTORICAL EPOCHS ${group.years.join(', ')}`;
      if (group.fingerprint === presentFp) {
        out.push(
          `--- ${label}: ${presentAudit.name} ($${presentAudit.ticker}) | Grade ${group.sample.grade} (${formatScore(
            group.sample.totalScore
          )} / 6.00) — Identical 6-Invariant Scores & Forensic Verdicts to EPOCH PRESENT above (${group.sample.architecture}). ---`
        );
        out.push('');
      } else {
        out.push(renderPlainTextAuditBlock(group.sample, label, assetTracker));
        out.push('');
      }
    }
  }

  return out.join('\n');
}
