import { CONFIG } from '@/app/global-config';

import { ClaimCreateView } from '../views/claim-create-view';

const metadata = { title: `Nuevo reclamo · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ClaimCreateView />
    </>
  );
}
