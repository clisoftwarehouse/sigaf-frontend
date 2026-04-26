import { CONFIG } from '@/app/global-config';

import { ClaimDetailView } from '../views/claim-detail-view';

const metadata = { title: `Reclamo · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ClaimDetailView />
    </>
  );
}
