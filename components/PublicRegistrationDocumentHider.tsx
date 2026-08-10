"use client";

import { useEffect } from "react";

export function PublicRegistrationDocumentHider() {
  useEffect(() => {
    let skipping = false;

    const updateUi = () => {
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
      for (const button of buttons) {
        const text = button.textContent?.replace(/\s+/g, " ").trim() || "";
        if (text === "الوثائق" || text.includes("الوثائق")) {
          const parent = button.parentElement;
          if (parent && parent.children.length >= 5) button.style.display = "none";
        }
      }

      const allTextNodes = Array.from(document.querySelectorAll<HTMLElement>("div,span,p"));
      for (const node of allTextNodes) {
        const text = node.textContent?.replace(/\s+/g, " ").trim() || "";
        if (/^المرحلة\s+\d+\s+من\s+6$/.test(text)) {
          const current = Number(text.match(/المرحلة\s+(\d+)/)?.[1] || "1");
          const visibleStep = current >= 6 ? 5 : current;
          node.textContent = `المرحلة ${visibleStep} من 5`;
        }
      }

      const heading = Array.from(document.querySelectorAll<HTMLHeadingElement>("h1,h2,h3"))
        .find((node) => node.textContent?.trim() === "الوثائق");

      if (!heading || skipping) return;
      const nextButton = buttons.find((button) => button.textContent?.includes("التالي"));
      if (!nextButton) return;

      skipping = true;
      queueMicrotask(() => {
        nextButton.click();
        window.setTimeout(() => { skipping = false; }, 150);
      });
    };

    const observer = new MutationObserver(updateUi);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    updateUi();

    return () => observer.disconnect();
  }, []);

  return null;
}
