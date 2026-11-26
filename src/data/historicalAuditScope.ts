import {
  type AuditData,
  type ConsensusFamily,
  type HistoricalInvariantStatus,
  type HistoricalSnapshot,
  type HistoricalSnapshotInvariant,
  type RawGeminiAuditPayload,
  DEFAULT_TITLES,
  evaluateThermodynamicGate,
  mergeHistoricalSnapshots,
  stripTrailingDash
} from './rubricSpec.ts';
import {
  type GlobalTimelineYear,
  GLOBAL_TIMELINE_STOPS,
  getGlobalTimelineStop,
  hasCuratedTimelineOverride
} from './globalTimeMachine.ts';

export type HistoricalTimelineStopYear = Exclude<GlobalTimelineYear, 'PRESENT'>;

export interface HistoricalAuditHorizon {
  year: GlobalTimelineYear;
  isHistorical: boolean;
  numericYear: number;
  cutoffDateLabel: string;
  epochTitle: string;
  frontierBenchmark: string;
  contemporaryVelocityContrast: string;
  eraMonetaryRule: string;
  strictChronologyDirective: string;
}

export function isHistoricalTimelineYear(
  year: GlobalTimelineYear | string | null | undefined
): year is HistoricalTimelineStopYear {
  return (
    year === '1913' ||
    year === '1971' ||
    year === '2000' ||
    year === '2008' ||
    year === '2016' ||
    year === '2020' ||
    year === '2024'
  );
}

export function makeTimeMachineEpochId(year: GlobalTimelineYear): string {
  return year === 'PRESENT' ? 'tm-present' : `tm-${year}`;
}

export function parseTimeMachineEpochYear(epochId: string | null | undefined): GlobalTimelineYear | null {
  const cleaned = String(epochId || '').trim().toLowerCase();
  if (cleaned === 'tm-present') return 'PRESENT';
  const m = /^tm-(1913|1971|2000|2008|2016|2020|2024)$/.exec(cleaned);
  return m ? (m[1] as HistoricalTimelineStopYear) : null;
}

export function extractSnapshotSortOrder(snapshot: HistoricalSnapshot): number {
  const epochId = String(snapshot.epochId || '').toLowerCase();
  if (
    epochId === 'tm-present' ||
    epochId.endsWith('-live') ||
    epochId === 'kas-2026-toccata' ||
    epochId === 'usd-post-1971-fiat' ||
    epochId === 'eth-2022-post-merge-pos'
  ) {
    if (epochId === 'eth-2022-post-merge-pos') return 2022;
    if (epochId === 'usd-post-1971-fiat') return 2026;
    return 2026;
  }
  const parsedTm = parseTimeMachineEpochYear(epochId);
  if (parsedTm && parsedTm !== 'PRESENT') {
    return Number(parsedTm);
  }
  const idMatch = epochId.match(/\b(19\d{2}|20\d{2})\b/);
  if (idMatch) return Number(idMatch[1]);
  const dateMatch = String(snapshot.dateOrHeight || '').match(/\b(19\d{2}|20\d{2})\b/);
  if (dateMatch) return Number(dateMatch[1]);
  return 2025;
}

