# OIDC applications catalog

A dependency-free Node.js build that turns `oidc-applications.json` into static HTML tables grouped by category.

## Local build

```sh
npm run build
```

The generated site is written to `dist/index.html` (`index.css`, `filter.js`, and `taxfree.svg` are copied to `dist` when present). Edit the shell in `index.html` to add your own styling, navigation, or other markup. Keep the `<!-- OIDC_APPLICATIONS -->` marker where the generated tables should appear.

For live validation while editing:

```sh
npm run dev
```

Vite serves the generated `dist` directory and automatically rebuilds and reloads when `index.html` or `oidc-applications.json` changes. Category filter buttons are generated automatically and use the small `filter.js` browser script. Open the local URL printed by Vite, usually `http://localhost:5173`.

The build escapes catalog values and only emits `http`/`https` links.

## Cloudflare Pages deployment

Cloudflare Pages can build and deploy directly from the connected GitHub repository. Configure the project with:

- Root directory: `/`
- Build command: `npm run build`
- Build output directory: `dist`

No GitHub Actions workflow or Cloudflare API secrets are required. Cloudflare runs the build whenever the configured branch receives a new commit.
