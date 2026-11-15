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
  snapshotSpot: number | null;
  tactical90dPct: number | null;
  liquidCycle: boolean;
  isOutlier: boolean;
  coinbasePair: string | null;
  geckoId: string | null;
  note: string;
}

export type CohortGainAsset = CohortAssetEntry;

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

export const FAILED_COHORT_GAINS: CohortAssetEntry[] = [
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

  const baseNum =
    raw.basePrice === null || raw.basePrice === undefined || raw.basePrice === ('' as unknown)
      ? null
      : Number(raw.basePrice);
  const spotNum =
    raw.snapshotSpot === null ||
    raw.snapshotSpot === undefined ||
    raw.snapshotSpot === ('' as unknown)
      ? null
      : Number(raw.snapshotSpot);
  const tacticalNum =
    raw.tactical90dPct === null ||
    raw.tactical90dPct === undefined ||
    raw.tactical90dPct === ('' as unknown)
      ? null
      : Number(raw.tactical90dPct);

  const safeBase = baseNum !== null && Number.isFinite(baseNum) && baseNum > 0 ? baseNum : null;
  const safeSpot = spotNum !== null && Number.isFinite(spotNum) && spotNum > 0 ? spotNum : null;
  const liquidCycle =
    raw.liquidCycle !== undefined
      ? Boolean(raw.liquidCycle) && safeBase !== null && safeSpot !== null
      : safeBase !== null && safeSpot !== null;

  const baselineLabel =
    String(raw.baselineLabel || '').trim().slice(0, 48) ||
    (safeBase !== null ? formatUsdPrice(safeBase) : 'Carrier / Unpriced');

  return {
    ticker,
    name: String(raw.name || ticker).trim().slice(0, 80) || ticker,
    grade,
    auditScore,
    baselineLabel,
    basePrice: safeBase,
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

export function applySpotPricesToCohortRecord(
  record: GainsCohortRecord,
  spotMap: Record<string, number>,
  sourceLabel = 'Live Spot Sync (Saved)'
): { nextRecord: GainsCohortRecord; updatedTickers: string[] } {
  const updatedTickers: string[] = [];
  const updateItem = (item: CohortAssetEntry): CohortAssetEntry => {
    const live = Number(spotMap[item.ticker]);
    if (!Number.isFinite(live) || live <= 0) return item;
    updatedTickers.push(item.ticker);
    return {
      ...item,
      snapshotSpot: live,
      liquidCycle: item.basePrice !== null && item.basePrice > 0
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
  passExKasAvg: number;
  failCycleAvg: number;
  failExOutlierAvg: number;
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

  const passedExOutliers = safePass.filter((i) => !i.isOutlier);
  const passExKasAvg = useCanonicalSnapshotNumbers
    ? 165.4
    : avgOf((passedExOutliers.length > 0 ? passedExOutliers : safePass).map((i) => i.cyclePct || 0));

  const failCycleAvg = useCanonicalSnapshotNumbers
    ? 59.4
    : avgOf(safeFail.map((i) => i.cyclePct || 0));

  const failedExOutliers = safeFail.filter(
    (i) => !i.isOutlier && i.ticker !== 'TAO' && i.ticker !== 'XRP'
  );
  const failExOutlierAvg = useCanonicalSnapshotNumbers
    ? -11.7
    : avgOf((failedExOutliers.length > 0 ? failedExOutliers : safeFail).map((i) => i.cyclePct || 0));

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
  const failExCount = Math.max(1, failedExOutliers.length || Math.max(1, safeFail.length - 1));

  const passExEndDollars = useCanonicalSnapshotNumbers
    ? Math.round(passedExOutliers.length * allocPerAsset * (1 + passExKasAvg / 100))
    : Math.round(
        (passedExOutliers.length > 0 ? passedExOutliers : safePass).reduce(
          (sum, i) => sum + allocPerAsset * Math.max(0, i.multiple ?? 1 + (i.cyclePct || 0) / 100),
          0
        ) || passExCount * allocPerAsset * (1 + passExKasAvg / 100)
      );

  const failExEndDollars = useCanonicalSnapshotNumbers
    ? Math.round((safeFail.length - 1) * allocPerAsset * (1 + failExOutlierAvg / 100))
    : Math.round(
        (failedExOutliers.length > 0 ? failedExOutliers : safeFail).reduce(
          (sum, i) => sum + allocPerAsset * Math.max(0, i.multiple ?? 1 + (i.cyclePct || 0) / 100),
          0
        ) || failExCount * allocPerAsset * (1 + failExOutlierAvg / 100)
      );

  const portfolioVictoryMultiple =
    failEndDollars > 0 ? (passEndDollars / failEndDollars).toFixed(1) : '12.0';

  return {
    passCycleAvg,
    passExKasAvg,
    failCycleAvg,
    failExOutlierAvg,
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
    snapshotSpot: null,
    tactical90dPct: null,
    liquidCycle: false,
    isOutlier: false,
    coinbasePair: null,
    geckoId: 'pi-network',
    note: 'Centralized stellar-core fork • 100B 0-Joule mint • Mandatory KYC/KYB'
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
    const snapshotSpot = persisted?.snapshotSpot ?? catalog?.snapshotSpot ?? null;
    const tactical90dPct = persisted?.tactical90dPct ?? catalog?.tactical90dPct ?? null;
    const liquidCycle = Boolean(
      (persisted?.liquidCycle ?? catalog?.liquidCycle ?? false) &&
        basePrice !== null &&
        basePrice > 0 &&
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
          `${a.ticker}:${a.grade}:${a.auditScore}:${a.snapshotSpot ?? ''}:${a.basePrice ?? ''}`
      )
      .join('|');
  return `${serializeSide(record.passed)}=>${serializeSide(record.failed)}`;
}


