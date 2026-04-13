import { CONFIG } from '@/app/global-config';

import { ConfigView } from '../views/config-view';

const metadata = { title: `Configuración · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ConfigView />
    </>
  );
}
