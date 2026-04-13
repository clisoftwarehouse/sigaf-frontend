import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/app/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  icon?: 'inbox' | 'search' | 'box' | 'bell';
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Render inside a table cell (compact vertical padding). */
  dense?: boolean;
};

const ICON_MAP = {
  inbox: 'solar:inbox-bold',
  search: 'solar:inbox-bold',
  box: 'solar:box-minimalistic-bold',
  bell: 'solar:bell-off-bold',
} as const;

export function EmptyState({ icon = 'inbox', title, description, action, dense }: Props) {
  return (
    <Stack
      spacing={1.5}
      alignItems="center"
      sx={{
        py: dense ? 4 : 8,
        px: 3,
        color: 'text.disabled',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: dense ? 48 : 72,
          height: dense ? 48 : 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          bgcolor: 'action.hover',
        }}
      >
        <Iconify icon={ICON_MAP[icon]} width={dense ? 28 : 40} />
      </Box>

      <Typography variant={dense ? 'subtitle2' : 'h6'} sx={{ color: 'text.secondary' }}>
        {title}
      </Typography>

      {description && (
        <Typography variant="body2" sx={{ maxWidth: 360, color: 'text.disabled' }}>
          {description}
        </Typography>
      )}

      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Stack>
  );
}
