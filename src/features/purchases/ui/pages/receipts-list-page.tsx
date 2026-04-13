import { CONFIG } from '@/app/global-config';

import { ReceiptsListView } from '../views/receipts-list-view';

const metadata = { title: `Recepciones · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ReceiptsListView />
    </>
  );
}
