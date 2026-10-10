# Deploying to GitHub Pages

The site is built with relative asset paths (`base: "./"` in `vite.config.ts`),
so it works from any subfolder, e.g. `https://<you>.github.io/<repo>/`.

## Steps

1. Build the site:
   ```sh
   bun run build
   ```
2. The static output is in `dist/` (client assets under `dist/client`).
   Publish the client output to the `gh-pages` branch, or use the
   **GitHub Pages** GitHub Action with the build output folder.
3. In your repo: **Settings → Pages → Source: GitHub Actions** (or the
   `gh-pages` branch), then visit `https://<you>.github.io/<repo>/`.

## Notes

- All data (files, settings, installed apps) lives in the browser's
  localStorage — no server is needed at runtime.
- The app is a single page, so no 404 redirect tricks are required.
- If you fork/rename the repo, no config change is needed; relative paths
  adapt automatically.
