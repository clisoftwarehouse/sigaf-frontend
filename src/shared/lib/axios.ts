import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from '@/app/global-config';
import {
  JWT_STORAGE_KEY,
  JWT_EXPIRES_AT_KEY,
  SESSION_EXPIRED_EVENT,
  JWT_REFRESH_STORAGE_KEY,
  type SessionExpiredReason,
  SESSION_EXPIRED_REASON_KEY,
} from '@/features/auth/ui/context/jwt/constant';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: CONFIG.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Margen (ms) antes de la expiración del access token en el que disparamos un
// refresh proactivo. 60s da espacio para que requests en vuelo terminen con el
// token nuevo sin necesidad de manejar 401 reactivo (con el cold-start de
// Render free el reactivo puede sumar varios segundos extra al usuario).
const PROACTIVE_REFRESH_MS = 60_000;

// Inject Bearer token on each request from sessionStorage so the header
// survives full page reloads (the in-memory default header is set on login).
// Además dispara refresh PROACTIVO si el access token está por expirar.
axiosInstance.interceptors.request.use(async (config) => {
  const url = (config.url ?? '');
  const isAuthEndpoint = url.endsWith('/v1/auth/refresh') || url.endsWith('/v1/auth/email/login');

  // No interferir con los propios endpoints de auth (evita recursión).
  if (!isAuthEndpoint) {
    const token = sessionStorage.getItem(JWT_STORAGE_KEY);
    const expiresAtStr = sessionStorage.getItem(JWT_EXPIRES_AT_KEY);
    const refreshAvailable = !!sessionStorage.getItem(JWT_REFRESH_STORAGE_KEY);
    const expiresAt = expiresAtStr ? Number(expiresAtStr) : null;
    const isExpiringSoon =
      token && expiresAt && Number.isFinite(expiresAt)
        ? expiresAt - Date.now() < PROACTIVE_REFRESH_MS
        : false;

    if (isExpiringSoon && refreshAvailable) {
      try {
        if (!refreshPromise) {
          refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
      } catch {
        // Si el refresh falla aquí, dejamos que la request salga con el token
        // viejo: el interceptor de respuesta manejará el 401 si llega.
      }
    }
  }

  const token = sessionStorage.getItem(JWT_STORAGE_KEY);
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Backend devuelve códigos cortos en `errors.<campo>` para casos sensibles (auth,
// users, files). Aquí los traducimos a mensajes legibles. Para validaciones de
// DTO el backend ya envía mensajes en español; los pasamos directo.
const BACKEND_ERROR_CODES: Record<string, string> = {
  invalidCredentials: 'Credenciales inválidas',
  userInactive: 'Usuario inactivo. Contacta al administrador.',
  userNotFound: 'Usuario no encontrado',
  notFound: 'No encontrado',
  incorrectOldPassword: 'La contraseña actual es incorrecta',
  missingOldPassword: 'Debes ingresar tu contraseña actual para cambiarla',
  emailAlreadyExists: 'Ya existe un usuario con ese email',
  usernameAlreadyExists: 'Ya existe un usuario con ese nombre',
  wrongToken: 'Token de autenticación inválido',
  selectFile: 'Debes seleccionar un archivo',
  cantUploadFileType: 'Tipo de archivo no permitido',
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
  'Not Found',
  'notFound',
  // Header genérico del exception factory del backend cuando hay errors detallados.
  'Error de validación',
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

/**
 * Mapeo de nombres de campos del backend (camelCase) → etiqueta legible en
 * español. Usado al traducir mensajes de class-validator que vienen como
 * "fieldName must be ...". Si un campo no está mapeado, se muestra tal cual.
 */
const FIELD_LABEL_ES: Record<string, string> = {
  // Comunes
  name: 'nombre',
  fullName: 'nombre completo',
  shortName: 'nombre corto',
  description: 'descripción',
  email: 'correo',
  phone: 'teléfono',
  password: 'contraseña',
  username: 'usuario',
  rif: 'RIF',
  address: 'dirección',
  notes: 'notas',
  isActive: 'estado',
  // Catálogo
  barcode: 'código de barras',
  barcodeType: 'tipo de código',
  isPrimary: 'principal',
  brandId: 'marca',
  categoryId: 'categoría',
  productId: 'producto',
  productType: 'tipo de producto',
  taxType: 'tipo de IVA',
  branchId: 'sucursal',
  supplierId: 'proveedor',
  customerId: 'cliente',
  // Cantidades / precios
  quantity: 'cantidad',
  quantityReceived: 'cantidad recibida',
  invoicedQuantity: 'cantidad facturada',
  unitCostUsd: 'costo unitario',
  priceUsd: 'precio',
  amountUsd: 'monto USD',
  amountBs: 'monto Bs',
  exchangeRateUsdBs: 'tasa de cambio',
  discountPct: 'descuento',
  // Documentos / fechas
  documentType: 'tipo de documento',
  documentNumber: 'número de documento',
  effectiveFrom: 'vigencia desde',
  effectiveTo: 'vigencia hasta',
  expirationDate: 'fecha de vencimiento',
  lotNumber: 'número de lote',
  // POS
  cashSessionId: 'sesión de caja',
  terminalId: 'terminal',
  paymentMethod: 'método de pago',
  reason: 'razón',
  source: 'fuente',
  rate: 'tasa',
};

function humanizeFieldName(name: string): string {
  if (FIELD_LABEL_ES[name]) return FIELD_LABEL_ES[name];
  // camelCase → "camel case" como fallback, sólo si no contiene índices/dots.
  return name.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
}

/**
 * Traduce un mensaje de `class-validator` (sin prefijo de campo, ej.
 * "must be a UUID") al español. El nombre del campo lo añade `flattenErrors`
 * con `humanizeFieldName(path)`, no aquí.
 *
 * Si el mensaje no es un patrón conocido o ya está en español, lo retorna
 * sin tocar.
 */
function translateValidatorMessage(raw: string): string {
  // Soporte: a veces el mensaje sí incluye el campo al inicio si el dev escribió
  // un message custom. Si detectamos prefijo "fieldName ...", lo desnudamos.
  const stripped = raw.replace(/^(?:[a-zA-Z][\w.[\]]*)\s+(?=must |should |has to )/i, '');

  const patterns: Array<[RegExp, (g: RegExpMatchArray) => string]> = [
    [/^should not be empty$/i, () => `es obligatorio`],
    [/^must be a string$/i, () => `debe ser texto`],
    [/^must be a number(?: conforming to the specified constraints)?$/i, () => `debe ser un número`],
    [/^must be a boolean(?: value)?$/i, () => `debe ser sí o no`],
    [/^must be a UUID$/i, () => `no es válido`],
    [/^must be an email$/i, () => `debe ser un correo válido`],
    [/^must be a (?:valid )?(?:ISO )?date(?: string)?$/i, () => `debe ser una fecha válida`],
    [/^must be longer than or equal to (\d+) characters?$/i, (g) => `debe tener al menos ${g[1]} caracteres`],
    [/^must be shorter than or equal to (\d+) characters?$/i, (g) => `no puede tener más de ${g[1]} caracteres`],
    [/^must not be less than (\S+)$/i, (g) => `no puede ser menor a ${g[1]}`],
    [/^must not be greater than (\S+)$/i, (g) => `no puede ser mayor a ${g[1]}`],
    [/^must be one of the following values:\s*(.+)$/i, (g) => `debe ser uno de: ${g[1]}`],
    [/^must be a positive number$/i, () => `debe ser un número positivo`],
    [/^must be an integer number$/i, () => `debe ser un número entero`],
    [/^must be an? (?:array|object)$/i, () => `tiene un formato inválido`],
    [/^each value in (.+)$/i, (g) => `cada valor: ${translateValidatorMessage(g[1])}`],
  ];

  for (const [re, build] of patterns) {
    const match = stripped.match(re);
    if (match) return build(match);
  }
  return raw;
}

/**
 * Recorre recursivamente la estructura `errors` de NestJS (que puede estar
 * anidada para arrays/DTOs nested, ej. `{items: {0: {quantity: "..."}}}`) y
 * devuelve la lista de mensajes hoja como "campo legible: mensaje traducido".
 */
function flattenErrors(input: unknown, path = ''): string[] {
  if (input == null) return [];
  if (typeof input === 'string') {
    const translated = translateValidatorMessage(input);
    if (!path) return [translated];
    // Para el label usamos el último segmento del path, ignorando índices.
    const lastSegment = path.split('.').pop()!.replace(/\[\d+\]/g, '');
    const label = humanizeFieldName(lastSegment);
    // Capitalizar primera letra del campo para que se vea como "Nombre debe ser..."
    const labelCap = label.charAt(0).toUpperCase() + label.slice(1);
    return [`${labelCap} ${translated}`];
  }
  if (Array.isArray(input)) {
    return input.flatMap((v, i) => flattenErrors(v, path ? `${path}[${i}]` : `[${i}]`));
  }
  if (typeof input === 'object') {
    return Object.entries(input as Record<string, unknown>).flatMap(([k, v]) => {
      const nextPath = path ? `${path}.${k}` : k;
      return flattenErrors(v, nextPath);
    });
  }
  return [];
}

function extractFriendlyMessage(data: unknown, status?: number): string {
  const payload = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const errorsField = payload.errors;

  if (errorsField && typeof errorsField === 'object') {
    const leaves = flattenErrors(errorsField);
    const translated = leaves.map((leaf) => {
      // Si la hoja es un código backend (sin path, camelCase), lo traducimos.
      const directMap = BACKEND_ERROR_CODES[leaf];
      if (directMap) return directMap;
      if (/^[a-z][a-zA-Z]+$/.test(leaf) && leaf.length < 40) {
        return (status && STATUS_FALLBACK[status]) || 'Algo salió mal';
      }
      return leaf;
    });
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

/**
 * Dispara el evento global de sesión expirada con la razón. AuthProvider lo
 * escucha para limpiar el estado y AuthGuard se encarga de redirigir al login.
 * El sign-in view lee la razón de sessionStorage para mostrar un banner.
 */
export function notifySessionExpired(reason: SessionExpiredReason): void {
  sessionStorage.setItem(SESSION_EXPIRED_REASON_KEY, reason);
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { reason } }));
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

    const isAuthEndpoint = url.endsWith(REFRESH_URL) || url.endsWith(LOGIN_URL);
    const hasRefresh = !!sessionStorage.getItem(JWT_REFRESH_STORAGE_KEY);
    const hadSession = !!sessionStorage.getItem(JWT_STORAGE_KEY);

    // 1) Auto-refresh sobre 401 cuando hay refresh token disponible.
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
        // Refresh falló: la sesión está muerta.
        clearSession();
        notifySessionExpired('token-expired');
        return Promise.reject(
          new Error('Tu sesión ha expirado. Por favor inicia sesión de nuevo.')
        );
      }
    }

    // 2) 401 sobre un endpoint normal (no /auth/login) cuando ya teníamos sesión:
    // significa que el access token caducó y no había refresh token utilizable.
    if (status === 401 && hadSession && !isAuthEndpoint) {
      clearSession();
      notifySessionExpired('token-expired');
      return Promise.reject(
        new Error('Tu sesión ha expirado. Por favor inicia sesión de nuevo.')
      );
    }

    // 3) Caso normal: error de negocio o credenciales inválidas en /auth/login.
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
    averageCost: (productId: string) => `/v1/inventory/products/${productId}/average-cost`,
  },
  purchases: {
    orders: '/v1/purchases/orders',
    orderById: (id: string) => `/v1/purchases/orders/${id}`,
    approveOrder: (id: string) => `/v1/purchases/orders/${id}/approve`,
    orderApprovalStatus: (id: string) => `/v1/purchases/orders/${id}/approval-status`,
    receipts: '/v1/purchases/receipts',
    receiptById: (id: string) => `/v1/purchases/receipts/${id}`,
    receiptUnpricedProducts: (id: string) =>
      `/v1/purchases/receipts/${id}/unpriced-products`,
    reapproveReceipt: (id: string) => `/v1/purchases/receipts/${id}/reapprove`,
  },
  branchGroups: resource('/v1/branch-groups'),
  claims: {
    root: '/v1/claims',
    byId: (id: string) => `/v1/claims/${id}`,
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
  therapeuticUses: resource('/v1/therapeutic-uses'),
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
    effective: '/v1/prices/effective',
    revaluationFactor: '/v1/prices/revaluation-factor',
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
  customers: {
    root: '/v1/customers',
    byId: (id: string) => `/v1/customers/${id}`,
    byDocument: (type: string, number: string) =>
      `/v1/customers/by-document/${type}/${encodeURIComponent(number)}`,
    restore: (id: string) => `/v1/customers/${id}/restore`,
  },
  prescriptions: {
    root: '/v1/prescriptions',
    byId: (id: string) => `/v1/prescriptions/${id}`,
    cancel: (id: string) => `/v1/prescriptions/${id}/cancel`,
  },
  cashSessions: {
    root: '/v1/cash-sessions',
    byId: (id: string) => `/v1/cash-sessions/${id}`,
    open: '/v1/cash-sessions/open',
    close: (id: string) => `/v1/cash-sessions/${id}/close`,
    current: '/v1/cash-sessions/current',
    movements: (id: string) => `/v1/cash-sessions/${id}/movements`,
    xReport: (id: string) => `/v1/cash-sessions/${id}/x-report`,
    zReport: (id: string) => `/v1/cash-sessions/${id}/z-report`,
  },
  sales: {
    tickets: '/v1/sales/tickets',
    ticketById: (id: string) => `/v1/sales/tickets/${id}`,
    ticketByNumber: (terminalId: string, n: number) =>
      `/v1/sales/tickets/by-number/${terminalId}/${n}`,
    voidTicket: (id: string) => `/v1/sales/tickets/${id}/void`,
    returns: '/v1/sales/returns',
    payments: '/v1/sales/payments',
  },
  terminalsPairing: {
    pair: '/v1/terminals/pair',
    me: '/v1/terminals/me',
    issueCode: (terminalId: string) => `/v1/terminals/${terminalId}/pairing-codes`,
    apiKeys: (terminalId: string) => `/v1/terminals/${terminalId}/api-keys`,
    revokeKey: (terminalId: string, keyId: string) =>
      `/v1/terminals/${terminalId}/api-keys/${keyId}/revoke`,
  },
  authPin: {
    setMyPin: '/v1/auth/me/pin',
    verifyPin: '/v1/auth/verify-pin',
  },
} as const;
