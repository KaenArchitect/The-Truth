import {
  type AuditData,
  type ConsensusFamily,
  type HistoricalSnapshot,
  type InvariantData,
  DEFAULT_SHORT_NAMES,
  DEFAULT_TITLES,
  buildCanonicalGeniusParagraphs,
  deriveGradeFromTotal,
  evaluateThermodynamicGate,
  mergeHistoricalSnapshots
} from './rubricSpec.ts';
import { PRELOADED_AUDITS } from './preloadedAudits.ts';

export type GlobalTimelineYear =
  | '1913'
  | '1971'
  | '2000'
  | '2008'
  | '2016'
  | '2020'
  | '2024'
  | 'PRESENT';

export interface GlobalTimelineStop {
  id: GlobalTimelineYear;
  numericYear: number;
  buttonLabel: string;
  epochTitle: string;
  frontierSummary: string;
  significance: string;
}

export const GLOBAL_TIMELINE_STOPS: readonly GlobalTimelineStop[] = [
  {
    id: '1913',
    numericYear: 1913,
    buttonLabel: '1913',
    epochTitle: 'Pre-Federal Reserve Classical Gold Standard',
    frontierSummary: '1913 Fed Act Inflection · $20.67/oz Gold Specie · XAU 4.55 (B+) · USD (D)',
    significance:
      'Prior to the December 23, 1913 Federal Reserve Act chartering a 40% fractional-reserve central bank, commerce ran on cosmic bearer bullion (XAU, XAG) and $20.67/oz Gold Certificates redeemable on demand for physical gold coin—keeping USD anchored above E = 0 at Grade D (1.80).'
  },
  {
    id: '1971',
    numericYear: 1971,
    buttonLabel: '1971',
    epochTitle: 'Bretton Woods Collapse & Gold Severance',
    frontierSummary: 'Aug 15 Nixon Shock · Terminal $35/oz Window · XAU 4.45 (B+) · USD (D-)',
    significance:
      'Entering 1971, citizens remained barred from gold since 1933 while foreign central banks drained Fort Knox below $10B at $35/oz—compressing USD to a terminal 1.10 (Grade D-) right before Nixon slammed the gold window shut on August 15, 1971 and severed fiat to E = 0.'
  },
  {
    id: '2000',
    numericYear: 2000,
    buttonLabel: '2000',
    epochTitle: 'Post-Bretton Woods Unbacked Fiat Era',
    frontierSummary: 'After 1971 Gold Severance · Unbacked Fiat (USD = F · VOID) · XAU 4.40 (B+)',
    significance:
      'Following the August 15, 1971 Bretton Woods gold severance, global sovereign currencies (USD, EUR) operated at strictly 0.00 Joules of physical backing—locking USD in Failed (Grade F · VOID) while Physical Gold (XAU) and Silver (XAG) stood alone as Earth’s non-digital E > 0 anchors.'
  },
  {
    id: '2008',
    numericYear: 2008,
    buttonLabel: '2008',
    epochTitle: 'Banking Crisis & The Birth of Bitcoin',
    frontierSummary: 'Oct 31, 2008 Satoshi Whitepaper · Digital PoW Genesis · BTC 6.00 (A+) · USD (F)',
    significance:
      'As zero-joule fractional-reserve bank credit imploded in 2008 and central banks printed trillions in bailouts, Satoshi Nakamoto published the Bitcoin Whitepaper—solving digital scarcity via SHA-256d Proof-of-Work (E > 0) and birthing BTC at 6.00 / 6.00 (Grade A+) as the sole digital E > 0 monetary protocol on Earth.'
  },
  {
    id: '2016',
    numericYear: 2016,
    buttonLabel: '2016',
    epochTitle: 'Sequential PoW & DAO Bailout Era',
    frontierSummary: 'Sequential PoW Frontier · Post-DAO ETH PoW (D+) · BTC 5.25 (A-)',
    significance:
      'Before parallel BlockDAGs, UTXO covenants, or Wall Street Spot ETFs existed, Bitcoin led at 5.25 (A-). Ethereum still burned real Ethash GPU joules (E > 0), keeping ETH in Passed at D+ (1.80) under its 72M premine and Block 1,920,000 DAO bailout cap.'
  },
  {
    id: '2020',
    numericYear: 2020,
    buttonLabel: '2020',
    epochTitle: 'DeFi Congestion & Pre-BlockDAG Era',
    frontierSummary: 'DeFi & VC PoS Wave · Pre-Merge ETH PoW (D+) · BTC 5.00 (A-)',
    significance:
      '1 MB base-layer fee spikes and DeFi gas auctions tested sequential PoW chains as VC-backed Proof-of-Stake networks (SOL, ADA, AVAX, NEAR, ALGO) launched at E = 0 (Grade F). Pre-Merge Ethereum remained Proof-of-Work in Passed at D+ (1.65).'
  },
  {
    id: '2024',
    numericYear: 2024,
    buttonLabel: '2024',
    epochTitle: 'Post-Merge PoS & 1-BPS BlockDAG Era',
    frontierSummary: '1-BPS BlockDAG + CashTokens Era · Post-Merge ETH (F) · KAS 5.75 (A)',
    significance:
      'Ethereum’s EIP-3675 Merge eliminated mining work (E = 0), collapsing ETH into Failed (Grade F · VOID). Kaspa’s fair-launched 1-BPS GHOSTDAG took #1 at 5.75 (A), while Bitcoin Cash held the 1.00 State Topology frontier via native CashTokens covenants.'
  },
  {
    id: 'PRESENT',
    numericYear: 2026,
    buttonLabel: 'Present',
    epochTitle: 'Live 10-BPS Crescendo & Covenant Frontier',
    frontierSummary: 'Live 10-BPS Crescendo + Toccata Covenant Frontier · KAS 6.00 (A+)',
    significance:
      'Kaspa’s 10-BPS Crescendo Rust engine (100ms blocks) and Toccata native L1 covenants establish the live 6.00 / 6.00 (A+) Pareto frontier, recalibrating slower sequential PoW, ETF-custodied, and upper-layer carrier protocols against real-time physics.'
  }
] as const;

export function parseGlobalTimelineYear(raw: string | null | undefined): GlobalTimelineYear {
  const cleaned = String(raw || '')
    .trim()
    .toUpperCase();
  if (cleaned === '1913' || cleaned === '1920') return '1913';
  if (cleaned === '1971' || cleaned === '1960') return '1971';
  if (cleaned === '2000') return '2000';
  if (cleaned === '2008') return '2008';
  if (cleaned === '2016') return '2016';
  if (cleaned === '2020') return '2020';
  if (cleaned === '2024') return '2024';
  return 'PRESENT';
}

export function getGlobalTimelineStopIndex(year: GlobalTimelineYear): number {
  const idx = GLOBAL_TIMELINE_STOPS.findIndex((s) => s.id === year);
  return idx >= 0 ? idx : GLOBAL_TIMELINE_STOPS.length - 1;
}

export function getGlobalTimelineStop(year: GlobalTimelineYear): GlobalTimelineStop {
  return GLOBAL_TIMELINE_STOPS[getGlobalTimelineStopIndex(year)];
}

