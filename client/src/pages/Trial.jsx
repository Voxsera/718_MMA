import { useState } from 'react';
import PageHead from '../components/PageHead.jsx';
import Reveal from '../components/Reveal.jsx';
import { api } from '../api';

const DISCIPLINES = ['MMA', 'Muay Thai', 'Kickboxing', 'Boxing', 'Jujutsu', 'BJJ', 'Wrestling', 'CrossFit', 'Not sure yet'];

export default function Trial() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', discipline: 'MMA', preferred_date: '', message: '' });
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    const res = await api.post('/api/trial', form);
    if (res.ok) { setMsg({ t: 'ok', m: res.message }); setForm({ name: '', phone: '', email: '', discipline: 'MMA', preferred_date: '', message: '' }); }
    else setMsg({ t: 'err', m: res.error || 'Something went wrong.' });
  };

  return (
    <PageHead crumb="Train · Free Trial" title='One Free <span class="text-red">Trial Day</span>'
      sub="Try 718 MMA for a full day, completely free. Pick a discipline, meet the coaches and feel the energy before you commit.">
      <section style={{ paddingTop: 40 }}>
        <div className="container split">
          <Reveal>
            <img src="https://images.unsplash.com/photo-1517438476312-10d79c077509?w=900&q=70&auto=format&fit=crop" alt="Trial" style={{ height: 280, objectFit: 'cover', width: '100%', borderRadius: 6, marginBottom: 22 }} />
            <h2 className="section-title" style={{ fontSize: 34 }}>How It <span className="text-red">Works</span></h2>
            <div className="timings" style={{ gridTemplateColumns: '1fr' }}>
              <div className="timing"><b>1 · Book your slot</b><span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--grey-light)' }}>Fill the form — pick a discipline and a day.</span></div>
              <div className="timing"><b>2 · We confirm</b><span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--grey-light)' }}>Our team calls you to lock in a session time.</span></div>
              <div className="timing"><b>3 · Come train</b><span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--grey-light)' }}>Show up, train for free, see if 718 is for you.</span></div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <form className="form" onSubmit={submit}>
              <h2 style={{ fontFamily: 'var(--cond)', letterSpacing: 1, textTransform: 'uppercase' }}>Claim Your Free Trial</h2>
              <div className="row"><div><label>Name *</label><input value={form.name} onChange={set('name')} required /></div>
                <div><label>Phone *</label><input value={form.phone} onChange={set('phone')} required /></div></div>
              <label>Email</label><input type="email" value={form.email} onChange={set('email')} />
              <div className="row">
                <div><label>Discipline</label><select value={form.discipline} onChange={set('discipline')}>{DISCIPLINES.map((d) => <option key={d}>{d}</option>)}</select></div>
                <div><label>Preferred Date</label><input type="date" value={form.preferred_date} onChange={set('preferred_date')} /></div>
              </div>
              <label>Anything we should know?</label><textarea rows="3" value={form.message} onChange={set('message')} />
              <button className="btn btn-primary btn-block" style={{ marginTop: 18 }}>Book Free Trial →</button>
              {msg && <p className={`form-msg ${msg.t}`}>{msg.m}</p>}
            </form>
          </Reveal>
        </div>
      </section>
    </PageHead>
  );
}
