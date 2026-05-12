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
- **Pure logic in own modules.** WXT globals (`browser`, `storage`, `defineBackground`) aren't available in Jest — split testable pure functions out (see `lib/cap.ts`).

## Slice roadmap

1. ✅ Network errors → popup list
2. Runtime errors (content-script + page-world injection)
3. Monitoring toggle (first settings entry)
4. History page + ReactRouter (20-cap circular buffer)
5. Content-script notification overlay
6. Settings: theme + position
7. Filters + colors (Zustand starts paying off)
8. Detail page (history route extension)
9. Screenshot / test-error / copy-last buttons
10. Report templates (JSON + Jira URL, Strategy pattern)
11. DevTools panel

## Conventions

- `chrome.storage.local` from day 1 (SW death-proof); `errors` key = `ErrorRecord[]`, capped to 20 via `appendCapped`.
- Filter network events by `tabId === activeTab` via `tabs.query` per event (stateless, no cache).
- `host_permissions: <all_urls>` in manifest, but UX is "current tab only".
- `crypto.randomUUID()` for every record (id needed for later slices).
- No dedup yet — separate slice if it becomes a real problem.
- E2E: `headless: false`, `slowMo: 800`, final `waitForTimeout` so changes are observable.
- E2E fixture = local Node http server (`tests/e2e/fixture-server.mjs`), no external deps.

## Commands

```
pnpm dev              # dev mode
pnpm build            # chrome
pnpm build:firefox
pnpm test             # jest unit
pnpm test:e2e         # build + playwright headed
pnpm compile          # tsc --noEmit
```
