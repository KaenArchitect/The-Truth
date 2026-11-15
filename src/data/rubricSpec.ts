// ============================================================================
// DETERMINISTIC 6-INVARIANT THERMODYNAMIC RUBRIC, SCHEMAS & PHYSICS GUARDRAILS
// ============================================================================

export type ConsensusFamily =
  | 'BLOCKDAG_POW'
  | 'LINEAR_POW'
  | 'PHYSICAL_COMMODITY'
  | 'ENERGY_ARBITRAGED_POW'
  | 'CARRIER_SUBORDINATED_OVERLAY'
  | 'ZERO_JOULE_BFT';

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface InvariantData {
  id: string;
  shortName: string;
  title?: string;
  telemetry: string;
  score: number;
  quickSummary: string;
  paragraph: string;
  geniusParagraph?: string;
  receipts: string[];
  lastSingleAuditAt?: string;
  lastSingleAuditSource?: string;
  singleScoreDelta?: number;
}

export interface AuditData {
  ticker: string;
  name: string;
  consensusFamily: ConsensusFamily;
  architecture: string;
  grade: string;
  totalScore: number;
  certainty: string;
  conclusion: string;
  invariants: InvariantData[];
  geniusParagraphs?: string[];
  lastFreshAuditAt?: string;
  scoreDelta?: number | null;
  freshSources?: GroundingSource[];
  sources?: GroundingSource[];
  isCustom?: boolean;
  isArchived?: boolean;
  archivedAtMs?: number;
  archivedAtLabel?: string;
  archiveRevision?: number;
  queryAliases?: string[];
  originalAuthorUid?: string;
  archivedByUid?: string;
}

export interface InvariantLogEntry {
  id: string;
  kind: 'REAUDIT' | 'CHALLENGE' | 'BREAKDOWN';
  timestamp: string;
  verdictTag: string;
  verdictState?: 'ACCEPTED' | 'PARTIAL' | 'REJECTED';
  headline: string;
  userPrompt: string | null;
  body: string;
  sources: GroundingSource[];
}

export interface GradeAccent {
  primary: string;
  secondary: string;
  softBg: string;
  secondarySoftBg: string;
  border: string;
  secondaryBorder: string;
  glow: string;
  secondaryGlow: string;
  gradientCss: string;
  textOnAccent: string;
}

export interface ScoreStyle {
  color: string;
  bg: string;
  border: string;
  status: string;
}

export interface RubricBracket {
  range: string;
  rule: string;
}

export interface RubricInvariantSpec {
  id: string;
  name: string;
  brackets: RubricBracket[];
}

export interface ScanStageSpec {
  id: string;
  shortName: string;
  title: string;
  color: string;
  softBg: string;
  glow: string;
  codeLines: string[];
}

export interface StreamProgressState {
  completedCount: number;
  completedColors: Record<number, string>;
  completedScores: Record<number, number>;
}

