import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from '@/app/global-config';
import {
  JWT_STORAGE_KEY,
  JWT_EXPIRES_AT_KEY,
  JWT_REFRESH_STORAGE_KEY,
} from '@/features/auth/ui/context/jwt/constant';

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

// Backend devuelve códigos cortos en `errors.<campo>` para casos sensibles (auth).
// Aquí los traducimos a mensajes legibles. Para validaciones de DTO el backend ya
// envía mensajes en español; los pasamos directo.
const BACKEND_ERROR_CODES: Record<string, string> = {
  invalidCredentials: 'Credenciales inválidas',
  userInactive: 'Usuario inactivo. Contacta al administrador.',
};

// Mensajes default de NestJS que no son útiles al usuario.
const NESTJS_DEFAULT_MESSAGES = new Set([
  'Unauthorized',
  'Unauthorized Exception',
  'Forbidden',
  'Forbidden resource',
  'Bad Request',
  'Unprocessable Entity',
  'Internal Server Error',
  'Internal server error',
]);

const STATUS_FALLBACK: Record<number, string> = {
  400: 'Solicitud inválida',
  401: 'Credenciales inválidas',
  403: 'No tienes permiso para realizar esta acción',
  404: 'Recurso no encontrado',
  409: 'Operación rechazada por conflicto',
  422: 'Hay datos inválidos en el formulario',
  500: 'Error del servidor. Intenta de nuevo más tarde.',
  503: 'Servicio no disponible temporalmente',
};

function extractFriendlyMessage(data: unknown, status?: number): string {
  const payload = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const errorsField = payload.errors;

  if (errorsField && typeof errorsField === 'object' && !Array.isArray(errorsField)) {
    const values = Object.values(errorsField as Record<string, unknown>).filter(
      (v): v is string => typeof v === 'string'
    );
    const translated = values.map((v) => BACKEND_ERROR_CODES[v] ?? v);
    if (translated.length === 1) return translated[0];
    if (translated.length > 1) return translated.join(' • ');
  }

  const message = payload.message;
  if (typeof message === 'string' && message.length > 0 && !NESTJS_DEFAULT_MESSAGES.has(message)) {
    return message;
  }

  return (status && STATUS_FALLBACK[status]) || 'Algo salió mal';
}

// ─── JWT auto-refresh ────────────────────────────────────────────────────
//
// Cuando una request retorna 401 y existe un refresh token válido, intentamos
// renovar el access token vía /auth/refresh y reintentamos la request original
// con el nuevo token de manera transparente para el usuario.
//
// Una sola refresh promise activa a la vez para que múltiples requests fallidas
// concurrentemente compartan el mismo intento (no causar tormenta de refreshes).

let refreshPromise: Promise<string> | null = null;

const REFRESH_URL = '/v1/auth/refresh';
const LOGIN_URL = '/v1/auth/email/login';

function clearSession(): void {
  sessionStorage.removeItem(JWT_STORAGE_KEY);
  sessionStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
  sessionStorage.removeItem(JWT_EXPIRES_AT_KEY);
  delete axiosInstance.defaults.headers.common.Authorization;
}

async function performRefresh(): Promise<string> {
  const refreshToken = sessionStorage.getItem(JWT_REFRESH_STORAGE_KEY);
  if (!refreshToken) throw new Error('Sin refresh token');

  // Llamada con axios crudo (no la instancia) para evitar entrar al interceptor.
  const res = await axios.post<{ token: string; refreshToken?: string; tokenExpires?: number }>(
    `${CONFIG.apiUrl}${REFRESH_URL}`,
    {},
    { headers: { Authorization: `Bearer ${refreshToken}` } }
  );

  const { token, refreshToken: newRefresh, tokenExpires } = res.data;
  if (!token) throw new Error('Refresh sin token');

  sessionStorage.setItem(JWT_STORAGE_KEY, token);
  if (newRefresh) sessionStorage.setItem(JWT_REFRESH_STORAGE_KEY, newRefresh);
  if (tokenExpires) sessionStorage.setItem(JWT_EXPIRES_AT_KEY, String(tokenExpires));
  axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
  return token;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status as number | undefined;
    const originalRequest = error?.config as RetriableConfig | undefined;
    const url = originalRequest?.url ?? '';

    // Solo intentamos auto-refresh si es 401 sobre una request normal,
    // tenemos refresh token y no es ya un retry ni un endpoint de auth.
    const isAuthEndpoint = url.endsWith(REFRESH_URL) || url.endsWith(LOGIN_URL);
    const hasRefresh = !!sessionStorage.getItem(JWT_REFRESH_STORAGE_KEY);

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint &&
      hasRefresh
    ) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return await axiosInstance(originalRequest);
      } catch {
        // Refresh falló: limpiamos sesión y caemos al manejo normal del 401.
        clearSession();
      }
    }

    if (status === 401) {
      clearSession();
    }

    const friendly = extractFriendlyMessage(error?.response?.data, status);
    return Promise.reject(new Error(friendly));
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
