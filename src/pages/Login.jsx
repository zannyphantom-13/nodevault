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
    setLoading(true);

    try {
      const user = await dbAuth.login(identifier, password);
      login(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
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

        {error && (
          <div className="login-error-banner" style={{ marginBottom: '1.25rem' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

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
                placeholder="••••••••••••"
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
                {showPwd ? '👁️' : '👁️‍🗨️'}
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

        <div className="login-divider">or quick 1-click login</div>

        <div className="demo-login-grid">
          {(() => {
            const azeez = demoUsers.find(u => u.email === 'hazytarzan12@gmail.com');
            const otherUsers = demoUsers.filter(u => u.email !== 'hazytarzan12@gmail.com');
            const displayList = azeez ? [azeez, ...otherUsers.slice(0, 3)] : demoUsers.slice(0, 4);
            return displayList.map((u) => (
              <button
                key={u.id}
                type="button"
                className="demo-login-btn"
                onClick={() => handleQuickLogin(u)}
                title={`Login as ${u.name}`}
                style={u.email === 'hazytarzan12@gmail.com' ? { borderColor: 'rgba(0, 229, 255, 0.45)', background: 'rgba(0, 229, 255, 0.08)' } : {}}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <strong style={{ color: '#fff' }}>{u.name}</strong>
                    {u.email === 'hazytarzan12@gmail.com' && (
                      <span className="badge badge-cyan" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                        2 Genesis Nodes
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                    {u.email} • {u.tierName || 'Node'}
                  </div>
                </div>
                <span style={{ color: '#00e5ff', fontSize: '0.78rem', fontWeight: 600 }}>Login →</span>
              </button>
            ));
          })()}
        </div>

        <div className="login-footer">
          Don't have an account?{' '}
          <Link to="/register">Create Node Account</Link>
        </div>
      </div>
    </div>
  );
}
