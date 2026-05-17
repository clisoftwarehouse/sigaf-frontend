import { CONFIG } from '@/app/global-config';

import { CashSessionDetailView } from '../views/cash-session-detail-view';

const metadata = { title: `Sesión de caja · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <CashSessionDetailView />
    </>
  );
}
