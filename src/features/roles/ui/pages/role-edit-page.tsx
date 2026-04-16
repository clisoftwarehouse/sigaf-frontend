import { CONFIG } from '@/app/global-config';

import { RoleEditView } from '../views/role-edit-view';

const metadata = { title: `Editar rol · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <RoleEditView />
    </>
  );
}
