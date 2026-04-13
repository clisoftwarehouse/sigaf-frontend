# SIGEF Frontend — Contexto para Claude Code

## Qué es SIGEF

ERP/POS offline-first para farmacias en Venezuela. Este contexto cubre el **frontend cloud** (admin web). El POS local (Electron) se construye después.

## Stack

- **Framework:** React (incluido en plantilla UI paga)
- **Plantilla UI:** Plantilla paga de admin dashboard (ya adquirida — provee todos los componentes base)
- **HTTP Client:** Axios con interceptors JWT
- **Routing:** React Router v6
- **State Management:** según plantilla (Context API, Zustand, o Redux)
- **API Backend:** NestJS en `http://localhost:3000` (proxy configurado en dev)

## Lo que provee la plantilla (NO construir desde cero)

La plantilla ya incluye estos componentes listos para usar:
- Layout admin: sidebar colapsable + topbar + content area
- Tabla paginada, sortable, filtrable
- Formularios con validación
- Modales (genéricos, de confirmación)
- Toasts / notificaciones
- Badges y pills con colores
- Tabs
- Tree view (para categorías jerárquicas)
- Stepper / wizard (para recepción de mercancía)
- Charts (donut, line, bar — para dashboard)
- KPI cards
- Upload con drag & drop
- Date picker, date range picker
- Select con búsqueda (autocomplete)
- Iconos

**Tu trabajo es COMPONER páginas usando estos componentes, no crearlos.**

## Estructura del Proyecto

```
apps/web/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/
│   │   ├── index.tsx                    # Definición de todas las rutas
│   │   └── guards/
│   │       └── AuthGuard.tsx            # Protección por autenticación + RBAC
│   ├── services/
│   │   ├── api.ts                       # Instancia Axios con interceptors
│   │   ├── auth.service.ts
│   │   ├── products.service.ts
│   │   ├── inventory.service.ts
│   │   ├── suppliers.service.ts
│   │   ├── purchases.service.ts
│   │   ├── inventory-counts.service.ts
│   │   └── audit.service.ts
│   ├── store/                           # Estado global
│   │   ├── auth.store.ts
│   │   └── config.store.ts
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── products/
│   │   │   ├── ProductListPage.tsx
│   │   │   ├── ProductFormPage.tsx
│   │   │   └── ProductDetailPage.tsx
│   │   ├── categories/
│   │   │   └── CategoriesPage.tsx
│   │   ├── brands/
│   │   │   └── BrandsPage.tsx
│   │   ├── active-ingredients/
│   │   │   └── ActiveIngredientsPage.tsx
│   │   ├── suppliers/
│   │   │   ├── SupplierListPage.tsx
│   │   │   └── SupplierDetailPage.tsx
│   │   ├── locations/
│   │   │   └── LocationsPage.tsx
│   │   ├── inventory/
│   │   │   ├── InventoryDashboardPage.tsx
│   │   │   ├── LotsListPage.tsx
│   │   │   ├── ExpiryAlertsPage.tsx
│   │   │   └── KardexPage.tsx
│   │   ├── purchases/
│   │   │   ├── PurchaseOrderListPage.tsx
│   │   │   ├── PurchaseOrderFormPage.tsx
│   │   │   └── GoodsReceiptWizardPage.tsx
│   │   ├── inventory-counts/
│   │   │   ├── CountListPage.tsx
│   │   │   ├── CountDetailPage.tsx
│   │   │   └── CyclicSchedulesPage.tsx
│   │   ├── audit/
│   │   │   └── AuditLogPage.tsx
│   │   └── config/
│   │       └── ConfigPage.tsx
│   ├── components/                      # Componentes compartidos específicos de SIGEF
│   │   ├── ProductSearchBar.tsx         # Buscador doble (nombre + principio activo)
│   │   ├── FefoSemaphore.tsx            # Badge de semáforo FEFO
│   │   ├── ImportWizard.tsx             # Wizard de importación CSV/Excel
│   │   └── AdjustmentModal.tsx          # Modal de ajuste de inventario
│   └── types/
│       ├── product.types.ts
│       ├── inventory.types.ts
│       ├── supplier.types.ts
│       └── common.types.ts
```