/**
 * Verified historical mainnet / physical commodity / sovereign currency genesis years.
 * Assets with genesisYear > stop.numericYear did not exist yet at that historical stop.
 */
const KNOWN_ASSET_GENESIS_YEARS: Record<string, number> = {
  // Cosmic physical elements & historical sovereign currencies
  XAU: 0,
  GOLD: 0,
  XAG: 0,
  SILVER: 0,
  XPT: 0,
  XPD: 0,
  CU: 0,
  COPPER: 0,
  TI: 0,
  U3O8: 0,
  GBP: 1694,
  USD: 1792,
  CHF: 1850,
  CAD: 1858,
  JPY: 1871,
  INR: 1935,
  CNY: 1948,
  AUD: 1966,
  RUB: 1992,
  EUR: 1999,

  // 2008: Birth of Bitcoin (Oct 31, 2008 Satoshi Whitepaper / Genesis Release)
  BTC: 2008,

  // 2011–2016 Mainnet Cohort
  NMC: 2011,
  LTC: 2011,
  PPC: 2012,
  XRP: 2012,
  DOGE: 2013,
  DGB: 2014,
  DASH: 2014,
  XMR: 2014,
  XLM: 2014,
  USDT: 2014,
  XEM: 2015,
  ETH: 2015,
  DCR: 2016,
  ETC: 2016,
  ZEC: 2016,
  WAVES: 2016,

  // 2017–2020 Mainnet Cohort
  BCH: 2017,
  ADA: 2017,
  TRX: 2017,
  BNB: 2017,
  LINK: 2017,
  FIL_ICO: 2017,
  EOS: 2018,
  XTZ: 2018,
  BSV: 2018,
  RVN: 2018,
  LN: 2018,
  QNT: 2018,
  USDC: 2018,
  WBTC: 2019,
  ATOM: 2019,
  ALGO: 2019,
  HBAR: 2019,
  ERG: 2019,
  STX: 2019,
  SOL: 2020,
  DOT: 2020,
  AVAX: 2020,
  NEAR: 2020,
  FIL: 2020,
  UNI: 2020,
  AAVE: 2020,
  SHIB: 2020,
  FLOW: 2020,
  EGLD: 2020,
  INJ: 2020,

  // 2021–2024 Mainnet Cohort
  KAS: 2021,
  ICP: 2021,
  TON: 2021,
  PI: 2021,
  MINA: 2021,
  ALPH: 2021,
  FLR: 2022,
  APT: 2022,
  OP: 2022,
  NEXA: 2022,
  RXD: 2022,
  SUI: 2023,
  ARB: 2023,
  TIA: 2023,
  SEI: 2023,
  TAO: 2023,
  ZEPH: 2023,
  GEEK: 2024,
  NACHO: 2024,
  KANGO: 2024,
  WLF: 2024,

  // 2025–2026 Mainnet Cohort
  QUAI: 2025,
  IGRA: 2025,
  MONAD: 2025,
  BERA: 2025
};

export function resolveAssetGenesisYear(ticker: string, audit?: AuditData | null): number {
  const clean = String(ticker || audit?.ticker || '')
    .trim()
    .toUpperCase();
  if (clean && KNOWN_ASSET_GENESIS_YEARS[clean] !== undefined) {
    return KNOWN_ASSET_GENESIS_YEARS[clean];
  }
  if (audit?.consensusFamily === 'PHYSICAL_COMMODITY') {
    return 0;
  }
  if (audit) {
    const corpus = `${audit.conclusion || ''} ${audit.invariants?.[0]?.paragraph || ''} ${
      audit.invariants?.[0]?.geniusParagraph || ''
    } ${audit.invariants?.[0]?.telemetry || ''}`;
    const launchMatch = corpus.match(
      /\b(?:launched|genesis|mainnet|forked|created|founded|minted|chartered)\b[^.]{0,48}?\b(1[789]\d{2}|200[0-9]|201[0-9]|202[0-6])\b/i
    );
    if (launchMatch) {
      return Number(launchMatch[1]);
    }
    const anyYearMatches = corpus.match(/\b(200[89]|201[0-9]|202[0-6])\b/g);
    if (anyYearMatches && anyYearMatches.length > 0) {
      const years = anyYearMatches.map((y) => Number(y)).filter((n) => n >= 2008 && n <= 2026);
      if (years.length > 0) {
        return Math.min(...years);
      }
    }
  }
  return 2025;
}

export function resolveEarliestTimelineStopForAsset(
  ticker: string,
  audit?: AuditData | null
): GlobalTimelineYear {
  const genesisYear = resolveAssetGenesisYear(ticker, audit);
  if (genesisYear <= 1913) return '1913';
  if (genesisYear <= 1971) return '1971';
  if (genesisYear <= 2000) return '2000';
  if (genesisYear <= 2008) return '2008';
  if (genesisYear <= 2016) return '2016';
  if (genesisYear <= 2020) return '2020';
  if (genesisYear <= 2024) return '2024';
  return 'PRESENT';
}

interface HistoricalYearOverrideSpec {
  architecture?: string;
  consensusFamily?: ConsensusFamily;
  gradeOverride?: string;
  conclusion: string;
  scores: [number, number, number, number, number, number];
  frontierRefs?: Partial<Record<'01' | '02' | '03' | '04' | '05' | '06', string>>;
  telemetry?: Partial<Record<'01' | '02' | '03' | '04' | '05' | '06', string>>;
  quickSummaries?: Partial<Record<'01' | '02' | '03' | '04' | '05' | '06', string>>;
  normieNotes?: Partial<Record<'01' | '02' | '03' | '04' | '05' | '06', string>>;
  geniusNotes?: Partial<Record<'01' | '02' | '03' | '04' | '05' | '06', string>>;
  receipts?: Partial<Record<'01' | '02' | '03' | '04' | '05' | '06', string[]>>;
}

type HistoricalYearKey = '1913' | '1971' | '2000' | '2008' | '2016' | '2020' | '2024';

const HISTORICAL_ASSET_OVERRIDES: Record<
  HistoricalYearKey,
  Partial<Record<string, HistoricalYearOverrideSpec>>
