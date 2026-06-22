import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useReceiptsQuery } from '@/features/purchases/api/purchases.queries';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  branchId: string | undefined;
  onConfirm: (receiptId: string) => void;
  onClose: () => void;
};

export function FromReceiptDialog({ open, branchId, onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<string>('');

  // QA 177: solo recepciones que aún no fueron transferidas (el backend excluye
  // las que ya tienen una transferencia no cancelada asociada).
  const { data, isLoading } = useReceiptsQuery({ branchId, pendingTransfer: true });

  const eligibleReceipts = useMemo(
    () => (data?.data ?? []).filter((r) => !r.requiresReapproval).slice(0, 50),
    [data]
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Cargar items desde recepción</DialogTitle>
      <DialogContent dividers>
        {!branchId && (
          <Alert severity="info">Selecciona primero la sucursal origen para listar recepciones.</Alert>
        )}
        {branchId && !isLoading && eligibleReceipts.length === 0 && (
          <Alert severity="warning">No hay recepciones aptas en la sucursal seleccionada.</Alert>
        )}
        {branchId && eligibleReceipts.length > 0 && (
          <RadioGroup value={selected} onChange={(e) => setSelected(e.target.value)}>
            <Stack spacing={1}>
              {eligibleReceipts.map((r) => (
                <FormControlLabel
                  key={r.id}
                  value={r.id}
                  control={<Radio />}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    m: 0,
                    p: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {r.receiptNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {r.receiptDate.slice(0, 10)} · USD {Number(r.totalUsd).toFixed(2)} · {r.receiptType}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </Stack>
          </RadioGroup>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!selected}
          onClick={() => {
            onConfirm(selected);
            setSelected('');
          }}
        >
          Continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
