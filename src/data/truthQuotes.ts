export type TruthQuoteCategory = 'scripture' | 'physics' | 'classic';

export interface TruthQuoteItem {
  id: string;
  quote: string;
  speaker: string;
  work?: string;
  category: TruthQuoteCategory;
}

export interface TruthQuoteSegment {
  text: string;
  isTruthPhrase: boolean;
}

export interface SpokenWordToken {
  text: string;
  durationMs: number;
  isSecondaryTruth: boolean;
}

export interface ParsedHeroQuote {
  beforeWords: SpokenWordToken[];
  hasLeadingThe: boolean;
  isPlural: boolean;
  titleLeadingPunct: string;
  titleTrailingPunct: string;
  theStepIndex: number | null;
  truthStepIndex: number;
  afterStartStepIndex: number;
  afterWords: SpokenWordToken[];
  totalSteps: number;
  stepDurationsMs: number[];
}

const SCRIPTURE_TRUTH_QUOTES: ReadonlyArray<TruthQuoteItem> = [
  {
    id: 'john-8-32',
    quote: 'And you will know the truth, and the truth will set you free.',
    speaker: 'John 8:32',
    category: 'scripture'
  },
  {
    id: 'john-14-6',
    quote: 'I am the way, and the truth, and the life.',
    speaker: 'John 14:6',
    category: 'scripture'
  },
  {
    id: '2cor-13-8',
    quote: 'For we cannot do anything against the truth, but only for the truth.',
    speaker: '2 Corinthians 13:8',
    category: 'scripture'
  },
  {
    id: 'john-18-38',
    quote: 'What is truth?',
    speaker: 'John 18:38',
    work: 'Pontius Pilate',
    category: 'scripture'
  },
  {
    id: 'john-17-17',
    quote: 'Sanctify them in the truth; your word is truth.',
    speaker: 'John 17:17',
    category: 'scripture'
  },
  {
    id: 'prov-23-23',
    quote: 'Buy the truth, and do not sell it; buy wisdom, instruction, and understanding.',
    speaker: 'Proverbs 23:23',
    category: 'scripture'
  },
  {
    id: 'john-16-13',
    quote: 'When the Spirit of truth comes, he will guide you into all the truth.',
    speaker: 'John 16:13',
    category: 'scripture'
  },
  {
    id: 'psalm-119-160',
    quote: 'The sum of your word is truth, and every one of your righteous rules endures forever.',
    speaker: 'Psalm 119:160',
    category: 'scripture'
  },
  {
    id: 'eph-6-14',
    quote: 'Stand firm then, with the belt of truth buckled around your waist.',
    speaker: 'Ephesians 6:14',
    category: 'scripture'
  },
  {
    id: '1cor-13-6',
    quote: 'Love does not delight in evil, but rejoices with the truth.',
    speaker: '1 Corinthians 13:6',
    category: 'scripture'
  },
  {
    id: 'john-4-24',
    quote: 'God is spirit, and those who worship him must worship in spirit and truth.',
    speaker: 'John 4:24',
    category: 'scripture'
  },
  {
    id: 'prov-12-19',
    quote: 'The lip of truth shall be established forever, but a lying tongue is but for a moment.',
    speaker: 'Proverbs 12:19',
    category: 'scripture'
  },
  {
    id: 'psalm-85-11',
    quote: 'Truth shall spring out of the earth, and righteousness shall look down from heaven.',
    speaker: 'Psalm 85:11',
    category: 'scripture'
  },
  {
    id: 'john-18-37',
    quote:
      'For this purpose I have come into the world—to bear witness to the truth. Everyone who is of the truth listens to my voice.',
    speaker: 'John 18:37',
    category: 'scripture'
  },
  {
    id: 'john-1-14',
    quote: 'The Word became flesh and dwelt among us, full of grace and truth.',
    speaker: 'John 1:14',
    category: 'scripture'
  },
  {
    id: 'john-1-17',
    quote: 'For the law was given through Moses; grace and truth came through Jesus Christ.',
    speaker: 'John 1:17',
    category: 'scripture'
  },
  {
    id: 'john-3-21',
    quote:
      'Whoever lives by the truth comes into the light, so that what they have done may be seen plainly.',
    speaker: 'John 3:21',
    category: 'scripture'
  },
  {
    id: 'eph-4-15',
    quote: 'Speaking the truth in love, we are to grow up in every way into him who is the head.',
    speaker: 'Ephesians 4:15',
    category: 'scripture'
  },
  {
    id: 'eph-4-25',
    quote: 'Having put away falsehood, let each one of you speak the truth with his neighbor.',
    speaker: 'Ephesians 4:25',
    category: 'scripture'
  },
  {
    id: 'prov-3-3',
    quote:
      'Let not mercy and truth forsake you; bind them around your neck, write them on the tablet of your heart.',
    speaker: 'Proverbs 3:3',
    category: 'scripture'
  },
  {
    id: 'prov-16-6',
    quote: 'By mercy and truth iniquity is purged, and by the fear of the Lord men depart from evil.',
    speaker: 'Proverbs 16:6',
    category: 'scripture'
  },
  {
    id: 'psalm-43-3',
    quote: 'Send out your light and your truth; let them lead me.',
    speaker: 'Psalm 43:3',
    category: 'scripture'
  },
  {
    id: 'psalm-51-6',
    quote: 'Behold, you delight in truth in the inward being, and you teach me wisdom in the secret heart.',
    speaker: 'Psalm 51:6',
    category: 'scripture'
  },
  {
    id: 'psalm-145-18',
    quote: 'The Lord is near to all who call on him, to all who call on him in truth.',
    speaker: 'Psalm 145:18',
    category: 'scripture'
  },
  {
    id: 'psalm-100-5',
    quote: 'For the Lord is good; his steadfast love endures forever, and his truth to all generations.',
    speaker: 'Psalm 100:5',
    category: 'scripture'
  },
  {
    id: 'psalm-25-5',
    quote: 'Lead me in your truth and teach me, for you are the God of my salvation.',
    speaker: 'Psalm 25:5',
    category: 'scripture'
  },
  {
    id: 'zech-8-16',
    quote: 'Speak the truth to one another; render in your gates judgments that are true and make for peace.',
    speaker: 'Zechariah 8:16',
    category: 'scripture'
  },
  {
    id: '1john-3-18',
    quote: 'Little children, let us not love in word or talk, but in deed and in truth.',
    speaker: '1 John 3:18',
    category: 'scripture'
  },
  {
    id: '3john-1-4',
    quote: 'I have no greater joy than to hear that my children are walking in the truth.',
    speaker: '3 John 1:4',
    category: 'scripture'
  },
  {
    id: 'rom-1-25',
    quote:
      'They exchanged the truth about God for a lie, and worshiped the creature rather than the Creator.',
    speaker: 'Romans 1:25',
    category: 'scripture'
  },
  {
    id: 'dan-10-21',
    quote: 'I will tell you what is inscribed in the book of truth.',
    speaker: 'Daniel 10:21',
    category: 'scripture'
  },
  {
    id: '2tim-4-4',
    quote: 'They will turn away from listening to the truth and wander off into myths.',
    speaker: '2 Timothy 4:4',
    category: 'scripture'
  },
  {
    id: '1tim-3-15',
    quote: 'The household of God, which is the church of the living God, a pillar and buttress of the truth.',
    speaker: '1 Timothy 3:15',
    category: 'scripture'
  }
];

