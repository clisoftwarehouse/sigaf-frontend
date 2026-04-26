// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

const catalog = `${ROOTS.DASHBOARD}/catalog`;
const inventory = `${ROOTS.DASHBOARD}/inventory`;
const purchases = `${ROOTS.DASHBOARD}/purchases`;
const claims = `${ROOTS.DASHBOARD}/claims`;
const consignments = `${ROOTS.DASHBOARD}/consignments`;
const org = `${ROOTS.DASHBOARD}/organization`;
const admin = `${ROOTS.DASHBOARD}/admin`;

const crud = (base: string) => ({
  root: base,
  new: `${base}/new`,
  edit: (id: string) => `${base}/${id}/edit`,
  detail: (id: string) => `${base}/${id}`,
});

export const paths = {
  // AUTH
  auth: {
    signIn: `${ROOTS.AUTH}/jwt/sign-in`,
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    catalog: {
      root: catalog,
      products: crud(`${catalog}/products`),
      brands: crud(`${catalog}/brands`),
      categories: crud(`${catalog}/categories`),
      activeIngredients: crud(`${catalog}/active-ingredients`),
      suppliers: crud(`${catalog}/suppliers`),
      prices: `${catalog}/prices`,
      promotions: `${catalog}/promotions`,
    },
    inventory: {
      root: inventory,
      stock: `${inventory}/stock`,
      lots: crud(`${inventory}/lots`),
      productDetail: (id: string) => `${inventory}/products/${id}`,
      kardex: `${inventory}/kardex`,
      counts: {
        root: `${inventory}/counts`,
        new: `${inventory}/counts/new`,
        detail: (id: string) => `${inventory}/counts/${id}`,
      },
      cyclicSchedules: `${inventory}/cyclic-schedules`,
    },
    purchases: {
      root: purchases,
      orders: crud(`${purchases}/orders`),
      receipts: crud(`${purchases}/receipts`),
    },
    claims: {
      root: claims,
      new: `${claims}/new`,
      detail: (id: string) => `${claims}/${id}`,
      print: (id: string) => `${claims}/${id}/print`,
    },
    consignments: {
      root: consignments,
      entries: crud(`${consignments}/entries`),
      returns: crud(`${consignments}/returns`),
      liquidations: crud(`${consignments}/liquidations`),
    },
    organization: {
      root: org,
      branches: crud(`${org}/branches`),
      terminals: crud(`${org}/terminals`),
      locations: crud(`${org}/locations`),
    },
    admin: {
      root: admin,
      users: crud(`${admin}/users`),
      roles: crud(`${admin}/roles`),
      permissions: `${admin}/permissions`,
      config: `${admin}/config`,
      exchangeRates: `${admin}/exchange-rates`,
      auditLog: `${admin}/audit-log`,
      imports: `${admin}/imports`,
    },
  },
};
