import { CONFIG } from '@/app/global-config';

import { CountsListView } from '../views/counts-list-view';

const metadata = { title: `Tomas de inventario · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <CountsListView />
    </>
  );
}