const PHYSICS_TRUTH_QUOTES: ReadonlyArray<TruthQuoteItem> = [
  {
    id: 'einstein-experience',
    quote: 'Truth is what stands the test of experience.',
    speaker: 'Albert Einstein',
    category: 'physics'
  },
  {
    id: 'feynman-experiment',
    quote: 'Experiment is the sole judge of scientific truth.',
    speaker: 'Richard P. Feynman',
    work: 'The Feynman Lectures on Physics',
    category: 'physics'
  },
  {
    id: 'boltzmann-tailor',
    quote: 'If you are out to describe the truth, leave elegance to the tailor.',
    speaker: 'Ludwig Boltzmann',
    work: 'Statistical Mechanics',
    category: 'physics'
  },
  {
    id: 'planck-triumph',
    quote:
      'A new scientific truth does not triumph by convincing its opponents, but rather because its opponents eventually die.',
    speaker: 'Max Planck',
    work: 'Scientific Autobiography',
    category: 'physics'
  },
  {
    id: 'maxwell-second-law',
    quote:
      'The 2nd law of thermodynamics has the same degree of truth as the statement that if you throw a cup of water into the sea, you cannot get the same cup of water out again.',
    speaker: 'James Clerk Maxwell',
    category: 'physics'
  },
  {
    id: 'bohr-profound',
    quote:
      'The opposite of a correct statement is a false statement. But the opposite of a profound truth may well be another profound truth.',
    speaker: 'Niels Bohr',
    category: 'physics'
  },
  {
    id: 'feynman-beauty',
    quote: 'You can recognize truth by its beauty and simplicity.',
    speaker: 'Richard P. Feynman',
    work: 'The Character of Physical Law',
    category: 'physics'
  },
  {
    id: 'newton-ocean',
    quote:
      'I seem to have been only like a boy playing on the seashore, while the great ocean of truth lay all undiscovered before me.',
    speaker: 'Isaac Newton',
    category: 'physics'
  },
  {
    id: 'einstein-authority',
    quote: 'Unthinking respect for authority is the greatest enemy of truth.',
    speaker: 'Albert Einstein',
    category: 'physics'
  },
  {
    id: 'feynman-uncertainty',
    quote:
      'In physics the truth is rarely perfectly clear. Hence, what is not surrounded by uncertainty cannot be the truth.',
    speaker: 'Richard P. Feynman',
    category: 'physics'
  },
  {
    id: 'galileo-discover',
    quote: 'All truths are easy to understand once they are discovered; the point is to discover them.',
    speaker: 'Galileo Galilei',
    category: 'physics'
  },
  {
    id: 'heisenberg-pure-reason',
    quote: 'It will never be possible by pure reason to arrive at some absolute truth.',
    speaker: 'Werner Heisenberg',
    work: 'Physics and Philosophy',
    category: 'physics'
  },
  {
    id: 'schrodinger-sincerity',
    quote:
      'The scientist only imposes two things, namely truth and sincerity, imposes them upon himself and upon other scientists.',
    speaker: 'Erwin Schrödinger',
    work: 'Nature and the Greeks',
    category: 'physics'
  },
  {
    id: 'penrose-platonic',
    quote: 'Real mathematical truth goes beyond mere man-made constructions.',
    speaker: 'Roger Penrose',
    category: 'physics'
  },
  {
    id: 'einstein-duty',
    quote:
      'The right to search for the truth implies also a duty; one must not conceal any part of what one has recognized to be the truth.',
    speaker: 'Albert Einstein',
    category: 'physics'
  },
  {
    id: 'pascal-obscure',
    quote:
      'Truth is so obscure in these times, and falsehood so established, that unless we love the truth, we cannot know it.',
    speaker: 'Blaise Pascal',
    work: 'Pensées',
    category: 'physics'
  },
  {
    id: 'poincare-sole-end',
    quote: 'The search for truth should be the goal of our activities; it is the sole end worthy of them.',
    speaker: 'Henri Poincaré',
    work: 'The Value of Science',
    category: 'physics'
  },
  {
    id: 'newton-plato',
    quote: 'Plato is my friend, Aristotle is my friend, but my greatest friend is truth.',
    speaker: 'Isaac Newton',
    work: 'Quaestiones',
    category: 'physics'
  },
  {
    id: 'kepler-daughter',
    quote: 'Truth is the daughter of time, and I feel no shame in being her midwife.',
    speaker: 'Johannes Kepler',
    category: 'physics'
  },
  {
    id: 'chandrasekhar-splendor',
    quote: 'The simple is the seal of the true, and beauty is the splendor of truth.',
    speaker: 'Subrahmanyan Chandrasekhar',
    work: 'Truth and Beauty',
    category: 'physics'
  },
  {
    id: 'einstein-small-matters',
    quote: 'Whoever is careless with the truth in small matters cannot be trusted with important matters.',
    speaker: 'Albert Einstein',
    category: 'physics'
  },
  {
    id: 'feynman-approximation',
    quote:
      'Each piece, or part, of the whole of nature is always merely an approximation to the complete truth.',
    speaker: 'Richard P. Feynman',
    work: 'The Feynman Lectures on Physics',
    category: 'physics'
  },
  {
    id: 'schrodinger-one-mind',
    quote: 'Multiplicity is only apparent; in truth, there is only one mind.',
    speaker: 'Erwin Schrödinger',
    work: 'What Is Life?',
    category: 'physics'
  },
  {
    id: 'penrose-formal',
    quote:
      'Mathematical truth is not determined arbitrarily by the rules of some man-made formal system, but has an absolute nature.',
    speaker: 'Roger Penrose',
    work: "The Emperor's New Mind",
    category: 'physics'
  },
  {
    id: 'faraday-primary',
    quote:
      'The natural philosopher should listen to every suggestion, yet judge for himself. Truth should be his primary object.',
    speaker: 'Michael Faraday',
    category: 'physics'
  },
  {
    id: 'bohr-great-truths',
    quote:
      'There are trivial truths and there are great truths. The opposite of a trivial truth is plainly false. The opposite of a great truth is also true.',
    speaker: 'Niels Bohr',
    category: 'physics'
  },
  {
    id: 'einstein-large-small',
    quote: 'In matters of truth and justice, there is no difference between large and small problems.',
    speaker: 'Albert Einstein',
    category: 'physics'
  },
  {
    id: 'einstein-children',
    quote:
      'The pursuit of truth and beauty is a sphere of activity in which we are permitted to remain children all our lives.',
    speaker: 'Albert Einstein',
    category: 'physics'
  },
  {
    id: 'einstein-gods',
    quote:
      'Whoever undertakes to set himself up as a judge of truth and knowledge is shipwrecked by the laughter of the gods.',
    speaker: 'Albert Einstein',
    category: 'physics'
  },
  {
    id: 'feynman-remarkable',
    quote: 'As revealed by physics, the truth is so remarkable, so amazing!',
    speaker: 'Richard P. Feynman',
    category: 'physics'
  },
  {
    id: 'sagan-fable',
    quote: 'Better by far to embrace the hard truth than a reassuring fable.',
    speaker: 'Carl Sagan',
    category: 'physics'
  }
];

