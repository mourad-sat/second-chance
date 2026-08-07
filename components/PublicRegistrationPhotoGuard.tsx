"use client";

import { useEffect, useRef } from "react";
import { PublicRegistrationForm } from "./PublicRegistrationForm";

export function PublicRegistrationPhotoGuard() {
  const photoRef = useRef<File | null>(null);

  useEffect(() => {
    const restorePhotoInput = () => {
      const input = document.querySelector<HTMLInputElement>('input[name="photo"]');
      if (!input || !photoRef.current || input.files?.length) return;
      try {
        const transfer = new DataTransfer();
        transfer.items.add(photoRef.current);
        input.files = transfer.files;
      } catch {
        // Older browsers may not allow assigning FileList. The submit capture below still preserves the file.
      }
    };

    const handleChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.name !== "photo") return;
      const file = target.files?.[0] || null;
      if (file) photoRef.current = file;
    };

    const handleSubmitCapture = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !photoRef.current) return;

      const current = form.querySelector<HTMLInputElement>('input[name="photo"]');
      if (current?.files?.length) return;

      const hidden = document.createElement("input");
      hidden.type = "file";
      hidden.name = "photo";
      hidden.hidden = true;
      try {
        const transfer = new DataTransfer();
        transfer.items.add(photoRef.current);
        hidden.files = transfer.files;
        form.appendChild(hidden);
      } catch {
        hidden.remove();
      }
    };

    const observer = new MutationObserver(restorePhotoInput);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("change", handleChange, true);
    document.addEventListener("submit", handleSubmitCapture, true);
    restorePhotoInput();

    return () => {
      observer.disconnect();
      document.removeEventListener("change", handleChange, true);
      document.removeEventListener("submit", handleSubmitCapture, true);
    };
  }, []);

  return <PublicRegistrationForm />;
}
