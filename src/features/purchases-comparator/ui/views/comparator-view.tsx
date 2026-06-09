import { useState } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Container from '@mui/material/Container';

import { PageHeader } from '@/shared/ui/page-header';

import { ComparisonView } from './comparison-view';
import { ProductsSearchView } from './products-search-view';

// ----------------------------------------------------------------------

type TabKey = 'comparison' | 'products';

export function ComparatorView() {
  const [tab, setTab] = useState<TabKey>('comparison');

  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <PageHeader
        title="Comparador de precios"
        subtitle="Mercado externo (iCompras360). Datos en bolívares."
        crumbs={[{ label: 'Compras' }, { label: 'Comparador' }]}
      />

      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab value="comparison" label="Por principio activo" />
        <Tab value="products" label="Por producto" />
      </Tabs>

      {tab === 'comparison' && <ComparisonView />}
      {tab === 'products' && <ProductsSearchView />}
    </Container>
  );
}
