import assert from 'node:assert/strict';
import test from 'node:test';
import { PRELOADED_AUDITS } from './preloadedAudits.ts';
import { sortAuditTickersByGrade } from './rubricSpec.ts';
import {
  GLOBAL_TIMELINE_STOPS,
  parseGlobalTimelineYear,
  projectAuditAtYear,
  projectAuditsCollectionAtYear,
  resolveEarliestTimelineStopForAsset
} from './globalTimeMachine.ts';

test('GLOBAL_TIMELINE_STOPS spans 1913, 1971, 2000, 2008, 2016, 2020, 2024, and Present', () => {
  assert.deepEqual(
    GLOBAL_TIMELINE_STOPS.map((s) => s.id),
    ['1913', '1971', '2000', '2008', '2016', '2020', '2024', 'PRESENT']
  );
  assert.deepEqual(
    GLOBAL_TIMELINE_STOPS.map((s) => s.buttonLabel),
    ['1913', '1971', '2000', '2008', '2016', '2020', '2024', 'Present']
  );
  for (const yr of ['1913', '1971', '2000', '2008', '2016', '2020', '2024'] as const) {
    assert.equal(parseGlobalTimelineYear(yr), yr);
  }
  assert.equal(parseGlobalTimelineYear('1920'), '1913');
  assert.equal(parseGlobalTimelineYear('1960'), '1971');
  assert.equal(parseGlobalTimelineYear('present'), 'PRESENT');
  assert.equal(parseGlobalTimelineYear(null), 'PRESENT');
  for (const stop of GLOBAL_TIMELINE_STOPS) {
    assert.ok(stop.epochTitle.length > 10, `${stop.id} must define epochTitle`);
    assert.ok(stop.frontierSummary.length > 15, `${stop.id} must define frontierSummary`);
    assert.ok(stop.significance.length > 60, `${stop.id} must define significance`);
  }
});

test('USD transitions from Pre-Fed Specie (D in 1913) -> Bretton Woods Terminal Window (D- in 1971) -> Post-Bretton Woods Unbacked Fiat (F VOID in 2000+)', () => {
  const usd1913 = projectAuditAtYear(PRELOADED_AUDITS.USD, '1913');
  const usd1971 = projectAuditAtYear(PRELOADED_AUDITS.USD, '1971');
  const usd2000 = projectAuditAtYear(PRELOADED_AUDITS.USD, '2000');
  const usd2008 = projectAuditAtYear(PRELOADED_AUDITS.USD, '2008');
  const usdPresent = projectAuditAtYear(PRELOADED_AUDITS.USD, 'PRESENT');

  assert.ok(usd1913 && usd1971 && usd2000 && usd2008 && usdPresent);
  assert.equal(usd1913.grade, 'D');
  assert.equal(usd1913.totalScore, 1.8);
  assert.equal(usd1913.consensusFamily, 'ENERGY_ARBITRAGED_POW');

  assert.equal(usd1971.grade, 'D-');
  assert.equal(usd1971.totalScore, 1.1);
  assert.equal(usd1971.consensusFamily, 'ENERGY_ARBITRAGED_POW');

  assert.equal(usd2000.grade, 'F');
  assert.equal(usd2000.totalScore, 0);
  assert.equal(usd2000.invariants[3].status, 'VOID_UNANCHORED');

  assert.equal(usd2008.grade, 'F');
  assert.equal(usdPresent.grade, 'F');
});

