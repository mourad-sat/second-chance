import { FollowUpPriority, FollowUpStatus, SocialFollowUpType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const clean = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export async function GET() {
  const records = await prisma.socialFollowUp.findMany({
    include: { beneficiary: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: [{ priority: "desc" }, { eventDate: "desc" }],
    take: 200
  });
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.beneficiaryId || !body.subject || !body.eventDate) {
      return NextResponse.json({ message: "المستفيد والموضوع والتاريخ إلزامية." }, { status: 400 });
    }

    const record = await prisma.socialFollowUp.create({
      data: {
        beneficiaryId: body.beneficiaryId,
        type: Object.values(SocialFollowUpType).includes(body.type) ? body.type : SocialFollowUpType.INDIVIDUAL_INTERVIEW,
        priority: Object.values(FollowUpPriority).includes(body.priority) ? body.priority : FollowUpPriority.NORMAL,
        status: Object.values(FollowUpStatus).includes(body.status) ? body.status : FollowUpStatus.OPEN,
        eventDate: new Date(body.eventDate),
        responsibleName: clean(body.responsibleName),
        subject: body.subject.trim(),
        details: clean(body.details),
        actionsTaken: clean(body.actionsTaken),
        partnerName: clean(body.partnerName),
        referralReason: clean(body.referralReason),
        nextAction: clean(body.nextAction),
        nextFollowUpDate: body.nextFollowUpDate ? new Date(body.nextFollowUpDate) : null,
        outcome: clean(body.outcome),
        confidentialityNote: clean(body.confidentialityNote)
      }
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر حفظ سجل المواكبة." }, { status: 500 });
  }
}