> = {
  '1913': {
    XAU: {
      architecture: 'Cosmic r-Process Atomic Bullion (Au-79 • 1913 Pre-Fed Classical Gold Standard)',
      conclusion:
        'In 1913—at the culmination of the Classical Gold Standard prior to Federal Reserve elastic note expansion, 1933 domestic confiscation, or digital Proof-of-Work—Physical Gold stood as the undisputed #1 monetary anchor on Earth at 4.55 / 6.00 (Grade B+).',
      scores: [1.0, 0.95, 0.9, 0.75, 0.7, 0.25],
      frontierRefs: {
        '05': 'Direct $20 Saint-Gaudens Bearer Coinage (Pre-Fed 1913)',
        '06': '1913 Armored Rail & Steamship Specie Clearing'
      },
      telemetry: {
        '04': '100% offline bearer coinage prior to 1914 WWI gold embargoes and 1933 Executive Order 6102 domestic seizure.',
        '05': 'Circulated directly as $10/$20 US gold coins alongside 100%-backed Gold Certificates prior to Federal Reserve fractional notes and 1971 COMEX paper leverage.',
        '06': 'Fastest irreversible E > 0 settlement medium on Earth in 1913, yet still bound by armored railcar and steamship inertia.'
      },
      normieNotes: {
        '04': 'In 1913, before the Federal Reserve and 1933 gold confiscation, citizens freely carried physical gold coins for offline trade, though cross-ocean settlement stopped at naval blockades.',
        '05': 'Before central-bank fractional notes, 100:1 LBMA paper gold, and ETFs existed, gold circulated directly as everyday $20 coins—losing points only to physical weight and vaulting.',
        '06': 'With zero digital networks in 1913, armored trains and ocean liners were the fastest way on Earth to move real energetic money.'
      }
    },
    XAG: {
      architecture: 'Cosmic Supernova Bullion (Ag-47 • 1913 Morgan/Barber Silver Coinage Era)',
      conclusion:
        'In 1913, circulating directly in everyday pockets as 90%-silver Morgan and Barber coinage alongside 1-to-1 Silver Certificates, Physical Silver scored 4.10 / 6.00 (Grade B).',
      scores: [1.0, 0.85, 0.85, 0.65, 0.55, 0.2],
      frontierRefs: {
        '05': '1913 Circulating Silver Dollar & Certificate Coinage',
        '06': '1913 Physical Bullion Freight Benchmark'
      },
      normieNotes: {
        '05': 'In 1913, 90%-silver coins and 1-to-1 Silver Certificates served as everyday pocket money before 1965 base-metal clad coinage and COMEX paper futures took over.'
      }
    },
    CHF: {
      architecture: 'Latin Monetary Union / Swiss National Bank Gold-Backed Franc (1913)',
      consensusFamily: 'ENERGY_ARBITRAGED_POW',
      gradeOverride: 'D',
      conclusion:
        'In 1913, redeemable for gold coin under Latin Monetary Union specie parity at the Swiss National Bank, the Swiss Franc operated as an energy-arbitraged gold certificate overlay at 1.75 / 6.00 (Grade D).',
      scores: [0.0, 0.35, 0.5, 0.45, 0.3, 0.15]
    },
    GBP: {
      architecture: 'Classical Gold Sovereign Standard Pound Sterling (1913 Pre-WWI Apex)',
      consensusFamily: 'ENERGY_ARBITRAGED_POW',
      gradeOverride: 'D',
      conclusion:
        'In 1913—one year before Britain suspended citizen gold Sovereign redemptions at the outbreak of WWI in August 1914—Pound Sterling operated as a gold-redeemable Bank of England note overlay at 1.75 / 6.00 (Grade D).',
      scores: [0.0, 0.35, 0.5, 0.45, 0.3, 0.15]
    }
  },
  '1971': {
    XAU: {
      architecture: 'Cosmic r-Process Atomic Bullion (Au-79 • 1971 Bretton Woods Rupture)',
      conclusion:
        'In 1971—as European central banks redeemed dying $35/oz paper dollars for physical bullion and forced Nixon’s August 15 gold severance—Physical Gold proved its cosmic sovereignty at 4.45 / 6.00 (Grade B+).',
      scores: [1.0, 0.95, 0.9, 0.7, 0.68, 0.22],
      frontierRefs: {
        '05': '1971 Sovereign Bullion Repatriation (Pre-COMEX Futures Launch)',
        '06': '1971 Naval & Cargo Jet Bullion Settlement'
      },
      telemetry: {
        '04': 'Domestic US citizen ownership still barred under EO 6102 (until Dec 1974), while European central banks airlifted and shipped physical bars out of NY Fed.',
        '05': 'Post-1968 London Gold Pool collapse exposed paper $35/oz suppression right before COMEX gold futures launched in 1974.'
      },
      normieNotes: {
        '04': 'Even while US citizens were still barred from holding bullion under 1933 rules, European central banks rushed to pull physical gold out of New York in 1971.',
        '05': 'In 1971, physical bullion demand broke the $35/oz Bretton Woods paper cap—proving vaulted metal always outlasts unbacked paper promises.'
      }
    },
    XAG: {
      architecture: 'Cosmic Supernova Bullion (Ag-47 • 1971 Post-Coinage-Act Bullion Transition)',
      conclusion:
        'In 1971—after the 1965 Coinage Act and 1968 termination of US Silver Certificate redemptions drove Gresham’s Law hoarding of pre-1965 90% silver—Physical Silver scored 4.00 / 6.00 (Grade B-).',
      scores: [1.0, 0.85, 0.85, 0.62, 0.5, 0.18],
      normieNotes: {
        '05': 'By 1971, citizens had hoarded nearly every pre-1965 90% silver coin out of circulation under Gresham’s Law after Washington replaced silver coinage with copper-nickel tokens.'
      }
    },
    CHF: {
      architecture: 'Swiss National Bank Constitutional 40% Gold-Backed Franc (1971)',
      consensusFamily: 'ENERGY_ARBITRAGED_POW',
      gradeOverride: 'D',
      conclusion:
        'In 1971, backed by Switzerland’s constitutional 40% physical gold reserve mandate (and actively redeeming US Dollars for Treasury gold ahead of Aug 15), the Swiss Franc scored 1.50 / 6.00 (Grade D).',
      scores: [0.0, 0.3, 0.45, 0.4, 0.25, 0.1]
    },
    GBP: {
      architecture: 'Bretton Woods $2.40 Devalued Pound Sterling (1971 Terminal Peg)',
      consensusFamily: 'ENERGY_ARBITRAGED_POW',
      gradeOverride: 'D-',
      conclusion:
        'In 1971, following its 1967 devaluation to $2.40 and Britain’s August 1971 request for US gold cover right before Nixon closed the window, Pound Sterling scored 1.05 / 6.00 (Grade D-).',
      scores: [0.0, 0.15, 0.25, 0.35, 0.2, 0.1]
    }
  },
  '2000': {
    XAU: {
      architecture: 'Cosmic r-Process Atomic Bullion (Au-79 • 2000 Post-Bretton Woods Sole Anchor)',
      conclusion:
        'In 2000—twenty-nine years after the 1971 Bretton Woods severance unanchored every fiat currency on Earth and eight years before Bitcoin—Physical Gold stood alone at #1 with 4.40 / 6.00 (Grade B+).',
      scores: [1.0, 0.95, 0.9, 0.7, 0.65, 0.2],
      frontierRefs: {
        '05': 'Allocated Physical Bullion (Post-1974 Citizen Re-Legalization)',
        '06': 'Pre-Bitcoin Physical Bullion Settlement Ceiling (2000)'
      },
      normieNotes: {
        '01': 'In 2000, with every government currency on Earth completely unbacked since 1971 and Bitcoin not yet invented, Physical Gold was humanity’s sole sovereign monetary standard.',
        '06': 'Before Satoshi invented Proof-of-Work in 2008, no E > 0 digital money existed—leaving armored bullion flights as the only non-fiat settlement rail.'
      }
    },
    XAG: {
      architecture: 'Cosmic Supernova Bullion (Ag-47 • 2000 Post-Bretton Woods Benchmark)',
      conclusion:
        'In 2000, alongside Gold in a world of 100% unbacked post-Bretton Woods fiat currencies, Physical Silver scored 3.95 / 6.00 (Grade B-).',
      scores: [1.0, 0.85, 0.85, 0.6, 0.48, 0.17]
    }
  },
  '2008': {
    XAU: {
      architecture: 'Cosmic r-Process Atomic Bullion (Au-79 • 2008 GFC Safe-Haven Benchmark)',
      conclusion:
        'During the 2008 Global Financial Crisis—as zero-joule bank credit imploded and Satoshi Nakamoto unveiled digital Proof-of-Work—Physical Gold scored 4.38 / 6.00 (Grade B), newly surpassed on digital velocity by Bitcoin.',
      scores: [1.0, 0.95, 0.88, 0.7, 0.65, 0.2],
      frontierRefs: {
        '06': 'BTC 600s Proof-of-Work Genesis (Oct 2008 Breakthrough)'
      },
      normieNotes: {
        '06': 'In late 2008, Bitcoin’s Proof-of-Work breakthrough dematerialized energetic scarcity onto the internet for the first time—exposing physical gold’s cargo-shipping bottleneck.'
      }
    },
    XAG: {
      architecture: 'Cosmic Supernova Bullion (Ag-47 • 2008 GFC Benchmark)',
      conclusion:
        'In 2008, providing zero-counterparty physical refuge during the global banking crisis while trailing newly born digital Proof-of-Work velocity, Physical Silver scored 3.92 / 6.00 (Grade B-).',
      scores: [1.0, 0.85, 0.85, 0.6, 0.47, 0.15]
    }
  },
  '2016': {
    BTC: {
      architecture: 'SHA-256d Sequential PoW • Pre-SegWit / Pre-ETF Era (2016 Frontier Leader)',
      conclusion:
        'In 2016—before parallel Proof-of-Work BlockDAGs, Layer-1 UTXO covenants, or Wall Street Spot ETFs existed—Bitcoin stood as the #1 sovereign monetary protocol on Earth at 5.25 / 6.00 (Grade A-).',
      scores: [0.95, 1.0, 1.0, 0.75, 0.9, 0.65],
      frontierRefs: {
        '04': 'Per-Block PoW DAA (DigiShield / CryptoNote)',
        '05': 'BTC Stateless UTXO (Pre-Covenant Era)',
        '06': '120s–150s Fair-Launch Sequential PoW (XMR / LTC)'
      },
      telemetry: {
        '01': '0 premine, 0 tax, 0 Wall Street ETF custody; mild Bitmain/AntPool/F2Pool ASIC pool concentration during Blocksize War.',
        '04': '2,016-block (~14-day) difficulty epoch trails per-block PoW retargeting under severe partition stress.',
        '05': 'Stateless UTXO cash model avoids Ethereum’s 2016 DAO reentrancy catastrophe; 1 MB blocks beginning to fill.',
        '06': '600s sequential PoW trails 120s–150s Scrypt/CryptoNight PoW chains prior to parallel BlockDAG invention.'
      },
      normieNotes: {
        '01': 'In 2016, Bitcoin had zero premine, zero VC coins, and zero Wall Street ETF custodians—losing 0.05 only to rising ASIC mining-pool concentration.',
        '04': 'Bitcoin stayed live across global splits without Proof-of-Stake halts, trailing only newer PoW coins that adjusted difficulty every block instead of every 2,016 blocks.',
        '05': 'While Ethereum’s shared smart-contract state suffered the 2016 DAO hack, Bitcoin’s stateless UTXO model remained rock-solid as blocks began approaching the 1 MB cap.',
        '06': 'Before 1-second or 100ms BlockDAGs existed, 10-minute Bitcoin blocks trailed only 2-to-2.5-minute sequential PoW peers like Monero and Litecoin.'
      }
    },
    LTC: {
      architecture: 'Scrypt ASIC Sequential PoW • 150s Fair-Launch Cash Rail (2016)',
      conclusion:
        'In 2016, Litecoin’s fair-launched 2.5-minute Scrypt Proof-of-Work chain scored 4.95 / 6.00 (Grade A-)—delivering 4x faster on-chain confirmation than Bitcoin with sub-cent UTXO fees before parallel BlockDAGs existed.',
      scores: [0.9, 0.95, 0.95, 0.55, 0.85, 0.75],
      frontierRefs: {
        '06': 'Fast Fair-Launch Sequential PoW Frontier (2016)'
      },
      telemetry: {
        '03': 'Plaintext UTXO chain (~8 GB full ledger in 2016, prior to 2022 MWEB extension blocks).',
        '06': '150s Scrypt PoW confirmation runs 4x faster than Bitcoin with sub-cent cash fees.'
      },
      normieNotes: {
        '03': 'Before adding MWEB privacy extension blocks in 2022, Litecoin’s entire 2016 UTXO history fit in ~8 GB and verified cleanly from Genesis on any laptop.',
        '06': 'Against the 2016 Proof-of-Work field, 2.5-minute Litecoin blocks settled 4x faster than Bitcoin at sub-cent fees.'
      }
    },
    XAU: {
      architecture: 'Cosmic r-Process Atomic Bullion (Au-79 • 2016 Pre-BlockDAG Benchmark)',
      conclusion:
        'In 2016, Physical Gold scored 4.35 / 6.00 (Grade B)—combining immaculate cosmic sovereignty and thermodynamic extraction cost with zero digital wire velocity.',
      scores: [1.0, 0.9, 0.85, 0.7, 0.7, 0.2],
      frontierRefs: {
        '06': '2016 Sequential PoW Settlement (120s–600s)'
      }
    },
    XMR: {
      architecture: 'CryptoNight PoW • Ring Signatures + Per-Block DAA (2016)',
      conclusion:
        'In 2016, Monero scored 4.25 / 6.00 (Grade B)—pairing fair-launched CryptoNight Proof-of-Work and per-block difficulty adjustment with early ring-signature privacy.',
      scores: [0.9, 0.85, 0.8, 0.65, 0.45, 0.6],
      frontierRefs: {
        '04': 'Per-Block CryptoNote DAA',
        '06': '120s Sequential PoW Cadence'
      }
    },
    XAG: {
      architecture: 'Cosmic Supernova Bullion (Ag-47 • 2016 Pre-BlockDAG Benchmark)',
      conclusion:
        'In 2016, Physical Silver scored 3.90 / 6.00 (Grade C+)—anchored by cosmic genesis purity and industrial ore extraction energy, tempered by bulk physical settlement friction.',
      scores: [1.0, 0.8, 0.85, 0.6, 0.5, 0.15]
    },
    ZEC: {
      architecture: 'Equihash GPU PoW • Sprout Ceremony + 20% Founders’ Tax (Oct 2016 Launch)',
      gradeOverride: 'D',
      conclusion:
        'Launching October 28, 2016 with a mandatory 20% Founders’ Reward coinbase tax and trusted-setup Sprout circuit, Zcash triggered the Sovereignty-Compromise & Energy-Arbitrage cap from Block 0 (1.60 / 6.00, Grade D).',
      scores: [0.0, 0.25, 0.35, 0.55, 0.2, 0.25],
      telemetry: {
        '01': 'Mandatory 20% Founders’ Reward coinbase tax + Electric Coin Company trademark governance (0.00 Capped).',
        '02': 'Equihash GPU PoW diluted by mandatory zero-work insider coinbase extraction (clamped at 0.25).',
        '03': '6-party Sprout trusted-setup toxic-waste ceremony (containing dormant CVE-2019-7167 soundness flaw).'
      }
    }
  },
  '2020': {
    BTC: {
      architecture: 'SHA-256d Sequential PoW • SegWit Active / Pre-ETF Era (2020 Frontier Leader)',
      conclusion:
        'In 2020—prior to Wall Street ETFs and Kaspa’s parallel BlockDAG launch—Bitcoin led all monetary networks at 5.00 / 6.00 (Grade A-), even as 1 MB base-layer fee spikes pushed retail users toward custodial wallets and early Lightning hubs.',
      scores: [0.95, 1.0, 1.0, 0.7, 0.75, 0.6],
      frontierRefs: {
        '04': 'ASERT / Per-Block PoW DAA (2020)',
        '05': 'Stateless UTXO Base (1 MB Congestion Era)',
        '06': 'Fast Sequential PoW Frontier (Pre-BlockDAG 2020)'
      },
      telemetry: {
        '01': 'Immaculate L1 rules, 0 ETF custody in 2020; Chinese/global ASIC pool template concentration (>60% top 4 pools).',
        '05': 'SegWit UTXO base clean, but recurring $10–$30 mempool fee spikes push small transfers off Layer 1.',
        '06': '600s sequential PoW (~5–7 TPS) prior to November 2021 parallel BlockDAG launch.'
      }
    },
    LTC: {
      architecture: 'Scrypt Merge-Mined ASIC PoW • SegWit Cash Rail (2020)',
      conclusion:
        'In 2020, Litecoin scored 4.70 / 6.00 (Grade B+)—maintaining reliable Scrypt Proof-of-Work uptime and fast 150-second UTXO transfers ahead of MWEB activation and BlockDAG competition.',
      scores: [0.9, 0.9, 0.95, 0.5, 0.75, 0.7]
    },
    XAU: {
      architecture: 'Cosmic r-Process Atomic Bullion (Au-79 • 2020 Pandemic Flight Stress)',
      conclusion:
        'During 2020’s pandemic flight lockdowns, Physical Gold scored 4.30 / 6.00 (Grade B)—proving zero counterparty default risk while air-cargo bottlenecks widened physical-to-COMEX delivery spreads.',
      scores: [1.0, 0.9, 0.85, 0.7, 0.7, 0.15]
    },
    XMR: {
      architecture: 'RandomX CPU PoW • Bulletproofs + Dynamic Blocks (2020)',
      conclusion:
        'Following its November 2019 RandomX CPU Proof-of-Work upgrade and Bulletproofs range proofs, Monero scored 4.10 / 6.00 (Grade B) against the 2020 pre-BlockDAG frontier.',
      scores: [0.9, 0.85, 0.8, 0.6, 0.4, 0.55]
    },
    BCH: {
      architecture: 'SHA-256d Minority PoW • 32 MB UTXO + ASERT Per-Block DAA (2020)',
      conclusion:
        'By late 2020—after activating ASERT per-block difficulty adjustment and resolving the BSV/BCHN splits—Bitcoin Cash scored 4.05 / 6.00 (Grade B-) with sub-cent UTXO cash settlement on minority SHA-256 hashpower.',
      scores: [0.85, 0.65, 0.65, 0.55, 0.8, 0.55]
    },
    XAG: {
      architecture: 'Cosmic Supernova Bullion (Ag-47 • 2020 Pre-BlockDAG Benchmark)',
      conclusion:
        'In 2020, Physical Silver scored 3.85 / 6.00 (Grade C+)—combining immaculate elemental scarcity and mining energy cost with heavy physical transport friction.',
      scores: [1.0, 0.8, 0.85, 0.6, 0.48, 0.12]
    },
    LN: {
      architecture: 'Bitcoin HTLC Payment-Channel Mesh • Pre-Custodial Concentration Era (2020)',
      conclusion:
        'In 2020, two years after mainnet beta, Lightning Network scored 2.65 / 6.00 (Grade C-)—inheriting Bitcoin’s PoW carrier anchor while exhibiting interactive liquidity-routing and watchtower constraints.',
      scores: [0.65, 0.35, 0.55, 0.4, 0.35, 0.35]
    },
    ZEC: {
      architecture: 'Equihash PoW • Blossom 75s Cadence + Canopy Dev-Tax Renewal (2020)',
      gradeOverride: 'D',
      conclusion:
        'In 2020—following disclosure of the Sprout CVE-2019-7167 counterfeiting flaw and renewal of mandatory 20% coinbase dev-fund taxation via Canopy—Zcash scored 1.45 / 6.00 (Grade D).',
      scores: [0.0, 0.25, 0.3, 0.5, 0.2, 0.2]
    }
  },
  '2024': {
    BTC: {
      architecture: 'SHA-256d PoW • Post-Spot ETF Launch / Normalized vs 1-BPS BlockDAG (2024)',
      conclusion:
        'In 2024—following US Spot ETF concentration (~84% Coinbase Custody) and live 1-BPS Kaspa + BCH CashTokens mainnet proofs—Bitcoin recalibrated to 4.55 / 6.00 (Grade B+).',
      scores: [0.95, 1.0, 1.0, 0.5, 0.8, 0.3],
      frontierRefs: {
        '04': 'KAS 2,641-Block Sampled Per-Block DAA',
        '05': 'BCH CashTokens L1 UTXO Covenants (Block 792,772)',
        '06': 'KAS 1 BPS / 1,000ms GHOSTDAG (M = 1.0)'
      }
    },
    LTC: {
      architecture: 'Scrypt Merge-Mined ASIC PoW • MWEB Active / 1-BPS Normalized (2024)',
      conclusion:
        'In 2024, with MWEB extension blocks active and velocity normalized against 1-BPS GHOSTDAG, Litecoin scored 4.30 / 6.00 (Grade B).',
      scores: [0.9, 0.9, 0.85, 0.6, 0.7, 0.35]
    },
    XAU: {
      architecture: 'Cosmic r-Process Atomic Bullion (Au-79 • 2024 Central Bank Accumulation)',
      conclusion:
        'In 2024, amid record sovereign central-bank bullion accumulation and normalized against 1-BPS BlockDAG settlement, Physical Gold scored 4.15 / 6.00 (Grade B).',
      scores: [1.0, 0.9, 0.85, 0.65, 0.65, 0.1]
    },
    BCH: {
      architecture: 'SHA-256d Minority PoW • Live CashTokens L1 UTXO Covenants (2024)',
      conclusion:
        'In 2024—having shipped native Layer-1 CashTokens UTXO covenants at Block 792,772 ahead of Kaspa’s 2026 Toccata upgrade—Bitcoin Cash held the 1.00 State Topology Pareto frontier and scored 3.95 / 6.00 (Grade B-).',
      scores: [0.85, 0.6, 0.6, 0.5, 1.0, 0.4],
      frontierRefs: {
        '05': 'BCH CashTokens Native L1 UTXO Covenants (1.00 Apex in 2024)',
        '06': 'KAS 1 BPS / 1,000ms GHOSTDAG'
      },
      telemetry: {
        '05': '2024 PARETO APEX (1.00): Native CashTokens UTXO introspection & covenants live at Block 792,772 with zero shared-state locks.'
      },
      normieNotes: {
        '05': 'In 2024, Bitcoin Cash held a perfect 1.00 on State Topology because its May 2023 CashTokens upgrade delivered live, parallel Layer-1 UTXO smart contracts before Kaspa’s Toccata fork.'
      }
    },
    XAG: {
      architecture: 'Cosmic Supernova Bullion (Ag-47 • 2024 Benchmark)',
      conclusion:
        'In 2024, Physical Silver scored 3.70 / 6.00 (Grade C+)—backed by physical mining joules and zero issuer risk, constrained by physical vault/shipping latency.',
      scores: [1.0, 0.8, 0.85, 0.55, 0.42, 0.08]
    },
    XMR: {
      architecture: 'RandomX CPU PoW • 0.6 XMR Tail Emission / 1-BPS Normalized (2024)',
      conclusion:
        'In 2024, operating on perpetual 0.6 XMR tail emission and normalized against 1-BPS GHOSTDAG velocity, Monero scored 3.65 / 6.00 (Grade C+).',
      scores: [0.85, 0.85, 0.8, 0.5, 0.35, 0.3]
    },
    GEEK: {
      architecture: 'Kaspa KRC-20 Fair-Mint Inscription Overlay (1-BPS Carrier • 2024)',
      conclusion:
        'Launching via zero-premint KRC-20 inscriptions on 1-BPS Kaspa in June 2024, Geek Protocol scored 2.50 / 6.00 (Grade C-) under Carrier Subordination (M_overlay < M_L1).',
      scores: [0.65, 0.35, 0.55, 0.45, 0.25, 0.25]
    },
    LN: {
      architecture: 'Bitcoin Payment-Channel Overlay • Hub-and-Spoke Liquidity Era (2024)',
      conclusion:
        'By 2024, rising custodial wallet usage and hub-and-spoke channel concentration compressed Lightning Network to 2.45 / 6.00 (Grade C-).',
      scores: [0.55, 0.35, 0.55, 0.4, 0.3, 0.3]
    }
  }
};

