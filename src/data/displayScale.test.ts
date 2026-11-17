import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_SIDEBAR_BUBBLE_SIZE_PX,
  BASE_STAGE_SIZE_PX,
  computeConstellationScale,
  computeDisplayLayoutMetrics,
  resolveDisplayScaleTier,
  shouldShowFloatingCornerControls
} from './displayScale.ts';
import { getConstellationLayout } from '../components/OrbitalNodes.tsx';

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

test('single-bubble arenaScale increases cleanly across laptop, 1080p, 1440p, and 2160p while clamping safely to center column', () => {
  const laptop = computeDisplayLayoutMetrics({ width: 1440, height: 900 });
  const fhd = computeDisplayLayoutMetrics({ width: 1920, height: 1080 });
  const qhdCrop = computeDisplayLayoutMetrics({ width: 1295, height: 1250 });
  const qhdFull = computeDisplayLayoutMetrics({ width: 2560, height: 1440 });
  const uhd4k = computeDisplayLayoutMetrics({ width: 3840, height: 2160 });

  assert.ok(laptop.arenaScale >= 1.12, `Expected 1440x900 arenaScale >= 1.12, got ${laptop.arenaScale}`);
  assert.ok(laptop.stageSizePx >= 492);
  assert.equal(laptop.sidebarBubbleSizePx, BASE_SIDEBAR_BUBBLE_SIZE_PX);

  assert.ok(fhd.arenaScale >= 1.45, `Expected 1920x1080 arenaScale >= 1.45, got ${fhd.arenaScale}`);
  assert.ok(fhd.stageSizePx >= 638);
  assert.ok(fhd.arenaScale > laptop.arenaScale);

  assert.ok(qhdCrop.arenaScale >= 1.48, `Expected qhdCrop arenaScale >= 1.48, got ${qhdCrop.arenaScale}`);
  assert.ok(qhdCrop.sidebarBubbleSizePx > BASE_SIDEBAR_BUBBLE_SIZE_PX);
  assert.ok(qhdCrop.stageSizePx <= 1295 - 580, 'Scaled stage must fit cleanly between desktop sidebars');

  assert.ok(qhdFull.arenaScale >= 1.68, `Expected qhdFull arenaScale >= 1.68, got ${qhdFull.arenaScale}`);
  assert.ok(qhdFull.sidebarBubbleSizePx >= 90);
  assert.ok(qhdFull.pinMaxScale >= 1.5);
  assert.ok(qhdFull.arenaScale > fhd.arenaScale);

  assert.ok(uhd4k.arenaScale >= 2.15, `Expected uhd4k arenaScale >= 2.15, got ${uhd4k.arenaScale}`);
  assert.ok(uhd4k.sidebarBubbleSizePx >= 116);
  assert.ok(uhd4k.pinMaxScale >= 1.9);
  assert.ok(uhd4k.arenaScale > qhdFull.arenaScale);
  assert.ok(uhd4k.sidebarBubbleSizePx > qhdFull.sidebarBubbleSizePx);
});

