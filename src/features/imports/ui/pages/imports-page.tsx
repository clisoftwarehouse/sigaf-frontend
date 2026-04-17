import { CONFIG } from '@/app/global-config';

import { ImportsView } from '../views/imports-view';

const metadata = { title: `Importaciones · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ImportsView />
    </>
  );
}
