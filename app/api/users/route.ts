import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const allowedRoles = new Set<UserRole>(Object.values(UserRole));
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseRole(value: unknown): UserRole | null {
  return typeof value === "string" && allowedRoles.has(value as UserRole) ? (value as UserRole) : null;
}

function canAssignRole(actorRole: string, role: UserRole) {
  if (role === UserRole.SUPER_ADMIN) return false;
  if (role === UserRole.ASSOCIATION_MANAGER) return actorRole === UserRole.SUPER_ADMIN;
  return actorRole === UserRole.SUPER_ADMIN || actorRole === UserRole.ASSOCIATION_MANAGER;
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ message: "غير مسموح بإدارة المستخدمين." }, { status: 403 });

    const body = await request.json();
    const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
    const password = typeof body.password === "string" ? body.password : "";
    const centerName = typeof body.centerName === "string" ? body.centerName.trim().slice(0, 160) || null : null;
    const requestedRole = parseRole(body.role) || UserRole.VIEWER;

    if (!fullName || !emailPattern.test(email) || password.length < 8 || password.length > 128) {
      return NextResponse.json({ message: "تحقق من الاسم والبريد وكلمة المرور (8 إلى 128 حرفًا)." }, { status: 400 });
    }
    if (!canAssignRole(session.role, requestedRole)) {
      return NextResponse.json({ message: "ليست لديك صلاحية لإسناد هذا الدور." }, { status: 403 });
    }
    if (await prisma.user.findUnique({ where: { email } })) {
      return NextResponse.json({ message: "هذا البريد مستخدم مسبقًا." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: { fullName, email, passwordHash: hashPassword(password), role: requestedRole, centerName }
    });
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "USER_CREATED",
        entityType: "User",
        entityId: user.id,
        description: `إنشاء حساب ${user.fullName} بدور ${user.role}`
      }
    });
    return NextResponse.json({ id: user.id, role: user.role }, { status: 201 });
  } catch (error) {
    console.error("Create user failed", error);
    return NextResponse.json({ message: "تعذر إنشاء المستخدم." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ message: "غير مسموح بإدارة المستخدمين." }, { status: 403 });

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return NextResponse.json({ message: "المستخدم غير محدد." }, { status: 400 });

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ message: "المستخدم غير موجود." }, { status: 404 });
    if (target.role === UserRole.SUPER_ADMIN && target.id !== session.userId) {
      return NextResponse.json({ message: "لا يمكن تعديل حساب مدير النظام الأعلى." }, { status: 403 });
    }
    if (session.role !== UserRole.SUPER_ADMIN && target.role === UserRole.ASSOCIATION_MANAGER) {
      return NextResponse.json({ message: "مدير النظام فقط يمكنه تعديل حساب مدير جمعية." }, { status: 403 });
    }

    const data: { isActive?: boolean; role?: UserRole; centerName?: string | null } = {};
    if (typeof body.isActive === "boolean") {
      if (id === session.userId && body.isActive === false) {
        return NextResponse.json({ message: "لا يمكنك تعطيل حسابك الحالي." }, { status: 400 });
      }
      data.isActive = body.isActive;
    }

    if (body.role !== undefined) {
      const requestedRole = parseRole(body.role);
      if (!requestedRole) return NextResponse.json({ message: "الدور المحدد غير صالح." }, { status: 400 });
      if (id === session.userId && requestedRole !== target.role) {
        return NextResponse.json({ message: "لا يمكنك تغيير دور حسابك الحالي." }, { status: 400 });
      }
      if (!canAssignRole(session.role, requestedRole)) {
        return NextResponse.json({ message: "ليست لديك صلاحية لإسناد هذا الدور." }, { status: 403 });
      }
      data.role = requestedRole;
    }

    if (body.centerName !== undefined) {
      data.centerName = typeof body.centerName === "string" ? body.centerName.trim().slice(0, 160) || null : null;
    }
    if (!Object.keys(data).length) return NextResponse.json({ message: "لا توجد تغييرات صالحة للحفظ." }, { status: 400 });

    const user = await prisma.user.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "USER_UPDATED",
        entityType: "User",
        entityId: user.id,
        description: `تحديث حساب ${user.fullName} بدور ${user.role}`
      }
    });
    return NextResponse.json({ id: user.id, role: user.role, isActive: user.isActive });
  } catch (error) {
    console.error("Update user failed", error);
    return NextResponse.json({ message: "تعذر تحديث المستخدم." }, { status: 500 });
  }
}