export function getHistoricalAuditHorizon(year: GlobalTimelineYear): HistoricalAuditHorizon {
  const stop = getGlobalTimelineStop(year);

  switch (year) {
    case '1913':
      return {
        year,
        isHistorical: true,
        numericYear: 1913,
        cutoffDateLabel: 'December 22, 1913 (Pre-Federal Reserve Classical Gold Specie Horizon)',
        epochTitle: stop.epochTitle,
        frontierBenchmark: 'Physical Gold (XAU) & Silver (XAG) Cosmic Bearer Specie (4.55 / 6.00, Grade B+)',
        contemporaryVelocityContrast:
          'In contrast, unencumbered Physical Gold (XAU) bearer bullion settles hand-to-hand with zero statutory issuer monopoly, zero central-bank note dilution, and 100% astrophysical extraction energy (E > 0), though constrained in long-distance velocity by armored physical freight.',
        eraMonetaryRule:
          '1913 CLASSICAL GOLD STANDARD CALIBRATION: Evaluate sovereign currencies strictly as they stood in 1913 prior to the December 23, 1913 U.S. Federal Reserve Act. If a sovereign currency in 1913 guaranteed direct, on-demand citizen convertibility into physical gold or silver coin at a fixed statutory weight (such as 1913 USD at $20.67/oz gold coin, 1913 CAD under Canada’s Currency Act of 1910 & Dominion Notes Act $20.67/oz sovereign gold specie parity, 1913 GBP under the Bank of England sovereign gold standard, or 1913 CHF under the Latin Monetary Union gold standard), it possessed a real derivative physical Cost Floor: set consensusFamily = "ENERGY_ARBITRAGED_POW", isUpperLayerOverlayOrChannel = true, hasGenesisPremineOrVcOrIco = true, hasProtocolDevTaxOrKillSwitch = true, score 01 Sovereignty = 0.00 (statutory monopoly & fractional fiduciary note issue), score 02 Cost Floor in 0.20–0.30 (partial/fractional gold specie redeemability), score 03–06 according to 1913 statutory convertibility, telegraph/clearinghouse rail hours, paper ledger seizure hooks, and physical specie rail clearance (total ~1.50–1.95, Grade D or D+). Only unconvertible paper currencies in 1913 score 0.00 / F.',
        strictChronologyDirective:
          'STRICT <= 1913 CHRONOLOGICAL HORIZON: Audit ONLY facts, statutes, coinage acts, reserve rules, telegraph/rail clearinghouses, and monetary physics existing on or before December 22, 1913. NEVER cite or mention ANY event, statute, war suspension, central bank act, or technology from 1914 or later (no WWI 1914 gold suspensions, no 1933 EO 6102, no 1934 Bank of Canada Act, no 1944 Bretton Woods, no 1967/1992 Bank Acts, no SWIFT/Fedwire electronic rails, no Bitcoin, no Kaspa).'
      };

    case '1971':
      return {
        year,
        isHistorical: true,
        numericYear: 1971,
        cutoffDateLabel: '1971 Terminal Bretton Woods & Gold Severance Horizon (strictly <= 1971)',
        epochTitle: stop.epochTitle,
        frontierBenchmark: 'Physical Gold (XAU) Elemental Bearer Bullion (4.45 / 6.00, Grade B+)',
        contemporaryVelocityContrast:
          'In contrast, Physical Gold (XAU) elemental bullion preserves sovereign entity decoupling (1.00) and unforgeable terrestrial extraction energy (E > 0) free of central-bank parity suspensions or correspondent clearing freezes.',
        eraMonetaryRule:
          '1971 TERMINAL BRETTON WOODS CALIBRATION: Evaluate sovereign currencies strictly as they operated in 1971 (on or before December 31, 1971). Distinguish strictly between: (A) Currencies that had ALREADY suspended citizen gold convertibility and/or floated off gold parity by 1971—for example, the Canadian Dollar (CAD), which suspended domestic gold redemption in 1933 / Bank of Canada Act 1934, abandoned its $0.925 USD Bretton Woods peg to float freely on May 31, 1970, and operated under the 1967 Bank Act statutory secondary/cash reserve ratios (12% on demand deposits, 4% on notice deposits) and Canadian Bankers Association paper clearinghouses—which carry 0.00 citizen physical gold backing (consensusFamily = "ZERO_JOULE_BFT", all 6 invariants = 0.00, Grade F), grounded EXCLUSIVELY in <= 1971 statutes; vs (B) Currencies retaining a direct statutory physical gold reserve/window in early 1971 (such as CHF under Switzerland’s 40% constitutional physical gold note backing, or pre-Aug 15, 1971 USD at its terminal $35/oz foreign central-bank window), which may score 02 Cost Floor in 0.10–0.25 under consensusFamily = "ENERGY_ARBITRAGED_POW" with 01 Sovereignty = 0.00 and Grade D- or D.',
        strictChronologyDirective:
          'STRICT <= 1971 CHRONOLOGICAL HORIZON: Audit ONLY statutes, Bank Acts, reserve requirements, exchange-rate regimes, and clearing rails that existed on or before 1971. ABSOLUTELY FORBIDDEN ANACHRONISMS: NEVER cite or mention ANY year, statute, clearing system, or event from 1972 or later—specifically NEVER mention Canada’s 1980 or 1992 Bank Act (zero-reserve phase-out), 1980 Canadian Payments Association, 1999 LVTS, 2008 QE, 2020 COVID stimulus, 2021 Lynx, 2022 Emergencies Act freezes, Bitcoin, or Kaspa! Write from the exact vantage point of 1971.'
      };

    case '2000':
      return {
        year,
        isHistorical: true,
        numericYear: 2000,
        cutoffDateLabel: 'December 31, 2000 (Post-Bretton Woods Unbacked Fiat & Pre-Bitcoin Horizon)',
        epochTitle: stop.epochTitle,
        frontierBenchmark: 'Physical Gold (XAU) Elemental Bearer Bullion (4.40 / 6.00, Grade B+)',
        contemporaryVelocityContrast:
          'In contrast, Physical Gold (XAU) bearer bullion stood in 2000 as Earth’s primary non-sovereign E > 0 monetary substrate, immune to central-bank reserve abolition and zero-joule electronic credit expansion.',
        eraMonetaryRule:
          '2000 POST-BRETTON WOODS CALIBRATION: By 2000, following the 1971 Bretton Woods collapse (and Switzerland’s 1999/2000 constitutional severance of the CHF gold link), ALL sovereign fiat currencies (USD, EUR, CAD, GBP, JPY, CHF, etc.) operated as 100% unbacked zero-joule central-bank and commercial-bank credit ledgers (consensusFamily = "ZERO_JOULE_BFT", all 6 invariants = 0.00, Grade F), while only physical Periodic Table elements/commodities satisfied E > 0.',
        strictChronologyDirective:
          'STRICT <= 2000 CHRONOLOGICAL HORIZON: Audit ONLY facts, laws, Bank Acts (e.g., up through the 1992 Bank Act and 1999 LVTS for CAD, 1999 EUR launch), and clearing rails existing on or before December 31, 2000. NEVER cite or mention ANY event, law, crisis, or protocol from 2001 or later (no 2008 GFC/TARP/QE, no 2008 Bitcoin, no 2020 COVID QE, no 2021 Lynx/Kaspa).'
      };

    case '2008':
      return {
        year,
        isHistorical: true,
        numericYear: 2008,
        cutoffDateLabel: 'December 31, 2008 (Global Financial Crisis & Birth of Bitcoin Horizon)',
        epochTitle: stop.epochTitle,
        frontierBenchmark: 'Bitcoin (BTC) Satoshi SHA-256d Proof-of-Work Genesis (6.00 / 6.00, Grade A+)',
        contemporaryVelocityContrast:
          'In contrast, Satoshi Nakamoto’s 2008 peer-to-peer SHA-256d Proof-of-Work electronic cash design introduced digital E > 0 stateless UTXO settlement without central banks, trusted third parties, or bailout dilution.',
        eraMonetaryRule:
          '2008 MONETARY INFLECTION CALIBRATION: Evaluate assets strictly as of late 2008 (including the 2008 banking crisis, TARP/QE1 zero-joule bailouts for fiat currencies at 0.00 / F, Physical Gold/Silver/Copper commodities at E > 0, and Satoshi Nakamoto’s Oct 31, 2008 Bitcoin Proof-of-Work architecture).',
        strictChronologyDirective:
          'STRICT <= 2008 CHRONOLOGICAL HORIZON: Audit ONLY facts, statutes, central-bank facilities, and protocol releases on or before December 31, 2008. NEVER cite or mention ANY event, hardfork, ETF, Bank Act, or protocol from 2009/2010+ post-cutoff history (no 2015 Ethereum, no 2017 SegWit, no 2020 COVID QE, no 2021 Kaspa, no 2024 Spot ETFs).'
      };

    case '2016':
      return {
        year,
        isHistorical: true,
        numericYear: 2016,
        cutoffDateLabel: 'December 31, 2016 (Sequential PoW & Post-DAO Bailout Horizon)',
        epochTitle: stop.epochTitle,
        frontierBenchmark: 'Bitcoin (BTC) Sequential SHA-256d PoW Frontier (5.25 / 6.00, Grade A-)',
        contemporaryVelocityContrast:
          'In contrast, fair-launched Layer-1 Proof-of-Work UTXO networks in 2016 settled irreversible SHA-256d/Scrypt hash work directly on-chain without central-bank bailouts, DAO state rewrites, or zero-joule validator committees.',
        eraMonetaryRule:
          '2016 SEQUENTIAL POW CALIBRATION: Evaluate protocols and currencies strictly as of December 31, 2016. Note that Ethereum (ETH) in 2016 was an active Ethash GPU Proof-of-Work chain (E > 0) capped at Grade D+ by its 72M genesis premine and July 2016 Block 1,920,000 DAO state-bailout hardfork—NOT Proof-of-Stake! Parallel BlockDAGs (Kaspa), Spot ETFs, SegWit activation (Aug 2017), and CashTokens did not exist yet.',
        strictChronologyDirective:
          'STRICT <= 2016 CHRONOLOGICAL HORIZON: Audit ONLY codebase commits, consensus rules, CVEs, outages, and monetary laws existing on or before December 31, 2016. NEVER cite or mention ANY event, upgrade, exploit, or protocol from 2017 or later (no 2017 SegWit/BCH fork, no 2018 CVE-2018-17144, no 2020 COVID QE, no 2021 Kaspa, no 2022 Ethereum Merge, no 2024 ETFs).'
      };

    case '2020':
      return {
        year,
        isHistorical: true,
        numericYear: 2020,
        cutoffDateLabel: 'December 31, 2020 (DeFi Congestion, Pandemic QE & Pre-BlockDAG Horizon)',
        epochTitle: stop.epochTitle,
        frontierBenchmark: 'Bitcoin (BTC) Sequential SHA-256d PoW Frontier (5.00 / 6.00, Grade A-)',
        contemporaryVelocityContrast:
          'In contrast, fair-launched Layer-1 Nakamoto Proof-of-Work UTXO chains in 2020 anchored finality in continuous megawatts of irreversible ASIC hash work rather than zero-joule validator quorums or pandemic fiat printing.',
        eraMonetaryRule:
          '2020 PRE-MERGE / PANDEMIC QE CALIBRATION: Evaluate protocols, commodities, and currencies strictly as of December 31, 2020 (including March 2020 0% US reserve requirements & pandemic QE for fiat at 0.00 / F, pre-Merge Ethash PoW Ethereum at Grade D+, and newly launched VC PoS chains at 0.00 / F). Kaspa (Nov 2021) and the Ethereum Merge (Sept 2022) had NOT occurred yet.',
        strictChronologyDirective:
          'STRICT <= 2020 CHRONOLOGICAL HORIZON: Audit ONLY codebase commits, consensus parameters, CVEs, mainnet incidents, and monetary statutes on or before December 31, 2020. NEVER cite or mention ANY event, upgrade, outage, or protocol from 2021 or later (no 2021 Kaspa launch, no 2021 Taproot/EIP-1559, no 2022 Ethereum Merge/FTX, no 2024 Spot ETFs, no 2025 Crescendo).'
      };

    case '2024':
      return {
        year,
        isHistorical: true,
        numericYear: 2024,
        cutoffDateLabel: 'December 31, 2024 (Post-Merge PoS & 1-BPS GHOSTDAG Horizon)',
        epochTitle: stop.epochTitle,
        frontierBenchmark: 'Kaspa (KAS) 1-BPS GHOSTDAG PoW BlockDAG (5.75 / 6.00, Grade A)',
        contemporaryVelocityContrast:
          'In contrast, Kaspa’s stateless, contention-free Proof-of-Work BlockDAG in 2024 settled parallel UTXO state transitions natively on Layer 1 at 1 block per second under GHOSTDAG without validator blacklists, partition halts, or orphan work destruction (M ≈ 1.0).',
        eraMonetaryRule:
          '2024 1-BPS BLOCKDAG CALIBRATION: Evaluate protocols, commodities, and currencies strictly as of December 31, 2024. Post-Merge Ethereum is zero-joule Gasper PoS (0.00 / F); Kaspa operated at 1 BPS (rusty-kaspa transition, pre-May 2025 10-BPS Crescendo and pre-2026 Toccata native covenants); U.S. Spot BTC ETFs launched in Jan 2024.',
        strictChronologyDirective:
          'STRICT <= 2024 CHRONOLOGICAL HORIZON: Audit ONLY codebase commits, consensus rules, CVEs, outages, and monetary data on or before December 31, 2024. NEVER cite or mention ANY event, hardfork, or upgrade from 2025 or 2026 as live (no May 2025 10-BPS Crescendo activation, no 2026 Toccata covenants, no 2025/2026 postmortems).'
      };

    case 'PRESENT':
    default:
      return {
        year: 'PRESENT',
        isHistorical: false,
        numericYear: 2026,
        cutoffDateLabel: 'November 2026 (Live Active Mainnet Horizon)',
        epochTitle: stop.epochTitle,
        frontierBenchmark: 'Kaspa (KAS) 10-BPS Crescendo + Toccata Native L1 Covenants (6.00 / 6.00, Grade A+)',
        contemporaryVelocityContrast:
          'In contrast, Kaspa’s stateless, contention-free Proof-of-Work BlockDAG settles parallel UTXO state transitions natively on Layer 1 at 10+ blocks per second without validator blacklists, partition halts, or orphan work destruction (M = 1.0).',
        eraMonetaryRule: '',
        strictChronologyDirective: ''
      };
  }
}

