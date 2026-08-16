import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import PageBanner from '../components/PageBanner';
import MotivationBar from '../components/MotivationBar';
import UnitSwitcher from '../components/UnitSwitcher';
import Breadcrumbs from '../components/Breadcrumbs';
import { img } from '../asset';

const TYPE_LABELS = { prose: 'Prose', poem: 'Poem', play: 'Play' };

export default function Study() {
  const { unitId } = useParams();
  const meta = api.getUnitMeta(unitId);
  const [content, setContent] = useState(null);
  const [tab, setTab] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setContent(null);
    setError(null);
    api
      .getContent(unitId)
      .then((c) => {
        setContent(c);
        const first = TABS(c).find((t) => (t.count || 0) > 0);
        setTab((prev) => (first ? first.key : null));
      })
      .catch((e) => setError(e.message));
  }, [unitId]);

  if (!meta) {
    return (
      <div className="page">
        <h1 className="page-title">Unit not found</h1>
        <p className="page-intro">We could not find “{unitId}” on the shelf.</p>
        <Link className="btn btn-primary" to="/">
          Back to Home
        </Link>
      </div>
    );
  }

  const TABS = (c) => [
    { key: 'summary', label: 'Chapter Notes', count: c.summaries.length },
    { key: 'theme', label: 'Themes', count: c.themes.length },
    { key: 'character', label: meta.type === 'poem' ? 'Speaker & Characters' : 'Character Sketches', count: c.characters.length },
    { key: 'analysis', label: 'Analysis', count: c.analysis.length },
    { key: 'device', label: 'Poetic Devices', count: c.devices.length },
    { key: 'value', label: 'Value Points', count: c.values.length }
  ];
  const tabs = content ? TABS(content).filter((t) => t.count > 0) : [];
  const active = tabs.some((t) => t.key === tab) ? tab : (tabs[0] && tabs[0].key);

  if (error) return <p className="error-text">Failed to load study content: {error}</p>;
  if (!content) return <p className="page-loader">Loading study content…</p>;

  const renderTab = () => {
    if (active === 'summary') {
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
    if (active === 'theme') {
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
    if (active === 'character') {
      return (
        <div className="study-list">
          {content.characters.map((c) => (
            <article key={c.id} className="study-card card">
              <h3>{c.prompt}</h3>
              <p>{c.answer}</p>
            </article>
          ))}
        </div>
      );
    }
    if (active === 'analysis') {
      return (
        <div className="study-list">
          {content.analysis.map((c) => (
            <article key={c.id} className="study-card card">
              <h3>{c.prompt}</h3>
              <p>{c.answer}</p>
            </article>
          ))}
        </div>
      );
    }
    if (active === 'device') {
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
    }
    return (
      <div className="study-list">
        {content.values.map((v) => (
          <article key={v.id} className="study-card card theme-card">
            <h3>{v.prompt}</h3>
            <p>{v.answer}</p>
          </article>
        ))}
      </div>
    );
  };

  return (
    <div>
      <PageBanner
        kicker={`${meta.book === 'literature-reader' ? 'Interact in English — Literature Reader' : meta.book} · ${TYPE_LABELS[meta.type] || meta.type}`}
        title={meta.title}
        sub={`${meta.author ? `By ${meta.author} · ` : ''}Summaries, themes${meta.type === 'poem' ? ', poetic devices' : ', character sketches'} and model analysis for the exam.`}
        image={img(meta.type === 'poem' ? 'lonely.jpg' : 'ice.jpg')}
      />
      <Breadcrumbs unitTitle={meta.title} />
      <UnitSwitcher currentId={meta.id} page="study" />
      <MotivationBar />
      {tabs.length === 0 && <p className="empty-note">Study content for this unit is being prepared.</p>}
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab ${active === t.key ? 'active' : ''}`}
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
