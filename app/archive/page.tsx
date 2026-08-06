import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BeneficiaryLifecycleManager } from "@/components/BeneficiaryLifecycleManager";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ARCHIVE_LIMIT = 200;

export default async function ArchivePage() {
  const session = await currentSession();
  if (!session) redirect("/login");

  const beneficiaries = await prisma.beneficiary.findMany({
    where: { archivedAt: { not: null }, deletedAt: null },
    orderBy: { archivedAt: "desc" },
    take: ARCHIVE_LIMIT,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      registrationNumber: true,
      masarNumber: true,
      profilePhotoUrl: true,
      status: true,
      archivedAt: true,
      archivedReason: true,
      archivedByName: true
    }
  });

  return (
    <AppShell>
      <BeneficiaryLifecycleManager
        mode="archive"
        items={beneficiaries.map((item) => ({
          id: item.id,
          firstName: item.firstName,
          lastName: item.lastName,
          registrationNumber: item.registrationNumber,
          masarNumber: item.masarNumber,
          profilePhotoUrl: item.profilePhotoUrl,
          status: item.status,
          eventAt: item.archivedAt!.toISOString(),
          reason: item.archivedReason,
          actorName: item.archivedByName
        }))}
      />
    </AppShell>
  );
}
