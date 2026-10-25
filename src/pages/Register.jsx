import React, { useState } from 'react';
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

  // Post-registration onboarding state
  const [createdUser, setCreatedUser] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const isNG = region?.code === 'NG';

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

  const handleRegister = async (e) => {
    e.preventDefault();
    const valErrors = validate();
    if (Object.keys(valErrors).length) { setErrors(valErrors); return; }
    setErrors({});
    setSubmitting(true);

    try {
      const newUser = await dbAuth.register({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone,
        region: region?.code || 'NG',
        referralCode: form.referral,
        tier: null, // Node staking happens after Bank & KYC are verified
      });

      // Dispatch welcome notifications & welcome email
      notificationService.triggerNewUserOnboarding(newUser);

      login(newUser);
      setCreatedUser(newUser);
      setSubmitting(false);
    } catch (err) {
      alert(err.message || 'Registration failed. Please check your credentials.');
      setSubmitting(false);
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
  // ACCOUNT REGISTRATION FORM
  // ══════════════════════════════════════════════════════
  return (
    <div className="register-page">
      <div className="container" style={{ maxWidth: 540 }}>
        <div className="reg-card card">
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
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
                I agree to the <strong style={{ color: '#fff' }}>NodeVault Protocol Terms</strong>. I understand that submitting a payout bank account and completing KYC identity verification are mandatory before staking on nodes or withdrawing funds.
              </span>
            </label>
            {errors.agreed && <span className="reg-error" style={{ marginTop: '-0.5rem' }}>{errors.agreed}</span>}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              style={{ marginTop: '1rem', padding: '0.85rem' }}
              disabled={submitting}
            >
              {submitting ? 'Creating Node Account…' : 'Create Account & Begin Onboarding →'}
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