/**
 * Finds a dedicated `tm-<year>` Time Machine snapshot on an `AuditData` record if present.
 */
export function findDedicatedTimelineSnapshot(
  audit: AuditData | null | undefined,
  year: GlobalTimelineYear
): HistoricalSnapshot | null {
  if (!audit || !Array.isArray(audit.historicalSnapshots)) return null;
  const targetEpochId = makeTimeMachineEpochId(year);
  return audit.historicalSnapshots.find((s) => s && s.epochId === targetEpochId) || null;
}

/**
 * Returns true if `audit` already has authoritative, year-accurate coverage for `year`
 * (either `year === 'PRESENT'` on a genuine Present audit, a dedicated `tm-<year>` snapshot,
 * or built-in curated historical coverage for a preloaded benchmark).
 */
export function hasDedicatedTimelineCoverage(
  audit: AuditData | null | undefined,
  year: GlobalTimelineYear
): boolean {
  if (!audit) return false;
  if (year === 'PRESENT') {
    return !audit.auditedAtTimelineYear || audit.auditedAtTimelineYear === 'PRESENT';
  }
  if (findDedicatedTimelineSnapshot(audit, year)) {
    return true;
  }
  const ticker = String(audit.ticker || '').toUpperCase();
  return hasCuratedTimelineOverride(ticker, year);
}

