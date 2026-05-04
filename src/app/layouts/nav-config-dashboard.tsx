import type { NavSectionProps } from '@/app/components/nav-section';

import { paths } from '@/app/routes/paths';
import { Iconify } from '@/app/components/iconify';

// ----------------------------------------------------------------------

const ICONS = {
  dashboard: <Iconify icon="solar:home-angle-bold-duotone" width={22} />,
  catalog: <Iconify icon="solar:notebook-bold-duotone" width={22} />,
  products: <Iconify icon="solar:box-minimalistic-bold" width={22} />,
  brands: <Iconify icon="solar:tag-horizontal-bold-duotone" width={22} />,
  categories: <Iconify icon="solar:add-folder-bold" width={22} />,
  ingredients: <Iconify icon="solar:atom-bold-duotone" width={22} />,
  suppliers: <Iconify icon="solar:case-minimalistic-bold" width={22} />,
  pricing: <Iconify icon="solar:tag-horizontal-bold-duotone" width={22} />,
  prices: <Iconify icon="solar:wad-of-money-bold" width={22} />,
  promotions: <Iconify icon="solar:cup-star-bold" width={22} />,
  rates: <Iconify icon="solar:transfer-horizontal-bold-duotone" width={22} />,
  inventory: <Iconify icon="solar:box-minimalistic-bold" width={22} />,
  stock: <Iconify icon="solar:archive-down-minimlistic-bold" width={22} />,
  counts: <Iconify icon="solar:bill-list-bold-duotone" width={22} />,
  cyclic: <Iconify icon="solar:clock-circle-bold" width={22} />,
  purchases: <Iconify icon="solar:cart-plus-bold" width={22} />,
  orders: <Iconify icon="solar:bill-list-bold-duotone" width={22} />,
  receipts: <Iconify icon="solar:inbox-in-bold-duotone" width={22} />,
  claims: <Iconify icon="solar:danger-triangle-bold" width={22} />,
  consignments: <Iconify icon="solar:suitcase-tag-bold" width={22} />,
  consignmentReturn: <Iconify icon="solar:multiple-forward-left-broken" width={22} />,
  liquidations: <Iconify icon="solar:wad-of-money-bold" width={22} />,
  kardex: <Iconify icon="solar:bill-list-bold" width={22} />,
  audit: <Iconify icon="solar:file-text-bold" width={22} />,
  org: <Iconify icon="solar:home-2-outline" width={22} />,
  branches: <Iconify icon="solar:home-angle-bold-duotone" width={22} />,
  terminals: <Iconify icon="solar:cart-3-bold" width={22} />,
  locations: <Iconify icon="solar:box-minimalistic-bold" width={22} />,
  branchGroups: <Iconify icon="solar:atom-bold-duotone" width={22} />,
  system: <Iconify icon="solar:shield-keyhole-bold-duotone" width={22} />,
  users: <Iconify icon="solar:users-group-rounded-bold-duotone" width={22} />,
  roles: <Iconify icon="solar:shield-check-bold" width={22} />,
  permissions: <Iconify icon="solar:lock-password-outline" width={22} />,
  config: <Iconify icon="solar:settings-bold-duotone" width={22} />,
  imports: <Iconify icon="solar:import-bold" width={22} />,
};

// ----------------------------------------------------------------------

