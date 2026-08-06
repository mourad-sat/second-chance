export const SESSION_COOKIE = "second_chance_session";

const DEVELOPMENT_SECRET = "second-chance-local-development-secret-change-me";
const MIN_SECRET_LENGTH = 32;

export type SessionPayload = {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
};

function secret() {
  const configured = process.env.AUTH_SECRET?.trim();

  if (process.env.NODE_ENV === "production") {
    if (!configured || configured.length < MIN_SECRET_LENGTH || configured === DEVELOPMENT_SECRET) {
      throw new Error(`AUTH_SECRET must be configured with at least ${MIN_SECRET_LENGTH} characters in production.`);
    }
    return configured;
  }

  return configured && configured.length >= MIN_SECRET_LENGTH ? configured : DEVELOPMENT_SECRET;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function signature(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<SessionPayload>;
  return typeof payload.userId === "string" && payload.userId.length > 0
    && typeof payload.fullName === "string" && payload.fullName.length > 0
    && typeof payload.email === "string" && payload.email.length > 0
    && typeof payload.role === "string" && payload.role.length > 0
    && typeof payload.iat === "number" && Number.isFinite(payload.iat)
    && typeof payload.exp === "number" && Number.isFinite(payload.exp);
}

export async function createSessionToken(payload: Omit<SessionPayload, "iat" | "exp">, maxAgeSeconds = 60 * 60 * 12) {
  const now = Math.floor(Date.now() / 1000);
  const safeMaxAge = Math.min(Math.max(Math.floor(maxAgeSeconds), 60), 60 * 60 * 24);
  const complete: SessionPayload = { ...payload, iat: now, exp: now + safeMaxAge };
  const encoded = toBase64Url(new TextEncoder().encode(JSON.stringify(complete)));
  const signed = toBase64Url(await signature(encoded));
  return `${encoded}.${signed}`;
}

export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
  try {
    if (!token || token.length > 4096) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [encoded, signed] = parts;
    if (!encoded || !signed) return null;

    const expected = await signature(encoded);
    const actual = fromBase64Url(signed);
    if (expected.length !== actual.length) return null;

    let mismatch = 0;
    for (let index = 0; index < expected.length; index += 1) mismatch |= expected[index] ^ actual[index];
    if (mismatch !== 0) return null;

    const parsed: unknown = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded)));
    if (!isSessionPayload(parsed)) return null;

    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp <= now || parsed.iat > now + 60 || parsed.exp - parsed.iat > 60 * 60 * 24) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isAdminRole(role: string) {
  return ["SUPER_ADMIN", "ASSOCIATION_MANAGER"].includes(role);
}
