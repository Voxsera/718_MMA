import { useEffect, useState } from 'react';
import PageHead from '../components/PageHead.jsx';
import Reveal from '../components/Reveal.jsx';
import CheckoutModal from '../components/CheckoutModal.jsx';
import { useAuth } from '../auth.jsx';
import { api, inr } from '../api';

export default function Memberships() {
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const { refresh } = useAuth();
  useEffect(() => { api.get('/api/memberships').then((m) => setPlans(m.filter((x) => x.type === 'membership'))).catch(() => {}); }, []);

  return (
    <PageHead crumb="Memberships" title='Join <span class="text-red">718</span>'
      sub="One membership unlocks all 8 disciplines, 4 sessions a day and full facility access. Pay securely with UPI, cards, netbanking or wallets — and unlock member login.">
      <section style={{ paddingTop: 50 }}>
        <div className="container">
          <div className="grid grid-4">
            {plans.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.05}>
                <div className={`price-card ${p.popular ? 'popular' : ''}`}>
                  {p.popular ? <div className="ribbon">Best Value</div> : null}
                  <h3>{p.name}</h3>
                  <div className="price">{inr(p.price)}</div>
                  <div className="dur">{p.duration}</div>
                  <ul>{p.features.split('\n').map((f, k) => <li key={k}>{f}</li>)}</ul>
                  <button className="btn btn-primary btn-block" onClick={() => setSelected({ name: p.name, price: p.price })}>Join Now</button>
                </div>
              </Reveal>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: 'var(--grey)', marginTop: 30 }}>Secured by <b style={{ color: '#fff' }}>Razorpay</b> · UPI, cards, netbanking &amp; wallets accepted</p>
        </div>
      </section>

      <section style={{ background: 'var(--ink)' }}>
        <div className="container split">
          <Reveal>
            <div className="section-label">Why Members Love 718</div>
            <h2 className="section-title">More Than A <span className="text-red">Gym</span></h2>
            <p className="section-intro">Train across MMA, Muay Thai, Boxing, BJJ and more. Access the facility and equipment at all times, join any of the 4 daily sessions, and become part of a community that pushes you forward.</p>
            <div className="timings">
              <div className="timing"><span>Open</span><b>6 AM – 12 AM</b></div>
              <div className="timing"><span>Sessions</span><b>4 Every Day</b></div>
              <div className="timing"><span>Disciplines</span><b>8 Included</b></div>
              <div className="timing"><span>Login</span><b>Members Only</b></div>
            </div>
          </Reveal>
          <Reveal delay={0.1}><img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=70&auto=format&fit=crop" alt="Members" style={{ height: 420, objectFit: 'cover', width: '100%', borderRadius: 6 }} /></Reveal>
        </div>
      </section>

      {selected && <CheckoutModal plan={selected} onClose={(ok) => { setSelected(null); if (ok) refresh(); }} />}
    </PageHead>
  );
}
