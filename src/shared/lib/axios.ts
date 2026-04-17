import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from '@/app/global-config';
import { JWT_STORAGE_KEY } from '@/features/auth/ui/context/jwt/constant';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: CONFIG.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject Bearer token on each request from sessionStorage so the header
// survives full page reloads (the in-memory default header is set on login).
axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(JWT_STORAGE_KEY);
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.errors ||
      error?.message ||
      'Algo salió mal';

    // Force a clean session on 401 so guards push to sign-in.
    if (error?.response?.status === 401) {
      sessionStorage.removeItem(JWT_STORAGE_KEY);
      delete axiosInstance.defaults.headers.common.Authorization;
    }

    return Promise.reject(new Error(typeof message === 'string' ? message : 'Solicitud inválida'));
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async <T = unknown>(
  args: string | [string, AxiosRequestConfig]
): Promise<T> => {
  const [url, config] = Array.isArray(args) ? args : [args, {}];
  const res = await axiosInstance.get<T>(url, config);
  return res.data;
};

// ----------------------------------------------------------------------

const resource = (base: string) => ({
  root: base,
  byId: (id: string) => `${base}/${id}`,
});

export const endpoints = {
  auth: {
    login: '/v1/auth/email/login',
    me: '/v1/auth/me',
    refresh: '/v1/auth/refresh',
    logout: '/v1/auth/logout',
  },
  products: {
    root: '/v1/products',
    byId: (id: string) => `/v1/products/${id}`,
    search: '/v1/products/search',
    barcodes: (id: string) => `/v1/products/${id}/barcodes`,
    barcodeById: (id: string, barcodeId: string) => `/v1/products/${id}/barcodes/${barcodeId}`,
    ingredients: (id: string) => `/v1/products/${id}/ingredients`,
    ingredientById: (id: string, ingredientId: string) =>
      `/v1/products/${id}/ingredients/${ingredientId}`,
    substitutes: (id: string) => `/v1/products/${id}/substitutes`,
  },
  inventory: {
    lots: '/v1/inventory/lots',
    lotById: (id: string) => `/v1/inventory/lots/${id}`,
    quarantine: (id: string) => `/v1/inventory/lots/${id}/quarantine`,
    stock: '/v1/inventory/stock',
    stockFefo: '/v1/inventory/stock-fefo',
    adjustments: '/v1/inventory/adjustments',
    kardex: '/v1/inventory/kardex',
  },
  purchases: {
    orders: '/v1/purchases/orders',
    orderById: (id: string) => `/v1/purchases/orders/${id}`,
    approveOrder: (id: string) => `/v1/purchases/orders/${id}/approve`,
    receipts: '/v1/purchases/receipts',
    receiptById: (id: string) => `/v1/purchases/receipts/${id}`,
  },
  consignments: {
    entries: '/v1/consignments/entries',
    entryById: (id: string) => `/v1/consignments/entries/${id}`,
    returns: '/v1/consignments/returns',
    liquidations: '/v1/consignments/liquidations',
    liquidationById: (id: string) => `/v1/consignments/liquidations/${id}`,
    approveLiquidation: (id: string) => `/v1/consignments/liquidations/${id}/approve`,
  },
  brands: resource('/v1/brands'),
  categories: resource('/v1/categories'),
  activeIngredients: {
    root: '/v1/active-ingredients',
    byId: (id: string) => `/v1/active-ingredients/${id}`,
    vademecumLookup: '/v1/active-ingredients/vademecum-lookup',
    vademecumDetails: '/v1/active-ingredients/vademecum-details',
    vademecumImport: '/v1/active-ingredients/vademecum-import',
  },
  suppliers: resource('/v1/suppliers'),
  branches: resource('/v1/branches'),
  terminals: resource('/v1/terminals'),
  locations: resource('/v1/locations'),
  users: resource('/v1/users'),
  roles: resource('/v1/roles'),
  permissions: { root: '/v1/permissions' },
  config: { root: '/v1/config' },
  exchangeRates: {
    root: '/v1/exchange-rates',
    latest: '/v1/exchange-rates/latest',
    fetchBcv: '/v1/exchange-rates/fetch-bcv',
    override: '/v1/exchange-rates/override',
  },
  imports: {
    run: (type: string) => `/v1/imports/${type}`,
    template: (type: string) => `/v1/imports/templates/${type}`,
  },
  prices: {
    root: '/v1/prices',
    byId: (id: string) => `/v1/prices/${id}`,
    expire: (id: string) => `/v1/prices/${id}/expire`,
    current: '/v1/prices/current',
  },
  promotions: {
    root: '/v1/promotions',
    byId: (id: string) => `/v1/promotions/${id}`,
    activate: (id: string) => `/v1/promotions/${id}/activate`,
    deactivate: (id: string) => `/v1/promotions/${id}/deactivate`,
    scopes: (id: string) => `/v1/promotions/${id}/scopes`,
    scopeById: (id: string, scopeId: string) => `/v1/promotions/${id}/scopes/${scopeId}`,
    applicable: '/v1/promotions/applicable',
  },
} as const;
