import { CONFIG } from '@/app/global-config';

import { LiquidationDetailView } from '../views/liquidation-detail-view';

const metadata = { title: `Liquidación · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <LiquidationDetailView />
    </>
  );
}
