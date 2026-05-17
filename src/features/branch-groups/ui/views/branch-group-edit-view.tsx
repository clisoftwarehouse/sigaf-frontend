import type { CategoryFlag, AmountRuleInput, CategoryRuleInput } from '../../model/types';

import { toast } from 'sonner';
import { useParams } from 'react-router';
import { useState, useEffect } from 'react';

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
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { useRolesQuery } from '@/features/roles/api/roles.queries';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';

import { CATEGORY_FLAGS, CATEGORY_FLAG_LABEL } from '../../model/types';
import {
  useBranchGroupQuery,
  useAssignBranchesMutation,
  useSetAmountRulesMutation,
  useSetCategoryRulesMutation,
  useUpdateBranchGroupMutation,
} from '../../api/branch-groups.queries';

// ----------------------------------------------------------------------

type AmountRuleDraft = {
  roleId: string;
  minUsd: string;
  maxUsd: string;
};

const emptyAmountRule: AmountRuleDraft = { roleId: '', minUsd: '', maxUsd: '' };

export function BranchGroupEditView() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { data: group, isLoading, isError, error } = useBranchGroupQuery(id);
  const { data: roles = [] } = useRolesQuery();
  // Cargamos también las sucursales inactivas: si una sucursal archivada
  // sigue asignada al grupo, el admin necesita poder verla y removerla.
  const { data: branches = [] } = useBranchesQuery({ includeInactive: true });

  const updateMutation = useUpdateBranchGroupMutation();
  const setAmountRulesMutation = useSetAmountRulesMutation();
  const setCategoryRulesMutation = useSetCategoryRulesMutation();
  const assignBranchesMutation = useAssignBranchesMutation();

  // ─── Estado local: datos básicos ─────────────────────────────────────────
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // ─── Estado local: matriz de monto ──────────────────────────────────────
  const [amountRules, setAmountRules] = useState<AmountRuleDraft[]>([]);

  // ─── Estado local: matriz de categoría (map flag → roleId, '' = sin regla) ─
  const [categoryRules, setCategoryRules] = useState<Record<CategoryFlag, string>>({
    controlled: '',
    antibiotic: '',
    cold_chain: '',
    imported: '',
  });

  // ─── Estado local: sucursales asignadas ─────────────────────────────────
  const [assignedBranchIds, setAssignedBranchIds] = useState<string[]>([]);

  // Sincronizamos el estado local cuando llega el grupo del backend.
  useEffect(() => {
    if (!group) return;
    setName(group.name);
    setDescription(group.description ?? '');
    setIsActive(group.isActive);

    // Normalizamos a 2 decimales al cargar: la columna en BD es decimal(18,4)
    // y trae trailing zeros ("12.0000") que se ven feos en el input. Si el
    // valor no es numérico válido, cae al string original para no perder data.
    const toMoneyDisplay = (v: string | number): string => {
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(2) : String(v);
    };
    setAmountRules(
      (group.amountRules ?? []).map((r) => ({
        roleId: r.roleId,
        minUsd: toMoneyDisplay(r.minUsd),
        maxUsd: r.maxUsd === null ? '' : toMoneyDisplay(r.maxUsd),
      }))
    );

    const cat: Record<CategoryFlag, string> = {
      controlled: '',
      antibiotic: '',
      cold_chain: '',
      imported: '',
    };
    for (const r of group.categoryRules ?? []) {
      cat[r.categoryFlag] = r.roleId;
    }
    setCategoryRules(cat);

    setAssignedBranchIds((group.branches ?? []).map((b) => b.id));
  }, [group]);

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ pb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (isError || !group) {
    return (
      <Container maxWidth="xl" sx={{ pb: 6 }}>
        <Alert severity="error">{(error as Error)?.message ?? 'Error al cargar grupo'}</Alert>
      </Container>
    );
  }

  // ─── Handlers ───────────────────────────────────────────────────────────
  /**
   * Normaliza un input de monto USD a máximo 2 decimales. Permite:
   * - Vacío (devuelve '')
   * - Solo dígitos
   * - Dígitos con punto/coma decimal y hasta 2 decimales
   * Cualquier carácter inválido o extra de decimales se descarta.
   */
  const normalizeMoney = (raw: string): string => {
    if (!raw) return '';
    // Aceptamos coma como separador decimal (usuarios LATAM) y la convertimos a punto.
    let cleaned = raw.replace(',', '.');
    // Quitamos cualquier cosa que no sea dígito o punto.
    cleaned = cleaned.replace(/[^\d.]/g, '');
    // Solo un punto: si hay más, conservamos el primero.
    const firstDot = cleaned.indexOf('.');
    if (firstDot !== -1) {
      cleaned =
        cleaned.slice(0, firstDot + 1) +
        cleaned.slice(firstDot + 1).replace(/\./g, '');
    }
    // Truncamos a 2 decimales (sin redondear).
    const [intPart, decPart] = cleaned.split('.');
    return decPart !== undefined ? `${intPart}.${decPart.slice(0, 2)}` : intPart;
  };

  /**
   * Handler unificado: guarda todo en una sola acción. Dispara cada mutación
   * solo si su sección cambió respecto al estado del backend, para evitar
   * round-trips innecesarios cuando el operador solo tocó una sección.
   * Si alguna falla, se detiene y muestra el error sin afectar lo ya guardado.
   */
  const handleSaveAll = async () => {
    // 1) Validación de datos básicos
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    // 2) Validación de matriz de monto
    const validAmountRules: AmountRuleInput[] = [];
    for (const r of amountRules) {
      if (!r.roleId) {
        toast.error('Cada regla de monto debe tener un rol asignado');
        return;
      }
      const min = Number(r.minUsd);
      if (!Number.isFinite(min) || min < 0) {
        toast.error('El monto mínimo de cada regla debe ser un número ≥ 0');
        return;
      }
      const max = r.maxUsd.trim() === '' ? null : Number(r.maxUsd);
      if (max !== null && (!Number.isFinite(max) || max <= min)) {
        toast.error(
          'El monto máximo de cada regla debe ser mayor al mínimo (o vacío para sin tope)'
        );
        return;
      }
      validAmountRules.push({ roleId: r.roleId, minUsd: min, maxUsd: max });
    }
    // 3) Detección de cambios respecto al backend para evitar requests vacías
    const basicsChanged =
      name.trim() !== group.name ||
      (description.trim() || undefined) !== (group.description ?? undefined) ||
      isActive !== group.isActive;
    const originalAmountRules = (group.amountRules ?? []).map((r) => ({
      roleId: r.roleId,
      minUsd: Number(r.minUsd),
      maxUsd: r.maxUsd === null ? null : Number(r.maxUsd),
    }));
    const amountRulesChanged =
      JSON.stringify(originalAmountRules) !== JSON.stringify(validAmountRules);
    const originalCategoryRules: Record<CategoryFlag, string> = {
      controlled: '',
      antibiotic: '',
      cold_chain: '',
      imported: '',
    };
    for (const r of group.categoryRules ?? []) originalCategoryRules[r.categoryFlag] = r.roleId;
    const categoryRulesChanged =
      JSON.stringify(originalCategoryRules) !== JSON.stringify(categoryRules);
    const originalBranchIds = (group.branches ?? []).map((b) => b.id).sort();
    const newBranchIds = [...assignedBranchIds].sort();
    const branchesChanged =
      JSON.stringify(originalBranchIds) !== JSON.stringify(newBranchIds);

    if (
      !basicsChanged &&
      !amountRulesChanged &&
      !categoryRulesChanged &&
      !branchesChanged
    ) {
      toast.message('No hay cambios para guardar');
      return;
    }

    try {
      if (basicsChanged) {
        await updateMutation.mutateAsync({
          id: group.id,
          payload: {
            name: name.trim(),
            description: description.trim() || undefined,
            isActive,
          },
        });
      }
      if (branchesChanged) {
        await assignBranchesMutation.mutateAsync({
          branchGroupId: group.id,
          branchIds: assignedBranchIds,
        });
      }
      if (amountRulesChanged) {
        await setAmountRulesMutation.mutateAsync({
          branchGroupId: group.id,
          rules: validAmountRules,
        });
      }
      if (categoryRulesChanged) {
        const rules: CategoryRuleInput[] = [];
        for (const flag of CATEGORY_FLAGS) {
          const roleId = categoryRules[flag];
          if (roleId) rules.push({ categoryFlag: flag, roleId });
        }
        await setCategoryRulesMutation.mutateAsync({ branchGroupId: group.id, rules });
      }
      toast.success('Cambios guardados');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const isSaving =
    updateMutation.isPending ||
    setAmountRulesMutation.isPending ||
    setCategoryRulesMutation.isPending ||
    assignBranchesMutation.isPending;

  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <PageHeader
        title={`Grupo: ${group.name}`}
        subtitle="Configura la matriz de aprobación y las sucursales que pertenecen a este grupo."
        crumbs={[
          { label: 'Organización' },
          { label: 'Grupos', href: paths.dashboard.organization.branchGroups.root },
          { label: group.name },
        ]}
        action={
          <Button
            variant="outlined"
            color="inherit"
            startIcon={
              <Iconify
                icon="solar:double-alt-arrow-right-bold-duotone"
                sx={{ transform: 'scaleX(-1)' }}
              />
            }
            onClick={() => router.push(paths.dashboard.organization.branchGroups.root)}
          >
            Volver
          </Button>
        }
      />

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* ─── Información general ──────────────────────────────────────── */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Información general
            </Typography>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  select
                  label="Estado"
                  value={isActive ? 'true' : 'false'}
                  onChange={(e) => setIsActive(e.target.value === 'true')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: { xs: '100%', md: 180 }, flexShrink: 0 }}
                >
                  <MenuItem value="true">Activo</MenuItem>
                  <MenuItem value="false">Inactivo</MenuItem>
                </TextField>
              </Stack>
              <TextField
                label="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                minRows={2}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* ─── Sucursales asignadas ─────────────────────────────────────── */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
              Sucursales asignadas
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mb: 2 }}
            >
              Las OCs creadas en estas sucursales usarán las matrices de este grupo para
              determinar quién puede aprobarlas.
            </Typography>
            <Autocomplete
              multiple
              options={branches.filter((b) => b.isActive).map((b) => b.id)}
              value={assignedBranchIds}
              onChange={(_, value) => setAssignedBranchIds(value)}
              getOptionLabel={(branchId) => {
                const b = branches.find((br) => br.id === branchId);
                if (!b) return `Sucursal eliminada (${branchId.slice(0, 8)})`;
                return b.isActive ? b.name : `${b.name} (inactiva)`;
              }}
              renderTags={(value, getTagProps) =>
                value.map((branchId, idx) => {
                  const tagProps = getTagProps({ index: idx });
                  const b = branches.find((br) => br.id === branchId);
                  const label = !b
                    ? `Sucursal eliminada (${branchId.slice(0, 8)})`
                    : b.isActive
                      ? b.name
                      : `${b.name} (inactiva)`;
                  const isOrphan = !b || !b.isActive;
                  return (
                    <Chip
                      {...tagProps}
                      key={branchId}
                      size="small"
                      color={isOrphan ? 'warning' : 'default'}
                      label={label}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Sucursales"
                  placeholder="Selecciona sucursales…"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* ─── Matriz por monto ─────────────────────────────────────────── */}
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 0.5 }}
            >
              <Typography variant="subtitle1">Matriz de aprobación por monto</Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={() => setAmountRules((rules) => [...rules, { ...emptyAmountRule }])}
              >
                Agregar regla
              </Button>
            </Stack>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mb: 2 }}
            >
              Cada regla cubre un rango de monto USD para un rol específico. Los rangos no pueden
              solaparse. Deja «Máximo» vacío para indicar «sin tope superior». Las reglas se
              listan en el orden en que fueron creadas.
            </Typography>

            {amountRules.length === 0 ? (
              <Box
                sx={{
                  py: 3,
                  textAlign: 'center',
                  border: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                  Sin reglas configuradas. Mientras esté vacío, cualquier usuario con permiso de
                  aprobar puede firmar OCs de este grupo.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {amountRules.map((rule, idx) => (
                  <Stack
                    key={idx}
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                  >
                    <TextField
                      select
                      size="small"
                      label="Rol aprobador"
                      value={rule.roleId}
                      onChange={(e) =>
                        setAmountRules((rules) =>
                          rules.map((r, i) => (i === idx ? { ...r, roleId: e.target.value } : r))
                        )
                      }
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={{ flex: 1.5, minWidth: 200 }}
                    >
                      {roles.map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small"
                      label="Mínimo"
                      placeholder="0.00"
                      value={rule.minUsd}
                      onChange={(e) => {
                        const v = normalizeMoney(e.target.value);
                        setAmountRules((rules) =>
                          rules.map((r, i) => (i === idx ? { ...r, minUsd: v } : r))
                        );
                      }}
                      slotProps={{
                        inputLabel: { shrink: true },
                        input: {
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          inputProps: { inputMode: 'decimal' },
                        },
                      }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Máximo"
                      placeholder="sin tope"
                      value={rule.maxUsd}
                      onChange={(e) => {
                        const v = normalizeMoney(e.target.value);
                        setAmountRules((rules) =>
                          rules.map((r, i) => (i === idx ? { ...r, maxUsd: v } : r))
                        );
                      }}
                      slotProps={{
                        inputLabel: { shrink: true },
                        input: {
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          inputProps: { inputMode: 'decimal' },
                        },
                      }}
                      sx={{ flex: 1 }}
                    />
                    <IconButton
                      color="error"
                      onClick={() => setAmountRules((rules) => rules.filter((_, i) => i !== idx))}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* ─── Matriz por categoría ─────────────────────────────────────── */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
              Aprobador especial por categoría sensible
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mb: 2 }}
            >
              Si una OC contiene productos de estas categorías, este rol también debe aprobar
              (independiente del monto). Deja «—» si la categoría no requiere aprobador especial.
            </Typography>
            <Stack spacing={2}>
              {CATEGORY_FLAGS.map((flag) => (
                <Stack
                  key={flag}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                >
                  <Typography
                    variant="body2"
                    sx={{ width: { xs: '100%', sm: 240 }, flexShrink: 0 }}
                  >
                    {CATEGORY_FLAG_LABEL[flag]}
                  </Typography>
                  <TextField
                    select
                    size="small"
                    label="Rol aprobador"
                    value={categoryRules[flag]}
                    onChange={(e) =>
                      setCategoryRules((rules) => ({ ...rules, [flag]: e.target.value }))
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ flex: 1 }}
                  >
                    <MenuItem value="">— Sin aprobador especial —</MenuItem>
                    {roles.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Divider />

          {/* ─── Botón único de guardar ───────────────────────────────────── */}
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              size="large"
              onClick={handleSaveAll}
              loading={isSaving}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              Guardar cambios
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Container>
  );
}
