import { CONFIG } from '@/app/global-config';

import { ActiveIngredientsListView } from '../views/active-ingredients-list-view';

const metadata = { title: `Principios activos · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ActiveIngredientsListView />
    </>
  );
}
