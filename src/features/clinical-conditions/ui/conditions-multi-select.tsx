import { toast } from 'sonner';

import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

import {
  type ClinicalCondition,
  type ClinicalConditionType,
} from '../api/clinical-conditions.api';
import {
  useClinicalConditionsQuery,
  useCreateClinicalConditionMutation,
} from '../api/clinical-conditions.queries';

// ----------------------------------------------------------------------

type Opt = ClinicalCondition & { inputValue?: string };
const filter = createFilterOptions<Opt>();
const CREATE_ID = '__create__';

type Props = {
  type: ClinicalConditionType;
  label: string;
  placeholder?: string;
  value: ClinicalCondition[];
  onChange: (next: ClinicalCondition[]) => void;
};

/**
 * Multi-select de alergias / condiciones crónicas desde catálogo, con "crear al
 * vuelo": si el texto no existe, ofrece crearlo (POST) y lo agrega.
 */
export function ConditionsMultiSelect({ type, label, placeholder, value, onChange }: Props) {
  const { data: options = [], isLoading } = useClinicalConditionsQuery(type);
  const createMut = useCreateClinicalConditionMutation();

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={options as Opt[]}
      value={value as Opt[]}
      loading={isLoading}
      getOptionLabel={(o) => (o.inputValue ? `Crear "${o.inputValue}"` : o.name)}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(opts, params) => {
        const filtered = filter(opts, params);
        const input = params.inputValue.trim();
        if (input && !opts.some((o) => o.name.toLowerCase() === input.toLowerCase())) {
          filtered.push({
            id: CREATE_ID,
            type,
            name: input,
            isSeed: false,
            isActive: true,
            inputValue: input,
          });
        }
        return filtered;
      }}
      onChange={async (_, newValue) => {
        const last = newValue[newValue.length - 1] as Opt | undefined;
        if (last && last.id === CREATE_ID && last.inputValue) {
          try {
            const created = await createMut.mutateAsync({ type, name: last.inputValue });
            // Evita duplicar si ya estaba seleccionada.
            if (!value.some((v) => v.id === created.id)) onChange([...value, created]);
          } catch (e) {
            toast.error((e as Error).message);
          }
          return;
        }
        onChange(newValue as ClinicalCondition[]);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder ?? 'Buscar o crear…'}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      )}
    />
  );
}