function convertSnapshotToAuditData(
  baseAudit: AuditData,
  rawSnapshot: HistoricalSnapshot,
  yearLabel: string,
  consensusOverride?: ConsensusFamily,
  architectureOverride?: string
): AuditData {
  const snap = evaluateThermodynamicGate(rawSnapshot);
  const costScore = Number(snap.invariants['02']?.score ?? 0);
  const isZeroJoule = !snap.foundationalMassValid || costScore <= 0;

  const invariants: InvariantData[] = baseAudit.invariants.map((baseInv, idx) => {
    const id = baseInv.id || `0${idx + 1}`;
    const sInv = snap.invariants[id];
    const numericScore =
      !isZeroJoule && sInv && typeof sInv.score === 'number' ? Number(sInv.score) : 0;
    const status = isZeroJoule
      ? Number(id) >= 4
        ? 'VOID_UNANCHORED'
        : sInv?.status || 'VOID_UNANCHORED'
      : sInv?.status || 'ACTIVE';

    const normieParagraph = sInv?.normieParagraph || baseInv.paragraph;
    const baseGenius = sInv?.geniusParagraph || baseInv.geniusParagraph || baseInv.paragraph;
    const geniusParagraph =
      baseGenius.length > normieParagraph.length + 120
        ? baseGenius
        : `${baseGenius} [${yearLabel} Historical Audit Context (${snap.dateOrHeight} • Frontier: ${snap.frontierContext})]: ${snap.verdictSummary}`;

    return {
      ...baseInv,
      id,
      shortName: baseInv.shortName || DEFAULT_SHORT_NAMES[idx],
      title: sInv?.label || baseInv.title || DEFAULT_TITLES[idx],
      score: numericScore,
      status,
      frontierReference: sInv?.frontierReference || baseInv.frontierReference,
      telemetry: sInv?.telemetry || baseInv.telemetry,
      quickSummary: sInv?.normieParagraph || sInv?.telemetry || baseInv.quickSummary,
      paragraph: normieParagraph,
      geniusParagraph,
      receipts:
        Array.isArray(sInv?.receipts) && sInv.receipts.length > 0
          ? sInv.receipts
          : baseInv.receipts
    };
  });

  const projectedBase: AuditData = {
    ...baseAudit,
    auditedAtTimelineYear: yearLabel,
    consensusFamily:
      consensusOverride ||
      snap.consensusFamily ||
      (isZeroJoule ? 'ZERO_JOULE_BFT' : baseAudit.consensusFamily),
    architecture:
      architectureOverride ||
      snap.architecture ||
      `${snap.epochLabel} (${snap.dateOrHeight})`,
    grade: snap.terminalGrade,
    totalScore: isZeroJoule ? 0 : snap.totalScore,
    conclusion: snap.normieVerdictSummary || snap.verdictSummary || baseAudit.conclusion,
    invariants
  };

  const numericMaxYear = /^\d{4}$/.test(yearLabel) ? Number(yearLabel) : undefined;
  return {
    ...projectedBase,
    geniusParagraphs: buildCanonicalGeniusParagraphs(projectedBase, {
      maxYear: numericMaxYear
    })
  };
}