test('projectAuditsCollectionAtYear filters pre-genesis assets accurately across 1913 -> Present and births Bitcoin in 2008', () => {
  const presentMap = projectAuditsCollectionAtYear(PRELOADED_AUDITS, 'PRESENT');
  assert.equal(presentMap, PRELOADED_AUDITS);

  for (const preCryptoYr of ['1913', '1971', '2000'] as const) {
    const map = projectAuditsCollectionAtYear(PRELOADED_AUDITS, preCryptoYr);
    assert.ok(map.XAU, `XAU existed in ${preCryptoYr}`);
    assert.ok(map.XAG, `XAG existed in ${preCryptoYr}`);
    assert.ok(map.USD, `USD existed in ${preCryptoYr}`);
    assert.equal(map.BTC, undefined, `BTC did not exist yet in ${preCryptoYr}`);
    assert.equal(map.ETH, undefined, `ETH did not exist yet in ${preCryptoYr}`);
  }

  const y2008 = projectAuditsCollectionAtYear(PRELOADED_AUDITS, '2008');
  assert.ok(y2008.BTC, 'BTC born in 2008');
  assert.equal(y2008.BTC.totalScore, 6.0);
  assert.equal(y2008.BTC.grade, 'A+');
  assert.equal(y2008.LTC, undefined, 'LTC did not launch until 2011');
  assert.equal(y2008.ETH, undefined, 'ETH did not launch until 2015');

  const y2016 = projectAuditsCollectionAtYear(PRELOADED_AUDITS, '2016');
  assert.ok(y2016.BTC, 'BTC existed in 2016');
  assert.ok(y2016.ETH, 'ETH existed in 2016');
  assert.ok(y2016.LTC, 'LTC existed in 2016');
  assert.ok(y2016.ZEC, 'ZEC launched Oct 2016');
  assert.equal(y2016.BCH, undefined, 'BCH did not fork until Aug 2017');
  assert.equal(y2016.SOL, undefined, 'SOL did not launch until 2020');
  assert.equal(y2016.KAS, undefined, 'KAS did not launch until Nov 2021');

  const y2020 = projectAuditsCollectionAtYear(PRELOADED_AUDITS, '2020');
  assert.ok(y2020.BCH, 'BCH existed by 2020');
  assert.ok(y2020.SOL, 'SOL launched in 2020');
  assert.ok(y2020.ADA, 'ADA existed by 2020');
  assert.equal(y2020.KAS, undefined, 'KAS did not launch until Nov 2021');
  assert.equal(y2020.SUI, undefined, 'SUI did not launch until May 2023');

  const y2024 = projectAuditsCollectionAtYear(PRELOADED_AUDITS, '2024');
  assert.ok(y2024.KAS, 'KAS existed by 2024');
  assert.ok(y2024.SUI, 'SUI existed by 2024');
  assert.ok(y2024.GEEK, 'GEEK launched in June 2024');
  assert.equal(y2024.IGRA, undefined, 'IGRA launched after 2024');
});

test('Ethereum transitions from E > 0 PoW (D+ in Passed) in 2016 & 2020 to E = 0 PoS (F VOID in Failed) in 2024 & Present', () => {
  const eth2016 = projectAuditAtYear(PRELOADED_AUDITS.ETH, '2016');
  const eth2020 = projectAuditAtYear(PRELOADED_AUDITS.ETH, '2020');
  const eth2024 = projectAuditAtYear(PRELOADED_AUDITS.ETH, '2024');
  const ethPresent = projectAuditAtYear(PRELOADED_AUDITS.ETH, 'PRESENT');

  assert.ok(eth2016 && eth2020 && eth2024 && ethPresent);
  assert.equal(eth2016.grade, 'D+');
  assert.ok(eth2016.totalScore > 1.0);
  assert.equal(eth2016.consensusFamily, 'ENERGY_ARBITRAGED_POW');

  assert.equal(eth2020.grade, 'D+');
  assert.equal(eth2020.totalScore, 1.65);
  assert.equal(eth2020.consensusFamily, 'ENERGY_ARBITRAGED_POW');

  assert.equal(eth2024.grade, 'F');
  assert.equal(eth2024.totalScore, 0);
  assert.equal(eth2024.invariants[3].status, 'VOID_UNANCHORED');
  assert.equal(ethPresent.grade, 'F');
});

