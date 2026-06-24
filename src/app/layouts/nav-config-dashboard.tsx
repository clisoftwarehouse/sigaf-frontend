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
  transfers: <Iconify icon="solar:transfer-horizontal-bold-duotone" width={22} />,
  comparator: <Iconify icon="solar:chart-square-outline" width={22} />,
  intelligence: <Iconify icon="solar:atom-bold-duotone" width={22} />,
  accountsPayable: <Iconify icon="solar:wad-of-money-bold" width={22} />,
  prescribers: <Iconify icon="solar:user-id-bold" width={22} />,
  librosIva: <Iconify icon="solar:bill-list-bold-duotone" width={22} />,
  igtf: <Iconify icon="solar:wad-of-money-bold" width={22} />,
  rentabilidad: <Iconify icon="solar:chart-square-outline" width={22} />,
  inventarioLibro: <Iconify icon="solar:box-minimalistic-bold" width={22} />,
  controlados: <Iconify icon="solar:shield-keyhole-bold-duotone" width={22} />,
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
  warehouses: <Iconify icon="solar:box-minimalistic-bold" width={22} />,
  branchGroups: <Iconify icon="solar:atom-bold-duotone" width={22} />,
  system: <Iconify icon="solar:shield-keyhole-bold-duotone" width={22} />,
  users: <Iconify icon="solar:users-group-rounded-bold-duotone" width={22} />,
  roles: <Iconify icon="solar:shield-check-bold" width={22} />,
  permissions: <Iconify icon="solar:lock-password-outline" width={22} />,
  config: <Iconify icon="solar:settings-bold-duotone" width={22} />,
  imports: <Iconify icon="solar:import-bold" width={22} />,
  pos: <Iconify icon="solar:cart-3-bold" width={22} />,
  customers: <Iconify icon="solar:users-group-rounded-bold-duotone" width={22} />,
  prescriptions: <Iconify icon="solar:notes-bold-duotone" width={22} />,
  cashSessions: <Iconify icon="solar:wad-of-money-bold" width={22} />,
  paymentsReport: <Iconify icon="solar:chart-square-outline" width={22} />,
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
        // Visible para cualquier rol que pueda ver productos. Los formularios
        // dentro deshabilitan las acciones write si falta `products.create/edit`.
        allowedPermissions: ['products.view'],
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
        // Solo quienes pueden crear/editar precios o promociones.
        allowedPermissions: ['products.edit', 'admin.config'],
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
        allowedPermissions: ['inventory.view'],
        deepMatch: false,
        extraMatchPaths: [
          paths.dashboard.inventory.stock,
          paths.dashboard.inventory.counts.root,
          paths.dashboard.inventory.transfers.root,
          paths.dashboard.inventory.reservations,
          paths.dashboard.inventory.cyclicSchedules,
          paths.dashboard.inventory.kardex,
        ],
        children: [
          { title: 'Stock', path: paths.dashboard.inventory.stock, icon: ICONS.stock },
          {
            title: 'Tomas',
            path: paths.dashboard.inventory.counts.root,
            icon: ICONS.counts,
          },
          {
            title: 'Transferencias',
            path: paths.dashboard.inventory.transfers.root,
            icon: ICONS.transfers,
          },
          {
            title: 'Reservas',
            path: paths.dashboard.inventory.reservations,
            icon: ICONS.transfers,
          },
          {
            title: 'Conteo cíclico',
            path: paths.dashboard.inventory.cyclicSchedules,
            icon: ICONS.cyclic,
          },
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
        allowedPermissions: ['purchases.view'],
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
            title: 'Comparador de precios',
            path: paths.dashboard.purchases.comparator,
            icon: ICONS.comparator,
          },
          {
            title: 'Inteligencia de compras',
            path: paths.dashboard.purchases.intelligence,
            icon: ICONS.intelligence,
          },
          {
            title: 'Cuentas por pagar',
            path: paths.dashboard.purchases.accountsPayable,
            icon: ICONS.accountsPayable,
          },
          {
            title: 'Reclamos',
            path: paths.dashboard.claims.root,
            icon: ICONS.claims,
          },
        ],
      },
      // Consignaciones OCULTO temporalmente del menú (solo oculto, no eliminado).
      // Las rutas (dashboard.tsx) y todo el código del módulo siguen intactos;
      // para reactivarlo, descomentar este bloque.
      // {
      //   title: 'Consignaciones',
      //   path: paths.dashboard.consignments.root,
      //   icon: ICONS.consignments,
      //   // Consignaciones es una variante de compras; solo quienes pueden ver
      //   // compras necesitan acceso (no el cajero ni el farmacéutico).
      //   allowedPermissions: ['purchases.view'],
      //   children: [
      //     {
      //       title: 'Entradas',
      //       path: paths.dashboard.consignments.entries.root,
      //       icon: ICONS.receipts,
      //     },
      //     {
      //       title: 'Devoluciones',
      //       path: paths.dashboard.consignments.returns.root,
      //       icon: ICONS.consignmentReturn,
      //     },
      //     {
      //       title: 'Liquidaciones',
      //       path: paths.dashboard.consignments.liquidations.root,
      //       icon: ICONS.liquidations,
      //     },
      //   ],
      // },
    ],
  },
  {
    subheader: 'Caja y clientes',
    items: [
      {
        title: 'Clientes',
        path: paths.dashboard.pos.customers.root,
        icon: ICONS.customers,
        allowedPermissions: ['customers.view'],
      },
      {
        title: 'Récipes',
        path: paths.dashboard.pos.prescriptions.root,
        icon: ICONS.prescriptions,
        allowedPermissions: ['prescriptions.view'],
      },
      {
        title: 'Médicos',
        path: paths.dashboard.pos.prescribers,
        icon: ICONS.prescribers,
        allowedPermissions: ['prescriptions.view'],
      },
      {
        title: 'Sesiones de caja',
        path: paths.dashboard.pos.cashSessions.root,
        icon: ICONS.cashSessions,
        allowedPermissions: ['cash.view'],
      },
    ],
  },
  {
    subheader: 'Reportes',
    items: [
      {
        title: 'Ventas',
        path: paths.dashboard.pos.paymentsReport,
        icon: ICONS.paymentsReport,
        allowedPermissions: ['reports.view'],
        deepMatch: false,
        extraMatchPaths: [
          paths.dashboard.pos.paymentsReport,
          paths.dashboard.admin.rentabilidad,
          paths.dashboard.admin.reportes.transacciones,
          paths.dashboard.admin.reportes.devoluciones,
          paths.dashboard.admin.reportes.ticketPromedio,
          paths.dashboard.admin.reportes.productividad,
          paths.dashboard.admin.reportes.efectividadPromos,
          paths.dashboard.admin.reportes.reporteX,
        ],
        children: [
          { title: 'Reporte de pagos', path: paths.dashboard.pos.paymentsReport, icon: ICONS.paymentsReport },
          { title: 'Rentabilidad', path: paths.dashboard.admin.rentabilidad, icon: ICONS.rentabilidad },
          { title: 'Transacciones', path: paths.dashboard.admin.reportes.transacciones, icon: ICONS.kardex },
          { title: 'Devoluciones', path: paths.dashboard.admin.reportes.devoluciones, icon: ICONS.consignmentReturn },
          { title: 'Ticket promedio', path: paths.dashboard.admin.reportes.ticketPromedio, icon: ICONS.comparator },
          { title: 'Productividad cajero', path: paths.dashboard.admin.reportes.productividad, icon: ICONS.users },
          { title: 'Efectividad de promos', path: paths.dashboard.admin.reportes.efectividadPromos, icon: ICONS.promotions },
          { title: 'Reporte X', path: paths.dashboard.admin.reportes.reporteX, icon: ICONS.cashSessions },
        ],
      },
      {
        title: 'Inventario',
        path: paths.dashboard.admin.reportes.riesgo,
        icon: ICONS.inventory,
        allowedPermissions: ['reports.view'],
        deepMatch: false,
        extraMatchPaths: [
          paths.dashboard.admin.reportes.riesgo,
          paths.dashboard.admin.reportes.merma,
          paths.dashboard.admin.reportes.diasInventario,
          paths.dashboard.admin.reportes.capitalEstancado,
          paths.dashboard.admin.reportes.pareto,
          paths.dashboard.admin.reportes.transferencias,
        ],
        children: [
          { title: 'Riesgo de vencimiento', path: paths.dashboard.admin.reportes.riesgo, icon: ICONS.claims },
          { title: 'Merma', path: paths.dashboard.admin.reportes.merma, icon: ICONS.consignmentReturn },
          { title: 'Días de inventario', path: paths.dashboard.admin.reportes.diasInventario, icon: ICONS.cyclic },
          { title: 'Capital represado', path: paths.dashboard.admin.reportes.capitalEstancado, icon: ICONS.prices },
          { title: 'Pareto', path: paths.dashboard.admin.reportes.pareto, icon: ICONS.comparator },
          { title: 'Transferencias', path: paths.dashboard.admin.reportes.transferencias, icon: ICONS.transfers },
        ],
      },
      {
        title: 'Compras',
        path: paths.dashboard.admin.reportes.saldosProveedores,
        icon: ICONS.purchases,
        allowedPermissions: ['reports.view'],
        deepMatch: false,
        extraMatchPaths: [
          paths.dashboard.admin.reportes.saldosProveedores,
          paths.dashboard.admin.reportes.variacionPrecios,
          paths.dashboard.admin.reportes.nivelServicio,
        ],
        children: [
          { title: 'Saldos a proveedores', path: paths.dashboard.admin.reportes.saldosProveedores, icon: ICONS.accountsPayable },
          { title: 'Variación de precios', path: paths.dashboard.admin.reportes.variacionPrecios, icon: ICONS.prices },
          { title: 'Nivel de servicio', path: paths.dashboard.admin.reportes.nivelServicio, icon: ICONS.comparator },
        ],
      },
      {
        title: 'Clientes',
        path: paths.dashboard.admin.reportes.comportamientoClientes,
        icon: ICONS.customers,
        allowedPermissions: ['reports.view'],
        deepMatch: false,
        extraMatchPaths: [
          paths.dashboard.admin.reportes.comportamientoClientes,
          paths.dashboard.admin.reportes.pacientesCronicos,
        ],
        children: [
          { title: 'Comportamiento', path: paths.dashboard.admin.reportes.comportamientoClientes, icon: ICONS.customers },
          { title: 'Pacientes crónicos', path: paths.dashboard.admin.reportes.pacientesCronicos, icon: ICONS.prescriptions },
        ],
      },
      {
        title: 'Finanzas',
        path: paths.dashboard.admin.reportes.flujoCaja,
        icon: ICONS.prices,
        allowedPermissions: ['reports.view'],
        deepMatch: false,
        extraMatchPaths: [paths.dashboard.admin.reportes.flujoCaja],
        children: [
          { title: 'Flujo de caja', path: paths.dashboard.admin.reportes.flujoCaja, icon: ICONS.cashSessions },
        ],
      },
    ],
  },
  {
    subheader: 'Obligaciones fiscales',
    items: [
      {
        title: 'Libros de IVA',
        path: paths.dashboard.admin.librosIva,
        icon: ICONS.librosIva,
        allowedPermissions: ['compliance.view'],
      },
      {
        title: 'Percepción IGTF',
        path: paths.dashboard.admin.igtf,
        icon: ICONS.igtf,
        allowedPermissions: ['compliance.view'],
      },
      {
        title: 'Retenciones de IVA',
        path: paths.dashboard.admin.retencionesIva,
        icon: ICONS.igtf,
        allowedPermissions: ['compliance.view'],
      },
      {
        title: 'Reporte Z',
        path: paths.dashboard.admin.reporteZ,
        icon: ICONS.librosIva,
        allowedPermissions: ['compliance.view'],
      },
      {
        title: 'Libro de Inventario',
        path: paths.dashboard.admin.libroInventario,
        icon: ICONS.inventarioLibro,
        allowedPermissions: ['compliance.view'],
      },
      {
        title: 'Controlados (SACS)',
        path: paths.dashboard.admin.controlados,
        icon: ICONS.controlados,
        allowedPermissions: ['compliance.view'],
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
        allowedPermissions: ['admin.config'],
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
            title: 'Almacenes',
            path: paths.dashboard.organization.warehouses.root,
            icon: ICONS.warehouses,
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
        allowedPermissions: ['admin.users'],
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
      {
        title: 'Auditoría',
        path: paths.dashboard.admin.auditLog,
        icon: ICONS.audit,
      },
    ],
  },
];
