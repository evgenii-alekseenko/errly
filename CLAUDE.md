# Errly — working approach

See `README.md` for stack, architecture, conventions, and commands.

- **Vertical slices, minimum viable each.** Don't pre-build for future slices. No premature abstractions.
- **No estimates.** Skip time/effort guesses.
- **Re-grill before each slice.** Don't deep-design slices N+1 from slice N.
- **Update `README.md` before every commit.** Roadmap status, architecture diagram, conventions — keep current. The doc update is part of the commit, not after.
- **Commit after each slice.**
- **Pure logic in own modules.** WXT globals (`browser`, `storage`, `defineBackground`) aren't available in Jest — split testable pure functions out (see `lib/cap.ts`).
