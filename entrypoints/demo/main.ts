import { getRecordColor, networkLabel } from '@/lib/format';
import { getSettings, watchSettings } from '@/lib/settings';
import { getErrors, watchErrors } from '@/lib/storage';
import {
  type ErrorRecord,
  RUNTIME_MESSAGE_MARKER,
  type RuntimePayload,
  type ShowToastMessage,
} from '@/lib/types';

const TOAST_TTL_MS = 5000;

// Extension pages (chrome-extension://) are excluded from content-script injection,
// so runtime-main never sees throws here. Forward to background directly.
function forwardRuntime(payload: Omit<RuntimePayload, 'marker'>): void {
  const msg: RuntimePayload = { marker: RUNTIME_MESSAGE_MARKER, ...payload };
  void browser.runtime.sendMessage(msg).catch(() => {});
}

window.addEventListener('error', (event) => {
  forwardRuntime({
    message: event.message || String(event.error?.message ?? event.error ?? 'Error'),
    source: `${event.filename}:${event.lineno}:${event.colno}`,
    stack: event.error?.stack,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message =
    reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : String(reason);
  forwardRuntime({
    message: `Unhandled rejection: ${message}`,
    source: 'promise',
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

const logEl = document.getElementById('log') as HTMLPreElement;

function log(msg: string): void {
  const ts = new Date().toLocaleTimeString();
  logEl.textContent = `[${ts}] ${msg}\n` + logEl.textContent;
}

async function tryFetch(label: string, url: string): Promise<void> {
  log(`→ ${label}: ${url}`);
  try {
    const res = await fetch(url, { cache: 'no-store' });
    log(`  ← ${res.status}`);
  } catch (err) {
    log(`  ← rejected (${err instanceof Error ? err.message : String(err)})`);
  }
}

const actions: Record<string, () => void | Promise<void>> = {
  'http-404': () => tryFetch('404', 'https://httpbin.org/status/404'),
  'http-500': () => tryFetch('500', 'https://httpbin.org/status/500'),
  refused: () => tryFetch('refused', 'http://127.0.0.1:1/probe'),
  dns: () => tryFetch('dns', 'https://errly-demo-nope.invalid/x'),
  throw: () => {
    log('→ throw');
    setTimeout(() => {
      throw new Error('demo: uncaught throw');
    }, 0);
  },
  reject: () => {
    log('→ reject');
    setTimeout(() => {
      void Promise.reject(new Error('demo: unhandled rejection'));
    }, 0);
  },
  storm: async () => {
    log('→ storm');
    await tryFetch('404', 'https://httpbin.org/status/404');
    await tryFetch('500', 'https://httpbin.org/status/500');
    await tryFetch('refused', 'http://127.0.0.1:1/probe');
    await tryFetch('dns', 'https://errly-demo-nope.invalid/x');
    setTimeout(() => {
      throw new Error('demo: storm throw');
    }, 100);
    setTimeout(() => {
      void Promise.reject(new Error('demo: storm reject'));
    }, 200);
  },
};

document.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (action && actions[action]) void actions[action]();
  });
});

const statusEl = document.getElementById('status') as HTMLDivElement;
const monitoringEl = document.getElementById('status-monitoring') as HTMLSpanElement;
const countEl = document.getElementById('status-count') as HTMLSpanElement;
const sessionStart = Date.now();

function renderMonitoring(on: boolean): void {
  monitoringEl.textContent = on ? 'ON' : 'OFF — enable in popup';
  statusEl.dataset.monitoring = on ? 'on' : 'off';
}

void getSettings().then((s) => renderMonitoring(s.monitoring));
watchSettings((s) => renderMonitoring(s.monitoring));

function renderCount(records: { timestamp: number }[]): void {
  countEl.textContent = String(records.filter((r) => r.timestamp >= sessionStart).length);
}

void getErrors().then(renderCount);
watchErrors(renderCount);

const toastStack = document.getElementById('toast-stack') as HTMLDivElement;
let codeColors: Record<number, string> = {};
void getSettings().then((s) => {
  codeColors = s.codeColors;
});
watchSettings((s) => {
  codeColors = s.codeColors;
});

function renderToast(record: ErrorRecord): void {
  const color = getRecordColor(record, codeColors);
  const el = document.createElement('div');
  el.className = `demo-toast ${record.kind}`;
  el.style.borderLeftColor = color;

  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = record.kind === 'network' ? networkLabel(record) : 'ERR';

  const body = document.createElement('div');
  body.className = 'body';
  const title = document.createElement('div');
  title.className = 'title';
  title.textContent =
    record.kind === 'network' ? `${record.method} ${record.url}` : record.message;
  const sub = document.createElement('div');
  sub.className = 'sub';
  sub.textContent =
    record.kind === 'network' ? new Date(record.timestamp).toLocaleTimeString() : record.source;
  body.append(title, sub);

  el.append(label, body);
  toastStack.append(el);

  setTimeout(() => el.remove(), TOAST_TTL_MS);
}

browser.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as ShowToastMessage | undefined;
  if (msg?.type === 'show-toast') renderToast(msg.record);
});
