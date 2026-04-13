import { CONFIG } from '@/app/global-config';

import { EntryDetailView } from '../views/entry-detail-view';

const metadata = { title: `Entrada · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <EntryDetailView />
    </>
  );
}
