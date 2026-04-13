import { CONFIG } from '@/app/global-config';

import { ReturnCreateView } from '../views/return-create-view';

const metadata = { title: `Nueva devolución · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ReturnCreateView />
    </>
  );
}
