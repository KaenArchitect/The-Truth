import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attachHistoricalAuditToBaseline,
  findAnachronisticYearsInPayload,
  getHistoricalAuditHorizon,
  hasDedicatedTimelineCoverage,
  scrubResidualAnachronisticReferences
} from './historicalAuditScope.ts';
import {
  enforceEnergyArbitrageLawOnAudit,
  mergeHistoricalSnapshots,
  normalizeAuditPayload,
  type AuditData,
  type RawGeminiAuditPayload
} from './rubricSpec.ts';
import { projectAuditAtYear } from './globalTimeMachine.ts';

function makeRawFiatPayload(overrides: Partial<RawGeminiAuditPayload> = {}): RawGeminiAuditPayload {
  const longGenius1971 =
    'At the foundational layer of Existential Sovereignty and Entity Decoupling, the Canadian Dollar operates under the statutory monopoly of the Bank of Canada Act of 1934 and the Currency, Mint and Exchange Fund Act, vesting discretionary monetary base expansion in Ottawa and the Governor-in-Council. Following the April 10, 1933 suspension of domestic gold redemption and the May 31, 1970 decision to float CAD off its $0.925 USD Bretton Woods parity, commercial chartered banks create credit deposits subject to the 1967 Bank Act statutory secondary and cash reserve ratios (12% on demand deposits and 4% on notice deposits). -';

  return {
    ticker: 'CAD',
    name: 'Canadian Dollar',
    consensusFamily: 'ZERO_JOULE_BFT',
    isUpperLayerOverlayOrChannel: true,
    carrierLayerOneVelocityCap: 0,
    hasGenesisPremineOrVcOrIco: true,
    hasProtocolDevTaxOrKillSwitch: true,
    architecture:
      'Bank of Canada Statutory Fiat Ledger • Post-May 1970 Free Float • 1967 Bank Act Reserves (1971)',
    grade: 'F',
    totalScore: 0,
    certainty: 'HIGH CERTAINTY',
    conclusion:
      'Evaluating these findings through the GRADE evidence certainty framework yields a HIGH CERTAINTY rating across all six invariants (01: 0.0, 02: 0.0, 03: 0.0, 04: 0.0, 05: 0.0, 06: 0.0) as of 1971, locking the Canadian Dollar at 0.00 / 6.00 (Grade F) following the May 1970 Bretton Woods float.',
    invariants: ['01', '02', '03', '04', '05', '06'].map((id, idx) => ({
      id,
      shortName: ['Sovereignty', 'Cost Floor', 'Immutability', 'Availability', 'State Topology', 'Velocity'][idx],
      title: `Invariant ${id}`,
      telemetry: '1934 Bank of Canada Act • May 31, 1970 Float • 1967 Bank Act 12%/4% Reserves',
      score: 0,
      quickSummary: 'Unbacked central-bank & chartered-bank credit after the May 1970 float.',
      paragraph:
        'By 1971, Canada had barred domestic gold convertibility since 1933 and floated off its $0.925 USD Bretton Woods peg in May 1970, expanding chartered bank deposits under the 1967 Bank Act at zero physical energy cost. -',
      geniusParagraph: longGenius1971,
      receipts: ['Bank of Canada Act (1934)', '1967 Bank Act (12% Demand / 4% Notice)', 'May 31, 1970 CAD Float', '-']
    })),
    ...overrides
  };
}

test('getHistoricalAuditHorizon enforces strict <= 1971 cutoff and forbids 1992 Bank Act anachronisms', () => {
  const h1971 = getHistoricalAuditHorizon('1971');
  assert.equal(h1971.isHistorical, true);
  assert.equal(h1971.numericYear, 1971);
  assert.match(h1971.strictChronologyDirective, /1992 Bank Act/);
  assert.match(h1971.eraMonetaryRule, /1967 Bank Act/);
});

test('findAnachronisticYearsInPayload detects > maxYear leaks (like 1992 in 1971) and scrubResidualAnachronisticReferences removes them', () => {
  const leakedPayload = makeRawFiatPayload({
    invariants: ['01', '02', '03', '04', '05', '06'].map((id) => ({
      id,
      shortName: 'Cost Floor',
      title: `Invariant ${id}`,
      telemetry: '1967 Bank Act reserves (later phased out under the 1992 Bank Act)',
      score: 0,
      quickSummary: 'Chartered bank reserves under 1967 rules.',
      paragraph:
        'In 1971, Canadian chartered banks held 12% demand cash reserves under the 1967 Bank Act. Later in 1992, statutory reserve requirements were abolished and Lynx launched in 2021. -',
      geniusParagraph:
        'At the second physical invariant—the Thermodynamic Cost Floor (E > 0)—the Canadian Dollar in 1971 operated as an unbacked fiat credit ledger after floating off its $0.925 USD peg on May 31, 1970 under the 1967 Bank Act. In 1992, Parliament eliminated statutory reserves altogether. -',
      receipts: ['1967 Bank Act', '1992 Bank Act Zero Reserves', '-']
    }))
  });

  const leakedYears = findAnachronisticYearsInPayload(leakedPayload, 1971);
  assert.deepEqual(leakedYears, [1992, 2021]);

  const scrubbed = scrubResidualAnachronisticReferences(leakedPayload, 1971);
  assert.deepEqual(findAnachronisticYearsInPayload(scrubbed, 1971), []);
  assert.doesNotMatch(JSON.stringify(scrubbed), /\b1992\b|\b2021\b/);
  assert.match(JSON.stringify(scrubbed), /\b1967\b/);
});

