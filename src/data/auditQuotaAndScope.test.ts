import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_NEW_FULL_PULL_LIMIT,
  STATIC_TOP_150_FALLBACK_ENTRIES,
  consumeDailyPull,
  evaluateMarketScope,
  getUserDailyQuotaStatus,
  refundDailyPull,
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