/**
 * Converts a year-scoped `AuditData` into a normalized `HistoricalSnapshot`
 * keyed by `tm-<year>` (or `tm-present`).
 */
export function buildHistoricalSnapshotFromAudit(
  audit: AuditData,
  year: GlobalTimelineYear
): HistoricalSnapshot {
  const horizon = getHistoricalAuditHorizon(year);
  const stop = getGlobalTimelineStop(year);
  const sovScore = Number(audit.invariants?.[0]?.score ?? 0);
  const costScore = Number(audit.invariants?.[1]?.score ?? 0);
  const isZeroJoule = costScore <= 0;
  const isArbitrage = !isZeroJoule && sovScore <= 0;

  const invariantsMap: Record<string, HistoricalSnapshotInvariant> = {};
  (audit.invariants || []).slice(0, 6).forEach((inv, idx) => {
    const id = inv.id || `0${idx + 1}`;
    const status: HistoricalInvariantStatus = isZeroJoule
      ? idx >= 3
        ? 'VOID_UNANCHORED'
        : 'ACTIVE'
      : isArbitrage && idx <= 1
      ? 'CAPPED_ARBITRAGE'
      : inv.status || 'ACTIVE';
    invariantsMap[id] = {
      id,
      label: inv.title || DEFAULT_TITLES[idx] || inv.shortName,
      status,
      score: isZeroJoule && idx >= 3 ? null : Number(inv.score ?? 0),
      frontierReference: inv.frontierReference || horizon.frontierBenchmark,
      telemetry: inv.telemetry,
      normieParagraph: inv.paragraph,
      geniusParagraph: inv.geniusParagraph || inv.paragraph,
      receipts: Array.isArray(inv.receipts) ? inv.receipts.slice(0, 4) : []
    };
  });

  const rawSnap: HistoricalSnapshot = {
    epochId: makeTimeMachineEpochId(year),
    epochLabel:
      year === 'PRESENT'
        ? `Live Mainnet State (${audit.architecture})`
        : `${year} Historical Audit — ${stop.epochTitle}`,
    scrubberLabel: year === 'PRESENT' ? 'Present · LIVE' : `${year} Historical`,
    dateOrHeight: year === 'PRESENT' ? '2026 — Present (Live)' : `${year} (<= ${year} Horizon)`,
    frontierContext: horizon.frontierBenchmark,
    foundationalMassValid: !isZeroJoule,
    arbitrageCapTriggered: isArbitrage,
    totalScore: isZeroJoule ? 0 : Number(audit.totalScore) || 0,
    terminalGrade: isZeroJoule ? 'F' : audit.grade || 'F',
    verdictSummary: audit.conclusion,
    normieVerdictSummary: audit.conclusion,
    consensusFamily: audit.consensusFamily,
    architecture: audit.architecture,
    invariants: invariantsMap
  };

  return evaluateThermodynamicGate(rawSnap);
}