test('Historical 1971 CAD normalization never leaks Present 1992 baseline or 2025 10-BPS Kaspa contrast', () => {
  const presentCadPayload = makeRawFiatPayload({
    architecture: 'Bank of Canada Fiat • 1992 Bank Act 0% Reserves • 2021 Lynx RTGS',
    invariants: ['01', '02', '03', '04', '05', '06'].map((id) => ({
      id,
      telemetry: '1992 Bank Act 0% Reserve Requirement • 2021 Payments Canada Lynx',
      score: 0,
      paragraph:
        'Under the 1992 Bank Act, Canada eliminated statutory bank reserve requirements and clears via the 2021 Lynx system at zero joules of Proof-of-Work. -',
      geniusParagraph:
        'Under the 1992 Bank Act, Canada eliminated statutory fractional reserve minimums completely, allowing commercial banks to expand CAD deposits via zero-joule balance sheet entries settled over Payments Canada Lynx (2021) and formerly LVTS (1999), with emergency account freezes demonstrated in 2022. '.repeat(
          2
        ) + '-',
      receipts: ['1992 Bank Act (0% Reserves)', 'Payments Canada Lynx (2021)', '-']
    }))
  });
  const presentCadAudit: AuditData = normalizeAuditPayload(
    presentCadPayload,
    'CAD',
    'CAD',
    null,
    [],
    null,
    false,
    { timelineYear: 'PRESENT' }
  );

  const horizon1971 = getHistoricalAuditHorizon('1971');
  const raw1971Cad = makeRawFiatPayload();
  const audit1971Cad = normalizeAuditPayload(
    raw1971Cad,
    'CAD',
    'CAD',
    presentCadAudit,
    [],
    null,
    false,
    {
      timelineYear: '1971',
      contemporaryVelocityContrast: horizon1971.contemporaryVelocityContrast
    }
  );

  // Zero 1992 / 1999 / 2021 / Kaspa anachronisms in the 1971 audit
  assert.deepEqual(findAnachronisticYearsInPayload(audit1971Cad, 1971), []);
  assert.doesNotMatch(JSON.stringify(audit1971Cad), /\b1992\b|\b1999\b|\b2021\b|Kaspa/i);

  // Merging 1971 CAD onto Present CAD keeps BOTH epochs cleanly separated
  const mergedRoot = attachHistoricalAuditToBaseline(presentCadAudit, audit1971Cad, '1971');
  assert.equal(hasDedicatedTimelineCoverage(mergedRoot, 'PRESENT'), true);
  assert.equal(hasDedicatedTimelineCoverage(mergedRoot, '1971'), true);
  assert.equal(hasDedicatedTimelineCoverage(mergedRoot, '1913'), false);

  const projectedPresent = projectAuditAtYear(mergedRoot, 'PRESENT');
  assert.ok(projectedPresent);
  assert.match(JSON.stringify(projectedPresent.invariants), /1992 Bank Act/);

  const projected1971 = projectAuditAtYear(mergedRoot, '1971');
  assert.ok(projected1971);
  assert.match(JSON.stringify(projected1971.invariants), /1967 Bank Act/);
  assert.doesNotMatch(JSON.stringify(projected1971.invariants), /\b1992\b|Lynx|Kaspa/i);
  assert.doesNotMatch((projected1971.geniusParagraphs || []).join(' '), /\b1992\b|Kaspa/i);
});

