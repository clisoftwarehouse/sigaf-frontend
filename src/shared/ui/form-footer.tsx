import type { ReactNode } from 'react';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

type Props = {
  children: ReactNode;
  /**
   * Contenido opcional que se renderiza arriba de los botones, también sticky.
   * Útil para mostrar previews o resúmenes en vivo (ej. nombre auto-generado).
   */
  preview?: ReactNode;
};

/**
 * Footer sticky para botones de acción (Cancelar/Guardar) en formularios.
 *
 * Se mantiene anclado al borde inferior del viewport mientras el usuario hace
 * scroll, evitando que tenga que llegar al final del formulario para ver el
 * botón "Guardar".
 *
 * Úsalo dentro de un `<Form>` o cualquier contenedor; típicamente justo después
 * del último `<Card>` del formulario.
 */
export function FormFooter({ children, preview }: Props) {
  return (
    <Box
      sx={(theme) => ({
        position: 'sticky',
        bottom: 0,
        zIndex: 2,
        mt: 3,
        bgcolor: 'background.paper',
        borderTop: `1px solid ${theme.vars.palette.divider}`,
        boxShadow: theme.vars.customShadows?.z8 ?? '0 -4px 12px rgba(0,0,0,0.05)',
        borderRadius: 2,
        overflow: 'hidden',
      })}
    >
      {preview && <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>{preview}</Box>}
      <Box
        sx={{
          py: 2,
          px: 3,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.5,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
