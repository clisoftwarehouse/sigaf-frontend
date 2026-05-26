/**
 * Utilidades de normalización de casing para nombres mostrados al usuario.
 *
 * Motivación (QA #102): el sistema mezcla datos que vienen de Excel, captura
 * manual y scrapers — resultado: nombres en UPPERCASE, lowercase, mixto, con
 * espacios extra, etc. Esto dificulta la lectura. Aplicar `displayName` al
 * renderizar normaliza la vista sin tocar la BD.
 *
 * Convención del proyecto: usar `titleCase` para nombres de entidades de
 * catálogo (productos, marcas, categorías, principios activos, proveedores).
 * Códigos cortos (RIF, SKU, lote, EAN) NO se normalizan — esos son técnicos
 * y deben mostrarse tal cual.
 */

const SMALL_WORDS = new Set([
  'a',
  'al',
  'ante',
  'bajo',
  'con',
  'contra',
  'de',
  'del',
  'desde',
  'el',
  'en',
  'entre',
  'la',
  'las',
  'lo',
  'los',
  'para',
  'por',
  'según',
  'sin',
  'sobre',
  'tras',
  'un',
  'una',
  'unos',
  'unas',
  'y',
  'o',
  'u',
  'ni',
  'que',
]);

/** Colapsa whitespace múltiple a un solo espacio y trimea. */
function normalizeSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * UPPER → "UPPER". Útil para códigos que SÍ deben mostrarse en caja alta
 * (RIF, EAN, SKU).
 */
export function toUpperCase(s: string | null | undefined): string {
  if (!s) return '';
  return normalizeSpaces(s).toUpperCase();
}

/**
 * "FORMA FARMACÉUTICA TABLETA" → "forma farmacéutica tableta". Solo para
 * descripciones libres donde nada debe quedar capitalizado.
 */
export function toLowerCase(s: string | null | undefined): string {
  if (!s) return '';
  return normalizeSpaces(s).toLowerCase();
}

/**
 * "FORMA FARMACÉUTICA" → "Forma Farmacéutica". TitleCase aware del español:
 * preserva mayúsculas iniciales en cada palabra excepto conectores cortos
 * (de, la, el, en, etc.), que quedan en minúscula salvo cuando son la
 * primera palabra.
 */
export function toTitleCase(s: string | null | undefined): string {
  if (!s) return '';
  const words = normalizeSpaces(s).toLowerCase().split(' ');
  return words
    .map((w, i) => {
      // Primera palabra siempre capitalizada.
      if (i === 0) return capitalizeWord(w);
      // Conectores quedan en minúscula.
      if (SMALL_WORDS.has(w)) return w;
      return capitalizeWord(w);
    })
    .join(' ');
}

/**
 * "FORMA FARMACÉUTICA tableta" → "Forma farmacéutica tableta". Solo la
 * primera letra del string entera, el resto a minúscula. Útil cuando el
 * texto es una oración completa.
 */
export function toSentenceCase(s: string | null | undefined): string {
  if (!s) return '';
  const t = normalizeSpaces(s).toLowerCase();
  if (!t) return '';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function capitalizeWord(w: string): string {
  if (!w) return '';
  // Preservar guiones intermedios y separadores: "anti-inflamatorio" →
  // "Anti-Inflamatorio".
  return w
    .split('-')
    .map((piece) => (piece ? piece.charAt(0).toUpperCase() + piece.slice(1) : piece))
    .join('-');
}

/**
 * Helper de alto nivel: el casing por defecto para nombres de entidades
 * mostradas en UI. Equivale a `toTitleCase`. Usar este en componentes para
 * que cambiar la convención globalmente sea un solo punto de edición.
 */
export const displayName = toTitleCase;
