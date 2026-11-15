import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GENIUS_SEARCH_WAVE_SPECS,
  buildStadiumPerimeterSamples,
  buildStadiumWavePath,
  evaluateWaveOutwardOffset
} from './searchWaveRing.ts';

test('GENIUS_SEARCH_WAVE_SPECS orders F calmest to A+ highest-energy with shared textbox trough floor', () => {
  assert.equal(GENIUS_SEARCH_WAVE_SPECS.length, 7);
  assert.equal(GENIUS_SEARCH_WAVE_SPECS[0].gradeLabel, 'F');
  assert.equal(GENIUS_SEARCH_WAVE_SPECS[6].gradeLabel, 'A+');
  const colors = GENIUS_SEARCH_WAVE_SPECS.map((s) => s.color);
  assert.equal(new Set(colors).size, 7);

  for (let i = 1; i < GENIUS_SEARCH_WAVE_SPECS.length; i += 1) {
    assert.ok(
      GENIUS_SEARCH_WAVE_SPECS[i].cyclesMain > GENIUS_SEARCH_WAVE_SPECS[i - 1].cyclesMain,
      'Outer top-grade rings must carry higher harmonic frequency than lower grade rings'
    );
    assert.ok(
      GENIUS_SEARCH_WAVE_SPECS[i].amplitude > GENIUS_SEARCH_WAVE_SPECS[i - 1].amplitude,
      'Higher grade rings must surge farther outward and intersect inner waves'
    );
    assert.ok(
      GENIUS_SEARCH_WAVE_SPECS[i].speed > GENIUS_SEARCH_WAVE_SPECS[i - 1].speed,
      'Higher grade rings must move faster than lower grade rings'
    );
  }

  for (const spec of GENIUS_SEARCH_WAVE_SPECS) {
    let minOffset = Infinity;
    let maxOffset = -Infinity;
    for (let s = 0; s < 360; s += 1) {
      const off = evaluateWaveOutwardOffset(spec, s / 360, 0.5, 1, 1);
      if (off < minOffset) minOffset = off;
      if (off > maxOffset) maxOffset = off;
    }
    assert.ok(
      minOffset >= 0.15 && minOffset < 0.35,
      `${spec.gradeLabel} troughs must touch the textbox edge cleanly (got min ${minOffset})`
    );
    assert.ok(
      maxOffset > spec.amplitude * 0.75,
      `${spec.gradeLabel} crests must surge energetically outward (got max ${maxOffset})`
    );
  }
});

test('buildStadiumPerimeterSamples and buildStadiumWavePath trace closed smooth cubic Bezier paths', () => {
  const pad = 46;
  const w = 576;
  const h = 46;
  const samples = buildStadiumPerimeterSamples(w, h, pad, 120);
  assert.equal(samples.length, 120);

  for (const s of samples) {
    const mag = Math.hypot(s.nx, s.ny);
    assert.ok(Math.abs(mag - 1) < 1e-6, 'Perimeter normals must be unit vectors');
  }

  const d = buildStadiumWavePath(samples, GENIUS_SEARCH_WAVE_SPECS[6], 0.75, 1.0, 0.5);
  assert.ok(
    d.startsWith('M') && d.includes('C') && d.endsWith('Z'),
    'Generated path must be a closed smooth cubic Bezier SVG path'
  );
});
