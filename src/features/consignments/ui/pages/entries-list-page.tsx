import { CONFIG } from '@/app/global-config';

import { EntriesListView } from '../views/entries-list-view';

const metadata = { title: `Entradas de consignación · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <EntriesListView />
    </>
  );
}
