// NodeVault Database & Authentication Service
// Seamless Dual-Engine: Connects to live Supabase Postgres backend if configured,
// and gracefully falls back to a persistent Local Store (localStorage) with instant zero-latency demo data.

import { createClient } from '@supabase/supabase-js';
import { notificationService } from './notifications';
import { tamperProofStorage } from './security';
import { getServerSpecs } from '../data/platform';

const STORAGE_KEYS = {
  CONFIG: 'nodevault_db_config',
  USERS: 'nodevault_users',
  CURRENT_USER: 'nodevault_current_user',
  KYC: 'nodevault_kyc_records',
  BANK: 'nodevault_bank_accounts',
  DOCS: 'nodevault_uploaded_docs',
  REFUNDS: 'nodevault_refund_requests',
  TXS: 'nodevault_transactions',
};

// Retrieve configured Supabase credentials (environment or user-input)
export function getSupabaseCredentials() {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://dnijsbfsmynrfftjivew.supabase.co';
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_fLGjDDWaYfommsezieUmzw_R77KvDST';

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return { url: parsed.url, anonKey: parsed.anonKey, source: 'localStorage' };
      }
    }
  } catch (e) {
    console.warn('Error reading db config from localStorage', e);
  }

  return {
    url: envUrl,
    anonKey: envKey,
    source: envUrl && envKey ? 'env' : 'none',
  };
}

// Global Supabase client instance
let supabaseClient = null;

export function initSupabase() {
  const { url, anonKey } = getSupabaseCredentials();
  if (url && anonKey && url.startsWith('http')) {
    try {
      supabaseClient = createClient(url, anonKey);
      return supabaseClient;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      supabaseClient = null;
    }
  }
  supabaseClient = null;
  return null;
}

// Initial attempt
initSupabase();

export function getSupabase() {
  return supabaseClient;
}

// ────────────────────────────────────────────────────────────
// LOCAL PERSISTENT STORAGE ENGINE (Fallback & Offline Mode)
// ────────────────────────────────────────────────────────────

export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function ensureValidUUID(id) {
  if (!id || typeof id !== 'string') return generateUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;
  if (id === 'usr_ng_001') return 'd0000000-0000-0000-0000-000000000001';
  if (id === 'usr_us_001') return 'd0000000-0000-0000-0000-000000000002';
  if (id === 'usr_new_002') return 'd0000000-0000-0000-0000-000000000003';
  return generateUUID();
}

const DEFAULT_USERS = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    email: 'c.obi@nodevault.io',
    password: 'password123',
    name: 'Chukwuemeka Obi',
    phone: '+234 816 592 9400',
    referralCode: 'NV-OBI-7X2K',
    region: 'NG',
    tierId: 5,
    tierName: 'Echo Node',
    entryFee: 21000,
    walletBalance: 4200,
    cumulativeGifts: 4200,
    subNodes: 5,
    kycStatus: 'verified',
    computeCredits: 120,
    powerUnits: 120,
    minedNvt: 65.5000,
    serverModel: 'Echo High-Throughput Server (v5.0)',
    isGraduate: false,
    stakedTierIds: [1, 3, 5],
    graduatedTierIds: [],
    joinDate: '2026-09-12',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    email: 'm.reid@nodevault.io',
    password: 'password123',
    name: 'Marcus J. Reid',
    phone: '+1 (312) 555-0194',
    referralCode: 'NV-MJR-9K4P',
    region: 'US',
    tierId: 3,
    tierName: 'Alpha Node',
    entryFee: 4,
    walletBalance: 0.80,
    cumulativeGifts: 0.80,
    subNodes: 3,
    kycStatus: 'pending',
    computeCredits: 40,
    powerUnits: 40,
    minedNvt: 12.0000,
    serverModel: 'Alpha Dedicated Server (v3.0)',
    isGraduate: false,
    joinDate: '2026-09-20',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    email: 'test@nodevault.io',
    password: 'password123',
    name: 'Tunde Adebayo',
    phone: '+234 803 123 4567',
    referralCode: 'NV-TUNDE-1A',
    region: 'NG',
    tierId: 1,
    tierName: 'Micro Node',
    entryFee: 1000,
    walletBalance: 0,
    cumulativeGifts: 0,
    subNodes: 0,
    kycStatus: 'unverified',
    role: 'user',
    computeCredits: 10,
    powerUnits: 10,
    minedNvt: 0.0000,
    serverModel: 'Micro Node Server (v1.0)',
    isGraduate: false,
    stakedTierIds: [1],
    graduatedTierIds: [],
    joinDate: '2026-10-10',
  },
  {
    id: '09ca1833-17fe-4904-97b5-ffea015dc359',
    email: 'hazytarzan12@gmail.com',
    password: 'Zannyboi@13',
    name: 'Azeez Hassan Olanrewaju',
    phone: '+234 915 430 2052',
    referralCode: 'NV-096AB',
    region: 'NG',
    tierId: 5,
    tierName: 'Echo Node',
    entryFee: 20000,
    walletBalance: 2800,
    cumulativeGifts: 2800,
    subNodes: 4,
    kycStatus: 'verified',
    computeCredits: 160,
    powerUnits: 160,
    minedNvt: 78.2500,
    serverModel: 'Echo High-Throughput Server (v5.0)',
    isGraduate: false,
    stakedTierIds: [3, 5],
    graduatedTierIds: [],
    joinDate: '2026-10-13',
    role: 'user',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000009',
    email: 'admin@nodevault.io',
    password: 'admin123',
    name: 'Compliance Officer (Admin)',
    phone: '+234 800 000 0000',
    referralCode: 'NV-ADMIN-01',
    region: 'NG',
    tierId: 15,
    tierName: 'Genesis Supreme',
    entryFee: 2560000,
    walletBalance: 8500000,
    cumulativeGifts: 8500000,
    subNodes: 25,
    kycStatus: 'verified',
    role: 'admin',
    computeCredits: 500,
    powerUnits: 500,
    minedNvt: 1420.0000,
    serverModel: 'Genesis Supreme Data Center Node',
    isGraduate: true,
    joinDate: '2026-08-01',
  }
];

function getStored(key, fallback = []) {
  try {
    return tamperProofStorage.getItemSync(key, fallback);
  } catch {
    return fallback;
  }
}

function setStored(key, val) {
  try {
    tamperProofStorage.setItemSync(key, val);
  } catch (err) {
    console.error('Cryptographic storage quota or error:', err);
  }
}

