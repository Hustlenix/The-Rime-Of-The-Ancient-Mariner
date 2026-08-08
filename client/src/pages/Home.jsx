import { Link } from 'react-router-dom';
import { img } from '../asset';

const cards = [
  {
    to: '/study',
    title: 'Study',
    text: 'Summaries, the central theme and ten poetic devices — with the poem\u2019s own words as proof.',
    image: img('albatross.jpg'),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </svg>
    )
  },
  {
    to: '/questions',
    title: 'Questions',
    text: 'Short and long answer questions from the school question bank, with model answers.',
    image: img('ice.jpg'),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.2 9.2a2.8 2.8 0 1 1 4.3 2.3c-.9.6-1.5 1-1.5 2" />
        <circle cx="12" cy="16.6" r="0.4" fill="currentColor" />
      </svg>
    )
  },
  {
    to: '/quiz',
    title: 'Quiz',
    text: 'Ten random multiple-choice questions with instant feedback and explanations after each one.',
    image: img('lonely.jpg'),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M12 2 15 8l6 .9-4.3 4.2 1 6L12 16.6 6.3 19l1-6L3 8.9 9 8Z" />
      </svg>
    )
  },
  {
    to: '/flashcards',
    title: 'Flashcards',
    text: 'Flip through every question and track which ones you have truly mastered.',
    image: img('snakes.jpg'),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h4" />
      </svg>
    )
  }
];

const journey = [
  {
    title: 'Read the story',
    text: 'Begin with the Part I and Part II summaries so the voyage is clear before you study any answers.'
  },
  {
    title: 'Learn the devices',
    text: 'Master the ten poetic devices with their quoted examples — examiners love these lines.'
  },
  {
    title: 'Practice the answers',
    text: 'Read every short and long answer, then test yourself with the flashcards.'
  },
  {
    title: 'Prove yourself',
    text: 'Take the quiz again and again until you sail with a Master Mariner\u2019s score.'
  }
];

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <img className="hero-backdrop" src={img('hellish.jpg')} alt="" aria-hidden="true" />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-content">
          <p className="hero-school">The Ashok Leyland School</p>
          <h1 className="hero-title">The Rime of the Ancient Mariner</h1>
          <p className="hero-tagline">
            &ldquo;It is an ancient Mariner, and he stoppeth one of three.&rdquo;
          </p>
          <p className="hero-sub">
            A study portal for Samuel Taylor Coleridge&rsquo;s ballad of sin, guilt and atonement —
            summaries, model answers, quizzes and flashcards to carry you through every question in
            the question bank.
          </p>
          <div className="cta-row">
            <Link to="/study" className="btn btn-primary">
              Begin the voyage
            </Link>
            <Link to="/quiz" className="btn btn-outline">
              Take the quiz
            </Link>
          </div>
          <svg className="hero-albatross" viewBox="0 0 220 130" aria-hidden="true">
            <path
              d="M110 62 C 66 30 22 34 6 46 C 34 52 60 58 84 61 C 66 74 50 90 38 106 C 60 95 82 78 102 65 L 118 65 C 138 78 160 95 182 106 C 170 90 154 74 136 61 C 160 58 186 52 214 46 C 198 34 154 30 110 62 Z"
              fill="currentColor"
            />
            <path
              d="M110 62 C 108 52 108 40 112 28"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <svg className="wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0 45 C 120 10 240 80 360 45 C 480 10 600 80 720 45 C 840 10 960 80 1080 45 C 1200 10 1320 80 1440 45 L 1440 90 L 0 90 Z"
            fill="currentColor"
            opacity="0.55"
          />
          <path
            d="M0 60 C 120 25 240 95 360 60 C 480 25 600 95 720 60 C 840 25 960 95 1080 60 C 1200 25 1320 95 1440 60 L 1440 90 L 0 90 Z"
            fill="currentColor"
          />
        </svg>
      </section>

      <section className="quote-band">
        <p className="quote-band-text">
          &ldquo;He prayeth best, who loveth best all things both great and small; for the dear God
          who loveth us, He made and loveth all.&rdquo;
        </p>
        <p className="quote-band-source">The Ancient Mariner&rsquo;s parting blessing</p>
      </section>

      <section className="card-grid">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="nav-card card">
            <div className="card-media">
              <img src={c.image} alt="" loading="lazy" />
            </div>
            <div className="card-body">
              <span className="nav-card-icon">{c.icon}</span>
              <h2>{c.title}</h2>
              <p>{c.text}</p>
            </div>
          </Link>
        ))}
      </section>

      <div className="ornament" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
        </svg>
      </div>

      <section className="journey">
        <h2>How to master this poem</h2>
        <p className="journey-sub">
          Four short steps — follow them in order and you will walk into the exam hall with the
          Mariner&rsquo;s own confidence.
        </p>
        <div className="journey-grid">
          {journey.map((s, i) => (
            <article key={s.title} className="journey-step card">
              <span className="step-num">{i + 1}</span>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-text">{s.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
