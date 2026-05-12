import { useEffect, useState } from 'react';
import { getErrors, watchErrors } from '@/lib/storage';
import {
  DEFAULT_SETTINGS,
  getSettings,
  setSettings,
  type Settings,
  watchSettings,
} from '@/lib/settings';
import type { ErrorRecord } from '@/lib/types';
import './App.css';

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

  const handleToggle = (monitoring: boolean) => {
    setLocalSettings((s) => ({ ...s, monitoring }));
    setSettings({ monitoring });
  };

  const openHistory = () => {
    browser.tabs.create({ url: browser.runtime.getURL('/history.html') });
  };

  return (
    <div className="popup" data-monitoring={settings.monitoring ? 'on' : 'off'}>
      <header className="popup-header">
        <h1>Error Logger</h1>
        <MonitoringToggle value={settings.monitoring} onChange={handleToggle} />
      </header>
      <div className="popup-actions">
        <button type="button" onClick={openHistory} data-testid="open-history">
          History ({errors.length})
        </button>
      </div>
      {!settings.monitoring && (
        <p className="hint" data-testid="off-hint">Monitoring is off — flip toggle to capture.</p>
      )}
      {errors.length === 0 ? (
        <p className="empty" data-testid="empty">No errors yet</p>
      ) : (
        <ul className="error-list">
          {[...errors].reverse().map((e) => (
            <ErrorRow key={e.id} record={e} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
