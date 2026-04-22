import type { ReactNode } from 'react';

import { Controller, useFormContext } from 'react-hook-form';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

// ----------------------------------------------------------------------

export type IdOption = {
  id: string;
  label: string;
  /** Optional secondary text shown below the label in the dropdown. */
  secondaryLabel?: string | null;
};

export type RHFIdAutocompleteProps = {
  name: string;
  label?: string;
  placeholder?: string;
  options: IdOption[];
  loading?: boolean;
  disabled?: boolean;
  helperText?: ReactNode;
  noOptionsText?: string;
  fullWidth?: boolean;
};

/**
 * Autocomplete que guarda solo el `id` (string) en el form, pero muestra `label`
 * al usuario. Reemplaza a un `<Field.Select>` cuando hay muchas opciones y se
 * quiere búsqueda libre + tipeo.
 */
export function RHFIdAutocomplete({
  name,
  label,
  placeholder,
  options,
  loading = false,
  disabled = false,
  helperText,
  noOptionsText = 'Sin resultados',
  fullWidth = true,
}: RHFIdAutocompleteProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const selected = options.find((o) => o.id === field.value) ?? null;
        return (
          <Autocomplete
            fullWidth={fullWidth}
            disabled={disabled}
            loading={loading}
            options={options}
            value={selected}
            getOptionLabel={(o) => o?.label ?? ''}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText={noOptionsText}
            onChange={(_, newValue) => {
              field.onChange(newValue?.id ?? '');
            }}
            onBlur={field.onBlur}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <div>
                  <div>{option.label}</div>
                  {option.secondaryLabel && (
                    <div style={{ fontSize: 12, color: 'var(--mui-palette-text-secondary)' }}>
                      {option.secondaryLabel}
                    </div>
                  )}
                </div>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                placeholder={placeholder}
                error={!!error}
                helperText={error?.message ?? helperText}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { ...params.inputProps, autoComplete: 'new-password' },
                }}
              />
            )}
          />
        );
      }}
    />
  );
}
