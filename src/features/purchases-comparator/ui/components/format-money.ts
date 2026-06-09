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
