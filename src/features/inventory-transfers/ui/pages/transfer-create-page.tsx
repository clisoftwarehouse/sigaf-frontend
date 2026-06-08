import { CONFIG } from '@/app/global-config';

import { TransferCreateView } from '../views/transfer-create-view';

const metadata = { title: `Nueva transferencia · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <TransferCreateView />
    </>
  );
}
