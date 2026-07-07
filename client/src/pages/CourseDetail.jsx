import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Page from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import { api } from '../api';

const ug = (id) => `https://images.unsplash.com/${id}?w=1100&q=75&auto=format&fit=crop`;

// A few extra training shots per discipline so each page has a small gallery.
const GALLERY = {
  mma: ['photo-1599058917212-d750089bc07e', 'photo-1517438476312-10d79c077509'],
  'muay-thai': ['photo-1605296867304-46d5465a13f1', 'photo-1517649763962-0c623066013b'],
  kickboxing: ['photo-1549719386-74dfcbf7dbed', 'photo-1599058917212-d750089bc07e'],
  boxing: ['photo-1594381898411-846e7d193883', 'photo-1517438476312-10d79c077509'],
  jujutsu: ['photo-1574680178050-55c6a6a96e0a', 'photo-1517649763962-0c623066013b'],
  bjj: ['photo-1555597673-b21d5c935865', 'photo-1549476464-37392f717541'],
  wrestling: ['photo-1605296867304-46d5465a13f1', 'photo-1567013127542-490d757e51fc'],
  crossfit: ['photo-1534438327276-14e5300c3a48', 'photo-1517838277536-f5f99be501cd'],
};

// Generic-but-true training highlights per discipline.
const HIGHLIGHTS = {
  mma: ['Striking, clinch and ground game in one class', 'Live drilling and controlled sparring', 'Build real fight IQ and confidence'],
  'muay-thai': ['Fists, elbows, knees and shins', 'Heavy bag, pad work and clinch', 'Authentic Thai conditioning'],
  kickboxing: ['Explosive kick and punch combinations', 'High-intensity cardio and fat burn', 'Footwork and timing fundamentals'],
  boxing: ['Footwork, head movement and defense', 'Crisp combinations on pads and bags', 'From first-timers to competitors'],
  jujutsu: ['Joint locks, throws and breakfalls', 'Practical self-defense fundamentals', 'Suited to every body type'],
  bjj: ['Leverage and technique over strength', 'Guard, passing, sweeps and submissions', 'Gi and positional sparring'],
  wrestling: ['Takedowns, scrambles and top control', 'The backbone of a strong MMA game', 'Olympic-style technique and drilling'],
  crossfit: ['Functional strength and conditioning', 'Built for fighters and everyone else', 'Move better, hit harder, last longer'],
};

const COMMON = ['Coached by experienced professionals', '4 sessions every day · 6 AM to 12 AM', 'Included with any 718 membership'];

function TrialButton({ children = 'Book Free Trial →' }) {
  return <Link to="/trial" className="btn btn-primary">{children}</Link>;
}

export default function CourseDetail() {
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/api/courses')
      .then((list) => setCourse(list.find((c) => c.slug === slug) || null))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [slug]);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (loaded && !course) {
    return (
      <Page>
        <div className="container" style={{ padding: '160px 0', textAlign: 'center' }}>
          <h1 className="section-title">Course Not Found</h1>
          <p className="section-intro" style={{ margin: '14px auto 30px' }}>We couldn't find that course.</p>
          <Link to="/courses" className="btn btn-outline">← All Courses</Link>
        </div>
      </Page>
    );
  }

  if (!course) return <Page><div style={{ height: '60vh' }} /></Page>;

  const gallery = (GALLERY[course.slug] || []).map(ug);
  const points = [...(HIGHLIGHTS[course.slug] || []), ...COMMON];

  return (
    <Page>
      {/* HERO */}
      <header className="cd-hero">
        <div className="cd-hero-img" style={{ backgroundImage: `url(${course.image})` }} />
        <div className="cd-hero-grad" />
        <div className="container cd-hero-inner">
          <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <Link to="/courses" className="cd-back">← All Courses</Link>
            <div className="section-label" style={{ marginTop: 18 }}>{course.tagline}</div>
            <h1 className="cd-title">{course.name}</h1>
            <div className="cd-hero-cta"><TrialButton /></div>
          </motion.div>
        </div>
      </header>

      {/* DESCRIPTION + HIGHLIGHTS */}
      <section>
        <div className="container cd-body">
          <Reveal>
            <div className="section-label">Overview</div>
            <h2 className="section-title">Train <span className="text-red">{course.name}</span></h2>
            <p className="section-intro" style={{ marginTop: 18 }}>{course.description}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="cd-points">
              {points.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* GALLERY */}
      <section style={{ background: 'var(--ink)', paddingTop: 0 }}>
        <div className="container">
          <Reveal className="section-head"><div className="section-label">In The Gym</div>
            <h2 className="section-title">{course.name} <span className="text-red">In Action</span></h2></Reveal>
          <div className="cd-gallery">
            <img src={course.image} alt={course.name} className="cd-g-main" loading="lazy" />
            {gallery.map((g, i) => <img key={i} src={g} alt={`${course.name} training`} loading="lazy" />)}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <div className="cta-banner">
        <div className="container"><Reveal>
          <h2>Your First Day Is <span className="text-red">Free</span></h2>
          <p>Come try {course.name} free — one full day of trial training, no commitment.</p>
          <TrialButton />
        </Reveal></div>
      </div>

      <style>{`
        .cd-hero{position:relative;min-height:62vh;display:flex;align-items:flex-end;padding:0 0 56px;overflow:hidden}
        .cd-hero-img{position:absolute;inset:0;background-size:cover;background-position:center;transform:scale(1.05);animation:cdZoom 14s ease-out forwards}
        @keyframes cdZoom{to{transform:scale(1.16)}}
        .cd-hero-grad{position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,4,4,.92),rgba(4,4,4,.55) 55%,rgba(4,4,4,.3)),linear-gradient(0deg,#040404,transparent 60%)}
        .cd-hero-inner{position:relative;z-index:2}
        .cd-back{font-family:var(--cond);letter-spacing:2px;text-transform:uppercase;font-size:13px;color:var(--grey-light)}
        .cd-back:hover{color:var(--red)}
        .cd-title{font-size:clamp(44px,8vw,96px);line-height:.9;margin:6px 0 26px}
        .cd-hero-cta{display:flex;gap:14px;flex-wrap:wrap}
        .cd-body{display:grid;grid-template-columns:1.4fr 1fr;gap:50px;align-items:start}
        .cd-points{list-style:none;display:flex;flex-direction:column;gap:14px;margin-top:8px}
        .cd-points li{position:relative;padding-left:30px;color:var(--grey-light);font-size:16px;line-height:1.5}
        .cd-points li::before{content:'';position:absolute;left:0;top:9px;width:12px;height:12px;background:var(--red);transform:rotate(45deg)}
        .cd-gallery{display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px}
        .cd-gallery img{width:100%;height:300px;object-fit:cover;display:block}
        .cd-g-main{grid-row:span 1}
        @media(max-width:820px){
          .cd-body{grid-template-columns:1fr;gap:30px}
          .cd-gallery{grid-template-columns:1fr 1fr}
          .cd-g-main{grid-column:span 2;height:340px}
        }
        @media(max-width:520px){.cd-gallery{grid-template-columns:1fr}.cd-g-main{grid-column:span 1}.cd-gallery img{height:240px}}
      `}</style>
    </Page>
  );
}
