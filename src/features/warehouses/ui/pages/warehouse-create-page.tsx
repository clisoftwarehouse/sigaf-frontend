import { CONFIG } from '@/app/global-config';

import { WarehouseCreateView } from '../views/warehouse-create-view';

const metadata = { title: `Nuevo almacén · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <WarehouseCreateView />
    </>
  );
}
