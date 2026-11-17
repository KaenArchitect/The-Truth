import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PIN_HEX_HALF_HEIGHT_PX,
  PIN_HEX_HALF_WIDTH_PX,
  getConstellationLayout,
  measureConstellationClearance
} from './constellationLayout.ts';
import { computeDisplayLayoutMetrics } from './displayScale.ts';

function computeWrapWidth(w: number, h: number): number {
  if (w < 768) return Math.max(280, w - 24);
  const dm = computeDisplayLayoutMetrics({ width: w, height: h });
  const reserve = dm.mainHorizontalPadPx ?? (w >= 1280 ? 290 : w >= 1024 ? 244 : 196);
  return Math.max(320, w - reserve * 2);
}

test('deterministic constellations maintain guaranteed wave & button overlap buffer across 2, 3, and 4 pins on all viewports', () => {
  const viewports = [
    [1280, 800],
    [1440, 900],
    [1920, 1080],
    [2560, 1440],
    [3840, 2160],
    [1295, 1250]
  ] as const;

  for (const [w, h] of viewports) {
    const dm = computeDisplayLayoutMetrics({ width: w, height: h });
    const wrapWidth = computeWrapWidth(w, h);

    for (const count of [2, 3, 4] as const) {
      const layout = getConstellationLayout(count, 'desktop', {
        wrapWidth,
        viewportHeight: h,
        pinMaxScale: dm.pinMaxScale
      });

      assert.ok(
        layout.width <= wrapWidth,
        `${count}-pin at ${w}x${h}: layout.width (${layout.width}) must stay <= wrapWidth (${wrapWidth})`
      );

      const hw = PIN_HEX_HALF_WIDTH_PX * layout.nodeScale;
      const hh = PIN_HEX_HALF_HEIGHT_PX * layout.nodeScale;
      for (const pos of layout.positions) {
        assert.ok(
          pos.x - hw >= -1 && pos.x + hw <= layout.width + 1,
          `${count}-pin at ${w}x${h}: bubble horizontally out of bounds`
        );
        assert.ok(
          pos.y - hh >= -1 && pos.y + hh <= layout.height + 1,
          `${count}-pin at ${w}x${h}: bubble vertically out of bounds`
        );
      }

      const clearance = measureConstellationClearance(layout.positions, layout.nodeScale);
      assert.ok(
        clearance.minSatWaveGapPx >= 7.5,
        `${count}-pin at ${w}x${h}: wave crest overlap buffer too small (${clearance.minSatWaveGapPx.toFixed(1)}px)`
      );
      assert.ok(
        clearance.minSatButtonGapPx >= Math.max(14, 24 * layout.nodeScale),
        `${count}-pin at ${w}x${h}: satellite button gap too small (${clearance.minSatButtonGapPx.toFixed(1)}px)`
      );
      assert.ok(
        clearance.minNucleusGapPx >= 20,
        `${count}-pin at ${w}x${h}: nucleus gap too small (${clearance.minNucleusGapPx.toFixed(1)}px)`
      );
    }
  }
});

test('4-pin deterministic layout chooses horizontal zig-zag on widescreen displays for maximum bubble size', () => {
  for (const [w, h, minScale] of [
    [1280, 800, 0.64],
    [1440, 900, 0.78],
    [1920, 1080, 1.05],
    [2560, 1440, 1.55],
    [3840, 2160, 2.55]
  ] as const) {
    const dm = computeDisplayLayoutMetrics({ width: w, height: h });
    const wrapWidth = computeWrapWidth(w, h);
    const zig = getConstellationLayout(4, 'desktop', {
      wrapWidth,
      viewportHeight: h,
      pinMaxScale: dm.pinMaxScale
    });

    assert.ok(
      zig.nodeScale >= minScale,
      `Expected ${w}x${h} 4-pin zig-zag >= ${minScale}, got ${zig.nodeScale}`
    );
    assert.equal(zig.positions.length, 4);
    // Horizontal zig-zag: monotonically increasing x left-to-right and alternating top/bottom/top/bottom y
    assert.ok(
      zig.positions[0].x < zig.positions[1].x &&
        zig.positions[1].x < zig.positions[2].x &&
        zig.positions[2].x < zig.positions[3].x,
      `${w}x${h}: expected left-to-right x ordering in zig-zag`
    );
    assert.ok(
      Math.abs(zig.positions[0].y - zig.positions[2].y) < 1 &&
        Math.abs(zig.positions[1].y - zig.positions[3].y) < 1 &&
        zig.positions[0].y < zig.positions[1].y,
      `${w}x${h}: expected alternating high/low horizontal zig-zag y coordinates`
    );
  }
});