const CLASSIC_TRUTH_QUOTES: ReadonlyArray<TruthQuoteItem> = [
  {
    id: 'jessep-handle',
    quote: "You can't handle the truth!",
    speaker: 'Col. Nathan R. Jessep',
    work: 'A Few Good Men',
    category: 'classic'
  },
  {
    id: 'twain-remember',
    quote: "If you tell the truth, you don't have to remember anything.",
    speaker: 'Mark Twain',
    category: 'classic'
  },
  {
    id: 'buddha-three-things',
    quote: 'Three things cannot be long hidden: the sun, the moon, and the truth.',
    speaker: 'Buddha',
    category: 'classic'
  },
  {
    id: 'wilde-pure-simple',
    quote: 'The truth is rarely pure and never simple.',
    speaker: 'Oscar Wilde',
    work: 'The Importance of Being Earnest',
    category: 'classic'
  },
  {
    id: 'holmes-impossible',
    quote:
      'Once you eliminate the impossible, whatever remains, no matter how improbable, must be the truth.',
    speaker: 'Sherlock Holmes',
    work: 'Arthur Conan Doyle',
    category: 'classic'
  },
  {
    id: 'xfiles-out-there',
    quote: 'The truth is out there.',
    speaker: 'Fox Mulder',
    work: 'The X-Files',
    category: 'classic'
  },
  {
    id: 'churchill-incontrovertible',
    quote:
      'The truth is incontrovertible. Malice may attack it, ignorance may deride it, but in the end, there it is.',
    speaker: 'Winston Churchill',
    category: 'classic'
  },
  {
    id: 'schopenhauer-stages',
    quote:
      'All truth passes through three stages: first, it is ridiculed; second, it is violently opposed; third, it is accepted as self-evident.',
    speaker: 'Arthur Schopenhauer',
    category: 'classic'
  },
  {
    id: 'solzhenitsyn-one-word',
    quote: 'One word of truth outweighs the whole world.',
    speaker: 'Aleksandr Solzhenitsyn',
    work: 'Nobel Lecture',
    category: 'classic'
  },
  {
    id: 'augustine-lion',
    quote: "The truth is like a lion; you don't have to defend it. Let it loose; it will defend itself.",
    speaker: 'Augustine of Hippo',
    category: 'classic'
  },
  {
    id: 'oconnor-stomach',
    quote: 'The truth does not change according to our ability to stomach it.',
    speaker: "Flannery O'Connor",
    category: 'classic'
  },
  {
    id: 'thoreau-give-me-truth',
    quote: 'Rather than love, than money, than fame, give me truth.',
    speaker: 'Henry David Thoreau',
    work: 'Walden',
    category: 'classic'
  },
  {
    id: 'marcus-aurelius-harmed',
    quote:
      'If someone shows me that what I think is not right, I will happily change, for I seek the truth, by which no one was ever truly harmed.',
    speaker: 'Marcus Aurelius',
    work: 'Meditations',
    category: 'classic'
  },
  {
    id: 'aristotle-piety',
    quote: 'Piety requires us to honor truth above our friends.',
    speaker: 'Aristotle',
    work: 'Nicomachean Ethics',
    category: 'classic'
  },
  {
    id: 'twain-when-in-doubt',
    quote: 'When in doubt, tell the truth.',
    speaker: 'Mark Twain',
    category: 'classic'
  },
  {
    id: 'voltaire-pardon-error',
    quote: 'Love the truth, but pardon error.',
    speaker: 'Voltaire',
    category: 'classic'
  }
];

