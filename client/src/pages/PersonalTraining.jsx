import { useEffect, useState } from 'react';
import PageHead from '../components/PageHead.jsx';
import Reveal from '../components/Reveal.jsx';
import CheckoutModal from '../components/CheckoutModal.jsx';
import { useAuth } from '../auth.jsx';
import { api, inr } from '../api';

export default function PersonalTraining() {
  const [trainers, setTrainers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const { refresh } = useAuth();
  useEffect(() => {
    api.get('/api/trainers').then(setTrainers).catch(() => {});
    api.get('/api/memberships').then((m) => setPlans(m.filter((x) => x.type === 'personal_training'))).catch(() => {});
  }, []);

  return (
    <PageHead crumb="Train · Personal Training" title='Personal <span class="text-red">Training</span>'
      sub="One-on-one coaching built around your goals — whether that's losing weight, learning to fight, or stepping into the cage.">
      <section>
        <div className="container">
          <div className="grid grid-3">
            {[['Custom Plans', 'Every session tailored to your level, schedule and goals — no cookie-cutter routines.'],
              ['Faster Results', 'Dedicated attention means cleaner technique and quicker progress.'],
              ['Fight Prep', 'Competing? Get sparring, conditioning, diet guidance and cornering.']]
              .map(([t, d], i) => <Reveal key={t} delay={i * 0.05}><div className="card"><div className="body"><h3 className="text-red">{t}</h3><p>{d}</p></div></div></Reveal>)}
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--ink)' }}>
        <div className="container">
          <Reveal className="section-head"><div className="section-label">Meet The Coaches</div><h2 className="section-title">Your <span className="text-red">Trainers</span></h2></Reveal>
          <div className="grid grid-4">
            {trainers.map((t, i) => (
              <Reveal key={t.id} delay={i * 0.05}>
                <div className="card"><img src={t.image} alt={t.name} loading="lazy" />
                  <div className="body"><h3>{t.name}</h3><span className="pill pill-red">{t.specialty}</span>
                    <p style={{ margin: '12px 0' }}>{t.bio}</p>
                    <p style={{ color: 'var(--red)', fontFamily: 'var(--cond)', letterSpacing: 1 }}>From {inr(t.fee)}/mo</p></div></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <Reveal className="section-head"><div className="section-label">Personal Trainer Fees</div><h2 className="section-title">PT <span className="text-red">Packages</span></h2>
            <p className="section-intro">Pick a package and pay securely online (UPI &amp; cards). Fees are per month and include full gym access.</p></Reveal>
          <div className="grid grid-3">
            {plans.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.05}>
                <div className={`price-card ${p.popular ? 'popular' : ''}`}>
                  {p.popular ? <div className="ribbon">Most Popular</div> : null}
                  <h3>{p.name}</h3><div className="price">{inr(p.price)}<small>/mo</small></div><div className="dur">{p.duration}</div>
                  <ul>{p.features.split('\n').map((f, k) => <li key={k}>{f}</li>)}</ul>
                  <button className="btn btn-primary btn-block" onClick={() => setSelected({ name: p.name, price: p.price })}>Pay {inr(p.price)}</button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {selected && <CheckoutModal plan={selected} onClose={(ok) => { setSelected(null); if (ok) refresh(); }} />}
    </PageHead>
  );
}
