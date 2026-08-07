"use client";

import { useEffect } from "react";

export function BeneficiaryPrivatePhotoBridge({
  beneficiaryId,
  privatePhotoUrl
}: {
  beneficiaryId: string;
  privatePhotoUrl: string | null;
}) {
  useEffect(() => {
    if (!privatePhotoUrl) return;
    const safeSrc = `/api/beneficiaries/${encodeURIComponent(beneficiaryId)}/photo`;

    const repair = () => {
      document.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
        const raw = image.getAttribute("src") || "";
        if (
          raw === privatePhotoUrl ||
          image.src === privatePhotoUrl ||
          raw.includes(".private.blob.vercel-storage.com") ||
          image.src.includes(".private.blob.vercel-storage.com")
        ) {
          if (image.getAttribute("src") !== safeSrc) image.setAttribute("src", safeSrc);
        }
      });
    };

    repair();
    const observer = new MutationObserver(repair);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
    return () => observer.disconnect();
  }, [beneficiaryId, privatePhotoUrl]);

  return null;
}
