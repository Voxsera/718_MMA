import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import Reveal from '../components/Reveal.jsx';

export default function About() {
  return (
    <PageHead crumb="About" title='Seven One Eight <span class="text-red">Active MMA</span>'
      sub="Hyderabad's home for MMA, Muay Thai, Boxing, BJJ and more — built for fighters, open to everyone.">
      <section style={{ paddingTop: 40 }}>
        <div className="container split">
          <Reveal><img src="https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=900&q=70&auto=format&fit=crop" alt="718 MMA" style={{ height: 440, objectFit: 'cover', width: '100%', borderRadius: 6 }} /></Reveal>
          <Reveal delay={0.1}>
            <div className="section-label">Our Story</div>
            <h2 className="section-title">Built On <span className="text-red">Grit</span></h2>
            <p className="section-intro">718 MMA was founded to give Hyderabad a serious home for combat sports — professional coaching, real equipment and a community that pushes you forward.</p>
            <p style={{ color: 'var(--grey-light)', marginTop: 14 }}>We run 4 sessions every day, from 6 AM to midnight, so training fits around your life. Whether you're chasing a fight career, getting in shape, or just trying something new, you belong on our mats.</p>
            <p style={{ color: 'var(--grey-light)', marginTop: 14 }}>All members can use the facility and equipment to train at all times.</p>
          </Reveal>
        </div>
      </section>

      <section style={{ background: 'var(--ink)' }}>
        <div className="container">
          <Reveal className="section-head"><div className="section-label">Timings</div>
            <h2 className="section-title">4 Sessions <span className="text-red">Everyday</span></h2>
            <p className="section-intro">Open 6 AM – 12 AM. Four coached sessions daily, plus open facility access for members.</p></Reveal>
          <Reveal className="timings" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            <div className="timing"><span>Morning 1</span><b>6:30 – 8:00 AM</b></div>
            <div className="timing"><span>Morning 2</span><b>8:00 – 9:30 AM</b></div>
            <div className="timing"><span>Evening 1</span><b>6:30 – 8:00 PM</b></div>
            <div className="timing"><span>Evening 2</span><b>8:00 – 9:30 PM</b></div>
          </Reveal>
        </div>
      </section>

      <section>
        <div className="container split">
          <Reveal>
            <div className="section-label">Find Us</div>
            <h2 className="section-title">Visit The <span className="text-red">Gym</span></h2>
            <p className="section-intro">718 MMA, Opposite National Police Academy, Raghavendra Nagar, Shivarampally Jagir, Telangana 500052.</p>
            <p style={{ color: 'var(--red)', fontFamily: 'var(--cond)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 14 }}>Open · Closes 12 AM</p>
            <p style={{ color: 'var(--grey-light)', marginTop: 10 }}>📞 +91 91337 18718 · ✉️ 718mmahyd@gmail.com</p>
            <div style={{ display: 'flex', gap: 14, marginTop: 22, flexWrap: 'wrap' }}>
              <a className="btn btn-primary" target="_blank" rel="noreferrer" href="https://www.google.com/maps/search/?api=1&query=Seven+One+Eight+Active+MMA+Shivarampally+Jagir">Open In Maps →</a>
              <a className="btn btn-outline" href="https://www.instagram.com/718mma/" target="_blank" rel="noreferrer">@718mma</a>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <iframe title="718 MMA location" width="100%" height="380" style={{ border: '1px solid var(--line)', borderRadius: 6 }}
              loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=Seven+One+Eight+Active+MMA+Shivarampally+Jagir+Telangana+500052&output=embed" />
          </Reveal>
        </div>
      </section>
    </PageHead>
  );
}
