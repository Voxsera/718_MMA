import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import Reveal from '../components/Reveal.jsx';
import { api } from '../api';

const PILL = { upcoming: 'pill-red', ongoing: 'pill-green', past: 'pill-grey' };
const TABS = ['upcoming', 'ongoing', 'past', 'all'];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState('upcoming');
  useEffect(() => { api.get('/api/events').then(setEvents).catch(() => {}); }, []);
  const list = tab === 'all' ? events : events.filter((e) => e.status === tab);

  return (
    <PageHead crumb="Events" title='718 <span class="text-red">Events</span>'
      sub="Seminars, sparring meets, fight nights and community gatherings. Everything past, present and on the horizon.">
      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="tabs">
            {TABS.map((t) => <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</div>)}
          </div>
          {list.length === 0 ? <p style={{ color: 'var(--grey)', textAlign: 'center' }}>No {tab} events right now — check back soon.</p> : (
            <div className="grid grid-3">
              {list.map((e, i) => (
                <Reveal key={e.id} delay={i * 0.05}>
                  <div className="card"><img src={e.image} alt={e.title} loading="lazy" />
                    <div className="body"><span className={`pill ${PILL[e.status]}`}>{e.status}</span>
                      <h3 style={{ marginTop: 12 }}>{e.title}</h3>
                      <p style={{ margin: '8px 0' }}>{e.description}</p>
                      <p style={{ color: 'var(--red)', fontFamily: 'var(--cond)', letterSpacing: 1 }}>📅 {e.event_date} · {e.location}</p>
                    </div></div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
      <div className="cta-banner"><div className="container"><Reveal>
        <h2>Want To Host An Event?</h2><p>We offer day-based venue rentals for tournaments, workshops and live experiences.</p>
        <Link to="/collaboration" className="btn btn-primary">Collaborate With Us →</Link>
      </Reveal></div></div>
    </PageHead>
  );
}
