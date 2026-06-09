import { useQuery } from '@tanstack/react-query';

import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import axiosInstance, { endpoints } from '@/shared/lib/axios';

type Branch = { id: string; name: string };

async function fetchBranches(): Promise<Branch[]> {
  const { data } = await axiosInstance.get(endpoints.branches.root, {
    params: { limit: 200 },
  });
  // Algunos endpoints devuelven { data, meta }, otros array directo.
  if (Array.isArray(data)) return data;
  return data?.data ?? [];
}

export function BranchSelector({
  value,
  onChange,
  label = 'Sucursal',
  fullWidth,
  size = 'small',
}: {
  value: string;
  onChange: (id: string) => void;
  label?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}) {
  const { data } = useQuery({
    queryKey: ['branches', 'lookup'],
    queryFn: fetchBranches,
    staleTime: 5 * 60_000,
  });

  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth={fullWidth}
      size={size}
      slotProps={{ inputLabel: { shrink: true } }}
      sx={{ minWidth: 220 }}
    >
      <MenuItem value="">— Elegir —</MenuItem>
      {(data ?? []).map((b) => (
        <MenuItem key={b.id} value={b.id}>
          {b.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
