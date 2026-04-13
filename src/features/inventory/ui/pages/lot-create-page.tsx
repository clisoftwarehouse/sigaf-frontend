import { CONFIG } from '@/app/global-config';

import { LotCreateView } from '../views/lot-create-view';

const metadata = { title: `Nuevo lote · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <LotCreateView />
    </>
  );
}
