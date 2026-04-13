import { CONFIG } from '@/app/global-config';

import { ActiveIngredientCreateView } from '../views/active-ingredient-create-view';

const metadata = { title: `Nuevo principio activo · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ActiveIngredientCreateView />
    </>
  );
}