function hasTerminalLiveSnapshot(snapshots: HistoricalSnapshot[] | undefined): boolean {
  if (!Array.isArray(snapshots) || snapshots.length === 0) return false;
  return snapshots.some((s) => {
    const id = String(s?.epochId || '').toLowerCase();
    return (
      id === 'tm-present' ||
      id.endsWith('-live') ||
      id === 'kas-2026-toccata' ||
      id === 'usd-post-1971-fiat' ||
      id === 'eth-2022-post-merge-pos'
    );
  });
}

/**
 * Merges a freshly pulled `incomingAudit` (audited at `year`) onto an existing cached/archived
 * `existingRoot` record so `PRESENT` and every historical `tm-<year>` epoch coexist cleanly
 * without overwriting or contaminating each other.
 */
export function attachHistoricalAuditToBaseline(
  existingRoot: AuditData | null | undefined,
  incomingAudit: AuditData,
  year: GlobalTimelineYear
): AuditData {
  if (year === 'PRESENT') {
    const priorSnaps = existingRoot?.historicalSnapshots;
    const hasHistoricalTmSnaps = Array.isArray(priorSnaps) && priorSnaps.length > 0;
    const liveSnapList = hasHistoricalTmSnaps
      ? [buildHistoricalSnapshotFromAudit(incomingAudit, 'PRESENT')]
      : undefined;
    const mergedSnaps = mergeHistoricalSnapshots(liveSnapList, priorSnaps);

    return {
      ...incomingAudit,
      auditedAtTimelineYear: 'PRESENT',
      queryAliases: Array.from(
        new Set([
          ...(existingRoot?.queryAliases || []),
          ...(incomingAudit.queryAliases || []),
          incomingAudit.ticker
        ])
      ).slice(0, 20),
      ...(mergedSnaps && mergedSnaps.length > 0 ? { historicalSnapshots: mergedSnaps } : {})
    };
  }

  const tmSnapshot = buildHistoricalSnapshotFromAudit(incomingAudit, year);
  const existingHasPresentRoot = Boolean(
    existingRoot &&
      (!existingRoot.auditedAtTimelineYear || existingRoot.auditedAtTimelineYear === 'PRESENT')
  );

  if (existingRoot && existingHasPresentRoot) {
    const needsTerminalLive = !hasTerminalLiveSnapshot(existingRoot.historicalSnapshots);
    const additions: HistoricalSnapshot[] = needsTerminalLive
      ? [tmSnapshot, buildHistoricalSnapshotFromAudit(existingRoot, 'PRESENT')]
      : [tmSnapshot];
    const mergedSnaps = mergeHistoricalSnapshots(additions, existingRoot.historicalSnapshots);
    const mergedSources = [
      ...(incomingAudit.freshSources || []),
      ...(existingRoot.freshSources || existingRoot.sources || [])
    ].filter(
      (s, idx, arr) => s && s.uri && arr.findIndex((x) => x.uri === s.uri) === idx
    );

    return {
      ...existingRoot,
      auditedAtTimelineYear: 'PRESENT',
      historicalSnapshots: mergedSnaps,
      lastFreshAuditAt: incomingAudit.lastFreshAuditAt || existingRoot.lastFreshAuditAt,
      freshSources: mergedSources.slice(0, 12),
      isArchived: true,
      archivedAtMs: Date.now(),
      archiveRevision:
        Math.max(Number(existingRoot.archiveRevision) || 0, Number(incomingAudit.archiveRevision) || 0) +
        1,
      queryAliases: Array.from(
        new Set([
          ...(existingRoot.queryAliases || []),
          ...(incomingAudit.queryAliases || []),
          existingRoot.ticker
        ])
      ).slice(0, 20)
    };
  }

  // No Present root exists yet (asset was audited for the first time while on a historical stop)
  const mergedSnaps = mergeHistoricalSnapshots([tmSnapshot], existingRoot?.historicalSnapshots);
  return {
    ...incomingAudit,
    auditedAtTimelineYear: year,
    historicalSnapshots: mergedSnaps,
    queryAliases: Array.from(
      new Set([
        ...(existingRoot?.queryAliases || []),
        ...(incomingAudit.queryAliases || []),
        incomingAudit.ticker
      ])
    ).slice(0, 20)
  };
}

