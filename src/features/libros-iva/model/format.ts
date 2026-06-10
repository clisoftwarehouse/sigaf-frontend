export function toNumber(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function fmtUsd(v: unknown): string {
  return toNumber(v).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtBs(v: unknown): string {
  return toNumber(v).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

/**
 * Genera un CSV de una matriz [headers, ...rows] y dispara la descarga.
 * Usa ; como separador (estándar Excel es-VE donde la coma es decimal).
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers, ...rows].map((r) => r.map(escape).join(';'));
  const csv = '﻿' + lines.join('\r\n'); // BOM para que Excel detecte UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
