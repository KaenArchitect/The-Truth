import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_SIDEBAR_BUBBLE_SIZE_PX,
  BASE_STAGE_SIZE_PX,
  computeConstellationScale,
  computeDisplayLayoutMetrics,
  computeSyncInvariantGridLayout,
  isBrowserZoomAtLeast150,
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

test('720p displays (1280x720 and 1280x640 windowed) scale expanded single-bubble and multi-pin constellations without vertical overlap', () => {
  const hd720 = computeDisplayLayoutMetrics({ width: 1280, height: 720 });
  assert.ok(
    hd720.arenaScale >= 0.72 && hd720.arenaScale <= 0.8,
    `Expected 1280x720 arenaScale between 0.72 and 0.80, got ${hd720.arenaScale}`
  );
  assert.ok(hd720.bottomControlsOffsetPx >= 8);
  // Compact header (~168px) + stageSizePx + bottom controls (~94px) + footer (~46px) must fit inside 720px
  assert.ok(
    168 + hd720.stageSizePx + hd720.bottomControlsOffsetPx + 94 + 46 <= 720,
    `Expected 1280x720 expanded stage (${hd720.stageSizePx}px) to fit inside 720p viewport without overlap`
  );

  const hdWindowed = computeDisplayLayoutMetrics({ width: 1280, height: 640 });
  assert.ok(
    hdWindowed.arenaScale >= 0.66 && hdWindowed.arenaScale <= 0.72,
    `Expected 1280x640 windowed 720p arenaScale between 0.66 and 0.72, got ${hdWindowed.arenaScale}`
  );

  // 2, 3, and 4 pinned constellations on 1280x720 keep scaledArenaHeight bounded so Pinned bar + expanded orbits + Sync Invariant bar fit cleanly
  const wrapWidth720 = 1280 - 290 * 2;
  for (const count of [2, 3, 4] as const) {
    const layout = getConstellationLayout(count, 'desktop', {
      wrapWidth: wrapWidth720,
      viewportHeight: 720,
      pinMaxScale: hd720.pinMaxScale
    });
    const scale = computeConstellationScale({
      layoutWidth: layout.width,
      layoutHeight: layout.height,
      layoutNodeScale: layout.nodeScale,
      wrapWidth: wrapWidth720,
      viewportHeight: 720,
      pinMaxScale: hd720.pinMaxScale,
      orientationMode: 'desktop'
    });
    const scaledHeight = Math.round(layout.height * scale);
    assert.ok(layout.width * scale <= wrapWidth720);
    assert.ok(
      scaledHeight <= 340,
      `Expected ${count}-pin scaledArenaHeight <= 340px on 1280x720, got ${scaledHeight}px`
    );
  }
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

test('computeSyncInvariantGridLayout deterministically fits 1, 2, 3, or 4 description columns cleanly across viewports', () => {
  // Mobile (390x844 -> ~358px arena) and tablet (768x1024 -> 376px, 1024x768 -> 536px): 1 column
  for (const w of [358, 376, 536]) {
    for (const count of [2, 3, 4]) {
      const grid = computeSyncInvariantGridLayout({ availableWidth: w, count });
      assert.equal(grid.columns, 1, `Expected 1 column at availableWidth=${w}, count=${count}`);
    }
  }

  // Compact laptop (1280x800 -> 700px arena): 2 columns across 2, 3, and 4 pins
  for (const count of [2, 3, 4]) {
    const laptop = computeSyncInvariantGridLayout({ availableWidth: 700, count });
    assert.equal(laptop.columns, 2);
    assert.ok(laptop.estimatedCardWidthPx >= 310);
  }

  // Standard MacBook (1440x900 -> 860px arena): 3 across for 3 pins, 2x2 symmetric for 4 pins
  const mbp3 = computeSyncInvariantGridLayout({ availableWidth: 860, count: 3 });
  assert.equal(mbp3.columns, 3);
  assert.ok(mbp3.estimatedCardWidthPx >= 260);

  const mbp4 = computeSyncInvariantGridLayout({ availableWidth: 860, count: 4 });
  assert.equal(mbp4.columns, 2);
  assert.ok(mbp4.estimatedCardWidthPx >= 395);

  // Full HD Desktop (1920x1080 -> 1340px arena): 3 across for 3 pins, 4 across for 4 pins
  const fhd2 = computeSyncInvariantGridLayout({ availableWidth: 1340, count: 2 });
  assert.equal(fhd2.columns, 2);
  assert.equal(fhd2.containerMaxWidthPx, 1180);

  const fhd3 = computeSyncInvariantGridLayout({ availableWidth: 1340, count: 3 });
  assert.equal(fhd3.columns, 3);
  assert.equal(fhd3.containerMaxWidthPx, 1340);
  assert.ok(fhd3.estimatedCardWidthPx >= 420);

  const fhd4 = computeSyncInvariantGridLayout({ availableWidth: 1340, count: 4 });
  assert.equal(fhd4.columns, 4);
  assert.equal(fhd4.containerMaxWidthPx, 1340);
  assert.ok(fhd4.estimatedCardWidthPx >= 310);

  // QHD (2560x1440 -> 1824px arena) & 4K (3840x2160 -> 2896px arena): 4 across, container width capped cleanly
  const qhd4 = computeSyncInvariantGridLayout({ availableWidth: 1824, count: 4 });
  assert.equal(qhd4.columns, 4);
  assert.equal(qhd4.containerMaxWidthPx, 1824);

  const uhd4 = computeSyncInvariantGridLayout({ availableWidth: 2896, count: 4 });
  assert.equal(uhd4.columns, 4);
  assert.equal(uhd4.containerMaxWidthPx, 1880);
  assert.ok(uhd4.estimatedCardWidthPx >= 445);
});

test('isBrowserZoomAtLeast150 triggers at 150%+ browser zoom and pinch-zoom without false-triggering on 2x Retina or 4K displays', () => {
  // Standard 1080p (1x) across 100%, 125%, 150%, 175%, 200%
  assert.equal(
    isBrowserZoomAtLeast150({ width: 1920, height: 1080, devicePixelRatio: 1, screenWidth: 1920 }),
    false
  );
  assert.equal(
    isBrowserZoomAtLeast150({ width: 1536, height: 864, devicePixelRatio: 1.25, screenWidth: 1536 }),
    false
  );
  assert.equal(
    isBrowserZoomAtLeast150({ width: 1280, height: 720, devicePixelRatio: 1.5, screenWidth: 1280 }),
    true
  );
  assert.equal(
    isBrowserZoomAtLeast150({ width: 1097, height: 617, devicePixelRatio: 1.75, screenWidth: 1097 }),
    true
  );
  assert.equal(
    isBrowserZoomAtLeast150({ width: 960, height: 540, devicePixelRatio: 2, screenWidth: 960 }),
    true
  );

  // QHD 2560x1440 (1x) at 150% and 200% cold-load
  assert.equal(
    isBrowserZoomAtLeast150({ width: 1707, height: 960, devicePixelRatio: 1.5, screenWidth: 1707 }),
    true
  );
  assert.equal(
    isBrowserZoomAtLeast150({ width: 1280, height: 720, devicePixelRatio: 2.0, screenWidth: 1280 }),
    true
  );

  // Windows 1.25x laptop at 100% (1.25) vs 150% (1.875)
  assert.equal(
    isBrowserZoomAtLeast150({ width: 1536, height: 864, devicePixelRatio: 1.25, screenWidth: 1536 }),
    false
  );
  assert.equal(
    isBrowserZoomAtLeast150({ width: 1024, height: 576, devicePixelRatio: 1.875, screenWidth: 1024 }),
    true
  );

  // 2x Retina MacBook (1440x900 logical = 2880 physical): false at 100% (2.0) and 125% (2.5), true at 150% (3.0)
  assert.equal(
    isBrowserZoomAtLeast150({
      width: 1440,
      height: 900,
      devicePixelRatio: 2,
      screenWidth: 1440,
      isMacPlatform: true
    }),
    false
  );
  assert.equal(
    isBrowserZoomAtLeast150({
      width: 1152,
      height: 720,
      devicePixelRatio: 2.5,
      screenWidth: 1152,
      isMacPlatform: true
    }),
    false
  );
  assert.equal(
    isBrowserZoomAtLeast150({
      width: 960,
      height: 600,
      devicePixelRatio: 3,
      screenWidth: 960,
      isMacPlatform: true
    }),
    true
  );

  // 4K monitor (3840x2160) at 200% OS scaling: false at 100% (2.0) and 125% (2.5), true at 150% (3.0)
  assert.equal(
    isBrowserZoomAtLeast150({
      width: 1920,
      height: 1080,
      devicePixelRatio: 2,
      screenWidth: 1920,
      isMacPlatform: false
    }),
    false
  );
  assert.equal(
    isBrowserZoomAtLeast150({
      width: 1280,
      height: 720,
      devicePixelRatio: 3,
      screenWidth: 1280,
      isMacPlatform: false
    }),
    true
  );

  // Trackpad pinch-zoom >= 1.5 always triggers even on 2x Retina Mac or touch tablet
  assert.equal(
    isBrowserZoomAtLeast150({
      width: 1440,
      height: 900,
      devicePixelRatio: 2,
      visualViewportScale: 1.5,
      screenWidth: 1440,
      isMacPlatform: true
    }),
    true
  );
  assert.equal(
    isBrowserZoomAtLeast150({
      width: 1024,
      height: 768,
      devicePixelRatio: 2,
      visualViewportScale: 1,
      isCoarsePointer: true
    }),
    false
  );
});

test('computeDisplayLayoutMetrics removes sidebar horizontal padding and keeps bottom controls compact when stackBasketsBelow is true', () => {
  const sidebarsOnSides = computeDisplayLayoutMetrics({
    width: 1707,
    height: 960,
    stackBasketsBelow: false
  });
  const stackedBelow = computeDisplayLayoutMetrics({
    width: 1707,
    height: 960,
    stackBasketsBelow: true
  });

  assert.equal(stackedBelow.sidebarWidthPx, null);
  assert.equal(stackedBelow.mainHorizontalPadPx, null);
  assert.equal(stackedBelow.bottomControlsOffsetPx, 10);
  assert.ok(
    stackedBelow.pinMaxScale >= sidebarsOnSides.pinMaxScale,
    'Center constellation pinMaxScale should have at least as much width headroom when sidebars stack below'
  );

  const uhdZoomed = computeDisplayLayoutMetrics({
    width: 2560,
    height: 1440,
    stackBasketsBelow: true
  });
  assert.equal(uhdZoomed.sidebarWidthPx, null);
  assert.equal(uhdZoomed.mainHorizontalPadPx, null);
  assert.equal(uhdZoomed.bottomControlsOffsetPx, 10);
});


