import { useEffect, useState } from 'react';
import PageHead from '../components/PageHead.jsx';
import Reveal from '../components/Reveal.jsx';
import { api } from '../api';

const brand = (u) => (u.includes('swiggy') ? 'Swiggy' : 'Zomato');
const color = (u) => (u.includes('swiggy') ? '#fc8019' : '#e23744');

export default function Food() {
  const [foods, setFoods] = useState([]);
  useEffect(() => { api.get('/api/foods').then(setFoods).catch(() => {}); }, []);

  return (
    <PageHead crumb="Nutrition" title='Eat To <span class="text-red">Perform</span>'
      sub="Training is only half the fight. Coach-approved meals to build muscle, cut fat and maintain a fighter's physique — order them straight to your door.">
      <section style={{ paddingTop: 30 }}>
        <div className="container">
          <Reveal className="form" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 40, borderLeft: '3px solid var(--red)' }}>
            <div style={{ fontSize: 40 }}>🛵</div>
            <div><h3 style={{ fontFamily: 'var(--cond)', letterSpacing: 1, textTransform: 'uppercase' }}>Order directly from the 718 app</h3>
              <p style={{ color: 'var(--grey-light)' }}>Every meal below is integrated with <b style={{ color: '#fc8019' }}>Swiggy</b> and <b style={{ color: '#e23744' }}>Zomato</b>. Tap "Order Now" to get it delivered.</p></div>
          </Reveal>
          <div className="grid grid-3">
            {foods.map((f, i) => (
              <Reveal key={f.id} delay={i * 0.05}>
                <div className="card"><img src={f.image} alt={f.name} loading="lazy" />
                  <div className="body"><span className="pill pill-grey">{f.category}</span>
                    <h3 style={{ marginTop: 12 }}>{f.name}</h3>
                    <p style={{ margin: '8px 0' }}>{f.description}</p>
                    <p style={{ color: 'var(--grey)', fontFamily: 'var(--cond)', letterSpacing: 1 }}>{f.calories} · {f.protein}</p>
                    <a href={f.order_url} target="_blank" rel="noreferrer" className="btn btn-block" style={{ marginTop: 14, background: color(f.order_url), color: '#fff' }}>Order on {brand(f.order_url)} →</a>
                  </div></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--ink)' }}>
        <div className="container">
          <Reveal className="section-head"><div className="section-label">Quick Tips</div><h2 className="section-title">Fueling The <span className="text-red">Fighter</span></h2></Reveal>
          <div className="grid grid-3">
            {[['Protein First', 'Aim for ~1.6–2g protein per kg bodyweight to recover from 4 daily sessions.'],
              ['Hydrate Hard', 'Combat training drains you fast. Water + electrolytes before and after every session.'],
              ['Time Your Carbs', 'Carbs around training for energy; lighter, protein-led meals at night for recovery.']]
              .map(([t, d], i) => <Reveal key={t} delay={i * 0.05}><div className="card"><div className="body"><h3 className="text-red">{t}</h3><p>{d}</p></div></div></Reveal>)}
          </div>
        </div>
      </section>
    </PageHead>
  );
}
