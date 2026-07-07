import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <>
      <div className="strip">All members can use the facility and equipment to train at all times</div>
      <footer style={{ background: 'var(--ink)', borderTop: '1px solid var(--line)', padding: '60px 0 30px' }}>
        <div className="container">
          <div className="footGrid">
            <div>
              <img src="/718mma-logo.png" alt="718 MMA Club" className="footLogo"
                onError={(e) => { e.currentTarget.style.display = 'none'; const f = e.currentTarget.nextElementSibling; if (f) f.style.display = 'block'; }} />
              <div className="footLogoText" style={{ display: 'none' }}>
                <span style={{ fontFamily: 'Anton', fontStyle: 'italic', fontSize: 34 }}>7<span style={{ color: 'var(--red)' }}>18</span></span>
                <small style={{ display: 'block', fontFamily: 'var(--cond)', letterSpacing: 4, fontSize: 11, color: 'var(--grey)' }}>MMA CLUB · EST. 2026</small>
              </div>
              <p style={{ color: 'var(--grey)', marginTop: 16, maxWidth: 320, fontSize: 14 }}>
                Seven One Eight Active MMA. Hyderabad's home for MMA, Muay Thai, Boxing, BJJ and more — 4 sessions every day, 6 AM to 12 AM.
              </p>
              <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
                <a className="soc" href="https://www.instagram.com/718mma/" target="_blank" rel="noreferrer" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.13 1.38C1.35 2.68.94 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13.67.66 1.34 1.07 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.38.66-.67 1.07-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.31-.79-.72-1.46-1.38-2.13C21.32 1.35 20.65.94 19.86.63 19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0z" />
                    <path d="M12 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4z" />
                    <circle cx="18.41" cy="5.59" r="1.44" />
                  </svg>
                </a>
                <a className="soc" href="mailto:718mmahyd@gmail.com" aria-label="Email">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0-8 5L4 6h16zm0 12H4V8l8 5 8-5v10z" />
                  </svg>
                </a>
                <a className="soc" href="tel:9133718718" aria-label="Phone">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M6.62 10.79a15.53 15.53 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4>Train</h4>
              <Link to="/courses">Courses</Link>
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
            </div>
          </div>
          <div className="footBottom">
            <span>© 2026 Seven One Eight Active MMA. All rights reserved.</span>
            <span className="footLegal">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </span>
            <span>Built by <a href="https://voxsera.com" target="_blank" rel="noreferrer" className="footCredit">Voxsera AI Solutions</a></span>
          </div>
        </div>
      </footer>
      <style>{`
        .footLogo{height:120px;width:220px;object-fit:cover;object-position:50% 47%;display:block;margin-bottom:14px;border-radius:7px}
        .footGrid{display:grid;grid-template-columns:2fr 1fr 1fr 1.5fr;gap:40px}
        footer h4{font-family:var(--cond);letter-spacing:2px;text-transform:uppercase;color:#fff;margin-bottom:16px;font-size:16px}
        footer a{color:var(--grey);font-size:14px;display:block;margin-bottom:8px}
        footer a:hover{color:var(--red)}
        .soc{width:38px;height:38px;border:1px solid var(--line);display:grid !important;place-items:center;border-radius:50%;color:#fff;margin-bottom:0 !important}
        .soc,.soc:hover{color:#fff}
        .soc:hover{background:var(--red);border-color:var(--red)}
        .footBottom{border-top:1px solid var(--line);margin-top:40px;padding-top:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px 24px;color:var(--grey);font-size:13px}
        .footLegal{display:flex;gap:20px}
        .footLegal a{display:inline;margin-bottom:0;font-size:13px;color:var(--grey)}
        .footLegal a:hover{color:var(--red)}
        .footCredit{display:inline;margin-bottom:0;font-size:13px;color:var(--red);font-weight:600}
        .footCredit:hover{color:var(--red-bright)}
        @media(max-width:980px){.footGrid{grid-template-columns:1fr 1fr}}
        @media(max-width:600px){.footGrid{grid-template-columns:1fr}}
      `}</style>
    </>
  );
}
