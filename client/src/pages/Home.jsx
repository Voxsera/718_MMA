import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Page from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import { TestimonialsColumn } from '../components/TestimonialsColumns.jsx';
import { api } from '../api';

const STATUS_PILL = { upcoming: 'pill-red', ongoing: 'pill-green', past: 'pill-grey' };
const HERO_IMG = 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1800&q=80&auto=format&fit=crop';

// ── HERO TITLE FONT ──────────────────────────────────────────────
// Uncomment ONE line to try that font in the hero heading.
// (All fonts are already loaded in client/src/index.css @import.)
const HERO_FONT = 'var(--display)';            // Anton (current default)
// const HERO_FONT = "'Bebas Neue', sans-serif";    // tall, tight, boxing-poster energy
// const HERO_FONT = "'Oswald', sans-serif";        // condensed, clean, versatile
// const HERO_FONT = "'Teko', sans-serif";          // tall and techy, modern gym feel
// const HERO_FONT = "'Archivo Black', sans-serif"; // heavy, blocky, loud
// const HERO_FONT = "'Staatliches', sans-serif";   // narrow all-caps, editorial
// const HERO_FONT = "'Black Ops One', sans-serif"; // military stencil, aggressive
// const HERO_FONT = "'Kanit', sans-serif";         // modern, nods to Muay Thai
// ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.get('/api/courses').then(setCourses).catch(() => {});
    api.get('/api/events').then((e) => setEvents(e.filter((x) => x.status !== 'past').slice(0, 3))).catch(() => {});
    api.get('/api/reviews').then((r) => setReviews(r.slice(0, 9))).catch(() => {});
    api.get('/api/status').then(setStatus).catch(() => {});
  }, []);

  // Map reviews to the testimonial shape and spread across 3 scrolling columns.
  const reviewCols = [[], [], []];
  reviews
    .map((r) => ({ text: r.text, name: r.author, role: `${r.relative_time} · Google`, rating: r.rating }))
    .forEach((m, i) => reviewCols[i % 3].push(m));

  return (
    <Page>
      {/* HERO — cinematic photographic */}
      <header className={'hero' + (status?.closedToday ? ' hero-closed' : '')}>
        <div className="hero-img" style={{ backgroundImage: `url(${HERO_IMG})` }} />
        <div className="hero-grad" />
        {status?.closedToday && (
          <div className="hero-closed-banner">
            ⚠ {status.message || 'The gym is closed today.'}
          </div>
        )}
        <div className="container" style={{ position: 'relative', zIndex: 3 }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ maxWidth: 820 }}>
            <span style={{ display: 'inline-flex', gap: 8, fontFamily: 'var(--cond)', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', fontSize: 13, background: 'var(--red)', padding: '8px 16px', marginBottom: 18 }}>
              4 Sessions Everyday · 6 AM – 12 AM
            </span>
            <h1 style={{ fontFamily: HERO_FONT, fontSize: 'clamp(44px,7.5vw,104px)', lineHeight: 0.9 }}>Train Like<br /><span className="text-red">A Fighter.</span></h1>
            <p style={{ fontSize: 'clamp(17px,2vw,22px)', color: 'var(--grey-light)', maxWidth: 560, margin: '20px 0 30px' }}>
              Flexible timings, professional coaching, and a community that pushes you forward. See you on the mats.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link to="/trial" className="btn btn-primary">Claim Free Trial →</Link>
              <Link to="/courses" className="btn btn-outline">Explore Courses</Link>
            </div>
            <div style={{ display: 'flex', gap: 40, marginTop: 42, flexWrap: 'wrap' }}>
              {[['8', 'Disciplines'], ['4', 'Daily Sessions'], ['18hrs', 'Open Daily'], ['1', 'Free Trial Day']].map(([n, l]) => (
                <div key={l}><b style={{ fontFamily: 'var(--display)', fontSize: 42, display: 'block', lineHeight: 1 }}>{n}</b>
                  <span style={{ fontFamily: 'var(--cond)', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--grey)', fontSize: 13 }}>{l}</span></div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="hero-scroll">Scroll
          <svg className="hero-scroll-arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </header>


      {/* ABOUT + TIMINGS */}
      <section style={{ background: 'var(--ink)' }}>
        <div className="container split">
          <Reveal><img src="https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=900&q=70&auto=format&fit=crop" alt="718 MMA" style={{ height: 480, objectFit: 'cover', width: '100%' }} /></Reveal>
          <Reveal delay={0.1}>
            <div className="section-label">About Us</div>
            <h2 className="section-title">Seven One Eight <span className="text-red">Active MMA</span></h2>
            <p className="section-intro">718 MMA is Hyderabad's home for combat sports. A professional facility, experienced coaches and a community built to push you forward — open early morning to midnight so training always fits your day.</p>
            <div className="timings">
              <div className="timing"><span>Session 1</span><b>6:30 – 8:00 AM</b></div>
              <div className="timing"><span>Session 2</span><b>8:00 – 9:30 AM</b></div>
              <div className="timing"><span>Session 3</span><b>6:30 – 8:00 PM</b></div>
              <div className="timing"><span>Session 4</span><b>8:00 – 9:30 PM</b></div>
            </div>
            <Link to="/about" className="btn btn-outline" style={{ marginTop: 28 }}>More About Us</Link>
          </Reveal>
        </div>
      </section>

      {/* COURSES */}
      <section>
        <div className="container">
          <Reveal className="section-head">
            <div className="section-label">Our Courses</div>
            <h2 className="section-title">Eight Ways To <span className="text-red">Get Better</span></h2>
            <p className="section-intro">From stand-up striking to ground game and conditioning — whether it's your first day or you're prepping for the cage, there's a class for you.</p>
          </Reveal>
          <div className="grid grid-4">
            {courses.map((c, i) => (
              <Reveal key={c.slug} delay={i * 0.05}>
                <Link className="course-card" to={`/courses/${c.slug}`}>
                  <img src={c.image} alt={c.name} loading="lazy" />
                  <span className="num" />
                  <div className="overlay"><div className="tag">{c.tagline}</div><h3>{c.name}</h3><div className="more">Explore →</div></div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="container"><div className="divider" /></div>

      {/* TRIAL */}
      <section>
        <div className="container split">
          <Reveal>
            <div className="section-label">Trial Training</div>
            <h2 className="section-title">Your First Day Is <span className="text-red">On Us</span></h2>
            <p className="section-intro">Not sure where to start? Come train for free. We offer <b style={{ color: '#fff' }}>one full day of trial training, completely free</b> — try any discipline and feel the energy before you commit.</p>
            <Link to="/trial" className="btn btn-primary" style={{ marginTop: 28 }}>Book Free Trial →</Link>
          </Reveal>
          <Reveal delay={0.1}>
            <img src="https://images.unsplash.com/photo-1517438476312-10d79c077509?w=900&q=70&auto=format&fit=crop" alt="Trial" style={{ height: 440, objectFit: 'cover', width: '100%' }} />
          </Reveal>
        </div>
      </section>

      <div className="container"><div className="divider" /></div>
      {/* EVENTS */}
      <section>
        <div className="container">
          <Reveal className="section-head">
            <div className="section-label">Events</div>
            <h2 className="section-title">What's <span className="text-red">Happening</span></h2>
          </Reveal>
          <div className="grid grid-3">
            {events.map((e, i) => (
              <Reveal key={e.id} delay={i * 0.05}>
                <div className="card"><img src={e.image} alt={e.title} loading="lazy" />
                  <div className="body"><span className={`pill ${STATUS_PILL[e.status]}`}>{e.status}</span>
                    <h3 style={{ marginTop: 14 }}>{e.title}</h3>
                    <p style={{ margin: '8px 0' }}>{e.description}</p>
                    <p style={{ color: 'var(--red)', fontFamily: 'var(--cond)', letterSpacing: 1 }}>{e.event_date} · {e.location}</p>
                  </div></div>
              </Reveal>
            ))}
          </div>
          <Link to="/events" className="btn btn-outline" style={{ marginTop: 36 }}>All Events →</Link>
        </div>
      </section>

      {/* COLLABORATION */}
      <section style={{ background: 'var(--ink)' }}>
        <div className="container split">
          <Reveal>
            <div className="section-label">Collaboration</div>
            <h2 className="section-title">Host Your Next <span className="text-red">Fight Event Here</span></h2>
            <p className="section-intro">Your event. Our arena. Whether it's a tournament, workshop, fitness challenge or private gathering, we've got the space. We offer day-based venue rentals for combat sports events and live experiences.</p>
            <Link to="/collaboration" className="btn btn-primary" style={{ marginTop: 28 }}>Collaborate With Us →</Link>
          </Reveal>
          <Reveal delay={0.1}><img src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=900&q=70&auto=format&fit=crop" alt="Events" style={{ height: 440, objectFit: 'cover', width: '100%' }} /></Reveal>
        </div>
      </section>

      {/* REVIEWS */}
      <section>
        <div className="container">
          <Reveal className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
            <div><div className="section-label">Google Reviews</div><h2 className="section-title">Loved By Our <span className="text-red">Community</span></h2></div>
            <div className="google-badge"><div className="g"><span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span></div>
              <div><b style={{ fontSize: 22 }}>4.9</b> <span style={{ color: '#ffb400' }}>★★★★★</span><br /><span style={{ color: 'var(--grey)', fontSize: 13 }}>Based on Google reviews</span></div></div>
          </Reveal>
          <div className="tcols">
            <TestimonialsColumn testimonials={reviewCols[0]} duration={15} />
            <TestimonialsColumn testimonials={reviewCols[1]} duration={19} className="tcol-md" />
            <TestimonialsColumn testimonials={reviewCols[2]} duration={17} className="tcol-lg" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-banner">
        <div className="container">
          <Reveal><h2>Ready To Step On The Mats?</h2>
            <p>Claim your free one-day trial and find out why 718 is Hyderabad's fastest-growing MMA club.</p>
            <Link to="/trial" className="btn btn-primary">Start Free Trial →</Link>
          </Reveal>
        </div>
      </div>
    </Page>
  );
}
