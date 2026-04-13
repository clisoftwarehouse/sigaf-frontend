import { CONFIG } from '@/app/global-config';

import { KardexView } from '../views/kardex-view';

const metadata = { title: `Kardex · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <KardexView />
    </>
  );
}
