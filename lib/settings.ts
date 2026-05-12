export type Settings = {
  monitoring: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  monitoring: false,
};

export const SETTINGS_KEY = 'settings';

const settingsItem = storage.defineItem<Settings>(`local:${SETTINGS_KEY}`, {
  fallback: DEFAULT_SETTINGS,
});

export async function getSettings(): Promise<Settings> {
  return settingsItem.getValue();
}

export async function setSettings(patch: Partial<Settings>): Promise<void> {
  const current = await settingsItem.getValue();
  await settingsItem.setValue({ ...current, ...patch });
}

export function watchSettings(cb: (s: Settings) => void): () => void {
  return settingsItem.watch((newValue: Settings | null) => {
    cb(newValue ?? DEFAULT_SETTINGS);
  });
}