export const GRADING_RUBRIC_SPEC: RubricInvariantSpec[] = [
  {
    id: '01',
    name: 'Existential Sovereignty & Entity Decoupling',
    brackets: [
      {
        range: '1.00',
        rule: 'Immaculate empty-ledger Proof-of-Work genesis or naturally occurring cosmic element: 0 premine, 0 ICO, 0 venture allocations, 0 foundation reserve, 0% protocol tax, 0 administrative freeze keys, and 0 single-leader pool template monopoly.'
      },
      {
        range: '0.80–0.95',
        rule: 'Zero-premine, zero-tax Proof-of-Work fair launch tempered by single-leader mining-pool template concentration (>50% across 2–3 pools), foundation coordination, or contentious hardfork governance.'
      },
      {
        range: '0.45–0.75',
        rule: 'Zero-premint Layer-1 overlays paired with founder-administered servers/indexers, or zero-token channel networks exhibiting hub-and-spoke liquidity routing concentration and custodial user migration.'
      },
      {
        range: '0.00',
        rule: 'Any genesis premine, pre-allocated token supply, ICO, venture unlock cliff, mandatory protocol coinbase tax, permissioned validator cartel, or administrative kill-switch. Triggers the Energy-Arbitrage Cost Floor Cap (<=0.35) and caps Terminal Grade at D+ maximum.'
      }
    ]
  },
  {
    id: '02',
    name: 'Thermodynamic Cost Floor (E > 0)',
    brackets: [
      {
        range: '1.00',
        rule: '100% untaxed, zero-premine, zero-preallocation, algorithm-dominant (>90% hardware share) dedicated-ASIC Proof-of-Work governed by a deterministic hard supply cap with zero insider energy arbitrage.'
      },
      {
        range: '0.80–0.95',
        rule: 'Genuine physical ore extraction and smelting energy under elastic geological supply, or zero-premine, zero-preallocation, untaxed Proof-of-Work with perpetual tail emission, merge-mined subsidy coupling, or general-purpose rentable CPU hardware.'
      },
      {
        range: '0.55–0.75',
        rule: 'Zero-premine, zero-preallocation, untaxed Proof-of-Work commanding a minority share (<5%) of a shared ASIC hardware fleet vulnerable to external majority hashrate swings or historical difficulty-adjustment gaming.'
      },
      {
        range: '0.10–0.35',
        rule: 'Energy-Arbitraged PoW & Carrier-Backed Overlays: Proof-of-Work compromised by any genesis premine, token pre-allocation, or mandatory protocol developer tax—creating an internal energy arbitrage where zero-work insiders dilute unit energy density and extract value from miners’ expended electricity (0.15–0.30 premined/taxed PoW; 0.10–0.15 pre-allocated token on an L1 PoW carrier)—or zero-premint overlays anchored only to Layer-1 PoW carrier fees (0.35).'
      },
      {
        range: '0.00',
        rule: 'Automatic Grade F: Zero-joule consensus architectures (PoS, DPoS, PPoS, PoH, PoA, FBA, PoX), single-sequencer rollups, fiat ledgers, or standalone pre-printed zero-joule tokens.'
      }
    ]
  },
  {
    id: '03',
    name: 'Historical Immutability & Arrow of Time',
    brackets: [
      {
        range: '1.00',
        rule: 'Dominant cumulative Proof-of-Work Landauer heat barrier paired with trustless verification from Genesis (full header chain or cryptographic PoPoW) and plaintext arithmetic supply auditability.'
      },
      {
        range: '0.75–0.90',
        rule: 'Nuclear binding energy stability (subject to density-matched bar cladding), Layer-1 Proof-of-Work payload sequencing with external state attestations, extension-block cut-through pruning, or cumulative Proof-of-Work paired with opaque cryptographic balance commitments.'
      },
      {
        range: '0.50–0.70',
        rule: 'Layer-1 Proof-of-Work inscriptions reliant on off-chain state indexers, off-chain bilateral state channels dependent on online watchtowers and dispute-window fraud proofs, minority-hash Proof-of-Work enforcing subjective rolling finality checkpoints, or chains with historical 51% reorganizations.'
      },
      {
        range: '0.25–0.45',
        rule: 'Proof-of-Work ledger compromised by silent zero-joule cryptographic circuit soundness flaws or infinite-counterfeiting bugs.'
      },
      {
        range: '0.00',
        rule: 'Zero-joule validator signatures, Weak Subjectivity social checkpoints, rolling multi-day/epoch history deletion, cloud state snapshots, or permanently missing genesis ledgers.'
      }
    ]
  },
  {
    id: '04',
    name: 'Dynamic Availability (Wartime Partition & Resplice)',
    brackets: [
      {
        range: '0.85–1.00',
        rule: 'Per-block difficulty-adjusting Proof-of-Work BlockDAG: 0% halt across arbitrary fiber partitions and 0.0% honest block destruction upon cable resplice via deterministic graph merging (0.85–0.95 if external bridge exits pause).'
      },
      {
        range: '0.55–0.75',
        rule: 'Pure Nakamoto sequential Proof-of-Work (mines indefinitely across splits and reconverges, but orphans 100% of minority-hemisphere blocks on resplice) or physical bearer commodities (100% offline local barter, 0.0 TPS across blockaded oceans).'
      },
      {
        range: '0.35–0.54',
        rule: 'Dual-boundary systems where Layer-1 transfers survive while off-chain cloud services fail closed, interactive state-channel overlays vulnerable to timelock force-close congestion and resplice carrier reorgs, privacy chains where reorgs invalidate decoy rings, or rolling-checkpoint chains that permanently split during multi-hour partitions.'
      },
      {
        range: '0.15–0.34',
        rule: 'Sequential Proof-of-Work introducing hybrid Proof-of-Stake finality halt thresholds or censurable multisig exit bridges.'
      },
      {
        range: '0.00',
        rule: 'Supermajority quorum protocols (66.7%–80% stake/signer thresholds) that flatline under continental partitions, chains with finite slot-density divergence horizons, or networks with global mainnet blackouts.'
      }
    ]
  },
  {
    id: '05',
    name: 'State Machine Topology',
    brackets: [
      {
        range: '1.00',
        rule: 'Stateless parallel Extended UTXO graph with native Layer-1 covenants, expressive smart-contract scripting, and succinct zero-knowledge verification opcodes at sub-second BlockDAG cadence with zero MEV locks or freeze hooks.'
      },
      {
        range: '0.75–0.90',
        rule: 'Stateless UTXO model upgraded with native Layer-1 covenants, UTXO-level token primitives, and bounded virtual-machine loops/functions constrained by a sequential single-chain block timer.'
      },
      {
        range: '0.50–0.70',
        rule: 'Clean stateless UTXO base with restricted Layer-1 scripting that pushes high-frequency commerce onto custodial/off-chain layers, or high-value-density physical matter pushed into custodial paper claims.'
      },
      {
        range: '0.20–0.49',
        rule: 'Unprogrammable sequential UTXO ledgers, interactive bilateral liquidity channels encumbered by inbound capacity exhaustion and hot-key watchtower risk, unpruneable stealth-output or nullifier state bloat, off-chain indexer inscription overlays, low-value-to-weight physical bulk, or shared-account VMs layered over Proof-of-Work.'
      },
      {
        range: '0.00',
        rule: 'Mutable shared-account state trees subject to sequential write-lock contention, predatory MEV extraction, mandatory state-rent deposits, centralized off-chain batchers, or native Layer-1 freeze/clawback primitives.'
      }
    ]
  },
  {
    id: '06',
    name: 'Thermodynamic Velocity (M = 1.0)',
    brackets: [
      {
        range: '0.95–1.00',
        rule: 'Native Layer-1 >=10 BPS parallel Proof-of-Work BlockDAG incorporating 100% of honest concurrent global hash work with zero orphan waste (M = 1.0) at fiber-optic propagation limits. Zero-joule off-chain signature exchanges cannot qualify.'
      },
      {
        range: '0.50–0.85',
        rule: 'Native Layer-1 1–9 BPS parallel Proof-of-Work BlockDAG (M ≈ 1.0) with sub-second visibility and multi-parent work inclusion.'
      },
      {
        range: '0.35–0.45',
        rule: 'High-throughput or fast-cadence native sequential Proof-of-Work (M < 1.0): elastic multi-megabyte UTXO blocks (100+ L1 TPS) with compact relay and double-spend proofs, or 15–150 second block intervals.'
      },
      {
        range: '0.20–0.30',
        rule: 'Fast sequential Proof-of-Work encumbered by multi-block wallet spend locks or heavy zero-knowledge proof/scanning overhead, 600-second sequential Proof-of-Work capped under ~10 L1 TPS, or two-step commit/reveal overlays riding an M = 1.0 BlockDAG carrier.'
      },
      {
        range: '0.05–0.18',
        rule: 'Carrier-Subordinated Overlays (M_overlay < M_L1 < 1.0) & Physical Freight: Off-chain payment/state channels (0-Joule promissory signature hops encumbered by multi-hour/day timelocks and throttled Layer-1 exit blocks), Layer-1-sequenced rollups with secondary zero-joule attestation latency, or physical armored freight logistics (0.0 digital BPS). An overlay can never exceed its Layer-1 settlement carrier.'
      },
      {
        range: '0.00',
        rule: 'All standalone zero-joule consensus protocols and centralized sequencers (0 Joules of accepted Proof-of-Work yields M = 0).'
      }
    ]
  }
];

export const QUICK_TICKERS: string[] = [
  'KAS',
  'BTC',
  'LTC',
  'XAU',
  'XAG',
  'BCH',
  'XMR',
  'GEEK',
  'IGRA',
  'LN',
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
];

export const ALIAS_MAP: Record<string, string> = {
  KASPA: 'KAS',
  BITCOIN: 'BTC',
  LIGHTNING: 'LN',
  LIGHTNINGNETWORK: 'LN',
  BITCOINLIGHTNING: 'LN',
  BTCLN: 'LN',
  BOLT: 'LN',
  LND: 'LN',
  BITCOINCASH: 'BCH',
  BCASH: 'BCH',
  BCHN: 'BCH',
  GOLD: 'XAU',
  PHYSICALGOLD: 'XAU',
  GOLDMETAL: 'XAU',
  BULLION: 'XAU',
  AU: 'XAU',
  XAUUSD: 'XAU',
  SILVER: 'XAG',
  PHYSICALSILVER: 'XAG',
  SILVERMETAL: 'XAG',
  AG: 'XAG',
  XAGUSD: 'XAG',
  LITECOIN: 'LTC',
  GEEK: 'GEEK',
  GEEKPROTOCOL: 'GEEK',
  GEEKHQ: 'GEEK',
  PROOFOFLEARNING: 'GEEK',
  GEEKT: 'GEEK',
  IGRA: 'IGRA',
  IGRANETWORK: 'IGRA',
  IKAS: 'IGRA',
  ZCASH: 'ZEC',
  ZODL: 'ZEC',
  ALGORAND: 'ALGO',
  PINETWORK: 'PI',
  STELLAR: 'XLM',
  LUMEN: 'XLM',
  LUMENS: 'XLM',
  SUINETWORK: 'SUI',
  STACKS: 'STX',
  BLOCKSTACK: 'STX',
  SBTC: 'STX',
  ETHEREUM: 'ETH',
  SOLANA: 'SOL',
  RIPPLE: 'XRP',
  XRPL: 'XRP',
  NEARPROTOCOL: 'NEAR',
  BITTENSOR: 'TAO',
  MONERO: 'XMR',
  CARDANO: 'ADA',
  AVALANCHE: 'AVAX'
};