function interleaveTruthQuotes(): ReadonlyArray<TruthQuoteItem> {
  const result: TruthQuoteItem[] = [];
  result.push(CLASSIC_TRUTH_QUOTES[0]);
  let sIdx = 0;
  let pIdx = 0;
  let cIdx = 1;

  while (
    sIdx < SCRIPTURE_TRUTH_QUOTES.length ||
    pIdx < PHYSICS_TRUTH_QUOTES.length ||
    cIdx < CLASSIC_TRUTH_QUOTES.length
  ) {
    if (sIdx < SCRIPTURE_TRUTH_QUOTES.length) {
      result.push(SCRIPTURE_TRUTH_QUOTES[sIdx++]);
    }
    if (pIdx < PHYSICS_TRUTH_QUOTES.length) {
      result.push(PHYSICS_TRUTH_QUOTES[pIdx++]);
    }
    if (sIdx < SCRIPTURE_TRUTH_QUOTES.length) {
      result.push(SCRIPTURE_TRUTH_QUOTES[sIdx++]);
    }
    if (pIdx < PHYSICS_TRUTH_QUOTES.length) {
      result.push(PHYSICS_TRUTH_QUOTES[pIdx++]);
    }
    if (cIdx < CLASSIC_TRUTH_QUOTES.length) {
      result.push(CLASSIC_TRUTH_QUOTES[cIdx++]);
    }
  }

  return result;
}

