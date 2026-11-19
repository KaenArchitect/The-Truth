import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRUTH_HOME_QUOTES,
  parseQuoteAroundTitle,
  pickNextUnusedQuoteIndex,
  resolveVisibleTruthBubbleCount,
  tokenizeTruthQuote
} from './truthQuotes.ts';

test('TRUTH_HOME_QUOTES contains 80 quotes heavily featuring Biblical verses and physics theorists', () => {
  assert.ok(
    TRUTH_HOME_QUOTES.length >= 75,
    `expected at least 75 quotes, got ${TRUTH_HOME_QUOTES.length}`
  );
  assert.equal(TRUTH_HOME_QUOTES[0].quote, "You can't handle the truth!");
  assert.equal(TRUTH_HOME_QUOTES[1].category, 'scripture');
  assert.equal(TRUTH_HOME_QUOTES[2].category, 'physics');

  const scriptureCount = TRUTH_HOME_QUOTES.filter((q) => q.category === 'scripture').length;
  const physicsCount = TRUTH_HOME_QUOTES.filter((q) => q.category === 'physics').length;
  const classicCount = TRUTH_HOME_QUOTES.filter((q) => q.category === 'classic').length;

  assert.ok(scriptureCount >= 30, `expected >= 30 scripture verses, got ${scriptureCount}`);
  assert.ok(physicsCount >= 30, `expected >= 30 physics theorist quotes, got ${physicsCount}`);
  assert.ok(classicCount >= 15, `expected >= 15 classic quotes, got ${classicCount}`);

  const seenIds = new Set<string>();
  const seenQuotes = new Set<string>();
  for (const item of TRUTH_HOME_QUOTES) {
    assert.ok(!seenIds.has(item.id), `duplicate quote id: ${item.id}`);
    seenIds.add(item.id);
    const normalizedQuote = item.quote.trim().toLowerCase();
    assert.ok(!seenQuotes.has(normalizedQuote), `duplicate quote text: ${item.quote}`);
    seenQuotes.add(normalizedQuote);
    assert.match(
      item.quote,
      /\b(?:the truths?|truths?)\b/i,
      `quote missing "truth": ${item.quote}`
    );
    assert.ok(item.quote.length <= 200, `quote too long (${item.quote.length}): ${item.id}`);
    assert.ok(item.speaker.trim().length > 0);
  }
});

test('parseQuoteAroundTitle cleanly incorporates The Truth into every single quote with spoken step durations', () => {
  for (const item of TRUTH_HOME_QUOTES) {
    const parsed = parseQuoteAroundTitle(item.quote);
    assert.equal(parsed.totalSteps, parsed.stepDurationsMs.length);
    assert.ok(parsed.totalSteps >= 1);
    for (const ms of parsed.stepDurationsMs) {
      assert.ok(ms >= 150 && ms <= 1200, `unexpected step duration ${ms} for ${item.id}`);
    }

    // Reconstruct full spoken sentence and ensure it matches original quote case-insensitively
    const pivotPhrase = `${parsed.titleLeadingPunct}${parsed.hasLeadingThe ? 'the ' : ''}truth${
      parsed.isPlural ? 's' : ''
    }${parsed.titleTrailingPunct}`;
    const parts = [
      ...parsed.beforeWords.map((w) => w.text),
      pivotPhrase,
      ...parsed.afterWords.map((w) => w.text)
    ];
    const reconstructed = parts.join(' ').replace(/\s+/g, ' ').trim().toLowerCase();
    const expected = item.quote.replace(/\s+/g, ' ').trim().toLowerCase();
    assert.equal(reconstructed, expected, `mismatch reconstructing ${item.id}`);
  }

  const jessep = parseQuoteAroundTitle("You can't handle the truth!");
  assert.deepEqual(
    jessep.beforeWords.map((w) => w.text),
    ['You', "can't", 'handle']
  );
  assert.equal(jessep.hasLeadingThe, true);
  assert.equal(jessep.titleTrailingPunct, '!');
  assert.equal(jessep.afterWords.length, 0);

  const john146 = parseQuoteAroundTitle('I am the way, and the truth, and the life.');
  assert.deepEqual(
    john146.beforeWords.map((w) => w.text),
    ['I', 'am', 'the', 'way,', 'and']
  );
  assert.equal(john146.hasLeadingThe, true);
  assert.equal(john146.titleTrailingPunct, ',');
  assert.deepEqual(
    john146.afterWords.map((w) => w.text),
    ['and', 'the', 'life.']
  );

  const einstein = parseQuoteAroundTitle('Truth is what stands the test of experience.');
  assert.equal(einstein.beforeWords.length, 0);
  assert.equal(einstein.hasLeadingThe, false);
  assert.deepEqual(
    einstein.afterWords.map((w) => w.text),
    ['is', 'what', 'stands', 'the', 'test', 'of', 'experience.']
  );
});

test('tokenizeTruthQuote and cycling helpers remain consistent', () => {
  const tokens = tokenizeTruthQuote('Sanctify them in the truth; your word is truth.');
  assert.deepEqual(
    tokens.filter((t) => t.isTruthPhrase).map((t) => t.text),
    ['the truth', 'truth']
  );
  assert.equal(resolveVisibleTruthBubbleCount(1280, 720), 2);
  assert.equal(pickNextUnusedQuoteIndex([0, 1, 2], 0, TRUTH_HOME_QUOTES.length), 3);
});
