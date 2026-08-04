export const SESSION_COOKIE = "second_chance_session";

export type SessionPayload = {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  exp: number;
};

function secret() {
  return process.env.AUTH_SECRET || "change-this-development-auth-secret";
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

export async function createSessionToken(payload: Omit<SessionPayload, "exp">, maxAgeSeconds = 60 * 60 * 12) {
  const complete: SessionPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + maxAgeSeconds };
  const encoded = toBase64Url(new TextEncoder().encode(JSON.stringify(complete)));
  const signed = toBase64Url(await signature(encoded));
  return `${encoded}.${signed}`;
}

export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
  try {
    if (!token) return null;
    const [encoded, signed] = token.split(".");
    if (!encoded || !signed) return null;
    const expected = await signature(encoded);
    const actual = fromBase64Url(signed);
    if (expected.length !== actual.length) return null;
    let mismatch = 0;
    for (let index = 0; index < expected.length; index += 1) mismatch |= expected[index] ^ actual[index];
    if (mismatch !== 0) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as SessionPayload;
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isAdminRole(role: string) {
  return ["SUPER_ADMIN", "ASSOCIATION_MANAGER"].includes(role);
}
