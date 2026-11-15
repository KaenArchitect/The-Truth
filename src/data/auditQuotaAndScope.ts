// ============================================================================
// DAILY FULL-PULL QUOTA (2 / USER / DAY) & UNRESTRICTED ASSET / METAL SCOPE
// ============================================================================

export const DAILY_NEW_FULL_PULL_LIMIT = 2;
export const MAX_CMC_RANK_SCOPE = 150;

export interface MarketCapEntry {
  rank: number;
  symbol: string;
  name: string;
  id?: string;
}

export interface QuotaLedgerEntry {
  dayKey: string;
  used: number;
  updatedAtMs: number;
}

export type DailyQuotaLedger = Record<string, QuotaLedgerEntry>;

export interface QuotaStatus {
  limit: number;
  used: number;
  remaining: number;
  allowed: boolean;
  unlimited?: boolean;
  isAdmin?: boolean;
  dayKey: string;
  resetAtUtc: string;
}

export interface QuotaPrincipalResolution {
  primaryKey: string;
  allKeys: string[];
  normalizedIp: string;
}

export interface MarketScopeResult {
  allowed: boolean;
  reason:
    | 'CACHED_ARCHIVE'
    | 'PHYSICAL_COMMODITY'
    | 'FIAT_CURRENCY'
    | 'CRYPTO_NETWORK'
    | 'EMPTY_OR_INVALID';
  rank: number | null;
  maxRank: number;
  matchedSymbol: string | null;
  matchedName: string | null;
  bypassesScope: boolean;
  audit: null | undefined;
  message: string;
}

export const PHYSICAL_COMMODITY_ALLOWLIST: Record<string, { symbol: string; name: string }> = {
  GOLD: { symbol: 'XAU', name: 'Gold (Physical Au-79)' },
  AU: { symbol: 'XAU', name: 'Gold (Physical Au-79)' },
  XAU: { symbol: 'XAU', name: 'Gold (Physical Au-79)' },
  GOLDXAU: { symbol: 'XAU', name: 'Gold (Physical Au-79)' },
  PHYSICALGOLD: { symbol: 'XAU', name: 'Gold (Physical Au-79)' },
  GOLDMETAL: { symbol: 'XAU', name: 'Gold (Physical Au-79)' },
  BULLION: { symbol: 'XAU', name: 'Gold Bullion (Physical Au-79)' },
  SILVER: { symbol: 'XAG', name: 'Silver (Physical Ag-47)' },
  AG: { symbol: 'XAG', name: 'Silver (Physical Ag-47)' },
  XAG: { symbol: 'XAG', name: 'Silver (Physical Ag-47)' },
  SILVERXAG: { symbol: 'XAG', name: 'Silver (Physical Ag-47)' },
  PHYSICALSILVER: { symbol: 'XAG', name: 'Silver (Physical Ag-47)' },
  SILVERMETAL: { symbol: 'XAG', name: 'Silver (Physical Ag-47)' },
  PLATINUM: { symbol: 'XPT', name: 'Platinum (Physical Pt-78)' },
  PT: { symbol: 'XPT', name: 'Platinum (Physical Pt-78)' },
  XPT: { symbol: 'XPT', name: 'Platinum (Physical Pt-78)' },
  PHYSICALPLATINUM: { symbol: 'XPT', name: 'Platinum (Physical Pt-78)' },
  PALLADIUM: { symbol: 'XPD', name: 'Palladium (Physical Pd-46)' },
  PD: { symbol: 'XPD', name: 'Palladium (Physical Pd-46)' },
  XPD: { symbol: 'XPD', name: 'Palladium (Physical Pd-46)' },
  PHYSICALPALLADIUM: { symbol: 'XPD', name: 'Palladium (Physical Pd-46)' },
  COPPER: { symbol: 'CU', name: 'Copper (Physical Cu-29)' },
  CU: { symbol: 'CU', name: 'Copper (Physical Cu-29)' },
  XCU: { symbol: 'CU', name: 'Copper (Physical Cu-29)' },
  COPPERCU: { symbol: 'CU', name: 'Copper (Physical Cu-29)' },
  PHYSICALCOPPER: { symbol: 'CU', name: 'Copper (Physical Cu-29)' },
  RHODIUM: { symbol: 'RH', name: 'Rhodium (Physical Rh-45)' },
  RH: { symbol: 'RH', name: 'Rhodium (Physical Rh-45)' },
  URANIUM: { symbol: 'U3O8', name: 'Uranium (Physical U3O8)' },
  U3O8: { symbol: 'U3O8', name: 'Uranium (Physical U3O8)' },
  YELLOWCAKE: { symbol: 'U3O8', name: 'Uranium (Physical U3O8)' },
  NICKEL: { symbol: 'NI', name: 'Nickel (Physical Ni-28)' },
  NI: { symbol: 'NI', name: 'Nickel (Physical Ni-28)' },
  ALUMINUM: { symbol: 'AL', name: 'Aluminum (Physical Al-13)' },
  ALUMINIUM: { symbol: 'AL', name: 'Aluminum (Physical Al-13)' },
  AL: { symbol: 'AL', name: 'Aluminum (Physical Al-13)' },
  TITANIUM: { symbol: 'TI', name: 'Titanium (Physical Ti-22)' },
  TI: { symbol: 'TI', name: 'Titanium (Physical Ti-22)' },
  TUNGSTEN: { symbol: 'W', name: 'Tungsten (Physical W-74)' },
  WOLFRAM: { symbol: 'W', name: 'Tungsten (Physical W-74)' },
  W: { symbol: 'W', name: 'Tungsten (Physical W-74)' },
  IRIDIUM: { symbol: 'IR', name: 'Iridium (Physical Ir-77)' },
  IR: { symbol: 'IR', name: 'Iridium (Physical Ir-77)' },
  OSMIUM: { symbol: 'OS', name: 'Osmium (Physical Os-76)' },
  OS: { symbol: 'OS', name: 'Osmium (Physical Os-76)' },
  RUTHENIUM: { symbol: 'RU', name: 'Ruthenium (Physical Ru-44)' },
  RU: { symbol: 'RU', name: 'Ruthenium (Physical Ru-44)' },
  COBALT: { symbol: 'CO', name: 'Cobalt (Physical Co-27)' },
  CO: { symbol: 'CO', name: 'Cobalt (Physical Co-27)' },
  LITHIUM: { symbol: 'LI', name: 'Lithium (Physical Li-3)' },
  LI: { symbol: 'LI', name: 'Lithium (Physical Li-3)' },
  ZINC: { symbol: 'ZN', name: 'Zinc (Physical Zn-30)' },
  ZN: { symbol: 'ZN', name: 'Zinc (Physical Zn-30)' },
  TIN: { symbol: 'SN', name: 'Tin (Physical Sn-50)' },
  SN: { symbol: 'SN', name: 'Tin (Physical Sn-50)' },
  LEAD: { symbol: 'PB', name: 'Lead (Physical Pb-82)' },
  PB: { symbol: 'PB', name: 'Lead (Physical Pb-82)' },
  IRON: { symbol: 'FE', name: 'Iron (Physical Fe-26)' },
  FE: { symbol: 'FE', name: 'Iron (Physical Fe-26)' },
  STEEL: { symbol: 'FE', name: 'Steel / Iron (Industrial Fe-C)' },
  CHROMIUM: { symbol: 'CR', name: 'Chromium (Physical Cr-24)' },
  CR: { symbol: 'CR', name: 'Chromium (Physical Cr-24)' },
  MERCURY: { symbol: 'HG', name: 'Mercury (Physical Hg-80)' },
  HG: { symbol: 'HG', name: 'Mercury (Physical Hg-80)' },
  GALLIUM: { symbol: 'GA', name: 'Gallium (Physical Ga-31)' },
  GA: { symbol: 'GA', name: 'Gallium (Physical Ga-31)' },
  INDIUM: { symbol: 'IN', name: 'Indium (Physical In-49)' },
  MOLYBDENUM: { symbol: 'MO', name: 'Molybdenum (Physical Mo-42)' },
  MO: { symbol: 'MO', name: 'Molybdenum (Physical Mo-42)' },
  TANTALUM: { symbol: 'TA', name: 'Tantalum (Physical Ta-73)' },
  TA: { symbol: 'TA', name: 'Tantalum (Physical Ta-73)' },
  BISMUTH: { symbol: 'BI', name: 'Bismuth (Physical Bi-83)' },
  BI: { symbol: 'BI', name: 'Bismuth (Physical Bi-83)' },
  ANTIMONY: { symbol: 'SB', name: 'Antimony (Physical Sb-51)' },
  SB: { symbol: 'SB', name: 'Antimony (Physical Sb-51)' },
  MAGNESIUM: { symbol: 'MG', name: 'Magnesium (Physical Mg-12)' },
  MG: { symbol: 'MG', name: 'Magnesium (Physical Mg-12)' },
  MANGANESE: { symbol: 'MN', name: 'Manganese (Physical Mn-25)' },
  MN: { symbol: 'MN', name: 'Manganese (Physical Mn-25)' },
  VANADIUM: { symbol: 'V', name: 'Vanadium (Physical V-23)' },
  V: { symbol: 'V', name: 'Vanadium (Physical V-23)' },
  RAREEARTH: { symbol: 'REE', name: 'Rare Earth Metals' },
  PAXG: { symbol: 'PAXG', name: 'PAX Gold (Tokenized Vault Gold)' },
  XAUT: { symbol: 'XAUT', name: 'Tether Gold (Tokenized Vault Gold)' }
};