export const GRADE_RANK: Record<string, number> = {
  'A+': 1,
  A: 2,
  'A-': 3,
  'B+': 4,
  B: 5,
  'B-': 6,
  'C+': 7,
  C: 8,
  'C-': 9,
  'D+': 10,
  D: 11,
  'D-': 12,
  F: 13
};

export const DEFAULT_SHORT_NAMES: string[] = [
  'Sovereignty',
  'Cost Floor',
  'Immutability',
  'Availability',
  'State Topology',
  'Velocity'
];

export const DEFAULT_TITLES: string[] = [
  'Existential Sovereignty & Entity Decoupling',
  'Thermodynamic Cost Floor (E > 0)',
  'Historical Immutability & Arrow of Time',
  'Dynamic Availability (Wartime Partition)',
  'State Machine Topology',
  'Thermodynamic Velocity (M = 1.0)'
];

export const ORBIT_ANGLES_DEG: number[] = [-90, -30, 30, 90, 150, 210];

export const CORE_SCAN_STAGES: ScanStageSpec[] = [
  {
    id: '01',
    shortName: 'Sovereignty',
    title: 'Existential Sovereignty & Entity Decoupling',
    color: '#49EACB',
    softBg: 'rgba(73, 234, 203, 0.14)',
    glow: 'rgba(73, 234, 203, 0.26)',
    codeLines: [
      'scan_genesis_alloc(block_0);',
      'assert(premine_supply == 0);',
      'check_vc_unlock_cliffs();',
      'verify_foundation_keys(null);',
      'inspect_multisig_bridges();',
      'check_freeze_authority(0x0);',
      'verify_entity_decoupling();',
      'audit_coinbase_tax(0.00%); -'
    ]
  },
  {
    id: '02',
    shortName: 'Cost Floor',
    title: 'Thermodynamic Cost Floor (E > 0)',
    color: '#4ADE80',
    softBg: 'rgba(74, 222, 128, 0.14)',
    glow: 'rgba(74, 222, 128, 0.26)',
    codeLines: [
      'measure_consensus_joules();',
      'require(energy_floor > 0.0J);',
      'check_asic_silicon_work();',
      'reject_zero_joule_staking();',
      'audit_supply_emission_cap();',
      'check_preprint_mint_events();',
      'measure_hash_joules_per_tx();',
      'verify_cantillon_yield(0); -'
    ]
  },
  {
    id: '03',
    shortName: 'Immutability',
    title: 'Historical Immutability & Arrow of Time',
    color: '#84CC16',
    softBg: 'rgba(132, 204, 22, 0.14)',
    glow: 'rgba(132, 204, 22, 0.26)',
    codeLines: [
      'calc_landauer_limit(kB*T*ln2);',
      'sum_cumulative_pow_work();',
      'check_weak_subjectivity();',
      'scan_s3_snapshot_trust();',
      'audit_node_pruning_horizon();',
      'verify_popow_genesis_proof();',
      'scan_inflation_circuit_bugs();',
      'lock_physical_arrow_time(); -'
    ]
  },
  {
    id: '04',
    shortName: 'Availability',
    title: 'Dynamic Availability (Wartime Partition)',
    color: '#FACC15',
    softBg: 'rgba(250, 204, 21, 0.14)',
    glow: 'rgba(250, 204, 21, 0.26)',
    codeLines: [
      'sim_fiber_sever(t = 60min);',
      'split_hemispheres(0.60, 0.40);',
      'test_bft_quorum_halt(0.667);',
      'track_daa_retarget_window();',
      'sim_undersea_cable_resplice();',
      'measure_minority_reorg_loss();',
      'scan_mainnet_outage_logs();',
      'verify_subdag_blue_merge(); -'
    ]
  },
  {
    id: '05',
    shortName: 'State Topology',
    title: 'State Machine Topology',
    color: '#FB923C',
    softBg: 'rgba(251, 146, 60, 0.14)',
    glow: 'rgba(251, 146, 60, 0.26)',
    codeLines: [
      'inspect_state_machine_graph();',
      'test_parallel_utxo_lanes();',
      'detect_shared_account_locks();',
      'scan_mev_sandwich_exposure();',
      'check_mandatory_state_rent();',
      'scan_clawback_hooks(L1);',
      'verify_covenant_opcodes();',
      'audit_stateless_topology(); -'
    ]
  },
  {
    id: '06',
    shortName: 'Velocity',
    title: 'Thermodynamic Velocity (M = 1.0)',
    color: '#49EACB',
    softBg: 'rgba(73, 234, 203, 0.14)',
    glow: 'rgba(73, 234, 203, 0.26)',
    codeLines: [
      'measure_block_cadence_bps();',
      'calc_orphan_waste_ratio();',
      'strip_consensus_vote_bloat();',
      'check_spend_lock_latency();',
      'compare_fiber_photon_speed();',
      'eval_parallel_work_weave();',
      'compute_velocity_index(M);',
      'finalize_grade_verdict(M); -'
    ]
  }
];

export function stripTrailingDash(val: unknown): string {
  return String(val || '')
    .replace(/\s*-\s*$/, '')
    .trim();
}

export function formatScore(val: unknown): string {
  const num = Number(val);
  if (!Number.isFinite(num)) return '0.0';
  const rounded = Math.round(num * 100) / 100;
  if (Math.abs(rounded * 10 - Math.round(rounded * 10)) > 1e-6) {
    return rounded.toFixed(2);
  }
  return rounded.toFixed(1);
}

