import type { TextFieldProps } from '@mui/material/TextField';
import type { ControllerRenderProps, ControllerFieldState } from 'react-hook-form';

import { useState, useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

// ----------------------------------------------------------------------

export type IdentificationKind = 'cedula' | 'rif';

export type RHFIdentificationFieldProps = Omit<TextFieldProps, 'value' | 'onChange'> & {
  name: string;
  kind: IdentificationKind;
};

const PREFIXES: Record<IdentificationKind, string[]> = {
  cedula: ['V', 'E'],
  rif: ['V', 'E', 'J', 'G', 'P'],
};

const HINTS: Record<IdentificationKind, string> = {
  cedula: 'Formato: V-12345678 (V venezolano, E extranjero)',
  rif: 'Formato: J-12345678-9 (V/E/J/G/P)',
};

const DEFAULT_PREFIX: Record<IdentificationKind, string> = {
  cedula: 'V',
  rif: 'J',
};

type Parsed = { prefix: string; digits: string; check: string };

function parseValue(value: unknown, kind: IdentificationKind): Parsed {
  const fallback = { prefix: DEFAULT_PREFIX[kind], digits: '', check: '' };
  if (typeof value !== 'string' || value.length === 0) return fallback;
  if (kind === 'cedula') {
    const m = value.match(/^([VE])-?(\d*)$/i);
    if (m) return { prefix: m[1].toUpperCase(), digits: m[2] ?? '', check: '' };
    return fallback;
  }
  const m = value.match(/^([VEJGP])-?(\d*)-?(\d?)$/i);
  if (m) return { prefix: m[1].toUpperCase(), digits: m[2] ?? '', check: m[3] ?? '' };
  return fallback;
}

function compose(prefix: string, digits: string, check: string, kind: IdentificationKind): string {
  if (!digits && !check) return '';
  if (kind === 'cedula') return `${prefix}-${digits}`;
  return `${prefix}-${digits}-${check}`;
}

// ----------------------------------------------------------------------

export function RHFIdentificationField({ name, kind, ...other }: RHFIdentificationFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <IdField field={field} fieldState={fieldState} kind={kind} {...other} />
      )}
    />
  );
}

// ----------------------------------------------------------------------

type InnerProps = Omit<RHFIdentificationFieldProps, 'name'> & {
  field: ControllerRenderProps;
  fieldState: ControllerFieldState;
};

function IdField({ field, fieldState, kind, label, helperText, ...other }: InnerProps) {
  const { error } = fieldState;
  const parsed = parseValue(field.value, kind);

  // Local state for prefix so it persists even when there are no digits
  // (compose returns '' for empty input, which would otherwise reset prefix on re-render).
  const [prefix, setPrefix] = useState(parsed.prefix);

  // Sync prefix from external value changes (e.g. form reset, parent set).
  useEffect(() => {
    const next = parseValue(field.value, kind);
    if (next.digits || next.check) setPrefix(next.prefix);
  }, [field.value, kind]);

  const digits = parsed.digits;
  const check = parsed.check;

  const handlePrefix = (next: string) => {
    setPrefix(next);
    if (digits || check) field.onChange(compose(next, digits, check, kind));
  };

  const handleDigits = (next: string) => {
    const cleaned = next.replace(/\D/g, '').slice(0, 9);
    field.onChange(compose(prefix, cleaned, check, kind));
  };

  const handleCheck = (next: string) => {
    const cleaned = next.replace(/\D/g, '').slice(0, 1);
    field.onChange(compose(prefix, digits, cleaned, kind));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField
          select
          size={other.size}
          label={label}
          value={prefix}
          onChange={(e) => handlePrefix(e.target.value)}
          onBlur={field.onBlur}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 90 }}
          error={!!error}
        >
          {PREFIXES[kind].map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          size={other.size}
          label="Número"
          value={digits}
          onChange={(e) => handleDigits(e.target.value)}
          onBlur={field.onBlur}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' },
          }}
          placeholder="12345678"
          error={!!error}
          {...other}
        />

        {kind === 'rif' && (
          <TextField
            size={other.size}
            label="DV"
            value={check}
            onChange={(e) => handleCheck(e.target.value)}
            onBlur={field.onBlur}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { inputMode: 'numeric', pattern: '[0-9]', maxLength: 1 },
            }}
            sx={{ width: 70 }}
            error={!!error}
          />
        )}
      </Box>
      {(error?.message || helperText) && (
        <Box
          component="p"
          sx={{
            m: 0,
            mt: 0.5,
            ml: '14px',
            color: error ? 'error.main' : 'text.secondary',
            fontSize: 12,
            lineHeight: 1.66,
          }}
        >
          {error?.message ?? helperText ?? HINTS[kind]}
        </Box>
      )}
    </Box>
  );
}
