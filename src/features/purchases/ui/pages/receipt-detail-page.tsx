import { CONFIG } from '@/app/global-config';

import { ReceiptDetailView } from '../views/receipt-detail-view';

const metadata = { title: `Recepción · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ReceiptDetailView />
    </>
  );
}