export const TOKENIZED_COMMODITY_WRAPPER_TICKERS = new Set<string>(['PAXG', 'XAUT']);

const COMMODITY_PHRASE_REGEX =
  /\b(GOLD|SILVER|PLATINUM|PALLADIUM|COPPER|RHODIUM|URANIUM|NICKEL|ALUMINUM|ALUMINIUM|TITANIUM|TUNGSTEN|IRIDIUM|OSMIUM|RUTHENIUM|COBALT|LITHIUM|ZINC|CHROMIUM|MOLYBDENUM|TANTALUM|BISMUTH|ANTIMONY|MAGNESIUM|MANGANESE|VANADIUM|RARE\s+EARTH|BULLION)\b/i;

// Static fallback snapshot of major crypto tickers used as informational market directory when offline
export const STATIC_TOP_150_FALLBACK_ENTRIES: MarketCapEntry[] = [
  { rank: 1, symbol: 'BTC', name: 'Bitcoin', id: 'bitcoin' },
  { rank: 2, symbol: 'ETH', name: 'Ethereum', id: 'ethereum' },
  { rank: 3, symbol: 'USDT', name: 'Tether', id: 'tether' },
  { rank: 4, symbol: 'BNB', name: 'BNB', id: 'binancecoin' },
  { rank: 5, symbol: 'USDC', name: 'USDC', id: 'usd-coin' },
  { rank: 6, symbol: 'XRP', name: 'XRP', id: 'ripple' },
  { rank: 7, symbol: 'SOL', name: 'Solana', id: 'solana' },
  { rank: 8, symbol: 'TRX', name: 'TRON', id: 'tron' },
  { rank: 9, symbol: 'STETH', name: 'Lido Staked Ether', id: 'staked-ether' },
  { rank: 10, symbol: 'HYPE', name: 'Hyperliquid', id: 'hyperliquid' },
  { rank: 11, symbol: 'ZEC', name: 'Zcash', id: 'zcash' },
  { rank: 12, symbol: 'DOGE', name: 'Dogecoin', id: 'dogecoin' },
  { rank: 13, symbol: 'XMR', name: 'Monero', id: 'monero' },
  { rank: 14, symbol: 'ADA', name: 'Cardano', id: 'cardano' },
  { rank: 15, symbol: 'BCH', name: 'Bitcoin Cash', id: 'bitcoin-cash' },
  { rank: 16, symbol: 'LEO', name: 'LEO Token', id: 'leo-token' },
  { rank: 17, symbol: 'LINK', name: 'Chainlink', id: 'chainlink' },
  { rank: 18, symbol: 'AVAX', name: 'Avalanche', id: 'avalanche-2' },
  { rank: 19, symbol: 'XLM', name: 'Stellar', id: 'stellar' },
  { rank: 20, symbol: 'SUI', name: 'Sui', id: 'sui' },
  { rank: 21, symbol: 'TON', name: 'Toncoin', id: 'the-open-network' },
  { rank: 22, symbol: 'SHIB', name: 'Shiba Inu', id: 'shiba-inu' },
  { rank: 23, symbol: 'LTC', name: 'Litecoin', id: 'litecoin' },
  { rank: 24, symbol: 'DOT', name: 'Polkadot', id: 'polkadot' },
  { rank: 25, symbol: 'HBAR', name: 'Hedera', id: 'hedera-hashgraph' },
  { rank: 26, symbol: 'PEPE', name: 'Pepe', id: 'pepe' },
  { rank: 27, symbol: 'UNI', name: 'Uniswap', id: 'uniswap' },
  { rank: 28, symbol: 'NEAR', name: 'NEAR Protocol', id: 'near' },
  { rank: 29, symbol: 'APT', name: 'Aptos', id: 'aptos' },
  { rank: 30, symbol: 'AAVE', name: 'Aave', id: 'aave' },
  { rank: 31, symbol: 'ICP', name: 'Internet Computer', id: 'internet-computer' },
  { rank: 32, symbol: 'ETC', name: 'Ethereum Classic', id: 'ethereum-classic' },
  { rank: 33, symbol: 'KAS', name: 'Kaspa', id: 'kaspa' },
  { rank: 34, symbol: 'POL', name: 'Polygon', id: 'polygon-ecosystem-token' },
  { rank: 35, symbol: 'MATIC', name: 'Polygon', id: 'matic-network' },
  { rank: 36, symbol: 'CRO', name: 'Cronos', id: 'crypto-com-chain' },
  { rank: 37, symbol: 'VET', name: 'VeChain', id: 'vechain' },
  { rank: 38, symbol: 'RENDER', name: 'Render', id: 'render-token' },
  { rank: 39, symbol: 'FET', name: 'Artificial Superintelligence Alliance', id: 'fetch-ai' },
  { rank: 40, symbol: 'TAO', name: 'Bittensor', id: 'bittensor' },
  { rank: 41, symbol: 'ARB', name: 'Arbitrum', id: 'arbitrum' },
  { rank: 42, symbol: 'OP', name: 'Optimism', id: 'optimism' },
  { rank: 43, symbol: 'FIL', name: 'Filecoin', id: 'filecoin' },
  { rank: 44, symbol: 'ATOM', name: 'Cosmos', id: 'cosmos' },
  { rank: 45, symbol: 'INJ', name: 'Injective', id: 'injective-protocol' },
  { rank: 46, symbol: 'ALGO', name: 'Algorand', id: 'algorand' },
  { rank: 47, symbol: 'FTM', name: 'Fantom', id: 'fantom' },
  { rank: 48, symbol: 'S', name: 'Sonic', id: 'sonic-3' },
  { rank: 49, symbol: 'STX', name: 'Stacks', id: 'blockstack' },
  { rank: 50, symbol: 'IMX', name: 'Immutable', id: 'immutable-x' },
  { rank: 51, symbol: 'GRT', name: 'The Graph', id: 'the-graph' },
  { rank: 52, symbol: 'TIA', name: 'Celestia', id: 'celestia' },
  { rank: 53, symbol: 'SEI', name: 'Sei', id: 'sei-network' },
  { rank: 54, symbol: 'WIF', name: 'dogwifhat', id: 'dogwifcoin' },
  { rank: 55, symbol: 'BONK', name: 'Bonk', id: 'bonk' },
  { rank: 56, symbol: 'JUP', name: 'Jupiter', id: 'jupiter-exchange-solana' },
  { rank: 57, symbol: 'ENA', name: 'Ethena', id: 'ethena' },
  { rank: 58, symbol: 'ONDO', name: 'Ondo', id: 'ondo-finance' },
  { rank: 59, symbol: 'MKR', name: 'Maker', id: 'maker' },
  { rank: 60, symbol: 'LDO', name: 'Lido DAO', id: 'lido-dao' },
  { rank: 61, symbol: 'RUNE', name: 'THORChain', id: 'thorchain' },
  { rank: 62, symbol: 'THETA', name: 'Theta Network', id: 'theta-token' },
  { rank: 63, symbol: 'AR', name: 'Arweave', id: 'arweave' },
  { rank: 64, symbol: 'FLOKI', name: 'FLOKI', id: 'floki' },
  { rank: 65, symbol: 'QNT', name: 'Quant', id: 'quant-network' },
  { rank: 66, symbol: 'PYTH', name: 'Pyth Network', id: 'pyth-network' },
  { rank: 67, symbol: 'FLOW', name: 'Flow', id: 'flow' },
  { rank: 68, symbol: 'EGLD', name: 'MultiversX', id: 'elrond-erd-2' },
  { rank: 69, symbol: 'XTZ', name: 'Tezos', id: 'tezos' },
  { rank: 70, symbol: 'EOS', name: 'EOS', id: 'eos' },
  { rank: 71, symbol: 'AXS', name: 'Axie Infinity', id: 'axie-infinity' },
  { rank: 72, symbol: 'SAND', name: 'The Sandbox', id: 'the-sandbox' },
  { rank: 73, symbol: 'MANA', name: 'Decentraland', id: 'decentraland' },
  { rank: 74, symbol: 'KCS', name: 'KuCoin Token', id: 'kucoin-shares' },
  { rank: 75, symbol: 'BSV', name: 'Bitcoin SV', id: 'bitcoin-cash-sv' },
  { rank: 76, symbol: 'NEO', name: 'NEO', id: 'neo' },
  { rank: 77, symbol: 'IOTA', name: 'IOTA', id: 'iota' },
  { rank: 78, symbol: 'KAIA', name: 'Kaia', id: 'kaia' },
  { rank: 79, symbol: 'CHZ', name: 'Chiliz', id: 'chiliz' },
  { rank: 80, symbol: 'CRV', name: 'Curve DAO Token', id: 'curve-dao-token' },
  { rank: 81, symbol: 'CAKE', name: 'PancakeSwap', id: 'pancakeswap-token' },
  { rank: 82, symbol: 'ENS', name: 'Ethereum Name Service', id: 'ethereum-name-service' },
  { rank: 83, symbol: 'PENDLE', name: 'Pendle', id: 'pendle' },
  { rank: 84, symbol: 'AERO', name: 'Aerodrome Finance', id: 'aerodrome-finance' },
  { rank: 85, symbol: 'RAY', name: 'Raydium', id: 'raydium' },
  { rank: 86, symbol: 'CFX', name: 'Conflux', id: 'conflux-token' },
  { rank: 87, symbol: 'MINA', name: 'Mina', id: 'mina-protocol' },
  { rank: 88, symbol: 'DASH', name: 'Dash', id: 'dash' },
  { rank: 89, symbol: 'DCR', name: 'Decred', id: 'decred' },
  { rank: 90, symbol: 'RVN', name: 'Ravencoin', id: 'ravencoin' },
  { rank: 91, symbol: 'XEC', name: 'eCash', id: 'ecash' },
  { rank: 92, symbol: 'ZRO', name: 'LayerZero', id: 'layerzero' },
  { rank: 93, symbol: 'STRK', name: 'Starknet', id: 'starknet' },
  { rank: 94, symbol: 'WLD', name: 'Worldcoin', id: 'worldcoin-wld' },
  { rank: 95, symbol: 'PENGU', name: 'Pudgy Penguins', id: 'pudgy-penguins' },
  { rank: 96, symbol: 'TRUMP', name: 'OFFICIAL TRUMP', id: 'official-trump' },
  { rank: 97, symbol: 'PAXG', name: 'PAX Gold', id: 'pax-gold' },
  { rank: 98, symbol: 'XAUT', name: 'Tether Gold', id: 'tether-gold' },
  { rank: 99, symbol: 'NEXO', name: 'NEXO', id: 'nexo' },
  { rank: 100, symbol: 'OKB', name: 'OKB', id: 'okb' }
];

