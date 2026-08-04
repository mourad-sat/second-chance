import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const allowedRoles = Object.values(UserRole);

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ message: "غير مسموح بإدارة المستخدمين." }, { status: 403 });

    const body = await request.json();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const centerName = String(body.centerName || "").trim() || null;
    const role = allowedRoles.includes(body.role) ? body.role as UserRole : UserRole.VIEWER;

    if (!fullName || !email || password.length < 8) {
      return NextResponse.json({ message: "الاسم والبريد وكلمة مرور من 8 أحرف على الأقل إلزامية." }, { status: 400 });
    }
    if (await prisma.user.findUnique({ where: { email } })) {
      return NextResponse.json({ message: "هذا البريد مستخدم مسبقًا." }, { status: 409 });
    }

    const safeRole = role === UserRole.SUPER_ADMIN ? UserRole.ASSOCIATION_MANAGER : role;
    const user = await prisma.user.create({
      data: { fullName, email, passwordHash: hashPassword(password), role: safeRole, centerName }
    });
    await prisma.auditLog.create({
      data: { userId: session.userId, action: "USER_CREATED", entityType: "User", entityId: user.id, description: `إنشاء حساب ${user.fullName}` }
    });
    return NextResponse.json({ id: user.id, role: user.role }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر إنشاء المستخدم." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ message: "غير مسموح بإدارة المستخدمين." }, { status: 403 });

    const body = await request.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ message: "المستخدم غير محدد." }, { status: 400 });

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ message: "المستخدم غير موجود." }, { status: 404 });
    if (target.role === UserRole.SUPER_ADMIN && target.id !== session.userId) {
      return NextResponse.json({ message: "لا يمكن تعديل حساب مدير النظام الأعلى." }, { status: 403 });
    }

    const data: { isActive?: boolean; role?: UserRole; centerName?: string | null } = {};
    if (typeof body.isActive === "boolean" && id !== session.userId) data.isActive = body.isActive;
    if (allowedRoles.includes(body.role) && body.role !== UserRole.SUPER_ADMIN && target.role !== UserRole.SUPER_ADMIN) data.role = body.role;
    if (body.centerName !== undefined) data.centerName = String(body.centerName || "").trim() || null;

    const user = await prisma.user.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: { userId: session.userId, action: "USER_UPDATED", entityType: "User", entityId: user.id, description: `تحديث حساب ${user.fullName}` }
    });
    return NextResponse.json({ id: user.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر تحديث المستخدم." }, { status: 500 });
  }
}
