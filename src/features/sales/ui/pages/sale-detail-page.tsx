import { CONFIG } from '@/app/global-config';

import { SaleDetailView } from '../views/sale-detail-view';

const metadata = { title: `Detalle de venta · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <SaleDetailView />
    </>
  );
}