export function normalizeMarketQuery(raw: string): string {
  return String(raw || '')
    .replace(/^\$/, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export const FIAT_CURRENCY_ALLOWLIST: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: 'USD', name: 'US Dollar (Fiat USD)' },
  DOLLAR: { symbol: 'USD', name: 'US Dollar (Fiat USD)' },
  USDOLLAR: { symbol: 'USD', name: 'US Dollar (Fiat USD)' },
  UNITEDSTATESDOLLAR: { symbol: 'USD', name: 'US Dollar (Fiat USD)' },
  GREENBACK: { symbol: 'USD', name: 'US Dollar (Fiat USD)' },
  EUR: { symbol: 'EUR', name: 'Euro (Fiat EUR)' },
  EURO: { symbol: 'EUR', name: 'Euro (Fiat EUR)' },
  EUROZONEEURO: { symbol: 'EUR', name: 'Euro (Fiat EUR)' },
  GBP: { symbol: 'GBP', name: 'British Pound Sterling (Fiat GBP)' },
  BRITISHPOUND: { symbol: 'GBP', name: 'British Pound Sterling (Fiat GBP)' },
  POUND: { symbol: 'GBP', name: 'British Pound Sterling (Fiat GBP)' },
  POUNDSTERLING: { symbol: 'GBP', name: 'British Pound Sterling (Fiat GBP)' },
  STERLING: { symbol: 'GBP', name: 'British Pound Sterling (Fiat GBP)' },
  JPY: { symbol: 'JPY', name: 'Japanese Yen (Fiat JPY)' },
  JAPANESEYEN: { symbol: 'JPY', name: 'Japanese Yen (Fiat JPY)' },
  YEN: { symbol: 'JPY', name: 'Japanese Yen (Fiat JPY)' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc (Fiat CHF)' },
  SWISSFRANC: { symbol: 'CHF', name: 'Swiss Franc (Fiat CHF)' },
  FRANC: { symbol: 'CHF', name: 'Swiss Franc (Fiat CHF)' },
  CNY: { symbol: 'CNY', name: 'Chinese Yuan / Renminbi (Fiat CNY)' },
  CHINESEYUAN: { symbol: 'CNY', name: 'Chinese Yuan / Renminbi (Fiat CNY)' },
  YUAN: { symbol: 'CNY', name: 'Chinese Yuan / Renminbi (Fiat CNY)' },
  RENMINBI: { symbol: 'CNY', name: 'Chinese Yuan / Renminbi (Fiat CNY)' },
  RMB: { symbol: 'CNY', name: 'Chinese Yuan / Renminbi (Fiat CNY)' },
  CNH: { symbol: 'CNY', name: 'Chinese Yuan / Renminbi (Fiat CNY)' },
  OFFSHOREYUAN: { symbol: 'CNY', name: 'Chinese Yuan / Renminbi (Fiat CNY)' },
  CAD: { symbol: 'CAD', name: 'Canadian Dollar (Fiat CAD)' },
  CANADIANDOLLAR: { symbol: 'CAD', name: 'Canadian Dollar (Fiat CAD)' },
  AUD: { symbol: 'AUD', name: 'Australian Dollar (Fiat AUD)' },
  AUSTRALIANDOLLAR: { symbol: 'AUD', name: 'Australian Dollar (Fiat AUD)' },
  NZD: { symbol: 'NZD', name: 'New Zealand Dollar (Fiat NZD)' },
  NEWZEALANDDOLLAR: { symbol: 'NZD', name: 'New Zealand Dollar (Fiat NZD)' },
  INR: { symbol: 'INR', name: 'Indian Rupee (Fiat INR)' },
  INDIANRUPEE: { symbol: 'INR', name: 'Indian Rupee (Fiat INR)' },
  RUPEE: { symbol: 'INR', name: 'Indian Rupee (Fiat INR)' },
  BRL: { symbol: 'BRL', name: 'Brazilian Real (Fiat BRL)' },
  BRAZILIANREAL: { symbol: 'BRL', name: 'Brazilian Real (Fiat BRL)' },
  MXN: { symbol: 'MXN', name: 'Mexican Peso (Fiat MXN)' },
  MEXICANPESO: { symbol: 'MXN', name: 'Mexican Peso (Fiat MXN)' },
  KRW: { symbol: 'KRW', name: 'South Korean Won (Fiat KRW)' },
  KOREANWON: { symbol: 'KRW', name: 'South Korean Won (Fiat KRW)' },
  SOUTHKOREANWON: { symbol: 'KRW', name: 'South Korean Won (Fiat KRW)' },
  SGD: { symbol: 'SGD', name: 'Singapore Dollar (Fiat SGD)' },
  SINGAPOREDOLLAR: { symbol: 'SGD', name: 'Singapore Dollar (Fiat SGD)' },
  HKD: { symbol: 'HKD', name: 'Hong Kong Dollar (Fiat HKD)' },
  HONGKONGDOLLAR: { symbol: 'HKD', name: 'Hong Kong Dollar (Fiat HKD)' },
  TRY: { symbol: 'TRY', name: 'Turkish Lira (Fiat TRY)' },
  TURKISHLIRA: { symbol: 'TRY', name: 'Turkish Lira (Fiat TRY)' },
  LIRA: { symbol: 'TRY', name: 'Turkish Lira (Fiat TRY)' },
  ARS: { symbol: 'ARS', name: 'Argentine Peso (Fiat ARS)' },
  ARGENTINEPESO: { symbol: 'ARS', name: 'Argentine Peso (Fiat ARS)' },
  RUB: { symbol: 'RUB', name: 'Russian Ruble (Fiat RUB)' },
  RUSSIANRUBLE: { symbol: 'RUB', name: 'Russian Ruble (Fiat RUB)' },
  RUBLE: { symbol: 'RUB', name: 'Russian Ruble (Fiat RUB)' },
  ROUBLE: { symbol: 'RUB', name: 'Russian Ruble (Fiat RUB)' },
  ZAR: { symbol: 'ZAR', name: 'South African Rand (Fiat ZAR)' },
  SOUTHAFRICANRAND: { symbol: 'ZAR', name: 'South African Rand (Fiat ZAR)' },
  RAND: { symbol: 'ZAR', name: 'South African Rand (Fiat ZAR)' },
  SEK: { symbol: 'SEK', name: 'Swedish Krona (Fiat SEK)' },
  SWEDISHKRONA: { symbol: 'SEK', name: 'Swedish Krona (Fiat SEK)' },
  NOK: { symbol: 'NOK', name: 'Norwegian Krone (Fiat NOK)' },
  NORWEGIANKRONE: { symbol: 'NOK', name: 'Norwegian Krone (Fiat NOK)' },
  DKK: { symbol: 'DKK', name: 'Danish Krone (Fiat DKK)' },
  DANISHKRONE: { symbol: 'DKK', name: 'Danish Krone (Fiat DKK)' },
  PLN: { symbol: 'PLN', name: 'Polish Zloty (Fiat PLN)' },
  POLISHZLOTY: { symbol: 'PLN', name: 'Polish Zloty (Fiat PLN)' },
  ZLOTY: { symbol: 'PLN', name: 'Polish Zloty (Fiat PLN)' },
  THB: { symbol: 'THB', name: 'Thai Baht (Fiat THB)' },
  THAIBAHT: { symbol: 'THB', name: 'Thai Baht (Fiat THB)' },
  BAHT: { symbol: 'THB', name: 'Thai Baht (Fiat THB)' },
  IDR: { symbol: 'IDR', name: 'Indonesian Rupiah (Fiat IDR)' },
  INDONESIANRUPIAH: { symbol: 'IDR', name: 'Indonesian Rupiah (Fiat IDR)' },
  RUPIAH: { symbol: 'IDR', name: 'Indonesian Rupiah (Fiat IDR)' },
  SAR: { symbol: 'SAR', name: 'Saudi Riyal (Fiat SAR)' },
  SAUDIRIYAL: { symbol: 'SAR', name: 'Saudi Riyal (Fiat SAR)' },
  RIYAL: { symbol: 'SAR', name: 'Saudi Riyal (Fiat SAR)' },
  AED: { symbol: 'AED', name: 'UAE Dirham (Fiat AED)' },
  UAEDIRHAM: { symbol: 'AED', name: 'UAE Dirham (Fiat AED)' },
  DIRHAM: { symbol: 'AED', name: 'UAE Dirham (Fiat AED)' },
  ILS: { symbol: 'ILS', name: 'Israeli New Shekel (Fiat ILS)' },
  ISRAELISHEKEL: { symbol: 'ILS', name: 'Israeli New Shekel (Fiat ILS)' },
  SHEKEL: { symbol: 'ILS', name: 'Israeli New Shekel (Fiat ILS)' },
  TWD: { symbol: 'TWD', name: 'New Taiwan Dollar (Fiat TWD)' },
  TAIWANDOLLAR: { symbol: 'TWD', name: 'New Taiwan Dollar (Fiat TWD)' },
  PHP: { symbol: 'PHP', name: 'Philippine Peso (Fiat PHP)' },
  PHILIPPINEPESO: { symbol: 'PHP', name: 'Philippine Peso (Fiat PHP)' },
  VND: { symbol: 'VND', name: 'Vietnamese Dong (Fiat VND)' },
  VIETNAMESEDONG: { symbol: 'VND', name: 'Vietnamese Dong (Fiat VND)' },
  DONG: { symbol: 'VND', name: 'Vietnamese Dong (Fiat VND)' },
  EGP: { symbol: 'EGP', name: 'Egyptian Pound (Fiat EGP)' },
  EGYPTIANPOUND: { symbol: 'EGP', name: 'Egyptian Pound (Fiat EGP)' },
  NGN: { symbol: 'NGN', name: 'Nigerian Naira (Fiat NGN)' },
  NIGERIANNAIRA: { symbol: 'NGN', name: 'Nigerian Naira (Fiat NGN)' },
  NAIRA: { symbol: 'NGN', name: 'Nigerian Naira (Fiat NGN)' },
  PKR: { symbol: 'PKR', name: 'Pakistani Rupee (Fiat PKR)' },
  PAKISTANIRUPEE: { symbol: 'PKR', name: 'Pakistani Rupee (Fiat PKR)' },
  CZK: { symbol: 'CZK', name: 'Czech Koruna (Fiat CZK)' },
  CZECHKORUNA: { symbol: 'CZK', name: 'Czech Koruna (Fiat CZK)' },
  HUF: { symbol: 'HUF', name: 'Hungarian Forint (Fiat HUF)' },
  HUNGARIANFORINT: { symbol: 'HUF', name: 'Hungarian Forint (Fiat HUF)' },
  FORINT: { symbol: 'HUF', name: 'Hungarian Forint (Fiat HUF)' },
  CLP: { symbol: 'CLP', name: 'Chilean Peso (Fiat CLP)' },
  CHILEANPESO: { symbol: 'CLP', name: 'Chilean Peso (Fiat CLP)' },
  COP: { symbol: 'COP', name: 'Colombian Peso (Fiat COP)' },
  COLOMBIANPESO: { symbol: 'COP', name: 'Colombian Peso (Fiat COP)' },
  PEN: { symbol: 'PEN', name: 'Peruvian Sol (Fiat PEN)' },
  PERUVIANSOL: { symbol: 'PEN', name: 'Peruvian Sol (Fiat PEN)' },
  VES: { symbol: 'VES', name: 'Venezuelan Bolivar (Fiat VES)' },
  VEF: { symbol: 'VES', name: 'Venezuelan Bolivar (Fiat VES)' },
  VENEZUELANBOLIVAR: { symbol: 'VES', name: 'Venezuelan Bolivar (Fiat VES)' },
  BOLIVAR: { symbol: 'VES', name: 'Venezuelan Bolivar (Fiat VES)' },
  ZWL: { symbol: 'ZWL', name: 'Zimbabwean Dollar (Fiat ZWL)' },
  ZWD: { symbol: 'ZWL', name: 'Zimbabwean Dollar (Fiat ZWL)' },
  ZIMBABWEANDOLLAR: { symbol: 'ZWL', name: 'Zimbabwean Dollar (Fiat ZWL)' },
  LBP: { symbol: 'LBP', name: 'Lebanese Pound (Fiat LBP)' },
  LEBANESEPOUND: { symbol: 'LBP', name: 'Lebanese Pound (Fiat LBP)' },
  UAH: { symbol: 'UAH', name: 'Ukrainian Hryvnia (Fiat UAH)' },
  UKRAINIANHRYVNIA: { symbol: 'UAH', name: 'Ukrainian Hryvnia (Fiat UAH)' },
  HRYVNIA: { symbol: 'UAH', name: 'Ukrainian Hryvnia (Fiat UAH)' },
  KES: { symbol: 'KES', name: 'Kenyan Shilling (Fiat KES)' },
  KENYANSHILLING: { symbol: 'KES', name: 'Kenyan Shilling (Fiat KES)' },
  IRR: { symbol: 'IRR', name: 'Iranian Rial (Fiat IRR)' },
  IRANIANRIAL: { symbol: 'IRR', name: 'Iranian Rial (Fiat IRR)' },
  XDR: { symbol: 'XDR', name: 'IMF Special Drawing Rights (Fiat SDR)' },
  FIAT: { symbol: 'FIAT', name: 'Sovereign Fiat Currency (Generic ISO-4217)' },
  FIATCURRENCY: { symbol: 'FIAT', name: 'Sovereign Fiat Currency (Generic ISO-4217)' },
  FIATMONEY: { symbol: 'FIAT', name: 'Sovereign Fiat Currency (Generic ISO-4217)' }
};

const CRYPTO_STABLECOIN_GUARD_REGEX =
  /\b(USDC|USD\s*COIN|USDT|TETHER|DAI|USDE|FDUSD|TUSD|PYUSD|FRAX|EURC|STABLECOIN)\b/i;

const FIAT_PHRASE_REGEX =
  /\b(USD|US\s+DOLLAR|U\.S\.\s+DOLLAR|DOLLAR|EURO|GBP|BRITISH\s+POUND|POUND\s+STERLING|JPY|JAPANESE\s+YEN|YEN|CHF|SWISS\s+FRANC|CNY|CNH|RMB|CHINESE\s+YUAN|RENMINBI|CAD|CANADIAN\s+DOLLAR|AUD|AUSTRALIAN\s+DOLLAR|TURKISH\s+LIRA|ARGENTINE\s+PESO|RUSSIAN\s+RUBLE|FIAT\s+CURRENCY|FIAT\s+MONEY)\b/i;

export function resolveFiatCurrencyQuery(
  rawQuery: string,
  normQuery = normalizeMarketQuery(rawQuery)
): { symbol: string; name: string } | null {
  if (!normQuery) return null;
  const rawStr = String(rawQuery || '').trim();
  if (CRYPTO_STABLECOIN_GUARD_REGEX.test(rawStr) || CRYPTO_STABLECOIN_GUARD_REGEX.test(normQuery)) {
    return null;
  }
  const strippedNorm = normQuery.startsWith('FIAT') && normQuery.length > 4
    ? normQuery.slice(4)
    : normQuery;
  if (FIAT_CURRENCY_ALLOWLIST[normQuery]) {
    return FIAT_CURRENCY_ALLOWLIST[normQuery];
  }
  if (strippedNorm && FIAT_CURRENCY_ALLOWLIST[strippedNorm]) {
    return FIAT_CURRENCY_ALLOWLIST[strippedNorm];
  }
  const match = FIAT_PHRASE_REGEX.exec(rawStr);
  if (match) {
    const key = normalizeMarketQuery(match[1]);
    if (FIAT_CURRENCY_ALLOWLIST[key]) {
      return FIAT_CURRENCY_ALLOWLIST[key];
    }
  }
  return null;
}

export function resolvePhysicalCommodityQuery(
  rawQuery: string,
  normQuery = normalizeMarketQuery(rawQuery)
): { symbol: string; name: string } | null {
  if (!normQuery) return null;
  if (PHYSICAL_COMMODITY_ALLOWLIST[normQuery]) {
    return PHYSICAL_COMMODITY_ALLOWLIST[normQuery];
  }
  const match = COMMODITY_PHRASE_REGEX.exec(String(rawQuery || ''));
  if (match) {
    const key = normalizeMarketQuery(match[1]);
    if (PHYSICAL_COMMODITY_ALLOWLIST[key]) {
      return PHYSICAL_COMMODITY_ALLOWLIST[key];
    }
    return {
      symbol: key || normQuery,
      name: `${String(match[1]).trim()} (Physical Commodity)`
    };
  }
  return null;
}

export function getUtcDayKey(nowMs = Date.now()): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export function getNextUtcMidnightIso(nowMs = Date.now()): string {
  const d = new Date(nowMs);
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0);
  return new Date(next).toISOString();
}

