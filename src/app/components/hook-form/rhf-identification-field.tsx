import type { TextFieldProps } from '@mui/material/TextField';
import type { ControllerFieldState, ControllerRenderProps } from 'react-hook-form';

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
  /**
   * Subset de prefijos a permitir. Si se omite, se usan los defaults del kind.
   * Útil para restringir según contexto (ej. sucursales solo pueden ser "J").
   */
  allowedPrefixes?: string[];
};

const PREFIXES: Record<IdentificationKind, string[]> = {
  cedula: ['V', 'E'],
  rif: ['V', 'E', 'J', 'G', 'P'],
};

// RIF venezolano oficial: 8 dígitos + 1 verificador. Cédula: hasta 8 dígitos.
const DIGITS_MAX: Record<IdentificationKind, number> = {
  cedula: 8,
  rif: 8,
};

const HINTS: Record<IdentificationKind, string> = {
  cedula: 'Formato: V-12345678 (V venezolano, E extranjero)',
  rif: 'Formato: J-12345678-9',
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

/**
 * Compone el string canónico del documento. Para RIF, el DV se incluye solo
 * cuando el prefijo es J o G (personas jurídicas). Personas naturales con RIF
 * (V/E/P) usan formato sin DV.
 */
function compose(prefix: string, digits: string, check: string, kind: IdentificationKind): string {
  if (!digits && !check) return '';
  if (kind === 'cedula') return `${prefix}-${digits}`;
  const requiresCheck = prefix === 'J' || prefix === 'G';
  if (!requiresCheck) return `${prefix}-${digits}`;
  return `${prefix}-${digits}-${check}`;
}

// ----------------------------------------------------------------------

export function RHFIdentificationField({
  name,
  kind,
  allowedPrefixes,
  ...other
}: RHFIdentificationFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <IdField
          field={field}
          fieldState={fieldState}
          kind={kind}
          allowedPrefixes={allowedPrefixes}
          {...other}
        />
      )}
    />
  );
}

// ----------------------------------------------------------------------

type InnerProps = Omit<RHFIdentificationFieldProps, 'name'> & {
  field: ControllerRenderProps;
  fieldState: ControllerFieldState;
};

function IdField({
  field,
  fieldState,
  kind,
  label,
  helperText,
  allowedPrefixes,
  ...other
}: InnerProps) {
  const { error } = fieldState;
  const parsed = parseValue(field.value, kind);

  const availablePrefixes =
    allowedPrefixes && allowedPrefixes.length > 0
      ? PREFIXES[kind].filter((p) => allowedPrefixes.includes(p))
      : PREFIXES[kind];
  const effectiveDefault =
    availablePrefixes.includes(DEFAULT_PREFIX[kind])
      ? DEFAULT_PREFIX[kind]
      : availablePrefixes[0] ?? DEFAULT_PREFIX[kind];

  // Local state for prefix so it persists even when there are no digits
  // (compose returns '' for empty input, which would otherwise reset prefix on re-render).
  const [prefix, setPrefix] = useState(
    availablePrefixes.includes(parsed.prefix) ? parsed.prefix : effectiveDefault,
  );

  // Sync prefix from external value changes (e.g. form reset, parent set).
  useEffect(() => {
    const next = parseValue(field.value, kind);
    if (next.digits || next.check) {
      setPrefix(availablePrefixes.includes(next.prefix) ? next.prefix : effectiveDefault);
    }
  }, [field.value, kind, availablePrefixes, effectiveDefault]);

  const digits = parsed.digits;
  const check = parsed.check;

  const handlePrefix = (next: string) => {
    setPrefix(next);
    if (digits || check) field.onChange(compose(next, digits, check, kind));
  };

  const handleDigits = (next: string) => {
    const cleaned = next.replace(/\D/g, '').slice(0, DIGITS_MAX[kind]);
    field.onChange(compose(prefix, cleaned, check, kind));
  };

  const handleCheck = (next: string) => {
    const cleaned = next.replace(/\D/g, '').slice(0, 1);
    field.onChange(compose(prefix, digits, cleaned, kind));
  };

  // Cuando solo hay un prefijo permitido, deshabilitamos el select para que se
  // vea claro que es fijo (ej. sucursales siempre J).
  const prefixDisabled = availablePrefixes.length === 1;

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
          disabled={prefixDisabled}
        >
          {availablePrefixes.map((p) => (
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

        {kind === 'rif' && (prefix === 'J' || prefix === 'G') && (
          // El dígito verificador solo aplica a RIF de personas jurídicas
          // (J = jurídico, G = gobierno). Para V/E/P (personas naturales con
          // RIF) no se solicita — el formato es <prefix>-<8 dígitos>.
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
