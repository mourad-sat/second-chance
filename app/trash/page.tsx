import { AppShell } from "@/components/AppShell";
import { BeneficiaryLifecycleManager } from "@/components/BeneficiaryLifecycleManager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      registrationNumber: true,
      masarNumber: true,
      profilePhotoUrl: true,
      status: true,
      deletedAt: true,
      deletedReason: true,
      deletedByName: true
    }
  });

  return <AppShell><BeneficiaryLifecycleManager mode="trash" items={beneficiaries.map((item) => ({ id: item.id, firstName: item.firstName, lastName: item.lastName, registrationNumber: item.registrationNumber, masarNumber: item.masarNumber, profilePhotoUrl: item.profilePhotoUrl, status: item.status, eventAt: item.deletedAt!.toISOString(), reason: item.deletedReason, actorName: item.deletedByName }))} /></AppShell>;
}
