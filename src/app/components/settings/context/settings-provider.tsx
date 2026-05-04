import type { SettingsProviderProps } from '../types';

import { useEffect, useMemo, useState, useCallback } from 'react';

import { SettingsContext } from './settings-context';
import { SETTINGS_STORAGE_KEY } from '../settings-config';

// ----------------------------------------------------------------------

/**
 * El theme/picker dinámico de la plantilla Minimal está deshabilitado: queremos
 * apariencia idéntica entre dev y prod (sin "drift" por ajustes guardados en
 * localStorage de cada navegador). El provider siempre devuelve `defaultSettings`,
 * ignora cualquier mutación, y limpia la entrada `app-settings` heredada en el
 * primer render para que máquinas con valores viejos converjan.
 */
export function SettingsProvider({
  children,
  defaultSettings,
  storageKey = SETTINGS_STORAGE_KEY,
}: SettingsProviderProps) {
  const [openDrawer, setOpenDrawer] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // SSR/permisos: ignorar.
    }
  }, [storageKey]);

  const noop = useCallback(() => {}, []);
  const onCloseDrawer = useCallback(() => setOpenDrawer(false), []);
  const onToggleDrawer = useCallback(() => setOpenDrawer((prev) => !prev), []);

  const memoizedValue = useMemo(
    () => ({
      state: defaultSettings,
      canReset: false,
      onReset: noop,
      setState: noop,
      setField: noop,
      openDrawer,
      onCloseDrawer,
      onToggleDrawer,
    }),
    [defaultSettings, noop, openDrawer, onCloseDrawer, onToggleDrawer]
  );

  return <SettingsContext value={memoizedValue}>{children}</SettingsContext>;
}
