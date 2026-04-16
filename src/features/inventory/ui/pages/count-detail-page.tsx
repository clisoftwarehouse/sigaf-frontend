import { CONFIG } from '@/app/global-config';

import { CountDetailView } from '../views/count-detail-view';

const metadata = { title: `Detalle de toma · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <CountDetailView />
    </>
  );
}
