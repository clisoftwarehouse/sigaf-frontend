import { CONFIG } from '@/app/global-config';

import { BrandsListView } from '../views/brands-list-view';

const metadata = { title: `Marcas · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <BrandsListView />
    </>
  );
}
