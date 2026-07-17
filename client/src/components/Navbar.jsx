import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth.jsx';

const LINKS = [
  { to: '/courses', label: 'Courses' },
  { to: '/memberships', label: 'Memberships' },
  { to: '/events', label: 'Events' },
  { to: '/food', label: 'Food' },
  { to: '/collaboration', label: 'Collab' },
  { to: '/about', label: 'About' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const doLogout = async () => { await logout(); setOpen(false); navigate('/'); };

  return (
    <motion.nav
      initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 100,
        background: solid ? 'rgba(5,5,5,0.9)' : 'rgba(5,5,5,0.4)',
        backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--line)', transition: '0.3s',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        <Link to="/" className="navBrand" onClick={() => setOpen(false)}>
          <img src="/718mma-logo.png" alt="718 MMA Club" className="navBrandImg"
            onError={(e) => { e.currentTarget.style.display = 'none'; const f = e.currentTarget.nextElementSibling; if (f) f.style.display = 'flex'; }} />
          <span className="navBrandText" style={{ display: 'none', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'Anton', fontStyle: 'italic', fontSize: 30, letterSpacing: '-1px', lineHeight: 1 }}>7<span style={{ color: 'var(--red)' }}>18</span></span>
            <small style={{ fontFamily: 'var(--cond)', letterSpacing: 4, fontSize: 10, color: 'var(--grey)' }}>MMA CLUB</small>
          </span>
        </Link>

        <button className="navToggle" onClick={() => setOpen(!open)}
          style={{ display: 'none', background: 'none', border: 0, color: '#fff', fontSize: 26, cursor: 'pointer' }}>
          {open ? '✕' : '☰'}
        </button>

        <div className={`navLinks ${open ? 'open' : ''}`}>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
              className={({ isActive }) => 'navItem' + (isActive ? ' active' : '')}>{l.label}</NavLink>
          ))}
          {user ? (
            <>
              <NavLink to="/dashboard" onClick={() => setOpen(false)} className="navItem">My Account</NavLink>
              <button className="btn btn-outline" style={{ padding: '10px 22px' }} onClick={doLogout}>Logout</button>
            </>
          ) : (
            <NavLink to="/login" onClick={() => setOpen(false)} className="navItem" style={{ color: 'var(--red)' }}>Login</NavLink>
          )}
          <Link to="/trial" className="btn btn-primary" style={{ padding: '12px 26px' }} onClick={() => setOpen(false)}>Free Trial</Link>
        </div>
      </div>

      <style>{`
        .navBrand{display:flex;align-items:center}
        .navBrandImg{height:56px;width:108px;object-fit:cover;object-position:50% 47%;display:block;border-radius:5px}
        @media(max-width:880px){.navBrandImg{height:48px;width:92px}}
        .navLinks{display:flex;align-items:center;gap:24px}
        .navItem{font-family:var(--cond);font-weight:600;letter-spacing:1.5px;text-transform:uppercase;font-size:14px;color:var(--grey-light);transition:.2s;white-space:nowrap}
        .navItem:hover,.navItem.active{color:#fff}
        @media(max-width:880px){
          .navToggle{display:block !important}
          .navLinks{position:fixed;top:72px;right:0;width:270px;height:calc(100vh - 72px);background:var(--ink);flex-direction:column;align-items:flex-start;padding:26px;transform:translateX(110%);transition:.3s;gap:20px;border-left:1px solid var(--line);overflow-y:auto}
          .navLinks.open{transform:translateX(0)}
        }
      `}</style>
    </motion.nav>
  );
}
