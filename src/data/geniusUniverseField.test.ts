import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRADE_STAR_SPECTRUM,
  PHYSICS_EQUATION_SPRITES,
  computeUniverseTelemetryForGrade,
  createUniverseStars,
  projectGalaxyPoint
} from './geniusUniverseField.ts';

test('PHYSICS_EQUATION_SPRITES includes core thermodynamic and cosmic equations with safe background opacity', () => {
  assert.ok(PHYSICS_EQUATION_SPRITES.length >= 12);
  const formulas = PHYSICS_EQUATION_SPRITES.map((s) => s.formula);
  assert.ok(formulas.some((f) => /ΔQ/.test(f) && /ln 2/.test(f)));
  assert.ok(formulas.some((f) => /G_μν/.test(f)));
  assert.ok(formulas.some((f) => /ΔS_total/.test(f)));
  assert.ok(formulas.some((f) => /M_overlay/.test(f)));

  for (const sprite of PHYSICS_EQUATION_SPRITES) {
    assert.ok(sprite.opacity > 0.08 && sprite.opacity <= 0.3, `Expected light background opacity for ${sprite.id}`);
    assert.ok(sprite.xPct > 5 && sprite.xPct < 95);
    assert.ok(sprite.yPct > 5 && sprite.yPct < 95);
    assert.ok(sprite.durationSec >= 18);
  }
});

test('createUniverseStars includes all thermodynamic grade colors and deterministic differential rotation', () => {
  const stars = createUniverseStars(360, 20261115);
  const copy = createUniverseStars(360, 20261115);
  assert.equal(stars.length, 360);
  assert.deepEqual(stars, copy);

  // Every grade tier in GRADE_STAR_SPECTRUM appears in the pre-audit starfield
  const presentTiers = new Set(stars.map((s) => s.gradeTier));
  for (const spec of GRADE_STAR_SPECTRUM) {
    assert.ok(presentTiers.has(spec.grade), `Expected grade color tier ${spec.grade} in star pool`);
    assert.equal(spec.rgbTuple.length, 3);
  }
  assert.ok(GRADE_STAR_SPECTRUM.some((s) => s.grade === 'A+'));
  assert.ok(GRADE_STAR_SPECTRUM.some((s) => s.grade === 'B+'));
  assert.ok(GRADE_STAR_SPECTRUM.some((s) => s.grade === 'C+'));
  assert.ok(GRADE_STAR_SPECTRUM.some((s) => s.grade === 'D-'));
  assert.ok(GRADE_STAR_SPECTRUM.some((s) => s.grade === 'F'));

  const inner = stars.find((s) => !s.isDeepField && s.radiusNorm < 0.25)!;
  assert.ok(inner);
  const p0 = projectGalaxyPoint(inner, 0, 1440, 900, 1);
  const p1 = projectGalaxyPoint(inner, 4, 1440, 900, 1);
  assert.ok(Number.isFinite(p0.x) && Number.isFinite(p0.y));
  assert.notEqual(Math.round(p0.x * 100), Math.round(p1.x * 100));

  const pFast = projectGalaxyPoint(inner, 4, 1440, 900, 1.8);
  assert.notEqual(Math.round(pFast.x * 100), Math.round(p1.x * 100));

  const pStopped = projectGalaxyPoint(inner, 4, 1440, 900, 1, 0);
  assert.equal(pStopped.tailLength, 0);
});

test('computeUniverseTelemetryForGrade enforces zero stars & zero movement on F grade and correlates star count & motion to non-F grades', () => {
  const preAuditDesktop = computeUniverseTelemetryForGrade({
    hasActiveAudit: false,
    isAuditing: false,
    isMobile: false
  });
  assert.equal(preAuditDesktop.useMultiGradeStarColors, true);
  assert.equal(preAuditDesktop.starCount, 220);
  assert.equal(preAuditDesktop.motionSpeed, 1.0);
  assert.equal(preAuditDesktop.isZeroMotion, false);

  const preAuditMobile = computeUniverseTelemetryForGrade({
    hasActiveAudit: false,
    isAuditing: false,
    isMobile: true
  });
  assert.equal(preAuditMobile.useMultiGradeStarColors, true);
  assert.equal(preAuditMobile.starCount, 140);

  const gradeF = computeUniverseTelemetryForGrade({ hasActiveAudit: true, isAuditing: false, grade: 'F', totalScore: 0 });
  const gradeD = computeUniverseTelemetryForGrade({ hasActiveAudit: true, isAuditing: false, grade: 'D-', totalScore: 1.4 });
  const gradeC = computeUniverseTelemetryForGrade({ hasActiveAudit: true, isAuditing: false, grade: 'C+', totalScore: 3.7 });
  const gradeB = computeUniverseTelemetryForGrade({ hasActiveAudit: true, isAuditing: false, grade: 'B+', totalScore: 4.4 });
  const gradeA = computeUniverseTelemetryForGrade({ hasActiveAudit: true, isAuditing: false, grade: 'A+', totalScore: 6.0 });

  // Grade F strictly enforces ZERO stars and ZERO movement
  assert.equal(gradeF.starCount, 0);
  assert.equal(gradeF.motionSpeed, 0);
  assert.equal(gradeF.vortexDurationSec, 0);
  assert.equal(gradeF.equationSpeedMult, 0);
  assert.equal(gradeF.isZeroMotion, true);
  assert.equal(gradeF.useMultiGradeStarColors, false);

  assert.equal(gradeA.useMultiGradeStarColors, false);
  assert.equal(gradeA.isZeroMotion, false);

  // Star density strictly correlates upward with grade
  assert.ok(gradeF.starCount < gradeD.starCount);
  assert.ok(gradeD.starCount < gradeC.starCount);
  assert.ok(gradeC.starCount < gradeB.starCount);
  assert.ok(gradeB.starCount < gradeA.starCount);
  assert.equal(gradeA.starCount, 360);

  // Orbital motion speed & equation drift speed strictly correlate upward with grade
  assert.ok(gradeF.motionSpeed < gradeD.motionSpeed);
  assert.ok(gradeD.motionSpeed < gradeC.motionSpeed);
  assert.ok(gradeC.motionSpeed < gradeB.motionSpeed);
  assert.ok(gradeB.motionSpeed < gradeA.motionSpeed);
  assert.ok(gradeF.equationSpeedMult < gradeA.equationSpeedMult);

  // Vortex rotation duration shrinks (faster spin) for higher non-F grades
  assert.ok(gradeD.vortexDurationSec > gradeC.vortexDurationSec);
  assert.ok(gradeC.vortexDurationSec > gradeA.vortexDurationSec);
});
