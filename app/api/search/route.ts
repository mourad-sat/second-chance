import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ message: "غير مصادق." }, { status: 401 });

  const query = (request.nextUrl.searchParams.get("q") || "").trim().slice(0, 80);
  if (query.length < 2) return NextResponse.json({ beneficiaries: [], groups: [] });

  const [beneficiaries, groups] = await Promise.all([
    prisma.beneficiary.findMany({
      where: {
        archivedAt: null,
        deletedAt: null,
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { registrationNumber: { contains: query, mode: "insensitive" } },
          { masarNumber: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } }
        ]
      },
      select: { id: true, firstName: true, lastName: true, registrationNumber: true, masarNumber: true, status: true },
      orderBy: { updatedAt: "desc" },
      take: 8
    }),
    prisma.learningGroup.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { track: { contains: query, mode: "insensitive" } },
          { specialty: { contains: query, mode: "insensitive" } },
          { academicYear: { contains: query, mode: "insensitive" } }
        ]
      },
      select: { id: true, name: true, academicYear: true, track: true, specialty: true },
      orderBy: { name: "asc" },
      take: 6
    })
  ]);

  return NextResponse.json({
    beneficiaries: beneficiaries.map((item) => ({
      href: `/beneficiaries/${item.id}`,
      label: `${item.firstName} ${item.lastName}`,
      description: [item.registrationNumber, item.masarNumber, item.status].filter(Boolean).join(" · ")
    })),
    groups: groups.map((item) => ({
      href: "/attendance",
      label: item.name,
      description: [item.academicYear, item.specialty || item.track].filter(Boolean).join(" · ")
    }))
  });
}