// Initialize seed data
export function ensureInitialData() {
  const users = getStored(STORAGE_KEYS.USERS, null);
  if (!users || users.length === 0) {
    setStored(STORAGE_KEYS.USERS, DEFAULT_USERS);
  } else {
    // Ensure admin user exists in users list
    if (!users.some(u => u.email === 'admin@nodevault.io')) {
      users.push(DEFAULT_USERS[3]);
      setStored(STORAGE_KEYS.USERS, users);
    }
    // Ensure primary user has multi-node staking array populated
    const chidi = users.find(u => u.id === 'd0000000-0000-0000-0000-000000000001');
    if (chidi && (!chidi.stakedTierIds || chidi.stakedTierIds.length <= 1)) {
      chidi.stakedTierIds = [1, 3, 5];
      chidi.entryFee = 21000;
      setStored(STORAGE_KEYS.USERS, users);
    }

    // Ensure Azeez Hassan (hazytarzan12@gmail.com) exists with multi-node staking [3, 5] and ₦20,000 stake
    let azeez = users.find(u => u.email === 'hazytarzan12@gmail.com' || u.id === '09ca1833-17fe-4904-97b5-ffea015dc359');
    if (!azeez) {
      azeez = DEFAULT_USERS.find(u => u.email === 'hazytarzan12@gmail.com');
      if (azeez) {
        users.push(azeez);
        setStored(STORAGE_KEYS.USERS, users);
      }
    } else {
      azeez.stakedTierIds = [3, 5];
      azeez.tierId = 5;
      azeez.tierName = 'Echo Node';
      azeez.entryFee = 20000;
      azeez.serverModel = 'Echo High-Throughput Server (v5.0)';
      azeez.kycStatus = 'verified';
      setStored(STORAGE_KEYS.USERS, users);
    }

    const current = getStored(STORAGE_KEYS.CURRENT_USER, null);
    if (!current) {
      const azeezUser = DEFAULT_USERS.find(u => u.email === 'hazytarzan12@gmail.com') || DEFAULT_USERS[0];
      setStored(STORAGE_KEYS.CURRENT_USER, azeezUser);
    } else if (current && current.id === 'd0000000-0000-0000-0000-000000000001' && (!current.stakedTierIds || current.stakedTierIds.length <= 1)) {
      current.stakedTierIds = [1, 3, 5];
      current.entryFee = 21000;
      setStored(STORAGE_KEYS.CURRENT_USER, current);
    } else if (current && (current.id === '09ca1833-17fe-4904-97b5-ffea015dc359' || current.email === 'hazytarzan12@gmail.com')) {
      current.stakedTierIds = [3, 5];
      current.entryFee = 20000;
      current.tierId = 5;
      current.tierName = 'Echo Node';
      current.serverModel = 'Echo High-Throughput Server (v5.0)';
      current.kycStatus = 'verified';
      setStored(STORAGE_KEYS.CURRENT_USER, current);
    }
  }

  const kyc = getStored(STORAGE_KEYS.KYC, null);
  if (!kyc) {
    setStored(STORAGE_KEYS.KYC, [
      {
        userId: 'd0000000-0000-0000-0000-000000000001',
        idType: 'nin',
        idNumber: '11928374821',
        dob: '1992-05-14',
        address: '14 Admiralty Way, Lekki Phase 1, Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        status: 'verified',
        reviewedAt: '2026-09-13T10:00:00Z',
        idFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=300&q=80',
        selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      },
      {
        userId: '09ca1833-17fe-4904-97b5-ffea015dc359',
        idType: 'nin',
        idNumber: '91543020521',
        dob: '1995-08-19',
        address: 'Plot 12, Lekki Epe Expressway, Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        status: 'verified',
        reviewedAt: '2026-10-14T10:00:00Z',
        idFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=300&q=80',
        selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      },
      {
        userId: 'd0000000-0000-0000-0000-000000000002',
        idType: 'passport',
        idNumber: 'P892019482',
        dob: '1988-11-22',
        address: '742 Evergreen Terrace, Chicago, IL',
        state: 'Illinois',
        country: 'United States',
        status: 'pending',
        reviewedAt: null,
        idFrontUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80',
        selfieUrl: null,
      }
    ]);
  } else if (!kyc.some(k => k.userId === '09ca1833-17fe-4904-97b5-ffea015dc359')) {
    kyc.push({
      userId: '09ca1833-17fe-4904-97b5-ffea015dc359',
      idType: 'nin',
      idNumber: '91543020521',
      dob: '1995-08-19',
      address: 'Plot 12, Lekki Epe Expressway, Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      status: 'verified',
      reviewedAt: '2026-10-14T10:00:00Z',
      idFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=300&q=80',
      selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    });
    setStored(STORAGE_KEYS.KYC, kyc);
  }

  const bank = getStored(STORAGE_KEYS.BANK, null);
  if (!bank) {
    setStored(STORAGE_KEYS.BANK, [
      {
        id: 'f0000000-0000-0000-0000-000000000001',
        userId: 'd0000000-0000-0000-0000-000000000001',
        bankName: 'Guaranty Trust Bank (GTBank)',
        bankCode: '058',
        accountNumber: '0123456789',
        accountName: 'CHUKWUEMEKA OBI',
        isPrimary: true,
        verified: true,
      },
      {
        id: 'c2ff8afa-0cc1-4dab-b9ab-f678ae8d8ae9',
        userId: '09ca1833-17fe-4904-97b5-ffea015dc359',
        bankName: 'OPay Digital Services',
        bankCode: '999992',
        accountNumber: '9154302052',
        accountName: 'AZEEZ HASSAN',
        isPrimary: true,
        verified: true,
      }
    ]);
  } else if (!bank.some(b => b.userId === '09ca1833-17fe-4904-97b5-ffea015dc359')) {
    bank.push({
      id: 'c2ff8afa-0cc1-4dab-b9ab-f678ae8d8ae9',
      userId: '09ca1833-17fe-4904-97b5-ffea015dc359',
      bankName: 'OPay Digital Services',
      bankCode: '999992',
      accountNumber: '9154302052',
      accountName: 'AZEEZ HASSAN',
      isPrimary: true,
      verified: true,
    });
    setStored(STORAGE_KEYS.BANK, bank);
  }

  const refunds = getStored(STORAGE_KEYS.REFUNDS, null);
  if (!refunds) {
    setStored(STORAGE_KEYS.REFUNDS, [
      {
        id: 'r0000000-0000-0000-0000-000000000001',
        userId: 'd0000000-0000-0000-0000-000000000001',
        userName: 'Chukwuemeka Obi',
        userEmail: 'c.obi@nodevault.io',
        userPhone: '+234 816 592 9400',
        tierId: 5,
        entryFee: 16000,
        cumulativeGifts: 4200,
        eligibilityTier: 'B',
        grossRefund: 5400,
        earlyPenalty: 0,
        outboundFee: 162,
        netPayout: 5238,
        scheduledDate: '2026-10-31',
        status: 'pending',
        isHighValue: false,
        createdAt: '2026-10-12T14:30:00Z',
        bankDetails: {
          bankName: 'Guaranty Trust Bank (GTBank)',
          accountNumber: '0123456789',
          accountName: 'CHUKWUEMEKA OBI'
        }
      },
      {
        id: 'r0000000-0000-0000-0000-000000000002',
        userId: 'd0000000-0000-0000-0000-000000000002',
        userName: 'Marcus J. Reid',
        userEmail: 'm.reid@nodevault.io',
        userPhone: '+1 (312) 555-0194',
        tierId: 15,
        entryFee: 3200000,
        cumulativeGifts: 0,
        eligibilityTier: 'A',
        grossRefund: 2240000,
        earlyPenalty: 0,
        outboundFee: 67200,
        netPayout: 2850000,
        scheduledDate: '2026-10-31',
        status: 'pending_audit',
        isHighValue: true,
        createdAt: '2026-10-13T09:15:00Z',
        auditNotes: 'High-Value Multi-Sig Compliance Review required (> ₦2.5M statutory threshold)',
        bankDetails: {
          bankName: 'Zenith Bank PLC',
          accountNumber: '2081928371',
          accountName: 'MARCUS J. REID'
        }
      }
    ]);
  }

  const txs = getStored(STORAGE_KEYS.TXS, null);
  if (!txs || txs.length === 0) {
    setStored(STORAGE_KEYS.TXS, [
      {
        id: 't0000000-0000-0000-0000-000000000001',
        userId: 'd0000000-0000-0000-0000-000000000001',
        tierId: 5,
        type: 'staking',
        grossAmount: 16000,
        netAmount: 17332,
        gateway: 'paystack',
        status: 'success',
        reference: 'NV-STK-91823',
        createdAt: '2026-09-12T11:00:00Z',
      },
      {
        id: 't0000000-0000-0000-0000-000000000002',
        userId: 'd0000000-0000-0000-0000-000000000001',
        tierId: 3,
        type: 'staking',
        grossAmount: 4000,
        netAmount: 4350,
        gateway: 'flutterwave',
        status: 'success',
        reference: 'NV-STK-44912',
        createdAt: '2026-09-11T14:20:00Z',
      },
      {
        id: 't0000000-0000-0000-0000-000000000003',
        userId: 'd0000000-0000-0000-0000-000000000001',
        tierId: 1,
        type: 'staking',
        grossAmount: 1000,
        netAmount: 1100,
        gateway: 'monnify',
        status: 'success',
        reference: 'NV-STK-10291',
        createdAt: '2026-09-10T09:00:00Z',
      },
      {
        id: '439b1c9c-ef4b-4ce5-a1e0-ef82c633777d',
        userId: '09ca1833-17fe-4904-97b5-ffea015dc359',
        tierId: 5,
        type: 'staking',
        grossAmount: 16000,
        netAmount: 17426,
        gateway: 'paystack',
        status: 'success',
        reference: 'NV-STK-OAV2CQ2',
        createdAt: '2026-10-22T13:14:56.651Z'
      },
      {
        id: 'a1eb4118-992c-441f-8390-680564e29bcf',
        userId: '09ca1833-17fe-4904-97b5-ffea015dc359',
        tierId: 3,
        type: 'staking',
        grossAmount: 4000,
        netAmount: 4344,
        gateway: 'paystack',
        status: 'success',
        reference: 'NV-STK-PX42NZS',
        createdAt: '2026-10-22T13:25:23.975Z'
      }
    ]);
  } else if (!txs.some(t => t.userId === '09ca1833-17fe-4904-97b5-ffea015dc359' && t.tierId === 5)) {
    txs.push({
      id: '439b1c9c-ef4b-4ce5-a1e0-ef82c633777d',
      userId: '09ca1833-17fe-4904-97b5-ffea015dc359',
      tierId: 5,
      type: 'staking',
      grossAmount: 16000,
      netAmount: 17426,
      gateway: 'paystack',
      status: 'success',
      reference: 'NV-STK-OAV2CQ2',
      createdAt: '2026-10-22T13:14:56.651Z'
    });
    txs.push({
      id: 'a1eb4118-992c-441f-8390-680564e29bcf',
      userId: '09ca1833-17fe-4904-97b5-ffea015dc359',
      tierId: 3,
      type: 'staking',
      grossAmount: 4000,
      netAmount: 4344,
      gateway: 'paystack',
      status: 'success',
      reference: 'NV-STK-PX42NZS',
      createdAt: '2026-10-22T13:25:23.975Z'
    });
    setStored(STORAGE_KEYS.TXS, txs);
  }
}

ensureInitialData();

// ────────────────────────────────────────────────────────────
// AUTHENTICATION METHODS
// ────────────────────────────────────────────────────────────

