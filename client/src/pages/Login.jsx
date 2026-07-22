import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import PageHead from '../components/PageHead.jsx';
import Reveal from '../components/Reveal.jsx';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { user, register, login, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dest = location.state?.from || '/dashboard';
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    const res = mode === 'register'
      ? await register(form.name, form.email, form.password)
      : await login(form.email, form.password);
    setBusy(false);
    if (res.ok) navigate(dest);
    else setErr(res.error);
  };

  const onGoogle = async (cred) => {
    setErr(null);
    const res = await loginWithGoogle(cred.credential);
    if (res.ok) navigate(dest);
    else setErr(res.error || 'Google sign-in failed.');
  };

  return (
    <PageHead crumb="Members"
      title={mode === 'register' ? 'Create <span class="text-red">Account</span>' : 'Member <span class="text-red">Login</span>'}
      sub="One account for the website and the 718 mobile app. Create it once, buy a membership, and train.">
      <section style={{ paddingTop: 30 }}>
        <div className="container" style={{ maxWidth: 460 }}>
          <Reveal className="form">
            {user ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#38d27a', fontFamily: 'var(--cond)', letterSpacing: 1 }}>✅ Signed in as {user.name || user.email}.</p>
                <Link to="/dashboard" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>Go To My Account →</Link>
              </div>
            ) : (
              <>
                <div className="tabs" style={{ marginBottom: 24 }}>
                  <div className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setErr(null); }}>Sign In</div>
                  <div className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setErr(null); }}>Create Account</div>
                </div>

                <form onSubmit={submit}>
                  {mode === 'register' && (<><label>Full Name</label><input value={form.name} onChange={set('name')} placeholder="Your name" /></>)}
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={set('email')} required placeholder="you@email.com" />
                  <label>Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} required placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'} style={{ paddingRight: 44, width: '100%' }} />
                    <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--grey)', display: 'flex', alignItems: 'center' }}>
                      {showPw ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} disabled={busy}>
                    {busy ? 'Please wait…' : mode === 'register' ? 'Create Account →' : 'Sign In →'}
                  </button>
                </form>

                {err && <p className="form-msg err">⚠️ {err}</p>}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 16px', color: 'var(--grey)' }}>
                  <span style={{ flex: 1, height: 1, background: 'var(--line)' }} /> OR <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <GoogleLogin onSuccess={onGoogle} onError={() => setErr('Google sign-in was cancelled or failed.')} theme="filled_black" shape="pill" text={mode === 'register' ? 'signup_with' : 'signin_with'} />
                </div>

                <p style={{ color: 'var(--grey)', fontSize: 13, marginTop: 22, textAlign: 'center' }}>
                  {mode === 'login'
                    ? <>New to 718? <span style={{ color: 'var(--red)', cursor: 'pointer' }} onClick={() => setMode('register')}>Create an account</span></>
                    : <>Already a member? <span style={{ color: 'var(--red)', cursor: 'pointer' }} onClick={() => setMode('login')}>Sign in</span></>}
                </p>
                <p style={{ color: 'var(--grey)', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                  No membership yet? Create an account, then <Link to="/memberships" style={{ color: 'var(--red)' }}>choose a plan</Link>.
                </p>
              </>
            )}
          </Reveal>
        </div>
      </section>
    </PageHead>
  );
}
