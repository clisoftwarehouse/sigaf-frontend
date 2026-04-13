import { CONFIG } from '@/app/global-config';

import { ExchangeRatesView } from '../views/exchange-rates-view';

const metadata = { title: `Tasas de cambio · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ExchangeRatesView />
    </>
  );
}
