import { CONFIG } from '@/app/global-config';

import { CashSessionsListView } from '../views/cash-sessions-list-view';

const metadata = { title: `Sesiones de caja · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <CashSessionsListView />
    </>
  );
}
