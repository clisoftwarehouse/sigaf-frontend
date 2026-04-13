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
  inventory: <Iconify icon="solar:box-minimalistic-bold" width={22} />,
  stock: <Iconify icon="solar:archive-down-minimlistic-bold" width={22} />,
  lots: <Iconify icon="solar:calendar-date-bold" width={22} />,
  kardex: <Iconify icon="solar:bill-list-bold" width={22} />,
  org: <Iconify icon="solar:home-2-outline" width={22} />,
  branches: <Iconify icon="solar:home-angle-bold-duotone" width={22} />,
  terminals: <Iconify icon="solar:cart-3-bold" width={22} />,
  locations: <Iconify icon="solar:box-minimalistic-bold" width={22} />,
  admin: <Iconify icon="solar:shield-keyhole-bold-duotone" width={22} />,
  users: <Iconify icon="solar:users-group-rounded-bold-duotone" width={22} />,
  roles: <Iconify icon="solar:shield-check-bold" width={22} />,
  permissions: <Iconify icon="solar:shield-keyhole-bold-duotone" width={22} />,
  config: <Iconify icon="solar:settings-bold-duotone" width={22} />,
  rates: <Iconify icon="solar:wad-of-money-bold" width={22} />,
  purchases: <Iconify icon="solar:cart-plus-bold" width={22} />,
  orders: <Iconify icon="solar:bill-list-bold-duotone" width={22} />,
  receipts: <Iconify icon="solar:inbox-in-bold-duotone" width={22} />,
  consignments: <Iconify icon="solar:suitcase-tag-bold" width={22} />,
};

// ----------------------------------------------------------------------

export const navData: NavSectionProps['data'] = [
  {
    subheader: 'General',
    items: [
      {
        title: 'Dashboard',
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
      },
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
        ],
      },
      {
        title: 'Catálogo',
        path: paths.dashboard.catalog.root,
        icon: ICONS.catalog,
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
        title: 'Inventario',
        path: paths.dashboard.inventory.root,
        icon: ICONS.inventory,
        children: [
          { title: 'Stock', path: paths.dashboard.inventory.stock, icon: ICONS.stock },
          { title: 'Lotes', path: paths.dashboard.inventory.lots.root, icon: ICONS.lots },
          {
            title: 'Kardex',
            path: paths.dashboard.inventory.kardex,
            icon: ICONS.kardex,
            allowedRoles: ['administrador'],
          },
        ],
      },
      {
        title: 'Compras',
        path: paths.dashboard.purchases.root,
        icon: ICONS.purchases,
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
            icon: ICONS.orders,
          },
          {
            title: 'Liquidaciones',
            path: paths.dashboard.consignments.liquidations.root,
            icon: ICONS.rates,
          },
        ],
      },
    ],
  },
  {
    subheader: 'Administración',
    items: [
      {
        title: 'Administración',
        path: paths.dashboard.admin.root,
        icon: ICONS.admin,
        children: [
          { title: 'Usuarios', path: paths.dashboard.admin.users.root, icon: ICONS.users },
          { title: 'Roles', path: paths.dashboard.admin.roles, icon: ICONS.roles },
          {
            title: 'Permisos',
            path: paths.dashboard.admin.permissions,
            icon: ICONS.permissions,
          },
          { title: 'Configuración', path: paths.dashboard.admin.config, icon: ICONS.config },
          {
            title: 'Tasas de cambio',
            path: paths.dashboard.admin.exchangeRates,
            icon: ICONS.rates,
          },
        ],
      },
    ],
  },
];
