"use client";

import { Download, Printer } from "lucide-react";

type ExportRow = { section: string; indicator: string; value: string | number };

function safeSpreadsheetValue(value: string | number) {
  const text = String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  return /^[=+\-@]/.test(text.trimStart()) ? `'${text}` : text;
}

function csvCell(value: string | number) {
  return `"${safeSpreadsheetValue(value).replace(/"/g, '""')}"`;
}

export function ExecutiveReportExport({ rows }: { rows: ExportRow[] }) {
  async function auditExport(format: "CSV" | "PRINT") {
    try {
      await fetch("/api/reports/audit-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format })
      });
    } catch (error) {
      console.error("Unable to audit report export", error);
    }
  }

  async function exportCsv() {
    const content = [
      ["القسم", "المؤشر", "القيمة"],
      ...rows.map((row) => [row.section, row.indicator, row.value])
    ].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `second-chance-executive-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    await auditExport("CSV");
  }

  async function printReport() {
    await auditExport("PRINT");
    window.print();
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 hover:bg-emerald-100">
        <Download size={17} /> تصدير Excel / CSV
      </button>
      <button type="button" onClick={printReport} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">
        <Printer size={17} /> طباعة التقرير
      </button>
    </div>
  );
}
