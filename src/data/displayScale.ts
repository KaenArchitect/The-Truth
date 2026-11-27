import { computeDesktopConstellationAvailHeight } from './constellationLayout.ts';

export type DisplayScaleTier = 'standard' | '1440' | '2160';

export interface DisplayScaleInput {
  width: number;
  height: number;
  stackBasketsBelow?: boolean;
}

export interface BrowserZoomDetectionInput {
  width: number;
  height: number;
  devicePixelRatio?: number;
  visualViewportScale?: number;
  baselineDpr?: number | null;
  screenWidth?: number;
  isMacPlatform?: boolean;
  isCoarsePointer?: boolean;
}

export const BROWSER_ZOOM_STACK_THRESHOLD = 1.48;

/**
 * Detects whether browser zoom (either page zoom via Ctrl/Cmd +/- or pinch-zoom via visualViewport)
 * is at 150% or higher so Passed/Failed baskets stack below the center stage like mobile.
 * Avoids false positives on unzoomed 2x Retina Macs, 2x 4K HiDPI displays, and touch tablets.
 */
export function isBrowserZoomAtLeast150({
  width,
  devicePixelRatio = 1,
  visualViewportScale = 1,
  baselineDpr = null,
  screenWidth,
  isMacPlatform = false,
  isCoarsePointer = false
}: BrowserZoomDetectionInput): boolean {
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  const vvScale =
    Number.isFinite(visualViewportScale) && visualViewportScale > 0 ? visualViewportScale : 1;

  // 1. Pinch-zoom (trackpad or touchscreen) at 150%+ always stacks baskets below
  if (vvScale >= BROWSER_ZOOM_STACK_THRESHOLD) {
    return true;
  }

  // 2. Coarse-pointer touch devices: native 2x/3x Retina is unzoomed unless page zoom raised DPR over baseline
  if (isCoarsePointer) {
    if (baselineDpr && baselineDpr > 0) {
      return (dpr * vvScale) / baselineDpr >= BROWSER_ZOOM_STACK_THRESHOLD;
    }
    return false;
  }

  // 3. When unzoomed hardware baseline DPR (1.0 on 1x desktop or 2.0 on Retina/4K HiDPI) was observed in-session
  if (baselineDpr && baselineDpr > 0) {
    return (dpr * vvScale) / baselineDpr >= BROWSER_ZOOM_STACK_THRESHOLD;
  }

  // 4. Cold-load detection when page opens directly at a zoomed level:
  if (dpr < BROWSER_ZOOM_STACK_THRESHOLD) {
    return false;
  }

  // DPR >= 2.95 is >= 150% browser zoom even on native 2x Retina / 4K HiDPI displays (2.0 * 1.5 = 3.0)
  if (dpr >= 2.95) {
    return true;
  }

  // DPR in [1.48, 1.95) (e.g. 1.5 = 150% on 1x, 1.75 = 175% on 1x, 1.875 = 150% on 1.25x Windows)
  // never occurs at 100%-125% browser zoom on 1x, 1.25x, or 2x Retina hardware.
  if (dpr < 1.95) {
    return true;
  }

  // Remaining band [1.95, 2.95) (e.g. 2.0, 2.2, 2.5):
  // Distinguish native 2x Retina Macs (>= 2560px physical width) and 4K@200% monitors (>= 3840px physical width)
  // at 100%-125% zoom from 1080p/1440p displays zoomed to 200%+.
  const effectiveScreenW = screenWidth && screenWidth > 0 ? screenWidth : width;
  const estimatedPhysicalScreenW = effectiveScreenW * dpr;

  if (isMacPlatform && estimatedPhysicalScreenW >= 2500) {
    return false;
  }

  if (!isMacPlatform && estimatedPhysicalScreenW >= 3400) {
    return false;
  }

  return true;
}

export interface DisplayLayoutMetrics {
  tier: DisplayScaleTier;
  arenaScale: number;
  stageSizePx: number;
  sidebarBubbleSizePx: number;
  sidebarWidthPx: number | null;
  mainHorizontalPadPx: number | null;
  pinMaxScale: number;
  bottomControlsOffsetPx: number;
  buttonRowGapPx: number;
}

