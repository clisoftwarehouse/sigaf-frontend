import { CONFIG } from '@/app/global-config';

import { ProductCreateView } from '../views/product-create-view';

const metadata = { title: `Nuevo producto · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ProductCreateView />
    </>
  );
}
