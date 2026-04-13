import { CONFIG } from '@/app/global-config';

import { ReceiptCreateView } from '../views/receipt-create-view';

const metadata = { title: `Nueva recepción · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ReceiptCreateView />
    </>
  );
}
