import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_NEW_FULL_PULL_LIMIT,
  STATIC_TOP_150_FALLBACK_ENTRIES,
  consumeDailyPull,
  evaluateMarketScope,
  getUserDailyQuotaStatus,
  refundDailyPull,
  resolvePhysicalCommodityQuery,
  resolveQuotaPrincipalKeys,
  type MarketCapEntry
} from './auditQuotaAndScope.ts';

const SAMPLE_ENTRIES: MarketCapEntry[] = [
  ...STATIC_TOP_150_FALLBACK_ENTRIES,
  { rank: 150, symbol: 'TOP150', name: 'Rank 150 Boundary Token' },
  { rank: 151, symbol: 'OUT151', name: 'Rank 151 Asset' },
  { rank: 420, symbol: 'MEME420', name: 'Low Cap Network' }
];

test('Physical commodities and metals bypass all CMC crypto ranking rules', () => {
  for (const q of [
    'GOLD',
    'Silver',
    'XAU',
    'XAG',
    'platinum',
    'Copper',
    'Uranium',
    'Titanium',
    'Tungsten',
    'Physical Gold',
    'Iridium'
  ]) {
    const res = evaluateMarketScope({
      query: q,
      cachedAuditHit: false,
      marketEntries: SAMPLE_ENTRIES
    });
    assert.equal(res.allowed, true, `Expected ${q} to be allowed unconditionally`);
    assert.equal(res.reason, 'PHYSICAL_COMMODITY');
    assert.equal(res.bypassesScope, true);
  }
});

test('Non-CMC, unranked, L2 overlay, and rank > 150 crypto networks are NOT blocked by Top-150 CMC rule', () => {
  const rank151 = evaluateMarketScope({
    query: 'OUT151',
    cachedAuditHit: false,
    marketEntries: SAMPLE_ENTRIES
  });
  assert.equal(rank151.allowed, true);
  assert.equal(rank151.reason, 'CRYPTO_NETWORK');
  assert.equal(rank151.rank, 151);

  const rank420 = evaluateMarketScope({
    query: 'MEME420',
    cachedAuditHit: false,
    marketEntries: SAMPLE_ENTRIES
  });
  assert.equal(rank420.allowed, true);
  assert.equal(rank420.rank, 420);

  for (const net of ['ERG', 'ALPH', 'NEXA', 'LN', 'IGRA', 'FEDIMINT', 'CASHU', 'MONERO', 'KAS']) {
    const res = evaluateMarketScope({
      query: net,
      cachedAuditHit: false,
      marketEntries: SAMPLE_ENTRIES
    });
    assert.equal(res.allowed, true, `Expected network ${net} to be allowed`);
  }
});

test('Empty or symbol-only queries return null safely without consuming credits', () => {
  const empty = evaluateMarketScope({
    query: '   !!!   ',
    cachedAuditHit: false,
    marketEntries: SAMPLE_ENTRIES
  });
  assert.equal(empty.allowed, false);
  assert.equal(empty.reason, 'EMPTY_OR_INVALID');
  assert.equal(empty.audit, null);
});

test('Cached archive hits bypass scope even for explicit re-audit gating checks', () => {
  const cached = evaluateMarketScope({
    query: 'DOGECOINEXOTIC',
    cachedAuditHit: true,
    isExplicitReaudit: false,
    marketEntries: SAMPLE_ENTRIES
  });
  assert.equal(cached.allowed, true);
  assert.equal(cached.reason, 'CACHED_ARCHIVE');
});

test('Daily quota strictly enforces 2 new full pulls per user per UTC day and resets at UTC midnight', () => {
  const t0 = Date.UTC(2026, 10, 15, 14, 30, 0);
  const principal = resolveQuotaPrincipalKeys({
    userId: 'user-abc-123',
    clientId: 'browser-xyz',
    ip: '198.51.100.42'
  });

  let ledger = {};
  const s0 = getUserDailyQuotaStatus(ledger, principal.allKeys, t0);
  assert.equal(s0.limit, DAILY_NEW_FULL_PULL_LIMIT);
  assert.equal(s0.remaining, 2);
  assert.equal(s0.allowed, true);

  const pull1 = consumeDailyPull(ledger, principal.allKeys, t0);
  assert.equal(pull1.allowed, true);
  assert.equal(pull1.status.used, 1);
  assert.equal(pull1.status.remaining, 1);
  ledger = pull1.nextLedger;

  const pull2 = consumeDailyPull(ledger, principal.allKeys, t0 + 60_000);
  assert.equal(pull2.allowed, true);
  assert.equal(pull2.status.used, 2);
  assert.equal(pull2.status.remaining, 0);
  ledger = pull2.nextLedger;

  const pull3 = consumeDailyPull(ledger, principal.allKeys, t0 + 120_000);
  assert.equal(pull3.allowed, false);

  const nextDayUtc = Date.UTC(2026, 10, 16, 0, 0, 5);
  const pullNextDay = consumeDailyPull(ledger, principal.allKeys, nextDayUtc);
  assert.equal(pullNextDay.allowed, true);
  assert.equal(pullNextDay.status.used, 1);
});

