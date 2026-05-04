import Box from '@mui/material/Box';

import { CONFIG } from '@/app/global-config';
import { RouterLink } from '@/app/routes/components';

// ----------------------------------------------------------------------

type SidebarLogoProps = {
  width: number;
  height: number;
  /** Magnifica la imagen para recortar el whitespace del asset original. */
  scale?: number;
  radius?: number;
};

/**
 * Logo de la sidebar/dashboard. El asset `logo-universal.png` viene con mucho
 * whitespace alrededor del logo real, así que lo envolvemos en una caja blanca
 * con `overflow: hidden` y aplicamos `transform: scale()` para hacer zoom y
 * recortar el espacio sobrante. Mismo patrón que la pantalla de auth.
 */
export function SidebarLogo({ width, height, scale = 2, radius = 1.5 }: SidebarLogoProps) {
  return (
    <Box
      component={RouterLink}
      href="/"
      aria-label="Inicio"
      sx={{
        width,
        height,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'common.white',
        borderRadius: radius,
        overflow: 'hidden',
        boxShadow: '0 4px 12px -4px rgba(0,0,0,0.25)',
        flexShrink: 0,
      }}
    >
      <Box
        component="img"
        alt="Logo"
        src={`${CONFIG.assetsDir}/logo/logo-universal.png`}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
      />
    </Box>
  );
}
