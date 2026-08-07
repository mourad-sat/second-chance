import { ReactNode } from "react";
import { BeneficiaryQuickActions } from "@/components/BeneficiaryQuickActions";
import { BeneficiaryPrivatePhotoBridge } from "@/components/BeneficiaryPrivatePhotoBridge";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function fallbackRegistrationNumber(id: string, createdAt: Date) {
  return `SC-${createdAt.getFullYear()}-CAS-${id.slice(-5).toUpperCase()}`;
}

export default async function BeneficiaryLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { id: string };
}) {
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      registrationNumber: true,
      status: true,
      createdAt: true,
      profilePhotoUrl: true
    }
  });

  return (
    <>
      {beneficiary && (
        <BeneficiaryPrivatePhotoBridge
          beneficiaryId={beneficiary.id}
          privatePhotoUrl={beneficiary.profilePhotoUrl}
        />
      )}
      {children}
      {beneficiary && (
        <BeneficiaryQuickActions
          beneficiaryId={beneficiary.id}
          fullName={`${beneficiary.firstName} ${beneficiary.lastName}`}
          registrationNumber={beneficiary.registrationNumber || fallbackRegistrationNumber(beneficiary.id, beneficiary.createdAt)}
          status={beneficiary.status}
        />
      )}
    </>
  );
}
