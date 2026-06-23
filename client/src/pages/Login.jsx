import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import PageHead from '../components/PageHead.jsx';
import Reveal from '../components/Reveal.jsx';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { user, loginWithGoogle } = useAuth();
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  const onSuccess = async (cred) => {
    setErr(null);
    const res = await loginWithGoogle(cred.credential);
    if (res.ok) navigate('/dashboard');
    else setErr(res.error || 'Login failed.');
  };

  return (
    <PageHead crumb="Members" title='Member <span class="text-red">Login</span>'
      sub="Sign in with Google to access your 718 member area. Login is available to members with an active membership.">
      <section style={{ paddingTop: 30 }}>
        <div className="container" style={{ maxWidth: 460 }}>
          <Reveal className="form" style={{ textAlign: 'center' }}>
            {user ? (
              <>
                <p style={{ color: '#38d27a', fontFamily: 'var(--cond)', letterSpacing: 1 }}>✅ You're signed in as {user.name || user.email}.</p>
                <Link to="/dashboard" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>Go To My Account →</Link>
              </>
            ) : (
              <>
                <p style={{ color: 'var(--grey-light)', marginBottom: 20 }}>Use the same Google account / email you used when purchasing your membership.</p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <GoogleLogin onSuccess={onSuccess} onError={() => setErr('Google sign-in was cancelled or failed.')} theme="filled_black" shape="pill" text="signin_with" />
                </div>
                {err && (
                  <div style={{ marginTop: 18 }}>
                    <p className="form-msg err">⚠️ {err}</p>
                    {/no active membership|no_membership/i.test(err) &&
                      <Link to="/memberships" className="btn btn-outline btn-block" style={{ marginTop: 12 }}>Buy A Membership →</Link>}
                  </div>
                )}
                <p style={{ color: 'var(--grey)', fontSize: 13, marginTop: 22 }}>No membership yet? <Link to="/memberships" style={{ color: 'var(--red)' }}>Join 718</Link> to unlock your account.</p>
              </>
            )}
          </Reveal>
        </div>
      </section>
    </PageHead>
  );
}
