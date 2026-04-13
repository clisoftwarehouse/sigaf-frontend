import type { AccountDrawerProps } from './components/account-drawer';

import { paths } from '@/app/routes/paths';
import { Iconify } from '@/app/components/iconify';

// ----------------------------------------------------------------------

export const _account: AccountDrawerProps['data'] = [
  {
    label: 'Inicio',
    href: paths.dashboard.root,
    icon: <Iconify icon="solar:home-angle-bold-duotone" />,
  },
];
