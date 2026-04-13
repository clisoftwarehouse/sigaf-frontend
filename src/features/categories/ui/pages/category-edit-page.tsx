import { CONFIG } from '@/app/global-config';

import { CategoryEditView } from '../views/category-edit-view';

const metadata = { title: `Editar categoría · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <CategoryEditView />
    </>
  );
}
