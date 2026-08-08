import { useEffect, useState } from 'react';
import { api } from '../api';
import PageBanner from '../components/PageBanner';
import MotivationBar from '../components/MotivationBar';
import { img } from '../asset';

const TABS = [
  { key: 'summary', label: 'Summary' },
  { key: 'theme', label: 'Theme' },
  { key: 'device', label: 'Poetic Devices' }
];

export default function Study() {
  const [content, setContent] = useState(null);
  const [tab, setTab] = useState('summary');
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getContent()
      .then(setContent)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error-text">Failed to load content: {error}</p>;
  if (!content) return <p className="page-loader">Loading study content…</p>;

  const renderTab = () => {
    if (tab === 'summary') {
      return (
        <div className="study-list">
          {content.summaries.map((s) => (
            <article key={s.id} className="study-card card">
              <h3>{s.prompt}</h3>
              <p>{s.answer}</p>
            </article>
          ))}
        </div>
      );
    }
    if (tab === 'theme') {
      return (
        <div className="study-list">
          {content.themes.map((t) => (
            <article key={t.id} className="study-card card theme-card">
              <h3>{t.prompt}</h3>
              <p>{t.answer}</p>
            </article>
          ))}
        </div>
      );
    }
    return (
      <div className="device-list">
        {content.devices.map((d) => (
          <article key={d.id} className="device-card card">
            <h3 className="device-name">{d.prompt}</h3>
            <p className="device-definition">{d.answer}</p>
          </article>
        ))}
      </div>
    );
  };

  return (
    <div>
      <PageBanner
        kicker="Part of the voyage"
        title="Study"
        sub="Two parts of the story, one central theme, and ten poetic devices — every word from the school question bank."
        image={img('albatross.jpg')}
      />
      <MotivationBar />
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {renderTab()}
    </div>
  );
}
