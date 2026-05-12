import { useEffect, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  type Settings,
  getSettings,
  watchSettings,
} from './settings';

export function useSettings(): Settings {
  const [settings, setLocalSettings] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => {
    getSettings().then(setLocalSettings);
    return watchSettings(setLocalSettings);
  }, []);
  return settings;
}

export function useEffectiveTheme(): 'light' | 'dark' {
  const settings = useSettings();
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (settings.theme === 'dark') return 'dark';
  if (settings.theme === 'light') return 'light';
  return systemDark ? 'dark' : 'light';
}

export function ThemeApplier() {
  const theme = useEffectiveTheme();
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return null;
}
