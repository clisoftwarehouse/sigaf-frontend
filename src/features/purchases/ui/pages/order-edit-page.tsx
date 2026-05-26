import { CONFIG } from '@/app/global-config';

import { OrderEditView } from '../views/order-edit-view';

const metadata = { title: `Editar orden · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <OrderEditView />
    </>
  );
}
