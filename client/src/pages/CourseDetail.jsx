import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Page from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import { api } from '../api';

// Gallery images per discipline — each course shows only its own relevant image.
const GALLERY = {};

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

function TrialButton({ discipline, children = 'Book Free Trial →' }) {
  const to = discipline ? `/trial?discipline=${encodeURIComponent(discipline)}` : '/trial';
  return <Link to={to} className="btn btn-primary">{children}</Link>;
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

  const gallery = GALLERY[course.slug] || [];
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
            <div className="cd-hero-cta"><TrialButton discipline={course.name} /></div>
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

            {/* Course-specific free trial card */}
            <Reveal delay={0.1} className="cd-trial-card">
              <div className="section-label">Free Trial</div>
              <h3 className="cd-trial-title">Try {course.name} <span className="text-red">Free</span></h3>
              <p className="cd-trial-sub">One full day of {course.name} training on us — meet the coaches, feel the intensity, no commitment.</p>
              <div className="cd-trial-times">
                <div className="timing"><span>Morning</span><b>6:30 – 8:00 · 8:00 – 9:30</b></div>
                <div className="timing"><span>Evening</span><b>6:30 – 8:00 · 8:00 – 9:30</b></div>
              </div>
              <TrialButton discipline={course.name}>Book {course.name} Trial →</TrialButton>
            </Reveal>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <div className="cta-banner">
        <div className="container"><Reveal>
          <h2>Your First Day Is <span className="text-red">Free</span></h2>
          <p>Come try {course.name} free — one full day of trial training, no commitment.</p>
          <TrialButton discipline={course.name} />
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
        .cd-gallery{display:grid;grid-template-columns:1.5fr 1fr;gap:22px;align-items:stretch}
        .cd-gallery img{width:100%;height:100%;min-height:340px;object-fit:cover;display:block}
        .cd-trial-card{background:var(--ink-2);border:1px solid var(--line);border-top:3px solid var(--red);padding:34px 30px;display:flex;flex-direction:column;align-items:flex-start;gap:0}
        .cd-trial-title{font-size:clamp(26px,3.4vw,36px);margin-bottom:12px}
        .cd-trial-sub{color:var(--grey-light);font-size:15px;line-height:1.65;margin-bottom:20px}
        .cd-trial-times{display:grid;grid-template-columns:1fr;gap:10px;width:100%;margin-bottom:24px}
        .cd-trial-card .timing b{font-size:19px}
        @media(max-width:820px){
          .cd-body{grid-template-columns:1fr;gap:30px}
          .cd-gallery{grid-template-columns:1fr}
          .cd-gallery img{min-height:280px;height:300px}
        }
      `}</style>
    </Page>
  );
}
