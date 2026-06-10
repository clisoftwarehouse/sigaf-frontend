import type { LibroPeriod } from '../../model/types';

import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

type Props = {
  value: LibroPeriod;
  onChange: (period: LibroPeriod) => void;
};

export function PeriodSelector({ value, onChange }: Props) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <Stack direction="row" spacing={1.5}>
      <TextField
        select
        size="small"
        label="Mes"
        value={value.month}
        onChange={(e) => onChange({ ...value, month: Number(e.target.value) })}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 150 }}
      >
        {MONTHS.map((m, idx) => (
          <MenuItem key={m} value={idx + 1}>
            {m}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Año"
        value={value.year}
        onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 110 }}
      >
        {years.map((y) => (
          <MenuItem key={y} value={y}>
            {y}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}
