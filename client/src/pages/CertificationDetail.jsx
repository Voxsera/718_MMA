import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Page from '../components/Page.jsx';
import Reveal from '../components/Reveal.jsx';
import { api } from '../api';

// Landing page for certificate QR codes: /certifications/<CERT-ID>
// Shows only this person's certificate — acts as the verification page.
// With a person photo: photo on the left, certificate on the right.
export default function CertificationDetail() {
  const { certId } = useParams();
  const [cert, setCert] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCert(null); setLoaded(false);
    api.get(`/api/certificates/${encodeURIComponent(certId)}`)
      .then(setCert).catch(() => {}).finally(() => setLoaded(true));
    window.scrollTo(0, 0);
  }, [certId]);

  if (loaded && !cert) {
    return (
      <Page>
        <div className="container" style={{ padding: '160px 0', textAlign: 'center' }}>
          <h1 className="section-title">Certificate Not <span className="text-red">Found</span></h1>
          <p className="section-intro" style={{ margin: '14px auto 30px' }}>
            We couldn't verify a certificate with ID “{certId}”. Check the ID or contact 718 MMA.
          </p>
          <Link to="/certifications" className="btn btn-outline">← All Certifications</Link>
        </div>
      </Page>
    );
  }

  if (!cert) return <Page><div style={{ height: '60vh' }} /></Page>;

  return (
    <Page>
      <section style={{ paddingTop: 130 }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 34 }}>
              <div className="section-label" style={{ display: 'inline-block' }}>✓ Verified 718 MMA Certification</div>
              <h1 className="section-title" style={{ marginTop: 10 }}>{cert.name}</h1>
              <p style={{ color: 'var(--red)', fontFamily: 'var(--cond)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 12 }}>
                {cert.course}{cert.cert_date ? ` · ${cert.cert_date}` : ''} · ID {cert.cert_id}
              </p>
              <p style={{ color: 'var(--grey-light)', marginTop: 12 }}>
                This certificate was issued by Seven One Eight Active MMA and is authentic.
              </p>
            </div>

            {cert.photo ? (
              <div className="certd-split">
                <img className="certd-photo" src={cert.photo} alt={`${cert.name} — photo`} />
                {cert.image && <img className="certd-cert" src={cert.image} alt={`${cert.name} — 718 MMA certificate`} />}
              </div>
            ) : (
              cert.image && (
                <img src={cert.image} alt={`${cert.name} — 718 MMA certificate`}
                  style={{ width: '100%', objectFit: 'contain', background: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 6, padding: 12 }} />
              )
            )}

            <div style={{ textAlign: 'center', margin: '34px 0 60px' }}>
              <Link to="/certifications" className="btn btn-outline">View All Certifications →</Link>
            </div>
          </Reveal>
        </div>
      </section>

      <style>{`
        .certd-split{display:flex;gap:18px;align-items:stretch}
        .certd-photo{width:36%;object-fit:cover;background:var(--ink-2);border:1px solid var(--line);border-radius:6px;min-height:320px}
        .certd-cert{flex:1;min-width:0;object-fit:contain;background:var(--ink-2);border:1px solid var(--line);border-radius:6px;padding:12px}
        @media(max-width:720px){
          .certd-split{flex-direction:column}
          .certd-photo{width:100%;max-height:340px}
        }
      `}</style>
    </Page>
  );
}
