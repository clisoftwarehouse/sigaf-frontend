import { CONFIG } from '@/app/global-config';

import { JwtSignInView } from '../views';

// ----------------------------------------------------------------------

const metadata = { title: `Iniciar sesión · ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <JwtSignInView />
    </>
  );
}
