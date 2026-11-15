import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PHYSICS_EQUATION_SPRITES,
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

test('createUniverseStars produces deterministic spiral galaxy particles and differential Keplerian rotation', () => {
  const a = createUniverseStars(200, 12345);
  const b = createUniverseStars(200, 12345);
  assert.equal(a.length, 200);
  assert.deepEqual(a, b);

  const inner = a.find((s) => !s.isDeepField && s.radiusNorm < 0.25)!;
  const outer = a.find((s) => !s.isDeepField && s.radiusNorm > 0.75)!;
  assert.ok(inner && outer);

  const p0 = projectGalaxyPoint(inner, 0, 1440, 900, 1);
  const p1 = projectGalaxyPoint(inner, 4, 1440, 900, 1);
  assert.ok(Number.isFinite(p0.x) && Number.isFinite(p0.y));
  assert.notEqual(Math.round(p0.x * 100), Math.round(p1.x * 100));

  const pFast = projectGalaxyPoint(inner, 4, 1440, 900, 2.0);
  assert.notEqual(Math.round(pFast.x * 100), Math.round(p1.x * 100));
});
