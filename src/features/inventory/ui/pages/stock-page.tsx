import { CONFIG } from '@/app/global-config';

import { StockView } from '../views/stock-view';

const metadata = { title: `Stock · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <StockView />
    </>
  );
}
