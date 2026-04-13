import { CONFIG } from '@/app/global-config';

import { LotEditView } from '../views/lot-edit-view';

const metadata = { title: `Editar lote · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <LotEditView />
    </>
  );
}
