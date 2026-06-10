import type { Prescriber, PrescriberFilters } from '../../model/types';

import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from '@/app/components/iconify';

import { PrescriberFormDialog } from '../components/prescriber-form-dialog';
import { usePrescribersList, useDeactivatePrescriber } from '../../api/prescribers.queries';

export function PrescribersListView() {
  const [filters, setFilters] = useState<PrescriberFilters>({ page: 1, limit: 25, isActive: true });
  const [editing, setEditing] = useState<Prescriber | null>(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError } = usePrescribersList(filters);
  const deactivateMut = useDeactivatePrescriber();

  const handleOpen = (p: Prescriber | null) => {
    setEditing(p);
    setOpen(true);
  };

  const handleDeactivate = (id: string, name: string) => {
    if (!window.confirm(`¿Desactivar a ${name}?`)) return;
    deactivateMut.mutate(id, {
      onSuccess: () => toast.success('Médico desactivado'),
      onError: (err: Error) => toast.error(`Error: ${err.message}`),
    });
  };

  return (
    <>
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center">
          <TextField
            size="small"
            placeholder="Buscar por nombre, MPPS o cédula…"
            value={filters.search ?? ''}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
            sx={{ flex: 1 }}
          />
          <TextField
            select
            size="small"
            label="Estado"
            value={filters.isActive === undefined ? '' : filters.isActive ? 'active' : 'inactive'}
            onChange={(e) => {
              const v = e.target.value;
              setFilters((p) => ({
                ...p,
                isActive: v === '' ? undefined : v === 'active',
                page: 1,
              }));
            }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="active">Activos</MenuItem>
            <MenuItem value="inactive">Inactivos</MenuItem>
          </TextField>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => handleOpen(null)}
          >
            Nuevo médico
          </Button>
        </Stack>
      </Card>

      {isLoading && <LinearProgress />}
      {isError && <Alert severity="error">No se pudo cargar la lista</Alert>}

      {data && data.data.length === 0 && !isLoading && (
        <Alert severity="info">No hay médicos registrados con esos filtros.</Alert>
      )}

      {data && data.data.length > 0 && (
        <Card sx={{ overflow: 'hidden' }}>
          <Box sx={{ overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Especialidad</TableCell>
                  <TableCell>MPPS</TableCell>
                  <TableCell>Cédula</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center" sx={{ width: 96 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {p.fullName}
                      </Typography>
                      {p.email && (
                        <Typography variant="caption" color="text.disabled">
                          {p.email}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{p.specialty ?? '—'}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {p.mppsNumber ?? '—'}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {p.nationalId ?? '—'}
                    </TableCell>
                    <TableCell>{p.phone ?? '—'}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        color={p.isActive ? 'success' : 'default'}
                        variant="outlined"
                        label={p.isActive ? 'Activo' : 'Inactivo'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleOpen(p)} title="Editar">
                        <Iconify icon="solar:pen-bold" width={16} />
                      </IconButton>
                      {p.isActive && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeactivate(p.id, p.fullName)}
                          title="Desactivar"
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {data.pagination.totalPages > 1 && (
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}
            >
              <Typography variant="caption" color="text.secondary">
                Página {data.pagination.page} de {data.pagination.totalPages} ·{' '}
                {data.pagination.total} médicos
              </Typography>
              <Pagination
                count={data.pagination.totalPages}
                page={data.pagination.page}
                onChange={(_, page) => setFilters((p) => ({ ...p, page }))}
                shape="rounded"
                size="small"
              />
            </Stack>
          )}
        </Card>
      )}

      <PrescriberFormDialog
        open={open}
        prescriber={editing}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
      />
    </>
  );
}
