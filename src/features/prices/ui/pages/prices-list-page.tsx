import { CONFIG } from '@/app/global-config';

import { PricesListView } from '../views/prices-list-view';

const metadata = { title: `Precios · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <PricesListView />
    </>
  );
}
