import { CONFIG } from '@/app/global-config';

import { OrderDetailView } from '../views/order-detail-view';

const metadata = { title: `Orden · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <OrderDetailView />
    </>
  );
}
