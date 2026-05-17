import { CONFIG } from '@/app/global-config';

import { PrescriptionDetailView } from '../views/prescription-detail-view';

const metadata = { title: `Récipe · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <PrescriptionDetailView />
    </>
  );
}
