import { NextRequest, NextResponse } from "next/server";
import { canAccessPath } from "@/lib/permissions";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const publicPaths = [
  "/login",
  "/setup",
  "/register",
  "/registration-receipt",
  "/application-status",
  "/verify",
  "/branding",
  "/api/auth/login",
  "/api/auth/setup",
  "/api/public-registration"
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "يجب تسجيل الدخول أولًا." }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessPath(session.role, pathname, request.method)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "ليست لديك صلاحية لتنفيذ هذه العملية." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