test('bottomControlsOffsetPx shifts bottom buttons down cleanly without pushing them past footer', () => {
  const m900 = computeDisplayLayoutMetrics({ width: 1440, height: 900 });
  const m1080 = computeDisplayLayoutMetrics({ width: 1920, height: 1080 });
  const m1250 = computeDisplayLayoutMetrics({ width: 1295, height: 1250 });
  const m1440 = computeDisplayLayoutMetrics({ width: 2560, height: 1440 });
  const m2160 = computeDisplayLayoutMetrics({ width: 3840, height: 2160 });

  assert.ok(m900.bottomControlsOffsetPx >= 10);
  assert.ok(m1080.bottomControlsOffsetPx >= m900.bottomControlsOffsetPx);
  assert.ok(m1250.bottomControlsOffsetPx >= 60);
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

test('compact laptop display (1280x800) maximizes arenaScale cleanly below 1.0x so footer remains visible', () => {
  const laptop800 = computeDisplayLayoutMetrics({ width: 1280, height: 800 });
  assert.ok(laptop800.arenaScale < 1 && laptop800.arenaScale >= 0.9);
  const projectedBottom =
    800 * 0.5 + laptop800.stageSizePx / 2 + laptop800.bottomControlsOffsetPx + 108;
  assert.ok(
    projectedBottom <= 800 - 48,
    `Compact 1280x800 buttons must remain clear of footer (projected=${projectedBottom}, limit=752)`
  );
});

test('1080p pinned constellations scale cleanly across 2, 3, and 4 pins without overflowing center arena', () => {
  for (const [w, h, minTwoScale] of [
    [1920, 920, 1.38],
    [1920, 1080, 1.45]
  ] as const) {
    const dm = computeDisplayLayoutMetrics({ width: w, height: h });
    const wrapWidth = w - 290 * 2; // xl sidebars reserve 290px per side

    const layout2 = getConstellationLayout(2, 'desktop', {
      wrapWidth,
      viewportHeight: h,
      pinMaxScale: dm.pinMaxScale
    });
    const scale2 = computeConstellationScale({
      layoutWidth: layout2.width,
      layoutHeight: layout2.height,
      layoutNodeScale: layout2.nodeScale,
      wrapWidth,
      viewportHeight: h,
      pinMaxScale: dm.pinMaxScale,
      orientationMode: 'desktop'
    });
    const effective2 = layout2.nodeScale * scale2;
    assert.ok(
      effective2 >= minTwoScale,
      `Expected 2-pin effective scale >= ${minTwoScale} on ${w}x${h}, got ${effective2}`
    );
    assert.ok(layout2.width * scale2 <= wrapWidth, '2-pin constellation must stay clear of sidebars');

    const layout3 = getConstellationLayout(3, 'desktop', {
      wrapWidth,
      viewportHeight: h,
      pinMaxScale: dm.pinMaxScale
    });
    const scale3 = computeConstellationScale({
      layoutWidth: layout3.width,
      layoutHeight: layout3.height,
      layoutNodeScale: layout3.nodeScale,
      wrapWidth,
      viewportHeight: h,
      pinMaxScale: dm.pinMaxScale,
      orientationMode: 'desktop'
    });
    const effective3 = layout3.nodeScale * scale3;
    assert.ok(
      effective3 >= 1.1,
      `Expected 3-pin effective scale >= 1.1 on ${w}x${h}, got ${effective3}`
    );
    assert.ok(layout3.width * scale3 <= wrapWidth, '3-pin constellation must stay clear of sidebars');

    const layout4 = getConstellationLayout(4, 'desktop', {
      wrapWidth,
      viewportHeight: h,
      pinMaxScale: dm.pinMaxScale
    });
    const scale4 = computeConstellationScale({
      layoutWidth: layout4.width,
      layoutHeight: layout4.height,
      layoutNodeScale: layout4.nodeScale,
      wrapWidth,
      viewportHeight: h,
      pinMaxScale: dm.pinMaxScale,
      orientationMode: 'desktop'
    });
    const effective4 = layout4.nodeScale * scale4;
    assert.ok(
      effective4 >= 0.88,
      `Expected 4-pin horizontal zig-zag effective scale >= 0.88 on ${w}x${h}, got ${effective4}`
    );
    assert.ok(layout4.width * scale4 <= wrapWidth, '4-pin zig-zag must stay clear of sidebars');
  }
});

test('2-pin effective scale preserves hierarchy across 1440x900 < 1920x1080 < 2560x1440 < 3840x2160', () => {
  const layout2 = getConstellationLayout(2, 'desktop');
  const getEff2 = (w: number, h: number) => {
    const dm = computeDisplayLayoutMetrics({ width: w, height: h });
    const reserve = dm.mainHorizontalPadPx ?? 290;
    const wrapWidth = w - reserve * 2;
    const s = computeConstellationScale({
      layoutWidth: layout2.width,
      layoutHeight: layout2.height,
      wrapWidth,
      viewportHeight: h,
      pinMaxScale: dm.pinMaxScale,
      orientationMode: 'desktop'
    });
    return { eff: layout2.nodeScale * s, fitsWidth: layout2.width * s <= wrapWidth };
  };

  const r900 = getEff2(1440, 900);
  const r1080 = getEff2(1920, 1080);
  const r1440 = getEff2(2560, 1440);
  const r2160 = getEff2(3840, 2160);

  assert.ok(r900.fitsWidth && r1080.fitsWidth && r1440.fitsWidth && r2160.fitsWidth);
  assert.ok(r900.eff < r1080.eff && r1080.eff < r1440.eff && r1440.eff < r2160.eff);
});

test('mobile vertical 2-pin constellation maximizes bubble size while fitting Pinned bar and Sync Invariant bar inside one mobile viewport', () => {
  const layout2Mobile = getConstellationLayout(2, 'vertical');
  for (const vh of [740, 844]) {
    const scale = computeConstellationScale({
      layoutWidth: layout2Mobile.width,
      layoutHeight: layout2Mobile.height,
      wrapWidth: 366,
      viewportHeight: vh,
      pinMaxScale: 1,
      orientationMode: 'vertical'
    });
    const constellationHeight = Math.round(layout2Mobile.height * scale);
    // Pinned bar + gaps (~102px) + constellation + Sync Invariant label/row (~58px) must fit in one screen
    assert.ok(
      102 + constellationHeight + 58 <= vh,
      `Expected Pinned bar + 2-pin constellation (${constellationHeight}px) + Sync Invariant to fit within ${vh}px viewport`
    );
  }
});

test('shouldShowFloatingCornerControls persists across landing, single idle, and multi-pin scroll, and hides on single-bubble cards or modals', () => {
  assert.equal(
    shouldShowFloatingCornerControls({
      isAnyModalOpen: false,
      isTutorialOpen: false,
      isLandingIdle: true,
      isMultiStage: false,
      isAuditing: false,
      hasActiveHoveredInvariant: false
    }),
    true
  );

  // Single bubble stage without a pulled card keeps controls visible
  assert.equal(
    shouldShowFloatingCornerControls({
      isAnyModalOpen: false,
      isTutorialOpen: false,
      isLandingIdle: false,
      isMultiStage: false,
      isAuditing: false,
      hasActiveHoveredInvariant: false
    }),
    true
  );

  // Single bubble stage with quick-scan invariant card pulled hides Tutorial & Donate
  assert.equal(
    shouldShowFloatingCornerControls({
      isAnyModalOpen: false,
      isTutorialOpen: false,
      isLandingIdle: false,
      isMultiStage: false,
      isAuditing: false,
      hasActiveHoveredInvariant: true
    }),
    false
  );

  // Multi-pin comparison keeps controls floating even while hovering Sync Invariant rows
  assert.equal(
    shouldShowFloatingCornerControls({
      isAnyModalOpen: false,
      isTutorialOpen: false,
      isLandingIdle: false,
      isMultiStage: true,
      isAuditing: false,
      hasActiveHoveredInvariant: true
    }),
    true
  );

  // Any open modal (single-bubble breakdown modal, Donate, Archive, Rubric) or Tutorial hides controls
  assert.equal(
    shouldShowFloatingCornerControls({
      isAnyModalOpen: true,
      isTutorialOpen: false,
      isLandingIdle: false,
      isMultiStage: false,
      isAuditing: false,
      hasActiveHoveredInvariant: false
    }),
    false
  );

  assert.equal(
    shouldShowFloatingCornerControls({
      isAnyModalOpen: false,
      isTutorialOpen: true,
      isLandingIdle: true,
      isMultiStage: false,
      isAuditing: false,
      hasActiveHoveredInvariant: false
    }),
    false
  );
});


