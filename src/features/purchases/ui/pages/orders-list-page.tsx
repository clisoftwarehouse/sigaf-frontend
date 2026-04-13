import { CONFIG } from '@/app/global-config';

import { OrdersListView } from '../views/orders-list-view';

const metadata = { title: `Órdenes de compra · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <OrdersListView />
    </>
  );
}
