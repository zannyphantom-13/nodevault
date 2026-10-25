import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notifications';
import WelcomeEmailModal from '../components/WelcomeEmailModal';
import './Register.css';

export default function Register() {
  const { region, login, dbAuth } = useApp();
  const navigate = useNavigate();

  const [form, setForm]             = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referral: ''
  });
  const [showPwd, setShowPwd]       = useState(false);
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Email Ownership Verification State
  const [pendingVerification, setPendingVerification] = useState(null);
  const [otpCode, setOtpCode]       = useState('');
  const [otpError, setOtpError]     = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Post-registration onboarding state
  const [createdUser, setCreatedUser] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const isNG = region?.code === 'NG';
  const isGmail = form.email.toLowerCase().includes('@gmail.com') || form.email.toLowerCase().includes('@googlemail.com');

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Full legal name is required';
    if (!form.email.trim()) e.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!agreed) e.agreed = 'You must accept the terms of service';
    return e;
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await dbAuth.signInWithGoogle();
      // If demo sandbox fallback returns instantly:
      const current = dbAuth.getCurrentUser();
      if (current) {
        login(current);
        navigate('/dashboard');
      }
    } catch (err) {
      alert(err.message || 'Google Sign-In could not be initialized.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const valErrors = validate();
    if (Object.keys(valErrors).length) { setErrors(valErrors); return; }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await dbAuth.register({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone,
        region: region?.code || 'NG',
        referralCode: form.referral,
        tier: null, // Node staking happens after Bank & KYC are verified
      });

      if (res.needsVerification) {
        setPendingVerification({
          email: form.email,
          demoCode: res.demoCode,
          provider: res.provider,
        });
        setResendCooldown(60);
        setSubmitting(false);
        return;
      }

      // If user was auto-confirmed
      notificationService.triggerNewUserOnboarding(res.user);
      login(res.user);
      setCreatedUser(res.user);
      setSubmitting(false);
    } catch (err) {
      alert(err.message || 'Registration failed. Please check your credentials.');
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setOtpError('Please enter the full 6-digit verification code.');
      return;
    }
    setOtpError('');
    setVerifyingOtp(true);

    try {
      const verifiedUser = await dbAuth.verifyEmailOtp({
        email: pendingVerification.email,
        token: otpCode.trim(),
      });
      notificationService.triggerNewUserOnboarding(verifiedUser);
      login(verifiedUser);
      setCreatedUser(verifiedUser);
    } catch (err) {
      setOtpError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await dbAuth.resendOtp(pendingVerification.email);
      if (res?.demoCode) {
        setPendingVerification(p => ({ ...p, demoCode: res.demoCode }));
      }
      setResendCooldown(60);
      alert('A new 6-digit verification code has been dispatched.');
    } catch (err) {
      alert(err.message || 'Could not resend verification code.');
    }
  };

  // ══════════════════════════════════════════════════════
  // ONBOARDING SUCCESS SCREEN (AFTER ACCOUNT CREATION)
  // ══════════════════════════════════════════════════════
  if (createdUser) {
    const emailData = {
      to: createdUser.email,
      from: 'compliance@nodevault.io',
      subject: 'Welcome to NodeVault Protocol — Validator Account Initialized',
      name: createdUser.name,
      referralCode: createdUser.referralCode,
      joinDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };

    return (
      <div className="register-page">
        <div className="container" style={{ maxWidth: 650 }}>
          <div className="reg-card card" style={{ textAlign: 'center', padding: '3rem 2.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
            <h1 className="reg-card-title" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
              Account Initialized Successfully!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.75rem' }}>
              Welcome, <strong style={{ color: '#fff' }}>{createdUser.name}</strong>. Your decentralized node operator credentials and referral code <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>{createdUser.referralCode}</strong> are active.
            </p>

            {/* Email notification alert banner */}
            <div
              style={{
                background: 'rgba(0, 229, 255, 0.08)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#00e5ff' }}>
                  ✉️ Welcome Email Dispatched
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Sent to {createdUser.email} with your onboarding credentials.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowEmailModal(true)}
              >
                Read Email
              </button>
            </div>

            {/* Mandatory Protocol Onboarding Sequence */}
            <div style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#fff' }}>
                Required Next Steps Before Staking:
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Step 1: Bank Account */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(250, 204, 21, 0.2)', color: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                      1
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Submit Payout Bank Account</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Required so the protocol knows where yield dividends and refunds are deposited.</div>
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/account')}
                  >
                    Link Bank →
                  </button>
                </div>

                {/* Step 2: KYC Verification */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0, 229, 255, 0.2)', color: '#00e5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                      2
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Complete Identity Verification (KYC)</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>NIN/BVN/Passport & selfie. Approved immediately upon submission.</div>
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/kyc')}
                  >
                    Start KYC →
                  </button>
                </div>

                {/* Step 3: Staking */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: 0.8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                      3
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Stake on Genesis Node</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Unlocks immediately once Bank and KYC steps are completed.</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>🔒 Locked</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={() => navigate('/account')}
              >
                Continue to Step 1: Link Bank Account →
              </button>
            </div>
          </div>
        </div>

        <WelcomeEmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          emailData={emailData}
        />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // STEP 2: EMAIL OWNERSHIP VERIFICATION SCREEN
  // ══════════════════════════════════════════════════════
  if (pendingVerification) {
    return (
      <div className="register-page">
        <div className="container" style={{ maxWidth: 500 }}>
          <div className="reg-card card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ width: 56, height: 56, margin: '0 auto 1.25rem', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
              🛡️
            </div>

            <h1 className="reg-card-title" style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>
              Verify Email Ownership
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              To ensure protocol security and prevent unauthorized usage of email accounts, a 6-digit verification code was dispatched to:
              <br />
              <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>{pendingVerification.email}</strong>
            </p>

            {pendingVerification.demoCode && (
              <div
                style={{
                  background: 'rgba(250, 204, 21, 0.08)',
                  border: '1px solid rgba(250, 204, 21, 0.3)',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.82rem',
                  color: '#facc15',
                }}
              >
                ⚡ <strong>Local Sandbox Mode:</strong> Your verification code is <code style={{ fontSize: '1rem', fontWeight: 800, background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: '4px' }}>{pendingVerification.demoCode}</code> (or enter <code style={{ background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '4px' }}>123456</code>).
              </div>
            )}

            {otpError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.82rem',
                  color: '#ef4444',
                }}
              >
                ⚠️ {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="••••••"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="input"
                  style={{
                    fontSize: '1.8rem',
                    textAlign: 'center',
                    letterSpacing: '0.4em',
                    fontWeight: 700,
                    padding: '0.75rem 1rem',
                    fontFamily: 'monospace',
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ padding: '0.85rem' }}
                disabled={verifyingOtp || otpCode.length < 6}
              >
                {verifyingOtp ? 'Verifying Ownership…' : 'Verify & Activate Account →'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.82rem' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 ? '#64748b' : 'var(--accent-cyan)',
                  cursor: resendCooldown > 0 ? 'default' : 'pointer',
                  fontWeight: 600,
                }}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>

              <button
                type="button"
                onClick={() => setPendingVerification(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                Edit Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // STEP 1: ACCOUNT REGISTRATION FORM
  // ══════════════════════════════════════════════════════
  return (
    <div className="register-page">
      <div className="container" style={{ maxWidth: 540 }}>
        <div className="reg-card card">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <img src="/logo.svg" alt="NodeVault" width="36" height="36" />
              <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                Node<span className="gradient-text">Vault</span>
              </span>
            </div>
            <h1 className="reg-card-title">Create Validator Account</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Create your account first before staking on Genesis Nodes.
            </p>
          </div>

          {/* Google OAuth 1-Click Verification Button */}
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
          <div style={{ textAlign: 'center', fontSize: '0.74rem', color: '#64748b', marginTop: '0.35rem', marginBottom: '1.25rem' }}>
            🔒 Instant verified ownership & 1-click account access
          </div>

          <div className="login-divider" style={{ margin: '1rem 0 1.5rem' }}>
            or register with email
          </div>

          <form className="reg-form" onSubmit={handleRegister}>
            <div className="reg-field">
              <label htmlFor="reg-name">Full Legal Name</label>
              <input
                id="reg-name"
                type="text"
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="e.g. Chukwuemeka Obi"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              {errors.name && <span className="reg-error">{errors.name}</span>}
            </div>

            <div className="reg-field">
              <label htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
              {errors.email && <span className="reg-error">{errors.email}</span>}

              {/* Gmail Ownership Protection Helper Banner */}
              {isGmail && (
                <div
                  style={{
                    background: 'rgba(66, 133, 244, 0.08)',
                    border: '1px solid rgba(66, 133, 244, 0.25)',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                    marginTop: '0.4rem',
                    fontSize: '0.78rem',
                    color: '#93c5fd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span>💡</span>
                  <span>
                    Using Gmail? You can click <strong>Continue with Google</strong> above to skip manual code entry!
                  </span>
                </div>
              )}
            </div>

            <div className="reg-field">
              <label htmlFor="reg-phone">Phone Number</label>
              <input
                id="reg-phone"
                type="tel"
                className={`input ${errors.phone ? 'input-error' : ''}`}
                placeholder={isNG ? '+234 800 000 0000' : '+1 (555) 000-0000'}
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                required
              />
              {errors.phone && <span className="reg-error">{errors.phone}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="reg-field">
                <label htmlFor="reg-pwd">Password</label>
                <input
                  id="reg-pwd"
                  type={showPwd ? 'text' : 'password'}
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                {errors.password && <span className="reg-error">{errors.password}</span>}
              </div>

              <div className="reg-field">
                <label htmlFor="reg-confirm-pwd">Confirm Password</label>
                <input
                  id="reg-confirm-pwd"
                  type={showPwd ? 'text' : 'password'}
                  className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  required
                />
                {errors.confirmPassword && <span className="reg-error">{errors.confirmPassword}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.25rem' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.78rem', cursor: 'pointer' }}
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? 'Hide passwords' : 'Show passwords'}
              </button>
            </div>

            <div className="reg-field">
              <label htmlFor="reg-referral">Referral Code <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
              <input
                id="reg-referral"
                type="text"
                className="input"
                placeholder="e.g. NV-OBI-7X2K"
                value={form.referral}
                onChange={e => setForm(f => ({ ...f, referral: e.target.value }))}
              />
            </div>

            {/* Terms acceptance checkbox */}
            <label className="reg-tax-disclaimer" style={{ marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                style={{ marginRight: '0.75rem', accentColor: 'var(--accent-green)', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                I agree to the <strong style={{ color: '#fff' }}>NodeVault Protocol Terms</strong>. I understand that email ownership verification is mandatory before staking on nodes or withdrawing funds.
              </span>
            </label>
            {errors.agreed && <span className="reg-error" style={{ marginTop: '-0.5rem' }}>{errors.agreed}</span>}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              style={{ marginTop: '1rem', padding: '0.85rem' }}
              disabled={submitting}
            >
              {submitting ? 'Verifying Credentials…' : 'Create Account & Verify Email →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Sign In</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
