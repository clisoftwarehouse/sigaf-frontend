import type { AuditAction } from './types';

// ----------------------------------------------------------------------

export const ACTION_LABELS: Record<AuditAction, string> = {
  INSERT: 'Crear',
  UPDATE: 'Actualizar',
  DELETE: 'Eliminar',
};

export const TABLE_LABELS: Record<string, string> = {
  products: 'Productos',
  purchase_orders: 'Órdenes de compra',
  goods_receipts: 'Recepciones',
  inventory_lots: 'Lotes',
  inventory_counts: 'Conteos de inventario',
  inventory_count_items: 'Items de conteo',
  consignment_returns: 'Devoluciones de consignación',
  consignment_liquidations: 'Liquidaciones de consignación',
  supplier_claims: 'Reclamos a proveedor',
};

// ----------------------------------------------------------------------

export const FIELD_LABELS: Record<string, string> = {
  status: 'Estado',
  approvedBy: 'Aprobado por',
  reapprovedBy: 'Reaprobado por',
  reapprovalJustification: 'Justificación de reaprobación',
  requiresReapproval: 'Requiere reaprobación',
  cancelledBy: 'Cancelado por',
  cancelReason: 'Motivo de cancelación',
  isActive: 'Activo',
  deletedAt: 'Fecha de eliminación',
  name: 'Nombre',
  description: 'Descripción',
  internalCode: 'Código interno',
  barcode: 'Código de barras',
  brandId: 'Marca',
  categoryId: 'Categoría',
  costUsd: 'Costo (USD)',
  salePrice: 'Precio de venta',
  quantityReceived: 'Cantidad recibida',
  invoicedQuantity: 'Cantidad facturada',
  expirationDate: 'Vencimiento',
  lotNumber: 'Número de lote',
  supplierId: 'Proveedor',
  branchId: 'Sucursal',
  exchangeRateUsed: 'Tasa de cambio',
  totalUsd: 'Total (USD)',
  notes: 'Notas',
  receivedBy: 'Recibido por',
  reapprovedAt: 'Fecha de reaprobación',
};

// ----------------------------------------------------------------------

const STATUS_LABELS_BY_TABLE: Record<string, Record<string, string>> = {
  purchase_orders: {
    draft: 'Borrador',
    sent: 'Enviada',
    partial: 'Parcialmente recibida',
    complete: 'Completada',
    cancelled: 'Cancelada',
  },
  goods_receipts: {
    purchase: 'Compra',
    consignment: 'Consignación',
    cancelled: 'Cancelada',
  },
  inventory_lots: {
    available: 'Disponible',
    quarantined: 'En cuarentena',
    expired: 'Vencido',
    depleted: 'Agotado',
  },
  inventory_counts: {
    draft: 'Borrador',
    in_progress: 'En progreso',
    completed: 'Completado',
    cancelled: 'Cancelado',
  },
  supplier_claims: {
    draft: 'Borrador',
    open: 'Abierto',
    in_progress: 'En seguimiento',
    resolved: 'Resuelto',
    cancelled: 'Cancelado',
  },
};

// ----------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const USER_REF_FIELDS = new Set([
  'userId',
  'createdBy',
  'updatedBy',
  'deletedBy',
  'approvedBy',
  'reapprovedBy',
  'cancelledBy',
  'receivedBy',
  'closedBy',
  'reviewedBy',
]);

export function isUserRefField(field: string): boolean {
  return USER_REF_FIELDS.has(field) || field.endsWith('By');
}

function humanizeCamel(key: string): string {
  const spaced = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

export function getTableLabel(tableName: string): string {
  return TABLE_LABELS[tableName] ?? tableName;
}

export function getActionLabel(action: AuditAction): string {
  return ACTION_LABELS[action] ?? action;
}

export function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? humanizeCamel(field);
}

export function formatValue(
  field: string,
  value: unknown,
  tableName?: string,
  userMap?: Record<string, string>
): string {
  if (value === null || value === undefined) return '—';
  if (value === '') return '(vacío)';

  if (typeof value === 'boolean') return value ? 'Sí' : 'No';

  if (typeof value === 'string') {
    if (field === 'status' && tableName && STATUS_LABELS_BY_TABLE[tableName]?.[value]) {
      return STATUS_LABELS_BY_TABLE[tableName][value];
    }
    if (UUID_RE.test(value)) {
      if (isUserRefField(field) && userMap?.[value]) {
        return userMap[value];
      }
      return value.slice(0, 8) + '…';
    }
    return value;
  }

  if (typeof value === 'number') return String(value);

  if (Array.isArray(value)) {
    return value.length === 0 ? '(vacío)' : `[${value.length} ítem${value.length === 1 ? '' : 's'}]`;
  }

  if (typeof value === 'object') return '{…}';

  return String(value);
}

export function inferChangedFields(
  changedFields: string[] | null,
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null
): string[] {
  if (changedFields && changedFields.length > 0) return changedFields;
  const fromNew = newValues ? Object.keys(newValues) : [];
  const fromOld = oldValues ? Object.keys(oldValues) : [];
  return Array.from(new Set([...fromNew, ...fromOld]));
}
