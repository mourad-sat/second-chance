import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ message: "غير مصرح." }, { status: 401 });

  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: params.id },
    select: { profilePhotoPathname: true, profilePhotoUrl: true, archivedAt: true, deletedAt: true }
  });

  if (!beneficiary || beneficiary.deletedAt) {
    return NextResponse.json({ message: "الصورة غير متاحة." }, { status: 404 });
  }

  const pathname = beneficiary.profilePhotoPathname;
  if (!pathname) {
    return NextResponse.json({ message: "لا توجد صورة محفوظة." }, { status: 404 });
  }

  try {
    const result = await get(pathname, { access: "private" });
    if (!result) return NextResponse.json({ message: "تعذر العثور على الصورة." }, { status: 404 });

    return new Response(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || "image/jpeg",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    console.error("Failed to stream beneficiary profile photo", error);
    return NextResponse.json({ message: "تعذر تحميل الصورة." }, { status: 500 });
  }
}
