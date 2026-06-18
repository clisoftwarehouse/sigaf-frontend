import { CONFIG } from '@/app/global-config';

import { ReturnDetailView } from '../views/return-detail-view';

const metadata = { title: `Devolución · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ReturnDetailView />
    </>
  );
}
