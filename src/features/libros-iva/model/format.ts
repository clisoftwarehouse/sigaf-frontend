import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function toNumber(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Formato de monto: 1.234,56 (es-VE). Sin símbolo de moneda. */
export function fmtAmount(v: unknown): string {
  return toNumber(v).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Alias retrocompatible — Bs y USD usan el mismo formato numérico. */
export const fmtBs = fmtAmount;
export const fmtUsd = fmtAmount;

export function fmtRate(v: unknown): string {
  const n = toNumber(v);
  return n > 0 ? n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '—';
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return '—';
  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return '—';
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const DOC_KIND_LABEL: Record<string, string> = {
  invoice: 'Factura',
  credit_note: 'N. Crédito',
  debit_note: 'N. Débito',
};

export function docKindLabel(kind: string): string {
  return DOC_KIND_LABEL[kind] ?? kind;
}

// ─── Exportadores ─────────────────────────────────────────────────────

/**
 * Exporta una matriz a Excel (.xlsx). El contador lo abre directo y cuadra
 * con su software. `numericCols` son índices (0-based) que se formatean
 * como número en la hoja para que Excel los sume.
 */
export function exportXlsx(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const aoa = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, filename);
}

/**
 * Exporta una tabla a PDF horizontal para imprimir/archivar firmado.
 * `title` y `subtitle` arman el encabezado del libro.
 */
export function exportPdf(
  filename: string,
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
  footerRow?: (string | number)[],
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(title, 40, 40);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(subtitle, 40, 58);
  doc.setTextColor(0);

  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => r.map((c) => String(c))),
    foot: footerRow ? [footerRow.map((c) => String(c))] : undefined,
    startY: 72,
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [33, 43, 54], fontSize: 7 },
    footStyles: { fillColor: [244, 246, 248], textColor: 0, fontStyle: 'bold' },
    margin: { left: 20, right: 20 },
  });

  doc.save(filename);
}
