import type { BoxProps } from '@mui/material/Box';
import type { Breakpoint } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { CONFIG } from '@/app/global-config';

// ----------------------------------------------------------------------

export type AuthSplitSectionProps = BoxProps & {
  title?: string;
  subtitle?: string;
  layoutQuery?: Breakpoint;
};

const FEATURES = [
  {
    title: 'Inventario inteligente',
    description: 'Control en tiempo real de stock, lotes y vencimientos.',
  },
  {
    title: 'Punto de venta integrado',
    description: 'Operaciones rápidas y conciliadas con el back-office.',
  },
  {
    title: 'Reportes y trazabilidad',
    description: 'Información clara para decisiones operativas y financieras.',
  },
];

export function AuthSplitSection({
  sx,
  layoutQuery = 'md',
  title = 'Bienvenido a Grupo Universal 25',
  subtitle = 'Plataforma integral de gestión farmacéutica.',
  ...other
}: AuthSplitSectionProps) {
  return (
    <Box
      sx={[
        (theme) => ({
          position: 'relative',
          flex: '1 1 50%',
          width: 1,
          display: 'none',
          overflow: 'hidden',
          color: theme.vars.palette.common.white,
          backgroundColor: '#0F1B2D',
          backgroundImage: `
            radial-gradient(circle at 12% 18%, ${varAlpha('255 255 255', 0.06)} 0px, transparent 55%),
            radial-gradient(circle at 88% 82%, ${varAlpha('156 28 44', 0.28)} 0px, transparent 55%),
            linear-gradient(160deg, #0F1B2D 0%, #1A2C46 55%, #233A56 100%)
          `,
          [theme.breakpoints.up(layoutQuery)]: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'center',
            px: { md: 6, lg: 10 },
            py: 8,
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        aria-hidden
        sx={(theme) => ({
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(${varAlpha(theme.vars.palette.common.whiteChannel, 0.04)} 1px, transparent 1px),
            linear-gradient(90deg, ${varAlpha(theme.vars.palette.common.whiteChannel, 0.04)} 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 75%)',
        })}
      />

      <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            width: 300,
            height: 120,
            borderRadius: 2,
            backgroundColor: 'common.white',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 30px -12px rgba(0,0,0,0.45)',
            overflow: 'hidden',
          }}
        >
          <Box
            component="img"
            alt="Grupo Universal 25"
            src={`${CONFIG.assetsDir}/logo/logo-universal.png`}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: 'scale(2)',
              transformOrigin: 'center',
            }}
          />
        </Box>

        <Box sx={{ maxWidth: 560 }}>
          <Typography
            variant="overline"
            sx={{ color: varAlpha('255 255 255', 0.6), letterSpacing: 1.4 }}
          >
            SIGAF · Sistema de Gestión Farmacéutica
          </Typography>

          <Typography
            sx={{
              mt: 1.5,
              fontWeight: 700,
              lineHeight: 1.2,
              fontSize: { md: 28, lg: 32 },
              color: 'common.white',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              sx={{
                mt: 2,
                color: varAlpha('255 255 255', 0.72),
                fontSize: 16,
                lineHeight: 1.6,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>

      <Box sx={{ position: 'relative', zIndex: 1, width: 1, display: 'flex', justifyContent: 'center' }}>
        <Stack spacing={2.5} sx={{ width: 'fit-content' }}>
          {FEATURES.map((feature) => (
            <Stack key={feature.title} direction="row" spacing={2} alignItems="flex-start">
              <Box
                sx={{
                  mt: 0.75,
                  width: 8,
                  height: 8,
                  flexShrink: 0,
                  borderRadius: '50%',
                  backgroundColor: '#C9A97A',
                  boxShadow: `0 0 0 4px ${varAlpha('201 169 122', 0.18)}`,
                }}
              />
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle2" sx={{ color: 'common.white', fontWeight: 600 }}>
                  {feature.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: varAlpha('255 255 255', 0.65), mt: 0.25 }}
                >
                  {feature.description}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: 1,
          pt: 3,
          textAlign: 'center',
          borderTop: `1px solid ${varAlpha('255 255 255', 0.08)}`,
        }}
      >
        <Typography variant="caption" sx={{ color: varAlpha('255 255 255', 0.5) }}>
          © {new Date().getFullYear()} Grupo Universal 25. Todos los derechos reservados.
        </Typography>
      </Box>
    </Box>
  );
}
