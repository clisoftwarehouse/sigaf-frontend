import { CONFIG } from '@/app/global-config';

import { AuditLogView } from '../views/audit-log-view';

const metadata = { title: `Auditoría · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <AuditLogView />
    </>
  );
}
