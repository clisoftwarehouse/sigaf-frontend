import { CONFIG } from '@/app/global-config';

import { TerminalEditView } from '../views/terminal-edit-view';

const metadata = { title: `Editar terminal · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <TerminalEditView />
    </>
  );
}
