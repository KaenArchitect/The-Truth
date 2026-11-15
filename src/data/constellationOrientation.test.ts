import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePinOrientationMode } from './constellationOrientation.ts';

test('resolvePinOrientationMode returns vertical for mobile and tablet portrait viewports', () => {
  // Mobile portrait
  assert.equal(resolvePinOrientationMode({ width: 390, height: 844 }), 'vertical');
  assert.equal(resolvePinOrientationMode({ width: 414, height: 896 }), 'vertical');
  // Tablet portrait (iPad Mini / Air / Pro 12.9)
  assert.equal(resolvePinOrientationMode({ width: 768, height: 1024 }), 'vertical');
  assert.equal(resolvePinOrientationMode({ width: 820, height: 1180 }), 'vertical');
  assert.equal(resolvePinOrientationMode({ width: 1024, height: 1366 }), 'vertical');
});

test('resolvePinOrientationMode overrides vertical to horizontal in mobile and tablet landscape', () => {
  // Mobile landscape
  assert.equal(resolvePinOrientationMode({ width: 667, height: 375 }), 'horizontal');
  assert.equal(resolvePinOrientationMode({ width: 844, height: 390 }), 'horizontal');
  assert.equal(resolvePinOrientationMode({ width: 932, height: 430 }), 'horizontal');
  // Tablet landscape
  assert.equal(resolvePinOrientationMode({ width: 1024, height: 768 }), 'horizontal');
  assert.equal(resolvePinOrientationMode({ width: 1180, height: 820 }), 'horizontal');
  assert.equal(
    resolvePinOrientationMode({ width: 1366, height: 1024, isCoarsePointer: true }),
    'horizontal'
  );
});

test('resolvePinOrientationMode preserves desktop mode on large landscape viewports', () => {
  assert.equal(resolvePinOrientationMode({ width: 1280, height: 800 }), 'desktop');
  assert.equal(resolvePinOrientationMode({ width: 1440, height: 900 }), 'desktop');
  assert.equal(resolvePinOrientationMode({ width: 1920, height: 1080 }), 'desktop');
});