export const BASE_STAGE_SIZE_PX = 440;
export const BASE_SIDEBAR_BUBBLE_SIZE_PX = 68;

const DEFAULT_FOOTER_HEIGHT_PX = 50;
const ESTIMATED_SETTLED_CONTROLS_HEIGHT_PX = 122;
const ESTIMATED_TOP_HEADROOM_PX = 193;

export function resolveDisplayScaleTier({ width, height }: DisplayScaleInput): DisplayScaleTier {
  const w = Math.max(0, Number(width) || 0);
  const h = Math.max(0, Number(height) || 0);
  if (h >= 1680 || (w >= 3000 && h >= 1500)) return '2160';
  if (h >= 1150 || (w >= 2200 && h >= 1120)) return '1440';
  return 'standard';
}

export function computeDisplayLayoutMetrics({
  width,
  height,
  stackBasketsBelow = false
}: DisplayScaleInput): DisplayLayoutMetrics {
  const w = Math.max(320, Number(width) || 1440);
  const h = Math.max(480, Number(height) || 900);
  const tier = resolveDisplayScaleTier({ width: w, height: h });

  // Mobile & sub-lg tablets retain existing Tailwind responsive rules cleanly
  if (w < 1024) {
    return {
      tier,
      arenaScale: 1,
      stageSizePx: BASE_STAGE_SIZE_PX,
      sidebarBubbleSizePx: BASE_SIDEBAR_BUBBLE_SIZE_PX,
      sidebarWidthPx: null,
      mainHorizontalPadPx: null,
      pinMaxScale: 1,
      bottomControlsOffsetPx: 10,
      buttonRowGapPx: 10
    };
  }

  let sidebarWidthPx: number | null = null;
  let mainHorizontalPadPx: number | null = null;
  let effectiveSidebarReservePerSide = stackBasketsBelow ? 16 : w >= 1280 ? 290 : 244;

  if (!stackBasketsBelow) {
    if (w >= 3000) {
      sidebarWidthPx = 416;
      mainHorizontalPadPx = 472;
      effectiveSidebarReservePerSide = 472;
    } else if (w >= 2200) {
      sidebarWidthPx = 316;
      mainHorizontalPadPx = 368;
      effectiveSidebarReservePerSide = 368;
    }
  }

  let sidebarBubbleSizePx = BASE_SIDEBAR_BUBBLE_SIZE_PX;
  if (w >= 3000) {
    sidebarBubbleSizePx = 120;
  } else if (h >= 1680) {
    sidebarBubbleSizePx = 86;
  } else if (w >= 2200) {
    sidebarBubbleSizePx = 92;
  } else if (h >= 1150 && w >= 1280) {
    sidebarBubbleSizePx = 78;
  }

  const targetArenaScale = tier === '2160' ? 2.24 : tier === '1440' ? 1.72 : 1.48;
  const availableCenterWidth = Math.max(440, w - effectiveSidebarReservePerSide * 2 - 24);
  const maxWidthScale = availableCenterWidth / (BASE_STAGE_SIZE_PX + 12);
  const minScaleFloor = h < 800 ? 0.66 : 0.84;
  const minVerticalDiameterPx =
    h < 800 ? Math.round(BASE_STAGE_SIZE_PX * minScaleFloor) : 400;
  const availableVerticalDiameter = Math.max(
    minVerticalDiameterPx,
    h - ESTIMATED_TOP_HEADROOM_PX * 2
  );
  const maxHeightScale = availableVerticalDiameter / BASE_STAGE_SIZE_PX;
  const compactLaptopScale =
    h < 860 ? Math.max(minScaleFloor, Math.min(1, (h - 376) / BASE_STAGE_SIZE_PX)) : 2.5;

  const rawArenaScale = Math.max(
    minScaleFloor,
    Math.min(targetArenaScale, maxWidthScale, maxHeightScale, compactLaptopScale)
  );
  const arenaScale = Math.round(rawArenaScale * 100) / 100;
  const stageSizePx = Math.round(BASE_STAGE_SIZE_PX * arenaScale);

  const smoothWidthPinScale = Math.round(((availableCenterWidth - 8) / 770) * 100) / 100;
  const pinMaxScale =
    tier === '2160'
      ? Math.max(1.9, Math.min(2.85, smoothWidthPinScale))
      : tier === '1440'
      ? Math.max(1.5, Math.min(2.35, smoothWidthPinScale))
      : Math.max(1, Math.min(1.56, smoothWidthPinScale));

  // Center arena is anchored around 50vh when sidebars flank left/right; when baskets stack below, keep controls tight.
  const arenaBottomY = h * 0.5 + stageSizePx / 2;
  const footerTopY = h - DEFAULT_FOOTER_HEIGHT_PX;
  const targetFooterBreathingPx =
    h >= 1680 ? 90 : h >= 1360 ? 52 : h >= 1150 ? 38 : h >= 1000 ? 32 : 18;

  const naturalOffsetPx =
    footerTopY - arenaBottomY - ESTIMATED_SETTLED_CONTROLS_HEIGHT_PX - targetFooterBreathingPx;
  const minOffsetPx =
    h >= 1680
      ? 28
      : h >= 1150
      ? 18
      : h >= 1000
      ? 12
      : h >= 880
      ? 10
      : h < 800
      ? 8
      : 4;
  const bottomControlsOffsetPx = stackBasketsBelow
    ? 10
    : Math.round(Math.max(minOffsetPx, naturalOffsetPx));

  const buttonRowGapPx =
    h >= 1680 ? 20 : h >= 1150 ? 14 : h < 800 ? 8 : h < 860 ? 10 : 12;

  return {
    tier,
    arenaScale,
    stageSizePx,
    sidebarBubbleSizePx,
    sidebarWidthPx,
    mainHorizontalPadPx,
    pinMaxScale,
    bottomControlsOffsetPx,
    buttonRowGapPx
  };
}

