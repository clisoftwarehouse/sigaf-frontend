import type { ImportType, ImportResult, ImportTypeMeta } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';

import { IMPORT_TYPES } from '../../model/types';
import { useRunImportMutation, useDownloadTemplateMutation } from '../../api/imports.queries';

// ----------------------------------------------------------------------

export function ImportsView() {
  const [activeType, setActiveType] = useState<ImportType>('products');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const downloadMutation = useDownloadTemplateMutation();
  const runMutation = useRunImportMutation();

  const meta = useMemo<ImportTypeMeta>(
    () => IMPORT_TYPES.find((t) => t.key === activeType) ?? IMPORT_TYPES[0],
    [activeType]
  );

  // Resetear archivo y resultado al cambiar de tipo.
  const handleTypeChange = (_: React.SyntheticEvent, next: ImportType) => {
    setActiveType(next);
    setFile(null);
    setResult(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
    setFile(next);
    setResult(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadMutation.mutateAsync({ type: activeType, filename: meta.templateFilename });
      toast.success(`Template "${meta.templateFilename}" descargado`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const runImport = async (dryRun: boolean) => {
    if (!file) {
      toast.error('Selecciona un archivo primero');
      return;
    }
    try {
      const next = await runMutation.mutateAsync({ type: activeType, file, dryRun });
      setResult(next);
      if (dryRun) {
        if (next.failed === 0) {
          toast.success(`Dry-run exitoso: ${next.success} filas listas para importar`);
        } else {
          toast.warning(`Dry-run con ${next.failed} errores — revisa el detalle abajo`);
        }
      } else if (next.failed === 0) {
        toast.success(`Importación exitosa: ${next.created} creados, ${next.updated} actualizados`);
      } else {
        toast.warning(`Importación parcial: ${next.success} ok, ${next.failed} con error`);
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const canCommit = result != null && result.dryRun && result.success > 0;
  const isBusy = runMutation.isPending || downloadMutation.isPending;

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Importación masiva"
        subtitle="Carga CSV o XLSX para productos, stock inicial y precios."
        crumbs={[{ label: 'Administración' }, { label: 'Importaciones' }]}
      />

      <Card>
        <Tabs
          value={activeType}
          onChange={handleTypeChange}
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          {IMPORT_TYPES.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>

        <CardContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            {meta.description}
          </Alert>

          <Stack spacing={3}>
            <StepCard
              index={1}
              title="Descarga el template"
              description="Abre el archivo en Excel o LibreOffice, conserva los headers exactos y llena tus datos."
              action={
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:download-bold" />}
                  onClick={handleDownloadTemplate}
                  disabled={downloadMutation.isPending}
                >
                  {downloadMutation.isPending ? 'Descargando…' : 'Descargar template'}
                </Button>
              }
            />

            <StepCard
              index={2}
              title="Selecciona tu archivo"
              description="Se aceptan .csv, .xls y .xlsx. El archivo debe tener los mismos headers que el template."
              highlight={!file}
              action={
                <Button
                  component="label"
                  variant={file ? 'outlined' : 'contained'}
                  color={file ? 'inherit' : 'primary'}
                  startIcon={<Iconify icon="solar:file-text-bold" />}
                >
                  {file ? 'Cambiar archivo' : 'Seleccionar archivo'}
                  <input
                    hidden
                    type="file"
                    accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleFileChange}
                  />
                </Button>
              }
            >
              {file && (
                <Chip
                  size="small"
                  variant="soft"
                  color="info"
                  icon={<Iconify icon="solar:file-text-bold" />}
                  label={`${file.name} · ${(file.size / 1024).toFixed(1)} KB`}
                  sx={{ mt: 1.5 }}
                />
              )}
            </StepCard>

            <StepCard
              index={3}
              title="Valida tu archivo (dry-run)"
              description="Procesa cada fila sin persistir nada. Útil para revisar errores antes del commit."
              action={
                <Tooltip
                  title={!file ? 'Selecciona un archivo primero (paso 2)' : ''}
                  disableHoverListener={!!file}
                >
                  <span>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<Iconify icon="solar:file-check-bold-duotone" />}
                      onClick={() => runImport(true)}
                      disabled={!file || isBusy}
                    >
                      {runMutation.isPending && runMutation.variables?.dryRun
                        ? 'Validando…'
                        : 'Validar sin persistir'}
                    </Button>
                  </span>
                </Tooltip>
              }
            />

            <StepCard
              index={4}
              title="Confirmar importación"
              description="Persiste todas las filas válidas. Las filas con error se reportan pero no bloquean a las demás."
              action={
                <Tooltip
                  title={!file ? 'Selecciona un archivo primero (paso 2)' : ''}
                  disableHoverListener={!!file}
                >
                  <span>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Iconify icon="solar:import-bold" />}
                      onClick={() => runImport(false)}
                      disabled={!file || isBusy}
                    >
                      {runMutation.isPending && !runMutation.variables?.dryRun
                        ? 'Importando…'
                        : 'Importar ahora'}
                    </Button>
                  </span>
                </Tooltip>
              }
            >
              {!canCommit && file != null && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Recomendación: corre primero el dry-run para verificar que haya filas válidas.
                </Typography>
              )}
            </StepCard>
          </Stack>
        </CardContent>
      </Card>

      {result && <ResultPanel result={result} />}
    </Container>
  );
}

// ----------------------------------------------------------------------

type StepCardProps = {
  index: number;
  title: string;
  description: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  highlight?: boolean;
};

function StepCard({ index, title, description, action, children, highlight }: StepCardProps) {
  return (
    <Box
      sx={{
        p: 2.5,
        gap: 2,
        display: 'flex',
        borderRadius: 1.5,
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', md: 'row' },
        bgcolor: (theme) =>
          highlight ? theme.palette.primary.lighter : theme.palette.background.neutral,
        border: (theme) =>
          highlight ? `dashed 1px ${theme.palette.primary.main}` : 'none',
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            display: 'flex',
            flexShrink: 0,
            borderRadius: '50%',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'primary.lighter',
            color: 'primary.darker',
            fontWeight: 700,
          }}
        >
          {index}
        </Box>
        <Box>
          <Typography variant="subtitle1">{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
            {description}
          </Typography>
          {children}
        </Box>
      </Box>
      {action}
    </Box>
  );
}

// ----------------------------------------------------------------------

function ResultPanel({ result }: { result: ImportResult }) {
  const severity: 'success' | 'warning' | 'error' =
    result.failed === 0 ? 'success' : result.success === 0 ? 'error' : 'warning';

  const title = result.dryRun
    ? 'Resultado del dry-run (nada se persistió)'
    : 'Resultado de la importación';

  return (
    <Card sx={{ mt: 3 }}>
      <CardHeader
        title={title}
        subheader={`Tipo: ${result.type} · ${result.total} filas procesadas`}
      />
      <CardContent>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          <Stat label="Total" value={result.total} />
          <Stat label="Éxitos" value={result.success} color="success" />
          <Stat label="Fallidos" value={result.failed} color="error" />
          <Stat label="Creados" value={result.created} color="info" />
          <Stat label="Actualizados" value={result.updated} color="info" />
        </Stack>

        <Alert severity={severity} sx={{ mb: result.errors.length > 0 ? 2 : 0 }}>
          {severity === 'success' && 'Sin errores.'}
          {severity === 'warning' &&
            `${result.failed} fila${result.failed === 1 ? '' : 's'} con error.`}
          {severity === 'error' && 'Ninguna fila pudo procesarse.'}
        </Alert>

        {result.errors.length > 0 && <ErrorTable errors={result.errors} />}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  color = 'default',
}: {
  label: string;
  value: number;
  color?: 'default' | 'success' | 'error' | 'info';
}) {
  return (
    <Chip
      variant="soft"
      color={color === 'default' ? undefined : color}
      label={
        <Stack direction="row" spacing={0.75} alignItems="baseline">
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="subtitle2">{value}</Typography>
        </Stack>
      }
    />
  );
}

function ErrorTable({ errors }: { errors: ImportResult['errors'] }) {
  return (
    <TableContainer sx={{ maxHeight: 400, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 80 }}>Fila</TableCell>
            <TableCell sx={{ width: 140 }}>Campo</TableCell>
            <TableCell>Mensaje</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {errors.map((err, i) => (
            <TableRow key={`${err.row}-${i}`}>
              <TableCell>{err.row}</TableCell>
              <TableCell>{err.field ?? '—'}</TableCell>
              <TableCell sx={{ color: 'error.main' }}>{err.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
