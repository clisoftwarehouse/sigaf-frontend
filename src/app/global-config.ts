import { paths } from '@/app/routes/paths';

import packageJson from '../../package.json';

// ----------------------------------------------------------------------

export type ConfigValue = {
  appName: string;
  appVersion: string;
  apiUrl: string;
  assetsDir: string;
  auth: {
    skip: boolean;
    redirectPath: string;
  };
};

// ----------------------------------------------------------------------

export const CONFIG: ConfigValue = {
  appName: import.meta.env.VITE_APP_NAME ?? 'SIGAF',
  appVersion: packageJson.version,
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  assetsDir: import.meta.env.VITE_ASSETS_DIR ?? '',
  auth: {
    skip: false,
    redirectPath: paths.dashboard.root,
  },
};
