import { useState } from 'react';
import PageHead from '../components/PageHead.jsx';
import Reveal from '../components/Reveal.jsx';
import { api } from '../api';

const TYPES = ['Venue Rental', 'Tournament', 'Workshop / Seminar', 'Brand / Sponsorship', 'Other'];

export default function Collaboration() {
  const [form, setForm] = useState({ name: '', organization: '', email: '', phone: '', type: 'Venue Rental', message: '' });
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    const res = await api.post('/api/collaborate', form);
    if (res.ok) { setMsg({ t: 'ok', m: res.message }); setForm({ name: '', organization: '', email: '', phone: '', type: 'Venue Rental', message: '' }); }
    else setMsg({ t: 'err', m: res.error || 'Something went wrong.' });
  };

  const cards = [['Venue Rental', 'Full arena and mat space on a day-based rental for your event.'],
    ['Tournaments', 'Host amateur or pro combat sports tournaments with our cage and ring.'],
    ['Workshops', 'Seminars, fitness challenges and skill camps with top names.'],
    ['Gatherings', 'Private gatherings, brand activations and community events.']];

  return (
    <PageHead crumb="Collaboration" title='Host Your Next <span class="text-red">Fight Event Here</span>'
      sub="Your event. Our arena. We offer day-based venue rentals for combat sports events, community gatherings and live experiences.">
      <section style={{ paddingTop: 40 }}>
        <div className="container split">
          <Reveal>
            <img src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=900&q=70&auto=format&fit=crop" alt="Venue" style={{ height: 300, objectFit: 'cover', width: '100%', borderRadius: 6, marginBottom: 24 }} />
            <h2 className="section-title" style={{ fontSize: 34 }}>What We <span className="text-red">Offer</span></h2>
            <div className="grid grid-2" style={{ marginTop: 18 }}>
              {cards.map(([t, d]) => <div key={t} className="card"><div className="body"><h3 style={{ fontSize: 20 }}>{t}</h3><p>{d}</p></div></div>)}
            </div>
            <p style={{ color: 'var(--grey)', marginTop: 22 }}>Reach out: <b style={{ color: '#fff' }}>+91 91337 18718</b> · <b style={{ color: '#fff' }}>718mmahyd@gmail.com</b></p>
          </Reveal>
          <Reveal delay={0.1}>
            <form className="form" onSubmit={submit}>
              <h2 style={{ fontFamily: 'var(--cond)', letterSpacing: 1, textTransform: 'uppercase' }}>Book / Collaborate</h2>
              <div className="row"><div><label>Your Name *</label><input value={form.name} onChange={set('name')} required /></div>
                <div><label>Organization</label><input value={form.organization} onChange={set('organization')} /></div></div>
              <div className="row"><div><label>Email *</label><input type="email" value={form.email} onChange={set('email')} required /></div>
                <div><label>Phone</label><input value={form.phone} onChange={set('phone')} /></div></div>
              <label>Type Of Collaboration</label><select value={form.type} onChange={set('type')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              <label>Tell Us More</label><textarea rows="4" value={form.message} onChange={set('message')} placeholder="Dates, expected attendance, what you have in mind..." />
              <button className="btn btn-primary btn-block" style={{ marginTop: 18 }}>Send Request →</button>
              {msg && <p className={`form-msg ${msg.t}`}>{msg.m}</p>}
            </form>
          </Reveal>
        </div>
      </section>
    </PageHead>
  );
}
