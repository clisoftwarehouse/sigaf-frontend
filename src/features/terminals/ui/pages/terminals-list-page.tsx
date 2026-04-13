import { CONFIG } from '@/app/global-config';

import { TerminalsListView } from '../views/terminals-list-view';

const metadata = { title: `Terminales POS · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <TerminalsListView />
    </>
  );
}
