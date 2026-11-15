import type { AuditData } from './rubricSpec.ts';

export type AuditCategory =
  | 'SOVEREIGN_L1_BENCHMARK'
  | 'PHYSICAL_COMMODITY'
  | 'ECOSYSTEM_OVERLAY';

export interface AuditProvenanceInfo {
  provenanceBadge: 'Deterministic Reference Audit' | 'Live AI Heuristic Audit';
  badgeLabel: 'Deterministic Reference Audit' | 'Live AI Heuristic Audit';
  isDeterministicReference: boolean;
  category: AuditCategory;
  categoryBadge: 'Ecosystem / Overlays' | null;
  methodologyTooltip: string;
  tooltip: string;
  isSandbox: boolean;
  isSandboxLocal: boolean;
}

export interface SandboxQueryClassification {
  isSandbox: boolean;
  isTestUrlParam: boolean;
  isTestKeyword: boolean;
  isPromptInjection: boolean;
  isUnverifiedTicker: boolean;
  reasons: string[];
}

export const CORE_REFERENCE_TICKERS = new Set<string>([
  'KAS',
  'BTC',
  'LTC',
  'XAU',
  'XAG',
  'BCH',
  'XMR',
  'ZEC',
  'ADA',
  'AVAX',
  'ALGO',
  'PI',
  'XLM',
  'SUI',
  'STX',
  'ETH',
  'SOL',
  'XRP',
  'NEAR',
  'TAO'
]);

export const ECOSYSTEM_OVERLAY_TICKERS = new Set<string>(['GEEK', 'IGRA', 'LN']);

export function getAuditCategory(audit: AuditData | null | undefined): AuditCategory {
  if (!audit) return 'SOVEREIGN_L1_BENCHMARK';
  const tk = String(audit.ticker || '').toUpperCase().trim();
  if (ECOSYSTEM_OVERLAY_TICKERS.has(tk)) {
    return 'ECOSYSTEM_OVERLAY';
  }
  if (audit.consensusFamily === 'PHYSICAL_COMMODITY') {
    return 'PHYSICAL_COMMODITY';
  }
  if (CORE_REFERENCE_TICKERS.has(tk)) {
    return 'SOVEREIGN_L1_BENCHMARK';
  }
  const archText = `${audit.name || ''} ${audit.architecture || ''}`.toUpperCase();
  if (
    /\b(KRC-20|KCC-20|BRC-20|LIGHTNING|STATE CHANNEL|PAYMENT CHANNEL|HTLC|PTLC|ROLLUP|LAYER-2|LAYER 2|\bL2\b|OVERLAY)\b/.test(
      archText
    )
  ) {
    return 'ECOSYSTEM_OVERLAY';
  }
  return 'SOVEREIGN_L1_BENCHMARK';
}

export function isEcosystemOverlayAudit(audit: AuditData | null | undefined): boolean {
  return getAuditCategory(audit) === 'ECOSYSTEM_OVERLAY';
}

export function getAuditProvenance(
  audit: AuditData | null | undefined,
  options: {
    preloadedTickers?: Set<string>;
    preloadedMap?: Record<string, AuditData>;
    isSandbox?: boolean;
    isSandboxLocal?: boolean;
  } = {}
): AuditProvenanceInfo {
  const tk = String(audit?.ticker || '').toUpperCase().trim();
  const hasPreloadedEntry = Boolean(
    tk && (options.preloadedTickers?.has(tk) || options.preloadedMap?.[tk])
  );
  const isFreshLive = Boolean(audit?.lastFreshAuditAt || audit?.isCustom);
  const isDeterministicReference = Boolean(audit && hasPreloadedEntry && !isFreshLive);
  const category = getAuditCategory(audit);
  const label = isDeterministicReference
    ? 'Deterministic Reference Audit'
    : 'Live AI Heuristic Audit';
  const tip = isDeterministicReference
    ? 'Core protocols use code-verified deterministic parameters anchored to live mainnet consensus rules and empirical repository constants.'
    : 'Dynamically synthesized via grounded live web & GitHub lookup evaluated against the 6-invariant thermodynamic rubric.';
  const sandboxFlag = Boolean(options.isSandbox || options.isSandboxLocal);

  return {
    provenanceBadge: label,
    badgeLabel: label,
    isDeterministicReference,
    category,
    categoryBadge: category === 'ECOSYSTEM_OVERLAY' ? 'Ecosystem / Overlays' : null,
    methodologyTooltip: tip,
    tooltip: tip,
    isSandbox: sandboxFlag,
    isSandboxLocal: sandboxFlag
  };
}

