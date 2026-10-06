# Ubuntu 26.04 LTS — Browser Desktop

A browser-only desktop simulation targeting Ubuntu 26.04 LTS (Resolute Raccoon), GNOME 50. Not a Linux installation, and not affiliated with Canonical.

## Phase 1

- Ubuntu-style top panel, live clock, calendar, opaque left dock, original raccoon/sunburst wallpaper, and Home icon.
- Searchable application overview with Utilities and System categories, running indicators and a desktop preview.
- Window manager: drag, bottom-right resize, focus/stacking, minimize, maximize/restore, close, title-bar double-click and edge snapping. Shift-click an application in the dock to open another window.
- Basic Files shell with folder navigation, back/forward, selection, search and grid/list views.
- Basic Terminal shell with `help`, `clear`, `echo`, `whoami` and `pwd`.
- Text Editor with browser download; Settings currently opens system information.
- Desktop context menu and a basic system-panel popover. Wi-Fi and volume are simulations, not controls for the host computer.
- Alt+F1 or the Super key opens the overview where the browser permits it; Ctrl+Alt+T opens Terminal; Alt+Tab switches windows; Alt+F4 closes a window; Escape dismisses menus. Host/browser-reserved shortcuts cannot always be intercepted.

### New files

`src/components/desktop/apps.ts`, `app-icon.tsx`, `window.tsx`, `app-content.tsx`, `desktop.tsx`; `src/assets/ubuntu-wallpaper.jpg`; `src/test/desktop.test.tsx`; `roadmap.md`.

### Modified files

`src/routes/index.tsx`, `src/routes/__root.tsx`, `src/components/ui/button.tsx`, `src/styles.css`, `AGENTS.md`, `README.md`.

### Test commands

```sh
bun install
bun run dev
# Open http://localhost:8080 (or the URL printed by Vite).
bunx vitest run src/test/desktop.test.tsx src/test/app-routing.test.tsx
```

Manual checks: drag and resize a window, double-click its title bar, maximize/restore, minimize and reopen from dock, launch several applications, type in the editor and switch to overview without losing text, search for Terminal, navigate folders and go back, open calendar/system menus, and test 1366×768 and smaller viewports.

### Fidelity and asset references

- [Ubuntu 26.04 official release announcement](https://canonical.com/blog/canonical-releases-ubuntu-26-04-lts-resolute-raccoon)
- [Ubuntu 26.04 release notes](https://documentation.ubuntu.com/release-notes/26.04/summary-for-lts-users/)
- [Resolute Raccoon visual reference](https://canonical.com/blog/unmasking-the-resolute-raccoon)

Wallpaper is original generated artwork interpreting the release's purple raccoon/sunburst direction, not the official wallpaper. Icons use Lucide (ISC license) and original CSS drawings. Ubuntu typography is loaded from Google Fonts under the Ubuntu Font License; system fonts provide a fallback. The shell is an approximation, not yet a pixel-perfect GNOME 50 reproduction.

## Remaining phases and deployment

Persistent filesystem and full terminal arrive in Phase 2; settings and notifications in Phase 3; software management in Phase 4; login/lock/workspaces in Phase 5; media/utilities in Phase 6; standalone static GitHub Pages output and offline support in Phase 7.

This intermediate repository retains the managed React/TanStack development setup for the live preview. It is **not yet the requested upload-only GitHub Pages distribution**. There are no desktop backend calls, authentication services, or database dependencies. The final static deployment must remove runtime server requirements and use subdirectory-safe paths. No service worker is registered in Phase 1.
