export type Terminal = {
  id: string;
  branchId: string;
  code: string;
  name: string | null;
  fiscalPrinterConfig: Record<string, unknown> | null;
  scaleConfig: Record<string, unknown> | null;
  cashDrawerConfig: Record<string, unknown> | null;
  lastSyncAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTerminalPayload = {
  branchId: string;
  code: string;
  name?: string;
  fiscalPrinterConfig?: Record<string, unknown>;
  scaleConfig?: Record<string, unknown>;
  cashDrawerConfig?: Record<string, unknown>;
};

export type UpdateTerminalPayload = Partial<CreateTerminalPayload>;

export type TerminalFilters = {
  branchId?: string;
};
