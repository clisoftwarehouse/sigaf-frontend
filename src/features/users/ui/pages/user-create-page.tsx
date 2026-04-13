import { CONFIG } from '@/app/global-config';

import { UserCreateView } from '../views/user-create-view';

const metadata = { title: `Nuevo usuario · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <UserCreateView />
    </>
  );
}
