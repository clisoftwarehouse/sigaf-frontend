# SIGAF Frontend — Plan de Handoff (QA Recommendations)

> Documento de transferencia para continuar el trabajo frontend de las recomendaciones de QA si el agente original queda sin créditos. Lee todo antes de ejecutar.

---

## Contexto del proyecto

- **Stack**: React 19 + TypeScript + Vite + MUI 7 + React Router 7 + React Query v5 + React Hook Form + Zod + Sonner (toasts).
- **Plantilla base**: Minimal Kit (pagada). Ya provee layout, sidebar, DataTable, forms, toasts, etc. NO construyas componentes desde cero si la plantilla ya los tiene.
- **Backend**: NestJS en `http://localhost:3000/api` (default de `VITE_API_URL`). Prefijo `/api/v1/...`. Autenticación JWT en `sessionStorage`.
- **Estructura feature-first**:

  ```
  src/features/<feature>/
  ├── api/<feature>.api.ts       # llamadas axios
  ├── api/<feature>.queries.ts   # hooks React Query
  ├── api/<feature>.options.ts   # hook para Autocomplete options (opcional)
  ├── model/types.ts             # types + labels + constants
  ├── routes.tsx                 # RouteObject[] con lazy
  └── ui/
      ├── pages/<feature>-*-page.tsx     # wrapper con <title>
      ├── views/<feature>-*-view.tsx     # contenido real
      └── components/                    # dialogs/forms/etc.
  ```

- **Registros de una feature nueva**:
  1. Agregar endpoints a `src/shared/lib/axios.ts` (objeto `endpoints`).
  2. Agregar path a `src/app/routes/paths.ts`.
  3. Importar `<feature>Routes` en `src/app/routes/sections/dashboard.tsx` y spread dentro de la sección correspondiente.
  4. Agregar ítem de sidebar en `src/app/layouts/nav-config-dashboard.tsx` (icon + path).

---

## Convenciones críticas

### ESLint perfectionist

Los imports se ordenan **por longitud asc + alfabético**. Si el IDE muestra warnings tipo `Expected "X" to come before "Y"`, reordena hasta que pase. Ejemplo típico:

```ts
import Box from '@mui/material/Box'; // 17 chars → primero
import Stack from '@mui/material/Stack'; // 19
import DialogTitle from '@mui/material/DialogTitle'; // 25 → antes que Autocomplete (26)
import Autocomplete from '@mui/material/Autocomplete';
```

Misma regla para paths relativos: profundidad mayor (`../..`) antes que cercanos (`..`).

### Iconify (solo iconos whitelist)

Los iconos están **tipados** contra `src/app/components/iconify/icon-sets.ts`. NO uses iconos fuera de la lista. Si TS marca error `Type '"solar:..."' is not assignable`, abre ese archivo con grep y busca alternativas. Iconos que YA se sabe que existen y son útiles:

- `solar:add-circle-bold`, `solar:pen-bold`, `solar:trash-bin-trash-bold`, `solar:close-circle-bold`, `solar:check-circle-bold`, `solar:play-circle-bold`
- `solar:settings-bold-duotone`, `solar:file-text-bold`, `solar:file-check-bold-duotone`, `solar:file-bold-duotone`
- `solar:tag-horizontal-bold-duotone`, `solar:cup-star-bold`, `solar:import-bold`, `solar:export-bold`, `solar:download-bold`
- `solar:clock-circle-bold`, `solar:info-circle-bold`, `solar:wad-of-money-bold`
- `solar:confetti-minimalistic-outline`

### DataTable

`@/app/components/data-table` es un wrapper sobre `@mui/x-data-grid`. Uso típico:

```tsx
<DataTable
  columns={columns}
  rows={rows}
  loading={isLoading}
  disableRowSelectionOnClick
  autoHeight
  getRowId={(row) => row.id}
/>
```

Para filtros por FK (categoría, marca), ver `createFkFilterOperators` usado en `@/features/products/ui/views/products-list-view.tsx`.

### Forms

Hay dos patrones:

1. **react-hook-form + Zod + `@/app/components/hook-form`** (`Form`, `Field.Text`, `Field.Select`, `Field.Switch`) — usado en brands, inventory. Preferido para forms complejos.
2. **useState plano + TextField MUI directo** — usado en `imports-view.tsx`, `price-form-dialog.tsx`, `promotion-form-dialog.tsx`. Preferido para diálogos cortos con lógica condicional.

