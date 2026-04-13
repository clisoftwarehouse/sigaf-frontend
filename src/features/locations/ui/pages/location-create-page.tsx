import { CONFIG } from '@/app/global-config';

import { LocationCreateView } from '../views/location-create-view';

const metadata = { title: `Nueva ubicación · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <LocationCreateView />
    </>
  );
}
