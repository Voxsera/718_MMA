import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import Reveal from '../components/Reveal.jsx';

const MEDALS = {
  Gold: { color: '#f5c542', label: 'Gold' },
  Silver: { color: '#c9ced6', label: 'Silver' },
  Bronze: { color: '#cd7f32', label: 'Bronze' },
};

const CHAMPIONS = [
  { name: 'Mansoor Wahlan', medal: 'Gold' },
  { name: 'Huzaifa Abdul Rahman', medal: 'Gold' },
  { name: 'Mohd Kamran', medal: 'Gold' },
  { name: 'Aditya Raj', medal: 'Silver' },
  { name: 'Omar Qureshi', medal: 'Silver' },
  { name: 'Abdur Rahman', medal: 'Bronze' },
  { name: 'Syed Mahboob', medal: 'Bronze' },
];

const COUNTS = ['Gold', 'Silver', 'Bronze'].map((m) => ({ medal: m, n: CHAMPIONS.filter((c) => c.medal === m).length }));

export default function Achievements() {
  return (
    <PageHead crumb="Achievements" title='Our <span class="text-red">Champions</span>'
      sub="ISKA India 2026 Open South Zone Kickboxing Championship — the 718 MMA fighters who stood on the podium.">
      <section style={{ paddingTop: 40 }}>
        <div className="container">
          <Reveal>
            <figure className="ach-photo">
              <img src="/iska-india-2026-champions.jpg" alt="718 MMA medal winners at the ISKA India 2026 Open South Zone Kickboxing Championship" />
              <figcaption>718 MMA at the ISKA India 2026 Open South Zone Kickboxing Championship</figcaption>
            </figure>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="ach-counts">
              {COUNTS.map((c) => (
                <div key={c.medal} className="ach-count" style={{ '--m': MEDALS[c.medal].color }}>
                  <strong>{c.n}</strong><span>{c.medal}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <div className="grid grid-3" style={{ marginTop: 40 }}>
            {CHAMPIONS.map((c, i) => (
              <Reveal key={c.name} delay={i * 0.05}>
                <div className="card ach-card" style={{ '--m': MEDALS[c.medal].color }}>
                  <div className="body">
                    <span className="ach-medal" aria-hidden="true">🏅</span>
                    <h3>{c.name}</h3>
                    <p className="ach-rank">{MEDALS[c.medal].label} Medal</p>
                    <p className="ach-event">ISKA India 2026 · Kickboxing</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="cta-banner"><div className="container"><Reveal>
        <h2>Train Like A Champion</h2><p>Join the gym that produces national-level medalists.</p>
        <Link to="/trial" className="btn btn-primary">Start Training →</Link>
      </Reveal></div></div>

      <style>{`
        .ach-photo{margin:0;border:1px solid var(--line);background:#000;position:relative}
        .ach-photo img{width:100%;height:auto;display:block}
        .ach-photo figcaption{padding:14px 20px;font-family:var(--cond);letter-spacing:2px;text-transform:uppercase;font-size:14px;color:var(--grey-light);border-top:3px solid var(--red);background:var(--ink-2)}
        .ach-counts{display:flex;justify-content:center;gap:18px;margin-top:28px;flex-wrap:wrap}
        .ach-count{min-width:130px;text-align:center;padding:16px 26px;background:var(--ink-2);border:1px solid var(--line);border-bottom:3px solid var(--m)}
        .ach-count strong{display:block;font-family:var(--display);font-size:44px;line-height:1;color:var(--m)}
        .ach-count span{font-family:var(--cond);letter-spacing:3px;text-transform:uppercase;font-size:13px;color:var(--grey-light)}
        .ach-card{border-top:3px solid var(--m)}
        .ach-card .body{align-items:flex-start}
        .ach-medal{font-size:34px;line-height:1;margin-bottom:12px;filter:drop-shadow(0 0 8px var(--m))}
        .ach-rank{color:var(--m) !important;font-family:var(--cond);font-weight:700;letter-spacing:2px;text-transform:uppercase;font-size:16px !important}
        .ach-event{margin-top:6px;font-size:13px !important;color:var(--grey) !important}
      `}</style>
    </PageHead>
  );
}
