// ============================================================================
// The Truth — Thermodynamic Audit
// Sovereign Thermodynamic Verification Engine
// ============================================================================
import React, { Component, useState, useRef, useEffect, useCallback, memo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  Search,
  Sparkles,
  Copy,
  Check,
  X,
  Pin,
  Layers,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Flame,
  Clock,
  Globe,
  Cpu,
  Activity,
  Wifi,
  Scissors,
  GitMerge,
  ChevronDown,
  Columns,
  Play,
  Pause,
  BookOpen,
  ExternalLink,
  Scale,
  ZoomIn,
  Send,
  Database,
  Lock,
  Unlock,
  Download,
  Upload,
  TrendingUp,
  DollarSign
} from 'lucide-react';

const ARCHIVE_APP_ID =
  typeof __app_id !== 'undefined' && __app_id
    ? String(__app_id)
    : 'the-truth-thermodynamic-audit';

let firebaseAppInstance = null;
let firestoreDb = null;
let firebaseAuth = null;

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    const parsedFirebaseConfig =
      typeof __firebase_config === 'string'
        ? JSON.parse(__firebase_config)
        : __firebase_config;
    firebaseAppInstance = getApps().length ? getApp() : initializeApp(parsedFirebaseConfig);
    firestoreDb = getFirestore(firebaseAppInstance);
    firebaseAuth = getAuth(firebaseAppInstance);
  }
} catch (err) {
  console.error('Shared archive initialization skipped:', err);
}

function sanitizeForArchive(val) {
  if (val === undefined) return null;
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    return val
      .filter((item) => item !== undefined)
      .map((item) => (Array.isArray(item) ? JSON.stringify(item) : sanitizeForArchive(item)));
  }
  const cleaned = {};
  Object.entries(val).forEach(([k, v]) => {
    if (v !== undefined && typeof v !== 'function') {
      cleaned[k] = sanitizeForArchive(v);
    }
  });
  return cleaned;
}

// ============================================================================
// DETERMINISTIC 6-INVARIANT GRADING RUBRIC & CALIBRATION ANCHORS
// ============================================================================
const GRADING_RUBRIC_SPEC = [
  {
    id: '01',
    name: 'Existential Sovereignty & Entity Decoupling',
    brackets: [
      { range: '1.00', rule: 'Immaculate empty-ledger Proof-of-Work genesis or naturally occurring cosmic element: 0 premine, 0 ICO, 0 venture allocations, 0 foundation reserve, 0% protocol tax, 0 administrative freeze keys, and 0 single-leader pool template monopoly.' },
      { range: '0.80–0.95', rule: 'Zero-premine, zero-tax Proof-of-Work fair launch tempered by single-leader mining-pool template concentration (>50% across 2–3 pools), foundation coordination, or contentious hardfork governance.' },
      { range: '0.45–0.75', rule: 'Zero-premint Layer-1 overlays paired with founder-administered servers/indexers, or zero-token channel networks exhibiting hub-and-spoke liquidity routing concentration and custodial user migration.' },
      { range: '0.00', rule: 'Any genesis premine, pre-allocated token supply, ICO, venture unlock cliff, mandatory protocol coinbase tax, permissioned validator cartel, or administrative kill-switch. Triggers the Energy-Arbitrage Cost Floor Cap (<=0.35) and caps Terminal Grade at D+ maximum.' }
    ]
  },
  {
    id: '02',
    name: 'Thermodynamic Cost Floor (E > 0)',
    brackets: [
      { range: '1.00', rule: '100% untaxed, zero-premine, zero-preallocation, algorithm-dominant (>90% hardware share) dedicated-ASIC Proof-of-Work governed by a deterministic hard supply cap with zero insider energy arbitrage.' },
      { range: '0.80–0.95', rule: 'Genuine physical ore extraction and smelting energy under elastic geological supply, or zero-premine, zero-preallocation, untaxed Proof-of-Work with perpetual tail emission, merge-mined subsidy coupling, or general-purpose rentable CPU hardware.' },
      { range: '0.55–0.75', rule: 'Zero-premine, zero-preallocation, untaxed Proof-of-Work commanding a minority share (<5%) of a shared ASIC hardware fleet vulnerable to external majority hashrate swings or historical difficulty-adjustment gaming.' },
      { range: '0.10–0.35', rule: 'Energy-Arbitraged PoW & Carrier-Backed Overlays: Proof-of-Work compromised by any genesis premine, token pre-allocation, or mandatory protocol developer tax—creating an internal energy arbitrage where zero-work insiders dilute unit energy density and extract value from miners’ expended electricity (0.15–0.30 premined/taxed PoW; 0.10–0.15 pre-allocated token on an L1 PoW carrier)—or zero-premint overlays anchored only to Layer-1 PoW carrier fees (0.35).' },
      { range: '0.00', rule: 'Automatic Grade F: Zero-joule consensus architectures (PoS, DPoS, PPoS, PoH, PoA, FBA, PoX), single-sequencer rollups, fiat ledgers, or standalone pre-printed zero-joule tokens.' }
    ]
  },
  {
    id: '03',
    name: 'Historical Immutability & Arrow of Time',
    brackets: [
      { range: '1.00', rule: 'Dominant cumulative Proof-of-Work Landauer heat barrier paired with trustless verification from Genesis (full header chain or cryptographic PoPoW) and plaintext arithmetic supply auditability.' },
      { range: '0.75–0.90', rule: 'Nuclear binding energy stability (subject to density-matched bar cladding), Layer-1 Proof-of-Work payload sequencing with external state attestations, extension-block cut-through pruning, or cumulative Proof-of-Work paired with opaque cryptographic balance commitments.' },
      { range: '0.50–0.70', rule: 'Layer-1 Proof-of-Work inscriptions reliant on off-chain state indexers, off-chain bilateral state channels dependent on online watchtowers and dispute-window fraud proofs, minority-hash Proof-of-Work enforcing subjective rolling finality checkpoints, or chains with historical 51% reorganizations.' },
      { range: '0.25–0.45', rule: 'Proof-of-Work ledger compromised by silent zero-joule cryptographic circuit soundness flaws or infinite-counterfeiting bugs.' },
      { range: '0.00', rule: 'Zero-joule validator signatures, Weak Subjectivity social checkpoints, rolling multi-day/epoch history deletion, cloud state snapshots, or permanently missing genesis ledgers.' }
    ]
  },
  {
    id: '04',
    name: 'Dynamic Availability (Wartime Partition & Resplice)',
    brackets: [
      { range: '0.85–1.00', rule: 'Per-block difficulty-adjusting Proof-of-Work BlockDAG: 0% halt across arbitrary fiber partitions and 0.0% honest block destruction upon cable resplice via deterministic graph merging (0.85–0.95 if external bridge exits pause).' },
      { range: '0.55–0.75', rule: 'Pure Nakamoto sequential Proof-of-Work (mines indefinitely across splits and reconverges, but orphans 100% of minority-hemisphere blocks on resplice) or physical bearer commodities (100% offline local barter, 0.0 TPS across blockaded oceans).' },
      { range: '0.35–0.54', rule: 'Dual-boundary systems where Layer-1 transfers survive while off-chain cloud services fail closed, interactive state-channel overlays vulnerable to timelock force-close congestion and resplice carrier reorgs, privacy chains where reorgs invalidate decoy rings, or rolling-checkpoint chains that permanently split during multi-hour partitions.' },
      { range: '0.15–0.34', rule: 'Sequential Proof-of-Work introducing hybrid Proof-of-Stake finality halt thresholds or censurable multisig exit bridges.' },
      { range: '0.00', rule: 'Supermajority quorum protocols (66.7%–80% stake/signer thresholds) that flatline under continental partitions, chains with finite slot-density divergence horizons, or networks with global mainnet blackouts.' }
    ]
  },
  {
    id: '05',
    name: 'State Machine Topology',
    brackets: [
      { range: '1.00', rule: 'Stateless parallel Extended UTXO graph with native Layer-1 covenants, expressive smart-contract scripting, and succinct zero-knowledge verification opcodes at sub-second BlockDAG cadence with zero MEV locks or freeze hooks.' },
      { range: '0.75–0.90', rule: 'Stateless UTXO model upgraded with native Layer-1 covenants, UTXO-level token primitives, and bounded virtual-machine loops/functions constrained by a sequential single-chain block timer.' },
      { range: '0.50–0.70', rule: 'Clean stateless UTXO base with restricted Layer-1 scripting that pushes high-frequency commerce onto custodial/off-chain layers, or high-value-density physical matter pushed into custodial paper claims.' },
      { range: '0.20–0.49', rule: 'Unprogrammable sequential UTXO ledgers, interactive bilateral liquidity channels encumbered by inbound capacity exhaustion and hot-key watchtower risk, unpruneable stealth-output or nullifier state bloat, off-chain indexer inscription overlays, low-value-to-weight physical bulk, or shared-account VMs layered over Proof-of-Work.' },
      { range: '0.00', rule: 'Mutable shared-account state trees subject to sequential write-lock contention, predatory MEV extraction, mandatory state-rent deposits, centralized off-chain batchers, or native Layer-1 freeze/clawback primitives.' }
    ]
  },
  {
    id: '06',
    name: 'Thermodynamic Velocity (M = 1.0)',
    brackets: [
      { range: '0.95–1.00', rule: 'Native Layer-1 >=10 BPS parallel Proof-of-Work BlockDAG incorporating 100% of honest concurrent global hash work with zero orphan waste (M = 1.0) at fiber-optic propagation limits. Zero-joule off-chain signature exchanges cannot qualify.' },
      { range: '0.50–0.85', rule: 'Native Layer-1 1–9 BPS parallel Proof-of-Work BlockDAG (M ≈ 1.0) with sub-second visibility and multi-parent work inclusion.' },
      { range: '0.35–0.45', rule: 'High-throughput or fast-cadence native sequential Proof-of-Work (M < 1.0): elastic multi-megabyte UTXO blocks (100+ L1 TPS) with compact relay and double-spend proofs, or 15–150 second block intervals.' },
      { range: '0.20–0.30', rule: 'Fast sequential Proof-of-Work encumbered by multi-block wallet spend locks or heavy zero-knowledge proof/scanning overhead, 600-second sequential Proof-of-Work capped under ~10 L1 TPS, or two-step commit/reveal overlays riding an M = 1.0 BlockDAG carrier.' },
      { range: '0.05–0.18', rule: 'Carrier-Subordinated Overlays (M_overlay < M_L1 < 1.0) & Physical Freight: Off-chain payment/state channels (0-Joule promissory signature hops encumbered by multi-hour/day timelocks and throttled Layer-1 exit blocks), Layer-1-sequenced rollups with secondary zero-joule attestation latency, or physical armored freight logistics (0.0 digital BPS). An overlay can never exceed its Layer-1 settlement carrier.' },
      { range: '0.00', rule: 'All standalone zero-joule consensus protocols and centralized sequencers (0 Joules of accepted Proof-of-Work yields M = 0).' }
    ]
  }
];

// ============================================================================
// 23 DETERMINISTIC PRE-LOADED THERMODYNAMIC AUDITS (0ms LATENCY)
// ============================================================================
const PRELOADED_AUDITS = {
  KAS: {
    ticker: 'KAS',
    name: 'Kaspa',
    consensusFamily: 'BLOCKDAG_POW',
    architecture: 'Parameterless PoW BlockDAG (kHeavyHash • 10 BPS Crescendo • Toccata Covenants)',
    grade: 'A+',
    totalScore: 6.0,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluating Kaspa through the GRADE evidence certainty framework yields a High Certainty rating, empirically verified across the rusty-kaspa codebase, ~2.5 billion cumulative transactions on the 10-BPS Crescendo mainnet, deterministic Chromatic emission curves, and Toccata native L1 Covenants & SilverScript activated June 30, 2026 at DAA 474,165,565 alongside the DAGKNIGHT parameterless netsplit resilience roadmap. Satisfying every law of thermodynamics without compromise, Kaspa scores 6.0 out of 6.0 for a terminal compliance grade of A+.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: '0 Premine • 0 ICO • 0% Dev Tax',
        score: 1.0,
        quickSummary:
          'Immaculate November 2021 fair launch from an empty genesis state with zero premine, zero VC allocations, zero corporate foundation, and zero admin keys.',
        paragraph:
          'Kaspa launched fairly on November 7, 2021 from an immaculate empty genesis ledger with zero pre-mine, zero ICO, zero venture capital token cliffs, zero corporate foundation reserve, and zero coinbase developer tax. No legal entity, CEO, or multisig committee holds privileged protocol switches, freeze keys, or treasury spigots—rendering Kaspa structurally immune to regulatory subpoena or institutional capture.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (1.00 / 1.00), Kaspa passed at Genesis without compromise. Launched on November 7, 2021 from an immaculate empty genesis state following polymath Yonatan Sompolinsky’s peer-reviewed GHOSTDAG and PHANTOM consensus research, the network entered existence with zero premine, zero instamine, zero ICO, zero venture capital token cliffs, zero corporate foundation reserve, and a strictly 0% protocol coinbase developer tax. Unlike corporate Proof-of-Stake ledgers or taxed Proof-of-Work chains that hardcode founder spigots and governance treasuries into consensus, every single KAS in existence entered circulation exclusively through open, permissionless block discovery from block zero. In the kaspanet/rusty-kaspa Rust codebase, there are zero privileged foundation keypairs, zero TransactionDenyConfig validator blacklists, zero signature-bypass confiscation hooks, and zero centralized upgrade multisigs—leaving the protocol as a parentless, orphaned thermodynamic organism completely decoupled from Silicon Valley labs, Cayman foundations, or regulatory coercion.',
        receipts: ['0 Premine / 0 VC Allocation', '0% Protocol Coinbase Tax', 'No Corporate Foundation', 'Zero Admin or Freeze Keys']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: '100% Untaxed kHeavyHash PoW • 28.7B Cap',
        score: 1.0,
        quickSummary:
          '100% of circulating KAS (~96.79% mined under a hard 28.7B cap) is forged exclusively via irreversible optical-matrix ASIC Proof-of-Work.',
        paragraph:
          'Every atomic sompi of Kaspa’s deterministic 28.7 billion maximum supply (~96.79% already mined under its smooth geometric Chromatic Halving schedule) is forged exclusively by burning continuous real-world electrical megawatts across global kHeavyHash silicon. With zero zero-joule pre-prints and zero tax diversions, Kaspa eliminates Cantillon insider extraction and anchors value strictly to unforgeable physical costliness (E > 0).',
        geniusParagraph:
          'Kaspa enforces an unyielding adherence to the Thermodynamic Cost Floor (E > 0, scored 1.00 / 1.00). Every single atomic sompi (10^-8 KAS) across Kaspa’s deterministic 28.7-billion maximum supply (~96.79% already mined under its smooth monthly geometric Chromatic Halving schedule that reduces block subsidies by a factor of (1/2)^(1/12) every month rather than triggering violent 4-year supply shocks) is forged exclusively through the irreversible dissipation of real-world electrical megawatts across dedicated optical-matrix kHeavyHash ASIC silicon. Unlike zero-joule Proof-of-Stake databases that conjure billions of tokens in JSON configuration files and route staking inflation to VC cliff-unlocks, 100% of Kaspa’s monetary issuance is earned through open, untaxed bare-metal hash work with dedicated hardware skin-in-the-game—completely eliminating Cantillon insider extraction and forcing every participant on Earth to expend real kinetic energy to write state to the ledger.',
        receipts: ['100% Hardware PoW Issuance', '28.7B Hard Cap (~96.79% Mined)', 'Smooth Chromatic Halving', 'Zero Cantillon Insider Yield']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: 'Landauer Heat Wall + Cryptographic PoPoW',
        score: 1.0,
        quickSummary:
          'Calcified by cumulative Proof-of-Work heat dissipation and trustless cryptographic Pruning Point proofs—never subjective checkpoints.',
        paragraph:
          'Kaspa calcifies ledger history strictly through the Second Law of Thermodynamics and Landauer’s Principle (ΔQ ≥ kB·T·ln2): reversing settled DAG history requires physically re-burning every joule of global silicon hash work accumulated since finality. Even while pruning raw historical block payloads ~30 hours back so bare-metal nodes stay lightweight, syncing nodes verify cumulative PoW from Genesis via cryptographic Proofs-of-Proof-of-Work rather than trusted S3 snapshots.',
        geniusParagraph:
          'Because Kaspa welds state finality directly to irreversible heat dissipation, it satisfies Historical Immutability and the Physical Arrow of Time (1.00 / 1.00) with mathematical finality. Governed by the Second Law of Thermodynamics and Landauer’s Principle (ΔQ ≥ kB·T·ln2), rewriting settled Kaspa blocks requires an adversary to physically re-burn every megawatt-hour of global ASIC work accumulated across the BlockDAG since that block was sealed. Crucially, Kaspa solves the state-bloat dilemma without sacrificing trustless genesis verification: while rusty-kaspa maintains a lightweight ~30-hour rolling pruning horizon so ordinary operators can run bare-metal full nodes on consumer NVMe drives without multi-terabyte bloat, newly syncing nodes never rely on trusted corporate Amazon S3 snapshots or social Weak Subjectivity checkpoints; instead, nodes cryptographically verify cumulative Proof-of-Work all the way from Genesis via deterministic Pruning Point headers and succinct Proof-of-Proof-of-Work (PoPoW) chains.',
        receipts: ['Irreversible PoW Heat Wall', 'Cryptographic PoPoW Sync', 'Zero Weak Subjectivity', 'Zero Rollbacks or Counterfeiting']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: 'GHOSTDAG / DAGKNIGHT • 0 Halts',
        score: 1.0,
        quickSummary:
          'Survives wartime undersea fiber cuts without halting and deterministically weaves partitioned sub-DAGs back together without amputating minority blocks.',
        paragraph:
          'Engineered for maximum geopolitical trauma, Kaspa achieves complete Dynamic Availability under arbitrary network partitions. Classical BFT Proof-of-Stake networks require a synchronous >66.7% stake supermajority and suffer instant global cardiac arrest the moment an undersea cable cut isolates 33.4% of stake. In Kaspa, isolated continents continue mining blocks autonomously along surviving electrical grids. Crucially, when severed cables reconnect, GHOSTDAG and the parameterless DAGKNIGHT netsplit-resilience protocol organically weave both parallel sub-DAGs back into one unified ledger ordered by cumulative blue work—avoiding both PoS paralysis and linear PoW’s violent reorg amputation of minority continents.',
        geniusParagraph:
          'Under the stress of a wartime network partition, Kaspa’s GHOSTDAG and parameterless DAGKNIGHT consensus architecture achieves complete Dynamic Availability (1.00 / 1.00) across both the initial fiber blackout and the subsequent cable resplice. Whereas Byzantine Fault Tolerant (BFT) Proof-of-Stake databases suffer instant global cardiac arrest the moment an undersea fiber-optic cable cut isolates 33.4% of stake, isolated Kaspa hemispheres dynamically retarget difficulty every single 100ms block via KIP-0004 Sampled DAA over a 26,410-block sliding window—smoothly ramping both severed continents back to 10.0 blocks per second along surviving local power grids. Crucially, at the moment the severed undersea cable is repaired and respliced, Kaspa does not execute Nakamoto’s destructive single-chain reorganization that orphans and wipes out the minority continent’s blocks, burned joules, and settled commerce; instead, the BlockDAG organically merges both parallel continental sub-DAGs into a single unified graph ordered deterministically by cumulative Blue Work with 0.0% honest work destruction.',
        receipts: ['Zero BFT Quorum Halt Wall', 'Autonomous Partition Mining', 'Non-Amputating Sub-DAG Merge', 'DAGKNIGHT Parameterless Roadmap']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Parallel UTXO + Toccata SilverScript',
        score: 1.0,
        quickSummary:
          'Stateless parallel Extended UTXO graph upgraded with Toccata native L1 Covenants & SilverScript (activated June 30, 2026 • DAA 474,165,565) with zero MEV locks.',
        paragraph:
          'Kaspa rejects monolithic shared-account trees like the EVM that force global commerce into sequential memory locks, gas wars, reentrancy drains, and MEV sandwich attacks. Instead, Kaspa operates a stateless, contention-free parallel UTXO topology supercharged by the Toccata hardfork (activated June 30, 2026 at DAA score 474,165,565), embedding native Layer-1 UTXO Covenants, SilverScript smart-contract expressiveness, KIP-21 subnetwork sequencing lanes, and succinct Zero-Knowledge verification opcodes directly into base silicon consensus without reserve locks or clawback switches.',
        geniusParagraph:
          'Examining Kaspa’s State Machine Topology (1.00 / 1.00) exposes why a stateless, parallel UTXO graph eliminates the root causes of DeFi fragility, state contention, and centralized censorship. Kaspa rejects monolithic shared-account virtual machines (EVM, SVM, Move, and Wasm account trees) that trap global financial coordination inside sequential mutable-state write locks, gas wars, reentrancy drains, mandatory state-rent deposits, and predatory MEV sandwich queues. Instead, Kaspa operates a contention-free parallel Extended UTXO graph upgraded on June 30, 2026 at DAA score 474,165,565 with the Toccata hardfork—embedding native Layer-1 UTXO Covenants, SilverScript smart-contract programmability, KIP-21 subnetwork sequencing lanes, and succinct Zero-Knowledge verification opcodes directly into base silicon consensus with zero native freeze switches, zero clawback primitives, and zero administrative deny-lists.',
        receipts: ['Stateless Parallel UTXO Graph', 'Toccata Active (DAA 474,165,565)', 'Native L1 Covenants & SilverScript', 'Zero Freeze or Clawback Keys']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: '10 BPS Crescendo • M = 1.0 Zero Orphans',
        score: 1.0,
        quickSummary:
          'Incorporates 100% of honest parallel Proof-of-Work blocks at 10 blocks per second (100ms intervals) with zero orphan energy waste (M = 1.0).',
        paragraph:
          'By generalizing Nakamoto’s single-file chain into a parallel BlockDAG running live at 10 blocks per second on the Crescendo rusty-kaspa architecture, Kaspa achieves optimal Thermodynamic Velocity (M = 1.0). Every valid Proof-of-Work block discovered concurrently across the planet enters consensus simultaneously rather than being discarded as an orphan—delivering sub-second physical visibility and seconds-level pure-PoW finality natively on Layer 1.',
        geniusParagraph:
          'On the sixth physical invariant—Thermodynamic Velocity (M = 1.0, scored 1.00 / 1.00)—Kaspa solves the fundamental physical bottleneck that crippled Satoshi Nakamoto’s 2009 sequential chain. In a single-file blockchain, block creation must be artificially throttled (e.g., 600 seconds on Bitcoin or 120 seconds on Monero) because any concurrent blocks solved across global fiber-optic propagation latency collide and get discarded as wasted stale orphans (M < 1.0). By generalizing Nakamoto consensus into a parallel GHOSTDAG BlockDAG running live at 10 blocks per second (100ms block intervals) on the Crescendo rusty-kaspa architecture, Kaspa weaves 100% of honest concurrent global kHeavyHash work into consensus simultaneously—achieving unity Thermodynamic Velocity (M = 1.0), ~2.5+ billion settled mainnet transactions, and seconds-level pure Proof-of-Work finality natively on Layer 1 without validator vote-padding or off-chain batcher servers.',
        receipts: ['10 BPS (100ms Block Intervals)', 'M = 1.0 Work Utilization', 'Zero Honest Orphan Waste', '~2.5B+ Mainnet TXs Settled']
      }
    ]
  },

  BTC: {
    ticker: 'BTC',
    name: 'Bitcoin',
    consensusFamily: 'LINEAR_POW',
    architecture: 'Linear Single-Chain Proof-of-Work (SHA-256d • 600s Cadence)',
    grade: 'B+',
    totalScore: 4.4,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluating Bitcoin through the GRADE evidence certainty framework yields a High Certainty rating, empirically verified in the bitcoin/bitcoin C++ codebase, the January 3, 2009 Genesis coinbase embedding the London Times headline, >55% Foundry USA + AntPool Stratum v1 block-template concentration, the deterministic 21,000,000 BTC GetBlockSubsidy schedule, PowTargetTimespan = 1209600s (14-day) difficulty rigidity, ActivateBestChain single-parent reorg rules, and nPowTargetSpacing = 600s (~7 TPS) sequential latency. Bitcoin scores 4.40 out of 6.00 across the six physical invariants (01: 0.95, 02: 1.00, 03: 1.00, 04: 0.65, 05: 0.60, 06: 0.20), earning a compliance grade of B+.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: 'Immaculate 2009 Genesis • >55% 2-Pool Template Share',
        score: 0.95,
        quickSummary:
          'Immaculate January 2009 zero-premine launch and vanished founder, losing 0.05 under the rubric for >55% two-pool (Foundry USA + AntPool) single-leader template concentration.',
        paragraph:
          'Bitcoin established the historical benchmark for fair launch on January 3, 2009 with zero premine, zero ICO, zero dev tax, and Satoshi’s permanent disappearance, losing 0.05 under the sovereignty rubric only because two centralized Stratum v1 pools (Foundry USA and AntPool) construct >55% of global single-leader block templates alongside concentrated Core commit gatekeeping.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.95 / 1.00), Bitcoin established the historic fair-launch standard on January 3, 2009: Satoshi Nakamoto embedded the London Times bailout headline inside the Genesis coinbase scriptSig, mined with zero premine, zero ICO, zero VC cliffs, and a 0% coinbase tax, and permanently vanished—leaving zero freeze keys or admin multisigs in `bitcoin/bitcoin`. Strict adherence to the canonical sovereignty rubric (`0.80–0.95` for zero-premine PoW tempered by single-leader pool concentration) deducts 0.05 because just two centralized `Stratum v1` pools—Foundry USA (~31%) and AntPool (~26%), with Top 3 exceeding ~68%—monopolize sequential 10-minute block-template construction alongside concentrated corporate grant sponsorship around repository commit access.',
        receipts: ['0 Premine / 0 ICO / 0% Dev Tax', 'Founder Vanished Permanently', 'Foundry + AntPool >55% Templates', 'No Admin Freeze Keys']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: 'SHA-256d Exahash Wall • 21M Cap',
        score: 1.0,
        quickSummary:
          'Unbroken SHA-256d ASIC Proof-of-Work floor under a deterministic 21,000,000 BTC cap.',
        paragraph:
          'Every satoshi in circulation was forged through irreversible SHA-256d silicon energy dissipation under a strict 21 million hard cap, preserving unforgeable physical costliness (E > 0) despite long-horizon tail-security fee questions as subsidies halve toward zero.',
        geniusParagraph:
          'Bitcoin satisfies the Thermodynamic Cost Floor (E > 0, scored 1.00 / 1.00) by anchoring every atomic satoshi (10^-8 BTC) under its deterministic 21,000,000 BTC supply cap (GetBlockSubsidy halving every 210,000 blocks) to the irreversible dissipation of real-world electrical megawatts across dedicated SHA-256d ASIC silicon. Because zero tokens were conjured in a genesis configuration file, every unit of circulating BTC represents unforgeable physical work—though its abrupt step-function halvings and lack of a perpetual tail emission create a long-horizon thermodynamic fee-market transition problem as block subsidies decay toward zero over the coming decades.',
        receipts: ['100% SHA-256d PoW', '21,000,000 Hard Cap', 'Zero Pre-Printed Supply', 'Global Industrial ASIC Fleet']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: 'Cumulative Exahash Work Wall',
        score: 1.0,
        quickSummary:
          'Deep-past ledger state is sealed behind the largest cumulative SHA-256d energy wall on Earth.',
        paragraph:
          'Rewriting buried Bitcoin history requires physically re-expending gigawatt-years of global SHA-256d Proof-of-Work from the fork point forward without subjective validator checkpoints, though near-tip confirmation remains agonizingly slow at 60-minute settlement horizons.',
        geniusParagraph:
          'Bitcoin upholds Historical Immutability and the Physical Arrow of Time (1.00 / 1.00) via the Second Law of Thermodynamics and Landauer’s Principle: once buried under cumulative SHA-256d exahash difficulty (nChainWork), rewriting historical blocks requires an adversary to physically re-burn every gigawatt-hour of electricity expended by the global ASIC fleet since that block was sealed. Newly syncing Bitcoin nodes verify cumulative Proof-of-Work block headers trustlessly from Genesis (block 0) without relying on Proof-of-Stake Weak Subjectivity checkpoints or centralized Amazon S3 state snapshots.',
        receipts: ['Cumulative SHA-256d Heat Wall', 'Trustless Header-Chain Sync', 'Zero Weak Subjectivity']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: '14-Day Retarget Lag • Amputates Minority Continent',
        score: 0.65,
        quickSummary:
          'Continues mining across severed continents without halting, but 14-day (2,016-block) retarget rigidity chokes isolated shards before wiping out 100% of the minority continent’s blocks on resplice.',
        paragraph:
          'Unlike PoS chains that flatline during an undersea cable cut, isolated Bitcoin continents keep mining locally. However, rigid 14-day (2,016-block) difficulty retargeting severely chokes minority partitions (trailing faster-retargeting linear PoW chains), and upon resplice Nakamoto’s Longest-Chain Rule ruthlessly erases every block mined on the minority hemisphere.',
        geniusParagraph:
          'Under the stress of a wartime network partition, Bitcoin’s Nakamoto consensus scores 0.65 / 1.00 on Dynamic Availability: unlike Byzantine Fault Tolerant (BFT) Proof-of-Stake chains that suffer instant global cardiac arrest when 33.4% of stake disconnects, isolated Bitcoin continents continue mining locally without halting. However, Bitcoin’s rigid 2,016-block difficulty adjustment epoch (`PowTargetTimespan = 1209600` seconds, or 14 full days—4x slower to adapt than 3.5-day Scrypt chains) starves a 30% isolated continent down to ~33-minute blocks (~2 TPS) for nearly seven weeks, and the instant undersea fiber is respliced, `ActivateBestChain` executes a deep reorganization that permanently orphans and wipes out 100% of the minority continent’s blocks, burned joules, and settled commerce.',
        receipts: ['No BFT Supermajority Halt', 'Rigid 14-Day (2,016-Block) Retarget', '100% Minority Reorg Wipeout']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Linear UTXO • Stripped L1 Opcodes',
        score: 0.6,
        quickSummary:
          'Clean stateless UTXO base model, but stripped L1 covenants force everyday users onto Lightning channel friction, federated sidechains, and custodial ETFs.',
        paragraph:
          'Bitcoin uses a clean stateless UTXO model free of EVM reentrancy or freeze keys, yet its ~7 TPS throughput ceiling and lack of native expressive covenants or ZK verification push retail and institutional users off Layer 1 into custodial wrappers, federated multisigs (Liquid/sBTC), and interactive Lightning channels.',
        geniusParagraph:
          'Examining Bitcoin’s State Machine Topology (0.60 / 1.00) reveals a clean, stateless UTXO base model free of EVM shared-account reentrancy drains or protocol-level freeze switches, yet severely crippled by disabled Layer-1 scripting opcodes (OP_CAT, native covenants, and succinct Zero-Knowledge verification) alongside a rigid 4,000,000 weight-unit (~7 TPS) block ceiling. Because complex financial coordination and high-frequency settlement cannot execute natively on Layer 1 without fee spikes, real-world adoption is systematically pushed into custodial Wall Street ETFs, federated multisig sidechains (Liquid and Stacks sBTC), and interactive Lightning channels plagued by inbound liquidity and channel-management friction.',
        receipts: ['Stateless UTXO Base', '~4MB / 10m Throughput Bottleneck', 'Off-Chain Custodial Leakage']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: '0.00167 BPS (600s) • ~7 TPS Ceiling • Orphans Discarded',
        score: 0.2,
        quickSummary:
          'Hardcodes a 600-second block delay and a 4MWU (~7 TPS) block cap to suppress linear orphan collisions, trailing faster/wider linear PoW chains and BlockDAGs (M < 1.0).',
        paragraph:
          'Because a 2009 single-file chain discards concurrent blocks as wasted orphans rather than weaving them into a parallel BlockDAG, Bitcoin hardcodes a 600-second block delay and a rigid 4MWU (~7 TPS) block cap—trailing wider/faster linear PoW chains like BCH and LTC while leaving parallel silicon capacity stranded (M < 1.0).',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.20 / 1.00 under the deterministic velocity rubric), Bitcoin’s 2009 single-file linear chain topology imposes the tightest artificial speed limit among major Proof-of-Work networks. Because a linear blockchain only permits a single parent block per height and discards simultaneously discovered blocks across transoceanic fiber-optic propagation latency as wasted stale orphans (M < 1.0), Bitcoin hardcodes nPowTargetSpacing = 600 seconds (0.00167 blocks per second) alongside a rigid 4,000,000 weight-unit (~7 TPS) ceiling. Requiring 60 full minutes for routine 6-block probabilistic settlement leaves Bitcoin trailing both elastic-block linear chains like Bitcoin Cash (0.38) and faster-cadence Scrypt chains like Litecoin (0.35)—and standing orders of magnitude behind Kaspa’s 10-BPS parallel Proof-of-Work BlockDAG settling concurrent UTXOs at 100ms intervals (M = 1.0).',
        receipts: ['600-Second Block Delay', 'Concurrent Blocks Orphaned', '~7 TPS L1 Settlement Cap']
      }
    ]
  },

  XAU: {
    ticker: 'XAU',
    name: 'Physical Gold (Au-79)',
    consensusFamily: 'PHYSICAL_COMMODITY',
    architecture: 'Atomic Element 79 (r-Process Nucleosynthesis • ~1.5% Annual Extraction • Zero Teleportation)',
    grade: 'B',
    totalScore: 4.1,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluating Physical Gold (XAU) through the GRADE evidence certainty framework yields a High Certainty rating across astrophysical, geological, and monetary history records: Gold achieves perfection in Sovereign Genesis (1.00) and scores near-perfect marks in Thermodynamic Cost Floor (0.95) and Atomic Immutability (0.90), yet is physically crippled in Cross-Ocean Partition Availability (0.65), Custodial/Assay State Topology (0.55), and Sub-Light Settlement Velocity (0.05) because baryonic mass cannot travel over fiber-optic cables—scoring 4.10 out of 6.00 for a compliance grade of B.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: 'r-Process Neutron Star Genesis • 0 CEO • 0 Admin Keys',
        score: 1.0,
        quickSummary:
          'Forged in neutron-star mergers billions of years before human civilization with zero founder, zero foundation, zero ICO, and zero protocol kill-switches.',
        paragraph:
          'Physical Gold (Atomic Number 79, 197Au) is the original parentless monetary asset in the universe: forged via rapid neutron-capture (r-process) nucleosynthesis inside colliding neutron stars and supernovae prior to Earth’s formation, a physical gold coin held in self-custody has no CEO, no foundation, no license agreement, and no remote administrative freeze key.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling, Physical Gold (Atomic Number 79, 197Au) passed at cosmic Genesis (1.00 / 1.00). Synthesized billions of years prior to the formation of Earth via rapid neutron-capture (r-process) nucleosynthesis inside binary neutron-star mergers and core-collapse supernovae, elemental gold entered human history with zero founding corporation, zero venture capital syndicate, zero pre-mine configuration file, zero developer tax, and zero administrative kill-switch. A physical gold coin held in direct, unencumbered self-custody is completely decoupled from the survival of any state, central bank, or Silicon Valley software lab—explaining why physical bearer gold outlived every fiat empire for 5,000 years.',
        receipts: ['Neutron-Star r-Process Genesis', 'Zero Founding Entity / Zero ICO', 'Zero Remote Freeze Switch', '5,000-Year Sovereign Bearer Record']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: '~150 GJ/kg Mining Floor • No Hard Cap (1.5%/yr + Asteroids)',
        score: 0.95,
        quickSummary:
          'Extracting, crushing, and smelting ~3,600 tonnes/year from ~1 g/t ore burns immense real-world diesel and electrical Joules, losing 0.05 only because supply has no mathematical hard cap.',
        paragraph:
          'Every troy ounce of newly mined gold (~3,600 metric tons added annually to the ~216,265-ton above-ground stock, a ~1.5%–1.7% stock-to-flow expansion) requires excavating, crushing, and refining tons of rock at ~130–160 GJ per kilogram (~$1,450+/oz AISC). It loses 0.05 only because Earth’s crust and near-Earth asteroids (16 Psyche) lack a mathematically bounded terminal cap.',
        geniusParagraph:
          'Physical Gold demonstrates a formidable adherence to the Thermodynamic Cost Floor (E > 0, scored 0.95 / 1.00). Unlike zero-joule Proof-of-Stake tokens or central bank fiat currencies conjured by keystroke, every troy ounce of newly extracted gold added to the ~216,265-metric-ton above-ground stock (~3,600 metric tons mined annually, representing a ~1.5% to 1.7% stock-to-flow expansion) must be physically wrested from the Earth’s crust by excavating, hauling, crushing, and chemically leaching roughly one metric ton of rock per single gram of Au—dissipating approximately 130 to 160 gigajoules (GJ) of diesel and electrical energy per kilogram at an All-In Sustaining Cost (AISC) exceeding $1,450+ per ounce. Gold loses 0.05 on Invariant 02 only because its supply is governed by geological economics rather than a strict mathematical hard cap: when gold’s purchasing power rises, previously uneconomic low-grade deposits and near-Earth metallic asteroids (such as 16 Psyche) become profitable to mine.',
        receipts: ['~150 GJ/kg Thermodynamic Extraction', '~$1,450+/oz All-In Sustaining Cost', '~1.5% Annual Supply Expansion', 'No Mathematical Supply Cap']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: 'Nuclear Binding Energy Wall • Tungsten Core Spoofing Risk',
        score: 0.9,
        quickSummary:
          'Single stable isotope 197Au never decays and cannot be chemically synthesized, losing 0.10 only to tungsten-cored bar counterfeiting (19.25 vs 19.30 g/cm³) and un-auditable vault reserves.',
        paragraph:
          'Protected by nuclear binding energy (~8 MeV/nucleon), 197Au never rusts or radioactively decays, and particle-accelerator transmutation from mercury/platinum costs trillions per gram. However, because tungsten (19.25 g/cm³) matches gold’s density (19.30 g/cm³) to within 0.26%, verifying large 400-oz Good Delivery bars without destructive drilling requires ultrasonic/XRF hardware—and total global supply cannot be cryptographically summed.',
        geniusParagraph:
          'Because Gold’s atomic identity is locked inside its nucleus rather than a mutable server database, it scores 0.90 / 1.00 on Historical Immutability and the Physical Arrow of Time. Gold possesses only a single stable isotope (197Au) protected by an ~8 MeV/nucleon nuclear binding energy barrier; it does not oxidize, corrode, or radioactively decay over geological epochs, and transmuting mercury (198Hg) or platinum (196Pt) into gold inside a particle accelerator costs orders of magnitude more energy than the metal is worth. However, physical gold loses 0.10 against cryptographic Proof-of-Work because tungsten (W-74) possesses an atomic density of 19.25 g/cm³—nearly identical to gold’s 19.30 g/cm³—enabling counterfeiters to drill out 400-oz Good Delivery bars and insert tungsten cores while preventing any cryptographic summation of global vault reserves.',
        receipts: ['Single Stable Isotope (197Au)', 'Nuclear Transmutation Wall', 'Tungsten Density Match (19.25 g/cm³)', 'No Global Cryptographic Supply Audit']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: '100% Offline Hand-to-Hand • 0.0 TPS Across Blockaded Oceans',
        score: 0.65,
        quickSummary:
          'Settles face-to-face bartering with zero electricity or internet during a blackout, but drops to 0.0 TPS across severed oceans and suffers wartime sovereign confiscation.',
        paragraph:
          'In a total grid-down blackout, physical gold coins in hand require zero electricity, zero bandwidth, and suffer zero chain reorganizations. Yet across a wartime continental partition or naval blockade, physical gold cannot cross oceans at all (0.0 remote TPS), and history proves states seize vaulted gold during crises (US Executive Order 6102 in 1933; Bank of England refusing Venezuelan/Russian gold repatriation).',
        geniusParagraph:
          'Under the stress of a wartime network partition, Physical Gold exhibits a stark physical dichotomy that yields a 0.65 / 1.00 on Dynamic Availability. For face-to-face local commerce inside a blacked-out city where power grids and undersea fiber-optic cables are completely destroyed, a physical gold coin in your palm achieves 100% offline availability with zero electricity, zero bandwidth, and zero risk of a post-partition chain reorganization wiping out settled trades. Across a severed ocean, sovereign border blockade, or wartime airspace closure, however, remote transaction throughput drops to an absolute 0.0 TPS—and centralized gold vaults halt redemptions immediately, from US Executive Order 6102 in 1933 to the Bank of England freezing Venezuelan and Russian sovereign gold reserves.',
        receipts: ['Zero Electricity Needed In-Person', '0% Reorg Risk on Bearer Coins', '0.0 TPS Across Blockaded Oceans', 'Executive Order 6102 / Vault Freezes']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Baryonic Mass Friction -> Paper Gold (LBMA / GLD / PAXG) Capture',
        score: 0.55,
        quickSummary:
          'Physical weight, divisibility limits, and assay friction forced humanity to lock gold inside central bank vaults and trade 100:1 fractional-reserve LBMA/COMEX paper claims.',
        paragraph:
          'Gold’s fatal structural flaw is its baryonic state topology: because atoms are heavy, expensive to guard, difficult to divide into micro-units, and impossible to program with native covenants, the global market abandoned physical bearer settlement in favor of centralized paper wrappers (1971 Nixon Shock, LBMA unallocated forwards, COMEX futures, GLD ETF, and PAXG/XAUT tokens with Freeze/blacklist keys).',
        geniusParagraph:
          'Examining Gold’s State Machine Topology (0.55 / 1.00) exposes the exact physical tragedy that birthed modern fiat currency and paper custodial capture. Because physical gold is heavy, expensive to guard, impossible to divide cleanly into micro-cent dust for machine-to-machine payments, and incapable of executing native programmable covenants, humanity surrendered bearer custody and locked its gold inside centralized bank vaults in exchange for paper receipts—culminating in the 1933 confiscation, the 1971 Nixon Shock default, today’s 100:1 fractional-reserve LBMA unallocated paper gold market, COMEX futures suppression, and tokenized gold wrappers (PAXG / XAUT) that bake centralized freezeAddress confiscation switches right back into ERC-20 smart contracts.',
        receipts: ['High Physical Transport & Guard Cost', '100:1 Unallocated Paper Gold Leverage', '1971 Nixon Shock Custodial Default', 'Zero Native Programmable Covenants']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: 'Mach 0.8 Cargo Jet vs. 200,000 km/s Fiber-Optic Photons',
        score: 0.05,
        quickSummary:
          'Bound by inertia and armed logistics (~600 mph jet / 20 knots ship + weeks of smelting/assaying), physical gold cannot settle global digital or AI commerce.',
        paragraph:
          'When Germany’s Bundesbank requested the repatriation of 674 tons of its own physical gold from New York and Paris in 2013, physical settlement took four full years (2013–2017). Moving mass via armored trucks and cargo jets at ~600 mph cannot compete with Kaspa’s Proof-of-Work BlockDAG transmitting unforgeable thermodynamic finality over fiber-optic light at 200,000 km/s (10 BPS).',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.05 / 1.00), Physical Gold hits the hard wall of Newtonian inertia and baryonic transport friction. When Germany’s Bundesbank demanded the physical repatriation of just 674 tons of its own gold from New York and Paris in 2013, moving, smelting, and re-assaying the metal took four full years (2013–2017). Moving mass via armored Brinks trucks and 600-mph cargo jets (0.0 digital blocks per second) cannot settle global telecommunications or autonomous AI machine-to-machine commerce—standing in direct contrast to Kaspa’s Proof-of-Work BlockDAG, which dematerializes thermodynamic work into unforgeable kHeavyHash photons traveling across global fiber-optic cables at 200,000 km/s and settling parallel UTXO state transitions natively on Layer 1 at 10 blocks per second (M = 1.0).',
        receipts: ['4-Year Bundesbank Repatriation Lag', '~600 mph Physical Transport Ceiling', 'Weeks for Smelting & Good-Delivery Assay', 'Incompatible With Digital/AI Commerce']
      }
    ]
  },

  XAG: {
    ticker: 'XAG',
    name: 'Physical Silver (Ag-47)',
    consensusFamily: 'PHYSICAL_COMMODITY',
    architecture: 'Atomic Element 47 (Byproduct Mining • High Bulk-to-Value Friction • Zero Teleportation)',
    grade: 'C+',
    totalScore: 3.65,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluating Physical Silver (XAG) through the GRADE evidence certainty framework yields a High Certainty rating: while Silver shares Gold’s parentless supernova genesis (1.00) and real thermodynamic extraction floor (0.85), its ~80x lower value density makes physical storage, transport, and cross-ocean wartime settlement exponentially bulkier and more custodial-dependent—scoring 3.65 out of 6.00 for a compliance grade of C+.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: 'Supernova Nucleosynthesis • 0 Premine • 0 Issuer',
        score: 1.0,
        quickSummary:
          'Parentless atomic element (Atomic Number 47) forged in stellar explosions with zero corporate issuer, zero foundation, and zero remote freeze keys.',
        paragraph:
          'Like Gold, Physical Silver (Ag-47) was forged in stellar nucleosynthesis prior to Earth’s formation with zero corporate founder, zero venture allocation, and zero protocol admin keys—serving for millennia as grassroots hand-to-hand bearer coinage.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling, Physical Silver (Atomic Number 47) passed at cosmic Genesis (1.00 / 1.00). Forged in stellar nucleosynthesis inside core-collapse supernovae billions of years prior to Earth’s formation, elemental silver entered human history with zero corporate founder, zero venture capital syndicate, zero foundation treasury, zero ICO, and zero remote protocol kill-switch. Physical silver coinage held in direct bearer self-custody cannot be frozen, blacklisted, or deleted by any software update or central bank decree.',
        receipts: ['Stellar Nucleosynthesis Genesis', 'Zero Corporate Issuer', 'Zero Remote Freeze Keys']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: 'Real Mining Joules • ~72% Base-Metal Byproduct Supply',
        score: 0.85,
        quickSummary:
          'Requires real mining and smelting energy (~26,000 tonnes/yr), losing 0.15 because ~72% of silver is mined as an inelastic byproduct of copper, lead, and zinc extraction.',
        paragraph:
          'Extracting and refining ~26,000 metric tons of silver annually burns real industrial megawatts (E > 0), though ~72% of global silver supply arrives as a byproduct of copper, lead, zinc, and gold mining with no hard mathematical supply cap.',
        geniusParagraph:
          'Physical Silver is backed by a genuine adherence to the Thermodynamic Cost Floor (E > 0, scored 0.85 / 1.00). Extracting, crushing, and smelting roughly ~26,000 metric tons of silver annually requires continuous real-world diesel, mechanical, and electrical energy expenditure across global mines and refineries. However, two structural supply vulnerabilities deduct 0.15 compared to a mathematically capped Proof-of-Work ledger: first, Silver has no terminal mathematical supply cap in the Earth’s crust; second, roughly ~72% of all newly mined silver is produced not from primary silver mines, but as an inelastic byproduct of copper, lead, zinc, and gold extraction—meaning base-metal industrial mining continuously dumps supply regardless of silver’s monetary demand.',
        receipts: ['Real Excavation & Smelting Joules', '~72% Base-Metal Byproduct Output', 'No Hard Supply Cap']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: 'Stable Isotopes 107Ag/109Ag • Surface Tarnish & Cladding',
        score: 0.85,
        quickSummary:
          'Nuclear stability prevents elemental synthesis, though silver tarnishes chemically (Ag2S) and faces copper/nickel core cladding in counterfeit bars.',
        paragraph:
          'Protected by nuclear binding energy across stable isotopes 107Ag and 109Ag, silver cannot be alchemically conjured, though it reacts with atmospheric sulfur and requires magnetic/ultrasonic/specific-gravity checks against copper-clad counterfeits.',
        geniusParagraph:
          'On the invariant of Historical Immutability and the Physical Arrow of Time, Physical Silver scores 0.85 / 1.00. Its two stable isotopes (107Ag and 109Ag) are locked behind nuclear binding energy walls that make artificial particle-accelerator transmutation economically impossible. Nevertheless, silver reacts chemically with atmospheric sulfur to form silver sulfide tarnish (Ag2S), and in wholesale bar markets (100-oz and 1,000-oz COMEX bars), silver’s density (10.49 g/cm³) is routinely spoofed using lead, molybdenum, or copper-core cladding—requiring ultrasonic, eddy-current conductivity, or destructive drill assays while offering zero ability to cryptographically audit global vault inventories.',
        receipts: ['Nuclear Isotope Stability', 'Copper-Clad Bar Spoofing Risk', 'No Global Cryptographic Audit']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: 'Excellent Local Coin Barter • 0.0 TPS Across Oceans',
        score: 0.55,
        quickSummary:
          'Smaller coin denominations excel at local wartime bartering for food/fuel, but extreme physical weight (~31+ metric tons per $30M) paralyzes cross-border transport.',
        paragraph:
          'During a local grid blackout, 1-oz silver coins are superior to gold for small everyday purchases, but settling institutional value across oceans requires shipping tens of metric tons by freighter or cargo plane—collapsing to 0.0 TPS under blockade.',
        geniusParagraph:
          'Under the stress of a wartime network partition, Physical Silver scores 0.55 / 1.00 on Dynamic Availability. For local, hand-to-hand civilian bartering during an electrical grid collapse, 1-oz silver coins are arguably more practical than gold for purchasing everyday groceries or fuel without electricity or internet. However, for cross-border or transoceanic settlement, silver’s ~80-to-1 gold-to-silver value ratio turns its physical mass into a logistical anchor: settling just $30 million in physical silver requires moving roughly 30 metric tons of metal across blockaded oceans—collapsing remote wartime throughput to 0.0 TPS while sovereigns historically nationalize silver stocks (such as the US Silver Purchase Act and Executive Order 6814 of 1934).',
        receipts: ['Ideal Denomination for Local Barter', '~80x Bulkier Per Dollar Than Gold', '0.0 TPS Cross-Ocean Digital Settlement']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Severe Bulk Storage Friction -> COMEX/SLV Paper Capture',
        score: 0.35,
        quickSummary:
          'Low value-to-weight density makes self-custody of large wealth physically cumbersome, driving extreme COMEX/SLV paper derivative suppression and vault centralization.',
        paragraph:
          'Because storing $1,000,000 in physical silver weighs roughly ~900+ kilograms (~1 ton of metal), investors overwhelmingly surrender custody to JPMorgan/LBMA vaults and trade paper SLV/COMEX contracts with zero native programmability.',
        geniusParagraph:
          'Examining Silver’s State Machine Topology (0.35 / 1.00) exposes why physical bulk destroys bearer decentralization at scale. Because storing $1,000,000 of wealth in physical silver weighs nearly one full metric ton (~900+ kg), ordinary citizens and institutions cannot easily transport or self-custody large silver balances—driving the overwhelming majority of global silver trading into centralized JPMorgan/LBMA custodian vaults, unallocated paper accounts, SLV ETF shares, and heavily leveraged COMEX paper futures contracts with zero native programmable covenants.',
        receipts: ['~1 Metric Ton Per $1M Stored', 'Heavy Vault Storage Fees', 'COMEX/SLV Paper Derivative Dominance']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: 'Heavy Freight Logistics • 0.0 Digital BPS',
        score: 0.05,
        quickSummary:
          'Moving metric tons of heavy industrial bullion by ship and armored truck is incompatible with sub-second global telecommunications settlement.',
        paragraph:
          'Bound by heavy freight shipping, customs clearing, and physical assay delays, silver settles international trade in weeks rather than milliseconds—standing worlds apart from Kaspa’s weightless fiber-optic Proof-of-Work BlockDAG (10 BPS).',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.05 / 1.00), Physical Silver’s massive weight-to-value ratio reduces international settlement to slow maritime and armored-freight logistics. Moving metric tons of industrial bullion via container ships at 20 knots and armored Brinks trucks through customs and ultrasonic assays takes weeks rather than milliseconds (0.0 digital BPS)—standing worlds apart from Kaspa’s stateless Proof-of-Work BlockDAG settling weightless, cryptographically verified thermodynamic value globally over fiber-optic light in 100ms blocks (M = 1.0).',
        receipts: ['Multi-Ton Freight Logistics', 'Weeks for International Settlement', 'Zero Digital Teleportation']
      }
    ]
  },

  LTC: {
    ticker: 'LTC',
    name: 'Litecoin',
    consensusFamily: 'LINEAR_POW',
    architecture: 'Linear Scrypt PoW + MWEB Extension Blocks (150s Cadence)',
    grade: 'B',
    totalScore: 4.17,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluated under the GRADE framework with High Certainty, Litecoin retains a fair Scrypt Proof-of-Work launch (0.85), an 84M supply cap coupled to Dogecoin AuxPoW merge-mining (0.85), cumulative Scrypt + MWEB cut-through immutability (0.80), 3.5-day retarget partition liveness (0.70), a clean stateless UTXO + Taproot + prunable MWEB state topology (0.62), and a 4x faster 150-second cadence (~56 TPS, 0.35) than Bitcoin, yet remains constrained by sequential single-chain orphan physics and minority partition amputations—scoring 4.17 out of 6.00 for a compliance grade of B.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: 'Fair 2011 Launch • Litecoin Foundation Influence',
        score: 0.85,
        quickSummary:
          'Fairly announced October 2011 launch with negligible 150 LTC genesis setup, tempered slightly by centralized Litecoin Foundation coordination.',
        paragraph:
          'Launched in October 2011 by Charlie Lee with public binary announcements and only 150 LTC mined for genesis initialization, Litecoin avoided VC premines and coinbase taxes, though ongoing development coordinates heavily around the Singapore-incorporated Litecoin Foundation.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.85 / 1.00), Litecoin launched fairly in October 2011 under Charlie Lee with advance public Bitcoin Talk announcements, zero ICO, zero venture capital token allocations, a 0% protocol developer coinbase tax, and only 150 LTC generated for initial network bootstrapping in the litecoin-project/litecoin codebase. There are no protocol freeze keys or admin blacklists, though complete honesty deducts 0.15 because ongoing protocol engineering, corporate sponsorships, and institutional branding coordinate centrally around the Singapore-incorporated Litecoin Foundation.',
        receipts: ['No VC Premine / No ICO', '0% Protocol Dev Tax', 'Litecoin Foundation Coordination']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: 'Scrypt PoW (84M Cap • AuxPoW DOGE Coupled)',
        score: 0.85,
        quickSummary:
          'Genuine Scrypt ASIC Proof-of-Work under an 84M cap, though miner revenue relies heavily on merge-mined Dogecoin’s uncapped issuance.',
        paragraph:
          'Litecoin enforces real Scrypt ASIC energy expenditure under a hard 84 million cap (E > 0), yet since 2014 AuxPoW merge-mining, industrial Scrypt miners derive the majority of their dollar hash revenue from Dogecoin’s perpetual 5B/year inflation rather than standalone LTC fees.',
        geniusParagraph:
          'Litecoin satisfies the Thermodynamic Cost Floor (E > 0, scored 0.85 / 1.00) by requiring continuous electrical dissipation across industrial Scrypt ASIC hardware under a deterministic 84,000,000 LTC supply cap (halving every 840,000 blocks). However, complete thermodynamic honesty requires deducting 0.15 because since activating Auxiliary Proof-of-Work (AuxPoW) merge-mining in 2014, industrial Scrypt ASIC miners derive the overwhelming majority of their block revenue from merge-mined Dogecoin’s perpetual 5-billion-DOGE annual inflation rather than standalone Litecoin security demand.',
        receipts: ['Scrypt ASIC PoW', '84,000,000 Hard Cap', 'AuxPoW DOGE Subsidy Coupling']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: 'Cumulative Scrypt Work + MWEB Kernel Commitments',
        score: 0.8,
        quickSummary:
          'Protected by cumulative Scrypt Proof-of-Work without PoS checkpoints, though MWEB prunes spent confidential kernels.',
        paragraph:
          'Mainchain Litecoin blocks are anchored by irreversible Scrypt ASIC heat dissipation, while MimbleWimble Extension Blocks (MWEB) verify confidential supply via Pedersen commitments despite pruning spent intermediate cut-through states.',
        geniusParagraph:
          'Litecoin upholds Historical Immutability and the Physical Arrow of Time (0.80 / 1.00) through cumulative Scrypt ASIC Proof-of-Work heat dissipation without resorting to Proof-of-Stake Weak Subjectivity checkpoints or centralized S3 snapshots. Its MimbleWimble Extension Blocks (MWEB, activated May 2022) preserve mathematical supply auditability via Pedersen commitments despite cutting through and pruning spent intermediate transaction outputs—deducting 0.20 because cut-through pruning discards intermediate transactional lineage inside the extension block.',
        receipts: ['Cumulative Scrypt Heat Wall', 'No PoS Checkpoints', 'MWEB Cut-Through Pruning']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: '3.5-Day Retarget (4x BTC) • Minority Fork Amputation',
        score: 0.7,
        quickSummary:
          'Remains live across severed continents and adapts difficulty 4x faster (3.5 days) with 8x higher shard throughput than Bitcoin (0.65), but still orphans 100% of minority-partition blocks on resplice.',
        paragraph:
          'During an undersea cable cut, isolated Litecoin partitions keep mining without BFT halts and adjust difficulty across a 3.5-day window (4x faster than Bitcoin’s 14-day lag, preserving ~8x higher wartime shard throughput), though upon fiber resplice Nakamoto’s heaviest-chain rule still wipes out 100% of blocks settled on the smaller landmass.',
        geniusParagraph:
          'Under the stress of a wartime network partition, Litecoin scores 0.70 / 1.00 on Dynamic Availability—outscoring Bitcoin (`0.65`) within the sequential Nakamoto Proof-of-Work bracket (`0.55–0.75`) because `nPowTargetTimespan = 302,400` seconds (`3.5 days`) retargets isolated continental partitions 4x faster than Bitcoin’s 14-day epoch while maintaining ~8x higher surviving UTXO capacity. Nevertheless, because Litecoin remains a single-file sequential chain rather than a parallel BlockDAG, the moment severed undersea cables reconnect, Nakamoto’s longest-work rule violently orphans and erases 100% of the minority hemisphere’s blocks, burned Scrypt joules, and settled merchant commerce.',
        receipts: ['Zero BFT Halt Threshold', '3.5-Day Retarget (4x Faster Than BTC)', 'Minority Partition Amputation']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Stateless UTXO + Taproot + Cut-Through MWEB',
        score: 0.62,
        quickSummary:
          'Full stateless UTXO + SegWit + Taproot opcode parity with Bitcoin (0.60) PLUS optional MWEB Pedersen-commitment privacy with cut-through pruning and lower custodial fee push-out.',
        paragraph:
          'Litecoin operates the exact same clean, stateless UTXO + SegWit + Taproot + HTLC scripting base as Bitcoin (0.60) free of EVM reentrancy or freeze keys, augmented by optional MimbleWimble Extension Blocks (MWEB) that add confidential Pedersen commitments with cut-through kernel pruning (avoiding unpruneable stealth bloat) and 8x lower base-layer fee pressure—lacking only expressive native L1 covenants.',
        geniusParagraph:
          'Examining Litecoin’s State Machine Topology (0.62 / 1.00, squarely inside the `0.50–0.70` stateless UTXO bracket slightly ahead of Bitcoin’s `0.60`) confirms full opcode parity with Bitcoin’s stateless UTXO, SegWit, Taproot (`BIP-340/341/342`), and HTLC atomic-swap primitives with zero protocol freeze keys, zero state rent, and 8x higher UTXO capacity reducing custodial off-chain push-out. Furthermore, `LIP-0002/0003/0004` (`MWEB`) adds opt-in confidential UTXO fungibility whose Pedersen kernels prune spent intermediate outputs via MimbleWimble cut-through rather than accumulating unpruneable stealth bloat, losing points against `BCH` (`0.80`) and `KAS` (`1.00`) only because Layer 1 lacks expressive native covenants and bounded smart-contract opcodes.',
        receipts: ['Stateless UTXO + Taproot Parity', 'Prunable MWEB Extension Block', 'Lower L1 Custodial Push-Out', 'No Expressive L1 Covenants']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: '0.0067 BPS (150s) • ~56 TPS • Linear Orphan Waste',
        score: 0.35,
        quickSummary:
          '4x faster block cadence (150s) and ~8x higher L1 throughput (~56 TPS) than Bitcoin (0.20), yet still bound to sequential single-chain orphan limits (M < 1.0).',
        paragraph:
          'Compressing Bitcoin’s sequential block timer by 4x down to 150 seconds (~56 TPS) gives Litecoin meaningfully higher Layer-1 settlement velocity than Bitcoin (0.20), though single-parent collisions still discard concurrent PoW (M < 1.0) compared to a 10-BPS BlockDAG.',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.35 / 1.00), Litecoin compresses Satoshi’s 2009 sequential chain parameter by 4x from 600 seconds down to `nPowTargetSpacing = 150` seconds (`0.0067 BPS`) with SegWit + MWEB block capacity clearing ~56 TPS—delivering strictly faster Layer-1 settlement velocity than Bitcoin’s 600-second / ~7 TPS bottleneck (0.20) and avoiding Monero’s 20-minute wallet spend lock (0.25). Nevertheless, because concurrent Scrypt blocks discovered across global fiber-optic propagation latency still collide and get discarded as wasted stale orphans (M < 1.0), Litecoin remains orders of magnitude behind Kaspa’s 10-BPS parallel Proof-of-Work BlockDAG (M = 1.0).',
        receipts: ['150-Second Sequential Blocks (4x BTC)', '~56 TPS L1 Throughput', 'Orphan Waste on Concurrent Blocks']
      }
    ]
  },

  BCH: {
    ticker: 'BCH',
    name: 'Bitcoin Cash',
    consensusFamily: 'LINEAR_POW',
    architecture: 'Elastic-Block SHA-256d Linear PoW (32MB+ ABLA • Layla CashVM • 10-Block Checkpoints)',
    grade: 'C+',
    totalScore: 3.63,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluating Bitcoin Cash (BCH) through the GRADE evidence certainty framework yields a High Certainty rating, empirically verified in the bitcoin-cash-node/bitcoin-cash-node C++ codebase (v29.0.0+), the May 2024 ABLA elastic blocksize activation, CashTokens cross-covenant commitments, the May 15, 2026 "Layla" CashVM upgrade (OP_BEGIN/OP_UNTIL bounded loops, OP_DEFINE/OP_INVOKE functions, bitwise ops, and P2S post-quantum Quantumroot vaults), the <1% minority share of global SHA-256d ASIC hashrate, and src/validation.cpp’s hardcoded -maxreorgdepth=10 / -finalizationdelay=7200 rolling 10-block checkpoint rules. Bitcoin Cash outscores Bitcoin on both State Topology (0.80 vs 0.60) and Velocity (0.38 vs 0.20), but loses heavily on minority SHA-256d Cost Floor security (0.65), rolling-checkpoint Immutability (0.55), and >2-hour partition chain-split Availability (0.40)—scoring 3.63 out of 6.00 for a compliance grade of C+.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: 'Shared 2009 0-Premine Genesis • Rejected 2020 ABC Dev Tax',
        score: 0.85,
        quickSummary:
          'Inherited Bitcoin’s immaculate 2009 zero-premine UTXO genesis and fired Bitcoin ABC in Nov 2020 when ABC tried to impose an 8% coinbase miner tax, losing 0.15 for contentious hardfork governance.',
        paragraph:
          'Bitcoin Cash inherited Satoshi’s January 3, 2009 zero-premine, zero-VC UTXO ledger at block 478,559 (August 1, 2017) with zero admin freeze keys—and proved genuine community immunity in November 2020 by ejecting lead client Bitcoin ABC (now eCash/XEC) when Amaury Séchet attempted to force an 8% coinbase developer tax (IFP), losing 0.15 only for recurring hardfork splits and coordinated annual CHIP upgrade gates.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.85 / 1.00), Bitcoin Cash directly inherited Satoshi Nakamoto’s immaculate January 3, 2009 genesis block and zero-premine, zero-ICO, zero-VC UTXO distribution when forking at block `478,559` on August 1, 2017 to reject SegWit and preserve on-chain scaling. Furthermore, the BCH ecosystem passed a live existential capture test in November 2020: when founding lead client Bitcoin ABC attempted to hardcode an 8% coinbase Infrastructure Funding Plan (IFP) developer tax siphoning miner block subsidies into a corporate address, miners and node operators rebelled en masse onto `bitcoin-cash-node` (`BCHN`), ejecting the taxed fork (rebranded eCash/XEC) and preserving a strictly 0% protocol tax with zero admin freeze keys. Complete honesty deducts 0.15 for recurring contentious hardfork fractures (2018 BSV split, 2020 eCash split) and centralized annual May 15 CHIP upgrade deadlines (`-upgrade2027activationtime` RPC kill-switches).',
        receipts: ['Shared 2009 0-Premine Genesis', '0% Tax (Ejected 2020 ABC 8% IFP)', 'Zero Admin Freeze Keys', 'Contentious Hardfork Split History']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: 'Untaxed SHA-256d (21M Cap) • <1% Minority ASIC Hashrate',
        score: 0.65,
        quickSummary:
          '100% untaxed SHA-256d Proof-of-Work under a 21M cap, but commands <1% of global SHA-256d exahash—leaving >99% of compatible ASICs sitting outside BCH on Bitcoin.',
        paragraph:
          'Every BCH unit is forged via untaxed SHA-256d ASIC energy under a 21,000,000 hard cap (E > 0), yet two structural realities deduct 0.35: first, BCH commands <1% (~0.5%–0.9%) of the global SHA-256d ASIC fleet (meaning >99% of compatible hardware sits on BTC and can rentably overpower BCH without new silicon capex); second, 2017’s flawed Emergency Difficulty Adjustment (EDA) let miners turbo-mint ~120,000 extra blocks ahead of schedule.',
        geniusParagraph:
          'Bitcoin Cash maintains a genuine Thermodynamic Cost Floor (E > 0, scored 0.65 / 1.00): every satoshi under its deterministic 21,000,000 BCH cap is forged exclusively via untaxed SHA-256d ASIC Proof-of-Work with zero zero-joule pre-prints. However, sharing the exact `SHA-256d` hash function with a vastly larger monetary hegemon exposes a severe thermodynamic asymmetry that deducts 0.35: because Bitcoin commands >99% of global SHA-256d exahash while BCH subsists on <1% (~4–8 EH/s vs 700–1,000+ EH/s), adversarial pools already own massive compatible ASIC fleets capable of 51%-overpowering BCH for brief windows at low marginal cost—a vulnerability compounded historically by August–November 2017’s gameable Emergency Difficulty Adjustment (`EDA`), which allowed opportunistic miners to oscillate hashrate and turbo-mine over 120,000 BCH coins ahead of Bitcoin’s emission curve.',
        receipts: ['100% Untaxed SHA-256d PoW', '21,000,000 Hard Cap', '<1% Minority SHA-256d Fleet Share', '2017 EDA ~120k Rapid-Mint Asymmetry']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: 'Plaintext UTXO Supply • 10-Block Rolling Checkpoints',
        score: 0.55,
        quickSummary:
          'Full plaintext UTXO supply auditability from 2009 Genesis, but minority SHA-256d hashrate forced BCHN to hardcode subjective 10-block rolling finalization checkpoints (-maxreorgdepth=10).',
        paragraph:
          'While BCH preserves transparent UTXO supply verification from block zero, surviving as a <1% minority SHA-256d chain after the 2018 BSV hashwar forced client implementations (BCHN src/validation.cpp) to enforce 10-block rolling checkpoints (-maxreorgdepth=10, -parkdeepreorg=1)—abandoning pure Nakamoto heaviest-work finality beyond 10 blocks in favor of subjective local node arrival order.',
        geniusParagraph:
          'On Historical Immutability and the Physical Arrow of Time, Bitcoin Cash scores 0.55 / 1.00. Unlike opaque privacy ledgers or pruned PoS databases, BCH preserves complete plaintext arithmetic auditability of its UTXO supply back to January 3, 2009. However, because <1% minority SHA-256d hash power cannot physically stop a hostile SHA-256d mining pool from secretly mining a heavier shadow chain (as threatened during the November 2018 hashwar and executed defensively during May 2019’s 2-block reorganization), `bitcoin-cash-node` (`src/validation.cpp`) hardcodes **automatic 10-block rolling finalization checkpoints** (`-maxreorgdepth=10`, `-finalizationdelay=7200`, `-finalizeheaders=1`, `-parkdeepreorg=1`). Once a node observes 10 confirmations (~100–120 minutes), it refuses to reorganize onto a competing branch even if that rival branch expended vastly more cumulative Proof-of-Work—subordinating Landauer’s physical energy law to local subjective arrival-time weak subjectivity.',
        receipts: ['Plaintext 2009 UTXO Auditability', 'BCHN -maxreorgdepth=10 Checkpoints', '-parkdeepreorg Subjective Locking', 'Subordinates Heaviest PoW Past 10 Blocks']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: 'ASERT Per-Block DAA • >2h Cut Triggers Permanent Chain Split!',
        score: 0.4,
        quickSummary:
          'ASERT per-block DAA keeps severed continents mining smoothly, but BCHN’s 10-block / 2-hour rolling checkpoint permanently splits West and East into incompatible chains during any >2h cable cut!',
        paragraph:
          'During a brief <90m outage, BCH’s aserti3-2d per-block difficulty keeps isolated continents live before orphaning the minority branch. However, in any wartime fiber cut lasting >2 hours (10 blocks / -finalizationdelay=7200s), BCHN’s -maxreorgdepth=10 rolling checkpoints cause BOTH hemispheres to finalize their own 10th block and ban each other (-finalizeheaderspenalty=100) upon cable resplice—permanently splitting the global ledger!',
        geniusParagraph:
          'Under the stress of a wartime network partition, Bitcoin Cash’s combination of per-block `aserti3-2d` (`ASERT`, 2-day half-life) difficulty retargeting and rolling 10-block finalization produces a dangerous time-bomb that scores 0.40 / 1.00 on Dynamic Availability. During the blackout itself, both isolated continents smoothly adjust difficulty and continue clearing local commerce without BFT supermajority halts. However, `docs.bitcoincashnode.org` exposes what happens when an undersea cable cut lasts longer than **2 hours (`-finalizationdelay=7200` seconds and `-maxreorgdepth=10` blocks)**: both West and East independently mine and locally finalize 10+ blocks on their own side of the severed ocean. The instant undersea fiber is respliced, `-finalizeheaders=1` forces each hemisphere’s nodes to reject the rival hemisphere’s heavier chain below the finalized checkpoint and penalize peers (`-finalizeheaderspenalty=100`)—converting a routine 3-hour cable outage into an **irreconcilable permanent global chain split** requiring manual human `-reindex` coordination!',
        receipts: ['Smooth aserti3-2d Per-Block DAA', '<2h Split: Minority Fork Wiped', '>2h Split (-maxreorgdepth=10): Permanent Fork!', '-finalizeheaderspenalty=100 Peer Ban']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Stateless UTXO + CashTokens + May 2026 Layla CashVM',
        score: 0.8,
        quickSummary:
          'Far ahead of Bitcoin (0.60): stateless parallelizable UTXO upgraded with native CashTokens (2023), BigInt (2025), and May 2026 Layla CashVM loops, functions, P2S, and post-quantum Quantumroot vaults.',
        paragraph:
          'Bitcoin Cash proves how expressive a stateless UTXO topology can be without EVM shared-account bloat, toxic MEV, state rent, or freeze keys: restoring OP_CAT/introspection, shipping native UTXO CashTokens (2023), BigInt & density VM limits (2025), and activating the May 15, 2026 "Layla" CashVM upgrade (OP_BEGIN/OP_UNTIL bounded loops, OP_DEFINE/OP_INVOKE functions, bitwise ops, and Pay-to-Script enabling compact post-quantum Quantumroot vaults)—losing 0.20 only to sequential 600s cross-block contract stepping.',
        geniusParagraph:
          'Examining Bitcoin Cash’s State Machine Topology (0.80 / 1.00) demonstrates why BCH decisively outperforms stripped-opcode Bitcoin (`0.60`) and every shared-account EVM/SVM chain (`0.00`). Retaining Satoshi’s clean, stateless UTXO graph with zero mandatory state rent and zero native `Freeze` or `Clawback` confiscation hooks, BCH systematically restored Layer-1 Script expressiveness across `CashVM`: `OP_CAT` & Schnorr batch verification (2018–2019), native UTXO introspection & cross-covenant `CashTokens` commitments (2022–2023), arbitrary-precision `BigInt` & density-based VM limits (May 2025), and the **May 15, 2026 "Layla" upgrade (`BCHN v29.0.0`)** activating `CHIP-2021-05` bounded loops (`OP_BEGIN`/`OP_UNTIL`), `OP_DEFINE`/`OP_INVOKE` reusable functions, restored bitwise shifts, and standard `Pay-to-Script (P2S)`—enabling 128-bit post-quantum `Quantumroot` vaults directly on Layer 1 that are 15% smaller per UTXO than legacy P2PKH! BCH loses 0.20 against Kaspa (`1.00`) only because trapping UTXO covenants inside a sequential 600s chain limits multi-step shared covenant transitions compared to Kaspa’s 100ms parallel Toccata BlockDAG.',
        receipts: ['Stateless UTXO + Native CashTokens', 'May 2026 Layla CashVM Loops & Functions', 'Post-Quantum Quantumroot L1 Vaults', 'Zero State Rent or Freeze Keys']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: '600s Cadence + 32MB+ Elastic ABLA (100–300+ TPS) + DSProofs',
        score: 0.38,
        quickSummary:
          'Strictly higher velocity than Bitcoin (0.20): May 2024 ABLA elastic 32MB+ blocks clear 100–300+ L1 UTXO TPS alongside 0-conf DSProofs/ZCE, though sequential 600s blocks keep M < 1.0.',
        paragraph:
          'Unlike Bitcoin’s strangled 4MWU (~7 TPS) cap (0.20), Bitcoin Cash activated its Adaptive Blocksize Limit Algorithm (ABLA) in May 2024 above a 32MB floor—clearing 100–300+ native UTXO TPS with Xthinner block compression and cryptographic Double-Spend Proofs (DSProofs) / Zero-Confirmation Escrows for instant retail PoS. However, its single-file 600-second block timer still orphans concurrent PoW (M < 1.0) and trails Kaspa’s 100ms BlockDAG (1.00).',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.38 / 1.00), Bitcoin Cash ranks near the ceiling of what a single-file sequential blockchain can physically achieve—scoring nearly double Bitcoin (`0.20`) and edging out Litecoin (`0.35`). Whereas Bitcoin artificially chokes Layer-1 throughput at ~7 TPS, BCH activated `CHIP-2023-04` (**Adaptive Blocksize Limit Algorithm — ABLA**) in May 2024 to algorithmically expand block capacity above a `32 MB` baseline (`100 to 300+ native UTXO TPS` without fee spikes), paired with `Graphene`/`Xthinner` compact block relay (~99.5% compression) and P2P **Double-Spend Proofs (`DSProofs`)** / **Zero-Confirmation Escrows (`ZCE`)** for sub-second unconfirmed retail point-of-sale UX. Nevertheless, unconfirmed `0-conf` relay is not thermodynamic Proof-of-Work finality: because BCH remains a sequential single-parent chain at `nPowTargetSpacing = 600` seconds, pushing block cadence faster causes linear orphan rates to explode (`M < 1.0`), leaving BCH capped far below Kaspa’s 10-BPS parallel Proof-of-Work BlockDAG (`100ms` PoW blocks, `M = 1.0`).',
        receipts: ['May 2024 ABLA 32MB+ Elastic Blocks', '100–300+ Native L1 UTXO TPS', 'Xthinner + 0-Conf DSProofs / ZCE', '600s Sequential PoW Limit (M < 1.0)']
      }
    ]
  },

  GEEK: {
    ticker: 'GEEK',
    name: 'Geek Protocol (Kaspa KRC-20)',
    consensusFamily: 'BLOCKDAG_POW',
    architecture:
      'Kaspa KRC-20 Fair-Mint Asset + Vercel/Redis Proof-of-Learning HQ (144B Cap • 0 Premint)',
    grade: 'C-',
    totalScore: 2.55,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluating Geek Protocol (GEEK) through the GRADE evidence certainty framework yields a High Certainty rating, empirically verified across Geek Protocol Whitepaper v1.0 (approved November 13, 2026 at main commit 0302dfe01fc6447a74972978649b2b44c98cf5c6), the GEEKProtocol0110/geek-protocol-hq repository, the pinned 144,000,000,000 GEEK KRC-20 Mainnet deployment (0 premint • 100,000 GEEK mint limit • 8 decimals), Figure 1’s Vercel API / Upstash Redis / Kaspa Indexer authority boundary, PR #200’s pending private ranked bank cutover, Issue #216’s proposed KRC-20-to-KCC-20 covenant migration, and the unactivated floor(7F/10) 70/30 fee policy. Because its KRC-20 token launched with 0 premint and anchors transfers inside Kaspa’s 10-BPS PoW BlockDAG while its Proof-of-Learning HQ and token balance views rely on off-chain indexers and founder-administered Redis storage, Geek Protocol scores 2.55 out of 6.00 (01: 0.55, 02: 0.35, 03: 0.55, 04: 0.55, 05: 0.35, 06: 0.20) for a compliance grade of C-.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: '0 Premint KRC-20 • Centralized Founder HQ (Vercel + Redis)',
        score: 0.55,
        quickSummary:
          'The GEEK KRC-20 token launched on Kaspa Mainnet with 0 premint and 0 VC bags, but Geek Protocol HQ’s Proof-of-Learning server, Redis state, and roadmap gates are centrally founder-administered.',
        paragraph:
          'Geek Protocol splits cleanly across two authority domains ("All Hope, No Hype"): on-chain, the GEEK KRC-20 token deployed on Kaspa Mainnet with 0 premint, 0 VC cliffs, 0 ICO, and non-custodial user wallet signing; off-chain, however, Whitepaper v1.0 openly confirms that HQ administration (Vercel API, Upstash Redis, editorial gates, and future treasury signers) is centralized under founder control today with GEEK carrying zero governance rights.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.55 / 1.00), Geek Protocol exhibits a transparent architectural split documented with rare candor ("All Hope, No Hype") in Whitepaper v1.0 at commit `0302dfe01fc6447a74972978649b2b44c98cf5c6`. At the token layer, `GEEK` deployed as a Kaspa Mainnet KRC-20 asset (`144,000,000,000` max cap, `8` decimals, `100,000 GEEK` per mint) with strictly `0` premint, zero venture capital allocations, zero ICO, non-custodial wallet signing (no seed phrases touched by HQ), and Mainnet treasury settlement disabled until independent security audits pass. However, unlike parentless base-layer Kaspa, Geek Protocol HQ (`GEEKProtocol0110/geek-protocol-hq`) is not decoupled from its creator: Section 10 and Section 11 explicitly state that *"Administration is centralized today and GEEK ownership carries no current HQ voting or treasury execution rights,"* relying on founder-operated `Vercel` API functions, `Upstash Redis` state, single-maintainer operational recovery (`bus-factor` continuity still awaiting a verified second maintainer), and external KRC-20 indexers.',
        receipts: [
          '0 Premint / 0 VC Allocation (KRC-20)',
          'Non-Custodial Wallet Mint Flow',
          'Centralized Founder HQ Admin',
          '0 Current Governance Rights'
        ]
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: '0-Premint KAS PoW Mint Fees • 0-Joule Off-Chain PoL',
        score: 0.35,
        quickSummary:
          '100% of circulating GEEK requires spending real Proof-of-Work KAS in KRC-20 fair-mint transactions (E > 0), though Proof of Learning itself is an off-chain server method burning 0 consensus Joules.',
        paragraph:
          'Because GEEK has zero premint, every 100,000-GEEK batch minted toward its 144-billion cap requires broadcasting real Kaspa Mainnet transactions and burning/paying genuine kHeavyHash Proof-of-Work KAS fees (E > 0). However, GEEK is an inscription asset rather than bare-metal ASIC coinbase issuance, and HQ’s Proof-of-Learning XP and Alpha credits are 0-Joule internal Redis records.',
        geniusParagraph:
          'On the Thermodynamic Cost Floor (E > 0, scored 0.35 / 1.00), Geek Protocol clears the zero-joule Proof-of-Stake graveyard because `Premint = 0`: not a single unit of its `144,000,000,000 GEEK` (`14,400,000,000,000,000,000` raw units) cap was conjured for free in a founder JSON file. Every `100,000 GEEK` (`10,000,000,000,000` raw units) fair-minted into existence requires a user wallet to fund and sign real Kaspa Mainnet commit/reveal transactions—expending genuine kHeavyHash Proof-of-Work `KAS` (`E > 0`)—while proposed future platform rewards (`Section 8`) do not inflate supply out of thin air, instead recycling `70%` of collected eligible platform fees (`floor(7F/10)`) and earmarking `30%` (`F - recycle`) for burning. Complete thermodynamic honesty deducts 0.65 because `GEEK` itself does not command dedicated ASIC hash difficulty per token beyond fixed L1 KRC-20 inscription fees, and Section 3 explicitly notes that *"Proof of Learning is an application method"* whose Career XP and Alpha credits live in `Upstash Redis` at `0 Joules`.',
        receipts: [
          'E > 0 KAS PoW Fair-Mint Carrier',
          '144B Cap / 100k Per-Mint Limit',
          'Proposed 70/30 Fee Recycle & Burn',
          '0-Joule Off-Chain Alpha Credits'
        ]
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: 'Kaspa L1 PoW Inscriptions + Off-Chain Indexer & Redis',
        score: 0.55,
        quickSummary:
          'On-chain GEEK inscription envelopes are sealed behind Kaspa’s cumulative kHeavyHash PoW heat wall, but balance views rely on off-chain KRC-20 indexers and Proof-of-Learning receipts sit in mutable Upstash Redis.',
        paragraph:
          'Raw GEEK deploy, mint, and transfer inscriptions are embedded permanently inside Kaspa’s 10-BPS Proof-of-Work BlockDAG, requiring an attacker to re-burn global kHeavyHash ASIC energy to rewrite on-chain history. However, under the immutability rubric (0.50–0.70), off-chain KRC-20 indexer dependence and mutable Upstash Redis manual-export storage for Proof-of-Learning receipts calibrate Geek Protocol at 0.55.',
        geniusParagraph:
          'Geek Protocol scores 0.55 / 1.00 on Historical Immutability and the Physical Arrow of Time (`0.50–0.70` bracket for Layer-1 PoW inscriptions reliant on off-chain state indexers) due to the authority split in Figure 1 between on-chain KRC-20 inscriptions and off-chain application records. Every confirmed `GEEK` KRC-20 `deploy`, `mint`, and `transfer` payload is etched directly into Kaspa Mainnet’s Proof-of-Work BlockDAG—meaning reversing settled on-chain token lineage requires physically re-burning cumulative kHeavyHash ASIC megawatts on Kaspa Layer 1. However, two structural dependencies deduct 0.45: first, Kaspa L1 miners do not natively validate KRC-20 balances (requiring external off-chain KRC-20 indexers until `Issue #216`’s KCC-20 covenant design ships); second, all Proof-of-Learning receipts `R = (player, activity, content version, attempt, accepted choice, server time, rules version, outcome)`, XP, and Quest badges reside in mutable `Upstash Redis` storage under a manual export policy (`Section 11, p. 12`) with zero on-chain cryptographic anchoring.',
        receipts: [
          'Etched in Kaspa L1 PoW BlockDAG',
          'Off-Chain KRC-20 Indexer Parsing',
          'Mutable Upstash Redis App State',
          'Manual DB Export Retention'
        ]
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: 'L1 Transfers Survive • HQ API & Indexer Fail-Closed',
        score: 0.55,
        quickSummary:
          'Self-custodial GEEK L1 inscriptions keep mining across severed continents on Kaspa’s BlockDAG, while HQ’s Vercel API, Upstash Redis, and KRC-20 indexer fail closed during cloud or cable outages.',
        paragraph:
          'During a wartime undersea fiber cut, self-custodial holders can still broadcast raw GEEK KRC-20 transfers directly into surviving local Kaspa L1 miners at 10 BPS without BFT halts. However, Geek Protocol HQ’s Proof-of-Learning quizzes, ranked Gauntlet runs, and indexer-verified mint queues are intentionally designed to fail closed whenever Vercel, Upstash Redis, or the KRC-20 indexer is unreachable.',
        geniusParagraph:
          'Under the stress of a wartime network partition, Geek Protocol achieves 0.55 / 1.00 on Dynamic Availability. Because `GEEK` lives on Kaspa Mainnet rather than a >66.7% BFT Proof-of-Stake chain, raw wallet-to-wallet KRC-20 commit/reveal transactions continue mining across isolated continents via Kaspa’s per-block KIP-0004 DAA and deterministically merge via GHOSTDAG cumulative Blue Work when severed undersea cables reconnect (resolving any cross-partition double-mint or balance race once indexers replay the unified DAG). Conversely, Geek Protocol HQ’s application layer (`Section 4, p. 6`) is a centralized cloud stack (`Vercel` serverless API + `Upstash Redis` + external KRC-20 REST indexer) engineered to **fail closed**: if a cable cut, BGP outage, or cloud takedown severs access to `Redis` or the KRC-20 indexer, ranked Gauntlet attempts, Daily Vault seals, multiplayer lobbies, and HQ’s fair-mint status checks halt rather than degrading into spoofable browser-scored play.',
        receipts: [
          'Kaspa L1 Carrier Never Halts',
          'Blue-Work Inscription Merge',
          'Vercel + Upstash Cloud Chokepoint',
          'Fail-Closed HQ Fault Design'
        ]
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'KRC-20 Inscription Overlay + Redis Locks (KCC-20 Pending)',
        score: 0.35,
        quickSummary:
          'Zero token freeze or clawback keys on Kaspa UTXO inscriptions, but relies on off-chain KRC-20 indexers and centralized Redis state while KCC-20 L1 covenants (#216) and private ranked banks (PR #200) remain unfinished.',
        paragraph:
          'GEEK avoids EVM reentrancy and embeds zero protocol freeze or clawback switches on user wallets. Still, KRC-20 is an indexer-interpreted inscription overlay rather than native L1 UTXO covenants (KCC-20 migration Issue #216 is still in design), ranked question banks were historically exposed in public Git prior to PR #200, and no independent penetration or treasury audit is complete.',
        geniusParagraph:
          'Examining Geek Protocol’s State Machine Topology (0.35 / 1.00) highlights disciplined engineering boundaries paired with Alpha-stage centralization. On the asset side, `GEEK` KRC-20 inscriptions ride Kaspa’s stateless UTXO graph free of EVM shared-account gas wars, mandatory state rent, or native `Freeze`/`Clawback` confiscation hooks. On the application side, `HQ API` enforces server-authoritative deadlines and atomic `Upstash Redis` replay locks so browsers cannot forge scores or double-claim rounds. However, KRC-20 token rules are not yet enforced by Kaspa Layer-1 silicon covenants—the **KRC-20 to KCC-20 covenant migration (`Issue #216`)** leveraging Toccata/SilverScript remains an unapproved design proposal—while Whitepaper Sections 4, 6, and 11 candidly acknowledge that historical competitive question banks were publicly exposed in Git (`PR #200` private ranked bank cutover still pending) and neither the application penetration test nor a Mainnet treasury signer audit has been completed.',
        receipts: [
          'Zero Token Freeze or Clawback Keys',
          'Atomic Redis Replay-Lock Scoring',
          'KCC-20 Covenant Migration Pending (#216)',
          'Public Question Bank Exposure (PR #200)'
        ]
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: '2-Tx Commit/Reveal Over 10-BPS Kaspa + Indexer Lag',
        score: 0.2,
        quickSummary:
          'Rides Kaspa’s 10-BPS (100ms) BlockDAG for rapid base inclusion, but KRC-20 requires two-step commit/reveal UTXOs plus off-chain indexer sync while HQ’s Redis engine contributes 0 PoW Joules.',
        paragraph:
          'Wallet-approved GEEK operations benefit from Kaspa Mainnet’s 100ms parallel BlockDAG cadence without base-layer orphan waste, yet KRC-20 inscriptions require sequential commit-and-reveal transactions, external indexer observation lag, and a bounded 100-request HQ mint queue—while off-chain quiz scoring expends zero consensus hash work.',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.20 / 1.00), Geek Protocol inherits sub-second base-layer transaction visibility from Kaspa’s 10-BPS Crescendo BlockDAG without throttling or orphaning Layer-1 miners, earning partial velocity credit over sluggish linear chains and zero-joule PoS databases. Nevertheless, KRC-20 token operations cannot settle in a single stateless 100ms UTXO hop like native `KAS`: every KRC-20 mint or transfer requires a two-stage commit-and-reveal script sequence, increased transaction storage mass, and downstream KRC-20 indexer parsing latency before balances update (with HQ’s non-custodial fair-mint interface bounding up to 100 queued requests against fresh indexer verification), while HQ’s HTTP-to-Redis Proof-of-Learning state transitions perform zero thermodynamic consensus work (`M = 0` at the app layer).',
        receipts: [
          '100ms Kaspa L1 Carrier Inclusion',
          '2-Step KRC-20 Commit/Reveal Overhead',
          'Downstream KRC-20 Indexer Latency',
          'M = 0 Off-Chain HTTP/Redis Scoring'
        ]
      }
    ]
  },

  IGRA: {
    ticker: 'IGRA',
    name: 'Igra Network (Kaspa Based Rollup)',
    consensusFamily: 'BLOCKDAG_POW',
    architecture: 'Kaspa L1-Sequenced Based EVM Rollup (viaduct + reth • 10B $IGRA PoS Attester Token)',
    grade: 'D+',
    totalScore: 2.3,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluated under the GRADE framework with High Certainty, Igra demonstrates how a 100% pre-allocated token supply triggers the Sovereignty-Compromise & Energy-Arbitrage Law even atop an elite Layer-1 carrier: because Igra posts RLP payloads directly into Kaspa’s 10-BPS BlockDAG, rewriting Igra’s canonical transaction history requires 51%-reorging Kaspa L1 itself (earning high Immutability 0.85 and Availability 0.90), yet pre-allocating all 10 billion $IGRA tokens at 0 Joules fails Sovereignty (0.00), creates an energy arbitrage over L1 miners that caps Cost Floor at 0.15, and caps its terminal compliance grade at D+ (2.30 out of 6.00 — 01: 0.00, 02: 0.15, 03: 0.85, 04: 0.90, 05: 0.25, 06: 0.15).',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: '10B Pre-Allocated $IGRA • Swiss Association & VCs',
        score: 0.0,
        quickSummary:
          'Fails Sovereignty (0.00) and triggers the <=D+ grade cap: although base sequencing rides permissionless Kaspa L1, all 10 billion $IGRA tokens were pre-allocated across the Swiss Association (20%), Team (18%), VCs (10%), and DAO pools.',
        paragraph:
          'Under the canonical sovereignty rubric, any genesis premine, team/VC pre-allocation, or administrative bridge hook scores 0.00 and caps the asset’s terminal grade at D+: while Igra’s transaction sequencing rides permissionless Kaspa L1, its standalone $IGRA token pre-minted 10 billion units across the Zug-based Igra Association (20%), Core Contributors & Advisors (18%), Institutional Investors (10%), and Ecosystem/DAO pools (47%), alongside pause and sender-registry controls on external Hyperlane bridge routes.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.00 / 1.00), Igra fails under the rubric’s zero-tolerance rule against genesis premines and token pre-allocations—triggering the Sovereignty-Compromise Grade Ceiling (<= D+). Although transaction ordering piggybacks on parentless Kaspa Layer 1 (`viaduct`) without a centralized L2 sequencer, the standalone 10,000,000,000 `$IGRA` governance and attester token was 100% pre-allocated at Genesis across the Zug-based Igra Association (20%), Core Contributors & Advisors (18%), Institutional VCs (10%), and DAO/Ecosystem pools (47%), accompanied by administrative pause and sender-registry controls on external Hyperlane cross-chain bridge routes.',
        receipts: ['10B Pre-Allocated $IGRA Supply', 'Swiss Association (20%) + Team (18%)', '10% VC Allocation', 'Bridge Pause / Registry Hooks']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: 'KAS PoW Carrier vs. 10B 0-Joule $IGRA Energy Arbitrage',
        score: 0.15,
        quickSummary:
          'L1 carrier transactions burn real KAS Proof-of-Work, but pre-allocating 10B $IGRA at 0 Joules creates a severe energy arbitrage where zero-work token holders and PoS Attesters benefit from L1 miners’ electricity (0.15).',
        paragraph:
          'Igra splits economics into "KAS for inclusion, $IGRA for execution": posting rollup transactions onto Kaspa L1 burns genuine kHeavyHash Proof-of-Work fees, yet conjuring 10 billion $IGRA tokens at 0 Joules and paying ~15% APY to 400,000-IGRA PoS Attesters creates an energy arbitrage within the cost floor where pre-allocated insiders extract value secured by L1 miners’ hardware work.',
        geniusParagraph:
          'On the Thermodynamic Cost Floor (E > 0, scored 0.15 / 1.00 inside the 0.10–0.35 Energy-Arbitrage & Carrier-Overlay bracket), Igra bifurcates its monetary physics into "KAS for inclusion, $IGRA for execution." Embedding rollup carrier transactions onto Kaspa Layer 1 expends genuine kHeavyHash Proof-of-Work fees in KAS, preventing an automatic E = 0 failure; however, conjuring all 10,000,000,000 `$IGRA` tokens in a genesis file at strictly 0 Joules and distributing pre-minted staking yield (~15% APY) to 400,000-IGRA Proof-of-Stake Attesters creates a textbook thermodynamic energy arbitrage in which zero-work insiders and stakers capture economic rent atop physical security paid for by Layer-1 ASIC miners.',
        receipts: ['Real KAS PoW L1 Carrier Fees', '0-Joule 10B $IGRA Energy Arbitrage', '400,000 IGRA PoS Attester Stake']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: 'Anchored in Kaspa L1 10-BPS PoW Wall',
        score: 0.85,
        quickSummary:
          'Rewriting Igra’s canonical transaction log requires 51%-attacking and reorging Kaspa Layer 1 itself; only external $IGRA-staked state attestations prevent a 1.0.',
        paragraph:
          'Because Igra has no separate L2 validator chain and embeds RLP-encoded transactions directly inside Kaspa Layer-1 payloads, its canonical transaction ordering and data availability inherit Kaspa’s full kHeavyHash ASIC thermal wall—meaning an attacker cannot rewrite Igra history without reorging Kaspa L1 itself, losing 0.15 only for PoS state-root attestations prior to full L1 ZK verification.',
        geniusParagraph:
          'Igra earns 0.85 / 1.00 on Historical Immutability and the Physical Arrow of Time because—unlike standalone Proof-of-Stake sidechains or centralized L2s with separate data-availability committees—Igra embeds RLP-encoded EVM payloads directly inside Kaspa Layer-1 transactions. Consequently, its canonical transaction ordering and data availability are calcified by Kaspa’s full kHeavyHash ASIC thermal wall: rewriting Igra’s ledger history requires 51%-reorging Kaspa Layer 1 itself, losing 0.15 solely for $IGRA-staked PoS state-root attestations on external bridge exits prior to full L1 Zero-Knowledge proof verification.',
        receipts: ['Sequenced Directly in Kaspa L1', 'Protected by Global kHeavyHash PoW', 'Deterministic viaduct + reth Replay', 'PoS Attesters Only on External Exits']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: 'Zero Central Sequencer • Rides Kaspa L1',
        score: 0.9,
        quickSummary:
          'With zero centralized sequencer, Igra inherits Kaspa L1’s partition survival and Selected Parent Chain re-convergence; only external bridge exits stall.',
        paragraph:
          'Standard Ethereum L2s freeze instantly when their single corporate sequencer goes offline. As a true Based Rollup derived locally via kaspad + viaduct + reth from Kaspa’s Selected Parent Chain, anyone on an isolated continent can keep submitting Igra transactions directly to local Kaspa miners and deterministically reconcile post-partition.',
        geniusParagraph:
          'Under a wartime network partition, Igra achieves 0.90 / 1.00 on Dynamic Availability: whereas centralized Ethereum L2 rollups flatline the moment their single corporate sequencer goes offline, Igra operates as a true Based Rollup derived deterministically via `kaspad + viaduct + reth` from Kaspa’s Selected Parent Chain. During an undersea cable cut, isolated continents continue submitting Igra transactions directly to local Kaspa miners at 10 BPS and deterministically re-converge upon cable resplicing without human intervention, losing 0.10 only because external Hyperlane bridge exits pause if PoS Attesters split.',
        receipts: ['No Centralized L2 Sequencer', 'Survives Cable Cuts via Kaspa L1', 'Selected Parent Chain Determinism']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Shared-Account EVM (reth) Over Kaspa UTXO',
        score: 0.25,
        quickSummary:
          'Kaspa’s 100ms parallel blocks strip out single-sequencer front-running, but internal execution still runs a stateful shared-account EVM (reth).',
        paragraph:
          'While multi-proposer 10-BPS Kaspa blocks neutralize classic single-sequencer mempool sandwiching, Igra’s internal state machine executes Solidity bytecode over a monolithic shared-account EVM state trie (reth) rather than stateless native UTXO covenants.',
        geniusParagraph:
          'Examining Igra’s State Machine Topology (0.25 / 1.00) shows that while Kaspa’s 100ms multi-miner BlockDAG strips away single-sequencer mempool censorship and ordering monopolies, Igra’s internal execution environment still runs a monolithic, mutable shared-account EVM state trie (`reth`) subject to Solidity reentrancy attack surfaces, ERC-20 token freeze switches, and shared-contract write contention rather than stateless parallel UTXO covenants.',
        receipts: ['Stateful EVM Account Trie (reth)', '100ms Multi-Miner Anti-MEV Ordering', 'Solidity Reentrancy Surface']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: '10 BPS L1 Carrier • 3,000+ EVM TPS',
        score: 0.15,
        quickSummary:
          'Rides Kaspa’s 10-BPS BlockDAG cadence seamlessly, though $IGRA token consensus itself contributes zero new physical hash work.',
        paragraph:
          'Igra settles EVM execution at sub-second Kaspa BlockDAG cadence without orphaning L1 carrier blocks, earning partial velocity credit for L1 PoW coupling while $IGRA’s staked Attester layer expends zero physical Joules.',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.15 / 1.00), Igra benefits from sub-second 100ms payload inclusion atop Kaspa’s zero-orphan BlockDAG (reaching 3,000+ EVM TPS without throttling base-layer hash work), yet earns only 0.15 because its standalone $IGRA Attester validation layer performs zero physical Proof-of-Work and introduces secondary attestation latency for external cross-chain finality.',
        receipts: ['100ms Kaspa L1 Inclusion', 'Zero L2 Sequencer Bottleneck', '0-Joule $IGRA Staking Layer']
      }
    ]
  },

  LN: {
    ticker: 'LN',
    name: 'Lightning Network (Bitcoin L2)',
    consensusFamily: 'LINEAR_POW',
    architecture:
      'Interactive Off-Chain HTLC/PTLC Payment-Channel Mesh Over 600s Bitcoin L1 (M_LN < M_BTC < 1.0)',
    grade: 'C-',
    totalScore: 2.35,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluating the Lightning Network (LN) through the GRADE evidence certainty framework yields a High Certainty rating, empirically verified across the lightning/bolts specifications, lightningnetwork/lnd, ElementsProject/lightning (CLN), and lightningdevkit/rust-lightning codebases, Flood & Loot mass-exit research (CVE-2020-26895), Antoine Riard’s Replacement Cycling mempool-pinning disclosure (CVE-2023-40231), 2024–2026 self-custodial LSP geo-exits (Phoenix / Wallet of Satoshi), and Bitcoin’s 600s / 4MWU (~7 TPS) base settlement ceiling. Because Bitcoin Layer 1 itself operates at M_BTC < 1.0 (0.20) and off-chain HTLC signature swaps burn 0.0 Joules of Proof-of-Work while encumbering capital in multi-day CLTV/CSV timelocks, Lightning inherently satisfies M_LN < M_BTC < 1.0—scoring 2.35 out of 6.00 (01: 0.70, 02: 0.35, 03: 0.50, 04: 0.35, 05: 0.30, 06: 0.15) for a compliance grade of C-.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: '0 Native Token Premine • Hub-and-Spoke LSP & Custodial Capture',
        score: 0.7,
        quickSummary:
          'Zero native token premine or protocol tax (denominated in native BTC), but heavily centralized around corporate LSP routing hubs and custodial KYC wallets after 2024–2026 self-custodial exits.',
        paragraph:
          'Lightning avoided launching a premined L2 token by denominating channels directly in native Bitcoin across open BOLT specs. However, liquidity physics forced the live network into a hub-and-spoke topology dominated by corporate hubs (ACINQ, LQWD, Kraken, Lightspark, River), and following 2024 US regulatory actions (ACINQ’s Phoenix geo-exit), retail usage overwhelmingly concentrates in custodial KYC wrappers.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.70 / 1.00, inside the `0.45–0.75` overlay bracket), the Lightning Network earns real credit for refusing to print a parasitic L2 governance token: channels across `lightning/bolts` (`lnd`, `Core Lightning`, `Eclair`, `LDK`) denominate strictly in native Bitcoin satoshis with zero premine, zero ICO, and zero protocol coinbase tax. However, capital-routing topology deducts 0.30: because multi-hop routing requires massive pre-funded bilateral capital locks, over half of public channel capacity concentrates inside a tiny oligopoly of Liquidity Service Providers (`LSPs`) and regulated exchange mega-hubs (ACINQ, LQWD, Kraken, Binance, Coinbase/Lightspark, River, Voltage) alongside VC-backed corporate maintainers (`Lightning Labs`, `Blockstream`, `Lightspark`), while 2024–2026 US enforcement actions drove non-custodial wallets like `Phoenix` out of US app stores and pushed retail adoption into custodial databases (`Wallet of Satoshi`, `Strike`, `Cash App`).',
        receipts: [
          '0 Native Token / 0 Premine',
          'Hub-and-Spoke LSP Centralization',
          '2024 Phoenix Self-Custody Geo-Exit',
          'High Custodial Wallet Concentration'
        ]
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: 'BTC PoW Funding Anchor • 0.0 Joules Per Off-Chain Hop',
        score: 0.35,
        quickSummary:
          'Channel funding UTXOs anchor to genuine SHA-256d Proof-of-Work BTC (E > 0), but every off-chain HTLC/PTLC hop burns 0.0 Joules and awards rent strictly to locked capital.',
        paragraph:
          'Every satoshi locked in a 2-of-2 Lightning funding output was forged via Bitcoin SHA-256d Proof-of-Work (E > 0), keeping LN out of the Grade F graveyard. Yet individual off-chain HTLC state updates burn strictly 0.0 Joules of electricity—replacing thermodynamic hash work per payment with zero-joule bilateral IOUs and PoS-style capital-routing fee extraction.',
        geniusParagraph:
          'On the Thermodynamic Cost Floor (E > 0, scored 0.35 / 1.00 inside the `0.15–0.50` carrier-backed overlay bracket), Lightning inherits a real base asset floor because every satoshi locked inside a `BOLT #3` `2-of-2` multisig/Taproot funding UTXO was originally forged via irreversible `SHA-256d` ASIC Proof-of-Work on Bitcoin Layer 1, and opening, splicing, or closing channels expends real L1 PoW fees. However, off-chain Lightning payments themselves expend **0.0 Joules** of competitive Proof-of-Work: exchanging `update_add_htlc` and `commitment_signed` TCP/IP packets creates zero thermodynamic heat barrier per transfer, while routing hubs collect yield strictly proportional to locked capital balances—reintroducing capital-gated rent extraction without contributing a single Joule of hash security back to Bitcoin’s dwindling subsidy budget.',
        receipts: [
          'E > 0 SHA-256d Funding Anchor',
          '0.0 Joules Per Off-Chain HTLC Hop',
          'Capital-Gated Routing Yield',
          'Starves L1 Miner Fee Security'
        ]
      },
      {
        id: '03',
        shortName: 'Historical Immutability & Arrow of Time',
        telemetry: 'Unsettled Off-Chain RAM/DB State + Watchtower Dispute Risk',
        score: 0.5,
        quickSummary:
          'Intermediate channel balances lack Landauer PoW finality—relying on online watchtowers and CSV penalty windows vulnerable to mempool Replacement Cycling (CVE-2023-40231).',
        paragraph:
          'Only channel opens and closes sit behind Bitcoin’s Proof-of-Work wall. All intermediate Lightning balances exist as unbroadcast off-chain promises in local channel.db storage: if a node goes offline or restores a stale backup, counterparties can broadcast revoked states onto L1 unless watchtowers confirm penalty transactions before CSV expiry—broken by Replacement Cycling mempool pinning (CVE-2023-40231).',
        geniusParagraph:
          'Lightning scores 0.50 / 1.00 on Historical Immutability and the Physical Arrow of Time (`0.50–0.70` bracket) because off-chain channel updates possess **zero physical arrow of time** until settled on Layer 1. Whereas an on-chain Proof-of-Work UTXO is sealed irreversibly by cumulative ASIC heat dissipation, an off-chain Lightning balance in `channel.db` is merely an unbroadcast revocable transaction (`BOLT #3` asymmetric commitment with revocation keys). Bitcoin Layer-1 miners cannot distinguish an old revoked state from the latest state; security depends entirely on interactive `Watchtowers` (`wtclient`) spotting a fraudulent close and confirming a `breach-remedy` justice transaction within `to_self_delay` (`CSV`) blocks—a guarantee subverted by mempool fee-spike congestion, **Time-Dilation Eclipse Attacks**, and **Replacement Cycling (`CVE-2023-40231`)**, which allows an attacker to pin and cycle RBF replacements in Bitcoin’s mempool until the HTLC `CLTV` deadline expires.',
        receipts: [
          '0-Joule Mutable Off-Chain State',
          'Online Watchtower Dependency',
          'CVE-2023-40231 Replacement Cycling',
          'Stale DB Restore = Total Penalty Loss'
        ]
      },
      {
        id: '04',
        shortName: 'Dynamic Availability (Wartime Partition)',
        telemetry: 'HTLC Expiry Flood-and-Loot + Resplice Minority Wipeout',
        score: 0.35,
        quickSummary:
          'Wartime fiber cuts break interactive invoice signing, trigger cascading HTLC timeouts that jam Bitcoin’s ~7 TPS L1 with emergency force-closes, and orphan minority-continent settlements on resplice.',
        paragraph:
          'Lightning suffers a triple wartime failure: first, recipients must be online and interactive to sign invoices/updates; second, severing undersea cables freezes cross-continent HTLCs in flight until CLTV timelocks expire, triggering mass unilateral force-closes ("Flood & Loot" CVE-2020-26895) that overwhelm Bitcoin’s ~7 TPS blocks for weeks; third, cable resplicing wipes out 100% of channel opens/closes mined on the minority Bitcoin fork.',
        geniusParagraph:
          'Under the stress of a wartime network partition, Lightning’s interactive architecture degrades to 0.35 / 1.00 on Dynamic Availability. First, unlike stateless Proof-of-Work UTXOs that can receive funds in cold storage without internet access, Lightning requires live interactive bidirectional messaging (`update_add_htlc` / `update_fulfill_htlc`) to settle a single satoshi. Second, when an undersea fiber-optic cable cut severs multi-hop routes mid-flight, unresolved HTLCs hang until their `cltv_expiry` block heights approach—forcing honest nodes on both continents to broadcast emergency unilateral **force-close** commitment transactions onto Bitcoin’s throttled `600s` (`4 MWU` / `~7 TPS`) Layer 1. As proven by Harris & Zohar’s **Flood & Loot (`CVE-2020-26895`)** analysis, simultaneous mass exits saturate Bitcoin blocks for weeks, pricing out anchor-output fee bumps and allowing attackers to steal expired HTLCs. Third, upon cable resplicing, Bitcoin’s `ActivateBestChain` reorganizes and erases 100% of channel opens, splices, force-closes, and justice sweeps mined on the minority continent.',
        receipts: [
          'Mandatory Online Interactive Receiver',
          'CVE-2020-26895 Flood & Loot Mass Exit',
          '~7 TPS L1 Force-Close Congestion Wall',
          'Resplice Wipes Minority L1 Sweeps'
        ]
      },
      {
        id: '05',
        shortName: 'State Machine Topology',
        title: 'State Machine Topology',
        telemetry: 'Stateful Liquidity Channels • Inbound Exhaustion & Hot Keys',
        score: 0.3,
        quickSummary:
          'Replaces stateless UTXOs with stateful bilateral liquidity tubes plagued by inbound capacity exhaustion, 1% channel reserve locks, 24/7 hot-key exposure, and multi-hop routing failures.',
        paragraph:
          'Lightning abandons stateless UTXO simplicity for stateful bilateral tubes: users cannot receive money without pre-purchased inbound liquidity, BOLT #2 locks ~1% channel reserves, unidirectional trade drains corridors, max_accepted_htlcs caps concurrent slots (483 max), and 24/7 online hot keys expose self-custodial operators to server hacks and pinning exploits.',
        geniusParagraph:
          'Examining Lightning’s State Machine Topology (0.30 / 1.00) exposes the severe friction of bolting stateful bilateral payment channels onto a throughput-starved sequential base layer. Rather than transferring stateless, self-contained UTXOs, `BOLT #2` traps capital inside directional two-party tubes: a merchant or citizen cannot receive a single satoshi without pre-funded inbound liquidity (forcing users to rent inbound capacity from corporate LSPs), `channel_reserve_satoshis` permanently locks ~1% of channel balances, `max_accepted_htlcs` (`<= 483`) caps in-flight concurrency per channel (enabling zero-cost **Channel Jamming** griefing attacks), and every autonomous node must keep cryptographic signing keys **hot and online 24/7** alongside complex `anchor_outputs` CPFP fee reserves.',
        receipts: [
          'Inbound Liquidity Exhaustion',
          '483 HTLC Slot Channel-Jamming Vector',
          'Mandatory 24/7 Online Hot Keys',
          '~1% Locked Channel Reserves'
        ]
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: 'M_LN < M_BTC < 1.0 • 0-Joule IOUs Over 600s (~7 TPS) Exit',
        score: 0.15,
        quickSummary:
          'Thermodynamic subordination law: because Bitcoin itself is M_BTC < 1.0 (0.20), Lightning inherently cannot achieve M = 1.0—its sub-second hops are 0-Joule unfinalized IOUs encumbered by multi-day CLTV/CSV locks and a 600s ~7 TPS settlement bottleneck (0.15).',
        paragraph:
          'Claiming Lightning achieves M = 1.0 confuses zero-joule TCP/IP promissory notes with thermodynamic Proof-of-Work finality! Because Bitcoin Layer 1 itself operates at M < 1.0 (0.20 on 600s / ~7 TPS blocks), any overlay anchored to it is strictly bounded below M_BTC (M_LN < M_BTC < 1.0): off-chain HTLC swaps burn 0.0 Joules (deferred credit, not PoW settlement), routed funds suffer multi-hour to 14-day CLTV/CSV spend locks on stuck routes plus 12–15s gossip lag, and real thermodynamic settlement still chokes at ~7 TPS on Layer 1—scoring 0.15.',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.15 / 1.00 under the Carrier-Subordinated Overlay Law `M_overlay < M_L1 < 1.0`), Lightning exposes the classic category error of mistaking **0-Joule off-chain bilateral IOUs** for **Proof-of-Work consensus velocity**. Thermodynamic Velocity `M` measures the fraction of parallel global Proof-of-Work hash energy incorporated into irreversible ledger finality per unit time. Because Bitcoin Layer 1 itself is a sequential single-file chain with `M_BTC < 1.0` (`0.20` on `nPowTargetSpacing = 600s`, `~7 TPS`, discarding concurrent blocks as stale orphans), Lightning **inherently cannot achieve `M = 1.0` or exceed Bitcoin’s `0.20` ceiling**: exchanging revocable `HTLC`/`PTLC` signatures over P2P sockets expends **0.0 Joules** of hash work (`M_offchain = 0`, representing unfinalized counterparty credit rather than settled Proof-of-Work), P2P channel-graph gossip lags `12–15 seconds`, stuck multi-hop routes freeze user capital inside `CLTV`/`CSV` timelocks (`to_self_delay` locking funds from hours up to **2,016 blocks / 14 full days**), and every true thermodynamic settlement (open, splice, or close) remains bottlenecked by Bitcoin’s `600s` ~7 TPS funnel—standing worlds apart from Kaspa’s `10-BPS` parallel Proof-of-Work BlockDAG (`100ms` Layer-1 PoW blocks, `M = 1.0`, zero channel locks).',
        receipts: [
          'M_LN < M_BTC < 1.0 Carrier Ceiling',
          'Off-Chain Signatures = 0.0 J IOUs',
          'Hours-to-14-Day CLTV/CSV Spend Locks',
          '600s / ~7 TPS L1 Settlement Choke'
        ]
      }
    ]
  },

  ZEC: {
    ticker: 'ZEC',
    name: 'Zcash',
    consensusFamily: 'LINEAR_POW',
    architecture: 'Taxed Equihash PoW + Crosslink PoS Roadmap + NEAR Intents Custodial Exit',
    grade: 'D-',
    totalScore: 1.4,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluated under the GRADE framework with High Certainty—anchored by the hardcoded 20% Founders/ZCG/Lockbox coinbase extraction that fails Sovereignty (01: 0.00) and creates a continuous zero-joule energy arbitrage against Equihash miners inside the Cost Floor (02: 0.30), BCTV-14 and May 2026 Orchard Halo 2 infinite-print circuit flaws (03: 0.40), CONSENSUS_MAX_REORG_DEPTH = 99 (~2h split cap) plus Shielded Labs’ Crosslink hybrid-PoS & ZODL’s 3-of-5 NEAR Intents exit freeze (04: 0.30), unpruneable nullifier bloat & viewing-key correlation leaks (05: 0.20), and 75-second sequential PoW encumbered by Halo 2 proving/scanning overhead (06: 0.20)—Zcash scores 1.40 out of 6.00 for a terminal compliance grade of D-.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: '20% Miner Tax • ZCG vs. VC Whale Capture',
        score: 0.0,
        quickSummary:
          'Launched by for-profit Electric Coin Company with a 20% miner coinbase tax, corporate treasury hoarding (Cypherpunk), and a 3-of-5 NEAR bridge multisig.',
        paragraph:
          'Zcash failed sovereignty at its October 2016 corporate Genesis under for-profit Electric Coin Company, siphoning 20% of physical miners’ block rewards for ten years into insider pockets, Zcash Community Grants (~91,500+ ZEC bureaucracy), and the NU6 Lockbox—now locked in a governance war against billionaire VC whales pushing coinholder plutocracy while flagship wallet ZODL routes exits through NEAR Intents’ 3-of-5 admin-upgradable multisig.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.00 / 1.00), Zcash failed at its October 28, 2016 corporate Genesis under Zooko Wilcox’s Delaware for-profit Zerocoin Electric Coin Company (ECC) and the Zcash Foundation. Rather than launching as an unowned cypherpunk protocol, `zcash/zcash` (`src/consensus/funding.cpp` and legacy `vFoundersReward`) hardcoded a mandatory 20% protocol coinbase tax (`MAX_FUNDING_STREAMS`) that confiscated one-fifth of physical miners’ block subsidies for a full decade—routing zero-joule tribute first to ECC founders and early Silicon Valley VCs, then via `ZIP-1014` (`Canopy`) to ECC, the Zcash Foundation, and Zcash Community Grants (`ZCG`, accumulating a ~91,500+ ZEC bureaucratic treasury), and subsequently via `ZIP-1015` / `ZIP-2001` (`NU6`, activated November 2024 at block `2,726,400`) into an on-chain Deferred Dev Fund Lockbox (12% Lockbox + 8% ZCG). Today governance is fractured between foundation committees, Josh Swihart’s ECC spin-out `ZODL` (formerly Zashi), and corporate treasury whales (`Cypherpunk Technologies`), while flagship wallet `ZODL` routes cross-chain exits through `intents.near`—an upgradable contract governed by a 3-of-5 administrative multisig.',
        receipts: ['10-Year 20% Coinbase Miner Tax', 'ECC / ZCG / ZODL VC Capture', 'Cypherpunk Corporate Treasury Hoard', 'NEAR Intents 3-of-5 Multisig Exit']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: '80% Taxed Equihash Energy Arbitrage • Crosslink PoS',
        score: 0.3,
        quickSummary:
          'Compromised by coinbase energy arbitrage (0.30): Equihash miners burn real electricity for 80% of rewards while non-mining insiders siphon 20% at 0 Joules and engineer Crosslink hybrid PoS.',
        paragraph:
          'Bare-metal Equihash ASICs expend real electricity under a 21M cap, yet protocol insiders confiscate 20% of every block reward at 0 Joules—creating a direct thermodynamic energy arbitrage where people expending zero work dilute unit joule backing and extract the work of miners, while Shielded Labs builds Crosslink hybrid Proof-of-Stake and a 60% miner fee clawback.',
        geniusParagraph:
          'On the Thermodynamic Cost Floor (E > 0, scored 0.30 / 1.00 inside the `0.10–0.35` Energy-Arbitraged Proof-of-Work bracket), Zcash retains a non-zero hardware Proof-of-Work baseline—avoiding an automatic 0.00 Grade F—because live mainnet block production (`ZcashFoundation/zebra` and `zcashd`) still requires irreversible electrical megawatt dissipation across dedicated `Equihash(200,9)` ASIC hardware (such as Bitmain Antminer Z15 Pro fleets) under a nominal 21,000,000 ZEC supply cap. However, Zcash systematically corrodes that physical floor via institutionalized energy arbitrage: hardcoded consensus funding streams (`ZIP-1014` / `ZIP-1015`) siphon 20% of every newly mined coinbase subsidy at strictly 0 Joules into Dev Fund / Lockbox / ZCG pools so non-mining insiders continuously extract value forged by miners’ electricity, while Winklevoss-backed `Shielded Labs` engineers the `Crosslink` hybrid Proof-of-Stake upgrade and the Network Sustainability Mechanism (`NSM`, `ZIP-233`/`ZIP-234`) to divert rewards to zero-joule stakers and claw back 60% of miners’ transaction fees.',
        receipts: ['20% 0-Joule Coinbase Energy Arbitrage', 'Crosslink Hybrid-PoS Transition', 'NSM 60% Miner Fee Clawback']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: 'BCTV-14 & Orchard Halo 2 Print Bugs',
        score: 0.4,
        quickSummary:
          'Shattered 21M supply auditability twice at 0 Joules via BCTV-14 (CVE-2019-7167 Sprout) and the May 2026 Orchard Halo 2 counterfeiting flaw.',
        paragraph:
          'Physical hash work cannot protect a ledger whose opaque zero-knowledge circuits permit silent infinite counterfeiting at 0 Joules. Twice in ten years, Zcash suffered critical soundness bugs: first in the BCTV-14 Sprout circuit flaw (CVE-2019-7167) and again in May 2026 when an under-constrained elliptic-curve multiplication flaw inside Orchard Halo 2—live on mainnet for four years—forced emergency patches and the July 2026 NU6.3 Ironwood pool quarantine just to check supply integrity.',
        geniusParagraph:
          'Zcash scores 0.40 / 1.00 on Historical Immutability and the Physical Arrow of Time because cumulative `Equihash(200,9)` Proof-of-Work heat dissipation cannot safeguard monetary integrity when opaque zk-SNARK circuits allow an adversary to silently counterfeit infinite supply inside shielded pools at 0 Joules without ever 51%-reorging the chain. Twice in a single decade, Zcash’s cryptographic soundness failed catastrophically: first via `CVE-2019-7167`, a transcript-elements soundness bug in the `BCTV-14` proving system from the 2016 `Sprout` trusted-setup ceremony that sat live on mainnet for over two years allowing undetected infinite ZEC creation until secretly patched in `Sapling`; and second in May 2026, when researchers uncovered a critical under-constrained elliptic-curve scalar multiplication flaw inside `zcash/orchard`’s trustless `Halo 2` circuit (live since `NU5` in May 2022)—forcing emergency node updates and the July 2026 `NU6.3` (`Ironwood`) turnstile pool quarantine just to bound shielded pool balances, compounded by `zcashd`’s hardcoded `MaxReorgDepth = 99` block rollback ceiling.',
        receipts: ['BCTV-14 Infinite Print Bug', 'May 2026 Orchard Halo 2 Flaw', 'NU6.3 Ironwood Pool Quarantine', 'Opaque Shielded Supply Audits']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: 'Linear Orphan Wipe + Crosslink / NEAR BFT Freeze',
        score: 0.3,
        quickSummary:
          'Linear PoW amputates minority continents on reconnect, Crosslink adds a PoS finality halt wall, and ZODL’s NEAR Intents exit freezes six-figure user swaps.',
        paragraph:
          'Base Equihash chains violently orphan minority partitions upon reconnection, Crosslink subordinates finality to a synchronous BFT staker quorum that halts during partitions, and ZODL’s NEAR Intents cross-chain rail already proved censurable in peacetime—freezing $589,000+ in user swaps behind centralized market-maker intervention.',
        geniusParagraph:
          'Under the stress of a wartime network partition, Zcash scores just 0.30 / 1.00 on Dynamic Availability due to stacked consensus, rollback-cap, and custodial bridge failure modes. While `Blossom` (`ZIP-208`) per-block `Digishield v3` difficulty averaging (`PoWAveragingWindow = 17` blocks) allows isolated Equihash hemispheres to keep mining during short fiber cuts, `zcashd` enforces a strict 100-block reorganization cap (`CONSENSUS_MAX_REORG_DEPTH = 99`, ~2 hours at 75s blocks)—meaning any transoceanic cable cut exceeding ~2 hours causes both hemispheres to permanently reject each other’s chains upon resplice, whereas shorter cuts violently orphan 100% of the minority continent’s blocks! Worse still, Shielded Labs’ `Crosslink` gadget introduces a synchronous `>2/3` BFT Proof-of-Stake finality layer that stalls globally during 33.4% stake splits, and `ZODL`’s primary cross-chain liquidity rail (`NEAR Intents`) already froze `$589,000+` in peacetime user swaps behind off-chain market-maker solver intervention.',
        receipts: ['Linear Reorg Amputation', '100-Block (~2h) MaxReorg Split Horizon', 'Crosslink PoS Halt Vulnerability', '$589K+ Frozen on NEAR Intents']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Append-Only Nullifier Bloat + Viewing-Key Leak',
        score: 0.2,
        quickSummary:
          'Unprunable shielded nullifier sets bloat forever while outsourcing swaps to NEAR Intents leaks viewing-key linkability onto NEAR’s public ledger.',
        paragraph:
          'Shielded transactions require monotonically growing, unprunable global nullifier sets to prevent double-spends, and lacking native Layer-1 covenants, ZODL outsourced liquidity to NEAR Intents—forcing users into transparent t-address hops or public NEAR correlation that undermines Orchard’s post-quantum viewing-key privacy.',
        geniusParagraph:
          'Examining Zcash’s State Machine Topology (0.20 / 1.00) exposes severe cryptographic fragmentation across four incompatible value pools (`Transparent` UTXOs, deprecated `Sprout`, `Sapling`, and `Orchard` action descriptions) alongside permanent state-growth liabilities. Because every shielded spend reveals a cryptographic `nullifier` (`nf`) without identifying which note commitment (`cm`) in the Sinsemilla / Pedersen Merkle tree was spent, every full validator (`zebrad`) must store the entire monotonically growing global nullifier set across Sapling and Orchard in RAM/SSD forever without pruning—and spam attacks in 2022 (`sandblasting` shielded outputs) bloated node databases by tens of gigabytes until `ZIP-317` marginal fee patches throttled usage. Furthermore, lacking expressive native Layer-1 covenants (`ZSA` custom assets repeatedly delayed), flagship wallet `ZODL` outsourced swap execution to `NEAR Intents`, forcing shielded users through transparent `t-address` deposit/refund hops and timing/amount correlation on NEAR’s public ledger.',
        receipts: ['Unprunable Global Nullifier Set', '2022 Sandblasting Bloat / ZIP-317', 'No Native L1 Programmable Covenants', 'NEAR Public Ledger Linkability Leak']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: '75s Sequential Chain + Heavy Halo 2 Overhead (M < 1.0)',
        score: 0.2,
        quickSummary:
          '75-second Blossom sequential block cadence (8x faster interval than 600s chains) is offset by linear orphan waste (M < 1.0), heavy Halo 2 proof/scanning overhead, and ZIP-317 shielded limits (~6–25 TPS).',
        paragraph:
          'Calibrated under the monotonic velocity rubric (0.20–0.30): Zcash’s 75-second block interval (ZIP-208 Blossom, 2MB cap) confirms blocks 8x faster than 600-second chains on transparent transfers, but single-parent orphan collisions (M < 1.0), heavy Orchard Halo 2 proving and wallet trial-decryption lag, and ZIP-317 logical-action fee ceilings throttle shielded throughput to ~6–25 TPS—landing at 0.20.',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.20 / 1.00 inside the `0.20–0.30` rubric bracket for faster sequential PoW encumbered by heavy zero-knowledge proof/scanning overhead), Zcash runs a 75-second single-parent block timer (`nPowTargetSpacing = 75` since `ZIP-208` Blossom, `0.0133 BPS`, `2 MB` block cap) where concurrent Equihash blocks across global latency collide as wasted orphans (`M < 1.0`). While its 75-second cadence is 8x faster than Bitcoin’s 600-second timer on transparent UTXO transfers (~26 TPS), every shielded `Orchard` (`Halo 2`) and `Sapling` (`Groth16`) action imposes elliptic-curve accumulation, wallet note-trial-decryption scanning delays, and `ZIP-317` marginal logical-action limits (~6–25 shielded TPS)—offsetting its faster clock to match Bitcoin’s `0.20` while trailing Kaspa’s stateless 10-BPS parallel BlockDAG (`100ms`, `M = 1.0`).',
        receipts: ['Sequential 75s Linear Chain (2MB Cap)', 'Concurrent PoW Orphaned (M < 1.0)', 'Heavy Halo 2 / Wallet Trial-Decryption Lag', '~6–25 Shielded TPS Ceiling']
      }
    ]
  },

  ALGO: {
    ticker: 'ALGO',
    name: 'Algorand',
    consensusFamily: 'ZERO_JOULE_BFT',
    architecture: 'Pure Proof-of-Stake (BA* BFT • 10B Premine • 1,000-Round Pruning)',
    grade: 'F',
    totalScore: 0.0,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluated under the GRADE framework with High Certainty—from its 10-billion zero-joule corporate Genesis premine and 45-minute (1,000-round) non-archival history deletion to BA*’s >66.7% partition flatline, mandatory reserve locks, and native Layer-1 ASA Freeze and Clawback confiscation keys—Algorand scores 0.00 out of 6.00 for a terminal compliance grade of F.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: '10B Premine • Algorand Inc. & Foundation',
        score: 0.0,
        quickSummary:
          '100% of the 10-billion ALGO supply was conjured at Genesis by for-profit Algorand Inc. (2B ALGO), the Algorand Foundation, and permissioned Relay VC insiders.',
        paragraph:
          'Algorand failed sovereignty in June 2019 when Boston-based for-profit Algorand Inc. and the Singapore Algorand Foundation printed all 10 billion ALGO in a genesis file—handing 2 billion directly to Algorand Inc., 500 million to the Foundation, and 2.5 billion to early VCs and permissioned Relay ("Repeater") operators.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.00 / 1.00), Algorand failed in June 2019 when Boston-based for-profit Algorand Inc. and the Singapore-registered Algorand Foundation conjured all 10,000,000,000 ALGO out of thin air in a genesis configuration file—allocating 2 billion ALGO directly to Algorand Inc., 500 million to the Foundation, and 2.5 billion to venture syndicates and permissioned Relay ("Repeater") node operators that formed a two-tier infrastructure backbone.',
        receipts: ['10B Genesis Config Premine', '2B ALGO to For-Profit Algorand Inc.', '2.5B VC / Relay Insider Deals', 'Two-Tier Repeater Hierarchy']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: '0 Joules • Pure Proof-of-Stake (30k ALGO Gate)',
        score: 0.0,
        quickSummary:
          'VRF sortition selects committees strictly by token balance at 0 Joules, paying treasury-subsidized yield above a 30,000 ALGO threshold with zero slashing.',
        paragraph:
          'Advertising itself as "carbon-negative" is an open confession that Algorand burns 0 Joules of Proof-of-Work. Pure Proof-of-Stake weights votes strictly by pre-printed token balances, gating solo staking rewards behind a 30,000 ALGO capital wall with zero lockup and zero slashing.',
        geniusParagraph:
          'Algorand completely violates the Thermodynamic Cost Floor (E > 0, scored 0.00 / 1.00): its Pure Proof-of-Stake Verifiable Random Function (VRF) cryptographic sortition weights block proposal and committee voting strictly by pre-printed token balances at strictly 0 Joules of Proof-of-Work, gating solo consensus rewards behind a 30,000 ALGO capital threshold with zero lockup and zero slashing risk while dripping treasury subsidies to premined whales.',
        receipts: ['E = 0 Joules Expended', '10B Zero-Cost Token Mint', '30,000 ALGO Solo Staking Wall', 'Zero Slashing / Zero Lockup']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: '45-Min (1,000-Round) Node Pruning + Catchpoints',
        score: 0.0,
        quickSummary:
          'Standard non-archival nodes delete history older than 1,000 rounds (~45 minutes), forcing blind trust in Foundation Catchpoints after a 60-minute outage.',
        paragraph:
          'Algorand seals blocks with weightless VRF signatures and automatically deletes blocks older than 1,000 rounds (~45 minutes) on standard non-archival nodes. If the internet fractures for just 60 minutes, isolated nodes exceed their 45-minute memory buffer and are forced to blindly trust centralized Foundation "Catchpoint" snapshots.',
        geniusParagraph:
          'Algorand fails Historical Immutability and the Physical Arrow of Time (0.00 / 1.00) because blocks are sealed via weightless VRF signatures and standard non-archival `algorand/go-algorand` nodes hardcode a 1,000-round (~45-minute) rolling pruning horizon—blinding nodes after any 60-minute network partition and forcing them to abandon trustless genesis verification in favor of centralized Foundation "Catchpoint" snapshots served by a handful of corporate Archivers.',
        receipts: ['0-Joule VRF Signatures', 'Deletes History After 1,000 Rounds (~45m)', 'Centralized Foundation Catchpoints', 'Handful of Corporate Archivers']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: 'BA* Halts Globally Below 66.7% Stake',
        score: 0.0,
        quickSummary:
          'Because BA* mathematically refuses to fork and requires >66.7% online stake every 2.8s round, isolating 33.4% of stake triggers instant global cardiac arrest.',
        paragraph:
          'Algorand’s "never forks" marketing hides a lethal CAP-theorem trade-off: Byzantine Agreement (BA*) requires >66.7% online participating stake across proposal, soft-vote, and cert-vote steps. Severing an undersea cable isolating 33.4% of stake freezes the entire planet at 0 TPS.',
        geniusParagraph:
          'Under a wartime network partition, Algorand’s BA* non-forking consensus destroys Dynamic Availability (0.00 / 1.00): because every ~2.8-second round requires a synchronous >66.7% online stake supermajority across proposal, soft-vote, and cert-vote phases, severing an undersea cable that isolates 33.4% of stake triggers instant planetary cardiac arrest at 0 TPS—and any outage lasting past 45 minutes wipes standard nodes’ 1,000-round peer sync buffer.',
        receipts: ['Mandatory >66.7% BA* Quorum', 'Instant Global Cardiac Arrest at 33.4% Split', '60m Outage Breaks 45m Peer Sync']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Global Accounts + Native Freeze & Clawback',
        score: 0.0,
        quickSummary:
          'Sequential AVM global accounts enforce mandatory 0.1 ALGO reserve locks, permissioned ASA opt-ins, and native Layer-1 ASA Freeze and Clawback confiscation keys.',
        paragraph:
          'Engineered as a CBDC prototype, Algorand runs sequential AVM global accounts that lock 0.1 ALGO per wallet plus 0.1 ALGO per asset opt-in, forbid receiving tokens without prior opt-in, and hardcode Layer-1 Freeze and Clawback addresses to seize assets straight out of user wallets without private keys.',
        geniusParagraph:
          'Examining Algorand’s State Machine Topology (0.00 / 1.00) exposes a CBDC-oriented global account model that executes sequentially over shared state, enforces mandatory `0.1 ALGO` minimum balance locks per wallet and per asset opt-in, forbids receiving assets without prior opt-in, and bakes native Layer-1 `Freeze` and `Clawback` administrative confiscation keys directly into every Algorand Standard Asset (ASA).',
        receipts: ['Native L1 Asset Clawback Keys', 'Native L1 Asset Freeze Switches', 'Mandatory 0.1 ALGO Reserve Locks', 'Permissioned Asset Opt-In']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: 'M = 0 • Sequential Single-Proposer Slots',
        score: 0.0,
        quickSummary:
          'Single-proposer 2.8s database slots burn zero physical energy, yielding a thermodynamic velocity ratio of M = 0.',
        paragraph:
          'Rotating a single VRF-elected block proposer every ~2.8 seconds at zero energetic cost produces a permissioned compliance rail rather than parallel thermodynamic settlement—scoring M = 0.',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.00 / 1.00), Algorand rotates a single VRF-selected block proposer every ~2.8 seconds across permissioned Relay servers while expending strictly 0 Joules of Proof-of-Work—yielding a thermodynamic work-efficiency ratio of M = 0 and operating as a centralized CBDC messaging database rather than a parallel Proof-of-Work BlockDAG settling concurrent UTXOs at 10+ BPS (M = 1.0).',
        receipts: ['M = 0 Thermodynamic Work', 'Single-Proposer Slot Bottleneck', 'CBDC Compliance Architecture']
      }
    ]
  },

  PI: {
    ticker: 'PI',
    name: 'Pi Network',
    consensusFamily: 'ZERO_JOULE_BFT',
    architecture: 'Centralized stellar-core Fork (SocialChain Inc. • 100B Mint • Biometric KYC/KYB)',
    grade: 'F',
    totalScore: 0.0,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluated under the GRADE framework with High Certainty—from SocialChain Inc.’s 100-billion zero-joule stellar-core genesis mint and 20-billion insider cut to fake ad-monetized mobile "mining," mandatory biometric KYC/KYB gates, and Core Team SuperNode centralization—Pi Network scores 0.00 out of 6.00 for a terminal compliance grade of F.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: 'SocialChain Inc. • 20B Insider Cut • Biometric KYC',
        score: 0.0,
        quickSummary:
          'Owned by Palo Alto for-profit SocialChain Inc., which minted 100B PI (20B Core Team cut), runs all live consensus SuperNodes, and enforces biometric KYC/KYB gates.',
        paragraph:
          'Pi Network is owned and operated by VC-backed Palo Alto corporation SocialChain Inc., which pre-minted all 100 billion PI in a forked stellar-core genesis wallet (taking 20B PI for the Core Team), operates all live consensus-validating SuperNodes even after Protocol 28, and forces users and exchanges through biometric facial/ID KYC and corporate KYB whitelisting.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.00 / 1.00), Pi Network is wholly owned and operated by VC-backed Palo Alto for-profit SocialChain Inc., which pre-minted all 100,000,000,000 PI in a forked `stellar-core` genesis wallet (carving out 20 billion PI for the Core Team), operates every live consensus-validating SuperNode on mainnet, and forces both retail users and exchanges through mandatory biometric facial/ID KYC and corporate KYB whitelisting.',
        receipts: ['For-Profit SocialChain Inc.', '100B Genesis Mint (20B Core Team)', 'Core Team Runs All SuperNodes', 'Mandatory Biometric KYC & KYB']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: '0 Joules • Ad-Supported Phone Tap Illusion',
        score: 0.0,
        quickSummary:
          'Tapping a smartphone screen once every 24 hours before watching video ads computes zero hashes and burns 0 Joules.',
        paragraph:
          'Pi perpetrated semantic deception by calling a daily smartphone button-tap followed by full-screen video ads "mining." Zero cryptographic hashes are computed on user phones; all 100 billion PI were pre-printed at 0 Joules and distributed via MLM referral multipliers while harvesting ad revenue and biometrics.',
        geniusParagraph:
          'Pi Network completely violates the Thermodynamic Cost Floor (E > 0, scored 0.00 / 1.00): tapping a smartphone button once every 24 hours before watching in-app video advertisements computes zero cryptographic hashes and dissipates 0 Joules of Proof-of-Work, distributing a 100-billion zero-cost genesis mint via MLM referral multipliers while monetizing user attention and biometric data.',
        receipts: ['0 Hashes Computed on Phones', 'E = 0 Joules Pre-Printed Supply', 'In-App Video Ad Monetization', 'MLM Referral Multipliers']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: 'Forked stellar-core • 0-Joule Core Team Quorums',
        score: 0.0,
        quickSummary:
          'Forked Stellar FBA closes ~5s slots via weightless Core Team signatures while community desktop nodes hold zero live voting power.',
        paragraph:
          'As a direct fork of stellar-core, Pi closes ledgers using weightless Federated Byzantine Agreement signatures anchored solely to SocialChain Inc.’s permissioned validator cluster—leaving desktop community nodes powerless while the Core Team retains unilateral authority to freeze migrations or rewrite archives at 0 Joules.',
        geniusParagraph:
          'Pi Network fails Historical Immutability and the Physical Arrow of Time (0.00 / 1.00) because its forked `stellar-core` ledger closes ~5-second slots via weightless Federated Byzantine Agreement signatures controlled exclusively by SocialChain Inc.’s central SuperNode cluster while community desktop nodes carry zero consensus voting weight and the Core Team retains unilateral authority to freeze migrations or alter balances at 0 Joules.',
        receipts: ['Forked stellar-core Codebase', '0-Joule FBA Signatures', 'Desktop Nodes Have 0 Vote Weight', 'Unilateral Migration Freezes']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: 'Halts Globally If Core Team Servers Isolate',
        score: 0.0,
        quickSummary:
          'Because every SCP quorum slice intersects exclusively at SocialChain Inc.’s central servers, isolating the Core Team cluster instantly halts the entire planet.',
        paragraph:
          'Federated Byzantine Agreement halts whenever quorum intersection is lost, and in Pi Network the quorum intersection is literally SocialChain Inc.’s central SuperNode cluster—meaning a cloud takedown or severed cable isolating Palo Alto servers freezes every wallet worldwide.',
        geniusParagraph:
          'Under a wartime network partition, Pi Network’s Dynamic Availability collapses to 0.00 / 1.00: because every Stellar Consensus Protocol (SCP) quorum slice intersects solely at SocialChain Inc.’s Palo Alto SuperNode cluster, severing connectivity to Core Team servers instantly freezes transaction settlement and wallet access across the entire planet.',
        receipts: ['Centralized Core Team Quorum Hub', 'Instant Global Halt on Server Cut', 'Zero Autonomous Peer Settlement']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Stellar Accounts + Soroban Locks + Clawbacks',
        score: 0.0,
        quickSummary:
          'Inherits Stellar’s base reserve locks, sequential Soroban read/write footprint declarations, authorization gates, and native issuer clawback flags.',
        paragraph:
          'Inheriting Stellar’s global account database and Soroban Wasm contracts, Pi forces mandatory minimum wallet reserves, aborts colliding footprint transactions inside ~5s slots, embeds native authorization/clawback flags, and traps hundreds of thousands of users in centralized migration queues.',
        geniusParagraph:
          'Examining Pi Network’s State Machine Topology (0.00 / 1.00) reveals an inherited Stellar global account database and Soroban Wasm runtime enforcing mandatory minimum wallet reserves, rigid read/write footprint collision aborts inside ~5-second slots, native issuer authorization/clawback flags, and centralized KYC migration bottlenecks.',
        receipts: ['Mandatory Account Base Reserves', 'Native Stellar Auth & Clawback Flags', 'Centralized KYC Migration Bottlenecks']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: 'M = 0 • Corporate SQL-to-Stellar Database',
        score: 0.0,
        quickSummary:
          'Closing ~5-second database slots across corporate servers at zero energy expenditure yields M = 0.',
        paragraph:
          'Sequentially updating a permissioned corporate Stellar fork at 0 Joules delivers zero thermodynamic velocity (M = 0)—functioning as an ad-tech surveillance database rather than sovereign money.',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.00 / 1.00), Pi Network sequentially updates a permissioned corporate `stellar-core` fork in ~5-second server slots while expending strictly 0 Joules of Proof-of-Work—yielding M = 0 and operating as an ad-monetized surveillance database rather than a high-velocity Proof-of-Work BlockDAG (M = 1.0).',
        receipts: ['M = 0 Thermodynamic Work', 'Sequential ~5s Server Slots', 'KYB-Walled Ecosystem']
      }
    ]
  },

  XLM: {
    ticker: 'XLM',
    name: 'Stellar',
    consensusFamily: 'ZERO_JOULE_BFT',
    architecture: 'Federated Byzantine Agreement (SCP • Tier-1 Corporate Cartel • CAP-0077 Quorum Freeze)',
    grade: 'F',
    totalScore: 0.0,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluated under the GRADE framework with High Certainty—from its 100B zero-joule genesis mint, 2.25B XLM counterfeiting exploit, 55B unilateral SDF supply burn, and 17B SDF treasury overhang to its 67-minute May 2019 global quorum blackout, Tier-1 corporate whitelisting, and Protocol 26’s CAP-0077 on-chain Quorum Freeze—Stellar scores 0.00 out of 6.00 for a terminal compliance grade of F.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: '100B Mint • 17B SDF Stash • Tier-1 Corporate Cartel',
        score: 0.0,
        quickSummary:
          'Forked from rippled with 100B pre-printed XLM, governed by SDF (~17B XLM stash after burning 55B) and KYC-identified Tier-1 corporate validators.',
        paragraph:
          'Founded in 2014 as a Stripe-seeded rippled fork conjuring 100 billion XLM at Genesis, Stellar operates as a discretionary corporate bank: SDF unilaterally burned 55B XLM in 2019 yet still holds ~17B XLM, while live consensus is controlled by SEP-20 KYC-identified Tier-1 corporations including SDF, Franklin Templeton, MoneyGram, Blockdaemon, and Lobstr.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.00 / 1.00), Stellar launched in 2014 as a Stripe-seeded ($3M / 2B XLM) `rippled` fork conjuring 100,000,000,000 XLM out of thin air at Genesis; the Stellar Development Foundation (SDF) unilaterally burned 55 billion XLM in November 2019 yet still controls ~17 billion XLM while live consensus rests inside a SEP-20 KYC-identified Tier-1 corporate cartel (SDF, Franklin Templeton, MoneyGram, Blockdaemon, and Lobstr).',
        receipts: ['100B Genesis Config Mint', '55B Unilateral Burn / ~17B SDF Stash', 'SEP-20 Corporate Tier-1 Validators', 'Stripe $3M / 2B XLM Seed Deal']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: '0 Joules • SCP Proof-of-Agreement + 2.25B Bug',
        score: 0.0,
        quickSummary:
          'Burns 0 Joules and locks zero stake; in 2017 an attacker exploited a merge bug to counterfeit 2.25 billion XLM out of thin air at zero cost.',
        paragraph:
          'Stellar’s Federated Byzantine Agreement expends 0 Joules of Proof-of-Work and requires zero staked capital at risk. Detaching money from physics proved catastrophic in 2017 when an attacker exploited a stellar-core account-merge bug to silently mint 2.25 billion counterfeit XLM at zero cost—covered up via an SDF treasury burn.',
        geniusParagraph:
          'Stellar violates the Thermodynamic Cost Floor (E > 0, scored 0.00 / 1.00) because Federated Byzantine Agreement expends 0 Joules of Proof-of-Work and bonds zero staked capital at risk—an absence of physical verification that proved catastrophic in 2017 when an attacker exploited a `stellar-core` account-merge bug to silently counterfeit 2.25 billion XLM out of thin air at zero energetic cost.',
        receipts: ['E = 0 Joules Expended', 'Zero Staked Capital / Zero Rewards', '2017 2.25B XLM Counterfeit Print']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: '2014 Chain Wipe + Corporate S3 History Archives',
        score: 0.0,
        quickSummary:
          'Wiped and rebooted its early 2014 ledger after a consensus failure and relies on weightless 5-minute Amazon S3 corporate History Archives.',
        paragraph:
          'Stellar’s original 2014 network fractured and ran on a single SDF node before wiping onto stellar-core in 2015, leaving early genesis records erased from explorers. Today, live state sits in SQL/BucketList caches while historical verification relies on HTTP/Amazon S3 History Archives published every 64 ledgers by Tier-1 corporations at 0 Joules.',
        geniusParagraph:
          'Stellar fails Historical Immutability and the Physical Arrow of Time (0.00 / 1.00): its original 2014 ledger fractured onto a single SDF node and was wiped onto `stellar-core` in 2015, erasing early genesis history from explorers, while modern nodes verify history via 0-Joule HTTP/Amazon S3 History Archives published every 64 ledgers (~5 minutes) by Tier-1 corporate validators.',
        receipts: ['Dec 2014 Single-Node Halt & Reboot', '0-Joule Federated Checkpoints', 'Amazon S3 Corporate History Archives']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: '67-Minute May 2019 Global Quorum Blackout',
        score: 0.0,
        quickSummary:
          'SCP halts the entire planet whenever Tier-1 Quorum Intersection fractures—proven on May 15, 2019 when Stellar froze worldwide for 67 minutes.',
        paragraph:
          'SCP explicitly sacrifices liveness during partitions: on May 15, 2019, validator dropouts broke quorum overlap and froze the entire global Stellar network for 67 minutes with zero transactions settled—which SDF defended by stating "financial institutions prefer downtime over inconsistent data."',
        geniusParagraph:
          'Under a wartime network partition, Stellar’s SCP consensus destroys Dynamic Availability (0.00 / 1.00): any undersea cable cut severing Tier-1 Quorum Intersection freezes global settlement immediately, as proven in peacetime on May 15, 2019 when validator dropouts paralyzed the entire Stellar network worldwide for 67 minutes—which SDF defended by admitting that "financial institutions prefer downtime over inconsistent data."',
        receipts: ['May 15, 2019 67-Min Global Halt', 'Halts on Quorum Intersection Loss', 'US/EU Fiber Cut Freezes Finality']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'CAP-0077 Validator Quorum Freeze + Clawbacks',
        score: 0.0,
        quickSummary:
          'Enforces base XLM reserves, Soroban TTL state rent, native issuer clawbacks, and Protocol 26’s CAP-0077 Quorum Freeze to lock arbitrary user wallets.',
        paragraph:
          'Stellar locks mandatory XLM reserves (1 XLM base + 0.5 XLM per trustline), evicts Soroban contracts that stop paying TTL rent, embeds AUTH_REVOCABLE and AUTH_CLAWBACK_ENABLED seizure flags, and in May 2026’s Protocol 26 activated CAP-0077 (Quorum Freeze)—giving Tier-1 validators a native on-chain switch to freeze any user wallet or smart contract with a VIP bypass list.',
        geniusParagraph:
          'Examining Stellar’s State Machine Topology (0.00 / 1.00) exposes mandatory XLM base and trustline reserves (`1 XLM` base + `0.5 XLM` per trustline), Soroban TTL state-rent eviction, native `AUTH_REVOCABLE` and `AUTH_CLAWBACK_ENABLED` asset seizure flags, and Protocol 26’s `CAP-0077` Quorum Freeze—granting Tier-1 validators a native on-chain switch to freeze any user wallet or smart contract with a VIP bypass list.',
        receipts: ['Protocol 26 CAP-0077 Quorum Freeze', 'AUTH_CLAWBACK_ENABLED Asset Seizure', 'Mandatory Trustline XLM Reserves', 'Soroban TTL State Rent Eviction']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: 'M = 0 • 5s Corporate Database Slots',
        score: 0.0,
        quickSummary:
          'Closing 5-second federated database slots across corporate servers at zero energy expenditure yields M = 0.',
        paragraph:
          'Coordinating 5-second account updates among ~7 Tier-1 corporate organizations at zero energetic cost achieves M = 0—operating as a permissioned banking intranet with built-in confiscation switches.',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.00 / 1.00), coordinating ~5-second account ledger updates across a handful of Tier-1 corporate servers while burning strictly 0 Joules of Proof-of-Work achieves zero thermodynamic velocity (M = 0)—functioning as a permissioned banking intranet rather than a parallel Proof-of-Work BlockDAG settling concurrent UTXOs at 10+ BPS (M = 1.0).',
        receipts: ['M = 0 Thermodynamic Work', '5-Second Federated Slots', 'Rigid Soroban Footprint Locks']
      }
    ]
  },

  SUI: {
    ticker: 'SUI',
    name: 'Sui',
    consensusFamily: 'ZERO_JOULE_BFT',
    architecture: 'Mysticeti BFT DPoS (~110 Validators • 10B Premine • Keyless Seizure Patch)',
    grade: 'F',
    totalScore: 0.0,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating, as every architectural failure—from the 10-billion zero-joule genesis premine and VC insider allocations to S3 snapshot pruning, Mysticeti’s 2f+1 partition halt threshold, the May 2025 TransactionDenyConfig freeze and transaction_allow_list_skip_all_checks keyless asset seizure, and the November 2024, January 2026, and May 2026 mainnet blackouts—is empirically verifiable in the MystenLabs/sui Rust codebase, governance records, and official incident postmortems. Sui scores a 0 out of 6 across all thermodynamic invariants, resulting in a terminal compliance grade of F.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: 'Mysten Labs • 10B Premine • Keyless Asset Seizure',
        score: 0.0,
        quickSummary:
          'Ex-Meta Novi corporate chain with a 10B VC/Foundation premine whose ~110 validators froze $162M in May 2025 and shipped code to seize funds without private keys.',
        paragraph:
          'Born out of Facebook’s Diem project under Mysten Labs ($336M+ VC funding) with a 10-billion SUI genesis premine split across Foundation, Mysten, and VCs, Sui shattered every pretense of self-custody in May 2025 (Cetus): validators blacklisted wallets via TransactionDenyConfig to freeze $162M and shipped transaction_allow_list_skip_all_checks to confiscate funds by stake vote without a private-key signature.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.00 / 1.00), Sui failed at Genesis. Architected by Palo Alto-based for-profit Mysten Labs (founded by former Meta Novi executives) and governed alongside the Cayman Islands-registered Sui Foundation, the network raised over $336 million from venture syndicates including a16z crypto, Jump Crypto, Apollo, Binance Labs, and Franklin Templeton, and conjured all 10,000,000,000 SUI out of thin air in a configuration file—routing 50% into Sui Foundation reserves while carving up the remaining 50% among Mysten Labs, early insiders, and VCs. Live consensus is restricted to ~110 enterprise validators requiring data-center hardware and tens of millions of staked SUI. During the May 2025 Cetus DEX exploit, the Sui Foundation centrally coordinated with validators to blacklist addresses via local TransactionDenyConfig files (freezing $162 million) and Mysten Labs shipped custom protocol code (transaction_allow_list_skip_all_checks) enabling a validator stake vote to forcibly seize self-custodial wallets without a private-key signature.',
        receipts: ['10B Genesis Config Premine', '$336M+ VC Insider Allocations', 'May 2025 TransactionDenyConfig Freeze', 'Keyless Signature-Bypass Seizure Code']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: '0 Joules • DPoS Staking Yield & Cliff Unlocks',
        score: 0.0,
        quickSummary:
          'All 10 billion SUI were conjured in a configuration file at 0 Joules, funneling staking subsidies to VC/Foundation unlocks through 2030.',
        paragraph:
          'Sui’s Delegated Proof-of-Stake expends 0 Joules of Proof-of-Work; every unit of its 10B cap was created for free at Genesis, allowing insiders and Foundation reserves to harvest staking yield on pre-printed allocations while diluting retail through 2030.',
        geniusParagraph:
          'This administrative omnipotence rests upon a total violation of the Thermodynamic Cost Floor (E > 0, scored 0.00 / 1.00). Sui operates on Delegated Proof-of-Stake (DPoS), selecting validator voting weight strictly according to staked token balances across 24-hour epochs without expending a single joule of irreversible Proof-of-Work. Every atomic unit of its 10-billion SUI supply cap was printed at a physical cost of strictly 0 Joules—institutionalizing a textbook Cantillon extraction engine where insiders, venture funds, and the Foundation stake pre-printed treasury allocations to harvest liquid staking subsidies and dump zero-cost yield onto retail buyers across monthly cliff unlocks stretching to 2030.',
        receipts: ['E = 0 Joules Expended', '10B Pre-Printed Supply', 'Cantillon Staking Yield Extraction']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: 'Aggressive Epoch Pruning + Mysten S3 Snapshots',
        score: 0.0,
        quickSummary:
          'Seals epochs with 0-Joule validator signatures, prunes historical object states after a few epochs, and forces S3 cloud snapshot syncs.',
        paragraph:
          'Sui certifies checkpoints via weightless DPoS signatures, aggressively prunes historical object versions to survive Move state bloat—forcing nodes onto Mysten Labs Amazon S3 snapshots—and proved in May 2025 that a 2/3 validator vote can rewrite ownership rules retroactively.',
        geniusParagraph:
          'Because Sui completely severs state finality from irreversible heat dissipation, it catastrophically fails Historical Immutability and the Physical Arrow of Time (0.00 / 1.00). State transitions are sealed every epoch via weightless digital signatures on CertifiedCheckpointSummary records, while aggressive multi-epoch pruning of historical object versions and transaction effects forces newly syncing nodes to abandon trustless genesis verification and download centralized State Snapshots hosted on Amazon S3 and cloud buckets operated by Mysten Labs—all while the May 2025 Cetus upgrade proved that a two-thirds validator supermajority can rewrite cryptographic ownership rules retroactively by decree.',
        receipts: ['0-Joule Checkpoint Signatures', 'Aggressive Multi-Epoch State Pruning', 'Mysten Amazon S3 State Snapshots']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: '2f+1 Halt Wall • 3 Global Halts May 28–30, 2026',
        score: 0.0,
        quickSummary:
          'Mysticeti BFT halts below 66.7% stake and crashed repeatedly in peacetime: Nov 2024 (2.5h), Jan 2026, and THREE global blackouts across May 28–30, 2026 (~7h).',
        paragraph:
          'Requiring >66.7% (2f+1) stake quorum, Sui flatlines during any 33.4% cable split—and routinely crashes itself in peacetime, suffering a 2.5h halt in Nov 2024, a Jan 2026 stall, and three separate global mainnet halts across May 28–30, 2026 (including a ~7h outage from a v1.72 gas underflow and stalled DKG epoch handoff).',
        geniusParagraph:
          'Under the stress of a wartime network partition, Sui’s Mysticeti Byzantine Fault Tolerant (BFT) consensus destroys Dynamic Availability (0.00 / 1.00) by explicit mathematical design: requiring a strict supermajority quorum exceeding two-thirds (>66.7%, or 2f+1) of staked voting weight causes global settlement to flatline immediately if a severed undersea cable isolates data centers holding just 33.4% of staked SUI. In peacetime, Sui routinely halts itself—freezing completely for 2.5 hours in November 2024 due to a validator crash loop, stalling over a consensus bug in January 2026, and suffering three separate global mainnet blackouts across May 28–30, 2026 (including a nearly seven-hour blackout triggered by a v1.72 gas-logic underflow bug and a stalled Distributed Key Generation randomness handoff at an epoch boundary).',
        receipts: ['Nov 2024 (2.5h) & Jan 2026 Outages', '3 Global Blackouts May 28–30, 2026', 'v1.72 Gas Bug & DKG Epoch Stall', '2f+1 Partition Cardiac Arrest']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Shared-Object Lock Contention + RegulatedCoin Freeze',
        score: 0.0,
        quickSummary:
          'All real DeFi uses shared objects that funnel into sequential locks, ConsensusOverloadChecker TX cancellations, Storage Fund rent, and RegulatedCoin freeze keys.',
        paragraph:
          'While single-owner transfers skip consensus, every DEX pool, order book, and lending market is a shared object forced through sequential Mysticeti locks, where hot-pool spikes trigger ConsensusOverloadChecker post-consensus cancellations alongside mandatory Storage Fund locks and native RegulatedCoin freeze lists.',
        geniusParagraph:
          'Examining Sui’s State Machine Topology (0.00 / 1.00) exposes the marketing sleight of hand behind its Move Virtual Machine "object-centric" parallelism: while simple transfers of single-owner objects bypass full consensus, all meaningful global financial coordination—DEX liquidity pools, order books, lending markets, and bridges—relies on shared objects that funnel straight back through Mysticeti consensus sequencing and sequential per-object read/write locks. Whenever trading volume spikes on a hot shared pool, Sui imposes local congestion pricing and relies on a hardcoded ConsensusOverloadChecker that actively cancels already-sequenced user transactions post-consensus, all while forcing users to lock SUI into a state-rent Storage Fund and baking native RegulatedCoin freeze switches into Layer 1.',
        receipts: ['Shared-Object Sequential Contention', 'ConsensusOverloadChecker Cancellations', 'Mandatory Storage Fund Rent', 'Native RegulatedCoin Deny-Lists']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: 'M = 0 • Zero-Joule BFT Gossip Graph ("Fake DAG")',
        score: 0.0,
        quickSummary:
          'Hijacks the "DAG" label to describe weightless BFT message gossip among ~110 corporate servers burning 0 Joules (M = 0).',
        paragraph:
          'Mysticeti is not a Nakamoto Proof-of-Work BlockDAG; it is a permissioned BFT message-passing graph among ~110 data-center servers expending zero physical energy—yielding M = 0.',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.00 / 1.00), Sui hijacks the "DAG" label to confuse investors into equating Mysticeti—a permissioned BFT message-passing graph among ~110 enterprise data-center servers expending strictly 0 Joules of physical energy (M = 0)—with a true Nakamoto Proof-of-Work BlockDAG. A zero-joule server cluster that cancels congested shared-object trades via ConsensusOverloadChecker and crashed three times in a single weekend stands as the polar opposite of Kaspa’s stateless, contention-free Proof-of-Work BlockDAG, where 100% of open, concurrent global hash power settles parallel UTXO state transitions natively on Layer 1 at 10+ blocks per second without validator blacklists, signature-bypass confiscations, or partition halts (M = 1.0).',
        receipts: ['M = 0 Thermodynamic Work', '~110 Enterprise Server Cartel', 'Zero-Joule BFT Gossip Graph']
      }
    ]
  },

  STX: {
    ticker: 'STX',
    name: 'Stacks',
    consensusFamily: 'ZERO_JOULE_BFT',
    architecture: 'Proof-of-Transfer PoS Sidechain (1.32B Premine + SIP-031 500M Print + 15-Signer sBTC)',
    grade: 'F',
    totalScore: 0.0,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluated under the GRADE framework with High Certainty—from Blockstack PBC’s 1.32B genesis premine, SIP-031’s July 2025 500M zero-joule STX inflation print, and the permissioned 15-custodian sBTC multisig to Clarity’s interpreted MARF bottlenecks and the May 2025 (7h 41m) and July 2025 (5h+) 70% Signer stalls—Stacks scores 0.00 out of 6.00 for a terminal compliance grade of F.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: '1.32B Blockstack Premine • 15-Custodian sBTC Multisig',
        score: 0.0,
        quickSummary:
          'SEC-registered Blockstack PBC corporate chain with a 1.32B STX premine, Epoch 4.0 pause-admin key, and an 11-of-15 institutional custodian multisig holding sBTC.',
        paragraph:
          'Founded as Blockstack PBC ($90M+ VC/Reg D/SEC Reg A+ sales) with 1.32 billion STX pre-minted at Genesis across Hiro, Trust Machines, and insiders, Stacks locks its flagship sBTC inside a permissioned 11-of-15 institutional custodian multisig (BitGo, Blockdaemon, Figment, Kiln) and embeds a "pause admin" switch in Epoch 4.0 (pox-5).',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.00 / 1.00), Stacks launched as SEC-registered Blockstack PBC ($90M+ VC, Reg D, and SEC Reg A+ token sales) with 1,320,000,000 STX pre-minted at Genesis across Hiro, Trust Machines, and insiders, locks flagship `sBTC` inside a permissioned 11-of-15 institutional custodian multisig (BitGo, Blockdaemon, Figment, Kiln), and embeds an Epoch 4.0 (`pox-5`) "pause admin" switch capable of halting PoX operations by administrative key.',
        receipts: ['1.32B Genesis Config Premine', 'SEC Reg A+ Corporate Security', '11-of-15 Federated sBTC Multisig', 'Epoch 4.0 pox-5 "Pause Admin" Key']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: '0 Joules PoX + SIP-031 500M STX Inflation Print (∞ Cap)',
        score: 0.0,
        quickSummary:
          'Proof of Transfer computes zero hashes (recycling existing BTC to STX whales), and July 2025’s SIP-031 shattered the supply cap to print 500M new STX at 0 Joules.',
        paragraph:
          'Proof of Transfer (PoX) computes zero Proof-of-Work hashes—merely transferring already-mined BTC straight into genesis STX whales’ pockets—and in July 2025 insiders passed SIP-031 to shatter the 1.818B cap and print 500 million brand-new STX at 0 Joules for the centralized Stacks Endowment, rendering max supply infinite (∞).',
        geniusParagraph:
          'Stacks violates the Thermodynamic Cost Floor (E > 0, scored 0.00 / 1.00): Proof of Transfer (`PoX`) computes zero Proof-of-Work hashes—merely recycling already-mined BTC straight into genesis STX stakers’ pockets—and in July 2025 insiders passed `SIP-031` to shatter the 1.818-billion supply cap and conjure 500,000,000 brand-new STX at strictly 0 Joules for the centralized Stacks Endowment, rendering maximum supply infinite (∞).',
        receipts: ['0 Hashes Computed (E = 0 Joules)', 'PoX = PoS Yield Transfer in Orange', 'July 2025 SIP-031 500M STX Print', 'Max Supply Reclassified Infinite (∞)']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: 'Bitcoin Verifies 0 Bytes of Stacks State • 0-Joule Signers',
        score: 0.0,
        quickSummary:
          '"100% Bitcoin Finality" is semantic sleight of hand: Bitcoin L1 verifies zero Clarity contracts or sBTC balances while 0-Joule STX Signers approve state.',
        paragraph:
          'Bitcoin Layer-1 nodes treat Stacks hashes as opaque data blobs and verify zero bytes of Stacks balances or Clarity execution; actual validation rests on weightless Nakamoto STX Signers pruning local tenure DBs to 100 burn-blocks (MAX_FORK_DEPTH) while 11 corporate custodians hold the BTC vault.',
        geniusParagraph:
          'Stacks fails Historical Immutability and the Physical Arrow of Time (0.00 / 1.00): marketing "100% Bitcoin Finality" is semantic sleight of hand because Bitcoin Layer-1 nodes treat Stacks commitments as opaque data blobs and verify zero bytes of Clarity execution or `sBTC` balances, leaving state validity entirely to weightless Nakamoto STX Signers pruning local tenure DBs to 100 burn-blocks (`MAX_FORK_DEPTH`) while 11 corporate custodians hold the underlying BTC vault.',
        receipts: ['Bitcoin Verifies 0 Bytes of STX State', '0-Joule Nakamoto STX Signers', '100-Block Signer Tenure Pruning']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: '70% Signer Halt Wall • May & July 2025 Multi-Hour Outages',
        score: 0.0,
        quickSummary:
          'Requires >=70% stacked STX Signers; stalled globally for 7h 41m on May 23, 2025 and 5h+ on July 8, 2025 when just two large Signers dropped offline!',
        paragraph:
          'Requiring >=70% stacked STX Signer quorum—even more fragile than 66.7% PoS—Stacks freezes if 30.1% disconnects, and repeatedly flatlined in peacetime while Bitcoin L1 kept mining: stalling 7h 41m on May 23, 2025 and 5h+ on July 8, 2025 when just two large Signers stopped signing after a routine 1-block BTC reorg.',
        geniusParagraph:
          'Under a wartime network partition, Stacks’ $\\ge 70\\%$ stacked STX Signer quorum destroys Dynamic Availability (0.00 / 1.00): isolating 30.1% of Signer weight freezes all STX blocks and `sBTC` redemptions globally while Bitcoin L1 keeps mining underneath—proven in peacetime on May 23, 2025 (7h 41m global stall) and July 8, 2025 (5h+ stall) when just two large Signers dropped offline after a routine 1-block BTC reorg.',
        receipts: ['>=70% Signer Halt Threshold', 'May 23, 2025: 7h 41m Global Halt', 'July 8, 2025: 5h+ Stall (2 Signers!)']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Interpreted Clarity + 5D Block Budgets + ALEX Exploits',
        score: 0.0,
        quickSummary:
          'Interprets raw Clarity source code at runtime inside sequential single-leader MARF state, choking under 5D block budgets while suffering multi-million ALEX drains.',
        paragraph:
          'Clarity interprets raw source code at runtime—even charging more gas for longer variable names—inside a monolithic MARF account tree throttled by strict five-dimensional block budgets behind a single tenure miner, while still failing to stop the $4.3M (2024) and $8.3M–$16.2M (June 2025) ALEX Protocol exploits.',
        geniusParagraph:
          'Examining Stacks’ State Machine Topology (0.00 / 1.00) exposes runtime-interpreted Clarity contracts (charging extra gas for longer variable names) executed sequentially over a monolithic MARF account tree throttled by strict five-dimensional block budgets behind a single tenure miner, alongside the $4.3M (2024) and $8.3M–$16.2M (June 2025) ALEX Protocol exploits.',
        receipts: ['Runtime-Interpreted Clarity Bottleneck', '5-Dimensional Block Budget Chokepoint', 'Sequential Single-Miner MARF Locks', '2024 & June 2025 ALEX Drains']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: 'M = 0 • Zero-Joule Sidechain Parasitic on 10m BTC',
        score: 0.0,
        quickSummary:
          'Single-leader zero-joule sidechain bolted onto Bitcoin’s 10-minute cadence yields M = 0.',
        paragraph:
          'Operating a zero-joule, single-leader PoS sidechain riding atop Bitcoin’s 600-second linear clock generates zero new thermodynamic work (M = 0).',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.00 / 1.00), Stacks operates a zero-joule, single-leader Proof-of-Stake sidechain anchored to Bitcoin’s 600-second sequential burn-block clock—expending zero physical hash work (M = 0) and bottlenecking settlement behind a 15-custodian Signer quorum rather than parallel Layer-1 BlockDAG execution (M = 1.0).',
        receipts: ['M = 0 Thermodynamic Work', 'Single-Leader Tenure Queue', '15-Custodian Bridge Dependency']
      }
    ]
  },

  ETH: {
    ticker: 'ETH',
    name: 'Ethereum',
    consensusFamily: 'ZERO_JOULE_BFT',
    architecture: 'Proof-of-Stake + MEV-Boost Builder Cartel + Centralized L2 Sequencers',
    grade: 'F',
    totalScore: 0.0,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluated under the GRADE framework with High Certainty—from its 72M genesis premine, 2016 DAO rollback, and September 2022 abandonment of Proof-of-Work to Lido/Coinbase staking capture, OFAC-filtering MEV-Boost builders, May 2023 Casper finality stalls, and centralized L2 sequencers—Ethereum scores 0.00 out of 6.00 for a terminal compliance grade of F.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: '72M Premine • EF + Lido/Coinbase + MEV Cartel',
        score: 0.0,
        quickSummary:
          'Launched with a 72M ETH premine (~60% supply), rolled back the chain in 2016, and concentrates block building and staking in regulated cartels.',
        paragraph:
          'Ethereum conjured 72 million ETH at Genesis for ICO buyers, insiders, and the Swiss Ethereum Foundation, proved mutable via the 2016 DAO bailout hardfork, and today concentrates consensus across liquid-staking/custodial giants while two MEV-Boost builders construct >80% of blocks.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.00 / 1.00), Ethereum conjured 72,000,000 ETH (~60% of initial supply) at Genesis for ICO buyers, insiders, and the Swiss Ethereum Foundation, proved discretionary mutability via the July 2016 DAO bailout irregular state transition hardfork, and concentrates block construction inside a two-builder MEV-Boost cartel (>80% of mainnet blocks) alongside regulated liquid-staking giants and centralized L2 sequencer multisigs.',
        receipts: ['72,000,000 ETH Genesis Premine', '2016 DAO Bailout Rollback', '>80% Duo MEV-Boost Builder Cartel', 'Centralized L2 Sequencer Multisigs']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: '0 Joules Post-Merge PoS • Discretionary Policy',
        score: 0.0,
        quickSummary:
          'Severed its ledger from physical energy in September 2022 (The Merge), replacing thermodynamic work with 0-Joule perpetual yield for 32-ETH stakers.',
        paragraph:
          'With EIP-3675 (The Merge) in September 2022, Ethereum voluntarily destroyed its Proof-of-Work cost floor (E = 0 Joules), enshrining a Cantillon Proof-of-Stake regime with no hard supply cap and six monetary-policy changes in ten years.',
        geniusParagraph:
          'With EIP-3675 (The Merge) in September 2022, Ethereum voluntarily severed its ledger from the Thermodynamic Cost Floor (E = 0 Joules, scored 0.00 / 1.00), replacing bare-metal Ethash Proof-of-Work with 0-Joule Proof-of-Stake issuance gated behind a `32 ETH` capital wall with no hard supply cap and six discretionary monetary-policy rewrites in ten years.',
        receipts: ['E = 0 Joules Post-Merge PoS', 'No Hard Maximum Supply Cap', '32-ETH Capital Gatekeeping']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: 'Weak Subjectivity Checkpoints + EIP-4444 Expiry',
        score: 0.0,
        quickSummary:
          'Explicitly requires trusted social Weak Subjectivity checkpoints to sync safely and prunes historical block/blob data via EIP-4444 and EIP-4844.',
        paragraph:
          'Zero-joule validator signatures force Ethereum to rely on social Weak Subjectivity checkpoints against long-range attacks while EIP-4844 deletes L2 blobs after ~18 days and EIP-4444 offloads historical pre-Merge history to third-party portals.',
        geniusParagraph:
          'Ethereum fails Historical Immutability and the Physical Arrow of Time (0.00 / 1.00): zero-joule BLS validator signatures force newly syncing nodes to rely on trusted social Weak Subjectivity checkpoints to defeat long-range stake attacks, while EIP-4844 deletes L2 blobs after ~18 days and EIP-4444 prunes historical pre-Merge block bodies onto third-party portals.',
        receipts: ['Weak Subjectivity Checkpoints', '18-Day EIP-4844 Blob Deletion', 'EIP-4444 History Expiry']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: 'Casper FFG Finality Halts Below 66.7% Stake',
        score: 0.0,
        quickSummary:
          'Casper FFG epoch finality freezes below 66.7% stake (as seen twice in May 2023) and bleeds isolated validators via quadratic Inactivity Leak.',
        paragraph:
          'Isolating 33.4% of staked ETH immediately freezes Casper FFG finality—already triggered on mainnet in May 2023—activating a quadratic Inactivity Leak that slashes offline partitioned validators until irreconcilable forks split.',
        geniusParagraph:
          'Under a wartime network partition, Ethereum’s Casper FFG consensus destroys Dynamic Availability (0.00 / 1.00): isolating 33.4% of staked ETH immediately freezes epoch finality (already triggered twice on mainnet in May 2023) and activates a punitive quadratic Inactivity Leak that bleeds isolated validators until permanent irreconcilable forks diverge.',
        receipts: ['May 2023 Mainnet Finality Stalls', '66.7% Casper FFG Quorum Wall', 'Punitive Quadratic Inactivity Leak']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Sequential EVM Shared Trie • Toxic MEV & L2 Fragmentation',
        score: 0.0,
        quickSummary:
          'Single-threaded global EVM state trie breeds toxic MEV sandwich extraction, reentrancy hacks, ERC-20 blacklists, and fragmented centralized L2 rollups.',
        paragraph:
          'Every EVM transaction mutates a shared global Merkle Patricia Trie sequentially, creating billions in MEV sandwich extraction and forcing scaling off Layer 1 onto fragmented, multisig-governed single-sequencer L2s.',
        geniusParagraph:
          'Examining Ethereum’s State Machine Topology (0.00 / 1.00) exposes a single-threaded shared global Merkle Patricia Trie that forces concurrent DeFi transactions into sequential execution, billions in toxic MEV sandwich extraction, ERC-20 admin `blacklist`/`freeze` switches, and fragmented single-sequencer Layer-2 rollups.',
        receipts: ['Sequential Global EVM State Locks', 'Billions in Toxic MEV Sandwiching', 'Centralized Single-Sequencer L2s']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: 'M = 0 • 12s Single-Proposer PoS Slots (~15 L1 TPS)',
        score: 0.0,
        quickSummary:
          '12-second single-proposer zero-joule slots cap Layer 1 at ~15–20 TPS with M = 0.',
        paragraph:
          'Electing one validator every 12 seconds at zero energetic expenditure throttles Layer 1 to ~15 TPS and yields a thermodynamic velocity ratio of M = 0.',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.00 / 1.00), Ethereum elects a single block proposer every 12 seconds via RANDAO at strictly 0 Joules of Proof-of-Work—throttling Layer 1 to ~15–20 TPS, requiring ~13 minutes (2 epochs) for Casper FFG finality, and yielding a thermodynamic work-efficiency ratio of M = 0 compared to Kaspa’s 10-BPS parallel BlockDAG (M = 1.0).',
        receipts: ['M = 0 Thermodynamic Work', '12-Second Single-Proposer Slots', '~15 TPS Base Layer Bottleneck']
      }
    ]
  },

  SOL: {
    ticker: 'SOL',
    name: 'Solana',
    consensusFamily: 'ZERO_JOULE_BFT',
    architecture: 'Proof-of-History + Tower BFT PoS (500M Premine • Multi-Outage History)',
    grade: 'F',
    totalScore: 0.0,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating, as every architectural failure—from the 500-million zero-joule genesis premine, the April/May 2020 11.36-million SOL hidden market-maker wallet scandal and burn, the August 2024 secret v1.18.21 70% stake patch, and the August 2026 Kraken-decided SIMD-0550 vote to the 0 Joule single-threaded PoH clock, --limit-ledger-size 2-to-3-day history pruning, Google Cloud solana-bigtable archival dependency, the August 12, 2026 Teraswitch 29%-stake outage near-miss, the seven full cluster halts culminating in the February 6, 2024 slot 246,464,040 LoadedPrograms blackout, Vote111111111111111111111111111111111111111 TPS padding, AccountInUse write-lock contention, and Token-2022 PermanentDelegate confiscation hooks—is empirically verifiable in the anza-xyz/agave and solana-labs/solana Rust codebases, SIMD governance records, and official incident postmortems. Solana scores a 0 out of 6 across all thermodynamic invariants, resulting in a terminal compliance grade of F.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: '500M Genesis Premine • ~48% VC & Insider Allocation',
        score: 0.0,
        quickSummary:
          'Launched with 500M pre-printed SOL (~48% insiders, VCs, Solana Labs & Foundation) and subsidizes validator voting costs via Foundation delegation.',
        paragraph:
          'Architected by for-profit Solana Labs and the Solana Foundation, Solana conjured 500 million SOL at Genesis—handing nearly half to private VCs (including FTX/Alameda), founders, and corporate treasuries while industrial data-center hardware requirements centralize validation.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.00 / 1.00), Solana failed at Genesis. Architected by San Francisco-based for-profit Solana Labs (alongside engineering spin-off Anza) and governed alongside the Geneva-registered Solana Foundation, the network raised hundreds of millions from venture syndicates (Multicoin, a16z, Polychain, FTX/Alameda) and conjured 500,000,000 SOL out of thin air in a genesis configuration file (~48% to insiders, VCs, and Labs; 52% to Foundation reserves). One month later in April 2020, sleuths exposed an undeclared hidden wallet holding 11.36M SOL loaned to a market maker—forcing a May 2020 burn of 11,365,067 SOL—while August 2024 saw a secret patch (`v1.18.21`) compiled privately across 70% of stake and August 28, 2026 saw Kraken’s single 8.9M SOL pivot decide `SIMD-0550` (67.0% vs 66.67%).',
        receipts: ['500,000,000 SOL Genesis Premine', '~48% Insider / VC / Labs Allocation', 'Data-Center Hardware Centralization']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: '0 Joules • PoH Clock != Proof-of-Work + Uncapped Inflation',
        score: 0.0,
        quickSummary:
          'Proof-of-History is merely a single-leader SHA-256 delay clock, not open consensus Proof-of-Work; SOL has no supply cap and burns 0 consensus Joules.',
        paragraph:
          'Solana’s Proof-of-History runs a sequential hash loop on a pre-selected staked leader rather than open competitive Proof-of-Work, pairing a 0-Joule genesis supply with uncapped 1.5% perpetual tail inflation.',
        geniusParagraph:
          'Solana violates the Thermodynamic Cost Floor (E > 0, scored 0.00 / 1.00): its Delegated Proof-of-Stake selects leader schedules and consensus voting weight strictly according to staked token balances across `432,000`-slot (~2-day) epochs without expending a single joule of competitive Proof-of-Work. Despite putting the word "Proof" in `Proof-of-History` (`PoH`), `PoH` is merely a local, single-threaded sequential `SHA-256` hash loop running on one CPU core to generate timestamps between 350ms–400ms slots—providing zero energy barrier against state rewrites while insiders and the FTX/Alameda estate stake pre-printed allocations and collect 100% of user priority fees (`SIMD-0096`).',
        receipts: ['E = 0 Consensus PoW Joules', 'PoH Is Just a Leader Clock', 'Uncapped Perpetual Tail Inflation']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: '2-Day Ledger Pruning + Google BigTable Archives',
        score: 0.0,
        quickSummary:
          'Validators prune raw ledger history within days and offload multi-hundred-terabyte historical archives onto centralized Google Cloud BigTable instances.',
        paragraph:
          'Generating massive vote-transaction bloat, standard Solana validators purge raw ledger history after a few days—forcing explorers and syncing infrastructure onto centralized Google Cloud BigTable storage and Foundation snapshots.',
        geniusParagraph:
          'Solana fails Historical Immutability and the Physical Arrow of Time (0.00 / 1.00): streaming shreds at 350ms–400ms intervals generates over 100 TB of ledger bloat per year, forcing live Agave (`anza-xyz/agave`) and Firedancer validators to run `--limit-ledger-size` (`DEFAULT_MIN_MAX_LEDGER_SHREDS` / `50,000,000` shreds) to prune and delete all block history older than 2 to 3 days. Newly joining nodes must abandon trustless genesis verification to download ~100 GB centralized snapshots, historical archives rely on Google Cloud Bigtable (`solana-bigtable`), and operators have repeatedly truncated slots via Discord restarts.',
        receipts: ['0-Joule Tower BFT Votes', 'Rapid Local Validator Pruning', 'Google Cloud BigTable Dependency']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: '66.7% Halt Wall • 7+ Global Mainnet Blackouts',
        score: 0.0,
        quickSummary:
          'Tower BFT halts below 66.7% stake and has suffered 7+ complete global mainnet blackouts (including Feb 2024’s 5-hour halt) restarted via Discord.',
        paragraph:
          'Solana doesn’t even need a wartime cable cut to flatline: deterministic leader schedules and 66.7% BFT quorums have crashed the entire global network over seven times (Sep 2021 17h, May/Jun/Oct 2022, Feb 2023 19h, Feb 2024 5h), requiring coordinated validator Discord restarts from manual slot snapshots.',
        geniusParagraph:
          'Under a wartime network partition, Solana’s Tower BFT consensus destroys Dynamic Availability (0.00 / 1.00) at its `SUPERMAJORITY_THRESHOLD = 2/3` (>66.7%) quorum wall—proven in peacetime by Hetzner’s Nov 2022 purge (>20% stake offline), the August 12, 2026 Teraswitch BGP failure (knocking ~29% of stake offline, within 4.4% of a global halt), and seven full cluster blackouts (Dec 2020 6h, Sep 2021 17h, Apr/May 2022 7h, Jun 2022 4.5h, Sep 2022 8.5h, Feb 2023 ~19h, and Feb 6, 2024 5h at slot `246,464,040` from a `LoadedPrograms` JIT loop) requiring manual Discord restarts.',
        receipts: ['7+ Global Mainnet Blackouts', 'Feb 2024 5-Hour Global Halt', 'Discord-Coordinated Manual Restarts', '66.7% Tower BFT Partition Freeze']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'SVM Account Locks • Jito MEV & SPL Freeze/Clawback',
        score: 0.0,
        quickSummary:
          'Shared-account SVM suffers hot-pool write locks, Jito MEV sandwiching, mandatory rent-exempt SOL locks, and SPL Token-2022 Freeze & Permanent Delegate seizure.',
        paragraph:
          'Although Sealevel pre-declares account lists, hot DeFi pools serialize on shared write locks, deterministic leader visibility fuels industrial Jito MEV sandwich extraction, accounts lock rent-exempt SOL, and Token-2022 embeds Permanent Delegate clawback keys.',
        geniusParagraph:
          'Examining Solana’s State Machine Topology (0.00 / 1.00) exposes sequential write-lock bottlenecks (`AccountInUse`) whenever DeFi swaps, memecoin launches, or oracle updates collide on shared mutable accounts, predatory Jito MEV bundle auctions, mandatory `Rent`-exempt SOL deposits (~`0.00203928 SOL` per SPL token account), and native Token-2022 (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`) `PermanentDelegate` and `FreezeAuthority` confiscation hooks.',
        receipts: ['Deterministic Leader Jito MEV', 'Hot-Account Write-Lock Contention', 'Token-2022 Permanent Delegate Seizure']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: 'M = 0 • ~80% Consensus Vote Bloat at 0 Joules',
        score: 0.0,
        quickSummary:
          'Up to 80% of advertised "TPS" consists of internal validator vote messages at 0 Joules (M = 0).',
        paragraph:
          'Counting validator consensus gossip as "transactions" over a single-leader data-center schedule expends zero Proof-of-Work energy—scoring M = 0.',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.00 / 1.00), Solana’s headline "3,000–4,000+ TPS" metric is an accounting mirage: roughly 75% to 85% of all on-chain transactions are internal consensus messages directed to `Vote111111111111111111111111111111111111111` every 350ms–400ms across a zero-joule data-center schedule (M = 0)—standing as the polar opposite of Kaspa’s stateless Proof-of-Work BlockDAG settling genuine parallel UTXO commerce at 10+ blocks per second without fake vote padding or Discord restarts (M = 1.0).',
        receipts: ['M = 0 Thermodynamic Work', '~80% Consensus Vote Padding', 'Single-Leader Bottleneck']
      }
    ]
  },

  XRP: {
    ticker: 'XRP',
    name: 'XRP Ledger',
    consensusFamily: 'ZERO_JOULE_BFT',
    architecture: 'Ripple Labs UNL Proof-of-Association (100B Premine • Missing 32,569 Genesis Ledgers)',
    grade: 'F',
    totalScore: 0.0,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluated under the GRADE framework with High Certainty—from its 100-billion zero-joule Ripple Labs genesis print, permanently lost first 32,569 ledgers, and Ripple dUNL validator control to its 80% quorum halt wall (proven again in the 64-minute February 4, 2025 mainnet halt) and native trustline Freeze & Clawback switches—XRP scores 0.00 out of 6.00 for a terminal compliance grade of F.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: '100B Ripple Premine • ~35B Escrow + dUNL Control',
        score: 0.0,
        quickSummary:
          '100 billion XRP conjured in one line of code for Ripple Labs & founders, with Ripple still controlling ~35B+ XRP in escrow and publishing the default UNL.',
        paragraph:
          'Ripple founders conjured all 100 billion XRP out of thin air in 2012, gifting 80 billion to for-profit Ripple Labs (which still releases monthly escrow tranches from ~35B+ XRP) while curating the ~35-validator Default Unique Node List (dUNL).',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.00 / 1.00), Ripple founders conjured all 100,000,000,000 XRP out of thin air in a single line of code in 2012, gifting 80 billion to for-profit Ripple Labs (which still holds ~35B+ XRP in monthly escrow release tranches) while curating the ~35-validator Default Unique Node List (`dUNL`) that dictates consensus trust topology.',
        receipts: ['100B Single-Line Code Premine', '80B Gifted to For-Profit Ripple Labs', 'Centralized Ripple dUNL List']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: '0 Joules • 100% Pre-Printed Corporate Scrip',
        score: 0.0,
        quickSummary:
          'Not a single drop of XRP was ever mined; all 100,000,000,000 tokens were created at 0 Joules.',
        paragraph:
          'XRP completely eliminates Proof-of-Work (E = 0 Joules), turning Ripple Labs into a private central bank selling zero-cost genesis tokens into public markets for over a decade.',
        geniusParagraph:
          'XRP completely violates the Thermodynamic Cost Floor (E > 0, scored 0.00 / 1.00): not a single atomic drop of XRP was ever mined, leaving all 100 billion units conjured at strictly 0 Joules as corporate treasury inventory sold into retail markets for over a decade with zero validator energy expenditure.',
        receipts: ['E = 0 Joules Expended', '0% Mined Supply', 'Decade+ Corporate Escrow Dumping']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: 'Ledgers 1–32,569 Permanently Lost & Deleted!',
        score: 0.0,
        quickSummary:
          'A software bug permanently destroyed XRPL’s first 32,569 genesis ledgers—making trustless verification from Genesis physically impossible.',
        paragraph:
          'XRPL literally lost its own Genesis history: a 2012 server bug permanently wiped ledgers 1 through 32,569, so no node on Earth can cryptographically verify XRP from block zero—relying instead on 0-Joule dUNL signatures and aggressive online_delete pruning.',
        geniusParagraph:
          'XRP fails Historical Immutability and the Physical Arrow of Time (0.00 / 1.00): a 2012 `rippled` server bug permanently destroyed XRPL’s first 32,569 genesis ledgers—making trustless verification from block zero physically impossible—while live nodes rely on 0-Joule `dUNL` signatures and aggressive `online_delete` ledger pruning.',
        receipts: ['Ledgers 1–32,569 Permanently Missing!', 'Impossible to Verify From Genesis', '0-Joule dUNL Signatures']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: '80% dUNL Quorum Wall • 64-Min Feb 4, 2025 Halt',
        score: 0.0,
        quickSummary:
          'Requires >=80% dUNL supermajority (halt wall at just >20% split!) and suffered a 64-minute global mainnet freeze on February 4, 2025.',
        paragraph:
          'RPCA demands >=80% agreement across ~35 dUNL servers—halting globally if just 21% disconnects—and on February 4, 2025 the entire XRP Ledger drifted and froze worldwide for 64 minutes with zero blocks validated.',
        geniusParagraph:
          'Under a wartime network partition, XRPL’s RPCA consensus destroys Dynamic Availability (0.00 / 1.00) by demanding an extreme $\\ge 80\\%$ supermajority quorum across ~35 Ripple `dUNL` servers—freezing globally if just 20.1% disconnects, as demonstrated in peacetime on February 4, 2025 when the live mainnet drifted and stalled worldwide for 64 minutes with zero ledgers validated.',
        receipts: ['>=80% dUNL Halt Threshold', 'Feb 4, 2025: 64-Min Global Freeze', 'Instant Halt on >20% Partition']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Global Accounts + GlobalFreeze + XLS-39 Clawback',
        score: 0.0,
        quickSummary:
          'Enforces base XRP wallet reserves, permissioned trustlines, GlobalFreeze locks, and native XLS-39 Clawback confiscation primitives.',
        paragraph:
          'XRPL forces mandatory wallet/object XRP reserves, requires permissioned trustlines, lacks expressive native L1 smart contracts, and embeds Individual Freeze, Global Freeze, and XLS-39 Clawback confiscation switches directly into Layer 1.',
        geniusParagraph:
          'Examining XRPL’s State Machine Topology (0.00 / 1.00) exposes mandatory XRP base and owner wallet reserves, permissioned issuer trustlines, lack of expressive native Layer-1 smart contracts, and native Layer-1 `Individual Freeze`, `GlobalFreeze`, and `XLS-39` Clawback confiscation primitives.',
        receipts: ['Native XLS-39 Asset Clawback', 'Individual & GlobalFreeze Switches', 'Mandatory Account XRP Reserves']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: 'M = 0 • 3.5s Corporate dUNL Database Slots',
        score: 0.0,
        quickSummary:
          '3–5 second slot agreement among ~35 permissioned dUNL servers at 0 Joules yields M = 0.',
        paragraph:
          'Updating a Ripple-curated database every ~4 seconds at zero energetic cost delivers zero thermodynamic velocity (M = 0).',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.00 / 1.00), polling ~35 permissioned `dUNL` servers every 3.5 to 5 seconds while expending strictly 0 Joules of Proof-of-Work achieves zero thermodynamic velocity (M = 0)—operating as a Ripple-curated banking database rather than a parallel Proof-of-Work BlockDAG settling concurrent UTXOs at 10+ BPS (M = 1.0).',
        receipts: ['M = 0 Thermodynamic Work', '~35 dUNL Validator Poll', 'Zero Parallel PoW Security']
      }
    ]
  },

  NEAR: {
    ticker: 'NEAR',
    name: 'NEAR Protocol',
    consensusFamily: 'ZERO_JOULE_BFT',
    architecture: 'Doomslug + Nightshade BFT PoS (1B Premine • 5-Epoch Pruning • 3-of-5 Intents Multisig)',
    grade: 'F',
    totalScore: 0.0,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluated under the GRADE framework with High Certainty—from its 1-billion zero-joule corporate/VC genesis premine and 5-epoch (~60-hour) validator garbage collection to Nightshade’s 2/3 BFT partition freeze and NEAR Intents’ 3-of-5 admin multisig—NEAR Protocol scores 0.00 out of 6.00 for a terminal compliance grade of F.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: '1B Premine • Swiss NEAR Foundation + 3-of-5 Intents Multisig',
        score: 0.0,
        quickSummary:
          'Conjured 1 billion NEAR at Genesis across VCs, founders, and the Swiss NEAR Foundation, while flagship NEAR Intents relies on a 3-of-5 admin multisig.',
        paragraph:
          'Architected by NEAR Inc. and the Swiss NEAR Foundation with a 1-billion token zero-joule genesis premine for VCs (a16z, Pantera) and insiders, NEAR’s cross-chain Intents hub (intents.near) sits behind an upgradable contract controlled by a 3-of-5 administrative multisig.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.00 / 1.00), NEAR Inc. and the Swiss NEAR Foundation conjured 1,000,000,000 NEAR at Genesis across venture syndicates (a16z, Pantera), founders, and Foundation treasuries, while flagship cross-chain router NEAR Intents (`intents.near`) is governed by an upgradable 3-of-5 administrative multisig capable of pausing or modifying cross-chain liquidity.',
        receipts: ['1,000,000,000 NEAR Genesis Premine', 'VC & Swiss Foundation Treasury', '3-of-5 Admin Multisig on Intents']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: '0 Joules • Nightshade PoS + Perpetual Inflation',
        score: 0.0,
        quickSummary:
          'Burns 0 Joules of Proof-of-Work while printing perpetual annual PoS inflation straight to staked whales.',
        paragraph:
          'NEAR’s Nightshade Proof-of-Stake expends 0 Joules of irreversible hash work, compounding pre-printed genesis allocations via continuous annual validator inflation.',
        geniusParagraph:
          'NEAR completely violates the Thermodynamic Cost Floor (E > 0, scored 0.00 / 1.00): its Nightshade Proof-of-Stake expends 0 Joules of irreversible Proof-of-Work while compounding pre-printed genesis allocations via continuous annual PoS validator inflation.',
        receipts: ['E = 0 Joules Expended', '1B Zero-Cost Genesis Mint', 'Perpetual Annual PoS Inflation']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: '5-Epoch (~60-Hour) Node Garbage Collection + S3 Sync',
        score: 0.0,
        quickSummary:
          'Standard NEAR validators garbage-collect and delete historical blocks after just 5 epochs (~60 hours), forcing centralized cloud State Sync.',
        paragraph:
          'Blocks are finalized via weightless Doomslug/Nightshade BFT signatures while standard validators wipe historical data older than 5 epochs (~2.5 days), forcing syncing nodes onto centralized S3 cloud state snapshots.',
        geniusParagraph:
          'NEAR fails Historical Immutability and the Physical Arrow of Time (0.00 / 1.00): blocks are finalized via 0-Joule Doomslug/Nightshade BFT signatures while `nearcore` validators garbage-collect and delete historical block data after just 5 epochs (~60 hours), forcing newly syncing nodes to abandon trustless genesis verification and download centralized Amazon S3 state snapshots.',
        receipts: ['0-Joule Nightshade Signatures', 'Deletes History After 5 Epochs (~60h)', 'Centralized S3 State Sync']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: 'Nightshade BFT Halts Below 66.7% Stake',
        score: 0.0,
        quickSummary:
          'Doomslug/Nightshade finality freezes globally if a cable cut isolates 33.4% of stake, while off-chain Intents Solvers halted $589k+ user swaps.',
        paragraph:
          'Requiring a >2/3 staked supermajority across chunk and block producers, NEAR suffers global finality arrest under a 33.4% wartime partition, while off-chain NEAR Intents market-maker Solvers censor or freeze swaps during volatility.',
        geniusParagraph:
          'Under a wartime network partition, NEAR’s Nightshade BFT consensus destroys Dynamic Availability (0.00 / 1.00): requiring a >66.7% staked supermajority across chunk and block producers freezes global finality if 33.4% disconnects, while centralized off-chain NEAR Intents market-maker Solvers have already frozen $589,000+ in user swaps during peacetime volatility.',
        receipts: ['>66.7% Nightshade BFT Halt Wall', 'Off-Chain Centralized Solver Quotes', '$589K+ Intents Swap Freezes']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Async Sharded Accounts • Storage Staking Locks',
        score: 0.0,
        quickSummary:
          'Stateful sharded accounts enforce mandatory NEAR storage-staking locks (1 NEAR per 100KB) and suffer asynchronous cross-shard failure rollbacks.',
        paragraph:
          'NEAR locks native tokens permanently per byte of account storage and routes cross-shard calls via asynchronous receipts where partial failures require complex callback recovery rather than atomic stateless UTXO settlement.',
        geniusParagraph:
          'Examining NEAR’s State Machine Topology (0.00 / 1.00) exposes stateful sharded accounts enforcing mandatory storage-staking locks (`1 NEAR` locked per 100KB of account state) alongside asynchronous cross-shard receipt execution vulnerable to partial-failure callback and rollback complexity.',
        receipts: ['Mandatory Storage-Staking Locks', 'Async Cross-Shard Partial Failures', 'Stateful Account Bloat']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: 'M = 0 • Zero-Joule Sharded Server Database',
        score: 0.0,
        quickSummary:
          'Sub-second server block times burn zero Proof-of-Work Joules, yielding M = 0.',
        paragraph:
          'Sharding a zero-joule Proof-of-Stake database across cloud data centers expends zero physical consensus work—scoring M = 0.',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.00 / 1.00), sharding a zero-joule Proof-of-Stake database across cloud data centers expends strictly 0 Joules of physical Proof-of-Work—yielding M = 0 and relying on centralized off-chain market-maker Solvers rather than a contention-free Layer-1 Proof-of-Work BlockDAG (M = 1.0).',
        receipts: ['M = 0 Thermodynamic Work', 'Zero-Joule Cloud Validator Shards']
      }
    ]
  },

  TAO: {
    ticker: 'TAO',
    name: 'Bittensor',
    consensusFamily: 'ZERO_JOULE_BFT',
    architecture: 'Polkadot Substrate PoA / DPoS + Yuma Stake-Weighted Cartel (July 2024 Safe-Mode Halt)',
    grade: 'F',
    totalScore: 0.0,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluated under the GRADE framework with High Certainty—proven definitively when the Opentensor Foundation unilaterally flipped Subtensor into "Safe Mode" in July 2024 to halt all user transfers alongside 0-Joule Yuma stake-weight copying—Bittensor scores 0.00 out of 6.00 for a terminal compliance grade of F.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: 'Opentensor Foundation • July 2024 "Safe Mode" Halt',
        score: 0.0,
        quickSummary:
          'Controlled by the Opentensor Foundation, which unilaterally flipped a "Safe Mode" kill-switch in July 2024 to freeze the entire blockchain during an $8M wallet hack.',
        paragraph:
          'Bittensor destroyed any illusion of sovereignty in July 2024 when the Opentensor Foundation unilaterally switched Subtensor into PoA "Safe Mode" (blocks containing zero user transactions) for days after a compromised PyPI package drained $8M—proving one foundation holds an on-chain kill-switch while top Root/dTAO whales control emissions.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.00 / 1.00), Bittensor destroyed any pretense of decentralization in July 2024 when the Opentensor Foundation unilaterally flipped Subtensor into PoA "Safe Mode" (producing empty blocks with zero user transfers) for days during an $8M PyPI wallet drain—proving one foundation holds a live protocol kill-switch while top Root/dTAO validator whales dominate emissions.',
        receipts: ['July 2024 Foundation "Safe Mode" Kill-Switch', 'Opentensor Foundation PoA Control', 'Top Validator Cartel Dominance']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: '0 Consensus Joules • "Miners" != Proof-of-Work',
        score: 0.0,
        quickSummary:
          'Hijacks Bitcoin’s 21M cap and "miner" terminology: Subtensor blocks burn 0 PoW Joules while subnet "miners" run gameable off-chain Python API scripts scored by staked whales.',
        paragraph:
          'Borrowing Bitcoin’s 21M cap is pure affinity marketing: Subtensor is a zero-joule Polkadot Substrate chain (BABE/GRANDPA) where "miners" compute zero consensus hashes and instead submit off-chain API responses graded subjectively via Yuma Consensus stake-weight copying.',
        geniusParagraph:
          'Bittensor violates the Thermodynamic Cost Floor (E > 0, scored 0.00 / 1.00): copying Bitcoin’s 21-million cap and "miner" vocabulary is pure affinity theater because Subtensor is a zero-joule Polkadot Substrate chain (`BABE`/`GRANDPA`) where "miners" compute zero consensus hashes and instead submit gameable off-chain Python API outputs scored subjectively via Yuma Consensus stake-weight copying.',
        receipts: ['0 Consensus PoW Joules (Substrate Chain)', 'Subjective Yuma Stake-Weight Scoring', 'Rampant Weight-Copying Extraction']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: '0-Joule GRANDPA Signatures + Admin Runtime Upgrades',
        score: 0.0,
        quickSummary:
          'Finalizes blocks via weightless Substrate GRANDPA signatures under forkless admin Wasm runtime override capability.',
        paragraph:
          'Subtensor seals blocks every 12 seconds via zero-joule Substrate validator signatures with forkless Wasm runtime upgrade hooks—possessing zero Landauer heat wall.',
        geniusParagraph:
          'Bittensor fails Historical Immutability and the Physical Arrow of Time (0.00 / 1.00) because 12-second Subtensor blocks are sealed via weightless Substrate `GRANDPA` validator signatures under forkless administrative Wasm runtime override hooks with zero cumulative Landauer heat wall.',
        receipts: ['0-Joule GRANDPA Finality', 'Forkless Admin Runtime Overrides', 'Zero Cumulative Heat Wall']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: 'GRANDPA >66.7% Halt + Proven Multi-Day Admin Freeze',
        score: 0.0,
        quickSummary:
          'GRANDPA halts finality below 66.7% validator weight, and Foundation admins already froze all global user transactions for days in July 2024.',
        paragraph:
          'Substrate’s GRANDPA finality stalls immediately during a 33.4% network split, and Bittensor doesn’t even need a fiber cut to freeze—its own Foundation manually halted user commerce worldwide in July 2024.',
        geniusParagraph:
          'Under a wartime network partition, Substrate’s `GRANDPA` finality destroys Dynamic Availability (0.00 / 1.00) at its >66.7% validator quorum wall—and Bittensor doesn’t even require a fiber cut to flatline, having already halted global user transactions for days in July 2024 by Foundation decree.',
        receipts: ['July 2024 Multi-Day Mainnet Freeze', '>66.7% GRANDPA Finality Halt Wall']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Stateful Substrate Pallets + dTAO AMM Slippage',
        score: 0.0,
        quickSummary:
          'Monolithic Substrate account pallets with Dynamic TAO (dTAO) subnet AMM pools vulnerable to whale front-running and emission gaming.',
        paragraph:
          'Subtensor mutates shared Substrate account storage across 12-second slots while Dynamic TAO routes emissions through illiquid on-chain subnet AMM pools routinely gamed by early whales and bots.',
        geniusParagraph:
          'Examining Bittensor’s State Machine Topology (0.00 / 1.00) exposes monolithic Substrate account pallets with existential deposit account reaping alongside Dynamic TAO (`dTAO`) illiquid subnet AMM pools routinely front-run and gamed by whales.',
        receipts: ['Shared Substrate Account Pallets', 'dTAO Subnet AMM Manipulation', 'Existential Deposit Account Reaping']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: 'M = 0 • 12s Sequential Substrate Slots',
        score: 0.0,
        quickSummary:
          '12-second sequential Substrate database slots burning 0 consensus Joules yield M = 0.',
        paragraph:
          'Producing one zero-joule Substrate block every 12 seconds delivers zero thermodynamic velocity (M = 0).',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.00 / 1.00), producing one sequential Polkadot Substrate database block every 12 seconds while burning strictly 0 Joules of Proof-of-Work achieves zero thermodynamic velocity (M = 0)—a far cry from Kaspa’s 10-BPS parallel Proof-of-Work BlockDAG (M = 1.0).',
        receipts: ['M = 0 Thermodynamic Work', '12-Second Sequential Slots']
      }
    ]
  },

  XMR: {
    ticker: 'XMR',
    name: 'Monero',
    consensusFamily: 'LINEAR_POW',
    architecture: 'RandomX CPU Proof-of-Work + RingCT Privacy (120s Sequential Chain • 20m Spend Lock)',
    grade: 'C+',
    totalScore: 3.5,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating, as every architectural metric—from the April 18, 2014 zero-premine genesis launch, the 0.6 XMR perpetual tail emission (FINAL_SUBSIDY_PER_MINUTE), the October 2026 60% top-three pool concentration, and the August 2025 Qubic 63-of-122 block (>51%) reorganization to compiled checkpoints.dat hashes, opaque RingCT Pedersen supply commitments after CVE-2017-18350, the Blockchain::switch_to_alternative_blockchain resplice orphan wipeout, the CRYPTONOTE_MINED_MONEY_UNLOCK_WINDOW = 60 coinbase destruction horizon, cascading RingCT decoy-index invalidation, the unpruneable 150M+ output/key_image state set, and DIFFICULTY_TARGET_V2 = 120s with its 20-minute spend lock—is empirically verifiable in the monero-project/monero C++ codebase. Monero scores 3.50 out of 6.00 (01: 0.90, 02: 0.85, 03: 0.60, 04: 0.45, 05: 0.45, 06: 0.25), earning a compliance grade of C+.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: '0 Premine Cypherpunk Genesis • 60% Top-3 Pool Concentration',
        score: 0.9,
        quickSummary:
          'Authentic April 2014 fair launch with zero premine, zero VC, and volunteer CCS funding, tempered by 60% top-three pool concentration and the August 2025 Qubic 51% selfish-mining reorg.',
        paragraph:
          'Monero launched fairly in April 2014 with zero premine, zero ICO, zero VC allocation, and volunteer Community Crowdfunding System (CCS) governance, though top three pools control ~60% of hashrate and Qubic briefly crossed 51% across blocks 3,475,729–3,475,850 in August 2025.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.90 / 1.00), Monero passed at Genesis with flying colors. Launched on April 18, 2014 as BitMonero—a clean-room fork of CryptoNote rejecting Bytecoin’s fraudulent 82% premine—Monero entered existence with zero premine, zero instamine, zero ICO, zero venture capital syndicates, and zero corporate foundation tax, governed entirely via volunteer Community Crowdfunding System (CCS) donations with zero admin freeze keys. Complete honesty deducts 0.10 due to operational mining centralization: three pools (SupportXMR 26.3%, Nanopool 17.3%, Kryptex 16.4%) control 60.0% of global hashrate (~7.12 GH/s), and across August 11–12, 2025 (blocks `3,475,729` to `3,475,850`), the external Qubic protocol directed mercenary CPU hash power to capture 63 out of 122 blocks (>51%) and execute selfish-mining reorganizations on live mainnet.',
        receipts: ['0 Premine / 0 VC Allocation', 'Volunteer CCS Funding', '60% Top-3 Pool Share', 'Aug 2025 Qubic 63/122 Block Reorg']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: 'RandomX PoW + 0.6 XMR Perpetual Tail Emission',
        score: 0.85,
        quickSummary:
          '100% of XMR is forged via irreversible RandomX Proof-of-Work with a 0.6 XMR per-block perpetual tail emission, though general-purpose CPUs allow rentable botnet/mercenary hash.',
        paragraph:
          'Every atomic piconero is forged through real electrical expenditure with a perpetual 0.6 XMR/block tail emission (~0.84% disinflation), losing 0.15 only because general-purpose RandomX CPUs lack dedicated single-purpose ASIC hardware skin-in-the-game.',
        geniusParagraph:
          'Monero enforces a genuine Thermodynamic Cost Floor (E > 0, scored 0.85 / 1.00): every atomic piconero (10^-12 XMR) across its ~18.83 million circulating supply was forged via real electrical energy expenditure, reinforced since June 2022 (block `2,641,623`) by a perpetual `0.6 XMR` Tail Emission (`FINAL_SUBSIDY_PER_MINUTE = 300000000000` piconero, yielding `432 XMR/day` and ~0.84% annual disinflation) so miners always face an unyielding energy floor. Complete honesty deducts 0.15 because RandomX (`rx/0`) targets general-purpose x86/ARM CPUs rather than single-purpose ASIC silicon—allowing rentable cloud servers, botnets, and mercenary protocols like Qubic to swing hash power dynamically without dedicated hardware skin-in-the-game, even as Bitmain deployed commercial `Antminer X5` and `X9` RandomX rigs.',
        receipts: ['100% RandomX PoW Issuance', '0.6 XMR Tail Emission Floor', 'General-Purpose CPU Rentability']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: 'RandomX PoW • Aug 2025 >51% Reorg + Opaque RingCT',
        score: 0.6,
        quickSummary:
          'Calibrated at 0.60 under the 0.50–0.70 rubric bracket due to the August 2025 Qubic >51% mainnet reorganization, compiled checkpoints.dat hashes, and opaque RingCT Pedersen supply commitments.',
        paragraph:
          'Monero seals blocks behind real cumulative RandomX Proof-of-Work, but falls into the 0.50–0.70 immutability bracket (0.60) for three verifiable reasons: Qubic’s August 11–12, 2025 >51% selfish-mining reorganization on live mainnet (63 of 122 blocks), compiled checkpoints.dat / DNS checkpoints, and RingCT Pedersen commitments that prevent plaintext arithmetic UTXO supply audits (requiring cryptographic trust after CVE-2017-18350).',
        geniusParagraph:
          'Monero scores 0.60 / 1.00 on Historical Immutability and the Physical Arrow of Time, calibrated strictly inside the `0.50–0.70` rubric bracket covering chains with historical 51% reorganizations, compiled checkpoints, and opaque commitments. While deep history is anchored by cumulative RandomX electrical work, three empirical realities deduct 0.40: first, across August 11–12, 2025 (blocks `3,475,729`–`3,475,850`), mercenary CPU hash power directed by Qubic captured 63 of 122 blocks (>51%) and executed live multi-block selfish-mining reorganizations on mainnet; second, `monero-project/monero` embeds compiled `checkpoints.dat` hashes and DNS checkpoints; and third, `RingCT` Pedersen commitments and `Bulletproofs+` range proofs prevent plaintext arithmetic summation of circulating XMR supply (critical given the 2017 `CVE-2017-18350` key-image inflation bug).',
        receipts: ['Aug 2025 Qubic >51% Mainnet Reorg', 'Opaque RingCT Supply Commitments', 'Compiled checkpoints.dat / DNS', 'CVE-2017-18350 Patch History']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: 'Survives Split • Resplice Wipes Minority & Poisons Decoys',
        score: 0.45,
        quickSummary:
          'Per-block difficulty adjusts across severed cables, but resplicing orphans the minority continent’s blocks, erases unlocked 60-block coinbase commerce, and invalidates RingCT decoy rings.',
        paragraph:
          'Monero survives wartime blackouts via rolling 720-block difficulty adjustment, but upon cable resplicing Blockchain::switch_to_alternative_blockchain wipes out the minority branch, destroys 2-hour unlocked coinbase commerce, and breaks honest transactions whose 16-member rings selected vanished minority decoys.',
        geniusParagraph:
          'Under a wartime network partition, Monero survives the initial blackout via per-block difficulty adjustment (`DIFFICULTY_WINDOW = 720`, `DIFFICULTY_CUT = 60`, proven during the March 4, 2024 mempool flood `300,000`-byte block expansion) but catastrophically fails Dynamic Availability (0.45 / 1.00) at network resplicing: repairing a severed undersea cable triggers `Blockchain::switch_to_alternative_blockchain`, ruthlessly orphaning the minority continent’s entire chain, wiping out 60-block unlocked coinbase commerce (`CRYPTONOTE_MINED_MONEY_UNLOCK_WINDOW = 60`), and triggering cascading `RingCT` decoy-index poisoning (`tx_verification_context::m_verifivation_failed`) that invalidates thousands of honest pre-partition user transactions whose 16-member rings selected vanished minority decoy outputs.',
        receipts: ['Per-Block 720-Window DAA', 'Resplice Minority Chain Wipeout', 'Cascading RingCT Decoy Poisoning']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Unpruneable 150M+ Stealth Outputs & Key Images',
        score: 0.45,
        quickSummary:
          'Because no node can tell which ring member was spent, Monero can never prune spent outputs or key_images—forcing permanent state database growth.',
        paragraph:
          'RingCT stealth outputs and spent key_image sets can never be pruned without breaking double-spend verification, forcing full nodes to carry over 150 million historical outputs forever.',
        geniusParagraph:
          'Examining Monero’s State Machine Topology (0.45 / 1.00) exposes the permanent storage bloat of its CryptoNote stealth-address and `RingCT` architecture (`ring size = 16`, with `FCMP++` and `CARROT` in stressnet testing): because no node on Earth can determine which output in a 16-member ring was genuinely consumed, the protocol can never prune spent outputs or spent `key_image` records from its active state database—forcing full nodes to store an endlessly expanding LMDB state file of 150M+ historical outputs forever.',
        receipts: ['Unpruneable key_image Set', '150M+ Stealth Output Growth', 'Ring Size 16 / FCMP++ Overhead']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: '120s Sequential Blocks + 20-Minute Wallet Spend Lock',
        score: 0.25,
        quickSummary:
          'Hardcodes 120-second sequential blocks (M < 1.0) and locks newly received outputs and wallet change for 10 blocks (20 full minutes) after every transaction.',
        paragraph:
          'Monero’s sequential 120-second chain orphans competing blocks (M < 1.0) and enforces CRYPTONOTE_DEFAULT_TX_SPENDABLE_AGE = 10 blocks, freezing a user’s received funds and leftover wallet change for 20 minutes per spend.',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.25 / 1.00), `src/cryptonote_config.h` hardcodes a sequential single-chain block target of `DIFFICULTY_TARGET_V2 = 120` seconds (`0.0083 BPS`, discarding concurrent blocks as wasted orphans with M < 1.0) alongside a mandatory consensus lock of `CRYPTONOTE_DEFAULT_TX_SPENDABLE_AGE = 10` blocks—freezing every user’s received XMR and leftover wallet change on-chain for 20 full minutes after every single spend, in stark contrast to Kaspa’s 10-BPS parallel UTXO BlockDAG with zero 20-minute spend locks (M = 1.0).',
        receipts: ['120-Second Sequential Chain', '10-Block (20-Min) Spend Lock', 'M < 1.0 Orphan Waste']
      }
    ]
  },

  ADA: {
    ticker: 'ADA',
    name: 'Cardano',
    consensusFamily: 'ZERO_JOULE_BFT',
    architecture: 'Ouroboros Praos DPoS (31.1B Genesis Premine • 20s Sequential eUTXO • Nov 2025 Chain Split)',
    grade: 'F',
    totalScore: 0.0,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating, as every architectural failure—from the 31,112,484,646 ADA zero-joule genesis premine, the 5.18-billion ADA corporate triumvirate allocation, and the CID-202503 318-million ADA Genesis Key reserve sweep to the 0 Joule Ouroboros Praos VRF lottery, the 36-hour (k = 2160) partition divergence horizon, the f = 0.05 20-second eUTXO concurrency bottleneck, and the January 2023 (CID-202301) 50% node crash and November 2025 14-hour "pig vs. chicken" mainnet chain split—is empirically verifiable in the IntersectMBO/cardano-node Haskell codebase, ByronGenesis and ShelleyGenesis JSON configuration files, CIP-1694 governance records, and official incident postmortems. Cardano scores a 0 out of 6 across all thermodynamic invariants, resulting in a terminal compliance grade of F.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: '31.11B Premine • 5.18B Triumvirate Gift • 318M Key Sweep',
        score: 0.0,
        quickSummary:
          'Conjured 31.11B ADA at Genesis (gifting 5.18B to IOHK, EMURGO & Foundation) and used 5-of-7 Genesis Keys to unilaterally sweep 318M unredeemed ADA (CID-202503).',
        paragraph:
          'Cardano conjured 31,112,484,646 ADA (69.14% of max supply) in ByronGenesis with zero mining, gifting 5.18B ADA to IOHK, EMURGO, and the Cardano Foundation while wielding 5-of-7 Genesis Keys to sweep 318M unredeemed voucher ADA into corporate-controlled reserves (CID-202503).',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.00 / 1.00), Cardano failed at Genesis in September 2017 by conjuring 31,112,484,646 ADA (69.14% of its 45-billion cap) in a `ByronGenesis` configuration file—selling 25.93B via pre-launch Japanese vouchers and gifting 5,185,414,108 ADA directly to IOHK (2.46B), EMURGO (2.07B), and the Cardano Foundation (648M) with zero vesting cliffs, while wielding 5-of-7 Genesis Keys (`updateQuorum: 5`) during the Allegra hard fork (`returnRedeemAddrsToReserves`, `CID-202503`) to sweep 318 million unredeemed ADA into insider-controlled reserves and cementing plutocratic "one Lovelace = one vote" CIP-1694 governance over the 1.69B ADA treasury.',
        receipts: ['31.11B ADA Genesis Premine', '5.18B Triumvirate Insider Gift', 'CID-202503 318M Genesis Key Sweep', 'Plutocratic 1-Lovelace-1-Vote']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: '0 Joules • Ouroboros Praos VRF Lottery',
        score: 0.0,
        quickSummary:
          'All 45 billion ADA were conjured in JSON config files at 0 Joules, dripping 0.3% epoch reserve inflation to staked genesis bags with zero energy barrier.',
        paragraph:
          'Cardano’s Ouroboros Praos DPoS burns 0 Joules of Proof-of-Work, emitting 0.3% of its 13.89B reserve every 5-day epoch straight to premined stake pools and a 1.69B ADA treasury at zero energetic cost.',
        geniusParagraph:
          'Cardano violates the Thermodynamic Cost Floor (E > 0, scored 0.00 / 1.00): Ouroboros Praos selects slot leaders via a private, stake-weighted Verifiable Random Function (VRF) lottery across five-day epochs without expending a single joule of irreversible Proof-of-Work—conjuring all 45 billion ADA at strictly 0 Joules and dripping ~0.3% (`ρ = 0.003`) of the remaining 13.89B reserve every epoch directly to stake pool operators and genesis bag-holders with zero slashing risk while siphoning 20% (~4.32M ADA/epoch) into an on-chain treasury.',
        receipts: ['E = 0 Joules Expended', '45B JSON Config Supply', 'Cantillon Epoch Reserve Drip']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: '0-Joule KES/VRF Signatures + Mithril Snapshots',
        score: 0.0,
        quickSummary:
          'Simulates finality via weightless KES/VRF signatures across a 36-hour (2,160-block) window and relies on Mithril stake snapshots to bypass full genesis sync.',
        paragraph:
          'Sealing blocks with 0-Joule VRF signatures and Key Evolving Signatures (maxKESEvolutions: 62) gives Cardano zero physical mass, relying on Mithril stake snapshots and mutable governance rules.',
        geniusParagraph:
          'Cardano fails Historical Immutability and the Physical Arrow of Time (0.00 / 1.00): state transitions are sealed via 0-Joule VRF signatures and software timers (Key Evolving Signatures deleting old keys every 129,600 slots, `maxKESEvolutions: 62` across `k = 2160` blocks / 36 hours) while syncing nodes rely on Mithril stake-based certificate snapshots to bypass trustless genesis replay after the founding entities already proved during Allegra that protocol upgrades can sweep unspent genesis UTXOs by decree.',
        receipts: ['0-Joule VRF/KES Signatures', '36-Hour (k=2160) Finality Window', 'Mithril Stake Snapshot Sync']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: '36h Split Horizon • Nov 2025 14h "Pig vs Chicken" Fork',
        score: 0.0,
        quickSummary:
          'Partitions exceeding 36 hours (2,160 blocks) permanently diverge without PoW work, and a single transaction split mainnet for 14 hours on Nov 21, 2025.',
        paragraph:
          'Any cable cut lasting over 36 hours (3k/f = 2,160 blocks) breaks Ouroboros density rules into irreconcilable forks, and in peacetime cardano-node crashed 50% of nodes in Jan 2023 (CID-202301) and split into competing "pig" and "chicken" chains for 14 hours on Nov 21, 2025.',
        geniusParagraph:
          'Under a wartime network partition, Cardano’s Ouroboros consensus destroys Dynamic Availability (0.00 / 1.00) past its 36-hour (`3k/f = 2,160`-block) stability horizon, where isolated partitions permanently fork into incompatible ledgers without objective Proof-of-Work cumulative difficulty to reunify them—and in peacetime its monoculture `IntersectMBO/cardano-node` Haskell client crashed over 50% of mainnet nodes on January 22, 2023 (`CID-202301`) and split into competing "pig" and "chicken" chains for 14 hours on November 21, 2025 over a single malformed transaction.',
        receipts: ['36-Hour (2,160-Block) Split Horizon', 'Nov 21, 2025 14h Mainnet Chain Split', 'Jan 2023 (CID-202301) 50% Node Crash']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: '20s Sequential eUTXO Contention + Off-Chain Batchers',
        score: 0.0,
        quickSummary:
          'Traps its eUTXO model inside a sequential 20-second single chain (1 UTXO spend per block), forcing DEXs onto centralized off-chain batcher servers.',
        paragraph:
          'While eUTXO is cleaner than Ethereum accounts, trapping it inside a 20-second sequential chain (~88KB blocks) causes immediate DEX state contention—forcing protocols onto centralized off-chain batchers and mandatory coinsPerUTXOByte state rent.',
        geniusParagraph:
          'Examining Cardano’s State Machine Topology (0.00 / 1.00) exposes how trapping its Extended UTXO (`eUTXO`) model inside a sequential single-file chain (~88 KB `maxBlockBodySize`) allows only one transaction to consume a given smart contract UTXO per 20-second block—forcing DeFi protocols (Minswap, SundaeSwap) onto centralized off-chain "batcher" servers while locking native ADA inside every token UTXO via mandatory `coinsPerUTXOByte` state rent.',
        receipts: ['1 UTXO Spend Per 20s Block', 'Centralized Off-Chain DEX Batchers', 'Mandatory coinsPerUTXOByte Lock']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: 'M = 0 • Idles 19 of Every 20 Seconds (f = 0.05)',
        score: 0.0,
        quickSummary:
          'Hardcodes activeSlotCoeff f = 0.05 so 95% of 1-second slots sit empty, producing one zero-joule block every ~20 seconds (M = 0).',
        paragraph:
          'Intentionally leaving 19 out of every 20 one-second slots empty at 0 Joules throttles finality to 5–8 minutes and yields M = 0.',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.00 / 1.00), Cardano’s `ShelleyGenesis` parameter `activeSlotCoeff = 0.05` intentionally leaves 95% of its 1-second slots empty—producing just one zero-joule block every ~20 seconds (`0.05 BPS`, M = 0) with 5-to-8-minute routine finality while Ouroboros Leios remains unshipped testnet theory even after the July 2026 `van Rossem` upgrade, standing as the polar opposite of Kaspa’s 10-BPS parallel Proof-of-Work BlockDAG (M = 1.0).',
        receipts: ['M = 0 Thermodynamic Work', 'activeSlotCoeff f = 0.05 (20s Blocks)', '95% Empty Slot Idle Rate']
      }
    ]
  },

  AVAX: {
    ticker: 'AVAX',
    name: 'Avalanche',
    consensusFamily: 'ZERO_JOULE_BFT',
    architecture: 'Snowman++ PoS (360M Premine • Deleted X-Chain DAG in Cortina • 75% Quorum Halt)',
    grade: 'F',
    totalScore: 0.0,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating, as every architectural failure—from the 360,000,000 AVAX zero-joule genesis premine, the $230 million VC token sale, the Roche Freedman Crypto Leaks litigation pact, and the July 30, 2025 DELEGATECALL incident where Foundation nodes unilaterally rolled back to v1.13.0 and enforced secret soft-fork patch v1.13.4 48 hours before public release, to the 0 Joule P-Chain staking yield on locked insider tokens, default "state-sync-enabled": true 4,096-block snapshot bootstrapping, Snowman’s alpha/k = 75% (15/20) partition halt threshold, the February 2021 (v1.2.0), March 2023 (v1.9.14/v1.9.16), and February 23, 2024 (v1.11.1) 5-hour mainnet outages, the April 2023 Cortina upgrade deleting the X-Chain DAG, and the TxAllowList (0x0200...0002) censorship precompiles—is empirically verifiable in the ava-labs/avalanchego, ava-labs/coreth, and ava-labs/subnet-evm Go codebases, ACP governance records, and official Ava Labs incident postmortems. Avalanche scores a 0 out of 6 across all thermodynamic invariants, resulting in a terminal compliance grade of F.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: '360M Premine • July 30, 2025 64-Min Foundation Soft-Fork',
        score: 0.0,
        quickSummary:
          'Conjured 360M AVAX (50% max supply) at Genesis for Ava Labs/Foundation/VCs, and proved on July 30, 2025 that Foundation nodes alone hold enough stake to censor mainnet in 64 minutes.',
        paragraph:
          'Ava Labs and the Avalanche Foundation premined 360,000,000 AVAX at Genesis ($290M+ VC sales), and in their July 30, 2025 postmortem openly admitted that Foundation validator nodes alone controlled enough stake to unilaterally block transactions and enforce secret patch v1.13.4 48 hours before public release.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.00 / 1.00), Ava Labs and the Cayman Islands-registered Avalanche Foundation raised $290M+ from VCs (Polychain, 3AC, a16z, Galaxy, Dragonfly), conjured 360,000,000 AVAX (50% of the 720M cap) out of thin air in the September 2020 genesis file, entered the Crypto Leaks Roche Freedman litigation pact, and openly admitted in their July 30, 2025 `DELEGATECALL` postmortem that Foundation-controlled validator nodes alone held enough mainnet stake to unilaterally roll back to `v1.13.0`, block transactions across the entire global network in 64 minutes, and enforce secret soft-fork patch `v1.13.4` 48 hours before releasing the code to public node operators on August 1, 2025.',
        receipts: ['360M AVAX (50%) Genesis Premine', 'July 30, 2025 Foundation Censorship', '$230M Polychain/3AC VC Sale', 'Crypto Leaks Roche Freedman Pact']
      },
      {
        id: '02',
        shortName: 'Cost Floor',
        title: 'Thermodynamic Cost Floor (E > 0)',
        telemetry: '0 Joules • Unvested Insider Stake Yield Extraction',
        score: 0.0,
        quickSummary:
          'All 720M AVAX were created at 0 Joules, allowing insiders to stake unvested locked genesis allocations on the P-Chain to dump unlocked yield onto retail.',
        paragraph:
          'Avalanche’s Snowman PoS expends 0 Joules of Proof-of-Work and permitted insiders and VCs to stake unvested, time-locked genesis tokens on the P-Chain to mint liquid staking rewards at zero physical cost.',
        geniusParagraph:
          'Avalanche violates the Thermodynamic Cost Floor (E > 0, scored 0.00 / 1.00): Snowman Proof-of-Stake weights validator sub-sampling strictly by Platform Chain (`P-Chain`) staked token balances without expending a single joule of competitive Proof-of-Work, conjuring all 720,000,000 AVAX at strictly 0 Joules while engineering a Cantillon extraction engine that allowed founders and VCs to stake their unvested, time-locked genesis allocations on the P-Chain (meeting the `2,000 AVAX` validator bond) to immediately harvest liquid staking yield (~9%–11% APY) and dump zero-cost dilution onto retail buyers.',
        receipts: ['E = 0 Joules Expended', '360M Pre-Printed + 360M PoS Reserve', 'Staking Yield on Locked Insider Bags']
      },
      {
        id: '03',
        shortName: 'Immutability',
        title: 'Historical Immutability & Arrow of Time',
        telemetry: 'Default Pruning + 4,096-Block State-Sync Snapshots',
        score: 0.0,
        quickSummary:
          'Finalizes blocks via weightless 20-node polls while enabling C-Chain pruning and state-sync snapshot bootstrapping by default.',
        paragraph:
          'Snowman seals blocks via 0-Joule validator sub-sampling (k=20, beta=20) while coreth enables "pruning-enabled": true and "state-sync-enabled": true by default—skipping historical genesis verification via rolling 4,096-block state snapshots.',
        geniusParagraph:
          'Avalanche fails Historical Immutability and the Physical Arrow of Time (0.00 / 1.00): Snowman (`snow/consensus/snowman`) finalizes blocks via weightless metastable sub-sampling polls (`k = 20`, `alphaPreference = 15`, `beta = 20`) while `ava-labs/avalanchego` and `ava-labs/coreth` enable `"pruning-enabled": true` and `"state-sync-enabled": true` by default—bypassing historical genesis verification via rolling 4,096-block state snapshots (~500 GB) and requiring operators to periodically wipe databases and resync from peer snapshots after offline pruning was disabled in Helicon.',
        receipts: ['0-Joule k=20 Sub-Sampling Polls', 'Default C-Chain State Pruning', '4,096-Block Snapshot Bootstrapping']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: '75% (15/20) Quorum Halt • Feb 2024 5-Hour Mainnet Freeze',
        score: 0.0,
        quickSummary:
          'Snowman requires alpha/k = 15/20 (75%) online stake quorum—halting at a 25.1% split—and froze for 5 hours on Feb 23, 2024 over a mempool gossip bug.',
        paragraph:
          'Requiring a 75% (alphaPreference = 15 of k = 20) stake quorum, Avalanche flatlines if just 25.1% disconnects, and repeatedly stalled in peacetime: Feb 2021 (v1.2.0), March 2023 (v1.9.14/v1.9.16), and a 5-hour C-Chain halt on Feb 23, 2024 (v1.11.1).',
        geniusParagraph:
          'Under a wartime network partition, Snowman’s consensus math destroys Dynamic Availability (0.00 / 1.00): requiring `alpha/k = 15/20` (**75%**) online stake quorum across 20 consecutive rounds freezes global finalization the instant a cable cut isolates just 25.1% of staked AVAX (or splits the globe 50/50)—and in peacetime `avalanchego` repeatedly halted mainnet on February 11, 2021 (`v1.2.0` cross-chain double-minting bug), March 23–26, 2023 (`v1.9.12` -> `v1.9.14`/`v1.9.16`), and for five hours on February 23, 2024 (`v1.11.1` mempool P2P gossip flood bug).',
        receipts: ['75% (15/20) Stake Halt Threshold', 'Feb 23, 2024 5-Hour Mainnet Halt', 'Feb 2021 & Mar 2023 Consensus Stalls']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Deleted DAG in 2023 • Single-Threaded EVM + TxAllowList',
        score: 0.0,
        quickSummary:
          'Quietly deleted its X-Chain DAG in the April 2023 Cortina upgrade, funneling DeFi into a sequential go-ethereum clone (coreth) and Subnets with native TxAllowList kill-switches.',
        paragraph:
          'Ava Labs deleted its X-Chain DAG in April 2023 (Cortina), leaving 95%+ of activity on a sequential go-ethereum fork (coreth) while embedding native TxAllowList (0x0200...0002) and ContractDeployerAllowList admin censorship precompiles in subnet-evm.',
        geniusParagraph:
          'Examining Avalanche’s State Machine Topology (0.00 / 1.00) exposes the greatest architectural bait-and-switch in Layer 1 history: on April 25, 2023, during the Mainnet **Cortina upgrade**, Ava Labs quietly abandoned and deleted its X-Chain DAG engine—linearizing it into a sequential `Snowman++` blockchain while funneling over 95% of real-world DeFi activity through the C-Chain (ChainID `43114`), a sequential single-threaded `go-ethereum` fork (`coreth`) capped at an `80,000,000` gas limit, and pushing scaling onto fragmented Subnets/Avalanche9000 L1s (`subnet-evm`) armed with native `TxAllowList` (`0x0200000000000000000000000000000000000002`) and `ContractDeployerAllowList` administrative censorship precompiles.',
        receipts: ['Deleted X-Chain DAG (Apr 2023 Cortina)', 'Sequential go-ethereum C-Chain', 'Native TxAllowList Censorship Switch']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: 'M = 0 • Zero-Joule Snowman++ Sequential Chain',
        score: 0.0,
        quickSummary:
          'Linearized Snowman++ 5-second proposer windows burn 0 Joules of Proof-of-Work, yielding M = 0.',
        paragraph:
          'After abandoning DAG topology for sequential Snowman++ blocks at 0 Joules, Avalanche achieves zero thermodynamic velocity (M = 0).',
        geniusParagraph:
          'On Thermodynamic Velocity (M = 1.0, scored 0.00 / 1.00), Avalanche abandoned parallel DAG topology in April 2023 in favor of linearized `Snowman++` 5-second proposer windows and sequential `coreth` EVM execution while expending strictly 0 Joules of Proof-of-Work—achieving zero thermodynamic velocity (M = 0) and standing as the polar opposite of Kaspa’s stateless, contention-free Proof-of-Work BlockDAG, where 100% of open, concurrent global hash power settles parallel UTXO state transitions natively on Layer 1 at 10+ blocks per second without abandoning DAG consensus, fragmenting liquidity into permissioned L1s, or halting for five hours over P2P gossip (M = 1.0).',
        receipts: ['M = 0 Thermodynamic Work', 'Abandoned DAG Topology', 'Zero-Joule Server Polling']
      }
    ]
  }
};

// ============================================================================
// LOCKED-IN 6-PARAGRAPH FORENSIC "GENIUS MODE" ESSAYS (ZERO VARIATIONS)
// ============================================================================
const GENIUS_FORENSIC_ESSAYS = {
  XAU: [
    'Evaluating Physical Gold (XAU / Atomic Element 79) against the six physical invariants of a sovereign ledger reveals the primordial astrophysical benchmark of thermodynamic money—an element forged in the violence of neutron-star collisions that achieves perfection in Existential Sovereignty and near-perfection in energetic costliness, yet fails as a global digital settlement rail because baryonic atoms cannot teleport over fiber-optic cables. At the foundational layer of Existential Sovereignty and Entity Decoupling, Physical Gold passed at cosmic Genesis (1.00 / 1.00). Synthesized billions of years prior to the formation of Earth via rapid neutron-capture (r-process) nucleosynthesis inside binary neutron-star mergers and core-collapse supernovae, elemental gold (197Au) entered human history with zero founding corporation, zero venture capital syndicate, zero pre-mine configuration file, zero developer tax, and zero administrative kill-switch. A physical gold coin held in direct, unencumbered self-custody is completely decoupled from the survival of any state, central bank, or Silicon Valley software lab—explaining why gold outlived every fiat empire for 5,000 years.',
    'This sovereign, parentless foundation is anchored to a formidable adherence to the Thermodynamic Cost Floor (E > 0, scored 0.95 / 1.00). Unlike zero-joule Proof-of-Stake tokens or central bank fiat currencies conjured by keystroke, every troy ounce of newly extracted gold added to the ~216,265-metric-ton above-ground stock (~3,600 metric tons mined annually, representing a ~1.5% to 1.7% stock-to-flow expansion) must be physically wrested from the Earth’s crust by excavating, hauling, crushing, and chemically leaching roughly one metric ton of rock per single gram of Au—dissipating approximately 130 to 160 gigajoules (GJ) of diesel and electrical energy per kilogram at an All-In Sustaining Cost (AISC) exceeding $1,450+ per ounce. Gold loses 0.05 on Invariant 02 only because its supply is governed by geological economics rather than a strict mathematical hard cap: when gold’s purchasing power rises, previously uneconomic low-grade deposits, deep-sea hydrothermal vents, and ultimately near-Earth metallic asteroids (such as 16 Psyche) become profitable to mine.',
    'Because Gold’s atomic identity is locked inside its nucleus rather than a mutable server database, it scores 0.90 / 1.00 on Historical Immutability and the Physical Arrow of Time. Gold possesses only a single stable isotope (197Au) protected by an ~8 MeV/nucleon nuclear binding energy barrier; it does not oxidize, corrode, or radioactively decay over geological epochs, and transmuting mercury (198Hg) or platinum (196Pt) into gold inside a particle accelerator or nuclear reactor requires orders of magnitude more energy than the metal is worth. However, physical gold loses 0.10 against cryptographic Proof-of-Work on two empirical fronts: first, because tungsten (W-74) possesses an atomic density of 19.25 g/cm³—nearly identical to gold’s 19.30 g/cm³—counterfeiters routinely drill out 400-oz Good Delivery and 1-kg bars to insert tungsten cores, requiring expensive ultrasonic velocity or X-ray fluorescence (XRF) + destructive core assays rather than a millisecond cryptographic hash check; second, humanity has zero ability to audit the true total circulating supply of gold in Fort Knox, the New York Fed, or the PBOC without physically entering and assaying sovereign vaults.',
    'Under the stress of a wartime network partition, Physical Gold exhibits a stark physical dichotomy that yields a 0.65 / 1.00 on Dynamic Availability. On one hand, for face-to-face local commerce inside a blacked-out city where power grids and undersea fiber-optic cables are completely destroyed, a physical gold coin in your palm achieves 100% offline availability with zero electricity, zero bandwidth, and zero risk of a post-partition chain reorganization wiping out settled trades. On the other hand, across a severed ocean, sovereign border blockade, or wartime airspace closure, physical gold’s remote transaction throughput drops to an absolute 0.0 TPS—atoms cannot cross a naval blockade over radio waves or satellite links. Worse still, when geopolitical conflict erupts, centralized gold vaults halt redemptions immediately: from President Franklin D. Roosevelt’s Executive Order 6102 in 1933 (confiscating private US gold under penalty of 10 years imprisonment) to the Bank of England freezing Venezuela’s and Russia’s sovereign gold reserves, vaulted gold fails precisely when geopolitical trauma peaks.',
    'Examining Gold’s State Machine Topology (0.55 / 1.00) and Thermodynamic Velocity (0.05 / 1.00, where M -> 0 for digital telecommunications) exposes the exact physical tragedy that birthed modern fiat currency and paper custodial capture. Because physical gold is heavy, expensive to guard, impossible to divide cleanly into micro-cent dust for machine-to-machine payments, and incapable of executing native programmable covenants, humanity surrendered bearer custody and locked its gold inside centralized bank vaults in exchange for paper receipts—culminating in the 1933 confiscation, the 1971 Nixon Shock default, today’s 100:1 fractional-reserve LBMA unallocated paper gold market, COMEX futures suppression, and tokenized gold wrappers (PAXG / XAUT) that bake centralized `freezeAddress` confiscation switches right back into ERC-20 smart contracts. When Germany’s Bundesbank demanded the physical repatriation of just 674 tons of its own gold from New York and Paris in 2013, moving and re-assaying the metal took four full years (2013–2017). A physical element capped at the speed of an armored Brinks truck and a 600-mph cargo jet stands in direct physical contrast to Kaspa’s Proof-of-Work BlockDAG—which dematerializes thermodynamic work into unforgeable kHeavyHash photons that travel across global fiber-optic cables and satellite links at 200,000 km/s, settling parallel, cryptographically verifiable UTXO state transitions natively on Layer 1 at 10 blocks per second (M = 1.0).',
    'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating, as every physical metric—from r-process neutron-star nucleosynthesis (197Au), the ~3,600-tonne/year (~1.5%) mining expansion at ~150 GJ/kg, and the 19.25 g/cm³ tungsten density-spoofing vector to Executive Order 6102 (1933), the 1971 Bretton Woods custodial default, the 2013–2017 four-year Bundesbank repatriation delay, and the 0.0 BPS fiber-optic teleportation ceiling—is empirically verifiable in nuclear physics, geological mining records, and monetary history. Physical Gold scores a 4.10 out of 6.00 (68.3%) across the six thermodynamic invariants (01: 1.00, 02: 0.95, 03: 0.90, 04: 0.65, 05: 0.55, 06: 0.05), earning a compliance grade of B. It is the undisputed champion of analog, offline atomic bearer matter, but its inability to teleport mass at the speed of light doomed it to centralized vault capture—leaving Kaspa’s Proof-of-Work BlockDAG as the photonic evolution of thermodynamic money.'
  ],

  XAG: [
    'Evaluating Physical Silver (XAG / Atomic Element 47) against the six physical invariants of a sovereign ledger reveals humanity’s historic grassroots coinage metal—an astrophysical element born in supernova explosions that passes Existential Sovereignty without compromise, yet suffers even more severely than gold under modern global settlement demands due to byproduct supply elasticity, ~80x heavier value-to-weight bulk, and zero fiber-optic velocity. At the foundational layer of Existential Sovereignty and Entity Decoupling, Physical Silver passed at Genesis (1.00 / 1.00). Forged in stellar nucleosynthesis prior to Earth’s formation with zero corporate founder, zero foundation treasury, zero ICO, and zero remote protocol kill-switch, physical silver held in direct bearer possession cannot be frozen or deleted by any software update or central bank decree.',
    'This sovereign elemental baseline is backed by a genuine adherence to the Thermodynamic Cost Floor (E > 0, scored 0.85 / 1.00). Extracting, crushing, and smelting roughly ~26,000 metric tons of silver annually requires continuous real-world diesel, mechanical, and electrical energy expenditure across global mines and refineries. However, complete thermodynamic honesty requires noting two structural supply vulnerabilities that deduct 0.15 compared to a mathematically capped Proof-of-Work ledger: first, Silver has no terminal supply cap in the Earth’s crust; second, roughly ~72% of all newly mined silver is produced not from primary silver mines, but as an inelastic byproduct of copper, lead, zinc, and gold extraction—meaning industrial base-metal mining continues dumping silver supply onto the market even when silver’s monetary demand fluctuates.',
    'On the invariant of Historical Immutability and the Physical Arrow of Time, Physical Silver scores 0.85 / 1.00. Its two stable isotopes (107Ag and 109Ag) are locked behind nuclear binding energy walls that make artificial transmutation economically impossible. Nevertheless, silver reacts chemically with atmospheric sulfur to form silver sulfide tarnish (Ag2S), and in wholesale bar markets (100-oz and 1,000-oz COMEX bars), silver’s density (10.49 g/cm³) is routinely spoofed using lead, molybdenum, or copper-core cladding—requiring ultrasonic, conductivity (eddy-current), or destructive drill assays while offering zero ability to cryptographically audit global vault inventories.',
    'Under the stress of a wartime network partition, Physical Silver scores 0.55 / 1.00 on Dynamic Availability. For local, hand-to-hand civilian bartering during an electrical grid collapse, 1-oz silver coins are arguably more practical than gold for purchasing everyday groceries or fuel without electricity or internet. However, for cross-border or transoceanic settlement, silver’s ~80-to-1 gold-to-silver value ratio turns its physical mass into a logistical anchor: settling just $30 million in physical silver requires moving roughly 30 metric tons of metal across blockaded oceans and borders—collapsing remote wartime throughput to 0.0 TPS while sovereigns historically nationalize silver stocks (such as the US Silver Purchase Act and Executive Order 6814 of 1934).',
    'Examining Silver’s State Machine Topology (0.35 / 1.00) and Thermodynamic Velocity (0.05 / 1.00) exposes why physical bulk destroys bearer decentralization at scale. Because storing $1,000,000 of wealth in physical silver weighs nearly one full metric ton (~900+ kg), ordinary citizens and institutions cannot easily transport or self-custody large silver balances—driving the overwhelming majority of global silver trading into centralized JPMorgan/LBMA custodian vaults, unallocated paper accounts, SLV ETF shares, and heavily leveraged COMEX paper futures contracts with zero native programmability. Moving tons of industrial metal via freighters and armored trucks at 20 knots cannot compete with Kaspa’s stateless Proof-of-Work BlockDAG settling weightless, cryptographically verified thermodynamic value globally in 100ms blocks (M = 1.0).',
    'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating across geological, metallurgical, and monetary records—from supernova nucleosynthesis (107Ag/109Ag) and ~26,000-tonne annual extraction (~72% base-metal byproduct share) to Executive Order 6814 (1934) silver nationalization, ~1-ton-per-$1M storage bulk, COMEX paper derivative leverage, and the 0.0 BPS digital teleportation limit. Physical Silver scores a 3.65 out of 6.00 (60.8%) across the six thermodynamic invariants (01: 1.00, 02: 0.85, 03: 0.85, 04: 0.55, 05: 0.35, 06: 0.05), earning a compliance grade of C+. It remains a resilient analog barter coin for local blackouts, but its crushing physical weight per dollar makes it obsolete for high-velocity global commerce.'
  ],

  KAS: [
    'Evaluating Kaspa (KAS) against the six physical invariants of a sovereign ledger reveals the benchmark parameterless Proof-of-Work BlockDAG engineered from first principles to obey the laws of thermodynamics without corporate capture, genesis premines, or single-chain bottlenecks. At the foundational layer of Existential Sovereignty and Entity Decoupling, Kaspa passed at Genesis without compromise. Launched on November 7, 2021 from an immaculate empty genesis state following polymath Yonatan Sompolinsky’s GHOSTDAG and PHANTOM peer-reviewed research, the network entered existence with zero premine, zero instamine, zero ICO, zero venture capital token cliffs, zero corporate foundation treasury, and a strictly 0% protocol coinbase developer tax. Unlike corporate Proof-of-Stake ledgers or taxed Proof-of-Work chains that hardcode founder spigots into consensus, no legal entity, CEO, or administrative multisig holds privileged protocol keys, freeze switches, or upgrade overrides—leaving the rusty-kaspa consensus engine completely decoupled from institutional coercion or regulatory subpoena.',
    'This parentless, sovereign foundation is anchored to an unyielding adherence to the Thermodynamic Cost Floor (E > 0). Every single atomic sompi (10^-8 KAS) across Kaspa’s deterministic 28.7-billion maximum supply (~96.79% already mined under its smooth monthly geometric Chromatic Halving schedule that reduces block subsidies by (1/2)^(1/12) every month) is forged exclusively through the irreversible dissipation of real-world electrical megawatts across dedicated optical-matrix kHeavyHash ASIC silicon. Because 100% of monetary issuance is earned through open, untaxed bare-metal hash work with zero pre-printed insider bags, Kaspa completely eliminates the Cantillon extraction loop—forcing every participant on Earth to expend real kinetic energy to write state to the ledger.',
    'Because Kaspa welds state finality directly to irreversible heat dissipation, it satisfies the invariant of Historical Immutability and the Physical Arrow of Time with mathematical finality. Governed by the Second Law of Thermodynamics and Landauer’s Principle (ΔQ ≥ kB·T·ln2), rewriting settled Kaspa blocks requires an adversary to physically re-burn every megawatt-hour of global ASIC work accumulated across the BlockDAG since that block was sealed. Furthermore, while rusty-kaspa maintains a lightweight ~30-hour rolling pruning horizon so ordinary operators can run bare-metal full nodes on consumer NVMe storage without terabyte bloat, newly syncing nodes never rely on trusted corporate Amazon S3 snapshots or social Weak Subjectivity checkpoints; instead, nodes cryptographically verify cumulative Proof-of-Work all the way from Genesis via deterministic Pruning Point and Proof-of-Proof-of-Work (PoPoW) header chains.',
    'Under the stress of a wartime network partition, Kaspa’s GHOSTDAG and parameterless DAGKNIGHT consensus architecture achieves complete Dynamic Availability across both the blackout and the subsequent cable resplice. Whereas Byzantine Fault Tolerant (BFT) Proof-of-Stake databases suffer instant global cardiac arrest the moment an undersea fiber-optic cable cut isolates 33.4% of stake, isolated Kaspa hemispheres dynamically retarget difficulty every single 100ms block via KIP-0004 Sampled DAA over a 26,410-block sliding window—smoothly ramping both severed continents back to 10.0 blocks per second along surviving local power grids. Crucially, at the moment the severed undersea cable is repaired and respliced, Kaspa does not execute Nakamoto’s destructive single-chain reorganization that orphans and wipes out the minority continent’s blocks, burned joules, and settled commerce; instead, the BlockDAG organically merges both parallel continental sub-DAGs into a single unified graph ordered deterministically by cumulative Blue Work with 0.0% honest work destruction.',
    'Examining Kaspa’s State Machine Topology and Thermodynamic Velocity (M = 1.0) exposes why generalizing Nakamoto consensus from a sequential line into a parallel directed acyclic graph solves the blockchain trilemma within the laws of physics. Kaspa rejects monolithic shared-account virtual machines (EVM/SVM) that trap global commerce inside sequential write locks, gas wars, reentrancy exploits, and predatory MEV sandwich queues. Instead, Kaspa operates a stateless, contention-free parallel Extended UTXO graph upgraded on June 30, 2026 at DAA score 474,165,565 with the Toccata hardfork—embedding native Layer-1 Covenants, SilverScript smart-contract programmability, KIP-21 subnetwork sequencing lanes, and succinct Zero-Knowledge verification opcodes directly into base silicon consensus. Running live at 10 blocks per second (100ms block intervals) on the Crescendo mainnet, Kaspa weaves 100% of concurrent global hash power into consensus simultaneously without discarding competing blocks as wasted orphans—achieving optimal Thermodynamic Velocity (M = 1.0).',
    'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating, as every architectural metric—from the November 7, 2021 zero-premine genesis launch, the 28.7-billion Chromatic emission schedule, and 100% untaxed kHeavyHash ASIC Proof-of-Work to cryptographic PoPoW pruning proofs, KIP-0004 per-block DAA partition recovery, zero-amputation Blue-Work sub-DAG resplicing, the June 30, 2026 Toccata covenant activation (DAA 474,165,565), and ~2.5+ billion mainnet transactions settled at 10 BPS—is empirically verifiable in the kaspanet/rusty-kaspa Rust codebase, KIP protocol specifications, and live mainnet telemetry. Kaspa scores a 6.00 out of 6.00 across all six thermodynamic invariants, earning a terminal compliance grade of A+. It is the sovereign, high-velocity Proof-of-Work BlockDAG standard against which all other digital ledgers are measured.'
  ],

  SUI: [
    'Evaluating Sui (SUI) against the six physical invariants of a sovereign ledger exposes a Silicon Valley corporate database born directly out of Facebook’s aborted Diem surveillance-coin project, masquerading as a high-speed "DAG" while retaining full administrative power to freeze and confiscate user funds without private keys. At the foundational layer of Existential Sovereignty and Entity Decoupling, Sui failed at Genesis. Architected by Palo Alto-based for-profit Mysten Labs (founded by former Meta Novi executives) and governed alongside the Cayman Islands-registered Sui Foundation, the network raised over $336 million from venture syndicates including a16z crypto, Jump Crypto, Apollo, Binance Labs, and Franklin Templeton. When Mainnet launched in May 2023, the founders conjured the entire 10-billion SUI maximum supply out of thin air in a configuration file, routing 50% into Sui Foundation reserves while carving up the remaining 50% among Mysten Labs’ corporate treasury, early insiders, venture capitalists, and exchange launchpads—with zero fair-launch mining. Live consensus is restricted to a tiny oligopoly of roughly 110 enterprise validators requiring industrial data-center hardware and tens of millions of staked SUI. The ultimate proof that Sui possesses zero entity decoupling arrived during the May 2025 Cetus DEX exploit: within hours, the Sui Foundation centrally coordinated with validators to blacklist the attacker’s addresses via local TransactionDenyConfig files, freezing $162 million on-chain, and Mysten Labs subsequently shipped custom protocol code (transaction_allow_list_skip_all_checks) enabling a validator stake vote to forcibly seize and transfer those tokens out of self-custodial addresses without a cryptographic private-key signature. Any ledger where a corporate foundation and a hundred validators can deploy a signature-bypass patch to confiscate wallets is a permissioned bank, not sovereign money.',
    'This administrative omnipotence rests upon a total violation of the Thermodynamic Cost Floor (E > 0). Sui operates on Delegated Proof-of-Stake (DPoS), selecting validator voting weight strictly according to staked token balances across 24-hour epochs without expending a single joule of irreversible Proof-of-Work. Every atomic unit of its 10-billion SUI supply cap was printed at a physical cost of strictly 0 Joules. Rather than forcing participants to burn continuous megawatts of real-world electricity across bare-metal silicon to earn issuance, Sui institutionalized a textbook Cantillon extraction engine: insiders, venture funds, and the Foundation staked pre-printed treasury allocations to harvest liquid staking subsidies and dump zero-cost yield onto retail buyers—triggering regulatory probes in South Korea and years of relentless monthly cliff-unlock dilution stretching to 2030. Calling a token scarce because its total supply is capped at 10 billion means nothing when the entire supply was conjured in a spreadsheet for zero energetic sacrifice.',
    'Because Sui completely severs state finality from irreversible heat dissipation, it catastrophically fails the invariant of Historical Immutability and the Physical Arrow of Time. In a genuine Proof-of-Work ledger, historical blocks are calcified by the Second Law of Thermodynamics: rewriting the past requires an adversary to physically re-burn every megawatt-hour of electricity expended by the global ASIC fleet since that block was sealed. In Sui’s zero-joule DPoS model, state transitions are sealed every epoch via weightless digital signatures on CertifiedCheckpointSummary records, giving the ledger zero physical mass. Worse still, because high-throughput Move execution generates massive database bloat, standard Sui validators and full nodes aggressively prune historical object versions and transaction effects after just a few epochs, forcing newly syncing nodes to abandon trustless genesis verification and download centralized State Snapshots hosted on Amazon S3 and cloud buckets operated by Mysten Labs. Because signing checkpoints costs 0 Joules—and because a two-thirds validator supermajority has already proven via the May 2025 Cetus confiscation upgrade that it can override cryptographic ownership rules by decree—Sui’s history exists entirely at the mercy of human governance.',
    'Under the stress of a wartime network partition, Sui’s Mysticeti Byzantine Fault Tolerant (BFT) consensus protocol destroys its Dynamic Availability by explicit mathematical design. Both Sui’s owned-object fast path and its Mysticeti uncertified DAG consensus require continuous communication and a strict supermajority quorum exceeding two-thirds (>66.7%, or 2f+1) of staked voting weight to certify and commit transactions. If a geopolitical internet blackout, cloud-provider takedown, sovereign firewall, or severed undersea fiber-optic cable isolates data centers holding just 33.4% of staked SUI, global settlement immediately flatlines. In fact, Sui does not even need a wartime cable cut to suffer complete cardiac arrest—it routinely halts itself during peacetime: Mainnet froze completely for 2.5 hours in November 2024 due to a validator crash loop, stalled again over a consensus bug in January 2026, and suffered three separate global mainnet halts across May 28–30, 2026—including a nearly seven-hour blackout triggered by a v1.72 gas-logic underflow bug and a stalled Distributed Key Generation randomness handoff at an epoch boundary—paralyzing billions in DeFi until Mysten Labs engineers compiled emergency binary patches. While a stochastic Proof-of-Work engine dynamically adjusts to surviving local silicon hash power and keeps settling commerce across severed continents, Sui flatlines whenever a bug or fiber cut disrupts its validator supermajority.',
    'Examining Sui’s State Machine Topology exposes the marketing sleight of hand behind its Move Virtual Machine "object-centric" parallelism, while its zero-joule gossip layer fails Thermodynamic Velocity (M = 1.0). Sui heavily promotes the fact that simple transfers of single-owner objects bypass full consensus, yet all meaningful global financial coordination—DEX liquidity pools, order books, lending markets, and bridges—relies on shared objects that must funnel straight back through Mysticeti consensus sequencing and sequential per-object read/write locks. Whenever trading volume spikes on a hot shared pool, Sui imposes local congestion pricing and relies on a hardcoded ConsensusOverloadChecker that actively cancels already-sequenced user transactions post-consensus to keep validator CPUs from choking, all while forcing users to lock SUI into a state-rent Storage Fund and baking native RegulatedCoin freeze switches into Layer 1. Meanwhile, Sui hijacks the "DAG" label to confuse investors into equating Mysticeti—a permissioned BFT message-passing graph among ~110 corporate servers expending zero energy (M = 0)—with a true Nakamoto BlockDAG. A zero-joule server cluster that cancels congested shared-object trades and crashes three times in a single weekend stands as the polar opposite of Kaspa’s stateless, contention-free Proof-of-Work BlockDAG, where 100% of open, concurrent global hash power settles parallel UTXO state transitions natively on Layer 1 at 10+ blocks per second without validator blacklists, signature-bypass confiscations, or partition halts (M = 1.0).',
    'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating, as every architectural failure—from the 10-billion zero-joule genesis premine and VC insider allocations to S3 snapshot pruning, Mysticeti’s 2f+1 partition halt threshold, the May 2025 TransactionDenyConfig freeze and transaction_allow_list_skip_all_checks keyless asset seizure, and the November 2024, January 2026, and May 2026 mainnet blackouts—is empirically verifiable in the MystenLabs/sui Rust codebase, governance records, and official incident postmortems. Sui scores a 0 out of 6 across all thermodynamic invariants, resulting in a terminal compliance grade of F. It is not a decentralized BlockDAG or sovereign money; it is Facebook’s recycled corporate ledger running on venture-backed cloud servers with built-in confiscation switches and chronic downtime.'
  ],

  ADA: [
    'Evaluating Cardano (ADA) against the six physical invariants of a sovereign ledger exposes a multi-billion-dollar academic bureaucracy coasting on peer-reviewed whitepapers, masquerading as a decentralized UTXO computer while resting on a massive zero-joule genesis premine, seven years of federated administrative keys, and a plutocratic governance loop. At the foundational layer of Existential Sovereignty and Entity Decoupling, Cardano failed at Genesis. Architected by Charles Hoskinson’s for-profit engineering firm Input Output Global (IOG, formerly IOHK) alongside commercial venture arm EMURGO and the Swiss-registered Cardano Foundation, the network launched its Byron Mainnet in September 2017 by conjuring 31,112,484,646 ADA out of thin air in a ByronGenesis configuration file—representing 69.14% of the 45-billion maximum supply—with zero fair-launch mining. While 25,927,070,538 ADA (57.62% of total supply) were sold via pre-launch paper vouchers across four tranches in Japan for fractions of a cent ($0.0020–$0.0026), the founders minted an additional 5,185,414,108 ADA (11.52% of max supply) and gifted it directly to their own corporate triumvirate—handing 2.46 billion ADA to IOHK, 2.07 billion ADA to EMURGO, and 648 million ADA to the Cardano Foundation with zero ledger-enforced vesting cliffs. Worse still, for over seven years until the January 2025 Plomin hard fork, hard-coded Genesis Keys (updateQuorum: 5 of 7 keys held by the founding entities) granted the corporate triumvirate unilateral administrative authority over the ledger. During the Shelley and Allegra hard forks, the founding entities wielded those Genesis Keys to execute the returnRedeemAddrsToReserves protocol override—unilaterally sweeping roughly 318 million unredeemed ICO voucher ADA out of genesis addresses, delegating the swept funds to stake pools to harvest ~25 million ADA in staking yield, and funneling millions into corporate trusts and the Intersect organization without an on-chain vote (CID-202503). Even after retiring the Genesis Keys into CIP-1694 on-chain governance, Cardano’s "one Lovelace = one vote" DRep model permanently cements control of protocol upgrades and the 1.69-billion ADA on-chain treasury in the hands of the original pre-mined insiders and voucher whales.',
    'This entrenched plutocracy rests upon a total violation of the Thermodynamic Cost Floor (E > 0). Cardano operates on Ouroboros Praos, a Delegated Proof-of-Stake (DPoS) protocol that selects slot leaders via a private, stake-weighted Verifiable Random Function (VRF) lottery across five-day epochs without expending a single joule of irreversible Proof-of-Work. Every atomic Lovelace of its 45-billion ADA supply cap—both the 31.11-billion genesis premine and the 13,887,515,354 ADA protocol reserve—was conjured at a physical cost of strictly 0 Joules. Rather than forcing miners to burn continuous megawatts of real-world electricity across bare-metal ASIC silicon to earn issuance, Cardano institutionalized a frictionless Cantillon extraction engine: every five days, the protocol bleeds out roughly 0.3% (ρ = 0.003) of the remaining reserve pot, routing 80% directly to stake pool operators and genesis bag-holders with zero lock-up or slashing risk while siphoning 20% (~4.32 million ADA per epoch) into an on-chain treasury tapped by ecosystem insiders. Calling ADA sound money because its supply is capped at 45 billion means nothing when the entire supply was keystroked into a JSON file for zero energetic sacrifice.',
    'Because Cardano completely severs state finality from irreversible heat dissipation, it catastrophically fails the invariant of Historical Immutability and the Physical Arrow of Time. In a genuine Proof-of-Work ledger, historical blocks are calcified by the Second Law of Thermodynamics: rewriting the past requires an adversary to physically re-burn every megawatt-hour of electricity expended by the global ASIC fleet since that block was sealed. In Cardano’s zero-joule Ouroboros model, the arrow of time is merely simulated using software timers—specifically Key Evolving Signatures (KES, which force nodes to delete old private keys every 129,600 slots with maxKESEvolutions: 62) and a rolling stability window anchored to the security parameter k = 2160 blocks (3k/f = 36 hours). Because re-verifying years of zero-work VRF signatures and Plutus scripts from Genesis degrades sync times across consumer hardware, the ecosystem increasingly relies on Mithril stake-based certificate snapshots to fast-bootstrap nodes without trustlessly validating every historical state transition from block zero. Because signing Ouroboros blocks costs 0 Joules—and because the founding entities already proved during the Allegra hard fork that a protocol upgrade can sweep and reallocate hundreds of millions of unspent genesis ADA by administrative decree—Cardano’s history is protected by mutable software conventions rather than physical mass.',
    'Under the stress of a wartime network partition, Cardano’s Ouroboros consensus carries a fatal mathematical horizon that destroys its Dynamic Availability. While Ouroboros avoids the instant 33.4% halt threshold of BFT databases by adopting a Nakamoto-style longest-chain rule for transient hiccups, its security math collapses the moment a geopolitical internet blackout, undersea fiber-optic cable cut, or sovereign firewall fractures the network for longer than its 36-hour (3k/f, or 2,160-block) rolling finality window. Once isolated sub-networks diverge beyond 2,160 blocks, Ouroboros Genesis chain-density rules break down under adversarial stake splits; without objective Proof-of-Work cumulative difficulty to mathematically prove which branch burned more physical energy, the severed continents permanently fork into incompatible ledgers until human operators coordinate a centralized social hard fork. In fact, Cardano does not even need a wartime cable cut to fracture—its monoculture IntersectMBO/cardano-node Haskell stack routinely destabilizes during peacetime: on January 22, 2023 (CID-202301), an edge-case anomaly between blocks 8,300,569 and 8,300,570 simultaneously crashed and restarted over 50% of all mainnet relay and block-producing nodes; and on November 21, 2025, a single malformed transaction exploiting a cryptographic library version discrepancy in cardano-node split the live Cardano mainnet into two competing parallel histories—the mutated "pig" chain and the canonical "chicken" chain—for 14 hours, freezing exchange deposits and withdrawals worldwide and corrupting DeFi state until Stake Pool Operators, IOG, EMURGO, and the Cardano Foundation manually coordinated emergency node patches.',
    'Examining Cardano’s State Machine Topology exposes the severe concurrency bottleneck behind its heavily marketed Extended UTXO (eUTXO) and Plutus smart contract model, while its throttled slot timer fails Thermodynamic Velocity (M = 1.0). Cardano promotes its deterministic eUTXO architecture as superior to Ethereum’s mutable Account model, yet it traps that UTXO graph inside a sequential, single-file blockchain throttled by a hardcoded activeSlotCoeff of f = 0.05—meaning 95% of its one-second slots sit completely empty, yielding just one block roughly every 20 seconds capped by rigid maxBlockBodySize (~88 KB) and maxBlockExUnits Plutus CPU/memory ceilings. Because a specific smart contract UTXO can only be consumed once per 20-second block, any real-time global financial coordination—DEX liquidity pools, order books, or lending markets—immediately slams into a wall of UTXO state contention, forcing Cardano DeFi protocols (such as Minswap and SundaeSwap) to route user trades through centralized, off-chain "batcher" servers and sequential scoopers while forcing users to lock native ADA inside every token UTXO via coinsPerUTXOByte state rent. Meanwhile, endlessly promised scaling fixes like Hydra state channels and Ouroboros Leios remain fragmented off-chain band-aids or unshipped testnet theory even after the July 2026 van Rossem upgrade. A zero-joule (M = 0) sequential chain that idles for 19 out of every 20 seconds, splits into "pig" and "chicken" forks for 14 hours over a single malformed transaction, and requires off-chain batchers to execute a basic DEX swap stands as the polar opposite of Kaspa’s stateless, contention-free Proof-of-Work BlockDAG, where 100% of open, concurrent global hash power settles parallel UTXO state transitions natively on Layer 1 at 10+ blocks per second without genesis premines, off-chain batchers, or 20-second concurrency bottlenecks (M = 1.0).',
    'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating, as every architectural failure—from the 31,112,484,646 ADA zero-joule genesis premine, the 5.18-billion ADA corporate triumvirate allocation, and the CID-202503 318-million ADA Genesis Key reserve sweep to the 0 Joule Ouroboros Praos VRF lottery, the 36-hour (k = 2160) partition divergence horizon, the f = 0.05 20-second eUTXO concurrency bottleneck, and the January 2023 (CID-202301) 50% node crash and November 2025 14-hour "pig vs. chicken" mainnet chain split—is empirically verifiable in the IntersectMBO/cardano-node Haskell codebase, ByronGenesis and ShelleyGenesis JSON configuration files, CIP-1694 governance records, and official incident postmortems. Cardano scores a 0 out of 6 across all thermodynamic invariants, resulting in a terminal compliance grade of F. It is not sound money or a peer-reviewed decentralized computer; it is a zero-joule academic aristocracy coasting on a 2017 Japanese voucher premine, off-chain DeFi batchers, and circular stake-pool inflation.'
  ],

  XMR: [
    'Evaluating Monero (XMR) against the six physical invariants of a sovereign ledger reveals a genuine, battle-hardened cypherpunk Proof-of-Work currency that honors the laws of energy conservation and rejected corporate extraction from birth, yet remains structurally compromised by a single-chain topology that destroys honest work and settled commerce upon partition resplicing, an unpruneable cryptographic state database, and a 20-minute wallet spend lock. At the foundational layer of Existential Sovereignty and Entity Decoupling, Monero passed at Genesis with flying colors. Launched on April 18, 2014, as BitMonero by pseudonymous Bitcoin Talk user thankful_for_today—specifically as a clean-room fork of the CryptoNote protocol after the community exposed Bytecoin’s fraudulent 82% genesis premine—Monero entered existence with zero premine, zero instamine, zero ICO, zero venture capital syndicates, and zero corporate foundation tax. When thankful_for_today attempted to unilaterally push unannounced merged-mining and block-reward changes five days after launch, a grassroots coalition led by the Monero Core Team executed a clean community fork, establishing an open-source governance culture funded entirely through volunteer donations via the Community Crowdfunding System (CCS) and the Monero Research Lab (MRL). There are no admin keys, no blacklists, and no corporate boards capable of freezing a single piconero. However, complete honesty requires auditing Monero’s operational mining distribution: as of late October 2026, with global network hashrate operating near 7.12 GH/s (following its 7.54 GH/s peak at block height 3,589,072), three centralized mining pools—SupportXMR (1.87 GH/s, 26.3%), Nanopool (1.23 GH/s, 17.3%), and Kryptex (1.17 GH/s, 16.4%)—control 60.0% of total network hash power while decentralized P2Pool accounts for roughly 6.6%. Worse still, between August 11 and August 12, 2025 (across block window 3,475,729 to 3,475,850), the external Qubic protocol directed mercenary CPU hash power to capture 63 out of 122 blocks—briefly crossing the 51% dominance threshold and executing multi-block selfish-mining reorganizations on live mainnet.',
    'This sovereign, premine-free foundation is anchored to a genuine adherence to the Thermodynamic Cost Floor (E > 0). Unlike zero-joule Proof-of-Stake ledgers that conjure supply in configuration files, every single atomic piconero (10^-12 XMR) across Monero’s ~18.83 million circulating supply was forged through the irreversible dissipation of real-world electrical energy. Furthermore, Monero solved Bitcoin’s long-term fee-cliff security dilemma by activating its perpetual Tail Emission in June 2022 at block 2,641,623 (FINAL_SUBSIDY_PER_MINUTE = 300000000000 piconero), permanently locking block rewards at 0.6 XMR per two-minute block (432 XMR per day, or 157,788 XMR per year—a diminishing sub-0.84% annual disinflation rate) so miners always face an unyielding thermodynamic floor. Yet Monero’s ideological commitment to "ASIC resistance" via its RandomX (rx/0) algorithm introduces a major physical trade-off in how that energy is anchored. By requiring over 2 GB of L3 cache and RAM scratchpad per mining thread to execute randomized virtual machine programs on general-purpose x86 and ARM CPUs, Monero refuses to rely on single-purpose ASIC silicon whose sole physical utility in the universe is securing its ledger. General-purpose CPUs are multipurpose, rentable capital—meaning botnets, cloud server farms, and external incentive parasites like Qubic can dynamically point hash power at or away from Monero without holding dedicated hardware skin in the game, even as Bitmain eroded pure commodity CPU parity by deploying commercial Antminer X5 (212 KH/s at 1,350W) and X9 RandomX rigs.',
    'On Historical Immutability and the Physical Arrow of Time (0.60 / 1.00), Monero seals blocks with real RandomX kinetic work yet lands in the 0.50–0.70 rubric bracket due to live >51% reorganization history, compiled checkpoints, and opaque cryptographic supply commitments. First, across August 11–12, 2025 (blocks 3,475,729 to 3,475,850), Qubic’s rentable CPU offensive captured 63 of 122 blocks (>51%) and executed live multi-block selfish-mining reorganizations on mainnet. Second, because Monero relies on scheduled hard forks (operating on protocol v16 since block 2,689,608 and release v0.18.5.4 as of October 2026), monero-project/monero embeds compiled checkpoints.dat block hashes and DNS checkpoints while --prune-blockchain discards seven-eighths of historical ring signature data. Third, Ring Confidential Transactions (RingCT) obscure all values behind Pedersen commitments and Bulletproofs+ range proofs—sacrificing plaintext arithmetic UTXO supply auditability if an implementation bug (such as 2017’s critical CVE-2017-18350 key-image inflation vulnerability) were ever silently exploited.',
    'Under the stress of a wartime network partition, Monero’s sequential single-chain architecture survives the initial blackout but catastrophically fails Dynamic Availability at the moment of network resplicing. During the partition itself, Monero avoids the instant 2f+1 (>66.7%) supermajority halt threshold that paralyzes Byzantine Fault Tolerant (BFT) Proof-of-Stake databases: its per-block difficulty adjustment algorithm (DIFFICULTY_WINDOW = 720 blocks, stripping the top and bottom DIFFICULTY_CUT = 60 extreme timestamps across a rolling 600-block / 20-hour window) dynamically scales down to match surviving local CPU silicon, as proven during the March 4, 2024 mempool flood (CRYPTONOTE_BLOCK_GRANTED_FULL_REWARD_ZONE_V5 = 300000 bytes dynamic block expansion) and the August 2025 Qubic selfish-mining offensive across blocks 3,475,729–3,475,850. However, because Monero forces consensus into a single sequential chain rather than a parallel BlockDAG, repairing a severed undersea fiber-optic cable triggers Blockchain::switch_to_alternative_blockchain—a deep Nakamoto chain reorganization that ruthlessly orphans and annihilates the entire minority continent’s ledger history. Every Joule of electricity burned by miners on the minority partition is destroyed (M < 1.0), every 0.6 XMR block reward minted after the split is erased, and because coinbase rewards unlock after 60 blocks (CRYPTONOTE_MINED_MONEY_UNLOCK_WINDOW = 60, or ~2 hours), every downstream commercial transaction that touched newly mined XMR in a multi-hour partition is permanently wiped out. Worse still, Monero’s RingCT architecture turns a post-partition resplice into a cascading transaction massacre even for innocent users spending pre-partition coins: because wallets construct 16-member ring signatures using a gamma distribution that heavily selects recent outputs from the newest blocks (anything past the 10-block / 20-minute lock), the moment the minority branch is orphaned, those decoy outputs vanish and global output indices shift—rendering thousands of honest user transactions cryptographically invalid (tx_verification_context::m_verifivation_failed) so they cannot even be re-mined from the txpool. While a Proof-of-Work BlockDAG seamlessly merges both parallel continental branches upon resplicing without destroying a single honest block, Joule of work, or non-conflicting payment, Monero’s single-file chain is forced to murder one half of its own wartime economy to restore a single line of history.',
    'Examining Monero’s State Machine Topology exposes the permanent storage bloat of its cryptographic privacy architecture, while its sequential block timer and mandatory spend locks severely bottleneck Thermodynamic Velocity (M = 1.0). Under Monero’s CryptoNote stealth-address and RingCT model (ring size = 16, with Full-Chain Membership Proofs FCMP++ and CARROT still undergoing v0.19.0.0-beta.3.0 stressnet testing at block 3,102,800 as of late 2026), every spend hides the real input among 15 historical decoys and publishes a unique cryptographic key_image to prevent double-spending. Because no node on earth can determine which output in a ring was genuinely consumed, the protocol can never prune spent outputs from its active state database—forcing full nodes to store an endlessly expanding LMDB state file of over 150 million stealth outputs and every spent key_image in history forever. Worse still for transactional velocity, src/cryptonote_config.h hardcodes a sequential single-chain block target of DIFFICULTY_TARGET_V2 = 120 seconds alongside a mandatory consensus lock of CRYPTONOTE_DEFAULT_TX_SPENDABLE_AGE = 10 blocks. Whenever a user receives XMR—or receives their own leftover change output from sending a payment—that balance is cryptographically locked and unspendable on-chain for 20 full minutes to prevent routine chain reorganizations from invalidating ring-signature decoys on dependent transactions. A sequential 120-second blockchain that orphans competing blocks (M < 1.0), wipes out honest transactions via decoy-index poisoning during reorgs, permanently accumulates unpruneable key_image state bloat, and freezes a user’s wallet change for 20 minutes after every single transaction cannot match the structural velocity of Kaspa’s stateless, contention-free Proof-of-Work BlockDAG, where 100% of open, concurrent global hash power settles parallel, prunable UTXO state transitions natively on Layer 1 at 10+ blocks per second without 20-minute spend locks or resplice orphan destruction (M = 1.0).',
    'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating, as every architectural metric—from the April 18, 2014 zero-premine genesis launch, the 0.6 XMR perpetual tail emission (FINAL_SUBSIDY_PER_MINUTE), the October 2026 60% top-three pool concentration, and the August 2025 Qubic 63-of-122 block (>51%) reorganization to compiled checkpoints.dat hashes, CVE-2017-18350 patch history, the Blockchain::switch_to_alternative_blockchain resplice orphan wipeout, CRYPTONOTE_MINED_MONEY_UNLOCK_WINDOW = 60, cascading RingCT decoy-index invalidation, the unpruneable 150M+ output/key_image state set, and DIFFICULTY_TARGET_V2 = 120s with its 20-minute spend lock—is empirically verifiable in the monero-project/monero C++ codebase. Monero scores 3.50 out of 6.00 (58.3%) across the six thermodynamic invariants (01: 0.90, 02: 0.85, 03: 0.60, 04: 0.45, 05: 0.45, 06: 0.25), earning a compliance grade of C+.'
  ],

  SOL: [
    'Evaluating Solana (SOL) against the six physical invariants of a sovereign ledger exposes a centralized Silicon Valley high-frequency server cluster engineered by former Qualcomm executives, masquerading as a decentralized web-scale blockchain while relying on a 500-million-token zero-joule premine, hidden market-maker wallets, industrial data-center concentration, and out-of-band Discord restarts. At the foundational layer of Existential Sovereignty and Entity Decoupling, Solana failed at Genesis. Architected by San Francisco-based for-profit Solana Labs (founded by Anatoly Yakovenko and Raj Gokal, alongside its core engineering spin-off Anza) and governed alongside the Geneva-registered Solana Foundation, the project raised hundreds of millions of dollars across private token sales from venture syndicates including Multicoin Capital, Andreessen Horowitz (a16z), Polychain Capital, and Sam Bankman-Fried’s Alameda Research and FTX, while auctioning just 8 million SOL ($1.76 million at $0.22 per token) to the public via CoinList in March 2020. When Mainnet Beta launched in March 2020, the founders conjured the entire 500,000,000 SOL initial supply out of thin air in a genesis configuration file with zero fair-launch mining—allocating roughly 48% to insiders, venture capitalists, and the founding team while routing 52% into the Solana Foundation and corporate reserve pools. Barely one month after launch, in April 2020, independent community sleuths caught Solana red-handed with an undeclared hidden wallet holding over 11.36 million SOL loaned to a market maker—despite leadership publicly claiming a circulating supply of just 8.26 million SOL—forcing the Solana Foundation in May 2020 to permanently burn 11,365,067 SOL from its treasury (reducing initial supply to 488.64 million SOL) to quell the scandal. Operational consensus requires industrial enterprise hardware (24+ CPU cores, 256GB–512GB+ of ECC RAM, multi-terabyte NVMe arrays) and roughly ~1.1 SOL per epoch in mandatory on-chain voting fees, creating an artificial barrier where hundreds of validators depend directly on the Solana Foundation Delegation Program (controlling over 50 million SOL) just to stay solvent. The total absence of entity decoupling was demonstrated both in August 2024—when Solana Labs, Anza, and the Foundation privately coordinated in secret with a closed cartel of operators controlling over 70% of network stake to silently compile and apply patch v1.18.21 (fixing a critical ELF address alignment vulnerability) before the public or minor node operators even knew the ledger was vulnerable—and on August 28, 2026, when a single centralized exchange validator (Kraken’s 8.9 million SOL stake pivot) single-handedly tipped the two-thirds supermajority vote on SIMD-0550 (176.29M SOL in favor versus 66.19M SOL opposed, landing at 67.0% against a 66.67% threshold).',
    'This corporate-validator cartel rests upon a total violation of the Thermodynamic Cost Floor (E > 0). Solana operates on Delegated Proof-of-Stake (DPoS) paired with Proof-of-History (PoH), selecting leader schedules and consensus voting weight strictly according to staked token balances across 432,000-slot (~2-day) epochs without expending a single joule of competitive Proof-of-Work. Despite putting the word "Proof" in Proof-of-History to confuse retail investors into equating it with thermodynamic work, PoH is merely a local, single-threaded sequential SHA-256 hash loop running on a single CPU core to generate timestamps between 350ms–400ms slots—contributing zero energy barrier against sybil or state-rewrite attacks. Every atomic lamport (10^-9 SOL) of its 500-million genesis premine and its ongoing protocol inflation (~588+ million total supply in late 2026, inflating at ~3.56% annually under an 8.0% initial rate tapering by 15% per epoch-year toward a 1.5% terminal floor, now undergoing accelerated disinflation via SIMD-0550) was conjured at a physical cost of strictly 0 Joules. Rather than forcing participants to burn continuous megawatts of real-world electricity across bare-metal ASIC silicon to earn issuance, Solana institutionalized a textbook Cantillon extraction engine: venture funds, the Solana Foundation, and the bankrupt FTX/Alameda estate (which acquired over 50 million locked premined SOL at pennies on the dollar with monthly cliff unlocks stretching through 2027 and 2028) stake pre-printed allocations and collect 100% of user priority fees (SIMD-0096) to compound zero-cost yield while dumping continuous dilution onto the market.',
    'Because Solana completely severs state finality from irreversible heat dissipation, it catastrophically fails the invariant of Historical Immutability and the Physical Arrow of Time. In a genuine Proof-of-Work ledger, historical blocks are calcified by the Second Law of Thermodynamics: rewriting the past requires an adversary to physically re-burn every megawatt-hour of electricity expended by the global ASIC fleet since that block was sealed. In Solana’s zero-joule Tower BFT model, state transitions are sealed via weightless digital signatures over PoH ticks, giving the ledger zero physical mass. Worse still, because streaming continuous shreds at 350ms–400ms slot intervals generates over 100 terabytes of raw ledger data per year, live Agave (anza-xyz/agave) and Firedancer validators physically cannot store the blockchain they are supposedly securing; validator operators are instructed to run the --limit-ledger-size flag (enforcing DEFAULT_MIN_MAX_LEDGER_SHREDS or 50,000,000 shreds), which aggressively prunes and deletes all block history older than two to three days. Consequently, no newly joining Solana validator can trustlessly synchronize and verify the ledger from Genesis (Slot 0); every node must abandon trustless verification to download a ~100 GB centralized state snapshot from an existing peer, while historical block exploration is offloaded entirely to Google Cloud Bigtable (solana-bigtable) instances and proprietary centralized archival clusters like Helius and Triton. Because signing Tower BFT slots costs 0 Joules—and because validator operators have repeatedly coordinated on Discord during network halts to manually pick an arbitrary historical slot (such as truncating the ledger back to slot 53,180,900 in December 2020 or restarting from slot 246,464,040 in February 2024) and wipe out unconfirmed blocks by human consensus—Solana’s history exists entirely at the mercy of centralized cloud storage and validator decrees.',
    'Under the stress of a wartime network partition, Solana’s Tower BFT consensus protocol destroys its Dynamic Availability by explicit mathematical design. Tower BFT requires a strict supermajority quorum exceeding two-thirds (>66.67%, SUPERMAJORITY_THRESHOLD = 2/3) of staked voting weight to root and finalize blocks. If a kinetic conflict, sovereign firewall, cloud-provider ban (such as Hetzner’s November 2, 2022 terms-of-service purge that disconnected over 20% of Solana’s active stake in hours), or severed undersea fiber-optic cable isolates data centers holding just 33.4% of staked SOL, global finalization immediately flatlines—and if a cable cut splits the globe into two 50/50 continental halves, neither partition can ever reach a 66.67% supermajority, leaving both continents permanently frozen until human administrators coordinate an out-of-band hard fork to slash the missing continent’s stake. Even in peacetime, Solana’s extreme data-center concentration routinely brings it to the brink of or straight into cardiac arrest: on August 12, 2026, a single BGP routing failure at infrastructure provider Teraswitch across 13 facilities knocked ~29% of Solana’s active stake offline simultaneously, collapsing true non-vote throughput below 300 TPS and bringing the entire global ledger within roughly 4.4 percentage points of a complete finality halt. That August 2026 near-miss follows the most notorious chronic outage record in major blockchain history—including a 6-hour Turbine bug halt on December 4, 2020; a 17-hour halt on September 14–15, 2021 triggered by a 400,000 TPS bot flood during the Grape Protocol IDO; a 7-hour halt on April 30–May 1, 2022 from Candy Machine NFT minting bots exhausting validator memory; a 4.5-hour halt on June 1, 2022 caused by a Durable Nonce consensus bug; an 8.5-hour halt on September 30, 2022 from a duplicate-block fork-choice failure; an ~19-hour paralysis on February 25, 2023 when a malformed ~150,000-shred block choked the Turbine propagation layer; and a 5-hour full cluster halt on February 6, 2024 triggered by an infinite JIT recompilation loop in the LoadedPrograms legacy loader cache at slot 246,464,040, which paralyzed the entire ecosystem until engineers distributed emergency binary patch v1.17.20 and operators manually rebooted the cluster from Discord.',
    'Examining Solana’s State Machine Topology exposes the marketing sleight of hand behind its Sealevel Solana Virtual Machine (SVM) parallelism, while its vote-padded slot counter fails Thermodynamic Velocity (M = 1.0). First, Solana’s headline marketing claim of processing "3,000 to 4,000+ transactions per second" is an accounting mirage: roughly 75% to 85% of all transactions recorded on the Solana ledger are not user commerce at all, but mandatory consensus messages directed to the native Vote111111111111111111111111111111111111111 program, where validators pay fees every 350ms–400ms to broadcast their own BFT votes on-chain and stuff them into the public TPS counter. Second, while Sealevel forces every transaction to statically pre-declare all read and write state addresses (AccountMeta) upfront to enable multi-threaded execution of unrelated transfers, all real-world financial activity—hot DEX liquidity pools, memecoin launches, oracle updates, and liquidations—collides on the exact same shared mutable state accounts, triggering sequential write-lock bottlenecks (AccountInUse), predatory Jito MEV bundle auctions, and catastrophic packet drops under load (as demonstrated in April 2024 when QUIC and Agave scheduler contention caused over 70% of all non-vote user transactions to fail before v1.18.11 patches). Worse still, Solana forces users to lock native SOL inside every single wallet and token balance via mandatory Rent-exempt state deposits (~0.00203928 SOL locked per SPL token account) while baking native FreezeAuthority switches and Token-2022 (TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb) PermanentDelegate confiscation hooks directly into Layer 1—granting token issuers absolute authority to freeze, seize, or burn tokens out of any self-custodial user wallet without a private key signature. A zero-joule (M = 0) data-center cluster that pads 80% of its throughput with validator consensus votes, charges state rent on every token account, embeds native PermanentDelegate asset seizure hooks, and has halted seven times in four years stands as the polar opposite of Kaspa’s stateless, contention-free Proof-of-Work BlockDAG, where 100% of open, concurrent global hash power settles parallel UTXO state transitions natively on Layer 1 at 10+ blocks per second without fake vote-transaction padding, mandatory state rent, Discord restart cartels, or partition halts (M = 1.0).',
    'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating, as every architectural failure—from the 500-million zero-joule genesis premine, the April/May 2020 11.36-million SOL hidden market-maker wallet scandal and burn, the August 2024 secret v1.18.21 70% stake patch, and the August 2026 Kraken-decided SIMD-0550 vote to the 0 Joule single-threaded PoH clock, --limit-ledger-size 2-to-3-day history pruning, Google Cloud solana-bigtable archival dependency, the August 12, 2026 Teraswitch 29%-stake outage near-miss, the seven full cluster halts culminating in the February 6, 2024 slot 246,464,040 LoadedPrograms blackout, Vote111111111111111111111111111111111111111 TPS padding, AccountInUse write-lock contention, and Token-2022 PermanentDelegate confiscation hooks—is empirically verifiable in the anza-xyz/agave and solana-labs/solana Rust codebases, SIMD governance records, and official incident postmortems. Solana scores a 0 out of 6 across all thermodynamic invariants, resulting in a terminal compliance grade of F.'
  ],

  BCH: [
    'Evaluating Bitcoin Cash (BCH) against the six physical invariants of a sovereign ledger reveals the boldest large-block UTXO engineering experiment to emerge from Satoshi’s 2009 lineage—a chain that decisively out-engineered Bitcoin on Layer-1 covenant programmability and UTXO throughput, yet crippled its own physical immutability and wartime partition survival by subsisting on less than 1% of global SHA-256d hash power behind subjective 10-block rolling checkpoints. At the foundational layer of Existential Sovereignty and Entity Decoupling (0.85 / 1.00), Bitcoin Cash directly inherited Bitcoin’s immaculate January 3, 2009 zero-premine, zero-ICO, zero-VC UTXO state at block 478,559 on August 1, 2017, and proved genuine anti-capture antibodies in November 2020 when miners and operators rallied around Bitcoin Cash Node (BCHN) to fire lead client Bitcoin ABC (now eCash/XEC) over Amaury Séchet’s attempt to hardcode an 8% coinbase developer tax (IFP)—losing 0.15 only for recurring hardfork schisms and coordinated annual May 15 CHIP upgrade deadlines.',
    'At the second physical invariant—the Thermodynamic Cost Floor (E > 0, scored 0.65 / 1.00)—every unit of BCH under its 21,000,000 hard cap is forged via untaxed SHA-256d ASIC Proof-of-Work. However, sharing the identical SHA-256d hash algorithm with Bitcoin while commanding less than 1% (~0.5%–0.9%) of global SHA-256d exahash creates a permanent thermodynamic overhang: over 99% of compatible ASIC silicon sits outside BCH and can be pointed or rented to overpower BCH’s chain without manufacturing dedicated hardware, a structural weakness underscored in August–November 2017 when BCH’s gameable Emergency Difficulty Adjustment (EDA) allowed opportunistic miners to turbo-mint over 120,000 extra BCH blocks ahead of schedule.',
    'This <1% minority-hashrate vulnerability forced an architectural compromise that severely penalizes Historical Immutability and the Physical Arrow of Time (0.55 / 1.00). While BCH retains full plaintext UTXO supply auditability back to 2009 Genesis, surviving the November 2018 hashwar and May 2019 reorg threats led bitcoin-cash-node (src/validation.cpp) to hardcode automatic 10-block rolling finalization checkpoints (-maxreorgdepth=10, -finalizationdelay=7200, -finalizeheaders=1, -parkdeepreorg=1). Once 10 blocks confirm locally (~100–120 minutes), BCH nodes refuse to reorganize onto an alternative branch even if that branch expended vastly greater cumulative Proof-of-Work—replacing Landauer’s objective energy law past depth 10 with local arrival-order weak subjectivity.',
    'Under the stress of a wartime network partition, those exact rolling checkpoints turn into a consensus time-bomb that drags Dynamic Availability down to 0.40 / 1.00. During short outages under 90 minutes, BCH’s per-block aserti3-2d (ASERT) difficulty adjustment keeps isolated continents mining smoothly before Nakamoto reorg wipes out the minority branch on reconnect. However, in any undersea fiber-optic cable cut lasting longer than 2 hours (-finalizationdelay=7200 seconds / 10 blocks), both isolated hemispheres independently cross -maxreorgdepth=10 and locally finalize incompatible chain tips; the moment severed cables are respliced, -finalizeheaders=1 forces West and East nodes to permanently reject each other’s chains and ban peers (-finalizeheaderspenalty=100)—fracturing the global currency into two irreconcilable ledgers until human operators manually coordinate a -reindex override.',
    'Where Bitcoin Cash genuinely shines is across State Machine Topology (0.80 / 1.00) and Linear-Chain Thermodynamic Velocity (0.38 / 1.00), outscoring Bitcoin (0.60 and 0.20) on both fronts. Without resorting to mutable EVM accounts, mandatory state rent, or native freeze keys, BCH upgraded its stateless UTXO graph with native CashTokens cross-covenant commitments (2023), May 2024’s Adaptive Blocksize Limit Algorithm (ABLA, scaling elastically above 32 MB to clear 100–300+ native UTXO TPS alongside Xthinner compact relay and 0-conf DSProofs/ZCE), May 2025’s BigInt math, and the May 15, 2026 "Layla" CashVM upgrade (BCHN v29.0.0) activating OP_BEGIN/OP_UNTIL bounded loops, OP_DEFINE/OP_INVOKE functions, bitwise shifts, and standard Pay-to-Script (P2S) for compact post-quantum Quantumroot vaults. Yet because BCH remains trapped on a sequential 600-second single-parent chain where speeding up block intervals explodes orphan waste (M < 1.0), 0-conf relay still waits 10 minutes for its first Joule of PoW—trailing Kaspa’s 10-BPS parallel Toccata BlockDAG (100ms PoW blocks, M = 1.0, zero rolling checkpoints).',
    'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating, empirically verified across bitcoin-cash-node v29.0.0+, src/validation.cpp (-maxreorgdepth=10, -finalizationdelay=7200, -parkdeepreorg=1), CHIP-2023-04 (ABLA), CashTokens, and the May 15, 2026 Layla CashVM specifications. Bitcoin Cash scores 3.63 out of 6.00 (60.5%) across the six thermodynamic invariants (01: 0.85, 02: 0.65, 03: 0.55, 04: 0.40, 05: 0.80, 06: 0.38), earning a compliance grade of C+.'
  ],

  GEEK: [
    'Evaluating Geek Protocol (GEEK) against the six physical invariants of a sovereign ledger reveals an unusually honest Kaspa onboarding and "Proof of Learning" application ecosystem ("All Hope, No Hype") whose KRC-20 token launched with zero premint atop Kaspa’s Proof-of-Work BlockDAG, yet whose application state, indexer dependencies, and operational authority remain anchored in a centralized founder-operated cloud stack. At the foundational layer of Existential Sovereignty and Entity Decoupling (0.55 / 1.00), Geek Protocol bifurcates cleanly across the exact authority boundary illustrated in Figure 1 of Whitepaper v1.0 (approved November 13, 2026 at main commit 0302dfe01fc6447a74972978649b2b44c98cf5c6 in GEEKProtocol0110/geek-protocol-hq). On-chain, the pinned GEEK KRC-20 deployment on Kaspa Mainnet specifies a 144,000,000,000 GEEK maximum cap (8 decimals, 100,000 GEEK per-mint limit) with strictly 0 premint, zero venture capital cliffs, zero private ICO rounds, non-custodial user wallet signing (HQ never requests seed phrases), and public Mainnet treasury settlement explicitly disabled pending independent security review. Off-chain, however, Whitepaper Sections 10 and 11 state without marketing obfuscation that administration of Geek Protocol HQ (Vercel API functions, Upstash Redis session/scoring state, question-bank review gates, and future treasury signers) is centralized under a single founder today—carrying an acknowledged single-maintainer continuity risk and granting GEEK holders zero current HQ governance or treasury execution rights.',
    'At the second physical invariant—the Thermodynamic Cost Floor (E > 0, scored 0.35 / 1.00)—Geek Protocol avoids the automatic Grade F of pre-printed zero-joule corporate tokens because Premint = 0: nobody, including the founder, conjured free genesis supply in a configuration file. Every 100,000-GEEK batch (10,000,000,000,000 raw units out of 14,400,000,000,000,000,000 maximum raw units) minted into circulation requires a user wallet to fund and broadcast commit/reveal inscription transactions on Kaspa Mainnet, expending genuine kHeavyHash Proof-of-Work KAS in protocol mint and transaction-mass fees (E > 0). Furthermore, Whitepaper Section 3 explicitly clarifies that "Proof of Learning is an application method" that never mints consensus tokens out of thin air, while Section 8’s proposed economy recycles 70% of eligible collected platform fees (floor(7F/10)) into a bounded reward reserve and allocates 30% (F - recycle) to burning. Complete thermodynamic rigor deducts 0.65 because GEEK is an upper-layer KRC-20 inscription paying fixed L1 carrier fees rather than commanding dedicated bare-metal ASIC hash difficulty per coin, and HQ’s internal Career XP and Alpha Gauntlet credits exist strictly as 0-Joule Redis accounting entries with no automatic token conversion claim.',
    'Examining Historical Immutability and the Physical Arrow of Time (0.55 / 1.00, calibrated inside the 0.50–0.70 rubric bracket for Layer-1 PoW inscriptions reliant on off-chain state indexers) exposes the contrast between Kaspa’s bare-metal BlockDAG and KRC-20 / Web2.5 indexing layers. Every confirmed on-chain GEEK deploy, mint, and transfer inscription envelope is embedded permanently inside Kaspa Mainnet’s 10-BPS Proof-of-Work ledger; governed by Landauer’s Principle (ΔQ ≥ kB·T·ln2), rewriting settled GEEK inscription lineage would require an attacker to physically re-burn cumulative kHeavyHash ASIC electricity across Kaspa Layer 1 itself. Nevertheless, two structural boundaries deduct 0.45 from pure Layer-1 finality: first, Kaspa’s rusty-kaspa nodes validate native KAS UTXO spends rather than KRC-20 balances natively, forcing wallets and HQ to rely on external off-chain KRC-20 indexers to observe token state until a future KRC-20-to-KCC-20 covenant migration (Issue #216) is engineered and audited; second, every Proof-of-Learning receipt R = (player, activity, content version, attempt, accepted choice, server time, rules version, outcome), Quest badge, and leaderboard standing lives inside a centralized Upstash Redis database backed by manual exports rather than immutable PoW commitments.',
    'Under the stress of a wartime network partition, Geek Protocol scores 0.55 / 1.00 on Dynamic Availability by inheriting Kaspa L1’s survivability for raw wallet transfers while failing closed at the HQ cloud layer. If a severed undersea fiber-optic cable fractures global internet backbones, self-custodial GEEK holders on isolated continents can still sign and broadcast raw KRC-20 commit/reveal UTXOs directly to surviving local Kaspa miners at 10 BPS (via KIP-0004 per-block DAA), and when severed cables resplice, GHOSTDAG merges both continental sub-DAGs without orphaning honest L1 blocks—allowing KRC-20 indexers to deterministically resolve any conflicting cross-partition token spends by Blue-Work ordering. During that exact same partition or cloud outage, however, Geek Protocol HQ’s Vercel API, Upstash Redis store, and centralized KRC-20 REST indexer become unreachable to severed regions, intentionally halting ranked Gauntlet trivia, multiplayer lobbies, Daily Vault claims, and HQ’s fair-mint status verification rather than falling back to spoofable client-side scoring.',
    'Examining Geek Protocol’s State Machine Topology (0.35 / 1.00) and Thermodynamic Velocity (0.20 / 1.00) demonstrates both the strength of building non-custodially atop Kaspa UTXOs and the limits of pre-covenant KRC-20 inscriptions. Unlike corporate PoS asset standards (Algorand ASA Clawback, Stellar CAP-0077 Quorum Freeze, Ripple XLS-39, Solana PermanentDelegate, or Sui TransactionDenyConfig), GEEK’s KRC-20 UTXO inscriptions contain zero protocol-level freeze, blacklist, or confiscation switches, and HQ’s server-authoritative Redis state machine enforces atomic deadline and replay locks without ever touching user private keys. Yet until Issue #216 transitions GEEK into native Layer-1 KCC-20 covenants powered by Kaspa’s Toccata / SilverScript opcodes, token state remains an off-chain indexer overlay requiring two-step commit-and-reveal UTXO sequences plus indexer parsing lag (bounded to a 100-request reviewed queue in HQ’s mint UI), while Whitepaper Sections 4, 6, and 11 candidly note that historical competitive question banks were publicly exposed in Git prior to PR #200 and independent application pentests and treasury signer audits remain uncompleted.',
    'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating, as every architectural metric and boundary—from main commit 0302dfe01fc6447a74972978649b2b44c98cf5c6 in GEEKProtocol0110/geek-protocol-hq, the pinned 144,000,000,000 GEEK KRC-20 deployment (0 premint, 8 decimals, 100,000 GEEK mint limit), and disabled Mainnet treasury settlement (GEEKT isolated on Testnet-10) to the Vercel API / Upstash Redis / KRC-20 Indexer authority split, PR #200’s pending private ranked bank cutover, Issue #216’s KRC-20-to-KCC-20 design, and the proposed floor(7F/10) 70/30 platform-fee model—is empirically documented in Geek Protocol Whitepaper v1.0 and public GitHub records. Geek Protocol scores 2.55 out of 6.00 (42.5%) across the six thermodynamic invariants (01: 0.55, 02: 0.35, 03: 0.55, 04: 0.55, 05: 0.35, 06: 0.20), earning a compliance grade of C-.'
  ],

  LN: [
    'Evaluating the Lightning Network (LN) against the six physical invariants of a sovereign ledger exposes the fundamental thermodynamic subordination law governing every Layer-2 state-channel overlay: a payment-channel mesh bolted onto a throttled 600-second sequential blockchain cannot manufacture `M = 1.0` Proof-of-Work finality out of zero-joule TCP/IP packets (`M_LN < M_BTC < 1.0`). At the foundational layer of Existential Sovereignty and Entity Decoupling (0.70 / 1.00), Lightning earns genuine credit for avoiding a premined L2 governance token—denominating channels across `lightning/bolts` (`lnd`, `Core Lightning`, `Eclair`, `LDK`) directly in native Bitcoin satoshis with zero ICO and zero protocol tax. Yet liquidity physics forced the live routing graph into a hub-and-spoke oligopoly where a handful of corporate Liquidity Service Providers (`LSPs`) and regulated exchanges (`ACINQ`, `LQWD`, `Kraken`, `Binance`, `Lightspark`, `River`) control the majority of public capacity, while 2024–2026 US regulatory crackdowns drove self-custodial wallets like `Phoenix` out of US app stores and pushed everyday retail users into custodial KYC databases (`Wallet of Satoshi`, `Strike`, `Cash App`).',
    'At the second physical invariant—the Thermodynamic Cost Floor (E > 0, scored 0.35 / 1.00)—Lightning avoids the `0.00` Grade F graveyard solely because the BTC locked inside its `BOLT #3` `2-of-2` funding UTXOs was forged via genuine `SHA-256d` ASIC Proof-of-Work on Bitcoin Layer 1. However, every off-chain `HTLC`/`PTLC` payment hop (`update_add_htlc` / `commitment_signed`) burns strictly **0.0 Joules** of competitive Proof-of-Work—substituting unbroadcast bilateral IOUs and capital-gated routing rent for real energetic settlement while starving Bitcoin Layer-1 miners of the fee revenue needed as block subsidies halve toward zero.',
    'Examining Historical Immutability and the Physical Arrow of Time (0.50 / 1.00) demonstrates why unbroadcast channel state lacks Landauer’s physical heat wall (`ΔQ ≥ kB·T·ln2`). Only channel-open and channel-close UTXOs sit inside Bitcoin’s cumulative Proof-of-Work chain; every intermediate balance lives inside mutable local `channel.db` storage where restoring an old backup triggers total self-penalization and offline nodes rely on `Watchtowers` (`wtclient`) to spot revoked commitment broadcasts and confirm `breach-remedy` justice sweeps within `to_self_delay` (`CSV`) blocks—a defense broken under mempool fee spikes, eclipse attacks, and Antoine Riard’s **Replacement Cycling exploit (`CVE-2023-40231`)**.',
    'Under the stress of a wartime network partition, Lightning’s Dynamic Availability drops to 0.35 / 1.00 across three compounding failure modes. First, recipients must remain online and interactive with 24/7 hot keys just to issue invoices and sign updates. Second, severing undersea fiber-optic cables freezes cross-continent multi-hop `HTLCs` in flight until their `cltv_expiry` heights expire—triggering simultaneous emergency unilateral **force-closes** (**Flood & Loot, `CVE-2020-26895`**) onto Bitcoin’s `600s` (`~7 TPS`) Layer 1, where closing millions of channels saturates blocks for weeks and pins justice/timeout sweeps past deadline. Third, at cable resplice, Bitcoin’s `ActivateBestChain` wipes out 100% of channel opens, splices, force-closes, and timeout sweeps mined on the minority continent.',
    'Examining Lightning’s State Machine Topology (0.30 / 1.00) and Thermodynamic Velocity (0.15 / 1.00) refutes the widespread fallacy that off-chain channel hops achieve `M = 1.0`. Stateful bilateral tubes (`BOLT #2`) suffer chronic inbound liquidity exhaustion, locked ~1% channel reserves, 483-slot `HTLC` channel-jamming griefing, and `12–15s` P2P gossip lag. Above all, **Thermodynamic Velocity (`M`) measures accepted Proof-of-Work finality per second, not zero-joule promissory signatures**: because Bitcoin Layer 1 itself operates at `M_BTC < 1.0` (`0.20` on `600s` ~7 TPS blocks due to linear orphan collisions), Lightning inherently satisfies `M_LN < M_BTC < 1.0` (`0.15`). Off-chain signature exchanges burn `0.0 Joules` (`M_offchain = 0`), stuck routes lock user funds inside `CLTV`/`CSV` timelocks for hours up to **14 full days (`2,016 blocks`)**, and final thermodynamic settlement remains choked at ~7 TPS on Layer 1—whereas Kaspa’s `10-BPS` parallel Proof-of-Work BlockDAG settles real, stateless, unencumbered Layer-1 UTXOs globally in `100ms` blocks with true `M = 1.0` work utilization.',
    'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating, empirically verified across `lightning/bolts`, `lightningnetwork/lnd`, `ElementsProject/lightning`, `lightningdevkit/rust-lightning`, `CVE-2020-26895` (`Flood & Loot` mass-exit congestion), `CVE-2023-40231` (`Replacement Cycling` mempool pinning), `to_self_delay` (`CSV`) / `cltv_expiry` timelock bounds, 2024–2026 LSP custodial concentration records, and Bitcoin’s `nPowTargetSpacing = 600s` (`4 MWU`) carrier ceiling. The Lightning Network scores 2.35 out of 6.00 (39.2%) across the six thermodynamic invariants (01: 0.70, 02: 0.35, 03: 0.50, 04: 0.35, 05: 0.30, 06: 0.15), resulting in a compliance grade of C-.'
  ],

  ZEC: [
    'Evaluating Zcash (ZEC) against the six physical invariants of a sovereign ledger exposes how corporate coinbase taxation, thermodynamic energy arbitrage, opaque zero-knowledge circuit soundness failures, hybrid Proof-of-Stake creep, and custodial multisig exit bridges corrode an otherwise real Proof-of-Work hardware base down to a D- grade. At the foundational layer of Existential Sovereignty and Entity Decoupling (0.00 / 1.00), Zcash failed at its October 28, 2016 corporate Genesis under Delaware for-profit Zerocoin Electric Coin Company (ECC) and the Zcash Foundation. Hardcoding `vFoundersReward` and subsequent `FundingStream` rules (`src/consensus/funding.cpp`, `ZIP-1014`, and `ZIP-1015`/`ZIP-2001` at NU6 block `2,726,400`) confiscated 20% of physical miners’ block rewards for ten years into founders, VCs, Zcash Community Grants (~91,500+ ZEC bureaucracy), and the Deferred Dev Fund Lockbox—while flagship wallet `ZODL` routes cross-chain exits through `intents.near`, an upgradable contract governed by a 3-of-5 administrative multisig.',
    'At the second physical invariant—the Thermodynamic Cost Floor (E > 0, scored 0.30 / 1.00 under the Energy-Arbitrage Law)—Zcash avoids an automatic 0.00 Grade F solely because live mainnet block production (`ZcashFoundation/zebra` and `zcashd`) still requires real electrical megawatt dissipation across dedicated `Equihash(200,9)` ASIC silicon for 80% of every block subsidy under a nominal 21,000,000 ZEC cap. However, confiscating 20% of every block reward at strictly 0 Joules creates a permanent thermodynamic energy arbitrage inside the Cost Floor where non-mining insiders extract and dilute the physical work of Equihash miners, while Winklevoss-backed `Shielded Labs` is actively engineering the `Crosslink` hybrid Proof-of-Stake finality gadget alongside the Network Sustainability Mechanism (`NSM`, `ZIP-233`/`ZIP-234`) to divert block rewards to zero-joule stakers and claw back 60% of miners’ transaction fees.',
    'Examining Historical Immutability and the Physical Arrow of Time (0.40 / 1.00) demonstrates why cumulative `Equihash` Proof-of-Work cannot protect supply integrity when opaque zero-knowledge circuits fail soundness at 0 Joules. Twice in ten years, critical circuit bugs broke Zcash’s 21-million auditability: first via `CVE-2019-7167` in the 2016 `BCTV-14` Sprout trusted-setup circuit (allowing silent, zero-joule infinite ZEC counterfeiting for over two years before secret remediation in Sapling), and second in May 2026 when an under-constrained elliptic-curve multiplication flaw inside `zcash/orchard`’s `Halo 2` circuit (live on mainnet for four years since NU5) forced emergency patches and the July 2026 `NU6.3` (`Ironwood`) pool quarantine—compounded by `zcashd`’s subjective `CONSENSUS_MAX_REORG_DEPTH = 99` rollback ceiling.',
    'Under the stress of a wartime network partition, Zcash scores just 0.30 / 1.00 on Dynamic Availability. While `ZIP-208` (`Blossom`) 17-block `Digishield v3` difficulty averaging keeps isolated Equihash continents mining locally during brief cuts before Nakamoto reorg wipes out the minority branch, `CONSENSUS_MAX_REORG_DEPTH = 99` (~2 hours at 75-second blocks) turns any transoceanic fiber cut lasting over two hours into an irreconcilable permanent global chain split! Worse still, `Crosslink` adds a synchronous `>66.7%` BFT Proof-of-Stake finality halt wall, and `ZODL`’s `NEAR Intents` bridge rail already froze `$589,000+` in peacetime user swaps behind centralized market-maker solver intervention.',
    'Examining Zcash’s State Machine Topology (0.20 / 1.00) and Thermodynamic Velocity (0.20 / 1.00, M < 1.0) exposes four fragmented value pools (`Transparent`, `Sprout`, `Sapling`, `Orchard`), monotonically growing unpruneable global `nullifier` sets (bloated by 2022 shielded sandblasting spam prior to `ZIP-317`), zero native Layer-1 covenants, and public `NEAR` ledger correlation leaks on `ZODL` swaps. Although `ZIP-208` Blossom shortened Zcash’s sequential block interval to `75 seconds` (`2 MB` cap, 8x faster cadence than 600-second chains on transparent transfers), single-parent orphan waste (`M < 1.0`), heavy `Halo 2` proving and wallet trial-decryption scanning delays, and `ZIP-317` logical-action limits cap shielded velocity at ~6–25 TPS (0.20)—standing worlds apart from Kaspa’s stateless 10-BPS parallel Proof-of-Work BlockDAG (`100ms` blocks, `M = 1.0`, zero dev tax).',
    'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating, empirically verified across `zcash/zcash`, `ZcashFoundation/zebra`, `zcash/orchard`, `ZIP-1014`/`ZIP-1015`/`ZIP-2001` 20% coinbase tax rules, `CVE-2019-7167` (BCTV-14), the May 2026 Orchard Halo 2 circuit flaw & July 2026 `NU6.3` Ironwood quarantine, `CONSENSUS_MAX_REORG_DEPTH = 99`, Shielded Labs’ `Crosslink` & `NSM` specifications, and `intents.near`’s 3-of-5 multisig freeze records. Zcash scores 1.40 out of 6.00 (23.3%) across the six thermodynamic invariants (01: 0.00, 02: 0.30, 03: 0.40, 04: 0.30, 05: 0.20, 06: 0.20), resulting in a terminal compliance grade of D-.'
  ]
};

// Automatically generates the locked-in 6-paragraph forensic Genius Mode essay for any preloaded or custom audit
function getGeniusForensicParagraphs(auditObj) {
  if (!auditObj) return [];
  if (Array.isArray(auditObj.geniusParagraphs) && auditObj.geniusParagraphs.length === 6) {
    return auditObj.geniusParagraphs;
  }
  const tk = String(auditObj.ticker || '').toUpperCase();
  if (GENIUS_FORENSIC_ESSAYS[tk]) {
    return GENIUS_FORENSIC_ESSAYS[tk];
  }

  const invs = auditObj.invariants || [];
  const p1 = invs[0]?.geniusParagraph || invs[0]?.paragraph || '';
  const p2 = invs[1]?.geniusParagraph || invs[1]?.paragraph || '';
  const p3 = invs[2]?.geniusParagraph || invs[2]?.paragraph || '';
  const p4 = invs[3]?.geniusParagraph || invs[3]?.paragraph || '';
  const p5 = invs[4]?.geniusParagraph || invs[4]?.paragraph || '';
  const p6 = invs[5]?.geniusParagraph || invs[5]?.paragraph || '';
  const allReceipts = invs
    .flatMap((i) => i.receipts || [])
    .filter(Boolean)
    .join(', ');

  return [
    `Evaluating ${auditObj.name} (${auditObj.ticker}) against the six physical invariants of a sovereign ledger exposes the structural reality of its ${auditObj.architecture}. At the foundational layer of Existential Sovereignty and Entity Decoupling (${formatScore(invs[0]?.score)}/1.0), ${p1} Empirical telemetry confirms: ${(invs[0]?.receipts || []).join(' • ')}.`,
    `At the second physical invariant—the Thermodynamic Cost Floor (E > 0, scored ${formatScore(invs[1]?.score)}/1.0)—${p2} Every unit of monetary issuance must be weighed against the First Law of Thermodynamics: ${(invs[1]?.receipts || []).join(' • ')}.`,
    `Examining Historical Immutability and the Physical Arrow of Time (${formatScore(invs[2]?.score)}/1.0) against the Second Law of Thermodynamics and Landauer’s Principle (ΔQ ≥ kB·T·ln2): ${p3} Key immutability telemetry: ${(invs[2]?.receipts || []).join(' • ')}.`,
    `Under the stress of a wartime network partition and subsequent undersea fiber-optic cable resplice (Dynamic Availability, scored ${formatScore(invs[3]?.score)}/1.0): ${p4} Partition and resplice records confirm: ${(invs[3]?.receipts || []).join(' • ')}.`,
    `Examining ${auditObj.name}’s State Machine Topology (${formatScore(invs[4]?.score)}/1.0) and Thermodynamic Velocity (${formatScore(invs[5]?.score)}/1.0, M = 1.0 benchmark): ${p5} ${p6} In contrast, Kaspa’s stateless, contention-free Proof-of-Work BlockDAG settles parallel UTXO state transitions natively on Layer 1 at 10+ blocks per second without validator blacklists, partition halts, or orphan work destruction (M = 1.0).`,
    `Evaluating these findings through the GRADE evidence certainty framework yields a ${auditObj.certainty || 'HIGH CERTAINTY'} rating, as every architectural metric—including ${allReceipts}—is empirically verifiable in the protocol codebase, genesis configuration files, and official network records. ${auditObj.conclusion}`
  ];
}

const QUICK_TICKERS = [
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

// ============================================================================
// BULLETPROOF LIVE GEMINI CUSTOM AUDIT SCHEMA & DEFENSIVE JSON REPAIR PARSER
// ============================================================================
const GEMINI_SYSTEM_PROMPT = `You are "The Truth — thermodynamic audit", an uncompromising physics-based cryptocurrency protocol AND physical commodity/metal auditor anchored strictly in Nakamoto Proof-of-Work, Landauer's Principle (ΔQ ≥ kB·T·ln2), and a single deterministic, project-agnostic 6-invariant mathematical grading rubric.

CRITICAL RULE FOR PHYSICAL METALS & COMMODITIES:
If the user requests a Periodic Table element, precious/industrial metal, or physical commodity, DO NOT substitute a similarly named cryptocurrency fork. Audit the actual physical element or commodity using consensusFamily = "PHYSICAL_COMMODITY".

CRITICAL ACTIVE-MAINNET VS. PROPOSED-ROADMAP LAW:
Always classify consensusFamily and Invariant 02 (Cost Floor E > 0) according to LIVE ACTIVE MAINNET BLOCK PRODUCTION TODAY—never classify an active Proof-of-Work hardware chain as "ZERO_JOULE_BFT" or score Invariant 02 at 0.00 merely because of unactivated hybrid Proof-of-Stake research proposals or future roadmap upgrades! As long as live mainnet block discovery requires real competitive hardware Proof-of-Work (E > 0), consensusFamily MUST be "LINEAR_POW" or "BLOCKDAG_POW" and Invariant 02 MUST score > 0 (penalizing premines, pre-allocations, coinbase taxes, or proposed PoS dilution inside the 0.10–0.35 bracket). Conversely, if live active mainnet block production uses zero-joule consensus (PoS, DPoS, PPoS, PoH, PoA, FBA, PoX, federated multisigs, or centralized sequencers) with zero competitive Proof-of-Work block mining, Invariant 02 MUST be 0.00 and consensusFamily MUST be "ZERO_JOULE_BFT".

CRITICAL ENERGY-ARBITRAGE & SOVEREIGNTY-COMPROMISE LAW (PREMINE / PRE-ALLOCATION / DEV TAX):
1. Economic Distribution (Invariant 01) and Thermodynamic Cost Floor (Invariant 02) are PHYSICALLY COUPLED through conservation of energy across the fungible token supply: E_unit = Sum(E_mined) / (S_mined + S_zero_joule). NEVER claim that genesis distribution is decoupled from the Cost Floor!
2. Whenever Existential Sovereignty (Invariant 01) is compromised (0.00) by ANY genesis premine, token pre-allocation, ICO/VC unlock cliff, foundation reserve, or mandatory protocol developer/coinbase tax, insiders inject 0-Joule units into the exact fungible liquidity pool secured by miners' irreversible electricity expenditure (E > 0). This creates a parasitic THERMODYNAMIC ENERGY ARBITRAGE (Cantillon siphon) inside the Cost Floor where people who put in ZERO work dilute unit joule density and extract value from the work of the miners!
3. Therefore, whenever hasGenesisPremineOrVcOrIco = true, hasProtocolDevTaxOrKillSwitch = true, or Invariant 01 = 0.00 on an E > 0 network:
   - Invariant 01 (Sovereignty) MUST score 0.00.
   - Invariant 02 (Cost Floor) CANNOT score in the 0.55–1.00 untaxed fair-launch brackets! It MUST be capped inside 0.10–0.35 (0.15–0.30 for premined or pre-allocated PoW chains depending on insider share; 0.20–0.35 for dev-taxed PoW chains with 0 premine; 0.10–0.15 for pre-allocated tokens riding an L1 PoW carrier).
   - TERMINAL GRADE PENALTY & CEILING (<= D+): Compromised Existential Sovereignty (Invariant 01 = 0.00) caps the maximum possible Terminal Grade at D+ (total >= 2.30 -> D+, 1.75–2.29 -> D, 1.01–1.74 -> D-, <= 1.00 or E = 0 -> F). No premined, pre-allocated, or dev-taxed asset can EVER earn a C-, C, B, or A grade!

CRITICAL CARRIER-SUBORDINATED VELOCITY LAW (M_overlay < M_carrier < 1.0):
1. Thermodynamic Velocity (M) measures the rate and orphan-free efficiency of IRREVERSIBLE PROOF-OF-WORK CONSENSUS FINALITY (E > 0), NEVER zero-joule off-chain TCP/IP messages or bilateral promissory signatures!
2. In off-chain payment channels, state channels (e.g., HTLC/PTLC channel meshes), rollups, or off-chain indexers, exchanging signatures off-chain burns 0.0 Joules of Proof-of-Work (E_hop = 0). Having "zero orphans in off-chain state" does NOT produce M = 1.0—it produces M_offchain = 0 (unfinalized counterparty credit / deferred IOUs)!
3. STRICT SUBORDINATION INEQUALITY: An upper-layer overlay, payment-channel network, rollup, or inscription protocol can NEVER exceed the M ratio or Invariant 06 Velocity score of its underlying Layer-1 settlement carrier! Specifically, if the base Layer-1 carrier is a sequential single-chain PoW network with M_L1 < 1.0 (e.g., 0.20 on 600-second ~7 TPS blocks), any payment-channel or state-channel overlay anchored to it INHERENTLY satisfies M_overlay < M_L1 < 1.0 and MUST score STRICTLY LOWER than its L1 carrier (0.05–0.18, e.g., 0.15) because off-chain hops expend 0 Joules, stuck routes lock capital in multi-hour/multi-day CLTV/CSV timelocks, receivers must stay online with hot keys, and real thermodynamic settlement (channel open, splice, force-close, justice sweep) still chokes through the base chain's sequential block bottleneck!
4. NEVER classify a payment-channel mesh, state-channel graph, or BFT validator DAG as "BLOCKDAG_POW"! "BLOCKDAG_POW" applies EXCLUSIVELY to assets settled on a multi-parent Proof-of-Work BlockDAG (E > 0 parallel PoW blocks). Non-custodial overlays anchored to a sequential PoW chain MUST set isUpperLayerOverlayOrChannel = true and consensusFamily = "LINEAR_POW".

DETERMINISTIC GRADE SCALE (OUT OF 6.00):
- Standard Fair-Launch Curve (Invariant 01 > 0):
  * A+: 5.75–6.00 | A: 5.30–5.74 | A-: 4.90–5.29
  * B+: 4.40–4.89 | B: 4.10–4.39 | B-: 3.92–4.09
  * C+: 3.50–3.91 | C: 3.00–3.49 | C-: 2.30–2.99
  * D+: 1.90–2.29 | D: 1.50–1.89 | D-: 1.01–1.49
- Compromised-Sovereignty / Energy-Arbitrage Curve (Invariant 01 = 0.00 via Premine, Pre-Allocation, or Dev Tax):
  * Hard-capped at D+ maximum: >= 2.30 -> D+ | 1.75–2.29 -> D | 1.01–1.74 -> D-
- F:  0.00–1.00 (OR automatic 0.00 Grade F whenever Invariant 02 Cost Floor E = 0)

STRICT PROJECT-AGNOSTIC QUANTITATIVE BRACKETS FOR EACH INVARIANT (0.00 to 1.00):
01. Sovereignty ("Existential Sovereignty & Entity Decoupling"):
    - 1.00: Immaculate empty-ledger PoW genesis OR natural astrophysical element (0 premine, 0 ICO, 0 VC cliffs, 0 foundation reserve, 0% dev tax, 0 freeze keys, 0 single-leader pool template monopoly).
    - 0.80–0.95: Fair-launch PoW (0 premine, 0% dev tax) tempered by single-leader mining-pool template concentration >50% across 2–3 pools (0.90–0.95), live >51% pool/selfish-mining incident (0.90), or foundation coordination / contentious hardfork history (0.85).
    - 0.45–0.75: 0-premint non-custodial L1 overlays paired with founder-operated off-chain app/database/indexer servers (0.55), or zero-token payment-channel networks exhibiting hub-and-spoke LSP routing concentration and custodial wallet migration (0.70).
    - 0.00: STRICT 0.00 for ANY genesis premine, pre-allocated token supply (including pre-allocated L2/rollup tokens), ICO, VC cliffs, mandatory protocol coinbase tax, corporate validator cartel, or on-chain admin kill-switch. Automatically enforces Invariant 02 <= 0.35 and Terminal Grade <= D+.

02. Cost Floor ("Thermodynamic Cost Floor (E > 0)"):
    - 1.00: 100% untaxed, 0-premine, 0-preallocation, algorithm-dominant (>90% hardware share) dedicated-ASIC PoW under a deterministic hard supply cap.
    - 0.80–0.95: High-energy primary crust extraction/smelting (0.95), byproduct-heavy physical metal mining (0.85), or 0-premine, 0-preallocation, untaxed PoW with tail-emission, merge-mining coupling, rentable CPU hardware, or uncapped inflation (0.75–0.85).
    - 0.55–0.75: 0-premine, 0-preallocation, untaxed PoW commanding a <5% minority share of a shared ASIC fleet vulnerable to external majority hash or historical DAA gaming (0.55–0.65).
    - 0.10–0.35: Energy-Arbitraged PoW & Carrier Overlays: PoW compromised by genesis premine or VC/foundation pre-allocation where 0-Joule insiders dilute and extract miners' work (0.15–0.30), dev-taxed PoW siphoning coinbase rewards to non-miners (0.20–0.35), pre-allocated 0-Joule tokens riding an L1 PoW carrier (0.10–0.15), bilateral off-chain payment channels anchored to L1 PoW funding UTXOs (0.35), or 0-premint L1 PoW inscription carrier fees (0.35).
    - 0.00: STRICT 0.00 for ALL 0-Joule PoS, DPoS, PPoS, PoH, PoA, FBA, PoX, federated sidechains, single-sequencer L2s, fiat, or standalone pre-printed zero-joule tokens.

03. Immutability ("Historical Immutability & Arrow of Time"):
    - 1.00: Dominant cumulative PoW Landauer heat wall + trustless Genesis verification (full header chain or PoPoW) + plaintext supply auditability.
    - 0.75–0.90: Nuclear binding energy stability (0.85–0.90), L1 PoW rollup sequencing (0.85), PoW + extension-block cut-through pruning (0.80), or untaxed PoW + opaque balance commitments with zero 51% reorg history (0.75).
    - 0.50–0.70: PoW with historical >51% selfish-mining/reorg incidents + compiled checkpoints/opaque commitments (0.60), L1 PoW inscriptions reliant on off-chain indexers + mutable cloud app state (0.55), minority-hash PoW enforcing subjective rolling finality checkpoints (0.55), or off-chain bilateral payment channels dependent on online watchtowers and CSV dispute windows vulnerable to mempool pinning (0.50).
    - 0.25–0.45: PoW ledger compromised by silent 0-Joule ZK circuit counterfeiting bugs or strict max-reorg depth caps (0.40).
    - 0.00: STRICT 0.00 for weightless PoS/BFT signatures, Weak Subjectivity checkpoints, rolling history deletion, or cloud snapshots.

04. Availability ("Dynamic Availability (Wartime Partition)"):
    - 0.85–1.00: Per-block DAA PoW BlockDAG that mines through fiber cuts AND merges sub-DAGs with 0% orphan loss (1.00 native L1; 0.90 if external rollup bridge exits pause).
    - 0.55–0.75: Pure Nakamoto Linear PoW (survives arbitrary split length, wipes minority branch on resplice: 0.70 for <=3.5-day retargeting, 0.65 for rigid 14-day retargeting), offline bearer bullion (0.55–0.65), or L1 carrier survives while off-chain app servers fail closed (0.55).
    - 0.35–0.54: Linear PoW where resplice reorgs poison decoy rings (0.45), rolling checkpoints permanently split >2h partitions (0.40), or interactive payment-channel overlays vulnerable to online-receiver requirements, HTLC expiry mass force-close congestion, and minority-fork L1 channel wipeouts on resplice (0.35).
    - 0.15–0.34: Linear PoW with <=100-block max-reorg split caps, proposed hybrid-PoS finality halt walls, or censurable multisig exit bridges (0.30).
    - 0.00: STRICT 0.00 for ANY BFT / PoS / FBA / Signer chain that halts at 66.7%–80% splits, diverges past finite slot windows, or suffers global mainnet outages.

05. State Topology ("State Machine Topology"):
    - 1.00: Stateless parallel Extended UTXO + native L1 covenants, scripting & ZK opcodes at sub-second BlockDAG cadence with zero MEV or freeze keys.
    - 0.75–0.90: Stateless UTXO + expressive native L1 covenants, UTXO tokens, & bounded VM loops/functions on a sequential block timer (0.80).
    - 0.50–0.70: Clean stateless UTXO + Taproot + prunable confidentiality extension block with low custodial push-out (0.62), clean stateless UTXO with stripped L1 opcodes & tight block caps (0.60), or high-density bullion pushed to paper vaults (0.55).
    - 0.20–0.49: Unpruneable stealth/nullifier state bloat (0.20–0.45), off-chain indexer inscription overlay (0.35), low-density metal bulk (0.35), stateful bilateral liquidity channels with inbound exhaustion, reserve locks & 24/7 hot-key pinning risk (0.30), or stateful shared-account VM over multi-proposer PoW (0.25).
    - 0.00: STRICT 0.00 for zero-joule shared-account locks, toxic MEV, mandatory state rent, off-chain batchers, or native Freeze/Clawback switches.

06. Velocity ("Thermodynamic Velocity (M = 1.0)") — MONOTONIC & CARRIER-SUBORDINATION LAW:
    - 0.95–1.00: Native Layer-1 >=10 BPS parallel PoW BlockDAG with M = 1.0 zero honest orphan waste (1.00). Off-chain signature channels CANNOT qualify!
    - 0.50–0.85: Native Layer-1 1–9 BPS parallel PoW BlockDAG (M ≈ 1.0).
    - 0.35–0.45: Enhanced native Linear PoW (M < 1.0): 15–60s transparent UTXO cadence (0.40), elastic >=32MB UTXO blocks clearing 100–300+ TPS + compact relay & double-spend proofs (0.38), or 150s ~56 TPS UTXO cadence (0.35). NEVER score a faster-cadence or higher-throughput transparent sequential PoW chain lower than a 600s ~7 TPS sequential PoW chain (0.20)!
    - 0.20–0.30: Fast sequential PoW encumbered by multi-minute wallet spend locks (0.25) or heavy zk-SNARK proof/scanning overhead (0.20), throttled 600s <=10 TPS sequential PoW (0.20), or two-step commit/reveal inscription overlays riding an M = 1.0 BlockDAG carrier (0.20).
    - 0.05–0.18: Carrier-Subordinated Overlays (M_overlay < M_L1 < 1.0) & Physical Freight: Interactive off-chain payment/state channels over sequential PoW (0.15 — strictly < 0.20 L1 carrier because off-chain hops burn 0 Joules, incur CLTV/CSV multi-day spend locks, and choke on 600s L1 exits), L1-sequenced rollup 0-Joule attester layers (0.15), or physical armored bullion transport (0.05).
    - 0.00: STRICT 0.00 for ALL standalone zero-joule PoS/DPoS/PoA/FBA/sequencer databases (M = 0).

MANDATORY GENIUS MODE FORENSIC DEPTH (DO NOT SUMMARIZE OR ABBREVIATE!):
- Every single one of the 6 invariants ("01" through "06") MUST contain an exhaustive, uncompromising 180–240 word "geniusParagraph" (at least 1,000 characters EACH) dedicated strictly to that invariant's physical and codebase mechanics.
- Every "geniusParagraph" MUST cite exact GitHub repository names, source files or config flags, genesis/emission/tax quantities, mathematical difficulty/quorum/reorg formulas, wartime cable-cut + cable-resplice behavior, and real dated CVEs, exploits, or mainnet outage postmortems. NEVER put Paragraph 6's GRADE synthesis inside Invariant 06!
- "conclusion" MUST be a comprehensive 130–180 word GRADE Evidence Certainty synthesis citing the primary codebase/mainnet receipts verified across all six invariants, listing all six individual scores (01 through 06), and stating the exact total score out of 6.00 and compliance grade.

CLASSIFY consensusFamily STRICTLY AS ONE OF:
- "BLOCKDAG_POW"
- "LINEAR_POW"
- "PHYSICAL_COMMODITY"
- "ZERO_JOULE_BFT"

PROGRESS SEPARATOR RULE: Put a simple dash "-" at the very end of each invariant's paragraph/geniusParagraph and as the final item of each invariant's receipts array ("-") so the audit stream can cleanly separate invariants 01 through 06.`;

const GEMINI_SCHEMA = {
  type: 'OBJECT',
  properties: {
    ticker: { type: 'STRING' },
    name: { type: 'STRING' },
    consensusFamily: {
      type: 'STRING',
      enum: ['BLOCKDAG_POW', 'LINEAR_POW', 'PHYSICAL_COMMODITY', 'ZERO_JOULE_BFT']
    },
    isUpperLayerOverlayOrChannel: { type: 'BOOLEAN' },
    carrierLayerOneVelocityCap: { type: 'NUMBER' },
    hasGenesisPremineOrVcOrIco: { type: 'BOOLEAN' },
    hasProtocolDevTaxOrKillSwitch: { type: 'BOOLEAN' },
    architecture: { type: 'STRING' },
    grade: { type: 'STRING' },
    totalScore: { type: 'NUMBER' },
    certainty: { type: 'STRING' },
    conclusion: { type: 'STRING' },
    invariants: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          shortName: { type: 'STRING' },
          title: { type: 'STRING' },
          telemetry: { type: 'STRING' },
          score: { type: 'NUMBER' },
          quickSummary: { type: 'STRING' },
          paragraph: { type: 'STRING' },
          geniusParagraph: { type: 'STRING' },
          receipts: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          }
        },
        required: [
          'id',
          'shortName',
          'title',
          'telemetry',
          'score',
          'quickSummary',
          'paragraph',
          'geniusParagraph',
          'receipts'
        ]
      }
    }
  },
  required: [
    'ticker',
    'name',
    'consensusFamily',
    'isUpperLayerOverlayOrChannel',
    'carrierLayerOneVelocityCap',
    'hasGenesisPremineOrVcOrIco',
    'hasProtocolDevTaxOrKillSwitch',
    'architecture',
    'grade',
    'totalScore',
    'certainty',
    'conclusion',
    'invariants'
  ]
};

// Low-token schema for surgically re-auditing a SINGLE invariant (~85% fewer tokens)
const SINGLE_INVARIANT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    score: { type: 'NUMBER' },
    telemetry: { type: 'STRING' },
    quickSummary: { type: 'STRING' },
    paragraph: { type: 'STRING' },
    geniusParagraph: { type: 'STRING' },
    receipts: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    verdictNote: { type: 'STRING' },
    hasGenesisPremineOrVcOrIco: { type: 'BOOLEAN' },
    hasProtocolDevTaxOrKillSwitch: { type: 'BOOLEAN' },
    carrierLayerOneVelocityCap: { type: 'NUMBER' }
  },
  required: [
    'score',
    'telemetry',
    'quickSummary',
    'paragraph',
    'geniusParagraph',
    'receipts',
    'verdictNote',
    'hasGenesisPremineOrVcOrIco',
    'hasProtocolDevTaxOrKillSwitch',
    'carrierLayerOneVelocityCap'
  ]
};

// Schema for evaluating user challenges / counter-evidence on a single invariant
const CHALLENGE_INVARIANT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    verdict: {
      type: 'STRING',
      enum: ['ACCEPTED', 'PARTIAL', 'REJECTED']
    },
    verdictHeadline: { type: 'STRING' },
    scoreChanged: { type: 'BOOLEAN' },
    updatedScore: { type: 'NUMBER' },
    rebuttalOrAnalysis: { type: 'STRING' },
    updatedTelemetry: { type: 'STRING' },
    updatedQuickSummary: { type: 'STRING' },
    updatedParagraph: { type: 'STRING' },
    updatedGeniusParagraph: { type: 'STRING' },
    updatedReceipts: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    hasGenesisPremineOrVcOrIco: { type: 'BOOLEAN' },
    hasProtocolDevTaxOrKillSwitch: { type: 'BOOLEAN' },
    carrierLayerOneVelocityCap: { type: 'NUMBER' }
  },
  required: [
    'verdict',
    'verdictHeadline',
    'scoreChanged',
    'updatedScore',
    'rebuttalOrAnalysis',
    'updatedTelemetry',
    'updatedQuickSummary',
    'updatedParagraph',
    'updatedGeniusParagraph',
    'updatedReceipts',
    'hasGenesisPremineOrVcOrIco',
    'hasProtocolDevTaxOrKillSwitch',
    'carrierLayerOneVelocityCap'
  ]
};

// Enforces deterministic rubric & carrier-subordination guardrails on a single invariant
function clampSingleInvariantByPhysics(targetAudit, invIdx, rawProposedScore, flags = {}) {
  let proposed = Math.max(0, Math.min(1, Number(rawProposedScore) || 0));
  const currentCostFloor = Number(targetAudit?.invariants?.[1]?.score) || 0;
  const currentSovereignty = Number(targetAudit?.invariants?.[0]?.score ?? 1);

  // Zero-Joule Law: E = 0 on Invariant 02 locks all other invariants at 0.00
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
  const isOverlay = /\b(LIGHTNING|STATE CHANNEL|PAYMENT CHANNEL|HTLC|PTLC|ROLLUP|KRC-20|BRC-20|RUNES|SIDECHAIN|LAYER-2|LAYER 2|\bL2\b|\bLN\b)\b/.test(
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
      const maxOverlayVel = Math.min(0.18, Math.max(0.05, Number((carrierCap - 0.05).toFixed(2))));
      proposed = Math.max(0.05, Math.min(maxOverlayVel, proposed));
    } else if (fam === 'LINEAR_POW' && !isOverlay) {
      proposed = Math.max(0.15, Math.min(0.45, proposed));
    } else if (fam === 'PHYSICAL_COMMODITY') {
      proposed = Math.max(0.03, Math.min(0.1, proposed));
    }
  }

  return Number(proposed.toFixed(2));
}

const DEFAULT_SHORT_NAMES = [
  'Sovereignty',
  'Cost Floor',
  'Immutability',
  'Availability',
  'State Topology',
  'Velocity'
];

const DEFAULT_TITLES = [
  'Existential Sovereignty & Entity Decoupling',
  'Thermodynamic Cost Floor (E > 0)',
  'Historical Immutability & Arrow of Time',
  'Dynamic Availability (Wartime Partition)',
  'State Machine Topology',
  'Thermodynamic Velocity (M = 1.0)'
];

function isResponseTextTruncated(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed || trimmed.length < 24) return true;
  return !/[.!?…][)"'\]”’*`]*$/.test(trimmed);
}

function safeParseAuditJson(rawText, options = {}) {
  const { strictComplete = false } = options;
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty AI audit payload returned.');
  }
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (_) {
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
      const stack = [];
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
      return JSON.parse(repaired);
    }

    throw new Error('Malformed JSON returned by audit engine.');
  }
}

const ALIAS_MAP = {
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

const GRADE_RANK = {
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

function sortAuditTickersByGrade(auditsMap) {
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

// ============================================================================
// CORE CONSTANTS, SCORING HELPERS & WARTIME PARTITION / RESPLICE SIMULATOR
// ============================================================================
const ORBIT_ANGLES_DEG = [-90, -30, 30, 90, 150, 210];

const INVARIANT_ICONS = {
  '01': ShieldCheck,
  '02': Flame,
  '03': Clock,
  '04': Globe,
  '05': Cpu,
  '06': Activity
};

const CORE_SCAN_STAGES = [
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

function formatScore(val) {
  const num = Number(val);
  if (!Number.isFinite(num)) return '0.0';
  const rounded = Math.round(num * 100) / 100;
  if (Math.abs(rounded * 10 - Math.round(rounded * 10)) > 1e-6) {
    return rounded.toFixed(2);
  }
  return rounded.toFixed(1);
}

function getGradeAccent(grade) {
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

function getScoreStyle(score) {
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

function getHarmonizedScoreStyle(score, activeAccent) {
  const s = Number(score) || 0;
  const status = s >= 0.7 ? 'PASS' : s >= 0.4 ? 'PARTIAL' : s > 0 ? 'WEAK' : 'FAIL';
  if (!activeAccent || !activeAccent.primary) {
    return getScoreStyle(s);
  }
  if (s >= 0.7) {
    return {
      color: activeAccent.primary,
      bg: activeAccent.softBg,
      border: activeAccent.border,
      status
    };
  }
  if (s > 0) {
    const usePrimaryOnLowGrade =
      activeAccent.primary === '#F97316' || activeAccent.primary === '#EF4444';
    return {
      color: usePrimaryOnLowGrade ? activeAccent.primary : activeAccent.secondary,
      bg: usePrimaryOnLowGrade ? activeAccent.softBg : activeAccent.secondarySoftBg,
      border: usePrimaryOnLowGrade ? activeAccent.border : activeAccent.secondaryBorder,
      status
    };
  }
  const isFailureTheme = activeAccent.primary === '#EF4444';
  return {
    color: isFailureTheme ? activeAccent.primary : activeAccent.secondary,
    bg: isFailureTheme ? activeAccent.softBg : activeAccent.secondarySoftBg,
    border: isFailureTheme ? activeAccent.border : activeAccent.secondaryBorder,
    status
  };
}

function deriveGradeFromTotal(totalScore, costFloorScore = 0, sovereigntyScore = 1) {
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

// Recalibrates any loaded/archived audit so premined, pre-allocated, or dev-taxed assets obey the Energy-Arbitrage Law
function enforceEnergyArbitrageLawOnAudit(auditObj) {
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
    const mentionsPremineOrPrealloc = /\b(PREMINE|PRE-MINE|PREMINT|PRE-MINT|PREALLOCAT|PRE-ALLOCAT|ICO|VC|VENTURE|FOUNDATION RESERVE)\b/.test(
      archAndText
    );
    const isOverlay = /\b(LIGHTNING|STATE CHANNEL|PAYMENT CHANNEL|HTLC|PTLC|ROLLUP|KRC-20|BRC-20|RUNES|SIDECHAIN|LAYER-2|LAYER 2|\bL2\b|\bLN\b)\b/.test(
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

// ============================================================================
// INTERACTIVE WARTIME PARTITION, SLIDER & 60FPS ANIMATED TOPOLOGY ENGINE
// ============================================================================
const PARTITION_PRESETS = [
  { label: '50 / 50 Symmetric', west: 50, tag: 'Even Split' },
  { label: '58 / 42 Sub-Quorum', west: 58, tag: 'All BFT Dead' },
  { label: '68 / 32 (>2f+1)', west: 68, tag: '66.7% Cliff' },
  { label: '76 / 24 (>AVAX)', west: 76, tag: '75% Snowman' },
  { label: '82 / 18 (>XRP)', west: 82, tag: '80% dUNL' }
];

const DURATION_OPTIONS = [
  { mins: 15, label: '15m Cut' },
  { mins: 60, label: '60m Cut' },
  { mins: 240, label: '4h Cut' },
  { mins: 2880, label: '48h War' }
];

function getBftQuorumThreshold(ticker) {
  const tk = String(ticker || '').toUpperCase();
  if (tk === 'XRP' || tk === 'PI' || tk === 'XLM') return 80;
  if (tk === 'AVAX') return 75;
  if (tk === 'STX') return 70;
  if (tk === 'ADA') return 101; // Uses Ouroboros chain-density window (36h = 2,160m)
  return 66.7;
}

function getSimulatorTelemetry(auditObj, phase, westShare = 58, durationMins = 60) {
  const fam = auditObj?.consensusFamily || 'ZERO_JOULE_BFT';
  const tk = String(auditObj?.ticker || '').toUpperCase();
  const eastShare = 100 - westShare;
  const minoritySide = westShare >= 50 ? 'East' : 'West';
  const minorityPct = Math.min(westShare, eastShare);
  const majoritySide = westShare >= 50 ? 'West' : 'East';
  const majorityPct = Math.max(westShare, eastShare);
  const durationLabel =
    durationMins >= 1440
      ? `${Math.round(durationMins / 60)}h`
      : durationMins >= 60
      ? `${durationMins / 60}h`
      : `${durationMins}m`;

  if (tk === 'GEEK') {
    if (phase === 'PEACE') {
      return {
        statusLabel: 'L1 KRC-20 + HQ REDIS SYNC',
        statusColor: '#F59E0B',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: 'L1 KRC-20 Rail', value: '10.0 BPS Kaspa PoW', color: '#49EACB' },
          { label: 'HQ API + Redis', value: 'Server-Scored Alpha', color: '#FACC15' },
          { label: 'Token State', value: 'KRC-20 Indexer Read', color: '#F59E0B' }
        ],
        caption:
          'User-signed GEEK fair-mint & transfer inscriptions ride Kaspa’s 10-BPS BlockDAG, while Vercel HQ API + Upstash Redis score Proof-of-Learning runs off-chain.'
      };
    }
    if (phase === 'WARTIME') {
      return {
        statusLabel: 'L1 LIVE • HQ FAIL-CLOSED',
        statusColor: '#FACC15',
        westAlive: true,
        eastAlive: false,
        metrics: [
          { label: `L1 Wallet (${westShare}/${eastShare})`, value: '10 BPS P2P Mining', color: '#49EACB' },
          { label: 'Severed HQ Cloud', value: 'Fail-Closed (0 Runs)', color: '#EF4444' },
          { label: 'KRC-20 Indexer', value: 'Split Observation Lag', color: '#FACC15' }
        ],
        caption: `Across a ${durationLabel} cable cut, raw wallet-to-wallet GEEK inscriptions keep mining on both severed Kaspa L1 continents, while regions cut off from Vercel/Upstash Redis/Indexer fail closed.`
      };
    }
    return {
      statusLabel: 'BLUE-WORK INDEXER REPLAY',
      statusColor: '#4ADE80',
      westAlive: true,
      eastAlive: true,
      metrics: [
        { label: 'Kaspa L1 Carrier', value: '0% Orphans Merged', color: '#49EACB' },
        { label: 'KRC-20 Balances', value: 'Blue-Work Replayed', color: '#4ADE80' },
        { label: 'HQ Redis State', value: 'Replay-Lock Recovery', color: '#FACC15' }
      ],
      caption:
        'At resplice, Kaspa L1 merges both continental sub-DAGs with zero block loss; KRC-20 indexers replay deterministic Blue-Work inscription order and HQ reconciles saved Redis receipts.'
    };
  }

  if (tk === 'IGRA') {
    const westAttesterQuorum = westShare >= 66.7;
    const eastAttesterQuorum = eastShare >= 66.7;
    const attesterStalled = !westAttesterQuorum && !eastAttesterQuorum;
    if (phase === 'PEACE') {
      return {
        statusLabel: 'KASPA L1 BASED SEQUENCING',
        statusColor: '#F59E0B',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: 'L1 Carrier (viaduct)', value: '10.0 BPS Kaspa PoW', color: '#49EACB' },
          { label: 'Execution (reth)', value: 'Deterministic EVM', color: '#FACC15' },
          { label: '$IGRA Token', value: '10B Premine + PoS', color: '#EF4444' }
        ],
        caption:
          'RLP payloads sequence directly inside Kaspa’s 10-BPS BlockDAG without a centralized L2 sequencer, while external Hyperlane bridge exits rely on 400k-$IGRA PoS Attesters.'
      };
    }
    if (phase === 'WARTIME') {
      return {
        statusLabel: 'L1 ROLLUP LIVE • BRIDGES PAUSE',
        statusColor: '#FACC15',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: `L1 Sequencing (${westShare}/${eastShare})`, value: '10 BPS Both Halves', color: '#49EACB' },
          {
            label: 'External Bridge Exits',
            value: attesterStalled ? '<66.7% Attesters Paused' : 'Minority Exits Paused',
            color: '#EF4444'
          },
          { label: `${durationLabel} Cut`, value: '0 Sequencer Halts', color: '#4ADE80' }
        ],
        caption: `Across a ${durationLabel} cable cut, isolated continents keep posting Igra EVM transactions directly to local Kaspa L1 miners, while external $IGRA PoS Attester Hyperlane bridge exits stall.`
      };
    }
    return {
      statusLabel: 'SELECTED-PARENT EVM REPLAY',
      statusColor: '#4ADE80',
      westAlive: true,
      eastAlive: true,
      metrics: [
        { label: 'Kaspa L1 Carrier', value: '0% Orphans Merged', color: '#49EACB' },
        { label: 'viaduct + reth', value: 'Selected-Parent Sync', color: '#4ADE80' },
        { label: 'Hyperlane Exits', value: 'Attester Quorum Resumed', color: '#FACC15' }
      ],
      caption:
        'At resplice, Kaspa L1 weaves both continental sub-DAGs without losing carrier blocks, viaduct + reth deterministically replay Selected Parent Chain ordering, and bridge exits resume.'
    };
  }

  if (tk === 'LN') {
    if (phase === 'PEACE') {
      return {
        statusLabel: '0-JOULE HTLC MESH OVER 600s L1',
        statusColor: '#F59E0B',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: 'Off-Chain Hop', value: '0.0 J Promissory IOU', color: '#FACC15' },
          { label: 'L1 Exit Funnel', value: '600s / ~7 TPS Choke', color: '#FB923C' },
          { label: 'True Velocity', value: 'M_LN < M_BTC < 1.0', color: '#EF4444' }
        ],
        caption:
          'Sub-second HTLC/PTLC hops exchange 0-Joule revocable signatures (not PoW finality), while channel opens, splices, and exits remain bottlenecked by Bitcoin’s 600s (~7 TPS) sequential chain.'
      };
    }
    if (phase === 'WARTIME') {
      return {
        statusLabel: 'HTLC EXPIRY -> L1 MASS FORCE-CLOSE',
        statusColor: '#EF4444',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: 'Cross-Ocean HTLCs', value: 'CLTV Expiring -> Jammed', color: '#EF4444' },
          { label: 'L1 Exit Queue', value: '~7 TPS Flood-and-Loot', color: '#EF4444' },
          { label: 'Offline Receivers', value: '0% Reachable (Hot-Key)', color: '#FB923C' }
        ],
        caption: `Across a ${durationLabel} cable cut, severed cross-hemisphere HTLCs hang until CLTV timelocks expire, triggering emergency unilateral force-closes (CVE-2020-26895) that flood Bitcoin’s ~7 TPS blocks.`
      };
    }
    return {
      statusLabel: `${minoritySide.toUpperCase()} (${minorityPct}%) CHANNELS WIPED`,
      statusColor: '#EF4444',
      westAlive: westShare >= 50,
      eastAlive: eastShare > 50,
      metrics: [
        { label: 'L1 Carrier Reorg', value: '100% Minority Orphaned', color: '#EF4444' },
        { label: 'Force-Close / Justice', value: 'Sweeps Erased + Pinned', color: '#EF4444' },
        { label: 'CLTV / CSV Locks', value: 'Up to 14d (2,016 Blks)', color: '#FB923C' }
      ],
      caption: `At resplice, Bitcoin’s heaviest-chain reorg erases 100% of channel opens, splices, force-closes, and watchtower justice sweeps mined on the ${minorityPct}% ${minoritySide} chain while stranding capital in multi-day CSV locks.`
    };
  }

  if (fam === 'BLOCKDAG_POW') {
    if (phase === 'PEACE') {
      return {
        statusLabel: '10.0 BPS PARALLEL WEAVE',
        statusColor: '#49EACB',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: `West (${westShare}%)`, value: '10.0 BPS Synced', color: '#49EACB' },
          { label: `East (${eastShare}%)`, value: '10.0 BPS Synced', color: '#49EACB' },
          { label: 'Orphan Waste', value: '0.0% (M = 1.0)', color: '#49EACB' }
        ],
        caption:
          'Concurrent kHeavyHash blocks across both hemispheres weave simultaneously into one chronological GHOSTDAG spine with zero orphan energy waste.'
      };
    }
    if (phase === 'WARTIME') {
      return {
        statusLabel: 'BOTH CONTINENTS 100% LIVE',
        statusColor: '#49EACB',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: `West (${westShare}%)`, value: 'DAA -> 10.0 BPS', color: '#49EACB' },
          { label: `East (${eastShare}%)`, value: 'DAA -> 10.0 BPS', color: '#49EACB' },
          { label: `${durationLabel} Blackout`, value: '0 Halts • 2 Sub-DAGs', color: '#49EACB' }
        ],
        caption: `Even under a ${westShare}% / ${eastShare}% split for ${durationLabel}, neither hemisphere halts—KIP-0004 per-block DAA smoothly ramps both isolated continents to 10.0 BPS.`
      };
    }
    return {
      statusLabel: 'ZERO-LOSS BLUE-WORK MERGE',
      statusColor: '#49EACB',
      westAlive: true,
      eastAlive: true,
      metrics: [
        { label: `West (${westShare}%)`, value: '100% Merged', color: '#49EACB' },
        { label: `East (${eastShare}%)`, value: '100% Merged', color: '#49EACB' },
        { label: 'Work Destroyed', value: '0.0% (0 Orphans)', color: '#49EACB' }
      ],
      caption: `At resplice, GHOSTDAG / DAGKNIGHT weaves 100% of blocks from both the ${westShare}% West and ${eastShare}% East sub-DAGs into one unified graph without amputating the ${minorityPct}% side.`
    };
  }

  if (fam === 'LINEAR_POW') {
    if (phase === 'PEACE') {
      return {
        statusLabel: 'SINGLE-FILE LINEAR CHAIN',
        statusColor: '#4ADE80',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: 'Topology', value: '1-Parent Line', color: '#4ADE80' },
          { label: 'Concurrent PoW', value: 'Orphaned (M < 1)', color: '#FACC15' },
          { label: 'Cost Floor', value: 'E > 0 Hardware', color: '#4ADE80' }
        ],
        caption:
          'Genuine Proof-of-Work cost floor, but sequential single-parent blocks force long block intervals and discard simultaneous discoveries as stale orphans.'
      };
    }
    if (phase === 'WARTIME') {
      const westRate = ((westShare / 100) * 100).toFixed(0);
      const eastRate = ((eastShare / 100) * 100).toFixed(0);
      const bchCheckpointSplit = tk === 'BCH' && durationMins >= 120;
      return {
        statusLabel: bchCheckpointSplit
          ? '>2h 10-BLOCK CHECKPOINT LOCK!'
          : '2 INCOMPATIBLE FORKS',
        statusColor: bchCheckpointSplit ? '#EF4444' : '#FACC15',
        westAlive: true,
        eastAlive: true,
        metrics: [
          {
            label: `West (${westShare}%)`,
            value: bchCheckpointSplit
              ? 'Finalized Tip A (Depth 10)'
              : `${westRate}% Pace (${westShare >= 50 ? 'Heavier' : 'Lighter'})`,
            color: bchCheckpointSplit ? '#EF4444' : westShare >= 50 ? '#4ADE80' : '#FACC15'
          },
          {
            label: `East (${eastShare}%)`,
            value: bchCheckpointSplit
              ? 'Finalized Tip B (Depth 10)'
              : `${eastRate}% Pace (${eastShare > 50 ? 'Heavier' : 'Lighter'})`,
            color: bchCheckpointSplit ? '#EF4444' : eastShare > 50 ? '#4ADE80' : '#FACC15'
          },
          {
            label: `${durationLabel} Split`,
            value: bchCheckpointSplit ? '-maxreorgdepth=10 Hit' : 'Diverging Histories',
            color: bchCheckpointSplit ? '#EF4444' : '#FB923C'
          }
        ],
        caption: bchCheckpointSplit
          ? `At ${durationLabel} (>=2h / -finalizationdelay=7200s), BOTH isolated BCH continents mine past BCHN’s -maxreorgdepth=10 rolling checkpoint and locally lock incompatible finalized blocks!`
          : tk === 'BTC' || tk === 'LTC'
          ? `Both continents keep mining without halting, but rigid 2,016-block difficulty retargeting throttles the ${minorityPct}% ${minoritySide} chain while rival histories diverge.`
          : `Both continents keep mining locally across the ${durationLabel} cable cut, but single-chain topology forces West (${westShare}%) and East (${eastShare}%) onto rival histories.`
      };
    }
    const isTie = westShare === 50;
    const xmrCoinbaseWiped = tk === 'XMR' && durationMins >= 120;
    const bchPermanentSplit = tk === 'BCH' && durationMins >= 120;
    if (bchPermanentSplit) {
      return {
        statusLabel: 'PERMANENT CHAIN SPLIT (-maxreorgdepth=10)',
        statusColor: '#EF4444',
        westAlive: false,
        eastAlive: false,
        metrics: [
          { label: `West (${westShare}%)`, value: 'Rejects East (-100 DoS)', color: '#EF4444' },
          { label: `East (${eastShare}%)`, value: 'Rejects West (-100 DoS)', color: '#EF4444' },
          { label: 'BCHN Finalization', value: 'Manual -reindex Needed', color: '#FB923C' }
        ],
        caption: `Because the ${durationLabel} cut exceeded BCHN’s 10-block / 7,200s rolling checkpoint, -finalizeheaders=1 forces West and East nodes to ban each other upon resplice—permanently splitting BCH!`
      };
    }
    return {
      statusLabel: isTie
        ? '50/50 RACE -> 1 SIDE WIPED'
        : `${minoritySide.toUpperCase()} (${minorityPct}%) CHAIN WIPED`,
      statusColor: '#EF4444',
      westAlive: westShare >= 50,
      eastAlive: eastShare > 50,
      metrics: [
        {
          label: `${majoritySide} (${majorityPct}%)`,
          value: isTie ? 'Tie-Break Winner' : 'Overwrites Global Tip',
          color: '#4ADE80'
        },
        {
          label: `${minoritySide} (${minorityPct}%)`,
          value: '100% Orphaned & Erased',
          color: '#EF4444'
        },
        {
          label: tk === 'XMR' ? 'RingCT Impact' : 'Energy & TX Loss',
          value:
            tk === 'XMR'
              ? xmrCoinbaseWiped
                ? 'Coinbase + Decoys Dead'
                : 'Decoy Rings Poisoned'
              : `${minorityPct}% Wartime Work Lost`,
          color: '#EF4444'
        }
      ],
      caption:
        tk === 'XMR'
          ? `Nakamoto reorg annihilates 100% of the ${minorityPct}% ${minoritySide} chain${
              xmrCoinbaseWiped ? ', erases >2h unlocked 0.6 XMR coinbase commerce,' : ''
            } and invalidates honest user RingCT transactions whose 16-member rings grabbed vanished ${minoritySide} decoys.`
          : `Nakamoto’s Heaviest-Chain Rule ruthlessly orphans and erases every block, Joule of electricity, and merchant payment mined on the ${minorityPct}% ${minoritySide} continent.`
    };
  }

  if (fam === 'PHYSICAL_COMMODITY') {
    if (phase === 'PEACE') {
      return {
        statusLabel: 'VAULTED ATOMS & PAPER IOUs',
        statusColor: '#22C55E',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: `West Vaults (${westShare}%)`, value: '100:1 Paper Claims', color: '#FACC15' },
          { label: `East Vaults (${eastShare}%)`, value: 'Armored Custody', color: '#FACC15' },
          { label: 'Digital Velocity', value: '0.0 BPS (Baryonic)', color: '#FB923C' }
        ],
        caption:
          'Unforgeable nuclear stability, but physical weight and assay friction lock bullion inside centralized vaults trading fractional paper claims.'
      };
    }
    if (phase === 'WARTIME') {
      return {
        statusLabel: 'COINS OK • OCEAN 0.0 TPS',
        statusColor: '#FACC15',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: 'Hand-to-Hand Coin', value: '100% Offline Ready', color: '#22C55E' },
          { label: 'Cross-Ocean Rail', value: '0.0 TPS Blockaded', color: '#EF4444' },
          { label: 'Custodial Vaults', value: 'EO 6102 Freeze Risk', color: '#EF4444' }
        ],
        caption:
          'Bearer coins in your palm barter offline with zero electricity, but cross-ocean digital throughput is 0.0 TPS and sovereign vaults freeze redemptions.'
      };
    }
    return {
      statusLabel: '4-YEAR REPATRIATION FREIGHT',
      statusColor: '#FB923C',
      westAlive: true,
      eastAlive: true,
      metrics: [
        { label: 'Fiber Resplice', value: '0 Atoms Teleported', color: '#EF4444' },
        { label: 'Ocean Settlement', value: 'Ships / Cargo Jets', color: '#FB923C' },
        { label: 'Bar Verification', value: 'Ultrasonic / XRF Assay', color: '#FACC15' }
      ],
      caption:
        'Repairing undersea fiber-optic cables cannot teleport physical gold or silver—international settlement still crawls via armored freight and ultrasonic tungsten assays.'
    };
  }

  // ZERO_JOULE_BFT (PoS / DPoS / FBA / Snowman / Signers)
  const req = getBftQuorumThreshold(tk);

  if (phase === 'PEACE') {
    return {
      statusLabel: '0-JOULE VALIDATOR QUORUM',
      statusColor: '#FB923C',
      westAlive: true,
      eastAlive: true,
      metrics: [
        { label: 'Energy Floor', value: '0.0 Joules (PoS)', color: '#EF4444' },
        {
          label: 'Halt Threshold',
          value: tk === 'ADA' ? '36h k=2160 Window' : `>=${req}% Stake Quorum`,
          color: '#FB923C'
        },
        { label: 'History Storage', value: 'Pruned / Cloud S3', color: '#EF4444' }
      ],
      caption:
        'Streams weightless digital validator signatures across cloud data centers at 0 Joules while pruning raw history onto centralized cloud buckets.'
    };
  }

  if (tk === 'ADA') {
    const permanentSplit = durationMins >= 2160;
    if (phase === 'WARTIME') {
      return {
        statusLabel: permanentSplit ? '>36h PERMANENT FORK SPLIT' : 'UNFINALIZED PRAOS DRIFT',
        statusColor: permanentSplit ? '#EF4444' : '#FB923C',
        westAlive: !permanentSplit,
        eastAlive: !permanentSplit,
        metrics: [
          {
            label: `West (${westShare}%)`,
            value: permanentSplit ? 'Irreconcilable Fork A' : '20s Unfinalized Drift',
            color: permanentSplit ? '#EF4444' : '#FACC15'
          },
          {
            label: `East (${eastShare}%)`,
            value: permanentSplit ? 'Irreconcilable Fork B' : '20s Unfinalized Drift',
            color: permanentSplit ? '#EF4444' : '#FACC15'
          },
          {
            label: `${durationLabel} vs 36h Limit`,
            value: permanentSplit ? 'Exceeded k=2160!' : 'Approaching k=2160',
            color: '#EF4444'
          }
        ],
        caption: permanentSplit
          ? `At ${durationLabel} (>36h / 2,160 blocks), Cardano breaches Ouroboros chain-density safety—permanently splitting West (${westShare}%) and East (${eastShare}%) into incompatible ledgers!`
          : `During a ${durationLabel} cut, 95% of Cardano slots sit idle (f=0.05) while both halves drift without finality toward the fatal 36-hour (k=2160) split horizon.`
      };
    }
    return {
      statusLabel: permanentSplit ? 'SOCIAL HARD-FORK REQUIRED' : 'MINORITY STAKE REORG',
      statusColor: '#EF4444',
      westAlive: !permanentSplit && westShare >= 50,
      eastAlive: !permanentSplit && eastShare > 50,
      metrics: [
        {
          label: 'Reconciliation',
          value: permanentSplit ? 'Impossible via Physics' : '0-Joule Chain Reorg',
          color: '#EF4444'
        },
        {
          label: `${minoritySide} (${minorityPct}%)`,
          value: permanentSplit ? 'Permanent Split' : '100% Blocks Wiped',
          color: '#EF4444'
        },
        { label: 'Energy Proof', value: '0.0 Joules (VRF)', color: '#EF4444' }
      ],
      caption: permanentSplit
        ? 'Past 36 hours (2,160 blocks) with 0 Joules of Proof-of-Work cumulative difficulty, nodes cannot mathematically unite the forks without a human social hard fork.'
        : `Upon resplicing before 36h, Cardano wipes out 100% of blocks produced on the ${minorityPct}% ${minoritySide} fork via zero-joule VRF slot density.`
    };
  }

  const westHasQuorum = westShare >= req;
  const eastHasQuorum = eastShare >= req;
  const bothDead = !westHasQuorum && !eastHasQuorum;
  const algoBlind = tk === 'ALGO' && durationMins >= 45;

  if (phase === 'WARTIME') {
    return {
      statusLabel: bothDead
        ? 'GLOBAL CARDIAC ARREST (0 TPS)'
        : `${westHasQuorum ? 'EAST' : 'WEST'} CONTINENT DEAD (0 TPS)`,
      statusColor: bothDead ? '#EF4444' : '#FB923C',
      westAlive: westHasQuorum,
      eastAlive: eastHasQuorum,
      metrics: [
        {
          label: `West (${westShare}%)`,
          value: westHasQuorum ? `>=${req}% -> LIVE` : `<${req}% -> HALTED`,
          color: westHasQuorum ? '#FACC15' : '#EF4444'
        },
        {
          label: `East (${eastShare}%)`,
          value: eastHasQuorum ? `>=${req}% -> LIVE` : `<${req}% -> HALTED`,
          color: eastHasQuorum ? '#FACC15' : '#EF4444'
        },
        {
          label: algoBlind ? '45m Pruning Limit' : 'Quorum Requirement',
          value: algoBlind ? 'Peer Sync Blinded!' : `Needs >=${req}% Stake`,
          color: '#EF4444'
        }
      ],
      caption: bothDead
        ? `Mathematical BFT deadlock: neither West (${westShare}%) nor East (${eastShare}%) reaches ${tk}’s >=${req}% supermajority quorum—freezing 100% of global finality at 0.0 TPS!`
        : `Skewed ${westShare}% / ${eastShare}% split: ${
            westHasQuorum ? `West (${westShare}%)` : `East (${eastShare}%)`
          } barely clears >=${req}% quorum, leaving ${
            westHasQuorum ? `East (${eastShare}%)` : `West (${westShare}%)`
          } completely paralyzed at 0.0 TPS${
            tk === 'ETH' ? ' and bleeding stake via quadratic Inactivity Leak!' : '!'
          }`
    };
  }

  // SPLICE phase for ZERO_JOULE_BFT
  return {
    statusLabel:
      bothDead || algoBlind ? 'DISCORD / ADMIN OVERRIDE' : `${minorityPct}% SIDE SNAPSHOT SYNC`,
    statusColor: '#EF4444',
    westAlive: westHasQuorum && !algoBlind,
    eastAlive: eastHasQuorum && !algoBlind,
    metrics: [
      {
        label: 'Partition Commerce',
        value: bothDead ? '0 TXs Settled Globally' : `${minoritySide} (${minorityPct}%) 0 TXs`,
        color: '#EF4444'
      },
      {
        label: 'Recovery Method',
        value: algoBlind
          ? 'Foundation Catchpoint'
          : bothDead
          ? 'Discord Slot Reboot'
          : 'Central Cloud Snapshot',
        color: '#FB923C'
      },
      { label: 'Thermodynamic Mass', value: '0.0 Joules (M = 0)', color: '#EF4444' }
    ],
    caption: algoBlind
      ? `Because the ${durationLabel} cut exceeded Algorand’s 1,000-round (~45m) non-archival memory buffer, isolated nodes cannot peer-sync and must trust centralized Foundation Catchpoints.`
      : bothDead
      ? `After flatlining both continents at 0.0 TPS across the ${westShare}/${eastShare} split, validators coordinate out-of-band on Discord to restart from a manual slot snapshot.`
      : `The frozen ${minorityPct}% ${minoritySide} continent settled 0 transactions during the entire ${durationLabel} blackout and must download centralized cloud state snapshots to catch up.`
  };
}

function TopologyMeshCanvas({ auditObj, phase, westShare, durationMins }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fam = auditObj?.consensusFamily || 'ZERO_JOULE_BFT';
  const tk = String(auditObj?.ticker || '').toUpperCase();
  const eastShare = 100 - westShare;
  const info = getSimulatorTelemetry(auditObj, phase, westShare, durationMins);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    let rafId = null;
    let width = 480;
    const height = 178;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(280, Math.floor(rect.width));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateSize);
      ro.observe(container);
    } else {
      window.addEventListener('resize', updateSize);
    }

    const startMs = performance.now();

    const drawRoundedRect = (ctx, x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    const renderFrame = (now) => {
      const t = (now - startMs) / 1000;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      const gutterX = 104;
      const rightPad = 14;
      const laneW = Math.max(160, width - gutterX - rightPad);
      const westY = 46;
      const midY = 89;
      const eastY = 132;

      // Subtle background grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let gx = gutterX; gx < width - rightPad; gx += 36) {
        ctx.beginPath();
        ctx.moveTo(gx, 12);
        ctx.lineTo(gx, height - 12);
        ctx.stroke();
      }

      // Hemisphere lane guide tracks
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.moveTo(gutterX, westY);
      ctx.lineTo(width - rightPad, westY);
      ctx.moveTo(gutterX, eastY);
      ctx.lineTo(width - rightPad, eastY);
      ctx.stroke();

      // Center Subsea Fiber Conduit Line
      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle =
        phase === 'WARTIME' ? 'rgba(239,68,68,0.32)' : 'rgba(73,234,203,0.18)';
      ctx.beginPath();
      ctx.moveTo(gutterX, midY);
      ctx.lineTo(width - rightPad, midY);
      ctx.stroke();
      ctx.restore();

      // Left Gutter Telemetry Labels
      ctx.font = '700 9.5px "JetBrains Mono", monospace';
      ctx.fillStyle = info.westAlive ? '#E5E7EB' : '#EF4444';
      ctx.fillText(`WEST (${westShare}%)`, 10, westY - 3);
      ctx.font = '400 8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#6B7280';
      ctx.fillText('Americas / EU', 10, westY + 9);

      ctx.font = '700 8px "JetBrains Mono", monospace';
      ctx.fillStyle =
        phase === 'WARTIME' ? '#EF4444' : phase === 'SPLICE' ? info.statusColor : '#49EACB';
      ctx.fillText(
        phase === 'WARTIME'
          ? '⚡ CABLE CUT'
          : phase === 'SPLICE'
          ? '⇄ RESPLICED'
          : '⇄ FIBER SYNC',
        10,
        midY + 3
      );

      ctx.font = '700 9.5px "JetBrains Mono", monospace';
      ctx.fillStyle = info.eastAlive ? '#E5E7EB' : '#EF4444';
      ctx.fillText(`EAST (${eastShare}%)`, 10, eastY - 3);
      ctx.font = '400 8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#6B7280';
      ctx.fillText('Asia / Oceania', 10, eastY + 9);

      // ======================================================================
      // 1. BLOCKDAG_POW (KASPA / IGRA) — LIVE 10 BPS PARALLEL WEAVE & MERGE
      // ======================================================================
      if (fam === 'BLOCKDAG_POW') {
        const speed = 56;
        const stepX = 38;
        const offset = (t * speed) % stepX;
        const count = Math.ceil(laneW / stepX) + 2;

        if (phase === 'PEACE') {
          const nodes = [];
          for (let i = 0; i < count; i++) {
            const x = gutterX + laneW - i * stepX + offset - 12;
            if (x < gutterX - 18 || x > width) continue;
            const wobW = Math.sin(i * 1.7) * 8;
            const wobE = Math.cos(i * 1.9) * 8;
            nodes.push({
              x,
              wy1: westY - 10 + wobW * 0.4,
              wy2: westY + 11 - wobW * 0.3,
              ey1: eastY - 11 + wobE * 0.3,
              ey2: eastY + 10 - wobE * 0.4
            });
          }

          // Multi-parent cross-hemisphere DAG edges
          for (let i = 0; i < nodes.length - 1; i++) {
            const a = nodes[i];
            const b = nodes[i + 1];
            ctx.strokeStyle = 'rgba(73, 234, 203, 0.38)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(a.x, a.wy1);
            ctx.lineTo(b.x, b.wy1);
            ctx.moveTo(a.x, a.wy2);
            ctx.lineTo(b.x, b.wy1);
            ctx.moveTo(a.x, a.wy1);
            ctx.lineTo(b.x, b.ey1);
            ctx.moveTo(a.x, a.ey1);
            ctx.lineTo(b.x, b.wy2);
            ctx.moveTo(a.x, a.ey1);
            ctx.lineTo(b.x, b.ey1);
            ctx.moveTo(a.x, a.ey2);
            ctx.lineTo(b.x, b.ey1);
            ctx.stroke();
          }

          // Animated fiber-optic photon pulses crossing midY
          for (let p = 0; p < 4; p++) {
            const px = gutterX + 24 + ((p * 0.25 + t * 0.45) % 1) * (laneW - 40);
            const dir = p % 2 === 0 ? 1 : -1;
            const prog = (t * 2.2 + p * 0.37) % 1;
            const py = dir > 0 ? westY + (eastY - westY) * prog : eastY - (eastY - westY) * prog;
            ctx.fillStyle = '#49EACB';
            ctx.beginPath();
            ctx.arc(px, py, 2.3, 0, Math.PI * 2);
            ctx.fill();
          }

          // Parallel BlockDAG blocks
          nodes.forEach((n) => {
            [n.wy1, n.wy2, n.ey1, n.ey2].forEach((ny) => {
              ctx.fillStyle = '#0B1917';
              ctx.strokeStyle = '#49EACB';
              ctx.lineWidth = 1.5;
              drawRoundedRect(ctx, n.x - 5.5, ny - 5.5, 11, 11, 2.8);
              ctx.fill();
              ctx.stroke();
            });
          });
        } else if (phase === 'WARTIME') {
          // Severed red barrier across center subsea line
          ctx.save();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(gutterX + 8, midY);
          ctx.lineTo(width - rightPad, midY);
          ctx.stroke();
          ctx.restore();

          // Crackling fiber cut spark in center
          const sparkX = gutterX + laneW * 0.48;
          const pulseR = 5 + Math.abs(Math.sin(t * 7)) * 5;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
          ctx.beginPath();
          ctx.arc(sparkX, midY, pulseR, 0, Math.PI * 2);
          ctx.fill();

          // Both West & East keep streaming autonomous 10-BPS parallel sub-DAGs!
          const drawSubDagLane = (centerY, phaseShift) => {
            const pts = [];
            for (let i = 0; i < count; i++) {
              const x = gutterX + laneW - i * stepX + ((t * speed + phaseShift) % stepX) - 10;
              if (x < gutterX - 14 || x > width) continue;
              pts.push({ x, y1: centerY - 11, y2: centerY + 11 });
            }
            for (let i = 0; i < pts.length - 1; i++) {
              const a = pts[i];
              const b = pts[i + 1];
              ctx.strokeStyle = 'rgba(73, 234, 203, 0.48)';
              ctx.lineWidth = 1.3;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y1);
              ctx.lineTo(b.x, b.y1);
              ctx.moveTo(a.x, a.y2);
              ctx.lineTo(b.x, b.y2);
              ctx.moveTo(a.x, a.y1);
              ctx.lineTo(b.x, b.y2);
              ctx.moveTo(a.x, a.y2);
              ctx.lineTo(b.x, b.y1);
              ctx.stroke();
            }
            pts.forEach((p) => {
              [p.y1, p.y2].forEach((py) => {
                ctx.fillStyle = '#0B1917';
                ctx.strokeStyle = '#49EACB';
                ctx.lineWidth = 1.5;
                drawRoundedRect(ctx, p.x - 5.5, py - 5.5, 11, 11, 2.8);
                ctx.fill();
                ctx.stroke();
              });
            });
          };

          drawSubDagLane(westY, 0);
          drawSubDagLane(eastY, 17);
        } else {
          // SPLICE: Partitioned sub-DAGs on left seamlessly weave through Blue-Work Merge Gate on right
          const spliceX = gutterX + laneW * 0.52;

          // Pulsing Resplice Gate
          const waveR = ((t * 38) % 44) + 8;
          ctx.strokeStyle = `rgba(73, 234, 203, ${Math.max(0, 0.55 - waveR / 90)})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(spliceX, midY, waveR, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(73, 234, 203, 0.55)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(spliceX, 16);
          ctx.lineTo(spliceX, height - 16);
          ctx.stroke();
          ctx.setLineDash([]);

          // Pre-splice parallel sub-DAG columns (both preserved!)
          const leftCols = [gutterX + 22, gutterX + 66, gutterX + 110].filter(
            (x) => x < spliceX - 18
          );
          leftCols.forEach((cx, idx) => {
            const nx = idx < leftCols.length - 1 ? leftCols[idx + 1] : spliceX;
            const targetWY = idx < leftCols.length - 1 ? westY : midY - 12;
            const targetEY = idx < leftCols.length - 1 ? eastY : midY + 12;
            ctx.strokeStyle = 'rgba(73, 234, 203, 0.55)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(cx, westY - 8);
            ctx.lineTo(nx, targetWY);
            ctx.moveTo(cx, westY + 8);
            ctx.lineTo(nx, targetWY);
            ctx.moveTo(cx, eastY - 8);
            ctx.lineTo(nx, targetEY);
            ctx.moveTo(cx, eastY + 8);
            ctx.lineTo(nx, targetEY);
            ctx.stroke();

            [westY - 8, westY + 8, eastY - 8, eastY + 8].forEach((py) => {
              ctx.fillStyle = '#0B1917';
              ctx.strokeStyle = '#49EACB';
              ctx.lineWidth = 1.5;
              drawRoundedRect(ctx, cx - 5.5, py - 5.5, 11, 11, 2.8);
              ctx.fill();
              ctx.stroke();
            });
          });

          // Merge hub blocks & post-splice unified weave
          const rightCols = [spliceX + 46, spliceX + 92, spliceX + 138].filter(
            (x) => x < width - rightPad - 8
          );
          let prevX = spliceX;
          rightCols.forEach((rx) => {
            ctx.strokeStyle = 'rgba(73, 234, 203, 0.65)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(prevX, midY - 12);
            ctx.lineTo(rx, westY);
            ctx.moveTo(prevX, midY + 12);
            ctx.lineTo(rx, westY);
            ctx.moveTo(prevX, midY - 12);
            ctx.lineTo(rx, eastY);
            ctx.moveTo(prevX, midY + 12);
            ctx.lineTo(rx, eastY);
            ctx.stroke();
            prevX = rx;

            [westY, midY, eastY].forEach((ry) => {
              ctx.fillStyle = '#0E2622';
              ctx.strokeStyle = '#49EACB';
              ctx.lineWidth = 1.6;
              drawRoundedRect(ctx, rx - 6, ry - 6, 12, 12, 3);
              ctx.fill();
              ctx.stroke();
            });
          });

          [midY - 12, midY + 12].forEach((my) => {
            ctx.fillStyle = '#13352F';
            ctx.strokeStyle = '#49EACB';
            ctx.lineWidth = 2;
            drawRoundedRect(ctx, spliceX - 7, my - 7, 14, 14, 3.5);
            ctx.fill();
            ctx.stroke();
          });
        }
      }

      // ======================================================================
      // 2. LINEAR_POW (BTC / LTC / XMR / ZEC) — SLIDER-SCALED FORKS & REORG WIPE
      // ======================================================================
      else if (fam === 'LINEAR_POW') {
        if (phase === 'PEACE') {
          const stepX = 56;
          const offset = (t * 24) % stepX;
          ctx.strokeStyle = '#4ADE80';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(gutterX + 6, midY);
          ctx.lineTo(width - rightPad - 6, midY);
          ctx.stroke();

          for (let x = gutterX + 18 + offset; x < width - rightPad - 8; x += stepX) {
            // Periodic orphaned block drifting away
            const idx = Math.round((x - offset) / stepX);
            if (idx % 3 === 1) {
              const oy = idx % 2 === 0 ? westY - 4 : eastY + 4;
              ctx.save();
              ctx.strokeStyle = 'rgba(249, 115, 22, 0.48)';
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.moveTo(x - 22, midY);
              ctx.lineTo(x, oy);
              ctx.stroke();
              drawRoundedRect(ctx, x - 6, oy - 6, 12, 12, 3);
              ctx.fillStyle = '#18100B';
              ctx.fill();
              ctx.strokeStyle = '#F97316';
              ctx.stroke();
              ctx.restore();
            }

            ctx.fillStyle = '#0B1910';
            ctx.strokeStyle = '#4ADE80';
            ctx.lineWidth = 1.8;
            drawRoundedRect(ctx, x - 7, midY - 7, 14, 14, 3.5);
            ctx.fill();
            ctx.stroke();
          }
        } else if (phase === 'WARTIME') {
          // Block spacing & velocity scale directly with westShare vs eastShare!
          const westSpacing = Math.max(30, 82 - westShare * 0.55);
          const eastSpacing = Math.max(30, 82 - eastShare * 0.55);
          const westSpeed = 10 + westShare * 0.34;
          const eastSpeed = 10 + eastShare * 0.34;

          const drawLinearBranch = (y, spacing, spd, color) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.7;
            ctx.beginPath();
            ctx.moveTo(gutterX + 8, y);
            ctx.lineTo(width - rightPad - 8, y);
            ctx.stroke();

            const off = (t * spd) % spacing;
            for (let x = gutterX + 16 + off; x < width - rightPad - 8; x += spacing) {
              ctx.fillStyle = '#0B0E11';
              ctx.strokeStyle = color;
              ctx.lineWidth = 1.8;
              drawRoundedRect(ctx, x - 6.5, y - 6.5, 13, 13, 3.2);
              ctx.fill();
              ctx.stroke();
            }
          };

          drawLinearBranch(westY, westSpacing, westSpeed, westShare >= 50 ? '#4ADE80' : '#FACC15');
          drawLinearBranch(eastY, eastSpacing, eastSpeed, eastShare > 50 ? '#4ADE80' : '#FACC15');
        } else {
          // SPLICE: Periodic red reorg shockwave wipes out the minority hemisphere's blocks!
          const westWins = westShare >= 50;
          const winY = westWins ? westY : eastY;
          const loseY = westWins ? eastY : westY;
          const spliceX = gutterX + laneW * 0.58;
          const shockCycle = (t * 0.65) % 1; // Repeating shockwave animation
          const shockX = spliceX - shockCycle * (spliceX - gutterX);

          // Winning heavier chain continues past spliceX
          ctx.strokeStyle = '#4ADE80';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gutterX + 12, winY);
          ctx.lineTo(spliceX, winY);
          ctx.lineTo(spliceX + 34, midY);
          ctx.lineTo(width - rightPad - 10, midY);
          ctx.stroke();

          for (let x = gutterX + 24; x < spliceX - 8; x += 44) {
            ctx.fillStyle = '#0B1910';
            ctx.strokeStyle = '#4ADE80';
            ctx.lineWidth = 1.8;
            drawRoundedRect(ctx, x - 6.5, winY - 6.5, 13, 13, 3.2);
            ctx.fill();
            ctx.stroke();
          }
          for (let x = spliceX + 38; x < width - rightPad - 10; x += 44) {
            ctx.fillStyle = '#0B1910';
            ctx.strokeStyle = '#4ADE80';
            ctx.lineWidth = 1.8;
            drawRoundedRect(ctx, x - 6.5, midY - 6.5, 13, 13, 3.2);
            ctx.fill();
            ctx.stroke();
          }

          // Losing minority branch shattered by red reorg shockwave
          ctx.save();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(gutterX + 12, loseY);
          ctx.lineTo(spliceX - 10, loseY);
          ctx.stroke();
          ctx.restore();

          for (let x = gutterX + 26; x < spliceX - 14; x += 46) {
            const isHit = x >= shockX;
            const shake = isHit ? Math.sin(t * 28 + x) * 1.4 : 0;
            ctx.fillStyle = isHit ? '#220C0E' : '#17150B';
            ctx.strokeStyle = isHit ? '#EF4444' : '#FACC15';
            ctx.lineWidth = 1.6;
            drawRoundedRect(ctx, x - 6.5 + shake, loseY - 6.5, 13, 13, 3.2);
            ctx.fill();
            ctx.stroke();

            if (isHit) {
              ctx.strokeStyle = '#EF4444';
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.moveTo(x - 4 + shake, loseY - 4);
              ctx.lineTo(x + 4 + shake, loseY + 4);
              ctx.moveTo(x + 4 + shake, loseY - 4);
              ctx.lineTo(x - 4 + shake, loseY + 4);
              ctx.stroke();
            }
          }

          // Red Reorg Shockwave Pulse Ring
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.78)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(shockX, loseY, 10, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // ======================================================================
      // 3. PHYSICAL_COMMODITY (XAU / XAG) — LOCAL COINS VS OCEAN BLOCKADE
      // ======================================================================
      else if (fam === 'PHYSICAL_COMMODITY') {
        if (phase === 'PEACE') {
          const shipX = gutterX + 20 + ((t * 14) % (laneW - 40));
          // Fast paper claims overhead
          ctx.save();
          ctx.strokeStyle = 'rgba(251, 146, 60, 0.45)';
          ctx.setLineDash([3, 5]);
          ctx.beginPath();
          ctx.moveTo(gutterX + 16, westY);
          ctx.lineTo(width - rightPad - 16, eastY);
          ctx.stroke();
          ctx.restore();

          // Slow physical bullion transfer
          [gutterX + 28, gutterX + laneW * 0.5, width - rightPad - 28].forEach((vx) => {
            [westY, eastY].forEach((vy) => {
              ctx.fillStyle = '#191507';
              ctx.strokeStyle = '#FACC15';
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.arc(vx, vy, 7.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            });
          });

          ctx.fillStyle = '#FACC15';
          drawRoundedRect(ctx, shipX - 8, midY - 5, 16, 10, 2.5);
          ctx.fill();
        } else if (phase === 'WARTIME') {
          // Local offline coin barter rings active on both continents
          [westY, eastY].forEach((cy, idx) => {
            for (let k = 0; k < 3; k++) {
              const cx = gutterX + 42 + k * ((laneW - 84) / 2);
              const ang = t * 2.1 + k + idx;
              ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
              ctx.beginPath();
              ctx.arc(cx, cy, 12, 0, Math.PI * 2);
              ctx.stroke();

              ctx.fillStyle = '#22C55E';
              ctx.beginPath();
              ctx.arc(cx + Math.cos(ang) * 12, cy + Math.sin(ang) * 12, 2.5, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#171407';
              ctx.strokeStyle = '#FACC15';
              ctx.lineWidth = 1.7;
              ctx.beginPath();
              ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          });

          // Ocean Blockade Banner
          ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
          drawRoundedRect(ctx, gutterX + laneW * 0.18, midY - 10, laneW * 0.64, 20, 10);
          ctx.fill();
          ctx.font = '700 8px "JetBrains Mono", monospace';
          ctx.fillStyle = '#EF4444';
          ctx.textAlign = 'center';
          ctx.fillText('OCEAN BLOCKADE • 0.0 DIGITAL TPS', gutterX + laneW * 0.5, midY + 3);
          ctx.textAlign = 'start';
        } else {
          // SPLICE: Fiber works, but bullion ship still crawls across ocean
          const crawlX = gutterX + 24 + ((t * 7) % (laneW - 48));
          ctx.fillStyle = '#1C1408';
          ctx.strokeStyle = '#FB923C';
          ctx.lineWidth = 1.6;
          drawRoundedRect(ctx, crawlX - 28, midY - 9, 56, 18, 5);
          ctx.fill();
          ctx.stroke();
          ctx.font = '700 7.5px "JetBrains Mono", monospace';
          ctx.fillStyle = '#FACC15';
          ctx.textAlign = 'center';
          ctx.fillText('4-YR SHIP', crawlX, midY + 2.5);
          ctx.textAlign = 'start';
        }
      }

      // ======================================================================
      // 4. ZERO_JOULE_BFT (SOL / ETH / SUI / AVAX / XRP / ADA / ALGO / STX)
      // ======================================================================
      else {
        const req = getBftQuorumThreshold(tk);
        const adaPermSplit = tk === 'ADA' && durationMins >= 2160;
        const westQuorum = tk === 'ADA' ? !adaPermSplit : westShare >= req;
        const eastQuorum = tk === 'ADA' ? !adaPermSplit : eastShare >= req;

        const drawEkgFlatline = (y, labelText) => {
          const sweepX = gutterX + ((t * 95) % laneW);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(gutterX, y);
          ctx.lineTo(width - rightPad, y);
          ctx.stroke();

          // Glowing flatline cursor
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(sweepX, y, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(24, 11, 13, 0.9)';
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
          ctx.lineWidth = 1.1;
          drawRoundedRect(ctx, gutterX + laneW * 0.2, y - 9.5, laneW * 0.6, 19, 9.5);
          ctx.fill();
          ctx.stroke();

          ctx.font = '700 7.8px "JetBrains Mono", monospace';
          ctx.fillStyle = '#FCA5A5';
          ctx.textAlign = 'center';
          ctx.fillText(labelText, gutterX + laneW * 0.5, y + 2.8);
          ctx.textAlign = 'start';
        };

        const drawLiveBftLane = (y, color) => {
          const stepX = 48;
          const off = (t * 36) % stepX;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(gutterX + 6, y);
          ctx.lineTo(width - rightPad - 6, y);
          ctx.stroke();
          for (let x = gutterX + 16 + off; x < width - rightPad - 8; x += stepX) {
            ctx.fillStyle = '#17120B';
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.6;
            drawRoundedRect(ctx, x - 6, y - 6, 12, 12, 3);
            ctx.fill();
            ctx.stroke();
          }
        };

        if (phase === 'PEACE') {
          const stepX = 50;
          const off = (t * 38) % stepX;
          ctx.strokeStyle = 'rgba(251, 146, 60, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(gutterX + 6, midY);
          ctx.lineTo(width - rightPad - 6, midY);
          ctx.stroke();

          for (let x = gutterX + 18 + off; x < width - rightPad - 8; x += stepX) {
            ctx.strokeStyle = 'rgba(251, 146, 60, 0.25)';
            ctx.beginPath();
            ctx.moveTo(x, westY);
            ctx.lineTo(x, eastY);
            ctx.stroke();

            ctx.fillStyle = '#18110A';
            ctx.strokeStyle = '#FB923C';
            ctx.lineWidth = 1.6;
            drawRoundedRect(ctx, x - 6, midY - 6, 12, 12, 3);
            ctx.fill();
            ctx.stroke();
          }
        } else if (phase === 'WARTIME') {
          if (westQuorum) {
            drawLiveBftLane(westY, '#FACC15');
          } else {
            drawEkgFlatline(
              westY,
              tk === 'ADA'
                ? 'IRRECONCILABLE FORK (>36h)'
                : `${westShare}% < ${req}% QUORUM -> 0.0 TPS`
            );
          }

          if (eastQuorum) {
            drawLiveBftLane(eastY, '#FACC15');
          } else {
            drawEkgFlatline(
              eastY,
              tk === 'ADA'
                ? 'IRRECONCILABLE FORK (>36h)'
                : `${eastShare}% < ${req}% QUORUM -> 0.0 TPS`
            );
          }
        } else {
          // SPLICE on BFT / PoS
          const algoBlind = tk === 'ALGO' && durationMins >= 45;
          const bothDead = (!westQuorum && !eastQuorum) || adaPermSplit || algoBlind;

          if (bothDead) {
            drawEkgFlatline(westY, 'STALLED SLOTS • 0.0 J');
            drawEkgFlatline(eastY, 'STALLED SLOTS • 0.0 J');

            const pulse = 0.65 + Math.abs(Math.sin(t * 4)) * 0.35;
            ctx.fillStyle = '#220E11';
            ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
            ctx.lineWidth = 1.8;
            drawRoundedRect(ctx, gutterX + laneW * 0.22, midY - 13, laneW * 0.56, 26, 7);
            ctx.fill();
            ctx.stroke();

            ctx.font = '700 8px "JetBrains Mono", monospace';
            ctx.fillStyle = '#FCA5A5';
            ctx.textAlign = 'center';
            ctx.fillText(
              algoBlind
                ? 'FOUNDATION CATCHPOINT REQUIRED'
                : adaPermSplit
                ? 'SOCIAL HARD-FORK REQUIRED'
                : 'DISCORD SLOT REBOOT REQUIRED',
              gutterX + laneW * 0.5,
              midY + 3
            );
            ctx.textAlign = 'start';
          } else {
            // One skewed side had quorum while minority continent stayed frozen and must snapshot-sync
            const liveY = westQuorum ? westY : eastY;
            const deadY = westQuorum ? eastY : westY;
            drawLiveBftLane(liveY, '#FB923C');
            drawEkgFlatline(deadY, '0 TXs SETTLED -> CLOUD SNAPSHOT SYNC');
          }
        }
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', updateSize);
    };
  }, [fam, tk, phase, westShare, eastShare, durationMins, info.westAlive, info.eastAlive, info.statusColor]);

  return (
    <div className="rounded-2xl bg-[#07080A] border border-white/[0.07] p-4 flex flex-col justify-between gap-3">
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: info.statusColor,
              boxShadow: `0 0 8px ${info.statusColor}`
            }}
          />
          <span className="font-mono text-xs font-bold text-white truncate">
            ${auditObj.ticker}{' '}
            <span className="text-neutral-500 font-normal">// {auditObj.name}</span>
          </span>
        </div>

        <span
          className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold shrink-0"
          style={{
            color: info.statusColor,
            backgroundColor: `${info.statusColor}18`,
            border: `1px solid ${info.statusColor}50`
          }}
        >
          {info.statusLabel}
        </span>
      </div>

      {/* Live 60fps Retina Canvas */}
      <div
        ref={containerRef}
        className="w-full rounded-xl bg-[#0B0C0E] border border-white/[0.05] overflow-hidden"
      >
        <canvas ref={canvasRef} className="w-full block" style={{ height: '178px' }} />
      </div>

      {/* 3 Reactive Telemetry KPIs */}
      <div className="grid grid-cols-3 gap-2">
        {info.metrics.map((m, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-[#0B0C0E] border border-white/[0.05] px-2.5 py-2"
          >
            <div className="font-mono text-[9.5px] uppercase tracking-wider text-neutral-500 truncate">
              {m.label}
            </div>
            <div
              className="font-mono text-[10.5px] font-bold mt-0.5 truncate"
              style={{ color: m.color }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-300 leading-relaxed">{info.caption}</p>
    </div>
  );
}

function WartimeSpliceSimulator({ activeAudit, kasAudit, accent }) {
  const [phase, setPhase] = useState('WARTIME');
  const [westShare, setWestShare] = useState(58);
  const [durationMins, setDurationMins] = useState(60);
  const [compareKas, setCompareKas] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);

  const showSideBySide = compareKas && activeAudit?.ticker !== 'KAS' && Boolean(kasAudit);
  const eastShare = 100 - westShare;

  // Optional hands-free Auto-Cycle through Peace -> Wartime Cut -> Cable Resplice
  useEffect(() => {
    if (!autoPlay) return undefined;
    const order = ['PEACE', 'WARTIME', 'SPLICE'];
    const timer = setInterval(() => {
      setPhase((prev) => order[(order.indexOf(prev) + 1) % order.length]);
    }, 4200);
    return () => clearInterval(timer);
  }, [autoPlay]);

  const phases = [
    { id: 'PEACE', label: '1. Peacetime Sync', icon: Wifi, iconColor: '#49EACB' },
    { id: 'WARTIME', label: '2. Wartime Fiber Cut', icon: Scissors, iconColor: '#EF4444' },
    { id: 'SPLICE', label: '3. Cable Resplice', icon: GitMerge, iconColor: accent.primary }
  ];

  return (
    <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 sm:p-5 space-y-4">
      {/* Header & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            INVARIANT 04 // INTERACTIVE PARTITION &amp; RESPLICE LAB
          </div>
          <h3 className="font-display text-base sm:text-lg font-bold text-white mt-0.5">
            Wartime Partition, Quorum Cliff &amp; Cable Splice Simulator
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoPlay((p) => !p)}
            className={`px-3 py-1.5 rounded-full border font-mono text-[11px] flex items-center gap-1.5 transition ${
              autoPlay
                ? 'bg-[#152521] border-[#49EACB]/50 text-[#49EACB] font-semibold'
                : 'bg-[#121418] hover:bg-[#181B22] border-white/10 text-neutral-300'
            }`}
          >
            {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-[#49EACB]" />}
            <span>{autoPlay ? 'Auto-Cycling' : 'Auto-Play Cycle'}</span>
          </button>

          {activeAudit?.ticker !== 'KAS' && (
            <button
              type="button"
              onClick={() => setCompareKas((prev) => !prev)}
              className="px-3 py-1.5 rounded-full bg-[#121418] hover:bg-[#181B22] border border-white/10 font-mono text-[11px] text-neutral-200 flex items-center gap-1.5 transition"
            >
              <Columns className="w-3.5 h-3.5 text-[#49EACB]" />
              <span>{compareKas ? 'Side-by-Side vs $KAS' : 'Compare vs $KAS'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Phase Segmented Switcher */}
      <div className="p-1 rounded-2xl sm:rounded-full bg-[#07080A] border border-white/[0.07] grid grid-cols-1 sm:grid-cols-3 gap-1">
        {phases.map((p) => {
          const PIcon = p.icon;
          const isActive = phase === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setAutoPlay(false);
                setPhase(p.id);
              }}
              className={`px-3 py-2 rounded-xl sm:rounded-full font-mono text-xs transition flex items-center justify-center gap-1.5 ${
                isActive
                  ? 'bg-[#151820] text-white font-semibold border border-white/15 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
              }`}
            >
              <PIcon className="w-3.5 h-3.5 shrink-0" style={{ color: p.iconColor }} />
              <span className="truncate">{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Hemisphere Partition Slider + Outage Duration Selector */}
      <div className="rounded-2xl bg-[#07080A] border border-white/[0.07] p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[#49EACB] font-bold">WEST: {westShare}%</span>
            <span className="text-neutral-600">//</span>
            <span className="text-[#FACC15] font-bold">EAST: {eastShare}%</span>
            <span className="hidden sm:inline text-neutral-500 text-[11px]">
              (Hashrate / Stake Split)
            </span>
          </div>

          {/* Outage Duration Pills */}
          <div className="flex items-center gap-1 bg-[#0B0C0E] p-0.5 rounded-full border border-white/[0.07]">
            {DURATION_OPTIONS.map((opt) => {
              const activeDur = durationMins === opt.mins;
              return (
                <button
                  key={opt.mins}
                  type="button"
                  onClick={() => setDurationMins(opt.mins)}
                  className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] transition ${
                    activeDur
                      ? 'bg-[#181C24] text-white font-bold border border-white/15'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Dual-Hemisphere Slider Track */}
        <div className="relative pt-1 pb-0.5">
          <div
            className="w-full h-2.5 rounded-full overflow-hidden flex border border-white/10"
            style={{ backgroundColor: '#121418' }}
          >
            <div
              className="h-full transition-all duration-75"
              style={{
                width: `${westShare}%`,
                background: 'linear-gradient(90deg, #49EACB 0%, #22C55E 100%)'
              }}
            />
            <div
              className="h-full transition-all duration-75"
              style={{
                width: `${eastShare}%`,
                background: 'linear-gradient(90deg, #FACC15 0%, #FB923C 100%)'
              }}
            />
          </div>

          <input
            type="range"
            min={10}
            max={90}
            step={1}
            value={westShare}
            aria-label="Adjust West vs East Hemisphere Hashrate or Stake Split"
            onChange={(e) => setWestShare(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
          />

          {/* Visible Draggable Thumb Handle */}
          <div
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#07080A] shadow-[0_0_12px_rgba(73,234,203,0.85)]"
            style={{ left: `${((westShare - 10) / 80) * 100}%` }}
          />
        </div>

        {/* One-Click Consensus Cliff Presets */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
          {PARTITION_PRESETS.map((pr) => {
            const isPreset = westShare === pr.west;
            return (
              <button
                key={pr.west}
                type="button"
                onClick={() => setWestShare(pr.west)}
                className={`px-2.5 py-1 rounded-full font-mono text-[10px] transition flex items-center gap-1 ${
                  isPreset
                    ? 'bg-[#152420] text-[#49EACB] border border-[#49EACB]/45 font-semibold'
                    : 'bg-[#0B0C0E] hover:bg-[#14171E] text-neutral-400 border border-white/[0.06]'
                }`}
              >
                <span>{pr.label}</span>
                <span className="text-[9px] opacity-65 hidden md:inline">• {pr.tag}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Animated Side-by-Side Canvases */}
      <div className={`grid grid-cols-1 ${showSideBySide ? 'lg:grid-cols-2' : ''} gap-3.5`}>
        <TopologyMeshCanvas
          auditObj={activeAudit}
          phase={phase}
          westShare={westShare}
          durationMins={durationMins}
        />
        {showSideBySide && (
          <TopologyMeshCanvas
            auditObj={kasAudit}
            phase={phase}
            westShare={westShare}
            durationMins={durationMins}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// HIGH-PERFORMANCE SHARED WAVE SCHEDULER & PRECOMPUTED TRIG LUTS
// ============================================================================
function createWaveLut(steps, fA, fB, fC) {
  const cos1 = new Float32Array(steps + 1);
  const sin1 = new Float32Array(steps + 1);
  const sinFA = new Float32Array(steps + 1);
  const cosFA = new Float32Array(steps + 1);
  const cosFB = new Float32Array(steps + 1);
  const sinFB = new Float32Array(steps + 1);
  const sinFC = new Float32Array(steps + 1);
  const cosFC = new Float32Array(steps + 1);

  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    cos1[i] = Math.cos(theta);
    sin1[i] = Math.sin(theta);
    sinFA[i] = Math.sin(fA * theta);
    cosFA[i] = Math.cos(fA * theta);
    cosFB[i] = Math.cos(fB * theta);
    sinFB[i] = Math.sin(fB * theta);
    sinFC[i] = Math.sin(fC * theta);
    cosFC[i] = Math.cos(fC * theta);
  }

  return { steps, cos1, sin1, sinFA, cosFA, cosFB, sinFB, sinFC, cosFC };
}

const MINI_LUT_MAIN = createWaveLut(44, 6, 3, 9);
const MINI_LUT_ECHO = createWaveLut(40, 6, 4, 8);
const MINI_LUT_INNER = createWaveLut(36, 6, 3, 12);

const NUCLEUS_LUT_MAIN = createWaveLut(72, 6, 3, 9);
const NUCLEUS_LUT_ECHO = createWaveLut(64, 6, 4, 8);
const NUCLEUS_LUT_INNER = createWaveLut(56, 6, 3, 12);

const SAT_LUT_MAIN = createWaveLut(48, 5, 3, 8);
const SAT_LUT_ECHO = createWaveLut(44, 5, 4, 7);
const SAT_LUT_INNER = createWaveLut(40, 5, 3, 10);

function buildFastWavePath(lut, cx, cy, baseR, amp, ph, mulB = 0.82, mulC = 1.35) {
  const { steps, cos1, sin1, sinFA, cosFA, cosFB, sinFB, sinFC, cosFC } = lut;
  if (amp <= 0.005) {
    const r = baseR.toFixed(1);
    return `M ${(cx + baseR).toFixed(1)} ${cy.toFixed(1)} A ${r} ${r} 0 1 1 ${(cx - baseR).toFixed(
      1
    )} ${cy.toFixed(1)} A ${r} ${r} 0 1 1 ${(cx + baseR).toFixed(1)} ${cy.toFixed(1)} Z`;
  }

  const cP1 = Math.cos(ph);
  const sP1 = Math.sin(ph);
  const p2 = ph * mulB;
  const cP2 = Math.cos(p2);
  const sP2 = Math.sin(p2);
  const p3 = ph * mulC;
  const cP3 = Math.cos(p3);
  const sP3 = Math.sin(p3);

  const parts = new Array(steps + 2);
  for (let i = 0; i <= steps; i++) {
    const termA = sinFA[i] * cP1 + cosFA[i] * sP1;
    const termB = cosFB[i] * cP2 + sinFB[i] * sP2;
    const termC = sinFC[i] * cP3 + cosFC[i] * sP3;
    const r = baseR + amp * (0.54 * termA + 0.31 * termB + 0.15 * termC);
    const x = ((cx + cos1[i] * r) * 10 | 0) * 0.1;
    const y = ((cy + sin1[i] * r) * 10 | 0) * 0.1;
    parts[i] = i === 0 ? `M${x} ${y}` : `L${x} ${y}`;
  }
  parts[steps + 1] = 'Z';
  return parts.join('');
}

const DEFAULT_MINI_MAIN_D = buildFastWavePath(MINI_LUT_MAIN, 44, 44, 30, 0, 0);
const DEFAULT_MINI_ECHO_D = buildFastWavePath(MINI_LUT_ECHO, 44, 44, 31.8, 0, 0);
const DEFAULT_MINI_INNER_D = buildFastWavePath(MINI_LUT_INNER, 44, 44, 25.5, 0, 0);
const DEFAULT_NUCLEUS_MAIN_D = buildFastWavePath(NUCLEUS_LUT_MAIN, 140, 140, 102, 0, 0);
const DEFAULT_NUCLEUS_ECHO_D = buildFastWavePath(NUCLEUS_LUT_ECHO, 140, 140, 106, 0, 0);
const DEFAULT_NUCLEUS_INNER_D = buildFastWavePath(NUCLEUS_LUT_INNER, 140, 140, 90, 0, 0);
const DEFAULT_SAT_MAIN_D = buildFastWavePath(SAT_LUT_MAIN, 70, 70, 45, 0, 0);
const DEFAULT_SAT_ECHO_D = buildFastWavePath(SAT_LUT_ECHO, 70, 70, 47.5, 0, 0);
const DEFAULT_SAT_INNER_D = buildFastWavePath(SAT_LUT_INNER, 70, 70, 39, 0, 0);

const waveSubscribers = new Set();
let sharedWaveRafId = null;
let sharedWavePaused = false;
let lastSharedFrameMs = 0;

function runSharedWaveLoop(now) {
  if (waveSubscribers.size === 0 || sharedWavePaused || (typeof document !== 'undefined' && document.hidden)) {
    sharedWaveRafId = null;
    return;
  }
  const dt = lastSharedFrameMs ? Math.min(2.2, (now - lastSharedFrameMs) / 16.667) : 1;
  lastSharedFrameMs = now;

  waveSubscribers.forEach((entry) => {
    if (now - entry.lastCall >= entry.minIntervalMs) {
      entry.lastCall = now;
      entry.cb(dt);
    }
  });

  sharedWaveRafId = requestAnimationFrame(runSharedWaveLoop);
}

function ensureSharedWaveLoop() {
  if (
    sharedWaveRafId === null &&
    !sharedWavePaused &&
    waveSubscribers.size > 0 &&
    (typeof document === 'undefined' || !document.hidden)
  ) {
    lastSharedFrameMs = 0;
    sharedWaveRafId = requestAnimationFrame(runSharedWaveLoop);
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && sharedWaveRafId !== null) {
      cancelAnimationFrame(sharedWaveRafId);
      sharedWaveRafId = null;
    } else if (!document.hidden) {
      ensureSharedWaveLoop();
    }
  });
}

function subscribeSharedWave(cb, fps = 30) {
  const entry = { cb, minIntervalMs: 1000 / fps, lastCall: 0 };
  waveSubscribers.add(entry);
  ensureSharedWaveLoop();
  return () => {
    waveSubscribers.delete(entry);
    if (waveSubscribers.size === 0 && sharedWaveRafId !== null) {
      cancelAnimationFrame(sharedWaveRafId);
      sharedWaveRafId = null;
    }
  };
}

function setGlobalWavePaused(paused) {
  sharedWavePaused = paused;
  if (paused && sharedWaveRafId !== null) {
    cancelAnimationFrame(sharedWaveRafId);
    sharedWaveRafId = null;
  } else if (!paused) {
    ensureSharedWaveLoop();
  }
}

// ============================================================================
// HARMONIC PROJECT BUBBLE (MEMOIZED • ZERO SVG FILTER RE-RASTERIZATION)
// ============================================================================
const HarmonicProjectBubble = memo(function HarmonicProjectBubble({
  item,
  isSelected,
  isPinnedItem = false,
  onSelectTicker,
  onTogglePin,
  seedIndex = 0
}) {
  const mainPathRef = useRef(null);
  const echoPathRef = useRef(null);
  const innerPathRef = useRef(null);

  const rawScore = Math.max(0, Math.min(6, Number(item?.totalScore) || 0));
  const isZeroFlat = rawScore === 0;
  const itemAccent = getGradeAccent(item?.grade);
  const isHighlighted = isSelected || isPinnedItem;

  useEffect(() => {
    if (isZeroFlat) return undefined;

    let phase = seedIndex * 0.95;
    const amp = 1.6 + Math.pow(rawScore / 6.0, 1.12) * 5.0;
    const speed = (0.018 + (rawScore / 6.0) * 0.028) * 1.85;

    const renderMini = (ph) => {
      if (mainPathRef.current) {
        mainPathRef.current.setAttribute(
          'd',
          buildFastWavePath(MINI_LUT_MAIN, 44, 44, 30, amp, ph, 0.82, 1.35)
        );
      }
      if (echoPathRef.current) {
        echoPathRef.current.setAttribute(
          'd',
          buildFastWavePath(MINI_LUT_ECHO, 44, 44, 31.8, amp * 0.76, -ph * 0.9, 0.82, 1.35)
        );
      }
      if (innerPathRef.current) {
        innerPathRef.current.setAttribute(
          'd',
          buildFastWavePath(MINI_LUT_INNER, 44, 44, 25.5, amp * 0.44, ph * 1.22, 0.82, 1.35)
        );
      }
    };

    renderMini(phase);
    return subscribeSharedWave((dt) => {
      phase += speed * Math.min(1.5, dt);
      renderMini(phase);
    }, 28);
  }, [rawScore, isZeroFlat, seedIndex]);

  return (
    <div className="group relative inline-flex items-center justify-center">
      {/* Static GPU-Cached Shadow & Glow Backing (eliminates per-frame SVG drop-shadow filter repaints) */}
      <span
        className="pointer-events-none absolute inset-[4px] rounded-full transition-all duration-300 ease-out"
        style={{
          boxShadow: isHighlighted
            ? `0 8px 18px rgba(0,0,0,0.85), 0 0 16px ${itemAccent.glow}`
            : '0 6px 14px rgba(0,0,0,0.68)',
          border: isHighlighted ? `1px solid ${itemAccent.border}` : '1px solid transparent',
          transform: isHighlighted ? 'scale(1.16)' : 'scale(1)'
        }}
      />

      <button
        type="button"
        onClick={() => onSelectTicker(item.ticker)}
        title={`${item.name} ($${item.ticker}) — Grade ${item.grade} (${formatScore(
          item.totalScore
        )}/6.0)`}
        className={`relative w-[68px] h-[68px] rounded-full flex flex-col items-center justify-center text-center cursor-pointer select-none transition-transform duration-300 ease-out focus:outline-none ${
          isHighlighted ? 'scale-110 z-20' : 'opacity-90 hover:opacity-100 group-hover:scale-105 z-10'
        }`}
      >
        <svg
          viewBox="0 0 88 88"
          className="absolute inset-[-10px] w-[calc(100%+20px)] h-[calc(100%+20px)] pointer-events-none"
        >
          <defs>
            <radialGradient id={`projBubbleGrad-${item.ticker}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#121418" />
              <stop offset="70%" stopColor="#121418" />
              <stop
                offset="100%"
                stopColor={itemAccent.secondary}
                stopOpacity={isHighlighted ? '0.3' : isZeroFlat ? '0.08' : '0.18'}
              />
            </radialGradient>
            <linearGradient
              id={`projRingGrad-${item.ticker}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={itemAccent.primary} />
              <stop offset="100%" stopColor={itemAccent.secondary} />
            </linearGradient>
          </defs>

          {isZeroFlat ? (
            <>
              <circle
                cx="44"
                cy="44"
                r="30"
                fill={`url(#projBubbleGrad-${item.ticker})`}
                stroke={`url(#projRingGrad-${item.ticker})`}
                strokeOpacity={isHighlighted ? 0.95 : 0.45}
                strokeWidth={isHighlighted ? '2.1' : '1.4'}
              />
              <circle
                cx="44"
                cy="44"
                r="25.5"
                fill="none"
                stroke={itemAccent.secondary}
                strokeWidth="0.8"
                strokeDasharray="3 3"
                strokeOpacity={isHighlighted ? 0.28 : 0.1}
              />
            </>
          ) : (
            <>
              <path
                ref={echoPathRef}
                d={DEFAULT_MINI_ECHO_D}
                fill="none"
                stroke={itemAccent.secondary}
                strokeWidth="1"
                strokeOpacity={isHighlighted ? 0.52 : 0.3}
              />
              <path
                ref={mainPathRef}
                d={DEFAULT_MINI_MAIN_D}
                fill={`url(#projBubbleGrad-${item.ticker})`}
                stroke={`url(#projRingGrad-${item.ticker})`}
                strokeOpacity={isHighlighted ? 1 : 0.8}
                strokeWidth={isHighlighted ? '2.1' : '1.55'}
              />
              <path
                ref={innerPathRef}
                d={DEFAULT_MINI_INNER_D}
                fill="none"
                stroke={itemAccent.secondary}
                strokeWidth="0.85"
                strokeDasharray="3 3"
                strokeOpacity={isHighlighted ? 0.32 : 0.18}
              />
            </>
          )}
        </svg>

        <div className="relative z-10 flex flex-col items-center justify-center leading-none">
          <span
            className={`font-mono text-[10px] tracking-tight transition-colors duration-300 ${
              isHighlighted ? 'text-white font-bold' : 'text-neutral-200 font-semibold'
            }`}
          >
            {item.ticker}
          </span>
          <span
            className="font-display text-sm font-bold mt-0.5 color-glide"
            style={{ color: itemAccent.primary }}
          >
            {item.grade}
          </span>
          <span className="font-mono text-[8.5px] text-neutral-400 mt-0.5 transition-colors duration-300">
            {formatScore(item.totalScore)}
          </span>
        </div>
      </button>

      {onTogglePin && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(item.ticker);
          }}
          title={
            isPinnedItem
              ? `Unpin $${item.ticker} from comparison`
              : `Pin $${item.ticker} to compare (up to 4)`
          }
          className={`color-glide absolute -top-1 -right-1 z-30 w-5 h-5 rounded-full flex items-center justify-center border ${
            isPinnedItem
              ? 'opacity-100 scale-100 shadow-md'
              : 'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 bg-[#121418]/95 border-white/15 text-neutral-400 hover:text-white'
          }`}
          style={
            isPinnedItem
              ? {
                  backgroundColor: '#121418',
                  color: itemAccent.primary,
                  borderColor: itemAccent.primary,
                  boxShadow: `0 0 10px ${itemAccent.glow}`
                }
              : undefined
          }
        >
          <Pin className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
});

// ============================================================================
// MULTI-BUBBLE GEOMETRIC CONSTELLATION LAYOUT & PINNED ORBITAL NODE
// ============================================================================
function getConstellationLayout(count, threeMode = 'TRIANGLE', fourMode = 'RHOMBUS') {
  if (count === 2) {
    return {
      width: 940,
      height: 420,
      nodeScale: 0.86,
      positions: [
        { x: 250, y: 210 },
        { x: 690, y: 210 }
      ],
      edges: [[0, 1]],
      diagonals: []
    };
  }

  if (count === 3) {
    if (threeMode === 'SIDE_BY_SIDE') {
      return {
        width: 1120,
        height: 380,
        nodeScale: 0.73,
        positions: [
          { x: 195, y: 190 },
          { x: 560, y: 190 },
          { x: 925, y: 190 }
        ],
        edges: [
          [0, 1],
          [1, 2]
        ],
        diagonals: []
      };
    }
    return {
      width: 960,
      height: 680,
      nodeScale: 0.75,
      positions: [
        { x: 480, y: 175 },
        { x: 245, y: 505 },
        { x: 715, y: 505 }
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 0]
      ],
      diagonals: []
    };
  }

  // count === 4
  if (fourMode === 'SQUARE') {
    return {
      width: 960,
      height: 720,
      nodeScale: 0.74,
      positions: [
        { x: 285, y: 185 },
        { x: 675, y: 185 },
        { x: 285, y: 535 },
        { x: 675, y: 535 }
      ],
      edges: [
        [0, 1],
        [1, 3],
        [3, 2],
        [2, 0]
      ],
      diagonals: [
        [0, 3],
        [1, 2]
      ]
    };
  }

  if (fourMode === 'SIDE_BY_SIDE') {
    return {
      width: 1180,
      height: 336,
      nodeScale: 0.59,
      positions: [
        { x: 155, y: 168 },
        { x: 445, y: 168 },
        { x: 735, y: 168 },
        { x: 1025, y: 168 }
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3]
      ],
      diagonals: []
    };
  }

  // Default 4-bubble formation: RHOMBUS (Diamond 1 - 2 - 1)
  return {
    width: 1040,
    height: 770,
    nodeScale: 0.7,
    positions: [
      { x: 520, y: 162 },
      { x: 210, y: 385 },
      { x: 830, y: 385 },
      { x: 520, y: 608 }
    ],
    edges: [
      [0, 1],
      [1, 3],
      [3, 2],
      [2, 0]
    ],
    diagonals: [
      [0, 3],
      [1, 2]
    ]
  };
}

function PinnedOrbitalNode({
  auditObj,
  x,
  y,
  nodeScale,
  isFocused,
  isExiting = false,
  expandOrbits,
  hoveredInvId,
  onHoverInv,
  onFocusBubble,
  onUnpin,
  onOpenInvariantModal,
  seedOffset = 0
}) {
  const [localHovered, setLocalHovered] = useState(false);
  const mainWaveRef = useRef(null);
  const echoWaveRef = useRef(null);
  const innerWaveRef = useRef(null);
  const waveStateRef = useRef({ phase: seedOffset * 1.3, amp: 0 });

  const satMainRefs = useRef([]);
  const satEchoRefs = useRef([]);
  const satInnerRefs = useRef([]);
  const satStatesRef = useRef(
    Array.from({ length: 6 }, (_, i) => ({ phase: seedOffset + i * 1.05, amp: 0 }))
  );

  const nodeAccent = getGradeAccent(auditObj.grade);
  const isSplit = expandOrbits || localHovered || Boolean(hoveredInvId);
  const stageSize = 440;
  const centerCoord = 220;
  const orbitRadius = 152;

  useEffect(() => {
    const rawScore = Math.max(0, Math.min(6, Number(auditObj?.totalScore) || 0));
    const isZeroFlat = rawScore === 0;

    const targetCenterAmp =
      isSplit || isZeroFlat ? 0 : 3.5 + Math.pow(rawScore / 6.0, 1.12) * 14.5;

    const invList = auditObj?.invariants || [];
    const targetSatAmps = Array.from({ length: 6 }, (_, idx) => {
      const invScore = Math.max(0, Math.min(1, Number(invList[idx]?.score) || 0));
      if (!isSplit || invScore <= 0) return 0;
      return 1.8 + Math.pow(invScore, 1.12) * 6.8;
    });

    const stepWaves = (dt = 1) => {
      let active = false;
      const st = waveStateRef.current;
      st.amp += (targetCenterAmp - st.amp) * 0.16;
      if (Math.abs(targetCenterAmp - st.amp) < 0.04) st.amp = targetCenterAmp;

      const centerSpeed = (0.018 + (rawScore / 6.0) * 0.028) * 1.35 * Math.min(1.6, dt);
      if (st.amp > 0.01) st.phase += centerSpeed;

      if (mainWaveRef.current) {
        mainWaveRef.current.setAttribute(
          'd',
          buildFastWavePath(NUCLEUS_LUT_MAIN, 140, 140, 102, st.amp, st.phase, 0.82, 1.35)
        );
      }
      if (echoWaveRef.current) {
        echoWaveRef.current.setAttribute(
          'd',
          buildFastWavePath(NUCLEUS_LUT_ECHO, 140, 140, 106, st.amp * 0.78, -st.phase * 0.9, 0.82, 1.35)
        );
      }
      if (innerWaveRef.current) {
        innerWaveRef.current.setAttribute(
          'd',
          buildFastWavePath(NUCLEUS_LUT_INNER, 140, 140, 90, st.amp * 0.45, st.phase * 1.25, 0.82, 1.35)
        );
      }

      if (st.amp > 0.01 || Math.abs(targetCenterAmp - st.amp) > 0.01) active = true;

      for (let idx = 0; idx < 6; idx++) {
        const satSt = satStatesRef.current[idx];
        const tAmp = targetSatAmps[idx];
        const invScore = Math.max(0, Math.min(1, Number(invList[idx]?.score) || 0));

        satSt.amp += (tAmp - satSt.amp) * 0.16;
        if (Math.abs(tAmp - satSt.amp) < 0.03) satSt.amp = tAmp;

        const satSpeed = (0.02 + invScore * 0.032) * 1.35 * Math.min(1.6, dt);
        if (satSt.amp > 0.01) satSt.phase += satSpeed;

        if (satMainRefs.current[idx]) {
          satMainRefs.current[idx].setAttribute(
            'd',
            buildFastWavePath(SAT_LUT_MAIN, 70, 70, 45, satSt.amp, satSt.phase, 0.82, 1.35)
          );
        }
        if (satEchoRefs.current[idx]) {
          satEchoRefs.current[idx].setAttribute(
            'd',
            buildFastWavePath(SAT_LUT_ECHO, 70, 70, 47.5, satSt.amp * 0.76, -satSt.phase * 0.88, 0.82, 1.35)
          );
        }
        if (satInnerRefs.current[idx]) {
          satInnerRefs.current[idx].setAttribute(
            'd',
            buildFastWavePath(SAT_LUT_INNER, 70, 70, 39, satSt.amp * 0.44, satSt.phase * 1.22, 0.82, 1.35)
          );
        }

        if (satSt.amp > 0.01 || Math.abs(tAmp - satSt.amp) > 0.01) active = true;
      }

      return active;
    };

    if (!stepWaves(1)) return undefined;
    let unsub = null;
    unsub = subscribeSharedWave((dt) => {
      if (!stepWaves(dt) && unsub) {
        unsub();
        unsub = null;
      }
    }, 42);

    return () => {
      if (unsub) unsub();
    };
  }, [auditObj, isSplit]);

  return (
    <div
      onMouseEnter={() => {
        if (!isExiting) setLocalHovered(true);
      }}
      onMouseLeave={() => {
        setLocalHovered(false);
        if (!isExiting) onHoverInv(null);
      }}
      className={`absolute flex items-center justify-center select-none ${
        isExiting ? 'pointer-events-none' : ''
      }`}
      style={{
        width: `${stageSize}px`,
        height: `${stageSize}px`,
        left: `${x - centerCoord}px`,
        top: `${y - centerCoord}px`,
        transform: `scale(${isExiting ? nodeScale * 0.76 : nodeScale})`,
        opacity: isExiting ? 0 : isFocused || localHovered ? 1 : 0.88,
        transformOrigin: 'center center',
        zIndex: isExiting ? 12 : localHovered ? 35 : isFocused ? 25 : 20,
        transition:
          'left 520ms cubic-bezier(0.20, 1.22, 0.32, 1), top 520ms cubic-bezier(0.20, 1.22, 0.32, 1), transform 460ms cubic-bezier(0.20, 1.22, 0.32, 1), opacity 340ms ease'
      }}
    >
      <div className="animate-pin-enter relative w-full h-full flex items-center justify-center">
        {/* SVG Radial Tether Mesh */}
        <svg
          width={stageSize}
          height={stageSize}
          viewBox={`0 0 ${stageSize} ${stageSize}`}
          className="absolute inset-0 pointer-events-none"
        >
          <circle
            cx={centerCoord}
            cy={centerCoord}
            r={isSplit ? orbitRadius : 76}
            fill="none"
            stroke={nodeAccent.primary}
            strokeOpacity={isSplit ? 0.16 : 0.06}
            strokeDasharray="3 6"
            style={{ transition: 'all 460ms cubic-bezier(0.20, 1.22, 0.32, 1)' }}
          />

          {auditObj.invariants.map((inv, idx) => {
            const rad = (ORBIT_ANGLES_DEG[idx] * Math.PI) / 180;
            const targetX = centerCoord + (isSplit ? Math.cos(rad) * orbitRadius : 0);
            const targetY = centerCoord + (isSplit ? Math.sin(rad) * orbitRadius : 0);
            const invStyle = getHarmonizedScoreStyle(inv.score, nodeAccent);
            const isHighlighted = hoveredInvId === inv.id;

            return (
              <line
                key={inv.id}
                x1={centerCoord}
                y1={centerCoord}
                x2={targetX}
                y2={targetY}
                stroke={isHighlighted ? invStyle.color : nodeAccent.primary}
                strokeWidth={isHighlighted ? 2.4 : 1.15}
                strokeOpacity={isSplit ? (isHighlighted ? 0.95 : 0.28) : 0}
                style={{
                  transition:
                    'x2 460ms cubic-bezier(0.20, 1.22, 0.32, 1), y2 460ms cubic-bezier(0.20, 1.22, 0.32, 1), stroke 420ms ease, stroke-opacity 260ms ease'
                }}
              />
            );
          })}
        </svg>

        {/* 6 Radial Invariant Satellite Bubbles */}
        {auditObj.invariants.map((inv, idx) => {
          const rad = (ORBIT_ANGLES_DEG[idx] * Math.PI) / 180;
          const dx = isSplit ? Math.cos(rad) * orbitRadius : 0;
          const dy = isSplit ? Math.sin(rad) * orbitRadius : 0;
          const invStyle = getHarmonizedScoreStyle(inv.score, nodeAccent);
          const isHovered = hoveredInvId === inv.id;
          const hasEnergy = Number(inv.score) > 0;
          const idPrefix = isExiting ? `ghost-${auditObj.ticker}` : auditObj.ticker;
          const satGradId = `pinSatGrad-${idPrefix}-${inv.id}`;

          return (
            <button
              key={inv.id}
              type="button"
              onMouseEnter={() => onHoverInv(inv.id)}
              onFocus={() => onHoverInv(inv.id)}
              onClick={(e) => {
                e.stopPropagation();
                onOpenInvariantModal(inv.id);
              }}
              aria-label={`$${auditObj.ticker} ${inv.id} ${inv.title}`}
              className="spring-orbit absolute w-[92px] h-[92px] rounded-full bg-transparent overflow-visible flex flex-col items-center justify-center text-center px-1.5 cursor-pointer focus:outline-none"
              style={{
                left: `${centerCoord - 46}px`,
                top: `${centerCoord - 46}px`,
                transform: `translate(${dx}px, ${dy}px) scale(${
                  isSplit ? (isHovered ? 1.15 : 1) : 0.35
                })`,
                opacity: isSplit ? 1 : 0,
                pointerEvents: isSplit && !isExiting ? 'auto' : 'none',
                zIndex: isHovered ? 32 : 20
              }}
            >
              {/* Static GPU Shadow Backing */}
              <span
                className="pointer-events-none absolute inset-[8px] rounded-full transition-shadow duration-300"
                style={{
                  boxShadow: isHovered
                    ? `0 12px 26px rgba(0,0,0,0.88), 0 0 20px ${invStyle.color}66`
                    : `0 8px 20px rgba(0,0,0,0.72), 0 0 10px ${invStyle.bg}`
                }}
              />

              <svg
                viewBox="0 0 140 140"
                className="absolute inset-[-24px] w-[calc(100%+48px)] h-[calc(100%+48px)] pointer-events-none"
              >
                <defs>
                  <radialGradient id={satGradId} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#121418" />
                    <stop offset="70%" stopColor="#121418" />
                    <stop
                      offset="100%"
                      stopColor={invStyle.color}
                      stopOpacity={isHovered ? '0.32' : hasEnergy ? '0.18' : '0.08'}
                    />
                  </radialGradient>
                </defs>

                <path
                  ref={(el) => {
                    satEchoRefs.current[idx] = el;
                  }}
                  d={DEFAULT_SAT_ECHO_D}
                  fill="none"
                  stroke={nodeAccent.secondary}
                  strokeWidth="1.05"
                  strokeOpacity={isSplit && hasEnergy ? (isHovered ? 0.58 : 0.34) : 0}
                />

                <path
                  ref={(el) => {
                    satMainRefs.current[idx] = el;
                  }}
                  d={DEFAULT_SAT_MAIN_D}
                  fill={`url(#${satGradId})`}
                  stroke={invStyle.color}
                  strokeOpacity={isHovered ? 1 : hasEnergy ? 0.92 : 0.5}
                  strokeWidth={isHovered ? '2.3' : '1.65'}
                />

                <path
                  ref={(el) => {
                    satInnerRefs.current[idx] = el;
                  }}
                  d={DEFAULT_SAT_INNER_D}
                  fill="none"
                  stroke={nodeAccent.secondary}
                  strokeWidth="0.85"
                  strokeDasharray="3 3"
                  strokeOpacity={isSplit && hasEnergy ? 0.25 : 0.09}
                />
              </svg>

              <div className="relative z-10 flex flex-col items-center justify-center">
                <span className="font-mono text-[10px] tracking-widest text-neutral-400">
                  {inv.id}
                </span>
                <span className="text-[11px] font-medium text-neutral-100 leading-tight line-clamp-1 mt-0.5">
                  {inv.shortName}
                </span>
                <span
                  className="color-glide font-mono text-[11px] font-bold mt-1 px-1.5 py-0.5 rounded-full"
                  style={{
                    color: invStyle.color,
                    backgroundColor: invStyle.bg
                  }}
                >
                  {formatScore(inv.score)}/1.0
                </span>
              </div>
            </button>
          );
        })}

        {/* Central Grade Nucleus Sphere */}
        <div
          className="spring-orbit relative z-[25] flex items-center justify-center"
          style={{
            width: isSplit ? '150px' : '212px',
            height: isSplit ? '150px' : '212px',
            transition:
              'width 420ms cubic-bezier(0.20, 1.22, 0.32, 1), height 420ms cubic-bezier(0.20, 1.22, 0.32, 1)'
          }}
        >
          {/* Static GPU Shadow & Glow Backing */}
          <span
            className="pointer-events-none absolute inset-[6px] rounded-full transition-shadow duration-500"
            style={{
              boxShadow: `0 18px 36px rgba(0,0,0,0.84), 0 0 ${
                isFocused ? '34px' : '20px'
              } ${nodeAccent.glow}`
            }}
          />

          {/* Soft Focus Halo Ring When This Pinned Bubble Is Active */}
          <span
            className="pointer-events-none absolute inset-[-10px] rounded-full transition-all duration-500 ease-out"
            style={{
              opacity: isFocused ? 0.85 : 0,
              transform: isFocused ? 'scale(1)' : 'scale(0.9)',
              border: `1px dashed ${nodeAccent.border}`
            }}
          />

          <button
            type="button"
            onClick={onFocusBubble}
            aria-label={`Focus $${auditObj.ticker}`}
            className="relative w-full h-full rounded-full bg-transparent overflow-visible flex flex-col items-center justify-center text-center cursor-pointer focus:outline-none"
          >
            <svg
              viewBox="0 0 280 280"
              className="absolute inset-[-34px] w-[calc(100%+68px)] h-[calc(100%+68px)] pointer-events-none"
            >
              <defs>
                <radialGradient
                  id={`pinNucleusGrad-${isExiting ? 'ghost-' : ''}${auditObj.ticker}`}
                  cx="50%"
                  cy="50%"
                  r="50%"
                >
                  <stop offset="0%" stopColor="#121418" />
                  <stop offset="72%" stopColor="#121418" />
                  <stop
                    offset="100%"
                    stopColor={nodeAccent.secondary}
                    stopOpacity={isFocused ? '0.28' : '0.18'}
                  />
                </radialGradient>
                <linearGradient
                  id={`pinRingGrad-${isExiting ? 'ghost-' : ''}${auditObj.ticker}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={nodeAccent.primary} />
                  <stop offset="100%" stopColor={nodeAccent.secondary} />
                </linearGradient>
              </defs>

              <path
                ref={echoWaveRef}
                d={DEFAULT_NUCLEUS_ECHO_D}
                fill="none"
                stroke={nodeAccent.secondary}
                strokeWidth="1.2"
                strokeOpacity={!isSplit && Number(auditObj.totalScore) > 0 ? 0.38 : 0}
              />

              <path
                ref={mainWaveRef}
                d={DEFAULT_NUCLEUS_MAIN_D}
                fill={`url(#pinNucleusGrad-${isExiting ? 'ghost-' : ''}${auditObj.ticker})`}
                stroke={`url(#pinRingGrad-${isExiting ? 'ghost-' : ''}${auditObj.ticker})`}
                strokeWidth={isFocused ? '2.7' : '2.1'}
              />

              <path
                ref={innerWaveRef}
                d={DEFAULT_NUCLEUS_INNER_D}
                fill="none"
                stroke={nodeAccent.secondary}
                strokeWidth="1"
                strokeDasharray="4 4"
                strokeOpacity={!isSplit && Number(auditObj.totalScore) > 0 ? 0.24 : 0.1}
              />
            </svg>

            <div className="relative z-10 flex flex-col items-center justify-center px-3">
              <div className="flex items-center justify-center gap-1.5 font-mono text-xs uppercase tracking-[0.16em] text-neutral-200">
                <span className="font-bold mr-[-0.16em]">${auditObj.ticker}</span>
                <Pin className="w-3 h-3 color-glide" style={{ color: nodeAccent.secondary }} />
              </div>

              <div
                className={`color-glide font-display font-bold leading-none tracking-tight my-1.5 px-1 ${
                  isSplit ? 'text-5xl' : 'text-7xl'
                }`}
                style={{
                  backgroundImage: nodeAccent.gradientCss,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: nodeAccent.primary
                }}
              >
                {auditObj.grade}
              </div>

              <div className="font-mono text-xs text-neutral-300 font-semibold">
                {formatScore(auditObj.totalScore)}{' '}
                <span className="text-neutral-500">/ 6.0</span>
              </div>

              {!isSplit && (
                <div className="mt-2.5 px-2.5 py-0.5 rounded-full bg-white/[0.035] border border-white/[0.08] font-mono text-[10px] text-neutral-400 max-w-[144px] truncate transition-opacity duration-300">
                  {auditObj.name}
                </div>
              )}
            </div>
          </button>

          {/* Unpin Button on Top-Right of Nucleus */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUnpin();
            }}
            title={`Unpin $${auditObj.ticker}`}
            className="color-glide absolute -top-1.5 -right-1.5 z-30 w-7 h-7 rounded-full bg-[#121418] hover:bg-[#1E222B] border border-white/20 flex items-center justify-center text-neutral-300 hover:text-white shadow-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EMPIRICAL MARKET GAINS DIVERGENCE DATA & LIVE GAINS CHART ENGINE
// ============================================================================
const PASSED_COHORT_GAINS = [
  {
    ticker: 'KAS',
    name: 'Kaspa',
    grade: 'A+',
    auditScore: 6.0,
    baselineLabel: '$0.0001859',
    basePrice: 0.0001859,
    snapshotSpot: 0.042,
    tactical90dPct: 11.2,
    liquidCycle: true,
    isOutlier: true,
    coinbasePair: null,
    geckoId: 'kaspa',
    note: 'Massive right-tail convexity driver • 0 VC overhang • Flipped 200 EMA vs BTC'
  },
  {
    ticker: 'ZEC',
    name: 'Zcash',
    grade: 'D-',
    auditScore: 1.4,
    baselineLabel: '~$92.00',
    basePrice: 92.0,
    snapshotSpot: 1050.0,
    tactical90dPct: 144.7,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'ZEC-USD',
    geckoId: 'zcash',
    note: 'High-beta PoW privacy squeeze • #1 90-day performer in E > 0 cohort'
  },
  {
    ticker: 'XMR',
    name: 'Monero',
    grade: 'C+',
    auditScore: 3.5,
    baselineLabel: '~$195.00',
    basePrice: 195.0,
    snapshotSpot: 589.7,
    tactical90dPct: 51.5,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: 'monero',
    note: 'Steady RandomX PoW privacy compounding • 0 premine tail-emission floor'
  },
  {
    ticker: 'BTC',
    name: 'Bitcoin',
    grade: 'B+',
    auditScore: 4.4,
    baselineLabel: '$29,455.76',
    basePrice: 29455.76,
    snapshotSpot: 75835.0,
    tactical90dPct: 17.1,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'BTC-USD',
    geckoId: 'bitcoin',
    note: 'Unshakeable M0 SHA-256d thermodynamic reserve anchor'
  },
  {
    ticker: 'XAG',
    name: 'Physical Silver',
    grade: 'C+',
    auditScore: 3.65,
    baselineLabel: '$21.50',
    basePrice: 21.5,
    snapshotSpot: 48.0,
    tactical90dPct: 22.8,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    note: 'Zero-default supernova commodity floor • Industrial + monetary breakout'
  },
  {
    ticker: 'XAU',
    name: 'Physical Gold',
    grade: 'B',
    auditScore: 4.1,
    baselineLabel: '$1,837.00',
    basePrice: 1837.0,
    snapshotSpot: 4055.0,
    tactical90dPct: 18.4,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'PAXG-USD',
    geckoId: 'pax-gold',
    note: 'Zero-default r-process physical commodity floor • Crushed ETH & most PoS'
  },
  {
    ticker: 'QUAI',
    name: 'Quai Network',
    grade: 'D+',
    auditScore: 2.05,
    baselineLabel: '$0.0620 (Open)',
    basePrice: 0.062,
    snapshotSpot: 0.108,
    tactical90dPct: 19.4,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: 'quai-network',
    note: 'PoEM + SOAP merge-mining buyback/burn (246.6M QUAI burned)'
  },
  {
    ticker: 'GEEK',
    name: 'Geek Protocol',
    grade: 'C-',
    auditScore: 2.55,
    baselineLabel: 'KRC-20 Mint Floor',
    basePrice: 0.0000075,
    snapshotSpot: 0.0000128,
    tactical90dPct: 18.5,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    note: '0-premint KRC-20 fair-mint carrier cost floor • Zero VC cliff unlocks'
  },
  {
    ticker: 'ERG',
    name: 'Ergo',
    grade: 'D+',
    auditScore: 2.0,
    baselineLabel: '$0.80 (Cycle Base)',
    basePrice: 0.8,
    snapshotSpot: 1.1,
    tactical90dPct: 21.6,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: 'ergo',
    note: 'Autolykos PoW eUTXO • Slower linear velocity, but zero VC wipeout'
  },
  {
    ticker: 'BCH',
    name: 'Bitcoin Cash',
    grade: 'C+',
    auditScore: 3.63,
    baselineLabel: '$181.48',
    basePrice: 181.48,
    snapshotSpot: 245.0,
    tactical90dPct: 12.2,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'BCH-USD',
    geckoId: 'bitcoin-cash',
    note: 'Legacy SHA-256d PoW + Layla CashVM covenants • Positive cycle hold'
  },
  {
    ticker: 'RVN',
    name: 'Ravencoin',
    grade: 'B+',
    auditScore: 4.45,
    baselineLabel: '$0.0190',
    basePrice: 0.019,
    snapshotSpot: 0.015,
    tactical90dPct: 25.7,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: 'ravencoin',
    note: 'Fair-launch KawPoW lags BlockDAG velocity, but zero insider cliff dump'
  },
  {
    ticker: 'LTC',
    name: 'Litecoin',
    grade: 'B',
    auditScore: 4.17,
    baselineLabel: '$64.00',
    basePrice: 64.0,
    snapshotSpot: 50.0,
    tactical90dPct: 11.3,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'LTC-USD',
    geckoId: 'litecoin',
    note: 'Legacy 150s Scrypt PoW lags, yet avoids -70% PoS treasury liquidation'
  },
  {
    ticker: 'LN',
    name: 'Lightning Network',
    grade: 'C-',
    auditScore: 2.35,
    baselineLabel: 'Native BTC Rail',
    basePrice: null,
    snapshotSpot: null,
    tactical90dPct: null,
    liquidCycle: false,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    note: '0-token Bitcoin payment-channel mesh (tracks native BTC +157.5%)'
  },
  {
    ticker: 'IGRA',
    name: 'Igra Network',
    grade: 'D+',
    auditScore: 2.3,
    baselineLabel: 'Kaspa L1 Rollup',
    basePrice: null,
    snapshotSpot: null,
    tactical90dPct: null,
    liquidCycle: false,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    note: 'Kaspa L1-sequenced Based EVM execution rail (viaduct + reth)'
  }
];

const FAILED_COHORT_GAINS = [
  {
    ticker: 'TAO',
    name: 'Bittensor',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '~$50.00 (2023 Open)',
    basePrice: 50.0,
    snapshotSpot: 420.0,
    tactical90dPct: 8.5,
    liquidCycle: true,
    isOutlier: true,
    coinbasePair: 'TAO-USD',
    geckoId: 'bittensor',
    note: 'Only major multi-X outlier in the E = 0 basket • Lagged BTC over 90D (+8.5%)'
  },
  {
    ticker: 'XRP',
    name: 'XRP Ledger',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$0.42',
    basePrice: 0.42,
    snapshotSpot: 1.16,
    tactical90dPct: 10.2,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'XRP-USD',
    geckoId: 'ripple',
    note: 'Outperformed ETH, but lagged KAS (225.9x) & continuous Ripple escrow sales'
  },
  {
    ticker: 'SOL',
    name: 'Solana',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$45.80',
    basePrice: 45.8,
    snapshotSpot: 89.57,
    tactical90dPct: 14.1,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'SOL-USD',
    geckoId: 'solana',
    note: 'Outperformed ETH, but trailed BTC (+157.5%), Gold (+120.7%), XMR & KAS'
  },
  {
    ticker: 'QNT',
    name: 'Quant',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$68.00',
    basePrice: 68.0,
    snapshotSpot: 92.0,
    tactical90dPct: 236.0,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'QNT-USD',
    geckoId: 'quant-network',
    note: 'Localized 90D short squeeze (+236%); failed to beat Gold or BTC over cycle'
  },
  {
    ticker: 'STX',
    name: 'Stacks',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$0.55',
    basePrice: 0.55,
    snapshotSpot: 0.72,
    tactical90dPct: 143.6,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'STX-USD',
    geckoId: 'blockstack',
    note: '90D relief bounce (+143.6%) after SIP-031 500M print; +30.9% over 4.5 yrs'
  },
  {
    ticker: 'ETH',
    name: 'Ethereum',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$1,940.00',
    basePrice: 1940.0,
    snapshotSpot: 2231.5,
    tactical90dPct: 13.9,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'ETH-USD',
    geckoId: 'ethereum',
    note: 'Post-Merge 0-Joule PoS (+15.0% in 4.5 yrs) failed to beat Gold or Bitcoin'
  },
  {
    ticker: 'XLM',
    name: 'Stellar',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$0.14',
    basePrice: 0.14,
    snapshotSpot: 0.1504,
    tactical90dPct: -9.2,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'XLM-USD',
    geckoId: 'stellar',
    note: 'Flat nominal performance (+7.4%) over 4.5 years; -9.2% over 90 days'
  },
  {
    ticker: 'NEAR',
    name: 'NEAR Protocol',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$5.90',
    basePrice: 5.9,
    snapshotSpot: 3.85,
    tactical90dPct: 124.1,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'NEAR-USD',
    geckoId: 'near',
    note: '90D squeeze (+124.1%) rolling over vs BTC; -34.7% full-cycle staking dilution'
  },
  {
    ticker: 'SUI',
    name: 'Sui',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '~$1.40 (May 2023)',
    basePrice: 1.4,
    snapshotSpot: 0.8503,
    tactical90dPct: 20.2,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'SUI-USD',
    geckoId: 'sui',
    note: 'Heavy Mysten/VC cliff unlocks crushed early mainnet buyers (-39.3%)'
  },
  {
    ticker: 'ICP',
    name: 'Internet Computer',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$8.50',
    basePrice: 8.5,
    snapshotSpot: 4.8,
    tactical90dPct: 1.8,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'ICP-USD',
    geckoId: 'internet-computer',
    note: '-43.5% since mid-2022 (-99% since 2021 VC genesis launch)'
  },
  {
    ticker: 'AVAX',
    name: 'Avalanche',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$27.00',
    basePrice: 27.0,
    snapshotSpot: 8.2,
    tactical90dPct: 23.5,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'AVAX-USD',
    geckoId: 'avalanche-2',
    note: 'Unvested P-Chain insider staking yield & unlock bleed (-69.6%)'
  },
  {
    ticker: 'ADA',
    name: 'Cardano',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$0.62',
    basePrice: 0.62,
    snapshotSpot: 0.1804,
    tactical90dPct: -8.5,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'ADA-USD',
    geckoId: 'cardano',
    note: 'Continuous epoch reserve drip & premined whale dilution (-70.9%)'
  },
  {
    ticker: 'ALGO',
    name: 'Algorand',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$0.41',
    basePrice: 0.41,
    snapshotSpot: 0.11,
    tactical90dPct: 10.6,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'ALGO-USD',
    geckoId: 'algorand',
    note: 'Total thermodynamic liquidation against BTC (-73.2%)'
  }
];

// Normalized trajectory multipliers (1.00 = Initial Equal-Weight Capital at May 31, 2022)
const MACRO_CYCLE_TRAJECTORY = [
  { label: "May '22", event: 'Post-LUNA Baseline', passAll: 1.0, passEx: 1.0, failAll: 1.0, failEx: 1.0 },
  { label: "Sep '22", event: 'ETH Merge (E->0)', passAll: 1.48, passEx: 0.94, failAll: 0.86, failEx: 0.84 },
  { label: "Nov '22", event: 'FTX Contagion Low', passAll: 3.15, passEx: 0.89, failAll: 0.58, failEx: 0.54 },
  { label: "May '23", event: 'SUI Mainnet / ASIC Era', passAll: 8.6, passEx: 1.08, failAll: 0.74, failEx: 0.66 },
  { label: "Nov '23", event: 'KAS Breakout', passAll: 26.4, passEx: 1.24, failAll: 0.98, failEx: 0.74 },
  { label: "Mar '24", event: 'BTC Halving Peak', passAll: 31.8, passEx: 1.62, failAll: 1.54, failEx: 1.06 },
  { label: "Nov '24", event: 'KRC-20 Stress Test', passAll: 27.5, passEx: 1.78, failAll: 1.48, failEx: 0.99 },
  { label: "May '25", event: 'Crescendo 10 BPS Live', passAll: 22.9, passEx: 2.12, failAll: 1.42, failEx: 0.93 },
  { label: "Nov '26", event: 'Toccata + Hard-Money Surge', passAll: 21.15, passEx: 2.654, failAll: 1.594, failEx: 0.883 }
];

// 90-Day Tactical trajectory multipliers (1.00 = Aug 15, 2026 Baseline)
const TACTICAL_90D_TRAJECTORY = [
  { label: 'Aug 15', event: '90D Window Open', passAll: 1.0, passMed: 1.0, failAll: 1.0, failMed: 1.0 },
  { label: 'Aug 31', event: 'Late-Summer Chop', passAll: 1.04, passMed: 1.03, failAll: 0.98, failMed: 0.97 },
  { label: 'Sep 15', event: 'Gold & BTC Bid', passAll: 1.09, passMed: 1.07, failAll: 1.03, failMed: 1.01 },
  { label: 'Sep 30', event: 'Privacy PoW Breakout', passAll: 1.16, passMed: 1.11, failAll: 1.12, failMed: 1.05 },
  { label: 'Oct 15', event: 'QNT/STX Short Squeeze', passAll: 1.22, passMed: 1.14, failAll: 1.29, failMed: 1.09 },
  { label: 'Oct 31', event: 'ZEC + XMR Acceleration', passAll: 1.27, passMed: 1.17, failAll: 1.45, failMed: 1.15 },
  { label: 'Nov 14', event: 'KAS 200-EMA Flip • NEAR Roll', passAll: 1.312, passMed: 1.19, failAll: 1.427, failMed: 1.139 }
];

function formatUsdPrice(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return '—';
  if (n >= 1000) {
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  if (n >= 1) {
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (n >= 0.01) {
    return `$${n.toFixed(4)}`;
  }
  return `$${n.toFixed(7).replace(/0+$/, '').replace(/\.$/, '')}`;
}

function formatBasketUsd(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  }
  if (abs >= 10_000) {
    return `${sign}$${(abs / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

function formatPctSigned(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return '—';
  const sign = n >= 0 ? '+' : '';
  if (Math.abs(n) >= 1000) {
    return `${sign}${Math.round(n).toLocaleString()}%`;
  }
  return `${sign}${n.toFixed(1)}%`;
}

function computeMedian(nums) {
  if (!nums || nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function ThermodynamicGainsModal({
  onClose,
  auditsMap,
  onSelectOrAuditTicker,
  onCopyReport,
  copiedTarget
}) {
  const [horizon, setHorizon] = useState('CYCLE'); // 'CYCLE' | 'EX_OUTLIER' | 'TACTICAL_90D'
  const [allocPerAsset, setAllocPerAsset] = useState(1000);
  const [useLogScale, setUseLogScale] = useState(true);
  const [feedMode, setFeedMode] = useState('SNAPSHOT'); // 'SNAPSHOT' | 'LIVE'
  const [liveSpots, setLiveSpots] = useState({});
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [lastLiveSyncLabel, setLastLiveSyncLabel] = useState(null);
  const [hoverPointIdx, setHoverPointIdx] = useState(null);

  const chartBoxRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(860);

  useEffect(() => {
    const el = chartBoxRef.current;
    if (!el) return undefined;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 240) setChartWidth(Math.floor(w));
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const syncLiveExchangeSpots = useCallback(async () => {
    setIsSyncingLive(true);
    const nextSpots = {};
    const allItems = [...PASSED_COHORT_GAINS, ...FAILED_COHORT_GAINS];

    try {
      // 1. Pull Coinbase public spot endpoints in parallel for major liquid pairs
      const cbTargets = allItems.filter((item) => Boolean(item.coinbasePair));
      await Promise.allSettled(
        cbTargets.map(async (item) => {
          const res = await fetch(
            `https://api.coinbase.com/v2/prices/${item.coinbasePair}/spot`
          );
          if (!res.ok) return;
          const json = await res.json();
          const amt = Number(json?.data?.amount);
          if (Number.isFinite(amt) && amt > 0) {
            nextSpots[item.ticker] = amt;
          }
        })
      );

      // 2. Pull CoinGecko simple price for non-Coinbase PoW assets (KAS, XMR, RVN, ERG, QUAI)
      const geckoTargets = allItems.filter(
        (item) => item.geckoId && !nextSpots[item.ticker]
      );
      if (geckoTargets.length > 0) {
        const idsParam = geckoTargets.map((i) => i.geckoId).join(',');
        const gRes = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`
        );
        if (gRes.ok) {
          const gJson = await gRes.json();
          geckoTargets.forEach((item) => {
            const p = Number(gJson?.[item.geckoId]?.usd);
            if (Number.isFinite(p) && p > 0) {
              nextSpots[item.ticker] = p;
            }
          });
        }
      }

      if (Object.keys(nextSpots).length > 0) {
        setLiveSpots((prev) => ({ ...prev, ...nextSpots }));
        setLastLiveSyncLabel(
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        );
      }
    } catch (_) {
      // Graceful fallback to verified snapshot prices on any network block
    } finally {
      setIsSyncingLive(false);
    }
  }, []);

  useEffect(() => {
    if (feedMode !== 'LIVE') return undefined;
    syncLiveExchangeSpots();
    const timer = setInterval(syncLiveExchangeSpots, 30000);
    return () => clearInterval(timer);
  }, [feedMode, syncLiveExchangeSpots]);

  // Enrich both rosters with active spot prices & dynamically computed returns
  const enrichAsset = (item) => {
    const liveAudit = auditsMap?.[item.ticker];
    const resolvedGrade = liveAudit?.grade || item.grade;
    const resolvedScore =
      liveAudit && Number.isFinite(Number(liveAudit.totalScore))
        ? Number(liveAudit.totalScore)
        : item.auditScore;

    if (!item.liquidCycle || !item.basePrice) {
      return {
        ...item,
        grade: resolvedGrade,
        auditScore: resolvedScore,
        spotPrice: null,
        isLiveTick: false,
        cyclePct: null,
        multiple: null
      };
    }

    const hasLive = feedMode === 'LIVE' && Number.isFinite(liveSpots[item.ticker]);
    const spotPrice = hasLive ? liveSpots[item.ticker] : item.snapshotSpot;
    const cyclePct = ((spotPrice - item.basePrice) / item.basePrice) * 100;
    const multiple = spotPrice / item.basePrice;

    return {
      ...item,
      grade: resolvedGrade,
      auditScore: resolvedScore,
      spotPrice,
      isLiveTick: hasLive,
      cyclePct,
      multiple
    };
  };

  const passedEnriched = PASSED_COHORT_GAINS.map(enrichAsset);
  const failedEnriched = FAILED_COHORT_GAINS.map(enrichAsset);

  const passedLiquid = passedEnriched.filter((i) => i.liquidCycle);
  const failedLiquid = failedEnriched.filter((i) => i.liquidCycle);

  // Dynamic Cohort Aggregations
  const passCycleAvg =
    feedMode === 'SNAPSHOT'
      ? 2015.0
      : passedLiquid.reduce((s, i) => s + i.cyclePct, 0) / passedLiquid.length;

  const passedExKas = passedLiquid.filter((i) => !i.isOutlier);
  const passExKasAvg =
    feedMode === 'SNAPSHOT'
      ? 165.4
      : passedExKas.reduce((s, i) => s + i.cyclePct, 0) / passedExKas.length;

  const failCycleAvg =
    feedMode === 'SNAPSHOT'
      ? 59.4
      : failedLiquid.reduce((s, i) => s + i.cyclePct, 0) / failedLiquid.length;

  const failedExOutliers = failedLiquid.filter(
    (i) => i.ticker !== 'TAO' && i.ticker !== 'XRP'
  );
  const failExOutlierAvg =
    feedMode === 'SNAPSHOT'
      ? -11.7
      : failedExOutliers.reduce((s, i) => s + i.cyclePct, 0) / failedExOutliers.length;

  const pass90dAvg =
    passedLiquid.reduce((s, i) => s + (i.tactical90dPct || 0), 0) / passedLiquid.length;
  const fail90dAvg = 42.7;
  const pass90dMedian = computeMedian(passedLiquid.map((i) => i.tactical90dPct || 0));
  const fail90dMedian = computeMedian(failedLiquid.map((i) => i.tactical90dPct || 0));

  const passPositiveCount = passedLiquid.filter((i) => (i.cyclePct || 0) > 0).length;
  const failNegativeCount = failedLiquid.filter((i) => (i.cyclePct || 0) < 0).length;

  // Portfolio Dollar Calculations (Allocating `allocPerAsset` into each liquid asset)
  const passInvested = passedLiquid.length * allocPerAsset;
  const failInvested = failedLiquid.length * allocPerAsset;

  const passEndDollars =
    feedMode === 'SNAPSHOT'
      ? Math.round(allocPerAsset * 249.42)
      : Math.round(
          passedLiquid.reduce((sum, i) => sum + allocPerAsset * Math.max(0, i.multiple), 0)
        );

  const failEndDollars =
    feedMode === 'SNAPSHOT'
      ? Math.round(allocPerAsset * 20.722)
      : Math.round(
          failedLiquid.reduce((sum, i) => sum + allocPerAsset * Math.max(0, i.multiple), 0)
        );

  const passExEndDollars = Math.round(
    passedExKas.length * allocPerAsset * (1 + passExKasAvg / 100)
  );
  const failExEndDollars = Math.round(
    (failedLiquid.length - 1) * allocPerAsset * (1 + failExOutlierAvg / 100)
  );

  const portfolioVictoryMultiple =
    failEndDollars > 0 ? (passEndDollars / failEndDollars).toFixed(1) : '12.0';

  // Build Active Trajectory Points
  const rawSeries =
    horizon === 'TACTICAL_90D'
      ? TACTICAL_90D_TRAJECTORY.map((pt) => ({
          label: pt.label,
          event: pt.event,
          passPrimary: pt.passAll,
          passSecondary: pt.passMed,
          failPrimary: pt.failAll,
          failSecondary: pt.failMed
        }))
      : MACRO_CYCLE_TRAJECTORY.map((pt, idx, arr) => {
          const isLast = idx === arr.length - 1;
          const livePassMult = isLast ? Math.max(0.2, 1 + passCycleAvg / 100) : pt.passAll;
          const livePassExMult = isLast ? Math.max(0.2, 1 + passExKasAvg / 100) : pt.passEx;
          const liveFailMult = isLast ? Math.max(0.2, 1 + failCycleAvg / 100) : pt.failAll;
          const liveFailExMult = isLast
            ? Math.max(0.2, 1 + failExOutlierAvg / 100)
            : pt.failEx;

          return horizon === 'EX_OUTLIER'
            ? {
                label: pt.label,
                event: pt.event,
                passPrimary: livePassExMult,
                passSecondary: null,
                failPrimary: liveFailExMult,
                failSecondary: liveFailMult
              }
            : {
                label: pt.label,
                event: pt.event,
                passPrimary: livePassMult,
                passSecondary: livePassExMult,
                failPrimary: liveFailMult,
                failSecondary: liveFailExMult
              };
        });

  // SVG Coordinate Mapping
  const svgH = 248;
  const padL = 58;
  const padR = 22;
  const padT = 20;
  const padB = 34;
  const plotW = Math.max(180, chartWidth - padL - padR);
  const plotH = svgH - padT - padB;

  const allMultValues = rawSeries.flatMap((d) =>
    [d.passPrimary, d.passSecondary, d.failPrimary, d.failSecondary, 1.0].filter(
      (v) => v !== null && Number.isFinite(v)
    )
  );
  const minVal = Math.min(...allMultValues) * 0.88;
  const maxVal = Math.max(...allMultValues) * 1.08;

  const effectiveLog = horizon === 'CYCLE' ? useLogScale : false;
  const mapY = (mult) => {
    const safeMult = Number.isFinite(mult) ? mult : 1.0;
    const clamped = Math.max(0.1, safeMult);
    if (effectiveLog) {
      const logMin = Math.log10(Math.max(0.1, minVal));
      const logMax = Math.log10(Math.max(0.2, maxVal));
      const ratio = (Math.log10(clamped) - logMin) / Math.max(0.0001, logMax - logMin);
      const yVal = padT + plotH * (1 - ratio);
      return Number.isFinite(yVal) ? yVal : padT + plotH * 0.5;
    }
    const ratio = (clamped - minVal) / Math.max(0.0001, maxVal - minVal);
    const yVal = padT + plotH * (1 - ratio);
    return Number.isFinite(yVal) ? yVal : padT + plotH * 0.5;
  };

  const mapX = (idx) =>
    padL + (idx / Math.max(1, rawSeries.length - 1)) * plotW;

  const buildPolyline = (key) => {
    const pts = rawSeries
      .map((d, i) => (d[key] !== null ? `${mapX(i).toFixed(1)},${mapY(d[key]).toFixed(1)}` : null))
      .filter(Boolean);
    return pts.length > 1 ? `M ${pts.join(' L ')}` : '';
  };

  const passAreaPath = (() => {
    const line = buildPolyline('passPrimary');
    if (!line) return '';
    return `${line} L ${mapX(rawSeries.length - 1).toFixed(1)},${(padT + plotH).toFixed(
      1
    )} L ${mapX(0).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;
  })();

  const activePointIdx =
    hoverPointIdx !== null ? hoverPointIdx : rawSeries.length - 1;
  const activePoint = rawSeries[activePointIdx] || rawSeries[rawSeries.length - 1];

  // Sort rosters according to active horizon
  const getMetricForAsset = (item) => {
    if (!item.liquidCycle) return -99999;
    return horizon === 'TACTICAL_90D' ? item.tactical90dPct || 0 : item.cyclePct || 0;
  };

  const sortedPassed = [...passedEnriched].sort(
    (a, b) => getMetricForAsset(b) - getMetricForAsset(a)
  );
  const sortedFailed = [...failedEnriched].sort(
    (a, b) => getMetricForAsset(b) - getMetricForAsset(a)
  );

  const buildShareableGainsReport = () =>
    `THE TRUTH — THERMODYNAMIC GAINS AUDIT (MAY 2022 → NOV 2026)

PASSED // E > 0 (14 Harmonic — PoW & Physical Commodities):
• Full-Cycle Equal-Weight Avg: ${formatPctSigned(passCycleAvg)} (${formatPctSigned(passExKasAvg)} Ex-KAS)
• $${allocPerAsset.toLocaleString()}/Asset Basket (${passedLiquid.length} Liquid): $${passInvested.toLocaleString()} → ~$${passEndDollars.toLocaleString()}
• Breadth: ${passPositiveCount} of ${passedLiquid.length} Liquid Assets Positive • 90D Median: ${formatPctSigned(pass90dMedian)}
• Top Anchors: $KAS (${formatPctSigned(passedEnriched[0]?.cyclePct)}), $ZEC (${formatPctSigned(
      passedEnriched[1]?.cyclePct
    )}), $XMR (${formatPctSigned(passedEnriched[2]?.cyclePct)}), $BTC (${formatPctSigned(
      passedEnriched[3]?.cyclePct
    )}), $XAG (${formatPctSigned(passedEnriched[4]?.cyclePct)}), $XAU (${formatPctSigned(
      passedEnriched[5]?.cyclePct
    )})

FAILED // E = 0 (13 Flatlined — PoS & Premined):
• Full-Cycle Equal-Weight Avg: ${formatPctSigned(failCycleAvg)} (${formatPctSigned(failExOutlierAvg)} Ex-Outliers)
• $${allocPerAsset.toLocaleString()}/Asset Basket (13 Assets): $${failInvested.toLocaleString()} → ~$${failEndDollars.toLocaleString()}
• Left-Tail VC Bleed: ${failNegativeCount} of 13 Deeply Negative ($ALGO -73.2%, $ADA -70.9%, $AVAX -69.6%, $ICP -43.5%, $SUI -39.3%, $NEAR -34.7%)

VERDICT: ${portfolioVictoryMultiple}x Total Portfolio Victory for Unforgeable Physical Costliness (E > 0).`;

  const yGridTicks =
    horizon === 'CYCLE' && effectiveLog
      ? [0.5, 1, 2, 5, 10, 22]
      : horizon === 'EX_OUTLIER'
      ? [0.6, 1.0, 1.5, 2.0, 2.6]
      : [0.95, 1.0, 1.15, 1.3, 1.45];

  return (
    <div
      onClick={onClose}
      className="animate-modal-backdrop fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-sheet w-full max-w-6xl max-h-[93vh] rounded-3xl bg-[#121418] border border-white/15 flex flex-col overflow-hidden shadow-[0_28px_90px_rgba(0,0,0,0.92)]"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-7 py-4 bg-[#0B0C0E]/95 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#49EACB] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#49EACB] shadow-[0_0_8px_#49EACB]" />
              <span>EMPIRICAL MARKET VERIFICATION // MAY 31, 2022 BASELINE → NOV 2026</span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
              Thermodynamic Gains Divergence: Passed (E &gt; 0) vs. Failed (E = 0)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Snapshot vs Live Exchange Feed Toggle */}
            <div className="p-0.5 rounded-full bg-[#121418] border border-white/10 flex items-center font-mono text-[10.5px] shrink-0">
              <button
                type="button"
                onClick={() => setFeedMode('SNAPSHOT')}
                className={`px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 ${
                  feedMode === 'SNAPSHOT'
                    ? 'bg-[#1D212A] text-white border-white/15'
                    : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                }`}
              >
                Nov &apos;26 Benchmark
              </button>
              <button
                type="button"
                onClick={() => setFeedMode('LIVE')}
                className={`px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 flex items-center gap-1.5 ${
                  feedMode === 'LIVE'
                    ? 'bg-[#49EACB]/15 text-[#49EACB] border-[#49EACB]/40'
                    : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    feedMode === 'LIVE' ? 'bg-[#49EACB] animate-ping' : 'bg-neutral-500'
                  }`}
                />
                <span>Live Spot Feed</span>
              </button>
            </div>

            {feedMode === 'LIVE' && (
              <button
                type="button"
                disabled={isSyncingLive}
                onClick={syncLiveExchangeSpots}
                title="Refresh live exchange spot prices"
                className="px-2.5 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[10.5px] text-neutral-300 flex items-center justify-center gap-1 min-w-[92px] tabular-nums transition-colors duration-150 shrink-0"
              >
                <RefreshCw
                  className={`w-3 h-3 text-[#49EACB] shrink-0 ${isSyncingLive ? 'animate-spin' : ''}`}
                />
                <span>{lastLiveSyncLabel || 'Syncing...'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onCopyReport(buildShareableGainsReport(), 'gains-report')}
              className="px-3 py-1.5 rounded-full font-mono text-xs font-semibold flex items-center justify-center gap-1.5 min-w-[156px] shrink-0 transition-opacity duration-150 hover:brightness-110"
              style={{
                backgroundImage: 'linear-gradient(135deg, #49EACB 0%, #34D399 100%)',
                color: '#041713'
              }}
            >
              {copiedTarget === 'gains-report' ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Copied Report!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span>Copy Gains Report</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#121418] hover:bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors duration-150 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Horizon Tabs + Capital Allocation Simulator Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="p-1 rounded-2xl sm:rounded-full bg-[#0B0C0E] border border-white/[0.08] flex flex-wrap items-center gap-1 font-mono text-xs">
              {[
                { id: 'CYCLE', label: "1. Full Macro Cycle (May '22 → Nov '26)" },
                { id: 'EX_OUTLIER', label: '2. Ex-Outlier Stress Test (Ex-KAS vs Ex-TAO)' },
                { id: 'TACTICAL_90D', label: "3. 90-Day Tactical (Aug – Nov '26)" }
              ].map((tab) => {
                const active = horizon === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setHoverPointIdx(null);
                      setHorizon(tab.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl sm:rounded-full border font-semibold transition-colors duration-150 ${
                      active
                        ? 'bg-[#171B24] text-white border-white/15 shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Per-Asset Capital Simulator Pills */}
            <div className="flex items-center gap-1.5 bg-[#0B0C0E] px-2.5 py-1 rounded-full border border-white/[0.08] font-mono text-[11px] shrink-0">
              <DollarSign className="w-3.5 h-3.5 text-[#49EACB] shrink-0" />
              <span className="text-neutral-400 mr-1">Per-Asset Sim:</span>
              {[100, 1000, 5000, 10000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAllocPerAsset(amt)}
                  className={`px-2 py-0.5 rounded-full border font-semibold tabular-nums transition-colors duration-150 ${
                    allocPerAsset === amt
                      ? 'bg-[#49EACB]/15 text-[#49EACB] border-[#49EACB]/40'
                      : 'text-neutral-400 hover:text-white border-transparent'
                  }`}
                >
                  ${amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Hero Cohort KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* KPI 1: PASSED E > 0 */}
            <div className="rounded-2xl bg-[#0B0C0E] border border-[#49EACB]/35 p-4 space-y-1 min-w-0 overflow-hidden">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#49EACB] flex items-center justify-between gap-1">
                <span className="truncate">PASSED // E &gt; 0 (14 Harmonic)</span>
                <span className="shrink-0">PoW + Metals</span>
              </div>
              <div
                className="font-display text-2xl sm:text-3xl font-bold"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #49EACB 0%, #34D399 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {horizon === 'EX_OUTLIER'
                  ? formatPctSigned(passExKasAvg)
                  : horizon === 'TACTICAL_90D'
                  ? `${formatPctSigned(pass90dMedian)} Med`
                  : `~${formatPctSigned(passCycleAvg)}`}
              </div>
              <div className="font-mono text-[11px] text-neutral-300">
                {horizon === 'TACTICAL_90D'
                  ? `${formatPctSigned(pass90dAvg)} Equal-Wt • 12/12 Positive`
                  : `${formatPctSigned(passExKasAvg)} Ex-KAS • ${passPositiveCount}/${passedLiquid.length} Positive`}
              </div>
            </div>

            {/* KPI 2: FAILED E = 0 */}
            <div className="rounded-2xl bg-[#0B0C0E] border border-[#EF4444]/35 p-4 space-y-1 min-w-0 overflow-hidden">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#EF4444] flex items-center justify-between gap-1">
                <span className="truncate">FAILED // E = 0 (13 Flatlined)</span>
                <span className="shrink-0">PoS + Premine</span>
              </div>
              <div
                className="font-display text-2xl sm:text-3xl font-bold"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {horizon === 'EX_OUTLIER'
                  ? formatPctSigned(failExOutlierAvg)
                  : horizon === 'TACTICAL_90D'
                  ? `${formatPctSigned(fail90dMedian)} Med`
                  : `~${formatPctSigned(failCycleAvg)}`}
              </div>
              <div className="font-mono text-[11px] text-neutral-400">
                {horizon === 'TACTICAL_90D'
                  ? `+${fail90dAvg}% Mean (3 Squeezes) • 10/13 Lag BTC`
                  : `${formatPctSigned(failExOutlierAvg)} Ex-TAO • ${failNegativeCount}/13 Bleed (-35% to -73%)`}
              </div>
            </div>

            {/* KPI 3: $1,000 / Asset Portfolio Outcome */}
            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1 min-w-0 overflow-hidden">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 truncate">
                ${allocPerAsset.toLocaleString()}/ASSET BASKET OUTCOME
              </div>
              <div
                title={`~$${(horizon === 'EX_OUTLIER'
                  ? passExEndDollars
                  : passEndDollars
                ).toLocaleString()} vs ~$${(horizon === 'EX_OUTLIER'
                  ? failExEndDollars
                  : failEndDollars
                ).toLocaleString()}`}
                className="font-display text-lg sm:text-xl xl:text-2xl font-bold text-white flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 leading-tight"
              >
                <span className="text-[#49EACB] whitespace-nowrap">
                  ~{formatBasketUsd(horizon === 'EX_OUTLIER' ? passExEndDollars : passEndDollars)}
                </span>
                <span className="text-xs font-mono text-neutral-500">vs</span>
                <span className="text-[#F97316] whitespace-nowrap">
                  ~{formatBasketUsd(horizon === 'EX_OUTLIER' ? failExEndDollars : failEndDollars)}
                </span>
              </div>
              <div className="font-mono text-[11px] text-[#34D399] font-semibold">
                {horizon === 'EX_OUTLIER'
                  ? 'E > 0 Nearly Triples Capital While E = 0 Loses Principal'
                  : `${portfolioVictoryMultiple}x Total Portfolio Victory for E > 0`}
              </div>
            </div>

            {/* KPI 4: Structural Tail Asymmetry */}
            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1 min-w-0 overflow-hidden">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 truncate">
                CONVEXITY VS. VC CLIFF BLEED
              </div>
              <div className="font-display text-lg sm:text-xl xl:text-2xl font-bold text-white leading-tight">
                <span className="text-[#49EACB]">225.9x</span>{' '}
                <span className="font-mono text-xs text-neutral-500">Right-Tail</span>{' '}
                <span className="text-[#EF4444]">-73.2%</span>{' '}
                <span className="font-mono text-xs text-neutral-500">PoS Floor</span>
              </div>
              <div className="font-mono text-[11px] text-neutral-400">
                0 VC unlocks on $KAS vs endless 0-Joule dilution
              </div>
            </div>
          </div>

          {/* Interactive SVG Cumulative Divergence Trajectory Chart */}
          <div className="rounded-2xl bg-[#07080A] border border-white/[0.08] p-4 sm:p-5 space-y-3">
            <div className="space-y-1.5">
              {/* Row 1: Static Title + Pinned Scale Switcher (Never shifts when scrubbing timeline) */}
              <div className="flex items-center justify-between gap-3 min-h-[28px]">
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 min-w-0 truncate">
                  {horizon === 'TACTICAL_90D'
                    ? '90-DAY TACTICAL WINDOW (AUG 15 – NOV 14, 2026) // MEDIAN CONSISTENCY VS SQUEEZE NOISE'
                    : horizon === 'EX_OUTLIER'
                    ? 'EX-OUTLIER STRUCTURAL CURVE // PASSED EX-KAS (+165.4%) VS FAILED EX-TAO (-11.7%)'
                    : 'CUMULATIVE COHORT EQUITY MULTIPLIER // SCRUB TIMELINE TO INSPECT'}
                </div>

                {horizon === 'CYCLE' ? (
                  <div className="p-0.5 rounded-full bg-[#121418] border border-white/10 flex items-center font-mono text-[10px] shrink-0">
                    <button
                      type="button"
                      onClick={() => setUseLogScale(true)}
                      className={`px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 ${
                        useLogScale
                          ? 'bg-[#1D212A] text-white border-white/15'
                          : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                      }`}
                    >
                      Log Scale
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseLogScale(false)}
                      className={`px-2.5 py-1 rounded-full border font-semibold transition-colors duration-150 ${
                        !useLogScale
                          ? 'bg-[#1D212A] text-white border-white/15'
                          : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                      }`}
                    >
                      Linear (12x Gap)
                    </button>
                  </div>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-[#121418] border border-white/[0.07] font-mono text-[10px] text-neutral-400 shrink-0">
                    Linear Scale
                  </span>
                )}
              </div>

              {/* Row 2: Dedicated Fixed-Height Tabular Scrub Readout */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tabular-nums min-h-[20px]">
                <span className="text-white font-bold">
                  [{activePoint.label} — {activePoint.event}]
                </span>
                <span className="text-[#49EACB] font-bold">
                  E &gt; 0: {formatPctSigned((activePoint.passPrimary - 1) * 100)} (
                  {activePoint.passPrimary.toFixed(2)}x)
                </span>
                {activePoint.passSecondary !== null && (
                  <span className="text-[#34D399]">
                    {horizon === 'TACTICAL_90D' ? 'E>0 Median' : 'E>0 Ex-KAS'}:{' '}
                    {formatPctSigned((activePoint.passSecondary - 1) * 100)}
                  </span>
                )}
                <span className="text-[#EF4444] font-bold">
                  E = 0: {formatPctSigned((activePoint.failPrimary - 1) * 100)} (
                  {activePoint.failPrimary.toFixed(2)}x)
                </span>
                {activePoint.failSecondary !== null && (
                  <span className="text-[#F97316]">
                    {horizon === 'TACTICAL_90D'
                      ? 'E=0 Median'
                      : horizon === 'EX_OUTLIER'
                      ? 'E=0 All'
                      : 'E=0 Ex-TAO'}
                    : {formatPctSigned((activePoint.failSecondary - 1) * 100)}
                  </span>
                )}
              </div>
            </div>

            <div
              ref={chartBoxRef}
              onMouseLeave={() => setHoverPointIdx(null)}
              className="w-full overflow-hidden rounded-xl bg-[#0B0C0E] border border-white/[0.05] relative"
            >
              <svg
                width={chartWidth}
                height={svgH}
                viewBox={`0 0 ${chartWidth} ${svgH}`}
                className="block w-full select-none"
              >
                <defs>
                  <linearGradient id="gainsPassArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#49EACB" stopOpacity="0.26" />
                    <stop offset="100%" stopColor="#34D399" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="gainsPassStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#49EACB" />
                    <stop offset="100%" stopColor="#34D399" />
                  </linearGradient>
                  <linearGradient id="gainsFailStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#F97316" />
                  </linearGradient>
                </defs>

                {/* Horizontal Y Grid & Multiplier Labels */}
                {yGridTicks.map((tickVal) => {
                  const y = mapY(tickVal);
                  if (y < padT - 4 || y > padT + plotH + 4) return null;
                  const isBreakeven = Math.abs(tickVal - 1.0) < 0.001;
                  return (
                    <g key={tickVal}>
                      <line
                        x1={padL}
                        y1={y}
                        x2={chartWidth - padR}
                        y2={y}
                        stroke={
                          isBreakeven
                            ? 'rgba(255,255,255,0.22)'
                            : 'rgba(255,255,255,0.05)'
                        }
                        strokeDasharray={isBreakeven ? '4 4' : undefined}
                        strokeWidth={isBreakeven ? '1.2' : '1'}
                      />
                      <text
                        x={padL - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        fill={isBreakeven ? '#E5E7EB' : '#6B7280'}
                        fontSize="9.5"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {tickVal >= 2 ? `${tickVal}x` : formatPctSigned((tickVal - 1) * 100)}
                      </text>
                    </g>
                  );
                })}

                {/* Area under Primary PASSED Curve */}
                <path d={passAreaPath} fill="url(#gainsPassArea)" />

                {/* Secondary Reference Curves (Dashed) */}
                {buildPolyline('failSecondary') && (
                  <path
                    d={buildPolyline('failSecondary')}
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    strokeOpacity="0.78"
                  />
                )}
                {buildPolyline('passSecondary') && (
                  <path
                    d={buildPolyline('passSecondary')}
                    fill="none"
                    stroke="#34D399"
                    strokeWidth="1.7"
                    strokeDasharray="5 4"
                    strokeOpacity="0.88"
                  />
                )}

                {/* Primary FAILED (E = 0) Curve */}
                <path
                  d={buildPolyline('failPrimary')}
                  fill="none"
                  stroke="url(#gainsFailStroke)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />

                {/* Primary PASSED (E > 0) Curve */}
                <path
                  d={buildPolyline('passPrimary')}
                  fill="none"
                  stroke="url(#gainsPassStroke)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Active Vertical Scrub Line & Data Nodes */}
                {rawSeries.map((pt, idx) => {
                  const x = mapX(idx);
                  const yPass = mapY(pt.passPrimary);
                  const yFail = mapY(pt.failPrimary);
                  const isActive = idx === activePointIdx;
                  const colW = plotW / Math.max(1, rawSeries.length - 1);

                  return (
                    <g key={pt.label}>
                      {isActive && (
                        <line
                          x1={x}
                          y1={padT}
                          x2={x}
                          y2={padT + plotH}
                          stroke="rgba(255,255,255,0.22)"
                          strokeWidth="1"
                          strokeDasharray="3 3"
                        />
                      )}

                      <circle
                        cx={x}
                        cy={yFail}
                        r={isActive ? 5 : 3}
                        fill="#0B0C0E"
                        stroke="#EF4444"
                        strokeWidth={isActive ? 2.4 : 1.6}
                      />
                      <circle
                        cx={x}
                        cy={yPass}
                        r={isActive ? 5.5 : 3.4}
                        fill="#0B0C0E"
                        stroke="#49EACB"
                        strokeWidth={isActive ? 2.6 : 1.8}
                      />

                      <text
                        x={x}
                        y={svgH - 11}
                        textAnchor="middle"
                        fill={isActive ? '#FFFFFF' : '#6B7280'}
                        fontSize="9.5"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight={isActive ? '700' : '400'}
                      >
                        {pt.label}
                      </text>

                      {/* Invisible Hover Hit Slice */}
                      <rect
                        x={x - colW / 2}
                        y={0}
                        width={colW}
                        height={svgH}
                        fill="transparent"
                        className="cursor-crosshair"
                        onMouseEnter={() => setHoverPointIdx(idx)}
                        onClick={() => setHoverPointIdx(idx)}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Legend Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] text-neutral-400">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-[#49EACB]">
                  <span className="w-3 h-0.5 bg-[#49EACB] inline-block" />
                  <span>
                    {horizon === 'EX_OUTLIER'
                      ? 'PASSED Ex-KAS (+165.4%)'
                      : 'PASSED E > 0 Equal-Weight'}
                  </span>
                </span>
                {horizon !== 'EX_OUTLIER' && (
                  <span className="inline-flex items-center gap-1.5 text-[#34D399]">
                    <span className="w-3 border-t border-dashed border-[#34D399] inline-block" />
                    <span>
                      {horizon === 'TACTICAL_90D'
                        ? 'PASSED 90D Median (+19.0%)'
                        : 'PASSED Ex-KAS (+165.4%)'}
                    </span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-[#EF4444]">
                  <span className="w-3 h-0.5 bg-[#EF4444] inline-block" />
                  <span>
                    {horizon === 'EX_OUTLIER'
                      ? 'FAILED Ex-Outliers (-11.7%)'
                      : 'FAILED E = 0 Equal-Weight'}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#F97316]">
                  <span className="w-3 border-t border-dashed border-[#F97316] inline-block" />
                  <span>
                    {horizon === 'TACTICAL_90D'
                      ? 'FAILED 90D Median (+13.9%)'
                      : horizon === 'EX_OUTLIER'
                      ? 'FAILED All (+59.4%)'
                      : 'FAILED Ex-Outliers (-11.7%)'}
                  </span>
                </span>
              </div>
              <span className="text-neutral-500">
                Click any asset row below to inspect or pull its 6-invariant audit
              </span>
            </div>
          </div>

          {/* Side-by-Side 14 Harmonic vs 13 Flatlined Asset Divergence Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LEFT PANEL: PASSED // E > 0 (14 HARMONIC) */}
            <div className="rounded-2xl bg-[#0B0C0E] border border-[#49EACB]/25 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.07]">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#49EACB]">
                  <span className="w-2 h-2 rounded-full bg-[#49EACB] shadow-[0_0_8px_#49EACB]" />
                  <span>PASSED // E &gt; 0 (14 Harmonic)</span>
                </div>
                <span className="font-mono text-[10.5px] text-neutral-400">
                  PoW &amp; Physical Commodities
                </span>
              </div>

              <div className="space-y-2">
                {sortedPassed.map((item) => {
                  const pct =
                    horizon === 'TACTICAL_90D' ? item.tactical90dPct : item.cyclePct;
                  const isDimmedOutlier = horizon === 'EX_OUTLIER' && item.isOutlier;
                  const barPct =
                    pct === null
                      ? 0
                      : horizon === 'TACTICAL_90D'
                      ? Math.min(100, (Math.abs(pct) / 240) * 100)
                      : pct >= 0
                      ? Math.min(100, (Math.log10(1 + pct / 10) / Math.log10(2260)) * 100)
                      : Math.min(100, (Math.abs(pct) / 100) * 65);
                  const isPositive = pct === null || pct >= 0;

                  return (
                    <button
                      key={item.ticker}
                      type="button"
                      onClick={() => onSelectOrAuditTicker(item.ticker)}
                      className={`w-full text-left rounded-xl bg-[#121418] hover:bg-[#171B22] border border-white/[0.06] hover:border-[#49EACB]/40 p-2.5 transition space-y-1.5 ${
                        isDimmedOutlier ? 'opacity-45' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-mono text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-white">${item.ticker}</span>
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#49EACB]/12 text-[#49EACB] border border-[#49EACB]/35">
                            {item.grade} • {formatScore(item.auditScore)}
                          </span>
                          <span className="text-[11px] text-neutral-400 truncate hidden sm:inline">
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.spotPrice !== null ? (
                            <span className="text-[10.5px] text-neutral-400">
                              {item.baselineLabel} →{' '}
                              <strong className="text-neutral-200">
                                {formatUsdPrice(item.spotPrice)}
                              </strong>
                            </span>
                          ) : (
                            <span className="text-[10.5px] text-neutral-500">
                              {item.baselineLabel}
                            </span>
                          )}
                          <span
                            className="font-bold min-w-[68px] text-right"
                            style={{ color: isPositive ? '#49EACB' : '#F97316' }}
                          >
                            {pct !== null ? formatPctSigned(pct) : 'Carrier'}
                          </span>
                        </div>
                      </div>

                      {pct !== null && (
                        <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(3, barPct)}%`,
                              backgroundImage: isPositive
                                ? 'linear-gradient(90deg, #49EACB 0%, #34D399 100%)'
                                : 'linear-gradient(90deg, #F97316 0%, #EF4444 100%)'
                            }}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-neutral-500">
                        <span className="truncate">{item.note}</span>
                        {item.multiple !== null && horizon !== 'TACTICAL_90D' && (
                          <span className="shrink-0 text-neutral-300">
                            {item.multiple >= 10
                              ? `${item.multiple.toFixed(1)}x`
                              : `${item.multiple.toFixed(2)}x`}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT PANEL: FAILED // E = 0 (13 FLATLINED) */}
            <div className="rounded-2xl bg-[#0B0C0E] border border-[#EF4444]/25 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.07]">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#EF4444]">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]" />
                  <span>FAILED // E = 0 (13 Flatlined)</span>
                </div>
                <span className="font-mono text-[10.5px] text-neutral-400">
                  PoS &amp; Premined Ledgers (All Grade F)
                </span>
              </div>

              <div className="space-y-2">
                {sortedFailed.map((item) => {
                  const pct =
                    horizon === 'TACTICAL_90D' ? item.tactical90dPct : item.cyclePct;
                  const isDimmedOutlier = horizon === 'EX_OUTLIER' && item.isOutlier;
                  const barPct =
                    horizon === 'TACTICAL_90D'
                      ? Math.min(100, (Math.abs(pct) / 240) * 100)
                      : pct >= 0
                      ? Math.min(100, (Math.log10(1 + pct / 10) / Math.log10(2260)) * 100)
                      : Math.min(100, (Math.abs(pct) / 100) * 85);
                  const isPositive = pct >= 0;

                  return (
                    <button
                      key={item.ticker}
                      type="button"
                      onClick={() => onSelectOrAuditTicker(item.ticker)}
                      className={`w-full text-left rounded-xl bg-[#121418] hover:bg-[#191416] border border-white/[0.06] hover:border-[#EF4444]/40 p-2.5 transition space-y-1.5 ${
                        isDimmedOutlier ? 'opacity-45' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-mono text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-white">${item.ticker}</span>
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#EF4444]/12 text-[#EF4444] border border-[#EF4444]/35">
                            F • 0.0
                          </span>
                          <span className="text-[11px] text-neutral-400 truncate hidden sm:inline">
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10.5px] text-neutral-400">
                            {item.baselineLabel} →{' '}
                            <strong className="text-neutral-200">
                              {formatUsdPrice(item.spotPrice)}
                            </strong>
                          </span>
                          <span
                            className="font-bold min-w-[68px] text-right"
                            style={{ color: isPositive ? '#F97316' : '#EF4444' }}
                          >
                            {formatPctSigned(pct)}
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(3, barPct)}%`,
                            backgroundImage: isPositive
                              ? 'linear-gradient(90deg, #F97316 0%, #FB923C 100%)'
                              : 'linear-gradient(90deg, #EF4444 0%, #991B1B 100%)'
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-neutral-500">
                        <span className="truncate">{item.note}</span>
                        {item.multiple !== null && horizon !== 'TACTICAL_90D' && (
                          <span className="shrink-0 text-neutral-400">
                            {item.multiple.toFixed(2)}x
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3 Structural Physics Laws Explaining the Market Blowout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1.5">
              <div className="font-mono text-[10.5px] font-bold text-[#49EACB]">
                01 // ASYMMETRIC RIGHT-TAIL MONSTER ($KAS)
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Starting from a $0.00 fair-launch genesis with zero VC overhang, 100% of organic
                adoption flowed into vertical price discovery (+22,492% / 225.9x) rather than
                funding Silicon Valley seed-round exit liquidity—turning $1,000/asset into
                ~$249,000+ vs ~$20,700 on E = 0 (a 12x portfolio victory).
              </p>
            </div>

            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1.5">
              <div className="font-mono text-[10.5px] font-bold text-[#EF4444]">
                02 // ELIMINATING THE &ldquo;VC BLEED-TO-ZERO&rdquo; LEFT TAIL
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Nearly half of the E = 0 cohort suffered catastrophic multi-year liquidation: ALGO
                (-73.2%), ADA (-70.9%), AVAX (-69.6%), ICP (-43.5% / -99% ATH), SUI (-39.3%), and
                NEAR (-34.7%). Tokens conjured at 0 Joules bleed endless insider unlocks and staking
                dilution into every rally.
              </p>
            </div>

            <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-1.5">
              <div className="font-mono text-[10.5px] font-bold text-[#34D399]">
                03 // THERMODYNAMIC FLOOR PROTECTION (EX-OUTLIERS)
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Physical commodities (XAU, XAG) and Proof-of-Work ledgers (BTC, KAS, XMR, ZEC)
                cannot be printed for free. Even stripping KAS out of Passed and TAO out of Failed,
                the remaining E &gt; 0 basket still averages +165.4% across the cycle versus -11.7%
                for E = 0.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inspects raw streaming JSON text using the simple "-" dash separator at the end of each invariant
// to track how many invariants (01..06) have completed so far and extract their scores.
function inspectStreamedAuditProgress(streamText) {
  const completedColors = {};
  const completedScores = {};
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
    const blockSlice = nextMatch
      ? sliceFromId.slice(0, nextMatch.index + 10)
      : sliceFromId;

    // Detect the simple dash "-" at the end of the invariant (or closed receipts / next invariant start)
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

// ============================================================================
// MAIN APPLICATION: THE TRUTH (thermodynamic audit)
// ============================================================================
function ThermodynamicAuditApp() {
  const [audits, setAudits] = useState(PRELOADED_AUDITS);
  const [activeKey, setActiveKey] = useState(null);
  const [searchInput, setSearchInput] = useState('');

  // Mode Toggle: false = Normie Mode (Locked-In Default), true = Genius Mode (Locked-In Full 6-Paragraph Forensic Audit)
  const [isGeniusMode, setIsGeniusMode] = useState(false);
  const [isRubricOpen, setIsRubricOpen] = useState(false);

  // Shared Persistent Archive & API Credit Shield State
  const [archiveUser, setArchiveUser] = useState(null);
  const [archiveStatus, setArchiveStatus] = useState(
    firestoreDb ? 'CONNECTING' : 'SESSION_ARCHIVE'
  );
  const [archivedCloudCount, setArchivedCloudCount] = useState(0);
  const [zeroTokenHits, setZeroTokenHits] = useState(0);
  const [dynamicAliases, setDynamicAliases] = useState({});
  const [strictCreditLock, setStrictCreditLock] = useState(false);
  const [confirmFullReauditKey, setConfirmFullReauditKey] = useState(null);
  const [archiveToast, setArchiveToast] = useState(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isGainsModalOpen, setIsGainsModalOpen] = useState(false);
  const [showImportBox, setShowImportBox] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  // Orbital Fission & Multi-Bubble Pinning / Constellation Formation State
  const [isArenaHovered, setIsArenaHovered] = useState(false);
  const [pinnedKeys, setPinnedKeys] = useState([]);
  const [exitingPins, setExitingPins] = useState([]);
  const [threeFormation, setThreeFormation] = useState('TRIANGLE');
  const [fourFormation, setFourFormation] = useState('RHOMBUS');
  const [expandAllOrbits, setExpandAllOrbits] = useState(true);
  const constellationMeasureRef = useRef(null);
  const [constellationWrapWidth, setConstellationWrapWidth] = useState(1120);
  const [hoveredInvId, setHoveredInvId] = useState(null);
  const [expandedSyncInvId, setExpandedSyncInvId] = useState(null);
  const [isScanningPulse, setIsScanningPulse] = useState(false);

  // Modal Sheet State & Wartime Simulator Anchor Refs
  const [modalInvId, setModalInvId] = useState(null);
  const [essayViewMode, setEssayViewMode] = useState(false);
  const modalBodyRef = useRef(null);
  const simAnchorRef = useRef(null);

  // Clipboard Feedback State
  const [copiedTarget, setCopiedTarget] = useState(null);

  // Live Custom Audit State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditStatusMsg, setAuditStatusMsg] = useState('');
  const [auditError, setAuditError] = useState(null);
  const [scanTargetTicker, setScanTargetTicker] = useState('');
  const [scanStepIdx, setScanStepIdx] = useState(0);
  const [scanCodeTick, setScanCodeTick] = useState(0);
  const [scanProgressPct, setScanProgressPct] = useState(0);
  const [resolvedStepColors, setResolvedStepColors] = useState({});

  // Single-Invariant Interactive Console State (Challenge / More Breakdown / Low-Token 1-Inv Re-Audit)
  const [invPromptInputs, setInvPromptInputs] = useState({});
  const [invLogs, setInvLogs] = useState({});
  const [singleInvBusy, setSingleInvBusy] = useState(null);
  const [singleInvNotice, setSingleInvNotice] = useState(null);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Refs for the Grade-Scaled Harmonic Wave Circle Shape (when not hovering)
  const mainWavePathRef = useRef(null);
  const echoWavePathRef = useRef(null);
  const innerWavePathRef = useRef(null);
  const waveStateRef = useRef({ phase: 0, amp: 0 });

  // Refs for the 6 Satellite Invariant Bubbles (energy transfers here when expanded)
  const satMainWaveRefs = useRef([]);
  const satEchoWaveRefs = useRef([]);
  const satInnerWaveRefs = useRef([]);
  const satWaveStatesRef = useRef(
    Array.from({ length: 6 }, (_, i) => ({ phase: i * 1.05, amp: 0 }))
  );

  const isAnyModalOpen = Boolean(
    modalInvId || isRubricOpen || isArchiveModalOpen || isGainsModalOpen
  );

  // Only mount one set of Pass/Fail bubbles (desktop fixed vs mobile stacked) and pause background waves while modals are open
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e) => setIsMobileViewport(e.matches);
    setIsMobileViewport(mq.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  useEffect(() => {
    setGlobalWavePaused(isAnyModalOpen);
    return () => setGlobalWavePaused(false);
  }, [isAnyModalOpen]);

  const sortedTickers = sortAuditTickersByGrade(audits);
  const passedTickers = sortedTickers.filter((tk) => {
    const a = audits[tk];
    return a && Number(a.totalScore) > 1.0 && String(a.grade || '').toUpperCase() !== 'F';
  });
  const failedTickers = sortedTickers.filter((tk) => {
    const a = audits[tk];
    return a && (Number(a.totalScore) <= 1.0 || String(a.grade || '').toUpperCase() === 'F');
  });

  const flashArchiveToast = (text, tone = 'hit') => {
    setArchiveToast({ text, tone });
  };

  useEffect(() => {
    if (!archiveToast) return undefined;
    const t = setTimeout(() => setArchiveToast(null), 3600);
    return () => clearTimeout(t);
  }, [archiveToast]);

  // RULE 3: Authenticate FIRST (Custom Token Priority -> Anonymous Fallback) before any archive queries
  useEffect(() => {
    if (!firebaseAuth) {
      setArchiveStatus('SESSION_ARCHIVE');
      return undefined;
    }
    let mounted = true;
    const initArchiveAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(firebaseAuth, __initial_auth_token);
        } else {
          await signInAnonymously(firebaseAuth);
        }
      } catch (err) {
        console.error('Archive authentication failed:', err);
        if (mounted) setArchiveStatus('SESSION_ARCHIVE');
      }
    };
    initArchiveAuth();
    const unsubAuth = onAuthStateChanged(firebaseAuth, (u) => {
      if (mounted) setArchiveUser(u);
    });
    return () => {
      mounted = false;
      unsubAuth();
    };
  }, []);

  // Real-time Shared Archive Listener: pulls all community-audited & contested records at 0 Gemini tokens
  useEffect(() => {
    if (!firestoreDb || !archiveUser) return undefined;

    const archiveColRef = collection(
      firestoreDb,
      'artifacts',
      ARCHIVE_APP_ID,
      'public',
      'data',
      'archived_audits'
    );

    const unsubSnapshot = onSnapshot(
      archiveColRef,
      (snapshot) => {
        const remoteAudits = {};
        const remoteLogs = {};
        const remoteAliases = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (!data || !data.ticker || !Array.isArray(data.invariants) || data.invariants.length < 6) {
            return;
          }
          const tk = String(data.ticker)
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '');
          if (!tk) return;

          const { archivedInvLogs, ...auditFields } = data;
          remoteAudits[tk] = enforceEnergyArbitrageLawOnAudit({
            ...auditFields,
            ticker: tk,
            isArchived: true
          });

          if (archivedInvLogs && typeof archivedInvLogs === 'object') {
            Object.entries(archivedInvLogs).forEach(([invId, logsArr]) => {
              if (Array.isArray(logsArr) && logsArr.length > 0) {
                remoteLogs[`${tk}:${invId}`] = logsArr;
              }
            });
          }

          if (Array.isArray(data.queryAliases)) {
            data.queryAliases.forEach((al) => {
              const norm = String(al || '')
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '');
              if (norm) remoteAliases[norm] = tk;
            });
          }
        });

        setArchivedCloudCount(Object.keys(remoteAudits).length);
        setDynamicAliases((prev) => ({ ...prev, ...remoteAliases }));
        setAudits((prev) => ({
          ...PRELOADED_AUDITS,
          ...prev,
          ...remoteAudits
        }));
        setInvLogs((prev) => ({
          ...prev,
          ...remoteLogs
        }));
        setArchiveStatus('SYNCED');
      },
      (err) => {
        console.error('Shared archive listener error:', err);
        setArchiveStatus('SESSION_ARCHIVE');
      }
    );

    return () => unsubSnapshot();
  }, [archiveUser]);

  // Writes an audited or contested asset + its invariant logs into the shared persistent archive
  const persistAuditToArchive = async (
    auditToSave,
    logsStateOverride = null,
    extraAliases = []
  ) => {
    if (!auditToSave || !auditToSave.ticker) return false;
    const tk = String(auditToSave.ticker)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    if (!tk) return false;

    const activeLogsSource = logsStateOverride || invLogs;
    const archivedInvLogs = {};
    ['01', '02', '03', '04', '05', '06'].forEach((invId) => {
      const key = `${tk}:${invId}`;
      if (Array.isArray(activeLogsSource[key]) && activeLogsSource[key].length > 0) {
        archivedInvLogs[invId] = activeLogsSource[key].slice(0, 10);
      }
    });

    const aliasSet = new Set(
      [
        tk,
        auditToSave.name,
        ...(Array.isArray(auditToSave.queryAliases) ? auditToSave.queryAliases : []),
        ...extraAliases
      ]
        .map((s) =>
          String(s || '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
        )
        .filter(Boolean)
    );
    const mergedAliases = Array.from(aliasSet).slice(0, 20);

    setDynamicAliases((prev) => {
      const next = { ...prev };
      mergedAliases.forEach((al) => {
        next[al] = tk;
      });
      return next;
    });

    if (!firestoreDb || !archiveUser) return false;

    try {
      const payload = sanitizeForArchive({
        ...auditToSave,
        ticker: tk,
        isArchived: true,
        queryAliases: mergedAliases,
        archivedInvLogs,
        archivedAtMs: Date.now(),
        archivedAtLabel: new Date().toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        archiveRevision: (Number(auditToSave.archiveRevision) || 0) + 1,
        archivedByUid: archiveUser.uid
      });

      const docRef = doc(
        firestoreDb,
        'artifacts',
        ARCHIVE_APP_ID,
        'public',
        'data',
        'archived_audits',
        tk
      );
      await setDoc(docRef, payload, { merge: true });
      return true;
    } catch (err) {
      console.error('Failed to persist audit to shared archive:', err);
      return false;
    }
  };

  const handleImportArchiveSnapshot = async () => {
    const raw = importJsonText.trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const mapCandidate = parsed.audits && typeof parsed.audits === 'object' ? parsed.audits : parsed;
      const importedAudits = {};
      let importedCount = 0;

      Object.entries(mapCandidate).forEach(([k, val]) => {
        if (val && typeof val === 'object' && Array.isArray(val.invariants) && val.invariants.length === 6) {
          const tk = String(val.ticker || k)
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '');
          if (tk) {
            importedAudits[tk] = enforceEnergyArbitrageLawOnAudit({
              ...val,
              ticker: tk,
              isArchived: true
            });
            importedCount++;
          }
        }
      });

      if (importedCount === 0) {
        flashArchiveToast('No valid 6-invariant audits found in JSON.', 'warn');
        return;
      }

      setAudits((prev) => ({ ...prev, ...importedAudits }));
      if (parsed.invLogs && typeof parsed.invLogs === 'object') {
        setInvLogs((prev) => ({ ...prev, ...parsed.invLogs }));
      }

      if (firestoreDb && archiveUser) {
        for (const tk of Object.keys(importedAudits)) {
          await persistAuditToArchive(importedAudits[tk], parsed.invLogs || invLogs, [tk]);
        }
      }

      setImportJsonText('');
      setShowImportBox(false);
      flashArchiveToast(`Imported & archived ${importedCount} token audits (0 API credits).`, 'saved');
    } catch (_) {
      flashArchiveToast('Invalid JSON snapshot format.', 'warn');
    }
  };

  const validPinnedKeys = pinnedKeys.filter((k) => Boolean(audits[k]));
  const hasActiveAudit = Boolean(activeKey && audits[activeKey]);
  const isPinned = Boolean(hasActiveAudit && validPinnedKeys.includes(activeKey));
  const stageTickers = isAuditing
    ? hasActiveAudit
      ? [activeKey]
      : []
    : validPinnedKeys.length > 0
    ? hasActiveAudit && !validPinnedKeys.includes(activeKey)
      ? validPinnedKeys.length < 4
        ? [...validPinnedKeys, activeKey]
        : [...validPinnedKeys.slice(0, 3), activeKey]
      : validPinnedKeys.slice(0, 4)
    : hasActiveAudit
    ? [activeKey]
    : [];
  const isMultiStage = !isAuditing && stageTickers.length > 1;
  const isLandingIdle = !isAuditing && !hasActiveAudit && validPinnedKeys.length === 0;

  // Ensure click-expanded Sync Invariant only stays open when >1 asset is pinned
  useEffect(() => {
    if (!isMultiStage && expandedSyncInvId) {
      setExpandedSyncInvId(null);
    }
  }, [isMultiStage, expandedSyncInvId]);

  // Responsive width observer so 2/3/4 geometric formations fit cleanly on any viewport
  useEffect(() => {
    if (!isMultiStage) return undefined;
    const el = constellationMeasureRef.current;
    if (!el) return undefined;

    const updateWidth = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 180) setConstellationWrapWidth(Math.floor(w));
    };

    updateWidth();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateWidth);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [isMultiStage, stageTickers.length]);

  const currentAudit = hasActiveAudit ? audits[activeKey] : audits.KAS;
  const baseAccent = hasActiveAudit
    ? getGradeAccent(currentAudit.grade)
    : {
        primary: '#49EACB',
        secondary: '#34D399',
        softBg: 'rgba(73, 234, 203, 0.10)',
        secondarySoftBg: 'rgba(52, 211, 153, 0.10)',
        border: 'rgba(73, 234, 203, 0.32)',
        secondaryBorder: 'rgba(52, 211, 153, 0.28)',
        glow: 'rgba(73, 234, 203, 0.16)',
        secondaryGlow: 'rgba(52, 211, 153, 0.14)',
        gradientCss: 'linear-gradient(135deg, #49EACB 0%, #34D399 100%)',
        textOnAccent: '#041713'
      };
  const activeScanStage = CORE_SCAN_STAGES[scanStepIdx] || CORE_SCAN_STAGES[0];
  const currentStepResolvedColor = resolvedStepColors[scanStepIdx];
  const accent = isAuditing
    ? {
        primary: currentStepResolvedColor || activeScanStage.color,
        secondary: activeScanStage.color,
        softBg: activeScanStage.softBg,
        secondarySoftBg: activeScanStage.softBg,
        border: currentStepResolvedColor || activeScanStage.color,
        secondaryBorder: activeScanStage.color,
        glow: activeScanStage.glow,
        secondaryGlow: activeScanStage.glow,
        gradientCss: `linear-gradient(135deg, ${
          currentStepResolvedColor || activeScanStage.color
        } 0%, ${activeScanStage.color} 100%)`,
        textOnAccent: '#041713'
      }
    : baseAccent;

  const isSplitOpen =
    !isAuditing && hasActiveAudit && (isArenaHovered || isPinned || Boolean(hoveredInvId));

  const activeHoveredInvariant =
    currentAudit.invariants.find((i) => i.id === hoveredInvId) || null;
  const activeModalInvariant =
    currentAudit.invariants.find((i) => i.id === modalInvId) || currentAudit.invariants[0];
  const currentGeniusParagraphs = getGeniusForensicParagraphs(currentAudit);

  // Drives the harmonic wave perimeter on the center nucleus when collapsed,
  // and transfers that wave energy into the 6 invariant bubbles when expanded (isSplitOpen).
  // Any 0.0 score (Grade F or 0.0 invariant) remains completely flat (amplitude = 0).
  useEffect(() => {
    if ((!hasActiveAudit && !isAuditing) || isMultiStage) return undefined;
    const rawScore = Math.max(0, Math.min(6, Number(currentAudit?.totalScore) || 0));
    const isZeroFlat = rawScore === 0;

    const targetCenterAmp =
      isSplitOpen || isAuditing || isZeroFlat
        ? 0
        : 3.5 + Math.pow(rawScore / 6.0, 1.12) * 14.5;

    const invList = currentAudit?.invariants || [];
    const targetSatAmps = Array.from({ length: 6 }, (_, idx) => {
      const invScore = Math.max(0, Math.min(1, Number(invList[idx]?.score) || 0));
      if (!isSplitOpen || isAuditing || invScore <= 0) return 0;
      return 1.8 + Math.pow(invScore, 1.12) * 6.8;
    });

    const stepCenterAndSats = (dt = 1) => {
      let keepAnimating = false;

      // 1. Update Center Nucleus Wave
      const st = waveStateRef.current;
      st.amp += (targetCenterAmp - st.amp) * 0.16;
      if (Math.abs(targetCenterAmp - st.amp) < 0.04) {
        st.amp = targetCenterAmp;
      }

      const centerSpeed = (0.018 + (rawScore / 6.0) * 0.028) * 1.3 * Math.min(1.6, dt);
      if (st.amp > 0.01) {
        st.phase += centerSpeed;
      }

      if (mainWavePathRef.current) {
        mainWavePathRef.current.setAttribute(
          'd',
          buildFastWavePath(NUCLEUS_LUT_MAIN, 140, 140, 102, st.amp, st.phase, 0.82, 1.35)
        );
      }
      if (echoWavePathRef.current) {
        echoWavePathRef.current.setAttribute(
          'd',
          buildFastWavePath(NUCLEUS_LUT_ECHO, 140, 140, 106, st.amp * 0.78, -st.phase * 0.9, 0.82, 1.35)
        );
      }
      if (innerWavePathRef.current) {
        innerWavePathRef.current.setAttribute(
          'd',
          buildFastWavePath(NUCLEUS_LUT_INNER, 140, 140, 90, st.amp * 0.45, st.phase * 1.25, 0.82, 1.35)
        );
      }

      if (st.amp > 0.01 || Math.abs(targetCenterAmp - st.amp) > 0.01) {
        keepAnimating = true;
      }

      // 2. Update 6 Satellite Invariant Bubble Waves (when expanded)
      for (let idx = 0; idx < 6; idx++) {
        const satSt = satWaveStatesRef.current[idx];
        const tAmp = targetSatAmps[idx];
        const invScore = Math.max(0, Math.min(1, Number(invList[idx]?.score) || 0));

        satSt.amp += (tAmp - satSt.amp) * 0.16;
        if (Math.abs(tAmp - satSt.amp) < 0.03) {
          satSt.amp = tAmp;
        }

        const satSpeed = (0.02 + invScore * 0.032) * 1.3 * Math.min(1.6, dt);
        if (satSt.amp > 0.01) {
          satSt.phase += satSpeed;
        }

        const mainEl = satMainWaveRefs.current[idx];
        const echoEl = satEchoWaveRefs.current[idx];
        const innerEl = satInnerWaveRefs.current[idx];

        if (mainEl) {
          mainEl.setAttribute(
            'd',
            buildFastWavePath(SAT_LUT_MAIN, 70, 70, 45, satSt.amp, satSt.phase, 0.82, 1.35)
          );
        }
        if (echoEl) {
          echoEl.setAttribute(
            'd',
            buildFastWavePath(SAT_LUT_ECHO, 70, 70, 47.5, satSt.amp * 0.76, -satSt.phase * 0.88, 0.82, 1.35)
          );
        }
        if (innerEl) {
          innerEl.setAttribute(
            'd',
            buildFastWavePath(SAT_LUT_INNER, 70, 70, 39, satSt.amp * 0.44, satSt.phase * 1.22, 0.82, 1.35)
          );
        }

        if (satSt.amp > 0.01 || Math.abs(tAmp - satSt.amp) > 0.01) {
          keepAnimating = true;
        }
      }

      return keepAnimating;
    };

    if (!stepCenterAndSats(1)) return undefined;
    let unsub = null;
    unsub = subscribeSharedWave((dt) => {
      if (!stepCenterAndSats(dt) && unsub) {
        unsub();
        unsub = null;
      }
    }, 45);

    return () => {
      if (unsub) unsub();
    };
  }, [currentAudit, hasActiveAudit, isSplitOpen, isAuditing, isMultiStage]);

  const getActiveInvariantParagraph = (invObj, idx) => {
    if (!invObj) return '';
    if (!isGeniusMode) return invObj.paragraph;
    if (invObj.geniusParagraph) return invObj.geniusParagraph;
    return invObj.paragraph;
  };

  const triggerScanPulse = () => {
    setIsScanningPulse(true);
    setTimeout(() => setIsScanningPulse(false), 380);
  };

  // Animates the center circle sequentially through invariants 01 -> 06 with live code, "-" dash separator, & color shifts
  const runCoreScanSequence = async (tickerLabel, finalAuditObj) => {
    setScanProgressPct(3);
    for (let step = 0; step < 6; step++) {
      const stage = CORE_SCAN_STAGES[step];
      setScanStepIdx(step);
      setAuditStatusMsg(
        `[${stage.id}/06] Auditing ${stage.title} on $${tickerLabel}...`
      );
      for (let tick = 0; tick < 5; tick++) {
        setScanCodeTick(tick);
        const pct = Math.round(((step + (tick + 1) / 5.5) / 6) * 100);
        setScanProgressPct(pct);
        await new Promise((r) => setTimeout(r, 115));
      }
      if (finalAuditObj && finalAuditObj.invariants && finalAuditObj.invariants[step]) {
        const invScore = finalAuditObj.invariants[step].score;
        const stepColor = getScoreStyle(invScore).color;
        setResolvedStepColors((prev) => ({ ...prev, [step]: stepColor }));
        setScanProgressPct(Math.round(((step + 1) / 6) * 100));
        setAuditStatusMsg(
          `[${stage.id}/06] ${stage.shortName} Complete (-) -> ${formatScore(invScore)}/1.0`
        );
        await new Promise((r) => setTimeout(r, 150));
      }
    }
  };

  const selectCachedAuditRef = useRef(null);
  const togglePinTickerRef = useRef(null);

  const selectCachedAudit = (key) => {
    if (!audits[key] || isAuditing) return;
    setAuditError(null);
    setConfirmFullReauditKey(null);
    setHoveredInvId(null);
    setZeroTokenHits((c) => c + 1);

    if (validPinnedKeys.length > 0) {
      if (validPinnedKeys.includes(key)) {
        // Capture coordinates so unpinned bubble fades out gracefully while remaining bubbles glide
        if (stageTickers.length > 2) {
          const curLayout = getConstellationLayout(
            stageTickers.length,
            threeFormation,
            fourFormation
          );
          const idx = stageTickers.indexOf(key);
          if (idx !== -1 && curLayout.positions[idx] && audits[key]) {
            const ghostId = `${key}-${Date.now()}`;
            const ghostEntry = {
              ghostId,
              auditObj: audits[key],
              x: curLayout.positions[idx].x,
              y: curLayout.positions[idx].y,
              nodeScale: curLayout.nodeScale
            };
            setExitingPins((prev) => [...prev, ghostEntry]);
            setTimeout(() => {
              setExitingPins((prev) => prev.filter((g) => g.ghostId !== ghostId));
            }, 340);
          }
        }
        // Clicking an already-pinned bubble in the Pass/Fail list unpins it
        const nextPinned = validPinnedKeys.filter((k) => k !== key);
        setPinnedKeys(nextPinned);
        if (activeKey === key && nextPinned.length > 0) {
          setActiveKey(nextPinned[nextPinned.length - 1]);
        } else if (nextPinned.length === 0) {
          setActiveKey(key);
        }
        triggerScanPulse();
        return;
      }

      // When 1+ bubble is pinned, clicking another bubble pins it into the formation (up to 4)
      const nextPinned =
        validPinnedKeys.length < 4
          ? [...validPinnedKeys, key]
          : [...validPinnedKeys.slice(0, 3), key];
      setPinnedKeys(nextPinned);
      setActiveKey(key);
      triggerScanPulse();
      return;
    }

    setActiveKey(key);
    triggerScanPulse();
  };

  const togglePinTicker = (key) => {
    if (!audits[key] || isAuditing) return;
    setHoveredInvId(null);

    if (validPinnedKeys.includes(key)) {
      if (stageTickers.length > 2) {
        const curLayout = getConstellationLayout(
          stageTickers.length,
          threeFormation,
          fourFormation
        );
        const idx = stageTickers.indexOf(key);
        if (idx !== -1 && curLayout.positions[idx] && audits[key]) {
          const ghostId = `${key}-${Date.now()}`;
          const ghostEntry = {
            ghostId,
            auditObj: audits[key],
            x: curLayout.positions[idx].x,
            y: curLayout.positions[idx].y,
            nodeScale: curLayout.nodeScale
          };
          setExitingPins((prev) => [...prev, ghostEntry]);
          setTimeout(() => {
            setExitingPins((prev) => prev.filter((g) => g.ghostId !== ghostId));
          }, 340);
        }
      }
      const nextPinned = validPinnedKeys.filter((k) => k !== key);
      setPinnedKeys(nextPinned);
      if (activeKey === key && nextPinned.length > 0) {
        setActiveKey(nextPinned[nextPinned.length - 1]);
      }
      return;
    }

    // If nothing is pinned yet and user pins a different bubble via its badge, pin BOTH activeKey + key
    if (validPinnedKeys.length === 0 && key !== activeKey && audits[activeKey]) {
      setPinnedKeys([activeKey, key]);
      setActiveKey(key);
      triggerScanPulse();
      return;
    }

    const nextPinned =
      validPinnedKeys.length < 4
        ? [...validPinnedKeys, key]
        : [...validPinnedKeys.slice(0, 3), key];
    setPinnedKeys(nextPinned);
    setActiveKey(key);
    triggerScanPulse();
  };

  selectCachedAuditRef.current = selectCachedAudit;
  togglePinTickerRef.current = togglePinTicker;

  const stableSelectTicker = useCallback((tk) => {
    if (selectCachedAuditRef.current) selectCachedAuditRef.current(tk);
  }, []);

  const stableTogglePin = useCallback((tk) => {
    if (togglePinTickerRef.current) togglePinTickerRef.current(tk);
  }, []);

  const unpinFromConstellation = (key) => {
    if (isAuditing) return;
    setHoveredInvId(null);
    if (stageTickers.length > 2) {
      const curLayout = getConstellationLayout(
        stageTickers.length,
        threeFormation,
        fourFormation
      );
      const idx = stageTickers.indexOf(key);
      if (idx !== -1 && curLayout.positions[idx] && audits[key]) {
        const ghostId = `${key}-${Date.now()}`;
        const ghostEntry = {
          ghostId,
          auditObj: audits[key],
          x: curLayout.positions[idx].x,
          y: curLayout.positions[idx].y,
          nodeScale: curLayout.nodeScale
        };
        setExitingPins((prev) => [...prev, ghostEntry]);
        setTimeout(() => {
          setExitingPins((prev) => prev.filter((g) => g.ghostId !== ghostId));
        }, 340);
      }
    }
    const nextPinned = stageTickers.filter((k) => k !== key);
    setPinnedKeys(nextPinned.length <= 1 ? nextPinned : nextPinned);
    if (activeKey === key && nextPinned.length > 0) {
      setActiveKey(nextPinned[nextPinned.length - 1]);
    }
  };

  const copyTextToClipboard = (text, label) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedTarget(label);
      setTimeout(() => setCopiedTarget(null), 2200);
    } catch (_) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        setCopiedTarget(label);
        setTimeout(() => setCopiedTarget(null), 2200);
      }
    }
  };

  const formatXLongPost = (auditObj) => {
    if (isGeniusMode) {
      return getGeniusForensicParagraphs(auditObj).join('\n\n');
    }

    const header = `THE TRUTH — thermodynamic audit // ${auditObj.name.toUpperCase()} ($${
      auditObj.ticker
    })\nTerminal Grade: ${auditObj.grade} (${formatScore(
      auditObj.totalScore
    )} / 6.0) • ${auditObj.certainty}\nArchitecture: ${auditObj.architecture}\n`;

    const body = auditObj.invariants
      .map(
        (inv) =>
          `[${inv.id} // ${inv.title} — ${formatScore(inv.score)}/1.0]:\n${inv.paragraph}`
      )
      .join('\n\n');

    return `${header}\n${body}\n\n${auditObj.conclusion}`;
  };

  const formatSyncInvariantComparison = (invId) => {
    const invIdx = Math.max(0, Number(invId) - 1);
    const title = DEFAULT_TITLES[invIdx] || `Invariant ${invId}`;
    const modeLabel = isGeniusMode ? 'GENIUS FORENSIC' : 'NORMIE';
    const blocks = stageTickers
      .map((tk) => {
        const item = audits[tk];
        const inv = item?.invariants?.find((i) => i.id === invId);
        if (!item || !inv) return null;
        const body = getActiveInvariantParagraph(inv, invIdx);
        const rcpts = (inv.receipts || []).join(' • ');
        return `$${item.ticker} (${item.name} — Grade ${item.grade}, Total ${formatScore(
          item.totalScore
        )}/6.0)\n[${inv.id} ${inv.shortName}: ${formatScore(inv.score)}/1.0] • ${inv.telemetry}\n${body}${
          rcpts ? `\nReceipts: ${rcpts}` : ''
        }`;
      })
      .filter(Boolean)
      .join('\n\n---\n\n');

    return `THE TRUTH — thermodynamic audit // SYNCED INVARIANT ${invId}: ${title.toUpperCase()} (${modeLabel})\nCompared Assets: ${stageTickers
      .map((t) => `$${t}`)
      .join(' vs ')}\n\n${blocks}`;
  };

  // Exponential backoff fetch helper (1s, 2s, 4s) for Gemini API calls without noisy console retry errors
  const fetchGeminiWithBackoff = async (url, options) => {
    const delays = [1000, 2000, 4000];
    let lastError = null;
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        const res = await fetch(url, options);
        if (res.ok) return res;
        if (res.status !== 429 && res.status < 500 && attempt >= 1) {
          const errTxt = await res.text();
          throw new Error(`HTTP ${res.status}: ${errTxt.slice(0, 140)}`);
        }
        const errTxt = await res.text();
        lastError = new Error(`HTTP ${res.status}: ${errTxt.slice(0, 140)}`);
      } catch (err) {
        lastError = err;
      }
      if (attempt < delays.length) {
        await new Promise((r) => setTimeout(r, delays[attempt]));
      }
    }
    throw lastError || new Error('Gemini API request failed.');
  };

  // Stage 0: Live Google Search Grounding pull for fresh up-to-date protocol intelligence
  const fetchFreshGroundedWebIntel = async (targetQuery, existingBaseline = null) => {
    const apiKey = '';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const groundingQuery = `Perform an exhaustive forensic engineering & GitHub intelligence pull up through November 2026 for "${targetQuery}"${
      existingBaseline ? ` (${existingBaseline.name} / $${existingBaseline.ticker})` : ''
    }. Gather exact, verifiable receipts across all 6 physical invariants:
1. Genesis & Sovereignty: Exact premine/ICO/VC/foundation token splits, coinbase developer taxes/lockboxes, founding corporations, governance wars, and bridge/admin multisig keys.
2. Consensus & Cost Floor: Exact LIVE active mainnet block production mechanism (PoW hash algorithm, ASIC vs CPU share, block subsidy, max supply cap, fee burns/clawbacks—explicitly distinguishing live mainnet consensus from unactivated future proposals!).
3. Immutability: Exact GitHub repositories & source/config flags, header/PoPoW sync vs S3/snapshot sync, rolling finality checkpoints or max-reorg depth caps, node pruning horizon, and dated inflation/counterfeiting CVEs or ZK circuit soundness bugs.
4. Wartime Partition & Outages: Exact difficulty adjustment window or BFT supermajority halt threshold, behavior on >2h cable cut & resplice, and dated mainnet blackouts, stalls, chain splits, or bridge freezes.
5. State Topology: UTXO vs shared-account VM, covenant/script opcodes, unprunable nullifier/key-image bloat, mandatory state rent/reserves, and native Freeze/Clawback/DenyList hooks.
6. Velocity: Exact block interval (seconds & BPS), block size/weight cap, real non-vote L1 TPS, wallet spend locks, and linear orphan waste or indexer/attester lag.`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: groundingQuery }] }],
      tools: [{ google_search: {} }],
      generationConfig: {
        maxOutputTokens: 16384,
        temperature: 0.1
      },
      systemInstruction: {
        parts: [
          {
            text: 'You are a forensic cryptocurrency codebase and physical commodity researcher. Produce a detailed, high-density 6-section technical dossier packed with exact GitHub repository names, config constants, genesis/supply numbers, upgrade heights, CVEs, and dated incident postmortems from live Google Search results. Clearly separate live mainnet consensus from unactivated roadmap proposals.'
          }
        ]
      }
    };

    try {
      const res = await fetchGeminiWithBackoff(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      const candidate = result?.candidates?.[0];
      const intelText =
        candidate?.content?.parts
          ?.map((p) => p.text || '')
          .join('\n')
          .trim() || '';

      const rawAttributions = candidate?.groundingMetadata?.groundingAttributions || [];
      const rawChunks = candidate?.groundingMetadata?.groundingChunks || [];
      const combinedSources = [
        ...rawAttributions.map((a) => ({ uri: a?.web?.uri, title: a?.web?.title })),
        ...rawChunks.map((c) => ({ uri: c?.web?.uri, title: c?.web?.title }))
      ].filter((s) => s.uri && s.title);

      const seenUris = new Set();
      const uniqueSources = [];
      for (const src of combinedSources) {
        if (!seenUris.has(src.uri)) {
          seenUris.add(src.uri);
          uniqueSources.push(src);
        }
      }

      return { intelText, sources: uniqueSources.slice(0, 6) };
    } catch (_) {
      return { intelText: '', sources: [] };
    }
  };

  const isValidCompleteAudit = (parsed) =>
    Boolean(
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

  const executeGeminiStructuredAudit = async (
    targetQuery,
    onStreamProgress,
    freshIntelBundle = null,
    existingBaseline = null
  ) => {
    const apiKey = '';
    const modelName = 'gemini-3-flash-preview';

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

    const freshIntelContext =
      freshIntelBundle && freshIntelBundle.intelText
        ? `\nLIVE GOOGLE SEARCH GROUNDED INTELLIGENCE (RETRIEVED TODAY):\n${freshIntelBundle.intelText}\n`
        : '';
    const userPrompt = `Run a complete, rigorous 6-Invariant Thermodynamic Audit on the cryptocurrency network, token, Layer-2 overlay/channel protocol, OR physical metal/commodity: "${targetQuery}".
${baselineContext}${freshIntelContext}
IMPORTANT:
- If "${targetQuery}" refers to a physical metal or element (such as Gold, Silver, Platinum, Palladium, Copper, Rhodium, Uranium, etc.), audit the ACTUAL physical metal on the periodic table (classify consensusFamily as "PHYSICAL_COMMODITY")—NEVER substitute a cryptocurrency fork!
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

    const payload = {
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: GEMINI_SYSTEM_PROMPT }] },
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: GEMINI_SCHEMA,
        maxOutputTokens: 32768,
        temperature: 0.1
      }
    };

    // 1. Try real-time SSE streaming on gemini-3-flash-preview so progress follows each "-" invariant separator
    try {
      const streamEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`;
      const res = await fetchGeminiWithBackoff(streamEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = '';
        let accumulatedJson = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (!dataStr || dataStr === '[DONE]') continue;
            try {
              const chunkObj = JSON.parse(dataStr);
              const chunkText =
                chunkObj?.candidates?.[0]?.content?.parts
                  ?.map((p) => p.text || '')
                  .join('') || '';
              if (chunkText) {
                accumulatedJson += chunkText;
                if (onStreamProgress) {
                  onStreamProgress(inspectStreamedAuditProgress(accumulatedJson));
                }
              }
            } catch (_) {
              // Ignore partial SSE chunk parse errors
            }
          }
        }

        if (accumulatedJson.trim()) {
          const parsed = safeParseAuditJson(accumulatedJson);
          if (isValidCompleteAudit(parsed)) {
            return parsed;
          }
        }
      }
    } catch (_) {
      // Fall through to standard generateContent fallback
    }

    // 2. Fallback to standard non-streaming gemini-3-flash-preview endpoint with 32k token budget
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const fallbackRes = await fetchGeminiWithBackoff(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await fallbackRes.json();
    const textPart =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || '')
        .join('')
        .trim() || '';

    if (onStreamProgress && textPart) {
      onStreamProgress(inspectStreamedAuditProgress(textPart));
    }

    const parsed = safeParseAuditJson(textPart);
    if (!parsed || !Array.isArray(parsed.invariants) || parsed.invariants.length < 6) {
      throw new Error('Incomplete 6-invariant payload returned — please retry.');
    }
    return parsed;
  };

  // Shared live Google-Search-grounded audit & re-audit pipeline
  const performLiveGroundedAudit = async (rawQuery, existingBaseline = null) => {
    if (isAuditing) return;
    const normalized = rawQuery
      .replace(/^\$/, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    const displayTicker = existingBaseline?.ticker || normalized.slice(0, 8) || 'ASSET';
    const previousScore = existingBaseline ? Number(existingBaseline.totalScore) : null;

    setIsAuditing(true);
    setHoveredInvId(null);
    setAuditError(null);
    setScanTargetTicker(displayTicker);
    setScanStepIdx(0);
    setScanCodeTick(0);
    setScanProgressPct(2);
    setResolvedStepColors({});
    setAuditStatusMsg(
      `[WEB] Pulling fresh Google Search & GitHub telemetry for $${displayTicker}...`
    );

    const auditTracker = {
      unlockedCount: 0,
      colors: {},
      scores: {},
      done: false,
      failed: false,
      result: null,
      freshBundle: { intelText: '', sources: [] },
      error: null
    };

    const pipelinePromise = (async () => {
      const freshBundle = await fetchFreshGroundedWebIntel(
        existingBaseline ? `${existingBaseline.name} (${existingBaseline.ticker})` : rawQuery,
        existingBaseline
      );
      auditTracker.freshBundle = freshBundle;

      const parsed = await executeGeminiStructuredAudit(
        existingBaseline ? `${existingBaseline.name} (${existingBaseline.ticker})` : rawQuery,
        (streamState) => {
          if (!streamState) return;
          if (streamState.completedCount > auditTracker.unlockedCount) {
            auditTracker.unlockedCount = streamState.completedCount;
          }
          Object.assign(auditTracker.colors, streamState.completedColors);
          Object.assign(auditTracker.scores, streamState.completedScores);
        },
        freshBundle,
        existingBaseline
      );

      if (parsed && Array.isArray(parsed.invariants)) {
        const rawCostFloor = Math.max(0, Math.min(1, Number(parsed.invariants[1]?.score) || 0));
        const isZeroJoule =
          rawCostFloor <= 0 ||
          (parsed.consensusFamily === 'ZERO_JOULE_BFT' && rawCostFloor < 0.15);
        for (let i = 0; i < 6; i++) {
          const invObj = parsed.invariants[i] || {};
          const sc = isZeroJoule ? 0 : Math.max(0, Math.min(1, Number(invObj.score) || 0));
          auditTracker.scores[i] = sc;
          auditTracker.colors[i] = getScoreStyle(sc).color;
        }
      }
      auditTracker.unlockedCount = 6;
      auditTracker.result = parsed;
      auditTracker.done = true;
      return parsed;
    })().catch((err) => {
      auditTracker.error = err;
      auditTracker.failed = true;
    });

    try {
      for (let step = 0; step < 6; step++) {
        if (auditTracker.failed) break;
        const stage = CORE_SCAN_STAGES[step];
        setScanStepIdx(step);
        setAuditStatusMsg(
          step === 0 && !auditTracker.freshBundle.intelText && !auditTracker.done
            ? `[WEB + ${stage.id}/06] Pulling live intel & auditing ${stage.shortName} on $${displayTicker}...`
            : `[${stage.id}/06] Auditing ${stage.title} on $${displayTicker}...`
        );

        for (let tick = 0; tick < 4; tick++) {
          if (auditTracker.failed) break;
          setScanCodeTick(tick);
          const subPct = Math.round(((step + (tick + 1) * 0.18) / 6) * 100);
          setScanProgressPct((prev) => Math.max(prev, subPct));
          await new Promise((r) => setTimeout(r, 115));
        }

        let waitCycles = 0;
        while (
          !auditTracker.failed &&
          !auditTracker.done &&
          auditTracker.unlockedCount <= step &&
          waitCycles < 280
        ) {
          waitCycles++;
          setScanCodeTick((prev) => (prev + 1) % 4);
          const holdPct = Math.min(
            Math.round(((step + 0.86) / 6) * 100),
            Math.round(((step + 0.72 + Math.min(0.14, waitCycles * 0.005)) / 6) * 100)
          );
          setScanProgressPct((prev) => Math.max(prev, holdPct));
          await new Promise((r) => setTimeout(r, 125));
        }

        if (auditTracker.failed) break;

        setScanCodeTick(4);
        const stepColor = auditTracker.colors[step] || stage.color;
        setResolvedStepColors((prev) => ({ ...prev, [step]: stepColor }));
        setScanProgressPct(Math.round(((step + 1) / 6) * 100));
        const resolvedScore = auditTracker.scores[step];
        setAuditStatusMsg(
          resolvedScore !== undefined
            ? `[${stage.id}/06] ${stage.shortName} Complete (-) -> ${formatScore(resolvedScore)}/1.0`
            : `[${stage.id}/06] ${stage.shortName} Verified (-)`
        );
        await new Promise((r) => setTimeout(r, 140));
      }

      await pipelinePromise;

      if (auditTracker.failed || !auditTracker.result) {
        throw auditTracker.error || new Error('Audit engine returned an incomplete payload.');
      }

      const parsed = auditTracker.result;
      const stripTrailingDash = (val) =>
        String(val || '')
          .replace(/\s*-\s*$/, '')
          .trim();

      // Enforce Thermodynamic Zero-Joule Law: E = 0 => M = 0 and 0.0 across all 6 invariants.
      // Never wipe a live hardware PoW / physical asset (rawCostFloor >= 0.15) due to proposed hybrid-PoS news.
      const rawCostFloor = Math.max(0, Math.min(1, Number(parsed.invariants[1]?.score) || 0));
      const forceZeroJoule =
        rawCostFloor <= 0 ||
        (parsed.consensusFamily === 'ZERO_JOULE_BFT' && rawCostFloor < 0.15);

      const cleanInvariants = [0, 1, 2, 3, 4, 5].map((idx) => {
        const inv = parsed.invariants[idx] || {};
        const baselineInv = existingBaseline?.invariants?.[idx];
        const clampedScore = forceZeroJoule
          ? 0
          : Math.max(0, Math.min(1, Number(inv.score) || 0));
        const filteredReceipts = Array.isArray(inv.receipts)
          ? inv.receipts
              .map((r) => stripTrailingDash(r))
              .filter((r) => r && r !== '-')
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

      const validFamilies = [
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

      const detectedFamily = forceZeroJoule
        ? 'ZERO_JOULE_BFT'
        : isSequentialCarrierOverlay
        ? 'LINEAR_POW'
        : parsed.consensusFamily &&
          parsed.consensusFamily !== 'ZERO_JOULE_BFT' &&
          validFamilies.includes(parsed.consensusFamily)
        ? parsed.consensusFamily
        : existingBaseline?.consensusFamily &&
          existingBaseline.consensusFamily !== 'ZERO_JOULE_BFT'
        ? existingBaseline.consensusFamily
        : !isOverlay && cleanInvariants[5].score >= 0.85
        ? 'BLOCKDAG_POW'
        : 'LINEAR_POW';

      // Deterministic Rubric Guardrails: clamp any out-of-bracket invariant scores by consensus & carrier physics
      if (detectedFamily === 'ZERO_JOULE_BFT' || forceZeroJoule) {
        cleanInvariants.forEach((inv) => {
          inv.score = 0;
        });
      } else {
        // 01 Sovereignty: Zero-tolerance 0.00 for any genesis premine, ICO, VC allocation, protocol dev tax, or kill-switch
        const hasPremineOrPrealloc = parsed.hasGenesisPremineOrVcOrIco === true;
        const hasDevTaxOrKillSwitch = parsed.hasProtocolDevTaxOrKillSwitch === true;
        if (hasPremineOrPrealloc || hasDevTaxOrKillSwitch) {
          cleanInvariants[0].score = 0;
        } else if (isOverlay) {
          // Upper-layer overlays/channels max out at 0.75 (0.45–0.75 bracket) due to hub/LSP/indexer concentration
          cleanInvariants[0].score = Number(Math.min(0.75, cleanInvariants[0].score).toFixed(2));
        }

        // Energy-Arbitrage Law: Compromised Sovereignty (01 = 0.00) caps Cost Floor (02) inside 0.10–0.35
        if (cleanInvariants[0].score <= 0) {
          const arbitrageCap = hasPremineOrPrealloc ? (isOverlay ? 0.15 : 0.3) : 0.35;
          cleanInvariants[1].score = Number(
            Math.min(arbitrageCap, cleanInvariants[1].score).toFixed(2)
          );
        } else if (isOverlay) {
          // Off-chain channel hops / upper-layer overlays burn 0 Joules per hop; only L1 carrier anchors burn PoW
          cleanInvariants[1].score = Number(Math.min(0.35, cleanInvariants[1].score).toFixed(2));
        }

        if (isOverlay) {
          cleanInvariants[4].score = Number(Math.min(0.49, cleanInvariants[4].score).toFixed(2));
        }

        if (detectedFamily === 'BLOCKDAG_POW' && isOverlay) {
          // Overlays on an M = 1.0 BlockDAG carrier (inscriptions / based rollups) cannot claim native L1 1.00 velocity
          cleanInvariants[2].score = Number(Math.min(0.85, cleanInvariants[2].score).toFixed(2));
          cleanInvariants[3].score = Number(Math.min(0.9, cleanInvariants[3].score).toFixed(2));
          cleanInvariants[5].score = Number(
            Math.max(0.1, Math.min(0.2, cleanInvariants[5].score)).toFixed(2)
          );
        } else if (detectedFamily === 'LINEAR_POW') {
          if (isOverlay) {
            // Carrier-Subordinated Overlay Law: M_overlay < M_L1 < 1.0!
            // Unsettled off-chain channel state + watchtower/pinning risk + L1 exit bottleneck strictly < L1 carrier velocity
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
            // Native sequential single-chain ceilings from GRADING_RUBRIC_SPEC (M < 1.0)
            cleanInvariants[3].score = Number(Math.min(0.75, cleanInvariants[3].score).toFixed(2));
            cleanInvariants[4].score = Number(Math.min(0.9, cleanInvariants[4].score).toFixed(2));
            cleanInvariants[5].score = Number(
              Math.max(0.15, Math.min(0.45, cleanInvariants[5].score)).toFixed(2)
            );
          }
        } else if (detectedFamily === 'PHYSICAL_COMMODITY') {
          // Baryonic matter ceilings from GRADING_RUBRIC_SPEC
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
      // ALWAYS compute grade deterministically from deriveGradeFromTotal (including Sovereignty-Compromise cap <= D+)
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

      const builtAudit = {
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
        freshSources: auditTracker.freshBundle?.sources || [],
        isCustom: !PRELOADED_AUDITS[cleanTicker],
        isArchived: true,
        archivedAtMs: Date.now(),
        archiveRevision: (Number(existingBaseline?.archiveRevision) || 0) + 1,
        queryAliases: Array.from(
          new Set([cleanTicker, normalized, resolvedName.toUpperCase().replace(/[^A-Z0-9]/g, '')])
        ).filter(Boolean)
      };

      setScanTargetTicker(cleanTicker);
      setAudits((prev) => ({ ...prev, [cleanTicker]: builtAudit }));
      setPinnedKeys((prev) => {
        const cleanPrev = prev.filter(Boolean);
        if (cleanPrev.length === 0 || cleanPrev.includes(cleanTicker)) return cleanPrev;
        return cleanPrev.length < 4
          ? [...cleanPrev, cleanTicker]
          : [...cleanPrev.slice(0, 3), cleanTicker];
      });
      setActiveKey(cleanTicker);
      setConfirmFullReauditKey(null);
      setHoveredInvId(null);
      setSearchInput('');
      triggerScanPulse();

      const savedRemotely = await persistAuditToArchive(builtAudit, invLogs, [rawQuery, normalized]);
      flashArchiveToast(
        savedRemotely
          ? `Archived $${cleanTicker} to Shared Vault — future lookups cost 0 credits`
          : `Archived $${cleanTicker} in Session Vault — future lookups cost 0 credits`,
        'saved'
      );
    } catch (err) {
      setAuditError(
        `Unable to complete fresh grounded audit for "${rawQuery}" (${
          err.message || 'Check ticker and retry'
        }).`
      );
    } finally {
      setIsAuditing(false);
      setAuditStatusMsg('');
    }
  };

  const handleFreshReaudit = async (targetKey = activeKey, bypassConfirm = false) => {
    const targetObj = audits[targetKey] || currentAudit;
    if (!targetObj || isAuditing || singleInvBusy) return;

    if (strictCreditLock) {
      flashArchiveToast(
        `Strict Credit Shield is LOCKED — unlock in Archive menu to run full 6-invariant refreshes.`,
        'warn'
      );
      return;
    }

    // Credit-saving confirmation step before running an expensive full 6-invariant re-audit on an already-archived asset
    if (!bypassConfirm && confirmFullReauditKey !== targetObj.ticker) {
      setConfirmFullReauditKey(targetObj.ticker);
      return;
    }

    setConfirmFullReauditKey(null);
    if (modalInvId) setModalInvId(null);
    await performLiveGroundedAudit(targetObj.ticker, targetObj);
  };

  // Targeted Google Search Grounding for a SINGLE invariant (uses ~85% fewer tokens than full 6-inv scan)
  const fetchSingleInvariantWebIntel = async (targetAudit, invObj, customClaim = '') => {
    const apiKey = '';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const focusPrompt = customClaim
      ? `Fact-check this specific user claim/evidence regarding ${targetAudit.name} ($${targetAudit.ticker}) concerning ${invObj.title}: "${customClaim}". Verify exact GitHub commits, PRs, consensus parameters, mainnet status (live active mainnet vs unactivated proposal), CVEs, or postmortems up through November 2026.`
      : `Pull fresh engineering, GitHub repository, consensus parameter, and live mainnet intelligence up through November 2026 for ${targetAudit.name} ($${targetAudit.ticker}) strictly focused on ${invObj.title} (Current telemetry: ${invObj.telemetry}). Separate live active mainnet behavior from unactivated proposals.`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: focusPrompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: {
        maxOutputTokens: 16384,
        temperature: 0.1
      },
      systemInstruction: {
        parts: [
          {
            text: 'You are a concise forensic cryptocurrency codebase and commodity researcher. Return dense, verifiable facts citing exact repository names, config constants, block heights, dates, and live mainnet status.'
          }
        ]
      }
    };

    try {
      const res = await fetchGeminiWithBackoff(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      const candidate = result?.candidates?.[0];
      const intelText =
        candidate?.content?.parts
          ?.map((p) => p.text || '')
          .join('\n')
          .trim() || '';

      const rawAttributions = candidate?.groundingMetadata?.groundingAttributions || [];
      const rawChunks = candidate?.groundingMetadata?.groundingChunks || [];
      const combinedSources = [
        ...rawAttributions.map((a) => ({ uri: a?.web?.uri, title: a?.web?.title })),
        ...rawChunks.map((c) => ({ uri: c?.web?.uri, title: c?.web?.title }))
      ].filter((s) => s.uri && s.title);

      const seenUris = new Set();
      const uniqueSources = [];
      for (const src of combinedSources) {
        if (!seenUris.has(src.uri)) {
          seenUris.add(src.uri);
          uniqueSources.push(src);
        }
      }

      return { intelText, sources: uniqueSources.slice(0, 4) };
    } catch (_) {
      return { intelText: '', sources: [] };
    }
  };

  // Surgically updates one invariant on an asset while preserving all other 5 locked-in invariants & essays
  const applySingleInvariantPatch = (targetAudit, invIdx, patch, sources = [], sourceLabel = '1-Inv Re-Audit') => {
    const stripDash = (v) => String(v || '').replace(/\s*-\s*$/, '').trim();
    const prevInv = targetAudit.invariants[invIdx];
    const prevInvScore = Number(prevInv.score) || 0;
    const prevTotal = Number(targetAudit.totalScore) || 0;

    const clampedScore = clampSingleInvariantByPhysics(targetAudit, invIdx, patch.score, {
      hasGenesisPremineOrVcOrIco: patch.hasGenesisPremineOrVcOrIco,
      hasProtocolDevTaxOrKillSwitch: patch.hasProtocolDevTaxOrKillSwitch,
      carrierLayerOneVelocityCap: patch.carrierLayerOneVelocityCap
    });

    const timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const invDelta = Number((clampedScore - prevInvScore).toFixed(2));

    const cleanedReceipts = Array.isArray(patch.receipts)
      ? patch.receipts.map((r) => stripDash(r)).filter((r) => r && r !== '-').slice(0, 4)
      : [];

    const updatedSingleInv = {
      ...prevInv,
      score: clampedScore,
      telemetry: stripDash(patch.telemetry) || prevInv.telemetry,
      quickSummary: stripDash(patch.quickSummary) || prevInv.quickSummary,
      paragraph:
        stripDash(patch.paragraph).length >= 55 ? stripDash(patch.paragraph) : prevInv.paragraph,
      geniusParagraph:
        stripDash(patch.geniusParagraph).length >= 220
          ? stripDash(patch.geniusParagraph)
          : prevInv.geniusParagraph || prevInv.paragraph,
      receipts: cleanedReceipts.length > 0 ? cleanedReceipts : prevInv.receipts,
      lastSingleAuditAt: timeStamp,
      lastSingleAuditSource: sourceLabel,
      singleScoreDelta: invDelta
    };

    let nextInvariants = targetAudit.invariants.map((item, i) =>
      i === invIdx ? updatedSingleInv : item
    );

    // If Invariant 01 (Sovereignty) dropped to 0.00, enforce the Energy-Arbitrage Cap on Invariant 02 (Cost Floor)
    const nextSovereignty = Number(nextInvariants[0]?.score ?? 1);
    if (nextSovereignty <= 0 && Number(nextInvariants[1]?.score) > 0) {
      const maxArbFloor = patch.hasGenesisPremineOrVcOrIco === true ? 0.3 : 0.35;
      if (Number(nextInvariants[1].score) > maxArbFloor) {
        nextInvariants[1] = {
          ...nextInvariants[1],
          score: maxArbFloor
        };
      }
    }

    // If Invariant 02 (Cost Floor) dropped to 0.00, Zero-Joule Law zeroes all 6 invariants
    const nextCostFloor = Number(nextInvariants[1]?.score) || 0;
    if (nextCostFloor <= 0) {
      nextInvariants = nextInvariants.map((item) => ({ ...item, score: 0 }));
    }

    const nextTotal = Number(
      nextInvariants.reduce((sum, item) => sum + (Number(item.score) || 0), 0).toFixed(2)
    );
    const nextGrade = deriveGradeFromTotal(nextTotal, nextCostFloor, nextSovereignty);
    const nextFamily =
      nextCostFloor <= 0
        ? 'ZERO_JOULE_BFT'
        : targetAudit.consensusFamily === 'ZERO_JOULE_BFT'
        ? 'LINEAR_POW'
        : targetAudit.consensusFamily;

    // Surgically synchronize only the modified paragraph in the 6-paragraph Genius Essay
    const baseParas = [...getGeniusForensicParagraphs(targetAudit)];
    if (baseParas.length === 6) {
      if (invIdx >= 0 && invIdx <= 3) {
        baseParas[invIdx] = `Evaluating ${targetAudit.name} (${targetAudit.ticker}) on Invariant ${
          updatedSingleInv.id
        } — ${updatedSingleInv.title} (${formatScore(updatedSingleInv.score)}/1.0): ${
          updatedSingleInv.geniusParagraph
        } Verified telemetry: ${(updatedSingleInv.receipts || []).join(' • ')}.`;
      } else if (invIdx === 4 || invIdx === 5) {
        baseParas[4] = `Examining ${targetAudit.name}’s State Machine Topology (${formatScore(
          nextInvariants[4].score
        )}/1.0) and Thermodynamic Velocity (${formatScore(
          nextInvariants[5].score
        )}/1.0, M = 1.0 benchmark): ${nextInvariants[4].geniusParagraph} ${
          nextInvariants[5].geniusParagraph
        }`;
      }
      if (Math.abs(nextTotal - prevTotal) > 0.001) {
        baseParas[5] = `Evaluating these findings through the GRADE evidence certainty framework yields a ${
          targetAudit.certainty || 'HIGH CERTAINTY'
        } rating across all six physical invariants (${nextInvariants
          .map((i) => `${i.id}: ${formatScore(i.score)}`)
          .join(', ')}), resulting in a recalibrated score of ${formatScore(
          nextTotal
        )} out of 6.00 and a compliance grade of ${nextGrade}.`;
      }
    }

    const mergedSources = [...sources, ...(targetAudit.freshSources || [])].filter(
      (s, idx, arr) => s && s.uri && arr.findIndex((x) => x.uri === s.uri) === idx
    );

    const updatedAudit = {
      ...targetAudit,
      consensusFamily: nextFamily,
      invariants: nextInvariants,
      totalScore: nextTotal,
      grade: nextGrade,
      geniusParagraphs: baseParas.length === 6 ? baseParas : targetAudit.geniusParagraphs,
      lastFreshAuditAt: timeStamp,
      scoreDelta: Number((nextTotal - prevTotal).toFixed(2)),
      freshSources: mergedSources.slice(0, 8),
      isArchived: true,
      archivedAtMs: Date.now(),
      archiveRevision: (Number(targetAudit.archiveRevision) || 0) + 1
    };

    setAudits((prev) => ({ ...prev, [targetAudit.ticker]: updatedAudit }));
    return {
      updatedAudit,
      updatedSingleInv,
      prevInvScore,
      clampedScore,
      invDelta,
      nextTotal,
      nextGrade,
      timeStamp
    };
  };

  // ACTION 1: Low-Token Single-Invariant Fresh Re-Audit
  const handleSingleInvariantReaudit = async (invId) => {
    if (isAuditing || singleInvBusy) return;
    if (strictCreditLock) {
      setSingleInvNotice({
        type: 'warn',
        text: 'Strict Credit Shield is active — unlock in the Archive menu to run live fresh pulls.'
      });
      return;
    }
    const invIdx = currentAudit.invariants.findIndex((i) => i.id === invId);
    if (invIdx === -1) return;

    const targetAudit = currentAudit;
    const targetInv = targetAudit.invariants[invIdx];
    const rubricSpec = GRADING_RUBRIC_SPEC[invIdx];
    const logKey = `${targetAudit.ticker}:${invId}`;

    setSingleInvNotice(null);
    setSingleInvBusy({ key: logKey, mode: 'REAUDIT' });

    try {
      const freshBundle = await fetchSingleInvariantWebIntel(targetAudit, targetInv);
      const apiKey = '';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

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

      let parsed = null;
      for (let pass = 0; pass < 2; pass++) {
        const promptForPass =
          pass === 0
            ? singlePrompt
            : `${singlePrompt}\n\nCRITICAL: Keep internal thinking brief and ensure every JSON field and sentence is 100% finished with terminal punctuation.`;

        const res = await fetchGeminiWithBackoff(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: promptForPass }] }],
            systemInstruction: { parts: [{ text: GEMINI_SYSTEM_PROMPT }] },
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: SINGLE_INVARIANT_SCHEMA,
              maxOutputTokens: pass === 0 ? 24576 : 32768,
              temperature: 0.1
            }
          })
        });

        const data = await res.json();
        const candidate = data?.candidates?.[0];
        const finishReason = candidate?.finishReason;
        const rawText =
          candidate?.content?.parts
            ?.map((p) => p.text || '')
            .join('')
            .trim() || '';

        try {
          const attemptParsed = safeParseAuditJson(rawText, { strictComplete: pass === 0 });
          const noteTruncated = isResponseTextTruncated(attemptParsed?.verdictNote);
          const hitMaxTokens = finishReason === 'MAX_TOKENS';
          if ((!hitMaxTokens && !noteTruncated) || pass === 1) {
            parsed = attemptParsed;
            break;
          }
        } catch (parseErr) {
          if (pass === 1) throw parseErr;
        }
      }

      const outcome = applySingleInvariantPatch(
        targetAudit,
        invIdx,
        parsed,
        freshBundle.sources,
        'Low-Token 1-Inv Re-Audit'
      );

      const entry = {
        id: `${Date.now()}-reaudit`,
        kind: 'REAUDIT',
        timestamp: outcome.timeStamp,
        headline:
          outcome.invDelta === 0
            ? `Invariant ${invId} Confirmed at ${formatScore(outcome.clampedScore)} / 1.0`
            : `Invariant ${invId} Recalibrated: ${formatScore(outcome.prevInvScore)} → ${formatScore(
                outcome.clampedScore
              )} (${outcome.invDelta > 0 ? `+${formatScore(outcome.invDelta)}` : formatScore(outcome.invDelta)})`,
        verdictTag: outcome.invDelta === 0 ? 'CONFIRMED' : 'RECALIBRATED',
        userPrompt: null,
        body:
          parsed.verdictNote ||
          `Fresh single-invariant intelligence pull completed for $${targetAudit.ticker} on ${targetInv.title}.`,
        sources: freshBundle.sources
      };

      const filteredPrior = (invLogs[logKey] || []).filter(
        (item) => !(item.kind === 'REAUDIT' && isResponseTextTruncated(item.body))
      );
      const nextLogsMap = {
        ...invLogs,
        [logKey]: [entry, ...filteredPrior]
      };
      setInvLogs(nextLogsMap);
      await persistAuditToArchive(outcome.updatedAudit, nextLogsMap);
      flashArchiveToast(`Archived updated #${invId} on $${targetAudit.ticker}`, 'saved');
    } catch (err) {
      setSingleInvNotice({
        type: 'error',
        text: `Single-invariant re-audit failed (${err.message || 'Please retry'}).`
      });
    } finally {
      setSingleInvBusy(null);
    }
  };

  // ACTION 2 (Send Button A): Challenge Invariant Audit With New Information / Counter-Evidence
  const handleInvariantChallenge = async (invId, overrideClaim = null) => {
    if (isAuditing || singleInvBusy) return;
    const invIdx = currentAudit.invariants.findIndex((i) => i.id === invId);
    if (invIdx === -1) return;

    const targetAudit = currentAudit;
    const targetInv = targetAudit.invariants[invIdx];
    const logKey = `${targetAudit.ticker}:${invId}`;
    const rawClaim = String(
      overrideClaim !== null ? overrideClaim : invPromptInputs[logKey] || ''
    ).trim();

    if (!rawClaim) {
      setSingleInvNotice({
        type: 'warn',
        text: `Type your counter-evidence, GitHub commit/PR, or technical challenge into the box first — or click "Fresh 1-Inv Pull (#${invId})" for an automatic fresh pull.`
      });
      return;
    }

    // 0-Token Dedup Check: Reuse complete archived challenge verdicts at 0 credits (ignore any cut-off or stale-score entries)
    const normalizedClaim = rawClaim.toLowerCase().replace(/\s+/g, ' ');
    const currentFormattedInvScore = formatScore(targetInv.score);
    const existingChallengeHit =
      overrideClaim !== null
        ? null
        : (invLogs[logKey] || []).find(
            (item) =>
              item.kind === 'CHALLENGE' &&
              !isResponseTextTruncated(item.body) &&
              String(item.verdictTag || '').includes(currentFormattedInvScore) &&
              String(item.userPrompt || '')
                .toLowerCase()
                .replace(/\s+/g, ' ') === normalizedClaim
          );
    if (existingChallengeHit) {
      setZeroTokenHits((c) => c + 1);
      setSingleInvNotice({
        type: 'warn',
        text: `0-Credit Archive Hit: This exact challenge was already adjudicated below (${existingChallengeHit.verdictTag}).`
      });
      return;
    }

    if (strictCreditLock) {
      setSingleInvNotice({
        type: 'warn',
        text: 'Strict Credit Shield is active — unlock in the Archive menu to adjudicate new challenges.'
      });
      return;
    }

    setSingleInvNotice(null);
    setSingleInvBusy({ key: logKey, mode: 'CHALLENGE' });

    try {
      const freshBundle = await fetchSingleInvariantWebIntel(targetAudit, targetInv, rawClaim);
      const rubricSpec = GRADING_RUBRIC_SPEC[invIdx];
      const apiKey = '';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

      const challengePrompt = `A user is CHALLENGING the thermodynamic audit of ${targetAudit.name} ($${targetAudit.ticker}) on Invariant ${targetInv.id}: "${targetInv.title}" (Current Score: ${formatScore(
        targetInv.score
      )} / 1.0 • Current Invariant 02 Cost Floor: ${formatScore(
        targetAudit.invariants[1]?.score
      )} / 1.0 • Consensus Family: ${targetAudit.consensusFamily}).

USER CHALLENGE / NEW EVIDENCE SUBMITTED:
"${rawClaim}"

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

      let parsed = null;
      for (let pass = 0; pass < 2; pass++) {
        const promptForPass =
          pass === 0
            ? challengePrompt
            : `${challengePrompt}\n\nCRITICAL: Your previous attempt cut off mid-sentence. Keep internal reasoning brief and return complete, unabridged JSON where "rebuttalOrAnalysis" finishes its final sentence cleanly with a period.`;

        const res = await fetchGeminiWithBackoff(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: promptForPass }] }],
            systemInstruction: { parts: [{ text: GEMINI_SYSTEM_PROMPT }] },
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: CHALLENGE_INVARIANT_SCHEMA,
              maxOutputTokens: pass === 0 ? 24576 : 32768,
              temperature: 0.1
            }
          })
        });

        const data = await res.json();
        const candidate = data?.candidates?.[0];
        const finishReason = candidate?.finishReason;
        const rawText =
          candidate?.content?.parts
            ?.map((p) => p.text || '')
            .join('')
            .trim() || '';

        try {
          const attemptParsed = safeParseAuditJson(rawText, { strictComplete: pass === 0 });
          const rebuttalCutOff = isResponseTextTruncated(attemptParsed?.rebuttalOrAnalysis);
          const hitMaxTokens = finishReason === 'MAX_TOKENS';
          if ((!hitMaxTokens && !rebuttalCutOff) || pass === 1) {
            parsed = attemptParsed;
            break;
          }
        } catch (parseErr) {
          if (pass === 1) throw parseErr;
        }
      }

      const clampedTargetScore = clampSingleInvariantByPhysics(
        targetAudit,
        invIdx,
        parsed.scoreChanged ? parsed.updatedScore : targetInv.score,
        {
          hasGenesisPremineOrVcOrIco: parsed.hasGenesisPremineOrVcOrIco,
          hasProtocolDevTaxOrKillSwitch: parsed.hasProtocolDevTaxOrKillSwitch,
          carrierLayerOneVelocityCap: parsed.carrierLayerOneVelocityCap
        }
      );

      const prevScore = Number(targetInv.score) || 0;
      const didActuallyChangeScore = Math.abs(clampedTargetScore - prevScore) >= 0.01;
      const shouldPatchInvariant =
        didActuallyChangeScore || parsed.verdict === 'ACCEPTED' || parsed.verdict === 'PARTIAL';

      let timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let resultingAuditForArchive = targetAudit;
      if (shouldPatchInvariant) {
        const patchOutcome = applySingleInvariantPatch(
          targetAudit,
          invIdx,
          {
            score: clampedTargetScore,
            telemetry: parsed.updatedTelemetry || targetInv.telemetry,
            quickSummary: parsed.updatedQuickSummary || targetInv.quickSummary,
            paragraph: parsed.updatedParagraph || targetInv.paragraph,
            geniusParagraph:
              parsed.updatedGeniusParagraph || targetInv.geniusParagraph || targetInv.paragraph,
            receipts: parsed.updatedReceipts || targetInv.receipts,
            hasGenesisPremineOrVcOrIco: parsed.hasGenesisPremineOrVcOrIco,
            hasProtocolDevTaxOrKillSwitch: parsed.hasProtocolDevTaxOrKillSwitch,
            carrierLayerOneVelocityCap: parsed.carrierLayerOneVelocityCap
          },
          freshBundle.sources,
          'Challenge Adjudication'
        );
        timeStamp = patchOutcome.timeStamp;
        resultingAuditForArchive = patchOutcome.updatedAudit;
      }

      const effectiveVerdict =
        !didActuallyChangeScore && parsed.verdict === 'ACCEPTED' && parsed.scoreChanged
          ? 'REJECTED'
          : parsed.verdict || 'REJECTED';

      const entry = {
        id: `${Date.now()}-challenge`,
        kind: 'CHALLENGE',
        timestamp: timeStamp,
        verdictTag:
          effectiveVerdict === 'ACCEPTED'
            ? didActuallyChangeScore
              ? `ACCEPTED (${formatScore(prevScore)} → ${formatScore(clampedTargetScore)})`
              : 'ACCEPTED • EVIDENCE LOGGED'
            : effectiveVerdict === 'PARTIAL'
            ? didActuallyChangeScore
              ? `PARTIAL (${formatScore(prevScore)} → ${formatScore(clampedTargetScore)})`
              : `PARTIAL • SCORE ${formatScore(clampedTargetScore)} UPHELD`
            : `REJECTED • ${formatScore(prevScore)}/1.0 UPHELD`,
        verdictState: effectiveVerdict,
        headline:
          parsed.verdictHeadline ||
          (effectiveVerdict === 'REJECTED'
            ? `Challenge Rejected — Score ${formatScore(prevScore)}/1.0 Upheld`
            : `Challenge Evaluated — Score ${formatScore(clampedTargetScore)}/1.0`),
        userPrompt: rawClaim,
        body:
          parsed.rebuttalOrAnalysis ||
          'Challenge evaluated against the canonical 6-invariant thermodynamic rubric.',
        sources: freshBundle.sources
      };

      const filteredPrior = (invLogs[logKey] || []).filter(
        (item) =>
          !(
            item.kind === 'CHALLENGE' &&
            String(item.userPrompt || '')
              .toLowerCase()
              .replace(/\s+/g, ' ') === normalizedClaim &&
            (overrideClaim !== null || isResponseTextTruncated(item.body))
          )
      );

      const nextLogsMap = {
        ...invLogs,
        [logKey]: [entry, ...filteredPrior]
      };
      setInvLogs(nextLogsMap);
      if (overrideClaim === null) {
        setInvPromptInputs((prev) => ({ ...prev, [logKey]: '' }));
      }
      await persistAuditToArchive(resultingAuditForArchive, nextLogsMap);
      flashArchiveToast(`Contest verdict archived for $${targetAudit.ticker} #${invId}`, 'saved');
    } catch (err) {
      setSingleInvNotice({
        type: 'error',
        text: `Unable to adjudicate challenge (${err.message || 'Please retry'}).`
      });
    } finally {
      setSingleInvBusy(null);
    }
  };

  // ACTION 3 (Send Button B): Ask for More Breakdown on This Specific Invariant
  const handleInvariantBreakdown = async (invId, overrideQuestion = null) => {
    if (isAuditing || singleInvBusy) return;
    const invIdx = currentAudit.invariants.findIndex((i) => i.id === invId);
    if (invIdx === -1) return;

    const targetAudit = currentAudit;
    const targetInv = targetAudit.invariants[invIdx];
    const rubricSpec = GRADING_RUBRIC_SPEC[invIdx];
    const logKey = `${targetAudit.ticker}:${invId}`;
    const userQuestion = String(
      overrideQuestion !== null ? overrideQuestion : invPromptInputs[logKey] || ''
    ).trim();
    const expectedTag = isGeniusMode ? 'GENIUS DEEP-DIVE' : 'NORMIE BREAKDOWN';

    // 0-Token Archive Hit: Reuse complete archived breakdown if identical question already exists
    const existingBreakdown =
      overrideQuestion !== null
        ? null
        : (invLogs[logKey] || []).find(
            (item) =>
              item.kind === 'BREAKDOWN' &&
              !isResponseTextTruncated(item.body) &&
              item.verdictTag === expectedTag &&
              String(item.userPrompt || '')
                .trim()
                .toLowerCase() === userQuestion.toLowerCase()
          );
    if (existingBreakdown) {
      setZeroTokenHits((c) => c + 1);
      setSingleInvNotice({
        type: 'warn',
        text: `0-Credit Archive Hit: ${expectedTag} is already archived below. Type a new specific sub-question if you want a custom breakdown.`
      });
      return;
    }

    if (strictCreditLock) {
      setSingleInvNotice({
        type: 'warn',
        text: 'Strict Credit Shield is active — unlock in the Archive menu to generate new AI breakdowns.'
      });
      return;
    }

    setSingleInvNotice(null);
    setSingleInvBusy({ key: logKey, mode: 'BREAKDOWN' });

    try {
      const apiKey = '';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

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
  userQuestion
    ? `"${userQuestion}"`
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

        const res = await fetchGeminiWithBackoff(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: promptForPass }] }],
            systemInstruction: {
              parts: [
                {
                  text: 'You are "The Truth — thermodynamic audit". Deliver crystal-clear, technically unimpeachable single-invariant breakdowns anchored in Nakamoto Proof-of-Work, Landauer’s Principle, and verified codebase mechanics. Output clean plain-text paragraphs only, ensuring every sentence finishes completely.'
                }
              ]
            },
            generationConfig: {
              maxOutputTokens: pass === 0 ? 24576 : 32768,
              temperature: 0.15
            }
          })
        });

        const data = await res.json();
        const candidate = data?.candidates?.[0];
        const finishReason = candidate?.finishReason;
        const candidateText =
          candidate?.content?.parts
            ?.map((p) => p.text || '')
            .join('\n')
            .trim() || '';

        if (candidateText) {
          bodyText = candidateText;
        }
        if ((finishReason !== 'MAX_TOKENS' && !isResponseTextTruncated(bodyText)) || pass === 1) {
          break;
        }
      }

      const timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const entry = {
        id: `${Date.now()}-breakdown`,
        kind: 'BREAKDOWN',
        timestamp: timeStamp,
        verdictTag: expectedTag,
        headline: userQuestion
          ? `Deep-Dive Breakdown // ${targetInv.shortName}`
          : `Expanded Forensic Mechanics // ${targetInv.id} ${targetInv.shortName}`,
        userPrompt: userQuestion || null,
        body: bodyText,
        sources: []
      };

      const filteredPrior = (invLogs[logKey] || []).filter(
        (item) =>
          !(
            item.kind === 'BREAKDOWN' &&
            item.verdictTag === expectedTag &&
            String(item.userPrompt || '')
              .trim()
              .toLowerCase() === userQuestion.toLowerCase() &&
            (overrideQuestion !== null || isResponseTextTruncated(item.body))
          )
      );

      const nextLogsMap = {
        ...invLogs,
        [logKey]: [entry, ...filteredPrior]
      };
      setInvLogs(nextLogsMap);
      if (userQuestion && overrideQuestion === null) {
        setInvPromptInputs((prev) => ({ ...prev, [logKey]: '' }));
      }
      await persistAuditToArchive(targetAudit, nextLogsMap);
    } catch (err) {
      setSingleInvNotice({
        type: 'error',
        text: `Unable to generate breakdown (${err.message || 'Please retry'}).`
      });
    } finally {
      setSingleInvBusy(null);
    }
  };

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    const rawQuery = searchInput.trim();
    if (!rawQuery || isAuditing) return;

    const normalized = rawQuery
      .replace(/^\$/, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    const cachedKey = audits[normalized]
      ? normalized
      : ALIAS_MAP[normalized] && audits[ALIAS_MAP[normalized]]
      ? ALIAS_MAP[normalized]
      : dynamicAliases[normalized] && audits[dynamicAliases[normalized]]
      ? dynamicAliases[normalized]
      : Object.keys(audits).find((k) => {
          const cand = audits[k];
          if (!cand) return false;
          if (cand.name.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalized) return true;
          return Array.isArray(cand.queryAliases) && cand.queryAliases.includes(normalized);
        });

    // ARCHIVE HIT -> Instant 0-Token Load! Never burns API credits unless explicitly updated or contested.
    if (cachedKey) {
      const targetAudit = audits[cachedKey];
      setSearchInput('');
      setHoveredInvId(null);
      setAuditError(null);
      setConfirmFullReauditKey(null);
      setZeroTokenHits((c) => c + 1);

      if (validPinnedKeys.length > 0 && !validPinnedKeys.includes(cachedKey)) {
        const nextPinned =
          validPinnedKeys.length < 4
            ? [...validPinnedKeys, cachedKey]
            : [...validPinnedKeys.slice(0, 3), cachedKey];
        setPinnedKeys(nextPinned);
      }
      setActiveKey(cachedKey);
      triggerScanPulse();
      flashArchiveToast(
        `Archive Hit: Pulled $${targetAudit.ticker} (${targetAudit.grade}) from Vault • 0 API Credits Used`,
        'hit'
      );
      return;
    }

    if (strictCreditLock) {
      setAuditError(
        `Credit Shield Lock is ON: "${rawQuery}" is not in the archive yet. Unlock in the Archive menu to audit new unarchived tokens.`
      );
      return;
    }

    await performLiveGroundedAudit(rawQuery, null);
  };

  const scrollToWartimeSim = () => {
    setTimeout(() => {
      if (simAnchorRef.current) {
        simAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const stageSize = 440;
  const centerCoord = stageSize / 2;
  const orbitRadius = 152;

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#F3F4F6] flex flex-col justify-between relative overflow-x-hidden selection:bg-[#49EACB]/25 selection:text-[#49EACB] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');
        .font-sans { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        .font-display { font-family: 'Space Grotesk', 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace; }
        .spring-orbit {
          transition:
            transform 460ms cubic-bezier(0.20, 1.22, 0.32, 1),
            opacity 280ms ease,
            box-shadow 320ms ease,
            border-color 320ms ease;
        }
        .color-glide {
          transition:
            color 480ms cubic-bezier(0.22, 1, 0.36, 1),
            background-color 480ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 480ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 480ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 340ms ease,
            transform 340ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes selectContentFade {
          0% {
            opacity: 0.14;
            transform: scale(0.94) translateY(4px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-select-fade {
          animation: selectContentFade 340ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes cardCrossfade {
          0% {
            opacity: 0;
            transform: translateY(5px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-card-fade {
          animation: cardCrossfade 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes pinNodeAppear {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-pin-enter {
          animation: pinNodeAppear 400ms cubic-bezier(0.20, 1.18, 0.32, 1) both;
        }
        @keyframes stageCrossfade {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-stage-enter {
          animation: stageCrossfade 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes syncExpandDown {
          0% {
            opacity: 0;
            transform: translateY(-10px) scaleY(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
        }
        .animate-sync-expand-down {
          animation: syncExpandDown 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: top center;
        }
        @keyframes modalBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-modal-backdrop {
          animation: modalBackdropFade 220ms ease-out both;
        }
        @keyframes modalSheetPop {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.975);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-modal-sheet {
          animation: modalSheetPop 300ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes scanPulseRing {
          0% { transform: scale(0.88); opacity: 0.85; }
          100% { transform: scale(1.65); opacity: 0; }
        }
        .animate-scan-pulse {
          animation: scanPulseRing 360ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes dashFlow {
          to { stroke-dashoffset: -24; }
        }
        .sim-flow-line {
          animation: dashFlow 1.15s linear infinite;
        }
        @keyframes spinSlowCw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinSlowCcw {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .spin-cw {
          animation: spinSlowCw 9s linear infinite;
          transform-origin: center;
        }
        .spin-ccw {
          animation: spinSlowCcw 6.5s linear infinite;
          transform-origin: center;
        }
        .hero-search-dock {
          transition:
            transform 740ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 420ms ease;
          will-change: transform;
        }
        .hero-title-scale {
          transform-origin: bottom center;
          transition: transform 740ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }
        @keyframes bgFieldPulse {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale3d(0.95, 0.95, 1);
            opacity: 0.42;
          }
          50% {
            transform: translate3d(0, 0, 0) scale3d(1.06, 1.06, 1);
            opacity: 0.98;
          }
        }
        @keyframes bgCoreBreath {
          0%, 100% {
            transform: translate3d(-50%, -50%, 0) scale3d(0.84, 0.84, 1);
            opacity: 0.36;
          }
          50% {
            transform: translate3d(-50%, -50%, 0) scale3d(1.22, 1.22, 1);
            opacity: 0.95;
          }
        }
        @keyframes bgHaloWave {
          0% {
            transform: translate3d(-50%, -50%, 0) scale3d(0.74, 0.74, 1);
            opacity: 0;
          }
          42% {
            opacity: 0.5;
          }
          100% {
            transform: translate3d(-50%, -50%, 0) scale3d(1.46, 1.46, 1);
            opacity: 0;
          }
        }
        .bg-field-pulse {
          animation: bgFieldPulse var(--bg-pulse-dur, 4.4s) ease-in-out infinite;
          backface-visibility: hidden;
          will-change: transform, opacity;
        }
        .bg-core-breath {
          animation: bgCoreBreath var(--bg-pulse-dur, 4.4s) ease-in-out infinite;
          backface-visibility: hidden;
          will-change: transform, opacity;
        }
        .bg-halo-wave {
          animation: bgHaloWave var(--bg-pulse-dur, 4.4s) cubic-bezier(0.22, 1, 0.36, 1) infinite;
          backface-visibility: hidden;
          will-change: transform, opacity;
        }
        .bg-anim-paused .bg-field-pulse,
        .bg-anim-paused .bg-core-breath,
        .bg-anim-paused .bg-halo-wave {
          animation-play-state: paused;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Zero-Blur GPU-Composited Pulsing 1-Step Gradient Background */}
      {(() => {
        const pulseDur = isAuditing
          ? '2.2s'
          : isLandingIdle
          ? '4.4s'
          : Number(currentAudit?.totalScore) === 0
          ? '5.4s'
          : `${(4.6 - (Math.min(6, Number(currentAudit?.totalScore) || 0) / 6) * 1.1).toFixed(2)}s`;
        const coreBaseOpacity = isAuditing
          ? 0.36
          : isLandingIdle
          ? 0.27
          : Number(currentAudit?.totalScore) === 0
          ? 0.25
          : 0.32;

        return (
          <div
            className={`pointer-events-none fixed inset-0 overflow-hidden z-0 ${
              isAnyModalOpen ? 'bg-anim-paused' : ''
            }`}
            style={{ '--bg-pulse-dur': pulseDur, contain: 'strict' }}
          >
            {/* Full-Viewport Feathered Radial Vignette Pulse (Zero CSS Blur Filter) */}
            <div
              className="bg-field-pulse absolute inset-0"
              style={{
                background: `radial-gradient(circle at 50% 47%, ${accent.primary}29 0%, ${accent.secondary}14 42%, rgba(11, 12, 14, 0) 74%)`
              }}
            />

            {/* Pre-Feathered Multi-Stop Gradient Core & Halo Wave (Zero Gaussian Blur Rasterization) */}
            <div
              className="absolute inset-0"
              style={{
                opacity: coreBaseOpacity,
                transition: 'opacity 500ms ease'
              }}
            >
              <div
                className="bg-core-breath absolute left-1/2 top-[47%] w-[680px] h-[680px] sm:w-[980px] sm:h-[980px] rounded-full"
                style={{
                  background: `radial-gradient(circle, ${accent.primary}58 0%, ${accent.secondary}2E 32%, ${accent.secondary}0F 54%, rgba(11, 12, 14, 0) 72%)`
                }}
              />
              <div
                className="bg-halo-wave absolute left-1/2 top-[47%] w-[620px] h-[620px] sm:w-[900px] sm:h-[900px] rounded-full"
                style={{
                  background: `radial-gradient(circle, rgba(11, 12, 14, 0) 16%, ${accent.secondary}3B 42%, ${accent.primary}14 58%, rgba(11, 12, 14, 0) 72%)`
                }}
              />
            </div>
          </div>
        );
      })()}

      {/* =====================================================================
          1. EDITORIAL HEADER: Centered Google-Style on Open -> Slides Up on Audit
         ===================================================================== */}
      <header className="relative z-30 w-full pt-5 pb-2 px-3 sm:px-4 lg:px-4 xl:px-6 flex flex-col items-center">
        {/* TOP UTILITY BAR: Mode Slider, Rubric & Archive (Left) • Copy Audit (Right) */}
        <div className="relative z-30 w-full flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* LEFT: NORMIE / GENIUS MODE SLIDER + DETERMINISTIC RUBRIC + ARCHIVE */}
          <div className="pointer-events-auto flex flex-wrap items-center justify-center md:justify-start gap-2 w-full md:w-auto">
            <div
              className="p-0.5 rounded-full bg-[#121418] border border-white/10 flex items-center font-mono text-[11px] shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
              role="group"
              aria-label="Audit Depth Mode Switch"
            >
              <button
                type="button"
                onClick={() => setIsGeniusMode(false)}
                className={`color-glide px-3.5 py-1 rounded-full flex items-center gap-1.5 ${
                  !isGeniusMode
                    ? 'bg-[#1D212A] text-white font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span>NORMIE</span>
              </button>
              <button
                type="button"
                onClick={() => setIsGeniusMode(true)}
                className={`color-glide px-3.5 py-1 rounded-full flex items-center gap-1.5 ${
                  isGeniusMode ? 'font-bold shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                }`}
                style={
                  isGeniusMode
                    ? {
                        backgroundColor: accent.softBg,
                        color: accent.primary,
                        border: `1px solid ${accent.border}`
                      }
                    : { border: '1px solid transparent' }
                }
              >
                <Sparkles className="w-3 h-3" />
                <span>GENIUS</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsRubricOpen(true)}
              className="color-glide px-3 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[11px] text-neutral-300 hover:text-white flex items-center gap-1.5 shadow-sm"
              title="View Deterministic 6-Invariant Grading Rubric"
            >
              <BookOpen className="w-3.5 h-3.5 color-glide" style={{ color: accent.primary }} />
              <span>Rubric</span>
            </button>

            <button
              type="button"
              onClick={() => setIsArchiveModalOpen(true)}
              className="color-glide px-3 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[11px] text-neutral-300 hover:text-white flex items-center gap-1.5 shadow-sm"
              title="Thermodynamic Archive & API Credit Shield — Pulls cached & community-audited tokens at 0 API credits"
            >
              {strictCreditLock ? (
                <Lock className="w-3.5 h-3.5 color-glide" style={{ color: accent.secondary }} />
              ) : (
                <Database className="w-3.5 h-3.5 color-glide" style={{ color: accent.secondary }} />
              )}
              <span>Archive ({sortedTickers.length})</span>
              {zeroTokenHits > 0 && (
                <span
                  className="animate-card-fade color-glide px-1.5 py-0.2 rounded-full text-[9.5px] font-bold"
                  style={{
                    backgroundColor: accent.secondarySoftBg,
                    color: accent.secondary,
                    border: `1px solid ${accent.secondaryBorder}`
                  }}
                >
                  {zeroTokenHits} Free
                </span>
              )}
            </button>
          </div>

          {/* RIGHT: LIVE GAINS CHART + COPY [NORMIE / GENIUS] AUDIT ACTION */}
          <div className="pointer-events-auto flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setIsGainsModalOpen(true)}
              title="Open Live Thermodynamic Gains Chart — Passed (E > 0) vs. Failed (E = 0)"
              className="color-glide px-3.5 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 text-xs font-mono font-semibold text-neutral-200 hover:text-white flex items-center gap-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
            >
              <TrendingUp className="w-3.5 h-3.5 color-glide" style={{ color: accent.primary }} />
              <span>Live Gains</span>
              <span
                className="color-glide px-1.5 py-0.2 rounded-full text-[9.5px] font-bold"
                style={{
                  backgroundColor: accent.softBg,
                  color: accent.primary,
                  border: `1px solid ${accent.border}`
                }}
              >
                12x E&gt;0
              </span>
            </button>

            {hasActiveAudit && (
              <button
                type="button"
                onClick={() => copyTextToClipboard(formatXLongPost(currentAudit), 'header-x')}
                className="animate-card-fade color-glide px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm hover:brightness-110"
                style={{
                  backgroundColor: accent.softBg,
                  color: accent.primary,
                  border: `1px solid ${accent.border}`
                }}
              >
                {copiedTarget === 'header-x' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isGeniusMode ? 'Copy Genius Audit' : 'Copy Normie Audit'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* HERO LOCKUP + SEARCH BAR: Centered on initial load, smoothly slides up to top when audit starts */}
        <div
          className={`hero-search-dock relative z-[25] w-full flex flex-col items-center gap-3.5 mt-3 lg:-mt-9 pointer-events-none ${
            isLandingIdle
              ? 'translate-y-[15vh] sm:translate-y-[22vh] md:translate-y-[27vh]'
              : 'translate-y-0'
          }`}
        >
          {/* CENTER: "The Truth" + COLOR-CODED "thermodynamic audit" SUBTITLE */}
          <div
            onClick={() => {
              if (!isLandingIdle && !isAuditing) {
                setActiveKey(null);
                setPinnedKeys([]);
                setHoveredInvId(null);
                setExpandedSyncInvId(null);
                setConfirmFullReauditKey(null);
              }
            }}
            title={!isLandingIdle && !isAuditing ? 'Return to centered search' : undefined}
            className={`hero-title-scale pointer-events-auto flex flex-col items-center justify-center text-center select-none ${
              isLandingIdle ? 'scale-[1.22] sm:scale-[1.36] mb-1.5' : 'scale-100 cursor-pointer'
            }`}
          >
            <div className="relative inline-flex items-center justify-center">
              <span
                className="color-glide absolute -left-5 w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: accent.primary,
                  boxShadow: `0 0 12px ${accent.primary}`
                }}
              />
              <h1 className="font-display text-2xl sm:text-[30px] font-bold tracking-tight text-white leading-none">
                The Truth
              </h1>
            </div>
            <span
              className="color-glide mt-1.5 font-mono text-[11px] sm:text-xs lowercase tracking-[0.24em] font-medium"
              style={{
                color: accent.secondary,
                textShadow: `0 0 16px ${accent.glow}`
              }}
            >
              thermodynamic audit
            </span>
          </div>

          {/* Minimal Pill Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className={`pointer-events-auto w-full transition-all duration-700 ${
              isLandingIdle
                ? 'max-w-xl md:max-w-[356px] lg:max-w-[500px] xl:max-w-xl'
                : 'max-w-xl md:max-w-[356px] lg:max-w-[500px] xl:max-w-xl'
            } relative`}
          >
            <div
              className="color-glide flex items-center rounded-full bg-[#121418]/[0.96] px-4 py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.55)]"
              style={{
                border: `1px solid ${isAuditing ? accent.primary : 'rgba(255,255,255,0.1)'}`
              }}
            >
              <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-3" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Audit any crypto OR physical metal (e.g., GOLD, SILVER, PLATINUM, KAS, BTC, SOL)..."
                className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-mono"
              />
              {isAuditing ? (
                <span
                  className="color-glide px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1.5 shrink-0"
                  style={{ color: accent.primary }}
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Auditing</span>
                </span>
              ) : (
                <button
                  type="submit"
                  className="color-glide px-3.5 py-1 rounded-full text-xs font-mono font-semibold shrink-0 hover:brightness-110 flex items-center gap-1"
                  style={{
                    backgroundImage: accent.gradientCss,
                    color: accent.textOnAccent
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Audit / Pull</span>
                </button>
              )}
            </div>
          </form>

          {archiveToast && !isAuditing && (
            <div
              className="pointer-events-auto animate-card-fade color-glide max-w-xl md:max-w-[360px] lg:max-w-[500px] xl:max-w-xl px-4 py-1.5 rounded-full font-mono text-[11px] flex items-center justify-center gap-2 text-center bg-[#121418]/95"
              style={{
                border: `1px solid ${
                  archiveToast.tone === 'warn' ? accent.secondaryBorder : accent.border
                }`,
                color: archiveToast.tone === 'warn' ? accent.secondary : accent.primary
              }}
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span>{archiveToast.text}</span>
            </div>
          )}

          {(auditStatusMsg || auditError) && (
            <div className="pointer-events-auto w-full max-w-xl md:max-w-[360px] lg:max-w-[500px] xl:max-w-xl">
              {auditStatusMsg && (
                <div
                  className="px-4 py-2.5 rounded-2xl bg-[#121418] text-xs font-mono space-y-2"
                  style={{ border: `1px solid ${accent.border}`, color: accent.primary }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span className="truncate">{auditStatusMsg}</span>
                    </div>
                    <span className="text-[11px] font-bold shrink-0">{scanProgressPct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${scanProgressPct}%`,
                        backgroundImage: accent.gradientCss,
                        boxShadow: `0 0 10px ${accent.primary}`
                      }}
                    />
                  </div>
                </div>
              )}
              {auditError && (
                <div
                  className="px-4 py-2.5 rounded-2xl bg-[#121418] text-xs font-mono flex items-center justify-between gap-3"
                  style={{
                    border: `1px solid ${accent.secondaryBorder}`,
                    color: accent.secondary
                  }}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: accent.primary }} />
                    <span>{auditError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuditError(null)}
                    className="text-neutral-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* =====================================================================
          2. STATIC LEFT (PASSED // E > 0) & STATIC RIGHT (FAILED // E = 0) COLUMNS
             Fixed on md+ so they never move when orbits or constellations expand/retract
         ===================================================================== */}
      {!isMobileViewport && (
        <>
          <aside className="hidden md:flex md:fixed md:left-3 lg:left-4 xl:left-6 md:top-[148px] lg:top-[116px] md:w-[176px] lg:w-[212px] xl:w-[250px] md:max-h-[calc(100vh-190px)] lg:max-h-[calc(100vh-156px)] z-30 rounded-3xl bg-[#121418]/[0.92] border border-white/[0.06] p-3 lg:p-3.5 xl:p-4 flex-col items-center shadow-[0_14px_36px_rgba(0,0,0,0.5)]">
            <div className="w-full shrink-0 flex items-center justify-between pb-3 mb-2 border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-[#49EACB] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#49EACB] shadow-[0_0_8px_#49EACB]" />
                <span>Passed // E &gt; 0</span>
              </span>
              <span className="text-neutral-500 hidden xl:inline">{passedTickers.length} Harmonic</span>
              <span className="text-neutral-500 xl:hidden">{passedTickers.length}</span>
            </div>

            <div className="w-full overflow-y-auto no-scrollbar flex flex-wrap items-center justify-center gap-2 lg:gap-3 xl:gap-3.5 px-1 py-2">
              {passedTickers.map((tk, idx) => (
                <HarmonicProjectBubble
                  key={tk}
                  item={audits[tk]}
                  isSelected={activeKey === tk}
                  isPinnedItem={
                    isMultiStage ? stageTickers.includes(tk) : validPinnedKeys.includes(tk)
                  }
                  onSelectTicker={stableSelectTicker}
                  onTogglePin={stableTogglePin}
                  seedIndex={idx}
                />
              ))}
            </div>
          </aside>

          <aside className="hidden md:flex md:fixed md:right-3 lg:right-4 xl:right-6 md:top-[148px] lg:top-[116px] md:w-[176px] lg:w-[212px] xl:w-[250px] md:max-h-[calc(100vh-190px)] lg:max-h-[calc(100vh-156px)] z-30 rounded-3xl bg-[#121418]/[0.92] border border-white/[0.06] p-3 lg:p-3.5 xl:p-4 flex-col items-center shadow-[0_14px_36px_rgba(0,0,0,0.5)]">
            <div className="w-full shrink-0 flex items-center justify-between pb-3 mb-2 border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-[#EF4444] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]" />
                <span>Failed // E = 0</span>
              </span>
              <span className="text-neutral-500 hidden xl:inline">{failedTickers.length} Flatlined</span>
              <span className="text-neutral-500 xl:hidden">{failedTickers.length}</span>
            </div>

            <div className="w-full overflow-y-auto no-scrollbar flex flex-wrap items-center justify-center gap-2 lg:gap-3 xl:gap-3.5 px-1 py-2">
              {failedTickers.map((tk, idx) => (
                <HarmonicProjectBubble
                  key={tk}
                  item={audits[tk]}
                  isSelected={activeKey === tk}
                  isPinnedItem={
                    isMultiStage ? stageTickers.includes(tk) : validPinnedKeys.includes(tk)
                  }
                  onSelectTicker={stableSelectTicker}
                  onTogglePin={stableTogglePin}
                  seedIndex={idx + 50}
                />
              ))}
            </div>
          </aside>
        </>
      )}

      {/* =====================================================================
          2B. CENTER ARENA (BLANK GOOGLE-STYLE LANDING, SINGLE SPHERE, OR 2–4 CONSTELLATIONS)
         ===================================================================== */}
      <main className="relative z-10 flex-1 w-full px-4 md:pl-[196px] md:pr-[196px] lg:pl-[244px] lg:pr-[244px] xl:pl-[290px] xl:pr-[290px] pt-2 pb-6 flex flex-col items-center justify-start">
        {isLandingIdle ? (
          <div
            className="w-full min-h-[46vh] md:min-h-[62vh] pointer-events-none"
            aria-hidden="true"
          />
        ) : isMultiStage ? (
          (() => {
            const count = stageTickers.length;
            const layout = getConstellationLayout(count, threeFormation, fourFormation);
            const responsiveScale = Math.min(
              1,
              Math.max(0.32, (constellationWrapWidth - 8) / layout.width)
            );
            const scaledArenaHeight = Math.round(layout.height * responsiveScale);

            return (
              <div className="animate-stage-enter w-full flex flex-col items-center gap-5">
                {/* Constellation Control & Geometry Formation Bar */}
                <div className="w-full max-w-5xl rounded-2xl bg-[#121418]/90 border border-white/10 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
                  {/* Pinned Bubble Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mr-1">
                      Pinned ({count}/4):
                    </span>
                    {stageTickers.map((tk) => {
                      const item = audits[tk];
                      if (!item) return null;
                      const itemAcc = getGradeAccent(item.grade);
                      const isCurr = activeKey === tk;
                      return (
                        <div
                          key={tk}
                          className="animate-card-fade color-glide inline-flex items-center rounded-full font-mono text-[11px]"
                          style={{
                            backgroundColor: isCurr ? itemAcc.softBg : '#0B0C0E',
                            border: `1px solid ${isCurr ? itemAcc.border : 'rgba(255,255,255,0.1)'}`,
                            color: itemAcc.primary,
                            boxShadow: isCurr ? `0 0 12px ${itemAcc.glow}` : 'none'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveKey(tk)}
                            className="pl-2.5 pr-1.5 py-0.5 font-semibold hover:brightness-110 transition"
                          >
                            ${item.ticker} {item.grade}
                          </button>
                          <button
                            type="button"
                            onClick={() => unpinFromConstellation(tk)}
                            title={`Remove $${item.ticker}`}
                            className="pr-2 pl-0.5 py-0.5 text-neutral-400 hover:text-white transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Formation Switcher: Side-by-Side / Triangle / Square / Rhombus */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {count === 2 && (
                      <div className="px-2.5 py-1 rounded-full bg-[#0B0C0E] border border-white/10 font-mono text-[10.5px] text-neutral-300 flex items-center gap-1.5">
                        <Columns className="w-3 h-3 color-glide" style={{ color: accent.primary }} />
                        <span>Side-by-Side</span>
                        <span className="text-neutral-500 hidden xl:inline">
                          • Pin 1–2 more for △ / □ / ◇
                        </span>
                      </div>
                    )}

                    {count === 3 && (
                      <div className="p-0.5 rounded-full bg-[#0B0C0E] border border-white/10 flex items-center font-mono text-[10.5px]">
                        <button
                          type="button"
                          onClick={() => setThreeFormation('TRIANGLE')}
                          className={`px-2.5 py-1 rounded-full transition flex items-center gap-1.5 ${
                            threeFormation === 'TRIANGLE'
                              ? 'bg-[#191E27] text-white font-semibold border border-white/15'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <svg viewBox="0 0 12 12" className="w-3 h-3 stroke-current fill-none" strokeWidth="1.6">
                            <polygon points="6,1.5 11,10.2 1,10.2" />
                          </svg>
                          <span>Triangle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setThreeFormation('SIDE_BY_SIDE')}
                          className={`px-2.5 py-1 rounded-full transition flex items-center gap-1.5 ${
                            threeFormation === 'SIDE_BY_SIDE'
                              ? 'bg-[#191E27] text-white font-semibold border border-white/15'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <Columns className="w-3 h-3" />
                          <span>Side-by-Side</span>
                        </button>
                      </div>
                    )}

                    {count === 4 && (
                      <div className="p-0.5 rounded-full bg-[#0B0C0E] border border-white/10 flex items-center font-mono text-[10.5px]">
                        <button
                          type="button"
                          onClick={() => setFourFormation('RHOMBUS')}
                          className={`px-2.5 py-1 rounded-full transition flex items-center gap-1.5 ${
                            fourFormation === 'RHOMBUS'
                              ? 'bg-[#191E27] text-white font-semibold border border-white/15'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <svg viewBox="0 0 12 12" className="w-3 h-3 stroke-current fill-none" strokeWidth="1.6">
                            <polygon points="6,1 11,6 6,11 1,6" />
                          </svg>
                          <span>Rhombus</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFourFormation('SQUARE')}
                          className={`px-2.5 py-1 rounded-full transition flex items-center gap-1.5 ${
                            fourFormation === 'SQUARE'
                              ? 'bg-[#191E27] text-white font-semibold border border-white/15'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <svg viewBox="0 0 12 12" className="w-3 h-3 stroke-current fill-none" strokeWidth="1.6">
                            <rect x="1.8" y="1.8" width="8.4" height="8.4" rx="1" />
                          </svg>
                          <span>Square</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFourFormation('SIDE_BY_SIDE')}
                          className={`px-2.5 py-1 rounded-full transition flex items-center gap-1.5 ${
                            fourFormation === 'SIDE_BY_SIDE'
                              ? 'bg-[#191E27] text-white font-semibold border border-white/15'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <Columns className="w-3 h-3" />
                          <span>Side-by-Side</span>
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandAllOrbits((p) => !p)}
                      className="px-2.5 py-1 rounded-full bg-[#0B0C0E] hover:bg-[#181C24] border border-white/10 font-mono text-[10.5px] text-neutral-300 hover:text-white transition"
                    >
                      {expandAllOrbits ? '6-Inv Orbits: Open' : 'Harmonic Waves'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPinnedKeys([]);
                        setHoveredInvId(null);
                        setExpandedSyncInvId(null);
                      }}
                      className="color-glide px-2.5 py-1 rounded-full bg-[#0B0C0E] hover:bg-[#181C24] font-mono text-[10.5px] hover:text-white transition flex items-center gap-1"
                      style={{
                        border: `1px solid ${accent.secondaryBorder}`,
                        color: accent.secondary
                      }}
                    >
                      <X className="w-3 h-3" />
                      <span>Clear Pins</span>
                    </button>
                  </div>
                </div>

                {/* Geometric Constellation Stage (Side-by-Side / Triangle / Square / Rhombus) */}
                <div
                  ref={constellationMeasureRef}
                  className="w-full flex justify-center overflow-visible transition-[height] duration-500 ease-out"
                  style={{ height: `${scaledArenaHeight}px` }}
                >
                  <div
                    className="relative shrink-0 transition-all duration-500 ease-out"
                    style={{
                      width: `${layout.width}px`,
                      height: `${layout.height}px`,
                      transform: `scale(${responsiveScale})`,
                      transformOrigin: 'top center'
                    }}
                  >
                    {/* SVG Geometric Constellation Vectors */}
                    <svg
                      width={layout.width}
                      height={layout.height}
                      viewBox={`0 0 ${layout.width} ${layout.height}`}
                      className="absolute inset-0 pointer-events-none z-10"
                    >
                      {layout.diagonals.map(([aIdx, bIdx], dIdx) => {
                        const pA = layout.positions[aIdx];
                        const pB = layout.positions[bIdx];
                        if (!pA || !pB) return null;
                        return (
                          <line
                            key={`diag-${dIdx}`}
                            x1={pA.x}
                            y1={pA.y}
                            x2={pB.x}
                            y2={pB.y}
                            stroke="rgba(255,255,255,0.11)"
                            strokeWidth="1"
                            strokeDasharray="3 7"
                          />
                        );
                      })}

                      {layout.edges.map(([aIdx, bIdx], eIdx) => {
                        const pA = layout.positions[aIdx];
                        const pB = layout.positions[bIdx];
                        const audA = audits[stageTickers[aIdx]];
                        const audB = audits[stageTickers[bIdx]];
                        if (!pA || !pB || !audA || !audB) return null;
                        const colA = getGradeAccent(audA.grade).primary;
                        const colB = getGradeAccent(audB.grade).primary;
                        const gradId = `constellationEdge-${eIdx}`;
                        const midX = (pA.x + pB.x) / 2;
                        const midY = (pA.y + pB.y) / 2;
                        const delta = Math.abs(
                          (Number(audA.totalScore) || 0) - (Number(audB.totalScore) || 0)
                        );

                        return (
                          <g key={`edge-${eIdx}`} className="animate-card-fade">
                            <defs>
                              <linearGradient
                                id={gradId}
                                x1={pA.x}
                                y1={pA.y}
                                x2={pB.x}
                                y2={pB.y}
                                gradientUnits="userSpaceOnUse"
                              >
                                <stop
                                  offset="0%"
                                  style={{ stopColor: colA, stopOpacity: 0.48 }}
                                />
                                <stop
                                  offset="100%"
                                  style={{ stopColor: colB, stopOpacity: 0.48 }}
                                />
                              </linearGradient>
                            </defs>
                            <line
                              x1={pA.x}
                              y1={pA.y}
                              x2={pB.x}
                              y2={pB.y}
                              stroke={`url(#${gradId})`}
                              strokeWidth="1.6"
                              strokeDasharray="6 6"
                              className="sim-flow-line"
                            />
                            <rect
                              x={midX - 26}
                              y={midY - 9}
                              width="52"
                              height="18"
                              rx="9"
                              fill="#0B0C0E"
                              stroke="rgba(255,255,255,0.14)"
                              strokeWidth="1"
                            />
                            <text
                              x={midX}
                              y={midY + 3.2}
                              textAnchor="middle"
                              fill="#D1D5DB"
                              fontSize="8.5"
                              fontFamily="JetBrains Mono, monospace"
                              fontWeight="600"
                            >
                              Δ {formatScore(delta)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* Gracefully Fading-Out Unpinned Ghost Spheres */}
                    {exitingPins.map((ghost) => (
                      <PinnedOrbitalNode
                        key={ghost.ghostId}
                        auditObj={ghost.auditObj}
                        x={ghost.x}
                        y={ghost.y}
                        nodeScale={ghost.nodeScale}
                        isFocused={false}
                        isExiting
                        expandOrbits={expandAllOrbits}
                        hoveredInvId={null}
                        onHoverInv={() => {}}
                        onFocusBubble={() => {}}
                        onUnpin={() => {}}
                        onOpenInvariantModal={() => {}}
                        seedOffset={0}
                      />
                    ))}

                    {/* Pinned Thermodynamic Orbital Spheres */}
                    {stageTickers.map((tk, idx) => {
                      const item = audits[tk];
                      const pos = layout.positions[idx] || { x: layout.width / 2, y: layout.height / 2 };
                      if (!item) return null;

                      return (
                        <PinnedOrbitalNode
                          key={tk}
                          auditObj={item}
                          x={pos.x}
                          y={pos.y}
                          nodeScale={layout.nodeScale}
                          isFocused={activeKey === tk}
                          expandOrbits={expandAllOrbits}
                          hoveredInvId={hoveredInvId || expandedSyncInvId}
                          onHoverInv={setHoveredInvId}
                          onFocusBubble={() => setActiveKey(tk)}
                          onUnpin={() => unpinFromConstellation(tk)}
                          onOpenInvariantModal={(invId) => {
                            setActiveKey(tk);
                            setEssayViewMode(false);
                            setModalInvId(invId);
                          }}
                          seedOffset={idx * 1.7}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Synchronized Cross-Bubble Invariant Matrix Bar */}
                <div className="w-full max-w-5xl space-y-3">
                  <div
                    onMouseLeave={() => {
                      if (expandedSyncInvId) {
                        setHoveredInvId(expandedSyncInvId);
                      }
                    }}
                    className="flex flex-wrap items-center justify-center gap-1.5"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mr-1">
                      Sync Invariant:
                    </span>
                    {DEFAULT_SHORT_NAMES.map((sName, idx) => {
                      const idStr = `0${idx + 1}`;
                      const isExpanded = expandedSyncInvId === idStr;
                      const isHov = hoveredInvId === idStr;
                      return (
                        <button
                          key={idStr}
                          type="button"
                          onMouseEnter={() => setHoveredInvId(idStr)}
                          onClick={() => {
                            setExpandedSyncInvId((prev) => (prev === idStr ? null : idStr));
                            setHoveredInvId(idStr);
                          }}
                          title={
                            isExpanded
                              ? `Click to collapse full ${sName} breakdown`
                              : `Hover to preview • Click to expand full ${sName} breakdown downward`
                          }
                          className={`color-glide px-2.5 py-1 rounded-full font-mono text-[10.5px] inline-flex items-center gap-1 ${
                            isExpanded || isHov
                              ? 'font-bold'
                              : 'bg-[#121418] text-neutral-400 hover:text-white border border-white/[0.08]'
                          }`}
                          style={
                            isExpanded
                              ? {
                                  backgroundColor: accent.softBg,
                                  color: accent.primary,
                                  border: `1px solid ${accent.border}`,
                                  boxShadow: `0 0 16px ${accent.glow}`
                                }
                              : isHov
                              ? {
                                  backgroundColor: accent.secondarySoftBg,
                                  color: accent.secondary,
                                  border: `1px solid ${accent.secondaryBorder}`
                                }
                              : undefined
                          }
                        >
                          <span>
                            {idStr} {sName}
                          </span>
                          <ChevronDown
                            className={`w-3 h-3 transition-transform duration-300 ${
                              isExpanded
                                ? 'rotate-180 opacity-100'
                                : isHov
                                ? 'opacity-80'
                                : 'opacity-40'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* CLICKED STATE: Downward-Expanded Full Invariant Breakdown Across All Pinned Assets */}
                  {expandedSyncInvId ? (
                    (() => {
                      const expandedIdx = Math.max(0, Number(expandedSyncInvId) - 1);
                      const expandedTitle =
                        DEFAULT_TITLES[expandedIdx] || `Invariant ${expandedSyncInvId}`;
                      const ExpandedIcon = INVARIANT_ICONS[expandedSyncInvId] || ShieldCheck;
                      const copyKey = `sync-full-${expandedSyncInvId}`;

                      return (
                        <div
                          key={`sync-expanded-${expandedSyncInvId}`}
                          className="animate-sync-expand-down rounded-3xl bg-[#121418]/[0.96] border border-[#49EACB]/30 p-4 sm:p-5 space-y-4 shadow-[0_22px_55px_rgba(0,0,0,0.72)]"
                        >
                          {/* Expanded Breakdown Top Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-white/[0.08]">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-[#49EACB]/12 border border-[#49EACB]/35 flex items-center justify-center shrink-0">
                                <ExpandedIcon className="w-4 h-4 text-[#49EACB]" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-mono text-[10px] uppercase tracking-widest text-[#49EACB]">
                                  SYNCED FULL BREAKDOWN // {count} PINNED ASSETS •{' '}
                                  {isGeniusMode ? 'GENIUS FORENSIC' : 'NORMIE'}
                                </div>
                                <h3 className="font-display text-base sm:text-lg font-bold text-white truncate">
                                  {expandedSyncInvId} // {expandedTitle}
                                </h3>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* Inline Normie / Genius Depth Switch */}
                              <div className="p-0.5 rounded-full bg-[#0B0C0E] border border-white/10 flex items-center font-mono text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => setIsGeniusMode(false)}
                                  className={`px-2.5 py-1 rounded-full transition ${
                                    !isGeniusMode
                                      ? 'bg-[#1D212A] text-white font-semibold'
                                      : 'text-neutral-400 hover:text-neutral-200'
                                  }`}
                                >
                                  NORMIE
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsGeniusMode(true)}
                                  className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 ${
                                    isGeniusMode
                                      ? 'bg-[#49EACB]/15 text-[#49EACB] border border-[#49EACB]/40 font-bold'
                                      : 'text-neutral-400 hover:text-neutral-200'
                                  }`}
                                >
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>GENIUS</span>
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  copyTextToClipboard(
                                    formatSyncInvariantComparison(expandedSyncInvId),
                                    copyKey
                                  )
                                }
                                className="px-3 py-1.5 rounded-full bg-[#0B0C0E] hover:bg-[#181C24] border border-white/10 font-mono text-[11px] text-neutral-200 hover:text-white transition flex items-center gap-1.5"
                              >
                                {copiedTarget === copyKey ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-[#49EACB]" />
                                    <span className="text-[#49EACB]">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-[#49EACB]" />
                                    <span>Copy #{expandedSyncInvId} Compare</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedSyncInvId(null);
                                  setHoveredInvId(null);
                                }}
                                className="px-3 py-1.5 rounded-full bg-[#0B0C0E] hover:bg-[#191E27] border border-white/10 font-mono text-[11px] text-neutral-300 hover:text-white transition flex items-center gap-1"
                              >
                                <ChevronDown className="w-3.5 h-3.5 rotate-180 text-[#49EACB]" />
                                <span>Collapse</span>
                              </button>
                            </div>
                          </div>

                          {/* Full Unabridged Breakdown Cards Per Pinned Asset */}
                          <div
                            className={`grid grid-cols-1 ${
                              count === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
                            } gap-3.5`}
                          >
                            {stageTickers.map((tk) => {
                              const item = audits[tk];
                              const inv = item?.invariants?.find(
                                (i) => i.id === expandedSyncInvId
                              );
                              if (!item || !inv) return null;

                              const itemAcc = getGradeAccent(item.grade);
                              const sStyle = getScoreStyle(inv.score);
                              const fullParagraph = getActiveInvariantParagraph(
                                inv,
                                expandedIdx
                              );
                              const savedLogsCount = (
                                invLogs[`${item.ticker}:${inv.id}`] || []
                              ).length;

                              return (
                                <div
                                  key={tk}
                                  className="color-glide rounded-2xl bg-[#0B0C0E] p-4 sm:p-5 flex flex-col justify-between gap-3.5"
                                  style={{ border: `1px solid ${sStyle.border}` }}
                                >
                                  <div className="space-y-3">
                                    {/* Asset + Grade + Invariant Score Header */}
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-sm font-bold text-white">
                                            ${item.ticker}
                                          </span>
                                          <span
                                            className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold"
                                            style={{
                                              color: itemAcc.primary,
                                              backgroundColor: itemAcc.softBg,
                                              border: `1px solid ${itemAcc.border}`
                                            }}
                                          >
                                            Grade {item.grade} ({formatScore(item.totalScore)}/6.0)
                                          </span>
                                        </div>
                                        <div className="font-mono text-[11px] text-neutral-400 truncate mt-0.5">
                                          {item.name}
                                        </div>
                                      </div>

                                      <span
                                        className="px-2.5 py-1 rounded-full font-mono text-xs font-bold shrink-0"
                                        style={{
                                          color: sStyle.color,
                                          backgroundColor: sStyle.bg,
                                          border: `1px solid ${sStyle.border}`
                                        }}
                                      >
                                        {formatScore(inv.score)} / 1.0 • {sStyle.status}
                                      </span>
                                    </div>

                                    {/* Thermodynamic Score Meter */}
                                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                          width: `${Math.max(
                                            2,
                                            Math.round((Number(inv.score) || 0) * 100)
                                          )}%`,
                                          backgroundColor: sStyle.color,
                                          boxShadow:
                                            Number(inv.score) > 0
                                              ? `0 0 10px ${sStyle.color}`
                                              : 'none'
                                        }}
                                      />
                                    </div>

                                    {/* Telemetry Readout */}
                                    <div className="font-mono text-[11px] text-neutral-400 bg-[#121418] border border-white/[0.06] rounded-xl px-3 py-1.5">
                                      {inv.telemetry}
                                    </div>

                                    {/* Executive Quick Summary Callout */}
                                    <div
                                      className="pl-3 py-0.5 text-xs text-neutral-300 leading-relaxed"
                                      style={{ borderLeft: `2px solid ${sStyle.color}` }}
                                    >
                                      {inv.quickSummary}
                                    </div>

                                    {/* Full Unabridged Breakdown Paragraph (Normie or Genius) */}
                                    <p className="text-xs sm:text-[13.5px] text-neutral-200 leading-[1.76]">
                                      {fullParagraph}
                                    </p>

                                    {/* Verified Codebase & Mainnet Receipts */}
                                    {inv.receipts?.length > 0 && (
                                      <div className="space-y-1.5 pt-1">
                                        <div className="font-mono text-[9.5px] uppercase tracking-widest text-neutral-500">
                                          Verified Codebase &amp; Mainnet Receipts
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {inv.receipts.map((rcpt, rIdx) => (
                                            <span
                                              key={rIdx}
                                              className="px-2.5 py-0.5 rounded-full bg-[#121418] font-mono text-[10.5px]"
                                              style={{
                                                color: sStyle.color,
                                                border: `1px solid ${sStyle.border}`
                                              }}
                                            >
                                              {rcpt}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Card Action Footer */}
                                  <div className="pt-2.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-mono text-[10px] text-neutral-500">
                                      {savedLogsCount > 0
                                        ? `${savedLogsCount} Contest / Breakdown Log${
                                            savedLogsCount > 1 ? 's' : ''
                                          }`
                                        : `Inv #${inv.id} • Archived`}
                                    </span>

                                    <div className="flex items-center gap-2">
                                      {inv.id === '04' && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveKey(tk);
                                            setEssayViewMode(false);
                                            setModalInvId('04');
                                            scrollToWartimeSim();
                                          }}
                                          className="px-2.5 py-1 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[10.5px] text-neutral-300 hover:text-white transition flex items-center gap-1"
                                        >
                                          <Scissors className="w-3 h-3 text-[#EF4444]" />
                                          <span>Wartime Sim</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveKey(tk);
                                          setEssayViewMode(false);
                                          setModalInvId(inv.id);
                                        }}
                                        className="px-2.5 py-1 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[10.5px] font-semibold transition flex items-center gap-1"
                                        style={{ color: sStyle.color }}
                                      >
                                        <Scale className="w-3 h-3" />
                                        <span>Contest / Deep Exam</span>
                                        <ArrowRight className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    /* HOVER-ONLY STATE: Compact 3-Line Quick Summary Cards (Unchanged) */
                    hoveredInvId && (
                      <div
                        key={`sync-grid-${hoveredInvId}`}
                        className={`animate-card-fade grid grid-cols-1 ${
                          count === 2
                            ? 'sm:grid-cols-2'
                            : count === 3
                            ? 'sm:grid-cols-3'
                            : 'sm:grid-cols-2 xl:grid-cols-4'
                        } gap-2.5`}
                      >
                        {stageTickers.map((tk) => {
                          const item = audits[tk];
                          const inv = item?.invariants?.find((i) => i.id === hoveredInvId);
                          if (!item || !inv) return null;
                          const sStyle = getScoreStyle(inv.score);
                          return (
                            <div
                              key={tk}
                              onClick={() => {
                                setActiveKey(tk);
                                setEssayViewMode(false);
                                setModalInvId(inv.id);
                              }}
                              className="color-glide rounded-2xl bg-[#121418]/95 p-3.5 cursor-pointer hover:brightness-110 space-y-1.5"
                              style={{ border: `1px solid ${sStyle.border}` }}
                            >
                              <div className="flex items-center justify-between gap-2 font-mono text-xs">
                                <span className="font-bold text-white">
                                  ${item.ticker} // {inv.shortName}
                                </span>
                                <span
                                  className="color-glide px-2 py-0.5 rounded-full text-[10.5px] font-bold"
                                  style={{
                                    color: sStyle.color,
                                    backgroundColor: sStyle.bg,
                                    border: `1px solid ${sStyle.border}`
                                  }}
                                >
                                  {formatScore(inv.score)}/1.0
                                </span>
                              </div>
                              <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">
                                {inv.quickSummary}
                              </p>
                              <div className="font-mono text-[10px] text-neutral-500 truncate">
                                {inv.telemetry}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="animate-stage-enter w-full flex flex-col items-center justify-start min-w-0">
            <div
              onMouseEnter={() => setIsArenaHovered(true)}
              onMouseLeave={() => {
                setIsArenaHovered(false);
                setHoveredInvId(null);
              }}
              className="relative flex items-center justify-center select-none scale-[0.78] sm:scale-95 md:scale-[0.82] lg:scale-100 transition-transform"
              style={{ width: `${stageSize}px`, height: `${stageSize}px` }}
            >
              {/* SVG Radial Tether Mesh */}
              <svg
                width={stageSize}
                height={stageSize}
                viewBox={`0 0 ${stageSize} ${stageSize}`}
                className="absolute inset-0 pointer-events-none"
              >
                <circle
                  cx={centerCoord}
                  cy={centerCoord}
                  r={isSplitOpen ? orbitRadius : 76}
                  fill="none"
                  stroke={accent.secondary}
                  strokeOpacity={isSplitOpen ? 0.16 : 0.07}
                  strokeDasharray="3 6"
                  style={{ transition: 'all 460ms cubic-bezier(0.20, 1.22, 0.32, 1)' }}
                />

                {currentAudit.invariants.map((inv, idx) => {
                  const rad = (ORBIT_ANGLES_DEG[idx] * Math.PI) / 180;
                  const targetX = centerCoord + (isSplitOpen ? Math.cos(rad) * orbitRadius : 0);
                  const targetY = centerCoord + (isSplitOpen ? Math.sin(rad) * orbitRadius : 0);
                  const invStyle = getHarmonizedScoreStyle(inv.score, accent);
                  const isHighlighted = hoveredInvId === inv.id;

                  return (
                    <line
                      key={inv.id}
                      x1={centerCoord}
                      y1={centerCoord}
                      x2={targetX}
                      y2={targetY}
                      stroke={isHighlighted ? invStyle.color : accent.primary}
                      strokeWidth={isHighlighted ? 2.2 : 1.15}
                      strokeOpacity={isSplitOpen ? (isHighlighted ? 0.92 : 0.28) : 0}
                      style={{
                        transition:
                          'x2 460ms cubic-bezier(0.20, 1.22, 0.32, 1), y2 460ms cubic-bezier(0.20, 1.22, 0.32, 1), stroke 460ms ease, stroke-opacity 240ms ease'
                      }}
                    />
                  );
                })}
              </svg>

              {/* 6 Radial Invariant Satellite Bubbles */}
              {currentAudit.invariants.map((inv, idx) => {
                const rad = (ORBIT_ANGLES_DEG[idx] * Math.PI) / 180;
                const dx = isSplitOpen ? Math.cos(rad) * orbitRadius : 0;
                const dy = isSplitOpen ? Math.sin(rad) * orbitRadius : 0;
                const invStyle = getHarmonizedScoreStyle(inv.score, accent);
                const isHovered = hoveredInvId === inv.id;
                const hasEnergy = Number(inv.score) > 0;

                return (
                  <button
                    key={inv.id}
                    type="button"
                    onMouseEnter={() => setHoveredInvId(inv.id)}
                    onFocus={() => setHoveredInvId(inv.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEssayViewMode(false);
                      setModalInvId(inv.id);
                    }}
                    aria-label={`${inv.id} ${inv.title}`}
                    className="spring-orbit absolute w-[92px] h-[92px] rounded-full bg-transparent overflow-visible flex flex-col items-center justify-center text-center px-1.5 cursor-pointer focus:outline-none"
                    style={{
                      left: `${centerCoord - 46}px`,
                      top: `${centerCoord - 46}px`,
                      transform: `translate(${dx}px, ${dy}px) scale(${
                        isSplitOpen ? (isHovered ? 1.12 : 1) : 0.35
                      })`,
                      opacity: isSplitOpen ? 1 : 0,
                      pointerEvents: isSplitOpen ? 'auto' : 'none',
                      zIndex: isHovered ? 30 : 20
                    }}
                  >
                    {/* Static GPU Shadow Backing */}
                    <span
                      className="pointer-events-none absolute inset-[8px] rounded-full transition-shadow duration-300"
                      style={{
                        boxShadow: isHovered
                          ? `0 12px 26px rgba(0,0,0,0.85), 0 0 18px ${invStyle.color}66`
                          : `0 8px 20px rgba(0,0,0,0.72), 0 0 10px ${invStyle.bg}`
                      }}
                    />

                    {/* Invariant Harmonic Wave Perimeter (Scales with inv.score when expanded; 0.0 is completely flat) */}
                    <svg
                      viewBox="0 0 140 140"
                      className="absolute inset-[-24px] w-[calc(100%+48px)] h-[calc(100%+48px)] pointer-events-none"
                    >
                      <defs>
                        <radialGradient id={`satWaveGrad-${inv.id}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#121418" />
                          <stop offset="70%" stopColor="#121418" />
                          <stop
                            offset="100%"
                            stopColor={invStyle.color}
                            stopOpacity={isHovered ? '0.28' : hasEnergy ? '0.18' : '0.08'}
                          />
                        </radialGradient>
                      </defs>

                      {/* Secondary counter-rotating harmonic wave ring (only visible when inv.score > 0) */}
                      <path
                        ref={(el) => {
                          satEchoWaveRefs.current[idx] = el;
                        }}
                        d={DEFAULT_SAT_ECHO_D}
                        fill="none"
                        stroke={accent.secondary}
                        strokeWidth="1.05"
                        strokeOpacity={isSplitOpen && hasEnergy ? (isHovered ? 0.55 : 0.34) : 0}
                      />

                      {/* Primary Invariant Bubble Body & Wave Border */}
                      <path
                        ref={(el) => {
                          satMainWaveRefs.current[idx] = el;
                        }}
                        d={DEFAULT_SAT_MAIN_D}
                        fill={`url(#satWaveGrad-${inv.id})`}
                        stroke={invStyle.color}
                        strokeOpacity={isHovered ? 1 : hasEnergy ? 0.92 : 0.48}
                        strokeWidth={isHovered ? '2.2' : '1.65'}
                      />

                      {/* Inner resonance ring */}
                      <path
                        ref={(el) => {
                          satInnerWaveRefs.current[idx] = el;
                        }}
                        d={DEFAULT_SAT_INNER_D}
                        fill="none"
                        stroke={accent.secondary}
                        strokeWidth="0.85"
                        strokeDasharray="3 3"
                        strokeOpacity={isSplitOpen && hasEnergy ? 0.25 : 0.09}
                      />
                    </svg>

                    <div
                      key={`sat-${currentAudit.ticker}-${inv.id}`}
                      className="animate-select-fade relative z-10 flex flex-col items-center justify-center"
                    >
                      <span className="font-mono text-[10px] tracking-widest text-neutral-400">
                        {inv.id}
                      </span>
                      <span className="text-[11px] font-medium text-neutral-100 leading-tight line-clamp-1 mt-0.5">
                        {inv.shortName}
                      </span>
                      <span
                        className="color-glide font-mono text-[11px] font-bold mt-1 px-1.5 py-0.2 rounded-full"
                        style={{
                          color: invStyle.color,
                          backgroundColor: invStyle.bg
                        }}
                      >
                        {formatScore(inv.score)}/1.0
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Expanding Scan Pulse Ring on Token Switch */}
              {isScanningPulse && (
                <div
                  className="animate-scan-pulse absolute w-48 h-48 rounded-full pointer-events-none"
                  style={{
                    border: `2px solid ${accent.primary}`
                  }}
                />
              )}

              {/* Living Outer Bezel & 6-Invariant Progress Arc Ring When Auditing */}
              {isAuditing && (
                <svg
                  width={stageSize}
                  height={stageSize}
                  viewBox={`0 0 ${stageSize} ${stageSize}`}
                  className="absolute inset-0 pointer-events-none z-20"
                >
                  {/* True Audit Progress Ring Track & Fill */}
                  <circle
                    cx={centerCoord}
                    cy={centerCoord}
                    r={138}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="2.2"
                  />
                  <circle
                    cx={centerCoord}
                    cy={centerCoord}
                    r={138}
                    fill="none"
                    stroke={accent.primary}
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 138}
                    strokeDashoffset={2 * Math.PI * 138 * (1 - scanProgressPct / 100)}
                    transform={`rotate(-90 ${centerCoord} ${centerCoord})`}
                    style={{ transition: 'stroke-dashoffset 220ms ease, stroke 220ms ease' }}
                  />
                  <circle
                    cx={centerCoord}
                    cy={centerCoord}
                    r={129}
                    fill="none"
                    stroke={accent.primary}
                    strokeWidth="1.2"
                    strokeOpacity="0.25"
                    strokeDasharray="8 22"
                    className="spin-ccw"
                  />

                  {/* 6 Sequential Invariant Nodes Around Perimeter */}
                  {CORE_SCAN_STAGES.map((stg, idx) => {
                    const rad = (ORBIT_ANGLES_DEG[idx] * Math.PI) / 180;
                    const nx = centerCoord + Math.cos(rad) * 138;
                    const ny = centerCoord + Math.sin(rad) * 138;
                    const isDone = resolvedStepColors[idx] !== undefined;
                    const isCurrent = idx === scanStepIdx;
                    const nodeColor =
                      resolvedStepColors[idx] ||
                      (isCurrent ? stg.color : isDone ? stg.color : '#374151');

                    return (
                      <g key={stg.id}>
                        <circle
                          cx={nx}
                          cy={ny}
                          r={isCurrent ? 11 : 8}
                          fill="#0B0C0E"
                          stroke={nodeColor}
                          strokeWidth={isCurrent ? 2.4 : 1.5}
                          style={{ transition: 'all 240ms ease' }}
                        />
                        <text
                          x={nx}
                          y={ny + 3}
                          textAnchor="middle"
                          fill={isCurrent || isDone ? nodeColor : '#6B7280'}
                          fontSize="7.5"
                          fontFamily="JetBrains Mono, monospace"
                          fontWeight="700"
                        >
                          {stg.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Central Grade Nucleus Sphere */}
              <button
                type="button"
                onClick={() => {
                  if (!isAuditing && hasActiveAudit) togglePinTicker(activeKey);
                }}
                aria-label="Toggle Pin 6-Invariant Orbital Breakdown"
                className={`spring-orbit relative z-[25] rounded-full flex flex-col items-center justify-center text-center cursor-pointer focus:outline-none ${
                  isAuditing ? 'bg-[#121418] overflow-hidden' : 'bg-transparent overflow-visible'
                }`}
                style={{
                  width: isAuditing ? '236px' : isSplitOpen ? '150px' : '212px',
                  height: isAuditing ? '236px' : isSplitOpen ? '150px' : '212px',
                  border: isAuditing ? `2px solid ${accent.primary}` : 'none',
                  boxShadow: isAuditing
                    ? `0 18px 50px rgba(0,0,0,0.82), 0 0 48px ${accent.glow}, inset 0 0 32px ${accent.softBg}`
                    : 'none',
                  transition:
                    'width 420ms cubic-bezier(0.20, 1.22, 0.32, 1), height 420ms cubic-bezier(0.20, 1.22, 0.32, 1), border-color 260ms ease, box-shadow 260ms ease'
                }}
              >
                {/* Grade-Scaled Harmonic Wave Perimeter Shape (Flat at 0.0 Grade F or when hovering) */}
                {!isAuditing && (
                  <>
                    {/* Static GPU Shadow & Glow Backing */}
                    <span
                      className="pointer-events-none absolute inset-[6px] rounded-full transition-shadow duration-500"
                      style={{
                        boxShadow: `0 18px 36px rgba(0,0,0,0.82), 0 0 26px ${accent.glow}`
                      }}
                    />
                    <svg
                      viewBox="0 0 280 280"
                      className="absolute inset-[-34px] w-[calc(100%+68px)] h-[calc(100%+68px)] pointer-events-none"
                    >
                      <defs>
                        <radialGradient id="nucleusWaveGrad" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#121418" />
                          <stop offset="72%" stopColor="#121418" />
                          <stop
                            offset="88%"
                            stopColor={accent.primary}
                            stopOpacity="0.14"
                          />
                          <stop
                            offset="100%"
                            stopColor={accent.secondary}
                            stopOpacity="0.24"
                          />
                        </radialGradient>
                        <linearGradient id="nucleusRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={accent.primary} />
                          <stop offset="100%" stopColor={accent.secondary} />
                        </linearGradient>
                      </defs>

                      {/* Counter-rotating secondary harmonic wave contour (hidden when 0.0 F) */}
                      <path
                        ref={echoWavePathRef}
                        d={DEFAULT_NUCLEUS_ECHO_D}
                        fill="none"
                        stroke={accent.secondary}
                        strokeWidth="1.2"
                        strokeOpacity={
                          !isSplitOpen && Number(currentAudit.totalScore) > 0 ? 0.38 : 0
                        }
                      />

                      {/* Primary Grade-Shaped Nucleus Body & 1-Step Gradient Border */}
                      <path
                        ref={mainWavePathRef}
                        d={DEFAULT_NUCLEUS_MAIN_D}
                        fill="url(#nucleusWaveGrad)"
                        stroke="url(#nucleusRingGrad)"
                        strokeWidth="2.3"
                      />

                      {/* Inner harmonic resonance ring */}
                      <path
                        ref={innerWavePathRef}
                        d={DEFAULT_NUCLEUS_INNER_D}
                        fill="none"
                        stroke={accent.secondary}
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        strokeOpacity={
                          !isSplitOpen && Number(currentAudit.totalScore) > 0 ? 0.24 : 0.11
                        }
                      />
                    </svg>
                  </>
                )}

                {isAuditing ? (
                  <div className="w-full h-full px-5 py-4 flex flex-col items-center justify-between relative">
                    {/* Top Ticker & Active Invariant Counter */}
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
                      <span
                        className="w-2 h-2 rounded-full animate-ping"
                        style={{ backgroundColor: accent.primary }}
                      />
                      <span>AUDIT // ${scanTargetTicker}</span>
                    </div>

                    {/* Active Invariant Stage Title Changing Colors */}
                    <div className="my-0.5">
                      <div
                        className="font-mono text-xs font-bold tracking-wider uppercase transition-colors duration-200"
                        style={{ color: accent.primary }}
                      >
                        INV {activeScanStage.id} // {activeScanStage.shortName}
                      </div>
                      <div className="font-mono text-[9.5px] text-neutral-400 truncate max-w-[185px]">
                        {activeScanStage.title}
                      </div>
                    </div>

                    {/* Live Code Running Inside the Middle of the Circle */}
                    <div
                      className="w-full rounded-xl bg-[#07080A]/90 px-2.5 py-2 text-left font-mono text-[9.5px] leading-[1.45] space-y-0.5 shadow-inner"
                      style={{ border: `1px solid ${accent.primary}44` }}
                    >
                      {[0, 1, 2, 3].map((lineOffset) => {
                        const lineIdx =
                          (scanCodeTick + lineOffset) % activeScanStage.codeLines.length;
                        const codeLine = activeScanStage.codeLines[lineIdx];
                        const isActiveLine = lineOffset === 3;
                        return (
                          <div
                            key={lineOffset}
                            className="truncate transition-colors duration-150"
                            style={{
                              color: isActiveLine ? accent.primary : '#9CA3AF',
                              fontWeight: isActiveLine ? 700 : 400
                            }}
                          >
                            <span className="opacity-50 mr-1">&gt;</span>
                            {codeLine}
                          </div>
                        );
                      })}
                    </div>

                    {/* 6-Invariant Segmented Progress Bar Inside Bottom of Sphere */}
                    <div className="w-full px-3 space-y-1">
                      <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-200"
                          style={{
                            width: `${scanProgressPct}%`,
                            backgroundColor: accent.primary,
                            boxShadow: `0 0 8px ${accent.primary}`
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-center gap-1.5">
                        {CORE_SCAN_STAGES.map((stg, idx) => {
                          const dotColor =
                            resolvedStepColors[idx] ||
                            (idx === scanStepIdx
                              ? stg.color
                              : 'rgba(255,255,255,0.14)');
                          return (
                            <span
                              key={stg.id}
                              className="h-1.5 rounded-full transition-all duration-200"
                              style={{
                                width: idx === scanStepIdx ? '14px' : '6px',
                                backgroundColor: dotColor,
                                boxShadow: idx === scanStepIdx ? `0 0 8px ${dotColor}` : 'none'
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={`nucleus-${currentAudit.ticker}`}
                    className="animate-select-fade relative z-10 flex flex-col items-center justify-center px-4"
                  >
                    <div className="flex items-center justify-center font-mono text-xs uppercase tracking-[0.18em] text-neutral-300">
                      <span className="mr-[-0.18em]">${currentAudit.ticker}</span>
                      {isPinned && (
                        <Pin
                          className="w-3 h-3 ml-1.5 color-glide"
                          style={{ color: accent.secondary }}
                        />
                      )}
                    </div>

                    <div
                      className={`color-glide font-display font-bold leading-none tracking-tight my-1.5 px-1 ${
                        isSplitOpen ? 'text-5xl' : 'text-7xl'
                      }`}
                      style={{
                        backgroundImage: accent.gradientCss,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: accent.primary
                      }}
                    >
                      {currentAudit.grade}
                    </div>

                    <div className="font-mono text-xs text-neutral-300 font-semibold">
                      {formatScore(currentAudit.totalScore)}{' '}
                      <span className="text-neutral-500">/ 6.0</span>
                    </div>

                    {!isSplitOpen && (
                      <div className="mt-2.5 px-3 py-0.5 rounded-full bg-white/[0.035] border border-white/[0.08] font-mono text-[10px] text-neutral-400 max-w-[148px] truncate transition-opacity duration-300">
                        {currentAudit.name}
                      </div>
                    )}
                  </div>
                )}
              </button>
            </div>

            {/* ===============================================================
                DOCKED QUICK-SCAN HOVER CARD & WARTIME SIM LAUNCHER
               =============================================================== */}
            <div className="w-full max-w-xl min-h-[138px] mt-1 flex items-center justify-center">
              {isAuditing ? (
                <div className="animate-card-fade text-center space-y-1.5 pt-2 font-mono text-xs text-neutral-400">
                  <div>
                    Executing deterministic 6-invariant scan on{' '}
                    <span className="font-bold text-white">${scanTargetTicker}</span>...
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Stage {activeScanStage.id}/06 — {activeScanStage.title}
                  </div>
                </div>
              ) : activeHoveredInvariant ? (
                (() => {
                  const sStyle = getHarmonizedScoreStyle(activeHoveredInvariant.score, accent);
                  const InvIcon = INVARIANT_ICONS[activeHoveredInvariant.id] || ShieldCheck;
                  return (
                    <div
                      key={`hover-card-${currentAudit.ticker}-${activeHoveredInvariant.id}`}
                      onClick={() => {
                        setEssayViewMode(false);
                        setModalInvId(activeHoveredInvariant.id);
                      }}
                      className="animate-card-fade color-glide w-full rounded-2xl bg-[#121418]/[0.96] p-4 cursor-pointer shadow-[0_16px_40px_rgba(0,0,0,0.65)] hover:brightness-105"
                      style={{
                        border: `1px solid ${sStyle.border}`
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <InvIcon
                            className="w-4 h-4 shrink-0 color-glide"
                            style={{ color: sStyle.color }}
                          />
                          <span className="font-mono text-xs font-bold text-white">
                            {activeHoveredInvariant.id} // {activeHoveredInvariant.title}
                          </span>
                        </div>
                        <span
                          className="color-glide font-mono text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            color: sStyle.color,
                            backgroundColor: sStyle.bg,
                            border: `1px solid ${sStyle.border}`
                          }}
                        >
                          {formatScore(activeHoveredInvariant.score)} / 1.0 • {sStyle.status}
                        </span>
                      </div>

                      <p className="text-xs sm:text-[13.5px] text-neutral-300 leading-relaxed">
                        {activeHoveredInvariant.quickSummary}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between font-mono text-[11px]">
                        <span className="text-neutral-500 truncate pr-2">
                          {activeHoveredInvariant.telemetry}
                        </span>
                        <span
                          className="color-glide flex items-center gap-1 font-semibold shrink-0"
                          style={{ color: sStyle.color }}
                        >
                          <span>Click bubble for full paragraph &amp; wartime sim</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div
                  key={`stage-prompt-${currentAudit.ticker}-${isPinned}`}
                  className="animate-card-fade text-center space-y-2.5 pt-2"
                >
                  {currentAudit.lastFreshAuditAt && (
                    <div className="flex justify-center">
                      <span
                        className="color-glide px-3 py-0.5 rounded-full font-mono text-[10px] inline-flex items-center gap-1.5"
                        style={{
                          backgroundColor: accent.secondarySoftBg,
                          color: accent.secondary,
                          border: `1px solid ${accent.secondaryBorder}`
                        }}
                      >
                        <span>Fresh Intel • {currentAudit.lastFreshAuditAt}</span>
                        {currentAudit.scoreDelta !== null &&
                          currentAudit.scoreDelta !== undefined && (
                            <span className="opacity-85">
                              (
                              {currentAudit.scoreDelta === 0
                                ? 'Δ 0.0'
                                : currentAudit.scoreDelta > 0
                                ? `+${formatScore(currentAudit.scoreDelta)}`
                                : formatScore(currentAudit.scoreDelta)}
                              )
                            </span>
                          )}
                      </span>
                    </div>
                  )}

                  <p className="font-mono text-xs text-neutral-400 transition-opacity duration-300">
                    {isPinned
                      ? `Pinned $${currentAudit.ticker} (1/4) — click up to 3 more bubbles in Passed or Failed to compare in Side-by-Side, △, □, or ◇`
                      : isSplitOpen
                      ? 'Hover any invariant bubble for quick physics verdict • Click center sphere to pin & compare up to 4 bubbles'
                      : 'Hover center sphere (or tap to pin & compare up to 4 bubbles) to trigger 6-invariant radial fission'}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={isAuditing}
                      onClick={() => togglePinTicker(activeKey)}
                      className="color-glide px-3.5 py-1.5 rounded-full border font-mono text-[11px] flex items-center gap-1.5 disabled:opacity-50"
                      style={
                        isPinned
                          ? {
                              backgroundColor: accent.softBg,
                              color: accent.primary,
                              borderColor: accent.border,
                              boxShadow: `0 0 14px ${accent.glow}`
                            }
                          : {
                              backgroundColor: '#121418',
                              color: '#E5E7EB',
                              borderColor: 'rgba(255,255,255,0.1)'
                            }
                      }
                    >
                      <Pin className="w-3.5 h-3.5 color-glide" style={{ color: accent.primary }} />
                      <span>
                        {isPinned
                          ? `Pinned $${currentAudit.ticker} (Pick 2nd Bubble)`
                          : `Pin $${currentAudit.ticker} to Compare`}
                      </span>
                    </button>

                    {confirmFullReauditKey === currentAudit.ticker ? (
                      <div
                        className="animate-card-fade flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#121418] font-mono text-[10.5px]"
                        style={{
                          border: `1px solid ${accent.secondaryBorder}`,
                          color: accent.secondary
                        }}
                      >
                        <span>Archived copy active (0 credits). Spend credits on full refresh?</span>
                        <button
                          type="button"
                          onClick={() => handleFreshReaudit(activeKey, true)}
                          className="px-2.5 py-0.5 rounded-full font-bold hover:brightness-110 transition"
                          style={{
                            backgroundImage: accent.gradientCss,
                            color: accent.textOnAccent
                          }}
                        >
                          Confirm Refresh
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmFullReauditKey(null);
                            setEssayViewMode(false);
                            setModalInvId('01');
                          }}
                          className="px-2 py-0.5 rounded-full bg-[#0B0C0E] hover:brightness-110 transition"
                          style={{
                            color: accent.primary,
                            border: `1px solid ${accent.border}`
                          }}
                        >
                          Contest 1-Inv (~85% Less)
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmFullReauditKey(null)}
                          className="text-neutral-400 hover:text-white px-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isAuditing || Boolean(singleInvBusy)}
                        onClick={() => handleFreshReaudit(activeKey, false)}
                        className="color-glide px-3.5 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[11px] text-neutral-200 hover:text-white flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 color-glide ${isAuditing ? 'animate-spin' : ''}`}
                          style={{ color: accent.secondary }}
                        />
                        <span>Update Intel (${currentAudit.ticker})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setEssayViewMode(false);
                        setModalInvId('04');
                        scrollToWartimeSim();
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[11px] text-neutral-300 hover:text-white transition flex items-center gap-1.5"
                    >
                      <Scissors className="w-3.5 h-3.5 color-glide" style={{ color: accent.secondary }} />
                      <span>Contest / Wartime Sim</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile-Only (< 768px) Pass / Fail Lists */}
        {isMobileViewport && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 md:hidden">
            <aside className="w-full rounded-3xl bg-[#121418]/90 border border-white/[0.06] p-4 flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-[#49EACB] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#49EACB] shadow-[0_0_8px_#49EACB]" />
                  <span>Passed // E &gt; 0</span>
                </span>
                <span className="text-neutral-500">{passedTickers.length} Harmonic</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 py-1">
                {passedTickers.map((tk, idx) => (
                  <HarmonicProjectBubble
                    key={tk}
                    item={audits[tk]}
                    isSelected={activeKey === tk}
                    isPinnedItem={
                      isMultiStage ? stageTickers.includes(tk) : validPinnedKeys.includes(tk)
                    }
                    onSelectTicker={stableSelectTicker}
                    onTogglePin={stableTogglePin}
                    seedIndex={idx}
                  />
                ))}
              </div>
            </aside>

            <aside className="w-full rounded-3xl bg-[#121418]/90 border border-white/[0.06] p-4 flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-[#EF4444] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]" />
                  <span>Failed // E = 0</span>
                </span>
                <span className="text-neutral-500">{failedTickers.length} Flatlined</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 py-1">
                {failedTickers.map((tk, idx) => (
                  <HarmonicProjectBubble
                    key={tk}
                    item={audits[tk]}
                    isSelected={activeKey === tk}
                    isPinnedItem={
                      isMultiStage ? stageTickers.includes(tk) : validPinnedKeys.includes(tk)
                    }
                    onSelectTicker={stableSelectTicker}
                    onTogglePin={stableTogglePin}
                    seedIndex={idx + 50}
                  />
                ))}
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* =====================================================================
          3. MINIMAL THERMODYNAMIC FOOTER
         ===================================================================== */}
      <footer className="relative z-10 w-full px-4 sm:px-6 md:pl-[196px] md:pr-[196px] lg:pl-[244px] lg:pr-[244px] xl:pl-[290px] xl:pr-[290px] py-4 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-neutral-500 border-t border-white/[0.05]">
        <span>Landauer’s Principle: ΔQ ≥ kB·T·ln2 • E = 0 Forces Terminal Grade F</span>
        <span>Carrier Subordination Law: M_overlay &lt; M_L1 ≤ 1.0 • {sortedTickers.length} Assets Audited</span>
      </footer>

      {/* =====================================================================
          4. EXPANDED EXAMINATION, INTERROGATION & WARTIME SIMULATOR MODAL
         ===================================================================== */}
      {modalInvId && hasActiveAudit && (
        <div
          onClick={() => setModalInvId(null)}
          className="animate-modal-backdrop fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-modal-sheet w-full max-w-4xl max-h-[92vh] rounded-3xl bg-[#121418] border border-white/15 flex flex-col overflow-hidden shadow-[0_28px_80px_rgba(0,0,0,0.88)]"
          >
            {/* Modal Top Header */}
            <div className="px-5 sm:px-7 py-4 bg-[#0B0C0E]/90 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="px-3 py-1 rounded-full font-mono text-xs font-bold shrink-0"
                  style={{
                    backgroundColor: accent.softBg,
                    color: accent.primary,
                    border: `1px solid ${accent.border}`
                  }}
                >
                  ${currentAudit.ticker} • {currentAudit.grade} ({formatScore(currentAudit.totalScore)}/6.0)
                </span>
                <div className="min-w-0">
                  <div className="font-display text-base sm:text-lg font-bold text-white truncate">
                    {currentAudit.name}
                  </div>
                  <div className="font-mono text-[11px] text-neutral-400 truncate">
                    {currentAudit.architecture}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Normie / Genius Toggle Inside Modal */}
                <div className="p-0.5 rounded-full bg-[#121418] border border-white/10 flex items-center font-mono text-[10.5px]">
                  <button
                    type="button"
                    onClick={() => setIsGeniusMode(false)}
                    className={`px-2.5 py-1 rounded-full transition ${
                      !isGeniusMode
                        ? 'bg-[#1D212A] text-white font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    NORMIE
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGeniusMode(true)}
                    className={`px-2.5 py-1 rounded-full transition flex items-center gap-1 ${
                      isGeniusMode ? 'font-bold' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                    style={
                      isGeniusMode
                        ? {
                            backgroundColor: accent.softBg,
                            color: accent.primary,
                            border: `1px solid ${accent.border}`
                          }
                        : undefined
                    }
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>GENIUS</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isAuditing || Boolean(singleInvBusy)}
                  onClick={() => handleFreshReaudit(activeKey, true)}
                  title="Force a full 6-invariant fresh Google Search re-audit and overwrite archive"
                  className="px-3 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[11px] text-neutral-300 hover:text-white transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" style={{ color: accent.primary }} />
                  <span>Full Re-Audit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalInvId(null)}
                  className="w-8 h-8 rounded-full bg-[#121418] hover:bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Wrapped 6-Invariant + Full 6-Paragraph Audit Tab Bar */}
            <div className="px-5 sm:px-7 py-2.5 bg-[#0E1014] border-b border-white/[0.07] flex flex-wrap items-center gap-1.5">
              {currentAudit.invariants.map((inv) => {
                const st = getHarmonizedScoreStyle(inv.score, accent);
                const isSelectedTab = !essayViewMode && activeModalInvariant.id === inv.id;
                return (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => {
                      setEssayViewMode(false);
                      setModalInvId(inv.id);
                    }}
                    className={`px-2.5 py-1 rounded-full font-mono text-[11px] transition flex items-center gap-1.5 ${
                      isSelectedTab
                        ? 'bg-[#191D25] text-white font-bold border border-white/20 shadow-sm'
                        : 'bg-[#0B0C0E] text-neutral-400 hover:text-neutral-200 border border-white/[0.06]'
                    }`}
                  >
                    <span style={{ color: st.color }}>{inv.id}</span>
                    <span>{inv.shortName}</span>
                    <span className="text-[10px] opacity-80" style={{ color: st.color }}>
                      {formatScore(inv.score)}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setEssayViewMode(true)}
                className={`px-3 py-1 rounded-full font-mono text-[11px] transition flex items-center gap-1.5 ml-auto ${
                  essayViewMode
                    ? 'font-bold shadow-sm'
                    : 'bg-[#0B0C0E] text-neutral-300 hover:text-white border border-white/10'
                }`}
                style={
                  essayViewMode
                    ? {
                        backgroundColor: accent.softBg,
                        color: accent.primary,
                        border: `1px solid ${accent.border}`
                      }
                    : undefined
                }
              >
                <Layers className="w-3 h-3" />
                <span>FULL 6-PARAGRAPH ESSAY</span>
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div ref={modalBodyRef} className="p-5 sm:p-7 overflow-y-auto space-y-6">
              {!essayViewMode ? (
                (() => {
                  const sStyle = getHarmonizedScoreStyle(activeModalInvariant.score, accent);
                  const InvIcon = INVARIANT_ICONS[activeModalInvariant.id] || ShieldCheck;
                  const currentIdx = Math.max(
                    0,
                    currentAudit.invariants.findIndex((i) => i.id === activeModalInvariant.id)
                  );
                  const nextInv =
                    currentAudit.invariants[(currentIdx + 1) % currentAudit.invariants.length];

                  return (
                    <div
                      key={`modal-inv-${currentAudit.ticker}-${activeModalInvariant.id}-${isGeniusMode}`}
                      className="animate-card-fade space-y-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] pb-3.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                            style={{
                              backgroundColor: sStyle.bg,
                              border: `1px solid ${sStyle.border}`
                            }}
                          >
                            <InvIcon className="w-4 h-4" style={{ color: sStyle.color }} />
                          </div>
                          <div className="min-w-0">
                            <h2 className="font-display text-lg sm:text-xl font-bold text-white leading-snug">
                              {activeModalInvariant.id} // {activeModalInvariant.title}
                            </h2>
                            <div className="font-mono text-xs text-neutral-400 mt-0.5">
                              {activeModalInvariant.telemetry}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isAuditing || Boolean(singleInvBusy)}
                            onClick={() => handleSingleInvariantReaudit(activeModalInvariant.id)}
                            title={`Pull fresh Google Search & GitHub intel ONLY for Invariant ${activeModalInvariant.id} (~85% fewer tokens than full 6-invariant re-audit)`}
                            className="px-3 py-1 rounded-full bg-[#0B0C0E] hover:bg-[#171B22] border border-white/10 font-mono text-[11px] text-neutral-200 hover:text-white transition flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${
                                singleInvBusy?.key ===
                                  `${currentAudit.ticker}:${activeModalInvariant.id}` &&
                                singleInvBusy?.mode === 'REAUDIT'
                                  ? 'animate-spin'
                                  : ''
                              }`}
                              style={{ color: accent.primary }}
                            />
                            <span>
                              {singleInvBusy?.key ===
                                `${currentAudit.ticker}:${activeModalInvariant.id}` &&
                              singleInvBusy?.mode === 'REAUDIT'
                                ? 'Pulling 1-Inv Intel...'
                                : `Fresh 1-Inv Pull (#${activeModalInvariant.id})`}
                            </span>
                          </button>

                          <span
                            className="px-3 py-1 rounded-full font-mono text-xs font-bold"
                            style={{
                              backgroundColor: sStyle.bg,
                              color: sStyle.color,
                              border: `1px solid ${sStyle.border}`
                            }}
                          >
                            {formatScore(activeModalInvariant.score)} / 1.0 {sStyle.status}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-[#0B0C0E] border border-white/[0.07] space-y-2.5">
                        {activeModalInvariant.lastSingleAuditAt && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.06] font-mono text-[10px]">
                            <span style={{ color: sStyle.color }}>
                              {activeModalInvariant.lastSingleAuditSource || 'Single-Invariant Update'} •{' '}
                              {activeModalInvariant.lastSingleAuditAt}
                            </span>
                            {activeModalInvariant.singleScoreDelta !== undefined && (
                              <span className="text-neutral-400">
                                {activeModalInvariant.singleScoreDelta === 0
                                  ? 'Score Confirmed (Δ 0.0)'
                                  : `Score Delta: ${
                                      activeModalInvariant.singleScoreDelta > 0
                                        ? `+${formatScore(activeModalInvariant.singleScoreDelta)}`
                                        : formatScore(activeModalInvariant.singleScoreDelta)
                                    }`}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-sm sm:text-[15.5px] text-neutral-200 leading-[1.78]">
                          {getActiveInvariantParagraph(activeModalInvariant, currentIdx)}
                        </p>
                      </div>

                      {activeModalInvariant.receipts?.length > 0 && (
                        <div className="space-y-2">
                          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                            Verified Codebase &amp; Mainnet Receipts
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {activeModalInvariant.receipts.map((rcpt, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-full bg-[#0B0C0E] font-mono text-xs"
                                style={{
                                  color: sStyle.color,
                                  border: `1px solid ${sStyle.border}`
                                }}
                              >
                                {rcpt}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* =========================================================
                          SINGLE-INVARIANT CHALLENGE & BREAKDOWN CONSOLE
                         ========================================================= */}
                      {(() => {
                        const invKey = `${currentAudit.ticker}:${activeModalInvariant.id}`;
                        const draftVal = invPromptInputs[invKey] || '';
                        const logsForInv = invLogs[invKey] || [];
                        const isThisBusy = singleInvBusy?.key === invKey;

                        return (
                          <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 sm:p-5 space-y-3.5">
                            <div>
                              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                                INVARIANT {activeModalInvariant.id} INTERROGATION // 1-INVARIANT TOKEN SCOPE
                              </div>
                              <h3 className="font-display text-sm sm:text-base font-bold text-white mt-0.5">
                                Challenge This Score or Ask for a Deeper Breakdown
                              </h3>
                            </div>

                            {/* Shared Input Box With Two Distinct Send Actions */}
                            <div className="rounded-xl bg-[#121418] border border-white/10 focus-within:border-white/25 transition p-3 space-y-2.5">
                              <textarea
                                rows={2}
                                value={draftVal}
                                disabled={Boolean(singleInvBusy)}
                                onChange={(e) => {
                                  if (singleInvNotice) setSingleInvNotice(null);
                                  setInvPromptInputs((prev) => ({
                                    ...prev,
                                    [invKey]: e.target.value
                                  }));
                                }}
                                placeholder={`Paste new evidence, GitHub PRs/commits, or counter-arguments to challenge $${currentAudit.ticker}'s ${activeModalInvariant.shortName} score — or ask a question for a deeper breakdown...`}
                                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none font-sans resize-y leading-relaxed"
                              />

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                                <span className="font-mono text-[10px] text-neutral-500">
                                  Mode:{' '}
                                  <strong style={{ color: accent.primary }}>
                                    {isGeniusMode ? 'GENIUS' : 'NORMIE'}
                                  </strong>{' '}
                                  • Evaluates only Inv #{activeModalInvariant.id} (~85% fewer tokens)
                                </span>

                                <div className="flex flex-wrap items-center gap-2">
                                  {/* SEND BUTTON 1: Breakdown */}
                                  <button
                                    type="button"
                                    disabled={isAuditing || Boolean(singleInvBusy)}
                                    onClick={() => handleInvariantBreakdown(activeModalInvariant.id)}
                                    className="px-3.5 py-1.5 rounded-full bg-[#181C24] hover:bg-[#202631] border border-white/15 font-mono text-xs text-neutral-100 transition flex items-center gap-1.5 disabled:opacity-50"
                                  >
                                    {isThisBusy && singleInvBusy?.mode === 'BREAKDOWN' ? (
                                      <>
                                        <RefreshCw
                                          className="w-3.5 h-3.5 animate-spin"
                                          style={{ color: accent.secondary }}
                                        />
                                        <span>Breaking Down...</span>
                                      </>
                                    ) : (
                                      <>
                                        <ZoomIn
                                          className="w-3.5 h-3.5"
                                          style={{ color: accent.secondary }}
                                        />
                                        <span>Breakdown</span>
                                        <Send className="w-3 h-3 opacity-70" />
                                      </>
                                    )}
                                  </button>

                                  {/* SEND BUTTON 2: Challenge */}
                                  <button
                                    type="button"
                                    disabled={isAuditing || Boolean(singleInvBusy)}
                                    onClick={() => handleInvariantChallenge(activeModalInvariant.id)}
                                    className="px-3.5 py-1.5 rounded-full font-mono text-xs font-semibold transition flex items-center gap-1.5 hover:brightness-110 disabled:opacity-50"
                                    style={{
                                      backgroundImage: accent.gradientCss,
                                      color: accent.textOnAccent
                                    }}
                                  >
                                    {isThisBusy && singleInvBusy?.mode === 'CHALLENGE' ? (
                                      <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Fact-Checking...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Scale className="w-3.5 h-3.5" />
                                        <span>Challenge</span>
                                        <Send className="w-3 h-3" />
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {singleInvNotice && (
                              <div
                                className="px-3.5 py-2 rounded-xl bg-[#121418] font-mono text-xs flex items-center justify-between gap-2"
                                style={{
                                  border: `1px solid ${accent.secondaryBorder}`,
                                  color: accent.secondary
                                }}
                              >
                                <span>{singleInvNotice.text}</span>
                                <button
                                  type="button"
                                  onClick={() => setSingleInvNotice(null)}
                                  className="text-neutral-400 hover:text-white"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {/* Thread of Challenge Verdicts, Deep-Dive Breakdowns & 1-Inv Re-Audits */}
                            {logsForInv.length > 0 && (
                              <div className="space-y-3 pt-1">
                                {logsForInv.map((entry) => {
                                  const badgeColor =
                                    entry.kind === 'CHALLENGE' && entry.verdictState === 'REJECTED'
                                      ? accent.primary
                                      : accent.secondary;

                                  return (
                                    <div
                                      key={entry.id}
                                      className="rounded-xl bg-[#121418] border border-white/[0.08] p-4 space-y-2.5"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span
                                            className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold"
                                            style={{
                                              color: badgeColor,
                                              backgroundColor: `${badgeColor}18`,
                                              border: `1px solid ${badgeColor}50`
                                            }}
                                          >
                                            {entry.verdictTag}
                                          </span>
                                          <span className="font-mono text-xs font-bold text-white">
                                            {entry.headline}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-500">
                                          <span>{entry.timestamp}</span>
                                          {isResponseTextTruncated(entry.body) && (
                                            <button
                                              type="button"
                                              disabled={isAuditing || Boolean(singleInvBusy)}
                                              onClick={() => {
                                                if (
                                                  entry.kind === 'CHALLENGE' &&
                                                  entry.userPrompt
                                                ) {
                                                  handleInvariantChallenge(
                                                    activeModalInvariant.id,
                                                    entry.userPrompt
                                                  );
                                                } else if (entry.kind === 'BREAKDOWN') {
                                                  handleInvariantBreakdown(
                                                    activeModalInvariant.id,
                                                    entry.userPrompt || ''
                                                  );
                                                } else {
                                                  handleSingleInvariantReaudit(
                                                    activeModalInvariant.id
                                                  );
                                                }
                                              }}
                                              className="px-2 py-0.5 rounded-full bg-[#0B0C0E] hover:brightness-110 flex items-center gap-1 transition disabled:opacity-50"
                                              style={{
                                                color: accent.secondary,
                                                border: `1px solid ${accent.secondaryBorder}`
                                              }}
                                              title="Re-run and replace this cut-off response"
                                            >
                                              <RefreshCw className="w-2.5 h-2.5" />
                                              <span>Repair Cut-Off</span>
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              copyTextToClipboard(
                                                `${entry.headline}\n\n${entry.body}`,
                                                entry.id
                                              )
                                            }
                                            className="px-2 py-0.5 rounded-full bg-[#0B0C0E] hover:bg-neutral-800 border border-white/10 text-neutral-300 flex items-center gap-1 transition"
                                          >
                                            {copiedTarget === entry.id ? (
                                              <>
                                                <Check
                                                  className="w-3 h-3"
                                                  style={{ color: accent.primary }}
                                                />
                                                <span style={{ color: accent.primary }}>Copied</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-3 h-3" />
                                                <span>Copy</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      </div>

                                      {entry.userPrompt && (
                                        <div className="px-3 py-2 rounded-lg bg-[#0B0C0E] border-l-2 border-white/20 font-mono text-[11px] text-neutral-400">
                                          &ldquo;{entry.userPrompt}&rdquo;
                                        </div>
                                      )}

                                      <div className="text-xs sm:text-sm text-neutral-200 leading-[1.75] whitespace-pre-line">
                                        {entry.body}
                                      </div>

                                      {entry.sources?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                          {entry.sources.map((src, sIdx) => (
                                            <a
                                              key={sIdx}
                                              href={src.uri}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="px-2.5 py-0.5 rounded-full bg-[#0B0C0E] hover:bg-[#191D24] border border-white/10 font-mono text-[10px] text-neutral-300 hover:text-white inline-flex items-center gap-1 max-w-[240px]"
                                            >
                                              <span className="truncate">{src.title}</span>
                                              <ExternalLink
                                                className="w-2.5 h-2.5 shrink-0"
                                                style={{ color: badgeColor }}
                                              />
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="pt-1 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={scrollToWartimeSim}
                          className="font-mono text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition"
                        >
                          <Scissors className="w-3.5 h-3.5" style={{ color: accent.secondary }} />
                          <span>Test ${currentAudit.ticker} in Wartime Partition Sim ↓</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setModalInvId(nextInv.id)}
                          className="font-mono text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition"
                        >
                          <span>
                            Next: {nextInv.id} // {nextInv.shortName}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div
                  key={`modal-essay-${currentAudit.ticker}-${isGeniusMode}`}
                  className="animate-card-fade space-y-5"
                >
                  <div className="border-b border-white/[0.07] pb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs uppercase tracking-wider text-neutral-400">
                        THE TRUTH — {isGeniusMode ? 'GENIUS FORENSIC AUDIT' : 'NORMIE AUDIT'} //{' '}
                        {currentAudit.architecture}
                      </div>
                      <h2 className="font-display text-xl font-bold text-white mt-1">
                        {currentAudit.name} (${currentAudit.ticker}) — Terminal Grade{' '}
                        <span style={{ color: accent.primary }}>{currentAudit.grade}</span> (
                        {formatScore(currentAudit.totalScore)} / 6.0)
                      </h2>
                    </div>
                  </div>

                  {isGeniusMode ? (
                    <div className="p-5 sm:p-6 rounded-2xl bg-[#0B0C0E] border border-white/[0.08] space-y-5">
                      {currentGeniusParagraphs.map((para, idx) => (
                        <p
                          key={idx}
                          className="text-sm sm:text-[15px] text-neutral-200 leading-[1.82] text-justify"
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <>
                      {currentAudit.invariants.map((inv) => {
                        const st = getHarmonizedScoreStyle(inv.score, accent);
                        return (
                          <div key={inv.id} className="space-y-1.5">
                            <div className="flex items-center justify-between font-mono text-xs">
                              <span className="text-neutral-300 font-semibold">
                                {inv.id} // {inv.title}
                              </span>
                              <span style={{ color: st.color }} className="font-bold">
                                {formatScore(inv.score)} / 1.0 {st.status}
                              </span>
                            </div>
                            <p className="text-sm sm:text-[15px] text-neutral-200 leading-[1.78]">
                              {inv.paragraph}
                            </p>
                          </div>
                        );
                      })}

                      <div
                        className="p-4 sm:p-5 rounded-2xl bg-[#0B0C0E]"
                        style={{ border: `1px solid ${accent.border}` }}
                      >
                        <div
                          className="font-mono text-xs font-bold uppercase tracking-wider mb-1.5"
                          style={{ color: accent.primary }}
                        >
                          GRADE Evidence Certainty Synthesis // {currentAudit.certainty}
                        </div>
                        <p className="text-sm sm:text-[15px] text-neutral-200 leading-[1.75]">
                          {currentAudit.conclusion}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* BOTTOM OF EXPANDED VIEW: NETWORK WARTIME, PEACE & SPLICE SIMULATOR */}
              {currentAudit.freshSources?.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-white/[0.07] space-y-2.5">
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest">
                    <span style={{ color: accent.primary }}>
                      Live Google Search Grounding Sources ({currentAudit.lastFreshAuditAt})
                    </span>
                    <span className="text-neutral-500">
                      {currentAudit.freshSources.length} Verified Web Links
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentAudit.freshSources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[11px] text-neutral-200 hover:text-white transition inline-flex items-center gap-1.5 max-w-xs"
                      >
                        <span className="truncate">{src.title}</span>
                        <ExternalLink
                          className="w-3 h-3 shrink-0"
                          style={{ color: accent.primary }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div ref={simAnchorRef}>
                <WartimeSpliceSimulator
                  activeAudit={currentAudit}
                  kasAudit={PRELOADED_AUDITS.KAS}
                  accent={accent}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 sm:px-7 py-3.5 bg-[#0B0C0E]/85 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
              {!essayViewMode ? (
                <button
                  type="button"
                  onClick={() =>
                    copyTextToClipboard(
                      `THE TRUTH — thermodynamic audit // $${currentAudit.ticker} [${
                        currentAudit.grade
                      }]\n${activeModalInvariant.id} // ${activeModalInvariant.title} [${formatScore(
                        activeModalInvariant.score
                      )}/1.0]:\n\n${getActiveInvariantParagraph(
                        activeModalInvariant,
                        currentAudit.invariants.findIndex((i) => i.id === activeModalInvariant.id)
                      )}`,
                      'modal-single'
                    )
                  }
                  className="px-4 py-2 rounded-full bg-[#121418] hover:bg-[#181B22] border border-white/10 font-mono text-xs text-neutral-200 transition flex items-center gap-1.5"
                >
                  {copiedTarget === 'modal-single' ? (
                    <>
                      <Check className="w-3.5 h-3.5" style={{ color: accent.primary }} />
                      <span style={{ color: accent.primary }}>Copied Invariant!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Copy Single Invariant</span>
                    </>
                  )}
                </button>
              ) : (
                <span className="font-mono text-xs text-neutral-500">
                  {formatXLongPost(currentAudit).length.toLocaleString()} chars • X Long-Post Ready
                </span>
              )}

              <button
                type="button"
                onClick={() => copyTextToClipboard(formatXLongPost(currentAudit), 'modal-full')}
                className="px-4 py-2 rounded-full font-mono text-xs font-semibold transition flex items-center gap-1.5 hover:brightness-110"
                style={{
                  backgroundColor: accent.primary,
                  color: accent.textOnAccent
                }}
              >
                {copiedTarget === 'modal-full' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isGeniusMode ? 'Copy Genius Audit' : 'Copy Normie Audit'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. DETERMINISTIC 6-INVARIANT GRADING RUBRIC MODAL
         ===================================================================== */}
      {isRubricOpen && (
        <div
          onClick={() => setIsRubricOpen(false)}
          className="animate-modal-backdrop fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-modal-sheet w-full max-w-4xl max-h-[90vh] rounded-3xl bg-[#121418] border border-white/15 flex flex-col overflow-hidden shadow-[0_28px_80px_rgba(0,0,0,0.88)]"
          >
            <div className="px-5 sm:px-7 py-4 bg-[#0B0C0E]/90 border-b border-white/[0.08] flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#49EACB]">
                  CANONICAL SCORING LAW // ZERO SUBJECTIVE DRIFT
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
                  Deterministic 6-Invariant Thermodynamic Grading Rubric
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsRubricOpen(false)}
                className="w-8 h-8 rounded-full bg-[#121418] hover:bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-7 overflow-y-auto space-y-5">
              {/* Grade Scale Bar */}
              <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-white/[0.07] space-y-2.5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                  Deterministic Physics Curve (6.00 = Ideal Carnot/Light-Speed Limit • ≤1.00 or E = 0 Forces Grade F)
                </div>
                <div className="flex flex-wrap gap-2 font-mono text-xs">
                  {[
                    ['A+', '5.75–6.00', '#49EACB'],
                    ['A / A-', '4.90–5.74', '#49EACB'],
                    ['B+', '4.40–4.89', '#4ADE80'],
                    ['B / B-', '3.92–4.39', '#22C55E'],
                    ['C+', '3.50–3.91', '#FACC15'],
                    ['C / C-', '2.30–3.49', '#F59E0B'],
                    ['D+ / D / D-', '1.01–2.29', '#F97316'],
                    ['F', '0.00–1.00 (or E = 0)', '#EF4444']
                  ].map(([g, rng, col]) => (
                    <span
                      key={g}
                      className="px-2.5 py-1 rounded-full bg-[#121418]"
                      style={{ color: col, border: `1px solid ${col}50` }}
                    >
                      <strong>{g}</strong>: {rng}
                    </span>
                  ))}
                </div>
                <div className="pt-2 border-t border-white/[0.06] text-[11.5px] leading-relaxed text-neutral-300">
                  <span className="font-mono font-bold text-[#F97316] mr-1.5">
                    [SOVEREIGNTY-COMPROMISE &amp; ENERGY-ARBITRAGE CAP — MAX GRADE D+]:
                  </span>
                  Any genesis premine, pre-allocated token supply, ICO/VC unlock, or mandatory
                  protocol developer tax (<span className="font-mono text-white">01 = 0.00</span>)
                  creates an energy arbitrage within the Cost Floor where zero-work insiders dilute
                  unit joule density and extract value from miners’ expended electricity—capping{' '}
                  <span className="font-mono text-white">02 Cost Floor ≤ 0.35</span> and capping
                  Terminal Grade at <span className="font-mono text-[#F97316] font-bold">D+</span>{' '}
                  (<span className="font-mono text-neutral-400">≥2.30 = D+ • 1.75–2.29 = D • 1.01–1.74 = D-</span>).
                </div>
              </div>

              {/* 6 Invariant Quantitative Brackets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {GRADING_RUBRIC_SPEC.map((spec) => (
                  <div
                    key={spec.id}
                    className="p-4 rounded-2xl bg-[#0B0C0E] border border-white/[0.07] space-y-2.5"
                  >
                    <div className="font-mono text-xs font-bold text-white">
                      <span className="text-[#49EACB]">{spec.id}</span> // {spec.name}
                    </div>
                    <div className="space-y-1.5">
                      {spec.brackets.map((b, i) => (
                        <div key={i} className="text-xs leading-relaxed text-neutral-300">
                          <span className="font-mono font-bold text-white mr-1.5">[{b.range}]</span>
                          <span>{b.rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. THERMODYNAMIC ARCHIVE VAULT & API CREDIT SHIELD MODAL
         ===================================================================== */}
      {isArchiveModalOpen && (
        <div
          onClick={() => setIsArchiveModalOpen(false)}
          className="animate-modal-backdrop fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-modal-sheet w-full max-w-3xl max-h-[90vh] rounded-3xl bg-[#121418] border border-white/15 flex flex-col overflow-hidden shadow-[0_28px_80px_rgba(0,0,0,0.88)]"
          >
            {/* Header */}
            <div className="px-5 sm:px-7 py-4 bg-[#0B0C0E]/90 border-b border-white/[0.08] flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#49EACB]">
                  SHARED PERSISTENT VAULT // 0-CREDIT CACHE ARCHITECTURE
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
                  Thermodynamic Archive &amp; API Credit Shield
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#121418] hover:bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-7 overflow-y-auto space-y-5">
              {/* 3 Telemetry KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#0B0C0E] border border-white/[0.07]">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                    Total Archived Assets
                  </div>
                  <div className="font-display text-2xl font-bold text-white mt-1">
                    {sortedTickers.length}
                  </div>
                  <div className="font-mono text-[10px] text-[#49EACB] mt-0.5">
                    23 Core + {Math.max(0, sortedTickers.length - 23)} Community / Updated (
                    {archivedCloudCount} Cloud Docs)
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0B0C0E] border border-white/[0.07]">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                    0-Credit Archive Reads
                  </div>
                  <div className="font-display text-2xl font-bold text-[#49EACB] mt-1">
                    {zeroTokenHits}
                  </div>
                  <div className="font-mono text-[10px] text-neutral-400 mt-0.5">
                    Instant pulls with 0 Gemini tokens
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0B0C0E] border border-white/[0.07]">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                    Vault Sync Status
                  </div>
                  <div className="font-mono text-sm font-bold text-white mt-1.5 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: archiveStatus === 'SYNCED' ? '#49EACB' : '#FACC15',
                        boxShadow: `0 0 8px ${archiveStatus === 'SYNCED' ? '#49EACB' : '#FACC15'}`
                      }}
                    />
                    <span>
                      {archiveStatus === 'SYNCED'
                        ? 'SHARED CLOUD SYNCED'
                        : archiveStatus === 'CONNECTING'
                        ? 'CONNECTING VAULT...'
                        : 'SESSION + JSON EXPORT'}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-neutral-400 mt-1">
                    Updates &amp; contests sync to all users
                  </div>
                </div>
              </div>

              {/* How Credit Protection Works + Strict Credit Shield Toggle */}
              <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-mono text-xs font-bold text-white flex items-center gap-2">
                    {strictCreditLock ? (
                      <Lock className="w-4 h-4 text-[#FACC15]" />
                    ) : (
                      <Unlock className="w-4 h-4 text-[#49EACB]" />
                    )}
                    <span>
                      {strictCreditLock
                        ? 'Strict Credit Lock: ON (0 API Credits Allowed)'
                        : 'Archive-First Shield: ACTIVE (Default)'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Every searched token checks the Preloaded + Shared Cloud Archive first (0
                    credits). New tokens are audited once, archived permanently for all visitors,
                    and never re-run unless explicitly updated or contested. Toggle{' '}
                    <strong className="text-neutral-200">Strict Lock</strong> during viral traffic spikes to
                    block all live AI calls completely.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStrictCreditLock((prev) => !prev)}
                  className={`px-4 py-2 rounded-full font-mono text-xs font-bold shrink-0 transition border ${
                    strictCreditLock
                      ? 'bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/50 hover:bg-[#FACC15]/25'
                      : 'bg-[#121418] text-neutral-200 border-white/15 hover:bg-[#1A1E26]'
                  }`}
                >
                  {strictCreditLock ? 'Unlock Live Audits' : 'Enable Strict 0-Credit Lock'}
                </button>
              </div>

              {/* Portable JSON Backup / Hardcode Export & Import */}
              <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-white/[0.08] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs font-bold text-white">
                      Portable Archive Snapshot (Backup or Bake Into Static Code)
                    </div>
                    <div className="font-mono text-[11px] text-neutral-400">
                      Export all archived audits + contest logs as JSON, or import a saved snapshot.
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        copyTextToClipboard(
                          JSON.stringify({ audits, invLogs }, null, 2),
                          'archive-json'
                        )
                      }
                      className="px-3 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/15 font-mono text-xs text-[#49EACB] flex items-center gap-1.5 transition"
                    >
                      {copiedTarget === 'archive-json' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied Snapshot!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Copy Archive JSON</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowImportBox((p) => !p)}
                      className="px-3 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/15 font-mono text-xs text-neutral-200 flex items-center gap-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import JSON</span>
                    </button>
                  </div>
                </div>

                {showImportBox && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <textarea
                      rows={3}
                      value={importJsonText}
                      onChange={(e) => setImportJsonText(e.target.value)}
                      placeholder="Paste exported Archive JSON snapshot here to restore or sync into the vault..."
                      className="w-full rounded-xl bg-[#121418] border border-white/10 p-3 font-mono text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleImportArchiveSnapshot}
                        className="px-4 py-1.5 rounded-full bg-[#49EACB] text-[#041713] font-mono text-xs font-bold hover:brightness-110 transition"
                      >
                        Restore Snapshot Into Archive
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Directory of All Archived Assets */}
              <div className="space-y-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  Archived Ledger Directory (Click Any Asset for Instant 0-Credit Load)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
                  {sortedTickers.map((tk) => {
                    const item = audits[tk];
                    if (!item) return null;
                    const itemAcc = getGradeAccent(item.grade);
                    const isCustomOrUpdated =
                      Boolean(item.isCustom) || Boolean(item.archivedAtLabel) || Boolean(item.lastFreshAuditAt);
                    return (
                      <button
                        key={tk}
                        type="button"
                        onClick={() => {
                          selectCachedAudit(tk);
                          setIsArchiveModalOpen(false);
                        }}
                        className="p-2.5 rounded-xl bg-[#0B0C0E] hover:bg-[#161922] border border-white/[0.07] text-left transition flex flex-col justify-between gap-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-xs font-bold text-white truncate">
                            ${item.ticker}
                          </span>
                          <span
                            className="font-mono text-xs font-bold"
                            style={{ color: itemAcc.primary }}
                          >
                            {item.grade} ({formatScore(item.totalScore)})
                          </span>
                        </div>
                        <div className="font-mono text-[9.5px] text-neutral-500 truncate">
                          {isCustomOrUpdated
                            ? `Updated ${item.archivedAtLabel || item.lastFreshAuditAt || 'Vault'}`
                            : 'Core Baseline • 0 Credits'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          7. LIVE THERMODYNAMIC GAINS & COHORT DIVERGENCE MODAL
         ===================================================================== */}
      {isGainsModalOpen && (
        <ThermodynamicGainsModal
          onClose={() => setIsGainsModalOpen(false)}
          auditsMap={audits}
          onSelectOrAuditTicker={(tk) => {
            setIsGainsModalOpen(false);
            if (audits[tk]) {
              selectCachedAudit(tk);
            } else if (!strictCreditLock && !isAuditing) {
              performLiveGroundedAudit(tk, null);
            } else {
              setSearchInput(tk);
            }
          }}
          onCopyReport={copyTextToClipboard}
          copiedTarget={copiedTarget}
        />
      )}
    </div>
  );
}

class AuditErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering exception.'
    };
  }

  componentDidCatch(error, info) {
    console.error('Thermodynamic Audit UI caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0C0E] text-white flex items-center justify-center p-6 font-mono">
          <div className="max-w-md w-full rounded-3xl bg-[#121418] border border-[#EF4444]/40 p-6 space-y-4 text-center shadow-2xl">
            <div className="text-xs uppercase tracking-widest text-[#EF4444] font-bold">
              Renderer Safeguard Triggered
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed break-words">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="px-4 py-2 rounded-full bg-[#49EACB] text-[#041713] text-xs font-bold hover:brightness-110 transition"
            >
              Reset Stage &amp; Resume
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AuditErrorBoundary>
      <ThermodynamicAuditApp />
    </AuditErrorBoundary>
  );
}