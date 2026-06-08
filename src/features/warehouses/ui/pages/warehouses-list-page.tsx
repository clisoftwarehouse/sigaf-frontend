import { CONFIG } from '@/app/global-config';

import { WarehousesListView } from '../views/warehouses-list-view';

const metadata = { title: `Almacenes · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <WarehousesListView />
    </>
  );
}