test('dynamic fitting expands 1440x900 and 1920x1080 constellations without bottom clipping', () => {
  const dm900 = computeDisplayLayoutMetrics({ width: 1440, height: 900 });
  const wrap900 = computeWrapWidth(1440, 900);
  const two900 = getConstellationLayout(2, 'desktop', {
    wrapWidth: wrap900,
    viewportHeight: 900,
    pinMaxScale: dm900.pinMaxScale
  });
  assert.ok(two900.nodeScale >= 1.05, `Expected 1440x900 2-pin >= 1.05, got ${two900.nodeScale}`);

  const dm1080 = computeDisplayLayoutMetrics({ width: 1920, height: 1080 });
  const wrap1080 = computeWrapWidth(1920, 1080);

  const two1080 = getConstellationLayout(2, 'desktop', {
    wrapWidth: wrap1080,
    viewportHeight: 1080,
    pinMaxScale: dm1080.pinMaxScale
  });
  const tri1080 = getConstellationLayout(3, 'desktop', {
    wrapWidth: wrap1080,
    viewportHeight: 1080,
    pinMaxScale: dm1080.pinMaxScale
  });
  const zig1080 = getConstellationLayout(4, 'desktop', {
    wrapWidth: wrap1080,
    viewportHeight: 1080,
    pinMaxScale: dm1080.pinMaxScale
  });

  assert.ok(
    two1080.nodeScale >= 1.5 && two1080.nodeScale <= 1.6,
    `Expected 1080p 2-pin scale between 1.50 and 1.60, got ${two1080.nodeScale}`
  );
  assert.ok(
    274 + two1080.height <= 960,
    `Expected 1080p 2-pin constellation bottom (${274 + two1080.height}px) to remain comfortably inside viewport`
  );
  assert.ok(
    274 + zig1080.height <= 1036,
    `Expected 1080p 4-pin zig-zag bottom (${274 + zig1080.height}px) to fit cleanly within 1080p viewport`
  );
  const dm950 = computeDisplayLayoutMetrics({ width: 1920, height: 950 });
  const two950 = getConstellationLayout(2, 'desktop', {
    wrapWidth: wrap1080,
    viewportHeight: 950,
    pinMaxScale: dm950.pinMaxScale
  });
  assert.ok(
    274 + two950.height <= 920,
    `Expected 1920x950 browser-window 2-pin bottom (${274 + two950.height}px) to fit without clipping`
  );
  assert.ok(tri1080.nodeScale >= 1.15, `Expected 1080p 3-pin >= 1.15, got ${tri1080.nodeScale}`);
  assert.ok(zig1080.nodeScale >= 1.05, `Expected 1080p 4-pin zig-zag >= 1.05, got ${zig1080.nodeScale}`);
});

