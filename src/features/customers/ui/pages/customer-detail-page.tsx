import { CONFIG } from '@/app/global-config';

import { CustomerDetailView } from '../views/customer-detail-view';

const metadata = { title: `Ficha de cliente · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <CustomerDetailView />
    </>
  );
}
