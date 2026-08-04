import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function GET() {
  const session = await verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ message: "غير مصادق." }, { status: 401 });
  return NextResponse.json({
    userId: session.userId,
    fullName: session.fullName,
    email: session.email,
    role: session.role
  });
}
