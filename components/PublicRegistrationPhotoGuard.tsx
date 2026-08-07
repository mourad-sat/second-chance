"use client";

import { useEffect, useRef } from "react";
import { PublicRegistrationForm } from "./PublicRegistrationForm";

const DRAFT_KEY = "second-chance-public-registration-draft-v1";

type StoredValues = Record<string, string[]>;
type StoredFiles = Record<string, File[]>;

export function PublicRegistrationPhotoGuard() {
  const valuesRef = useRef<StoredValues>({});
  const filesRef = useRef<StoredFiles>({});
  const injectedRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") as Record<string, string> | null;
      if (draft) {
        for (const [name, value] of Object.entries(draft)) {
          if (name !== "website" && name !== "cf-turnstile-response") valuesRef.current[name] = [value];
        }
      }
    } catch {
      // Ignore malformed legacy drafts. The form itself will clean them up.
    }

    const captureField = (target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
      const name = target.name;
      if (!name || name === "website" || name === "cf-turnstile-response") return;

      if (target instanceof HTMLInputElement && target.type === "file") {
        const files = Array.from(target.files || []);
        if (files.length) filesRef.current[name] = files;
        return;
      }

      const form = target.form;
      if (target instanceof HTMLInputElement && (target.type === "checkbox" || target.type === "radio")) {
        if (!form) return;
        const fields = Array.from(form.querySelectorAll<HTMLInputElement>(`input[name="${CSS.escape(name)}"]`));
        valuesRef.current[name] = fields.filter((field) => field.checked).map((field) => field.value || "on");
        return;
      }

      if (target instanceof HTMLSelectElement && target.multiple) {
        valuesRef.current[name] = Array.from(target.selectedOptions).map((option) => option.value);
        return;
      }

      valuesRef.current[name] = [target.value];
    };

    const captureAllMountedFields = () => {
      const form = document.querySelector<HTMLFormElement>("form");
      if (!form) return;
      const fields = Array.from(form.elements);
      for (const field of fields) {
        if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
          captureField(field);
        }
      }
    };

    const restoreMountedFields = () => {
      const form = document.querySelector<HTMLFormElement>("form");
      if (!form) return;

      for (const [name, values] of Object.entries(valuesRef.current)) {
        const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name="${CSS.escape(name)}"]`));
        for (const field of fields) {
          if (field instanceof HTMLInputElement && field.type === "file") continue;
          if (field instanceof HTMLInputElement && (field.type === "checkbox" || field.type === "radio")) {
            field.checked = values.includes(field.value || "on");
          } else if (!field.value && values[0] !== undefined) {
            field.value = values[0];
            if (field.name === "birthDate") field.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      }

      for (const [name, files] of Object.entries(filesRef.current)) {
        const input = form.querySelector<HTMLInputElement>(`input[type="file"][name="${CSS.escape(name)}"]`);
        if (!input || input.files?.length || !files.length) continue;
        try {
          const transfer = new DataTransfer();
          files.forEach((file) => transfer.items.add(file));
          input.files = transfer.files;
        } catch {
          // Some browsers disallow assigning FileList; submit injection below is the fallback.
        }
      }
    };

    const clearInjected = () => {
      injectedRef.current.forEach((node) => node.remove());
      injectedRef.current = [];
    };

    const injectMissingValuesBeforeSubmit = (form: HTMLFormElement) => {
      clearInjected();
      captureAllMountedFields();

      for (const [name, values] of Object.entries(valuesRef.current)) {
        const mounted = form.querySelector(`[name="${CSS.escape(name)}"]`);
        if (mounted) continue;
        for (const value of values) {
          const hidden = document.createElement("input");
          hidden.type = "hidden";
          hidden.name = name;
          hidden.value = value;
          hidden.dataset.registrationInjected = "true";
          form.appendChild(hidden);
          injectedRef.current.push(hidden);
        }
      }

      for (const [name, files] of Object.entries(filesRef.current)) {
        const mounted = form.querySelector<HTMLInputElement>(`input[type="file"][name="${CSS.escape(name)}"]`);
        if (mounted?.files?.length || !files.length) continue;

        const hiddenFile = document.createElement("input");
        hiddenFile.type = "file";
        hiddenFile.name = name;
        hiddenFile.hidden = true;
        hiddenFile.dataset.registrationInjected = "true";
        try {
          const transfer = new DataTransfer();
          files.forEach((file) => transfer.items.add(file));
          hiddenFile.files = transfer.files;
          form.appendChild(hiddenFile);
          injectedRef.current.push(hiddenFile);
        } catch {
          hiddenFile.remove();
        }
      }
    };

    const handleFieldEvent = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) {
        captureField(target);
      }
    };

    const handleSubmitCapture = (event: Event) => {
      const form = event.target;
      if (form instanceof HTMLFormElement) injectMissingValuesBeforeSubmit(form);
    };

    const observer = new MutationObserver(() => queueMicrotask(restoreMountedFields));
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("input", handleFieldEvent, true);
    document.addEventListener("change", handleFieldEvent, true);
    document.addEventListener("submit", handleSubmitCapture, true);
    restoreMountedFields();

    return () => {
      observer.disconnect();
      document.removeEventListener("input", handleFieldEvent, true);
      document.removeEventListener("change", handleFieldEvent, true);
      document.removeEventListener("submit", handleSubmitCapture, true);
      clearInjected();
    };
  }, []);

  return <PublicRegistrationForm />;
}
