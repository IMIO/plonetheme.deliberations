# CLAUDE.md — plonetheme.deliberations

Diazo + Bootstrap 5 theme for the Délibérations.be / iA.Délib citizen
portal. This is the **visual layer** that sits on top of
`plonemeeting.portal.core`; it supplies the chrome (header, nav,
footer, hero, cards, faceted styling, watermarks) and a small set of
template overrides. All real application logic lives in
`plonemeeting.portal.core`.

## Stack

- **Plone**: 6.1 add-on (also installable on 6.0; classifiers list
  Python 3.10–3.12).
- **Theme engine**: Diazo, registered as `++theme++deliberations`.
- **CSS**: SCSS → webpack 5 → `theme/dist/css/theme.css`.
- **JS**: ES modules → webpack → `theme/dist/js/theme.js` (entry
  `theme/index.js`, currently just a watermark helper hooked to
  Faceted's `AJAX_QUERY_SUCCESS` and a custom `ItemsLayoutChanged`
  event).
- **Frontend deps**: Bootstrap 5.3.3, `@plone/plonetheme-barceloneta-base`,
  `bootstrap-icons`, `@popperjs/core`, Inter (loaded from Google Fonts
  in `styles/theme.scss`).
- **Template overrides**: `z3c.jbot` keyed on
  `IPlonethemeDeliberationsLayer`.

## This package is a mr.developer checkout

This directory is auto-checked-out by the parent buildout
(`buildout.pm.portal`) under `src/plonetheme.deliberations/`. It is its
**own git repo** (upstream: `collective/plonetheme.deliberations`,
maintained by IMIO). Commits made here go to that repo, not to the
buildout repo. `always-checkout = true` in dev, so each `bin/buildout`
will `git pull` — commit/stash before rebuilding.

## Layout

```
setup.py                 1.x dist (current dev: 1.8.dev0)
base.cfg / buildout.cfg  standalone buildout (only used when developing this package alone, not via the parent)
test_plone60.cfg         CI buildout for Plone 6.0
src/plonetheme/deliberations/
  configure.zcml         registers default + uninstall profiles, mounts theme dir as plone:static type=theme name=deliberations
  permissions.zcml
  interfaces.py          IPlonethemeDeliberationsLayer (browser layer marker)
  setuphandlers.py       post_install/uninstall hooks (currently no-ops); HiddenProfiles utility hides the uninstall profile from the add-ons control panel
  browser/
    configure.zcml       z3c.jbot directory=overrides + plone:static name=plonetheme.deliberations
    overrides/           jbot template overrides (e.g. eea.facetednavigation view, collective.querynextprev nextprev)
    static/              browser static resources (currently empty; .gitkeep only)
  profiles/
    default/             GenericSetup install profile — enables theme, registers browser layer, sets plone.toolbar_position=top, registers a disabled webpack devserver bundle
    uninstall/
  locales/               i18n (only en/ exists; .pot is empty — domain is plonetheme.deliberations, but most user-facing strings live in plonemeeting.portal.core)
  theme/                 Diazo theme files (everything below this line is the actual theme)
    manifest.cfg         declares prefix ++theme++deliberations, rules.xml, production-css/js paths into dist/
    rules.xml            Diazo rules — copies head, moves nav/searchbox/logo, rewrites footer portlets into a Bootstrap doormat grid (1/2/3/4-col based on portlet count), drops toolbar for anonymous
    index.html           the Diazo theme HTML scaffold (offcanvas mobile nav, hero, main, footer)
    index.js             webpack entry — applies watermarks to .watermarked elements, re-applies on Faceted refresh
    package.json         build scripts (build/watch via webpack)
    webpack.config.js    SCSS+JS pipeline; aliases react→preact/compat; dev server proxies everything except dist/ to localhost:8080
    styles/              SCSS sources (theme.scss is the entry — imports Bootstrap, Barceloneta base, then per-section partials)
    assets/              SVG icons, logos, homepage background, wallonia-boundaries.json (used by map.scss / leaflet)
    tinymce-templates/   HTML templates exposed in TinyMCE
    dist/                BUILD ARTEFACTS — gitignored; produced by `npm run build`
```

## Building the theme

