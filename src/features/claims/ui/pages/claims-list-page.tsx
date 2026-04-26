import { CONFIG } from '@/app/global-config';

import { ClaimsListView } from '../views/claims-list-view';

const metadata = { title: `Reclamos · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ClaimsListView />
    </>
  );
}
