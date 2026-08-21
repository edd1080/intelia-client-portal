import crypto from "node:crypto";
import { cookies } from "next/headers";
import { isEmailAuthorizedForSnapshotAccess } from "@/lib/portal-snapshots";

const CHALLENGE_COOKIE = "intelia_portal_challenge";
const SESSION_COOKIE = "intelia_portal_session";
const CHALLENGE_TTL_SECONDS = 10 * 60;
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const MAX_CODE_ATTEMPTS = 5;
const REQUEST_WINDOW_MS = 15 * 60 * 1000;
const REQUESTS_PER_EMAIL = 3;
const REQUESTS_PER_IP = 10;
const COOLDOWN_MS = 60 * 1000;

type RateLimitEntry = { count: number; resetAt: number };

type PortalGlobal = typeof globalThis & {
  __inteliaPortalRateLimits?: Map<string, RateLimitEntry>;
};

const portalGlobal = globalThis as PortalGlobal;
const rateLimits = portalGlobal.__inteliaPortalRateLimits ?? new Map<string, RateLimitEntry>();
portalGlobal.__inteliaPortalRateLimits = rateLimits;

type ChallengePayload = {
  token: string;
  email: string;
  codeHash: string;
  exp: number;
  attempts: number;
};

type SessionPayload = {
  token: string;
  email: string;
  exp: number;
};

function secret() {
  const value = process.env.PORTAL_SESSION_SECRET;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("Missing PORTAL_SESSION_SECRET in production");
  }
  return value || "dev-only-change-me-before-vercel";
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: object) {
  const body = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify<T>(value?: string): T | null {
  if (!value || !value.includes(".")) return null;
  try {
    const [body, sig] = value.split(".");
    const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
    const receivedBuffer = Buffer.from(sig);
    const expectedBuffer = Buffer.from(expected);
    if (receivedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T & { exp?: number };
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload as T;
  } catch {
    return null;
  }
}

function hashCode(token: string, email: string, code: string) {
  return crypto.createHmac("sha256", secret()).update(`${token}:${email}:${code}`).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function consumeRateLimit(key: string, limit: number) {
  const now = Date.now();
  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + REQUEST_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  }
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

async function sendCodeEmail(email: string, code: string) {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.PORTAL_FROM_EMAIL || "Intelia Portal <onboarding@resend.dev>";
  const subject = "Tu código de acceso al portal Intelia";
  const text = `Tu código de acceso es ${code}. Expira en 10 minutos.`;

  if (!resendKey) {
    if (process.env.NODE_ENV === "production") throw new Error("Missing RESEND_API_KEY in production");
    console.log(`[portal-auth] código temporal para ${email}: ${code}`);
    return { delivered: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: email,
      subject,
      text,
      html: `<div style="font-family:Inter,Arial,sans-serif"><p>Tu código de acceso es:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>Expira en 10 minutos. No compartas este código.</p></div>`,
    }),
  });

  if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
  return { delivered: true };
}

export async function isPortalSessionValid(token: string) {
  if (token === "demo") return true;
  const jar = await cookies();
  const payload = verify<SessionPayload>(jar.get(SESSION_COOKIE)?.value);
  return Boolean(payload && payload.token === token);
}

export async function requestPortalCode(token: string, emailInput: string, clientIp = "unknown") {
  const email = normalizeEmail(emailInput);
  const ok = isEmailAuthorizedForSnapshotAccess(token, email);
  if (!ok) {
    return { ok: true, sent: false };
  }

  const emailLimit = consumeRateLimit(`email:${token}:${email}`, REQUESTS_PER_EMAIL);
  const ipLimit = consumeRateLimit(`ip:${clientIp}`, REQUESTS_PER_IP);
  if (!emailLimit.allowed || !ipLimit.allowed) {
    return { ok: false, sent: false, rateLimited: true, retryAfter: Math.max(emailLimit.retryAfter, ipLimit.retryAfter) };
  }

  const jar = await cookies();
  const existing = verify<ChallengePayload>(jar.get(CHALLENGE_COOKIE)?.value);
  if (existing && existing.token === token && existing.email === email) {
    const age = Date.now() - (existing.exp - CHALLENGE_TTL_SECONDS * 1000);
    if (age < COOLDOWN_MS) {
      return { ok: false, sent: false, rateLimited: true, retryAfter: Math.ceil((COOLDOWN_MS - age) / 1000) };
    }
  }

  const code = String(crypto.randomInt(100000, 999999));
  const payload: ChallengePayload = {
    token,
    email,
    codeHash: hashCode(token, email, code),
    exp: Date.now() + CHALLENGE_TTL_SECONDS * 1000,
    attempts: 0,
  };

  jar.set(CHALLENGE_COOKIE, sign(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CHALLENGE_TTL_SECONDS,
  });

  await sendCodeEmail(email, code);
  return { ok: true, sent: true, devCode: process.env.NODE_ENV === "production" ? undefined : code };
}

export async function verifyPortalCode(token: string, codeInput: string) {
  const code = codeInput.trim();
  const jar = await cookies();
  const challenge = verify<ChallengePayload>(jar.get(CHALLENGE_COOKIE)?.value);
  if (!challenge || challenge.token !== token || challenge.attempts >= MAX_CODE_ATTEMPTS) {
    jar.delete(CHALLENGE_COOKIE);
    return false;
  }

  const codeHash = hashCode(challenge.token, challenge.email, code);
  const receivedHash = Buffer.from(codeHash);
  const expectedHash = Buffer.from(challenge.codeHash);
  if (receivedHash.length !== expectedHash.length || !crypto.timingSafeEqual(receivedHash, expectedHash)) {
    const attempts = challenge.attempts + 1;
    if (attempts >= MAX_CODE_ATTEMPTS) jar.delete(CHALLENGE_COOKIE);
    else jar.set(CHALLENGE_COOKIE, sign({ ...challenge, attempts }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: CHALLENGE_TTL_SECONDS,
    });
    return false;
  }

  const session: SessionPayload = { token, email: challenge.email, exp: Date.now() + SESSION_TTL_SECONDS * 1000 };
  jar.set(SESSION_COOKIE, sign(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  jar.delete(CHALLENGE_COOKIE);
  return true;
}
