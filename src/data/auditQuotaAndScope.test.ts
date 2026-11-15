import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_NEW_FULL_PULL_LIMIT,
  MAX_CMC_RANK_SCOPE,
  STATIC_TOP_150_FALLBACK_ENTRIES,
  consumeDailyPull,
  evaluateMarketScope,
  getUtcDayKey,
  getUserDailyQuotaStatus,
  pruneStaleQuotaDays,
  refundDailyPull,
  resolveQuotaPrincipalKeys,
  type DailyQuotaLedger,
  type MarketCapEntry
} from './auditQuotaAndScope.ts';

test('enforces hard daily limit of 2 new full pulls per user per UTC day and resets next day', () => {
  const day1Noon = Date.parse('2026-11-14T12:00:00Z');
  const day2Start = Date.parse('2026-11-15T00:01:00Z');

  const principal = resolveQuotaPrincipalKeys({
    userId: null,
    clientId: 'browser-abc',
    ip: '203.0.113.10'
  });

  let ledger: DailyQuotaLedger = {};

  const initial = getUserDailyQuotaStatus(ledger, principal.allKeys, day1Noon);
  assert.equal(initial.limit, DAILY_NEW_FULL_PULL_LIMIT);
  assert.equal(initial.used, 0);
  assert.equal(initial.remaining, 2);
  assert.equal(initial.allowed, true);

  // Pull 1
  const p1 = consumeDailyPull(ledger, principal.allKeys, day1Noon);
  assert.equal(p1.allowed, true);
  assert.equal(p1.status.used, 1);
  assert.equal(p1.status.remaining, 1);
  ledger = p1.nextLedger;

  // Pull 2
  const p2 = consumeDailyPull(ledger, principal.allKeys, day1Noon + 5000);
  assert.equal(p2.allowed, true);
  assert.equal(p2.status.used, 2);
  assert.equal(p2.status.remaining, 0);
  assert.equal(p2.status.allowed, false);
  ledger = p2.nextLedger;

  // Pull 3 on same day MUST be rejected and NOT increment usage
  const p3 = consumeDailyPull(ledger, principal.allKeys, day1Noon + 10000);
  assert.equal(p3.allowed, false);
  assert.equal(p3.status.used, 2);
  assert.equal(p3.status.remaining, 0);

  // Clearing clientId / incognito from the same IP still cannot bypass IP cap on same day
  const incognitoSameIp = resolveQuotaPrincipalKeys({
    userId: null,
    clientId: 'brand-new-incognito-id',
    ip: '203.0.113.10'
  });
  const incognitoAttempt = consumeDailyPull(ledger, incognitoSameIp.allKeys, day1Noon + 20000);
  assert.equal(incognitoAttempt.allowed, false);
  assert.equal(incognitoAttempt.status.remaining, 0);

  // Next UTC day resets back to 2/2 remaining
  const nextDayStatus = getUserDailyQuotaStatus(ledger, principal.allKeys, day2Start);
  assert.equal(nextDayStatus.dayKey, getUtcDayKey(day2Start));
  assert.equal(nextDayStatus.used, 0);
  assert.equal(nextDayStatus.remaining, 2);
  assert.equal(nextDayStatus.allowed, true);

  // Stale pruning drops previous day entries cleanly
  const pruned = pruneStaleQuotaDays(ledger, day2Start);
  assert.deepEqual(pruned, {});
});

test('refundDailyPull restores quota cleanly when an upstream call errors before delivering', () => {
  const now = Date.parse('2026-11-14T15:00:00Z');
  const keys = resolveQuotaPrincipalKeys({ userId: 'user-42', clientId: 'c1', ip: '1.2.3.4' }).allKeys;

  const first = consumeDailyPull({}, keys, now);
  assert.equal(first.status.remaining, 1);

  const refunded = refundDailyPull(first.nextLedger, keys, now + 1000);
  const afterRefund = getUserDailyQuotaStatus(refunded, keys, now + 1000);
  assert.equal(afterRefund.used, 0);
  assert.equal(afterRefund.remaining, 2);
});

test('evaluateMarketScope strictly gates crypto to CMC Top 150 and returns null outside range', () => {
  const sampleFeed: MarketCapEntry[] = [
    ...STATIC_TOP_150_FALLBACK_ENTRIES,
    { rank: 150, symbol: 'EDGE150', name: 'Edge Hundred Fifty', id: 'edge-150' },
    { rank: 151, symbol: 'OUT151', name: 'Outside Hundred Fifty One', id: 'out-151' },
    { rank: 420, symbol: 'MEME420', name: 'Micro Meme', id: 'micro-meme' }
  ];

  // Rank #1 allowed
  const btc = evaluateMarketScope({
    query: 'btc',
    cachedAuditHit: false,
    marketEntries: sampleFeed
  });
  assert.equal(btc.allowed, true);
  assert.equal(btc.reason, 'TOP_150_CMC');
  assert.equal(btc.rank, 1);

  // Rank #150 inclusive boundary allowed
  const edge = evaluateMarketScope({
    query: 'EDGE150',
    cachedAuditHit: false,
    marketEntries: sampleFeed
  });
  assert.equal(edge.allowed, true);
  assert.equal(edge.rank, MAX_CMC_RANK_SCOPE);

  // Rank #151 rejected -> returns audit: null
  const out151 = evaluateMarketScope({
    query: '$out151',
    cachedAuditHit: false,
    marketEntries: sampleFeed
  });
  assert.equal(out151.allowed, false);
  assert.equal(out151.reason, 'OUTSIDE_TOP_150');
  assert.equal(out151.rank, 151);
  assert.equal(out151.audit, null);

  // Rank #420 matched by name -> rejected with audit: null
  const meme = evaluateMarketScope({
    query: 'Micro Meme',
    cachedAuditHit: false,
    marketEntries: sampleFeed
  });
  assert.equal(meme.allowed, false);
  assert.equal(meme.reason, 'OUTSIDE_TOP_150');
  assert.equal(meme.rank, 420);
  assert.equal(meme.audit, null);

  // Completely unknown/unranked coin -> rejected with audit: null
  const unknown = evaluateMarketScope({
    query: 'TINYMICROCAP999',
    cachedAuditHit: false,
    marketEntries: sampleFeed
  });
  assert.equal(unknown.allowed, false);
  assert.equal(unknown.reason, 'UNRANKED_OR_OUTSIDE_TOP_150');
  assert.equal(unknown.rank, null);
  assert.equal(unknown.audit, null);

  // Physical commodities remain permitted
  const platinum = evaluateMarketScope({
    query: 'PLATINUM',
    cachedAuditHit: false,
    marketEntries: sampleFeed
  });
  assert.equal(platinum.allowed, true);
  assert.equal(platinum.reason, 'PHYSICAL_COMMODITY');

  // Cached archive lookups always bypass scope & cost 0 credits
  const cachedIgra = evaluateMarketScope({
    query: 'IGRA',
    cachedAuditHit: true,
    marketEntries: sampleFeed
  });
  assert.equal(cachedIgra.allowed, true);
  assert.equal(cachedIgra.reason, 'CACHED_ARCHIVE');
});