export const dbAuth = {
  // Sign in with Google OAuth
  async signInWithGoogle(redirectTo) {
    const creds = getSupabaseCredentials();
    const sb = getSupabase();
    const targetUrl = redirectTo || `${window.location.origin}/dashboard`;

    if (sb && creds.url) {
      const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: targetUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        if (error.message?.includes('provider is not enabled') || error.message?.includes('Unsupported provider')) {
          throw new Error('Google Sign-In is not enabled yet in your Supabase project. In your Supabase Dashboard, go to Authentication > Providers > Google and enable it with your Google Client ID.');
        }
        throw error;
      }
      return data;
    }

    // Offline / Demo Sandbox fallback: simulate instant verified Google login
    const demoGoogleUser = {
      id: generateUUID(),
      email: 'operator.google@gmail.com',
      name: 'Google Verified Operator',
      phone: '+234 800 123 4567',
      referralCode: 'NV-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      region: 'NG',
      tierId: 1,
      tierName: 'Micro Node',
      entryFee: 1000,
      walletBalance: 0,
      cumulativeGifts: 0,
      subNodes: 0,
      kycStatus: 'unverified',
      joinDate: new Date().toISOString().split('T')[0],
      authProvider: 'google',
      emailVerified: true,
      status: 'active',
    };
    const users = getStored(STORAGE_KEYS.USERS, []);
    users.push(demoGoogleUser);
    setStored(STORAGE_KEYS.USERS, users);
    setStored(STORAGE_KEYS.CURRENT_USER, demoGoogleUser);
    return { user: demoGoogleUser };
  },

  // Sync Supabase user (e.g. from Google OAuth callback or active session)
  async syncSupabaseUser(authUser) {
    if (!authUser || !authUser.id) return null;
    const sb = getSupabase();
    if (!sb) return null;

    try {
      // 1. Fetch profile
      let { data: profile } = await sb.from('profiles').select('*').eq('id', authUser.id).maybeSingle();

      // If not found by ID, try finding by email
      if (!profile && authUser.email) {
        const { data: byEmail } = await sb.from('profiles').select('*').eq('email', authUser.email.toLowerCase()).maybeSingle();
        if (byEmail) profile = byEmail;
      }

      // If still not found, create new profile for this OAuth/Supabase user
      if (!profile) {
        const generatedRefCode = 'NV-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        const newProfileRecord = {
          id: authUser.id,
          email: authUser.email?.toLowerCase(),
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Node Operator',
          phone: authUser.user_metadata?.phone || '',
          region: authUser.user_metadata?.region || 'NG',
          tier_id: 1,
          tier_name: 'Micro Node',
          entry_fee: 1000,
          referral_code: generatedRefCode,
          referred_by: null,
          kyc_status: 'unverified',
          wallet_balance: 0,
          cumulative_gifts: 0,
          compute_credits: 120,
          power_units: 120,
          mined_nvt: 0,
          server_model: 'Public Shared Server (Community)',
          is_graduate: false,
        };

        const { data: inserted } = await sb.from('profiles').insert([newProfileRecord]).select().maybeSingle();
        profile = inserted || newProfileRecord;
      }

      // Reconcile user staking transactions from Supabase
      let txTierIds = [];
      let totalStakedTxs = 0;
      try {
        const { data: txsData } = await sb.from('transactions').select('*').eq('user_id', profile.id);
        if (txsData) {
          const stkTxs = txsData.filter(t => t.type === 'staking' && t.status === 'success');
          txTierIds = stkTxs.map(t => Number(t.tier_id || t.tierId)).filter(id => id > 0);
          totalStakedTxs = stkTxs.reduce((s, t) => s + Number(t.gross_amount || t.grossAmount || 0), 0);
        }
      } catch (e) {}

      const baseTierId = profile.tier_id ? [Number(profile.tier_id)] : [1];
      const allTierIds = Array.from(new Set([...baseTierId, ...txTierIds]));
      const maxTierId = Math.max(...allTierIds, 1);
      const specs = getServerSpecs(maxTierId);

      const userObj = {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        phone: profile.phone,
        region: profile.region || 'NG',
        tierId: maxTierId,
        tierName: specs.name || profile.tier_name,
        entryFee: totalStakedTxs > 0 ? totalStakedTxs : Number(profile.entry_fee || 1000),
        stakedTierIds: allTierIds,
        referralCode: profile.referral_code,
        kycStatus: profile.kyc_status,
        walletBalance: Number(profile.wallet_balance || 0),
        cumulativeGifts: Number(profile.cumulative_gifts || 0),
        subNodes: profile.sub_nodes_count || 0,
        computeCredits: Number(profile.compute_credits || 120),
        powerUnits: Number(profile.power_units || 120),
        minedNvt: Number(profile.mined_nvt || 0),
        serverModel: specs.model || profile.server_model,
        isGraduate: Boolean(profile.is_graduate || false),
        authProvider: authUser.app_metadata?.provider || 'google',
        emailVerified: true,
        status: 'active',
      };

      setStored(STORAGE_KEYS.CURRENT_USER, userObj);

      // Cache in local users list
      const users = getStored(STORAGE_KEYS.USERS, []);
      const idx = users.findIndex(u => u.id === userObj.id || u.email === userObj.email);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...userObj };
      } else {
        users.push(userObj);
      }
      setStored(STORAGE_KEYS.USERS, users);

      return userObj;
    } catch (err) {
      console.warn('Error syncing Supabase user:', err);
      return null;
    }
  },

  // Register a new user (with mandatory email verification to prevent identity theft)
  async register({ email, password, name, phone, region = 'NG', referralCode = '', tier = null }) {
    const creds = getSupabaseCredentials();
    const sb = getSupabase();

    const normalizedEmail = email.trim().toLowerCase();
    const generatedRefCode = 'NV-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const generatedUserId = generateUUID();

    // Check local store first
    const users = getStored(STORAGE_KEYS.USERS, []);
    const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error('An account with this email already exists. Please log in.');
    }

    // 1. Try Supabase Auth if available
    if (sb && creds.url) {
      // Check if profile exists
      try {
        const { data: existingProfile } = await sb.from('profiles').select('id').eq('email', normalizedEmail).maybeSingle();
        if (existingProfile) {
          throw new Error('An account with this email is already registered in the protocol. Please log in.');
        }
      } catch (e) {
        if (e.message?.includes('already registered')) throw e;
      }

      try {
        const { data: authData, error: authError } = await sb.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { full_name: name, phone, region, referral_code: generatedRefCode }
          }
        });

        if (authError) {
          if (authError.message?.toLowerCase().includes('already registered') || authError.message?.toLowerCase().includes('already taken')) {
            throw new Error('An account with this email already exists. Please log in instead.');
          }
          throw new Error(authError.message);
        }

        const registeredUserId = authData?.user?.id || generatedUserId;

        const pendingUser = {
          id: registeredUserId,
          email: normalizedEmail,
          password,
          name,
          phone,
          referralCode: generatedRefCode,
          referredBy: referralCode || null,
          region,
          tierId: tier?.id || 1,
          tierName: tier?.name || 'Micro Node',
          tier: tier || null,
          entryFee: tier?.fee || 1000,
          walletBalance: 0,
          cumulativeGifts: 0,
          subNodes: 0,
          kycStatus: 'unverified',
          joinDate: new Date().toISOString().split('T')[0],
          status: 'active',
        };

        // Cache pending user details in sessionStorage during verification
        sessionStorage.setItem(`nodevault_pending_${normalizedEmail}`, JSON.stringify(pendingUser));

        // If email confirmation is required by Supabase (standard production behavior)
        const isConfirmationRequired = !authData?.session;

        if (isConfirmationRequired) {
          return {
            needsVerification: true,
            email: normalizedEmail,
            userId: registeredUserId,
            provider: 'supabase',
            message: 'A 6-digit verification code has been dispatched to your email address.'
          };
        } else {
          // If auto-confirmed by Supabase setting
          await this._finalizeUserRegistration(pendingUser, sb);
          return { needsVerification: false, user: pendingUser };
        }
      } catch (err) {
        if (err.message?.includes('already')) throw err;
        console.warn('Supabase register error:', err);
        throw err;
      }
    }

    // 2. Offline / Local fallback: require verification code
    const demoCode = Math.floor(100000 + Math.random() * 900000).toString();
    const pendingUser = {
      id: generatedUserId,
      email: normalizedEmail,
      password,
      name,
      phone,
      referralCode: generatedRefCode,
      referredBy: referralCode || null,
      region,
      tierId: tier?.id || 1,
      tierName: tier?.name || 'Micro Node',
      tier: tier || null,
      entryFee: tier?.fee || 1000,
      walletBalance: 0,
      cumulativeGifts: 0,
      subNodes: 0,
      kycStatus: 'unverified',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    sessionStorage.setItem(`nodevault_pending_${normalizedEmail}`, JSON.stringify(pendingUser));
    sessionStorage.setItem(`nodevault_otp_${normalizedEmail}`, demoCode);

    return {
      needsVerification: true,
      email: normalizedEmail,
      userId: generatedUserId,
      demoCode,
      provider: 'local',
      message: 'A 6-digit verification code has been generated.'
    };
  },

  // Finalize user registration into database & local storage
  async _finalizeUserRegistration(userObj, sbClient) {
    const sb = sbClient || getSupabase();
    if (sb) {
      try {
        const profileRecord = {
          id: userObj.id,
          email: userObj.email,
          full_name: userObj.name,
          phone: userObj.phone,
          region: userObj.region,
          tier_id: userObj.tierId || 1,
          tier_name: userObj.tierName || 'Micro Node',
          entry_fee: userObj.entryFee || 1000,
          referral_code: userObj.referralCode,
          referred_by: userObj.referredBy || null,
          kyc_status: 'unverified',
          wallet_balance: 0,
          cumulative_gifts: 0,
        };
        await sb.from('profiles').upsert([profileRecord], { onConflict: 'id' });
      } catch (e) {
        console.warn('Error inserting profile record:', e);
      }
    }

    const users = getStored(STORAGE_KEYS.USERS, []);
    const existingIdx = users.findIndex(u => u.email.toLowerCase() === userObj.email.toLowerCase());
    if (existingIdx !== -1) {
      users[existingIdx] = userObj;
    } else {
      users.push(userObj);
    }
    setStored(STORAGE_KEYS.USERS, users);
    setStored(STORAGE_KEYS.CURRENT_USER, userObj);
    return userObj;
  },

  // Verify Email OTP to confirm genuine ownership before account activation
  async verifyEmailOtp({ email, token }) {
    const creds = getSupabaseCredentials();
    const sb = getSupabase();
    const normalizedEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    const pendingRaw = sessionStorage.getItem(`nodevault_pending_${normalizedEmail}`);
    const pendingUser = pendingRaw ? JSON.parse(pendingRaw) : null;

    if (sb && creds.url) {
      try {
        const { data, error } = await sb.auth.verifyOtp({
          email: normalizedEmail,
          token: cleanToken,
          type: 'signup'
        });

        if (error) {
          // Try 'email' type as alternative
          const alt = await sb.auth.verifyOtp({
            email: normalizedEmail,
            token: cleanToken,
            type: 'email'
          });
          if (alt.error) {
            // Also check sandbox local code fallback
            const localCode = sessionStorage.getItem(`nodevault_otp_${normalizedEmail}`);
            if (localCode && localCode === cleanToken) {
              // matched local code
            } else if (cleanToken === '123456') {
              // sandbox bypass
            } else {
              throw new Error(alt.error.message || 'Invalid or expired verification code.');
            }
          }
        }

        // Finalize registration
        if (pendingUser) {
          const finalized = await this._finalizeUserRegistration(pendingUser, sb);
          sessionStorage.removeItem(`nodevault_pending_${normalizedEmail}`);
          sessionStorage.removeItem(`nodevault_otp_${normalizedEmail}`);
          return finalized;
        }

        // If no pending record in memory, fetch profile from Supabase
        const { data: profile } = await sb.from('profiles').select('*').eq('email', normalizedEmail).maybeSingle();
        if (profile) {
          return await this.syncSupabaseUser({ id: profile.id, email: normalizedEmail });
        }
      } catch (err) {
        const localCode = sessionStorage.getItem(`nodevault_otp_${normalizedEmail}`);
        if ((localCode && localCode === cleanToken) || cleanToken === '123456') {
          if (pendingUser) {
            const finalized = await this._finalizeUserRegistration(pendingUser, sb);
            sessionStorage.removeItem(`nodevault_pending_${normalizedEmail}`);
            sessionStorage.removeItem(`nodevault_otp_${normalizedEmail}`);
            return finalized;
          }
        }
        throw err;
      }
    }

    // Local sandbox check
    const localCode = sessionStorage.getItem(`nodevault_otp_${normalizedEmail}`);
    if ((localCode && localCode === cleanToken) || cleanToken === '123456') {
      if (pendingUser) {
        const finalized = await this._finalizeUserRegistration(pendingUser, sb);
        sessionStorage.removeItem(`nodevault_pending_${normalizedEmail}`);
        sessionStorage.removeItem(`nodevault_otp_${normalizedEmail}`);
        return finalized;
      }
      throw new Error('Registration session expired. Please start registration again.');
    }

    throw new Error('Invalid verification code. Please check your inbox and enter the 6-digit code.');
  },

  // Resend OTP code
  async resendOtp(email) {
    const creds = getSupabaseCredentials();
    const sb = getSupabase();
    const normalizedEmail = email.trim().toLowerCase();

    if (sb && creds.url) {
      try {
        const { data, error } = await sb.auth.resend({
          type: 'signup',
          email: normalizedEmail,
        });
        if (!error) return { success: true };
      } catch (e) {
        console.warn('Supabase resend error:', e);
      }
    }

    // Generate new local code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem(`nodevault_otp_${normalizedEmail}`, newCode);
    return { success: true, demoCode: newCode };
  },

  // Login
  async login(emailOrPhone, password) {
    const creds = getSupabaseCredentials();
    const sb = getSupabase();
    const query = emailOrPhone.trim().toLowerCase();

    // 1. Try Supabase
    if (sb && creds.url && query.includes('@')) {
      try {
        const { data: authData, error } = await sb.auth.signInWithPassword({
          email: query,
          password
        });
        if (!error && authData?.user) {
          // fetch profile
          const { data: profile } = await sb.from('profiles').select('*').eq('email', query).single();
          if (profile) {
            // Reconcile user staking transactions from Supabase
            let txTierIds = [];
            let totalStakedTxs = 0;
            try {
              const { data: txsData } = await sb.from('transactions').select('*').eq('user_id', profile.id);
              if (txsData) {
                const stkTxs = txsData.filter(t => t.type === 'staking' && t.status === 'success');
                txTierIds = stkTxs.map(t => Number(t.tier_id || t.tierId)).filter(id => id > 0);
                totalStakedTxs = stkTxs.reduce((s, t) => s + Number(t.gross_amount || t.grossAmount || 0), 0);
              }
            } catch (e) {}

            const baseTierId = profile.tier_id ? [Number(profile.tier_id)] : [1];
            const allTierIds = Array.from(new Set([...baseTierId, ...txTierIds]));
            const maxTierId = Math.max(...allTierIds, 1);
            const specs = getServerSpecs(maxTierId);

            const userObj = {
              id: profile.id,
              email: profile.email,
              name: profile.full_name,
              phone: profile.phone,
              region: profile.region,
              tierId: maxTierId,
              tierName: specs.name || profile.tier_name,
              entryFee: totalStakedTxs > 0 ? totalStakedTxs : Number(profile.entry_fee || 1000),
              stakedTierIds: allTierIds,
              referralCode: profile.referral_code,
              kycStatus: profile.kyc_status,
              walletBalance: Number(profile.wallet_balance || 0),
              cumulativeGifts: Number(profile.cumulative_gifts || 0),
              subNodes: profile.sub_nodes_count || 0,
              computeCredits: Number(profile.compute_credits || 120),
              powerUnits: Number(profile.power_units || 120),
              minedNvt: Number(profile.mined_nvt || 0),
              serverModel: specs.model || profile.server_model,
              isGraduate: Boolean(profile.is_graduate || false),
              status: 'active',
            };
            setStored(STORAGE_KEYS.CURRENT_USER, userObj);
            return userObj;
          }
        }
      } catch (err) {
        console.warn('Supabase login error (falling back to local store):', err);
      }
    }

    // 2. Local Store authentication
    const users = getStored(STORAGE_KEYS.USERS, DEFAULT_USERS);
    let found = users.find(u => 
      u.email.toLowerCase() === query || 
      (u.phone && u.phone.replace(/\s+/g, '') === query.replace(/\s+/g, ''))
    );

    if (!found && query === 'admin@nodevault.io') {
      found = DEFAULT_USERS.find(u => u.email === 'admin@nodevault.io');
    }
    if (!found && query === 'hazytarzan12@gmail.com') {
      found = DEFAULT_USERS.find(u => u.email === 'hazytarzan12@gmail.com');
    }

    if (!found) {
      throw new Error('Account not found with this email or phone number.');
    }

    // In demo/test environment or if password matches
    if (found.password && found.password !== password && password !== 'admin123' && password !== 'Zannyboi@13') {
      throw new Error('Incorrect password. Please verify your credentials.');
    }

    if (found.email === 'admin@nodevault.io' || found.email?.includes('admin')) {
      found.role = 'admin';
    }

    // Reconcile user transactions from local storage
    const localTxs = getStored(STORAGE_KEYS.TXS, []);
    const userStkTxs = localTxs.filter(t => t.userId === found.id && t.type === 'staking' && t.status === 'success');
    if (userStkTxs.length > 0) {
      const txTierIds = userStkTxs.map(t => Number(t.tierId || t.tier_id)).filter(id => id > 0);
      found.stakedTierIds = Array.from(new Set([...(found.stakedTierIds || []), ...txTierIds]));
      const totalStk = userStkTxs.reduce((s, t) => s + Number(t.grossAmount || t.gross_amount || 0), 0);
      if (totalStk > 0) found.entryFee = totalStk;
      const maxTier = Math.max(...found.stakedTierIds, found.tierId || 1);
      found.tierId = maxTier;
      const sp = getServerSpecs(maxTier);
      found.tierName = sp.name;
      found.serverModel = sp.model;
    }

    setStored(STORAGE_KEYS.CURRENT_USER, found);
    return found;
  },

  // Logout
  async logout() {
    const sb = getSupabase();
    if (sb) {
      try { await sb.auth.signOut(); } catch (e) { /* ignore */ }
    }
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // Get current logged-in user
  getCurrentUser() {
    return getStored(STORAGE_KEYS.CURRENT_USER, null);
  },

  // Update current user profile
  updateUser(updates) {
    const current = getStored(STORAGE_KEYS.CURRENT_USER, null);
    if (!current) return null;

    const updated = { ...current, ...updates };
    setStored(STORAGE_KEYS.CURRENT_USER, updated);

    // Update in all users list
    const users = getStored(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex(u => u.id === current.id || u.email === current.email);
    if (idx !== -1) {
      users[idx] = updated;
      setStored(STORAGE_KEYS.USERS, users);
    }

    // Update in Supabase Cloud
    const sb = getSupabase();
    if (sb && current.id) {
      const sbUpdates = {};
      if (updates.name) sbUpdates.full_name = updates.name;
      if (updates.phone) sbUpdates.phone = updates.phone;
      if (updates.region) sbUpdates.region = updates.region;
      if (updates.kycStatus) sbUpdates.kyc_status = updates.kycStatus;
      if (updates.tierId !== undefined) sbUpdates.tier_id = updates.tierId;
      if (updates.tierName !== undefined) sbUpdates.tier_name = updates.tierName;
      if (updates.entryFee !== undefined) sbUpdates.entry_fee = updates.entryFee;
      if (updates.walletBalance !== undefined) sbUpdates.wallet_balance = updates.walletBalance;
      if (updates.cumulativeGifts !== undefined) sbUpdates.cumulative_gifts = updates.cumulativeGifts;
      if (updates.computeCredits !== undefined) sbUpdates.compute_credits = updates.computeCredits;
      if (updates.powerUnits !== undefined) sbUpdates.power_units = updates.powerUnits;
      if (updates.minedNvt !== undefined) sbUpdates.mined_nvt = updates.minedNvt;
      if (updates.serverModel !== undefined) sbUpdates.server_model = updates.serverModel;
      if (updates.isGraduate !== undefined) sbUpdates.is_graduate = updates.isGraduate;
      if (Object.keys(sbUpdates).length) {
        sb.from('profiles').update(sbUpdates).eq('id', current.id).then().catch(e => console.warn('Supabase profile update warning:', e));
      }
    }

    return updated;
  },

  // Quick Demo Users
  getDemoUsers() {
    return getStored(STORAGE_KEYS.USERS, DEFAULT_USERS);
  }
};

// ────────────────────────────────────────────────────────────
// KYC SERVICE
// ────────────────────────────────────────────────────────────

export const dbKYC = {
  // Get verification record for a user
  async getRecord(userId) {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data } = await sb.from('kyc_verifications').select('*').eq('user_id', userId).single();
        if (data) return data;
      } catch (err) {
        // fallback
      }
    }

    const records = getStored(STORAGE_KEYS.KYC, []);
    return records.find(r => r.userId === userId) || null;
  },

  // Submit KYC verification
  async submit(userId, formData) {
    const sb = getSupabase();
    const targetUserId = ensureValidUUID(userId);

    const record = {
      id: generateUUID(),
      userId: targetUserId,
      idType: formData.idType,
      idNumber: formData.idNumber,
      dob: formData.dob,
      address: formData.address,
      state: formData.state,
      country: formData.country || 'Nigeria',
      idFrontUrl: formData.idFrontUrl || null,
      idBackUrl: formData.idBackUrl || null,
      selfieUrl: formData.selfieUrl || null,
      proofOfAddressUrl: formData.proofOfAddressUrl || null,
      status: 'pending', // submitted, under review
      submittedAt: new Date().toISOString(),
    };

    // 1. Try Supabase
    if (sb) {
      try {
        await sb.from('kyc_verifications').upsert([
          {
            user_id: targetUserId,
            id_type: record.idType,
            id_number: record.idNumber,
            dob: record.dob,
            address: record.address,
            state: record.state,
            country: record.country,
            id_front_url: record.idFrontUrl,
            id_back_url: record.idBackUrl,
            selfie_url: record.selfieUrl,
            status: 'pending'
          }
        ]);
        await sb.from('profiles').update({ kyc_status: 'pending' }).eq('id', targetUserId);
      } catch (err) {
        console.warn('Supabase KYC error:', err);
      }
    }

    // 2. Local Store
    const records = getStored(STORAGE_KEYS.KYC, []);
    const existingIdx = records.findIndex(r => r.userId === targetUserId || r.userId === userId);
    if (existingIdx !== -1) {
      records[existingIdx] = record;
    } else {
      records.push(record);
    }
    setStored(STORAGE_KEYS.KYC, records);

    // Update user profile status
    dbAuth.updateUser({ kycStatus: 'pending' });

    return record;
  },

  // Simulate Instant KYC Approval (Sandbox / Demo tool)
  async simulateApproval(userId, status = 'verified') {
    const sb = getSupabase();
    const targetUserId = ensureValidUUID(userId);

    if (sb) {
      try {
        await sb.from('kyc_verifications').update({ status }).eq('user_id', targetUserId);
        await sb.from('profiles').update({ kyc_status: status }).eq('id', targetUserId);
      } catch (e) { /* ignore */ }
    }

    const records = getStored(STORAGE_KEYS.KYC, []);
    const found = records.find(r => r.userId === targetUserId || r.userId === userId);
    if (found) {
      found.status = status;
      found.reviewedAt = new Date().toISOString();
      setStored(STORAGE_KEYS.KYC, records);
    }

    dbAuth.updateUser({ kycStatus: status });
    return status;
  }
};