export function sanitizePrincipalSegment(raw: string | null | undefined, maxLen = 64): string {
  return String(raw || '')
    .trim()
    .replace(/[^A-Za-z0-9._:-]/g, '')
    .slice(0, maxLen);
}

export function resolveQuotaPrincipalKeys(input: {
  userId?: string | null;
  clientId?: string | null;
  ip?: string | null;
}): QuotaPrincipalResolution {
  const cleanUser = sanitizePrincipalSegment(input.userId, 80);
  const cleanClient = sanitizePrincipalSegment(input.clientId, 80);
  const cleanIp = sanitizePrincipalSegment(input.ip || 'unknown', 64) || 'unknown';

  const keys = new Set<string>();
  let primaryKey = `ip:${cleanIp}`;

  if (cleanUser) {
    primaryKey = `uid:${cleanUser}`;
    keys.add(primaryKey);
    if (cleanClient) keys.add(`client:${cleanClient}`);
  } else {
    keys.add(`ip:${cleanIp}`);
    if (cleanClient) keys.add(`client:${cleanClient}`);
  }

  return {
    primaryKey,
    allKeys: Array.from(keys),
    normalizedIp: cleanIp
  };
}

export function pruneStaleQuotaDays(
  ledger: DailyQuotaLedger,
  nowMs = Date.now()
): DailyQuotaLedger {
  const today = getUtcDayKey(nowMs);
  const next: DailyQuotaLedger = {};
  for (const [k, entry] of Object.entries(ledger || {})) {
    if (entry && entry.dayKey === today && typeof entry.used === 'number' && entry.used > 0) {
      next[k] = entry;
    }
  }
  return next;
}

