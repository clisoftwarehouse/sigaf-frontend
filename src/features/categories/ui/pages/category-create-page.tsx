import { CONFIG } from '@/app/global-config';

import { CategoryCreateView } from '../views/category-create-view';

const metadata = { title: `Nueva categoría · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <CategoryCreateView />
    </>
  );
}
