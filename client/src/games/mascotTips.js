// Voyage Edition — unit-aware tip bank for the Albatross mascot.
// Kinds: 'exam' (board-exam warnings), 'mistake' (common CBSE errors),
// 'quote' (memory aids from the text), 'streak' (logbook nudges),
// 'celebration' (streak milestones).

const UNIT_TIPS = {
  'two-gentlemen-of-verona': [
    { kind: 'exam', text: 'Board warning: the twins’ sacrifice is best answered with the “hardship → love for Lucia” chain — quote the torn shoes and the night work.' },
    { kind: 'mistake', text: 'Common slip: “two gentlemen” are Nicola and Jacopo, not their father — the father is absent from the story.' },
    { kind: 'quote', text: 'Remember “the boys were at their work” — the narrator finds them on the windy hill, not in Verona’s comfort.' }
  ],
  'mrs-packletides-tiger': [
    { kind: 'exam', text: 'Board warning: Saki’s irony is the heart of every long answer — goat shot, tiger died of fright, villagers colluded for a thousand rupees.' },
    { kind: 'mistake', text: 'Common slip: the tiger did not die of the bullet — it died of heart failure brought on by the gunshot’s shock.' },
    { kind: 'quote', text: '“The incidental expenses are so heavy” — Mrs Packletide’s excuse hides the blackmail cottage.' }
  ],
  'the-letter': [
    { kind: 'exam', text: 'Board warning: Ali’s loneliness is built on contrast — the crowds at the post office never spare him a word.' },
    { kind: 'mistake', text: 'Common slip: the letter is from Ali’s daughter Miriam — not from his wife.' },
    { kind: 'quote', text: '“Life is a pilgrimage” — Ali’s faith carries him to the post office every morning.' }
  ],
  'a-shady-plot': [
    { kind: 'exam', text: 'Board warning: the ghosts are Helen of Troy, Shakespeare and Frankenstein — John’s “shady plot” is the Ouija board of his own story.' },
    { kind: 'mistake', text: 'Common slip: the plot is “shady” in both senses — the writer’s plot (story) and the ghostly conspiracy.' },
    { kind: 'quote', text: '“You have a Ouija board in your head” — the ghost’s jab at John’s borrowed plots.' }
  ],
  'patol-babu-film-star': [
    { kind: 'exam', text: 'Board warning: Patol Babu’s lesson is professionalism — “the job is to act, the reward is the applause of your own conscience.”' },
    { kind: 'mistake', text: 'Common slip: his fee was fifty rupees, but he signed for less — the money was never the point.' },
    { kind: 'quote', text: '“Oh, what a fall was there” — Patol Babu borrows Shakespeare for the greatest fall of his career.' }
  ],
  'virtually-true': [
    { kind: 'exam', text: 'Board warning: the key twist is the pen-drive message — Sebastian wrote to Michael inside the final game.' },
    { kind: 'mistake', text: 'Common slip: the knight rescues Sebastian, not Michael — Michael plays the knight to free the boy from the castle.' },
    { kind: 'quote', text: '“I shall go back and play it” — Michael cannot rest until the last score is settled.' }
  ],
  'the-frog-and-the-nightingale': [
    { kind: 'exam', text: 'Board warning: the frog is a metaphor for exploitative critics — “noted baritone” is pure irony, his croak is hated.' },
    { kind: 'mistake', text: 'Common slip: the nightingale dies of exhaustion and fear — not of losing her voice by itself; the training destroyed her.' },
    { kind: 'quote', text: '“Your song must be your own” — Seth’s fable warns against letting others own your talent.' }
  ],
  'not-marble-nor-the-gilded-monuments': [
    { kind: 'exam', text: 'Board warning: Sonnet 55’s argument runs stone → war/time → “living record” → Judgement Day. Structure the answer in that order.' },
    { kind: 'mistake', text: 'Common slip: the poem grants immortality to the beloved, not to the poet — and the vehicle is the poem itself.' },
    { kind: 'quote', text: '“So, till the judgement that yourself arise” — the couplet seals love’s survival beyond the world’s end.' }
  ],
  ozymandias: [
    { kind: 'exam', text: 'Board warning: pair the irony of the inscription with the image of the “boundless and bare” sands — that contrast is the whole answer.' },
    { kind: 'mistake', text: 'Common slip: the “king of kings” boasts on the pedestal; the statue itself is shattered — the words survive, the works do not.' },
    { kind: 'quote', text: '“Look on my works, ye Mighty, and despair!” — and nothing remains but the lone and level sands.' }
  ],
  snake: [
    { kind: 'exam', text: 'Board warning: Lawrence’s “voice of my education” is personification — quote it when explaining the speaker’s inner conflict.' },
    { kind: 'mistake', text: 'Common slip: the snake is a “king in exile”, not a threat — the speaker’s violence shames him, like the Mariner’s.' },
    { kind: 'quote', text: '“I had to throw the log” — the guilt after the throw is the poem’s real subject.' }
  ],
  'rime-of-the-ancient-mariner': [
    { kind: 'exam', text: 'Board warning: the Mariner’s crime is against Nature — every long answer should land on sin, punishment, atonement, and the “sadder and wiser” ending.' },
    { kind: 'mistake', text: 'Common slip: it was the Mariner who shot the Albatross with his crossbow — and the crew share the guilt by praising the deed.' },
    { kind: 'quote', text: '“Water, water, everywhere, nor any drop to drink” — irony the examiners love, every single year.' }
  ],
  'the-dear-departed': [
    { kind: 'exam', text: 'Board warning: the title’s double irony — Abel is neither “dear” to his daughters nor truly “departed”. Say both halves.' },
    { kind: 'mistake', text: 'Common slip: the clock and bureau are taken by the Slaters — Amelia, not Elizabeth, is the first to grab them.' },
    { kind: 'quote', text: '“The dear departed” — the name on the insurance policy is worth more to the family than the man.' }
  ],
  'julius-caesar': [
    { kind: 'exam', text: 'Board warning: Antony’s “honourable men” is the engine of the funeral speech — repetition + irony turns the mob.' },
    { kind: 'mistake', text: 'Common slip: it is the conspirators, not the crowd, who stab Caesar — Brutus’s face among the daggers is the betrayal.' },
    { kind: 'quote', text: '“The fixed North Star” — Caesar’s own metaphor of constancy, quoted against him by fate.' }
  ]
};

