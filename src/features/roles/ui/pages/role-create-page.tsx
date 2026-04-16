import { CONFIG } from '@/app/global-config';

import { RoleCreateView } from '../views/role-create-view';

const metadata = { title: `Nuevo rol · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <RoleCreateView />
    </>
  );
}
