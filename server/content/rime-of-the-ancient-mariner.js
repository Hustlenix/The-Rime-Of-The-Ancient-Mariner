// "The Rime of the Ancient Mariner" — poem from the Literature Reader.
// The question text below is imported VERBATIM from server/seedData.js
// (the school's question bank). Do not reword, reorder or edit it.
// Additional rows appended after the map are new authoring, not edits.
const { questions, quizQuestions } = require('../seedData');

module.exports = {
  unit: {
    id: 'rime-of-the-ancient-mariner',
    book: 'literature-reader',
    type: 'poem',
    title: 'The Rime of the Ancient Mariner',
    author: 'Samuel Taylor Coleridge',
    order: 11
  },
  content: [
    ...questions.map((q, i) => ({
      category: q.category,
      prompt: q.prompt,
      answer: q.answer,
      notes: q.notes != null ? q.notes : null,
      sortOrder: q.sort_order || i + 1
    })),
    {
      category: 'theme',
      prompt: 'Humanity\'s bond with nature',
      answer: 'The poem is also a warning about our relationship with the natural world. The Mariner kills the albatross — a creature of good omen — and nature itself punishes him: the wind drops, the sun burns, the ship is becalmed, and the Polar Spirit of the South Pole hunts him down. The theme teaches that all creatures deserve love and respect, and that harming nature without cause brings suffering. The Mariner\'s blessing of the water snakes, which finally lifts the curse, shows that the cure for this crime is reverence for every living thing.'
    },
    {
      category: 'character',
      prompt: 'The Ancient Mariner (the speaker)',
      answer: 'The Mariner is an old sailor with a long grey beard and a glittering eye, who stops one of three wedding guests to tell his tale. He is a man haunted by guilt: for killing the albatross he brings the curse of death upon his crew, and he alone survives to carry the burden of memory. His story teaches him that prayer comes from a loving heart, and his compulsion to tell his tale is both his punishment and his penance. He is at once a sinner, a survivor and a prophet — the living warning that every creature deserves love.'
    },
    {
      category: 'character',
      prompt: 'The Wedding Guest',
      answer: 'The Wedding Guest is the listener of the Mariner\'s tale. He arrives eager for the wedding feast, but the Mariner\'s glittering eye holds him spellbound — he "cannot choose but hear". As the Mariner\'s story unfolds, the guest is drawn into the horror: he beats his breast in fear and guilt when the curse falls. By the end he turns from the merry wedding to walk home, "a sadder and a wiser man". He represents the reader — transformed by the tale, and the poem\'s proof that a good story can change a person\'s heart.'
    },
    {
      category: 'short',
      prompt: 'How did the shipmates treat the Mariner after he killed the albatross?',
      answer: 'At first they condemned him for killing the bird that brought the breeze; but when the fog lifted and the wind blew, they praised him for the deed and made him partaker of the guilt. When the curse followed, they hung the dead bird around his neck.'
    },
    {
      category: 'long',
      prompt: 'Describe the Mariner\'s punishment and how he is finally freed from the curse.',
      answer: 'The Mariner\'s punishment begins with the death of the wind: the ship is becalmed under a blazing sun, and the crew suffers "water, water, everywhere, nor any drop to drink". Slimy, horrible creatures crawl in the sea, and the curse of the dead men\'s eyes falls upon the Mariner — his two hundred shipmates die, and he is left alone with their accusing stares, unable to pray. The curse lifts only when, without knowing why, the Mariner\'s heart is moved by the beauty of the water snakes, and he blesses them from his heart. At that moment the spell begins to break: he can pray again, the albatross falls from his neck, rain pours down, and the Polar Spirit\'s vengeance is satisfied. He is brought home, but he is never freed from the penance of his tale — he must wander and teach, "the man that hath no music in his soul" to love all creatures, for that is the lesson his suffering bought.'
    }
  ],
  quizQuestions: quizQuestions.map((q) => ({
    question: q.question,
    options: q.options,
    correct_index: q.correct_index,
    explanation: q.explanation,
    topic: q.topic || ''
  }))
};
