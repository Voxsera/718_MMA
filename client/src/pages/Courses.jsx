import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import Reveal from '../components/Reveal.jsx';
import { api } from '../api';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  useEffect(() => { api.get('/api/courses').then(setCourses).catch(() => {}); }, []);


  return (
    <PageHead crumb="Train · Courses" title='Our <span class="text-red">Courses</span>'
      sub="Eight disciplines under one roof. Pick your path or train across all of them with a single membership.">
      <section style={{ paddingTop: 50 }}>
        <div className="container">
          <div className="grid grid-3">
            {courses.map((c, i) => (
              <Reveal key={c.slug} delay={i * 0.04}>
                <Link className="course-card" to={`/courses/${c.slug}`}>
                  <img src={c.image} alt={c.name} loading="lazy" />
                  <span className="num" />
                  <div className="overlay"><div className="tag">{c.tagline}</div><h3>{c.name}</h3><div className="more">Learn more →</div></div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      <div className="cta-banner"><div className="container"><Reveal>
        <h2>One Membership. Every Discipline.</h2>
        <p>All 8 courses are included with a 718 membership — 4 sessions a day, 6 AM to 12 AM.</p>
        <Link to="/memberships" className="btn btn-primary">See Memberships →</Link>
      </Reveal></div></div>
    </PageHead>
  );
}
