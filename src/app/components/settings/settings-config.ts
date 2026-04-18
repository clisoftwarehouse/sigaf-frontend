import type { SettingsState } from './types';

import { CONFIG } from '@/app/global-config';
import { themeConfig } from '@/app/ui-kit/theme/theme-config';

// ----------------------------------------------------------------------

export const SETTINGS_STORAGE_KEY: string = 'app-settings';

export const defaultSettings: SettingsState = {
  mode: themeConfig.defaultMode,
  direction: themeConfig.direction,
  contrast: 'high',
  navLayout: 'vertical',
  primaryColor: 'preset5',
  navColor: 'apparent',
  compactLayout: true,
  fontSize: 16,
  fontFamily: 'Inter Variable',
  version: CONFIG.appVersion,
};