### Backend endpoints relevantes

- Todos bajo `/v1/<resource>/...`
- Respuesta típica paginada: `{ data: T[], total, page, limit }`
- DTOs ya definidos en `sigaf-backend/src/modules/<module>/dto/`. Alinear frontend a esos contratos.

---

## Estado actual del trabajo QA

### ✅ Completado (3 features nuevas)

| #   | Feature       | Ruta                            | Ubicación nav          | Componentes clave                                                                        |
| --- | ------------- | ------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| 7   | Import Wizard | `/dashboard/admin/imports`      | Admin → Importaciones  | `imports-view.tsx` (tabs + 4 pasos)                                                      |
| 8   | Prices        | `/dashboard/catalog/prices`     | Catálogo → Precios     | `prices-list-view.tsx` + `price-form-dialog.tsx` (modo fijo/margen)                      |
| 12  | Promotions    | `/dashboard/catalog/promotions` | Catálogo → Promociones | `promotions-list-view.tsx` + `promotion-form-dialog.tsx` + `promotion-scopes-dialog.tsx` |

Todas pasan `npx tsc --noEmit` exit 0.

### ⏳ Pendiente

Mapeadas a los hallazgos del QA. Implementa en el orden listado.

---

## TAREA #3 — Simplificar Marcas

**Estado backend**: Ya simplificado. `BrandEntity` solo tiene `id, name, isLaboratory, isActive, createdAt, updatedAt`. `CreateBrandDto` y `UpdateBrandDto` también.

**Estado frontend**: **Desactualizado**. `src/features/brands/model/types.ts` y `src/features/brands/ui/components/brand-form.tsx` aún tienen 16+ campos (rif, businessName, address, phone, email, countryOfOrigin, brandType, isImporter, isManufacturer, taxRegime, supplierId, parentBrandId, website, logoUrl, regulatoryCode).

**Acciones**:

1. **`src/features/brands/model/types.ts`**:
   - `Brand`: quedarse solo con `id, name, isLaboratory, isActive, createdAt, updatedAt`.
   - `CreateBrandPayload`: `{ name: string; isLaboratory?: boolean; isActive?: boolean }`.
   - Eliminar `BRAND_TYPES`, `BRAND_TYPE_LABEL`, `BRAND_TYPE_OPTIONS`, `BrandType` (no usar más).
   - `BrandFilters`: `{ search?, isLaboratory?, isActive? }` (quitar `brandType`).

2. **`src/features/brands/ui/components/brand-form.tsx`**: reescribir como form simple con:
   - `name` (required, 1-100 chars)
   - `isLaboratory` (switch)
   - `isActive` (switch)
   - Eliminar las 4 Cards; una sola Card o Stack plano.

3. **`src/features/brands/ui/views/brands-list-view.tsx`**: quitar columnas `businessName`, `brandType`, `rif`, `countryOfOrigin`, `isImporter`, `isManufacturer`. Mantener: Nombre, Laboratorio (badge), Activo, Creada, Acciones.

4. **`src/features/brands/api/brands.api.ts`**: revisar si `fetchBrands` usa filtros que ya no existen (`brandType`). Quitar.

5. **Verificar `useSupplierOptions`**: el brand-form actual lo usaba para `supplierId`. Ese campo se elimina, así que borra el import.

6. Buscar otros usos en el código: `grep -r "brandType\|businessName\|isImporter\|countryOfOrigin" src/`. Los archivos que se rompan hay que limpiarlos (probablemente solo products-list-view.tsx si mostraba columna de brandType — no, revisé y no la muestra).

**Verificación**: `npx tsc --noEmit` exit 0.

---

## TAREA #5 — Ajustes de inventario accesibles desde Stock

**Estado**: El `AdjustmentDialog` ya existe en `src/features/inventory/ui/components/adjustment-dialog.tsx` y está conectado en `lots-list-view.tsx` (ruta `/inventory/lots`). Pero la recomendación del QA es que el botón esté también en la **pestaña de inventario / stock** (ruta `/inventory/stock`, más visible).

**Acciones**:

