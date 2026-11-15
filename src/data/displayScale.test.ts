import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_SIDEBAR_BUBBLE_SIZE_PX,
  BASE_STAGE_SIZE_PX,
  computeDisplayLayoutMetrics,
  resolveDisplayScaleTier
} from './displayScale.ts';

test('resolveDisplayScaleTier distinguishes standard, 1440, and 2160 displays cleanly', () => {
  assert.equal(resolveDisplayScaleTier({ width: 1280, height: 800 }), 'standard');
  assert.equal(resolveDisplayScaleTier({ width: 1440, height: 900 }), 'standard');
  assert.equal(resolveDisplayScaleTier({ width: 1920, height: 1080 }), 'standard');

  assert.equal(resolveDisplayScaleTier({ width: 1295, height: 1250 }), '1440');
  assert.equal(resolveDisplayScaleTier({ width: 1412, height: 1205 }), '1440');
  assert.equal(resolveDisplayScaleTier({ width: 2560, height: 1440 }), '1440');

  assert.equal(resolveDisplayScaleTier({ width: 3840, height: 2160 }), '2160');
  assert.equal(resolveDisplayScaleTier({ width: 2160, height: 1920 }), '2160');
});

test('1440 and 2160 displays scale harmonic bubbles larger while clamping safely to center column', () => {
  const laptop = computeDisplayLayoutMetrics({ width: 1440, height: 900 });
  const qhdCrop = computeDisplayLayoutMetrics({ width: 1295, height: 1250 });
  const qhdFull = computeDisplayLayoutMetrics({ width: 2560, height: 1440 });
  const uhd4k = computeDisplayLayoutMetrics({ width: 3840, height: 2160 });

  assert.equal(laptop.arenaScale, 1);
  assert.equal(laptop.stageSizePx, BASE_STAGE_SIZE_PX);
  assert.equal(laptop.sidebarBubbleSizePx, BASE_SIDEBAR_BUBBLE_SIZE_PX);

  assert.ok(qhdCrop.arenaScale >= 1.25, `Expected qhdCrop arenaScale >= 1.25, got ${qhdCrop.arenaScale}`);
  assert.ok(qhdCrop.sidebarBubbleSizePx > BASE_SIDEBAR_BUBBLE_SIZE_PX);
  assert.ok(qhdCrop.stageSizePx <= 1295 - 580, 'Scaled stage must fit cleanly between desktop sidebars');

  assert.ok(qhdFull.arenaScale >= 1.32, `Expected qhdFull arenaScale >= 1.32, got ${qhdFull.arenaScale}`);
  assert.ok(qhdFull.sidebarBubbleSizePx >= 90);
  assert.ok(qhdFull.pinMaxScale >= 1.3);

  assert.ok(uhd4k.arenaScale >= 1.75, `Expected uhd4k arenaScale >= 1.75, got ${uhd4k.arenaScale}`);
  assert.ok(uhd4k.sidebarBubbleSizePx >= 116);
  assert.ok(uhd4k.pinMaxScale >= 1.6);
  assert.ok(uhd4k.arenaScale > qhdFull.arenaScale);
  assert.ok(uhd4k.sidebarBubbleSizePx > qhdFull.sidebarBubbleSizePx);
});

test('bottomControlsOffsetPx shifts bottom buttons down cleanly without pushing them past footer', () => {
  const m900 = computeDisplayLayoutMetrics({ width: 1440, height: 900 });
  const m1080 = computeDisplayLayoutMetrics({ width: 1920, height: 1080 });
  const m1250 = computeDisplayLayoutMetrics({ width: 1295, height: 1250 });
  const m1440 = computeDisplayLayoutMetrics({ width: 2560, height: 1440 });
  const m2160 = computeDisplayLayoutMetrics({ width: 3840, height: 2160 });

  assert.ok(m900.bottomControlsOffsetPx >= 24);
  assert.ok(m1080.bottomControlsOffsetPx > m900.bottomControlsOffsetPx);
  assert.ok(m1250.bottomControlsOffsetPx >= 80);
  assert.ok(m1440.bottomControlsOffsetPx > m1250.bottomControlsOffsetPx);
  assert.ok(m2160.bottomControlsOffsetPx > m1440.bottomControlsOffsetPx);

  for (const [h, metrics] of [
    [900, m900],
    [1080, m1080],
    [1250, m1250],
    [1440, m1440],
    [2160, m2160]
  ] as const) {
    const projectedBottom = h * 0.5 + metrics.stageSizePx / 2 + metrics.bottomControlsOffsetPx + 122;
    assert.ok(
      projectedBottom <= h - 48,
      `Bottom buttons at height=${h} must remain clear of footer (projected=${projectedBottom}, limit=${h - 48})`
    );
  }
});

test('narrow-tall desktop viewports never allow scaled stage to collide with sidebars', () => {
  const narrowTall = computeDisplayLayoutMetrics({ width: 1080, height: 1440 });
  const centerWidth = 1080 - 244 * 2;
  assert.ok(narrowTall.stageSizePx < centerWidth);
});

test('compact laptop display (1280x800) scales arena slightly below 1.0x so footer remains visible', () => {
  const laptop800 = computeDisplayLayoutMetrics({ width: 1280, height: 800 });
  assert.ok(laptop800.arenaScale < 1 && laptop800.arenaScale >= 0.84);
  const projectedBottom =
    800 * 0.5 + laptop800.stageSizePx / 2 + laptop800.bottomControlsOffsetPx + 108;
  assert.ok(
    projectedBottom <= 800 - 48,
    `Compact 1280x800 buttons must remain clear of footer (projected=${projectedBottom}, limit=752)`
  );
});

