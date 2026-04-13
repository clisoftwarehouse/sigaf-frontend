import { CONFIG } from '@/app/global-config';

import { LotsListView } from '../views/lots-list-view';

const metadata = { title: `Lotes · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <LotsListView />
    </>
  );
}
