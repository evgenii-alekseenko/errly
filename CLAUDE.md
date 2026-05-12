# Error Logger Extension

Chrome/Firefox extension. Passive logger for network + runtime errors.

## Stack

- WXT 0.20 (React + TS), pnpm
- Targets: Chromium MV3 + Firefox MV2 (no Safari)
- Jest + @swc/jest (unit), Playwright (E2E, headed + slowMo)
- No ESLint config beyond WXT default

## Working approach

- **Vertical slices, minimum viable each.** Don't pre-build for future slices. No premature abstractions.
- **No estimates.** Skip time/effort guesses.
- **Re-grill before each slice.** Don't deep-design slices N+1 from slice N.
- **Commit after each slice.**
- **Pure logic in own modules.** WXT globals (`browser`, `storage`, `defineBackground`) aren't available in Jest — split testable pure functions out (see `lib/cap.ts`).

## Slice roadmap

1. ✅ Network errors → popup list
2. ✅ Runtime errors (MAIN-world content script + bridge)
3. ✅ Monitoring toggle (default OFF, separate `settings` storage key)
4. ✅ History page + Clear button
5. ✅ Shadow-DOM toast overlay on originating tab
6. ✅ Theme (light/dark/system) + notification position
7. Filters + colors + search (Zustand starts paying off)
8. Detail page (introduces ReactRouter)
9. Screenshot / test-error / copy-last buttons
10. Report templates (JSON + Jira URL, Strategy pattern)
11. DevTools panel

## Architecture

```
entrypoints/
  background.ts                    # webRequest + runtime.onMessage handlers,
                                   # notifyTab via tabs.sendMessage after pushError
  runtime-main.content.ts          # MAIN world: window.error + unhandledrejection
  runtime-bridge.content.ts        # ISOLATED: postMessage → runtime.sendMessage
  overlay.content/                 # ISOLATED at document_start: shadow-DOM toast queue
    index.tsx                      #   createShadowRootUi + React mount
    Toast.tsx                      #   ToastQueue component (subscribes to toast-store)
    style.css
  popup/                           # action popup
  history/                         # /history.html — full page

lib/
  types.ts                         # NetworkError | RuntimeError discriminated union
                                   # ShowToastMessage, RuntimePayload + marker
  storage.ts                       # errors storage (get/push/clear/watch)
  cap.ts                           # pure: appendCapped (Jest-testable)
  settings.ts                      # Settings (monitoring, theme, notificationPosition)
  toast-store.ts                   # module-level pub/sub for toasts (race-proof)
  use-settings.ts                  # React: useSettings, useEffectiveTheme, ThemeApplier
  theme.css                        # shared CSS variables for light/dark via [data-theme]

tests/
  unit/                            # Jest
  e2e/
    fixture-server.mjs             # local Node http server: /error /throw /reject
    fixtures.ts                    # launchExtension + setMonitoring + setStorage helpers
    *.spec.ts
```

## Conventions

### Storage
- `chrome.storage.local`, separate keys for `errors` and `settings`. No bundling.
- `errors`: `ErrorRecord[]` capped at 20 via pure `appendCapped`.
- `ErrorRecord` is discriminated union on `kind: 'network' | 'runtime'`. Common base: `id` (uuid), `timestamp`.
- `crypto.randomUUID()` for every record.

### Capture
- Filter all captures by `tabId === activeTab` via stateless `tabs.query` per event.
- Background reads `settings.monitoring` per event; default is OFF (explicit opt-in).
- `host_permissions: <all_urls>` in manifest, but UX is "current tab only".
- No dedup yet — separate slice if it becomes a real problem.

### Cross-context messaging
- MAIN-world content script can't use `browser.*` API — communicates with ISOLATED bridge via `window.postMessage` + magic marker (`RUNTIME_MESSAGE_MARKER`).
- Background notifies originating tab via `tabs.sendMessage(tabId, ShowToastMessage)` after `pushError`. Wrapped in try/catch — chrome:// and similar tabs have no content script.
- Content scripts needing message listeners during page load **must register `runtime.onMessage` synchronously in `main()`** before any async (shadow-root mount). Otherwise messages from page-load network fetches are lost. Buffer via module-level pub/sub (see `lib/toast-store.ts`).

### UI
- Controlled inputs that write to async storage need **optimistic local update** in `onChange` (storage.watch is too slow for Playwright's `.check()` polling).
- Theme via `data-theme` attribute on `<html>` + CSS variables in `lib/theme.css`. Both popup and history import.
- `useEffectiveTheme` resolves `'system'` via `prefers-color-scheme` matchMedia.

### E2E
- `headless: false`, `slowMo: 800`, final `waitForTimeout(2-3s)` so changes are observable.
- Local Node http fixture server, no npm deps.
- Seed extension storage via `serviceWorker.evaluate()` to flip `monitoring: true` before triggering fixtures.

## Commands

```
pnpm dev              # dev mode (chrome)
pnpm dev:firefox
pnpm build            # chrome production build
pnpm build:firefox
pnpm test             # jest unit
pnpm test:e2e         # build + playwright headed
pnpm compile          # tsc --noEmit
```
