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
export type GainsHistoricalStopKey =
  | 'Y1913'
  | 'Y1971'
  | 'Y2000'
  | 'Y2008'
  | 'Y2016'
  | 'Y2020'
  | 'Y2024';
export type GainsBaselineMode =
  | 'RELEASE'
  | 'CYCLE'
  | GainsWindowHorizonKey
  | GainsHistoricalStopKey;
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
    const hasCents = Math.abs(n - Math.round(n)) >= 0.005;
    return `$${n.toLocaleString(undefined, {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2
    })}`;
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
  if (abs > 0 && abs < 0.5) {
    return `${sign}<$1`;
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
  if (n > -100 && n <= -99.95) {
    return '-99.99%';
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

const HISTORICAL_STOP_YEAR_BY_MODE: Record<GainsHistoricalStopKey, number> = {
  Y1913: 1913,
  Y1971: 1971,
  Y2000: 2000,
  Y2008: 2008,
  Y2016: 2016,
  Y2020: 2020,
  Y2024: 2024
};

export const HISTORICAL_STOP_BASELINES_BY_MODE: Record<
  GainsHistoricalStopKey,
  Record<string, { price: number; label: string }>
> = {
  Y1913: {
    XAU: { price: 20.67, label: '$20.67 (1913 Specie)' },
    XAG: { price: 0.6, label: '$0.6000 (1913 Open)' },
    CU: { price: 0.155, label: '$0.1550 (1913 Open)' },
    XPT: { price: 45.0, label: '$45.00 (1913 Open)' },
    GBP: { price: 4.8665, label: '$4.87 (1913 Parity)' }
  },
  Y1971: {
    XAU: { price: 35.0, label: '$35.00 (1971 Window)' },
    XAG: { price: 1.63, label: '$1.63 (1971 Open)' },
    CU: { price: 0.52, label: '$0.5200 (1971 Open)' },
    XPT: { price: 120.0, label: '$120.00 (1971 Open)' },
    XPD: { price: 37.0, label: '$37.00 (1971 Open)' },
    GBP: { price: 2.42, label: '$2.42 (1971 Bretton)' },
    CHF: { price: 0.245, label: '$0.2450 (1971 Open)' },
    JPY: { price: 0.00278, label: '$0.00278 (360¥ Peg)' }
  },
  Y2000: {
    XAU: { price: 277.0, label: '$277.00 (2000 Open)' },
    XAG: { price: 5.035, label: '$5.04 (2000 Open)' },
    CU: { price: 0.878, label: '$0.8780 (2000 Open)' },
    XPT: { price: 407.2, label: '$407.20 (2000 Open)' },
    XPD: { price: 448.0, label: '$448.00 (2000 Open)' },
    EUR: { price: 1.007, label: '$1.01 (2000 Open)' },
    GBP: { price: 1.637, label: '$1.64 (2000 Open)' },
    CHF: { price: 0.625, label: '$0.6250 (2000 Open)' },
    CAD: { price: 0.691, label: '$0.6910 (2000 Open)' },
    AUD: { price: 0.656, label: '$0.6560 (2000 Open)' },
    JPY: { price: 0.00975, label: '$0.00975 (2000 Open)' },
    CNY: { price: 0.1208, label: '$0.1208 (2000 Open)' }
  },
  Y2008: {
    BTC: { price: 0.05, label: '$0.0500 (Genesis Open)' },
    XAU: { price: 865.0, label: '$865.00 (2008 Open)' },
    XAG: { price: 14.9, label: '$14.90 (2008 Open)' },
    CU: { price: 3.06, label: '$3.06 (2008 Open)' },
    XPT: { price: 1530.0, label: '$1,530 (2008 Open)' },
    XPD: { price: 375.0, label: '$375.00 (2008 Open)' },
    EUR: { price: 1.46, label: '$1.46 (2008 Open)' },
    GBP: { price: 1.98, label: '$1.98 (2008 Open)' },
    CHF: { price: 0.885, label: '$0.8850 (2008 Open)' }
  },
  Y2016: {
    BTC: { price: 434.0, label: '$434.00 (2016 Open)' },
    ETH: { price: 0.95, label: '$0.9500 (2016 Open)' },
    ETC: { price: 0.752, label: "$0.7520 (Jul '16)" },
    LTC: { price: 3.48, label: '$3.48 (2016 Open)' },
    XMR: { price: 0.5, label: '$0.5000 (2016 Open)' },
    ZEC: { price: 250.55, label: "$250.55 (Oct '16)" },
    XAU: { price: 1061.0, label: '$1,061 (2016 Open)' },
    XAG: { price: 13.85, label: '$13.85 (2016 Open)' },
    CU: { price: 2.13, label: '$2.13 (2016 Open)' },
    XPT: { price: 893.0, label: '$893.00 (2016 Open)' },
    XPD: { price: 562.0, label: '$562.00 (2016 Open)' },
    XRP: { price: 0.006, label: '$0.0060 (2016 Open)' },
    XLM: { price: 0.0018, label: '$0.0018 (2016 Open)' },
    DOGE: { price: 0.00015, label: '$0.00015 (2016 Open)' },
    EUR: { price: 1.086, label: '$1.09 (2016 Open)' },
    GBP: { price: 1.474, label: '$1.47 (2016 Open)' }
  },
  Y2020: {
    BTC: { price: 7200.0, label: '$7,200 (2020 Open)' },
    ETH: { price: 129.6, label: '$129.60 (2020 Open)' },
    ETC: { price: 4.52, label: '$4.52 (2020 Open)' },
    BSV: { price: 97.4, label: '$97.40 (2020 Open)' },
    LTC: { price: 41.3, label: '$41.30 (2020 Open)' },
    XMR: { price: 44.5, label: '$44.50 (2020 Open)' },
    ZEC: { price: 27.6, label: '$27.60 (2020 Open)' },
    BCH: { price: 204.6, label: '$204.60 (2020 Open)' },
    RVN: { price: 0.0225, label: '$0.0225 (2020 Open)' },
    ERG: { price: 0.185, label: '$0.1850 (2020 Open)' },
    XAU: { price: 1517.0, label: '$1,517 (2020 Open)' },
    XAG: { price: 17.85, label: '$17.85 (2020 Open)' },
    CU: { price: 2.8, label: '$2.80 (2020 Open)' },
    XPT: { price: 978.0, label: '$978.00 (2020 Open)' },
    XPD: { price: 1909.0, label: '$1,909 (2020 Open)' },
    XRP: { price: 0.193, label: '$0.1930 (2020 Open)' },
    XLM: { price: 0.045, label: '$0.0450 (2020 Open)' },
    ADA: { price: 0.0328, label: '$0.0328 (2020 Open)' },
    QNT: { price: 3.15, label: '$3.15 (2020 Open)' },
    STX: { price: 0.105, label: '$0.1050 (2020 Open)' },
    ALGO: { price: 0.218, label: '$0.2180 (2020 Open)' },
    SOL: { price: 0.832, label: "$0.8320 (Apr '20)" },
    AVAX: { price: 4.61, label: "$4.61 (Sep '20)" },
    NEAR: { price: 1.69, label: "$1.69 (Oct '20)" },
    DOGE: { price: 0.002, label: '$0.0020 (2020 Open)' },
    EUR: { price: 1.121, label: '$1.12 (2020 Open)' },
    GBP: { price: 1.325, label: '$1.33 (2020 Open)' }
  },
  Y2024: {
    KAS: { price: 0.1118, label: '$0.1118 (2024 Open)' },
    BTC: { price: 42265.0, label: '$42,265 (2024 Open)' },
    ETH: { price: 2282.0, label: '$2,282 (2024 Open)' },
    ETC: { price: 21.9, label: '$21.90 (2024 Open)' },
    BSV: { price: 96.5, label: '$96.50 (2024 Open)' },
    ZEC: { price: 26.9, label: '$26.90 (2024 Open)' },
    XMR: { price: 165.4, label: '$165.40 (2024 Open)' },
    XAU: { price: 2063.0, label: '$2,063 (2024 Open)' },
    XAG: { price: 23.8, label: '$23.80 (2024 Open)' },
    CU: { price: 3.89, label: '$3.89 (2024 Open)' },
    XPT: { price: 995.0, label: '$995.00 (2024 Open)' },
    XPD: { price: 1106.0, label: '$1,106 (2024 Open)' },
    BCH: { price: 259.4, label: '$259.40 (2024 Open)' },
    LTC: { price: 72.8, label: '$72.80 (2024 Open)' },
    RVN: { price: 0.0205, label: '$0.0205 (2024 Open)' },
    ERG: { price: 1.52, label: '$1.52 (2024 Open)' },
    GEEK: { price: 0.0000075, label: "$0.0000075 (Jun '24)" },
    TAO: { price: 267.0, label: '$267.00 (2024 Open)' },
    XRP: { price: 0.615, label: '$0.6150 (2024 Open)' },
    SOL: { price: 101.5, label: '$101.50 (2024 Open)' },
    QNT: { price: 137.8, label: '$137.80 (2024 Open)' },
    STX: { price: 1.5, label: '$1.50 (2024 Open)' },
    XLM: { price: 0.129, label: '$0.1290 (2024 Open)' },
    NEAR: { price: 3.65, label: '$3.65 (2024 Open)' },
    SUI: { price: 0.778, label: '$0.7780 (2024 Open)' },
    ICP: { price: 13.32, label: '$13.32 (2024 Open)' },
    AVAX: { price: 38.55, label: '$38.55 (2024 Open)' },
    ADA: { price: 0.594, label: '$0.5940 (2024 Open)' },
    ALGO: { price: 0.223, label: '$0.2230 (2024 Open)' },
    DOGE: { price: 0.0895, label: '$0.0895 (2024 Open)' },
    HYPE: { price: 3.2, label: "$3.20 (Nov '24)" },
    APT: { price: 9.4, label: '$9.40 (2024 Open)' },
    ARB: { price: 1.56, label: '$1.56 (2024 Open)' },
    OP: { price: 3.7, label: '$3.70 (2024 Open)' },
    TIA: { price: 11.8, label: '$11.80 (2024 Open)' },
    SEI: { price: 0.58, label: '$0.5800 (2024 Open)' },
    EUR: { price: 1.104, label: '$1.10 (2024 Open)' },
    GBP: { price: 1.273, label: '$1.27 (2024 Open)' }
  }
};

export function resolveTimelineBaselineMode(
  timelineYear: string | null | undefined,
  horizon: 'ALL_TIME' | GainsWindowHorizonKey = 'ALL_TIME'
): GainsBaselineMode {
  const cleaned = String(timelineYear || 'PRESENT')
    .trim()
    .toUpperCase();
  if (cleaned === '1913') return 'Y1913';
  if (cleaned === '1971') return 'Y1971';
  if (cleaned === '2000') return 'Y2000';
  if (cleaned === '2008') return 'Y2008';
  if (cleaned === '2016') return 'Y2016';
  if (cleaned === '2020') return 'Y2020';
  if (cleaned === '2024') return 'Y2024';
  return horizon === 'ALL_TIME' ? 'RELEASE' : horizon;
}

function extractReleaseYearFromLabel(label?: string | null): number | null {
  if (!label) return null;
  const shortMatch = label.match(/'(\d{2})\b/);
  if (shortMatch) {
    const twoDigit = Number(shortMatch[1]);
    if (Number.isFinite(twoDigit)) {
      return twoDigit >= 70 ? 1900 + twoDigit : 2000 + twoDigit;
    }
  }
  const fullMatch = label.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (fullMatch) {
    return Number(fullMatch[1]);
  }
  return null;
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
  > & { ticker?: string },
  mode: GainsBaselineMode = 'RELEASE'
): { price: number | null; label: string } {
  if (mode in HISTORICAL_STOP_YEAR_BY_MODE) {
    const stopMode = mode as GainsHistoricalStopKey;
    const stopYear = HISTORICAL_STOP_YEAR_BY_MODE[stopMode];
    const cleanTicker = entry.ticker ? normalizeCohortTicker(entry.ticker) : '';
    const curated = cleanTicker ? HISTORICAL_STOP_BASELINES_BY_MODE[stopMode]?.[cleanTicker] : undefined;
    if (curated) {
      return curated;
    }

    // Fallback for dynamically synced custom assets if their recorded release was on/before stopYear
    const relYear = extractReleaseYearFromLabel(entry.releaseLabel);
    if (relYear !== null && relYear > stopYear) {
      return { price: null, label: `Pre-Launch (${stopYear})` };
    }
    if (stopMode === 'Y2024' && entry.price2y && entry.price2y > 0) {
      return {
        price: entry.price2y,
        label: `${formatUsdPrice(entry.price2y)} (2024 Est.)`
      };
    }
    if (relYear !== null && relYear === stopYear && entry.releasePrice && entry.releasePrice > 0) {
      return {
        price: entry.releasePrice,
        label: entry.releaseLabel || `${formatUsdPrice(entry.releasePrice)} (${stopYear})`
      };
    }
    return { price: null, label: `Unpriced (${stopYear})` };
  }
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

export const KNOWN_AUDIT_COHORT_METADATA: Record<string, Partial<CohortAssetEntry>> = {
  CU: {
    ticker: 'CU',
    name: 'Physical Copper',
    grade: 'C+',
    auditScore: 3.75,
    baselineLabel: '$4.25',
    basePrice: 4.25,
    releaseLabel: "$0.88 (COMEX '00)",
    releasePrice: 0.878,
    price180d: 4.92,
    price1y: 4.38,
    price2y: 4.12,
    price4y: 3.63,
    snapshotSpot: 5.6,
    tactical90dPct: 14.2,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    yahooSymbol: 'HG=F',
    note: 'Zero-default industrial + monetary COMEX physical metal floor (HG=F)'
  },
  XPT: {
    ticker: 'XPT',
    name: 'Physical Platinum',
    grade: 'C+',
    auditScore: 3.7,
    baselineLabel: '$960.00',
    basePrice: 960.0,
    releaseLabel: "$407.20 (COMEX '00)",
    releasePrice: 407.2,
    price180d: 1185.0,
    price1y: 1042.0,
    price2y: 968.0,
    price4y: 992.0,
    snapshotSpot: 1312.4,
    tactical90dPct: 11.4,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    yahooSymbol: 'PL=F',
    note: 'R-process PGM bullion • Zero counterparty default floor (PL=F)'
  },
  XPD: {
    ticker: 'XPD',
    name: 'Physical Palladium',
    grade: 'C',
    auditScore: 3.3,
    baselineLabel: '$2,010.00',
    basePrice: 2010.0,
    releaseLabel: "$448.00 (COMEX '00)",
    releasePrice: 448.0,
    price180d: 1018.0,
    price1y: 985.0,
    price2y: 1012.0,
    price4y: 1880.0,
    snapshotSpot: 1042.0,
    tactical90dPct: 4.8,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    yahooSymbol: 'PA=F',
    note: 'Physical PGM commodity floor • Industrial demand cycle (PA=F)'
  },
  DOGE: {
    ticker: 'DOGE',
    name: 'Dogecoin',
    grade: 'B',
    auditScore: 4.23,
    coinbasePair: 'DOGE-USD',
    geckoId: 'dogecoin',
    yahooSymbol: 'DOGE-USD',
    note: 'Fair-launch AuxPoW Scrypt merged-mined with Litecoin • 5B/yr fixed tail emission'
  },
  ETC: {
    ticker: 'ETC',
    name: 'Ethereum Classic',
    grade: 'D+',
    auditScore: 2.05,
    baselineLabel: '$21.40',
    basePrice: 21.4,
    releaseLabel: "$0.75 (Jul '16)",
    releasePrice: 0.752,
    price180d: 18.4,
    price1y: 26.8,
    price2y: 28.5,
    price4y: 15.9,
    snapshotSpot: 14.85,
    tactical90dPct: 6.4,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'ETC-USD',
    geckoId: 'ethereum-classic',
    yahooSymbol: 'ETC-USD',
    note: 'Etchash PoW chain preserving pre-DAO state • Inherits 2015 72M genesis premine cap'
  },
  BSV: {
    ticker: 'BSV',
    name: 'Bitcoin SV',
    grade: 'D-',
    auditScore: 1.6,
    baselineLabel: '$53.20',
    basePrice: 53.2,
    releaseLabel: "$88.30 (Nov '18)",
    releasePrice: 88.3,
    price180d: 33.5,
    price1y: 51.2,
    price2y: 66.8,
    price4y: 41.9,
    snapshotSpot: 26.4,
    tactical90dPct: -8.2,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: 'bitcoin-cash-sv',
    yahooSymbol: 'BSV-USD',
    note: 'Unbounded-block SHA-256d fork • Low hashshare & node centralization drag'
  },
  ZKAS: {
    ticker: 'ZKAS',
    name: 'Kaspa ZK Rollup',
    grade: 'D+',
    auditScore: 2.5,
    baselineLabel: 'Kaspa ZK Rollup',
    basePrice: null,
    releaseLabel: 'Kaspa ZK Rollup',
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
    note: 'Kaspa L1-anchored ZK execution overlay (subordinate carrier M_overlay < M_L1)'
  },
  HYPE: {
    ticker: 'HYPE',
    name: 'Hyperliquid',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$3.20 (Open)',
    basePrice: 3.2,
    releaseLabel: "$3.20 (Nov '24)",
    releasePrice: 3.2,
    price180d: 26.4,
    price1y: 24.1,
    price2y: null,
    price4y: null,
    snapshotSpot: 38.6,
    tactical90dPct: 31.5,
    liquidCycle: true,
    isOutlier: true,
    coinbasePair: null,
    geckoId: 'hyperliquid',
    yahooSymbol: 'HYPE32196-USD',
    note: 'HyperBFT 0-Joule PoS perp DEX L1 • Strong fee buyback outlier despite E = 0'
  },
  S: {
    ticker: 'S',
    name: 'Sonic (prev. Fantom)',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$0.83 (Open)',
    basePrice: 0.8256,
    releaseLabel: "$0.83 (Jan '25)",
    releasePrice: 0.8256,
    price180d: 0.312,
    price1y: 0.448,
    price2y: null,
    price4y: null,
    snapshotSpot: 0.194,
    tactical90dPct: -18.4,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: 'sonic-3',
    yahooSymbol: 'S32684-USD',
    note: '0-Joule DAG-BFT rebrand of Fantom • Post-migration supply inflation bleed'
  },
  TON: {
    ticker: 'TON',
    name: 'Toncoin',
    grade: 'F',
    auditScore: 0.0,
    coinbasePair: null,
    geckoId: 'the-open-network',
    yahooSymbol: 'TON11419-USD',
    note: '0-Joule Catchain PoS • ~98.5% initial giver concentration overhang'
  },
  APT: {
    ticker: 'APT',
    name: 'Aptos',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$8.42 (Open)',
    basePrice: 8.42,
    releaseLabel: "$8.42 (Oct '22)",
    releasePrice: 8.42,
    price180d: 4.92,
    price1y: 8.85,
    price2y: 12.1,
    price4y: null,
    snapshotSpot: 3.65,
    tactical90dPct: -14.2,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'APT-USD',
    geckoId: 'aptos',
    yahooSymbol: 'APT21794-USD',
    note: '0-Joule AptosBFT Move L1 • Heavy VC & foundation unlock dilution'
  },
  ARB: {
    ticker: 'ARB',
    name: 'Arbitrum',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$1.35 (Open)',
    basePrice: 1.35,
    releaseLabel: "$1.35 (Mar '23)",
    releasePrice: 1.35,
    price180d: 0.36,
    price1y: 0.78,
    price2y: 0.92,
    price4y: null,
    snapshotSpot: 0.285,
    tactical90dPct: -19.5,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'ARB-USD',
    geckoId: 'arbitrum',
    yahooSymbol: 'ARB11841-USD',
    note: 'Centralized sequencer L2 governance token • Cliff unlock supply bleed'
  },
  OP: {
    ticker: 'OP',
    name: 'Optimism',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$1.43',
    basePrice: 1.43,
    releaseLabel: "$1.43 (May '22)",
    releasePrice: 1.43,
    price180d: 0.72,
    price1y: 1.58,
    price2y: 1.76,
    price4y: 0.94,
    snapshotSpot: 0.54,
    tactical90dPct: -16.8,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'OP-USD',
    geckoId: 'optimism',
    yahooSymbol: 'OP-USD',
    note: '0-Joule Superchain governance token • Continuous retroactive & VC emissions'
  },
  TIA: {
    ticker: 'TIA',
    name: 'Celestia',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$2.10 (Open)',
    basePrice: 2.1,
    releaseLabel: "$2.10 (Oct '23)",
    releasePrice: 2.1,
    price180d: 2.45,
    price1y: 4.9,
    price2y: 5.4,
    price4y: null,
    snapshotSpot: 1.62,
    tactical90dPct: -22.0,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'TIA-USD',
    geckoId: 'celestia',
    yahooSymbol: 'TIA22861-USD',
    note: '0-Joule CometBFT DA layer • Massive Series A/B cliff unlock repricing'
  },
  SEI: {
    ticker: 'SEI',
    name: 'Sei',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$0.18 (Open)',
    basePrice: 0.18,
    releaseLabel: "$0.18 (Aug '23)",
    releasePrice: 0.18,
    price180d: 0.21,
    price1y: 0.42,
    price2y: 0.48,
    price4y: null,
    snapshotSpot: 0.165,
    tactical90dPct: -9.4,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: 'SEI-USD',
    geckoId: 'sei-network',
    yahooSymbol: 'SEI23149-USD',
    note: '0-Joule Twin-Turbo PoS • Pre-allocated foundation & investor unlock schedule'
  },
  NIGHT: {
    ticker: 'NIGHT',
    name: 'Midnight Network',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: 'Partner-Chain Token',
    basePrice: null,
    releaseLabel: 'Partner-Chain Token',
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
    geckoId: 'midnight-network',
    yahooSymbol: null,
    note: 'Cardano 0-Joule partner-chain privacy ledger (unindexed / non-PoW genesis)'
  },
  GRAM: {
    ticker: 'GRAM',
    name: 'Gram (TON Jetton)',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: 'TON Jetton Overlay',
    basePrice: null,
    releaseLabel: 'TON Jetton Overlay',
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
    geckoId: 'gram',
    yahooSymbol: null,
    note: 'TON smart-contract Jetton overlay • Subordinate to 0-Joule TON PoS host (E = 0)'
  },
  CC: {
    ticker: 'CC',
    name: 'Canton Network',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: 'Permissioned Ledger',
    basePrice: null,
    releaseLabel: 'Permissioned Ledger',
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
    geckoId: 'canton-network',
    yahooSymbol: null,
    note: 'Permissioned institutional Canton Coin synchronizer (0-Joule BFT • Grade F)'
  },
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
  EUR: {
    ticker: 'EUR',
    name: 'Euro (Fiat EUR)',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$1.07',
    basePrice: 1.07,
    releaseLabel: "$1.17 (Jan '99)",
    releasePrice: 1.174,
    price180d: 1.082,
    price1y: 1.055,
    price2y: 1.054,
    price4y: 1.039,
    snapshotSpot: 1.062,
    tactical90dPct: -1.8,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    yahooSymbol: 'EURUSD=X',
    note: 'Unbacked ECB fiat reserve unit • Continuous M2 monetary debasement (E = 0)'
  },
  GBP: {
    ticker: 'GBP',
    name: 'British Pound (Fiat GBP)',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$1.25',
    basePrice: 1.25,
    releaseLabel: "$1.64 (COMEX '00)",
    releasePrice: 1.637,
    price180d: 1.288,
    price1y: 1.264,
    price2y: 1.268,
    price4y: 1.208,
    snapshotSpot: 1.271,
    tactical90dPct: -1.1,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    yahooSymbol: 'GBPUSD=X',
    note: 'Unbacked Bank of England fiat unit • Secular purchasing-power erosion (E = 0)'
  },
  CHF: {
    ticker: 'CHF',
    name: 'Swiss Franc (Fiat CHF)',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$1.03',
    basePrice: 1.03,
    releaseLabel: "$0.63 (COMEX '00)",
    releasePrice: 0.625,
    price180d: 1.132,
    price1y: 1.129,
    price2y: 1.131,
    price4y: 1.056,
    snapshotSpot: 1.138,
    tactical90dPct: 0.5,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    yahooSymbol: 'CHFUSD=X',
    note: 'SNB fiat ledger • Outperformed USD nominally, crushed by Gold & BTC (E = 0)'
  },
  CAD: {
    ticker: 'CAD',
    name: 'Canadian Dollar (Fiat CAD)',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$0.78',
    basePrice: 0.78,
    releaseLabel: "$0.69 (COMEX '00)",
    releasePrice: 0.691,
    price180d: 0.728,
    price1y: 0.714,
    price2y: 0.715,
    price4y: 0.742,
    snapshotSpot: 0.712,
    tactical90dPct: -2.1,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    yahooSymbol: 'CADUSD=X',
    note: 'Unbacked Bank of Canada fiat unit (zero gold reserve backing • E = 0)'
  },
  AUD: {
    ticker: 'AUD',
    name: 'Australian Dollar (Fiat AUD)',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$0.71',
    basePrice: 0.71,
    releaseLabel: "$0.66 (COMEX '00)",
    releasePrice: 0.656,
    price180d: 0.662,
    price1y: 0.651,
    price2y: 0.653,
    price4y: 0.674,
    snapshotSpot: 0.648,
    tactical90dPct: -1.9,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    yahooSymbol: 'AUDUSD=X',
    note: 'Unbacked RBA fiat unit • Commodity-linked credit ledger (E = 0)'
  },
  JPY: {
    ticker: 'JPY',
    name: 'Japanese Yen (Fiat JPY)',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$0.0078',
    basePrice: 0.0078,
    releaseLabel: "$0.0098 (COMEX '00)",
    releasePrice: 0.00975,
    price180d: 0.00658,
    price1y: 0.00648,
    price2y: 0.00649,
    price4y: 0.00718,
    snapshotSpot: 0.00652,
    tactical90dPct: -0.9,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    yahooSymbol: 'JPYUSD=X',
    note: 'Unbacked BoJ yield-curve-control fiat currency • Severe debasement (E = 0)'
  },
  CNY: {
    ticker: 'CNY',
    name: 'Chinese Yuan (Fiat CNY)',
    grade: 'F',
    auditScore: 0.0,
    baselineLabel: '$0.149',
    basePrice: 0.149,
    releaseLabel: "$0.1208 (COMEX '00)",
    releasePrice: 0.1208,
    price180d: 0.1382,
    price1y: 0.1379,
    price2y: 0.1381,
    price4y: 0.1401,
    snapshotSpot: 0.1384,
    tactical90dPct: 0.1,
    liquidCycle: true,
    isOutlier: false,
    coinbasePair: null,
    geckoId: null,
    yahooSymbol: 'CNYUSD=X',
    note: 'Capital-controlled PBoC fiat credit ledger • Record M2 expansion (E = 0)'
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

export function mergeResolvedEntriesIntoCohortRecord(
  record: GainsCohortRecord,
  extraEntries?: Record<string, Partial<CohortAssetEntry>> | null
): GainsCohortRecord {
  if (!extraEntries || typeof extraEntries !== 'object') return record;
  const entries = Object.entries(extraEntries);
  if (entries.length === 0) return record;

  const nextPassed = [...record.passed];
  const nextFailed = [...record.failed];
  let didChange = false;

  for (const [rawKey, rawPatch] of entries) {
    if (!rawPatch || typeof rawPatch !== 'object') continue;
    const ticker = normalizeCohortTicker(rawPatch.ticker || rawKey);
    if (!ticker) continue;

    const passIdx = nextPassed.findIndex((a) => a.ticker === ticker);
    const failIdx = nextFailed.findIndex((a) => a.ticker === ticker);

    const inferredSide: CohortSide =
      passIdx !== -1
        ? 'PASSED'
        : failIdx !== -1
        ? 'FAILED'
        : classifyAuditBasketSide({
            ticker,
            grade: rawPatch.grade,
            totalScore: rawPatch.auditScore
          });

    const existing =
      passIdx !== -1 ? nextPassed[passIdx] : failIdx !== -1 ? nextFailed[failIdx] : null;
    const mergedRaw: Partial<CohortAssetEntry> = existing
      ? {
          ...existing,
          ...rawPatch,
          ticker,
          releasePrice: rawPatch.releasePrice ?? existing.releasePrice ?? null,
          releaseLabel: rawPatch.releaseLabel || existing.releaseLabel,
          price180d: rawPatch.price180d ?? existing.price180d ?? null,
          price1y: rawPatch.price1y ?? existing.price1y ?? null,
          price2y: rawPatch.price2y ?? existing.price2y ?? null,
          price4y: rawPatch.price4y ?? existing.price4y ?? null,
          snapshotSpot: rawPatch.snapshotSpot ?? existing.snapshotSpot ?? null,
          yahooSymbol: rawPatch.yahooSymbol ?? existing.yahooSymbol ?? null
        }
      : { ...rawPatch, ticker };

    const cleaned = sanitizeCohortAssetEntry(mergedRaw, inferredSide);
    if (!cleaned) continue;

    if (passIdx !== -1) {
      nextPassed[passIdx] = cleaned;
      didChange = true;
    } else if (failIdx !== -1) {
      nextFailed[failIdx] = cleaned;
      didChange = true;
    } else if (inferredSide === 'PASSED') {
      if (nextPassed.length < MAX_ASSETS_PER_COHORT) {
        nextPassed.unshift(cleaned);
        didChange = true;
      }
    } else if (nextFailed.length < MAX_ASSETS_PER_COHORT) {
      nextFailed.unshift(cleaned);
      didChange = true;
    }
  }

  if (!didChange) return record;
  const now = Date.now();
  return {
    ...record,
    passed: nextPassed,
    failed: nextFailed,
    updatedAtMs: Math.max(now, (record.updatedAtMs || 0) + 1),
    updatedAtLabel: formatCohortTimestampLabel(now)
  };
}

export function preserveCustomCohortEntries(
  targetRecord: GainsCohortRecord,
  fallbackRecord?: GainsCohortRecord | null
): GainsCohortRecord {
  if (!fallbackRecord) return targetRecord;
  const fallbackMap: Record<string, Partial<CohortAssetEntry>> = {};
  const targetByTicker = new Map<string, CohortAssetEntry>(
    [...targetRecord.passed, ...targetRecord.failed].map((a) => [a.ticker, a])
  );

  for (const prevItem of [...fallbackRecord.passed, ...fallbackRecord.failed]) {
    const existing = targetByTicker.get(prevItem.ticker);
    if (!existing) {
      fallbackMap[prevItem.ticker] = prevItem;
      continue;
    }
    const needsBackfill =
      (existing.releasePrice == null && prevItem.releasePrice != null) ||
      (existing.price180d == null && prevItem.price180d != null) ||
      (existing.price1y == null && prevItem.price1y != null) ||
      (existing.price2y == null && prevItem.price2y != null) ||
      (existing.price4y == null && prevItem.price4y != null) ||
      (existing.snapshotSpot == null && prevItem.snapshotSpot != null);
    if (needsBackfill) {
      fallbackMap[prevItem.ticker] = {
        ...existing,
        releasePrice: existing.releasePrice ?? prevItem.releasePrice ?? null,
        releaseLabel: existing.releaseLabel || prevItem.releaseLabel,
        price180d: existing.price180d ?? prevItem.price180d ?? null,
        price1y: existing.price1y ?? prevItem.price1y ?? null,
        price2y: existing.price2y ?? prevItem.price2y ?? null,
        price4y: existing.price4y ?? prevItem.price4y ?? null,
        snapshotSpot: existing.snapshotSpot ?? prevItem.snapshotSpot ?? null,
        yahooSymbol: existing.yahooSymbol ?? prevItem.yahooSymbol ?? null,
        geckoId: existing.geckoId ?? prevItem.geckoId ?? null,
        coinbasePair: existing.coinbasePair ?? prevItem.coinbasePair ?? null
      };
    }
  }

  return mergeResolvedEntriesIntoCohortRecord(targetRecord, fallbackMap);
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

const HISTORICAL_TIMELINE_CHECKPOINTS: Record<
  GainsHistoricalStopKey,
  Array<{ label: string; event: string }>
> = {
  Y1913: [
    { label: '1913', event: 'Pre-Fed Classical Gold Standard Open' },
    { label: '1944', event: 'Bretton Woods $35/oz Accord' },
    { label: '1971', event: 'Nixon Shock Gold Window Severance' },
    { label: '2000', event: 'Unbacked Fiat Credit Era' },
    { label: '2008', event: 'GFC & Satoshi PoW Breakthrough' },
    { label: '2020', event: 'Pandemic QE Expansion' },
    { label: 'Now', event: 'Live 1913 → Today Spot' }
  ],
  Y1971: [
    { label: '1971', event: 'Bretton Woods $35/oz Severance Open' },
    { label: '1980', event: 'Stagflation Bullion Repricing' },
    { label: '2000', event: 'Y2K Fiat Credit Expansion' },
    { label: '2008', event: 'GFC Bank Bailouts' },
    { label: '2016', event: 'Post-QE Bullion Accumulation' },
    { label: '2022', event: 'Sovereign Bullion Bid' },
    { label: 'Now', event: 'Live 1971 → Today Spot' }
  ],
  Y2000: [
    { label: '2000', event: '2000 Unbacked Fiat Era Open' },
    { label: '2004', event: 'Gold Monetization Wave' },
    { label: '2008', event: 'Global Financial Crisis' },
    { label: '2012', event: 'QE3 Zero-Rate Regime' },
    { label: '2020', event: 'Pandemic Monetary Surge' },
    { label: '2024', event: 'Central Bank Bullion Record' },
    { label: 'Now', event: 'Live 2000 → Today Spot' }
  ],
  Y2008: [
    { label: '2008', event: '2008 GFC & Bitcoin Genesis Open' },
    { label: '2012', event: 'First BTC Halving Cycle' },
    { label: '2016', event: 'Second BTC Halving Era' },
    { label: '2020', event: 'Third Halving & QE Surge' },
    { label: '2022', event: 'QT Tightening Stress Test' },
    { label: '2024', event: 'Fourth Halving & Bullion Breakout' },
    { label: 'Now', event: 'Live 2008 → Today Spot' }
  ],
  Y2016: [
    { label: '2016', event: '2016 Sequential PoW & DAO Era Open' },
    { label: '2017', event: 'SegWit & Cycle Peak' },
    { label: '2019', event: 'RandomX & Hashrate Expansion' },
    { label: '2021', event: 'Liquidity Cycle Highs' },
    { label: '2022', event: 'ETH Merge (PoW → PoS)' },
    { label: '2024', event: 'Spot ETF & Bullion Surge' },
    { label: 'Now', event: 'Live 2016 → Today Spot' }
  ],
  Y2020: [
    { label: '2020', event: '2020 DeFi & PoS Launch Era Open' },
    { label: '2021', event: 'Zero-Rate Liquidity Peak' },
    { label: '2022', event: 'FTX / LUNA Unwind & ETH Merge' },
    { label: '2023', event: 'VC Cliff Unlock Pressure' },
    { label: '2024', event: 'Halving & Hard-Asset Divergence' },
    { label: '2025', event: 'PoW + Gold Outperformance' },
    { label: 'Now', event: 'Live 2020 → Today Spot' }
  ],
  Y2024: [
    { label: '2024', event: '2024 Post-Merge & 1-BPS Era Open' },
    { label: "May '24", event: 'Post-Halving Repricing' },
    { label: "Nov '24", event: 'M2 Re-Expansion Bid' },
    { label: "May '25", event: 'Crescendo 10 BPS & Bullion Surge' },
    { label: "Nov '25", event: 'PoS Supply Dilution Test' },
    { label: "May '26", event: 'Hard-Asset Leadership' },
    { label: 'Now', event: 'Live 2024 → Today Spot' }
  ]
};

export function buildHistoricalTimelineCohortTrajectory(
  mode: GainsHistoricalStopKey,
  summary: Pick<
    CohortAggregateSummary,
    'passCycleAvg' | 'passExOutlierAvg' | 'failCycleAvg' | 'failExOutlierAvg'
  >,
  hasFailedAssets = true
): MacroTrajectoryPoint[] {
  const defs = HISTORICAL_TIMELINE_CHECKPOINTS[mode];
  const targetPass = Math.max(0.05, 1 + summary.passCycleAvg / 100);
  const targetPassEx = Math.max(0.05, 1 + summary.passExOutlierAvg / 100);
  const targetFail = hasFailedAssets ? Math.max(0.05, 1 + summary.failCycleAvg / 100) : 1.0;
  const targetFailEx = hasFailedAssets ? Math.max(0.05, 1 + summary.failExOutlierAvg / 100) : 1.0;

  const interpolate = (target: number, t: number, waveOffset: number) => {
    if (t <= 0) return 1.0;
    if (t >= 1) return target;
    if (target >= 8) {
      // Geometric interpolation for multi-decade / exponential PoW trajectories
      return Math.max(0.05, Math.pow(target, t) * (1 + waveOffset));
    }
    return Math.max(0.05, 1 + (target - 1) * t + waveOffset);
  };

  return defs.map((def, idx) => {
    const t = idx / Math.max(1, defs.length - 1);
    const wave = idx === 0 || idx === defs.length - 1 ? 0 : Math.sin(t * Math.PI * 1.5) * 0.04;
    return {
      label: def.label,
      event: def.event,
      passAll: interpolate(targetPass, t, wave),
      passEx: interpolate(targetPassEx, t, wave * 0.7),
      failAll: hasFailedAssets ? interpolate(targetFail, t, -wave * 0.7) : 1.0,
      failEx: hasFailedAssets ? interpolate(targetFailEx, t, -wave * 0.85) : 1.0
    };
  });
}

export function formatMultipleCompact(mult: number): string {
  if (!Number.isFinite(mult) || mult <= 0) return '—';
  if (mult >= 1_000_000) return `${(mult / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}Mx`;
  if (mult >= 1000) return `${(mult / 1000).toFixed(1).replace(/\.0$/, '')}Kx`;
  if (mult >= 100) return `${Math.round(mult).toLocaleString()}x`;
  if (mult >= 10) return `${mult.toFixed(1)}x`;
  if (mult >= 0.01) return `${mult.toFixed(2)}x`;
  if (mult < 0.0001) return '<0.0001x';
  return `${mult.toFixed(4)}x`;
}

export function formatSimOutcomeUsd(val: number): string {
  if (!Number.isFinite(val) || val < 0) return '—';
  if (val === 0) return '$0';
  if (val >= 1_000_000_000_000) {
    return `$${(val / 1_000_000_000_000).toFixed(2).replace(/\.?0+$/, '')}T`;
  }
  if (val >= 1_000_000_000) {
    return `$${(val / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '')}B`;
  }
  if (val >= 1_000_000) {
    return `$${(val / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  }
  if (val >= 10_000) {
    return `$${(val / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  if (val >= 1) {
    return `$${Math.round(val).toLocaleString()}`;
  }
  if (val >= 0.1) {
    return `$${val.toFixed(2)}`;
  }
  if (val >= 0.01) {
    return `$${val.toFixed(3)}`;
  }
  if (val >= 0.0001) {
    return `$${val.toFixed(4)}`;
  }
  return '<$0.0001';
}

