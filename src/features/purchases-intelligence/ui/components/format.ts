/**
 * Helpers de formato. TypeORM serializa Postgres `numeric` como string,
 * así que las propiedades decimales que vienen del backend pueden ser
 * `string | number | null`. Estos helpers normalizan y formatean para
 * mostrar sin que el componente reviente con `.toFixed is not a function`.
 */

export function toNumber(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function fmt(v: unknown, decimals = 2): string {
  return toNumber(v).toFixed(decimals);
}

export function fmtOrDash(v: unknown, decimals = 2): string {
  if (v == null || v === '') return '—';
  return toNumber(v).toFixed(decimals);
}

export function fmtUsd(v: unknown): string {
  return `USD ${toNumber(v).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtPct(v: unknown, decimals = 1): string {
  if (v == null || v === '') return '—';
  return `${toNumber(v).toFixed(decimals)}%`;
}
