import { CONFIG } from '@/app/global-config';

import { InventoryProductDetailView } from '../views/product-detail-view';

const metadata = { title: `Detalle de producto · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <InventoryProductDetailView />
    </>
  );
}
