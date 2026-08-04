import { cookies } from "next/headers";
import { SESSION_COOKIE, isAdminRole, verifySessionToken } from "@/lib/session";

export async function currentSession() {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}

export async function requireAdmin() {
  const session = await currentSession();
  return session && isAdminRole(session.role) ? session : null;
}
