import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PIN_HEX_HALF_HEIGHT_PX,
  PIN_HEX_HALF_WIDTH_PX,
  getConstellationLayout,
  measureConstellationClearance,
  type FourFormationMode,
  type ThreeFormationMode
} from './constellationLayout.ts';
import { computeDisplayLayoutMetrics } from './displayScale.ts';

function computeWrapWidth(w: number, h: number): number {
  if (w < 768) return Math.max(280, w - 24);
  const dm = computeDisplayLayoutMetrics({ width: w, height: h });
  const reserve = dm.mainHorizontalPadPx ?? (w >= 1280 ? 290 : w >= 1024 ? 244 : 196);
  return Math.max(320, w - reserve * 2);
}

test('dynamic constellations maintain guaranteed wave & button overlap buffer across all desktop formations and viewports', () => {
  const viewports = [
    [1280, 800],
    [1440, 900],
    [1920, 1080],
    [2560, 1440],
    [3840, 2160]
  ] as const;

  const configs: Array<{
    count: number;
    threeMode: ThreeFormationMode;
    fourMode: FourFormationMode;
    label: string;
  }> = [
    { count: 2, threeMode: 'TRIANGLE', fourMode: 'RHOMBUS', label: '2-pin Side-by-Side' },
    { count: 3, threeMode: 'TRIANGLE', fourMode: 'RHOMBUS', label: '3-pin Triangle' },
    { count: 3, threeMode: 'SIDE_BY_SIDE', fourMode: 'RHOMBUS', label: '3-pin Side-by-Side' },
    { count: 4, threeMode: 'TRIANGLE', fourMode: 'RHOMBUS', label: '4-pin Rhombus' },
    { count: 4, threeMode: 'TRIANGLE', fourMode: 'SQUARE', label: '4-pin Square' },
    { count: 4, threeMode: 'TRIANGLE', fourMode: 'SIDE_BY_SIDE', label: '4-pin Side-by-Side' }
  ];

  for (const [w, h] of viewports) {
    const dm = computeDisplayLayoutMetrics({ width: w, height: h });
    const wrapWidth = computeWrapWidth(w, h);

    for (const cfg of configs) {
      const layout = getConstellationLayout(
        cfg.count,
        cfg.threeMode,
        cfg.fourMode,
        'desktop',
        {
          wrapWidth,
          viewportHeight: h,
          pinMaxScale: dm.pinMaxScale
        }
      );

      assert.ok(
        layout.width <= wrapWidth,
        `${cfg.label} at ${w}x${h}: layout.width (${layout.width}) must stay <= wrapWidth (${wrapWidth})`
      );

      const hw = PIN_HEX_HALF_WIDTH_PX * layout.nodeScale;
      const hh = PIN_HEX_HALF_HEIGHT_PX * layout.nodeScale;
      for (const pos of layout.positions) {
        assert.ok(
          pos.x - hw >= -1 && pos.x + hw <= layout.width + 1,
          `${cfg.label} at ${w}x${h}: bubble horizontally out of bounds`
        );
        assert.ok(
          pos.y - hh >= -1 && pos.y + hh <= layout.height + 1,
          `${cfg.label} at ${w}x${h}: bubble vertically out of bounds`
        );
      }

      const clearance = measureConstellationClearance(layout.positions, layout.nodeScale);
      assert.ok(
        clearance.minSatWaveGapPx >= 7.5,
        `${cfg.label} at ${w}x${h}: wave crest overlap buffer too small (${clearance.minSatWaveGapPx.toFixed(1)}px)`
      );
      assert.ok(
        clearance.minSatButtonGapPx >= Math.max(14, 24 * layout.nodeScale),
        `${cfg.label} at ${w}x${h}: satellite button gap too small (${clearance.minSatButtonGapPx.toFixed(1)}px)`
      );
      assert.ok(
        clearance.minNucleusGapPx >= 20,
        `${cfg.label} at ${w}x${h}: nucleus gap too small (${clearance.minNucleusGapPx.toFixed(1)}px)`
      );
    }
  }
});

