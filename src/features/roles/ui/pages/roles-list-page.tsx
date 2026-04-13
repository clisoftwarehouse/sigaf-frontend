import { CONFIG } from '@/app/global-config';

import { RolesListView } from '../views/roles-list-view';

const metadata = { title: `Roles · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <RolesListView />
    </>
  );
}
