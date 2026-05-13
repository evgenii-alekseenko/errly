import { useEffect, useState } from 'react';
import { getErrors, watchErrors } from '@/lib/storage';
import {
  type CodeColors,
  type CodeFilters,
  COLOR_4XX,
  COLOR_5XX,
  DEFAULT_SETTINGS,
  FILTERABLE_4XX,
  FILTERABLE_5XX,
  NOTIFICATION_POSITIONS,
  type NotificationPosition,
  type Settings,
  type Theme,
  getSettings,
  setSettings,
  watchSettings,
} from '@/lib/settings';
import { shouldShowRecord } from '@/lib/filter';
import { ThemeApplier } from '@/lib/use-settings';
import { networkLabel } from '@/lib/format';
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
        <span className="label" title={record.errorText}>{networkLabel(record)}</span>
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

function defaultColorFor(code: number): string {
  return code >= 500 ? COLOR_5XX : COLOR_4XX;
}

function FiltersSection({
  codeFilters,
  codeColors,
  onFilters,
  onColors,
}: {
  codeFilters: CodeFilters;
  codeColors: CodeColors;
  onFilters: (next: CodeFilters) => void;
  onColors: (next: CodeColors) => void;
}) {
  const setGroup = (codes: readonly number[], enabled: boolean) => {
    const next = { ...codeFilters };
    for (const c of codes) next[c] = enabled;
    onFilters(next);
  };

  const groupAllOn = (codes: readonly number[]) => codes.every((c) => codeFilters[c]);

  const setCode = (code: number, enabled: boolean) => {
    onFilters({ ...codeFilters, [code]: enabled });
  };

  const setColor = (code: number, color: string) => {
    onColors({ ...codeColors, [code]: color });
  };

  return (
    <section className="section">
      <h2>Filters</h2>
      <div className="filter-groups">
        <button
          type="button"
          data-testid="group-4xx"
          aria-pressed={groupAllOn(FILTERABLE_4XX)}
          onClick={() => setGroup(FILTERABLE_4XX, !groupAllOn(FILTERABLE_4XX))}
        >
          All 4XX
        </button>
        <button
          type="button"
          data-testid="group-5xx"
          aria-pressed={groupAllOn(FILTERABLE_5XX)}
          onClick={() => setGroup(FILTERABLE_5XX, !groupAllOn(FILTERABLE_5XX))}
        >
          All 5XX
        </button>
      </div>
      <div className="code-grid">
        {[...FILTERABLE_4XX, ...FILTERABLE_5XX].map((code) => (
          <div key={code} className="code-cell">
            <label className="code-toggle">
              <input
                type="checkbox"
                checked={!!codeFilters[code]}
                onChange={(e) => setCode(code, e.target.checked)}
                data-testid={`code-${code}`}
              />
              <span>{code}</span>
            </label>
            <input
              type="color"
              value={codeColors[code] ?? defaultColorFor(code)}
              onChange={(e) => setColor(code, e.target.value)}
              data-testid={`color-${code}`}
              aria-label={`Color for ${code}`}
            />
          </div>
        ))}
      </div>
    </section>
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
    browser.tabs.create({ url: browser.runtime.getURL('/errors.html') });
  };

  const openDemo = () => {
    browser.tabs.create({ url: browser.runtime.getURL('/demo.html') });
  };

  return (
    <div className="popup" data-monitoring={settings.monitoring ? 'on' : 'off'}>
      <ThemeApplier />
      <header className="popup-header">
        <h1>Errly</h1>
        <MonitoringToggle
          value={settings.monitoring}
          onChange={(monitoring) => update({ monitoring })}
        />
      </header>
      <div className="popup-actions">
        <button type="button" onClick={openHistory} data-testid="open-history">
          History ({errors.length})
        </button>
        <button type="button" onClick={openDemo} data-testid="open-demo" className="secondary">
          Demo
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
      <FiltersSection
        codeFilters={settings.codeFilters}
        codeColors={settings.codeColors}
        onFilters={(codeFilters) => update({ codeFilters })}
        onColors={(codeColors) => update({ codeColors })}
      />
      <ErrorsSection errors={errors} codeFilters={settings.codeFilters} />
    </div>
  );
}

function ErrorsSection({
  errors,
  codeFilters,
}: {
  errors: ErrorRecord[];
  codeFilters: CodeFilters;
}) {
  const visible = errors.filter((e) => shouldShowRecord(e, codeFilters));
  const hidden = errors.length - visible.length;
  return (
    <section className="section">
      <h2>
        Errors
        {hidden > 0 && (
          <span className="hidden-count" data-testid="hidden-count">
            {' '}({hidden} hidden)
          </span>
        )}
      </h2>
      {errors.length === 0 ? (
        <p className="empty" data-testid="empty">No errors yet</p>
      ) : visible.length === 0 ? (
        <p className="empty" data-testid="all-filtered">All errors filtered out</p>
      ) : (
        <ul className="error-list">
          {[...visible].reverse().map((e) => (
            <ErrorRow key={e.id} record={e} />
          ))}
        </ul>
      )}
    </section>);
}

export default App;
