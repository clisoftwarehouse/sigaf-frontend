import { CONFIG } from '@/app/global-config';

import { CustomerCreateView } from '../views/customer-create-view';

const metadata = { title: `Nuevo cliente · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <CustomerCreateView />
    </>
  );
}