export interface ConstellationScaleInput {
  layoutWidth: number;
  layoutHeight: number;
  layoutNodeScale?: number;
  wrapWidth: number;
  viewportHeight: number;
  pinMaxScale: number;
  orientationMode: 'vertical' | 'horizontal' | 'desktop';
}

/**
 * Computes responsive scale for pinned 2–4 bubble constellations.
 * On desktop, lets harmonic bubbles fill the arena between the pinned bar and footer,
 * allowing the Sync Invariant comparison bar/cards to populate offscreen below.
 */
export function computeConstellationScale({
  layoutWidth,
  layoutHeight,
  layoutNodeScale = 1,
  wrapWidth,
  viewportHeight,
  pinMaxScale,
  orientationMode
}: ConstellationScaleInput): number {
  const safeW = Math.max(1, Number(layoutWidth) || 1);
  const safeH = Math.max(1, Number(layoutHeight) || 1);
  const safeNodeScale = Math.max(0.25, Number(layoutNodeScale) || 1);
  const safeWrap = Math.max(240, Number(wrapWidth) || 240);
  const safeHView = Math.max(480, Number(viewportHeight) || 900);

  const widthFitScale = Math.max(0.32, (safeWrap - 8) / safeW);
  const desktopAvailableHeight = computeDesktopConstellationAvailHeight(safeHView, safeWrap);
  const horizontalAvailableHeight = Math.max(250, safeHView - 250);
  const verticalTwoAvailableHeight = Math.max(460, safeHView - 184);
  const maxContainerScale = pinMaxScale / safeNodeScale;
  const heightFitScale =
    orientationMode === 'desktop'
      ? Math.max(safeHView <= 740 ? 0.62 : 0.68, desktopAvailableHeight / safeH)
      : orientationMode === 'horizontal'
      ? Math.max(0.58, horizontalAvailableHeight / safeH)
      : orientationMode === 'vertical' && safeH <= 900
      ? Math.max(0.6, verticalTwoAvailableHeight / safeH)
      : maxContainerScale;

  const rawScale = Math.min(maxContainerScale, widthFitScale, heightFitScale);
  return Math.round(rawScale * 1000) / 1000;
}

