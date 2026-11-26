# Content and assets

## How pages are put together

Every page is finished HTML. The shared shell (head metadata, header, docs
navigation, breadcrumb, previous and next links, and footer) is written by
`scripts/layout.mjs` around each page's hand-written content, which sits
between `<!-- content:start -->` and `<!-- content:end -->`.

- Edit text, tables and screenshots inside those markers directly. Link to
  other pages by clean URL, as described under [URLs](#urls).
- Page titles, descriptions, navigation labels and order live in
  `scripts/site.mjs`. To add a page, add its entry there, create the file with
  the two markers and an `<h1>`, and run `node scripts/layout.mjs`.
- `node scripts/layout.mjs` also rewrites `sitemap.xml`. Commit its output;
  the site is not built during deployment.

`404.html` is standalone with inline styles and absolute links, because GitHub
Pages serves it for any missing path.

## URLs

Every page is an `.html` file, but links and published addresses leave out
`.html`. GitHub Pages serves `/manual/sales` from `manual/sales.html`, and
still answers the old `.html` addresses, so existing links keep working.

- Link to a page without `.html`: `sales` from another manual page,
  `../manual/sales` from `self-hosting/`, `manual/sales` from the home page.
  Anchors follow the clean URL: `sales#row-actions`.
- Link to a directory index as the directory with a trailing slash:
  `manual/index.html` is `./` from inside `manual/`, `../manual/` from
  `self-hosting/` and `manual/` from the home page; the home page is `./` or
  `../`. Without the slash GitHub Pages redirects, and `/manual/sales/` is a
  404 because only `manual/sales.html` exists.
- Keep links relative, so the site also works under a repository path.
- Canonical and `og:url` addresses, `sitemap.xml` and the absolute links in
  `404.html` use the same form, such as `https://fiscal-fox.synctune.it/manual/`
  and `https://fiscal-fox.synctune.it/manual/sales`. `scripts/layout.mjs`
  writes the shared links and these addresses with `cleanPath()` from
  `scripts/site.mjs`; page entries there keep their `.html` file paths.

## Content source

The manual and self-hosting pages are drawn from the Fiscal Fox README and
documentation at revision `2643c08` (15 November 2026) of its private source
repository. `docs/provenance.json` records that revision and the checksum of
every copied asset. The footer states the same date.

Because the source repository is private:

- Do not link to it, quote its repository URL, or invite readers to open it.
- Do not copy contributor material: development setup, test, lint and audit
  commands, dependency overrides, internal file paths, migration names, or
  library internals.
- Self-hosting pages describe how an installation runs. Keep the availability
  note on **Install and run** accurate: Fiscal Fox is in development and has no
  public release yet.

To refresh the content, compare the pinned revision of the README and user
documentation with a newer one, apply the user-facing changes to the matching
pages by hand, update screenshots and their checksums, and update the revision
in this file, `docs/provenance.json` and `docsAsOf` in `scripts/site.mjs`.

Markdown alerts become `<div class="callout callout-note" role="note">`
(also `tip`, `important`, `warning`, `caution`). Wide tables sit in
`<div class="table-wrap" tabindex="0" role="region" aria-label="...">` so they
scroll on small screens and remain keyboard accessible. Code blocks use
`<pre tabindex="0"><code>` for the same reason.

## Screenshots and logo

`assets/favicon.svg` is the Fiscal Fox logo (the fox with euro signs for eyes),
copied unmodified from the web app. The screenshots in `assets/screenshots/`
are copied unmodified from the source documentation. They show only the
fictional demo organization; never add screenshots with real business data.

`assets/apple-touch-icon.png` (180 x 180) and `assets/social.png`
(1200 x 630) are rendered from the logo. Re-render them with any browser
screenshot of a page that shows the SVG at that size; record the new
checksums in `docs/provenance.json`.

Every image needs `alt` text (empty only when decorative), plus `width` and
`height` to avoid layout shifts. Screenshots below the first screen use
`loading="lazy"`.

## Colours, type and privacy

Colours in `assets/styles.css` mirror the Fiscal Fox app tokens: ember
`#c2410c`, ember text `#b13b0b`, teal `#0f766e`, ink `#1c1f26` and paper
`#f6f5f2`, with the app's dark palette under `prefers-color-scheme: dark`.
The site uses system fonts; it does not load web fonts.

No scripts, CDN resources, analytics, cookies, embedded media or forms load on
this site. Update the footer privacy note in `scripts/layout.mjs` if this ever
changes.

## Checks

`node scripts/check-site.mjs` fails on:

- broken internal links, missing anchors and missing assets: a link without an
  extension must match `<path>.html`, one with a trailing slash
  `<path>/index.html`, and anchors are checked in that file;
- internal links that end in `.html`, and links to a directory index without
  the trailing slash (`../manual` instead of `../manual/`);
- external resources (stylesheets, images, scripts, fonts), root-relative URLs,
  `http://` URLs, any `<script>`, and links that open new windows;
- accessibility basics: `lang`, title, zoomable viewport, one `<main>` with a
  working skip link, exactly one `<h1>`, no skipped heading levels, image
  `alt`, `width` and `height`, link names, `th` scope, labelled scrollable
  regions, duplicate ids and broken ARIA references;
- WCAG AA colour contrast for the text and focus colour pairs in both palettes;
- `CNAME`, `.nojekyll`, `robots.txt`, `sitemap.xml`, and canonical and
  `og:url` addresses that disagree with `scripts/site.mjs`, and unused images.

`--external` also requests every external link, with retries.
`node scripts/layout.mjs --check` fails when a page or the sitemap is out of
date. CI runs all three before packaging.

Before publishing a change, also preview it with `node scripts/serve.mjs` (see
[deployment](deployment.md#no-installation-or-build)) on narrow and wide
screens in light and dark mode, tab through the page, and open the privacy
disclosure with the keyboard.

## Links

The site links to [Synctune Finance](https://finance.synctune.it) and
[Synctune](https://synctune.it). Keep the hostname in `CNAME`,
`scripts/site.mjs`, `robots.txt` and `404.html` consistent if it changes.
