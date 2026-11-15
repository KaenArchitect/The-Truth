export type ThesisChapterId = 'ALL' | 'INVARIANTS' | 'INFLATION' | 'COSMOS';
export type ThesisDepthMode = 'NORMIE' | 'GENIUS';

export interface ThesisLawEquation {
  law: string;
  equation: string;
}

export interface ThesisParagraph {
  id: number;
  chapter: Exclude<ThesisChapterId, 'ALL'>;
  tag: string;
  text: string;
  laws: ThesisLawEquation[];
}

const AXIOM_LAWS_BY_ID: Record<number, ThesisLawEquation[]> = {
  1: [
    {
      law: 'Existential Entity Decoupling & Sovereign Boundary Principle',
      equation: '∂G / ∂E_admin = 0   |   Sovereignty = 0 ⇒ Score_CostFloor ≤ 1.0 ∧ Grade ≤ D+'
    }
  ],
  2: [
    {
      law: 'First Law of Thermodynamics (Conservation of Energy)',
      equation: 'dU = δQ − δW   |   E_mint = P_ASIC · Δt > 0   (E = 0 ⇒ F)'
    }
  ],
  3: [
    {
      law: 'Second Law of Thermodynamics & Landauer’s Principle',
      equation: 'ΔS_universe = ΔS_sys + ΔS_env ≥ 0   |   ΔQ ≥ k_B · T · ln 2'
    }
  ],
  4: [
    {
      law: 'Brewer’s CAP Theorem, FLP Impossibility & Nakamoto Liveness',
      equation: 'BFT Halt: N_offline > ⅓ N_stake   |   PoW Partition: λ_island > 0 ⇒ Live'
    }
  ],
  5: [
    {
      law: 'Disjoint UTXO Mass Conservation & Parallel Verification Bound',
      equation: '∑ UTXO_in = ∑ UTXO_out + Fee   |   U_i ∩ U_j = ∅ ⇒ S(p) = p'
    }
  ],
  6: [
    {
      law: 'Relativistic Optical Speed Limit & Carrier Subordination Law',
      equation: 'v_fiber = c / n ≈ 2.0 × 10⁸ m/s   |   M_overlay < M_L1 ≤ 1.0'
    }
  ],
  7: [
    {
      law: 'Mechanical Equivalent of Heat & Metabolic ATP Conversion',
      equation: '1 kcal = 4,184 J   |   W_workweek ≈ 100 MJ = 1.0 × 10⁸ J'
    }
  ],
  8: [
    {
      law: 'Carnot Efficiency Ceiling & Bureaucratic Waste Heat Law',
      equation: 'η_max = 1 − T_cold / T_hot < 1   |   W_net = W_tax (20 MJ) − Q_friction (8 MJ)'
    }
  ],
  9: [
    {
      law: 'Noether’s Time-Translation Theorem & Zero-Creation Constraint',
      equation: '∂L / ∂t = 0 ⇒ dE / dt = 0   |   Claims (40 MJ) − Tax (20 MJ) ⇒ Theft (20 MJ)'
    }
  ],
  10: [
    {
      law: 'Exponential Paper Lien Divergence vs. Physical Reserve Boundary',
      equation: 'D(t) = D₀ · e^(r·t) ≫ ∫ P_phys(τ) dτ   |   E_reserve = 0.00 J'
    }
  ],
  11: [
    {
      law: 'Enthalpy of Combustion Floor (Hyperinflation Convergence)',
      equation: 'lim_{M → ∞} V_fiat(E = 0) → ΔH°_comb(Cellulose) ≈ 16 MJ / kg'
    }
  ],
  12: [
    {
      law: 'Stefan–Boltzmann Thermal Radiation & Bond Enthalpy Law',
      equation: 'P_rad = ε · σ · A · T⁴   |   ΔE_sketch = 0 ⇒ ΔQ_heat = 0 J'
    }
  ],
  13: [
    {
      law: 'Gravitational Potential Energy & Mechanical Work Integral',
      equation: 'ΔU_g = m · g · h   |   W_canyon = ∫ F_shear · v · dt ≫ 0'
    }
  ],
  14: [
    {
      law: 'Photochemical Endergonic Synthesis & Arrhenius Activation Threshold',
      equation: '6 CO₂ + 6 H₂O + hν → C₆H₁₂O₆ + 6 O₂   |   k = A · e^(−E_a / R·T)'
    }
  ],
  15: [
    {
      law: 'Gibbs Free Energy Decay & Continuous Negentropy Maintenance',
      equation: 'ΔG = ΔH − T·ΔS < 0  (Fe → Fe₂O₃·nH₂O)   ⇒   dW_maint / dt > 0'
    }
  ],
  16: [
    {
      law: 'Asymmetric Energy Extraction & Zero-Joule Weak Subjectivity',
      equation: 'E_consensus = 0 J  ⇒  CostFloor = 0  ∧  |S_fork − S_truth| = 0 J'
    }
  ],
  17: [
    {
      law: 'The Truth 6-Invariant Thermodynamic Audit Functional',
      equation: 'Score_total = ∑_{i=1..6} S_i ∈ [0, 6.0]   |   S₀₂ = 0 ⇒ F   |   S₀₁ = 0 ⇒ ≤ D+'
    }
  ]
};

