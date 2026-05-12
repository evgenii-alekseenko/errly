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
5. Content-script notification overlay
6. Settings: theme + position
7. Filters + colors + search (Zustand starts paying off)
8. Detail page (introduces ReactRouter)
9. Screenshot / test-error / copy-last buttons
10. Report templates (JSON + Jira URL, Strategy pattern)
11. DevTools panel

## Architecture

```
entrypoints/
  background.ts                    # webRequest + runtime.onMessage handlers
  runtime-main.content.ts          # MAIN world: window.error + unhandledrejection
  runtime-bridge.content.ts        # ISOLATED: postMessage → runtime.sendMessage
  popup/                           # action popup
  history/                         # /history.html — full page

lib/
  types.ts                         # NetworkError | RuntimeError discriminated union
  storage.ts                       # errors storage (get/push/clear/watch)
  cap.ts                           # pure: appendCapped (Jest-testable)
  settings.ts                      # settings storage (monitoring flag)

tests/
  unit/                            # Jest
  e2e/
    fixture-server.mjs             # local Node http server: /error /throw /reject
    fixtures.ts                    # launchExtension + setMonitoring helpers
    *.spec.ts
```

## Conventions

- `chrome.storage.local`, separate keys for `errors` and `settings`. No bundling.
- `errors`: `ErrorRecord[]` capped at 20 via pure `appendCapped`.
- `ErrorRecord` is discriminated union on `kind: 'network' | 'runtime'`. Common base: `id` (uuid), `timestamp`.
- Filter all captures by `tabId === activeTab` via stateless `tabs.query` per event.
- Background reads `settings.monitoring` per event; default is OFF (explicit opt-in).
- `host_permissions: <all_urls>` in manifest, but UX is "current tab only".
- `crypto.randomUUID()` for every record.
- No dedup yet — separate slice if it becomes a real problem.
- Controlled inputs that write to async storage need **optimistic local update** in `onChange` (storage.watch is too slow for Playwright's `.check()` polling).
- MAIN-world content script can't use `browser.*` API — communicates with ISOLATED bridge via `window.postMessage` + magic marker (`RUNTIME_MESSAGE_MARKER`).
- E2E: `headless: false`, `slowMo: 800`, final `waitForTimeout(2-3s)` so changes are observable.
- E2E fixture = local Node http server, no npm deps.
- E2E tests set storage state via `serviceWorker.evaluate()` to flip `monitoring: true` before triggering fixtures.

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