export function getGradeAccent(grade: string): GradeAccent {
  const g = String(grade || 'F').toUpperCase();
  if (g.startsWith('A')) {
    return {
      primary: '#49EACB',
      secondary: '#34D399',
      softBg: 'rgba(73, 234, 203, 0.12)',
      secondarySoftBg: 'rgba(52, 211, 153, 0.12)',
      border: 'rgba(73, 234, 203, 0.38)',
      secondaryBorder: 'rgba(52, 211, 153, 0.36)',
      glow: 'rgba(73, 234, 203, 0.24)',
      secondaryGlow: 'rgba(52, 211, 153, 0.20)',
      gradientCss: 'linear-gradient(135deg, #49EACB 0%, #34D399 100%)',
      textOnAccent: '#041713'
    };
  }
  if (g === 'B+') {
    return {
      primary: '#4ADE80',
      secondary: '#84CC16',
      softBg: 'rgba(74, 222, 128, 0.12)',
      secondarySoftBg: 'rgba(132, 204, 22, 0.12)',
      border: 'rgba(74, 222, 128, 0.38)',
      secondaryBorder: 'rgba(132, 204, 22, 0.36)',
      glow: 'rgba(74, 222, 128, 0.22)',
      secondaryGlow: 'rgba(132, 204, 22, 0.18)',
      gradientCss: 'linear-gradient(135deg, #4ADE80 0%, #84CC16 100%)',
      textOnAccent: '#051B0D'
    };
  }
  if (g === 'B-') {
    return {
      primary: '#84CC16',
      secondary: '#EAB308',
      softBg: 'rgba(132, 204, 22, 0.12)',
      secondarySoftBg: 'rgba(234, 179, 8, 0.12)',
      border: 'rgba(132, 204, 22, 0.38)',
      secondaryBorder: 'rgba(234, 179, 8, 0.36)',
      glow: 'rgba(132, 204, 22, 0.22)',
      secondaryGlow: 'rgba(234, 179, 8, 0.18)',
      gradientCss: 'linear-gradient(135deg, #84CC16 0%, #EAB308 100%)',
      textOnAccent: '#111C03'
    };
  }
  if (g.startsWith('B')) {
    return {
      primary: '#22C55E',
      secondary: '#84CC16',
      softBg: 'rgba(34, 197, 94, 0.12)',
      secondarySoftBg: 'rgba(132, 204, 22, 0.12)',
      border: 'rgba(34, 197, 94, 0.38)',
      secondaryBorder: 'rgba(132, 204, 22, 0.36)',
      glow: 'rgba(34, 197, 94, 0.22)',
      secondaryGlow: 'rgba(132, 204, 22, 0.18)',
      gradientCss: 'linear-gradient(135deg, #22C55E 0%, #84CC16 100%)',
      textOnAccent: '#04180B'
    };
  }
  if (g === 'C+') {
    return {
      primary: '#FACC15',
      secondary: '#F59E0B',
      softBg: 'rgba(250, 204, 21, 0.12)',
      secondarySoftBg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(250, 204, 21, 0.38)',
      secondaryBorder: 'rgba(245, 158, 11, 0.36)',
      glow: 'rgba(250, 204, 21, 0.22)',
      secondaryGlow: 'rgba(245, 158, 11, 0.18)',
      gradientCss: 'linear-gradient(135deg, #FACC15 0%, #F59E0B 100%)',
      textOnAccent: '#1F1902'
    };
  }
  if (g === 'C-') {
    return {
      primary: '#F59E0B',
      secondary: '#FB923C',
      softBg: 'rgba(245, 158, 11, 0.12)',
      secondarySoftBg: 'rgba(251, 146, 60, 0.12)',
      border: 'rgba(245, 158, 11, 0.38)',
      secondaryBorder: 'rgba(251, 146, 60, 0.36)',
      glow: 'rgba(245, 158, 11, 0.22)',
      secondaryGlow: 'rgba(251, 146, 60, 0.18)',
      gradientCss: 'linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)',
      textOnAccent: '#1F1202'
    };
  }
  if (g.startsWith('C')) {
    return {
      primary: '#EAB308',
      secondary: '#F59E0B',
      softBg: 'rgba(234, 179, 8, 0.12)',
      secondarySoftBg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(234, 179, 8, 0.38)',
      secondaryBorder: 'rgba(245, 158, 11, 0.36)',
      glow: 'rgba(234, 179, 8, 0.22)',
      secondaryGlow: 'rgba(245, 158, 11, 0.18)',
      gradientCss: 'linear-gradient(135deg, #EAB308 0%, #F59E0B 100%)',
      textOnAccent: '#1F1602'
    };
  }
  if (g === 'D-') {
    return {
      primary: '#F97316',
      secondary: '#EF4444',
      softBg: 'rgba(249, 115, 22, 0.12)',
      secondarySoftBg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(249, 115, 22, 0.38)',
      secondaryBorder: 'rgba(239, 68, 68, 0.36)',
      glow: 'rgba(249, 115, 22, 0.22)',
      secondaryGlow: 'rgba(239, 68, 68, 0.18)',
      gradientCss: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
      textOnAccent: '#230B02'
    };
  }
  if (g.startsWith('D')) {
    return {
      primary: '#FB923C',
      secondary: '#F97316',
      softBg: 'rgba(251, 146, 60, 0.12)',
      secondarySoftBg: 'rgba(249, 115, 22, 0.12)',
      border: 'rgba(251, 146, 60, 0.38)',
      secondaryBorder: 'rgba(249, 115, 22, 0.36)',
      glow: 'rgba(251, 146, 60, 0.22)',
      secondaryGlow: 'rgba(249, 115, 22, 0.18)',
      gradientCss: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
      textOnAccent: '#230E03'
    };
  }
  return {
    primary: '#EF4444',
    secondary: '#F97316',
    softBg: 'rgba(239, 68, 68, 0.12)',
    secondarySoftBg: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(239, 68, 68, 0.38)',
    secondaryBorder: 'rgba(249, 115, 22, 0.36)',
    glow: 'rgba(239, 68, 68, 0.22)',
    secondaryGlow: 'rgba(249, 115, 22, 0.18)',
    gradientCss: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)',
    textOnAccent: '#FFFFFF'
  };
}

export function getScoreStyle(score: number): ScoreStyle {
  const s = Number(score) || 0;
  if (s >= 0.96) {
    return {
      color: '#49EACB',
      bg: 'rgba(73, 234, 203, 0.12)',
      border: 'rgba(73, 234, 203, 0.36)',
      status: 'PASS'
    };
  }
  if (s >= 0.7) {
    return {
      color: '#4ADE80',
      bg: 'rgba(74, 222, 128, 0.12)',
      border: 'rgba(74, 222, 128, 0.36)',
      status: 'PASS'
    };
  }
  if (s >= 0.4) {
    return {
      color: '#FACC15',
      bg: 'rgba(250, 204, 21, 0.12)',
      border: 'rgba(250, 204, 21, 0.36)',
      status: 'PARTIAL'
    };
  }
  if (s > 0) {
    return {
      color: '#F97316',
      bg: 'rgba(249, 115, 22, 0.12)',
      border: 'rgba(249, 115, 22, 0.36)',
      status: 'WEAK'
    };
  }
  return {
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.36)',
    status: 'FAIL'
  };
}

export function getHarmonizedScoreStyle(score: number, _activeAccent?: GradeAccent | null): ScoreStyle {
  return getScoreStyle(score);
}

