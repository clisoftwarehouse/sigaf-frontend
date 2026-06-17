export { fmtBs, fmtUsd, fmtDate, exportPdf, exportXlsx } from '../../libros-iva/model/format';

export const fmtQty = (n: number): string => (Number(n) || 0).toLocaleString('es-VE', { maximumFractionDigits: 3 });
export const fmtInt = (n: number): string => (Number(n) || 0).toLocaleString('es-VE', { maximumFractionDigits: 0 });
export const fmtPct = (n: number): string =>
  `${(Number(n) || 0).toLocaleString('es-VE', { maximumFractionDigits: 2 })}%`;

export function firstOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
export function firstOfQuarter(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - 2, 1).toISOString().slice(0, 10);
}
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