test('Refunding daily pull restores slot if upstream audit fails before delivery', () => {
  const t0 = Date.UTC(2026, 10, 15, 18, 0, 0);
  const principal = resolveQuotaPrincipalKeys({ ip: '203.0.113.9' });
  const pull1 = consumeDailyPull({}, principal.allKeys, t0);
  const refunded = refundDailyPull(pull1.nextLedger, principal.allKeys, t0 + 5000);
  const afterRefund = getUserDailyQuotaStatus(refunded, principal.allKeys, t0 + 6000);
  assert.equal(afterRefund.used, 0);
  assert.equal(afterRefund.remaining, 2);
});

test('Elemental metal symbols like CU, XCU, PT, PD, TI, RH, AU, AG resolve cleanly to Layer-1 physical commodities', () => {
  for (const sym of ['CU', 'cu', 'XCU', 'PT', 'PD', 'TI', 'RH', 'AU', 'AG', 'NI', 'FE', 'PB']) {
    const res = evaluateMarketScope({
      query: sym,
      cachedAuditHit: false,
      marketEntries: SAMPLE_ENTRIES
    });
    assert.equal(res.allowed, true, `Expected metal symbol ${sym} allowed`);
    assert.equal(res.reason, 'PHYSICAL_COMMODITY', `Expected ${sym} reason PHYSICAL_COMMODITY`);
    assert.ok(res.matchedName && res.matchedName.length > 0);
  }
});

test('Physical commodities always map to short canonical elemental/ISO tickers', () => {
  assert.equal(resolvePhysicalCommodityQuery('copper')?.symbol, 'CU');
  assert.equal(resolvePhysicalCommodityQuery('Gold')?.symbol, 'XAU');
  assert.equal(resolvePhysicalCommodityQuery('SILVER')?.symbol, 'XAG');
  assert.equal(resolvePhysicalCommodityQuery('platinum')?.symbol, 'XPT');
  assert.equal(resolvePhysicalCommodityQuery('Palladium')?.symbol, 'XPD');
  assert.equal(resolvePhysicalCommodityQuery('Uranium')?.symbol, 'U3O8');
  assert.equal(resolvePhysicalCommodityQuery('Lithium')?.symbol, 'LI');
});

test('Verified admin user gets unlimited audit pulls without consuming or being blocked by daily quota', () => {
  const t0 = Date.UTC(2026, 10, 15, 19, 0, 0);
  const principal = resolveQuotaPrincipalKeys({
    userId: 'admin-bardazon-uid',
    clientId: 'browser-xyz',
    ip: '198.51.100.42'
  });

  // Exhaust 2/2 quota on the same IP/browser before signing in as admin
  let ledger = {};
  ledger = consumeDailyPull(ledger, ['ip:198.51.100.42', 'client:browser-xyz'], t0).nextLedger;
  ledger = consumeDailyPull(ledger, ['ip:198.51.100.42', 'client:browser-xyz'], t0 + 1000).nextLedger;

  const nonAdminStatus = getUserDailyQuotaStatus(ledger, principal.allKeys, t0 + 2000, 2, false);
  assert.equal(nonAdminStatus.allowed, false);
  assert.equal(nonAdminStatus.unlimited, false);

  // Admin status & consumption bypasses limit cleanly and leaves ledger unchanged
  const adminStatus = getUserDailyQuotaStatus(ledger, principal.allKeys, t0 + 2000, 2, true);
  assert.equal(adminStatus.allowed, true);
  assert.equal(adminStatus.unlimited, true);
  assert.equal(adminStatus.isAdmin, true);

  for (let i = 0; i < 10; i++) {
    const attempt = consumeDailyPull(ledger, principal.allKeys, t0 + 3000 + i * 100, 2, true);
    assert.equal(attempt.allowed, true);
    assert.equal(attempt.status.unlimited, true);
    assert.equal(attempt.status.isAdmin, true);
    assert.equal(attempt.nextLedger, ledger);
  }
});

test('Fiat currencies resolve to FIAT_CURRENCY without misclassifying stablecoins, metals, or colliding crypto tickers', () => {
  for (const q of [
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'CHF',
    'CNY',
    'US Dollar',
    'British Pound',
    'Japanese Yen',
    'Turkish Lira',
    'Argentine Peso',
    'fiat USD'
  ]) {
    const res = evaluateMarketScope({
      query: q,
      cachedAuditHit: false,
      marketEntries: SAMPLE_ENTRIES
    });
    assert.equal(res.allowed, true, `Expected fiat query ${q} allowed`);
    assert.equal(res.reason, 'FIAT_CURRENCY', `Expected ${q} to resolve as FIAT_CURRENCY`);
    assert.equal(res.bypassesScope, true);
  }

  for (const cryptoQuery of ['USDC', 'USDT', 'USD Coin', 'Tether', 'DAI', 'SOL', 'AR', 'S', 'OP']) {
    const res = evaluateMarketScope({
      query: cryptoQuery,
      cachedAuditHit: false,
      marketEntries: SAMPLE_ENTRIES
    });
    assert.equal(res.allowed, true);
    assert.equal(res.reason, 'CRYPTO_NETWORK', `Expected ${cryptoQuery} to remain CRYPTO_NETWORK`);
  }

  for (const metalQuery of ['GOLD', 'XAU', 'XAG', 'CU', 'PT', 'W']) {
    const res = evaluateMarketScope({
      query: metalQuery,
      cachedAuditHit: false,
      marketEntries: SAMPLE_ENTRIES
    });
    assert.equal(res.reason, 'PHYSICAL_COMMODITY', `Expected ${metalQuery} to remain PHYSICAL_COMMODITY`);
  }
});


