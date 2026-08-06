import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BeneficiaryLifecycleManager } from "@/components/BeneficiaryLifecycleManager";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/session";

export const dynamic = "force-dynamic";

const TRASH_LIMIT = 200;

export default async function TrashPage() {
  const session = await currentSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role)) redirect("/");

  const beneficiaries = await prisma.beneficiary.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    take: TRASH_LIMIT,
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

  return (
    <AppShell>
      <BeneficiaryLifecycleManager
        mode="trash"
        items={beneficiaries.map((item) => ({
          id: item.id,
          firstName: item.firstName,
          lastName: item.lastName,
          registrationNumber: item.registrationNumber,
          masarNumber: item.masarNumber,
          profilePhotoUrl: item.profilePhotoUrl,
          status: item.status,
          eventAt: item.deletedAt!.toISOString(),
          reason: item.deletedReason,
          actorName: item.deletedByName
        }))}
      />
    </AppShell>
  );
}