The frontend bundle is **not committed** (`dist/*` is in `.gitignore`).
You must build it any time you change `theme/styles/**`,
`theme/index.js`, or `theme/index.html` — Plone serves the compiled
files from `theme/dist/` via the paths declared in `manifest.cfg`.

```bash
cd src/plonetheme.deliberations/src/plonetheme/deliberations/theme

# one-time
npm install

# production build → theme/dist/css/theme.css + theme/dist/js/theme.js
npm run build

# dev: webpack-dev-server on :3000, proxies all non-dist requests to
# the Plone instance on :8080. Also expects the registry record
# plone.bundles/plonetheme.deliberations-devserver to be enabled if
# you want hot styles via the dev bundle.
npm run watch
```

There is also a sass-only path (`npm run build2` / `css-main`) that
skips webpack and writes `styles/theme.css` directly — it is **not**
what `manifest.cfg` points at, so production deploys must use
`npm run build`.

The release flow is: bump `setup.py` version + `CHANGES.rst`, run
`npm run build`, commit `dist/` **only if** you intend to ship it via
the egg (current `MANIFEST.in` and `.gitignore` mean it does not ship
via PyPI — the buildout checks out the source and the parent project
must run the webpack build itself).

## Editing the theme

- **Diazo rules** (`theme/rules.xml`): take effect on next request — no
  Plone restart needed when the theme is in development mode. To force
  a refresh in prod, reinstall the GS profile or toggle the theme.
- **SCSS / JS**: rebuild required (`npm run build`). Without rebuild,
  source edits do nothing.
- **`index.html`**: same as SCSS — it is consumed by Diazo at runtime
  via `manifest.cfg`'s `theme = index.html`, but Plone caches the
  compiled theme; rebuild + theme reinstall is the safe path.
- **jbot overrides** (`browser/overrides/`): file name = dotted path to
  the original template (e.g.
  `eea.facetednavigation.browser.template.view.pt`). Add a file with
  that exact name and z3c.jbot replaces the original for any request
  that has `IPlonethemeDeliberationsLayer` in its layers (i.e. the
  theme's profile is installed). No restart needed in dev mode.
- **GenericSetup profile** (`profiles/default/`): bumping
  `metadata.xml`'s `<version>` is only relevant if you add upgrade
  steps — there are none today. Currently `<version>1000</version>`
  with a single dependency on `plone.app.theming`.
- **i18n**: domain is `plonetheme.deliberations`. The `.pot` is empty
  and most translatable strings live in `plonemeeting.portal.core`'s
  domain — only add strings here if they originate from this package's
  own templates / overrides.

## Things that are easy to get wrong

- The `theme/dist/` directory is gitignored. Forgetting `npm run build`
  before deploying produces a broken site (404s on theme.css /
  theme.js). The dev profile registers a `…-devserver` bundle that is
  disabled by default — enabling it without a running webpack dev
  server breaks page loads.
- The Inter font is fetched from Google Fonts at runtime via
  `@import url(...)` at the top of `styles/theme.scss`. There is no
  local fallback bundled.
- `webpack.config.js` aliases `react`, `react-dom`, and
  `react-dom/test-utils` to `preact/compat`. Anything imported from
  React resolves to Preact — keep this in mind when copying snippets.
- The dev server proxies `localhost:3000 → localhost:8080`. Plone must
  be running on 8080 (the parent buildout's default dev port from
  `base.cfg`) for `npm run watch` to be useful.
- `setup.py`'s `extras_require['test']` lists testing deps but **there
  is no `tests/` package** — `bin/test -s plonetheme.deliberations`
  from the parent buildout will discover nothing. Don't waste time
  looking for a suite that isn't there.
- `setuphandlers.HiddenProfiles` hides the uninstall profile from the
  control panel; uninstall it from the ZMI portal_setup if needed.
- The package namespace is `collective.*` on GitHub but the publisher
  is iMio — release tagging happens against
  `collective/plonetheme.deliberations` master/main.
- `base.cfg` / `buildout.cfg` / `test_plone60.cfg` here are for
  **standalone development of just this package**. In normal day-to-day
  work you build from the parent (`buildout.pm.portal`) and ignore
  these.
