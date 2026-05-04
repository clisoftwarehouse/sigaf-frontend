import type { ClaimStatus, UpdateClaimPayload } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useReceiptQuery } from '@/features/purchases/api/purchases.queries';
import { useSupplierOptions } from '@/features/suppliers/api/suppliers.options';

import { useClaimQuery, useUpdateClaimMutation } from '../../api/claims.queries';
import {
  CLAIM_TYPE_LABEL,
  CLAIM_STATUS_COLOR,
  CLAIM_STATUS_LABEL,
  CLAIM_STATUS_OPTIONS,
} from '../../model/constants';

// ----------------------------------------------------------------------

export function ClaimDetailView() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: claim, isLoading, isError, error } = useClaimQuery(id);
  const updateMutation = useUpdateClaimMutation();

  const { data: supplierOpts = [] } = useSupplierOptions();
  const supplierName = useMemo(
    () => supplierOpts.find((s) => s.id === claim?.supplierId)?.label ?? claim?.supplierId ?? '—',
    [supplierOpts, claim]
  );
  const { data: branchOpts = [] } = useBranchOptions();
  const branchName = useMemo(
    () =>
      claim?.branchId
        ? (branchOpts.find((b) => b.id === claim.branchId)?.label ?? claim.branchId)
        : null,
    [branchOpts, claim]
  );
  const { data: relatedReceipt } = useReceiptQuery(claim?.receiptId ?? undefined);

  const [pendingStatus, setPendingStatus] = useState<ClaimStatus | ''>('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const saveUpdate = async (payload: UpdateClaimPayload) => {
    if (!claim) return;
    try {
      await updateMutation.mutateAsync({ id: claim.id, payload });
      toast.success('Reclamo actualizado');
      setPendingStatus('');
      setResolutionNotes('');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <PageHeader
        title={claim ? `Reclamo ${claim.claimNumber}` : 'Reclamo'}
        subtitle={claim ? new Date(claim.createdAt).toLocaleString('es-VE') : undefined}
        crumbs={[{ label: 'Compras' }, { label: 'Reclamos' }, { label: 'Detalle' }]}
        action={
          <Stack direction="row" spacing={1}>
            {claim && (
              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
                onClick={() => window.open(paths.dashboard.claims.print(claim.id), '_blank')}
              >
                Imprimir / PDF
              </Button>
            )}
            <Button
              variant="outlined"
              color="inherit"
              startIcon={
                <Iconify
                  icon="solar:double-alt-arrow-right-bold-duotone"
                  sx={{ transform: 'scaleX(-1)' }}
                />
              }
              onClick={() => router.push(paths.dashboard.claims.root)}
            >
              Volver
            </Button>
          </Stack>
        }
      />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

      {claim && (
        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              justifyContent="space-between"
              flexWrap="wrap"
              useFlexGap
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Estado
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    variant="soft"
                    color={CLAIM_STATUS_COLOR[claim.status]}
                    label={CLAIM_STATUS_LABEL[claim.status]}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Tipo
                </Typography>
                <Typography variant="body1">
                  {CLAIM_TYPE_LABEL[claim.claimType] ?? claim.claimType}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Proveedor
                </Typography>
                <Typography variant="body1">{supplierName}</Typography>
              </Box>
              {branchName && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Sucursal
                  </Typography>
                  <Typography variant="body1">{branchName}</Typography>
                </Box>
              )}
              {relatedReceipt && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Recepción asociada
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() =>
                      router.push(paths.dashboard.purchases.receipts.detail(relatedReceipt.id))
                    }
                    sx={{ p: 0, minWidth: 0, justifyContent: 'flex-start' }}
                  >
                    {relatedReceipt.receiptNumber}
                  </Button>
                </Box>
              )}
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Monto reclamado
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {claim.amountUsd != null ? `$${Number(claim.amountUsd).toFixed(2)}` : '—'}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 2.5, borderStyle: 'dashed' }} />

            <Typography variant="subtitle1">{claim.title}</Typography>
            <Typography
              variant="body2"
              sx={{ mt: 1, whiteSpace: 'pre-wrap', color: 'text.secondary' }}
            >
              {claim.description}
            </Typography>
          </Card>

          {claim.resolutionNotes && (
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Resolución
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                {claim.resolutionNotes}
              </Typography>
              {claim.resolvedAt && (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled', display: 'block', mt: 1 }}
                >
                  Resuelto el {new Date(claim.resolvedAt).toLocaleString('es-VE')}
                </Typography>
              )}
            </Card>
          )}

          {claim.status !== 'resolved' && (
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
                Actualizar estado
              </Typography>
              <Stack spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Nuevo estado"
                  value={pendingStatus}
                  onChange={(e) => setPendingStatus(e.target.value as ClaimStatus)}
                  slotProps={{ inputLabel: { shrink: true } }}
                >
                  <MenuItem value="">— Mantener ({CLAIM_STATUS_LABEL[claim.status]}) —</MenuItem>
                  {CLAIM_STATUS_OPTIONS.filter((o) => o.value !== claim.status).map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>

                {(pendingStatus === 'resolved' || pendingStatus === 'rejected') && (
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Notas de resolución"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}

                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    disabled={!pendingStatus}
                    loading={updateMutation.isPending}
                    onClick={() =>
                      saveUpdate({
                        status: pendingStatus as ClaimStatus,
                        resolutionNotes: resolutionNotes.trim() || undefined,
                      })
                    }
                  >
                    Guardar
                  </Button>
                </Stack>
              </Stack>
            </Card>
          )}
        </Stack>
      )}
    </Container>
  );
}
