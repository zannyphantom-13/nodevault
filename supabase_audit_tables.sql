-- ============================================================
-- NodeVault 10/10 Security — Audit & Monitoring Tables
-- Run this in Supabase SQL Editor AFTER supabase_security_hardening.sql
-- ============================================================

-- ── 1. Security Audit Log (Immutable server-side event trail) ──────────────────
-- Once a row is inserted, it CANNOT be updated or deleted by any client.
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT NOT NULL,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address    TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disable row updates and deletes on audit log — forensic integrity
CREATE OR REPLACE RULE audit_no_update AS ON UPDATE TO public.security_audit_log DO INSTEAD NOTHING;
CREATE OR REPLACE RULE audit_no_delete AS ON DELETE TO public.security_audit_log DO INSTEAD NOTHING;

-- RLS: users cannot read audit log (server only via service role key)
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_no_client_access" ON public.security_audit_log
  FOR ALL USING (false);

-- Index for fast admin queries
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_type ON public.security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON public.security_audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.security_audit_log(created_at DESC);

-- ── 2. IP Blocklist (Persistent ban list, survives Edge Function restarts) ─────
CREATE TABLE IF NOT EXISTS public.ip_blocklist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address  TEXT UNIQUE NOT NULL,
  reason      TEXT,
  banned_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ -- NULL = permanent ban
);

ALTER TABLE public.ip_blocklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocklist_no_client_access" ON public.ip_blocklist
  FOR ALL USING (false);

-- ── 3. Session Tokens (Track active sessions for force-logout capability) ──────
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  last_seen   TIMESTAMPTZ DEFAULT NOW(),
  is_active   BOOLEAN DEFAULT TRUE
);

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
-- Users can only see their own sessions (for logout UI)
CREATE POLICY "sessions_own_only" ON public.active_sessions
  FOR SELECT USING (auth.uid() = user_id);
-- Only server can insert/update/delete session records
CREATE POLICY "sessions_server_write" ON public.active_sessions
  FOR ALL USING (false);

-- ── 4. Financial Operations Log (Tamper-evident ledger) ───────────────────────
-- Every financial action is written here by server-side triggers/procedures.
-- Clients CANNOT insert, update, or delete these records.
CREATE TABLE IF NOT EXISTS public.financial_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  operation_type  TEXT NOT NULL, -- 'deposit', 'withdrawal', 'refund', 'penalty', 'fee'
  amount          NUMERIC(15, 2) NOT NULL,
  balance_before  NUMERIC(15, 2),
  balance_after   NUMERIC(15, 2),
  reference_id    TEXT,          -- transaction or refund ID
  computed_by     TEXT DEFAULT 'server', -- who computed this: 'server' always
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable ledger: no client updates or deletes
CREATE OR REPLACE RULE ledger_no_update AS ON UPDATE TO public.financial_ledger DO INSTEAD NOTHING;
CREATE OR REPLACE RULE ledger_no_delete AS ON DELETE TO public.financial_ledger DO INSTEAD NOTHING;

ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;
-- Users can see their own ledger (for transparency)
CREATE POLICY "ledger_read_own" ON public.financial_ledger
  FOR SELECT USING (auth.uid() = user_id);
-- Nobody can insert from client (only via SECURITY DEFINER functions)
CREATE POLICY "ledger_no_client_insert" ON public.financial_ledger
  FOR INSERT WITH CHECK (false);

-- ── 5. Suspicious Activity Scorer (Auto-triggers review for high-risk events) ──
CREATE OR REPLACE FUNCTION public.score_security_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_score INT := 0;
BEGIN
  -- Score by event type
  CASE NEW.event_type
    WHEN 'PRIVILEGE_ESCALATION_ATTEMPT' THEN v_score := 100;
    WHEN 'IP_BANNED'                    THEN v_score := 80;
    WHEN 'STORAGE_TAMPERING_DETECTED'   THEN v_score := 90;
    WHEN 'REFUND_FAILED'                THEN v_score := 30;
    WHEN 'HANDLER_ERROR'                THEN v_score := 20;
    ELSE v_score := 5;
  END CASE;

  -- High score → flag user account for review
  IF v_score >= 80 AND NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET metadata = COALESCE(metadata, '{}') || jsonb_build_object(
      'flagged_for_review', true,
      'flag_reason', NEW.event_type,
      'flagged_at', NOW()
    )
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_score_security_event ON public.security_audit_log;
CREATE TRIGGER trg_score_security_event
  AFTER INSERT ON public.security_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.score_security_event();

-- ── 6. Add metadata column to profiles if not exists ──────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ── 7. Database Network Restriction Notice ─────────────────────────────────────
-- ACTION REQUIRED: In Supabase Dashboard > Settings > Database
-- Under "Network Restrictions", add ONLY Supabase's own IP ranges.
-- This prevents direct psql connections from unknown IPs.
-- Supabase IP ranges: https://supabase.com/docs/guides/platform/network-restrictions

-- ── 8. Confirm setup ───────────────────────────────────────────────────────────
SELECT
  'security_audit_log' AS table_name,
  COUNT(*) AS rows
FROM public.security_audit_log
UNION ALL
SELECT 'ip_blocklist', COUNT(*) FROM public.ip_blocklist
UNION ALL
SELECT 'financial_ledger', COUNT(*) FROM public.financial_ledger;
