import type { IvaRetention } from './types';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const bs = (n: number | string) =>
  `Bs ${(Number(n) || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Fecha DD/MM/AAAA para el comprobante; '—' si no hay. */
const fmtDate = (d: string | null): string => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const DOC_LABEL: Record<string, string> = {
  '01': 'Factura',
  '02': 'Nota de Débito',
  '03': 'Nota de Crédito',
};

/** finalY de la última tabla (jspdf-autotable lo cuelga del doc en runtime). */
function finalYOf(doc: jsPDF, fallback: number): number {
  return (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallback;
}

/**
 * Genera el PDF del comprobante de retención de IVA (forma libre numerada) para
 * entregar al proveedor. Limpio, portrait, sin el cromo del navegador.
 */
export function generateComprobantePdf(r: IvaRetention): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const M = 48;
  const W = doc.internal.pageSize.getWidth();
  let y = M;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('COMPROBANTE DE RETENCIÓN DEL IVA', W / 2, y, { align: 'center' });
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nº de comprobante: ${r.voucherNumber}`, W / 2, y, { align: 'center' });
  y += 13;
  doc.text(`Período impositivo: ${r.period}`, W / 2, y, { align: 'center' });
  y += 22;

  // Bloques agente / proveedor
  const block = (label: string, lines: string[]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(label, M, y);
    doc.setFont('helvetica', 'normal');
    lines.forEach((ln, i) => doc.text(ln, M, y + 13 + i * 12));
    y += 13 + lines.length * 12 + 8;
  };
  block('AGENTE DE RETENCIÓN', [`RIF: ${r.agentRif}`]);
  block('SUJETO RETENIDO (PROVEEDOR)', [
    `RIF: ${r.supplierRif}`,
    `Razón social: ${r.supplierBusinessName ?? '—'}`,
  ]);

  // Datos del documento
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4 },
    head: [['Documento', 'Nº', 'Control', 'Fecha', 'Doc. afectado']],
    body: [
      [
        DOC_LABEL[r.fiscalDocType] ?? r.fiscalDocType,
        r.invoiceNumber ?? '—',
        r.controlNumber ?? '—',
        fmtDate(r.invoiceDate),
        r.affectedDocNumber ?? '—',
      ],
    ],
  });
  y = finalYOf(doc, y) + 14;

  // Montos en Bs
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [33, 43, 54] },
    columnStyles: { 1: { halign: 'right' } },
    head: [['Concepto', 'Monto (Bs)']],
    body: [
      ['Total del documento', bs(r.totalBs)],
      ['Base imponible', bs(r.baseImponibleBs)],
      ['Monto exento de IVA', bs(r.exemptBs)],
      [`IVA (${Number(r.vatRate)}%)`, bs(r.vatBs)],
      [`IVA RETENIDO (${Number(r.retentionPct)}%)`, bs(r.vatRetainedBs)],
    ],
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === 4) {
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });
  y = finalYOf(doc, y) + 28;

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    'Este comprobante se emite conforme a la Providencia de Retenciones de IVA (contribuyentes especiales).',
    M,
    y,
    { maxWidth: W - M * 2 },
  );

  doc.save(`comprobante_retencion_${r.voucherNumber}.pdf`);
}
