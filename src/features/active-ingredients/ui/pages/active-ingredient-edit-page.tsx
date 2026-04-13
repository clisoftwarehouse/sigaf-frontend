import { CONFIG } from '@/app/global-config';

import { ActiveIngredientEditView } from '../views/active-ingredient-edit-view';

const metadata = { title: `Editar principio activo · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ActiveIngredientEditView />
    </>
  );
}
