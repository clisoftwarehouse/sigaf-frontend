import { CONFIG } from '@/app/global-config';

import { UsersListView } from '../views/users-list-view';

const metadata = { title: `Usuarios · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <UsersListView />
    </>
  );
}
