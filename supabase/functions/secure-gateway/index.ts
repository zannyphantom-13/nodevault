// NodeVault Secure API Gateway — Supabase Edge Function
// Acts as hardened middleware between browser and database.
// Browser NEVER touches sensitive DB tables directly.
//
// Security layers:
//   1. IP-based rate limiting + auto-ban
//   2. HMAC-signed request verification (replay attack prevention)
//   3. JWT session validation (Supabase Auth)
//   4. Server-side input sanitization
//   5. Privilege escalation blocking (financial fields locked)
//   6. Immutable audit trail
//   7. Anti-enumeration (identical error responses)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GATEWAY_HMAC_SECRET = Deno.env.get("GATEWAY_HMAC_SECRET")!;
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

// Rate limiter store (resets on cold start)
const ipMap = new Map();
const RATE_LIMIT = 60;
const RATE_WINDOW = 60_000;
const BAN_THRESHOLD = 200;

function getIP(req) {
  return req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
}

function checkRate(ip) {
  const now = Date.now();
  const r = ipMap.get(ip);
  if (!r) { ipMap.set(ip, { count: 1, start: now, banned: false }); return { ok: true }; }
  if (now - r.start > RATE_WINDOW) { ipMap.set(ip, { count: 1, start: now, banned: false }); return { ok: true }; }
  if (r.banned || r.count >= BAN_THRESHOLD) { r.banned = true; return { ok: false, banned: true }; }
  r.count++;
  return { ok: r.count <= RATE_LIMIT };
}

function hexToBytes(hex) {
  const b = new Uint8Array(hex.length / 2);
  for (let i = 0; i < b.length; i++) b[i] = parseInt(hex.slice(i*2, i*2+2), 16);
  return b;
}

async function verifySig(body, ts, sig) {
  try {
    const t = parseInt(ts, 10);
    if (isNaN(t) || Date.now() - t > 300_000) return false; // 5min replay window
    const msg = `${ts}.${body}`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(GATEWAY_HMAC_SECRET),
      { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    return await crypto.subtle.verify("HMAC", key, hexToBytes(sig), enc.encode(msg));
  } catch { return false; }
}

function sanitize(v, max = 500) {
  if (typeof v !== "string") return "";
  return v.slice(0, max)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

const CORS = (origin) => ({
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN === "*" ? "*" : (origin || ALLOWED_ORIGIN),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-nv-timestamp, x-nv-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cache-Control": "no-store",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
});

const json = (d, s, o) => new Response(JSON.stringify(d), {
  status: s || 200,
  headers: { ...CORS(o), "Content-Type": "application/json" }
});

const denied = (o) => json({ error: "Request could not be processed." }, 403, o);

async function audit(sb, ev) {
  try {
    await sb.from("security_audit_log").insert([{
      event_type: ev.type,
      user_id: ev.userId || null,
      ip_address: ev.ip,
      metadata: ev,
      created_at: new Date().toISOString(),
    }]);
  } catch(e) { console.error("audit fail", e); }
}

// ── Route Handlers ────────────────────────────────────────────────────────────

async function doRefund(userId, sb, ip) {
  const { data, error } = await sb.rpc("request_capital_refund_secure", { p_user_id: userId });
  if (error) { await audit(sb, { type: "REFUND_FAILED", userId, ip, error: error.message }); throw new Error(error.message); }
  await audit(sb, { type: "REFUND_SUCCESS", userId, ip, data });
  return data;
}

async function doKYC(body, userId, sb, ip) {
  const idType = sanitize(body.idType, 20);
  const idNumber = sanitize(body.idNumber, 50);
  const address = sanitize(body.address, 300);
  if (!idType || !idNumber || !address) throw new Error("INVALID_INPUT");
  const { error } = await sb.from("kyc_verifications").upsert([{
    user_id: userId, id_type: idType, id_number: idNumber,
    address, state: sanitize(body.state, 50), country: sanitize(body.country, 50),
    status: "pending", submitted_at: new Date().toISOString()
  }]);
  if (error) throw new Error(error.message);
  await audit(sb, { type: "KYC_SUBMITTED", userId, ip });
  return { success: true };
}

async function doProfileUpdate(body, userId, sb, ip) {
  const BLOCKED = ["wallet_balance","cumulative_gifts","role","kyc_status","tier_id","entry_fee"];
  for (const f of BLOCKED) {
    if (f in body) {
      await audit(sb, { type: "PRIVILEGE_ESCALATION_ATTEMPT", userId, ip, field: f, severity: "CRITICAL" });
      throw new Error("FORBIDDEN_FIELD");
    }
  }
  const safe = {};
  if (body.phone) safe.phone = sanitize(body.phone, 20);
  if (body.region) safe.region = sanitize(body.region, 5);
  if (!Object.keys(safe).length) throw new Error("NO_VALID_FIELDS");
  const { error } = await sb.from("profiles").update(safe).eq("id", userId);
  if (error) throw new Error(error.message);
  await audit(sb, { type: "PROFILE_UPDATED", userId, ip, fields: Object.keys(safe) });
  return { success: true };
}

// ── Main ──────────────────────────────────────────────────────────────────────

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS(origin) });
  if (req.method !== "POST") return denied(origin);

  const ip = getIP(req);
  const rate = checkRate(ip);
  if (!rate.ok) {
    if (rate.banned) {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await audit(sb, { type: "IP_BANNED", ip, severity: "HIGH" });
    }
    return new Response("Too Many Requests", { status: 429, headers: { ...CORS(origin), "Retry-After": "60" } });
  }

  const ts = req.headers.get("x-nv-timestamp") || "";
  const sig = req.headers.get("x-nv-signature") || "";
  let bodyText;
  try { bodyText = await req.text(); } catch { return denied(origin); }

  if (!await verifySig(bodyText, ts, sig)) return denied(origin);

  let body;
  try { body = JSON.parse(bodyText); } catch { return denied(origin); }

  const auth = req.headers.get("authorization") || "";
  const jwt = auth.replace("Bearer ", "").trim();
  if (!jwt) return denied(origin);

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error: authErr } = await sb.auth.getUser(jwt);
  if (authErr || !user) return denied(origin);

  const userId = user.id;
  const action = sanitize(body.action, 50);

  try {
    let result;
    if (action === "refund_request") result = await doRefund(userId, sb, ip);
    else if (action === "kyc_submit") result = await doKYC(body, userId, sb, ip);
    else if (action === "profile_update") result = await doProfileUpdate(body, userId, sb, ip);
    else return denied(origin);
    return json({ success: true, data: result }, 200, origin);
  } catch (err) {
    await audit(sb, { type: "HANDLER_ERROR", userId, ip, action, error: err?.message });
    return json({ error: "Request could not be completed." }, 400, origin);
  }
});