1. Abrir `src/features/inventory/ui/views/stock-view.tsx`.
2. Analizar si las filas representan agregado por producto o por lote:
   - Si son por **lote**: agregar acción "Ajustar" que abre `AdjustmentDialog` pasando el lote.
   - Si son por **producto** (agregación): la fila no tiene `lotId`, entonces el botón debería ir a un drill-down de lotes (ver TAREA #4).
3. Si el agregado es por producto, mejor agregar un botón "Ajuste manual" en el PageHeader que abra un dialog que primero pida escoger producto + lote y luego dispare el adjustment. Alternativa más rápida: navegar a `/inventory/lots?productId=...` con filtro pre-aplicado.

**Verificación manual**: abrir el inventario, verificar que hay un camino < 3 clicks para llegar al formulario de ajuste.

---

## TAREA #6 — UI para tasa BCV con override manual

**Estado backend**: Hay scraper BCV + endpoints `POST /exchange-rates/fetch-bcv` (forzar scrape) y `POST /exchange-rates/override` (manual). Campo `isOverridden` en la entity.

**Estado frontend**: `src/features/exchange-rates/ui/views/exchange-rates-view.tsx` ya tiene Card de tasa más reciente + form manual + tabla historial. Pero **falta**:

1. Botón "Actualizar desde BCV" que dispare `POST /v1/exchange-rates/fetch-bcv`.
2. Columna o badge `Fuente: Automática / Manual (override)` en la tabla usando `isOverridden`.
3. Cambiar el form actual a usar `POST /exchange-rates/override` si el QA quiere distinguir (o mantener como está si el endpoint `create` soporta ambos).

**Acciones**:

1. Agregar a `src/shared/lib/axios.ts`:

   ```ts
   exchangeRates: {
     root: '/v1/exchange-rates',
     latest: '/v1/exchange-rates/latest',
     fetchBcv: '/v1/exchange-rates/fetch-bcv',
     override: '/v1/exchange-rates/override',
   },
   ```

2. Agregar en `src/features/exchange-rates/api/exchange-rates.api.ts`:

   ```ts
   export async function fetchBcvRate(): Promise<ExchangeRate> { ... }
   export async function overrideRate(payload): Promise<ExchangeRate> { ... }
   ```

3. Agregar `useFetchBcvMutation` y `useOverrideRateMutation` en queries.ts.

4. En la view, agregar en PageHeader o en la Card de latest:

   ```tsx
   <Button
     variant="outlined"
     startIcon={<Iconify icon="solar:download-bold" />}
     loading={fetchMutation.isPending}
     onClick={handleFetchBcv}
   >
     Actualizar desde BCV
   </Button>
   ```

5. Agregar type `isOverridden: boolean` en `ExchangeRate` (si no existe). Agregar columna en DataTable con chip.

6. Verificar los endpoints exactos con `grep_search "Post\('override" sigaf-backend/src/modules/exchange-rates`.

**Verificación**: `npx tsc --noEmit` exit 0, probar click en "Actualizar desde BCV" contra backend corriendo.

---

## TAREA #10 — Filtros/selector de almacén (Locations) en Inventario

**Estado backend**: Ya existen `branches` + `locations` (warehouse_locations). Los lotes tienen `location_id` opcional.

**Estado frontend**: Existe `src/features/locations/` como feature independiente. Falta que las vistas de inventario permitan filtrar por location.

**Acciones**:

1. Abrir `src/features/inventory/ui/views/stock-view.tsx` y `lots-list-view.tsx`.
2. Agregar un Autocomplete de "Ubicación/Almacén" en los filtros superiores usando `useLocationOptions` (verificar si existe en `src/features/locations/api/` — si no, crear el hook).
3. Conectar al filtro `locationId` en la query de lots/stock (verificar que el backend soporta el filtro en `GET /inventory/lots?locationId=`).

**Si el backend NO soporta el filtro `locationId`**: es cambio de backend que queda fuera de alcance; documenta y deja la UI preparada sin enviar el query param.

**Verificación**: `tsc` verde y el filtro modifica la tabla.

---

## TAREA #11 — Stock enriquecido

**Estado backend**: `getStock()` en `InventoryService` debe haber sido ampliado (según mi análisis previo) para retornar: `quantityAvailable`, `quantityReserved`, `lastInventoryDate`, `lastStockQuantity`, `lastPurchaseDate`.

**Acciones**:

1. Verificar en `sigaf-backend/src/modules/inventory/inventory.service.ts` qué retorna realmente `getStock()`. Si faltan campos, documentar.
2. En `src/features/inventory/model/types.ts`, agregar a `StockItem` (o como se llame):
   ```ts
   quantityReserved?: number;
   lastInventoryDate?: string | null;
   lastStockQuantity?: number | null;
   lastPurchaseDate?: string | null;
   ```
3. En `src/features/inventory/ui/views/stock-view.tsx`, agregar columnas nuevas:
   - "Reservado" (quantityReserved)
   - "Último conteo" (formato fecha corta + cantidad en tooltip)
   - "Última compra" (fecha)
4. Por defecto las columnas nuevas pueden estar ocultas (`columnVisibilityModel`) para no abrumar.

**Verificación**: `tsc` verde.

---

## TAREA #13 — Atajo "+" en selects del form de productos

**Propósito**: Evitar que el usuario navegue a Catálogo > Categorías > Nueva solo para crear una categoría faltante mientras edita un producto.

**Acciones**:

1. Ubicar los `Field.Select` / `Autocomplete` de productos en `src/features/products/ui/components/` (form de producto). Probablemente `product-form.tsx` o similar.
2. Para cada select relevante (Categoría, Marca, Principio Activo, Uso Terapéutico), agregar un botón "+":
   - Puede ir como `endAdornment` dentro del TextField, o como IconButton a la derecha.
   - Al click → abre un Dialog mínimo con 1-2 campos (nombre + activo).
3. Crear 4 dialogs reutilizables:
   - `quick-create-category-dialog.tsx`
   - `quick-create-brand-dialog.tsx`
   - `quick-create-ingredient-dialog.tsx`
   - `quick-create-therapeutic-use-dialog.tsx` (si aplica)
4. Cada dialog:
   - Usa las mutations `useCreateCategoryMutation`, `useCreateBrandMutation`, etc.
   - Al éxito: cierra, muestra toast, y devuelve el ID al parent para pre-seleccionarlo en el Autocomplete.
5. Patrón de comunicación:
   ```tsx
   const [quickOpen, setQuickOpen] = useState<'category' | 'brand' | null>(null);
   // ...
   <Autocomplete ... endAdornment={
     <IconButton onClick={() => setQuickOpen('category')}>
       <Iconify icon="solar:add-circle-bold" />
     </IconButton>
   } />
   <QuickCreateCategoryDialog
     open={quickOpen === 'category'}
     onClose={() => setQuickOpen(null)}
     onCreated={(id) => { setFieldValue('categoryId', id); setQuickOpen(null); }}
   />
   ```

**Verificación**: tsc verde + manual: en `/catalog/products/new` al abrir el select de categoría aparece botón "+", lo clickeas, creas una categoría, queda seleccionada en el form principal.

---

## TAREA #4 — Unificar Stock y Lotes

Esta tarea está marcada como "Frontend puro" pero depende del backend. Verificar primero si `GET /inventory/stock` del backend ahora devuelve lotes anidados por producto (según mi análisis previo eso era parte de #4 en backend).

**Acciones**:

1. Abrir `sigaf-backend/src/modules/inventory/inventory.service.ts` → buscar método `getStock()`. Ver si retorna `lots: InventoryLot[]` anidado.
2. Si sí:
   - En `src/features/inventory/ui/views/stock-view.tsx`, agregar expand/drill-down por fila.
   - Al expandir, mostrar una sub-tabla (o navegación a detail) con los lotes del producto, sus movimientos kardex, y acciones (ajuste, cuarentena).
3. Evaluar si tiene sentido eliminar la entrada "Lotes" del sidebar (actualmente `/inventory/lots`) ya que su funcionalidad quedaría dentro del drill-down de Stock.
   - Recomendación: **no eliminar** la ruta /lots inmediatamente — dejar ambas vistas coexistir y marcar /lots como "Lotes (vista avanzada)".

**Verificación**: tsc verde.

---

## Flujo de trabajo recomendado para cada tarea

1. `read_file` del archivo principal a modificar.
2. `grep_search` para usos transversales del símbolo a cambiar (evita romper otras features).
3. Hacer cambios mínimos con `edit` o `multi_edit`.
4. `npx tsc --noEmit` → debe pasar.
5. Commit mental: ¿lint ok? ¿iconos válidos? ¿orden de imports ok?
6. Pasar a siguiente tarea.

---

## Apéndice — Contratos backend ya verificados

### Prices

- `GET /v1/prices?includeHistory&page&limit&productId&branchId&activeAt`
- `POST /v1/prices` body: `{ productId, branchId?, priceUsd, effectiveFrom?, notes? }`
- `PUT /v1/prices/:id` body: `{ priceUsd?, notes? }`
- `POST /v1/prices/:id/expire`
- `GET /v1/prices/current?productId&branchId?&at?`

### Promotions

- `GET /v1/promotions?type&isActive&activeAt&includeExpired&page&limit`
- `POST /v1/promotions` body: `{ name, type: 'percentage'|'fixed_amount'|'buy_x_get_y', value, buyQuantity?, getQuantity?, minQuantity?, maxUses?, priority?, stackable?, effectiveFrom, effectiveTo?, scopes? }`
- `PUT /v1/promotions/:id` (no permite cambiar `type` ni `scopes`)
- `POST /v1/promotions/:id/activate|deactivate`
- `DELETE /v1/promotions/:id`
- `POST /v1/promotions/:id/scopes` body: `{ scopeType: 'product'|'category'|'branch', scopeId }`
- `DELETE /v1/promotions/:id/scopes/:scopeId`

### Imports

- `POST /v1/imports/:type` (multipart `file`, `?dryRun=true|false`), type ∈ `products|stock-initial|prices`
- `GET /v1/imports/templates/:type` → blob XLSX

### Exchange Rates

- `GET /v1/exchange-rates?limit`
- `GET /v1/exchange-rates/latest`
- `POST /v1/exchange-rates` body: `{ currencyFrom, currencyTo, rate, source?, effectiveDate }`
- `POST /v1/exchange-rates/fetch-bcv` (forzar scrape)
- `POST /v1/exchange-rates/override` (manual — verificar signature exacta)

### Brands (simplificado)

- `GET /v1/brands?search&isLaboratory&isActive`
- `POST /v1/brands` body: `{ name, isLaboratory?, isActive? }`
- `PUT /v1/brands/:id` body: `Partial<CreateBrandDto>`
- `DELETE /v1/brands/:id`

### Inventory Adjustments

- `POST /v1/inventory/adjustments` body: `{ productId, lotId, branchId, adjustmentType: 'damage'|'correction'|'count_difference'|'expiry_write_off', quantity: number, reason: string }`
  - `quantity` positivo = entrada, negativo = salida.

---

## Flags rojas / cosas que probablemente necesitarán atención

1. **Frontend de brands usa campos inexistentes** → las requests van a fallar con 400 hasta que se simplifique (TAREA #3 urgente).
2. **No hay `.env` en frontend** → `apiUrl` cae al default `http://localhost:3000/api`. Para prod hay que crear `.env.production` con `VITE_API_URL`.
3. **Iconos**: la tipografía estricta es una trampa común. Siempre verifica con grep antes de usar un icon nuevo.
4. **Perfectionist ESLint**: el orden de imports es error-level, no warning. Te puede bloquear el build.

---

## Checklist final antes de dar por cerrado el trabajo QA

### Recomendaciones originales (13)

- [x] QA #1 Código producto autoincremental — backend ya autogenera `PROD-XXXXXX`; frontend con helper explícito + readonly en edit.
- [x] QA #2 Integración Vademecum — `VademecumSearchDialog` + botón "Importar desde Vademecum" en lista de principios activos + botón "Buscar" en quick-create.
- [x] QA #3 Marcas simplificadas (types + form + list + api).
- [x] QA #4 Unificar Stock ↔ Lotes — `/inventory/lots` eliminado del sidebar y routes; drill-down en `stock-view` + `product-detail-view`.
- [x] QA #5 Ajustes accesibles desde `/inventory/stock`.
- [x] QA #6 Botón "Actualizar desde BCV" + badge `isOverridden` + form de override.
- [x] QA #7 Import wizard CSV/XLSX con dry-run + commit.
- [x] QA #8 Módulo de precios (fijo o margen).
- [x] QA #9 Lógica de costo de venta — backend define política; frontend muestra costo en lotes y kardex. _(fuera del alcance de cambios adicionales)_.
- [x] QA #10 Filtro de ubicación en inventario — frontend `Ubicación` con `createFkFilterOperators` + backend `QueryInventoryLotDto.locationId` + `andWhere` en `findAllLots`.
- [x] QA #11 Columnas enriquecidas en stock (reservado, último conteo, último movimiento).
- [x] QA #12 Módulo de promociones (CRUD + scopes + activar/desactivar).
- [x] QA #13 Atajos "+" en selects de producto (Categoría, Marca, Principio Activo).

### Verificación

- [x] `npx tsc --noEmit` exit 0 en frontend.
- [x] `npx tsc --noEmit` exit 0 en backend.
- [ ] Probar manualmente cada feature contra backend corriendo.