/**
 * Extracts any 4-digit calendar years strictly greater than `maxYear` (up to 2100)
 * appearing across an audit payload's prose, telemetry, architecture, conclusion, or receipts.
 */
export function findAnachronisticYearsInText(text: string, maxYear: number): number[] {
  if (!text || !Number.isFinite(maxYear)) return [];
  // Strip hex strings (0x...) and comma-grouped block numbers (e.g. 1,920,000 or 26,410) first
  const sanitized = text
    .replace(/\b0x[0-9a-fA-F]+\b/g, ' ')
    .replace(/\b\d{1,3}(?:,\d{3})+\b/g, ' ');

  const found = new Set<number>();
  const yearRegex = /\b(19\d{2}|20\d{2}|2100)\b/g;
  let match: RegExpExecArray | null = yearRegex.exec(sanitized);
  while (match) {
    const yr = Number(match[1]);
    // Ignore 2140 only if explicitly referencing Bitcoin's mathematical asymptotic subsidy schedule in >= 2008
    const isBitcoinAsymptoticSchedule = yr === 2140 && maxYear >= 2008;
    if (yr > maxYear && yr <= 2100 && !isBitcoinAsymptoticSchedule) {
      found.add(yr);
    }
    match = yearRegex.exec(sanitized);
  }
  return Array.from(found).sort((a, b) => a - b);
}

