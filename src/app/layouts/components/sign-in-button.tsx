import type { ButtonProps } from '@mui/material/Button';

import Button from '@mui/material/Button';

import { CONFIG } from '@/app/global-config';
import { RouterLink } from '@/app/routes/components';

// ----------------------------------------------------------------------

export function SignInButton({ sx, ...other }: ButtonProps) {
  return (
    <Button
      component={RouterLink}
      href={CONFIG.auth.redirectPath}
      variant="outlined"
      sx={sx}
      {...other}
    >
      Sign in
    </Button>
  );
}
