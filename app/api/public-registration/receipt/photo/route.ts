import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const registrationNumber = request.nextUrl.searchParams.get("registrationNumber")?.trim().toUpperCase();
  const masarNumber = request.nextUrl.searchParams.get("masarNumber")?.trim().toUpperCase();

  if (!registrationNumber || !masarNumber) {
    return new NextResponse("Missing parameters", { status: 400 });
  }

  const beneficiary = await prisma.beneficiary.findFirst({
    where: { registrationNumber, masarNumber },
    select: { profilePhotoPathname: true }
  });

  if (!beneficiary?.profilePhotoPathname) {
    return new NextResponse("Not found", { status: 404 });
  }

  const result = await get(beneficiary.profilePhotoPathname, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType || "image/jpeg",
      "Cache-Control": "private, no-cache",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
