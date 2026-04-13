export type Permission = {
  id: string;
  code: string;
  description: string | null;
  module: string;
  createdAt: string;
};

export type PermissionFilters = {
  module?: string;
};
