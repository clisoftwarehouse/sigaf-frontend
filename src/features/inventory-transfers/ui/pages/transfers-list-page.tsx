import { CONFIG } from '@/app/global-config';

import { TransfersListView } from '../views/transfers-list-view';

const metadata = { title: `Transferencias · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <TransfersListView />
    </>
  );
}
