import { CONFIG } from '@/app/global-config';

import { LiquidationCreateView } from '../views/liquidation-create-view';

const metadata = { title: `Nueva liquidación · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <LiquidationCreateView />
    </>
  );
}
