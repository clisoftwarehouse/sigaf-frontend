import { CONFIG } from '@/app/global-config';

import { CountCreateView } from '../views/count-create-view';

const metadata = { title: `Nueva toma · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <CountCreateView />
    </>
  );
}
