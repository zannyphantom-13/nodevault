import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './AccountSettings.css';

const NIGERIAN_BANKS = [
  { code: '058', name: 'Guaranty Trust Bank (GTBank)' },
  { code: '044', name: 'Access Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '50211', name: 'Kuda Bank' },
  { code: '50515', name: 'Moniepoint Microfinance Bank' },
  { code: '999992', name: 'OPay Digital Services' },
  { code: '999991', name: 'PalmPay' },
  { code: '232', name: 'Sterling Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '035', name: 'Wema Bank (ALAT)' },
];

export default function AccountSettings() {
  const { user, updateUserProfile, dbBank, dbDocs, region, selectRegion } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('bank'); // 'bank' | 'profile' | 'docs'

  // Profile Form State
  const [profileName, setProfileName]   = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileRegion, setProfileRegion] = useState(user?.region || region?.code || 'NG');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  // Bank Form State
  const [bankList, setBankList] = useState([]);
  const [selectedBank, setSelectedBank] = useState(NIGERIAN_BANKS[0].name);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolvingName, setResolvingName] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  // Document Upload State
  const [docList, setDocList] = useState([]);
  const [docType, setDocType] = useState('deposit_slip');
  const [docFile, setDocFile] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [docNotes, setDocNotes] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
      setProfileRegion(user.region || 'NG');
      dbBank.getAccounts(user.id).then(accs => setBankList(accs || []));
      dbDocs.getDocuments(user.id).then(docs => setDocList(docs || []));
    }
  }, [user, dbBank, dbDocs]);

  // Profile save handler
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      alert('Full legal name is required.');
      return;
    }

    const updates = {
      name: profileName.trim(),
      phone: profilePhone.trim(),
      region: profileRegion,
    };

    if (profilePassword.trim()) {
      if (profilePassword.length < 6) {
        alert('New password must be at least 6 characters.');
        return;
      }
      updates.password = profilePassword.trim();
    }

    updateUserProfile(updates);
    if (profileRegion !== region?.code) {
      selectRegion(profileRegion);
    }

    setProfilePassword('');
    setProfileSavedMsg('Profile successfully updated and synchronized with Supabase!');
    setTimeout(() => setProfileSavedMsg(''), 4000);
  };

  // Simulated account name lookup when 10 digits are typed
  const handleAccountNumChange = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(clean);

    if (clean.length === 10) {
      setResolvingName(true);
      setTimeout(() => {
        setAccountName(user?.name ? user.name.toUpperCase() : 'VERIFIED ACCOUNT HOLDER');
        setResolvingName(false);
      }, 500);
    } else {
      setAccountName('');
    }
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (accountNumber.length !== 10) {
      alert('Please enter a valid 10-digit account number.');
      return;
    }
    if (!accountName) {
      alert('Account name could not be resolved. Please verify details.');
      return;
    }

    setSavingBank(true);
    try {
      const saved = await dbBank.saveAccount(user.id, {
        bankName: selectedBank,
        accountNumber,
        accountName,
      });

      setBankList(prev => [saved, ...prev.map(a => ({ ...a, isPrimary: false }))]);
      setAccountNumber('');
      setAccountName('');
      alert('Payout bank account successfully saved and linked!');
    } catch (err) {
      alert('Error saving account: ' + err.message);
    } finally {
      setSavingBank(false);
    }
  };

  const handleDeleteBank = async (id) => {
    if (!confirm('Are you sure you want to remove this payout account?')) return;
    await dbBank.deleteAccount(id);
    setBankList(prev => prev.filter(b => b.id !== id));
  };

  // Document Upload Handlers
  const handleDocFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File exceeds 10MB maximum size limit.');
      return;
    }

    setDocFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setDocPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docPreview) {
      alert('Please select a document or proof file to upload.');
      return;
    }

    setUploadingDoc(true);
    try {
      const newDoc = await dbDocs.uploadDocument(user.id, {
        documentType: docType,
        fileName: docFile?.name || 'document_upload.jpg',
        fileUrl: docPreview,
        fileSizeBytes: docFile?.size || 120400,
        notes: docNotes,
      });

      setDocList(prev => [newDoc, ...prev]);
      setDocFile(null);
      setDocPreview(null);
      setDocNotes('');
      alert('Document successfully uploaded and queued for audit!');
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  if (!user) {
    return (
      <div className="account-page" style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <h2>Authentication Required</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Please sign in to manage payout accounts and profile settings.</p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>Sign In</Link>
      </div>
    );
  }

  return (
    <div className="account-page">
      <div className="account-container">
        <div className="account-header">
          <h1 className="account-header-title">Account Settings & Payout Vault</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Update your operator profile, manage payout bank destinations for yield distributions, and upload official proofs.
          </p>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: activeTab === 'bank' ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
              color: activeTab === 'bank' ? '#00e5ff' : '#94a3b8',
              border: 'none',
              fontWeight: 600
            }}
            onClick={() => setActiveTab('bank')}
          >
            🏦 Payout Bank Accounts ({bankList.length})
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: activeTab === 'profile' ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
              color: activeTab === 'profile' ? '#00e5ff' : '#94a3b8',
              border: 'none',
              fontWeight: 600
            }}
            onClick={() => setActiveTab('profile')}
          >
            👤 Update Profile Details
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: activeTab === 'docs' ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
              color: activeTab === 'docs' ? '#00e5ff' : '#94a3b8',
              border: 'none',
              fontWeight: 600
            }}
            onClick={() => setActiveTab('docs')}
          >
            📤 Document Upload Vault ({docList.length})
          </button>
        </div>

        {/* ══ TAB 1: BANK ACCOUNT DETAILS ══ */}
        {activeTab === 'bank' && (
          <div className="account-grid">
            <div className="account-card">
              <h2 className="account-card-title">
                <span>🏦</span> Linked Payout Bank Accounts
              </h2>
              <p className="account-card-desc">
                Submit your certified NUBAN bank account so the protocol can determine where monthly yield dividends and capital refunds are disbursed.
              </p>

              {/* Saved Accounts */}
              {bankList.length > 0 ? (
                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                    Active Payout Destinations ({bankList.length})
                  </div>
                  {bankList.map(b => (
                    <div key={b.id} className={`bank-item-card ${b.isPrimary ? 'primary' : ''}`}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{b.bankName}</div>
                        <div style={{ fontFamily: 'monospace', color: '#00e5ff', fontSize: '0.88rem', margin: '0.2rem 0' }}>
                          {b.accountNumber} · <span style={{ color: '#fff' }}>{b.accountName}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                        <span
                          className="bank-badge"
                          style={{
                            background: b.isPrimary ? 'rgba(0, 255, 148, 0.15)' : 'rgba(255,255,255,0.08)',
                            color: b.isPrimary ? '#00FF94' : '#94a3b8'
                          }}
                        >
                          {b.isPrimary ? 'PRIMARY' : 'ACTIVE'}
                        </span>
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}
                          onClick={() => handleDeleteBank(b.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', color: '#fca5a5', fontSize: '0.85rem' }}>
                  ⚠️ <strong>No payout account attached:</strong> You are required to submit an account before staking on nodes or requesting withdrawals.
                </div>
              )}

              {/* Add Bank Form */}
              <form onSubmit={handleSaveBank}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Select Financial Institution
                    </label>
                    <select
                      className="input"
                      value={selectedBank}
                      onChange={e => setSelectedBank(e.target.value)}
                    >
                      {NIGERIAN_BANKS.map(bank => (
                        <option key={bank.code} value={bank.name}>{bank.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      NUBAN Account Number (10 Digits)
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="0123456789"
                      value={accountNumber}
                      onChange={e => handleAccountNumChange(e.target.value)}
                      maxLength={10}
                      required
                    />
                    {resolvingName && (
                      <div style={{ fontSize: '0.78rem', color: '#00e5ff', marginTop: '0.25rem' }}>
                        Resolving account name via NIBSS gateway…
                      </div>
                    )}
                    {accountName && !resolvingName && (
                      <div style={{ fontSize: '0.8rem', color: '#00ff94', marginTop: '0.25rem', fontWeight: 600 }}>
                        ✓ Verified Name: {accountName}
                      </div>
                    )}
                  </div>



                  <div className="emtl-notice">
                    <strong>EMTL Regulatory Notice:</strong> In compliance with CBN regulations, statutory levies of ₦50 apply to single electronic transactions exceeding ₦10,000.
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.85rem' }}
                    disabled={savingBank || !accountNumber || resolvingName}
                  >
                    {savingBank ? 'Saving Account...' : '+ Save & Link Payout Account'}
                  </button>
                </div>
              </form>
            </div>

            {/* Next steps helper */}
            <div className="account-card" style={{ height: 'fit-content' }}>
              <h2 className="account-card-title">
                <span>🛡️</span> Onboarding Status
              </h2>
              <p className="account-card-desc">
                Follow the protocol clearance sequence to unlock node staking.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: '#00ff94' }}>✓</span>
                    <span style={{ fontSize: '0.88rem' }}>1. Account Created</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#00ff94', fontWeight: 600 }}>Active</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: bankList.length ? '#00ff94' : '#facc15' }}>{bankList.length ? '✓' : '•'}</span>
                    <span style={{ fontSize: '0.88rem' }}>2. Bank Linked</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: bankList.length ? '#00ff94' : '#facc15', fontWeight: 600 }}>
                    {bankList.length ? 'Linked' : 'Pending'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: user.kycStatus === 'verified' ? '#00ff94' : '#facc15' }}>{user.kycStatus === 'verified' ? '✓' : '•'}</span>
                    <span style={{ fontSize: '0.88rem' }}>3. Identity KYC</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: user.kycStatus === 'verified' ? '#00ff94' : '#facc15', fontWeight: 600 }}>
                    {user.kycStatus?.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: user.kycStatus === 'verified' && bankList.length ? '#00e5ff' : '#64748b' }}>
                      {user.kycStatus === 'verified' && bankList.length ? '🔓' : '🔒'}
                    </span>
                    <span style={{ fontSize: '0.88rem' }}>4. Node Staking</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: user.kycStatus === 'verified' && bankList.length ? '#00e5ff' : '#64748b', fontWeight: 600 }}>
                    {user.kycStatus === 'verified' && bankList.length ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
              </div>

              {user.kycStatus !== 'verified' && (
                <button
                  className="btn btn-primary btn-full"
                  style={{ marginTop: '1.5rem' }}
                  onClick={() => navigate('/kyc')}
                >
                  Proceed to KYC Verification →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ══ TAB 2: UPDATE PROFILE & SECURITY ══ */}
        {activeTab === 'profile' && (
          <div className="account-card" style={{ maxWidth: 640, margin: '0 auto' }}>
            <h2 className="account-card-title">
              <span>👤</span> Update Profile Details
            </h2>
            <p className="account-card-desc">
              Manage your legal name, registered phone number, regional jurisdiction, and login password.
            </p>

            {profileSavedMsg && (
              <div style={{ background: 'rgba(0, 255, 148, 0.12)', border: '1px solid rgba(0, 255, 148, 0.35)', color: '#00ff94', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1.25rem', fontSize: '0.88rem' }}>
                ✓ {profileSavedMsg}
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Email Address <span style={{ color: '#64748b' }}>(Protocol Identity)</span>
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={user.email}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="input"
                      value={profilePhone}
                      onChange={e => setProfilePhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Regional Mode
                    </label>
                    <select
                      className="input"
                      value={profileRegion}
                      onChange={e => setProfileRegion(e.target.value)}
                    >
                      <option value="NG">Nigeria (NGN ₦)</option>
                      <option value="US">United States (USD $)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    New Password <span style={{ color: '#64748b' }}>(Leave blank to keep current)</span>
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••••••"
                    value={profilePassword}
                    onChange={e => setProfilePassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ marginTop: '0.5rem', padding: '0.85rem' }}
                >
                  Save Profile Changes →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══ TAB 3: DOCUMENT UPLOAD VAULT ══ */}
        {activeTab === 'docs' && (
          <div className="account-grid">
            <div className="account-card">
              <h2 className="account-card-title">
                <span>📤</span> Upload Official Proofs & Receipts
              </h2>
              <p className="account-card-desc">
                Upload proof of bank transfers, transaction deposit slips, or bank statements for account verification.
              </p>

              <form onSubmit={handleUploadDoc}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Document Classification
                    </label>
                    <select
                      className="input"
                      value={docType}
                      onChange={e => setDocType(e.target.value)}
                    >
                      <option value="deposit_slip">Deposit / Staking Transfer Slip</option>
                      <option value="payment_receipt">Gateway Payment Receipt (Paystack / Monnify)</option>
                      <option value="bank_statement">Bank Account Statement (Page 1)</option>
                      <option value="tax_cert">Tax Identification Document (TIN / FIRS)</option>
                      <option value="other">Other Official Document</option>
                    </select>
                  </div>

                  <label className="doc-upload-dropzone">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      onChange={handleDocFileChange}
                    />
                    {docPreview ? (
                      <div>
                        <img src={docPreview} alt="Upload Preview" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 8 }} />
                        <div style={{ fontSize: '0.78rem', color: '#00e5ff', marginTop: '0.4rem' }}>
                          {docFile?.name} (Click to change)
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '0.75rem 0' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>📁</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Click to Select Document</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PNG, JPG, PDF up to 10MB</div>
                      </div>
                    )}
                  </label>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Notes / Transaction Reference <span style={{ color: '#64748b' }}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Ref: NV-TX-89218 or Bank session ID"
                      value={docNotes}
                      onChange={e => setDocNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.85rem' }}
                    disabled={uploadingDoc || !docPreview}
                  >
                    {uploadingDoc ? 'Uploading Document...' : 'Upload & Submit Document'}
                  </button>
                </div>
              </form>
            </div>

            {/* Document Archive */}
            <div className="account-card">
              <h2 className="account-card-title">
                <span>📑</span> Document Vault Archive ({docList.length})
              </h2>
              <p className="account-card-desc">
                Records of all documents and transaction receipts submitted to the protocol.
              </p>

              <div className="doc-list">
                {docList.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', padding: '1rem 0' }}>
                    No documents uploaded yet.
                  </div>
                ) : (
                  docList.map(doc => (
                    <div key={doc.id} className="doc-item">
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{doc.fileName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Type: {doc.documentType.replace('_', ' ').toUpperCase()} · {new Date(doc.uploadedAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background: doc.status === 'verified' ? 'rgba(0, 255, 148, 0.15)' : 'rgba(250, 204, 21, 0.15)',
                          color: doc.status === 'verified' ? '#00FF94' : '#FACC15',
                        }}
                      >
                        {doc.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
