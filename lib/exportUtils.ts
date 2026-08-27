// lib/exportUtils.ts — helper export Excel (.xlsx) & PDF (.pdf)
// Client-safe: hanya diimpor dari komponen "use client".

import * as XLSX from "xlsx-js-style";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Bersihkan emoji/karakter yang tidak didukung font PDF
function sanitize(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "")
    .trim();
}

export type ExportRow = (string | number)[];

const NAVY = "0B2447";
const GOLD = "FBBF24";
const SLATE_LIGHT = "E2E8F0";
const BORDER = "B0B7C3";

const thinBorder = {
  style: "thin" as const,
  color: { rgb: BORDER },
};

function baseCellStyle(overrides: Record<string, unknown>) {
  return {
    font: {},
    fill: { patternType: "solid", fgColor: { rgb: "FFFFFF" } },
    border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
    alignment: { vertical: "middle" as const },
    ...overrides,
  };
}

const headerStyle = baseCellStyle({
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { patternType: "solid", fgColor: { rgb: NAVY } },
  alignment: { horizontal: "center", vertical: "middle" },
});

const sectionTitleStyle = baseCellStyle({
  font: { bold: true, color: { rgb: NAVY } },
  fill: { patternType: "solid", fgColor: { rgb: GOLD } },
});

const sectionHeaderStyle = baseCellStyle({
  font: { bold: true, color: { rgb: NAVY } },
  fill: { patternType: "solid", fgColor: { rgb: SLATE_LIGHT } },
  alignment: { horizontal: "center", vertical: "middle" },
});

const bodyStyle = baseCellStyle({});

function applyTableStyles(
  ws: XLSX.WorkSheet,
  sheetRows: (string | number)[][],
  hasTopHeader: boolean
) {
  const maxCols = Math.max(1, ...sheetRows.map((r) => r.length));

  sheetRows.forEach((row, r) => {
    let style = bodyStyle;
    if (hasTopHeader && r === 0) {
      style = headerStyle;
    } else if (row.length === 1 && String(row[0] ?? "").trim() !== "") {
      style = sectionTitleStyle;
    } else if (
      row.length > 1 &&
      (String(row[0] ?? "").startsWith("Peserta") ||
        String(row[0] ?? "").startsWith("Peringkat"))
    ) {
      style = sectionHeaderStyle;
    }

    row.forEach((_, c) => {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell) cell.s = style;
    });
  });

  if (hasTopHeader) {
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };
    ws["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: sheetRows.length - 1, c: maxCols - 1 },
      }),
    };
  }
}

export function exportToExcel(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: ExportRow[]
) {
  exportToExcelMulti(filename, [{ name: sheetName, headers, rows }]);
}

export function exportToExcelMulti(
  filename: string,
  sheets: { name: string; headers: string[]; rows: ExportRow[] }[]
) {
  const wb = XLSX.utils.book_new();
  sheets.forEach((sheet, idx) => {
    const hasTopHeader = sheet.headers.length > 0;
    const sheetRows: (string | number)[][] = [
      ...(hasTopHeader ? [sheet.headers] : []),
      ...sheet.rows.map((r) => r.map((c) => sanitize(c))),
    ];
    const ws = XLSX.utils.aoa_to_sheet(sheetRows);
    const maxCols = Math.max(1, ...sheetRows.map((r) => r.length));
    ws["!cols"] = Array.from({ length: maxCols }, (_, i) => ({
      wch: Math.min(
        Math.max(...sheetRows.map((r) => String(r[i] ?? "").length)),
        45
      ) + 2,
    }));
    applyTableStyles(ws, sheetRows, hasTopHeader);
    XLSX.utils.book_append_sheet(wb, ws, (sheet.name || `Sheet${idx + 1}`).slice(0, 31));
  });
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPdf(
  filename: string,
  title: string,
  subtitle: string | undefined,
  headers: string[],
  rows: ExportRow[],
  opts?: { landscape?: boolean }
) {
  const landscape = opts?.landscape ?? headers.length > 7;
  const doc = new jsPDF({
    orientation: landscape ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
  });

  doc.setFontSize(15);
  doc.setTextColor(11, 36, 71);
  doc.text(sanitize(title), 40, 42);

  let startY = 55;
  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(sanitize(subtitle), 40, 58);
    startY = 70;
  }

  autoTable(doc, {
    startY,
    head: [headers],
    body: rows.map((r) => r.map((c) => sanitize(c))),
    styles: { fontSize: 7.5, cellPadding: 3, valign: "middle" },
    headStyles: { fillColor: [11, 36, 71], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [241, 245, 249] },
  });

  doc.save(`${filename}.pdf`);
}