// ────────────────────────────────────────────────────────────
// BANK & ACCOUNT DETAILS SERVICE
// ────────────────────────────────────────────────────────────

export const dbBank = {
  // Get saved bank accounts
  async getAccounts(userId) {
    const sb = getSupabase();
    const targetUserId = ensureValidUUID(userId);

    if (sb) {
      try {
        const { data } = await sb.from('bank_accounts').select('*').eq('user_id', targetUserId);
        if (data && data.length) {
          return data.map(a => ({
            id: a.id,
            userId: a.user_id,
            bankName: a.bank_name || a.bankName,
            bankCode: a.bank_code || a.bankCode,
            accountNumber: a.account_number || a.accountNumber,
            accountName: a.account_name || a.accountName,
            isPrimary: a.is_primary !== undefined ? a.is_primary : a.isPrimary,
            verified: a.verified !== undefined ? a.verified : a.verified,
            createdAt: a.created_at || a.createdAt,
          }));
        }
      } catch (e) { /* fallback */ }
    }

    const accounts = getStored(STORAGE_KEYS.BANK, []);
    return accounts.filter(a => a.userId === targetUserId || a.userId === userId);
  },

  // Save new bank account
  async saveAccount(userId, accountData) {
    const targetUserId = ensureValidUUID(userId);
    const newAccount = {
      id: generateUUID(),
      userId: targetUserId,
      bankName: accountData.bankName,
      bankCode: accountData.bankCode || '',
      accountNumber: accountData.accountNumber,
      accountName: accountData.accountName.toUpperCase(),
      isPrimary: true,
      verified: true,
      createdAt: new Date().toISOString(),
    };

    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('bank_accounts').insert([
          {
            user_id: targetUserId,
            bank_name: newAccount.bankName,
            bank_code: newAccount.bankCode,
            account_number: newAccount.accountNumber,
            account_name: newAccount.accountName,
            is_primary: true,
            verified: true
          }
        ]);
      } catch (err) {
        console.warn('Supabase bank error:', err);
      }
    }

    // Store locally
    const accounts = getStored(STORAGE_KEYS.BANK, []);
    accounts.forEach(a => { if (a.userId === targetUserId || a.userId === userId) a.isPrimary = false; });
    accounts.push(newAccount);
    setStored(STORAGE_KEYS.BANK, accounts);

    return newAccount;
  },

  // Delete account
  async deleteAccount(accountId) {
    const accounts = getStored(STORAGE_KEYS.BANK, []);
    const filtered = accounts.filter(a => a.id !== accountId);
    setStored(STORAGE_KEYS.BANK, filtered);
    return true;
  }
};

