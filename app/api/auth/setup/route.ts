import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return NextResponse.json({ message: "تم إنشاء المدير الأول مسبقًا." }, { status: 409 });
    }

    const body = await request.json();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!fullName || !email || password.length < 8) {
      return NextResponse.json({ message: "الاسم والبريد وكلمة مرور من 8 أحرف على الأقل إلزامية." }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: { fullName, email, passwordHash: hashPassword(password), role: "SUPER_ADMIN" }
    });

    await prisma.auditLog.create({
      data: { userId: user.id, action: "INITIAL_ADMIN_CREATED", entityType: "User", entityId: user.id, description: `إنشاء المدير الأول ${user.fullName}` }
    });

    const token = await createSessionToken({ userId: user.id, fullName: user.fullName, email: user.email, role: user.role });
    const response = NextResponse.json({ ok: true });
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
    return NextResponse.json({ message: "تعذر إنشاء المدير الأول." }, { status: 500 });
  }
}
