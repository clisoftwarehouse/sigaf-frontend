import { CONFIG } from '@/app/global-config';

import { ReservationsListView } from '../views/reservations-list-view';

const metadata = { title: `Reservas de stock · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <ReservationsListView />
    </>
  );
}
