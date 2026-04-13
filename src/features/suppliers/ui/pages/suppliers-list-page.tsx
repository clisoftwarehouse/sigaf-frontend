import { CONFIG } from '@/app/global-config';

import { SuppliersListView } from '../views/suppliers-list-view';

const metadata = { title: `Proveedores · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <SuppliersListView />
    </>
  );
}
