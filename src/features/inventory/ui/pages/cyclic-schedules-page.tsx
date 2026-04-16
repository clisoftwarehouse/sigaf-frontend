import { CONFIG } from '@/app/global-config';

import { CyclicSchedulesView } from '../views/cyclic-schedules-view';

const metadata = { title: `Conteo cíclico · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <CyclicSchedulesView />
    </>
  );
}
