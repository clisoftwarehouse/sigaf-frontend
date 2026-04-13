import { CONFIG } from '@/app/global-config';

import { ReturnsListView } from '../views/returns-list-view';

const metadata = { title: `Devoluciones · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ReturnsListView />
    </>
  );
}
