/**
 * Formato monetario para precios de iCompras (siempre VES).
 * Bs. 1.234,56 — separador miles `.`, decimal `,` (LATAM).
 */
export function formatBs(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `Bs. ${Number(value).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Formato USD ($1.234,56) para costos internos de SIGAF (recepciones en dólares). */
export function formatUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `$${Number(value).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
