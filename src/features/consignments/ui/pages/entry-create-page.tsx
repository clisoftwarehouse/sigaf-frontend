import { CONFIG } from '@/app/global-config';

import { EntryCreateView } from '../views/entry-create-view';

const metadata = { title: `Nueva entrada · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <EntryCreateView />
    </>
  );
}
