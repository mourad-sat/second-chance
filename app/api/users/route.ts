import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const allowedRoles = Object.values(UserRole);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const centerName = String(body.centerName || "").trim() || null;
    const role = allowedRoles.includes(body.role) ? body.role as UserRole : UserRole.VIEWER;

    if (!fullName || !email || password.length < 8) {
      return NextResponse.json({ message: "الاسم والبريد وكلمة مرور من 8 أحرف على الأقل إلزامية." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ message: "هذا البريد مستخدم مسبقًا." }, { status: 409 });

    const userCount = await prisma.user.count();
    const safeRole = userCount === 0 ? UserRole.SUPER_ADMIN : role === UserRole.SUPER_ADMIN ? UserRole.ASSOCIATION_MANAGER : role;

    const user = await prisma.user.create({
      data: { fullName, email, passwordHash: hashPassword(password), role: safeRole, centerName }
    });

    await prisma.auditLog.create({
      data: { userId: user.id, action: userCount === 0 ? "INITIAL_ADMIN_CREATED" : "USER_CREATED", entityType: "User", entityId: user.id, description: `إنشاء حساب ${user.fullName}` }
    });

    return NextResponse.json({ id: user.id, role: user.role }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر إنشاء المستخدم." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ message: "المستخدم غير محدد." }, { status: 400 });

    const data: { isActive?: boolean; role?: UserRole; centerName?: string | null } = {};
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (allowedRoles.includes(body.role) && body.role !== UserRole.SUPER_ADMIN) data.role = body.role;
    if (body.centerName !== undefined) data.centerName = String(body.centerName || "").trim() || null;

    const user = await prisma.user.update({ where: { id }, data });
    await prisma.auditLog.create({ data: { action: "USER_UPDATED", entityType: "User", entityId: user.id, description: `تحديث حساب ${user.fullName}` } });
    return NextResponse.json({ id: user.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر تحديث المستخدم." }, { status: 500 });
  }
}
