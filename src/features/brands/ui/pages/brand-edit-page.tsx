import { CONFIG } from '@/app/global-config';

import { BrandEditView } from '../views/brand-edit-view';

const metadata = { title: `Editar marca · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <BrandEditView />
    </>
  );
}
