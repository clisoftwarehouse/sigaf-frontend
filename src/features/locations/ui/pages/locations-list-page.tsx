import { CONFIG } from '@/app/global-config';

import { LocationsListView } from '../views/locations-list-view';

const metadata = { title: `Ubicaciones · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <LocationsListView />
    </>
  );
}
