import { CONFIG } from '@/app/global-config';

import { PermissionsListView } from '../views/permissions-list-view';

const metadata = { title: `Permisos · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <PermissionsListView />
    </>
  );
}