export function deriveGradeFromTotal(
  totalScore: number,
  costFloorScore = 0,
  sovereigntyScore = 1
): string {
  if (costFloorScore <= 0 || totalScore <= 1.0) return 'F';

  // Energy-Arbitrage & Sovereignty-Compromise Penalty:
  // When Existential Sovereignty fails (0.00) via premine, pre-allocation, or protocol dev tax,
  // zero-work insiders arbitrage miners' expended electricity — capping Terminal Grade at D+ max.
  if (Number(sovereigntyScore) <= 0) {
    if (totalScore >= 2.3) return 'D+';
    if (totalScore >= 1.75) return 'D';
    return 'D-';
  }

  if (totalScore >= 5.75) return 'A+';
  if (totalScore >= 5.3) return 'A';
  if (totalScore >= 4.9) return 'A-';
  if (totalScore >= 4.4) return 'B+';
  if (totalScore >= 4.1) return 'B';
  if (totalScore >= 3.92) return 'B-';
  if (totalScore >= 3.5) return 'C+';
  if (totalScore >= 3.0) return 'C';
  if (totalScore >= 2.3) return 'C-';
  if (totalScore >= 1.9) return 'D+';
  if (totalScore >= 1.5) return 'D';
  return 'D-';
}

export function enforceEnergyArbitrageLawOnAudit(auditObj: AuditData): AuditData {
  if (!auditObj || !Array.isArray(auditObj.invariants) || auditObj.invariants.length < 6) {
    return auditObj;
  }
  const invs = auditObj.invariants.map((inv) => ({ ...inv }));
  const sovScore = Number(invs[0]?.score ?? 1);
  const costScore = Number(invs[1]?.score ?? 0);

  if (costScore <= 0) {
    return {
      ...auditObj,
      invariants: invs.map((i) => ({ ...i, score: 0 })),
      totalScore: 0,
      grade: 'F'
    };
  }

  if (sovScore <= 0) {
    const archAndText = `${auditObj.name || ''} ${auditObj.architecture || ''} ${
      invs[0]?.telemetry || ''
    } ${invs[0]?.quickSummary || ''}`.toUpperCase();
    const mentionsPremineOrPrealloc =
      /\b(PREMINE|PRE-MINE|PREMINT|PRE-MINT|PREALLOCAT|PRE-ALLOCAT|ICO|VC|VENTURE|FOUNDATION RESERVE)\b/.test(
        archAndText
      );
    const isOverlay =
      /\b(LIGHTNING|STATE CHANNEL|PAYMENT CHANNEL|HTLC|PTLC|ROLLUP|KRC-20|BRC-20|RUNES|SIDECHAIN|LAYER-2|LAYER 2|\bL2\b|\bLN\b)\b/.test(
        archAndText
      );
    const maxAllowedCostFloor = mentionsPremineOrPrealloc ? (isOverlay ? 0.15 : 0.3) : 0.35;
    if (costScore > maxAllowedCostFloor) {
      invs[1] = {
        ...invs[1],
        score: maxAllowedCostFloor
      };
    }
  }

  const exactTotal = Number(
    invs.reduce((acc, item) => acc + (Number(item.score) || 0), 0).toFixed(2)
  );
  const recalibratedGrade = deriveGradeFromTotal(
    exactTotal,
    Number(invs[1]?.score) || 0,
    sovScore
  );

  return {
    ...auditObj,
    invariants: invs,
    totalScore: exactTotal,
    grade: recalibratedGrade
  };
}

export interface SinglePhysicsFlags {
  hasGenesisPremineOrVcOrIco?: boolean;
  hasProtocolDevTaxOrKillSwitch?: boolean;
  carrierLayerOneVelocityCap?: number;
}

export function clampSingleInvariantByPhysics(
  targetAudit: AuditData,
  invIdx: number,
  rawProposedScore: number,
  flags: SinglePhysicsFlags = {}
): number {
  let proposed = Math.max(0, Math.min(1, Number(rawProposedScore) || 0));
  const currentCostFloor = Number(targetAudit?.invariants?.[1]?.score) || 0;
  const currentSovereignty = Number(targetAudit?.invariants?.[0]?.score ?? 1);

  if (invIdx !== 1 && currentCostFloor <= 0) {
    return 0;
  }
  if (invIdx === 1 && proposed <= 0) {
    return 0;
  }

  const fam =
    invIdx === 1 && currentCostFloor <= 0 && proposed > 0
      ? 'LINEAR_POW'
      : targetAudit?.consensusFamily || 'LINEAR_POW';

  const archAndNameText = `${targetAudit?.name || ''} ${targetAudit?.architecture || ''} ${
    targetAudit?.ticker || ''
  }`.toUpperCase();
  const isOverlay =
    /\b(LIGHTNING|STATE CHANNEL|PAYMENT CHANNEL|HTLC|PTLC|ROLLUP|KRC-20|BRC-20|RUNES|SIDECHAIN|LAYER-2|LAYER 2|\bL2\b|\bLN\b)\b/.test(
      archAndNameText
    );
  const hasPremineOrPrealloc = flags.hasGenesisPremineOrVcOrIco === true;
  const hasDevTaxOrKillSwitch = flags.hasProtocolDevTaxOrKillSwitch === true;
  const isSovereigntyCompromised =
    currentSovereignty <= 0 || hasPremineOrPrealloc || hasDevTaxOrKillSwitch;

  if (invIdx === 0) {
    if (hasPremineOrPrealloc || hasDevTaxOrKillSwitch) {
      return 0;
    }
    if (isOverlay) proposed = Math.min(0.75, proposed);
  } else if (invIdx === 1) {
    if (hasPremineOrPrealloc) {
      proposed = Math.min(isOverlay ? 0.15 : 0.3, proposed);
    } else if (isSovereigntyCompromised) {
      proposed = Math.min(isOverlay ? 0.2 : 0.35, proposed);
    } else if (isOverlay) {
      proposed = Math.min(0.35, proposed);
    }
    if (fam === 'PHYSICAL_COMMODITY') proposed = Math.min(0.95, proposed);
  } else if (invIdx === 2) {
    if (fam === 'BLOCKDAG_POW' && isOverlay) proposed = Math.min(0.85, proposed);
    if (fam === 'LINEAR_POW' && isOverlay) proposed = Math.min(0.65, proposed);
    if (fam === 'PHYSICAL_COMMODITY') proposed = Math.min(0.92, proposed);
  } else if (invIdx === 3) {
    if (fam === 'BLOCKDAG_POW' && isOverlay) proposed = Math.min(0.9, proposed);
    if (fam === 'LINEAR_POW' && isOverlay) proposed = Math.min(0.5, proposed);
    if (fam === 'LINEAR_POW' && !isOverlay) proposed = Math.min(0.75, proposed);
    if (fam === 'PHYSICAL_COMMODITY') proposed = Math.max(0.45, Math.min(0.7, proposed));
  } else if (invIdx === 4) {
    if (isOverlay) proposed = Math.min(0.49, proposed);
    if (fam === 'LINEAR_POW' && isOverlay) proposed = Math.min(0.45, proposed);
    if (fam === 'LINEAR_POW' && !isOverlay) proposed = Math.min(0.9, proposed);
    if (fam === 'PHYSICAL_COMMODITY') proposed = Math.min(0.65, proposed);
  } else if (invIdx === 5) {
    if (fam === 'BLOCKDAG_POW' && isOverlay) {
      proposed = Math.max(0.1, Math.min(0.2, proposed));
    } else if (fam === 'LINEAR_POW' && isOverlay) {
      const rawCap = Number(flags.carrierLayerOneVelocityCap);
      const carrierCap = Number.isFinite(rawCap) && rawCap > 0 ? Math.min(0.45, rawCap) : 0.2;
      const maxOverlayVel = Math.min(
        0.18,
        Math.max(0.05, Number((carrierCap - 0.05).toFixed(2)))
      );
      proposed = Math.max(0.05, Math.min(maxOverlayVel, proposed));
    } else if (fam === 'LINEAR_POW' && !isOverlay) {
      proposed = Math.max(0.15, Math.min(0.45, proposed));
    } else if (fam === 'PHYSICAL_COMMODITY') {
      proposed = Math.max(0.03, Math.min(0.1, proposed));
    }
  }

  return Number(proposed.toFixed(2));
}