const GENERAL_TIPS = [
  { kind: 'mistake', text: 'Examiners penalise answers without textual evidence — one short quote per point is safer than three generalities.' },
  { kind: 'exam', text: 'CBSE values the question’s keyword: “justify” needs a conclusion, “explain” needs a chain of cause and effect.' },
  { kind: 'exam', text: 'In the board paper, write the poet’s name and the poem’s title before the first sentence of a poetry answer.' },
  { kind: 'mistake', text: 'Common slip: “theme” answers that retell the story. One line of summary, three lines of meaning.' },
  { kind: 'quote', text: 'A well-chosen quote is worth a paragraph of paraphrase — and it shows you read the text.' }
];

const STREAK_TIPS = [
  { at: 3, text: 'Three Days at Sea — the tide is turning in your favour.' },
  { at: 7, text: 'Seven Days at Sea — the wind is in your sails.' },
  { at: 14, text: 'A fortnight at sea — the crew speaks of nothing else.' },
  { at: 21, text: 'Three weeks at sea — landfall is in sight.' },
  { at: 30, text: 'A month at sea — a legend on this chart.' }
];

const CELEBRATIONS = [
  'A new seal on the chart! The cartographer bows to you.',
  'The Albatross circles twice — your progress is seen, sailor.',
  'Coins in the lockbox — the Ship’s Stores will remember you.',
  'The waves carry your name now — keep the course.'
];

// Deterministic per-day pick so the bubble does not reshuffle every render.
function seededIndex(length, salt) {
  if (!length) return 0;
  const now = new Date();
  const dayNum = Math.floor(now.getTime() / 86400000);
  let h = dayNum;
  for (const ch of String(salt)) h = (h * 31 + ch.charCodeAt(0)) % 100000;
  return Math.abs(h) % length;
}

export function tipForUnit(unitId, streak = 0) {
  const streakTip = STREAK_TIPS.filter((t) => streak >= t.at).pop();
  if (streakTip && seededIndex(4, `${unitId}-streak`) === 0) {
    return { ...streakTip, kind: 'streak' };
  }
  const bank = UNIT_TIPS[unitId] || GENERAL_TIPS;
  return bank[seededIndex(bank.length, unitId)];
}

export function celebrationForStreak(streak) {
  const tip = STREAK_TIPS.find((t) => t.at === streak);
  if (!tip) return null;
  return { text: tip.text, kind: 'celebration' };
}

export function randomCelebration() {
  return { text: CELEBRATIONS[seededIndex(CELEBRATIONS.length, 'celebrate')], kind: 'celebration' };
}
