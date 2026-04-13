import { CONFIG } from '@/app/global-config';

import { BranchCreateView } from '../views/branch-create-view';

const metadata = { title: `Nueva sucursal · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <BranchCreateView />
    </>
  );
}
