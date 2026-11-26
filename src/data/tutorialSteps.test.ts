import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IN_APP_AD_BROWSER_BOTTOM_OFFSET_PX,
  MOBILE_BOTTOM_AD_SAFE_OFFSET_PX,
  MOBILE_TUTORIAL_STEPS,
  TUTORIAL_STEPS,
  TUTORIAL_STORAGE_KEY,
  clampTutorialStepIndex,
  computeMobileScrollTargetY,
  computeSpotlightCardPosition,
  getMobileBottomClearancePx,
  getTutorialStepsForViewport,
  isBottomChromeInAppBrowser
} from './tutorialSteps.ts';

test('TUTORIAL_STEPS covers all 6 core capabilities plus the hidden Easter Egg step with sequential numbers', () => {
  assert.equal(TUTORIAL_STEPS.length, 7);
  assert.equal(TUTORIAL_STORAGE_KEY, 'truth_tutorial_seen_v1');

  const ids = new Set<string>();
  TUTORIAL_STEPS.forEach((step, idx) => {
    assert.equal(step.stepNumber, idx + 1);
    assert.ok(step.title.length > 5);
    assert.ok(step.summary.length > 20);
    assert.ok(step.instructions.length >= 2);
    assert.ok(!ids.has(step.id), `Duplicate tutorial step id: ${step.id}`);
    ids.add(step.id);
  });

  const easterEggStep = TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1];
  assert.equal(easterEggStep.isEasterEggStep, true);
  assert.equal(easterEggStep.targetId, 'mystery-beacon');
  assert.match(easterEggStep.title, /Easter Egg/i);
  assert.match(easterEggStep.summary, /0\/6/);
});

test('MOBILE_TUTORIAL_STEPS breaks the tutorial into 11 concise non-blocking micro-steps including the Easter Egg', () => {
  assert.equal(MOBILE_TUTORIAL_STEPS.length, 11);
  const ids = new Set<string>();

  MOBILE_TUTORIAL_STEPS.forEach((step, idx) => {
    assert.equal(step.stepNumber, idx + 1);
    assert.ok(step.title.length > 5 && step.title.length <= 42);
    assert.ok(step.summary.length > 20 && step.summary.length <= 130);
    assert.equal(step.instructions.length, 0);
    assert.ok(!ids.has(step.id), `Duplicate mobile tutorial step id: ${step.id}`);
    ids.add(step.id);
  });

  const mobileEasterEgg = MOBILE_TUTORIAL_STEPS[MOBILE_TUTORIAL_STEPS.length - 1];
  assert.equal(mobileEasterEgg.isEasterEggStep, true);
  assert.equal(mobileEasterEgg.targetId, 'mystery-beacon');
  assert.match(mobileEasterEgg.title, /Easter Egg/i);

  assert.equal(getTutorialStepsForViewport(390), MOBILE_TUTORIAL_STEPS);
  assert.equal(getTutorialStepsForViewport(768), TUTORIAL_STEPS);
  assert.equal(getTutorialStepsForViewport(1440), TUTORIAL_STEPS);
});

test('clampTutorialStepIndex clamps out-of-range indices cleanly', () => {
  assert.equal(clampTutorialStepIndex(-4), 0);
  assert.equal(clampTutorialStepIndex(0), 0);
  assert.equal(clampTutorialStepIndex(3), 3);
  assert.equal(clampTutorialStepIndex(99), TUTORIAL_STEPS.length - 1);
  assert.equal(clampTutorialStepIndex(10, MOBILE_TUTORIAL_STEPS.length), 10);
  assert.equal(clampTutorialStepIndex(99, MOBILE_TUTORIAL_STEPS.length), 10);
  assert.equal(clampTutorialStepIndex(2.8), 2);
});

test('isBottomChromeInAppBrowser detects Facebook, Messenger, Instagram, and TikTok WebViews', () => {
  const fbIosUa =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/455.0.0.32.104;]';
  const fbAndroidUa =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 [FB_IAB/FB4A;FBAV/454.0.0.39.118;]';
  const igUa =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) Instagram 323.0.0.23.91';
  const safariUa =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) Version/17.4 Mobile/15E148 Safari/604.1';

  assert.equal(isBottomChromeInAppBrowser(fbIosUa), true);
  assert.equal(isBottomChromeInAppBrowser(fbAndroidUa), true);
  assert.equal(isBottomChromeInAppBrowser(igUa), true);
  assert.equal(isBottomChromeInAppBrowser(safariUa), false);

  assert.equal(getMobileBottomClearancePx(fbIosUa), IN_APP_AD_BROWSER_BOTTOM_OFFSET_PX);
  assert.equal(getMobileBottomClearancePx(safariUa), MOBILE_BOTTOM_AD_SAFE_OFFSET_PX);
});