interface RawThesisParagraph {
  id: number;
  chapter: Exclude<ThesisChapterId, 'ALL'>;
  tag: string;
  text: string;
}

const RAW_NORMIE_PARAGRAPHS: RawThesisParagraph[] = [
  {
    id: 1,
    chapter: 'INVARIANTS',
    tag: '01 • EXISTENTIAL SOVEREIGNTY',
    text: 'A sovereign monetary ledger is not a social construct, a corporate software product, or a democratic agreement; it is a physical machine governed strictly by the laws of thermodynamics and information physics. To survive the relentless pull of entropy, state coercion, and adversarial greed, an architecture must satisfy six non-negotiable physical invariants. At the foundational layer stands Existential Sovereignty and Entity Decoupling, which demands that the protocol emerge from an immaculate, permissionless genesis completely severed from human boards, corporate foundations, or venture capital syndicates. If a monetary network pre-mines its supply in a configuration file, allocates insider treasuries, or relies on registered corporate validators and administrative upgrade keys, it possesses a biological neck that nation-state regulators can choke with a single subpoena. True entity decoupling requires a fair-launch substrate where every single atomic unit is forged in the open market from block zero, ensuring that even if the original creators vanish from the Earth, the network continues operating autonomously as an unfeeling, leaderless force of nature.'
  },
  {
    id: 2,
    chapter: 'INVARIANTS',
    tag: '02 • COST FLOOR E > 0',
    text: 'This structural independence is impossible without the second invariant: the Thermodynamic Cost Floor (E > 0), anchored in the First Law of Thermodynamics and the Conservation of Energy. Because energy can neither be created nor destroyed, genuine value in the physical universe—whether a biological organism resisting cellular decay, a canyon carved by kinetic water, or gold extracted from the Earth’s crust—requires an irreversible expenditure of real-world Joules. A sovereign currency must embed this unforgeable costliness directly into its issuance via pure Nakamoto Proof-of-Work, forcing miners to burn continuous megawatts of electricity across physical silicon to mint a single coin. Any Proof-of-Stake, Proof-of-Authority, or Federated Byzantine system that conjures tokens out of thin air at 0 joules of energetic sacrifice is a digital fiat counterfeit machine, institutionalizing the Cantillon Effect by allowing corporate insiders at the genesis spigot to trade weightless keystrokes for the real kinetic sweat and life-force of the working class.'
  },
  {
    id: 3,
    chapter: 'INVARIANTS',
    tag: '03 • LANDAUER’S PRINCIPLE',
    text: 'When consensus is anchored strictly to burned energy, it automatically enforces the third invariant: Historical Immutability and the Physical Arrow of Time, governed by the Second Law of Thermodynamics and Landauer’s Principle. Recording and locking information into a physical substrate requires the irreversible dissipation of heat into the environment, creating an asymmetric wall of entropy between the past and the future. In a Proof-of-Work ledger, every confirmed block acts as a kinetic measurement that collapses transactional possibilities into calcified history; rewriting that past requires an attacker to physically re-burn every megawatt-hour of electricity expended by the global ASIC fleet since that block was sealed. Conversely, zero-joule Proof-of-Stake networks secure their ledgers with weightless cryptographic signatures, leaving their history massless, trapped in "weak subjectivity," and perpetually vulnerable to costless long-range rollbacks or administrative rewrites whenever a validator cartel decides to alter the timeline.'
  },
  {
    id: 4,
    chapter: 'INVARIANTS',
    tag: '04 • WARTIME PARTITION',
    text: 'This physical mass must remain functional under maximum geopolitical trauma, which defines the fourth invariant: Dynamic Availability under a wartime network partition. Classical Byzantine Fault Tolerant (BFT) Proof-of-Stake architectures are engineered for peacetime data centers, requiring continuous, synchronous communication and a rigid two-thirds (>66.7%) supermajority of staked voting weight to finalize blocks. The moment a sovereign firewall, internet blackout, or severed undersea fiber-optic cable isolates just 33.4% of staked validators, a BFT network either flatlines completely or bleeds offline validators to create permanent, irreconcilable split-brain ledgers. A sovereign Proof-of-Work engine bound by parameterless DAG consensus never halts; isolated landmasses continue mining and ordering transactions autonomously along whatever local electrical gradient survives, and when the severed cables are spliced back together, the partitions seamlessly and deterministically weave their parallel histories back into a single unified ledger strictly by evaluating accumulated Proof-of-Work.'
  },
  {
    id: 5,
    chapter: 'INVARIANTS',
    tag: '05 • STATE MACHINE TOPOLOGY',
    text: 'For an unhaltable ledger to remain resistant to systemic capture over centuries, it must obey the fifth invariant: Stateless, Parallel State Machine Topology. Account-based virtual machines pack global balances, permissions, and contract state into a single contested mutex tree—creating serial write-lock bottlenecks, extractive front-running (MEV), mandatory state-rent seizures, and native freeze or clawback hooks at the protocol base. By contrast, a pure Unspent Transaction Output (UTXO) graph decomposes every unit of value into isolated cryptographic coins whose validity can be checked independently in parallel across cores without lock contention, pruning spent outputs safely while keeping total monetary supply arithmetically verifiable in plaintext from genesis.'
  },
  {
    id: 6,
    chapter: 'INVARIANTS',
    tag: '06 • VELOCITY M = 1.0',
    text: 'Finally, a monetary machine built to carry planetary commerce cannot waste the energy it burns through linear bottlenecks; it must achieve the sixth invariant: Thermodynamic Velocity (M = 1.0) at the physical speed limit of light through optical fiber. Sequential single-chain architectures such as Bitcoin force honest concurrent blocks mined simultaneously across continents to collide as stale orphans, capping real Layer-1 finality at slow 600-second epochs and forcing everyday users back into custodial IOU layers. Through GHOSTDAG ordering today and parameterless DAGKNIGHT [Roadmap / KIP-2 Proposed — In Testnet-13 Review], a parallel Proof-of-Work BlockDAG converts 100% of honest concurrent hash power into forward security and parallel throughput—reaching 10+ blocks per second on Layer 1 with zero wasted orphan work.'
  },
  {
    id: 7,
    chapter: 'INFLATION',
    tag: '07 • HUMAN WORK AS JOULES',
    text: 'Once you view economics through physics rather than fiat accounting tricks, inflation ceases to be a mysterious macroeconomic variable and reveals itself as an explicit theft of biological work. Every human calorie equals 4,184 Joules of chemical potential energy stored in food and metabolized through muscle and brain tissue to reorder matter against entropy. Across a standard forty-hour workweek of physical exertion, focus, and technical labor, a productive human worker expends roughly 100 megajoules (100 MJ) of irreversible biological work into real goods, maintained infrastructure, food, or verifiable energy.'
  },
  {
    id: 8,
    chapter: 'INFLATION',
    tag: '08 • TAX & ENTROPY FRICTION',
    text: 'When a state levies an explicit twenty percent income or consumption tax on that worker’s output, it confiscates 20 MJ of kinetic human effort directly at the source. Worse still, running an uncompetitive, bloated administrative apparatus to collect, audit, and redistribute that claim generates pure thermodynamic friction—squandering roughly 8 MJ in deadweight bureaucratic waste heat that builds zero bridges, harvests zero wheat, and adds zero real computational security to society.'
  },
  {
    id: 9,
    chapter: 'INFLATION',
    tag: '09 • UNFUNDED PROMISES',
    text: 'Because no political class survives if it openly taxes citizens for every promise it makes, governments close the gap by conjuring unbacked monetary claims out of thin air. When politicians issue 40 MJ of spending promises against only 20 MJ of real productive energy extracted via taxation, the missing 20 MJ deficit cannot be materialized from a vacuum—the First Law of Thermodynamics forbids free energy. Instead, central banks inject unbacked currency units at zero energetic cost, silently siphoning purchasing power out of every worker’s saved hours until prices re-equilibrate to the true scarcity of physical output.'
  },
  {
    id: 10,
    chapter: 'INFLATION',
    tag: '10 • $35T ZERO-JOULE LIEN',
    text: 'Compounded over decades, this divergence accumulates into an impossible energetic lien: over $35+ trillion in sovereign debt obligations backed by 0.00 Joules of physical reserve work. Every newly printed treasury bond is a paper claim demanding future megajoules of labor from generations not yet born, mathematically guaranteeing that the underlying unit of account must either overtly default or covertly evaporate in real purchasing power against finite matter and proof-of-work energy.'
  },
  {
    id: 11,
    chapter: 'INFLATION',
    tag: '11 • WEIMAR 16 MJ/KG KINDLING',
    text: 'History demonstrated the terminal boundary of zero-joule money during the 1923 Weimar hyperinflation. When the Reichsbank multiplied paper Marks faster than coal, grain, or human muscle could be harvested, citizens literally hauled banknotes in wheelbarrows to burn in kitchen stoves—because stamped paper notes carried zero monetary energy cost and fell below their own raw chemical fuel value as cellulose wood pulp (~16 MJ/kg of dry kindling heat).'
  },
  {
    id: 12,
    chapter: 'INFLATION',
    tag: '12 • SKETCH OF A FIRE',
    text: 'Issuing zero-joule fiat currency or pre-minted Proof-of-Stake tokens to simulate real capital is indistinguishable from drawing a charcoal sketch of a campfire on a freezing cabin wall and expecting the painting to warm your hands. No matter how intricate the governance vote, slashing formula, or marketing narrative around the drawing, only burning real molecular bonds or irreversible electrical Joules emits real heat across spacetime.'
  },
  {
    id: 13,
    chapter: 'COSMOS',
    tag: '13 • GRAND CANYON KINETIC WORK',
    text: 'The universe itself runs exclusively on Proof-of-Work; nature never validates history with cheap signatures or consensus committees. Stand at the rim of the Grand Canyon and you are looking at an unforgeable geological ledger: millions of years of solar-lifted rainfall and gravitational kinetic river flow physically carving a mile deep into solid granite and limestone. Nobody can fake the canyon with an administrative decree or a quorum vote—only centuries of cumulative mechanical Joules leave that stratigraphic record.'
  },
  {
    id: 14,
    chapter: 'COSMOS',
    tag: '14 • SEQUOIA & TREE RINGS',
    text: 'Biology records time with the exact same irreversible thermodynamics. Every concentric growth ring locked inside an ancient trunk preserves a chemical proof-of-photosynthesis season forged from photons, soil minerals, and atmospheric carbon. Even the Giant Sequoia encodes natural thermodynamic disaster recovery in its architecture: its serotinous cones remain resin-sealed for decades until intense wildfire heat physically melts the resin open, proving survival requires surviving real thermal energy.'
  },
  {
    id: 15,
    chapter: 'COSMOS',
    tag: '15 • STREET SIGN & ENTROPY',
    text: 'Even a painted steel street sign standing on an ordinary highway illustrates the perpetual cost of preserving order against the Second Law of Thermodynamics. From the moment iron ore is smelted in a blast furnace, stamped, galvanized, and bolted into concrete, atmospheric oxygen, rain, and ultraviolet radiation relentlessly attack the metal to return it to low-energy rust and iron oxide. Order never stays intact for free; maintenance demands continuous energy.'
  },
  {
    id: 16,
    chapter: 'COSMOS',
    tag: '16 • WHY FIAT & POS FAIL',
    text: 'This is why central-bank fiat printing and zero-joule Proof-of-Stake protocols are not merely flawed economic designs—they are an ontological insult to the architecture of physical reality. Both pretend that ledger authority, wealth preservation, and historical finality can exist at 0.00 Joules of ongoing thermodynamic sacrifice, letting incumbents print weightless ledger entries to harvest the finite biological life-hours of people working inside the real physical universe.'
  },
  {
    id: 17,
    chapter: 'COSMOS',
    tag: '17 • THE TRUTH AUDIT LAW',
    text: 'That realization is what forged The Truth: stop grading narratives, celebrity founders, roadmaps, or market-cap illusions, and weigh every currency strictly against the conservation laws that govern stars, rocks, biological cells, and silicon ASICs. Measure Existential Sovereignty, E > 0 Cost Floor, Landauer Immutability, Wartime Availability, Stateless Topology, and Velocity M = 1.0—because physics never negotiates, never bails out insiders, and always settles the final ledger in Joules.'
  }
];

