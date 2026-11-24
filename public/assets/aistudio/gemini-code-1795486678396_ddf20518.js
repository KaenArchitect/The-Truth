/**
 * Enforces p = m * v in pure JavaScript (zero TypeScript types):
 * 1. Gate 1 (E = 0): Inv 02 <= 0 => Inv 04-06 become VOID_UNANCHORED (score: null), Total = 0.00 (Grade F).
 * 2. Gate 2 (Premine / Coinbase Tax): Inv 01 === 0 with E > 0 => Inv 02 clamped <= 0.35, Grade capped at D+.
 */
export function evaluateThermodynamicGate(snapshot) {
  const inv01 = snapshot.invariants['01'];
  const inv02 = snapshot.invariants['02'];

  // Gate 1: Conservation of Energy Floor (E = 0)
  if (!inv02 || !inv02.score || inv02.score <= 0) {
    const voided = { ...snapshot.invariants };
    ['04', '05', '06'].forEach((key) => {
      if (voided[key]) {
        voided[key] = {
          ...voided[key],
          status: 'VOID_UNANCHORED',
          score: null,
        };
      }
    });

    return {
      ...snapshot,
      foundationalMassValid: false,
      totalScore: 0.0,
      terminalGrade: 'F',
      invariants: voided,
    };
  }

  // Gate 2: Sovereignty-Compromise & Energy-Arbitrage Law
  const inv01Score = inv01 && typeof inv01.score === 'number' ? inv01.score : 0;
  const inv02Score = typeof inv02.score === 'number' ? inv02.score : 0;
  const arbitrageTriggered = inv01Score === 0 && inv02Score > 0;
  const clampedInv02Score = arbitrageTriggered ? Math.min(inv02Score, 0.35) : inv02Score;

  const updatedInvariants = {
    ...snapshot.invariants,
    '02': {
      ...inv02,
      score: clampedInv02Score,
      status: arbitrageTriggered ? 'CAPPED_ARBITRAGE' : inv02.status,
    },
  };

  const rawSum = Object.values(updatedInvariants).reduce(
    (acc, inv) => acc + (inv && typeof inv.score === 'number' ? inv.score : 0),
    0
  );

  return {
    ...snapshot,
    foundationalMassValid: true,
    arbitrageCapTriggered: arbitrageTriggered,
    totalScore: Number(rawSum.toFixed(2)),
    terminalGrade: arbitrageTriggered ? 'D+' : snapshot.terminalGrade,
    invariants: updatedInvariants,
  };
}