import type { VademecumDetails, VademecumCandidate } from '../../model/types';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import ListItemButton from '@mui/material/ListItemButton';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from '@/app/components/iconify';

import {
  useVademecumImportMutation,
  useVademecumLookupMutation,
  useVademecumDetailsMutation,
} from '../../api/active-ingredients.queries';

// ----------------------------------------------------------------------

export type VademecumPickMode = 'pick' | 'import';

type Props = {
  open: boolean;
  /** Default query to prefill the search input. */
  initialQuery?: string;
  /**
   * 'pick' → user picks a candidate and the dialog returns it + its enriched
   * details via `onPick` without persisting (useful for pre-filling another form).
   * 'import' → dialog calls `POST /vademecum-import` and returns the created id.
   */
  mode?: VademecumPickMode;
  onClose: () => void;
  onPick?: (candidate: VademecumCandidate, details: VademecumDetails) => void;
  onImported?: (id: string) => void;
};

const LEVEL_LABEL: Record<1 | 2 | 3 | 4, string> = {
  1: 'Grupo anatómico',
  2: 'Subgrupo terapéutico',
  3: 'Subgrupo farmacológico',
  4: 'Subgrupo químico',
};

export function VademecumSearchDialog({
  open,
  initialQuery = '',
  mode = 'pick',
  onClose,
  onPick,
  onImported,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [candidates, setCandidates] = useState<VademecumCandidate[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [details, setDetails] = useState<VademecumDetails | null>(null);

  const lookup = useVademecumLookupMutation();
  const detailsMutation = useVademecumDetailsMutation();
  const importMutation = useVademecumImportMutation();

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setCandidates([]);
      setSearched(false);
      setSelectedIdx(null);
      setDetails(null);
    }
  }, [open, initialQuery]);

  const handleSearch = async () => {
    const q = query.trim();
    if (q.length < 2) {
      toast.error('Escribe al menos 2 caracteres');
      return;
    }
    setSelectedIdx(null);
    setDetails(null);
    try {
      const data = await lookup.mutateAsync({ q, limit: 15 });
      setCandidates(data);
      setSearched(true);
      if (data.length === 0) {
        toast.info('Vademecum no devolvió resultados');
      }
    } catch (err) {
      toast.error((err as Error).message ?? 'Error consultando Vademecum');
    }
  };

  const handleSelectCandidate = async (candidate: VademecumCandidate, idx: number) => {
    setSelectedIdx(idx);
    setDetails(null);
    try {
      const d = await detailsMutation.mutateAsync({
        q: query.trim() || candidate.name,
        index: idx,
      });
      setDetails(d);
    } catch (err) {
      toast.error((err as Error).message ?? 'No se pudo obtener la jerarquía ATC');
      setSelectedIdx(null);
    }
  };

  const handleConfirm = async () => {
    if (selectedIdx == null || !details) return;

    if (mode === 'pick') {
      onPick?.(details.candidate, details);
      return;
    }

    try {
      const imported = await importMutation.mutateAsync({
        q: query.trim() || details.candidate.name,
        index: selectedIdx,
      });
      toast.success(`"${imported.name}" importado desde Vademecum`);
      onImported?.(imported.id);
    } catch (err) {
      toast.error((err as Error).message ?? 'No se pudo importar');
    }
  };

  const handleBack = () => {
    setSelectedIdx(null);
    setDetails(null);
  };

  const working = lookup.isPending || detailsMutation.isPending || importMutation.isPending;
  const showDetails = selectedIdx != null;

  return (
    <Dialog open={open} onClose={working ? undefined : onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        {showDetails ? 'Detalles del principio activo' : 'Buscar en Vademecum'}
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: 560 }}>
        {!showDetails && (
          <Stack spacing={2}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Consulta vademecum.es para obtener el principio activo con su código ATC (estándar
              internacional WHO) y su jerarquía terapéutica completa. Best-effort: si la web cambia
              estructura, crea el registro manualmente.
            </Typography>

            <Stack direction="row" spacing={1}>
              <TextField
                autoFocus
                label="Nombre del principio activo"
                placeholder="Ej. Losartán"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                disabled={working}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                loading={lookup.isPending}
                startIcon={<Iconify icon="solar:download-bold" />}
                sx={{ minWidth: 130 }}
              >
                Buscar
              </Button>
            </Stack>

            {lookup.isPending && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {searched && !lookup.isPending && candidates.length === 0 && (
              <Alert severity="info">
                No hay resultados. Intenta con un nombre más específico o crea el registro
                manualmente.
              </Alert>
            )}

            {candidates.length > 0 && (
              <List disablePadding>
                {candidates.map((c, idx) => (
                  <ListItem key={`${c.slug}-${idx}`} disablePadding>
                    <ListItemButton
                      onClick={() => handleSelectCandidate(c, idx)}
                      disabled={detailsMutation.isPending}
                    >
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle2">{c.name}</Typography>
                            {c.atcCode && (
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`ATC: ${c.atcCode}`}
                                sx={{ fontFamily: 'monospace' }}
                              />
                            )}
                          </Stack>
                        }
                        secondary="Ver detalles y jerarquía ATC"
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Stack>
        )}

        {showDetails && (
          <Stack spacing={2}>
            {detailsMutation.isPending && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {details && (
              <>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Principio activo
                  </Typography>
                  <Typography variant="h6">{details.candidate.name}</Typography>
                  {details.candidate.atcCode && (
                    <Chip
                      size="small"
                      color="info"
                      label={`ATC: ${details.candidate.atcCode}`}
                      sx={{ fontFamily: 'monospace', mt: 0.5 }}
                    />
                  )}
                </Box>

                {details.therapeuticUse ? (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Acción terapéutica sugerida (auto-mapeada por código ATC)
                    </Typography>
                    <Typography variant="body1">{details.therapeuticUse.name}</Typography>
                  </Box>
                ) : (
                  <Alert severity="info">
                    No se encontró una acción terapéutica que coincida con el código ATC. Podrás
                    asignarla manualmente luego desde el formulario.
                  </Alert>
                )}

                <Divider sx={{ borderStyle: 'dashed' }} />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Jerarquía ATC
                  </Typography>
                  {details.atcHierarchy.length === 0 ? (
                    <Alert severity="warning">
                      No se pudo obtener la jerarquía ATC (vademecum bloqueó o cambió estructura).
                      Puedes importar solo con el ATC del candidato.
                    </Alert>
                  ) : (
                    <Stack spacing={1}>
                      {details.atcHierarchy.map((lvl) => (
                        <Box
                          key={lvl.atcCode}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`N${lvl.level}`}
                              sx={{ minWidth: 44 }}
                            />
                            <Chip
                              size="small"
                              variant="outlined"
                              label={lvl.atcCode}
                              sx={{ fontFamily: 'monospace' }}
                            />
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              {LEVEL_LABEL[lvl.level]}
                            </Typography>
                          </Stack>
                          <Typography variant="body2">{lvl.name}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>

                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Fuente:{' '}
                  <Link href={details.candidate.url} target="_blank" rel="noopener noreferrer">
                    {details.candidate.url}
                  </Link>
                </Typography>
              </>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        {showDetails && (
          <Button color="inherit" onClick={handleBack} disabled={working}>
            Atrás
          </Button>
        )}
        <Button color="inherit" onClick={onClose} disabled={working}>
          Cerrar
        </Button>
        {showDetails && details && (
          <Button
            variant="contained"
            onClick={handleConfirm}
            loading={importMutation.isPending}
            startIcon={<Iconify icon="solar:check-circle-bold" />}
          >
            {mode === 'import' ? 'Importar' : 'Usar estos datos'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