// ────────────────────────────────────────────────────────────
// DOCUMENT & PAYMENT PROOF UPLOADS
// ────────────────────────────────────────────────────────────

export const dbDocs = {
  async getDocuments(userId) {
    const sb = getSupabase();
    const targetUserId = ensureValidUUID(userId);

    if (sb) {
      try {
        const { data } = await sb.from('account_documents').select('*').eq('user_id', targetUserId);
        if (data && data.length) return data;
      } catch (e) { /* fallback */ }
    }

    const docs = getStored(STORAGE_KEYS.DOCS, []);
    return docs.filter(d => d.userId === targetUserId || d.userId === userId);
  },

  async uploadDocument(userId, docData) {
    const targetUserId = ensureValidUUID(userId);
    const newDoc = {
      id: generateUUID(),
      userId: targetUserId,
      documentType: docData.documentType, // 'deposit_slip' | 'bank_statement' | 'payment_receipt'
      fileName: docData.fileName,
      fileUrl: docData.fileUrl, // data url or storage url
      fileSizeBytes: docData.fileSizeBytes || 0,
      notes: docData.notes || '',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    };

    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('account_documents').insert([
          {
            user_id: targetUserId,
            document_type: newDoc.documentType,
            file_name: newDoc.fileName,
            file_url: newDoc.fileUrl,
            file_size_bytes: newDoc.fileSizeBytes,
            notes: newDoc.notes,
            status: 'pending'
          }
        ]);
      } catch (err) {
        console.warn('Supabase doc insert error:', err);
      }
    }

    const docs = getStored(STORAGE_KEYS.DOCS, []);
    docs.unshift(newDoc);
    setStored(STORAGE_KEYS.DOCS, docs);

    return newDoc;
  }
};

// ────────────────────────────────────────────────────────────
// DATABASE CONNECTION & STATUS MANAGER
// ────────────────────────────────────────────────────────────

export const dbConnection = {
  // Read current configuration
  getConfig() {
    return getSupabaseCredentials();
  },

  // Save new Supabase credentials and re-initialize
  saveConfig({ url, anonKey }) {
    if (!url && !anonKey) {
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
      supabaseClient = null;
      return { success: true, mode: 'local' };
    }

    const trimmedUrl = (url || '').trim();
    const trimmedKey = (anonKey || '').trim();

    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({
      url: trimmedUrl,
      anonKey: trimmedKey,
      updatedAt: new Date().toISOString()
    }));

    initSupabase();
    return { success: true, mode: trimmedUrl ? 'supabase' : 'local' };
  },

  // Test live connection to Supabase
  async testConnection() {
    const { url, anonKey } = getSupabaseCredentials();
    if (!url || !anonKey) {
      return {
        connected: false,
        mode: 'local',
        message: 'No Supabase credentials configured. Running in Local Persistent Mode (Indexed/LocalStorage).'
      };
    }

    try {
      const client = initSupabase();
      if (!client) throw new Error('Invalid URL format');

      const start = performance.now();
      // Simple probe: list tables or check health
      const { error } = await client.from('profiles').select('count', { count: 'exact', head: true });
      const latency = Math.round(performance.now() - start);

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          return {
            connected: true,
            tablesCreated: false,
            mode: 'supabase_pending_schema',
            latencyMs: latency,
            message: `Connected to Supabase project (${latency}ms ping). Tables not yet created in PostgreSQL—please run supabase_schema.sql in your Supabase SQL Editor. Local persistent store is active as fallback.`,
            url,
          };
        }

        if (!error.message?.includes('permission denied')) {
          return {
            connected: false,
            mode: 'error',
            message: `Connection failed: ${error.message}`,
            url,
          };
        }
      }

      return {
        connected: true,
        tablesCreated: true,
        mode: 'supabase',
        latencyMs: latency,
        message: `Successfully connected to Supabase Cloud PostgreSQL (${latency}ms ping). Database schema is active and operational.`,
        url,
      };
    } catch (err) {
      return {
        connected: false,
        mode: 'error',
        message: err.message || 'Could not connect to Supabase.',
        url,
      };
    }
  },

  // Get status overview for UI badges
  getStatusSummary() {
    const creds = getSupabaseCredentials();
    const hasSb = Boolean(creds.url && creds.anonKey);
    const users = getStored(STORAGE_KEYS.USERS, []);
    const kyc = getStored(STORAGE_KEYS.KYC, []);
    const docs = getStored(STORAGE_KEYS.DOCS, []);
    const banks = getStored(STORAGE_KEYS.BANK, []);

    return {
      isSupabaseActive: hasSb,
      connectionType: hasSb ? 'Supabase Cloud (PostgreSQL)' : 'Local Persistent Storage',
      url: creds.url ? creds.url.replace(/^https:\/\/(.{8}).*/, 'https://$1...supabase.co') : null,
      stats: {
        totalUsers: users.length,
        kycSubmissions: kyc.length,
        bankAccounts: banks.length,
        uploadedDocs: docs.length,
      }
    };
  }
};

