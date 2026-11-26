// ============================================================================
// EMPIRICAL THERMODYNAMIC GAINS COHORT DATA (MAY 2022 → NOV 2026)
// ============================================================================

export interface CohortAssetEntry {
  ticker: string;
  name: string;
  grade: string;
  auditScore: number;
  baselineLabel: string;
  basePrice: number | null;
  releaseLabel?: string;
  releasePrice?: number | null;
  price180d?: number | null;
  price1y?: number | null;
  price2y?: number | null;
  price4y?: number | null;
  snapshotSpot: number | null;
  tactical90dPct: number | null;
  liquidCycle: boolean;
  isOutlier: boolean;
  coinbasePair: string | null;
  geckoId: string | null;
  yahooSymbol?: string | null;
  note: string;
}

export type CohortGainAsset = CohortAssetEntry;
export type GainsWindowHorizonKey = 'D180' | 'Y1' | 'Y2' | 'Y4';
export type GainsBaselineMode = 'RELEASE' | 'CYCLE' | GainsWindowHorizonKey;
export type WindowTrajectoriesMap = Partial<Record<GainsWindowHorizonKey, MacroTrajectoryPoint[]>>;

export interface MacroTrajectoryPoint {
  label: string;
  event: string;
  passAll: number;
  passEx: number;
  failAll: number;
  failEx: number;
}

export interface TacticalTrajectoryPoint {
  label: string;
  event: string;
  passAll: number;
  passMed: number;
  failAll: number;
  failMed: number;
}

export const PASSED_COHORT_GAINS: CohortAssetEntry[] = [
  {
    ticker: 'KAS',
    name: 'Kaspa',
    grade: 'A+',
    auditScore: 6.0,
    baselineLabel: '$0.0001859',
    basePrice: 0.0001859,
    releaseLabel: "$0.0001859 (May '22)",
    releasePrice: 0.0001859,
    price180d: 0.03371,
    price1y: 0.04329,
    price2y: 0.1707,
    price4y: 0.006794,
    snapshotSpot: 0.0267,
    tactical90dPct: 11.2,
    liquidCycle: true,
    isOutlier: true,
    coinbasePair: null,
    geckoId: 'kaspa',
    yahooSymbol: 'KAS-USD',
    note: 'Massive right-tail convexity driver • 0 VC overhang • Flipped 200 EMA vs BTC'
  },
  {
    ticker: 'ZEC',
    name: 'Zcash',
    grade: 'D-',
    auditScore: 1.4,
    baselineLabel: '~$92.00',
    basePrice: 92.0,
    releaseLabel: "$250.55 (Oct '16)",
    releasePrice: 250.55,
    price180d: 584.34,
    price1y: 624.36,
    price2y: 44.9,
    price4y: 39.79,
    snapshotSpot: 918.65,
    tactical90dPct: 144.7,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'ZEC-USD',
    geckoId: 'zcash',
    yahooSymbol: 'ZEC-USD',
    note: 'High-beta PoW privacy squeeze • #1 90-day performer in E > 0 cohort'
  },
  {
    ticker: 'XMR',
    name: 'Monero',
    grade: 'C+',
    auditScore: 3.5,
    baselineLabel: '~$195.00',
    basePrice: 195.0,
    releaseLabel: "$2.47 (May '14)",
    releasePrice: 2.47,
    price180d: 381.19,
    price1y: 403.8,
    price2y: 156.21,
    price4y: 134.36,
    snapshotSpot: 503.75,
    tactical90dPct: 51.5,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: 'monero',
    yahooSymbol: 'XMR-USD',
    note: 'Steady RandomX PoW privacy compounding • 0 premine tail-emission floor'
  },
  {
    ticker: 'BTC',
    name: 'Bitcoin',
    grade: 'B+',
    auditScore: 4.4,
    baselineLabel: '$29,455.76',
    basePrice: 29455.76,
    releaseLabel: "$0.05 (Jul '10)",
    releasePrice: 0.05,
    price180d: 75488,
    price1y: 92949,
    price2y: 90543,
    price4y: 16712,
    snapshotSpot: 63603.0,
    tactical90dPct: 17.1,
    liquidCycle: true,
    isOutlier: true,
    coinbasePair: 'BTC-USD',
    geckoId: 'bitcoin',
    yahooSymbol: 'BTC-USD',
    note: 'Unshakeable M0 SHA-256d thermodynamic reserve anchor'
  },
  {
    ticker: 'XAG',
    name: 'Physical Silver',
    grade: 'C+',
    auditScore: 3.65,
    baselineLabel: '$21.50',
    basePrice: 21.5,
    releaseLabel: "$5.04 (COMEX '00)",
    releasePrice: 5.035,
    price180d: 75.89,
    price1y: 50.45,
    price2y: 31.16,
    price4y: 20.85,
    snapshotSpot: 47.39,
    tactical90dPct: 22.8,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    yahooSymbol: 'SI=F',
    note: 'Zero-default supernova commodity floor • Industrial + monetary breakout'
  },
  {
    ticker: 'XAU',
    name: 'Physical Gold',
    grade: 'B',
    auditScore: 4.1,
    baselineLabel: '$1,837.00',
    basePrice: 1837.0,
    releaseLabel: "$277.00 (COMEX '00)",
    releasePrice: 277.0,
    price180d: 4523.2,
    price1y: 4066.5,
    price2y: 2614.6,
    price4y: 1739.6,
    snapshotSpot: 3866.4,
    tactical90dPct: 18.4,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'PAXG-USD',
    geckoId: 'pax-gold',
    yahooSymbol: 'GC=F',
    note: 'Zero-default r-process physical commodity floor • Crushed ETH & most PoS'
  },
  {
    ticker: 'QUAI',
    name: 'Quai Network',
    grade: 'D+',
    auditScore: 2.05,
    baselineLabel: '$0.0620 (Open)',
    basePrice: 0.062,
    releaseLabel: "$0.0620 (Feb '25)",
    releasePrice: 0.062,
    price180d: 0.02237,
    price1y: 0.02379,
    price2y: null,
    price4y: null,
    snapshotSpot: 0.108,
    tactical90dPct: 19.4,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: 'quai-network',
    yahooSymbol: 'QUAI22354-USD',
    note: 'PoEM + SOAP merge-mining buyback/burn (246.6M QUAI burned)'
  },
  {
    ticker: 'GEEK',
    name: 'Geek Protocol',
    grade: 'C-',
    auditScore: 2.55,
    baselineLabel: 'KRC-20 Mint Floor',
    basePrice: 0.0000075,
    releaseLabel: '$0.0000075 (KRC-20)',
    releasePrice: 0.0000075,
    price180d: null,
    price1y: null,
    price2y: null,
    price4y: null,
    snapshotSpot: 0.0000128,
    tactical90dPct: 18.5,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    yahooSymbol: null,
    note: '0-premint KRC-20 fair-mint carrier cost floor • Zero VC cliff unlocks'
  },
  {
    ticker: 'ERG',
    name: 'Ergo',
    grade: 'D+',
    auditScore: 2.0,
    baselineLabel: '$0.80 (Cycle Base)',
    basePrice: 0.8,
    releaseLabel: "$1.60 (Aug '19)",
    releasePrice: 1.6,
    price180d: 0.284,
    price1y: 0.5102,
    price2y: 1.3352,
    price4y: 1.5098,
    snapshotSpot: 0.217,
    tactical90dPct: 21.6,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: 'ergo',
    yahooSymbol: 'ERG-USD',
    note: 'Autolykos PoW eUTXO • Slower linear velocity, but zero VC wipeout'
  },
  {
    ticker: 'BCH',
    name: 'Bitcoin Cash',
    grade: 'C+',
    auditScore: 3.63,
    baselineLabel: '$181.48',
    basePrice: 181.48,
    releaseLabel: "$555.00 (Aug '17)",
    releasePrice: 555.0,
    price180d: 360.16,
    price1y: 523.06,
    price2y: 451.99,
    price4y: 104.82,
    snapshotSpot: 206.25,
    tactical90dPct: 12.2,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'BCH-USD',
    geckoId: 'bitcoin-cash',
    yahooSymbol: 'BCH-USD',
    note: 'Legacy SHA-256d PoW + Layla CashVM covenants • Positive cycle hold'
  },
  {
    ticker: 'RVN',
    name: 'Ravencoin',
    grade: 'B+',
    auditScore: 4.45,
    baselineLabel: '$0.0190',
    basePrice: 0.019,
    releaseLabel: "$0.0265 (Mar '18)",
    releasePrice: 0.0265,
    price180d: 0.005391,
    price1y: 0.009142,
    price2y: 0.0232,
    price4y: 0.02167,
    snapshotSpot: 0.00109,
    tactical90dPct: 25.7,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: 'ravencoin',
    yahooSymbol: 'RVN-USD',
    note: 'Fair-launch KawPoW lags BlockDAG velocity, but zero insider cliff dump'
  },
  {
    ticker: 'LTC',
    name: 'Litecoin',
    grade: 'B',
    auditScore: 4.17,
    baselineLabel: '$64.00',
    basePrice: 64.0,
    releaseLabel: "$4.30 (Apr '13)",
    releasePrice: 4.3,
    price180d: 52.62,
    price1y: 95.66,
    price2y: 89.18,
    price4y: 63.81,
    snapshotSpot: 44.07,
    tactical90dPct: 11.3,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'LTC-USD',
    geckoId: 'litecoin',
    yahooSymbol: 'LTC-USD',
    note: 'Legacy 150s Scrypt PoW lags, yet avoids -70% PoS treasury liquidation'
  },
  {
    ticker: 'LN',
    name: 'Lightning Network',
    grade: 'C-',
    auditScore: 2.35,
    baselineLabel: 'Native BTC Rail',
    basePrice: null,
    releaseLabel: 'Native BTC Rail',
    releasePrice: null,
    price180d: null,
    price1y: null,
    price2y: null,
    price4y: null,
    snapshotSpot: null,
    tactical90dPct: null,
    liquidCycle: false,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    yahooSymbol: null,
    note: '0-token Bitcoin payment-channel mesh (tracks native BTC)'
  },
  {
    ticker: 'IGRA',
    name: 'Igra Network',
    grade: 'D+',
    auditScore: 2.3,
    baselineLabel: 'Kaspa L1 Rollup',
    basePrice: null,
    releaseLabel: 'Kaspa L1 Rollup',
    releasePrice: null,
    price180d: null,
    price1y: null,
    price2y: null,
    price4y: null,
    snapshotSpot: null,
    tactical90dPct: null,
    liquidCycle: false,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    yahooSymbol: null,
    note: 'Kaspa L1-sequenced Based EVM execution rail (viaduct + reth)'
  }
];