export function getUserDailyQuotaStatus(
  ledger: DailyQuotaLedger,
  keys: string[],
  nowMs = Date.now(),
  limit = DAILY_NEW_FULL_PULL_LIMIT,
  isAdmin = false
): QuotaStatus {
  const dayKey = getUtcDayKey(nowMs);
  const resetAtUtc = getNextUtcMidnightIso(nowMs);

  if (isAdmin) {
    return {
      limit,
      used: 0,
      remaining: limit,
      allowed: true,
      unlimited: true,
      isAdmin: true,
      dayKey,
      resetAtUtc
    };
  }

  let maxUsed = 0;
  for (const key of keys) {
    const entry = ledger?.[key];
    if (entry && entry.dayKey === dayKey && Number.isFinite(entry.used)) {
      maxUsed = Math.max(maxUsed, Math.max(0, Math.floor(entry.used)));
    }
  }

  const remaining = Math.max(0, limit - maxUsed);
  return {
    limit,
    used: maxUsed,
    remaining,
    allowed: remaining > 0,
    unlimited: false,
    isAdmin: false,
    dayKey,
    resetAtUtc
  };
}

export function consumeDailyPull(
  ledger: DailyQuotaLedger,
  keys: string[],
  nowMs = Date.now(),
  limit = DAILY_NEW_FULL_PULL_LIMIT,
  isAdmin = false
): { allowed: boolean; status: QuotaStatus; nextLedger: DailyQuotaLedger } {
  const current = getUserDailyQuotaStatus(ledger, keys, nowMs, limit, isAdmin);
  if (isAdmin) {
    return {
      allowed: true,
      status: current,
      nextLedger: ledger
    };
  }

  if (!current.allowed) {
    return {
      allowed: false,
      status: current,
      nextLedger: ledger
    };
  }

  const dayKey = current.dayKey;
  const nextUsed = current.used + 1;
  const nextLedger: DailyQuotaLedger = { ...ledger };

  for (const key of keys) {
    const prev = nextLedger[key];
    const prevUsed = prev && prev.dayKey === dayKey ? prev.used : 0;
    nextLedger[key] = {
      dayKey,
      used: Math.max(prevUsed + 1, nextUsed),
      updatedAtMs: nowMs
    };
  }

  const nextStatus = getUserDailyQuotaStatus(nextLedger, keys, nowMs, limit, false);
  return {
    allowed: true,
    status: nextStatus,
    nextLedger
  };
}