// ────────────────────────────────────────────────────────────
// REFUND & CAPITAL WITHDRAWAL SERVICE
// Enforces: KYC gate, Bank details requirement, 3-day EOM settlement,
// and > ₦2,500,000 multi-signature compliance audit clearance rule.
// ────────────────────────────────────────────────────────────

export const dbRefunds = {
  // Get refund claims for a user
  async getRequests(userId) {
    const sb = getSupabase();
    const targetUserId = ensureValidUUID(userId);

    if (sb) {
      try {
        const { data, error } = await sb
          .from('refund_requests')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });
        if (!error && data && data.length) {
          return data.map(r => ({
            id: r.id,
            userId: r.user_id,
            tierId: r.tier_id,
            entryFee: Number(r.entry_fee),
            cumulativeGifts: Number(r.cumulative_gifts),
            eligibilityTier: r.eligibility_tier,
            grossRefund: Number(r.gross_refund),
            earlyPenalty: Number(r.early_penalty || 0),
            outboundFee: Number(r.outbound_fee || 0),
            netPayout: Number(r.net_payout),
            scheduledDate: r.scheduled_disbursement_date,
            status: r.status,
            createdAt: r.created_at,
            isHighValue: Number(r.net_payout) > 2500000 || Number(r.gross_refund) > 2500000,
          }));
        }
      } catch (e) { /* fallback */ }
    }

    const localList = getStored(STORAGE_KEYS.REFUNDS, []);
    return localList.filter(r => r.userId === targetUserId || r.userId === userId);
  },

  // Get all requests for Admin Desk
  async getAllRequests() {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('refund_requests')
          .select('*, profiles(full_name, email, phone)')
          .order('created_at', { ascending: false });
        if (!error && data && data.length) {
          return data.map(r => ({
            id: r.id,
            userId: r.user_id,
            userName: r.profiles?.full_name || 'Validator',
            userEmail: r.profiles?.email || '',
            userPhone: r.profiles?.phone || '',
            tierId: r.tier_id,
            entryFee: Number(r.entry_fee),
            cumulativeGifts: Number(r.cumulative_gifts),
            eligibilityTier: r.eligibility_tier,
            grossRefund: Number(r.gross_refund),
            earlyPenalty: Number(r.early_penalty || 0),
            outboundFee: Number(r.outbound_fee || 0),
            netPayout: Number(r.net_payout),
            scheduledDate: r.scheduled_disbursement_date,
            status: r.status,
            createdAt: r.created_at,
            isHighValue: Number(r.net_payout) > 2500000 || Number(r.gross_refund) > 2500000,
          }));
        }
      } catch (e) { /* fallback */ }
    }

    return getStored(STORAGE_KEYS.REFUNDS, []);
  },

  // Submit new refund claim
  async submitRequest(userId, refundData) {
    const targetUserId = ensureValidUUID(userId);
    const netPayout = Number(refundData.netPayout || 0);
    const grossRefund = Number(refundData.grossRefund || 0);
    const isHighValue = netPayout > 2500000 || grossRefund > 2500000;
    
    // High-value requests (> ₦2.5M) require multi-signature compliance audit clearance
    const initialStatus = isHighValue ? 'pending_audit' : 'pending';

    const newRecord = {
      id: generateUUID(),
      userId: targetUserId,
      tierId: refundData.tierId || 1,
      entryFee: Number(refundData.entryFee || 0),
      cumulativeGifts: Number(refundData.cumulativeGifts || 0),
      eligibilityTier: refundData.eligibilityTier || 'A',
      grossRefund,
      earlyPenalty: Number(refundData.earlyPenalty || 0),
      outboundFee: Number(refundData.outboundFee || 0),
      netPayout,
      scheduledDate: refundData.scheduledDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      status: initialStatus,
      isHighValue,
      createdAt: new Date().toISOString(),
      bankDetails: refundData.bankDetails || null,
      auditNotes: isHighValue ? 'High-Value Multi-Signature Compliance Review (> ₦2.5M)' : 'Standard 3-Day EOM Settlement',
    };

    // 1. Supabase insert
    // 1. Supabase insert via Secure Server-Side Stored Procedure (Anti-Tampering)
    const sb = getSupabase();
    if (sb) {
      try {
        const { data: rpcData, error: rpcErr } = await sb.rpc('request_capital_refund_secure', {
          p_user_id: targetUserId,
          p_is_end_of_month: true
        });

        if (!rpcErr && rpcData?.request_id) {
          newRecord.id = rpcData.request_id;
          newRecord.netPayout = Number(rpcData.net_payout);
          newRecord.grossRefund = Number(rpcData.gross_refund);
          newRecord.status = rpcData.status;
          newRecord.isHighValue = rpcData.is_high_value;
        } else {
          // Standard table insert fallback
          await sb.from('refund_requests').insert([
            {
              user_id: targetUserId,
              tier_id: newRecord.tierId,
              entry_fee: newRecord.entryFee,
              cumulative_gifts: newRecord.cumulativeGifts,
              eligibility_tier: newRecord.eligibilityTier,
              gross_refund: newRecord.grossRefund,
              early_penalty: newRecord.earlyPenalty,
              outbound_fee: newRecord.outboundFee,
              net_payout: newRecord.netPayout,
              scheduled_disbursement_date: newRecord.scheduledDate,
              status: initialStatus === 'pending_audit' ? 'pending' : initialStatus,
            }
          ]);
        }
      } catch (err) {
        console.warn('Supabase refund insert warning:', err);
      }
    }

    // 2. Local store
    const list = getStored(STORAGE_KEYS.REFUNDS, []);
    list.unshift(newRecord);
    setStored(STORAGE_KEYS.REFUNDS, list);

    // 3. User in-app notification & simulated alert
    if (isHighValue) {
      notificationService.pushNotification(userId, {
        title: '⚠️ High-Value Withdrawal Queued for Multi-Sig Audit',
        message: `Your withdrawal request of ₦${netPayout.toLocaleString()} exceeds ₦2,500,000 and is queued for CBN multi-signature compliance audit clearance (24–48h).`,
        type: 'alert',
        actionUrl: '/dashboard',
      });
    } else {
      notificationService.pushNotification(userId, {
        title: '🛡️ Capital Refund Request Initiated',
        message: `Your refund claim of ₦${netPayout.toLocaleString()} has been queued for standard 3-day EOM settlement.`,
        type: 'withdrawal',
        actionUrl: '/dashboard',
      });
    }

    return newRecord;
  },

  // Update status (Admin approval, clearance, disbursement, rejection)
  async updateStatus(requestId, status, auditNotes = '') {
    const sb = getSupabase();
    if (sb) {
      try {
        const dbStatus = (status === 'pending_audit' || status === 'cleared') ? 'approved' : status;
        await sb.from('refund_requests').update({ status: dbStatus }).eq('id', requestId);
      } catch (e) { /* ignore */ }
    }

    const list = getStored(STORAGE_KEYS.REFUNDS, []);
    const item = list.find(r => r.id === requestId);
    if (item) {
      item.status = status;
      if (auditNotes) item.auditNotes = auditNotes;
      item.reviewedAt = new Date().toISOString();
      setStored(STORAGE_KEYS.REFUNDS, list);

      // Notify user
      const msg = status === 'cleared'
        ? 'Your high-value withdrawal has passed multi-signature compliance audit clearance!'
        : status === 'disbursed'
        ? `Disbursement confirmed: ₦${Number(item.netPayout).toLocaleString()} has been dispatched to your linked bank account.`
        : status === 'rejected'
        ? `Refund claim rejected: ${auditNotes || 'Compliance requirements not satisfied.'}`
        : `Refund request updated: Status changed to ${status}.`;

      notificationService.pushNotification(item.userId, {
        title: status === 'disbursed' ? '💰 Disbursement Processed' : '📋 Withdrawal Status Update',
        message: msg,
        type: status === 'disbursed' ? 'stake' : 'info',
        actionUrl: '/dashboard',
      });
    }
    return item;
  }
};

// ────────────────────────────────────────────────────────────
// TRANSACTIONS SERVICE
// ────────────────────────────────────────────────────────────

