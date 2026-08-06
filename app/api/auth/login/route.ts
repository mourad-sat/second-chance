import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

const SESSION_MAX_AGE = 60 * 60 * 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ message: "البريد الإلكتروني وكلمة المرور إلزاميان." }, { status: 400 });
    }
    if (email.length > 254 || !EMAIL_PATTERN.test(email) || password.length > 256) {
      return NextResponse.json({ message: "بيانات الدخول غير صحيحة أو الحساب غير نشط." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        passwordHash: true
      }
    });

    if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { message: "بيانات الدخول غير صحيحة أو الحساب غير نشط." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    }, SESSION_MAX_AGE);

    const now = new Date();
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: now } }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "LOGIN",
          entityType: "Session",
          entityId: user.id,
          description: `تسجيل دخول ${user.fullName} (${user.role})`
        }
      })
    ]);

    const response = NextResponse.json(
      { ok: true, role: user.role },
      { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } }
    );
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
      priority: "high"
    });
    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json(
      { message: "تعذر تسجيل الدخول." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
