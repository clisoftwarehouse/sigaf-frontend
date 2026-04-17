import { CONFIG } from '@/app/global-config';

import { PromotionsListView } from '../views/promotions-list-view';

const metadata = { title: `Promociones · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <PromotionsListView />
    </>
  );
}
