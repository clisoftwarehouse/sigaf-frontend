import { CONFIG } from '@/app/global-config';

import { ComparatorView } from '../views/comparator-view';

const metadata = { title: `Comparador de precios · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ComparatorView />
    </>
  );
}