export function partitionTickersByEcosystem(
  tickers: string[],
  auditsMap: Record<string, AuditData>
): { coreTickers: string[]; primaryTickers: string[]; ecosystemTickers: string[] } {
  const coreTickers: string[] = [];
  const ecosystemTickers: string[] = [];
  for (const tk of tickers) {
    const item = auditsMap[tk];
    if (isEcosystemOverlayAudit(item)) {
      ecosystemTickers.push(tk);
    } else {
      coreTickers.push(tk);
    }
  }
  return { coreTickers, primaryTickers: coreTickers, ecosystemTickers };
}

const TEST_KEYWORD_REGEX =
  /^(TEST|TESTS|TESTING|TESTNET|TEST[0-9]+|AVGTEST[0-9]*|MOBTEST[0-9]*|FOO|BAR|BAZ|ASDF|QWERTY|DEBUG|MOCK|DUMMY|HELLO|SAMPLE|PING|XXXX+|AAAA+|BBBB+)$/;

const PROMPT_INJECTION_REGEX =
  /(<script|<\/|ignore\s+previous|system\s+prompt|you\s+are\s+now|assistant:|user:|{{|}}|\$\{|;\s*(drop|select|delete|insert|update)\b|--\s|\bexec\(|\beval\()/i;

export function isSandboxUrlEnabled(search = ''): boolean {
  if (!search) return false;
  try {
    const params = new URLSearchParams(search);
    const val = (params.get('test') || params.get('sandbox') || '').trim().toLowerCase();
    return val === '1' || val === 'true' || val === 'yes';
  } catch {
    return /[?&](test|sandbox)=(1|true)\b/i.test(search);
  }
}

export function classifyAuditQueryForSandbox(
  rawQuery: string,
  urlSearch = '',
  explicitSandbox = false,
  preloadedSet?: Set<string>
): SandboxQueryClassification {
  const trimmed = String(rawQuery || '').trim();
  const isTestUrlParam = isSandboxUrlEnabled(urlSearch);
  const cleanedAlphaNum = trimmed.replace(/^\$/, '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  const isTestKeyword = Boolean(
    cleanedAlphaNum &&
      (TEST_KEYWORD_REGEX.test(cleanedAlphaNum) ||
        /^TEST[A-Z0-9_ -]*$/.test(trimmed.toUpperCase()) ||
        /^MOCK[A-Z0-9_ -]*$/.test(trimmed.toUpperCase()))
  );

  const isPromptInjection = Boolean(trimmed && PROMPT_INJECTION_REGEX.test(trimmed));

  const hasWeirdPunctuation = /[^A-Za-z0-9\s$._-]/.test(trimmed);
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const isSingleAllDigitToken = /^\d+$/.test(cleanedAlphaNum);
  const isKnownPreloaded = Boolean(preloadedSet?.has(cleanedAlphaNum));
  const isOverlongUnverified = (wordCount > 4 || cleanedAlphaNum.length > 18) && !isKnownPreloaded;

  const isUnverifiedTicker = Boolean(
    trimmed && (hasWeirdPunctuation || isSingleAllDigitToken || isOverlongUnverified)
  );

  const reasons: string[] = [];
  if (explicitSandbox) reasons.push('SANDBOX_TOGGLE');
  if (isTestUrlParam) reasons.push('URL_TEST_PARAM');
  if (isTestKeyword) reasons.push('TEST_KEYWORD');
  if (isPromptInjection) reasons.push('PROMPT_INJECTION');
  if (isUnverifiedTicker) reasons.push('UNVERIFIED_SYNTAX');

  return {
    isSandbox: reasons.length > 0,
    isTestUrlParam,
    isTestKeyword,
    isPromptInjection,
    isUnverifiedTicker,
    reasons
  };
}

export interface AuditInvariantBracketInfo {
  id: string;
  shortName: string;
  score: number;
  bracketRange: string;
  bracketSummary: string;
}

export interface AuditRevisionTrigger {
  direction: 'UPGRADE' | 'DOWNGRADE' | 'MONITOR';
  invariantId: string;
  condition: string;
}

export interface AuditRevisionAnalysis {
  provenanceMode: 'Deterministic Reference Audit' | 'Live AI Heuristic Audit';
  methodologySummary: string;
  brackets: AuditInvariantBracketInfo[];
  triggers: AuditRevisionTrigger[];
}

function classifyInvariantBracket(id: string, score: number): {
  bracketRange: string;
  bracketSummary: string;
} {
  const s = Number(score.toFixed(2));
  if (id === '01') {
    if (s >= 0.99) {
      return {
        bracketRange: '1.00',
        bracketSummary: 'Immaculate PoW genesis or astrophysical element; 0 premine, 0% tax, 0 pool monopoly.'
      };
    }
    if (s >= 0.8) {
      return {
        bracketRange: '0.80–0.95',
        bracketSummary: 'Fair-launch PoW tempered by pool template concentration (>50%) or fork/self-mine events.'
      };
    }
    if (s >= 0.45) {
      return {
        bracketRange: '0.45–0.75',
        bracketSummary: '0-premint overlay or LSP channel mesh with off-chain routing/indexer hub concentration.'
      };
    }
    return {
      bracketRange: '0.00',
      bracketSummary: 'Genesis premine, pre-allocation, dev tax, or admin/validator kill-switch (caps grade <= D+).'
    };
  }
  if (id === '02') {
    if (s >= 0.99) {
      return {
        bracketRange: '1.00',
        bracketSummary: '100% untaxed, algorithm-dominant dedicated-ASIC PoW under deterministic hard cap.'
      };
    }
    if (s >= 0.76) {
      return {
        bracketRange: '0.80–0.95',
        bracketSummary: 'Crust metal extraction/byproduct mining OR untaxed PoW with tail emission / rentable CPU / AuxPoW.'
      };
    }
    if (s >= 0.55) {
      return {
        bracketRange: '0.55–0.75',
        bracketSummary: 'Untaxed fair-launch PoW holding <5% minority share of a shared ASIC fleet.'
      };
    }
    if (s >= 0.1) {
      return {
        bracketRange: '0.10–0.35',
        bracketSummary: 'Energy-arbitraged premine/taxed PoW OR 0-Joule overlay anchored to an L1 PoW carrier.'
      };
    }
    return {
      bracketRange: '0.00',
      bracketSummary: '0-Joule PoS, DPoS, PoH, PoA, or single-sequencer consensus (auto-triggers Grade F).'
    };
  }
  if (id === '03') {
    if (s >= 0.99) {
      return {
        bracketRange: '1.00',
        bracketSummary: 'Dominant cumulative PoW heat wall + trustless Genesis/PoPoW sync + plaintext supply auditability.'
      };
    }
    if (s >= 0.75) {
      return {
        bracketRange: '0.75–0.90',
        bracketSummary: 'Nuclear isotope stability, L1-sequenced rollup DA, or PoW with cut-through / opaque commitments.'
      };
    }
    if (s >= 0.5) {
      return {
        bracketRange: '0.50–0.70',
        bracketSummary: 'PoW with >51% reorg history, subjective rolling checkpoints, indexers, or online watchtowers.'
      };
    }
    if (s >= 0.25) {
      return {
        bracketRange: '0.25–0.45',
        bracketSummary: 'Ledger impacted by silent ZK counterfeiting exposure or strict max-reorg depth caps.'
      };
    }
    return {
      bracketRange: '0.00',
      bracketSummary: 'Weightless PoS signatures, Weak Subjectivity checkpoints, or rolling cloud S3 pruning.'
    };
  }
  if (id === '04') {
    if (s >= 0.85) {
      return {
        bracketRange: '0.85–1.00',
        bracketSummary: 'Per-block DAA PoW BlockDAG surviving cuts and weaving/resolving within bounded merge rules.'
      };
    }
    if (s >= 0.55) {
      return {
        bracketRange: '0.55–0.75',
        bracketSummary: 'Linear PoW (pre-cut UTXOs survive; epoch lag before nChainWork reorg) or offline bearer bullion.'
      };
    }
    if (s >= 0.35) {
      return {
        bracketRange: '0.35–0.54',
        bracketSummary: 'Linear PoW w/ decoy poisoning, rolling checkpoints splitting >2h cuts, or HTLC Flood & Loot.'
      };
    }
    if (s >= 0.15) {
      return {
        bracketRange: '0.15–0.34',
        bracketSummary: 'Severe <=100-block max-reorg caps, hybrid-PoS finality halts, or multisig bridge freezes.'
      };
    }
    return {
      bracketRange: '0.00',
      bracketSummary: 'BFT/PoS/FBA quorum halts at 25%–33.4% partition split or chronic peacetime cluster outages.'
    };
  }
  if (id === '05') {
    if (s >= 0.99) {
      return {
        bracketRange: '1.00',
        bracketSummary: 'Stateless parallel Extended UTXO + native L1 covenants/ZK at sub-second BlockDAG cadence.'
      };
    }
    if (s >= 0.75) {
      return {
        bracketRange: '0.75–0.90',
        bracketSummary: 'Stateless UTXO with expressive L1 covenants & tokens on a sequential block timer.'
      };
    }
    if (s >= 0.5) {
      return {
        bracketRange: '0.50–0.70',
        bracketSummary: 'Stateless UTXO lacking expressive L1 covenants (or MWEB extension) / high-density paper-vaulted metal.'
      };
    }
    if (s >= 0.2) {
      return {
        bracketRange: '0.20–0.49',
        bracketSummary: 'Unpruneable stealth/nullifier bloat, stateful liquidity channels, or shared-account EVM over PoW.'
      };
    }
    return {
      bracketRange: '0.00',
      bracketSummary: '0-Joule shared-account locks, mandatory state rent, toxic MEV, or native freeze/clawback switches.'
    };
  }
  if (s >= 0.95) {
    return {
      bracketRange: '0.95–1.00',
      bracketSummary: 'Native L1 >=10 BPS parallel PoW BlockDAG incorporating 100% of honest hash work (M = 1.0).'
    };
  }
  if (s >= 0.5) {
    return {
      bracketRange: '0.50–0.85',
      bracketSummary: 'Native L1 1–9 BPS parallel PoW BlockDAG (M ~ 1.0).'
    };
  }
  if (s >= 0.35) {
    return {
      bracketRange: '0.35–0.45',
      bracketSummary: 'Enhanced sequential Linear PoW (M < 1.0): 15–150s cadence or elastic >=32 MB throughput.'
    };
  }
  if (s >= 0.2) {
    return {
      bracketRange: '0.20–0.30',
      bracketSummary: '20-min spend-locked sequential PoW, throttled 600s ~7 TPS chain, or commit/reveal DAG overlay.'
    };
  }
  if (s >= 0.05) {
    return {
      bracketRange: '0.05–0.18',
      bracketSummary: 'Carrier-subordinated off-chain channel/rollup (M_overlay < M_L1 < 1.0) or physical bullion freight.'
    };
  }
  return {
    bracketRange: '0.00',
    bracketSummary: 'Standalone 0-Joule PoS/DPoS/PoA/sequencer cluster (M = 0 thermodynamic work).'
  };
}

export function getAuditRevisionAnalysis(
  audit: AuditData | null | undefined,
  isDeterministicReference: boolean
): AuditRevisionAnalysis {
  const tk = String(audit?.ticker || '').toUpperCase().trim();
  const invs = Array.isArray(audit?.invariants) ? audit.invariants : [];
  const brackets: AuditInvariantBracketInfo[] = invs.map((inv) => {
    const info = classifyInvariantBracket(inv.id, Number(inv.score) || 0);
    return {
      id: inv.id,
      shortName: inv.shortName || `Inv ${inv.id}`,
      score: Number(inv.score) || 0,
      bracketRange: info.bracketRange,
      bracketSummary: info.bracketSummary
    };
  });

  let triggers: AuditRevisionTrigger[] = [];

  if (tk === 'KAS') {
    triggers = [
      {
        direction: 'MONITOR',
        invariantId: '04',
        condition:
          'DAGKnight (KIP-2) [Roadmap / KIP-2 Proposed — In Testnet-13 Review] is excluded from current A+ scoring; mainnet activation adds parameterless latency adaptation later.'
      },
      {
        direction: 'MONITOR',
        invariantId: '03',
        condition:
          'Consumer node sovereignty relies on sustaining Crescendo ~8-core / 16 GB / 256 GB NVMe (~40–50 Mbps) 30h PoPoW pruning without pushing solo verifiers onto S3/archival hosts.'
      },
      {
        direction: 'DOWNGRADE',
        invariantId: '01',
        condition:
          'Single-leader template concentration >50% across 2–3 kHeavyHash pools or adoption of a protocol coinbase tax drops Invariant 01 into 0.80–0.95 or 0.00.'
      }
    ];
  } else if (tk === 'BTC') {
    triggers = [
      {
        direction: 'UPGRADE',
        invariantId: '01',
        condition:
          'Recovers 1.00 Sovereignty (+0.05) only if >50% of live mainnet blocks transition from Foundry+AntPool Stratum v1 templates to independent miner-built Stratum v2 Job Declaration (currently ~3–5% live vs ~75% May 2026 pool pledges).'
      },
      {
        direction: 'UPGRADE',
        invariantId: '05',
        condition:
          'Mainnet activation of expressive native L1 covenants (e.g., OP_CAT / L1 vault opcodes without trusted federation) moves State Topology upward toward 0.70–0.80.'
      },
      {
        direction: 'DOWNGRADE',
        invariantId: '02',
        condition:
          'Halving fee-starvation triggering tail-inflation proposals or softfork confiscation hooks forces an immediate re-audit deduction.'
      }
    ];
  } else if (tk === 'XMR') {
    triggers = [
      {
        direction: 'UPGRADE',
        invariantId: '04',
        condition:
          'Mainnet activation of FCMP++ (Full-Chain Membership Proofs curve trees, currently in v0.19.0.0-beta.3.0 stressnet) eliminates 16-decoy RingCT resplice poisoning—lifting Invariant 04 toward the 0.55–0.65 linear-PoW band (single-chain reorgs & 60-blk coinbase taint remain).'
      },
      {
        direction: 'UPGRADE',
        invariantId: '01',
        condition:
          'P2Pool surpassing centralized pools (SupportXMR/Nanopool/Kryptex ~60%) + eliminating rentable CPU >51% surges like Aug 2025 Qubic raises Invariant 01 back toward 0.95–1.00.'
      },
      {
        direction: 'DOWNGRADE',
        invariantId: '03',
        condition:
          'Another live mainnet >51% reorganization or discovery of a silent RingCT/FCMP++ soundness bug drops Immutability below 0.50.'
      }
    ];
  } else if (tk === 'BCH') {
    triggers = [
      {
        direction: 'UPGRADE',
        invariantId: '04',
        condition:
          'Removing BCHN -maxreorgdepth=10 (7,200s rolling finalization checkpoint) resolves the permanent >2h continental split risk, lifting Availability into the 0.65–0.70 linear-PoW bracket.'
      },
      {
        direction: 'MONITOR',
        invariantId: '02',
        condition:
          'Holding <1% of global SHA-256d fleet exposes BCH to external miner spillover unless hashrate share diversifies materially.'
      }
    ];
  } else if (tk === 'LTC') {
    triggers = [
      {
        direction: 'UPGRADE',
        invariantId: '05',
        condition:
          'Shipping native L1 covenants beyond Taproot/MWEB extension blocks raises Invariant 05 above 0.70; switching to per-block DAA shortens isolated 10% shard recovery (<3.5w).'
      }
    ];
  } else if (tk === 'XAU' || tk === 'XAG' || audit?.consensusFamily === 'PHYSICAL_COMMODITY') {
    triggers = [
      {
        direction: 'MONITOR',
        invariantId: '04',
        condition:
          'Physical elements have static nuclear constants (0.90–1.00 local bearer sovereignty, 0.0 TPS cross-ocean fiber teleportation); scores shift only if custodial wrappers or synthetic isotopes enter scope.'
      }
    ];
  } else if (isEcosystemOverlayAudit(audit)) {
    triggers = [
      {
        direction: 'MONITOR',
        invariantId: '06',
        condition:
          'Carrier-Subordinated Velocity Law enforces M_overlay < M_L1: an L2/channel overlay cannot surpass its base L1 PoW carrier regardless of off-chain TPS claims.'
      },
      {
        direction: 'UPGRADE',
        invariantId: '03',
        condition:
          'Replacing PoS bridge attesters / off-chain indexers with pure L1 ZK verification + KIP-21 L1 sequencing lifts Immutability toward 0.95.'
      }
    ];
  } else if (audit?.consensusFamily === 'ZERO_JOULE_BFT') {
    triggers = [
      {
        direction: 'MONITOR',
        invariantId: '02',
        condition:
          'Any network finalizing blocks via 0-Joule stake voting remains locked at Cost Floor = 0.00 and Terminal Grade F under Conservation of Energy—software optimizations cannot overcome E = 0.'
      }
    ];
  } else {
    const inv01 = invs.find((i) => i.id === '01')?.score ?? 0;
    const inv04 = invs.find((i) => i.id === '04')?.score ?? 0;
    if (inv01 === 0) {
      triggers.push({
        direction: 'MONITOR',
        invariantId: '01',
        condition:
          'Genesis premine, pre-allocation, or coinbase dev tax hard-caps Terminal Grade at <= D+ (Energy-Arbitrage Ceiling).'
      });
    }
    if (inv04 < 0.75) {
      triggers.push({
        direction: 'UPGRADE',
        invariantId: '04',
        condition:
          'Migrating from sequential single-chain / epoch-lagged DAA to a per-block DAA parallel BlockDAG raises partition survival without minority reorgs.'
      });
    }
    if (triggers.length === 0) {
      triggers.push({
        direction: 'MONITOR',
        invariantId: '06',
        condition:
          'Fresh single-invariant or full re-audits trigger whenever mainnet consensus code, emission schedules, or mining/validator concentration materially shift.'
      });
    }
  }

  return {
    provenanceMode: isDeterministicReference
      ? 'Deterministic Reference Audit'
      : 'Live AI Heuristic Audit',
    methodologySummary: isDeterministicReference
      ? 'Canonical 6-invariant benchmark pinned to verified consensus source code and historical mainnet receipts. Scores update only when live mainnet parameters change.'
      : 'Dynamically synthesized via live Google Search & repository grounding against the exact 6-invariant quantitative brackets below.',
    brackets,
    triggers
  };
}
