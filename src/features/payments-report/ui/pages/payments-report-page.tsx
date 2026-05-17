import { CONFIG } from '@/app/global-config';

import { PaymentsReportView } from '../views/payments-report-view';

const metadata = { title: `Reporte de pagos · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <PaymentsReportView />
    </>
  );
}