function applyYearOverrideSpec(
  baseAudit: AuditData,
  year: HistoricalYearKey,
  spec: HistoricalYearOverrideSpec
): AuditData {
  const sovScore = spec.scores[0];
  const rawCostScore = spec.scores[1];
  const isZeroJoule = rawCostScore <= 0;
  const clampedCostScore =
    !isZeroJoule && sovScore <= 0 ? Math.min(rawCostScore, 0.35) : rawCostScore;

  const finalScores: [number, number, number, number, number, number] = isZeroJoule
    ? [0, 0, 0, 0, 0, 0]
    : [
        spec.scores[0],
        clampedCostScore,
        spec.scores[2],
        spec.scores[3],
        spec.scores[4],
        spec.scores[5]
      ];

  const totalScore = isZeroJoule
    ? 0
    : Number(finalScores.reduce((acc, v) => acc + v, 0).toFixed(2));
  const grade =
    spec.gradeOverride ||
    deriveGradeFromTotal(totalScore, finalScores[1], finalScores[0]);

  const invariants: InvariantData[] = baseAudit.invariants.map((baseInv, idx) => {
    const id = (baseInv.id || `0${idx + 1}`) as '01' | '02' | '03' | '04' | '05' | '06';
    const score = finalScores[idx];
    const status = isZeroJoule
      ? idx >= 3
        ? 'VOID_UNANCHORED'
        : 'ACTIVE'
      : sovScore <= 0 && idx <= 1
      ? 'CAPPED_ARBITRAGE'
      : 'ACTIVE';

    const normieNote = spec.normieNotes?.[id];
    const normieParagraph = normieNote || baseInv.paragraph;
    const rawGenius =
      spec.geniusNotes?.[id] || baseInv.geniusParagraph || baseInv.paragraph;
    const geniusPrefix = `[${year} Mainnet Pareto-Frontier Calibration — Score ${score.toFixed(
      2
    )} / 1.00]: `;
    const candidateGenius = spec.geniusNotes?.[id]
      ? rawGenius
      : `${geniusPrefix}${spec.telemetry?.[id] ? `${spec.telemetry[id]} ` : ''}${rawGenius}`;
    const geniusParagraph =
      candidateGenius.length > normieParagraph.length + 130
        ? candidateGenius
        : `${candidateGenius} Under Dynamic Pareto-Frontier Normalization as of ${year}, ${baseAudit.name} (${baseAudit.ticker}) calibrated at ${totalScore.toFixed(2)} / 6.00 (Grade ${grade}).`;

    return {
      ...baseInv,
      score,
      status,
      frontierReference: spec.frontierRefs?.[id] ?? baseInv.frontierReference,
      telemetry: spec.telemetry?.[id] || baseInv.telemetry,
      quickSummary:
        normieNote || spec.quickSummaries?.[id] || spec.telemetry?.[id] || baseInv.quickSummary,
      paragraph: normieParagraph,
      geniusParagraph,
      receipts: spec.receipts?.[id] || baseInv.receipts
    };
  });

  const projectedBase: AuditData = {
    ...baseAudit,
    consensusFamily: spec.consensusFamily || baseAudit.consensusFamily,
    architecture: spec.architecture || `${baseAudit.architecture} (${year} State)`,
    grade,
    totalScore,
    conclusion: spec.conclusion,
    invariants
  };

  return {
    ...projectedBase,
    geniusParagraphs: buildCanonicalGeniusParagraphs(projectedBase, {
      maxYear: Number(year)
    })
  };
}

