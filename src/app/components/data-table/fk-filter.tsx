import type { SyntheticEvent } from 'react';
import type { GridFilterOperator, GridFilterInputValueProps } from '@mui/x-data-grid';

import { useMemo } from 'react';

import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

// ----------------------------------------------------------------------

export type FkOption = { id: string; label: string };

export type FkOptionsHook = () => { data?: FkOption[]; isLoading?: boolean };

interface FkFilterInputProps extends GridFilterInputValueProps {
  useOptions: FkOptionsHook;
}

const FkFilterInput = ({ item, applyValue, useOptions }: FkFilterInputProps) => {
  const { data = [], isLoading } = useOptions();

  const value = useMemo(
    () => ((item.value as string[] | undefined) ?? [])
      .map((id) => data.find((o) => o.id === id))
      .filter((o): o is FkOption => Boolean(o)),
    [item.value, data]
  );

  const handleChange = (_event: SyntheticEvent, next: FkOption[]) => {
    applyValue({ ...item, value: next.map((o) => o.id) });
  };

  return (
    <Autocomplete
      multiple
      limitTags={1}
      loading={isLoading}
      options={data}
      value={value}
      onChange={handleChange}
      disableCloseOnSelect
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
      getOptionLabel={(option) => option.label}
      renderOption={(props, option, { selected }) => (
        <li {...props} key={option.id}>
          <Checkbox size="small" style={{ marginRight: 8 }} checked={selected} />
          {option.label}
        </li>
      )}
      renderInput={(params) => <TextField {...params} variant="standard" label="Opciones" />}
    />
  );
};

// ----------------------------------------------------------------------

type CreateOperatorsArgs<TCellValue> = {
  useOptions: FkOptionsHook;
  /**
   * Returns the IDs present in a single row's cell value. Default: treat the
   * cell value as a single ID string.
   */
  getIds?: (cellValue: TCellValue) => string[];
};

export function createFkFilterOperators<TCellValue = string>({
  useOptions,
  getIds = (v) => (v == null ? [] : [String(v)]),
}: CreateOperatorsArgs<TCellValue>): GridFilterOperator[] {
  return [
    {
      label: 'alguno de',
      value: 'anyOf',
      getApplyFilterFn: ({ field, value: filterValue, operator }) => {
        const ids = (filterValue as string[] | undefined) ?? [];
        if (!field || ids.length === 0 || !operator) return null;
        return (cellValue: TCellValue) => {
          const rowIds = getIds(cellValue);
          return rowIds.some((id) => ids.includes(id));
        };
      },
      InputComponent: FkFilterInput as unknown as GridFilterOperator['InputComponent'],
      InputComponentProps: { useOptions } as Record<string, unknown>,
    },
    {
      label: 'todos de',
      value: 'allOf',
      getApplyFilterFn: ({ field, value: filterValue, operator }) => {
        const ids = (filterValue as string[] | undefined) ?? [];
        if (!field || ids.length === 0 || !operator) return null;
        return (cellValue: TCellValue) => {
          const rowIds = getIds(cellValue);
          return ids.every((id) => rowIds.includes(id));
        };
      },
      InputComponent: FkFilterInput as unknown as GridFilterOperator['InputComponent'],
      InputComponentProps: { useOptions } as Record<string, unknown>,
    },
  ];
}