export const TRUTH_HOME_QUOTES: ReadonlyArray<TruthQuoteItem> = interleaveTruthQuotes();

const TRUTH_PHRASE_SPLIT_RE = /(\bthe truths?\b|\btruths?\b)/gi;
const TRUTH_PHRASE_EXACT_RE = /^(?:the truths?|truths?)$/i;
const WORD_TRUTH_CHECK_RE = /\btruths?\b/i;

export function tokenizeTruthQuote(quote: string): TruthQuoteSegment[] {
  if (!quote) return [];
  const rawParts = quote.split(TRUTH_PHRASE_SPLIT_RE);
  const segments: TruthQuoteSegment[] = [];
  for (const part of rawParts) {
    if (!part) continue;
    segments.push({
      text: part,
      isTruthPhrase: TRUTH_PHRASE_EXACT_RE.test(part)
    });
  }
  return segments;
}

/**
 * Computes natural spoken-aloud word cadence in milliseconds, adding realistic
 * breath pauses on commas, dashes, semicolons, and sentence endings.
 */
export function computeSpokenWordDurationMs(word: string): number {
  const trimmed = word.trim();
  if (!trimmed) return 180;
  const alphaLen = trimmed.replace(/[^a-zA-Z0-9]/g, '').length;
  let ms = 165 + Math.min(9, alphaLen) * 18;

  if (/[,—–-]$/.test(trimmed) || trimmed.includes('—')) {
    ms += 165;
  } else if (/[;:]$/.test(trimmed)) {
    ms += 235;
  } else if (/[.!?]$/.test(trimmed)) {
    ms += 270;
  }
  return ms;
}

function splitIntoSpokenWords(segment: string): SpokenWordToken[] {
  const trimmed = segment.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/).map((w) => ({
    text: w,
    durationMs: computeSpokenWordDurationMs(w),
    isSecondaryTruth: WORD_TRUTH_CHECK_RE.test(w)
  }));
}

/**
 * Splits any quote around the hero title ("The Truth" / "Truth" / "Truths")
 * so the app's giant title is literally incorporated into the spoken sentence.
 * Prefers verbatim "the truth" when present before falling back to standalone "truth".
 */
