import crypto from "node:crypto";
import { cookies } from "next/headers";
import { isEmailAuthorizedForSnapshotAccess } from "@/lib/portal-snapshots";

const CHALLENGE_COOKIE = "intelia_portal_challenge";
const SESSION_COOKIE = "intelia_portal_session";
const CHALLENGE_TTL_SECONDS = 10 * 60;
const SESSION_TTL_SECONDS = 8 * 60 * 60;

type ChallengePayload = {
  token: string;
  email: string;
  codeHash: string;
  exp: number;
};

type SessionPayload = {
  token: string;
  email: string;
  exp: number;
};

function secret() {
  return process.env.PORTAL_SESSION_SECRET || "dev-only-change-me-before-vercel";
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
  const [body, sig] = value.split(".");
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T & { exp?: number };
  if (payload.exp && payload.exp < Date.now()) return null;
  return payload as T;
}

function hashCode(token: string, email: string, code: string) {
  return crypto.createHmac("sha256", secret()).update(`${token}:${email}:${code}`).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function isPortalSessionValid(token: string) {
  if (token === "demo") return true;
  const jar = await cookies();
  const payload = verify<SessionPayload>(jar.get(SESSION_COOKIE)?.value);
  return Boolean(payload && payload.token === token);
}

async function sendCodeEmail(email: string, code: string) {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.PORTAL_FROM_EMAIL || "Intelia Portal <onboarding@resend.dev>";
  const subject = "Tu código de acceso al portal Intelia";
  const text = `Tu código de acceso es ${code}. Expira en 10 minutos.`;

  if (!resendKey) {
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
      html: `<div style="font-family:Inter,Arial,sans-serif"><p>Tu código de acceso es:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>Expira en 10 minutos.</p></div>`,
    }),
  });

  if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
  return { delivered: true };
}

export async function requestPortalCode(token: string, emailInput: string) {
  const email = normalizeEmail(emailInput);
  const ok = isEmailAuthorizedForSnapshotAccess(token, email);
  if (!ok) {
    // Generic response so a visitor cannot enumerate valid emails.
    return { ok: true, sent: false };
  }

  const code = String(crypto.randomInt(100000, 999999));
  const payload: ChallengePayload = {
    token,
    email,
    codeHash: hashCode(token, email, code),
    exp: Date.now() + CHALLENGE_TTL_SECONDS * 1000,
  };

  const jar = await cookies();
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
  if (!challenge || challenge.token !== token) return false;

  const codeHash = hashCode(challenge.token, challenge.email, code);
  if (!crypto.timingSafeEqual(Buffer.from(codeHash), Buffer.from(challenge.codeHash))) return false;

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
