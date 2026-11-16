import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Login.css';

export default function Login() {
  const { login, dbAuth } = useApp();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [remember, setRemember]     = useState(true);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // When we detect UNCONFIRMED, store the email to show the redirect UI
  const [unconfirmedEmail, setUnconfirmedEmail] = useState(null);

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await dbAuth.signInWithGoogle();
      const current = dbAuth.getCurrentUser();
      if (current) {
        login(current);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Google Sign-In could not be initialized.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your email or phone number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setUnconfirmedEmail(null);
    setLoading(true);

    try {
      const user = await dbAuth.login(identifier, password);
      login(user);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || '';
      if (msg.startsWith('ACCOUNT_UNCONFIRMED:')) {
        const email = msg.replace('ACCOUNT_UNCONFIRMED:', '').trim();
        setUnconfirmedEmail(email);
      } else {
        setError(msg || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoUser) => {
    setError('');
    setLoading(true);
    try {
      const user = await dbAuth.login(demoUser.email, demoUser.password || 'password123');
      login(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = dbAuth.getDemoUsers();

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <img src="/logo.svg" alt="NodeVault" width="36" height="36" />
            <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Node<span className="gradient-text">Vault</span>
            </span>
          </div>
          <h1 className="login-title">Sign In to Your Node</h1>
          <p className="login-subtitle">Access your validator telemetry, yield ledger, and payouts.</p>
        </div>

        {/* UNCONFIRMED ACCOUNT INTERCEPT */}
        {unconfirmedEmail && (
          <div style={{
            background: 'rgba(250, 204, 21, 0.08)',
            border: '1px solid rgba(250, 204, 21, 0.4)',
            borderRadius: '12px',
            padding: '1.1rem 1.25rem',
            marginBottom: '1.25rem',
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#facc15', marginBottom: '0.5rem' }}>
              â³ Account Registration Incomplete
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 0.9rem' }}>
              The account for <strong style={{ color: '#e2e8f0' }}>{unconfirmedEmail}</strong> has not been fully confirmed yet.
              You need to complete the identity capture step to activate your account.
            </p>
            <button
              className="btn btn-primary btn-full"
              onClick={() => navigate(`/confirm?email=${encodeURIComponent(unconfirmedEmail)}`)}
            >
              Continue to Account Confirmation â†’
            </button>
            <button
              type="button"
              onClick={() => setUnconfirmedEmail(null)}
              style={{ display: 'block', width: '100%', marginTop: '0.5rem', background: 'none', border: 'none', color: '#64748b', fontSize: '0.78rem', cursor: 'pointer', textAlign: 'center' }}
            >
              Use a different account
            </button>
          </div>
        )}

        {error && !unconfirmedEmail && (
          <div className="login-error-banner" style={{ marginBottom: '1.25rem' }}>
            <span>âš ï¸</span>
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth 1-Click Button */}
        <button
          type="button"
          className="btn-google-auth"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          <svg width="20" height="20" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        <div className="login-divider" style={{ margin: '1.25rem 0' }}>
          or sign in with email
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-email">Email or Phone Number</label>
            <div className="login-input-wrap">
              <input
                id="login-email"
                type="text"
                className="login-input"
                placeholder="e.g. c.obi@nodevault.io or +234 816..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-pwd">Password</label>
            <div className="login-input-wrap">
              <input
                id="login-pwd"
                type={showPwd ? 'text' : 'password'}
                className="login-input"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-pwd-toggle"
                onClick={() => setShowPwd(!showPwd)}
                aria-label="Toggle password visibility"
              >
                {showPwd ? 'ðŸ‘ï¸' : 'ðŸ‘ï¸â€ðŸ—¨ï¸'}
              </button>
            </div>
          </div>

          <div className="login-row-between">
            <label className="login-checkbox-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <a
              href="#forgot"
              className="login-forgot-link"
              onClick={(e) => {
                e.preventDefault();
                alert('Password reset link has been dispatched to your registered email address.');
              }}
            >
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Node'}
          </button>
        </form>

        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === 'true' && (
          <>
            <div className="login-divider">or quick 1-click login (Demo Mode)</div>
            <div className="demo-login-grid">
              {demoUsers.slice(0, 3).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="demo-login-btn"
                  onClick={() => handleQuickLogin(u)}
                  title={`Login as ${u.name}`}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <strong style={{ color: '#fff' }}>{u.name}</strong>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                      {u.email} â€¢ {u.tierName || 'Node'}
                    </div>
                  </div>
                  <span style={{ color: '#00e5ff', fontSize: '0.78rem', fontWeight: 600 }}>Login â†’</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="login-footer">
          Don't have an account?{' '}
          <Link to="/register">Create Node Account</Link>
        </div>
      </div>
    </div>
  );
}
