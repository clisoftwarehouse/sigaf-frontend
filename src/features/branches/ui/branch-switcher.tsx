import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { Iconify } from '@/app/components/iconify';

import { useBranchScope } from './branch-scope-context';

// ----------------------------------------------------------------------

const ALL = '__all__';

/**
 * Selector de sucursal del topbar. Admin / sin-restricción: "Todas" + cada
 * sucursal. Restringido a una sola: chip fijo (no editable). Restringido a
 * varias: solo las suyas (sin "Todas").
 */
export function BranchSwitcher() {
  const { branches, selectedBranchId, setSelectedBranchId, canSeeAll, isLoading } = useBranchScope();

  if (isLoading || branches.length === 0) return null;

  // Restringido a una sola sucursal → indicador fijo (sin selector).
  if (!canSeeAll && branches.length === 1) {
    return (
      <Chip
        size="small"
        color="primary"
        variant="outlined"
        icon={<Iconify icon="solar:home-angle-bold-duotone" width={16} />}
        label={branches[0].name}
        sx={{ fontWeight: 700, maxWidth: 200 }}
      />
    );
  }

  return (
    <TextField
      select
      size="small"
      value={selectedBranchId ?? ALL}
      onChange={(e) => setSelectedBranchId(e.target.value === ALL ? null : e.target.value)}
      slotProps={{ input: { startAdornment: <Iconify icon="solar:home-angle-bold-duotone" width={18} sx={{ mr: 0.5 }} /> } }}
      sx={{ minWidth: 180, '& .MuiInputBase-root': { fontWeight: 700 } }}
    >
      {canSeeAll && <MenuItem value={ALL}>Todas las sucursales</MenuItem>}
      {branches.map((b) => (
        <MenuItem key={b.id} value={b.id}>
          {b.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
