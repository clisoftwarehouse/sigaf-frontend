import type { ComparisonGroup } from '../../model/types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/app/components/iconify';

import { formatBs } from './format-money';

// ----------------------------------------------------------------------

type Props = {
  group: ComparisonGroup;
  onOpenDetail: (ingredient: string) => void;
  topN?: number;
};

export function ComparisonCard({ group, onOpenDetail, topN = 5 }: Props) {
  const top = group.products.slice(0, topN);
  const hasMore = group.productsCount > topN;
  const spread =
    group.stats.maxPrice > 0
      ? ((group.stats.maxPrice - group.stats.minPrice) / group.stats.maxPrice) * 100
      : 0;

  return (
    <Card
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        height: '100%',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
            {group.activeIngredient}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {group.productsCount} {group.productsCount === 1 ? 'laboratorio' : 'laboratorios'}
          </Typography>
        </Box>
        {spread >= 30 && (
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            label={`Brecha ${spread.toFixed(0)}%`}
            title="Diferencia porcentual entre el precio mínimo y máximo"
          />
        )}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
        <Chip
          size="small"
          color="success"
          variant="outlined"
          label={`Mín. ${formatBs(group.stats.minPrice)}`}
        />
        <Chip
          size="small"
          variant="outlined"
          label={`Prom. ${formatBs(group.stats.avgPrice)}`}
        />
        <Chip
          size="small"
          color="error"
          variant="outlined"
          label={`Máx. ${formatBs(group.stats.maxPrice)}`}
        />
      </Stack>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box sx={{ flex: 1 }}>
        <Stack spacing={0.75}>
          {top.map((p, idx) => (
            <Stack
              key={`${p.externalId}-${idx}`}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                py: 0.5,
                px: 0.5,
                borderRadius: 0.75,
                bgcolor: idx === 0 ? 'success.lighter' : 'transparent',
                ...(idx === 0 && { border: 1, borderColor: 'success.light' }),
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  width: 18,
                  fontWeight: 700,
                  color: idx === 0 ? 'success.dark' : 'text.disabled',
                  fontFamily: 'monospace',
                }}
              >
                {idx + 1}
              </Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap title={p.name}>
                  {p.brand} <Box component="span" sx={{ color: 'text.disabled' }}>·</Box>{' '}
                  <Box component="span" sx={{ color: 'text.secondary', fontSize: 12 }}>
                    {p.provider}
                  </Box>
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: idx === 0 ? 700 : 500,
                  color: idx === 0 ? 'success.dark' : 'text.primary',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatBs(p.price)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      {hasMore && (
        <Button
          size="small"
          variant="outlined"
          endIcon={<Iconify icon="solar:double-alt-arrow-right-bold-duotone" />}
          onClick={() => onOpenDetail(group.activeIngredient)}
        >
          Ver los {group.productsCount} laboratorios
        </Button>
      )}
    </Card>
  );
}
