import type { InventoryLot } from '../../model/types';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import ListItemButton from '@mui/material/ListItemButton';
import CircularProgress from '@mui/material/CircularProgress';

import { useLotsQuery } from '../../api/inventory.queries';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  productId: string | null;
  branchId: string | null;
  productName?: string;
  branchName?: string;
  onClose: () => void;
  onPick: (lot: InventoryLot) => void;
};

export function LotPickerDialog({
  open,
  productId,
  branchId,
  productName,
  branchName,
  onClose,
  onPick,
}: Props) {
  const enabled = open && !!productId && !!branchId;

  const { data, isLoading, isError, error } = useLotsQuery(
    enabled
      ? {
          productId: productId ?? undefined,
          branchId: branchId ?? undefined,
          page: 1,
          limit: 200,
        }
      : {}
  );

  const lots = enabled ? (data?.data ?? []) : [];
  // Mostramos TODOS los lotes activos del producto, incluyendo los agotados:
  // un ajuste POSITIVO debe poder reingresar stock a un lote existente que
  // quedó en 0. El sentido del ajuste se decide después en AdjustmentDialog;
  // si es negativo y el lote está agotado, el backend rechaza ahí.
  const active = lots.filter((l) => l.status === 'available');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>Seleccionar lote para ajustar</DialogTitle>

      <DialogContent dividers sx={{ maxHeight: 500 }}>
        {(productName || branchName) && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
            {productName ?? ''}
            {productName && branchName ? ' · ' : ''}
            {branchName ?? ''}
          </Typography>
        )}

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {isError && (
          <Alert severity="error">{(error as Error)?.message ?? 'Error al cargar lotes'}</Alert>
        )}

        {!isLoading && !isError && active.length === 0 && (
          <Alert severity="info">
            No hay lotes registrados para este producto en esta sucursal. Para ingresar stock
            por primera vez crea una recepción en el módulo de Compras.
          </Alert>
        )}

        {active.length > 0 && (
          <List disablePadding>
            {active.map((lot) => {
              const qty = Number(lot.quantityAvailable) || 0;
              const empty = qty === 0;
              return (
                <ListItem key={lot.id} disablePadding>
                  <ListItemButton onClick={() => onPick(lot)}>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
                            {lot.lotNumber}
                          </Typography>
                          <Chip
                            size="small"
                            color={empty ? 'warning' : 'default'}
                            variant={empty ? 'soft' : 'outlined'}
                            label={empty ? 'Agotado' : `Disp. ${qty}`}
                          />
                        </Stack>
                      }
                      secondary={
                        lot.expirationDate
                          ? `Vence: ${lot.expirationDate}`
                          : 'Sin fecha de vencimiento'
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
