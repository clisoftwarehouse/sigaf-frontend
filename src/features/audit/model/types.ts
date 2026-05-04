export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export const AUDIT_ACTION_OPTIONS: { value: AuditAction; label: string }[] = [
  { value: 'INSERT', label: 'Insertar' },
  { value: 'UPDATE', label: 'Actualizar' },
  { value: 'DELETE', label: 'Eliminar' },
];

export type AuditLog = {
  id: string;
  tableName: string;
  recordId: string;
  action: AuditAction;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changedFields: string[] | null;
  justification: string | null;
  userId: string;
  terminalId: string | null;
  ipAddress: string | null;
  createdAt: string;
};

export type AuditLogFilters = {
  tableName?: string;
  recordId?: string;
  action?: AuditAction;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type AuditLogResponse = {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  /** Mapa uuid → fullName para resolver referencias a usuarios en oldValues/newValues. */
  users?: Record<string, string>;
};