export function hasCuratedTimelineOverride(
  ticker: string,
  year: GlobalTimelineYear
): boolean {
  if (year === 'PRESENT') return true;
  const tk = String(ticker || '').toUpperCase();
  if (!tk) return false;
  if (tk === 'USD') return true;
  if (tk === 'BTC' && year === '2008') return true;
  if (tk === 'ETH' && (year === '2016' || year === '2020' || year === '2024')) return true;
  if (tk === 'KAS' && year === '2024') return true;
  return Boolean(HISTORICAL_ASSET_OVERRIDES[year]?.[tk]);
}

/**
 * Projects a single AuditData record to its historical physical state at `year`.
 * Returns `null` if the asset had not yet launched by `year`.
 */
export function projectAuditAtYear(
  audit: AuditData,
  year: GlobalTimelineYear
): AuditData | null {
  if (!audit) return null;
  if (year === 'PRESENT') return audit;

  const stop = getGlobalTimelineStop(year);
  const ticker = String(audit.ticker || '').toUpperCase();
  const genesisYear = resolveAssetGenesisYear(ticker, audit);
  if (genesisYear > stop.numericYear) {
    return null;
  }

  // 0. Dedicated year-scoped Time Machine snapshot (`tm-<year>`) pulled via Search / Update Intel
  const dedicatedEpochId = `tm-${year}`;
  const dedicatedSnap = Array.isArray(audit.historicalSnapshots)
    ? audit.historicalSnapshots.find((s) => s && s.epochId === dedicatedEpochId)
    : undefined;
  if (dedicatedSnap) {
    return convertSnapshotToAuditData(
      audit,
      dedicatedSnap,
      year,
      dedicatedSnap.consensusFamily,
      dedicatedSnap.architecture
    );
  }

  // 1. Exact USD Monetary Phase Transitions:
  //    1913 Pre-Fed Gold Specie (1.80 / D) -> 1971 Bretton Woods Terminal $35/oz Window (1.10 / D-) -> 2000+ Unbacked Fiat (0.00 / F VOID)
  if (ticker === 'USD') {
    const mergedUsdSnaps = mergeHistoricalSnapshots(
      audit.historicalSnapshots,
      PRELOADED_AUDITS.USD?.historicalSnapshots
    );
    const goldSpecie1913 = mergedUsdSnaps?.find((s) => s.epochId === 'usd-1913-gold-specie');
    const brettonWoods1971 = mergedUsdSnaps?.find((s) => s.epochId === 'usd-1971-bretton-woods');
    const postNixonFiat = mergedUsdSnaps?.find((s) => s.epochId === 'usd-post-1971-fiat');

    if (year === '1913' && goldSpecie1913) {
      return convertSnapshotToAuditData(
        audit,
        goldSpecie1913,
        '1913',
        'ENERGY_ARBITRAGED_POW',
        'Pre-Fed $20.67/oz Classical Gold Specie Standard • Citizen Coin Redeemability (1913)'
      );
    }

    if (year === '1971' && brettonWoods1971) {
      return convertSnapshotToAuditData(
        audit,
        brettonWoods1971,
        '1971',
        'ENERGY_ARBITRAGED_POW',
        'Bretton Woods $35/oz Terminal Window • Eve of Aug 15, 1971 Gold Severance'
      );
    }

    if (postNixonFiat) {
      const postBrettonDateMap: Partial<Record<HistoricalYearKey, string>> = {
        '2000': '2000 (Post-Bretton Woods Unbacked Petrodollar Credit • E = 0)',
        '2008': '2008 (Global Financial Crisis • TARP & QE1 Zero-Joule Bank Bailouts)',
        '2016': '2016 (Post-QE3 ZIRP Fiat Credit Expansion • E = 0)',
        '2020': '2020 (Pandemic Unlimited QE & 0.0% Bank Reserve Requirement • E = 0)',
        '2024': '2024 ($21T+ M2 Post-Bretton Woods Fiat Credit Ledger • E = 0)'
      };
      return convertSnapshotToAuditData(
        audit,
        {
          ...postNixonFiat,
          dateOrHeight: postBrettonDateMap[year] || postNixonFiat.dateOrHeight
        },
        year,
        'ZERO_JOULE_BFT',
        `Federal Reserve Unbacked Fiat Credit Ledger (${year} Post-Bretton Woods • E = 0)`
      );
    }
  }

  // 2. Exact 2008 Birth of Bitcoin Snapshot (6.00 / A+ Satoshi Cash Frontier)
  if (ticker === 'BTC' && year === '2008') {
    const mergedBtcSnaps = mergeHistoricalSnapshots(
      audit.historicalSnapshots,
      PRELOADED_AUDITS.BTC?.historicalSnapshots
    );
    const satoshiGenesisSnap = mergedBtcSnaps?.find(
      (s) => s.epochId === 'btc-2010-satoshi-frontier'
    );
    if (satoshiGenesisSnap) {
      return convertSnapshotToAuditData(
        audit,
        {
          ...satoshiGenesisSnap,
          dateOrHeight: 'Oct 31, 2008 Whitepaper — Genesis Release (Birth of Bitcoin)'
        },
        '2008',
        'LINEAR_POW',
        'Satoshi SHA-256d Proof-of-Work Cash Genesis (Oct 31, 2008 Breakthrough • Sole Digital E > 0)'
      );
    }
  }

  // 3. Exact ETH Historical Phase Transitions (PoW D+ in 2016 & 2020 -> PoS F VOID in 2024)
  if (ticker === 'ETH') {
    const mergedSnaps = mergeHistoricalSnapshots(
      audit.historicalSnapshots,
      PRELOADED_AUDITS.ETH?.historicalSnapshots
    );
    const postDaoSnap = mergedSnaps?.find((s) => s.epochId === 'eth-2016-post-dao-pow');
    const postMergeSnap = mergedSnaps?.find((s) => s.epochId === 'eth-2022-post-merge-pos');

    if (year === '2016' && postDaoSnap) {
      const eth2016Snap: HistoricalSnapshot = {
        ...postDaoSnap,
        dateOrHeight: 'Dec 2016 (Post-DAO Block 1,920,000 & Spurious Dragon)',
        invariants: {
          ...postDaoSnap.invariants,
          '05': {
            ...postDaoSnap.invariants['05'],
            score: 0.15,
            telemetry:
              'Shared global EVM account trie exposed by June 2016 DAO reentrancy drain and Autumn 2016 Shanghai opcode DoS attacks.'
          },
          '06': {
            ...postDaoSnap.invariants['06'],
            score: 0.35,
            frontierReference: '14s–15s Sequential PoW Frontier (2016)',
            telemetry:
              '~14.4s Ethash GPU blocks (~15 TPS) prior to parallel BlockDAG invention; uncle transactions discarded (M < 1.0).'
          }
        }
      };
      return convertSnapshotToAuditData(
        audit,
        eth2016Snap,
        '2016',
        'ENERGY_ARBITRAGED_POW',
        'Ethash GPU PoW • Post-DAO Bailout Era (72M Premine Cap • 2016)'
      );
    }

    if (year === '2020' && postDaoSnap) {
      return convertSnapshotToAuditData(
        audit,
        {
          ...postDaoSnap,
          dateOrHeight: 'Dec 2020 (DeFi Summer Ethash PoW • Pre-Merge)'
        },
        '2020',
        'ENERGY_ARBITRAGED_POW',
        'Ethash GPU/ASIC PoW • DeFi Gas Auction & Pre-Merge Era (2020)'
      );
    }

    if (year === '2024' && postMergeSnap) {
      return convertSnapshotToAuditData(
        audit,
        {
          ...postMergeSnap,
          dateOrHeight: '2024 (Post-Merge Gasper PoS + EIP-4844 Dencun Blobs)'
        },
        '2024',
        'ZERO_JOULE_BFT',
        'Gasper PoS • Zero-Joule Validator Quorum + EIP-4844 Blobs (2024)'
      );
    }
  }

  // 4. Exact KAS 2024 1-BPS Pre-Covenant Snapshot (5.75 / A)
  if (ticker === 'KAS' && year === '2024') {
    const mergedSnaps = mergeHistoricalSnapshots(
      audit.historicalSnapshots,
      PRELOADED_AUDITS.KAS?.historicalSnapshots
    );
    const kas1BpsSnap = mergedSnaps?.find((s) => s.epochId === 'kas-2024-1bps');
    if (kas1BpsSnap) {
      return convertSnapshotToAuditData(
        audit,
        kas1BpsSnap,
        '2024',
        'BLOCKDAG_POW',
        'GHOSTDAG 1-BPS PoW BlockDAG (kHeavyHash • Pre-Crescendo / Pre-Toccata • 2024)'
      );
    }
  }

  // 5. Dedicated curated historical specs for preloaded PoW/Commodity/Fiat/Overlay assets
  const overrideSpec = HISTORICAL_ASSET_OVERRIDES[year]?.[ticker];
  if (overrideSpec) {
    return applyYearOverrideSpec(audit, year, overrideSpec);
  }

  // 6. Zero-Joule (E = 0) protocols & post-1971 fiat ledgers that existed at `year` remain 0.00 / F with VOID 04–06
  const baseCostFloor = Number(audit.invariants?.[1]?.score ?? 0);
  if (baseCostFloor <= 0 || audit.grade === 'F') {
    const voidedInvariants: InvariantData[] = audit.invariants.map((inv, idx) => {
      const baseGenius = inv.geniusParagraph || inv.paragraph;
      const geniusParagraph =
        baseGenius.length > inv.paragraph.length + 120
          ? baseGenius
          : `[${year} Cohort — Conservation of Energy Floor (E = 0)]: ${baseGenius} Under p = m · v, zero-joule issuance supplies strictly zero physical thermodynamic mass (m = 0), locking ${audit.name} (${audit.ticker}) to 0.00 / 6.00 (Grade F) during the ${year} audit window.`;
      return {
        ...inv,
        score: 0,
        status: idx >= 3 ? 'VOID_UNANCHORED' : inv.status || 'VOID_UNANCHORED',
        geniusParagraph
      };
    });
    const projectedZero: AuditData = {
      ...audit,
      grade: 'F',
      totalScore: 0,
      architecture: `${audit.architecture} (${year} Cohort)`,
      invariants: voidedInvariants
    };
    return {
      ...projectedZero,
      geniusParagraphs: buildCanonicalGeniusParagraphs(projectedZero, {
        maxYear: stop.numericYear
      })
    };
  }

  // 7. Generic custom/archived E > 0 PoW or physical commodity asset that existed in `year`:
  // Recalibrate Velocity (06) relative to the historical settlement frontier at `year`
  const velocityBoostByYear: Record<HistoricalYearKey, number> = {
    '1913': 0.25,
    '1971': 0.22,
    '2000': 0.2,
    '2008': 0.2,
    '2016': 0.25,
    '2020': 0.2,
    '2024': 0.08
  };
  const velocityBoost = velocityBoostByYear[year];
  const sovScore = Number(audit.invariants[0]?.score ?? 1);
  const boostedVel = Math.min(
    0.9,
    Number(((Number(audit.invariants[5]?.score) || 0) + velocityBoost).toFixed(2))
  );
  const genericScores: [number, number, number, number, number, number] = [
    Number(audit.invariants[0]?.score) || 0,
    Number(audit.invariants[1]?.score) || 0,
    Number(audit.invariants[2]?.score) || 0,
    Number(audit.invariants[3]?.score) || 0,
    Number(audit.invariants[4]?.score) || 0,
    boostedVel
  ];

  return applyYearOverrideSpec(audit, year, {
    architecture: `${audit.architecture} (${year} Calibration)`,
    conclusion: `${audit.conclusion} (Calibrated against the ${year} live Pareto frontier, Grade ${deriveGradeFromTotal(
      Number(genericScores.reduce((a, b) => a + b, 0).toFixed(2)),
      genericScores[1],
      sovScore
    )}.)`,
    scores: genericScores
  });
}

/**
 * Projects an entire `audits` record to `year`.
 * Returns the exact input reference when `year === 'PRESENT'` for zero-allocation live rendering.
 */
export function projectAuditsCollectionAtYear(
  audits: Record<string, AuditData>,
  year: GlobalTimelineYear
): Record<string, AuditData> {
  if (year === 'PRESENT') return audits;

  const projected: Record<string, AuditData> = {};
  for (const [key, item] of Object.entries(audits)) {
    if (!item) continue;
    const itemAtYear = projectAuditAtYear(item, year);
    if (itemAtYear) {
      projected[key] = itemAtYear;
    }
  }
  return projected;
}
