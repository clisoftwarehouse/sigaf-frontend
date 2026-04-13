import { CONFIG } from '@/app/global-config';

import { LocationEditView } from '../views/location-edit-view';

const metadata = { title: `Editar ubicación · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <LocationEditView />
    </>
  );
}
