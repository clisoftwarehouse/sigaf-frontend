import type { GridColDef } from '@mui/x-data-grid';
import type { AuditLog } from '../../model/types';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { DataTable } from '@/app/components/data-table';

import { AUDIT_ACTION_OPTIONS } from '../../model/types';
import { useAuditLogQuery } from '../../api/audit.queries';

// ----------------------------------------------------------------------

const actionColor: Record<string, 'success' | 'info' | 'error'> = {
  INSERT: 'success',
  UPDATE: 'info',
  DELETE: 'error',
};

export function AuditLogView() {
  const { data, isLoading, isError, error, refetch } = useAuditLogQuery({ limit: 1000 });
  const rows = data?.data ?? [];
  const [detail, setDetail] = useState<AuditLog | null>(null);

  const columns = useMemo<GridColDef<AuditLog>[]>(
    () => [
      {
        field: 'createdAt',
        headerName: 'Fecha',
        type: 'dateTime',
        flex: 1,
        minWidth: 180,
        valueGetter: (value: string) => new Date(value),
      },
      {
        field: 'action',
        headerName: 'Acción',
        type: 'singleSelect',
        flex: 1,
        minWidth: 130,
        valueOptions: AUDIT_ACTION_OPTIONS,
        renderCell: ({ row }) => (
          <Chip size="small" color={actionColor[row.action] ?? 'default'} label={row.action} />
        ),
      },
      {
        field: 'tableName',
        headerName: 'Tabla',
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {row.tableName}
          </Typography>
        ),
      },
      {
        field: 'recordId',
        headerName: 'ID del registro',
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => (
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {row.recordId.slice(0, 8)}
          </Typography>
        ),
      },
      {
        field: 'userId',
        headerName: 'Usuario',
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {row.userId.slice(0, 8)}
          </Typography>
        ),
      },
      {
        field: 'changedFields',
        headerName: 'Campos cambiados',
        flex: 2,
        minWidth: 220,
        sortable: false,
        filterable: false,
        valueGetter: (value: string[] | null) => value?.join(', ') ?? '—',
      },
      {
        field: 'ipAddress',
        headerName: 'IP',
        flex: 1,
        minWidth: 130,
        valueGetter: (value: string | null) => value ?? '—',
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Detalle',
        width: 80,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Tooltip title="Ver diff">
            <IconButton onClick={() => setDetail(row)}>
              <Iconify icon="solar:eye-bold" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    []
  );

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Log de auditoría"
        subtitle="Histórico inmutable de cambios en datos críticos."
        crumbs={[{ label: 'Administración' }, { label: 'Auditoría' }]}
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
              {(error as Error)?.message ?? 'Error al cargar auditoría'}
            </Alert>
          </Box>
        )}

        <Box sx={{ width: '100%' }}>
          <DataTable
            columns={columns}
            rows={rows}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
            initialState={{
              columns: {
                columnVisibilityModel: { ipAddress: false, userId: false },
              },
            }}
          />
        </Box>
      </Card>

      <Dialog open={detail !== null} onClose={() => setDetail(null)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle del cambio</DialogTitle>
        <DialogContent dividers>
          {detail && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Acción
                </Typography>
                <Typography variant="body1">
                  <Chip size="small" color={actionColor[detail.action] ?? 'default'} label={detail.action} />{' '}
                  en <code>{detail.tableName}</code>
                </Typography>
              </Box>
              {detail.justification && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Justificación
                  </Typography>
                  <Typography variant="body2">{detail.justification}</Typography>
                </Box>
              )}
              {detail.oldValues && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Valores anteriores
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      p: 2,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: 12,
                      overflow: 'auto',
                      maxHeight: 240,
                    }}
                  >
                    {JSON.stringify(detail.oldValues, null, 2)}
                  </Box>
                </Box>
              )}
              {detail.newValues && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Valores nuevos
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      p: 2,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: 12,
                      overflow: 'auto',
                      maxHeight: 240,
                    }}
                  >
                    {JSON.stringify(detail.newValues, null, 2)}
                  </Box>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
