import { CONFIG } from '@/app/global-config';

import { SupplierEditView } from '../views/supplier-edit-view';

const metadata = { title: `Editar proveedor · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <SupplierEditView />
    </>
  );
}
