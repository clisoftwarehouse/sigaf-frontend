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
import {
  formatValue,
  getFieldLabel,
  getTableLabel,
  getActionLabel,
  inferChangedFields,
} from '../../model/audit-labels';

// ----------------------------------------------------------------------

const actionColor: Record<string, 'success' | 'info' | 'error'> = {
  INSERT: 'success',
  UPDATE: 'info',
  DELETE: 'error',
};

const ACTION_LOCALIZED_OPTIONS = AUDIT_ACTION_OPTIONS.map((o) => ({
  ...o,
  label: getActionLabel(o.value),
}));

export function AuditLogView() {
  const { data, isLoading, isError, error, refetch } = useAuditLogQuery({ limit: 1000 });
  const rows = data?.data ?? [];
  const userMap = data?.users ?? {};
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
        renderCell: ({ value }) => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            {value ? (value as Date).toLocaleString() : ''}
          </Box>
        ),
      },
      {
        field: 'action',
        headerName: 'Acción',
        type: 'singleSelect',
        flex: 1,
        minWidth: 140,
        valueOptions: ACTION_LOCALIZED_OPTIONS,
        renderCell: ({ row }) => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Chip
              size="small"
              color={actionColor[row.action] ?? 'default'}
              label={getActionLabel(row.action)}
            />
          </Box>
        ),
      },
      {
        field: 'tableName',
        headerName: 'Entidad',
        flex: 1.2,
        minWidth: 200,
        valueGetter: (_value, row) => getTableLabel(row.tableName),
        renderCell: ({ row }) => (
          <Stack sx={{ py: 0.5 }}>
            <Typography variant="body2">{getTableLabel(row.tableName)}</Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontFamily: 'monospace' }}
            >
              {row.tableName}
            </Typography>
          </Stack>
        ),
      },
      {
        field: 'recordId',
        headerName: 'ID del registro',
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              height: '100%',
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
            >
              {row.recordId.slice(0, 8)}…
            </Typography>
          </Box>
        ),
      },
      {
        field: 'userId',
        headerName: 'Usuario',
        flex: 1,
        minWidth: 160,
        valueGetter: (_value, row) => userMap[row.userId] ?? row.userId,
        renderCell: ({ row }) => {
          const name = userMap[row.userId];
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                height: '100%',
              }}
            >
              {name ? (
                <Typography variant="body2">{name}</Typography>
              ) : (
                <Typography
                  variant="caption"
                  sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                >
                  {row.userId.slice(0, 8)}…
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        field: 'changedFields',
        headerName: 'Campos cambiados',
        flex: 2,
        minWidth: 240,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => {
          const fields = inferChangedFields(row.changedFields, row.oldValues, row.newValues);
          if (fields.length === 0) {
            return (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                —
              </Typography>
            );
          }
          return (
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                flexWrap: 'wrap',
                alignItems: 'center',
                height: '100%',
                py: 0.5,
              }}
            >
              {fields.slice(0, 4).map((f) => (
                <Chip key={f} size="small" variant="outlined" label={getFieldLabel(f)} />
              ))}
              {fields.length > 4 && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  +{fields.length - 4}
                </Typography>
              )}
            </Box>
          );
        },
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: '100%',
            }}
          >
            <Tooltip title="Ver detalle">
              <IconButton onClick={() => setDetail(row)}>
                <Iconify icon="solar:eye-bold" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [userMap]
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
                columnVisibilityModel: { ipAddress: false },
              },
            }}
          />
        </Box>
      </Card>

      <AuditDetailDialog detail={detail} userMap={userMap} onClose={() => setDetail(null)} />
    </Container>
  );
}

// ----------------------------------------------------------------------

type AuditDetailDialogProps = {
  detail: AuditLog | null;
  userMap: Record<string, string>;
  onClose: () => void;
};

function AuditDetailDialog({ detail, userMap, onClose }: AuditDetailDialogProps) {
  return (
    <Dialog open={detail !== null} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalle del cambio</DialogTitle>
      <DialogContent dividers>
        {detail && (
          <Stack spacing={3}>
            <SummaryHeader detail={detail} userMap={userMap} />

            {detail.justification && (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Justificación
                </Typography>
                <Typography variant="body2">{detail.justification}</Typography>
              </Box>
            )}

            <FieldDiff detail={detail} userMap={userMap} />
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryHeader({
  detail,
  userMap,
}: {
  detail: AuditLog;
  userMap: Record<string, string>;
}) {
  const userName = userMap[detail.userId];
  return (
    <Stack spacing={0.5}>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
        <Chip
          size="small"
          color={actionColor[detail.action] ?? 'default'}
          label={getActionLabel(detail.action)}
        />
        <Typography variant="body2">en</Typography>
        <Typography variant="subtitle2">{getTableLabel(detail.tableName)}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
          ({detail.tableName} · {detail.recordId.slice(0, 8)}…)
        </Typography>
      </Stack>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Por <strong>{userName ?? `${detail.userId.slice(0, 8)}…`}</strong>
      </Typography>
    </Stack>
  );
}

function FieldDiff({
  detail,
  userMap,
}: {
  detail: AuditLog;
  userMap: Record<string, string>;
}) {
  const fields = inferChangedFields(detail.changedFields, detail.oldValues, detail.newValues);

  if (fields.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Sin información detallada de los campos modificados.
      </Typography>
    );
  }

  const hasOld = detail.oldValues !== null;
  const hasNew = detail.newValues !== null;

  return (
    <Stack spacing={0}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: hasOld && hasNew ? '1fr 1fr 1fr' : '1fr 2fr',
          gap: 0,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <DiffHeader>Campo</DiffHeader>
        {hasOld && <DiffHeader>Antes</DiffHeader>}
        {hasNew && <DiffHeader>{hasOld ? 'Después' : 'Valor'}</DiffHeader>}

        {fields.map((field, i) => (
          <DiffRow
            key={field}
            field={field}
            tableName={detail.tableName}
            oldValue={detail.oldValues?.[field]}
            newValue={detail.newValues?.[field]}
            hasOld={hasOld}
            hasNew={hasNew}
            userMap={userMap}
            isLast={i === fields.length - 1}
          />
        ))}
      </Box>
    </Stack>
  );
}

function DiffHeader({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ p: 1.25, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
        {children}
      </Typography>
    </Box>
  );
}

type DiffRowProps = {
  field: string;
  tableName: string;
  oldValue: unknown;
  newValue: unknown;
  hasOld: boolean;
  hasNew: boolean;
  userMap: Record<string, string>;
  isLast: boolean;
};

function DiffRow({
  field,
  tableName,
  oldValue,
  newValue,
  hasOld,
  hasNew,
  userMap,
  isLast,
}: DiffRowProps) {
  const cellSx = {
    p: 1.25,
    borderBottom: isLast ? 0 : 1,
    borderColor: 'divider',
    minWidth: 0,
  };

  return (
    <>
      <Box sx={cellSx}>
        <Typography variant="body2">{getFieldLabel(field)}</Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.disabled', fontFamily: 'monospace', display: 'block' }}
        >
          {field}
        </Typography>
      </Box>
      {hasOld && (
        <Box sx={cellSx}>
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {formatValue(field, oldValue, tableName, userMap)}
          </Typography>
        </Box>
      )}
      {hasNew && (
        <Box sx={cellSx}>
          <Typography
            variant="body2"
            sx={{ wordBreak: 'break-word', fontWeight: hasOld ? 500 : 400 }}
          >
            {formatValue(field, newValue, tableName, userMap)}
          </Typography>
        </Box>
      )}
    </>
  );
}
