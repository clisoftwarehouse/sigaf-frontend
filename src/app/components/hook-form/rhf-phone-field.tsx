import type { TextFieldProps } from '@mui/material/TextField';

import { Controller, useFormContext } from 'react-hook-form';

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

// ----------------------------------------------------------------------

export type RHFPhoneFieldProps = Omit<TextFieldProps, 'value' | 'onChange'> & {
  name: string;
};

const HINT = 'Móvil 412/414/416/424/426 o fijo 2XX. Ej. 4121234567';

function extractDigits(value: unknown): string {
  if (typeof value !== 'string') return '';
  // Strip +58 or 58 prefix and leading 0, return up to 10 digits
  let v = value.replace(/[\s\-()]/g, '');
  if (v.startsWith('+58')) v = v.slice(3);
  else if (v.startsWith('58') && v.length > 10) v = v.slice(2);
  else if (v.startsWith('0')) v = v.slice(1);
  return v.replace(/\D/g, '').slice(0, 10);
}

export function RHFPhoneField({ name, helperText, label, ...other }: RHFPhoneFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const digits = extractDigits(field.value);

        return (
          <TextField
            fullWidth
            label={label}
            value={digits}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '').slice(0, 10);
              field.onChange(next.length === 0 ? '' : `+58${next}`);
            }}
            onBlur={field.onBlur}
            error={!!error}
            helperText={error?.message ?? helperText ?? HINT}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { inputMode: 'tel', pattern: '[0-9]*' },
              input: {
                startAdornment: <InputAdornment position="start">+58</InputAdornment>,
              },
            }}
            {...other}
          />
        );
      }}
    />
  );
}
