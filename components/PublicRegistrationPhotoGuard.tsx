"use client";

import { useEffect, useRef } from "react";
import { PublicRegistrationForm } from "./PublicRegistrationForm";

const DRAFT_KEY = "second-chance-public-registration-draft-v1";
const MAX_TOTAL_UPLOAD_BYTES = 3_700_000;
const MAX_PDF_BYTES = 900_000;

type StoredValues = Record<string, string[]>;
type StoredFiles = Record<string, File[]>;

async function compressImage(file: File, maxDimension: number, quality: number) {
  if (!file.type.startsWith("image/") || file.size <= 450_000) return file;

  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob || blob.size >= file.size) return file;
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

export function PublicRegistrationPhotoGuard() {
  const valuesRef = useRef<StoredValues>({});
  const filesRef = useRef<StoredFiles>({});
  const pendingFilesRef = useRef<Record<string, Promise<File[]>>>({});
  const injectedRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    let resubmitting = false;

    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") as Record<string, string> | null;
      if (draft) {
        for (const [name, value] of Object.entries(draft)) {
          if (name !== "website" && name !== "cf-turnstile-response") valuesRef.current[name] = [value];
        }
      }
    } catch {
      // Ignore malformed legacy drafts.
    }

    const ensureFrenchNameField = () => {
      const form = document.querySelector<HTMLFormElement>("form");
      if (!form || form.querySelector('[data-full-name-french="true"]')) return;
      const lastName = form.querySelector<HTMLInputElement>('input[name="lastName"]');
      if (!lastName) return;

      const label = document.createElement("label");
      label.className = "text-sm font-bold";
      label.dataset.fullNameFrench = "true";
      label.textContent = "الاسم الكامل بالفرنسية *";

      const input = document.createElement("input");
      input.type = "text";
      input.name = "fullNameFrench";
      input.required = true;
      input.maxLength = 120;
      input.autocomplete = "name";
      input.dir = "ltr";
      input.placeholder = "Exemple : MOHAMED EL ALAOUI";
      input.pattern = "[A-Za-zÀ-ÖØ-öø-ÿ' -]{3,120}";
      input.title = "اكتب الاسم بالحروف اللاتينية فقط.";
      input.className = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm uppercase outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100";
      input.value = valuesRef.current.fullNameFrench?.[0] || "";
      input.addEventListener("input", () => {
        input.value = input.value.toUpperCase();
      });

      label.appendChild(input);
      const lastNameLabel = lastName.closest("label");
      if (lastNameLabel?.parentElement) lastNameLabel.after(label);
    };

    const prepareFiles = (target: HTMLInputElement, name: string, files: File[]) => {
      const task = Promise.all(files.map(async (file) => {
        if (file.type === "application/pdf") {
          if (file.size > MAX_PDF_BYTES) {
            window.alert(`الملف «${file.name}» كبير جدًا. يرجى استعمال PDF بحجم أقل من 900KB أو رفع صورة واضحة بدلًا منه.`);
            return null;
          }
          return file;
        }

        if (file.type.startsWith("image/")) {
          try {
            return await compressImage(file, name === "photo" ? 1200 : 1600, name === "photo" ? 0.76 : 0.7);
          } catch {
            return file;
          }
        }
        return file;
      })).then((prepared) => {
        const valid = prepared.filter((file): file is File => Boolean(file));
        if (!valid.length) {
          delete filesRef.current[name];
          target.value = "";
          return [];
        }
        filesRef.current[name] = valid;
        try {
          const transfer = new DataTransfer();
          valid.forEach((file) => transfer.items.add(file));
          target.files = transfer.files;
        } catch {
          // The stored compressed copy will be injected before submit.
        }
        return valid;
      });
      pendingFilesRef.current[name] = task;
    };

    const captureField = (target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
      const name = target.name;
      if (!name || name === "website" || name === "cf-turnstile-response") return;

      if (target instanceof HTMLInputElement && target.type === "file") {
        const files = Array.from(target.files || []);
        if (files.length) prepareFiles(target, name, files);
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
      if (name === "fullNameFrench") {
        try {
          const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}") as Record<string, string>;
          draft.fullNameFrench = target.value;
          localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        } catch {
          // Ignore local storage failures.
        }
      }
    };

    const captureAllMountedFields = () => {
      const form = document.querySelector<HTMLFormElement>("form");
      if (!form) return;
      for (const field of Array.from(form.elements)) {
        if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
          if (!(field instanceof HTMLInputElement && field.type === "file")) captureField(field);
        }
      }
    };

    const restoreMountedFields = () => {
      const form = document.querySelector<HTMLFormElement>("form");
      if (!form) return;
      ensureFrenchNameField();

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
          // Submit injection below is the fallback.
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

    const handleClickCapture = (event: MouseEvent) => {
      const button = event.target instanceof Element ? event.target.closest("button") : null;
      if (!button || !button.textContent?.includes("التالي")) return;
      const frenchName = document.querySelector<HTMLInputElement>('input[name="fullNameFrench"]');
      if (frenchName && !frenchName.checkValidity()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        frenchName.reportValidity();
        frenchName.focus();
      }
    };

    const handleSubmitCapture = async (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (resubmitting) {
        resubmitting = false;
        return;
      }

      const frenchName = valuesRef.current.fullNameFrench?.[0]?.trim() || "";
      if (!frenchName || !/^[A-Za-zÀ-ÖØ-öø-ÿ' -]{3,120}$/.test(frenchName)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const visible = form.querySelector<HTMLInputElement>('input[name="fullNameFrench"]');
        visible?.reportValidity();
        visible?.focus();
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      try {
        await Promise.all(Object.values(pendingFilesRef.current));
      } catch {
        window.alert("تعذر تجهيز أحد الملفات. يرجى إعادة اختياره ثم المحاولة مرة أخرى.");
        return;
      }

      const totalBytes = Object.values(filesRef.current).flat().reduce((sum, file) => sum + file.size, 0);
      if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
        const mb = (totalBytes / (1024 * 1024)).toFixed(1);
        window.alert(`الحجم الإجمالي للملفات هو ${mb}MB وهو أكبر من الحد الآمن للإرسال. يرجى تقليل حجم ملفات PDF أو رفع صور بدلًا منها.`);
        return;
      }

      injectMissingValuesBeforeSubmit(form);
      resubmitting = true;
      form.requestSubmit();
    };

    const observer = new MutationObserver(() => queueMicrotask(restoreMountedFields));
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("input", handleFieldEvent, true);
    document.addEventListener("change", handleFieldEvent, true);
    document.addEventListener("click", handleClickCapture, true);
    document.addEventListener("submit", handleSubmitCapture, true);
    restoreMountedFields();

    return () => {
      observer.disconnect();
      document.removeEventListener("input", handleFieldEvent, true);
      document.removeEventListener("change", handleFieldEvent, true);
      document.removeEventListener("click", handleClickCapture, true);
      document.removeEventListener("submit", handleSubmitCapture, true);
      clearInjected();
    };
  }, []);

  return <PublicRegistrationForm />;
}
