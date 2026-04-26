import { CONFIG } from '@/app/global-config';

import { ClaimPrintView } from '../views/claim-print-view';

const metadata = { title: `Imprimir reclamo · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ClaimPrintView />
    </>
  );
}
