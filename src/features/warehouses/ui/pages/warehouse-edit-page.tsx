import { CONFIG } from '@/app/global-config';

import { WarehouseEditView } from '../views/warehouse-edit-view';

const metadata = { title: `Editar almacén · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <WarehouseEditView />
    </>
  );
}
