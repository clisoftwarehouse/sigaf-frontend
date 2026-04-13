import { CONFIG } from '@/app/global-config';

import { BranchEditView } from '../views/branch-edit-view';

const metadata = { title: `Editar sucursal · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <BranchEditView />
    </>
  );
}