## Service Layer (Axios)

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // proxy a localhost:3000 en dev
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: attach JWT
api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: auto-refresh en 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const { access_token } = await authService.refresh();
        error.config.headers.Authorization = `Bearer ${access_token}`;
        return api(error.config);
      } catch {
        authStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

```typescript
// services/products.service.ts — ejemplo de service
import api from './api';

export const productsService = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  search: (q: string, type?: string) => api.get('/products/search', { params: { q, type } }),
  getSubstitutes: (id: string) => api.get(`/products/${id}/substitutes`),
  addIngredient: (id: string, data: any) => api.post(`/products/${id}/ingredients`, data),
  removeIngredient: (id: string, ingredientId: string) => api.delete(`/products/${id}/ingredients/${ingredientId}`),
  importPreview: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('mode', 'preview');
    return api.post('/products/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  importConfirm: (mapping: any, fileId: string) => api.post('/products/import', { mode: 'confirm', mapping, file_id: fileId }),
};
```

## Types

```typescript
// types/common.types.ts
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

// types/product.types.ts
export interface Product {
  id: string;
  ean: string | null;
  internalCode: string | null;
  description: string;
  shortName: string | null;
  categoryId: string;
  category?: { id: string; name: string };
  brandId: string | null;
  brand?: { id: string; name: string };
  productType: 'pharmaceutical' | 'controlled' | 'otc' | 'grocery' | 'miscellaneous' | 'weighable';
  isControlled: boolean;
  isAntibiotic: boolean;
  requiresRecipe: boolean;
  isWeighable: boolean;
  unitOfMeasure: 'UND' | 'KG' | 'G' | 'L' | 'ML';
  decimalPlaces: number;
  presentation: string | null;
  taxType: 'exempt' | 'general' | 'reduced';
  pmvp: number | null;
  conservationType: 'ambient' | 'cold_chain' | 'frozen';
  stockMin: number;
  stockMax: number | null;
  reorderPoint: number | null;
  leadTimeDays: number;
  isActive: boolean;
  inventoryBlocked: boolean;
  totalStock?: number; // calculado, viene del backend en listados
  createdAt: string;
  updatedAt: string;
}

export interface ActiveIngredientAssignment {
  id: string;
  name: string;
  concentration: string;
  isPrimary: boolean;
}

export interface ProductSubstitute {
  id: string;
  description: string;
  ean: string;
  brandName: string;
  totalStock: number;
  salePrice: number;
}

// types/inventory.types.ts
export type ExpirySignal = 'GREEN' | 'ORANGE' | 'YELLOW' | 'RED' | 'EXPIRED';
export type LotStatus = 'available' | 'quarantine' | 'expired' | 'returned' | 'depleted';
export type AcquisitionType = 'purchase' | 'consignment';

export interface InventoryLot {
  id: string;
  productId: string;
  productDescription?: string;
  branchId: string;
  lotNumber: string;
  expirationDate: string;
  acquisitionType: AcquisitionType;
  supplierName?: string;
  costUsd: number;
  salePrice: number;
  quantityAvailable: number;
  quantitySold: number;
  quantityDamaged: number;
  locationCode?: string;
  status: LotStatus;
  expirySignal: ExpirySignal;
}

export type MovementType = 'purchase_entry' | 'consignment_entry' | 'sale' | 'sale_return' |
  'adjustment_in' | 'adjustment_out' | 'damage' | 'expiry_write_off' | 'consignment_return';

export interface KardexEntry {
  id: string;
  productDescription: string;
  lotNumber: string;
  movementType: MovementType;
  quantity: number;
  unitCostUsd: number;
  balanceAfter: number;
  referenceType: string;
  referenceId: string;
  userFullName: string;
  terminalCode: string;
  createdAt: string;
}

export type CountType = 'total' | 'partial' | 'cyclic';
export type CountStatus = 'draft' | 'in_progress' | 'pending_review' | 'approved' | 'cancelled';
export type DifferenceType = 'match' | 'over' | 'short';

export interface InventoryCount {
  id: string;
  countNumber: string;
  countType: CountType;
  status: CountStatus;
  scopeDescription: string;
  blocksSales: boolean;
  totalSkusExpected: number;
  totalSkusCounted: number;
  totalSkusMatched: number;
  totalSkusOver: number;
  totalSkusShort: number;
  accuracyPct: number;
  startedAt: string;
  completedAt: string;
  createdByName: string;
}

export interface InventoryCountItem {
  id: string;
  productDescription: string;
  ean: string;
  lotNumber: string;
  locationCode: string;
  expectedQuantity: number;
  countedQuantity: number | null;
  difference: number | null;
  differenceType: DifferenceType | null;
  countedExpirySgnal: ExpirySignal;
  countedByName: string;
  countedAt: string;
}

// types/supplier.types.ts
export interface Supplier {
  id: string;
  rif: string;
  businessName: string;
  tradeName: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  isDrugstore: boolean;
  paymentTermsDays: number;
  consignmentCommissionPct: number | null;
  isActive: boolean;
}

export interface SupplierProduct {
  id: string;
  productId: string;
  productDescription: string;
  supplierSku: string;
  costUsd: number;
  lastCostUsd: number;
  discountPct: number;
  isAvailable: boolean;
}
```

## Rutas

```typescript
// routes/index.tsx
const routes = [
  { path: '/login', element: <LoginPage />, public: true },

  // Dashboard
  { path: '/', element: <DashboardPage />, roles: ['*'] },

  // Productos
  { path: '/products', element: <ProductListPage />, roles: ['administrador', 'farmaceutico_regente', 'gerente_inventario', 'cajero'] },
  { path: '/products/new', element: <ProductFormPage />, roles: ['administrador', 'gerente_inventario'] },
  { path: '/products/:id', element: <ProductDetailPage />, roles: ['*'] },
  { path: '/products/:id/edit', element: <ProductFormPage />, roles: ['administrador', 'gerente_inventario'] },

  // Catálogo
  { path: '/categories', element: <CategoriesPage />, roles: ['administrador', 'gerente_inventario'] },
  { path: '/brands', element: <BrandsPage />, roles: ['administrador', 'gerente_inventario'] },
  { path: '/active-ingredients', element: <ActiveIngredientsPage />, roles: ['administrador', 'gerente_inventario'] },

  // Proveedores
  { path: '/suppliers', element: <SupplierListPage />, roles: ['administrador', 'gerente_inventario'] },
  { path: '/suppliers/:id', element: <SupplierDetailPage />, roles: ['administrador', 'gerente_inventario'] },

  // Ubicaciones
  { path: '/locations', element: <LocationsPage />, roles: ['administrador', 'gerente_inventario'] },

  // Inventario
  { path: '/inventory', element: <InventoryDashboardPage />, roles: ['administrador', 'farmaceutico_regente', 'gerente_inventario'] },
  { path: '/inventory/lots', element: <LotsListPage />, roles: ['administrador', 'farmaceutico_regente', 'gerente_inventario'] },
  { path: '/inventory/alerts', element: <ExpiryAlertsPage />, roles: ['administrador', 'farmaceutico_regente', 'gerente_inventario'] },
  { path: '/inventory/kardex', element: <KardexPage />, roles: ['administrador', 'farmaceutico_regente', 'gerente_inventario'] },

  // Compras
  { path: '/purchases', element: <PurchaseOrderListPage />, roles: ['administrador', 'gerente_inventario'] },
  { path: '/purchases/new', element: <PurchaseOrderFormPage />, roles: ['administrador', 'gerente_inventario'] },
  { path: '/purchases/:id/edit', element: <PurchaseOrderFormPage />, roles: ['administrador', 'gerente_inventario'] },
  { path: '/purchases/receive', element: <GoodsReceiptWizardPage />, roles: ['administrador', 'gerente_inventario'] },
  { path: '/purchases/receive/:orderId', element: <GoodsReceiptWizardPage />, roles: ['administrador', 'gerente_inventario'] },

  // Toma de Inventario
  { path: '/inventory-counts', element: <CountListPage />, roles: ['administrador', 'gerente_inventario'] },
  { path: '/inventory-counts/:id', element: <CountDetailPage />, roles: ['administrador', 'gerente_inventario'] },
  { path: '/inventory-counts/schedules', element: <CyclicSchedulesPage />, roles: ['administrador', 'gerente_inventario'] },

  // Auditoría
  { path: '/audit', element: <AuditLogPage />, roles: ['administrador'] },

  // Configuración
  { path: '/config', element: <ConfigPage />, roles: ['administrador'] },
];
```

## Sidebar del Admin

```
Dashboard                    → /
Productos                    → /products
  ├── Categorías             → /categories
  ├── Marcas                 → /brands
  └── Principios Activos     → /active-ingredients
Inventario                   → /inventory
  ├── Lotes                  → /inventory/lots
  ├── Alertas Vencimiento    → /inventory/alerts
  ├── Kardex                 → /inventory/kardex
  └── Toma de Inventario     → /inventory-counts
Compras                      → /purchases
  └── Recepción              → /purchases/receive
Proveedores                  → /suppliers
Ubicaciones                  → /locations
Auditoría                    → /audit
Configuración                → /config
```

---

## PANTALLAS — Especificación Completa

Cada pantalla detalla: qué componentes de la plantilla usar, qué datos mostrar, qué endpoints conectar, y el comportamiento funcional.

---

### LoginPage

- Formulario: username (text) + password (password) + botón 'Ingresar'
- POST /api/auth/login → guardar tokens en store → redirect a /
- Error: toast 'Credenciales inválidas'

---

### ProductListPage

- **Tabla paginada** (componente de plantilla) con columnas:
  - EAN, Descripción, Categoría, Marca, Tipo (badge color), Precio, Stock Total, Estado (badge), Acciones
- **Badges de tipo:** controlado=rojo, antibiótico=naranja, pesable=azul, farmacéutico=verde, general=gris
- **Badges de stock:** normal=verde (#28a745), bajo=amarillo (#ffc107), agotado=rojo (#dc3545)
- **Filtros superiores:** input búsqueda, select categoría, select marca, select tipo producto, select estado stock, switch activo/inactivo
- **Botones:** 'Nuevo Producto' → /products/new, 'Importar' → abre ImportWizard modal
- **Acciones por fila:** ver detalle, editar, eliminar (confirmar)
- **Endpoint:** GET /api/products

---

### ProductFormPage

- **Formulario con tabs** (componente tab de plantilla):
- **Tab 'Datos Base':** ean, internal_code, description (required), short_name, category_id (tree select), brand_id (select con búsqueda), presentation
- **Tab 'Clasificación':** product_type (select), is_controlled (switch, auto-on si controlled), is_antibiotic (switch), requires_recipe (switch), is_weighable (switch)
- **Tab 'Fiscal':** tax_type (select: Exento/Gravable 16%/Reducido 8%), pmvp (number)
- **Tab 'Unidades':** unit_of_measure (select), decimal_places (0 o 3). Si is_weighable=true → auto KG y 3 decimales
- **Tab 'Conservación':** conservation_type (select: Ambiente/Cadena frío/Congelado), min_temperature, max_temperature
- **Tab 'Operativa':** stock_min, stock_max, reorder_point, lead_time_days
- **Botones:** Guardar (POST o PUT), Cancelar
- **Endpoints:** POST /api/products (crear), PUT /api/products/:id (editar)

---

### ProductDetailPage

- Header: nombre del producto, EAN, tipo (badge), estado
- **Tab 'Información':** todos los datos del producto en formato lectura
- **Tab 'Principios Activos':**
  - Tabla: nombre, concentración, es principal (badge). Acciones: eliminar
  - Botón 'Agregar': modal con select de principios activos + input concentración + switch is_primary
  - POST /api/products/:id/ingredients, DELETE /api/products/:id/ingredients/:ingredientId
  - Sección inferior 'Sustitutos Disponibles': lista de productos con mismo principio activo y stock > 0
  - GET /api/products/:id/substitutes
- **Tab 'Lotes':** tabla de lotes del producto (GET /api/inventory/lots?product_id=)
- **Tab 'Kardex':** movimientos del producto (GET /api/inventory/kardex?product_id=)

---

### ProductSearchBar (componente compartido)

- Input con segmented control: 'Por Nombre' | 'Por Principio Activo'
- Debounce 300ms → GET /api/products/search?q=&type=
- Dropdown resultados: nombre, EAN, marca, stock, badge tipo
- Si stock 0: badge 'Agotado' + enlace 'Ver sustitutos'
- Reutilizable en listado de productos y futuro POS

---

### CategoriesPage

- **Tree view** (componente plantilla) mostrando jerarquía padre-hijo
- Acciones por nodo: crear subcategoría, editar, eliminar
- Modal crear/editar: nombre, código, parent_id (dropdown), is_pharmaceutical (switch)
- GET/POST/PUT/DELETE /api/categories

---

### BrandsPage

- Tabla paginada: Nombre, Es Laboratorio (badge), Acciones
- Modal crear/editar: nombre, is_laboratory (switch)
- GET/POST/PUT/DELETE /api/brands

---

### ActiveIngredientsPage

- Tabla paginada: Nombre, Grupo Terapéutico, Acciones
- Modal crear/editar: nombre, therapeutic_group
- GET/POST/PUT/DELETE /api/active-ingredients

---

### SupplierListPage

- Tabla: Razón Social, Nombre Comercial, RIF, Droguería (badge), Términos Pago, Comisión%, Acciones
- Filtros: búsqueda texto, switch 'Solo droguerías'
- Formulario (modal o página): todos los campos del proveedor
- GET/POST/PUT/DELETE /api/suppliers

---

### SupplierDetailPage

- Header: datos del proveedor
- Tab 'Catálogo de Productos': tabla de sus productos con precios
  - Botón 'Agregar Producto': modal con select buscable + precio
  - Edición inline o modal de costo/descuento/disponibilidad
  - GET/POST/PUT /api/suppliers/:id/products

---

### LocationsPage

- Vista grilla/tabla agrupada por Pasillo → Estante → Tramo
- Badge cuarentena (rojo). Filtros: sucursal, switch 'Solo cuarentena'
- Modal crear: branch_id, aisle, shelf, section, capacity, location_code, is_quarantine
- GET/POST/PUT /api/locations

---

### InventoryDashboardPage

- **KPI Cards:**
  - Stock Total (unidades)
  - Valor del Inventario (USD)
  - Alertas FEFO (count RED+YELLOW — color rojo si > 0)
  - Productos Agotados (color naranja si > 0)
  - En Cuarentena
  - Precisión Promedio Inventario (% de últimas tomas)
- **Gráfico donut:** distribución por señal FEFO (GREEN/ORANGE/YELLOW/RED/EXPIRED)
- **Gráfico línea:** tendencia de precisión de inventario en el tiempo
- **Tabla inferior:** top 10 lotes próximos a vencer
- Datos: GET /api/inventory/stock + GET /api/inventory/lots?expiry_signal=RED,YELLOW&limit=10 + GET /api/inventory-counts/accuracy

---

### LotsListPage

- Filtros: select producto, select sucursal, select estado, select señal FEFO
- Tabla paginada: Producto, Lote, Vencimiento, Señal (badge con color), Tipo (Compra/Consignación), Stock, Precio, Ubicación, Estado, Acciones
- **Colores señal FEFO:** GREEN=#28a745, ORANGE=#fd7e14, YELLOW=#ffc107, RED=#dc3545, EXPIRED=#6c757d
- Acciones: editar precio, toggle cuarentena (modal con razón obligatoria), ver Kardex
- GET /api/inventory/lots, PUT /api/inventory/lots/:id/quarantine

---

### ExpiryAlertsPage

- Tabs/segmented: TODOS | RED (<=30d) | YELLOW (<=60d) | ORANGE (<=90d) | EXPIRED
- Tabla: Producto, Lote, Vencimiento, Días restantes (número con color), Stock, Ubicación, Acciones
- Acciones: ver producto, cuarentena, ajustar stock. Si consignación: 'Marcar devolución'
- GET /api/inventory/lots?expiry_signal=RED,YELLOW,ORANGE,EXPIRED

---

### KardexPage

- Filtros: producto (select obligatorio), sucursal, lote, tipo movimiento (multi-select), rango fechas
- Tabla cronológica DESC: Fecha, Tipo (badge color), Lote, Cantidad (+verde/-rojo), Costo Unit., Balance, Referencia, Usuario, Terminal
- **Colores tipo:** purchase_entry=verde, sale=rojo, adjustment_in=azul, adjustment_out=naranja, damage=rojo oscuro, expiry_write_off=gris
- **Solo lectura.** Mostrar nota: 'El Kardex es inmutable.'
- GET /api/inventory/kardex

---

### AdjustmentModal (componente compartido)

- Se abre desde: listado lotes, alertas, menú inventario
- Campos: producto (select), lote (select filtrado FEFO), tipo ajuste (select: Daño/Corrección/Merma vencimiento/Otro), cantidad (+/- toggle + number), razón (textarea, obligatorio min 10 chars)
- Preview: stock actual → stock resultante
- Error si stock resultante < 0
- POST /api/inventory/adjustments
- Toast éxito: 'Ajuste registrado. Kardex actualizado.'

---

### PurchaseOrderListPage

- Tabla: Nro OC, Proveedor, Fecha, Tipo (badge), Estado (badge color), Total USD, Acciones
- **Estados:** draft=gris, sent=azul, partial=amarillo, received=verde, cancelled=rojo
- Acciones: ver, editar (solo draft), recibir mercancía
- Botón 'Nueva OC'
- GET /api/purchase-orders

---

### PurchaseOrderFormPage

- Superior: branch_id, supplier_id (al seleccionar carga catálogo), order_type (radio: Compra/Consignación), expected_date, notes
- Tabla ítems editable: Botón 'Agregar Producto' → select buscable (filtra por catálogo proveedor). Auto-fill costo del catálogo. Columnas: Producto, Cantidad, Costo Unit., Descuento%, Subtotal (auto), Eliminar
- Pie: Total OC. Botones: Guardar Borrador | Enviar | Cancelar
- POST/PUT /api/purchase-orders

---

### GoodsReceiptWizardPage

- **Stepper 3 pasos** (componente plantilla):
- **Paso 1 'Origen':** Select OC existente (opcional) O manual. Proveedor (auto si OC), tipo, nro factura
- **Paso 2 'Ítems':** Por cada producto: Producto (pre-filled si OC), Lote (text), Vencimiento (date, obligatorio), Cantidad, Costo USD, Precio Venta, Ubicación (select). Botón 'Agregar línea'. Si OC: mostrar pedido vs recibido
- **Paso 3 'Confirmar':** Tabla resumen. 'Se crearán N lotes.' Botón confirmar
- POST /api/goods-receipts
- Toast: 'Recepción registrada. N lotes creados.'

---

### ImportWizard (componente compartido)

Para importación de productos y facturas.
- Paso 1: drag & drop archivo CSV/Excel
- Paso 2: preview primeras 10 filas + mapeo de columnas (dropdown por campo SIGEF)
- Paso 3: confirmar importación + resultado (importados/errores)

---

### CountListPage (Toma de Inventario)

- Tabla: Nro Conteo, Tipo (badge: Total=azul, Parcial=naranja, Cíclico=púrpura), Estado (badge), Alcance, Bloquea Ventas (badge), SKUs Esperados, SKUs Contados, Precisión%, Fecha, Acciones
- Acciones según estado: Iniciar (draft), Completar (in_progress), Aprobar (pending_review), Cancelar
- Botón 'Nueva Toma' → wizard modal
- GET /api/inventory-counts

---

### CountDetailPage (Detalle + Captura de Conteo)

- Header: número, tipo, estado, alcance, barra de progreso (N contados de M)
- **Tabla ítems:** Producto, EAN, Lote, Ubicación, Esperado, Conteo (input number editable — al escribir y Enter: PUT auto), Diferencia (auto, color verde=0/rojo=negativo/azul=positivo), Señal FEFO, Contado Por, Fecha
- Filtros tabla: solo pendientes, solo discrepancias, todos
- **Botones:** Iniciar Toma (si draft), Completar (si in_progress y todo contado)
- **Panel Aprobación** (si pending_review):
  - Cards resumen: Coincidentes, Sobrantes, Faltantes, Precisión%
  - Tabla solo discrepancias: Producto, Lote, Esperado, Contado, Diferencia, Tipo Adquisición (badge Consignación=púrpura)
  - Valor variación en USD
  - Switch 'Aplicar ajustes automáticos'
  - Campo notas del aprobador
  - Botón 'Aprobar Toma'
- PUT /api/inventory-counts/:id/start, /items/:itemId, /complete, /approve

---

### CyclicSchedulesPage

- Tabla: Nombre, Clases ABC, Riesgo, Frecuencia (días), Max SKUs, Auto-generar (badge), Próxima generación, Acciones
- Modal crear/editar: nombre, multi-select ABC (A/B/C/D), multi-select riesgo (normal/sensible/crítico), frecuencia, max SKUs, switch auto-generar
- GET/POST/PUT /api/inventory-counts/cyclic-schedules

---

### AuditLogPage

- Tabla paginada con filtros: tabla (dropdown), acción (INSERT/UPDATE/DELETE), usuario, rango fechas
- Columnas: Fecha, Tabla, Acción (badge: INSERT=verde, UPDATE=amarillo, DELETE=rojo), Registro, Usuario, Justificación
- Expandir fila: old_values vs new_values en formato JSON formateado (diff view)
- GET /api/audit-log

---

### ConfigPage

- Formulario con campos key-value de configuración global
- Campos principales: bcv_rate_usd, iva_general_pct, iva_reduced_pct, igtf_pct, fefo_alert_days_red/yellow/orange
- Botón guardar: PUT /api/config
- Solo accesible por administrador

---

## Convenciones de Color

| Concepto | Color | Hex |
|---|---|---|
| FEFO GREEN | Verde | #28a745 |
| FEFO ORANGE | Naranja | #fd7e14 |
| FEFO YELLOW | Amarillo | #ffc107 |
| FEFO RED | Rojo | #dc3545 |
| FEFO EXPIRED | Gris | #6c757d |
| Tipo Compra | Azul | #007bff |
| Tipo Consignación | Púrpura | #6f42c1 |
| Stock Normal | Verde | #28a745 |
| Stock Bajo | Amarillo | #ffc107 |
| Stock Agotado | Rojo | #dc3545 |
| Estado Draft | Gris | #6c757d |
| Estado In Progress | Azul | #007bff |
| Estado Pending Review | Amarillo | #ffc107 |
| Estado Approved | Verde | #28a745 |
| Estado Cancelled | Rojo | #dc3545 |
| Audit INSERT | Verde | #28a745 |
| Audit UPDATE | Amarillo | #ffc107 |
| Audit DELETE | Rojo | #dc3545 |
| Kardex purchase_entry | Verde | #28a745 |
| Kardex sale | Rojo | #dc3545 |
| Kardex adjustment_in | Azul | #007bff |
| Kardex adjustment_out | Naranja | #fd7e14 |
| Kardex damage | Rojo oscuro | #721c24 |
| Kardex expiry_write_off | Gris | #6c757d |
| Producto Controlado | Rojo | #dc3545 |
| Producto Antibiótico | Naranja | #fd7e14 |
| Producto Pesable | Azul | #007bff |
| Producto Farmacéutico | Verde | #28a745 |
| Producto General | Gris | #6c757d |
