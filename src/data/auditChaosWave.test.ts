import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARCHIVE_PULL_DURATION_MS,
  AUDIT_CHAOS_BANDS,
  buildCircularChaosWavePath,
  computeChaosLevel,
  evaluateChaosWaveBand,
  resolveSettledHarmonyProfile
} from './auditChaosWave.ts';

test('ARCHIVE_PULL_DURATION_MS enforces a 6 second reveal animation across 6 stages', () => {
  assert.equal(ARCHIVE_PULL_DURATION_MS, 6000);
  assert.equal(AUDIT_CHAOS_BANDS.length, 7);
});

test('computeChaosLevel stays fiercely chaotic early then smoothly settles to zero before completion', () => {
  assert.equal(computeChaosLevel(0), 1);
  assert.equal(computeChaosLevel(0.35), 1);
  const mid = computeChaosLevel(0.61);
  assert.ok(mid > 0.1 && mid < 0.9, `Mid convergence should taper smoothly (got ${mid})`);
  assert.equal(computeChaosLevel(0.85), 0);
  assert.equal(computeChaosLevel(1), 0);
});

test('audit chaos waves converge onto target grade harmony and flatline on F', () => {
  const profileAPlus = resolveSettledHarmonyProfile('A+', 6.0);
  assert.equal(profileAPlus.targetBandIndex, 6);
  assert.ok(profileAPlus.settledAmplitude > 15);

  const profileF = resolveSettledHarmonyProfile('F', 0);
  assert.equal(profileF.targetBandIndex, 0);
  assert.equal(profileF.settledAmplitude, 0);

  // When settled (chaosLevel = 0) on A+: F ring damps to 0 opacity & flat offset,
  // while A+ ring keeps smooth non-zero standing harmony and touching troughs.
  const fSettledOnAPlus = evaluateChaosWaveBand(0, 0.25, 1.0, 0, profileAPlus);
  assert.equal(fSettledOnAPlus.opacity, 0);
  assert.ok(fSettledOnAPlus.offset <= 0.3);

  let minAPlus = Infinity;
  let maxAPlus = -Infinity;
  for (let i = 0; i < 180; i += 1) {
    const s = evaluateChaosWaveBand(6, i / 180, 1.0, 0, profileAPlus);
    if (s.offset < minAPlus) minAPlus = s.offset;
    if (s.offset > maxAPlus) maxAPlus = s.offset;
  }
  assert.ok(minAPlus >= 0.2 && minAPlus < 0.6, `Settled troughs must touch sphere rim (${minAPlus})`);
  assert.ok(maxAPlus > 15, `Settled A+ crests must carry harmonic standing waves (${maxAPlus})`);

  // When settled on F: even the target F band collapses flat to 0 amplitude
  const fSettledOnF = evaluateChaosWaveBand(0, 0.25, 1.0, 0, profileF);
  assert.equal(fSettledOnF.offset, 0.25);

  const path = buildCircularChaosWavePath(6, 170, 170, 118, 0.5, 1.0, profileAPlus, 96);
  assert.ok(
    path.d.startsWith('M') && path.d.includes('C') && path.d.endsWith('Z'),
    'Circular chaos wave must emit smooth closed cubic Bezier SVG paths'
  );
});