export function refundDailyPull(
  ledger: DailyQuotaLedger,
  keys: string[],
  nowMs = Date.now()
): DailyQuotaLedger {
  const dayKey = getUtcDayKey(nowMs);
  const nextLedger: DailyQuotaLedger = { ...ledger };
  for (const key of keys) {
    const entry = nextLedger[key];
    if (entry && entry.dayKey === dayKey && entry.used > 0) {
      const decremented = entry.used - 1;
      if (decremented <= 0) {
        delete nextLedger[key];
      } else {
        nextLedger[key] = {
          dayKey,
          used: decremented,
          updatedAtMs: nowMs
        };
      }
    }
  }
  return nextLedger;
}

export function evaluateMarketScope(input: {
  query: string;
  cachedAuditHit: boolean;
  isExplicitReaudit?: boolean;
  marketEntries: MarketCapEntry[];
  maxRank?: number;
}): MarketScopeResult {
  const maxRank = input.maxRank ?? MAX_CMC_RANK_SCOPE;
  const norm = normalizeMarketQuery(input.query);

  if (input.cachedAuditHit && !input.isExplicitReaudit) {
    return {
      allowed: true,
      reason: 'CACHED_ARCHIVE',
      rank: null,
      maxRank,
      matchedSymbol: null,
      matchedName: null,
      bypassesScope: true,
      audit: undefined,
      message: 'Resolved from 0-credit persistent archive.'
    };
  }

  if (!norm) {
    return {
      allowed: false,
      reason: 'EMPTY_OR_INVALID',
      rank: null,
      maxRank,
      matchedSymbol: null,
      matchedName: null,
      bypassesScope: false,
      audit: null,
      message: 'Asset query is empty or contains no alphanumeric ticker characters (0 API credits used).'
    };
  }

  // Physical metals & commodities are never bounded by cryptocurrency ranking rules
  const commodity = resolvePhysicalCommodityQuery(input.query, norm);
  if (commodity) {
    return {
      allowed: true,
      reason: 'PHYSICAL_COMMODITY',
      rank: null,
      maxRank,
      matchedSymbol: commodity.symbol,
      matchedName: commodity.name,
      bypassesScope: true,
      audit: undefined,
      message: `Physical commodity ${commodity.name} is permitted unconditionally (unbounded by crypto CMC rank).`
    };
  }

  // Sovereign fiat currencies (classified under Ecosystem / Overlays) bypass crypto CMC ranking rules
  const fiat = resolveFiatCurrencyQuery(input.query, norm);
  if (fiat) {
    return {
      allowed: true,
      reason: 'FIAT_CURRENCY',
      rank: null,
      maxRank,
      matchedSymbol: fiat.symbol,
      matchedName: fiat.name,
      bypassesScope: true,
      audit: undefined,
      message: `Fiat currency ${fiat.name} is permitted unconditionally under Ecosystem / Overlays.`
    };
  }

  let bestMatch: MarketCapEntry | null = null;
  for (const entry of input.marketEntries) {
    if (!entry || !Number.isFinite(entry.rank) || entry.rank <= 0) continue;
    const symNorm = normalizeMarketQuery(entry.symbol);
    const nameNorm = normalizeMarketQuery(entry.name);
    const idNorm = entry.id ? normalizeMarketQuery(entry.id) : '';
    if (symNorm === norm || nameNorm === norm || (idNorm && idNorm === norm)) {
      if (!bestMatch || entry.rank < bestMatch.rank) {
        bestMatch = entry;
      }
    }
  }

  return {
    allowed: true,
    reason: 'CRYPTO_NETWORK',
    rank: bestMatch ? bestMatch.rank : null,
    maxRank,
    matchedSymbol: bestMatch ? bestMatch.symbol.toUpperCase() : norm,
    matchedName: bestMatch ? bestMatch.name : input.query.trim(),
    bypassesScope: true,
    audit: undefined,
    message: bestMatch
      ? `Permitted for live audit (${bestMatch.name} • informational market rank #${bestMatch.rank}).`
      : `Permitted for live audit ("${input.query.trim()}" is not restricted by CMC rank rules).`
  };
}
