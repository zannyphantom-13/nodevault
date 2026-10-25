import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notifications';
import './KYC.css';

const DOC_TYPES = [
  { id: 'nin',             label: 'National Identity Number (NIN Slip)', region: 'NG' },
  { id: 'bvn',             label: 'Bank Verification Number (BVN)',      region: 'NG' },
  { id: 'drivers_license', label: "Driver's License (FRSC)",             region: 'ALL' },
  { id: 'passport',        label: 'International Passport',              region: 'ALL' },
  { id: 'voter_card',      label: 'Permanent Voter Card (INEC PVC)',     region: 'NG' },
  { id: 'ssn',             label: 'State ID / SSN Card',                 region: 'US' },
];

export default function KYC() {
  const { user, updateUserProfile, dbKYC } = useApp();
  const navigate = useNavigate();

  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [_record, setRecord]      = useState(null);

  // Form State
  const [formData, setFormData]   = useState({
    idType: 'nin',
    idNumber: '',
    dob: '1995-06-15',
    address: 'Plot 12, Victoria Island',
    state: 'Lagos',
    country: 'Nigeria',
    idFrontUrl: null,
    idBackUrl: null,
    selfieUrl: null,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user?.id) {
      dbKYC.getRecord(user.id).then(rec => {
        if (rec) {
          setRecord(rec);
          setFormData(prev => ({
            ...prev,
            idType: rec.idType || 'nin',
            idNumber: rec.idNumber || '',
            dob: rec.dob || '1995-06-15',
            address: rec.address || '',
            state: rec.state || '',
            idFrontUrl: rec.idFrontUrl || null,
            idBackUrl: rec.idBackUrl || null,
            selfieUrl: rec.selfieUrl || null,
          }));
        }
      });
    }
  }, [user, dbKYC]);

  const kycStatus = user?.kycStatus || 'unverified';

  // Handle file uploads (converts to base64 Data URL so it persists cleanly)
  const handleFileUpload = (field, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload a compressed image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, [field]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleUseSampleImage = (field) => {
    const samples = {
      idFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      idBackUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    };
    setFormData(prev => ({ ...prev, [field]: samples[field] }));
  };

  const validateStep1 = () => {
    const err = {};
    if (!formData.idNumber.trim()) err.idNumber = 'Document/ID number is required';
    if (!formData.dob) err.dob = 'Date of birth is required';
    if (!formData.address.trim()) err.address = 'Residential address is required';
    if (!formData.state.trim()) err.state = 'State / Province is required';
    return err;
  };

  const handleNextStep1 = () => {
    const err = validateStep1();
    if (Object.keys(err).length) { setErrors(err); return; }
    setErrors({});
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!formData.idFrontUrl) {
      alert('Please upload the front photo of your identity document.');
      return;
    }
    if (!formData.selfieUrl) {
      alert('Please upload a clear selfie photo for facial biometrics.');
      return;
    }

    setLoading(true);
    try {
      const saved = await dbKYC.submit(user.id, formData);
      await dbKYC.simulateApproval(user.id, 'verified');
      updateUserProfile({ kycStatus: 'verified' });

      // Send in-app notification
      try {
        notificationService.pushNotification(user.id, {
          title: '🎉 KYC Verification Approved!',
          message: 'Your identity has been verified. You are now approved to stake on Genesis Nodes and initiate withdrawals.',
          type: 'kyc',
          actionUrl: '/tiers',
        });
      } catch (e) {
        console.warn('Notification error:', e);
      }

      setRecord({ ...saved, status: 'verified', reviewedAt: new Date().toISOString() });
      setStep(3);
    } catch (err) {
      alert('Submission failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateApproval = async () => {
    setLoading(true);
    await dbKYC.simulateApproval(user.id, 'verified');
    updateUserProfile({ kycStatus: 'verified' });
    setRecord(prev => ({ ...prev, status: 'verified', reviewedAt: new Date().toISOString() }));
    setLoading(false);
  };

  const handleSimulateReset = async () => {
    setLoading(true);
    await dbKYC.simulateApproval(user.id, 'unverified');
    updateUserProfile({ kycStatus: 'unverified' });
    setRecord(null);
    setStep(1);
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="kyc-page" style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <h2>Authentication Required</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Please sign in to access your KYC verification profile.</p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>Sign In</Link>
      </div>
    );
  }

  return (
    <div className="kyc-page">
      <div className="kyc-container">
        {/* Verification Status Header */}
        <div className={`kyc-status-card ${kycStatus}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>
              {kycStatus === 'verified' ? '🛡️' : kycStatus === 'pending' ? '⏳' : '⚠️'}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                {kycStatus === 'verified'
                  ? 'Identity Fully Verified'
                  : kycStatus === 'pending'
                  ? 'Verification Under Review'
                  : 'Identity Verification Required'}
              </h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {kycStatus === 'verified'
                  ? 'Your account has Tier-2 clearance. Full yield payouts and refunds enabled.'
                  : kycStatus === 'pending'
                  ? 'Your identity documents are undergoing automated cryptographic audit.'
                  : 'Required by anti-money laundering (AML) and CBN statutory regulations.'}
              </p>
            </div>
          </div>

          <div
            className="kyc-status-pill"
            style={{
              background:
                kycStatus === 'verified' ? 'rgba(0, 255, 148, 0.15)' :
                kycStatus === 'pending'  ? 'rgba(250, 204, 21, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color:
                kycStatus === 'verified' ? '#00FF94' :
                kycStatus === 'pending'  ? '#FACC15' : '#EF4444',
            }}
          >
            {kycStatus.toUpperCase()}
          </div>
        </div>

        {/* Multi-step card */}
        <div className="kyc-card">
          <div className="kyc-stepper">
            <div className={`kyc-step-item ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
              <div className="kyc-step-num">{step > 1 ? '✓' : '1'}</div>
              <span className="kyc-step-title">ID Information</span>
            </div>
            <div className={`kyc-step-item ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
              <div className="kyc-step-num">{step > 2 ? '✓' : '2'}</div>
              <span className="kyc-step-title">Document Upload</span>
            </div>
            <div className={`kyc-step-item ${step === 3 ? 'active' : ''}`}>
              <div className="kyc-step-num">3</div>
              <span className="kyc-step-title">Status & Audit</span>
            </div>
          </div>

          {/* ══ STEP 1: IDENTITY INFO ══ */}
          {step === 1 && (
            <div>
              <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>Personal & Identity Details</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                    Identity Document Type
                  </label>
                  <select
                    className="input"
                    value={formData.idType}
                    onChange={(e) => setFormData(prev => ({ ...prev, idType: e.target.value }))}
                  >
                    {DOC_TYPES.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                    Document / Identity Number (NIN / BVN / Passport No.)
                  </label>
                  <input
                    type="text"
                    className={`input ${errors.idNumber ? 'input-error' : ''}`}
                    placeholder="e.g. 11928374821"
                    value={formData.idNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value }))}
                  />
                  {errors.idNumber && <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.idNumber}</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={formData.dob}
                      onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                      State / Region of Residence
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Lagos, Abuja, Rivers"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                    Full Residential Address
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Street address, city, postal code"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: '1rem', width: '100%', padding: '0.85rem' }}
                  onClick={handleNextStep1}
                >
                  Continue to Document Upload →
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 2: DOCUMENT UPLOADS ══ */}
          {step === 2 && (
            <div>
              <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>Upload Official Verification Documents</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* ID Front */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Front of ID Card / Document <span style={{ color: '#00e5ff' }}>*</span>
                  </label>
                  <label className="kyc-upload-dropzone">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload('idFrontUrl', e)}
                    />
                    {formData.idFrontUrl ? (
                      <img src={formData.idFrontUrl} alt="ID Front Preview" className="kyc-preview-img" />
                    ) : (
                      <div style={{ padding: '1rem 0' }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>📄</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Click to Upload Front Photo</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PNG, JPG or PDF up to 5MB</div>
                      </div>
                    )}
                  </label>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#00e5ff', fontSize: '0.75rem', marginTop: '0.4rem', cursor: 'pointer' }}
                    onClick={() => handleUseSampleImage('idFrontUrl')}
                  >
                    + Use Demo ID Document
                  </button>
                </div>

                {/* Selfie */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Live Facial Photo (Selfie) <span style={{ color: '#00e5ff' }}>*</span>
                  </label>
                  <label className="kyc-upload-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload('selfieUrl', e)}
                    />
                    {formData.selfieUrl ? (
                      <img src={formData.selfieUrl} alt="Selfie Preview" className="kyc-preview-img" />
                    ) : (
                      <div style={{ padding: '1rem 0' }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>📸</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Click to Upload Selfie</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Clear facial photo, well-lit</div>
                      </div>
                    )}
                  </label>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#00e5ff', fontSize: '0.75rem', marginTop: '0.4rem', cursor: 'pointer' }}
                    onClick={() => handleUseSampleImage('selfieUrl')}
                  >
                    + Use Demo Selfie
                  </button>
                </div>
              </div>

              {/* Optional Back */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Back of ID Card <span style={{ color: '#64748b' }}>(Optional for National IDs / Driver's Licenses)</span>
                </label>
                <label className="kyc-upload-dropzone" style={{ padding: '1rem' }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload('idBackUrl', e)}
                  />
                  {formData.idBackUrl ? (
                    <img src={formData.idBackUrl} alt="ID Back Preview" className="kyc-preview-img" />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                      <span>🪪</span>
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Upload back of card if applicable</span>
                    </div>
                  )}
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '30%' }}
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '70%', padding: '0.85rem' }}
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {loading ? 'Submitting to Database...' : 'Submit Verification for Audit →'}
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 3: AUDIT & CONFIRMATION ══ */}
          {(step === 3 || kycStatus === 'pending' || kycStatus === 'verified') && (
            <div>
              <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>Verification Pipeline Status</h3>

              <div className="kyc-timeline">
                <div className="kyc-timeline-step">
                  <div className="kyc-timeline-icon" style={{ background: '#00ff9420', color: '#00ff94' }}>✓</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Identity Details Submitted</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Document type: {formData.idType?.toUpperCase()} · No: {formData.idNumber || 'Recorded'}
                    </div>
                  </div>
                </div>

                <div className="kyc-timeline-step">
                  <div className="kyc-timeline-icon" style={{ background: '#00ff9420', color: '#00ff94' }}>✓</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Cryptographic Hash & Document Upload</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Front ID and Biometric Selfie registered in database store.</div>
                  </div>
                </div>

                <div className="kyc-timeline-step">
                  <div
                    className="kyc-timeline-icon"
                    style={{
                      background: kycStatus === 'verified' ? '#00ff9420' : '#facc1520',
                      color: kycStatus === 'verified' ? '#00ff94' : '#facc15',
                    }}
                  >
                    {kycStatus === 'verified' ? '✓' : '⚙️'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                      {kycStatus === 'verified' ? 'NIMC / Regulatory Cross-Verification Passed' : 'Government Registry Match in Progress'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {kycStatus === 'verified'
                        ? 'Full identity match confirmed against regulatory registry.'
                        : 'Simulating instant API audit against national identity gateway.'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/tiers')}
                >
                  Proceed to Stake on Node →
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStep(1)}
                >
                  Edit Information
                </button>
              </div>
            </div>
          )}

          {/* ══ DEMO SANDBOX TOOLBAR ══ */}
          <div className="kyc-demo-box">
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#00e5ff' }}>
                🛠️ Sandbox Simulator Tool
              </div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                Test immediate compliance approval or reset state for testing.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSimulateReset}
              >
                Reset to Unverified
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSimulateApproval}
              >
                ⚡ Instant Approve (Verified)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