test('1913 specie-backed sovereign currency (CAD 1910 Currency Act $20.67/oz gold parity) preserves E > 0 capped at Grade D/D+', () => {
  const raw1913Cad = makeRawFiatPayload({
    consensusFamily: 'LINEAR_POW',
    architecture: 'Currency Act of 1910 & Dominion Notes Act • $20.67/oz Gold Specie Redeemability (1913)',
    invariants: [
      { id: '01', score: 0.0, telemetry: 'Dominion Notes statutory monopoly', paragraph: 'State issuance monopoly in 1913 under the Dominion Notes Act with 25%–100% statutory gold reserve tiers. -', geniusParagraph: 'A'.repeat(340) + ' -', receipts: ['Currency Act (1910)', '-'] },
      { id: '02', score: 0.28, telemetry: '$20.67/oz sovereign gold coin parity', paragraph: 'Citizens could redeem Dominion Notes on demand for physical gold sovereigns and $5/$10 Canadian gold coins at 23.22 grains fine gold per dollar. -', geniusParagraph: 'B'.repeat(340) + ' -', receipts: ['Dominion Notes Act Gold Reserve', '-'] },
      { id: '03', score: 0.5, telemetry: 'Statutory gold weight parity since 1858/1871', paragraph: 'Unbroken statutory gold convertibility up through 1913 anchored historical purchasing power. -', geniusParagraph: 'C'.repeat(340) + ' -', receipts: ['Uniform Currency Act (1871)', '-'] },
      { id: '04', score: 0.45, telemetry: 'Physical gold coin bearer settlement + paper clearinghouses', paragraph: 'Physical gold coins circulated peer-to-peer during telegraph outages while paper bank notes relied on regional clearinghouses. -', geniusParagraph: 'D'.repeat(340) + ' -', receipts: ['Canadian Bankers Association (1900)', '-'] },
      { id: '05', score: 0.35, telemetry: 'Bearer coin + chartered bank note ledger', paragraph: 'Gold specie settled as bearer mass alongside commercial bank notes under the 1913 Bank Act decennial revision. -', geniusParagraph: 'E'.repeat(340) + ' -', receipts: ['Bank Act (1913)', '-'] },
      { id: '06', score: 0.1, telemetry: 'Rail & steamer bullion settlement', paragraph: 'Inter-city clearing settled net balances in Dominion Notes and physical gold rail shipments. -', geniusParagraph: 'F'.repeat(340) + ' -', receipts: ['Montreal/Toronto Clearinghouse (1913)', '-'] }
    ]
  });

  const normalized1913 = normalizeAuditPayload(
    raw1913Cad,
    'CAD',
    'CAD',
    null,
    [],
    null,
    false,
    { timelineYear: '1913' }
  );
  const enforced1913 = enforceEnergyArbitrageLawOnAudit(normalized1913);

  assert.equal(enforced1913.consensusFamily, 'ENERGY_ARBITRAGED_POW');
  assert.equal(enforced1913.invariants[0].score, 0);
  assert.equal(enforced1913.invariants[1].score, 0.28);
  assert.equal(enforced1913.totalScore, 1.68);
  assert.equal(enforced1913.grade, 'D-');
});

test('mergeHistoricalSnapshots unions non-overlapping epochs in chronological order without dropping prior stops', () => {
  const cad1913 = normalizeAuditPayload(makeRawFiatPayload({ architecture: '1913 Specie' }), 'CAD', 'CAD', null, [], null, false, { timelineYear: '1913' });
  const cad1971 = normalizeAuditPayload(makeRawFiatPayload({ architecture: '1971 Float' }), 'CAD', 'CAD', null, [], null, false, { timelineYear: '1971' });
  const cadPresent = normalizeAuditPayload(makeRawFiatPayload({ architecture: '2026 Live' }), 'CAD', 'CAD', null, [], null, false, { timelineYear: 'PRESENT' });

  const step1 = attachHistoricalAuditToBaseline(null, cad1971, '1971');
  assert.equal(hasDedicatedTimelineCoverage(step1, '1971'), true);
  assert.equal(hasDedicatedTimelineCoverage(step1, 'PRESENT'), false);

  const step2 = attachHistoricalAuditToBaseline(step1, cad1913, '1913');
  assert.equal(hasDedicatedTimelineCoverage(step2, '1913'), true);
  assert.equal(hasDedicatedTimelineCoverage(step2, '1971'), true);

  const step3 = attachHistoricalAuditToBaseline(step2, cadPresent, 'PRESENT');
  assert.equal(hasDedicatedTimelineCoverage(step3, '1913'), true);
  assert.equal(hasDedicatedTimelineCoverage(step3, '1971'), true);
  assert.equal(hasDedicatedTimelineCoverage(step3, 'PRESENT'), true);

  const epochIds = (step3.historicalSnapshots || []).map((s) => s.epochId);
  assert.deepEqual(epochIds, ['tm-1913', 'tm-1971', 'tm-present']);

  // Merging again with an extra epoch preserves all existing epochs
  const extraMerged = mergeHistoricalSnapshots(step3.historicalSnapshots, step2.historicalSnapshots);
  assert.deepEqual((extraMerged || []).map((s) => s.epochId), ['tm-1913', 'tm-1971', 'tm-present']);
});
