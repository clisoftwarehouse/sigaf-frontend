import type { GridColDef } from '@mui/x-data-grid';
import type {
  SupplierContact,
  CreateSupplierContactPayload,
} from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from '@/app/components/iconify';
import { DataTable } from '@/app/components/data-table';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

import {
  useSupplierContactsQuery,
  useCreateSupplierContactMutation,
  useUpdateSupplierContactMutation,
  useDeleteSupplierContactMutation,
} from '../../api/suppliers.queries';

// ----------------------------------------------------------------------

type ContactDraft = CreateSupplierContactPayload;

const emptyDraft = (): ContactDraft => ({
  fullName: '',
  role: '',
  department: '',
  email: '',
  phone: '',
  mobile: '',
  isPrimary: false,
  isActive: true,
  notes: '',
});

const cleanDraft = (draft: ContactDraft): ContactDraft => {
  const out: ContactDraft = { fullName: draft.fullName.trim() };
  if (draft.role?.trim()) out.role = draft.role.trim();
  if (draft.department?.trim()) out.department = draft.department.trim();
  if (draft.email?.trim()) out.email = draft.email.trim();
  if (draft.phone?.trim()) out.phone = draft.phone.trim();
  if (draft.mobile?.trim()) out.mobile = draft.mobile.trim();
  if (draft.notes?.trim()) out.notes = draft.notes.trim();
  out.isPrimary = Boolean(draft.isPrimary);
  out.isActive = draft.isActive ?? true;
  return out;
};

interface Props {
  supplierId: string;
}

export function SupplierContactsTab({ supplierId }: Props) {
  const { data: contacts = [], isLoading, isError, error, refetch } = useSupplierContactsQuery(supplierId);
  const createMutation = useCreateSupplierContactMutation(supplierId);
  const updateMutation = useUpdateSupplierContactMutation(supplierId);
  const deleteMutation = useDeleteSupplierContactMutation(supplierId);

  const [editing, setEditing] = useState<SupplierContact | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<SupplierContact | null>(null);
  const [draft, setDraft] = useState<ContactDraft>(emptyDraft());

  const openCreate = () => {
    setDraft(emptyDraft());
    setCreating(true);
  };

  const openEdit = (contact: SupplierContact) => {
    setEditing(contact);
    setDraft({
      fullName: contact.fullName,
      role: contact.role ?? '',
      department: contact.department ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      mobile: contact.mobile ?? '',
      isPrimary: contact.isPrimary,
      isActive: contact.isActive,
      notes: contact.notes ?? '',
    });
  };

  const closeDialog = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = async () => {
    const payload = cleanDraft(draft);
    if (!payload.fullName) {
      toast.error('El nombre es obligatorio');
      return;
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ contactId: editing.id, payload });
        toast.success('Contacto actualizado');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Contacto creado');
      }
      closeDialog();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success('Contacto eliminado');
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const columns = useMemo<GridColDef<SupplierContact>[]>(
    () => [
      {
        field: 'fullName',
        headerName: 'Nombre',
        flex: 2,
        minWidth: 180,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2">{row.fullName}</Typography>
            {row.isPrimary && <Chip size="small" color="info" label="Principal" />}
          </Stack>
        ),
      },
      {
        field: 'role',
        headerName: 'Cargo',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: string | null) => value ?? '—',
      },
      {
        field: 'department',
        headerName: 'Departamento',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: string | null) => value ?? '—',
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1.5,
        minWidth: 180,
        valueGetter: (value: string | null) => value ?? '—',
      },
      {
        field: 'phone',
        headerName: 'Teléfono',
        flex: 1,
        minWidth: 140,
        valueGetter: (value: string | null) => value ?? '—',
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
        width: 110,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <>
            <Tooltip title="Editar">
              <IconButton onClick={() => openEdit(row)}>
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton color="error" onClick={() => setToDelete(row)}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          </>
        ),
      },
    ],
    []
  );

  const dialogOpen = creating || editing !== null;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          Personas de contacto ({contacts.length})
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={openCreate}
        >
          Agregar contacto
        </Button>
      </Stack>

      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        >
          {(error as Error)?.message ?? 'Error al cargar contactos'}
        </Alert>
      )}

      <Box sx={{ width: '100%' }}>
        <DataTable
          columns={columns}
          rows={contacts}
          loading={isLoading}
          disableRowSelectionOnClick
          autoHeight
        />
      </Box>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar contacto' : 'Nuevo contacto'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Nombre completo"
              value={draft.fullName}
              onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Cargo"
                value={draft.role ?? ''}
                onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Departamento"
                value={draft.department ?? ''}
                onChange={(e) => setDraft({ ...draft, department: e.target.value })}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            <TextField
              label="Email"
              type="email"
              value={draft.email ?? ''}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Teléfono"
                value={draft.phone ?? ''}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Móvil"
                value={draft.mobile ?? ''}
                onChange={(e) => setDraft({ ...draft, mobile: e.target.value })}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            <TextField
              label="Notas"
              value={draft.notes ?? ''}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              multiline
              rows={2}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.isPrimary ?? false}
                    onChange={(e) => setDraft({ ...draft, isPrimary: e.target.checked })}
                  />
                }
                label="Contacto principal"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.isActive ?? true}
                    onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                  />
                }
                label="Activo"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={closeDialog}>
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

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar contacto"
        description={
          toDelete ? (
            <>
              ¿Seguro que deseas eliminar a <strong>{toDelete.fullName}</strong>?
            </>
          ) : null
        }
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </Box>
  );
}
