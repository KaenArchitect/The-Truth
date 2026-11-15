import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MOBILE_TUTORIAL_STEPS,
  TUTORIAL_STEPS,
  TUTORIAL_STORAGE_KEY,
  clampTutorialStepIndex,
  computeMobileScrollTargetY,
  computeSpotlightCardPosition,
  getTutorialStepsForViewport
} from './tutorialSteps.ts';

test('TUTORIAL_STEPS covers all 6 core capabilities with unique IDs and sequential numbers', () => {
  assert.equal(TUTORIAL_STEPS.length, 6);
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
});

test('MOBILE_TUTORIAL_STEPS breaks the tutorial into 10 concise non-blocking micro-steps', () => {
  assert.equal(MOBILE_TUTORIAL_STEPS.length, 10);
  const ids = new Set<string>();

  MOBILE_TUTORIAL_STEPS.forEach((step, idx) => {
    assert.equal(step.stepNumber, idx + 1);
    assert.ok(step.title.length > 5 && step.title.length <= 42);
    assert.ok(step.summary.length > 20 && step.summary.length <= 130);
    assert.equal(step.instructions.length, 0);
    assert.ok(!ids.has(step.id), `Duplicate mobile tutorial step id: ${step.id}`);
    ids.add(step.id);
  });

  assert.equal(getTutorialStepsForViewport(390), MOBILE_TUTORIAL_STEPS);
  assert.equal(getTutorialStepsForViewport(768), TUTORIAL_STEPS);
  assert.equal(getTutorialStepsForViewport(1440), TUTORIAL_STEPS);
});

test('clampTutorialStepIndex clamps out-of-range indices cleanly', () => {
  assert.equal(clampTutorialStepIndex(-4), 0);
  assert.equal(clampTutorialStepIndex(0), 0);
  assert.equal(clampTutorialStepIndex(3), 3);
  assert.equal(clampTutorialStepIndex(99), TUTORIAL_STEPS.length - 1);
  assert.equal(clampTutorialStepIndex(9, MOBILE_TUTORIAL_STEPS.length), 9);
  assert.equal(clampTutorialStepIndex(99, MOBILE_TUTORIAL_STEPS.length), 9);
  assert.equal(clampTutorialStepIndex(2.8), 2);
});

test('computeSpotlightCardPosition returns non-overlapping desktop placement and compact mobile placement', () => {
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

  // Mobile (<768px) uses compact bottom sheet when target is near the top, and flips to mobile-top when target is lower
  const mobileTopTargetPos = computeSpotlightCardPosition(
    { top: 120, left: 16, width: 358, height: 60 },
    { width: 390, height: 844 },
    { width: 366, height: 175 },
    'bottom'
  );
  assert.equal(mobileTopTargetPos.placement, 'mobile-sheet');
  assert.equal(mobileTopTargetPos.left, 12);
  assert.equal(mobileTopTargetPos.width, 366);
  assert.ok(mobileTopTargetPos.top >= 640);

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

test('computeMobileScrollTargetY keeps header, center-arena, and sidebars clear of the mobile coach card', () => {
  // Header controls always return to scrollY = 0
  assert.equal(computeMobileScrollTargetY('search-dock', 320, 48, 844, 198, 900), 0);
  assert.equal(computeMobileScrollTargetY('gains-archive', 64, 32, 844, 198, 900), 0);
  assert.equal(computeMobileScrollTargetY('rubric-button', 20, 32, 844, 198, 900), 0);
  assert.equal(computeMobileScrollTargetY('mode-controls', 160, 32, 844, 198, 900), 0);

  // Center arena (343px tall) is scrolled so it fits cleanly above the bottom card sheet
  const arenaScrollY = computeMobileScrollTargetY('center-arena', 290, 343, 844, 198, 900);
  const arenaTop = 290 - arenaScrollY;
  const arenaBottom = arenaTop + 343 + 10;
  assert.ok(arenaTop >= 16);
  assert.ok(arenaBottom < 634);

  // Passed sidebar (334px tall) sits cleanly above the bottom card sheet
  const passedScrollY = computeMobileScrollTargetY('passed-sidebar', 920, 334, 844, 198, 900);
  const passedTop = 920 - passedScrollY;
  const passedBottom = passedTop + 334 + 10;
  assert.ok(passedTop >= 16);
  assert.ok(passedBottom < 634);

  // Failed sidebar clamped near bottom of doc stays below top card slot (12 + 198 = 210)
  const failedScrollY = computeMobileScrollTargetY('failed-sidebar', 1280, 334, 844, 198, 906);
  const failedPaddedTop = 1280 - failedScrollY - 10;
  assert.ok(failedPaddedTop > 220);
});
