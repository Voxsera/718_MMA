import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <>
      <div className="strip">All members can use the facility and equipment to train at all times</div>
      <footer style={{ background: 'var(--ink)', borderTop: '1px solid var(--line)', padding: '60px 0 30px' }}>
        <div className="container">
          <div className="footGrid">
            <div>
              <span style={{ fontFamily: 'Anton', fontStyle: 'italic', fontSize: 34 }}>7<span style={{ color: 'var(--red)' }}>18</span></span>
              <small style={{ display: 'block', fontFamily: 'var(--cond)', letterSpacing: 4, fontSize: 11, color: 'var(--grey)' }}>MMA CLUB · EST. 2026</small>
              <p style={{ color: 'var(--grey)', marginTop: 16, maxWidth: 320, fontSize: 14 }}>
                Seven One Eight Active MMA. Hyderabad's home for MMA, Muay Thai, Boxing, BJJ and more — 4 sessions every day, 6 AM to 12 AM.
              </p>
              <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
                <a className="soc" href="https://www.instagram.com/718mma/" target="_blank" rel="noreferrer">◎</a>
                <a className="soc" href="mailto:718mmahyd@gmail.com">✉</a>
                <a className="soc" href="tel:9133718718">✆</a>
              </div>
            </div>
            <div>
              <h4>Train</h4>
              <Link to="/courses">Courses</Link>
              <Link to="/personal-training">Personal Training</Link>
              <Link to="/trial">Free Trial</Link>
              <Link to="/memberships">Memberships</Link>
              <Link to="/physio">Physio (Rehab)</Link>
            </div>
            <div>
              <h4>Explore</h4>
              <Link to="/events">Events</Link>
              <Link to="/food">Food</Link>
              <Link to="/collaboration">Collaboration</Link>
              <Link to="/merchandise">Merch</Link>
              <Link to="/login">Member Login</Link>
            </div>
            <div>
              <h4>Visit Us</h4>
              <p style={{ color: 'var(--grey)', fontSize: 14 }}>718 MMA, Opposite National Police Academy, Raghavendra Nagar, Shivarampally Jagir, Telangana 500052</p>
              <p style={{ color: 'var(--red)', fontSize: 14 }}>Open · Closes 12 AM</p>
              <a href="tel:9133718718">+91 91337 18718</a>
              <a href="/admin" style={{ color: 'var(--grey)' }}>Admin / CRM →</a>
            </div>
          </div>
          <div className="footBottom">
            <span>© 2026 Seven One Eight Active MMA. All rights reserved.</span>
            <span>Made with grit in Shivarampally, Hyderabad 🥊</span>
          </div>
        </div>
      </footer>
      <style>{`
        .footGrid{display:grid;grid-template-columns:2fr 1fr 1fr 1.5fr;gap:40px}
        footer h4{font-family:var(--cond);letter-spacing:2px;text-transform:uppercase;color:#fff;margin-bottom:16px;font-size:16px}
        footer a{color:var(--grey);font-size:14px;display:block;margin-bottom:8px}
        footer a:hover{color:var(--red)}
        .soc{width:38px;height:38px;border:1px solid var(--line);display:grid !important;place-items:center;border-radius:50%;color:#fff;margin-bottom:0 !important}
        .soc:hover{background:var(--red);border-color:var(--red)}
        .footBottom{border-top:1px solid var(--line);margin-top:40px;padding-top:20px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;color:var(--grey);font-size:13px}
        @media(max-width:980px){.footGrid{grid-template-columns:1fr 1fr}}
        @media(max-width:600px){.footGrid{grid-template-columns:1fr}}
      `}</style>
    </>
  );
}