export const FAILED_COHORT_GAINS: CohortAssetEntry[] = [
  {
    ticker: 'TAO',
    name: 'Bittensor',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '~$50.00 (2023 Open)',
    basePrice: 50.0,
    releaseLabel: "$50.00 ('23 Open)",
    releasePrice: 50.0,
    price180d: 265.11,
    price1y: 332.1,
    price2y: 511.4,
    price4y: null,
    snapshotSpot: 189.42,
    tactical90dPct: 8.5,
    liquidCycle: true,
    isOutlier: true,
    coinbasePair: 'TAO-USD',
    geckoId: 'bittensor',
    yahooSymbol: 'TAO22974-USD',
    note: 'Only major multi-X outlier in the E = 0 basket • Lagged BTC over 90D (+8.5%)'
  },
  {
    ticker: 'XRP',
    name: 'XRP Ledger',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$0.42',
    basePrice: 0.42,
    releaseLabel: "$0.0059 (Aug '13)",
    releasePrice: 0.0059,
    price180d: 1.3337,
    price1y: 2.2165,
    price2y: 1.1179,
    price4y: 0.3847,
    snapshotSpot: 0.9542,
    tactical90dPct: 10.2,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'XRP-USD',
    geckoId: 'ripple',
    yahooSymbol: 'XRP-USD',
    note: 'Outperformed ETH post-2022, but continuous Ripple escrow distribution'
  },
  {
    ticker: 'SOL',
    name: 'Solana',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$45.80',
    basePrice: 45.8,
    releaseLabel: "$0.83 (Apr '20)",
    releasePrice: 0.832,
    price180d: 84.31,
    price1y: 140.71,
    price2y: 239.79,
    price4y: 12.85,
    snapshotSpot: 72.11,
    tactical90dPct: 14.1,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'SOL-USD',
    geckoId: 'solana',
    yahooSymbol: 'SOL-USD',
    note: 'High beta VC chain • Heavy insider foundation unlocks & validator subsidy'
  },
  {
    ticker: 'QNT',
    name: 'Quant',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$68.00',
    basePrice: 68.0,
    releaseLabel: "$0.29 (Aug '18)",
    releasePrice: 0.288,
    price180d: 77.16,
    price1y: 81.21,
    price2y: 87.36,
    price4y: 115.44,
    snapshotSpot: 151.6,
    tactical90dPct: 236.0,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'QNT-USD',
    geckoId: 'quant-network',
    yahooSymbol: 'QNT-USD',
    note: 'Closed-source enterprise middleware • No PoW physical floor'
  },
  {
    ticker: 'STX',
    name: 'Stacks',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$0.55',
    basePrice: 0.55,
    releaseLabel: "$0.21 (Oct '19)",
    releasePrice: 0.213,
    price180d: 0.2408,
    price1y: 0.3463,
    price2y: 1.9424,
    price4y: 0.2361,
    snapshotSpot: 0.2695,
    tactical90dPct: 143.6,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'STX-USD',
    geckoId: 'blockstack',
    yahooSymbol: 'STX4847-USD',
    note: '90D relief bounce after SIP-031 500M print; minimal multi-year traction'
  },
  {
    ticker: 'ETH',
    name: 'Ethereum',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$1,940.00',
    basePrice: 1940.0,
    releaseLabel: "$2.77 (Aug '15)",
    releasePrice: 2.77,
    price180d: 2064.6,
    price1y: 3123.0,
    price2y: 3207.9,
    price4y: 1218.4,
    snapshotSpot: 1782.23,
    tactical90dPct: 13.9,
    liquidCycle: true,
    isOutlier: true,
    coinbasePair: 'ETH-USD',
    geckoId: 'ethereum',
    yahooSymbol: 'ETH-USD',
    note: '72M ICO premine (2015); post-Merge 0-Joule PoS lagged BTC & Gold'
  },
  {
    ticker: 'XLM',
    name: 'Stellar',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$0.14',
    basePrice: 0.14,
    releaseLabel: "$0.0030 (Aug '14)",
    releasePrice: 0.003,
    price180d: 0.1434,
    price1y: 0.2561,
    price2y: 0.2327,
    price4y: 0.09043,
    snapshotSpot: 0.1369,
    tactical90dPct: -9.2,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'XLM-USD',
    geckoId: 'stellar',
    yahooSymbol: 'XLM-USD',
    note: '100B genesis premint • Foundation SDF distribution overhang'
  },
  {
    ticker: 'NEAR',
    name: 'NEAR Protocol',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$5.90',
    basePrice: 5.9,
    releaseLabel: "$1.69 (Oct '20)",
    releasePrice: 1.69,
    price180d: 2.1047,
    price1y: 2.2791,
    price2y: 6.0235,
    price4y: 1.748,
    snapshotSpot: 3.15,
    tactical90dPct: 124.1,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'NEAR-USD',
    geckoId: 'near',
    yahooSymbol: 'NEAR-USD',
    note: 'Staking inflation & VC unlock overhang eroded cycle returns vs BTC'
  },
  {
    ticker: 'SUI',
    name: 'Sui',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '~$1.40 (May 2023)',
    basePrice: 1.4,
    releaseLabel: "$1.40 (May '23)",
    releasePrice: 1.4,
    price180d: 1.0475,
    price1y: 1.6683,
    price2y: 3.7029,
    price4y: null,
    snapshotSpot: 0.715,
    tactical90dPct: 20.2,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'SUI-USD',
    geckoId: 'sui',
    yahooSymbol: 'SUI20947-USD',
    note: 'Heavy Mysten/VC cliff unlocks crushed early mainnet buyers (-48.9%)'
  },
  {
    ticker: 'ICP',
    name: 'Internet Computer',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$8.50',
    basePrice: 8.5,
    releaseLabel: "$428.48 (May '21)",
    releasePrice: 428.48,
    price180d: 2.4783,
    price1y: 5.0924,
    price2y: 9.4092,
    price4y: 3.972,
    snapshotSpot: 2.26,
    tactical90dPct: 1.8,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'ICP-USD',
    geckoId: 'internet-computer',
    yahooSymbol: 'ICP-USD',
    note: '-99.5% since May 2021 VC genesis launch ($428 -> ~$2.26)'
  },
  {
    ticker: 'AVAX',
    name: 'Avalanche',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$27.00',
    basePrice: 27.0,
    releaseLabel: "$4.61 (Sep '20)",
    releasePrice: 4.61,
    price180d: 9.1466,
    price1y: 14.573,
    price2y: 35.448,
    price4y: 12.882,
    snapshotSpot: 7.06,
    tactical90dPct: 23.5,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'AVAX-USD',
    geckoId: 'avalanche-2',
    yahooSymbol: 'AVAX-USD',
    note: 'Unvested P-Chain insider staking yield & unlock bleed'
  },
  {
    ticker: 'ADA',
    name: 'Cardano',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$0.62',
    basePrice: 0.62,
    releaseLabel: "$0.0252 (Oct '17)",
    releasePrice: 0.0252,
    price180d: 0.2424,
    price1y: 0.475,
    price2y: 0.7346,
    price4y: 0.3285,
    snapshotSpot: 0.1513,
    tactical90dPct: -8.5,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'ADA-USD',
    geckoId: 'cardano',
    yahooSymbol: 'ADA-USD',
    note: 'Continuous epoch reserve drip & premined whale dilution'
  },
  {
    ticker: 'ALGO',
    name: 'Algorand',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$0.41',
    basePrice: 0.41,
    releaseLabel: "$3.28 (Jun '19)",
    releasePrice: 3.28,
    price180d: 0.1116,
    price1y: 0.1569,
    price2y: 0.2159,
    price4y: 0.2986,
    snapshotSpot: 0.0777,
    tactical90dPct: 10.6,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'ALGO-USD',
    geckoId: 'algorand',
    yahooSymbol: 'ALGO-USD',
    note: '-97.6% bleed since June 2019 release open ($3.28 -> ~$0.08)'
  }
];

