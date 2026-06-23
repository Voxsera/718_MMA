import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import Reveal from '../components/Reveal.jsx';
import { useAuth } from '../auth.jsx';
import { inr } from '../api';

export default function Dashboard() {
  const { user, membership, ready, logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (ready && !user) navigate('/login'); }, [ready, user, navigate]);
  if (!ready) return <PageHead title="Loading…" />;
  if (!user) return null;

  const expires = membership ? new Date(membership.expires_at) : null;
  const daysLeft = expires ? Math.max(0, Math.ceil((expires - new Date()) / 86400000)) : 0;

  return (
    <PageHead crumb="My Account" title={`Welcome, <span class="text-red">${(user.name || 'Fighter').split(' ')[0]}</span>`}
      sub="Your 718 membership at a glance.">
      <section style={{ paddingTop: 30 }}>
        <div className="container">
          <div className="grid grid-3">
            <Reveal><div className="price-card">
              <div className="section-label">Membership</div>
              <h3>{membership ? membership.plan : 'No active plan'}</h3>
              {membership ? <>
                <p style={{ color: 'var(--grey-light)', marginTop: 10 }}>Active until <b style={{ color: '#fff' }}>{expires.toDateString()}</b></p>
                <p style={{ color: 'var(--red)', fontFamily: 'var(--display)', fontSize: 40, marginTop: 6 }}>{daysLeft}<span style={{ fontSize: 16, fontFamily: 'var(--body)', color: 'var(--grey)' }}> days left</span></p>
              </> : <Link to="/memberships" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>Renew / Join →</Link>}
            </div></Reveal>

            <Reveal delay={0.05}><div className="price-card">
              <div className="section-label">Today's Sessions</div>
              <ul style={{ listStyle: 'none' }}>
                <li>🕡 6:30 – 8:00 AM</li><li>🕗 8:00 – 9:30 AM</li><li>🌆 6:30 – 8:00 PM</li><li>🌙 8:00 – 9:30 PM</li>
              </ul>
              <p style={{ color: 'var(--grey)', fontSize: 13 }}>All 8 disciplines included. Just walk in.</p>
            </div></Reveal>

            <Reveal delay={0.1}><div className="price-card">
              <div className="section-label">Quick Links</div>
              <Link to="/events" className="btn btn-outline btn-block" style={{ marginBottom: 10 }}>Upcoming Events</Link>
              <Link to="/food" className="btn btn-outline btn-block" style={{ marginBottom: 10 }}>Order Food</Link>
              <Link to="/personal-training" className="btn btn-outline btn-block" style={{ marginBottom: 10 }}>Personal Training</Link>
              <button className="btn btn-primary btn-block" onClick={async () => { await logout(); navigate('/'); }}>Logout</button>
            </div></Reveal>
          </div>
        </div>
      </section>
    </PageHead>
  );
}
