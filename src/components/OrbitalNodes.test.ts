import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MINI_LUT_ECHO,
  MINI_LUT_INNER,
  MINI_LUT_MAIN,
  NUCLEUS_LUT_ECHO,
  NUCLEUS_LUT_INNER,
  NUCLEUS_LUT_MAIN,
  SAT_LUT_ECHO,
  SAT_LUT_INNER,
  SAT_LUT_MAIN,
  buildFastWavePath
} from './OrbitalNodes.tsx';

test('buildFastWavePath emits exact circular arc when amplitude is zero', () => {
  const d = buildFastWavePath(NUCLEUS_LUT_MAIN, 140, 140, 102, 0, 0.5);
  assert.ok(d.startsWith('M 242 140 A 102 102 0 1 1 38 140'), `Expected clean arc, got: ${d}`);
  assert.ok(d.endsWith('Z'));
});

test('buildFastWavePath emits smooth C1-continuous closed cubic Bezier splines with zero straight polygon segments', () => {
  const cases = [
    { name: 'MINI_LUT_MAIN', lut: MINI_LUT_MAIN, cx: 44, cy: 44, r: 30, amp: 8.25 },
    { name: 'MINI_LUT_ECHO', lut: MINI_LUT_ECHO, cx: 44, cy: 44, r: 31.8, amp: 6.27 },
    { name: 'MINI_LUT_INNER', lut: MINI_LUT_INNER, cx: 44, cy: 44, r: 25.5, amp: 3.63 },
    { name: 'SAT_LUT_MAIN', lut: SAT_LUT_MAIN, cx: 70, cy: 70, r: 45, amp: 10.75 },
    { name: 'SAT_LUT_ECHO', lut: SAT_LUT_ECHO, cx: 70, cy: 70, r: 47.5, amp: 8.17 },
    { name: 'SAT_LUT_INNER', lut: SAT_LUT_INNER, cx: 70, cy: 70, r: 39, amp: 4.73 },
    { name: 'NUCLEUS_LUT_MAIN', lut: NUCLEUS_LUT_MAIN, cx: 140, cy: 140, r: 102, amp: 22.5 },
    { name: 'NUCLEUS_LUT_ECHO', lut: NUCLEUS_LUT_ECHO, cx: 140, cy: 140, r: 106, amp: 17.55 },
    { name: 'NUCLEUS_LUT_INNER', lut: NUCLEUS_LUT_INNER, cx: 140, cy: 140, r: 90, amp: 10.12 }
  ];

  for (const c of cases) {
    const d = buildFastWavePath(c.lut, c.cx, c.cy, c.r, c.amp, 1.234);
    assert.ok(d.startsWith('M'), `${c.name} must start with M`);
    assert.ok(d.endsWith('Z'), `${c.name} must close with Z`);
    assert.ok(d.includes('C'), `${c.name} must use cubic Bezier C segments`);
    assert.equal(d.includes('L'), false, `${c.name} must never emit faceted L polygon segments`);
    assert.equal(d.includes('NaN'), false, `${c.name} must contain no NaN values`);
    // Ensure no IEEE-754 float precision garbage like 44.300000000000004
    assert.equal(/\.\d{3,}/.test(d), false, `${c.name} must format coords cleanly to <= 2 decimals`);

    const bezierCount = (d.match(/C/g) || []).length;
    assert.equal(
      bezierCount,
      c.lut.steps,
      `${c.name} must emit ${c.lut.steps} periodic cubic Bezier segments`
    );

    // Verify closed periodic continuity: final C endpoint equals initial M start point
    const startMatch = d.match(/^M(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)C/);
    const endMatch = d.match(/ (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)Z$/);
    assert.ok(startMatch && endMatch, `${c.name} must have parseable start and end coordinates`);
    assert.equal(endMatch[1], startMatch[1], `${c.name} final X must match initial X`);
    assert.equal(endMatch[2], startMatch[2], `${c.name} final Y must match initial Y`);
  }
});