test('Dynamic Pareto-Frontier leader shifts from XAU (1913/1971/2000) -> BTC (2008/2016/2020) -> KAS (2024/Present)', () => {
  const y1913 = projectAuditsCollectionAtYear(PRELOADED_AUDITS, '1913');
  const y1971 = projectAuditsCollectionAtYear(PRELOADED_AUDITS, '1971');
  const y2000 = projectAuditsCollectionAtYear(PRELOADED_AUDITS, '2000');
  const y2008 = projectAuditsCollectionAtYear(PRELOADED_AUDITS, '2008');
  const y2016 = projectAuditsCollectionAtYear(PRELOADED_AUDITS, '2016');
  const y2020 = projectAuditsCollectionAtYear(PRELOADED_AUDITS, '2020');
  const y2024 = projectAuditsCollectionAtYear(PRELOADED_AUDITS, '2024');

  assert.equal(sortAuditTickersByGrade(y1913)[0], 'XAU');
  assert.equal(y1913.XAU.totalScore, 4.55);
  assert.equal(sortAuditTickersByGrade(y1971)[0], 'XAU');
  assert.equal(y1971.XAU.totalScore, 4.45);
  assert.equal(sortAuditTickersByGrade(y2000)[0], 'XAU');
  assert.equal(y2000.XAU.totalScore, 4.4);

  assert.equal(sortAuditTickersByGrade(y2008)[0], 'BTC');
  assert.equal(y2008.BTC.totalScore, 6.0);
  assert.equal(y2008.BTC.grade, 'A+');

  assert.equal(sortAuditTickersByGrade(y2016)[0], 'BTC');
  assert.equal(y2016.BTC.totalScore, 5.25);
  assert.equal(y2016.BTC.grade, 'A-');

  assert.equal(sortAuditTickersByGrade(y2020)[0], 'BTC');
  assert.equal(y2020.BTC.totalScore, 5.0);
  assert.equal(y2020.BTC.grade, 'A-');

  assert.equal(sortAuditTickersByGrade(y2024)[0], 'KAS');
  assert.equal(y2024.KAS.totalScore, 5.75);
  assert.equal(y2024.KAS.grade, 'A');
  assert.equal(y2024.BCH.invariants[4].score, 1.0, 'BCH held 1.00 covenant topology apex in 2024');

  assert.equal(resolveEarliestTimelineStopForAsset('XAU', PRELOADED_AUDITS.XAU), '1913');
  assert.equal(resolveEarliestTimelineStopForAsset('USD', PRELOADED_AUDITS.USD), '1913');
  assert.equal(resolveEarliestTimelineStopForAsset('BTC', PRELOADED_AUDITS.BTC), '2008');
  assert.equal(resolveEarliestTimelineStopForAsset('LTC', PRELOADED_AUDITS.LTC), '2016');
  assert.equal(resolveEarliestTimelineStopForAsset('SOL', PRELOADED_AUDITS.SOL), '2020');
  assert.equal(resolveEarliestTimelineStopForAsset('KAS', PRELOADED_AUDITS.KAS), '2024');
  assert.equal(resolveEarliestTimelineStopForAsset('IGRA', PRELOADED_AUDITS.IGRA), 'PRESENT');
});

test('Genius prose strictly exceeds Normie prose across all projected assets in all 7 historical epochs', () => {
  for (const yr of ['1913', '1971', '2000', '2008', '2016', '2020', '2024'] as const) {
    const projected = projectAuditsCollectionAtYear(PRELOADED_AUDITS, yr);
    for (const [tk, audit] of Object.entries(projected)) {
      assert.equal(
        audit.geniusParagraphs?.length,
        6,
        `${tk} at ${yr} must have 6-paragraph Genius essay`
      );
      for (const inv of audit.invariants) {
        assert.ok(
          (inv.geniusParagraph?.length ?? 0) > inv.paragraph.length + 100,
          `${tk} Inv ${inv.id} at ${yr}: Genius (${inv.geniusParagraph?.length}) must exceed Normie (${inv.paragraph.length})`
        );
      }
    }
  }
});
