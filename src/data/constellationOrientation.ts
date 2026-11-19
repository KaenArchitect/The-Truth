export type PinOrientationMode = 'vertical' | 'horizontal' | 'desktop';

export interface ViewportOrientationInput {
  width: number;
  height: number;
  isCoarsePointer?: boolean;
}

/**
 * Matches constellation pinning layout to physical device orientation across
 * mobile and tablet viewports:
 * - Portrait mobile/tablet (< 1280px wide, height > width): vertical stack
 * - Landscape mobile/tablet (width > height, < 1280px or coarse touch tablet <= 1400px): horizontal side-by-side
 * - Desktop landscape (>= 1280px non-touch): full desktop formation selector
 */
export function resolvePinOrientationMode({
  width,
  height,
  isCoarsePointer = false
}: ViewportOrientationInput): PinOrientationMode {
  const safeW = Math.max(0, width);
  const safeH = Math.max(0, height);
  const isPortrait = safeH > safeW;
  const isTabletOrMobile = safeW < 1240 || (isCoarsePointer && safeW <= 1400);

  if (!isTabletOrMobile) {
    return isPortrait ? 'vertical' : 'desktop';
  }

  return isPortrait ? 'vertical' : 'horizontal';
}
