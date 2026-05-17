import { CONFIG } from '@/app/global-config';

import { CustomerEditView } from '../views/customer-edit-view';

const metadata = { title: `Editar cliente · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <CustomerEditView />
    </>
  );
}
