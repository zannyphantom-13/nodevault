import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notifications';
import './Register.css';
import './Confirm.css';

const SUPPORTED_IDS = [
  { id: 'nin',             label: 'National Identity Number (NIN)',  placeholder: '12345678901',   hint: '11-digit NIN issued by NIMC' },
  { id: 'bvn',             label: 'Bank Verification Number (BVN)',  placeholder: '12345678901',   hint: '11-digit BVN linked to your bank account' },
  { id: 'drivers_license', label: "Driver's License (FRSC)",        placeholder: 'ABC123456789',  hint: 'License number on your physical card' },
];

export default function Confirm() {
  const { login, dbAuth } = useApp();
  const navigate = useNavigate();

  // Pull email from query param or sessionStorage
  const params = new URLSearchParams(window.location.search);
  const emailFromQuery = params.get('email') || sessionStorage.getItem('nodevault_pending_email') || '';

  const [pendingEmail, setPendingEmail] = useState(emailFromQuery);
  const [manualEmailInput, setManualEmailInput] = useState('');
  const [pendingData, setPendingData]   = useState(null);
  const [loadError, setLoadError]       = useState('');

  const [idType, setIdType]       = useState('nin');
  const [idNumber, setIdNumber]   = useState('');
  const [idError, setIdError]     = useState('');
  const [checking, setChecking]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load pending registration data
  useEffect(() => {
    if (!pendingEmail) {
      setLoadError('Please enter your registration email to locate your pending account confirmation.');
      return;
    }
    const data = dbAuth.getUnconfirmedByEmail(pendingEmail);
    if (!data) {
      setLoadError(`No pending registration found for ${pendingEmail}. Please verify your email or register again.`);
    } else {
      setLoadError('');
      setPendingData(data);
    }
  }, [pendingEmail, dbAuth]);

  const handleManualEmailLookup = (e) => {
    e.preventDefault();
    if (!manualEmailInput.trim()) return;
    setPendingEmail(manualEmailInput.trim());
  };

  // Real-time ID check as user types
  useEffect(() => {
    if (!idNumber.trim() || idNumber.length < 6) {
      setIdError('');
      return;
    }
    const timer = setTimeout(() => {
      const taken = dbAuth.checkIdExists(idNumber.trim(), idType);
      if (taken) {
        setIdError('This identity number is already registered to another account.');
      } else {
        setIdError('');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [idNumber, idType, dbAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idNumber.trim()) {
      setIdError('Please enter your identity document number.');
      return;
    }
    if (idNumber.trim().length < 6) {
      setIdError('Identity number is too short.');
      return;
    }
    if (idError) return; // block if already flagged duplicate

    setSubmitting(true);
    try {
      const confirmedUser = await dbAuth.confirmAccount({
        email: pendingEmail,
        idType,
        idNumber: idNumber.trim(),
      });

      // Trigger onboarding notifications
      notificationService.triggerNewUserOnboarding(confirmedUser);

      // Auto-login and go to dashboard
      login(confirmedUser);
      navigate('/dashboard');
    } catch (err) {
      setIdError(err.message || 'Confirmation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedIdType = SUPPORTED_IDS.find(d => d.id === idType);

  // ── Error / expired state ──────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="register-page">
        <div className="container" style={{ maxWidth: 480 }}>
          <div className="reg-card card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⏳</div>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>Find Pending Account</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {loadError}
            </p>

            <form onSubmit={handleManualEmailLookup} style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="email"
                  className="input"
                  placeholder="Enter your registered email"
                  value={manualEmailInput}
                  onChange={e => setManualEmailInput(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap', padding: '0 1.25rem' }}>
                  Find →
                </button>
              </div>
            </form>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
              <Link to="/register" style={{ color: '#00e5ff', fontSize: '0.85rem', fontWeight: 600 }}>
                ← Start New Registration
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────
  if (!pendingData) {
    return (
      <div className="register-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading your registration…</div>
      </div>
    );
  }

  // ── Main Confirmation Form ─────────────────────────────────────────────
  return (
    <div className="register-page">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="reg-card card">

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'rgba(0, 229, 255, 0.1)',
              border: '2px solid rgba(0, 229, 255, 0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.75rem', margin: '0 auto 1.25rem',
            }}>
              🪪
            </div>
            <h1 className="reg-card-title" style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>
              Confirm Your Account
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.87rem', lineHeight: 1.6 }}>
              Welcome, <strong style={{ color: '#fff' }}>{pendingData.name}</strong>.
              {' '}To activate your account, we need to capture your government-issued identity
              for compliance and anti-fraud validation.
            </p>
          </div>

          {/* Account detail strip */}
          <div className="confirm-account-strip">
            <div className="confirm-account-strip-row">
              <span className="confirm-strip-label">Account</span>
              <span className="confirm-strip-value">{pendingData.email}</span>
            </div>
            <div className="confirm-account-strip-row">
              <span className="confirm-strip-label">Status</span>
              <span className="confirm-strip-badge confirm-strip-badge--pending">⏳ Pending Confirmation</span>
            </div>
            <div className="confirm-account-strip-row">
              <span className="confirm-strip-label">KYC Status</span>
              <span className="confirm-strip-badge confirm-strip-badge--unset">Will be set to PENDING after this step</span>
            </div>
          </div>

          {/* Important notice */}
          <div className="confirm-notice">
            <div className="confirm-notice-icon">ℹ️</div>
            <div className="confirm-notice-text">
              <strong>Supported IDs:</strong> NIN, BVN, or Driver's License only.
              Completing this step does <em>not</em> verify your KYC — it sets your status
              to <strong>PENDING</strong>. You can complete full verification from your dashboard.
            </div>
          </div>

          {/* ID Form */}
          <form onSubmit={handleSubmit} style={{ marginTop: '1.75rem' }}>

            {/* ID Type selector */}
            <div className="reg-field">
              <label>Identity Document Type</label>
              <div className="confirm-id-type-grid">
                {SUPPORTED_IDS.map(doc => (
                  <button
                    key={doc.id}
                    type="button"
                    className={`confirm-id-type-btn ${idType === doc.id ? 'active' : ''}`}
                    onClick={() => { setIdType(doc.id); setIdNumber(''); setIdError(''); }}
                  >
                    <span className="confirm-id-type-name">{doc.id.toUpperCase().replace('_', ' ')}</span>
                    <span className="confirm-id-type-desc">{doc.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ID Number input */}
            <div className="reg-field" style={{ marginTop: '1.25rem' }}>
              <label htmlFor="conf-id-num">
                {selectedIdType?.label} Number
              </label>
              <input
                id="conf-id-num"
                type="text"
                className={`input ${idError ? 'input-error' : idNumber.length >= 6 && !idError ? 'input-valid' : ''}`}
                placeholder={selectedIdType?.placeholder || 'Enter ID number'}
                value={idNumber}
                onChange={e => setIdNumber(e.target.value.trim())}
                autoComplete="off"
                required
              />
              {/* Hint */}
              {!idError && (
                <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.3rem' }}>
                  💡 {selectedIdType?.hint}
                </div>
              )}
              {/* Real-time duplicate error */}
              {idError && (
                <div className="confirm-id-error">
                  <span>⚠️</span>
                  <span>{idError}</span>
                </div>
              )}
              {/* Valid tick */}
              {idNumber.length >= 6 && !idError && (
                <div style={{ fontSize: '0.76rem', color: '#00ff94', marginTop: '0.3rem' }}>
                  ✓ ID number is available
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-full"
              style={{ marginTop: '1.75rem', padding: '0.9rem' }}
              disabled={submitting || !!idError || idNumber.length < 6}
            >
              {submitting ? 'Confirming Account…' : 'Confirm Account & Go to Dashboard →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.78rem', color: '#64748b' }}>
              🔒 This information is encrypted and stored securely. It will not be shared without your consent.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