test('mobile vertical and tablet horizontal orientations keep non-overlapping buffers and fit mobile 2-pin in one screen', () => {
  for (const [w, h] of [
    [366, 740],
    [390, 844]
  ] as const) {
    const wrapW = w - 24;
    const layout2 = getConstellationLayout(2, 'vertical', {
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
    const horiz = getConstellationLayout(count, 'horizontal', {
      wrapWidth: 960,
      viewportHeight: 680,
      pinMaxScale: 1
    });
    assert.ok(horiz.width <= 960);
    const clr = measureConstellationClearance(horiz.positions, horiz.nodeScale);
    assert.ok(clr.minSatWaveGapPx >= 7.5 && clr.minSatButtonGapPx >= 20);
  }
});

import {
  PIN_NUCLEUS_UNSPLIT_WAVE_RADIUS_PX,
  computeCollapsedDeltaLinks,
  resolveDeltaFlowDirection
} from './constellationLayout.ts';

test('collapsed harmonic wave delta links enlarge pills and keep zero overlap across 2, 3, and 4 pins', () => {
  const desktopViewports = [
    [1280, 800],
    [1440, 900],
    [1920, 1080],
    [2560, 1440],
    [2560, 1080],
    [2560, 950],
    [1920, 820],
    [1600, 760],
    [3840, 2160],
    [1295, 1250]
  ] as const;

  for (const [w, h] of desktopViewports) {
    const dm = computeDisplayLayoutMetrics({ width: w, height: h });
    const wrapWidth = computeWrapWidth(w, h);

    for (const count of [2, 3, 4] as const) {
      const layout = getConstellationLayout(count, 'desktop', {
        wrapWidth,
        viewportHeight: h,
        pinMaxScale: dm.pinMaxScale
      });
      const links = computeCollapsedDeltaLinks(layout);
      assert.ok(links.length >= count - 1, `${count}-pin at ${w}x${h}: expected delta links`);

      const waveR = PIN_NUCLEUS_UNSPLIT_WAVE_RADIUS_PX * layout.nodeScale;
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        assert.ok(link.pillWidth >= 86, `expected enlarged pillWidth >= 86, got ${link.pillWidth}`);
        assert.ok(link.pillHeight >= 30, `expected enlarged pillHeight >= 30, got ${link.pillHeight}`);
        assert.ok(link.fontSize >= 13.5, `expected enlarged fontSize >= 13.5, got ${link.fontSize}`);
        assert.ok(link.strokeWidth >= 2.2, `expected enlarged strokeWidth >= 2.2, got ${link.strokeWidth}`);

        // Verify the delta line itself never passes behind or grazes an intermediate node's wave crest
        for (let k = 0; k < layout.positions.length; k++) {
          if (k === link.fromIdx || k === link.toIdx) continue;
          const nk = layout.positions[k];
          const vx = link.x2 - link.x1;
          const vy = link.y2 - link.y1;
          const lenSq = vx * vx + vy * vy;
          const t = lenSq > 1e-6 ? Math.max(0, Math.min(1, ((nk.x - link.x1) * vx + (nk.y - link.y1) * vy) / lenSq)) : 0;
          const segDist = Math.hypot(nk.x - (link.x1 + vx * t), nk.y - (link.y1 + vy * t));
          assert.ok(
            segDist >= waveR + 10 * layout.nodeScale,
            `${count}-pin at ${w}x${h} link ${link.id}: line passes behind node ${k} (${segDist.toFixed(1)} < ${(waveR + 10 * layout.nodeScale).toFixed(1)})`
          );
        }

        for (const pos of layout.positions) {
          const qx = Math.max(
            link.pillX - link.pillWidth * 0.5,
            Math.min(link.pillX + link.pillWidth * 0.5, pos.x)
          );
          const qy = Math.max(
            link.pillY - link.pillHeight * 0.5,
            Math.min(link.pillY + link.pillHeight * 0.5, pos.y)
          );
          const waveClr = Math.hypot(pos.x - qx, pos.y - qy) - waveR;
          assert.ok(
            waveClr >= 5.5,
            `${count}-pin at ${w}x${h} link ${link.id}: pill too close to collapsed wave (${waveClr.toFixed(1)}px)`
          );
        }

        for (let j = i + 1; j < links.length; j++) {
          const other = links[j];
          const overlapX = Math.abs(link.pillX - other.pillX) < (link.pillWidth + other.pillWidth) * 0.5 + 4;
          const overlapY = Math.abs(link.pillY - other.pillY) < (link.pillHeight + other.pillHeight) * 0.5 + 4;
          assert.ok(
            !(overlapX && overlapY),
            `${count}-pin at ${w}x${h}: delta pills ${link.id} and ${other.id} overlap`
          );
        }
      }
    }
  }

  // Mobile vertical 2-pin check
  const mobileLayout = getConstellationLayout(2, 'vertical', {
    wrapWidth: 366,
    viewportHeight: 844,
    pinMaxScale: 1
  });
  const mobileLinks = computeCollapsedDeltaLinks(mobileLayout);
  assert.equal(mobileLinks.length, 1);
  assert.ok(mobileLinks[0].pillWidth >= 86);
  assert.ok(mobileLinks[0].pillHeight >= 30);
});

test('resolveDeltaFlowDirection points toward higher grade, breaks grade ties by score, and returns tie when equal', () => {
  assert.equal(
    resolveDeltaFlowDirection({ grade: 'A+', totalScore: 6.0 }, { grade: 'B+', totalScore: 4.4 }),
    'toA'
  );
  assert.equal(
    resolveDeltaFlowDirection({ grade: 'F', totalScore: 0.0 }, { grade: 'B+', totalScore: 4.4 }),
    'toB'
  );
  assert.equal(
    resolveDeltaFlowDirection({ grade: 'B', totalScore: 4.1 }, { grade: 'B', totalScore: 4.35 }),
    'toB'
  );
  assert.equal(
    resolveDeltaFlowDirection({ grade: 'A-', totalScore: 4.9 }, { grade: 'B+', totalScore: 4.9 }),
    'toA'
  );
  assert.equal(
    resolveDeltaFlowDirection({ grade: 'F', totalScore: 0.0 }, { grade: 'F', totalScore: 0.0 }),
    'tie'
  );
});