export interface FloatingCornerControlsInput {
  isAnyModalOpen: boolean;
  isTutorialOpen: boolean;
  isLandingIdle: boolean;
  isMultiStage: boolean;
  isAuditing: boolean;
  hasActiveHoveredInvariant: boolean;
}

/**
 * Tutorial (bottom-left) and Donate (bottom-right) float persistently in the viewport corners
 * during scroll, and hide automatically when any modal/tutorial is open or when a quick-scan
 * card is pulled for a single bubble.
 */
export function shouldShowFloatingCornerControls({
  isAnyModalOpen,
  isTutorialOpen,
  isLandingIdle,
  isMultiStage,
  isAuditing,
  hasActiveHoveredInvariant
}: FloatingCornerControlsInput): boolean {
  if (isAnyModalOpen || isTutorialOpen) return false;
  if (!isLandingIdle && !isMultiStage && !isAuditing && hasActiveHoveredInvariant) {
    return false;
  }
  return true;
}

export interface SyncInvariantGridInput {
  availableWidth: number;
  count: number;
}

export interface SyncInvariantGridLayout {
  columns: 1 | 2 | 3 | 4;
  containerMaxWidthPx: number;
  estimatedCardWidthPx: number;
}

const SYNC_GRID_GAP_PX = 14;
const SYNC_DRAWER_H_PAD_WIDE_PX = 40;
const SYNC_DRAWER_H_PAD_NARROW_PX = 32;
const MIN_CARD_WIDTH_2COL_PX = 250;
const MIN_CARD_WIDTH_3COL_PX = 260;
const MIN_CARD_WIDTH_4COL_PX = 265;

const MAX_CONTAINER_BY_COLUMNS: Record<1 | 2 | 3 | 4, number> = {
  1: 720,
  2: 1180,
  3: 1560,
  4: 1880
};

function computeCardWidthForColumns(containerWidth: number, columns: 1 | 2 | 3 | 4): number {
  const drawerPad = containerWidth >= 640 ? SYNC_DRAWER_H_PAD_WIDE_PX : SYNC_DRAWER_H_PAD_NARROW_PX;
  const innerWidth = Math.max(200, containerWidth - drawerPad);
  return Math.round(((innerWidth - (columns - 1) * SYNC_GRID_GAP_PX) / columns) * 10) / 10;
}

/**
 * Deterministically picks 1–4 side-by-side description columns for the Sync Invariant drawer
 * from the measured center-arena width and pinned asset count so wide displays fit 3 or 4
 * descriptions cleanly across one row while narrower viewports fall back without squishing.
 */
export function computeSyncInvariantGridLayout({
  availableWidth,
  count
}: SyncInvariantGridInput): SyncInvariantGridLayout {
  const safeAvail = Math.max(280, Math.floor(Number(availableWidth) || 320));
  const safeCount = Math.max(1, Math.min(4, Math.floor(Number(count) || 1)));

  let columns: 1 | 2 | 3 | 4 = 1;

  if (safeCount >= 4 && computeCardWidthForColumns(safeAvail, 4) >= MIN_CARD_WIDTH_4COL_PX) {
    columns = 4;
  } else if (safeCount === 3 && computeCardWidthForColumns(safeAvail, 3) >= MIN_CARD_WIDTH_3COL_PX) {
    columns = 3;
  } else if (safeCount >= 2 && computeCardWidthForColumns(safeAvail, 2) >= MIN_CARD_WIDTH_2COL_PX) {
    columns = 2;
  }

  const containerMaxWidthPx = Math.min(safeAvail, MAX_CONTAINER_BY_COLUMNS[columns]);
  const estimatedCardWidthPx = computeCardWidthForColumns(containerMaxWidthPx, columns);

  return {
    columns,
    containerMaxWidthPx,
    estimatedCardWidthPx
  };
}
