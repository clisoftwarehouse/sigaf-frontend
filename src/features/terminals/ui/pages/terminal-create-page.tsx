import { CONFIG } from '@/app/global-config';

import { TerminalCreateView } from '../views/terminal-create-view';

const metadata = { title: `Nuevo terminal · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <TerminalCreateView />
    </>
  );
}
