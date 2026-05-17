import { CONFIG } from '@/app/global-config';

import { PrescriptionCreateView } from '../views/prescription-create-view';

const metadata = { title: `Nuevo récipe · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <PrescriptionCreateView />
    </>
  );
}