test('computeSpotlightCardPosition lifts mobile text boxes well above bottom browser ad banners', () => {
  // Desktop bottom placement below search bar
  const searchRect = { top: 240, left: 420, width: 600, height: 52 };
  const belowPos = computeSpotlightCardPosition(
    searchRect,
    { width: 1440, height: 900 },
    { width: 396, height: 320 },
    'bottom'
  );
  assert.equal(belowPos.placement, 'bottom');
  assert.ok(belowPos.top >= searchRect.top + searchRect.height);
  assert.ok(belowPos.left >= 16 && belowPos.left + belowPos.width <= 1424);

  // Desktop right placement beside left sidebar
  const sidebarRect = { top: 116, left: 24, width: 250, height: 700 };
  const rightPos = computeSpotlightCardPosition(
    sidebarRect,
    { width: 1440, height: 900 },
    { width: 396, height: 320 },
    'right'
  );
  assert.equal(rightPos.placement, 'right');
  assert.ok(rightPos.left >= sidebarRect.left + sidebarRect.width);

  // Falls back above when bottom space is tight
  const lowTargetRect = { top: 760, left: 500, width: 400, height: 80 };
  const flippedPos = computeSpotlightCardPosition(
    lowTargetRect,
    { width: 1440, height: 900 },
    { width: 396, height: 320 },
    'bottom'
  );
  assert.equal(flippedPos.placement, 'top');
  assert.ok(flippedPos.top + 320 <= lowTargetRect.top);

  // Mobile (<768px) elevates bottom sheet at least MOBILE_BOTTOM_AD_SAFE_OFFSET_PX (136px) above bottom edge
  const mobileTopTargetPos = computeSpotlightCardPosition(
    { top: 120, left: 16, width: 358, height: 60 },
    { width: 390, height: 844 },
    { width: 366, height: 175 },
    'bottom'
  );
  assert.equal(mobileTopTargetPos.placement, 'mobile-sheet');
  assert.equal(mobileTopTargetPos.left, 12);
  assert.equal(mobileTopTargetPos.width, 366);
  assert.ok(
    mobileTopTargetPos.top + 175 <= 844 - MOBILE_BOTTOM_AD_SAFE_OFFSET_PX,
    `Expected mobile card bottom (${mobileTopTargetPos.top + 175}) to clear bottom ${MOBILE_BOTTOM_AD_SAFE_OFFSET_PX}px ad zone`
  );

  // Facebook in-app browser clearance lifts card even higher (160px above bottom edge)
  const fbMobilePos = computeSpotlightCardPosition(
    { top: 120, left: 16, width: 358, height: 60 },
    { width: 390, height: 844 },
    { width: 366, height: 175 },
    'bottom',
    IN_APP_AD_BROWSER_BOTTOM_OFFSET_PX
  );
  assert.equal(fbMobilePos.placement, 'mobile-sheet');
  assert.ok(fbMobilePos.top + 175 <= 844 - IN_APP_AD_BROWSER_BOTTOM_OFFSET_PX);

  // Lower target automatically flips to mobile-top (top: 12px), hundreds of pixels above bottom ads
  const mobileCenterSpherePos = computeSpotlightCardPosition(
    { top: 307, left: 23, width: 344, height: 344 },
    { width: 390, height: 844 },
    { width: 366, height: 175 },
    'top'
  );
  assert.equal(mobileCenterSpherePos.placement, 'mobile-top');
  assert.equal(mobileCenterSpherePos.top, 12);
  assert.ok(mobileCenterSpherePos.top + 175 < 307);
});

test('computeMobileScrollTargetY keeps header, mystery-beacon, center-arena, and sidebars clear of elevated mobile coach card', () => {
  // Top header controls always return to scrollY = 0
  assert.equal(computeMobileScrollTargetY('search-dock', 320, 48, 844, 198, 900), 0);
  assert.equal(computeMobileScrollTargetY('mode-controls', 160, 32, 844, 198, 900), 0);
  assert.equal(computeMobileScrollTargetY('mystery-beacon', 140, 44, 844, 198, 900), 0);

  // Bottom footer controls (Rubric & Live Gains on mobile) scroll cleanly below the top card sheet
  const rubricScrollY = computeMobileScrollTargetY('rubric-button', 1280, 36, 844, 198, 906);
  assert.ok(1280 - rubricScrollY - 10 > 210);
  const gainsScrollY = computeMobileScrollTargetY('gains-archive', 1324, 36, 844, 198, 906);
  assert.ok(1324 - gainsScrollY - 10 > 210);

  // Center arena (343px tall) is scrolled so it fits cleanly above the elevated bottom card sheet (top = 510)
  const arenaScrollY = computeMobileScrollTargetY('center-arena', 290, 343, 844, 198, 900);
  const arenaTop = 290 - arenaScrollY;
  const arenaBottom = arenaTop + 343 + 10;
  assert.ok(arenaTop >= 16);
  assert.ok(arenaBottom < 844 - 198 - MOBILE_BOTTOM_AD_SAFE_OFFSET_PX);

  // Passed sidebar (334px tall) sits cleanly above the elevated bottom card sheet
  const passedScrollY = computeMobileScrollTargetY('passed-sidebar', 920, 334, 844, 198, 900);
  const passedTop = 920 - passedScrollY;
  const passedBottom = passedTop + 334 + 10;
  assert.ok(passedTop >= 16);
  assert.ok(passedBottom < 844 - 198 - MOBILE_BOTTOM_AD_SAFE_OFFSET_PX);

  // Failed sidebar clamped near bottom of doc stays below top card slot (12 + 198 = 210)
  const failedScrollY = computeMobileScrollTargetY('failed-sidebar', 1280, 334, 844, 198, 906);
  const failedPaddedTop = 1280 - failedScrollY - 10;
  assert.ok(failedPaddedTop > 220);
});
