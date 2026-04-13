import { CONFIG } from '@/app/global-config';

import { BranchesListView } from '../views/branches-list-view';

const metadata = { title: `Sucursales · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <BranchesListView />
    </>
  );
}
