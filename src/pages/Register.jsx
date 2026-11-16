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

  // Real-time email & phone status
  const [emailStatus, setEmailStatus] = useState(null); // null | 'checking' | 'confirmed' | 'unconfirmed' | 'available'
  const [phoneStatus, setPhoneStatus] = useState(null); // null | 'taken' | 'available'
  const [redirectTimer, setRedirectTimer] = useState(null);

  // Email Ownership Verification State
  const [pendingVerification, setPendingVerification] = useState(null);
  const [otpCode, setOtpCode]       = useState('');
  const [otpError, setOtpError]     = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const isNG = region?.code === 'NG';
  const isGmail = form.email.toLowerCase().includes('@gmail.com') || form.email.toLowerCase().includes('@googlemail.com');

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Real-time email status check
  useEffect(() => {
    const email = form.email.trim();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailStatus(null);
      if (redirectTimer) { clearTimeout(redirectTimer); setRedirectTimer(null); }
      return;
    }
    setEmailStatus('checking');
    const timer = setTimeout(() => {
      const status = dbAuth.checkEmailStatus(email);
      setEmailStatus(status);
      if (status === 'unconfirmed') {
        // Auto-redirect to confirmation page after 2.5 seconds
        const redirectT = setTimeout(() => {
          navigate(`/confirm?email=${encodeURIComponent(email)}`);
        }, 2500);
        setRedirectTimer(redirectT);
      }
    }, 600);
    return () => {
      clearTimeout(timer);
      if (redirectTimer) { clearTimeout(redirectTimer); setRedirectTimer(null); }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.email]);

  // Real-time phone uniqueness check
  useEffect(() => {
    const phone = form.phone.trim();
    if (!phone) { setPhoneStatus(null); return; }
    const timer = setTimeout(() => {
      const taken = dbAuth.checkPhoneExists(phone);
      setPhoneStatus(taken ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(timer);
  }, [form.phone, dbAuth]);

  // Clear redirect timer on unmount
  useEffect(() => () => { if (redirectTimer) clearTimeout(redirectTimer); }, [redirectTimer]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Full legal name is required';
    if (!form.email.trim()) e.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address';
    else if (emailStatus === 'confirmed') e.email = 'This email already exists within our system.';
    else if (emailStatus === 'unconfirmed') e.email = 'This email is currently within the registration process.';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (phoneStatus === 'taken') e.phone = 'This phone number has already been used.';
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
        tier: null,
      });

      sessionStorage.setItem('nodevault_pending_email', form.email.trim());

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

      // If auto-confirmed, go straight to confirm page for ID capture
      navigate(`/confirm?email=${encodeURIComponent(form.email)}`);
      setSubmitting(false);
    } catch (err) {
      const msg = err.message || '';
      if (msg === 'EMAIL_CONFIRMED') {
        setErrors({ email: 'This email already exists within our system.' });
      } else if (msg === 'EMAIL_UNCONFIRMED') {
        setErrors({ email: 'This email is currently within the registration process.' });
        setEmailStatus('unconfirmed');
      } else if (msg === 'PHONE_TAKEN') {
        setErrors({ phone: 'This phone number has already been used.' });
      } else {
        setErrors({ email: msg });
      }
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
      // Verify OTP â€” this confirms email ownership; now we go to ID capture
      await dbAuth.verifyEmailOtp({
        email: pendingVerification.email,
        token: otpCode.trim(),
      });
      // After email is verified, go to /confirm for ID capture step
      navigate(`/confirm?email=${encodeURIComponent(pendingVerification.email)}`);
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

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // STEP 2: EMAIL OWNERSHIP VERIFICATION SCREEN
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  if (pendingVerification) {
    return (
      <div className="register-page">
        <div className="container" style={{ maxWidth: 500 }}>
          <div className="reg-card card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ width: 56, height: 56, margin: '0 auto 1.25rem', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
              ðŸ›¡ï¸
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
              <div style={{ background: 'rgba(250, 204, 21, 0.08)', border: '1px solid rgba(250, 204, 21, 0.3)', borderRadius: '10px', padding: '0.75rem', marginBottom: '1.5rem', fontSize: '0.82rem', color: '#facc15' }}>
                âš¡ <strong>Local Sandbox Mode:</strong> Your verification code is <code style={{ fontSize: '1rem', fontWeight: 800, background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: '4px' }}>{pendingVerification.demoCode}</code> (or enter <code style={{ background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '4px' }}>123456</code>).
              </div>
            )}

            {otpError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#ef4444' }}>
                âš ï¸ {otpError}
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
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="input"
                  style={{ fontSize: '1.8rem', textAlign: 'center', letterSpacing: '0.4em', fontWeight: 700, padding: '0.75rem 1rem', fontFamily: 'monospace' }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ padding: '0.85rem' }}
                disabled={verifyingOtp || otpCode.length < 6}
              >
                {verifyingOtp ? 'Verifying Ownershipâ€¦' : 'Verify & Continue to Identity Capture â†’'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.82rem' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? '#64748b' : 'var(--accent-cyan)', cursor: resendCooldown > 0 ? 'default' : 'pointer', fontWeight: 600 }}
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

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // STEP 1: ACCOUNT REGISTRATION FORM
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

          {/* Google OAuth */}
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
            ðŸ”’ Instant verified ownership & 1-click account access
          </div>

          <div className="login-divider" style={{ margin: '1rem 0 1.5rem' }}>
            or register with email
          </div>

          <form className="reg-form" onSubmit={handleRegister}>
            {/* Name */}
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

            {/* Email */}
            <div className="reg-field">
              <label htmlFor="reg-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-email"
                  type="email"
                  className={`input ${errors.email || emailStatus === 'confirmed' || emailStatus === 'unconfirmed' ? 'input-error' : emailStatus === 'available' ? 'input-valid' : ''}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
                {emailStatus === 'checking' && (
                  <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#64748b' }}>
                    Checkingâ€¦
                  </div>
                )}
              </div>

              {/* Email status feedback */}
              {emailStatus === 'confirmed' && (
                <div className="reg-error" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
                  â›” This email already exists within our system.
                  {' '}<Link to="/login" style={{ color: '#00e5ff', fontWeight: 600 }}>Sign In</Link>
                </div>
              )}
              {emailStatus === 'unconfirmed' && (
                <div style={{
                  background: 'rgba(250, 204, 21, 0.08)',
                  border: '1px solid rgba(250, 204, 21, 0.3)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.8rem',
                  marginTop: '0.4rem',
                  fontSize: '0.8rem',
                  color: '#facc15',
                }}>
                  â³ <strong>This email is currently within the registration process.</strong>
                  <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.76rem' }}>Redirecting to confirmation in 2â€“3 secondsâ€¦</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/confirm?email=${encodeURIComponent(form.email)}`)}
                      style={{ background: 'rgba(250, 204, 21, 0.2)', border: '1px solid rgba(250, 204, 21, 0.4)', borderRadius: '6px', color: '#facc15', fontSize: '0.76rem', fontWeight: 600, padding: '0.2rem 0.6rem', cursor: 'pointer' }}
                    >
                      Continue to Confirmation â†’
                    </button>
                  </div>
                </div>
              )}

              {/* Gmail tip */}
              {isGmail && emailStatus !== 'confirmed' && emailStatus !== 'unconfirmed' && (
                <div style={{ background: 'rgba(66, 133, 244, 0.08)', border: '1px solid rgba(66, 133, 244, 0.25)', borderRadius: '8px', padding: '0.5rem 0.75rem', marginTop: '0.4rem', fontSize: '0.78rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>ðŸ’¡</span>
                  <span>Using Gmail? Click <strong>Continue with Google</strong> above to skip manual code entry!</span>
                </div>
              )}

              {errors.email && emailStatus !== 'confirmed' && emailStatus !== 'unconfirmed' && (
                <span className="reg-error">{errors.email}</span>
              )}
            </div>

            {/* Phone */}
            <div className="reg-field">
              <label htmlFor="reg-phone">Phone Number</label>
              <input
                id="reg-phone"
                type="tel"
                className={`input ${errors.phone || phoneStatus === 'taken' ? 'input-error' : phoneStatus === 'available' && form.phone ? 'input-valid' : ''}`}
                placeholder={isNG ? '+234 800 000 0000' : '+1 (555) 000-0000'}
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                required
              />
              {phoneStatus === 'taken' && (
                <span className="reg-error">â›” This phone number has already been used.</span>
              )}
              {errors.phone && phoneStatus !== 'taken' && (
                <span className="reg-error">{errors.phone}</span>
              )}
            </div>

            {/* Passwords */}
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

            {/* Referral */}
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

            {/* Terms */}
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
              disabled={submitting || emailStatus === 'confirmed' || emailStatus === 'unconfirmed'}
            >
              {submitting ? 'Verifying Credentialsâ€¦' : 'Create Account & Verify Email â†’'}
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