export function isResponseTextTruncated(text: unknown): boolean {
  const trimmed = String(text || '').trim();
  if (!trimmed || trimmed.length < 24) return true;
  return !/[.!?…][)"'\]”’*`]*$/.test(trimmed);
}

export function safeParseAuditJson<T = Record<string, unknown>>(
  rawText: string,
  options: { strictComplete?: boolean } = {}
): T {
  const { strictComplete = false } = options;
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty AI audit payload returned.');
  }
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate) as T;
      } catch {
        // Continue to bracket auto-repair if allowed
      }
    }

    if (strictComplete) {
      throw new Error('Truncated JSON payload returned by audit engine.');
    }

    if (firstBrace !== -1) {
      let repaired = cleaned.slice(firstBrace);
      const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
      if (quoteCount % 2 !== 0) repaired += '"';
      const stack: string[] = [];
      let inStr = false;
      for (let i = 0; i < repaired.length; i++) {
        const ch = repaired[i];
        const prev = i > 0 ? repaired[i - 1] : '';
        if (ch === '"' && prev !== '\\') inStr = !inStr;
        if (!inStr) {
          if (ch === '{') stack.push('}');
          else if (ch === '[') stack.push(']');
          else if ((ch === '}' || ch === ']') && stack.length > 0) stack.pop();
        }
      }
      while (stack.length > 0) {
        repaired += stack.pop();
      }
      return JSON.parse(repaired) as T;
    }

    throw new Error('Malformed JSON returned by audit engine.');
  }
}

export function sortAuditTickersByGrade(auditsMap: Record<string, AuditData>): string[] {
  return Object.keys(auditsMap).sort((keyA, keyB) => {
    const a = auditsMap[keyA];
    const b = auditsMap[keyB];
    const rankA = GRADE_RANK[String(a?.grade || 'F').toUpperCase()] ?? 99;
    const rankB = GRADE_RANK[String(b?.grade || 'F').toUpperCase()] ?? 99;
    if (rankA !== rankB) return rankA - rankB;

    const scoreA = Number(a?.totalScore) || 0;
    const scoreB = Number(b?.totalScore) || 0;
    if (Math.abs(scoreB - scoreA) > 0.001) return scoreB - scoreA;

    const quickIdxA = QUICK_TICKERS.indexOf(keyA);
    const quickIdxB = QUICK_TICKERS.indexOf(keyB);
    if (quickIdxA !== -1 && quickIdxB !== -1) return quickIdxA - quickIdxB;
    if (quickIdxA !== -1) return -1;
    if (quickIdxB !== -1) return 1;
    return keyA.localeCompare(keyB);
  });
}

export function inspectStreamedAuditProgress(streamText: string): StreamProgressState {
  const completedColors: Record<number, string> = {};
  const completedScores: Record<number, number> = {};
  let completedCount = 0;

  const scoreMatches = [...streamText.matchAll(/"score"\s*:\s*(-?\d+(?:\.\d+)?)/g)].map((m) =>
    Math.max(0, Math.min(1, Number(m[1]) || 0))
  );

  for (let i = 0; i < 6; i++) {
    const idRegex = new RegExp(`"id"\\s*:\\s*"0?${i + 1}"`);
    const idMatch = idRegex.exec(streamText);
    if (!idMatch) break;

    const sliceFromId = streamText.slice(idMatch.index);
    const nextIdRegex = new RegExp(`"id"\\s*:\\s*"0?${i + 2}"`);
    const nextMatch = i < 5 ? nextIdRegex.exec(sliceFromId.slice(10)) : null;
    const blockSlice = nextMatch ? sliceFromId.slice(0, nextMatch.index + 10) : sliceFromId;

    const hasDashSeparator =
      /-\s*"\s*,\s*"receipts"/.test(blockSlice) ||
      /"\s*-\s*"\s*\]/.test(blockSlice) ||
      /"receipts"\s*:\s*\[[^\]]*\]/.test(blockSlice) ||
      Boolean(nextMatch);

    const localScoreMatch = /"score"\s*:\s*(-?\d+(?:\.\d+)?)/.exec(blockSlice);
    const resolvedScore = localScoreMatch
      ? Math.max(0, Math.min(1, Number(localScoreMatch[1]) || 0))
      : scoreMatches[i];

    if (hasDashSeparator && resolvedScore !== undefined) {
      completedScores[i] = resolvedScore;
      completedColors[i] = getScoreStyle(resolvedScore).color;
      completedCount = i + 1;
    } else {
      break;
    }
  }

  return {
    completedCount,
    completedColors,
    completedScores
  };
}

export interface RawGeminiAuditPayload {
  ticker?: string;
  name?: string;
  consensusFamily?: string;
  isUpperLayerOverlayOrChannel?: boolean;
  carrierLayerOneVelocityCap?: number;
  hasGenesisPremineOrVcOrIco?: boolean;
  hasProtocolDevTaxOrKillSwitch?: boolean;
  architecture?: string;
  grade?: string;
  totalScore?: number;
  certainty?: string;
  conclusion?: string;
  invariants?: Array<{
    id?: string;
    shortName?: string;
    title?: string;
    telemetry?: string;
    score?: number;
    quickSummary?: string;
    paragraph?: string;
    geniusParagraph?: string;
    receipts?: string[];
  }>;
}