export const navData: NavSectionProps['data'] = [
  {
    subheader: 'Inicio',
    items: [
      {
        title: 'Dashboard',
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
      },
    ],
  },
  {
    subheader: 'Catálogo',
    items: [
      {
        title: 'Catálogo',
        path: paths.dashboard.catalog.products.root,
        icon: ICONS.catalog,
        deepMatch: false,
        extraMatchPaths: [
          paths.dashboard.catalog.products.root,
          paths.dashboard.catalog.brands.root,
          paths.dashboard.catalog.categories.root,
          paths.dashboard.catalog.activeIngredients.root,
          paths.dashboard.catalog.suppliers.root,
        ],
        children: [
          {
            title: 'Productos',
            path: paths.dashboard.catalog.products.root,
            icon: ICONS.products,
          },
          { title: 'Marcas', path: paths.dashboard.catalog.brands.root, icon: ICONS.brands },
          {
            title: 'Categorías',
            path: paths.dashboard.catalog.categories.root,
            icon: ICONS.categories,
          },
          {
            title: 'Principios activos',
            path: paths.dashboard.catalog.activeIngredients.root,
            icon: ICONS.ingredients,
          },
          {
            title: 'Proveedores',
            path: paths.dashboard.catalog.suppliers.root,
            icon: ICONS.suppliers,
          },
        ],
      },
      {
        title: 'Precios y promociones',
        path: paths.dashboard.catalog.prices,
        icon: ICONS.pricing,
        deepMatch: false,
        extraMatchPaths: [
          paths.dashboard.catalog.prices,
          paths.dashboard.catalog.promotions,
          paths.dashboard.admin.exchangeRates,
        ],
        children: [
          { title: 'Precios', path: paths.dashboard.catalog.prices, icon: ICONS.prices },
          {
            title: 'Promociones',
            path: paths.dashboard.catalog.promotions,
            icon: ICONS.promotions,
          },
          {
            title: 'Tasas de cambio',
            path: paths.dashboard.admin.exchangeRates,
            icon: ICONS.rates,
          },
        ],
      },
    ],
  },
  {
    subheader: 'Operaciones',
    items: [
      {
        title: 'Inventario',
        path: paths.dashboard.inventory.stock,
        icon: ICONS.inventory,
        deepMatch: false,
        extraMatchPaths: [
          paths.dashboard.inventory.stock,
          paths.dashboard.inventory.counts.root,
          paths.dashboard.inventory.cyclicSchedules,
        ],
        children: [
          { title: 'Stock', path: paths.dashboard.inventory.stock, icon: ICONS.stock },
          {
            title: 'Tomas',
            path: paths.dashboard.inventory.counts.root,
            icon: ICONS.counts,
          },
          {
            title: 'Conteo cíclico',
            path: paths.dashboard.inventory.cyclicSchedules,
            icon: ICONS.cyclic,
          },
        ],
      },
      {
        title: 'Compras',
        path: paths.dashboard.purchases.root,
        icon: ICONS.purchases,
        extraMatchPaths: [paths.dashboard.claims.root],
        children: [
          {
            title: 'Órdenes de compra',
            path: paths.dashboard.purchases.orders.root,
            icon: ICONS.orders,
          },
          {
            title: 'Recepciones',
            path: paths.dashboard.purchases.receipts.root,
            icon: ICONS.receipts,
          },
          {
            title: 'Reclamos',
            path: paths.dashboard.claims.root,
            icon: ICONS.claims,
          },
        ],
      },
      {
        title: 'Consignaciones',
        path: paths.dashboard.consignments.root,
        icon: ICONS.consignments,
        children: [
          {
            title: 'Entradas',
            path: paths.dashboard.consignments.entries.root,
            icon: ICONS.receipts,
          },
          {
            title: 'Devoluciones',
            path: paths.dashboard.consignments.returns.root,
            icon: ICONS.consignmentReturn,
          },
          {
            title: 'Liquidaciones',
            path: paths.dashboard.consignments.liquidations.root,
            icon: ICONS.liquidations,
          },
        ],
      },
    ],
  },
  {
    subheader: 'Control',
    items: [
      {
        title: 'Kardex',
        path: paths.dashboard.inventory.kardex,
        icon: ICONS.kardex,
        allowedRoles: ['administrador'],
      },
      {
        title: 'Auditoría',
        path: paths.dashboard.admin.auditLog,
        icon: ICONS.audit,
      },
    ],
  },
  {
    subheader: 'Administración',
    items: [
      {
        title: 'Organización',
        path: paths.dashboard.organization.root,
        icon: ICONS.org,
        children: [
          {
            title: 'Sucursales',
            path: paths.dashboard.organization.branches.root,
            icon: ICONS.branches,
          },
          {
            title: 'Terminales POS',
            path: paths.dashboard.organization.terminals.root,
            icon: ICONS.terminals,
          },
          {
            title: 'Ubicaciones',
            path: paths.dashboard.organization.locations.root,
            icon: ICONS.locations,
          },
          {
            title: 'Grupos de sucursales',
            path: paths.dashboard.organization.branchGroups.root,
            icon: ICONS.branchGroups,
          },
        ],
      },
      {
        title: 'Sistema',
        path: paths.dashboard.admin.users.root,
        icon: ICONS.system,
        deepMatch: false,
        extraMatchPaths: [
          paths.dashboard.admin.users.root,
          paths.dashboard.admin.roles.root,
          paths.dashboard.admin.permissions,
          paths.dashboard.admin.config,
          paths.dashboard.admin.imports,
        ],
        children: [
          { title: 'Usuarios', path: paths.dashboard.admin.users.root, icon: ICONS.users },
          { title: 'Roles', path: paths.dashboard.admin.roles.root, icon: ICONS.roles },
          {
            title: 'Permisos',
            path: paths.dashboard.admin.permissions,
            icon: ICONS.permissions,
          },
          { title: 'Configuración', path: paths.dashboard.admin.config, icon: ICONS.config },
          {
            title: 'Importaciones',
            path: paths.dashboard.admin.imports,
            icon: ICONS.imports,
          },
        ],
      },
    ],
  },
];
