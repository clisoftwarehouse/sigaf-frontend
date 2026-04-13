import { CONFIG } from '@/app/global-config';

import { CategoriesListView } from '../views/categories-list-view';

const metadata = { title: `Categorías · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <CategoriesListView />
    </>
  );
}
