# OIDC applications catalog

A dependency-free Node.js build that turns `oidc-applications.json` into static HTML tables grouped by category.

## Local build

```sh
npm run build
```

The generated site is written to `dist/index.html` (`index.css`, `filter.js`, and `taxfree.svg` are copied to `dist` when present). The build also generates `dist/sitemap.xml` and `dist/robots.txt` for search-engine discovery. It defaults to `https://ssno.tax`; set `SITE_URL` when deploying to a different domain, for example `SITE_URL=https://example.com npm run build`. Edit the shell in `index.html` to add your own styling, navigation, or other markup. Keep the `<!-- OIDC_APPLICATIONS -->` marker where the generated tables should appear.

For live validation while editing:

```sh
npm run dev
```

Vite serves the generated `dist` directory and automatically rebuilds and reloads when `index.html` or `oidc-applications.json` changes. Category filter buttons are generated automatically and use the small `filter.js` browser script. Open the local URL printed by Vite, usually `http://localhost:5173`.

The build escapes catalog values and only emits `http`/`https` links.

## Cloudflare Pages deployment

This repo gets auto deployed by Cloudflare when main is pushed to. Submit your PRs and they will go live once reviewed

