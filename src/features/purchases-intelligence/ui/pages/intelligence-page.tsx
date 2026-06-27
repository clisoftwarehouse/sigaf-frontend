import { useState } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Container from '@mui/material/Container';

import { PageHeader } from '@/shared/ui/page-header';

import { PortfolioView } from '../views/portfolio-view';
import { LostSalesView } from '../views/lost-sales-view';
import { ConditionsView } from '../views/conditions-view';
import { SuggestionsView } from '../views/suggestions-view';
import { BranchSelector } from '../components/branch-selector';
import { ProfitabilityView } from '../views/profitability-view';
import { IntelligenceDashboardView } from '../views/dashboard-view';

type TabKey = 'dashboard' | 'suggestions' | 'portfolio' | 'profitability' | 'lost-sales' | 'conditions';

export default function IntelligencePage() {
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [branchId, setBranchId] = useState('');

  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <PageHeader
        title="Inteligencia de compras"
        subtitle="Motor ABCD + Pareto + sugerido + comparador interno. Datos en USD."
        crumbs={[{ label: 'Compras' }, { label: 'Inteligencia' }]}
      />

      <BranchSelector value={branchId} onChange={setBranchId} />

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', mt: 2, mb: 3 }}
      >
        <Tab value="dashboard" label="Dashboard" />
        <Tab value="suggestions" label="Sugerido" />
        <Tab value="portfolio" label="Portafolio ABCD" />
        <Tab value="profitability" label="Rentabilidad" />
        <Tab value="lost-sales" label="Ventas perdidas" />
        <Tab value="conditions" label="Condiciones comerciales" />
      </Tabs>

      {tab === 'dashboard' && <IntelligenceDashboardView branchId={branchId} />}
      {tab === 'suggestions' && <SuggestionsView branchId={branchId} />}
      {tab === 'portfolio' && <PortfolioView branchId={branchId} />}
      {tab === 'profitability' && <ProfitabilityView branchId={branchId} />}
      {tab === 'lost-sales' && <LostSalesView branchId={branchId} />}
      {tab === 'conditions' && <ConditionsView />}
    </Container>
  );
}
