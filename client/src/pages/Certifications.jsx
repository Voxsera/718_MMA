import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import Reveal from '../components/Reveal.jsx';
import { api } from '../api';

export default function Certifications() {
  const [certs, setCerts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { api.get('/api/certificates').then(setCerts).catch(() => {}).finally(() => setLoaded(true)); }, []);

  return (
    <PageHead crumb="Certifications" title='718 <span class="text-red">Certifications</span>'
      sub="Fighters and members officially certified by 718 MMA. Scan the QR code on any certificate to verify it here.">
      <section style={{ paddingTop: 40 }}>
        <div className="container">
          {loaded && certs.length === 0 ? (
            <p style={{ color: 'var(--grey)', textAlign: 'center' }}>No certifications published yet — check back soon.</p>
          ) : (
            <div className="grid grid-3">
              {certs.map((c, i) => (
                <Reveal key={c.id} delay={i * 0.05}>
                  <Link to={`/certifications/${encodeURIComponent(c.cert_id)}`} className="card cert-card" style={{ display: 'block' }}>
                    <div className="cert-card-media">
                      {/* Person photo when available; otherwise the certificate itself. */}
                      <img src={c.photo || c.image || '/718mma-logo.png'} alt={`${c.name} — 718 MMA certification`} loading="lazy"
                        style={{ objectFit: c.photo ? 'cover' : 'contain' }} />
                    </div>
                    <div className="body">
                      <span className="pill pill-red">{c.cert_id}</span>
                      <h3 style={{ marginTop: 12 }}>{c.name}</h3>
                      <p style={{ color: 'var(--red)', fontFamily: 'var(--cond)', letterSpacing: 1, marginTop: 8 }}>
                        {c.course}{c.cert_date ? ` · ${c.cert_date}` : ''}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
      <div className="cta-banner"><div className="container"><Reveal>
        <h2>Want To Get Certified?</h2><p>Train at 718, grade your skills under certified coaches and earn official recognition.</p>
        <Link to="/trial" className="btn btn-primary">Start Training →</Link>
      </Reveal></div></div>

      <style>{`
        .cert-card-media{height:240px;background:#000;overflow:hidden}
        .cert-card-media img{width:100%;height:100%;display:block}
      `}</style>
    </PageHead>
  );
}
