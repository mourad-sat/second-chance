import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ message: "البريد الإلكتروني وكلمة المرور إلزاميان." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ message: "بيانات الدخول غير صحيحة أو الحساب غير نشط." }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await prisma.auditLog.create({
      data: { userId: user.id, action: "LOGIN", entityType: "Session", description: `تسجيل دخول ${user.fullName}` }
    });

    const response = NextResponse.json({ ok: true, role: user.role });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر تسجيل الدخول." }, { status: 500 });
  }
}
