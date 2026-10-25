import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './DatabaseModal.css';

export default function DatabaseModal({ isOpen, onClose }) {
  const { dbConnection, refreshDbStatus } = useApp();
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'schema' | 'stats'
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = dbConnection.getConfig();
      setUrl(creds.url || '');
      setAnonKey(creds.anonKey || '');
      setTestResult(null);
    }
  }, [isOpen, dbConnection]);

  if (!isOpen) return null;

  const summary = dbConnection.getStatusSummary();

  const handleTestAndSave = async () => {
    setTesting(true);
    setTestResult(null);

    // Save configuration
    dbConnection.saveConfig({ url, anonKey });
    refreshDbStatus();

    // Test live connection
    const result = await dbConnection.testConnection();
    setTestResult(result);
    setTesting(false);
    refreshDbStatus();
  };

  const handleResetToLocal = () => {
    dbConnection.saveConfig({ url: '', anonKey: '' });
    setUrl('');
    setAnonKey('');
    setTestResult({
      connected: false,
      mode: 'local',
      message: 'Switched to Local Persistent Database engine.'
    });
    refreshDbStatus();
  };

  const handleCopySchema = () => {
    const schemaSql = `-- NodeVault Supabase Schema
-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    region TEXT DEFAULT 'NG',
    tier_id INTEGER DEFAULT 1,
    tier_name TEXT DEFAULT 'Micro Node',
    referral_code TEXT UNIQUE NOT NULL,
    kyc_status TEXT DEFAULT 'unverified',
    wallet_balance NUMERIC(14, 2) DEFAULT 0.00,
    cumulative_gifts NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. KYC Verifications Table
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    id_type TEXT NOT NULL,
    id_number TEXT NOT NULL,
    dob DATE,
    address TEXT,
    state TEXT,
    id_front_url TEXT,
    id_back_url TEXT,
    selfie_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bank Accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;
    navigator.clipboard.writeText(schemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="db-modal-overlay" onClick={onClose}>
      <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="db-modal-close" onClick={onClose} title="Close">✕</button>

        <div className="db-modal-header">
          <div className="db-modal-icon">🗄️</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Database Connection</h2>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
              Connect Supabase Cloud PostgreSQL or run on Persistent Local Store
            </p>
          </div>
        </div>

        {/* Live Status Banner */}
        <div className={`db-status-banner ${summary.isSupabaseActive ? 'connected' : 'local'}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              className="pulse-dot"
              style={{ background: summary.isSupabaseActive ? '#00FF94' : '#FACC15' }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                {summary.isSupabaseActive ? 'Connected to Supabase' : 'Persistent Local Storage'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {summary.isSupabaseActive ? summary.url : 'Offline-first zero-latency storage (All actions saved)'}
              </div>
            </div>
          </div>
          <span
            style={{
              padding: '0.25rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: summary.isSupabaseActive ? 'rgba(0, 255, 148, 0.15)' : 'rgba(250, 204, 21, 0.15)',
              color: summary.isSupabaseActive ? '#00FF94' : '#FACC15'
            }}
          >
            {summary.isSupabaseActive ? 'CLOUD PG' : 'LOCAL STORE'}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="db-tab-row">
          <button
            className={`db-tab-btn ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            ⚙️ Connection Setup
          </button>
          <button
            className={`db-tab-btn ${activeTab === 'schema' ? 'active' : ''}`}
            onClick={() => setActiveTab('schema')}
          >
            📋 Supabase SQL Schema
          </button>
          <button
            className={`db-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 Data Inspector
          </button>
        </div>

        {/* Tab 1: Config */}
        {activeTab === 'config' && (
          <div>
            <div className="db-field">
              <label>Supabase Project URL</label>
              <input
                type="text"
                className="db-input"
                placeholder="https://your-project.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="db-field">
              <label>Supabase Anon / Public API Key</label>
              <input
                type="password"
                className="db-input"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
              />
            </div>

            {testResult && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  background: testResult.connected ? 'rgba(0, 255, 148, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${testResult.connected ? 'rgba(0, 255, 148, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  color: testResult.connected ? '#00FF94' : '#FCA5A5'
                }}
              >
                {testResult.connected ? '✅ ' : '⚠️ '}
                {testResult.message}
              </div>
            )}

            <div className="db-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetToLocal}
              >
                Use Local Storage Only
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={testing}
                onClick={handleTestAndSave}
              >
                {testing ? 'Testing Connection...' : 'Save & Connect Supabase'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: SQL Schema */}
        {activeTab === 'schema' && (
          <div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
              Execute this SQL in your Supabase dashboard (<code style={{ color: '#00e5ff' }}>SQL Editor &gt; New Query</code>) to automatically create all required tables, foreign keys, and indexes. Full schema is also saved in <code style={{ color: '#00e5ff' }}>supabase_schema.sql</code>.
            </p>
            <div className="db-schema-box">
{`-- NodeVault Core Protocol Schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  region TEXT DEFAULT 'NG',
  tier_id INTEGER DEFAULT 1,
  referral_code TEXT UNIQUE NOT NULL,
  kyc_status TEXT DEFAULT 'unverified',
  wallet_balance NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  id_type TEXT NOT NULL,
  id_number TEXT NOT NULL,
  id_front_url TEXT,
  selfie_url TEXT,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  verified BOOLEAN DEFAULT true
);`}
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={handleCopySchema}>
                {copied ? '✓ Copied SQL to Clipboard' : '📋 Copy SQL Migration'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Data Stats */}
        {activeTab === 'stats' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Registered Profiles</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#00e5ff' }}>{summary.stats.totalUsers}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>KYC Submissions</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#00ff94' }}>{summary.stats.kycSubmissions}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Bank Accounts</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#facc15' }}>{summary.stats.bankAccounts}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Uploaded Documents</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#c084fc' }}>{summary.stats.uploadedDocs}</div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              All records are persisted to disk in Local Mode and synched to Supabase tables when cloud connection is enabled.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
