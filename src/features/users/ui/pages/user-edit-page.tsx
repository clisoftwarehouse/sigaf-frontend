import { CONFIG } from '@/app/global-config';

import { UserEditView } from '../views/user-edit-view';

const metadata = { title: `Editar usuario · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <UserEditView />
    </>
  );
}
