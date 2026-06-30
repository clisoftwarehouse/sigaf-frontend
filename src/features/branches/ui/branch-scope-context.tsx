import { useMemo, useState, useEffect, useContext, createContext } from 'react';

import { usePermissions } from '@/features/auth/ui/hooks/use-permissions';
import { useAuthContext } from '@/features/auth/ui/hooks/use-auth-context';

import { useBranchesQuery } from '../api/branches.queries';

// ----------------------------------------------------------------------

export type BranchOption = { id: string; name: string };

type BranchScopeValue = {
  /** Sucursales que el usuario puede ver (admin/sin-restricción = todas). */
  branches: BranchOption[];
  /** Sucursal activa. `null` = "Todas" (solo si canSeeAll). */
  selectedBranchId: string | null;
  setSelectedBranchId: (id: string | null) => void;
  /** true si puede elegir "Todas" (admin o sin sucursales asignadas). */
  canSeeAll: boolean;
  /** true si el usuario está restringido a un subconjunto de sucursales. */
  restricted: boolean;
  isLoading: boolean;
};

const STORAGE_KEY = 'sigaf.selectedBranchId';

const BranchScopeContext = createContext<BranchScopeValue | undefined>(undefined);

export function BranchScopeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const { isAdmin } = usePermissions();
  const { data: allBranches = [], isLoading } = useBranchesQuery();

  // Sin restricción = admin o sin sucursales asignadas (vacío = todas, QA 153).
  const authorizedIds = useMemo(
    () => new Set((user?.authorizedBranches ?? []).map((b) => b.id)),
    [user?.authorizedBranches],
  );
  const restricted = !isAdmin && authorizedIds.size > 0;
  const canSeeAll = !restricted;

  const branches = useMemo<BranchOption[]>(() => {
    const active = allBranches.filter((b) => b.isActive).map((b) => ({ id: b.id, name: b.name }));
    return restricted ? active.filter((b) => authorizedIds.has(b.id)) : active;
  }, [allBranches, restricted, authorizedIds]);

  const [selectedBranchId, setSelectedBranchIdState] = useState<string | null>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    return stored && stored !== 'all' ? stored : null;
  });

  const setSelectedBranchId = (id: string | null) => {
    setSelectedBranchIdState(id);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, id ?? 'all');
  };

  // Normaliza la selección cuando cargan las sucursales / cambia el usuario:
  // - restringido: nunca "Todas"; si la elegida no es visible, cae a la primera.
  // - sin restricción: si la elegida ya no existe, cae a "Todas".
  useEffect(() => {
    if (isLoading || branches.length === 0) return;
    const exists = selectedBranchId != null && branches.some((b) => b.id === selectedBranchId);
    if (restricted) {
      if (!exists) setSelectedBranchId(branches[0].id);
    } else if (selectedBranchId != null && !exists) {
      setSelectedBranchId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, branches, restricted]);

  const value = useMemo<BranchScopeValue>(
    () => ({ branches, selectedBranchId, setSelectedBranchId, canSeeAll, restricted, isLoading }),
    [branches, selectedBranchId, canSeeAll, restricted, isLoading],
  );

  return <BranchScopeContext.Provider value={value}>{children}</BranchScopeContext.Provider>;
}

/**
 * Scope de sucursal activo en el admin. `selectedBranchId === null` significa
 * "Todas" (consolidado, solo admin/sin-restricción). Las vistas pasan este
 * branchId a sus queries para aislar por sucursal.
 */
export function useBranchScope(): BranchScopeValue {
  const ctx = useContext(BranchScopeContext);
  if (!ctx) throw new Error('useBranchScope debe usarse dentro de <BranchScopeProvider>');
  return ctx;
}
