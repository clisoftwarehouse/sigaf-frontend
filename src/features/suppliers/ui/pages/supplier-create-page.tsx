import { CONFIG } from '@/app/global-config';

import { SupplierCreateView } from '../views/supplier-create-view';

const metadata = { title: `Nuevo proveedor · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <SupplierCreateView />
    </>
  );
}
