import { useEffect, useState } from 'react';
import { getErrors, watchErrors } from '@/lib/storage';
import {
  DEFAULT_SETTINGS,
  NOTIFICATION_POSITIONS,
  type NotificationPosition,
  type Settings,
  type Theme,
  getSettings,
  setSettings,
  watchSettings,
} from '@/lib/settings';
import { ThemeApplier } from '@/lib/use-settings';
import type { ErrorRecord } from '@/lib/types';
import './App.css';

const THEME_OPTIONS: Theme[] = ['light', 'dark', 'system'];

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

function ErrorRow({ record }: { record: ErrorRecord }) {
  if (record.kind === 'network') {
    return (
      <li className="error-row network" data-testid="error-row" data-kind="network">
        <span className="label">{record.statusCode}</span>
        <span className="meta">{record.method}</span>
        <span className="detail" title={record.url}>{record.url}</span>
        <span className="time">{formatTime(record.timestamp)}</span>
      </li>
    );
  }
  return (
    <li className="error-row runtime" data-testid="error-row" data-kind="runtime">
      <span className="label">ERR</span>
      <span className="meta" title={record.source}>{record.source}</span>
      <span className="detail" title={record.message}>{record.message}</span>
      <span className="time">{formatTime(record.timestamp)}</span>
    </li>
  );
}

function MonitoringToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="monitoring-toggle">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        data-testid="monitoring-toggle"
      />
      <span>Monitoring Active</span>
    </label>
  );
}

function AppearanceSection({
  theme,
  position,
  onTheme,
  onPosition,
}: {
  theme: Theme;
  position: NotificationPosition;
  onTheme: (t: Theme) => void;
  onPosition: (p: NotificationPosition) => void;
}) {
  return (
    <section className="section">
      <h2>Appearance</h2>
      <div className="field">
        <label className="label">Theme</label>
        <div className="theme-radios" role="radiogroup" aria-label="Theme">
          {THEME_OPTIONS.map((t) => (
            <label key={t}>
              <input
                type="radio"
                name="theme"
                value={t}
                checked={theme === t}
                onChange={() => onTheme(t)}
                data-testid={`theme-${t}`}
              />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="position-select">
          Position
        </label>
        <select
          id="position-select"
          data-testid="position-select"
          value={position}
          onChange={(e) => onPosition(e.target.value as NotificationPosition)}
        >
          {NOTIFICATION_POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

function App() {
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [settings, setLocalSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getErrors().then(setErrors);
    return watchErrors(setErrors);
  }, []);

  useEffect(() => {
    getSettings().then(setLocalSettings);
    return watchSettings(setLocalSettings);
  }, []);

  const update = (patch: Partial<Settings>) => {
    setLocalSettings((s) => ({ ...s, ...patch }));
    setSettings(patch);
  };

  const openHistory = () => {
    browser.tabs.create({ url: browser.runtime.getURL('/history.html') });
  };

  return (
    <div className="popup" data-monitoring={settings.monitoring ? 'on' : 'off'}>
      <ThemeApplier />
      <header className="popup-header">
        <h1>Error Logger</h1>
        <MonitoringToggle
          value={settings.monitoring}
          onChange={(monitoring) => update({ monitoring })}
        />
      </header>
      <div className="popup-actions">
        <button type="button" onClick={openHistory} data-testid="open-history">
          History ({errors.length})
        </button>
      </div>
      {!settings.monitoring && (
        <p className="hint" data-testid="off-hint">Monitoring is off — flip toggle to capture.</p>
      )}
      <AppearanceSection
        theme={settings.theme}
        position={settings.notificationPosition}
        onTheme={(theme) => update({ theme })}
        onPosition={(notificationPosition) => update({ notificationPosition })}
      />
      <section className="section">
        <h2>Errors</h2>
        {errors.length === 0 ? (
          <p className="empty" data-testid="empty">No errors yet</p>
        ) : (
          <ul className="error-list">
            {[...errors].reverse().map((e) => (
              <ErrorRow key={e.id} record={e} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;
