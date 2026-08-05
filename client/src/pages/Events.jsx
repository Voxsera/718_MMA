import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import Reveal from '../components/Reveal.jsx';
import { api } from '../api';

const PILL = { upcoming: 'pill-red', ongoing: 'pill-green', past: 'pill-grey' };
const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past Events' },
];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState('upcoming');
  const [selected, setSelected] = useState(null);
  useEffect(() => { api.get('/api/events').then(setEvents).catch(() => {}); }, []);
  const list = events.filter((e) => e.status === tab);

  // Lock background scroll and allow Escape to close while a poster is open.
  useEffect(() => {
    if (!selected) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (ev) => { if (ev.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [selected]);

  return (
    <PageHead crumb="Events" title='718 <span class="text-red">Events</span>'
      sub="Seminars, sparring meets, fight nights and community gatherings. See what's on the horizon.">
      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="tabs">
            {TABS.map((t) => <div key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</div>)}
          </div>
          {list.length === 0 ? <p style={{ color: 'var(--grey)', textAlign: 'center' }}>{tab === 'past' ? 'No past events to show yet.' : 'No upcoming events right now — check back soon.'}</p> : (
            <div className="grid grid-3">
              {list.map((e, i) => (
                <Reveal key={e.id} delay={i * 0.05}>
                  <div className="card event-card">
                    <img src={e.image} alt={e.title} loading="lazy" />
                    <div className="body">
                      <span className={`pill ${PILL[e.status]}`}>{e.status}</span>
                      <h3 style={{ marginTop: 12 }}>{e.title}</h3>
                      <p style={{ color: 'var(--red)', fontFamily: 'var(--cond)', letterSpacing: 1, marginTop: 8 }}>{e.event_date} · {e.location}</p>
                      <button type="button" className="btn btn-outline event-more" onClick={() => setSelected(e)}>Know More →</button>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {selected && (
        <div className="event-modal" onClick={() => setSelected(null)}>
          <div className="event-modal-box" onClick={(ev) => ev.stopPropagation()}>
            <button type="button" className="event-modal-close" onClick={() => setSelected(null)} aria-label="Close">×</button>
            <img className="event-modal-img" src={selected.image} alt={selected.title} />
            <div className="event-modal-body">
              <span className={`pill ${PILL[selected.status]}`}>{selected.status}</span>
              <h3 style={{ marginTop: 12 }}>{selected.title}</h3>
              <p className="event-modal-meta">{selected.event_date} · {selected.location}</p>
              {selected.description
                ? <p className="event-modal-desc">{selected.description}</p>
                : <p className="event-modal-desc" style={{ color: 'var(--grey)' }}>More details coming soon.</p>}
            </div>
          </div>
        </div>
      )}

      <div className="cta-banner"><div className="container"><Reveal>
        <h2>Want To Host An Event?</h2><p>We offer day-based venue rentals for tournaments, workshops and live experiences.</p>
        <Link to="/collaboration" className="btn btn-primary">Collaborate With Us →</Link>
      </Reveal></div></div>

      <style>{`
        .event-card{display:flex;flex-direction:column}
        .event-card .body{display:flex;flex-direction:column;flex:1}
        .event-more{margin-top:auto;align-self:flex-start}
        .event-modal{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:24px;animation:evFade .18s ease}
        .event-modal-box{position:relative;display:flex;background:var(--ink-2,#0c0c0c);border:1px solid var(--line,#222);width:min(960px,100%);max-height:88vh}
        .event-modal-img{width:46%;flex-shrink:0;object-fit:contain;background:#000;align-self:stretch;max-height:88vh}
        .event-modal-body{flex:1;padding:34px 36px;overflow:auto;display:flex;flex-direction:column;min-width:0}
        .event-modal-meta{color:var(--red);font-family:var(--cond);letter-spacing:1px;margin:10px 0 16px}
        .event-modal-desc{color:var(--grey-light);line-height:1.75}
        .event-modal-close{position:absolute;top:12px;right:14px;width:40px;height:40px;border:none;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-size:26px;line-height:1;cursor:pointer;z-index:3}
        .event-modal-close:hover{background:var(--red,#e11)}
        @keyframes evFade{from{opacity:0}to{opacity:1}}
        @media(max-width:720px){
          .event-modal-box{flex-direction:column;max-height:90vh;overflow:auto}
          .event-modal-img{width:100%;max-height:42vh}
        }
      `}</style>
    </PageHead>
  );
}