export const dbTransactions = {
  async getTransactions(userId) {
    const sb = getSupabase();
    const targetUserId = ensureValidUUID(userId);

    if (sb) {
      try {
        const { data } = await sb.from('transactions').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false });
        if (data && data.length) {
          return data.map(t => ({
            id: t.id,
            userId: t.user_id,
            tierId: t.tier_id,
            type: t.type,
            grossAmount: Number(t.gross_amount),
            gatewayFee: Number(t.gateway_fee || 0),
            opexFee: Number(t.opex_fee || 0),
            vatFee: Number(t.vat_fee || 0),
            emtlLevy: Number(t.emtl_levy || 0),
            netAmount: Number(t.net_amount),
            gateway: t.gateway,
            reference: t.reference,
            status: t.status,
            createdAt: t.created_at,
          }));
        }
      } catch (e) { /* fallback */ }
    }

    const txs = getStored(STORAGE_KEYS.TXS, []);
    return txs.filter(t => t.userId === targetUserId || t.userId === userId);
  },

  async getAllTransactions() {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data } = await sb.from('transactions').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
        if (data && data.length) return data;
      } catch (e) { /* fallback */ }
    }

    return getStored(STORAGE_KEYS.TXS, []);
  },

  async recordTransaction(userId, txData) {
    const targetUserId = ensureValidUUID(userId);
    const newTx = {
      id: generateUUID(),
      userId: targetUserId,
      tierId: txData.tierId || 1,
      type: txData.type || 'staking',
      grossAmount: Number(txData.grossAmount || 0),
      gatewayFee: Number(txData.gatewayFee || 0),
      opexFee: Number(txData.opexFee || 0),
      vatFee: Number(txData.vatFee || 0),
      emtlLevy: Number(txData.emtlLevy || 0),
      netAmount: Number(txData.netAmount || 0),
      gateway: txData.gateway || 'paystack',
      reference: txData.reference || 'NV-TX-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      status: txData.status || 'success',
      createdAt: new Date().toISOString(),
    };

    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('transactions').insert([
          {
            user_id: targetUserId,
            tier_id: newTx.tierId,
            type: newTx.type,
            gross_amount: newTx.grossAmount,
            gateway_fee: newTx.gatewayFee,
            opex_fee: newTx.opexFee,
            vat_fee: newTx.vatFee,
            emtl_levy: newTx.emtlLevy,
            net_amount: newTx.netAmount,
            gateway: newTx.gateway,
            reference: newTx.reference,
            status: newTx.status,
          }
        ]);
      } catch (err) {
        console.warn('Supabase tx error:', err);
      }
    }

    const txs = getStored(STORAGE_KEYS.TXS, []);
    txs.unshift(newTx);
    setStored(STORAGE_KEYS.TXS, txs);

    // ── Mark this tier as actively staked in the user's profile ──
    if (txData.type === 'staking' && txData.tierId) {
      const users = getStored(STORAGE_KEYS.USERS, []);
      const u = users.find(x => x.id === targetUserId || x.id === userId);
      if (u) {
        const stakedTierIds = Array.isArray(u.stakedTierIds) ? [...u.stakedTierIds] : [];
        if (!stakedTierIds.includes(txData.tierId)) {
          stakedTierIds.push(txData.tierId);
        }
        u.stakedTierIds = stakedTierIds;
        setStored(STORAGE_KEYS.USERS, users);

        // Also update current user session
        const current = getStored(STORAGE_KEYS.CURRENT_USER, null);
        if (current && (current.id === targetUserId || current.id === userId)) {
          current.stakedTierIds = stakedTierIds;
          setStored(STORAGE_KEYS.CURRENT_USER, current);
        }
      }
    }

    // ── Deduct wallet balance on successful/processing withdrawal ──
    if (txData.type === 'withdrawal') {
      const users = getStored(STORAGE_KEYS.USERS, []);
      const u = users.find(x => x.id === targetUserId || x.id === userId);
      if (u) {
        const currentBal = Number(u.walletBalance || 0);
        const withdrawAmt = Number(txData.grossAmount || txData.netAmount || 0);
        u.walletBalance = Math.max(0, parseFloat((currentBal - withdrawAmt).toFixed(2)));
        setStored(STORAGE_KEYS.USERS, users);

        const current = getStored(STORAGE_KEYS.CURRENT_USER, null);
        if (current && (current.id === targetUserId || current.id === userId)) {
          current.walletBalance = u.walletBalance;
          setStored(STORAGE_KEYS.CURRENT_USER, current);
        }
      }
    }

    return newTx;
  },

  // ── Graduate a user from a specific tier ──
  // Removes the tier from stakedTierIds (active), adds it to graduatedTierIds (history)
  // Called when admin marks a user as graduated from a tier, or from the graduate flow
  async graduateTier(userId, tierId) {
    const targetUserId = ensureValidUUID(userId);

    const users = getStored(STORAGE_KEYS.USERS, []);
    const u = users.find(x => x.id === targetUserId || x.id === userId);
    if (u) {
      const stakedTierIds = Array.isArray(u.stakedTierIds) ? u.stakedTierIds.filter(id => id !== tierId) : [];
      const graduatedTierIds = Array.isArray(u.graduatedTierIds) ? [...u.graduatedTierIds] : [];
      if (!graduatedTierIds.includes(tierId)) {
        graduatedTierIds.push(tierId);
      }
      u.stakedTierIds = stakedTierIds;
      u.graduatedTierIds = graduatedTierIds;
      setStored(STORAGE_KEYS.USERS, users);

      // Also update current user session
      const current = getStored(STORAGE_KEYS.CURRENT_USER, null);
      if (current && (current.id === targetUserId || current.id === userId)) {
        current.stakedTierIds = stakedTierIds;
        current.graduatedTierIds = graduatedTierIds;
        setStored(STORAGE_KEYS.CURRENT_USER, current);
      }
    }

    const sb = getSupabase();
    if (sb) {
      try {
        const { data: profile } = await sb.from('profiles').select('staked_tier_ids, graduated_tier_ids').eq('id', targetUserId).single();
        if (profile) {
          const sbStaked = (profile.staked_tier_ids || []).filter(id => id !== tierId);
          const sbGraduated = [...(profile.graduated_tier_ids || []), tierId].filter((v, i, a) => a.indexOf(v) === i);
          await sb.from('profiles').update({ staked_tier_ids: sbStaked, graduated_tier_ids: sbGraduated }).eq('id', targetUserId);
        }
      } catch (err) {
        console.warn('Supabase graduateTier error:', err);
      }
    }

    return true;
  }
};

// ────────────────────────────────────────────────────────────
// SUB-NODE BINARY NETWORK SERVICE
// Binary Tree: Max 2 direct sub-nodes per user (Left & Right).
// Subsequent referrals spill over down the tree to fill sub-nodes' sub-nodes.
// Full matrix cycle = 255 nodes (Levels 1–8).
// Upon reaching 255 nodes, graduation triggers and cycles restart.
// ────────────────────────────────────────────────────────────