export function parseQuoteAroundTitle(quote: string): ParsedHeroQuote {
  const theTruthRe = /\b(the\s+)(truth(s)?)([.,!?;:—–]*)/i;
  const bareTruthRe = /\b(truth(s)?)([.,!?;:—–]*)/i;

  const theMatch = theTruthRe.exec(quote);
  const bareMatch = theMatch ? null : bareTruthRe.exec(quote);
  const activeMatch = theMatch || bareMatch;

  if (!activeMatch || activeMatch.index === undefined) {
    const fallbackWords = splitIntoSpokenWords(quote);
    const stepDurationsMs = [...fallbackWords.map((w) => w.durationMs), 520];
    return {
      beforeWords: fallbackWords,
      hasLeadingThe: true,
      isPlural: false,
      titleLeadingPunct: '',
      titleTrailingPunct: '',
      theStepIndex: fallbackWords.length,
      truthStepIndex: fallbackWords.length,
      afterStartStepIndex: fallbackWords.length + 1,
      afterWords: [],
      totalSteps: fallbackWords.length + 1,
      stepDurationsMs
    };
  }

  const matchStart = activeMatch.index;
  const fullMatchedStr = activeMatch[0];
  const hasLeadingThe = Boolean(theMatch);
  const isPlural = Boolean(theMatch ? theMatch[3] : bareMatch?.[2]);
  const titleTrailingPunct = (theMatch ? theMatch[4] : bareMatch?.[3]) || '';

  let rawBefore = quote.slice(0, matchStart);
  let titleLeadingPunct = '';
  // If an em-dash is glued directly onto "the truth" (e.g. "world—to"), keep rawBefore clean
  const trailingGlueMatch = /([“"‘'(—–-]+)$/.exec(rawBefore);
  if (trailingGlueMatch && !/\s$/.test(rawBefore)) {
    // Keep words like "world—" in rawBefore, only detach pure opening quotes/parens
    const quoteOnlyMatch = /(?:^|\s)([“"‘'(]+)$/.exec(rawBefore);
    if (quoteOnlyMatch) {
      titleLeadingPunct = quoteOnlyMatch[1];
      rawBefore = rawBefore.slice(0, rawBefore.length - titleLeadingPunct.length);
    }
  }

  const rawAfter = quote.slice(matchStart + fullMatchedStr.length);
  const beforeWords = splitIntoSpokenWords(rawBefore);
  const afterWords = splitIntoSpokenWords(rawAfter);

  const stepDurationsMs: number[] = [];
  for (const bw of beforeWords) {
    stepDurationsMs.push(bw.durationMs);
  }

  let theStepIndex: number | null = null;
  let truthStepIndex: number;

  if (hasLeadingThe) {
    theStepIndex = stepDurationsMs.length;
    stepDurationsMs.push(190);
    truthStepIndex = stepDurationsMs.length;
    stepDurationsMs.push(computeSpokenWordDurationMs(`Truth${titleTrailingPunct}`) + 240);
  } else {
    truthStepIndex = stepDurationsMs.length;
    stepDurationsMs.push(computeSpokenWordDurationMs(`Truth${titleTrailingPunct}`) + 260);
  }

  const afterStartStepIndex = stepDurationsMs.length;
  for (const aw of afterWords) {
    stepDurationsMs.push(aw.durationMs);
  }

  return {
    beforeWords,
    hasLeadingThe,
    isPlural,
    titleLeadingPunct,
    titleTrailingPunct,
    theStepIndex,
    truthStepIndex,
    afterStartStepIndex,
    afterWords,
    totalSteps: stepDurationsMs.length,
    stepDurationsMs
  };
}

export function resolveVisibleTruthBubbleCount(
  viewportWidth: number,
  viewportHeight: number
): 1 | 2 | 3 {
  const safeW = Number.isFinite(viewportWidth) ? viewportWidth : 1280;
  const safeH = Number.isFinite(viewportHeight) ? viewportHeight : 800;
  if (safeW < 1100) return 1;
  if (safeW >= 1240 && safeH >= 850) return 3;
  return 2;
}

export function pickNextUnusedQuoteIndex(
  currentIndices: readonly number[],
  slotIndex: number,
  totalQuotes: number = TRUTH_HOME_QUOTES.length
): number {
  if (totalQuotes <= 1) return 0;
  const current = currentIndices[slotIndex] ?? 0;
  const occupiedByOthers = new Set<number>();
  for (let i = 0; i < currentIndices.length; i++) {
    if (i !== slotIndex) {
      occupiedByOthers.add(((currentIndices[i] % totalQuotes) + totalQuotes) % totalQuotes);
    }
  }

  for (let step = 1; step <= totalQuotes; step++) {
    const candidate = (current + step) % totalQuotes;
    if (!occupiedByOthers.has(candidate)) {
      return candidate;
    }
  }
  return (current + 1) % totalQuotes;
}
