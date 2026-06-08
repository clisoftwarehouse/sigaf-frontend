import { CONFIG } from '@/app/global-config';

import { TransferDetailView } from '../views/transfer-detail-view';

const metadata = { title: `Transferencia · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <TransferDetailView />
    </>
  );
}
