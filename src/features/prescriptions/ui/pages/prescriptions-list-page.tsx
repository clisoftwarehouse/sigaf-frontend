import { CONFIG } from '@/app/global-config';

import { PrescriptionsListView } from '../views/prescriptions-list-view';

const metadata = { title: `Récipes · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <PrescriptionsListView />
    </>
  );
}