export const RELEASE_COHORT_TRAJECTORY: MacroTrajectoryPoint[] = [
  { label: "2010", event: 'BTC First Exchange Open ($0.05)', passAll: 1.0, passEx: 1.0, failAll: 1.0, failEx: 1.0 },
  { label: "2013", event: 'LTC + XRP Initial Markets', passAll: 650.0, passEx: 2.2, failAll: 1.0, failEx: 1.0 },
  { label: "2015", event: 'ETH + XMR Launch Era', passAll: 1450.0, passEx: 11.4, failAll: 1.4, failEx: 1.2 },
  { label: "2017", event: 'ICO Boom (ADA / BCH)', passAll: 18200.0, passEx: 24.8, failAll: 18.5, failEx: 9.8 },
  { label: "2020", event: 'SOL / AVAX / NEAR Releases', passAll: 38400.0, passEx: 48.0, failAll: 34.0, failEx: 16.5 },
  { label: "2022", event: 'KAS Launch + ICP/ALGO Bleed', passAll: 74200.0, passEx: 190.0, failAll: 68.0, failEx: 28.4 },
  { label: "Now", event: 'Live Inception -> Today', passAll: 141380.0, passEx: 1320.0, failAll: 79.4, failEx: 35.0 }
];

export const MACRO_CYCLE_TRAJECTORY: MacroTrajectoryPoint[] = [
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

export const TACTICAL_90D_TRAJECTORY: TacticalTrajectoryPoint[] = [
  { label: 'Aug 15', event: '90D Window Open', passAll: 1.0, passMed: 1.0, failAll: 1.0, failMed: 1.0 },
  { label: 'Aug 31', event: 'Late-Summer Chop', passAll: 1.04, passMed: 1.03, failAll: 0.98, failMed: 0.97 },
  { label: 'Sep 15', event: 'Gold & BTC Bid', passAll: 1.09, passMed: 1.07, failAll: 1.03, failMed: 1.01 },
  { label: 'Sep 30', event: 'Privacy PoW Breakout', passAll: 1.16, passMed: 1.11, failAll: 1.12, failMed: 1.05 },
  { label: 'Oct 15', event: 'QNT/STX Short Squeeze', passAll: 1.22, passMed: 1.14, failAll: 1.29, failMed: 1.09 },
  { label: 'Oct 31', event: 'ZEC + XMR Acceleration', passAll: 1.27, passMed: 1.17, failAll: 1.45, failMed: 1.15 },
  { label: 'Nov 14', event: 'KAS 200-EMA Flip • NEAR Roll', passAll: 1.312, passMed: 1.19, failAll: 1.427, failMed: 1.139 }
];

export function formatUsdPrice(val: unknown): string {
  if (val === null || val === undefined || val === '') return '—';
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

export function formatBasketUsd(val: unknown): string {
  if (val === null || val === undefined || val === '') return '—';
  const n = Number(val);
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '')}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  }
  if (abs >= 10_000) {
    return `${sign}$${(abs / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

export function formatPctSigned(val: unknown): string {
  if (val === null || val === undefined || val === '') return '—';
  const n = Number(val);
  if (!Number.isFinite(n)) return '—';
  const sign = n >= 0 ? '+' : '';
  if (Math.abs(n) >= 1_000_000) {
    return `${sign}${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M%`;
  }
  if (Math.abs(n) >= 1000) {
    return `${sign}${Math.round(n).toLocaleString()}%`;
  }
  return `${sign}${n.toFixed(1)}%`;
}

export function computeMedian(nums: number[]): number {
  if (!nums || nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export type CohortSide = 'PASSED' | 'FAILED';

export interface GainsCohortRecord {
  cohortId: string;
  passed: CohortAssetEntry[];
  failed: CohortAssetEntry[];
  updatedAtMs: number;
  updatedAtLabel: string;
  revision: number;
  isCustomized: boolean;
  sourceLabel: string;
}

export const MAX_ASSETS_PER_COHORT = 60;

export function normalizeCohortTicker(raw: unknown): string {
  return String(raw || '')
    .trim()
    .replace(/^\$/, '')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 16);
}

export function formatCohortTimestampLabel(ms: number): string {
  const safeMs = Number.isFinite(ms) && ms > 0 ? ms : Date.now();
  return new Date(safeMs)
    .toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    .slice(0, 64);
}

export function sanitizeCohortAssetEntry(
  raw: Partial<CohortAssetEntry> | null | undefined,
  fallbackSide: CohortSide = 'FAILED'
): CohortAssetEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const ticker = normalizeCohortTicker(raw.ticker);
  if (!ticker) return null;

  const validGrades = new Set([
    'A+',
    'A',
    'A-',
    'B+',
    'B',
    'B-',
    'C+',
    'C',
    'C-',
    'D+',
    'D',
    'D-',
    'F'
  ]);
  const rawGrade = String(raw.grade || '').trim().toUpperCase();
  const grade = validGrades.has(rawGrade)
    ? rawGrade
    : fallbackSide === 'FAILED'
    ? 'F'
    : 'C';

  const parsedScore = Number(raw.auditScore);
  const auditScore = Number.isFinite(parsedScore)
    ? Math.max(0, Math.min(6, Math.round(parsedScore * 100) / 100))
    : fallbackSide === 'FAILED'
    ? 0
    : 3.0;

  const parsePositivePrice = (v: unknown): number | null => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const safeBase = parsePositivePrice(raw.basePrice);
  const safeRelease = parsePositivePrice(raw.releasePrice);
  const safe180d = parsePositivePrice(raw.price180d);
  const safe1y = parsePositivePrice(raw.price1y);
  const safe2y = parsePositivePrice(raw.price2y);
  const safe4y = parsePositivePrice(raw.price4y);
  const safeSpot = parsePositivePrice(raw.snapshotSpot);
  const tacticalNum =
    raw.tactical90dPct === null ||
    raw.tactical90dPct === undefined ||
    raw.tactical90dPct === ('' as unknown)
      ? null
      : Number(raw.tactical90dPct);
  const hasAnyBaseline =
    safeBase !== null ||
    safeRelease !== null ||
    safe180d !== null ||
    safe1y !== null ||
    safe2y !== null ||
    safe4y !== null;
  const liquidCycle =
    raw.liquidCycle !== undefined
      ? Boolean(raw.liquidCycle) && hasAnyBaseline && safeSpot !== null
      : hasAnyBaseline && safeSpot !== null;

  const baselineLabel =
    String(raw.baselineLabel || '').trim().slice(0, 48) ||
    (safeBase !== null ? formatUsdPrice(safeBase) : 'Carrier / Unpriced');
  const releaseLabel =
    String(raw.releaseLabel || '').trim().slice(0, 48) ||
    (safeRelease !== null ? formatUsdPrice(safeRelease) : baselineLabel);

  return {
    ticker,
    name: String(raw.name || ticker).trim().slice(0, 80) || ticker,
    grade,
    auditScore,
    baselineLabel,
    basePrice: safeBase,
    releaseLabel,
    releasePrice: safeRelease,
    price180d: safe180d,
    price1y: safe1y,
    price2y: safe2y,
    price4y: safe4y,
    snapshotSpot: safeSpot,
    tactical90dPct:
      tacticalNum !== null && Number.isFinite(tacticalNum)
        ? Math.round(tacticalNum * 10) / 10
        : null,
    liquidCycle,
    isOutlier: Boolean(raw.isOutlier),
    coinbasePair: raw.coinbasePair
      ? String(raw.coinbasePair).trim().toUpperCase().slice(0, 24)
      : null,
    geckoId: raw.geckoId
      ? String(raw.geckoId)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '')
          .slice(0, 64) || null
      : null,
    yahooSymbol: raw.yahooSymbol
      ? String(raw.yahooSymbol).trim().toUpperCase().slice(0, 24)
      : null,
    note:
      String(raw.note || '')
        .trim()
        .slice(0, 180) || 'Empirical cohort entry'
  };
}

export function getDefaultGainsCohortRecord(): GainsCohortRecord {
  return {
    cohortId: 'default',
    passed: PASSED_COHORT_GAINS.map((item) => ({ ...item })),
    failed: FAILED_COHORT_GAINS.map((item) => ({ ...item })),
    updatedAtMs: Date.UTC(2026, 10, 14, 0, 0, 0),
    updatedAtLabel: "Nov '26 Baseline",
    revision: 1,
    isCustomized: false,
    sourceLabel: "Canonical Nov '26 Benchmark"
  };
}

export function sanitizeGainsCohortRecord(
  raw: Partial<GainsCohortRecord> | null | undefined
): GainsCohortRecord {
  const defaults = getDefaultGainsCohortRecord();
  if (!raw || typeof raw !== 'object') return defaults;

  const seenTickers = new Set<string>();
  const cleanPassed: CohortAssetEntry[] = [];
  const cleanFailed: CohortAssetEntry[] = [];

  if (Array.isArray(raw.passed)) {
    for (const item of raw.passed) {
      const cleaned = sanitizeCohortAssetEntry(item, 'PASSED');
      if (cleaned && !seenTickers.has(cleaned.ticker)) {
        seenTickers.add(cleaned.ticker);
        cleanPassed.push(cleaned);
        if (cleanPassed.length >= MAX_ASSETS_PER_COHORT) break;
      }
    }
  }

  if (Array.isArray(raw.failed)) {
    for (const item of raw.failed) {
      const cleaned = sanitizeCohortAssetEntry(item, 'FAILED');
      if (cleaned && !seenTickers.has(cleaned.ticker)) {
        seenTickers.add(cleaned.ticker);
        cleanFailed.push(cleaned);
        if (cleanFailed.length >= MAX_ASSETS_PER_COHORT) break;
      }
    }
  }

  const finalPassed = cleanPassed.length > 0 ? cleanPassed : defaults.passed;
  const finalFailed = cleanFailed.length > 0 ? cleanFailed : defaults.failed;
  const updatedAtMs =
    typeof raw.updatedAtMs === 'number' && Number.isFinite(raw.updatedAtMs) && raw.updatedAtMs > 0
      ? raw.updatedAtMs
      : Date.now();
  const revision =
    typeof raw.revision === 'number' && Number.isFinite(raw.revision) && raw.revision >= 1
      ? Math.floor(raw.revision)
      : 1;

  return {
    cohortId: 'default',
    passed: finalPassed,
    failed: finalFailed,
    updatedAtMs,
    updatedAtLabel:
      String(raw.updatedAtLabel || '').trim().slice(0, 64) ||
      formatCohortTimestampLabel(updatedAtMs),
    revision,
    isCustomized: Boolean(raw.isCustomized),
    sourceLabel:
      String(raw.sourceLabel || '').trim().slice(0, 80) ||
      (raw.isCustomized ? 'Persisted Backend Cohort' : defaults.sourceLabel)
  };
}

export function upsertAssetInCohortRecord(
  record: GainsCohortRecord,
  cohortSide: CohortSide,
  rawEntry: Partial<CohortAssetEntry>
): GainsCohortRecord {
  const cleaned = sanitizeCohortAssetEntry(rawEntry, cohortSide);
  if (!cleaned) return record;

  const filteredPassed = record.passed.filter((a) => a.ticker !== cleaned.ticker);
  const filteredFailed = record.failed.filter((a) => a.ticker !== cleaned.ticker);

  const nextPassed =
    cohortSide === 'PASSED'
      ? [cleaned, ...filteredPassed].slice(0, MAX_ASSETS_PER_COHORT)
      : filteredPassed;
  const nextFailed =
    cohortSide === 'FAILED'
      ? [cleaned, ...filteredFailed].slice(0, MAX_ASSETS_PER_COHORT)
      : filteredFailed;

  const now = Date.now();
  return {
    cohortId: record.cohortId || 'default',
    passed: nextPassed,
    failed: nextFailed,
    updatedAtMs: now,
    updatedAtLabel: formatCohortTimestampLabel(now),
    revision: (Number(record.revision) || 1) + 1,
    isCustomized: true,
    sourceLabel: 'User-Updated Cohort Vault'
  };
}

export function removeAssetFromCohortRecord(
  record: GainsCohortRecord,
  tickerRaw: string
): GainsCohortRecord {
  const ticker = normalizeCohortTicker(tickerRaw);
  if (!ticker) return record;

  const nextPassed = record.passed.filter((a) => a.ticker !== ticker);
  const nextFailed = record.failed.filter((a) => a.ticker !== ticker);
  if (nextPassed.length === 0 || nextFailed.length === 0) {
    return record;
  }

  const now = Date.now();
  return {
    cohortId: record.cohortId || 'default',
    passed: nextPassed,
    failed: nextFailed,
    updatedAtMs: now,
    updatedAtLabel: formatCohortTimestampLabel(now),
    revision: (Number(record.revision) || 1) + 1,
    isCustomized: true,
    sourceLabel: 'User-Updated Cohort Vault'
  };
}

export interface ReleaseBaselineOverride {
  releasePrice?: number | null;
  releaseLabel?: string;
  price180d?: number | null;
  price1y?: number | null;
  price2y?: number | null;
  price4y?: number | null;
  yahooSymbol?: string;
}

export function applySpotPricesToCohortRecord(
  record: GainsCohortRecord,
  spotMap: Record<string, number>,
  sourceLabel = 'Live Spot Sync (Saved)',
  releaseOverrides?: Record<string, ReleaseBaselineOverride>
): { nextRecord: GainsCohortRecord; updatedTickers: string[] } {
  const updatedTickers: string[] = [];
  const pickPos = (val: unknown): number | null => {
    const n = Number(val);
    return val !== null && val !== undefined && Number.isFinite(n) && n > 0 ? n : null;
  };
  const updateItem = (item: CohortAssetEntry): CohortAssetEntry => {
    const live = Number(spotMap[item.ticker]);
    const relOv = releaseOverrides?.[item.ticker];
    const hasLive = Number.isFinite(live) && live > 0;
    const ovRelease = relOv ? pickPos(relOv.releasePrice) : null;
    const ov180d = relOv ? pickPos(relOv.price180d) : null;
    const ov1y = relOv ? pickPos(relOv.price1y) : null;
    const ov2y = relOv ? pickPos(relOv.price2y) : null;
    const ov4y = relOv ? pickPos(relOv.price4y) : null;
    const hasRel = Boolean(
      ovRelease !== null ||
        ov180d !== null ||
        ov1y !== null ||
        ov2y !== null ||
        ov4y !== null
    );
    if (!hasLive && !hasRel) return item;

    updatedTickers.push(item.ticker);
    const nextSpot = hasLive ? live : item.snapshotSpot;
    const nextReleasePrice = ovRelease !== null ? ovRelease : item.releasePrice ?? null;
    const nextReleaseLabel =
      ovRelease !== null
        ? String(relOv?.releaseLabel || formatUsdPrice(nextReleasePrice))
        : item.releaseLabel;
    const nextPrice180d = ov180d !== null ? ov180d : item.price180d ?? null;
    const nextPrice1y = ov1y !== null ? ov1y : item.price1y ?? null;
    const nextPrice2y = ov2y !== null ? ov2y : item.price2y ?? null;
    const nextPrice4y = ov4y !== null ? ov4y : item.price4y ?? null;
    const nextYahooSymbol =
      relOv?.yahooSymbol ? relOv.yahooSymbol : item.yahooSymbol ?? null;

    const hasBaseline =
      (item.basePrice !== null && item.basePrice > 0) ||
      (nextReleasePrice !== null && nextReleasePrice > 0) ||
      (nextPrice180d !== null && nextPrice180d > 0) ||
      (nextPrice1y !== null && nextPrice1y > 0) ||
      (nextPrice2y !== null && nextPrice2y > 0) ||
      (nextPrice4y !== null && nextPrice4y > 0);

    return {
      ...item,
      snapshotSpot: nextSpot,
      releasePrice: nextReleasePrice,
      releaseLabel: nextReleaseLabel,
      price180d: nextPrice180d,
      price1y: nextPrice1y,
      price2y: nextPrice2y,
      price4y: nextPrice4y,
      yahooSymbol: nextYahooSymbol,
      liquidCycle: hasBaseline && nextSpot !== null && nextSpot > 0
    };
  };

  const nextPassed = record.passed.map(updateItem);
  const nextFailed = record.failed.map(updateItem);
  if (updatedTickers.length === 0) {
    return { nextRecord: record, updatedTickers };
  }

  const now = Date.now();
  return {
    nextRecord: {
      cohortId: record.cohortId || 'default',
      passed: nextPassed,
      failed: nextFailed,
      updatedAtMs: now,
      updatedAtLabel: formatCohortTimestampLabel(now),
      revision: (Number(record.revision) || 1) + 1,
      isCustomized: true,
      sourceLabel
    },
    updatedTickers
  };
}

export interface AuditedSuggestion {
  ticker: string;
  name: string;
  grade: string;
  auditScore: number;
  suggestedCohort: CohortSide;
  geckoId: string | null;
  note: string;
}

export function buildAuditedCohortSuggestion(audit: {
  ticker?: string;
  name?: string;
  grade?: string;
  totalScore?: number;
  consensusFamily?: string;
  architecture?: string;
  invariants?: Array<{ id?: string; score?: number }>;
}): AuditedSuggestion | null {
  const ticker = normalizeCohortTicker(audit?.ticker);
  if (!ticker) return null;
  const costFloorScore = Number(audit?.invariants?.[1]?.score ?? 0);
  const isZeroJoule =
    audit?.consensusFamily === 'ZERO_JOULE_BFT' ||
    (Number.isFinite(costFloorScore) && costFloorScore <= 0);
  const suggestedCohort: CohortSide = isZeroJoule ? 'FAILED' : 'PASSED';
  const name = String(audit?.name || ticker).trim().slice(0, 80) || ticker;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  return {
    ticker,
    name,
    grade: String(audit?.grade || (isZeroJoule ? 'F' : 'C')),
    auditScore: Number.isFinite(Number(audit?.totalScore)) ? Number(audit.totalScore) : 0,
    suggestedCohort,
    geckoId: slug || null,
    note:
      String(audit?.architecture || '')
        .trim()
        .slice(0, 140) ||
      (isZeroJoule
        ? '0-Joule BFT / pre-allocated audit added from vault'
        : 'Thermodynamic E > 0 audit added from vault')
  };
}

export interface CohortLiquidMetrics {
  ticker: string;
  cyclePct: number | null;
  multiple: number | null;
  tactical90dPct: number | null;
  liquidCycle: boolean;
  isOutlier: boolean;
}

export interface CohortAggregateSummary {
  passCycleAvg: number;
  passExOutlierAvg: number;
  passExOutlierTicker: string | null;
  failCycleAvg: number;
  failExOutlierAvg: number;
  failExOutlierTicker: string | null;
  pass90dAvg: number;
  fail90dAvg: number;
  pass90dMedian: number;
  fail90dMedian: number;
  passPositiveCount: number;
  failNegativeCount: number;
  passEndDollars: number;
  failEndDollars: number;
  passExEndDollars: number;
  failExEndDollars: number;
  portfolioVictoryMultiple: string;
}

export function computeCohortAggregateSummary(
  passedLiquid: CohortLiquidMetrics[],
  failedLiquid: CohortLiquidMetrics[],
  allocPerAsset: number,
  useCanonicalSnapshotNumbers: boolean
): CohortAggregateSummary {
  const safePass = passedLiquid.filter((i) => i.liquidCycle);
  const safeFail = failedLiquid.filter((i) => i.liquidCycle);

  const avgOf = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

  const passCycleAvg = useCanonicalSnapshotNumbers
    ? 2015.0
    : avgOf(safePass.map((i) => i.cyclePct || 0));

  // Highest percentage gain asset on E > 0
  let passTopOutlier: CohortLiquidMetrics | null = null;
  for (const item of safePass) {
    if (
      passTopOutlier === null ||
      (item.cyclePct ?? -Infinity) > (passTopOutlier.cyclePct ?? -Infinity)
    ) {
      passTopOutlier = item;
    }
  }
  const passExOutlierTicker =
    safePass.length > 1 && passTopOutlier ? passTopOutlier.ticker : null;
  const passedExOutliers = passExOutlierTicker
    ? safePass.filter((i) => i.ticker !== passExOutlierTicker)
    : safePass;
  const passExOutlierAvg = useCanonicalSnapshotNumbers
    ? 165.4
    : avgOf(passedExOutliers.map((i) => i.cyclePct || 0));

  const failCycleAvg = useCanonicalSnapshotNumbers
    ? 59.4
    : avgOf(safeFail.map((i) => i.cyclePct || 0));

  // Highest percentage gain asset on E = 0 (symmetric top-gainer exclusion)
  let failTopOutlier: CohortLiquidMetrics | null = null;
  for (const item of safeFail) {
    if (
      failTopOutlier === null ||
      (item.cyclePct ?? -Infinity) > (failTopOutlier.cyclePct ?? -Infinity)
    ) {
      failTopOutlier = item;
    }
  }
  const failExOutlierTicker =
    safeFail.length > 1 && failTopOutlier ? failTopOutlier.ticker : null;
  const failedExOutliers = failExOutlierTicker
    ? safeFail.filter((i) => i.ticker !== failExOutlierTicker)
    : safeFail;
  const failExOutlierAvg = useCanonicalSnapshotNumbers
    ? -11.7
    : avgOf(failedExOutliers.map((i) => i.cyclePct || 0));

  const pass90dVals = safePass
    .map((i) => i.tactical90dPct)
    .filter((v): v is number => v !== null && Number.isFinite(v));
  const fail90dVals = safeFail
    .map((i) => i.tactical90dPct)
    .filter((v): v is number => v !== null && Number.isFinite(v));

  const pass90dAvg = avgOf(pass90dVals);
  const fail90dAvg = useCanonicalSnapshotNumbers ? 42.7 : avgOf(fail90dVals);
  const pass90dMedian = computeMedian(pass90dVals);
  const fail90dMedian = computeMedian(fail90dVals);

  const passPositiveCount = safePass.filter((i) => (i.cyclePct || 0) > 0).length;
  const failNegativeCount = safeFail.filter((i) => (i.cyclePct || 0) < 0).length;

  const passEndDollars = useCanonicalSnapshotNumbers
    ? Math.round(allocPerAsset * 249.42)
    : Math.round(
        safePass.reduce((sum, i) => sum + allocPerAsset * Math.max(0, i.multiple || 0), 0)
      );

  const failEndDollars = useCanonicalSnapshotNumbers
    ? Math.round(allocPerAsset * 20.722)
    : Math.round(
        safeFail.reduce((sum, i) => sum + allocPerAsset * Math.max(0, i.multiple || 0), 0)
      );

  const passExCount = Math.max(1, passedExOutliers.length || safePass.length);
  const failExCount = Math.max(1, failedExOutliers.length || safeFail.length);

  const passExEndDollars = useCanonicalSnapshotNumbers
    ? Math.round(passedExOutliers.length * allocPerAsset * (1 + passExOutlierAvg / 100))
    : Math.round(
        (passedExOutliers.length > 0 ? passedExOutliers : safePass).reduce(
          (sum, i) => sum + allocPerAsset * Math.max(0, i.multiple ?? 1 + (i.cyclePct || 0) / 100),
          0
        ) || passExCount * allocPerAsset * (1 + passExOutlierAvg / 100)
      );

  const failExEndDollars = useCanonicalSnapshotNumbers
    ? Math.round((safeFail.length - 1) * allocPerAsset * (1 + failExOutlierAvg / 100))
    : Math.round(
        (failedExOutliers.length > 0 ? failedExOutliers : safeFail).reduce(
          (sum, i) => sum + allocPerAsset * Math.max(0, i.multiple ?? 1 + (i.cyclePct || 0) / 100),
          0
        ) || failExCount * allocPerAsset * (1 + failExOutlierAvg / 100)
      );

  const passAvgMult =
    safePass.length > 0
      ? passEndDollars / Math.max(1, safePass.length * allocPerAsset)
      : 0;
  const failAvgMult =
    safeFail.length > 0
      ? failEndDollars / Math.max(1, safeFail.length * allocPerAsset)
      : 0;

  const portfolioVictoryMultiple =
    failAvgMult > 0
      ? passAvgMult / failAvgMult >= 100
        ? Math.round(passAvgMult / failAvgMult).toLocaleString()
        : (passAvgMult / failAvgMult).toFixed(1)
      : '12.0';

  return {
    passCycleAvg,
    passExOutlierAvg,
    passExOutlierTicker,
    failCycleAvg,
    failExOutlierAvg,
    failExOutlierTicker,
    pass90dAvg,
    fail90dAvg,
    pass90dMedian,
    fail90dMedian,
    passPositiveCount,
    failNegativeCount,
    passEndDollars,
    failEndDollars,
    passExEndDollars,
    failExEndDollars,
    portfolioVictoryMultiple
  };
}

export function resolveCohortBaselinePrice(
  entry: Pick<
    CohortAssetEntry,
    | 'basePrice'
    | 'releasePrice'
    | 'price180d'
    | 'price1y'
    | 'price2y'
    | 'price4y'
    | 'baselineLabel'
    | 'releaseLabel'
  >,
  mode: GainsBaselineMode = 'RELEASE'
): { price: number | null; label: string } {
  if (mode === 'RELEASE') {
    const price =
      entry.releasePrice !== undefined && entry.releasePrice !== null
        ? entry.releasePrice
        : entry.basePrice ?? null;
    const label =
      entry.releaseLabel ||
      (entry.releasePrice ? formatUsdPrice(entry.releasePrice) : entry.baselineLabel);
    return { price, label };
  }
  if (mode === 'D180') {
    const price = entry.price180d ?? null;
    return {
      price,
      label: price !== null ? `${formatUsdPrice(price)} (180d)` : 'Pre-Launch / N/A'
    };
  }
  if (mode === 'Y1') {
    const price = entry.price1y ?? null;
    return {
      price,
      label: price !== null ? `${formatUsdPrice(price)} (1Y)` : 'Pre-Launch / N/A'
    };
  }
  if (mode === 'Y2') {
    const price = entry.price2y ?? null;
    return {
      price,
      label: price !== null ? `${formatUsdPrice(price)} (2Y)` : 'Pre-Launch / N/A'
    };
  }
  if (mode === 'Y4') {
    const price = entry.price4y ?? null;
    return {
      price,
      label: price !== null ? `${formatUsdPrice(price)} (4Y)` : 'Pre-Launch / N/A'
    };
  }
  const price = entry.basePrice ?? null;
  const label = entry.baselineLabel || entry.releaseLabel || 'Audited in Basket';
  return { price, label };
}

export function computeCohortLiquidMetricsList(
  entries: CohortAssetEntry[],
  mode: GainsBaselineMode = 'RELEASE',
  liveSpots?: Record<string, number>
): CohortLiquidMetrics[] {
  return entries
    .map((item) => {
      const { price: baseline } = resolveCohortBaselinePrice(item, mode);
      const liveVal = liveSpots?.[item.ticker];
      const spot =
        liveVal !== undefined && Number.isFinite(Number(liveVal)) && Number(liveVal) > 0
          ? Number(liveVal)
          : item.snapshotSpot;
      const liquidCycle = Boolean(baseline && baseline > 0 && spot && spot > 0);
      if (!liquidCycle || !baseline || !spot) {
        return {
          ticker: item.ticker,
          cyclePct: null,
          multiple: null,
          tactical90dPct: item.tactical90dPct,
          liquidCycle: false,
          isOutlier: item.isOutlier
        };
      }
      return {
        ticker: item.ticker,
        cyclePct: ((spot - baseline) / baseline) * 100,
        multiple: spot / baseline,
        tactical90dPct: item.tactical90dPct,
        liquidCycle: true,
        isOutlier: item.isOutlier
      };
    })
    .filter((m) => m.liquidCycle);
}

export interface BasketAuditLike {
  ticker?: string;
  name?: string;
  grade?: string;
  totalScore?: number;
  consensusFamily?: string;
  architecture?: string;
  invariants?: Array<{ id?: string; score?: number }>;
}

const KNOWN_AUDIT_COHORT_METADATA: Record<string, Partial<CohortAssetEntry>> = {
  PI: {
    ticker: 'PI',
    name: 'Pi Network',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: 'Audited in Basket',
    basePrice: null,
    releaseLabel: "$0.84 (Feb '25)",
    releasePrice: 0.841,
    price180d: 0.1496,
    price1y: 0.2281,
    price2y: null,
    price4y: null,
    snapshotSpot: 0.0593,
    tactical90dPct: null,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: 'pi-network',
    yahooSymbol: 'PI35697-USD',
    note: 'Centralized stellar-core fork • 100B 0-Joule mint • Mandatory KYC/KYB'
  },
  USD: {
    ticker: 'USD',
    name: 'US Dollar (Fiat USD)',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$1.00 Unit Numeraire',
    basePrice: null,
    releaseLabel: '$1.00 Fiat Unit',
    releasePrice: null,
    price180d: null,
    price1y: null,
    price2y: null,
    price4y: null,
    snapshotSpot: null,
    tactical90dPct: null,
    liquidCycle: false,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    yahooSymbol: null,
    note: 'Post-1971 unbacked Federal Reserve credit ledger ($1.00 benchmark numeraire • E = 0)'
  }
};

export function classifyAuditBasketSide(audit: BasketAuditLike): CohortSide {
  const score = Number(audit?.totalScore) || 0;
  const grade = String(audit?.grade || '').trim().toUpperCase();
  return score > 1.0 && grade !== 'F' ? 'PASSED' : 'FAILED';
}

export function buildBasketSyncedCohortRecord(
  auditsMap: Record<string, BasketAuditLike>,
  persistedRecord?: Partial<GainsCohortRecord> | null
): GainsCohortRecord {
  const catalogByTicker = new Map<string, CohortAssetEntry>();
  for (const item of [...PASSED_COHORT_GAINS, ...FAILED_COHORT_GAINS]) {
    catalogByTicker.set(item.ticker, item);
  }
  for (const [tk, meta] of Object.entries(KNOWN_AUDIT_COHORT_METADATA)) {
    const cleaned = sanitizeCohortAssetEntry({ ...meta, ticker: tk }, 'FAILED');
    if (cleaned) catalogByTicker.set(tk, cleaned);
  }

  const persistedByTicker = new Map<string, CohortAssetEntry>();
  if (persistedRecord) {
    if (Array.isArray(persistedRecord.passed)) {
      for (const item of persistedRecord.passed) {
        const cleaned = sanitizeCohortAssetEntry(item, 'PASSED');
        if (cleaned) persistedByTicker.set(cleaned.ticker, cleaned);
      }
    }
    if (Array.isArray(persistedRecord.failed)) {
      for (const item of persistedRecord.failed) {
        const cleaned = sanitizeCohortAssetEntry(item, 'FAILED');
        if (cleaned) persistedByTicker.set(cleaned.ticker, cleaned);
      }
    }
  }

  const passed: CohortAssetEntry[] = [];
  const failed: CohortAssetEntry[] = [];
  const seen = new Set<string>();

  for (const [rawKey, audit] of Object.entries(auditsMap || {})) {
    if (!audit || typeof audit !== 'object') continue;
    const ticker = normalizeCohortTicker(audit.ticker || rawKey);
    if (!ticker || seen.has(ticker)) continue;
    seen.add(ticker);

    const side = classifyAuditBasketSide(audit);
    const persisted = persistedByTicker.get(ticker);
    const catalog = catalogByTicker.get(ticker);
    const suggestion = buildAuditedCohortSuggestion({ ...audit, ticker });

    const grade = String(
      audit.grade || catalog?.grade || persisted?.grade || (side === 'PASSED' ? 'C' : 'F')
    )
      .trim()
      .toUpperCase();
    const auditScore = Number.isFinite(Number(audit.totalScore))
      ? Number(audit.totalScore)
      : catalog?.auditScore ?? persisted?.auditScore ?? 0;

    const basePrice = persisted?.basePrice ?? catalog?.basePrice ?? null;
    const releasePrice = persisted?.releasePrice ?? catalog?.releasePrice ?? null;
    const price180d = persisted?.price180d ?? catalog?.price180d ?? null;
    const price1y = persisted?.price1y ?? catalog?.price1y ?? null;
    const price2y = persisted?.price2y ?? catalog?.price2y ?? null;
    const price4y = persisted?.price4y ?? catalog?.price4y ?? null;
    const snapshotSpot = persisted?.snapshotSpot ?? catalog?.snapshotSpot ?? null;
    const tactical90dPct = persisted?.tactical90dPct ?? catalog?.tactical90dPct ?? null;
    const hasBaseline =
      (basePrice !== null && basePrice > 0) ||
      (releasePrice !== null && releasePrice > 0) ||
      (price180d !== null && price180d > 0) ||
      (price1y !== null && price1y > 0) ||
      (price2y !== null && price2y > 0) ||
      (price4y !== null && price4y > 0);
    const liquidCycle = Boolean(
      (persisted?.liquidCycle ?? catalog?.liquidCycle ?? hasBaseline) &&
        hasBaseline &&
        snapshotSpot !== null &&
        snapshotSpot > 0
    );

    const entry = sanitizeCohortAssetEntry(
      {
        ticker,
        name: String(audit.name || catalog?.name || persisted?.name || ticker),
        grade,
        auditScore,
        baselineLabel:
          persisted?.baselineLabel ||
          catalog?.baselineLabel ||
          (basePrice !== null ? formatUsdPrice(basePrice) : 'Audited in Basket'),
        basePrice,
        releaseLabel:
          persisted?.releaseLabel ||
          catalog?.releaseLabel ||
          (releasePrice !== null ? formatUsdPrice(releasePrice) : undefined),
        releasePrice,
        price180d,
        price1y,
        price2y,
        price4y,
        snapshotSpot,
        tactical90dPct,
        liquidCycle,
        isOutlier: Boolean(catalog?.isOutlier ?? persisted?.isOutlier ?? false),
        coinbasePair:
          persisted?.coinbasePair !== undefined
            ? persisted.coinbasePair
            : catalog?.coinbasePair !== undefined
            ? catalog.coinbasePair
            : `${ticker}-USD`,
        geckoId:
          persisted?.geckoId !== undefined
            ? persisted.geckoId
            : catalog?.geckoId !== undefined
            ? catalog.geckoId
            : suggestion?.geckoId ?? null,
        yahooSymbol:
          persisted?.yahooSymbol !== undefined
            ? persisted.yahooSymbol
            : catalog?.yahooSymbol !== undefined
            ? catalog.yahooSymbol
            : `${ticker}-USD`,
        note: catalog?.note || persisted?.note || suggestion?.note || 'Synced from audited basket'
      },
      side
    );

    if (!entry) continue;
    if (side === 'PASSED') {
      if (passed.length < MAX_ASSETS_PER_COHORT) passed.push(entry);
    } else {
      if (failed.length < MAX_ASSETS_PER_COHORT) failed.push(entry);
    }
  }

  const updatedAtMs =
    typeof persistedRecord?.updatedAtMs === 'number' &&
    Number.isFinite(persistedRecord.updatedAtMs) &&
    persistedRecord.updatedAtMs > 0
      ? persistedRecord.updatedAtMs
      : Date.UTC(2026, 10, 14, 0, 0, 0);

  return {
    cohortId: 'default',
    passed,
    failed,
    updatedAtMs,
    updatedAtLabel:
      String(persistedRecord?.updatedAtLabel || '').trim() ||
      formatCohortTimestampLabel(updatedAtMs),
    revision:
      typeof persistedRecord?.revision === 'number' && persistedRecord.revision >= 1
        ? Math.floor(persistedRecord.revision)
        : 1,
    isCustomized: Boolean(persistedRecord?.isCustomized),
    sourceLabel: `Synced with Baskets (${passed.length} Passed • ${failed.length} Failed)`
  };
}

export function getCohortSyncSignature(record: Pick<GainsCohortRecord, 'passed' | 'failed'>): string {
  const serializeSide = (arr: CohortAssetEntry[]) =>
    [...arr]
      .sort((a, b) => a.ticker.localeCompare(b.ticker))
      .map(
        (a) =>
          `${a.ticker}:${a.grade}:${a.auditScore}:${a.snapshotSpot ?? ''}:${a.basePrice ?? ''}:${a.releasePrice ?? ''}`
      )
      .join('|');
  return `${serializeSide(record.passed)}=>${serializeSide(record.failed)}`;
}

export function buildNiceYGridTicks(
  minVal: number,
  maxVal: number,
  isLog: boolean
): number[] {
  const safeMin = Number.isFinite(minVal) ? Math.max(0.05, minVal) : 0.5;
  const safeMax = Number.isFinite(maxVal) && maxVal > safeMin ? maxVal : safeMin * 2;

  if (isLog) {
    if (safeMax >= 1000) {
      const powers = [0.25, 0.5, 1, 10, 100, 1000, 10000, 100000, 1000000];
      const filtered = powers.filter((t) => t >= safeMin * 0.85 && t <= safeMax * 1.05);
      return filtered.length >= 2 ? filtered : [1, 10, 100, 1000];
    }
    const candidates = [0.1, 0.2, 0.25, 0.5, 1, 1.5, 2, 3, 5, 10, 20, 50, 100, 250, 500];
    const filtered = candidates.filter((t) => t >= safeMin * 0.9 && t <= safeMax * 1.05);
    return filtered.length >= 2 ? filtered : [Math.max(0.1, Number(safeMin.toFixed(2))), 1.0, Number(safeMax.toFixed(1))];
  }

  const span = Math.max(0.05, safeMax - safeMin);
  const rawStep = span / 4.2;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / magnitude;
  const niceNorm = norm <= 1.2 ? 1 : norm <= 2.2 ? 2 : norm <= 2.8 ? 2.5 : norm <= 5.5 ? 5 : 10;
  const step = niceNorm * magnitude;

  const start = Math.ceil(safeMin / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= safeMax + step * 0.05; v += step) {
    const rounded = Math.round(v * 1000) / 1000;
    if (rounded >= safeMin * 0.96 && rounded <= safeMax * 1.02) {
      ticks.push(rounded);
    }
  }

  if (safeMin <= 1.0 && safeMax >= 1.0 && !ticks.some((t) => Math.abs(t - 1.0) < step * 0.35)) {
    ticks.push(1.0);
  }
  ticks.sort((a, b) => a - b);
  // Deduplicate any overly close ticks
  const deduped: number[] = [];
  for (const t of ticks) {
    if (deduped.length === 0 || Math.abs(t - deduped[deduped.length - 1]) >= step * 0.32) {
      deduped.push(t);
    }
  }
  return deduped.length >= 2 ? deduped : [Number(safeMin.toFixed(2)), 1.0, Number(safeMax.toFixed(2))];
}

const WINDOW_CHECKPOINT_DEFS: Record<
  GainsWindowHorizonKey,
  Array<{ label: string; event: string }>
> = {
  D180: [
    { label: 'T-180d', event: '180-Day Window Open' },
    { label: 'T-150d', event: 'Month 1 Repricing' },
    { label: 'T-120d', event: 'Month 2 Equilibrium' },
    { label: 'T-90d', event: '90-Day Checkpoint' },
    { label: 'T-60d', event: 'Late-Window Divergence' },
    { label: 'T-30d', event: 'Final 30D Compression' },
    { label: 'Now', event: 'Live 180D Spot' }
  ],
  Y1: [
    { label: 'T-12m', event: '1-Year Window Open' },
    { label: 'T-10m', event: 'Early Cycle Flow' },
    { label: 'T-8m', event: 'Mid-Year Consolidation' },
    { label: 'T-6m', event: '180D Midpoint' },
    { label: 'T-4m', event: 'Unlock vs Scarcity Split' },
    { label: 'T-2m', event: 'Pre-Current Leg' },
    { label: 'Now', event: 'Live 1Y Spot' }
  ],
  Y2: [
    { label: 'T-24m', event: '2-Year Window Open' },
    { label: 'T-20m', event: 'Early Re-Accumulation' },
    { label: 'T-16m', event: 'Macro Expansion Test' },
    { label: 'T-12m', event: '1-Year Midpoint' },
    { label: 'T-8m', event: 'Supply Absorption' },
    { label: 'T-4m', event: 'Late Window Trend' },
    { label: 'Now', event: 'Live 2Y Spot' }
  ],
  Y4: [
    { label: 'T-4Y', event: '4-Year Cycle Open' },
    { label: 'T-40m', event: 'Post-Drawdown Recovery' },
    { label: 'T-32m', event: 'Halving Era Advance' },
    { label: 'T-24m', event: '2-Year Midpoint' },
    { label: 'T-16m', event: 'Mature Cycle Dispersion' },
    { label: 'T-8m', event: 'Recent Cohort Separation' },
    { label: 'Now', event: 'Live 4Y Spot' }
  ]
};

export function buildFallbackWindowTrajectory(
  mode: GainsWindowHorizonKey,
  summary: Pick<
    CohortAggregateSummary,
    'passCycleAvg' | 'passExOutlierAvg' | 'failCycleAvg' | 'failExOutlierAvg'
  >
): MacroTrajectoryPoint[] {
  const defs = WINDOW_CHECKPOINT_DEFS[mode];
  const targetPass = Math.max(0.05, 1 + summary.passCycleAvg / 100);
  const targetPassEx = Math.max(0.05, 1 + summary.passExOutlierAvg / 100);
  const targetFail = Math.max(0.05, 1 + summary.failCycleAvg / 100);
  const targetFailEx = Math.max(0.05, 1 + summary.failExOutlierAvg / 100);

  return defs.map((def, idx) => {
    const t = idx / Math.max(1, defs.length - 1);
    const wave = idx === 0 || idx === defs.length - 1 ? 0 : Math.sin(t * Math.PI) * 0.04;
    return {
      label: def.label,
      event: def.event,
      passAll: idx === 0 ? 1.0 : Math.max(0.05, 1 + (targetPass - 1) * t + wave),
      passEx: idx === 0 ? 1.0 : Math.max(0.05, 1 + (targetPassEx - 1) * t + wave * 0.7),
      failAll: idx === 0 ? 1.0 : Math.max(0.05, 1 + (targetFail - 1) * t - wave * 0.8),
      failEx: idx === 0 ? 1.0 : Math.max(0.05, 1 + (targetFailEx - 1) * t - wave)
    };
  });
}