test('dynamic fitting substantially expands 1440x900 and 1920x1080 constellations without wasting arena space', () => {
  const dm900 = computeDisplayLayoutMetrics({ width: 1440, height: 900 });
  const wrap900 = computeWrapWidth(1440, 900);
  const two900 = getConstellationLayout(2, 'TRIANGLE', 'RHOMBUS', 'desktop', {
    wrapWidth: wrap900,
    viewportHeight: 900,
    pinMaxScale: dm900.pinMaxScale
  });
  assert.ok(two900.nodeScale >= 1.05, `Expected 1440x900 2-pin >= 1.05, got ${two900.nodeScale}`);

  const dm1080 = computeDisplayLayoutMetrics({ width: 1920, height: 1080 });
  const wrap1080 = computeWrapWidth(1920, 1080);

  const two1080 = getConstellationLayout(2, 'TRIANGLE', 'RHOMBUS', 'desktop', {
    wrapWidth: wrap1080,
    viewportHeight: 1080,
    pinMaxScale: dm1080.pinMaxScale
  });
  const tri1080 = getConstellationLayout(3, 'TRIANGLE', 'RHOMBUS', 'desktop', {
    wrapWidth: wrap1080,
    viewportHeight: 1080,
    pinMaxScale: dm1080.pinMaxScale
  });
  const rhomb1080 = getConstellationLayout(4, 'TRIANGLE', 'RHOMBUS', 'desktop', {
    wrapWidth: wrap1080,
    viewportHeight: 1080,
    pinMaxScale: dm1080.pinMaxScale
  });
  const sq1080 = getConstellationLayout(4, 'TRIANGLE', 'SQUARE', 'desktop', {
    wrapWidth: wrap1080,
    viewportHeight: 1080,
    pinMaxScale: dm1080.pinMaxScale
  });

  assert.ok(two1080.nodeScale >= 1.62, `Expected 1080p 2-pin >= 1.62, got ${two1080.nodeScale}`);
  assert.ok(tri1080.nodeScale >= 1.08, `Expected 1080p 3-pin Triangle >= 1.08, got ${tri1080.nodeScale}`);
  assert.ok(rhomb1080.nodeScale >= 0.88, `Expected 1080p 4-pin Rhombus >= 0.88, got ${rhomb1080.nodeScale}`);
  assert.ok(sq1080.nodeScale >= 0.88, `Expected 1080p 4-pin Square >= 0.88, got ${sq1080.nodeScale}`);
});

test('mobile vertical and tablet horizontal orientations keep non-overlapping buffers and fit mobile 2-pin in one screen', () => {
  for (const [w, h] of [
    [366, 740],
    [390, 844]
  ] as const) {
    const wrapW = w - 24;
    const layout2 = getConstellationLayout(2, 'TRIANGLE', 'RHOMBUS', 'vertical', {
      wrapWidth: wrapW,
      viewportHeight: h,
      pinMaxScale: 1
    });
    assert.ok(layout2.width <= wrapW);
    assert.ok(102 + layout2.height + 58 <= h);
    const clr = measureConstellationClearance(layout2.positions, layout2.nodeScale);
    assert.ok(clr.minSatWaveGapPx >= 7.5 && clr.minSatButtonGapPx >= 20);
  }

  for (const count of [2, 3, 4]) {
    const horiz = getConstellationLayout(count, 'TRIANGLE', 'RHOMBUS', 'horizontal', {
      wrapWidth: 960,
      viewportHeight: 680,
      pinMaxScale: 1
    });
    assert.ok(horiz.width <= 960);
    const clr = measureConstellationClearance(horiz.positions, horiz.nodeScale);
    assert.ok(clr.minSatWaveGapPx >= 7.5 && clr.minSatButtonGapPx >= 20);
  }
});