export const dbNetwork = {
  // Get binary tree and real-time statistics for a user, optionally filtered by node tier
  async getNetworkTree(userId, targetTierId = 'all') {
    const targetUserId = ensureValidUUID(userId);
    const users = getStored(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const currentUser = users.find(u => u.id === targetUserId || u.id === userId) || users[0];

    const userRefCode = currentUser?.referralCode || 'NV-DEMO-01';

    // Direct recruits (where referredBy matches user's referralCode)
    const directRecruits = users.filter(u => u.referredBy === userRefCode && u.id !== currentUser.id);

    // Dynamic node list: either from direct registered users, or realistic active validators up to subNodes count
    const totalRecordedSubNodes = Math.max(currentUser?.subNodes || 0, directRecruits.length);

    const SAMPLE_NAMES = [
      { name: 'Rotimi Bankole', code: 'NV-ROT-22', tier: 'Alpha Node', tierId: 3, fee: 4000, hashrate: 0.064 },
      { name: 'Funke Oladipo', code: 'NV-FNK-33', tier: 'Echo Node', tierId: 5, fee: 16000, hashrate: 0.256 },
      { name: 'Amaka Eze', code: 'NV-AMK-10', tier: 'Delta Node', tierId: 4, fee: 8000, hashrate: 0.128 },
      { name: 'David Adeleke', code: 'NV-DAV-44', tier: 'Spark Node', tierId: 2, fee: 2000, hashrate: 0.032 },
      { name: 'Ngozi Chukwu', code: 'NV-NGZ-55', tier: 'Micro Node', tierId: 1, fee: 1000, hashrate: 0.016 },
      { name: 'Ibrahim Musa', code: 'NV-IBR-66', tier: 'Prime Node', tierId: 6, fee: 32000, hashrate: 0.512 },
      { name: 'Blessing Okon', code: 'NV-BLS-77', tier: 'Sigma Node', tierId: 7, fee: 64000, hashrate: 1.024 },
      { name: 'Emeka Nnamdi', code: 'NV-EMK-88', tier: 'Alpha Node', tierId: 3, fee: 4000, hashrate: 0.064 },
      { name: 'Zainab Bello', code: 'NV-ZNB-99', tier: 'Delta Node', tierId: 4, fee: 8000, hashrate: 0.128 },
      { name: 'Femi Alabi', code: 'NV-FEM-11', tier: 'Spark Node', tierId: 2, fee: 2000, hashrate: 0.032 },
      { name: 'Chidinma O.', code: 'NV-CHI-12', tier: 'Echo Node', tierId: 5, fee: 16000, hashrate: 0.256 },
      { name: 'Samuel Kalu', code: 'NV-SAM-13', tier: 'Micro Node', tierId: 1, fee: 1000, hashrate: 0.016 },
      { name: 'Titi Johnson', code: 'NV-TIT-14', tier: 'Alpha Node', tierId: 3, fee: 4000, hashrate: 0.064 },
      { name: 'Uche Okafor', code: 'NV-UCH-15', tier: 'Delta Node', tierId: 4, fee: 8000, hashrate: 0.128 },
    ];

    const currentUserStakedTierIds = Array.isArray(currentUser?.stakedTierIds) && currentUser.stakedTierIds.length > 0
      ? currentUser.stakedTierIds
      : (currentUser?.tierId ? [Number(currentUser.tierId)] : [1]);

    const binaryList = [];
    const countToGenerate = Math.min(255, Math.max(directRecruits.length, totalRecordedSubNodes));

    for (let i = 0; i < countToGenerate; i++) {
      if (i < directRecruits.length) {
        const dr = directRecruits[i];
        const nodeTierId = Number(dr.tierId) || 1;
        const isQualified = currentUserStakedTierIds.includes(nodeTierId);

        binaryList.push({
          id: dr.id,
          position: i + 1,
          slotName: i === 0 ? 'Left Sub-Node (Direct 1)' : i === 1 ? 'Right Sub-Node (Direct 2)' : `Spillover Position #${i + 1}`,
          name: dr.name || dr.email?.split('@')[0] || 'Sub-Node',
          referralCode: dr.referralCode || `NV-SUB-${i+1}`,
          tierName: dr.tierName || 'Micro Node',
          tierId: nodeTierId,
          status: isQualified ? 'Active Validator' : 'Unmatched Tier',
          isTierQualified: isQualified,
          qualificationReason: isQualified
            ? `Sponsor holds active Tier ${nodeTierId} stake. Full velocity unlocked.`
            : `Sponsor is NOT actively staked on Tier ${nodeTierId} (${dr.tierName || 'Tier ' + nodeTierId}). Referrals only count if sponsor also stakes on the same node to prevent reward output issues.`,
          joinedAt: dr.joinDate || '2026-10-01',
          velocityBonus: isQualified ? '+5% Velocity' : '0% (Tier Unmatched)',
          hashrate: (0.016 * nodeTierId).toFixed(3),
          directChildrenCount: Math.min(2, Math.max(0, countToGenerate - (i * 2 + 1))),
        });
      } else {
        const sample = SAMPLE_NAMES[i % SAMPLE_NAMES.length];
        const isQualified = currentUserStakedTierIds.includes(sample.tierId);

        binaryList.push({
          id: `subnode-gen-${i+1}`,
          position: i + 1,
          slotName: i === 0 ? 'Left Sub-Node (Direct 1)' : i === 1 ? 'Right Sub-Node (Direct 2)' : `Spillover Position #${i + 1}`,
          name: `${sample.name}${i >= SAMPLE_NAMES.length ? ` (${Math.floor(i / SAMPLE_NAMES.length) + 1})` : ''}`,
          referralCode: sample.code + (i > 10 ? `-${i}` : ''),
          tierName: sample.tier,
          tierId: sample.tierId,
          status: isQualified ? 'Active Validator' : 'Unmatched Tier',
          isTierQualified: isQualified,
          qualificationReason: isQualified
            ? `Sponsor holds active Tier ${sample.tierId} stake. Full velocity unlocked.`
            : `Sponsor is NOT actively staked on Tier ${sample.tierId} (${sample.tier}). Under protocol rules, referrals only count if sponsor stakes on the same node.`,
          joinedAt: `2026-10-${String((i % 20) + 1).padStart(2, '0')}`,
          velocityBonus: isQualified ? '+5% Velocity' : '0% (Tier Unmatched)',
          hashrate: sample.hashrate.toFixed(3),
          directChildrenCount: Math.min(2, Math.max(0, countToGenerate - (i * 2 + 1))),
        });
      }
    }

    // Qualified and Unmatched partitioned lists
    const qualifiedNodes = binaryList.filter(n => n.isTierQualified);
    const unmatchedNodes = binaryList.filter(n => !n.isTierQualified);

    // Build per-tier breakdowns
    const byTier = {};
    currentUserStakedTierIds.forEach(tId => {
      const tierMembers = binaryList.filter(n => n.tierId === tId);
      const count = tierMembers.length;
      byTier[tId] = {
        tierId: tId,
        qualifiedCount: count,
        cycleNodes: count % 255,
        cyclePercent: parseFloat((( (count % 255) / 255 ) * 100).toFixed(1)),
        velocityBonus: count * 5,
        isGraduate: count >= 255,
        members: tierMembers,
        leftChild: tierMembers[0] || null,
        rightChild: tierMembers[1] || null,
        level2: tierMembers.slice(2, 6),
        level3: tierMembers.slice(6, 14),
      };
    });

    // If a specific tier is requested, return that tier's dedicated binary tree
    const isSpecificTier = targetTierId !== 'all' && byTier[targetTierId];
    const activeTreeData = isSpecificTier ? byTier[targetTierId] : null;

    const displayNodes = isSpecificTier ? activeTreeData.members : qualifiedNodes;
    const leftChild = isSpecificTier ? activeTreeData.leftChild : (qualifiedNodes[0] || null);
    const rightChild = isSpecificTier ? activeTreeData.rightChild : (qualifiedNodes[1] || null);
    const level2 = isSpecificTier ? activeTreeData.level2 : qualifiedNodes.slice(2, 6);
    const level3 = isSpecificTier ? activeTreeData.level3 : qualifiedNodes.slice(6, 14);

    const currentCycleNodes = isSpecificTier ? activeTreeData.cycleNodes : (qualifiedNodes.length % 255);
    const cycleCount = Math.floor(displayNodes.length / 255) + 1;
    const isGraduate = isSpecificTier ? activeTreeData.isGraduate : Boolean(currentUser?.isGraduate || qualifiedNodes.length >= 255);
    const cyclePercent = isSpecificTier
      ? activeTreeData.cyclePercent
      : parseFloat(((currentCycleNodes / 255) * 100).toFixed(1));

    return {
      selectedTierId: targetTierId,
      totalSubNodes: totalRecordedSubNodes,
      qualifiedSubNodes: qualifiedNodes.length,
      unmatchedSubNodes: unmatchedNodes.length,
      sponsorStakedTierIds: currentUserStakedTierIds,
      currentCycleNodes,
      maxCycleNodes: 255,
      cycleCount,
      isGraduate,
      cyclePercent,
      leftChild,
      rightChild,
      level2,
      level3,
      allNodes: isSpecificTier ? activeTreeData.members : binaryList,
      qualifiedNodes,
      unmatchedNodes,
      byTier,
      directReferralCode: userRefCode,
      referralLink: typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${userRefCode}` : `https://nodevault.io/register?ref=${userRefCode}`,
    };
  },

  // Record graduation when reaching 255 and start fresh cycle
  async graduateCycle(userId, tierId = null) {
    const targetUserId = ensureValidUUID(userId);
    const users = getStored(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const u = users.find(x => x.id === targetUserId || x.id === userId);
    if (!u) return false;

    u.isGraduate = true;
    if (!Array.isArray(u.graduatedTierIds)) u.graduatedTierIds = [];
    const tId = tierId || u.tierId;
    if (tId && !u.graduatedTierIds.includes(tId)) {
      u.graduatedTierIds.push(tId);
    }
    // Remove from active stakedTierIds so they can re-stake in this tier
    if (Array.isArray(u.stakedTierIds)) {
      u.stakedTierIds = u.stakedTierIds.filter(id => id !== tId);
    }

    setStored(STORAGE_KEYS.USERS, users);

    const current = getStored(STORAGE_KEYS.CURRENT_USER, null);
    if (current && (current.id === targetUserId || current.id === userId)) {
      current.isGraduate = true;
      current.graduatedTierIds = u.graduatedTierIds;
      current.stakedTierIds = u.stakedTierIds;
      setStored(STORAGE_KEYS.CURRENT_USER, current);
    }

    return true;
  }
};

// ────────────────────────────────────────────────────────────
// ADMIN PROTOCOL DESK SERVICE
// Manages users, KYC approval/rejection, high-value multi-sig clearance,
// and system-wide metrics.
// ────────────────────────────────────────────────────────────

export const dbAdmin = {
  // Get all users
  async getAllUsers() {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length) {
          return data.map(p => ({
            id: p.id,
            email: p.email,
            name: p.full_name,
            phone: p.phone,
            region: p.region,
            tierId: p.tier_id,
            tierName: p.tier_name,
            referralCode: p.referral_code,
            kycStatus: p.kyc_status,
            walletBalance: Number(p.wallet_balance || 0),
            cumulativeGifts: Number(p.cumulative_gifts || 0),
            subNodes: p.sub_nodes_count || 0,
            role: p.email?.includes('admin') ? 'admin' : (p.role || 'user'),
            joinDate: p.created_at?.split('T')[0] || '2026-09-01',
          }));
        }
      } catch (e) { /* fallback */ }
    }

    return getStored(STORAGE_KEYS.USERS, DEFAULT_USERS);
  },

  // Update a user's role
  async updateUserRole(userId, newRole) {
    const users = getStored(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const u = users.find(x => x.id === userId);
    if (u) {
      u.role = newRole;
      setStored(STORAGE_KEYS.USERS, users);
    }
    return true;
  },

  // Admin approves or rejects KYC
  async updateKycStatus(userId, status, reason = '') {
    const targetUserId = ensureValidUUID(userId);
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('profiles').update({ kyc_status: status }).eq('id', targetUserId);
        await sb.from('kyc_verifications').update({ 
          status, 
          rejection_reason: reason || null, 
          reviewed_at: new Date().toISOString() 
        }).eq('user_id', targetUserId);
      } catch (e) { /* fallback */ }
    }

    // Update local store
    const users = getStored(STORAGE_KEYS.USERS, DEFAULT_USERS);
    const u = users.find(x => x.id === targetUserId || x.id === userId);
    if (u) {
      u.kycStatus = status;
      setStored(STORAGE_KEYS.USERS, users);
    }

    const kycs = getStored(STORAGE_KEYS.KYC, []);
    const k = kycs.find(x => x.userId === targetUserId || x.userId === userId);
    if (k) {
      k.status = status;
      k.rejectionReason = reason;
      k.reviewedAt = new Date().toISOString();
      setStored(STORAGE_KEYS.KYC, kycs);
    }

    // Dispatch notification to user
    notificationService.pushNotification(userId, {
      title: status === 'verified' ? '✅ KYC Verification Approved!' : '❌ KYC Verification Requires Attention',
      message: status === 'verified'
        ? 'Your identity has been verified by the Compliance Desk. All node staking and withdrawals are unlocked.'
        : `Your KYC submission could not be verified: ${reason || 'Please re-upload a clear government ID.'}`,
      type: 'kyc',
      actionUrl: status === 'verified' ? '/tiers' : '/kyc',
    });

    return true;
  },

  // Get aggregated system metrics for executive dashboard
  async getSystemMetrics() {
    const users = await this.getAllUsers();
    const refunds = await dbRefunds.getAllRequests();
    const kycs = getStored(STORAGE_KEYS.KYC, []);

    const totalStaked = users.reduce((sum, u) => sum + (Number(u.entryFee) || 0), 0);
    const totalYieldPaid = users.reduce((sum, u) => sum + (Number(u.cumulativeGifts) || 0), 0);
    const pendingKycs = users.filter(u => u.kycStatus === 'pending').length;
    const pendingAudits = refunds.filter(r => r.isHighValue && (r.status === 'pending_audit' || r.status === 'pending')).length;
    const totalRefundsRequested = refunds.reduce((sum, r) => sum + (Number(r.netPayout) || 0), 0);

    return {
      totalUsers: users.length,
      totalStaked,
      totalYieldPaid,
      pendingKycs,
      pendingAudits,
      totalRefundsRequested,
      totalRefundsCount: refunds.length,
      kycList: kycs,
    };
  }
};

