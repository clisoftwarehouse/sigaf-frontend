import { CONFIG } from '@/app/global-config';

import { ProductEditView } from '../views/product-edit-view';

const metadata = { title: `Editar producto · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ProductEditView />
    </>
  );
}
