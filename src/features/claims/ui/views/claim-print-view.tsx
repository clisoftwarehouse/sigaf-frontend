import { useParams } from 'react-router';
import { useMemo, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from '@/app/global-config';
import { Iconify } from '@/app/components/iconify';
import { useBranchOptions } from '@/features/branches/api/branches.options';
import { useReceiptQuery } from '@/features/purchases/api/purchases.queries';
import { useSupplierOptions } from '@/features/suppliers/api/suppliers.options';

import { useClaimQuery } from '../../api/claims.queries';
import { CLAIM_TYPE_LABEL, CLAIM_STATUS_LABEL } from '../../model/constants';

// ----------------------------------------------------------------------

export function ClaimPrintView() {
  const { id } = useParams<{ id: string }>();
  const { data: claim, isLoading, isError, error } = useClaimQuery(id);

  const { data: supplierOpts = [] } = useSupplierOptions();
  const supplierName = useMemo(
    () => supplierOpts.find((s) => s.id === claim?.supplierId)?.label ?? claim?.supplierId ?? '—',
    [supplierOpts, claim]
  );
  const { data: branchOpts = [] } = useBranchOptions();
  const branchName = useMemo(
    () =>
      claim?.branchId ? (branchOpts.find((b) => b.id === claim.branchId)?.label ?? null) : null,
    [branchOpts, claim]
  );
  const { data: relatedReceipt } = useReceiptQuery(claim?.receiptId ?? undefined);

  // Auto-open print dialog once data is loaded
  useEffect(() => {
    if (claim && !isLoading) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [claim, isLoading]);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
        @page { size: A4; margin: 20mm; }
      `}</style>

      <Container maxWidth="md" sx={{ py: 4, bgcolor: 'background.paper' }}>
        <Box className="no-print" sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
            onClick={() => window.print()}
          >
            Imprimir
          </Button>
          <Button variant="outlined" color="inherit" onClick={() => window.close()}>
            Cerrar
          </Button>
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>}

        {claim && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {CONFIG.appName ?? 'SIGAF'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Departamento de Compras
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Reclamo a proveedor
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {claim.claimNumber}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {new Date(claim.createdAt).toLocaleDateString('es-VE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            <Stack direction="row" spacing={4} sx={{ mb: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Proveedor
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {supplierName}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Tipo de reclamo
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {CLAIM_TYPE_LABEL[claim.claimType] ?? claim.claimType}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Estado
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {CLAIM_STATUS_LABEL[claim.status] ?? claim.status}
                </Typography>
              </Box>
            </Stack>

            {(branchName || relatedReceipt || claim.amountUsd != null) && (
              <Stack direction="row" spacing={4} sx={{ mb: 3 }}>
                {branchName && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Sucursal
                    </Typography>
                    <Typography variant="body1">{branchName}</Typography>
                  </Box>
                )}
                {relatedReceipt && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Recepción asociada
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {relatedReceipt.receiptNumber}
                    </Typography>
                    {relatedReceipt.supplierInvoiceNumber && (
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        Factura: {relatedReceipt.supplierInvoiceNumber}
                      </Typography>
                    )}
                  </Box>
                )}
                {claim.amountUsd != null && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Monto reclamado
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      ${Number(claim.amountUsd).toFixed(2)}
                    </Typography>
                  </Box>
                )}
              </Stack>
            )}

            <Divider sx={{ mb: 3 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Asunto
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, fontWeight: 600 }}>
              {claim.title}
            </Typography>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Descripción
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
              {claim.description}
            </Typography>

            {claim.resolutionNotes && (
              <>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Resolución
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {claim.resolutionNotes}
                </Typography>
                {claim.resolvedAt && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1 }}>
                    Resuelto el{' '}
                    {new Date(claim.resolvedAt).toLocaleDateString('es-VE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                )}
              </>
            )}

            <Box sx={{ mt: 8 }}>
              <Divider sx={{ mb: 1 }} />
              <Stack direction="row" spacing={4}>
                <Box sx={{ flex: 1, pt: 6, borderTop: '1px solid', borderColor: 'text.disabled' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Firma responsable SIGAF
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, pt: 6, borderTop: '1px solid', borderColor: 'text.disabled' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Firma del proveedor
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        )}
      </Container>
    </>
  );
}
