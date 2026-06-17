import type { ReactNode } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';

type Props = {
  title: string;
  subtitle: string;
  crumbs: { label: string }[];
  filters?: ReactNode;
  summary?: ReactNode;
  onExcel: () => void;
  onPdf: () => void;
  exportDisabled?: boolean;
  loading: boolean;
  error?: unknown;
  empty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
};

export function ReportLayout({
  title,
  subtitle,
  crumbs,
  filters,
  summary,
  onExcel,
  onPdf,
  exportDisabled,
  loading,
  error,
  empty,
  emptyMessage = 'No hay datos para los filtros seleccionados.',
  children,
}: Props) {
  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <PageHeader title={title} subtitle={subtitle} crumbs={crumbs} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
        flexWrap="wrap"
        gap={1}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} alignItems="center">
          {summary}
        </Stack>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
          {filters}
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:file-text-bold" />}
            onClick={onExcel}
            disabled={exportDisabled}
          >
            Excel
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<Iconify icon="solar:file-corrupted-bold-duotone" />}
            onClick={onPdf}
            disabled={exportDisabled}
          >
            PDF
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <LinearProgress />
      ) : error ? (
        <Alert severity="error">{(error as Error)?.message ?? 'Error'}</Alert>
      ) : empty ? (
        <Alert severity="info">{emptyMessage}</Alert>
      ) : (
        <Card sx={{ overflow: 'hidden' }}>{children}</Card>
      )}
    </Container>
  );
}
