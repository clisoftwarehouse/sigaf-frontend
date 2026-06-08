import type { CategoryFlag, AmountRuleInput, CategoryRuleInput } from '../../model/types';

import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { PageHeader } from '@/shared/ui/page-header';
import { useRolesQuery } from '@/features/roles/api/roles.queries';
import { useBranchesQuery } from '@/features/branches/api/branches.queries';

import { CATEGORY_FLAGS, CATEGORY_FLAG_LABEL } from '../../model/types';
import {
  useSetAmountRulesMutation,
  useAssignBranchesMutation,
  useSetCategoryRulesMutation,
  useCreateBranchGroupMutation,
} from '../../api/branch-groups.queries';

// ----------------------------------------------------------------------

type AmountRuleDraft = {
  roleId: string;
  minUsd: string;
  maxUsd: string;
};

const emptyAmountRule: AmountRuleDraft = { roleId: '', minUsd: '', maxUsd: '' };

const normalizeMoney = (raw: string): string => {
  if (!raw) return '';
  let cleaned = raw.replace(',', '.');
  cleaned = cleaned.replace(/[^\d.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  }
  const [intPart, decPart] = cleaned.split('.');
  return decPart !== undefined ? `${intPart}.${decPart.slice(0, 2)}` : intPart;
};

export function BranchGroupCreateView() {
  const router = useRouter();

  const { data: roles = [] } = useRolesQuery();
  const { data: branches = [] } = useBranchesQuery({ includeInactive: false });

  const createMutation = useCreateBranchGroupMutation();
  const setAmountRulesMutation = useSetAmountRulesMutation();
  const setCategoryRulesMutation = useSetCategoryRulesMutation();
  const assignBranchesMutation = useAssignBranchesMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [assignedBranchIds, setAssignedBranchIds] = useState<string[]>([]);
  const [amountRules, setAmountRules] = useState<AmountRuleDraft[]>([]);
  const [categoryRules, setCategoryRules] = useState<Record<CategoryFlag, string>>({
    controlled: '',
    antibiotic: '',
    cold_chain: '',
    imported: '',
  });

  const handleSaveAll = async () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

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
        toast.error('El monto máximo de cada regla debe ser mayor al mínimo (o vacío para sin tope)');
        return;
      }
      validAmountRules.push({ roleId: r.roleId, minUsd: min, maxUsd: max });
    }

    try {
      const created = await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        isActive,
      });

      if (assignedBranchIds.length > 0) {
        await assignBranchesMutation.mutateAsync({
          branchGroupId: created.id,
          branchIds: assignedBranchIds,
        });
      }

      if (validAmountRules.length > 0) {
        await setAmountRulesMutation.mutateAsync({
          branchGroupId: created.id,
          rules: validAmountRules,
        });
      }

      const validCategoryRules: CategoryRuleInput[] = [];
      for (const flag of CATEGORY_FLAGS) {
        const roleId = categoryRules[flag];
        if (roleId) validCategoryRules.push({ categoryFlag: flag, roleId });
      }
      if (validCategoryRules.length > 0) {
        await setCategoryRulesMutation.mutateAsync({
          branchGroupId: created.id,
          rules: validCategoryRules,
        });
      }

      toast.success(`Grupo "${created.name}" creado y configurado`);
      router.push(paths.dashboard.organization.branchGroups.edit(created.id));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const isSaving =
    createMutation.isPending ||
    setAmountRulesMutation.isPending ||
    setCategoryRulesMutation.isPending ||
    assignBranchesMutation.isPending;

  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <PageHeader
        title="Nuevo grupo de sucursales"
        subtitle="Configura datos básicos, asigna sucursales y define la matriz de aprobación en una sola pantalla."
        crumbs={[
          { label: 'Organización' },
          { label: 'Grupos', href: paths.dashboard.organization.branchGroups.root },
          { label: 'Nuevo' },
        ]}
        action={
          <Button
            variant="outlined"
            color="inherit"
            startIcon={
              <Iconify icon="solar:double-alt-arrow-right-bold-duotone" sx={{ transform: 'scaleX(-1)' }} />
            }
            onClick={() => router.push(paths.dashboard.organization.branchGroups.root)}
          >
            Volver
          </Button>
        }
      />

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Información general
            </Typography>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Nombre"
                  placeholder="Ej. Caracas premium"
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
                placeholder="Ej. Sucursales con flujo de aprobación más estricto"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                minRows={2}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
              Sucursales asignadas
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
              Las OCs creadas en estas sucursales usarán las matrices de este grupo para determinar quién puede
              aprobarlas. Podés agregar más después.
            </Typography>
            <Autocomplete
              multiple
              options={branches.filter((b) => b.isActive).map((b) => b.id)}
              value={assignedBranchIds}
              onChange={(_, value) => setAssignedBranchIds(value)}
              getOptionLabel={(branchId) => {
                const b = branches.find((br) => br.id === branchId);
                return b?.name ?? branchId;
              }}
              renderTags={(value, getTagProps) =>
                value.map((branchId, idx) => {
                  const tagProps = getTagProps({ index: idx });
                  const b = branches.find((br) => br.id === branchId);
                  return (
                    <Chip {...tagProps} key={branchId} size="small" label={b?.name ?? branchId} />
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

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
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
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
              Cada regla cubre un rango de monto USD para un rol específico. Dejá «Máximo» vacío para «sin tope».
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
                  Sin reglas. Cualquier usuario con permiso de aprobar podrá firmar OCs de este grupo.
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

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
              Aprobador especial por categoría sensible
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
              Si una OC contiene productos de estas categorías, este rol también debe aprobar (independiente del
              monto). Dejá «—» si la categoría no requiere aprobador especial.
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

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button
              color="inherit"
              variant="outlined"
              onClick={() => router.push(paths.dashboard.organization.branchGroups.root)}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleSaveAll}
              loading={isSaving}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              Crear grupo
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Container>
  );
}