export function isValidCompleteAuditPayload(parsed: RawGeminiAuditPayload | null | undefined): boolean {
  return Boolean(
    parsed &&
      Array.isArray(parsed.invariants) &&
      parsed.invariants.length === 6 &&
      parsed.invariants.every(
        (inv) =>
          inv &&
          Number.isFinite(Number(inv.score)) &&
          String(inv.paragraph || '').trim().length >= 80 &&
          String(inv.geniusParagraph || '').trim().length >= 320
      )
  );
}

export function normalizeAuditPayload(
  parsed: RawGeminiAuditPayload,
  rawQuery: string,
  normalizedQuery: string,
  existingBaseline: AuditData | null,
  sources: GroundingSource[] = [],
  previousScore: number | null = null,
  hasPreloadedBase = false
): AuditData {
  const invariantsInput = Array.isArray(parsed.invariants) ? parsed.invariants : [];
  const rawCostFloor = Math.max(0, Math.min(1, Number(invariantsInput[1]?.score) || 0));
  const forceZeroJoule =
    rawCostFloor <= 0 ||
    (parsed.consensusFamily === 'ZERO_JOULE_BFT' && rawCostFloor < 0.15);

  const cleanInvariants: InvariantData[] = [0, 1, 2, 3, 4, 5].map((idx) => {
    const inv = invariantsInput[idx] || {};
    const baselineInv = existingBaseline?.invariants?.[idx];
    const clampedScore = forceZeroJoule
      ? 0
      : Math.max(0, Math.min(1, Number(inv.score) || 0));
    const filteredReceipts = Array.isArray(inv.receipts)
      ? inv.receipts.map((r) => stripTrailingDash(r)).filter((r) => r && r !== '-')
      : [];
    const rawGenius = stripTrailingDash(inv.geniusParagraph);
    const resolvedGenius =
      rawGenius.length >= 260
        ? rawGenius
        : baselineInv?.geniusParagraph && baselineInv.geniusParagraph.length > rawGenius.length
        ? baselineInv.geniusParagraph
        : rawGenius || stripTrailingDash(inv.paragraph);

    return {
      id: `0${idx + 1}`,
      shortName: stripTrailingDash(inv.shortName) || DEFAULT_SHORT_NAMES[idx],
      title: stripTrailingDash(inv.title) || DEFAULT_TITLES[idx],
      telemetry: stripTrailingDash(inv.telemetry) || 'Audited Protocol Telemetry',
      score: Number(clampedScore.toFixed(2)),
      quickSummary:
        stripTrailingDash(inv.quickSummary) ||
        'Evaluated against strict thermodynamic Proof-of-Work invariants.',
      paragraph:
        stripTrailingDash(inv.paragraph) ||
        'Protocol architecture evaluated against irreversible thermodynamic work and entity decoupling.',
      geniusParagraph:
        resolvedGenius ||
        'Protocol architecture evaluated against irreversible thermodynamic work and entity decoupling.',
      receipts:
        filteredReceipts.length > 0
          ? filteredReceipts.slice(0, 4)
          : baselineInv?.receipts || ['Thermodynamic Invariant Check']
    };
  });

  const validFamilies: ConsensusFamily[] = [
    'BLOCKDAG_POW',
    'LINEAR_POW',
    'PHYSICAL_COMMODITY',
    'ZERO_JOULE_BFT'
  ];
  const archAndNameText = `${parsed.name || ''} ${parsed.architecture || ''} ${rawQuery}`.toUpperCase();
  const isOverlay =
    parsed.isUpperLayerOverlayOrChannel === true ||
    /\b(LIGHTNING|STATE CHANNEL|PAYMENT CHANNEL|HTLC|PTLC|ROLLUP|KRC-20|BRC-20|RUNES|SIDECHAIN|LAYER-2|LAYER 2|\bL2\b)\b/.test(
      archAndNameText
    );
  const isSequentialCarrierOverlay =
    isOverlay &&
    !/\b(KASPA|KRC-20|KCC-20|GHOSTDAG|BLOCKDAG|IGRA|VIADUCT)\b/.test(archAndNameText);

  const detectedFamily: ConsensusFamily = forceZeroJoule
    ? 'ZERO_JOULE_BFT'
    : isSequentialCarrierOverlay
    ? 'LINEAR_POW'
    : parsed.consensusFamily &&
      parsed.consensusFamily !== 'ZERO_JOULE_BFT' &&
      validFamilies.includes(parsed.consensusFamily as ConsensusFamily)
    ? (parsed.consensusFamily as ConsensusFamily)
    : existingBaseline?.consensusFamily && existingBaseline.consensusFamily !== 'ZERO_JOULE_BFT'
    ? existingBaseline.consensusFamily
    : !isOverlay && cleanInvariants[5].score >= 0.85
    ? 'BLOCKDAG_POW'
    : 'LINEAR_POW';

  if (detectedFamily === 'ZERO_JOULE_BFT' || forceZeroJoule) {
    cleanInvariants.forEach((inv) => {
      inv.score = 0;
    });
  } else {
    const hasPremineOrPrealloc = parsed.hasGenesisPremineOrVcOrIco === true;
    const hasDevTaxOrKillSwitch = parsed.hasProtocolDevTaxOrKillSwitch === true;
    if (hasPremineOrPrealloc || hasDevTaxOrKillSwitch) {
      cleanInvariants[0].score = 0;
    } else if (isOverlay) {
      cleanInvariants[0].score = Number(Math.min(0.75, cleanInvariants[0].score).toFixed(2));
    }

    if (cleanInvariants[0].score <= 0) {
      const arbitrageCap = hasPremineOrPrealloc ? (isOverlay ? 0.15 : 0.3) : 0.35;
      cleanInvariants[1].score = Number(
        Math.min(arbitrageCap, cleanInvariants[1].score).toFixed(2)
      );
    } else if (isOverlay) {
      cleanInvariants[1].score = Number(Math.min(0.35, cleanInvariants[1].score).toFixed(2));
    }

    if (isOverlay) {
      cleanInvariants[4].score = Number(Math.min(0.49, cleanInvariants[4].score).toFixed(2));
    }

    if (detectedFamily === 'BLOCKDAG_POW' && isOverlay) {
      cleanInvariants[2].score = Number(Math.min(0.85, cleanInvariants[2].score).toFixed(2));
      cleanInvariants[3].score = Number(Math.min(0.9, cleanInvariants[3].score).toFixed(2));
      cleanInvariants[5].score = Number(
        Math.max(0.1, Math.min(0.2, cleanInvariants[5].score)).toFixed(2)
      );
    } else if (detectedFamily === 'LINEAR_POW') {
      if (isOverlay) {
        const rawCarrierCap = Number(parsed.carrierLayerOneVelocityCap);
        const effectiveCarrierCap =
          Number.isFinite(rawCarrierCap) && rawCarrierCap > 0
            ? Math.min(0.45, rawCarrierCap)
            : 0.2;
        const maxOverlayVel = Math.min(
          0.18,
          Math.max(0.05, Number((effectiveCarrierCap - 0.05).toFixed(2)))
        );
        cleanInvariants[2].score = Number(Math.min(0.65, cleanInvariants[2].score).toFixed(2));
        cleanInvariants[3].score = Number(Math.min(0.5, cleanInvariants[3].score).toFixed(2));
        cleanInvariants[4].score = Number(Math.min(0.45, cleanInvariants[4].score).toFixed(2));
        cleanInvariants[5].score = Number(
          Math.max(0.05, Math.min(maxOverlayVel, cleanInvariants[5].score)).toFixed(2)
        );
      } else {
        cleanInvariants[3].score = Number(Math.min(0.75, cleanInvariants[3].score).toFixed(2));
        cleanInvariants[4].score = Number(Math.min(0.9, cleanInvariants[4].score).toFixed(2));
        cleanInvariants[5].score = Number(
          Math.max(0.15, Math.min(0.45, cleanInvariants[5].score)).toFixed(2)
        );
      }
    } else if (detectedFamily === 'PHYSICAL_COMMODITY') {
      cleanInvariants[1].score = Number(Math.min(0.95, cleanInvariants[1].score).toFixed(2));
      cleanInvariants[2].score = Number(Math.min(0.92, cleanInvariants[2].score).toFixed(2));
      cleanInvariants[3].score = Number(
        Math.max(0.45, Math.min(0.7, cleanInvariants[3].score)).toFixed(2)
      );
      cleanInvariants[4].score = Number(Math.min(0.65, cleanInvariants[4].score).toFixed(2));
      cleanInvariants[5].score = Number(
        Math.max(0.03, Math.min(0.1, cleanInvariants[5].score)).toFixed(2)
      );
    }
  }

  const exactSum = Number(
    cleanInvariants.reduce((acc, item) => acc + item.score, 0).toFixed(2)
  );
  const derivedGrade = deriveGradeFromTotal(
    exactSum,
    cleanInvariants[1].score,
    cleanInvariants[0].score
  );

  const cleanTicker = existingBaseline
    ? existingBaseline.ticker
    : String(parsed.ticker || rawQuery)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 8) || 'ASSET';

  const resolvedName =
    stripTrailingDash(parsed.name) || existingBaseline?.name || cleanTicker;
  const resolvedArchitecture =
    stripTrailingDash(parsed.architecture) ||
    existingBaseline?.architecture ||
    'Audited Consensus Architecture';
  const resolvedCertainty = String(parsed.certainty || 'HIGH CERTAINTY').toUpperCase();

  const rawConclusion = stripTrailingDash(parsed.conclusion);
  const resolvedConclusion =
    rawConclusion.length >= 80
      ? rawConclusion
      : `Evaluating ${resolvedName} (${cleanTicker}) through the GRADE evidence certainty framework yields a ${resolvedCertainty} rating across all six thermodynamic invariants (${cleanInvariants
          .map((inv) => `${inv.id}: ${formatScore(inv.score)}`)
          .join(', ')}), resulting in a total score of ${formatScore(
          exactSum
        )} out of 6.00 and a terminal compliance grade of ${derivedGrade}.`;

  const refreshedAtLabel = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  const scoreDelta =
    previousScore !== null && Number.isFinite(previousScore)
      ? Number((exactSum - previousScore).toFixed(2))
      : null;

  const allReceipts = cleanInvariants
    .flatMap((i) => i.receipts || [])
    .filter(Boolean)
    .join(', ');

  const refreshedGeniusParagraphs = [
    `Evaluating ${resolvedName} (${cleanTicker}) against the six physical invariants of a sovereign ledger exposes the structural reality of its ${resolvedArchitecture}. At the foundational layer of Existential Sovereignty and Entity Decoupling (${formatScore(
      cleanInvariants[0].score
    )}/1.0), ${cleanInvariants[0].geniusParagraph} Empirical telemetry confirms: ${(
      cleanInvariants[0].receipts || []
    ).join(' • ')}.`,
    `At the second physical invariant—the Thermodynamic Cost Floor (E > 0, scored ${formatScore(
      cleanInvariants[1].score
    )}/1.0)—${cleanInvariants[1].geniusParagraph} Every unit of monetary issuance must be weighed against the First Law of Thermodynamics: ${(
      cleanInvariants[1].receipts || []
    ).join(' • ')}.`,
    `Examining Historical Immutability and the Physical Arrow of Time (${formatScore(
      cleanInvariants[2].score
    )}/1.0) against the Second Law of Thermodynamics and Landauer’s Principle (ΔQ ≥ kB·T·ln2): ${cleanInvariants[2].geniusParagraph} Key immutability telemetry: ${(
      cleanInvariants[2].receipts || []
    ).join(' • ')}.`,
    `Under the stress of a wartime network partition and subsequent undersea fiber-optic cable resplice (Dynamic Availability, scored ${formatScore(
      cleanInvariants[3].score
    )}/1.0): ${cleanInvariants[3].geniusParagraph} Partition and resplice records confirm: ${(
      cleanInvariants[3].receipts || []
    ).join(' • ')}.`,
    `Examining ${resolvedName}’s State Machine Topology (${formatScore(
      cleanInvariants[4].score
    )}/1.0) and Thermodynamic Velocity (${formatScore(
      cleanInvariants[5].score
    )}/1.0, M = 1.0 benchmark): ${cleanInvariants[4].geniusParagraph} ${
      cleanInvariants[5].geniusParagraph
    } In contrast, Kaspa’s stateless, contention-free Proof-of-Work BlockDAG settles parallel UTXO state transitions natively on Layer 1 at 10+ blocks per second without validator blacklists, partition halts, or orphan work destruction (M = 1.0).`,
    `Evaluating these findings through the GRADE evidence certainty framework yields a ${resolvedCertainty} rating, as every architectural metric—including ${allReceipts}—is empirically verifiable in the protocol codebase, genesis configuration files, and official network records. ${resolvedConclusion}`
  ];

  return {
    ticker: cleanTicker,
    name: resolvedName,
    consensusFamily: detectedFamily,
    architecture: resolvedArchitecture,
    grade: derivedGrade,
    totalScore: exactSum,
    certainty: resolvedCertainty,
    conclusion: resolvedConclusion,
    invariants: cleanInvariants,
    geniusParagraphs: refreshedGeniusParagraphs,
    lastFreshAuditAt: refreshedAtLabel,
    scoreDelta,
    freshSources: sources,
    isCustom: !hasPreloadedBase,
    isArchived: true,
    archivedAtMs: Date.now(),
    archiveRevision: (Number(existingBaseline?.archiveRevision) || 0) + 1,
    queryAliases: Array.from(
      new Set([cleanTicker, normalizedQuery, resolvedName.toUpperCase().replace(/[^A-Z0-9]/g, '')])
    ).filter(Boolean)
  };
}
