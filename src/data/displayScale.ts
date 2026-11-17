export type DisplayScaleTier = 'standard' | '1440' | '2160';

export interface DisplayScaleInput {
  width: number;
  height: number;
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
  if (h >= 1680 || w >= 3000) return '2160';
  if (h >= 1150 || w >= 2200) return '1440';
  return 'standard';
}

export function computeDisplayLayoutMetrics({
  width,
  height
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
  let effectiveSidebarReservePerSide = w >= 1280 ? 290 : 244;

  if (w >= 3000) {
    sidebarWidthPx = 416;
    mainHorizontalPadPx = 472;
    effectiveSidebarReservePerSide = 472;
  } else if (w >= 2200) {
    sidebarWidthPx = 316;
    mainHorizontalPadPx = 368;
    effectiveSidebarReservePerSide = 368;
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
  const availableVerticalDiameter = Math.max(400, h - ESTIMATED_TOP_HEADROOM_PX * 2);
  const maxHeightScale = availableVerticalDiameter / BASE_STAGE_SIZE_PX;
  const compactLaptopScale =
    h < 860 ? Math.max(0.84, Math.min(1, (h - 376) / BASE_STAGE_SIZE_PX)) : 2.5;

  const rawArenaScale = Math.max(
    0.84,
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

  // Center arena is anchored around 50vh. Position bottom controls cleanly toward the lower band above footer.
  const arenaBottomY = h * 0.5 + stageSizePx / 2;
  const footerTopY = h - DEFAULT_FOOTER_HEIGHT_PX;
  const targetFooterBreathingPx =
    tier === '2160' ? 90 : tier === '1440' ? (h >= 1360 ? 52 : 38) : h >= 1000 ? 32 : 18;

  const naturalOffsetPx =
    footerTopY - arenaBottomY - ESTIMATED_SETTLED_CONTROLS_HEIGHT_PX - targetFooterBreathingPx;
  const minOffsetPx =
    tier === '2160' ? 28 : tier === '1440' ? 18 : h >= 1000 ? 12 : h >= 880 ? 10 : 4;
  const bottomControlsOffsetPx = Math.round(Math.max(minOffsetPx, naturalOffsetPx));

  const buttonRowGapPx = tier === '2160' ? 20 : tier === '1440' ? 14 : h < 860 ? 10 : 12;

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
  const desktopAvailableHeight = Math.max(360, safeHView - 326);
  const verticalTwoAvailableHeight = Math.max(460, safeHView - 184);
  const maxContainerScale = pinMaxScale / safeNodeScale;
  const heightFitScale =
    orientationMode === 'desktop'
      ? Math.max(0.76, desktopAvailableHeight / safeH)
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

