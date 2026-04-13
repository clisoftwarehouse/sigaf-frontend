import { CONFIG } from '@/app/global-config';

import { OrderCreateView } from '../views/order-create-view';

const metadata = { title: `Nueva orden · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <OrderCreateView />
    </>
  );
}