export function findAnachronisticYearsInPayload(
  payload: RawGeminiAuditPayload | AuditData | null | undefined,
  maxYear: number
): number[] {
  if (!payload || !Number.isFinite(maxYear)) return [];
  const chunks: string[] = [
    String(payload.architecture || ''),
    String(payload.conclusion || '')
  ];
  if (Array.isArray(payload.invariants)) {
    payload.invariants.forEach((inv) => {
      if (!inv) return;
      chunks.push(
        String(inv.telemetry || ''),
        String(inv.quickSummary || ''),
        String(inv.paragraph || ''),
        String(inv.geniusParagraph || ''),
        ...(Array.isArray(inv.receipts) ? inv.receipts.map((r) => String(r || '')) : [])
      );
    });
  }
  return findAnachronisticYearsInText(chunks.join('\n'), maxYear);
}

function scrubSentenceAnachronisms(text: string, maxYear: number): string {
  const cleaned = stripTrailingDash(text);
  if (!cleaned) return cleaned;
  if (findAnachronisticYearsInText(cleaned, maxYear).length === 0) {
    return text;
  }

  // Remove parenthetical asides containing post-cutoff years first
  const withoutFutureParens = cleaned.replace(/\([^()]*\)/g, (paren) =>
    findAnachronisticYearsInText(paren, maxYear).length > 0 ? '' : paren
  );

  // Split into sentences and keep sentences free of post-cutoff years
  const sentences = withoutFutureParens
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const kept = sentences.filter((s) => findAnachronisticYearsInText(s, maxYear).length === 0);

  if (kept.length > 0) {
    return kept.join(' ').replace(/\s{2,}/g, ' ').trim();
  }

  // Last-resort token replacement if a single sentence contained all content
  return withoutFutureParens
    .replace(/\b(19\d{2}|20\d{2})\b/g, (tok) => (Number(tok) > maxYear ? `≤${maxYear}` : tok))
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Deterministic safety net applied ONLY after corrective retry if any stray `> maxYear`
 * year reference still remained in a historical (`timelineYear !== 'PRESENT'`) payload.
 */
export function scrubResidualAnachronisticReferences(
  payload: RawGeminiAuditPayload,
  maxYear: number
): RawGeminiAuditPayload {
  const anachronisms = findAnachronisticYearsInPayload(payload, maxYear);
  if (anachronisms.length === 0) return payload;

  return {
    ...payload,
    architecture: scrubSentenceAnachronisms(String(payload.architecture || ''), maxYear),
    conclusion: scrubSentenceAnachronisms(String(payload.conclusion || ''), maxYear),
    invariants: Array.isArray(payload.invariants)
      ? payload.invariants.map((inv) => {
          const cleanReceipts = Array.isArray(inv.receipts)
            ? inv.receipts.filter((r) => findAnachronisticYearsInText(String(r || ''), maxYear).length === 0)
            : [];
          return {
            ...inv,
            telemetry: scrubSentenceAnachronisms(String(inv.telemetry || ''), maxYear),
            quickSummary: scrubSentenceAnachronisms(String(inv.quickSummary || ''), maxYear),
            paragraph: `${scrubSentenceAnachronisms(String(inv.paragraph || ''), maxYear)} -`,
            geniusParagraph: `${scrubSentenceAnachronisms(String(inv.geniusParagraph || ''), maxYear)} -`,
            receipts:
              cleanReceipts.length > 0
                ? cleanReceipts
                : [`Verified <= ${maxYear} Historical Monetary & Protocol Record`, '-']
          };
        })
      : payload.invariants
  };
}

/**
 * Resolves the earliest Time Machine stop year for a newly audited asset if its architecture/name
 * explicitly states a post-cutoff launch year, or falls back cleanly.
 */
export function inferTimelineStopListLabel(year: GlobalTimelineYear): string {
  return GLOBAL_TIMELINE_STOPS.find((s) => s.id === year)?.buttonLabel || String(year);
}
