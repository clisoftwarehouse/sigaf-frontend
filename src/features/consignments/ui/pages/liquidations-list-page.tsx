import { CONFIG } from '@/app/global-config';

import { LiquidationsListView } from '../views/liquidations-list-view';

const metadata = { title: `Liquidaciones · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <LiquidationsListView />
    </>
  );
}
