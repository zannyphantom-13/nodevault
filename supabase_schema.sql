-- ============================================================================
-- NodeVault Protocol — Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    region TEXT DEFAULT 'NG' CHECK (region IN ('NG', 'US')),
    tier_id INTEGER DEFAULT 1,
    tier_name TEXT DEFAULT 'Micro Node',
    referral_code TEXT UNIQUE NOT NULL,
    referred_by TEXT,
    kyc_status TEXT DEFAULT 'unverified' CHECK (kyc_status IN ('unverified', 'pending', 'verified', 'rejected')),
    wallet_balance NUMERIC(14, 2) DEFAULT 0.00,
    cumulative_gifts NUMERIC(14, 2) DEFAULT 0.00,
    sub_nodes_count INTEGER DEFAULT 0,
    compute_credits INTEGER DEFAULT 0,
    power_units INTEGER DEFAULT 0,
    mined_nvt NUMERIC(16, 6) DEFAULT 0.000000,
    server_model TEXT DEFAULT 'Public Shared Server (Community)',
    is_graduate BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist for existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS entry_fee NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS compute_credits INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS power_units INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mined_nvt NUMERIC(16, 6) DEFAULT 0.000000;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS server_model TEXT DEFAULT 'Public Shared Server (Community)';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_graduate BOOLEAN DEFAULT false;


-- 3. KYC Verifications Table
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    id_type TEXT NOT NULL CHECK (id_type IN ('nin', 'bvn', 'passport', 'drivers_license', 'voter_card', 'ssn')),
    id_number TEXT NOT NULL,
    dob DATE,
    address TEXT,
    state TEXT,
    country TEXT DEFAULT 'Nigeria',
    id_front_url TEXT,
    id_back_url TEXT,
    selfie_url TEXT,
    proof_of_address_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    rejection_reason TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bank Accounts & Payout Destinations
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    bank_code TEXT,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT false,
    crypto_wallet TEXT,
    crypto_network TEXT DEFAULT 'TRC20',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Account Document & Deposit Proof Uploads
CREATE TABLE IF NOT EXISTS public.account_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('bank_statement', 'deposit_slip', 'payment_receipt', 'tax_cert', 'other')),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Transactions & Node Staking Log
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('staking', 'dividend', 'yield', 'gift', 'refund', 'fee')),
    gross_amount NUMERIC(14, 2) NOT NULL,
    gateway_fee NUMERIC(14, 2) DEFAULT 0.00,
    opex_fee NUMERIC(14, 2) DEFAULT 0.00,
    vat_fee NUMERIC(14, 2) DEFAULT 0.00,
    emtl_levy NUMERIC(14, 2) DEFAULT 0.00,
    net_amount NUMERIC(14, 2) NOT NULL,
    gateway TEXT DEFAULT 'paystack' CHECK (gateway IN ('paystack', 'monnify', 'bank_transfer', 'usdt')),
    reference TEXT UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Capital Protection & Refund Claims
CREATE TABLE IF NOT EXISTS public.refund_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier_id INTEGER NOT NULL,
    entry_fee NUMERIC(14, 2) NOT NULL,
    cumulative_gifts NUMERIC(14, 2) NOT NULL,
    eligibility_tier TEXT NOT NULL CHECK (eligibility_tier IN ('A', 'B', 'C', 'Locked')),
    gross_refund NUMERIC(14, 2) NOT NULL,
    early_penalty NUMERIC(14, 2) DEFAULT 0.00,
    outbound_fee NUMERIC(14, 2) DEFAULT 0.00,
    net_payout NUMERIC(14, 2) NOT NULL,
    scheduled_disbursement_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disbursed', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Row Level Security (RLS) Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- 9. Basic Policies (Allow Public / Authenticated read/write for protocol operation)
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles self insert" ON public.profiles;
CREATE POLICY "Profiles self insert" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Profiles self update" ON public.profiles;
CREATE POLICY "Profiles self update" ON public.profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "KYC read" ON public.kyc_verifications;
CREATE POLICY "KYC read" ON public.kyc_verifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "KYC insert" ON public.kyc_verifications;
CREATE POLICY "KYC insert" ON public.kyc_verifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "KYC update" ON public.kyc_verifications;
CREATE POLICY "KYC update" ON public.kyc_verifications FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Bank read" ON public.bank_accounts;
CREATE POLICY "Bank read" ON public.bank_accounts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Bank insert" ON public.bank_accounts;
CREATE POLICY "Bank insert" ON public.bank_accounts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Bank update" ON public.bank_accounts;
CREATE POLICY "Bank update" ON public.bank_accounts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Documents read" ON public.account_documents;
CREATE POLICY "Documents read" ON public.account_documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Documents insert" ON public.account_documents;
CREATE POLICY "Documents insert" ON public.account_documents FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Transactions read" ON public.transactions;
CREATE POLICY "Transactions read" ON public.transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Transactions insert" ON public.transactions;
CREATE POLICY "Transactions insert" ON public.transactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Refunds read" ON public.refund_requests;
CREATE POLICY "Refunds read" ON public.refund_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Refunds insert" ON public.refund_requests;
CREATE POLICY "Refunds insert" ON public.refund_requests FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON public.kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_user_id ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_user_id ON public.transactions(user_id);
