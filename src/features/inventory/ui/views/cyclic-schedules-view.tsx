import type { GridColDef } from '@mui/x-data-grid';
import type {
  AbcClass,
  RiskLevel,
  CyclicSchedule,
  CreateCyclicSchedulePayload,
} from '../../model/counts-types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';
import { useBranchOptions } from '@/features/branches/api/branches.options';

import { ABC_CLASSES, RISK_LEVELS, RISK_LEVEL_LABEL } from '../../model/counts-types';
import {
  useCyclicSchedulesQuery,
  useCreateCyclicScheduleMutation,
  useUpdateCyclicScheduleMutation,
} from '../../api/counts.queries';

// ----------------------------------------------------------------------

type Draft = {
  branchId: string;
  name: string;
  abcClasses: AbcClass[];
  riskLevels: RiskLevel[];
  frequencyDays: number;
  maxSkusPerCount: number;
  autoGenerate: boolean;
  isActive: boolean;
};

const emptyDraft = (): Draft => ({
  branchId: '',
  name: '',
  abcClasses: ['A'],
  riskLevels: [],
  frequencyDays: 7,
  maxSkusPerCount: 50,
  autoGenerate: true,
  isActive: true,
});

export function CyclicSchedulesView() {
  const { data: schedules = [], isLoading, isError, error, refetch } = useCyclicSchedulesQuery();
  const createMutation = useCreateCyclicScheduleMutation();
  const updateMutation = useUpdateCyclicScheduleMutation();

  const { data: branchOpts = [] } = useBranchOptions();
  const branchNameById = useMemo(
    () => new Map(branchOpts.map((o) => [o.id, o.label] as const)),
    [branchOpts]
  );

  const [editing, setEditing] = useState<CyclicSchedule | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());

  const openCreate = () => {
    setDraft(emptyDraft());
    setCreating(true);
  };

  const openEdit = (s: CyclicSchedule) => {
    setEditing(s);
    setDraft({
      branchId: s.branchId,
      name: s.name,
      abcClasses: s.abcClasses as AbcClass[],
      riskLevels: (s.riskLevels ?? []) as RiskLevel[],
      frequencyDays: s.frequencyDays,
      maxSkusPerCount: s.maxSkusPerCount,
      autoGenerate: s.autoGenerate,
      isActive: s.isActive,
    });
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = async () => {
    if (!draft.branchId) {
      toast.error('Selecciona una sucursal');
      return;
    }
    if (!draft.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (draft.abcClasses.length === 0) {
      toast.error('Debe incluir al menos una clase ABC');
      return;
    }
    const payload: CreateCyclicSchedulePayload = {
      branchId: draft.branchId,
      name: draft.name.trim(),
      abcClasses: draft.abcClasses,
      riskLevels: draft.riskLevels.length > 0 ? draft.riskLevels : undefined,
      frequencyDays: draft.frequencyDays,
      maxSkusPerCount: draft.maxSkusPerCount,
      autoGenerate: draft.autoGenerate,
      isActive: draft.isActive,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success('Programa actualizado');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Programa creado');
      }
      close();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const columns = useMemo<GridColDef<CyclicSchedule>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Nombre',
        flex: 2,
        minWidth: 200,
        renderCell: ({ row }) => <Typography variant="subtitle2">{row.name}</Typography>,
      },
      {
        field: 'branchId',
        headerName: 'Sucursal',
        flex: 1.5,
        minWidth: 180,
        valueFormatter: (value: string) => branchNameById.get(value) ?? value,
      },
      {
        field: 'abcClasses',
        headerName: 'Clases ABC',
        flex: 1,
        minWidth: 140,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: '100%' }}>
            {row.abcClasses.map((c) => (
              <Chip key={c} size="small" label={c} variant="outlined" />
            ))}
          </Stack>
        ),
      },
      {
        field: 'riskLevels',
        headerName: 'Riesgo',
        flex: 1.5,
        minWidth: 180,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) =>
          row.riskLevels && row.riskLevels.length > 0 ? (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: '100%' }}>
              {row.riskLevels.map((r) => (
                <Chip
                  key={r}
                  size="small"
                  label={RISK_LEVEL_LABEL[r as RiskLevel] ?? r}
                  variant="outlined"
                />
              ))}
            </Stack>
          ) : (
            <span>—</span>
          ),
      },
      {
        field: 'frequencyDays',
        headerName: 'Frecuencia',
        type: 'number',
        flex: 1,
        minWidth: 130,
        valueFormatter: (value: number) => `${value} días`,
      },
      {
        field: 'maxSkusPerCount',
        headerName: 'Máx SKUs',
        type: 'number',
        flex: 1,
        minWidth: 110,
      },
      {
        field: 'autoGenerate',
        headerName: 'Auto-generar',
        type: 'boolean',
        flex: 1,
        minWidth: 130,
      },
      {
        field: 'isActive',
        headerName: 'Activo',
        type: 'boolean',
        flex: 1,
        minWidth: 110,
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Acciones',
        width: 80,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Tooltip title="Editar">
            <IconButton onClick={() => openEdit(row)}>
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [branchNameById]
  );

  const dialogOpen = creating || editing !== null;

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Programas de conteo cíclico"
        subtitle="Planificación por clases ABC y niveles de riesgo. Genera tomas cíclicas automáticamente."
        crumbs={[{ label: 'Inventario' }, { label: 'Conteo cíclico' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={openCreate}
          >
            Nuevo programa
          </Button>
        }
      />

      <Card>
        {isError && (
          <Box sx={{ p: 2 }}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => refetch()}>
                  Reintentar
                </Button>
              }
            >
              {(error as Error)?.message ?? 'Error al cargar programas'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={schedules}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>

      <Dialog open={dialogOpen} onClose={close} maxWidth="xl" fullWidth>
        <DialogTitle>
          {editing ? 'Editar programa' : 'Nuevo programa de conteo cíclico'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label="Sucursal"
              value={draft.branchId}
              onChange={(e) => setDraft({ ...draft, branchId: e.target.value })}
              disabled={Boolean(editing)}
              slotProps={{ inputLabel: { shrink: true } }}
            >
              {branchOpts.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Nombre"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Conteo cíclico clase A semanal"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              select
              label="Clases ABC"
              value={draft.abcClasses}
              onChange={(e) => {
                const value = e.target.value as unknown as AbcClass[];
                setDraft({ ...draft, abcClasses: value });
              }}
              slotProps={{ select: { multiple: true }, inputLabel: { shrink: true } }}
            >
              {ABC_CLASSES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Niveles de riesgo (opcional)"
              value={draft.riskLevels}
              onChange={(e) => {
                const value = e.target.value as unknown as RiskLevel[];
                setDraft({ ...draft, riskLevels: value });
              }}
              slotProps={{ select: { multiple: true }, inputLabel: { shrink: true } }}
            >
              {RISK_LEVELS.map((r) => (
                <MenuItem key={r} value={r}>
                  {RISK_LEVEL_LABEL[r]}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Frecuencia (días)"
                type="number"
                value={draft.frequencyDays}
                onChange={(e) => setDraft({ ...draft, frequencyDays: Number(e.target.value) || 1 })}
                fullWidth
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { min: 1, max: 365 },
                }}
              />
              <TextField
                label="Máx SKUs por toma"
                type="number"
                value={draft.maxSkusPerCount}
                onChange={(e) =>
                  setDraft({ ...draft, maxSkusPerCount: Number(e.target.value) || 1 })
                }
                fullWidth
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 1 } }}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.autoGenerate}
                    onChange={(e) => setDraft({ ...draft, autoGenerate: e.target.checked })}
                  />
                }
                label="Auto-generar"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.isActive}
                    onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                  />
                }
                label="Activo"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={close}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={save}
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {editing ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
