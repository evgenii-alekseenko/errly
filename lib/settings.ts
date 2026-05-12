export type Theme = 'light' | 'dark' | 'system';

export type NotificationPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export const NOTIFICATION_POSITIONS: NotificationPosition[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

export const FILTERABLE_4XX = [401, 403, 404, 405, 408] as const;
export const FILTERABLE_5XX = [500, 502, 503, 504] as const;
export const FILTERABLE_CODES = [...FILTERABLE_4XX, ...FILTERABLE_5XX] as const;

export type CodeFilters = Record<number, boolean>;

const DEFAULT_CODE_FILTERS: CodeFilters = Object.fromEntries(
  FILTERABLE_CODES.map((c) => [c, true]),
);

export type Settings = {
  monitoring: boolean;
  theme: Theme;
  notificationPosition: NotificationPosition;
  codeFilters: CodeFilters;
};

export const DEFAULT_SETTINGS: Settings = {
  monitoring: false,
  theme: 'system',
  notificationPosition: 'bottom-right',
  codeFilters: DEFAULT_CODE_FILTERS,
};

export const SETTINGS_KEY = 'settings';

const settingsItem = storage.defineItem<Settings>(`local:${SETTINGS_KEY}`, {
  fallback: DEFAULT_SETTINGS,
});

function withDefaults(s: Settings | null | undefined): Settings {
  return { ...DEFAULT_SETTINGS, ...(s ?? {}) };
}

export async function getSettings(): Promise<Settings> {
  return withDefaults(await settingsItem.getValue());
}

export async function setSettings(patch: Partial<Settings>): Promise<void> {
  const current = withDefaults(await settingsItem.getValue());
  await settingsItem.setValue({ ...current, ...patch });
}

export function watchSettings(cb: (s: Settings) => void): () => void {
  return settingsItem.watch((newValue: Settings | null) => {
    cb(withDefaults(newValue));
  });
}
