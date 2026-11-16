import {
  type AuditData,
  buildCanonicalGeniusParagraphs
} from './rubricSpec.ts';

export const PRELOADED_AUDITS: Record<string, AuditData> = {
  KAS: {
    ticker: 'KAS',
    name: 'Kaspa',
    consensusFamily: 'BLOCKDAG_POW',
    architecture: 'GHOSTDAG 10-BPS PoW BlockDAG (kHeavyHash • Crescendo • Toccata Covenants)',
    grade: 'A+',
    totalScore: 6.0,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluating Kaspa through the GRADE evidence certainty framework yields a High Certainty rating, empirically verified across live rusty-kaspa mainnet consensus: GHOSTDAG at 10 BPS (Crescendo, May 2025) across ~2.5+ billion cumulative transactions, deterministic Chromatic emission curves, and Toccata native L1 Covenants, SilverScript & ZK verification opcodes activated June 30, 2026 at DAA 474,165,565 (with DAGKnight KIP-2 [Roadmap / KIP-2 Proposed — In Testnet-13 Review] excluded from live scoring). Satisfying every law of thermodynamics on live mainnet code, Kaspa scores 6.0 out of 6.0 for a terminal compliance grade of A+.',
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
          'Calcified by cumulative Proof-of-Work heat dissipation and 30h (1,080,000-block) cryptographic PoPoW pruning on an 8-core / 16 GB / 256 GB NVMe (~40–50 Mbps) consumer node baseline.',
        paragraph:
          'Kaspa calcifies ledger history strictly through the Second Law of Thermodynamics and Landauer’s Principle (ΔQ ≥ kB·T·ln2): reversing settled DAG history requires physically re-burning every joule of global silicon hash work accumulated since finality. Even at 10 BPS (Crescendo), rusty-kaspa maintains a lightweight 30-hour (pruning_depth = 1,080,000) rolling pruning horizon fitting inside an 8 CPU core / 16 GB RAM / 256 GB NVMe SSD (~40–50 Mbps sustained) consumer baseline (separate from archival indexers), while syncing nodes verify cumulative PoW from Genesis via cryptographic Proofs-of-Proof-of-Work rather than trusted S3 snapshots.',
        geniusParagraph:
          'Because Kaspa welds state finality directly to irreversible heat dissipation, it satisfies Historical Immutability and the Physical Arrow of Time (1.00 / 1.00) with mathematical finality. Governed by the Second Law of Thermodynamics and Landauer’s Principle (ΔQ ≥ kB·T·ln2), rewriting settled Kaspa blocks requires an adversary to physically re-burn every megawatt-hour of global ASIC work accumulated across the BlockDAG since that block was sealed. Crucially, Kaspa solves the state-bloat dilemma without sacrificing trustless genesis verification: while rusty-kaspa maintains a lightweight ~30-hour (`pruning_depth = 1,080,000`) rolling pruning horizon so ordinary operators can run bare-metal full nodes on a consumer Crescendo baseline (`8 CPU cores / 16 GB RAM / 256 GB NVMe SSD / ~5 MB/s ≈ 40–50 Mbps` sustained bandwidth, distinct from optional multi-terabyte archival indexers), newly syncing nodes never rely on trusted corporate Amazon S3 snapshots or social Weak Subjectivity checkpoints; instead, nodes cryptographically verify cumulative Proof-of-Work all the way from Genesis via deterministic Pruning Point headers and succinct Proof-of-Proof-of-Work (PoPoW) chains.',
        receipts: ['Irreversible PoW Heat Wall', '8c / 16GB / 256GB (~45 Mbps) Node', '30h Cryptographic PoPoW Sync', 'Zero Weak Subjectivity or S3']
      },
      {
        id: '04',
        shortName: 'Availability',
        title: 'Dynamic Availability (Wartime Partition)',
        telemetry: 'GHOSTDAG 10-BPS • KIP-14 Per-Block DAA • [DAGKnight Roadmap / KIP-2]',
        score: 1.0,
        quickSummary:
          'Recalculates difficulty every 100ms block (KIP-14) so even a 10% partition returns to 10.0 BPS within hours, merging sub-DAGs inside merge_depth = 36,000 (~1h) via live GHOSTDAG while honoring bounded finality walls.',
        paragraph:
          'Engineered for extreme geopolitical trauma on live rusty-kaspa mainnet consensus, Kaspa achieves Dynamic Availability without synchronous validator halts. Unlike BFT Proof-of-Stake chains that flatline whenever 33.4% of stake disconnects, Kaspa recalculates difficulty every single 100ms block via KIP-14 Sampled DAA (~44-minute / 26,410-block window), enabling even a 10% isolated shard to recalibrate back to 10.0 BPS within hours. Upon resplice, live GHOSTDAG merges parallel sub-DAGs inside merge_depth = 36,000 (~1h) with non-conflicting UTXOs intact, transitions to heavier Blue-Work reorgs from 1–12h (ViolatingBoundedMergeDepth), and enforces finality_depth = 432,000 (>12h FinalityConflict lock). DAGKnight (KIP-2) [Roadmap / KIP-2 Proposed — In Testnet-13 Review] is not counted in live scoring.',
        geniusParagraph:
          'Under wartime network partitions, Kaspa’s live mainnet GHOSTDAG (10 BPS) + KIP-14 Sampled DAA architecture earns 1.00 / 1.00 on Dynamic Availability strictly on active rusty-kaspa consensus code—with DAGKnight (KIP-2) explicitly tagged as [Roadmap / KIP-2 Proposed — In Testnet-13 Review]. Whereas BFT Proof-of-Stake networks flatline at >33.3% offline stake and Bitcoin’s 2,016-block epoch freezes a 10% isolated shard at ~100-minute blocks for ~10 weeks, Kaspa recalculates difficulty every block over a ~44-minute (26,410-block) window, allowing even a 10% partition to recalibrate smoothly back to 10.0 BPS within hours. On resplice, rusty-kaspa enforces exact safety regimes: under 1 hour (< merge_depth = 36,000 blocks, mergeset_size_limit = 248, k = 124), GHOSTDAG weaves parallel partitions cleanly into a single unified BlockDAG; between 1 and 12 hours (ViolatingBoundedMergeDepth), nodes reorganize onto the heavier cumulative Blue-Work branch and return non-conflicting minority transactions to the mempool; past 12 hours (finality_depth = 432,000; pruning_depth = 1,080,000 at 30h), nodes trigger a FinalityConflict lock requiring explicit operator --override-params coordination.',
        receipts: ['KIP-14 Per-Block DAA (~44m Window)', 'merge_depth = 36,000 (<1h Full Merge)', 'finality_depth = 432,000 (12h Lock)', 'DAGKnight [Roadmap / KIP-2 Proposed — In Testnet-13 Review]']
      },
      {
        id: '05',
        shortName: 'State Topology',
        title: 'State Machine Topology',
        telemetry: 'Parallel UTXO + Toccata SilverScript',
        score: 1.0,
        quickSummary:
          'Stateless parallel Extended UTXO graph upgraded with Toccata native L1 Covenants, SilverScript & KIP-21 partitioned sequencing commitments (June 30, 2026 • DAA 474,165,565).',
        paragraph:
          'Kaspa rejects monolithic shared-account trees like the EVM that force global commerce into sequential memory locks, gas wars, reentrancy drains, and MEV sandwich attacks. Instead, Kaspa operates a stateless, contention-free parallel UTXO topology supercharged by the Toccata hardfork (activated June 30, 2026 at DAA score 474,165,565), embedding native Layer-1 UTXO Covenants, SilverScript smart-contract expressiveness, KIP-21 partitioned sequencing commitments (binding based L2s deterministically to L1 DAG ordering), and succinct Zero-Knowledge verification opcodes directly into base silicon consensus without reserve locks or clawback switches.',
        geniusParagraph:
          'Examining Kaspa’s State Machine Topology (1.00 / 1.00) exposes why a stateless, parallel UTXO graph eliminates the root causes of DeFi fragility, state contention, and centralized censorship. Kaspa rejects monolithic shared-account virtual machines (EVM, SVM, Move, and Wasm account trees) that trap global financial coordination inside sequential mutable-state write locks, gas wars, reentrancy drains, mandatory state-rent deposits, and predatory MEV sandwich queues. Instead, Kaspa operates a contention-free parallel Extended UTXO graph upgraded on June 30, 2026 at DAA score 474,165,565 with the Toccata hardfork—embedding native Layer-1 UTXO Covenants, SilverScript smart-contract programmability, KIP-21 partitioned sequencing commitments (giving based rollups deterministic L1 payload ordering without centralized sequencers), and succinct Zero-Knowledge verification opcodes directly into base silicon consensus with zero native freeze switches, zero clawback primitives, and zero administrative deny-lists.',
        receipts: ['Stateless Parallel UTXO Graph', 'Toccata Active (DAA 474,165,565)', 'KIP-21 Sequencing & Covenants', 'Zero Freeze or Clawback Keys']
      },
      {
        id: '06',
        shortName: 'Velocity',
        title: 'Thermodynamic Velocity (M = 1.0)',
        telemetry: '10 BPS Crescendo • M = 1.0 Zero Orphans',
        score: 1.0,
        quickSummary:
          'Incorporates 100% of honest parallel PoW blocks at 10 BPS (100ms intervals) on consumer hardware (8c / 16GB / ~40–50 Mbps) with zero orphan energy waste (M = 1.0).',
        paragraph:
          'By generalizing Nakamoto’s single-file chain into a parallel BlockDAG running live at 10 blocks per second on the Crescendo rusty-kaspa architecture—verifiable on an accessible 8-core / 16 GB RAM / ~40–50 Mbps consumer node—Kaspa achieves optimal Thermodynamic Velocity (M = 1.0). Every valid Proof-of-Work block discovered concurrently across the planet enters consensus simultaneously rather than being discarded as an orphan, delivering seconds-level pure-PoW finality natively on Layer 1.',
        geniusParagraph:
          'On the sixth physical invariant—Thermodynamic Velocity (M = 1.0, scored 1.00 / 1.00)—Kaspa solves the fundamental physical bottleneck that crippled Satoshi Nakamoto’s 2009 sequential chain. In a single-file blockchain, block creation must be artificially throttled (e.g., 600 seconds on Bitcoin or 120 seconds on Monero) because any concurrent blocks solved across global fiber-optic propagation latency collide and get discarded as wasted stale orphans (M < 1.0). By generalizing Nakamoto consensus into a parallel GHOSTDAG BlockDAG running live at 10 blocks per second (100ms block intervals) on the Crescendo rusty-kaspa architecture—sustainable on a modest `8 CPU core / 16 GB RAM / 256 GB SSD / ~5 MB/s (~40–50 Mbps)` node footprint—Kaspa weaves 100% of honest concurrent global kHeavyHash work into consensus simultaneously, achieving unity Thermodynamic Velocity (M = 1.0), ~2.5+ billion settled mainnet transactions, and seconds-level pure Proof-of-Work finality natively on Layer 1 without validator vote-padding or off-chain batcher servers.',
        receipts: ['10 BPS (100ms Block Intervals)', 'M = 1.0 Work Utilization', '8c / 16GB / ~45 Mbps Sustain', '~2.5B+ Mainnet TXs Settled']
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
      'Evaluating Bitcoin through the GRADE evidence certainty framework yields a High Certainty rating, empirically verified in the bitcoin/bitcoin C++ codebase, the January 3, 2009 Genesis coinbase embedding the London Times headline, >55% Foundry USA + AntPool Stratum v1 block-template concentration, the deterministic 21,000,000 BTC GetBlockSubsidy schedule, rigid 2,016-block (14-day PowTargetTimespan = 1209600s) DAA freeze (100-min blocks / ~10w on a 10% shard), ActivateBestChain nChainWork amputation + 4-layer minority commerce loss (while pre-cut UTXOs survive), and nPowTargetSpacing = 600s (~7 TPS) sequential latency. Bitcoin scores 4.40 out of 6.00 across the six physical invariants (01: 0.95, 02: 1.00, 03: 1.00, 04: 0.65, 05: 0.60, 06: 0.20), earning a compliance grade of B+.',
    invariants: [
      {
        id: '01',
        shortName: 'Sovereignty',
        title: 'Existential Sovereignty & Entity Decoupling',
        telemetry: 'Immaculate 2009 Genesis • Stratum v2 Pledge (~75%) vs ~3–5% Live Job Declaration',
        score: 0.95,
        quickSummary:
          'Immaculate Jan 2009 fair launch and vanished founder, losing 0.05 because >55% of block templates remain controlled by Foundry USA + AntPool despite May 2026 Stratum v2 Working Group pledges (~3–5% live Job Declaration).',
        paragraph:
          'Bitcoin established the historical benchmark for fair launch on January 3, 2009 with zero premine, zero ICO, zero dev tax, and Satoshi’s permanent disappearance. It deducts 0.05 solely for mining-pool template centralization: Foundry USA and AntPool still construct >55% of sequential templates, and despite the May 2026 Stratum v2 Working Group gathering ~75% pledged pool hashrate, live mainnet miner-side Job Declaration sits near ~3–5%—recovering 1.00 only once >50% of mainnet blocks use miner-built Sv2 templates.',
        geniusParagraph:
          'At the foundational layer of Existential Sovereignty and Entity Decoupling (0.95 / 1.00), Bitcoin established the historic fair-launch standard on January 3, 2009: Satoshi Nakamoto embedded the London Times bailout headline inside the Genesis coinbase scriptSig, mined with zero premine, zero ICO, zero VC cliffs, and a 0% coinbase tax, and permanently vanished—leaving zero freeze keys or admin multisigs in `bitcoin/bitcoin`. Strict adherence to the canonical sovereignty rubric (`0.80–0.95` for zero-premine PoW tempered by single-leader pool concentration) deducts 0.05 because just two centralized `Stratum v1` pools—Foundry USA (~31%) and AntPool (~26%), with Top 3 exceeding ~68%—monopolize sequential 10-minute block-template construction. Crucially, while the May 2026 Stratum v2 Working Group enlisted Foundry, AntPool, F2Pool, SpiderPool, MARA, Block, and DMND (~75% of pledged global hashrate), live mainnet miner-controlled *Job Declaration* template construction remains only ~3–5% deployed; Bitcoin recovers `1.00` only if >50% of live mainnet blocks transition to independent miner-built Stratum v2 Job Declaration templates.',
        receipts: ['0 Premine / 0 ICO / 0% Dev Tax', 'Foundry + AntPool >55% Templates', 'May 2026 Sv2 Pledges (~75%) vs ~3–5% Live', '1.00 Trigger: >50% Miner Sv2 Templates']
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
        telemetry: '2,016-Block DAA Freeze • nChainWork Minority Amputation',
        score: 0.65,
        quickSummary:
          'Pre-cut UTXOs survive across severed continents without halting, yet a rigid 2,016-block epoch freezes a 10% shard at ~100-min blocks for ~10 weeks before ActivateBestChain orphans 100% of lower-nChainWork blocks & triggers 4-layer minority commerce loss.',
        paragraph:
          'Unlike BFT PoS chains that halt when 33.4% disconnects, pre-partition Bitcoin UTXOs survive and isolated shards keep mining. Yet Bitcoin’s rigid 2,016-block difficulty epoch freezes a 10% partition at ~100-minute blocks for ~10 weeks while mempools choke—and on resplice, bitcoind’s nChainWork (not nHeight) orphans 100% of minority blocks, triggering 6-conf revocation, COINBASE_MATURITY = 100 taint invalidation (removeForReorg), 20 MB disconnectpool overflows, and height-lock failures.',
        geniusParagraph:
          'Under wartime network partitions, Bitcoin scores 0.65 / 1.00 on Dynamic Availability under exact bitcoind C++ mechanics: untouched pre-partition UTXOs survive on both sides without a BFT quorum halt. However, Bitcoin’s rigid 2,016-block DAA epoch (PowTargetTimespan = 1,209,600s) slows a 10% isolated partition from 10-minute blocks to ~100-minute blocks for ~10 weeks before retargeting. Upon resplice, bitcoind ActivateBestChain enforces cumulative nChainWork—not block height (nHeight)—orphaning 100% of the lower-work branch even if it had crossed a DAA drop and mined more blocks. That amputation triggers 4-layer minority commerce destruction: (1) 6-confirmation payments drop back to 0 confs (exposing merchants to double-spends/RBF); (2) COINBASE_MATURITY = 100 + removeForReorg permanently invalidates minority block rewards and every downstream spend touching 1 satoshi of post-split coinbase BTC; (3) MAX_DISCONNECTED_TX_POOL_BYTES (20 MB, ~10–12 blocks) overflows in multi-hour/multi-day reorgs while DEFAULT_MAX_MEMPOOL_SIZE (300 MB) and DEFAULT_MEMPOOL_EXPIRY (336h / 14d) drop unconfirmed backlogs; (4) nLockTime, OP_CLTV, OP_CSV, and HTLC timeouts become non-final when rewound to lower height.',
        receipts: ['Pre-Cut UTXOs Survive • 2,016-Blk DAA Freeze', 'nChainWork Amputation (100% Minority Blocks)', '20 MB disconnectpool Overflow & 14d Expiry', 'removeForReorg Taint + Height-Lock Invalidation']
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
        telemetry: '3.5-Day Retarget (25m / ~3.5w at 10%) • nChainWork Amputation',
        score: 0.7,
        quickSummary:
          'Remains live across severed cables and retargets 4x faster than Bitcoin (3.5d -> ~25m blocks / ~3.5w at 10% shard), though pre-cut UTXOs survive while litecoind nChainWork still orphans 100% of minority blocks on resplice.',
        paragraph:
          'During an undersea cable cut, pre-partition UTXOs survive intact and isolated Litecoin branches keep mining without BFT halts—slowing a 10% shard to ~25-minute blocks for ~3.5 weeks across nPowTargetTimespan = 302,400s (4x faster than Bitcoin’s ~10-week lag). Yet at resplice, litecoind inherits bitcoind’s nChainWork rule: orphaning 100% of lower-work minority blocks (M < 1.0), revoking 6-conf finality, purging COINBASE_MATURITY=100 taints (removeForReorg), overflowing the 20 MB disconnectpool, and invalidating height locks.',
        geniusParagraph:
          'Under wartime network partition, Litecoin scores 0.70 / 1.00 on Dynamic Availability—outscoring Bitcoin (`0.65`) inside the sequential Nakamoto PoW bracket (`0.55–0.75`) because `nPowTargetSpacing = 150` seconds and `nPowTargetTimespan = 302,400` seconds (`3.5 days`) slow a 10% isolated shard to ~25-minute blocks for ~3.5 weeks (4x faster than Bitcoin’s ~100-minute / ~10-week epoch freeze) alongside ~8x higher UTXO capacity. At resplice, pre-partition UTXOs survive intact, yet because `litecoin-project/litecoin` shares `bitcoind`’s C++ consensus core, `ActivateBestChain` enforces cumulative `nChainWork` (not `nHeight`): orphaning 100% of lower-work minority blocks and burned Scrypt energy (`M < 1.0`), stripping settlement finality back to 0 confirmations, invalidating `COINBASE_MATURITY = 100` coinbase chains (`removeForReorg`), dropping excess disconnected transactions past the 20 MB `disconnectpool` cap (`MAX_DISCONNECTED_TX_POOL_BYTES`), and turning minority height locks `non-final`.',
        receipts: ['Pre-Cut UTXOs Survive Reorg', '3.5d Retarget (~25m / ~3.5w at 10%)', 'nChainWork + COINBASE_MATURITY=100 Purge', '20 MB disconnectpool Overflow Risk']
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
          'Igra earns 0.85 / 1.00 on Historical Immutability and the Physical Arrow of Time because—unlike standalone Proof-of-Stake sidechains or centralized L2s with separate data-availability committees—Igra embeds RLP-encoded EVM payloads directly inside Kaspa Layer-1 transactions anchored by Toccata `KIP-21` partitioned sequencing commitments. Consequently, its canonical transaction ordering and data availability are calcified by Kaspa’s full kHeavyHash ASIC thermal wall: rewriting Igra’s ledger history requires 51%-reorging Kaspa Layer 1 itself, losing 0.15 solely for $IGRA-staked PoS state-root attestations on external bridge exits prior to full L1 Zero-Knowledge proof verification.',
        receipts: ['Sequenced via Kaspa KIP-21 L1', 'Protected by Global kHeavyHash PoW', 'Deterministic viaduct + reth Replay', 'PoS Attesters Only on External Exits']
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
        telemetry: 'HTLC Expiry Flood-and-Loot + nChainWork Minority Amputation',
        score: 0.35,
        quickSummary:
          'Wartime fiber cuts break interactive invoice signing, trigger cascading HTLC timeouts that jam Bitcoin’s ~7 TPS L1 (with a 10% shard crawling at 100-min blocks), and orphan all minority-branch L1 sweeps on resplice.',
        paragraph:
          'Lightning suffers a triple wartime failure: first, recipients must stay online to sign invoices/updates; second, severed undersea cables freeze cross-continent HTLCs until CLTV expiry, triggering mass unilateral force-closes ("Flood & Loot" CVE-2020-26895) onto Bitcoin L1 while a 10% isolated shard crawls at 100-min blocks; third, on resplice, bitcoind nChainWork reorg orphans 100% of minority-branch channel closes, drops 20 MB+ disconnectpool TXs, and breaks height-locked HTLCs.',
        geniusParagraph:
          'Under the stress of a wartime network partition, Lightning’s interactive architecture degrades to 0.35 / 1.00 on Dynamic Availability. First, unlike stateless PoW UTXOs receivable offline, Lightning requires live interactive bidirectional messaging (`update_add_htlc` / `update_fulfill_htlc`). Second, severing undersea fiber freezes multi-hop HTLCs until `cltv_expiry` heights force mass emergency **force-closes** (**Flood & Loot, `CVE-2020-26895`**) onto Bitcoin L1—made far worse if a 10% minority partition slows under Bitcoin’s 2,016-block DAA freeze to 100-minute blocks for ~10 weeks, saturating blocks and pricing out anchor-output fee bumps. Third, while pre-partition UTXOs survive, Bitcoin’s `ActivateBestChain` (`nChainWork`) orphans 100% of minority-branch channel opens, splices, and timeout sweeps on resplice—revoking 6-conf finality, overflowing `MAX_DISCONNECTED_TX_POOL_BYTES` (20 MB), purging coinbase-tainted fee spends (`removeForReorg`), and making height-locked `OP_CSV`/`OP_CLTV` and HTLC timeouts `non-final`.',
        receipts: [
          'Mandatory Online Interactive Receiver',
          'CVE-2020-26895 Flood & Loot Mass Exit',
          '100-Min Block Crawl on 10% BTC Shard',
          'nChainWork Amputation + HTLC Non-Final Rewind'
        ]
      },
      {
        id: '05',
        shortName: 'State Topology',
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
        telemetry: 'Survives Split • Resplice Orphans Minority & Poisons 16-Decoys (Pre-FCMP++)',
        score: 0.45,
        quickSummary:
          'Per-block DAA adjusts across severed cables, but resplicing orphans the minority branch, invalidates 60-block coinbase chains, and poisons 16-member RingCT decoys (a ring-poisoning flaw FCMP++ mainnet activation will resolve).',
        paragraph:
          'Monero survives wartime blackouts via rolling 720-block difficulty adjustment, but upon resplicing Blockchain::switch_to_alternative_blockchain orphans the minority branch, destroys 60-block (~2h) unlocked coinbase chains, and breaks honest transactions whose 16-member rings selected vanished minority decoys. Activating Full-Chain Membership Proofs (FCMP++, curve trees in v0.19.0.0-beta.3.0 stressnet) on mainnet will eliminate RingCT decoy-index poisoning—leaving single-chain reorgs, coinbase taint loss, and 20-min spend locks.',
        geniusParagraph:
          'Under a wartime network partition, Monero survives the initial blackout via per-block difficulty adjustment (`DIFFICULTY_WINDOW = 720`, `DIFFICULTY_CUT = 60`, proven during the March 4, 2024 mempool flood `300,000`-byte block expansion) but catastrophically fails Dynamic Availability (0.45 / 1.00) at network resplicing: repairing a severed undersea cable triggers `Blockchain::switch_to_alternative_blockchain`, ruthlessly orphaning the minority continent’s entire chain, invalidating 60-block unlocked coinbase chains (`CRYPTONOTE_MINED_MONEY_UNLOCK_WINDOW = 60`), and triggering cascading `RingCT` decoy-index poisoning (`tx_verification_context::m_verifivation_failed`) that breaks thousands of honest user transactions whose 16-member rings referenced vanished minority outputs. Notably, promoting `FCMP++` (Full-Chain Membership Proofs, replacing 16-output rings with full-chain curve trees currently in `v0.19.0.0-beta.3.0` stressnet testing) to mainnet will eliminate this specific ring-poisoning failure mode upon re-audit, though single-chain minority reorgs and 2-hour coinbase loss remain.',
        receipts: ['Per-Block 720-Window DAA', 'Resplice Minority Chain Wipeout', '16-Decoy RingCT Poisoning (Pre-FCMP++)', 'FCMP++ Trigger Removes Ring Poisoning']
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
export const GENIUS_FORENSIC_ESSAYS: Record<string, string[]> = {
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
    'Evaluating Kaspa (KAS) against the six physical invariants of a sovereign ledger reveals the benchmark Proof-of-Work BlockDAG engineered from first principles on live GHOSTDAG (10 BPS Crescendo) + Toccata (June 2026 Covenants) to obey the laws of thermodynamics without corporate capture, genesis premines, or single-chain bottlenecks. At the foundational layer of Existential Sovereignty and Entity Decoupling, Kaspa passed at Genesis without compromise. Launched on November 7, 2021 from an immaculate empty genesis state following polymath Yonatan Sompolinsky’s GHOSTDAG and PHANTOM peer-reviewed research, the network entered existence with zero premine, zero instamine, zero ICO, zero venture capital token cliffs, zero corporate foundation treasury, and a strictly 0% protocol coinbase developer tax. Unlike corporate Proof-of-Stake ledgers or taxed Proof-of-Work chains that hardcode founder spigots into consensus, no legal entity, CEO, or administrative multisig holds privileged protocol keys, freeze switches, or upgrade overrides—leaving the rusty-kaspa consensus engine completely decoupled from institutional coercion or regulatory subpoena.',
    'This parentless, sovereign foundation is anchored to an unyielding adherence to the Thermodynamic Cost Floor (E > 0). Every single atomic sompi (10^-8 KAS) across Kaspa’s deterministic 28.7-billion maximum supply (~96.79% already mined under its smooth monthly geometric Chromatic Halving schedule that reduces block subsidies by (1/2)^(1/12) every month) is forged exclusively through the irreversible dissipation of real-world electrical megawatts across dedicated optical-matrix kHeavyHash ASIC silicon. Because 100% of monetary issuance is earned through open, untaxed bare-metal hash work with zero pre-printed insider bags, Kaspa completely eliminates the Cantillon extraction loop—forcing every participant on Earth to expend real kinetic energy to write state to the ledger.',
    'Because Kaspa welds state finality directly to irreversible heat dissipation, it satisfies the invariant of Historical Immutability and the Physical Arrow of Time with mathematical finality. Governed by the Second Law of Thermodynamics and Landauer’s Principle (ΔQ ≥ kB·T·ln2), rewriting settled Kaspa blocks requires an adversary to physically re-burn every megawatt-hour of global ASIC work accumulated across the BlockDAG since that block was sealed. Furthermore, while rusty-kaspa maintains a lightweight 30-hour (`pruning_depth = 1,080,000`) rolling pruning horizon so ordinary operators can run bare-metal full nodes on a modest Crescendo baseline (`8 CPU cores / 16 GB RAM / 256 GB NVMe SSD / ~5 MB/s ≈ 40–50 Mbps` sustained bandwidth, distinct from archival indexers), newly syncing nodes never rely on trusted corporate Amazon S3 snapshots or social Weak Subjectivity checkpoints; instead, nodes cryptographically verify cumulative Proof-of-Work all the way from Genesis via deterministic Pruning Point and Proof-of-Proof-of-Work (PoPoW) header chains.',
    'Under the stress of a wartime network partition, Kaspa earns 1.00 / 1.00 on Dynamic Availability strictly on live mainnet GHOSTDAG at 10 BPS + KIP-14 Sampled DAA (with DAGKnight KIP-2 explicitly tagged [Roadmap / KIP-2 Proposed — In Testnet-13 Review] and excluded from active scoring). Whereas BFT Proof-of-Stake databases suffer instant global cardiac arrest at 33.4% offline stake and Bitcoin’s rigid 2,016-block epoch slows a 10% isolated shard to 100-minute blocks for ~10 weeks, isolated Kaspa partitions recalculate difficulty every single 100ms block via KIP-14 Sampled DAA (~44-minute / 26,410-DAA-block window), allowing even a 10% hashrate shard to ramp cleanly back to 10.0 BPS within hours. Upon resplice, live rusty-kaspa enforces exact consensus bounds: inside merge_depth = 36,000 (< 1 hour, mergeset_size_limit = 248, k = 124), parallel sub-DAGs weave cleanly into one unified BlockDAG preserving all non-conflicting UTXOs (marking high-anticone side blocks red); between 1 and 12 hours (36,000–432,000 blocks, ViolatingBoundedMergeDepth), nodes reorganize cleanly onto heavier cumulative Blue Work and return non-conflicting minority TXs to mempool; past 12 hours (finality_depth = 432,000), nodes trigger a FinalityConflict lock requiring explicit operator --override-params intervention.',
    'Examining Kaspa’s State Machine Topology and Thermodynamic Velocity (M = 1.0) exposes why generalizing Nakamoto consensus from a sequential line into a parallel directed acyclic graph solves the blockchain trilemma within the laws of physics. Kaspa rejects monolithic shared-account virtual machines (EVM/SVM) that trap global commerce inside sequential write locks, gas wars, reentrancy exploits, and predatory MEV sandwich queues. Instead, Kaspa operates a stateless, contention-free parallel Extended UTXO graph upgraded on June 30, 2026 at DAA score 474,165,565 with the Toccata hardfork—embedding native Layer-1 Covenants, SilverScript smart-contract programmability, KIP-21 partitioned sequencing commitments (anchoring based rollups deterministically to L1 DAG ordering), and succinct Zero-Knowledge verification opcodes directly into base silicon consensus. Running live at 10 blocks per second (100ms block intervals) on the Crescendo mainnet within an accessible consumer node footprint, Kaspa weaves 100% of concurrent global hash power into consensus simultaneously without discarding competing blocks as wasted orphans—achieving optimal Thermodynamic Velocity (M = 1.0).',
    'Evaluating these findings through the GRADE evidence certainty framework yields a High Certainty rating, as every architectural metric—from the November 7, 2021 zero-premine genesis launch, the 28.7-billion Chromatic emission schedule, and 100% untaxed kHeavyHash ASIC Proof-of-Work to cryptographic PoPoW pruning proofs, KIP-14 per-block DAA (~44m window), rusty-kaspa merge_depth = 36,000 & finality_depth = 432,000 bounds, the June 30, 2026 Toccata covenant activation (DAA 474,165,565), and ~2.5+ billion mainnet transactions settled at 10 BPS—is empirically verifiable in active mainnet kaspanet/rusty-kaspa Rust consensus code (independent of unactivated DAGKnight [Roadmap / KIP-2 Proposed — In Testnet-13 Review]). Kaspa scores a 6.00 out of 6.00 across all six thermodynamic invariants, earning a terminal compliance grade of A+. It is the sovereign, high-velocity Proof-of-Work BlockDAG standard against which all other digital ledgers are measured.'
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
    'Under the stress of a wartime network partition, Monero’s sequential single-chain architecture survives the initial blackout but catastrophically fails Dynamic Availability at the moment of network resplicing. During the partition itself, Monero avoids the instant 2f+1 (>66.7%) supermajority halt threshold that paralyzes Byzantine Fault Tolerant (BFT) Proof-of-Stake databases: its per-block difficulty adjustment algorithm (DIFFICULTY_WINDOW = 720 blocks, stripping the top and bottom DIFFICULTY_CUT = 60 extreme timestamps across a rolling 600-block / 20-hour window) dynamically scales down to match surviving local CPU silicon, as proven during the March 4, 2024 mempool flood (CRYPTONOTE_BLOCK_GRANTED_FULL_REWARD_ZONE_V5 = 300000 bytes dynamic block expansion) and the August 2025 Qubic selfish-mining offensive across blocks 3,475,729–3,475,850. However, because Monero forces consensus into a single sequential chain rather than a parallel BlockDAG, repairing a severed undersea fiber-optic cable triggers Blockchain::switch_to_alternative_blockchain—a deep Nakamoto chain reorganization that ruthlessly orphans and annihilates the entire minority continent’s ledger history. Every Joule of electricity burned by miners on the minority partition is destroyed (M < 1.0), every 0.6 XMR block reward minted after the split is erased, and because coinbase rewards unlock after 60 blocks (CRYPTONOTE_MINED_MONEY_UNLOCK_WINDOW = 60, or ~2 hours), every downstream commercial transaction that touched newly mined XMR in a multi-hour partition is invalidated. Worse still, under RingCT, post-partition resplice triggers a cascading transaction massacre even for innocent users spending pre-partition coins: because wallets construct 16-member ring signatures using a gamma distribution selecting recent outputs past the 10-block / 20-minute lock, the moment the minority branch is orphaned, those decoy outputs vanish and global output indices shift—rendering honest transactions cryptographically invalid (tx_verification_context::m_verifivation_failed). Activating Full-Chain Membership Proofs (FCMP++ curve trees in v0.19.0.0-beta.3.0 stressnet) on mainnet will eliminate that specific ring-poisoning vulnerability on re-audit, though single-chain minority reorgs and 2-hour coinbase loss remain structural.',
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
    'Under the stress of a wartime network partition, Lightning’s Dynamic Availability drops to 0.35 / 1.00 across three compounding failure modes. First, recipients must remain online and interactive with 24/7 hot keys just to issue invoices and sign updates. Second, severing undersea fiber-optic cables freezes cross-continent multi-hop `HTLCs` in flight until their `cltv_expiry` heights expire—triggering simultaneous emergency unilateral **force-closes** (**Flood & Loot, `CVE-2020-26895`**) onto Bitcoin’s `600s` (`~7 TPS`) Layer 1, compounded whenever a 10% isolated shard freezes under Bitcoin’s 2,016-block DAA to 100-minute blocks for ~10 weeks and pins justice/timeout sweeps past deadline. Third, at cable resplice, while untouched pre-partition UTXOs survive, Bitcoin’s `ActivateBestChain` (`nChainWork`, not `nHeight`) orphans 100% of minority-branch channel opens, splices, force-closes, and timeout sweeps—overflowing the 20 MB `disconnectpool`, invalidating coinbase-tainted spends (`removeForReorg`), and making height-locked HTLCs `non-final`.',
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
export function getGeniusForensicParagraphs(auditObj: AuditData): string[] {
  if (!auditObj) return [];
  if (Array.isArray(auditObj.geniusParagraphs) && auditObj.geniusParagraphs.length === 6) {
    return auditObj.geniusParagraphs;
  }
  const tk = String(auditObj.ticker || '').toUpperCase();
  if (GENIUS_FORENSIC_ESSAYS[tk]) {
    return GENIUS_FORENSIC_ESSAYS[tk];
  }
  return buildCanonicalGeniusParagraphs(auditObj);
}
