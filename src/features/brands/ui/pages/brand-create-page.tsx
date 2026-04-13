import { CONFIG } from '@/app/global-config';

import { BrandCreateView } from '../views/brand-create-view';

const metadata = { title: `Nueva marca · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <BrandCreateView />
    </>
  );
}