const RAW_GENIUS_PARAGRAPHS: RawThesisParagraph[] = [
  {
    id: 1,
    chapter: 'INVARIANTS',
    tag: '01 • EXISTENTIAL SOVEREIGNTY & ENTITY DECOUPLING',
    text: 'A sovereign monetary ledger is not a social construct, a corporate software product, or a democratic agreement; it is a physical machine governed strictly by the laws of thermodynamics and information physics. To survive the relentless pull of entropy, state coercion, and adversarial greed, an architecture must satisfy six non-negotiable physical invariants. At the foundational layer stands Existential Sovereignty and Entity Decoupling, which demands that the protocol emerge from an immaculate, permissionless genesis completely severed from human boards, corporate foundations, or venture capital syndicates. If a monetary network pre-mines its supply in a configuration file, allocates insider treasuries, vests multi-sig admin keys, or relies on registered corporate validators and trademarked governance councils, it possesses a biological neck that nation-state regulators can choke with a single subpoena, OFAC injunction, or DNS seizure. Because law-enforcement pressure propagates asymptotically to the single locus of human control—and because a chain whose upgrade path or finality halt switch can be coerced inherits the risk envelope of its weakest human custodian (Sovereignty = 0 caps any derivative cost floor strictly at <= 1.0)—true entity decoupling requires a fair-launch substrate where every single atomic unit is forged in the open market from block zero, ensuring that even if the original creators vanish from the Earth or turn hostile, the network continues operating autonomously as an unfeeling, leaderless force of nature.'
  },
  {
    id: 2,
    chapter: 'INVARIANTS',
    tag: '02 • FIRST LAW & THERMODYNAMIC COST FLOOR (E > 0)',
    text: 'This structural independence is impossible without the second invariant: the Thermodynamic Cost Floor (E > 0), anchored in the First Law of Thermodynamics (dU = dQ - dW) and the Conservation of Energy. Because energy can neither be created nor destroyed across any closed or open physical boundary, genuine value in the physical universe—whether a biological organism maintaining negative internal entropy against cellular decay, a canyon carved over millennia by gravitational kinetic water, or metallic gold concentrated inside the Earth’s crust through supernovae and hydrothermal work—requires an irreversible expenditure of real-world Joules. A sovereign currency must embed this unforgeable physical costliness directly into its marginal issuance via pure Nakamoto Proof-of-Work (dW = P_ASIC * t > 0), forcing autonomous miners to burn continuous megawatts of electrical energy across real thermodynamic silicon furnaces to mint a single coin. Under pure PoW equilibrium, marginal extraction cost converges dynamically toward marginal market price through competitive physical arbitrage; if an asset has E = 0, no such energy arbitrage boundary exists, and insider supply creation is thermodynamically free. Any Proof-of-Stake, Proof-of-Authority, Delegated PoS, or Federated Byzantine system that conjures tokens out of thin air at 0.00 Joules of ongoing energetic sacrifice is mathematically a digital fiat counterfeit machine, institutionalizing the Cantillon Effect by allowing corporate insiders at the genesis spigot to trade weightless keystrokes for the real kinetic sweat and finite metabolic life-force of the working class.'
  },
  {
    id: 3,
    chapter: 'INVARIANTS',
    tag: '03 • SECOND LAW & LANDAUER’S ARROW OF TIME',
    text: 'When consensus is anchored strictly to burned energy, it automatically enforces the third invariant: Historical Immutability and the Physical Arrow of Time, governed by the Second Law of Thermodynamics (dS_universe >= 0) and Landauer’s Principle (Delta Q >= k_B * T * ln 2 per irreversibly erased bit of state entropy). Recording, ordering, and locking information into a physical substrate requires the irreversible dissipation of low-entropy free energy as waste heat into the cosmic environment, creating a strict, non-negotiable thermodynamic asymmetry between the past and the future. In a Proof-of-Work ledger, every confirmed block acts as an irreversible kinetic measurement across billions of tera-hashes that collapses transactional uncertainty into calcified historical mass; rewriting depth D into the past requires an adversary to physically assemble equivalent silicon ASIC mass and re-burn every megawatt-hour of electrical work expended by the global hash-rate fleet since that height was sealed—without benefiting from any shortcut inside the laws of physics. Conversely, zero-joule Proof-of-Stake networks secure their ledgers with weightless, reversible ECDSA/BLS/Ed25519 cryptographic signatures whose generation costs microscopic fractions of a millijoule. Once private keys age past the unbonding horizon, nothing in thermodynamics prevents a historical validator cartel from signing an alternate branch for zero marginal cost—leaving PoS history massless, permanently trapped in Vitalik Buterin’s own admitted "weak subjectivity" trust loop (requiring external human social checkpoints to decide truth), and perpetually vulnerable to costless long-range rollbacks, nothing-at-stake forks, or administrative social-slashing rewrites whenever insiders decide to alter the timeline.'
  },
  {
    id: 4,
    chapter: 'INVARIANTS',
    tag: '04 • DYNAMIC AVAILABILITY UNDER WARTIME PARTITION',
    text: 'This physical mass must remain functional under maximum geopolitical trauma, which defines the fourth invariant: Dynamic Availability under a wartime network partition—a direct physical consequence of Brewer’s CAP Theorem and the FLP impossibility boundary. Classical Byzantine Fault Tolerant (BFT) Proof-of-Stake architectures (Tendermint, Casper FFG, Tower BFT, HotStuff) choose synchronous/partially-synchronous safety prioritization calibrated strictly for peacetime data centers, requiring continuous, bidirectional gossip and a rigid two-thirds (>66.7%) supermajority of staked voting weight to advance finality. The moment a sovereign BGP blackhole, wartime EMP, national firewall, or severed undersea fiber-optic cable isolates just 33.4% of staked validators across continents, a BFT network suffers total liveness collapse: finality freezes, mempools stall, inactivity-leak slashing confiscates trapped honest validators, and surviving islands fracture into permanent, irreconcilable split-brain ledgers that require manual out-of-band human governance treaties to reconcile. By contrast, a sovereign Proof-of-Work engine bound by parameterless DAG consensus never halts under partition; isolated continents continue hashing blocks and clearing commerce autonomously along whatever local electrical gradient survives, dynamically calibrating target difficulty per block (such as KIP-14 Sampled DAA over a ~44-minute 26,410-block window rather than freezing for ~10 weeks across a rigid 2,016-block epoch), and when the severed fiber cables are spliced back together, partitions within bounded merge depth cleanly weave parallel histories back into one deterministic unified ledger—or cleanly resolve strictly by accumulated physical Blue Work—without ever surrendering liveness to a committee.'
  },
  {
    id: 5,
    chapter: 'INVARIANTS',
    tag: '05 • STATELESS PARALLEL UTXO TOPOLOGY VS MUTEX STATE',
    text: 'For an unhaltable ledger to preserve sovereignty and verification determinism over multi-century timescales, it must obey the fifth invariant: Stateless, Parallel State Machine Topology. Account-based virtual machines (such as EVM and SVM global state tries) pack every user balance, allowance bitmap, contract bytecode variable, and administrative role inside a single globally mutable state tree accessed under contested read-write mutex locks. Because transaction T_k mutates shared global memory before T_{k+1} can evaluate preconditions, account VMs force sequential state serialization, institutionalize builder/searcher Maximum Extractable Value (MEV) sandwich extraction, trigger unbounded state bloat requiring coercive state-rent seizures, and expose native freeze, blacklist, upgrade-proxy, or arbitrary clawback hooks at the execution layer. By stark topological contrast, a pure Unspent Transaction Output (UTXO) graph models value as discrete, self-contained cryptographic state capsules anchored strictly to spending predicates rather than mutable global accounts. Every UTXO input consumption is mutually orthogonal and embarrassingly parallelizable across multi-core hardware verification threads without mutex contention; spent outputs can be pruned safely in constant bounded disk footprints using cryptographic commitment accumulators, while total monetary supply remains trivially, deterministically auditable in plaintext arithmetic directly against consensus coinbase rules from block zero.'
  },
  {
    id: 6,
    chapter: 'INVARIANTS',
    tag: '06 • THERMODYNAMIC VELOCITY (M = 1.0) AT THE SPEED OF LIGHT',
    text: 'Finally, a monetary machine built to clear planetary human commerce cannot throttle or waste the thermodynamic energy it burns through archaic linear block bottlenecks; it must achieve the sixth invariant: Thermodynamic Velocity (M = 1.0) operating near the relativistic boundary of electromagnetic signal propagation through optical fiber (c/n ~ 200,000 km/s, imposing ~67 ms antipodal round-trip propagation latency across Earth’s circumference). Sequential, longest-chain single-tip architectures such as Satoshi’s original 1-chain parameter (600s block interval) face a lethal coupling trap: whenever honest global block production rate approaches intercontinental propagation latency (bps * D_network >= 1), honest concurrent blocks mined simultaneously across Asia, Europe, and the Americas collide, turn into wasted stale orphans, reduce effective adversarial security threshold, and force real-world retail users back into custodial Layer-2 IOUs and payment channels subordinated to L1 capacity (Carrier Subordination Law: M_overlay < M_L1 <= 1.0). Through topological BlockDAG inclusion under GHOSTDAG today (k = 124, 10 BPS Crescendo throughput with sub-second confirmation visibility and ~10s full finality ordering) and parameterless DAGKNIGHT [Roadmap / KIP-2 Proposed — In Testnet-13 Review] ordering that adapts dynamically to arbitrary real-world network delay without hardcoded D parameters, 100% of honest concurrent SHA-256 or kHeavyHash mining energy weaves additively into canonical total security and parallel transaction throughput at M = 1.0.'
  },
  {
    id: 7,
    chapter: 'INFLATION',
    tag: '07 • BIOLOGICAL WORK AS AN EXACT JOULE LEDGER (100 MJ/WK)',
    text: 'Once you strip away Keynesian monetary euphemisms, CPI basket substitutions, and central-bank balance-sheet sophistry, inflation ceases to look like an abstract price index drift and reveals its true physical identity: an unconsented thermodynamic expropriation of biological human work. Every dietary kilocalorie (kcal) equals precisely 4,184 Joules of chemical bond enthalpy extracted from solar photosynthesis, fixed into adenosine triphosphate (ATP) gradients inside mitochondria, and expended through skeletal muscle contraction and neural ion-pump polarization to push human civilization uphill against entropy. Across a standard forty-hour workweek of carpentry, machining, electrical line maintenance, logistics, medical care, or systems engineering, an adult human body converts roughly 100 megajoules (100,000,000 Joules) of finite, non-refundable biological work-hours into tangible physical goods, maintained infrastructure, harvested nutrition, or low-entropy information structure. Because your lifespan contains a strictly finite stock of total metabolic Joules between birth and death, money only functions honestly if every saved monetary unit stores an unwatered, non-dilutable claim on equivalent external Joules of work.'
  },
  {
    id: 8,
    chapter: 'INFLATION',
    tag: '08 • EXPLICIT TAXATION (20 MJ) & BUREAUCRATIC CARNOT FRICTION (8 MJ)',
    text: 'Examine what happens mathematically to that 100 MJ weekly physical output inside a managed fiat polity. When a state levies a transparent twenty percent explicit tax on labor or production, it transfers a 20 MJ claim over real physical goods directly from the producer to the fiscal treasury. At least explicit taxation remains visible on a paystub and bounded by political consent. Yet no administrative state operates at 100% thermodynamic efficiency—just as the Second Law forbids a Carnot heat engine from converting 100% of thermal gradient into useful mechanical work without exhaust heat loss. Staffing overlapping compliance agencies, tax enforcement bureaucracies, lobbying corridors, regulatory clearinghouses, and contractor middlemen introduces immense administrative entropy: roughly 8 MJ out of that extracted claim dissipates purely as organizational waste heat—consuming buildings, paper, fuel, and human lifespans while producing zero additional wheat, zero kilowatt-hours of clean electricity, zero miles of paved steel rail, and zero bits of cryptographic ledger security.'
  },
  {
    id: 9,
    chapter: 'INFLATION',
    tag: '09 • UNFUNDED PROMISES (40 MJ ISSUED VS 20 MJ WORK)',
    text: 'Because no political coalition survives election cycles if it taxes citizens openly for the true physical sum of every subsidy, war, bailout, and entitlement it signs into law, states resolve the arithmetic shortfall by abusing the monopoly printing press. Suppose the state extracts 20 MJ of real productive energy via open taxes while legislating 40 MJ of spending promises across defense contractors, bondholders, and domestic programs. That missing 20 MJ of real physical energy cannot materialize out of thin air—Noether’s Theorem and the First Law of Thermodynamics strictly forbid creatio ex nihilo energy generation. Instead, central banks and commercial credit desks conjure matching nominal currency units at zero energetic cost (E = 0.00 J). Those weightless digital keystrokes enter the market first through primary dealers and sovereign bond desks (Cantillon advantage), bid directly against savers for finite groceries, copper, timber, and shelter, and silently siphon 20 MJ worth of purchasing power straight out of every worker’s saved biological hours—an invisible regressive heat tax collected continuously across every held banknote.'
  },
  {
    id: 10,
    chapter: 'INFLATION',
    tag: '10 • $35+ TRILLION ZERO-JOULE SOVEREIGN LIEN',
    text: 'Compounded asymmetrically across decades of abandoned metallic convertibility, this zero-Joule counterfeiting loop scales into an unsustainable macroeconomic phase transition: more than $35 trillion in sovereign principal debt—plus multiples in unfunded long-duration liabilities—backed by precisely 0.00 Joules of physical reserve work. Unlike a gold ingot, a barrel of crude oil, or a Proof-of-Work UTXO sealed behind megawatts of burned ASIC electricity, every newly auctioned treasury bond is fundamentally a synthetic paper lien demanding future megajoules of physical muscle, electricity, and mineral extraction from workers and engineers who have not even been born yet. Because exponential compounding on weightless paper claims always outruns linear thermodynamic productivity growth (which remains physically capped by solar flux, mineral ore grades, and Carnot limits), the ledger faces a strict mathematical dichotomy: either overt nominal default or relentless unit-of-account dilution against scarce physical energy and E > 0 Proof-of-Work assets.'
  },
  {
    id: 11,
    chapter: 'INFLATION',
    tag: '11 • 1923 WEIMAR & THE 16 MJ/KG CELLULOSE FLOOR',
    text: 'Empirical history documented the asymptotic collapse of zero-Joule monetary illusions during the 1923 Weimar German hyperinflation. Once Reichsbank printing presses multiplied paper Marks orders of magnitude faster than Ruhr coal mines, steel mills, wheat farms, and human labor could expand real thermodynamic supply, the nominal monetary premium pinned to printed ink converged cleanly toward zero—and then crossed straight beneath the raw chemical enthalpy of the physical paper substrate itself. Citizens literally hauled laundry baskets and wheelbarrows stacked with multi-million-Mark notes straight into kitchen stoves because stamped cellulose wood pulp liberates roughly ~16 MJ/kg of dry kindling heat when oxidized with atmospheric oxygen, making burned paper bills physically more valuable as firewood enthalpy than as sovereign legal tender backed by nothing.'
  },
  {
    id: 12,
    chapter: 'INFLATION',
    tag: '12 • CHARCOAL SKETCH OF A FIRE VS REAL JOULES',
    text: 'Issuing zero-Joule central-bank fiat currency, pre-mined Proof-of-Stake tokens, or committee-governed governance coins to simulate real economic capital is thermodynamically indistinguishable from sketching an intricate charcoal drawing of a roaring campfire onto the frozen timber wall of a winter cabin and expecting the illustration to stop hypothermia. You can gather a quorum of elders to vote that the charcoal fire burns at 900 Kelvin, attach a "slashing rule" fining anyone who touches the painting without permission, or publish whitepapers boasting sub-second consensus among art critics—yet not a single photon of infrared radiation will leave the wall. Only breaking high-energy molecular bonds or dissipating real irreversible electrical Joules through physical matter delivers measurable heat and unforgeable proof across spacetime.'
  },
  {
    id: 13,
    chapter: 'COSMOS',
    tag: '13 • GEOLOGICAL PROOF-OF-WORK & THE GRAND CANYON',
    text: 'Step back from human financial theater and observe physical reality itself: the universe runs exclusively on Proof-of-Work, and nature never signs off on historical truth using cheap cryptographic quorums or committee attestations. Stand on the South Rim of the Grand Canyon and you are staring directly into an incorruptible geological ledger sealed across roughly five to six million years of cumulative gravitational kinetic work. Solar radiation evaporated ocean water uphill against gravity (Delta U = m * g * h), atmospheric convection carried that high-potential moisture over the Colorado Plateau, and turbulent liquid water plus suspended quartz grit physically abraded and evacuated trillions of metric tons of solid Coconino sandstone, Redwall limestone, and Vishnu basement granite a full mile deep. No legislature could vote that gorge into existence, no multi-sig could backdate its stratigraphy, and no adversary can fake it—only cumulative irreversible Joules carve permanent geometry into rock.'
  },
  {
    id: 14,
    chapter: 'COSMOS',
    tag: '14 • SEQUOIA TREE RINGS, PHOTONS & SEROTINOUS PYROLYSIS',
    text: 'Living biology obeys the exact same unforgeable Proof-of-Work auditing across every trophic layer. Slice cleanly across a two-thousand-year-old Giant Sequoia trunk and every concentric annual growth ring stands as an indelible chemical ledger recording verified seasonal solar photon capture—six CO2 + six H2O molecules driven uphill against chemical equilibrium through chlorophyll reaction centers to synthesize durable structural lignin and cellulose. Even biological disaster recovery itself relies on real thermal proof: Giant Sequoia serotinous cones lock their fertile seeds inside dense organic resin vaults that stay sealed for decades against wind, squirrels, and false alarms, opening only when a genuine forest crown wildfire supplies sufficient real kilojoules of thermal energy to melt the resin bond—simultaneously sterilizing competing floor brush and unlocking mineral ash for the next generation.'
  },
  {
    id: 15,
    chapter: 'COSMOS',
    tag: '15 • THE STEEL STREET SIGN & PERPETUAL OXIDATION ENTROPY',
    text: 'Even an ordinary painted galvanized steel street sign bolted beside an interstate highway demonstrates why real physical order never coasts indefinitely at 0.00 Joules after genesis. Refining iron oxide ore inside a 1,500 °C blast furnace, rolling sheet alloy, electroplating zinc coats, and curing synthetic enamel pigments required an immense upfront thermodynamic investment to lift iron atoms artificially high above their natural ground-state mineral equilibrium. From the very first millisecond that sign stands outdoors, atmospheric oxygen, rain electrolyte films, thermal expansion cycles, and ultraviolet photons launch a relentless electrochemical attack to pull that iron downhill into low-energy hydrated ferric oxide rust (Fe2O3·nH2O). Without ongoing energy inputs—repainting, re-galvanizing, physical maintenance—order inevitably decays back into dust. Claiming a monetary ledger can remain eternally secure with zero ongoing electrical expenditure denies the Second Law outright.'
  },
  {
    id: 16,
    chapter: 'COSMOS',
    tag: '16 • WHY FIAT & PROOF-OF-STAKE ARE ONTOLOGICALLY FALSE',
    text: 'Seen through first-principles physics rather than marketing press releases, central-bank fiat debasement and zero-Joule Proof-of-Stake blockchains commit the identical fundamental violation: both try to sever monetary authority, wealth storage, and historical finality from physical energy sacrifice. Whether an official expands M2 in an emergency liquidity spreadsheet or a validator clique self-compounds staking emissions while censoring transactions under OFAC compliance or weak-subjectivity social forks, both systems operate an asymmetric extraction engine where weightless symbols minted at 0.00 Joules lay permanent claim to the finite 100 MJ workweeks of human beings sweating inside real thermodynamics. A consensus system without an external physical cost floor cannot serve as an objective anchor for civilization; it collapses back into pure political subjectivity.'
  },
  {
    id: 17,
    chapter: 'COSMOS',
    tag: '17 • THE TRUTH THERMODYNAMIC AUDIT LAW',
    text: 'That single, unyielding realization is what forged The Truth: stop grading glossy investor decks, celebrity founders, speculative TVL loops, arbitrary market-cap ranks, or consensus theater, and measure every digital protocol and physical commodity strictly against the invariant conservation laws that govern stars, river canyons, cellular metabolism, oxidized steel, and ASIC silicon. Enforce Existential Sovereignty, E > 0 Cost Floor, Landauer Immutability, Wartime Partition Availability, Stateless UTXO Topology, and Velocity M = 1.0 under non-negotiable zero-clamp physics (E = 0 forces terminal Grade F; Sovereignty = 0 caps derivative floors; overlays subordinate beneath their L1 carrier)—because physics never negotiates, never lobbies a committee, never bails out insiders, and always settles the final ledger in Joules.'
  }
];

function attachAxiomLaws(raw: RawThesisParagraph[]): ThesisParagraph[] {
  return raw.map((item) => ({
    ...item,
    laws: AXIOM_LAWS_BY_ID[item.id] || []
  }));
}

/**
 * Concise 17-axiom origin thesis (NORMIE Edition — kept intact + law/equation blocks).
 */
export const GENESIS_THESIS_PARAGRAPHS: ThesisParagraph[] = attachAxiomLaws(RAW_NORMIE_PARAGRAPHS);

/**
 * Unabridged long-form GENIUS Edition of the origin thesis:
 * preserves every invariant, conservation law, biological/metabolic Joule ledger,
 * and cosmic Proof-of-Work proof at full first-principles forensic resolution.
 */
export const GENESIS_THESIS_GENIUS_PARAGRAPHS: ThesisParagraph[] = attachAxiomLaws(RAW_GENIUS_PARAGRAPHS);

export function getGenesisThesisParagraphs(mode: ThesisDepthMode): ThesisParagraph[] {
  return mode === 'GENIUS' ? GENESIS_THESIS_GENIUS_PARAGRAPHS : GENESIS_THESIS_PARAGRAPHS;
}
