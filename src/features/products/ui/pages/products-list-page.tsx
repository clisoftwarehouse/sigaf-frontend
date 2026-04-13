import { CONFIG } from '@/app/global-config';

import { ProductsListView } from '../views/products-list-view';

const metadata = { title: `Productos · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ProductsListView />
    </>
  );
}
