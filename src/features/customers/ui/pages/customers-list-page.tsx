import { CONFIG } from '@/app/global-config';

import { CustomersListView } from '../views/customers-list-view';

const metadata = { title: `Clientes · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <CustomersListView />
    </>
  );
}
