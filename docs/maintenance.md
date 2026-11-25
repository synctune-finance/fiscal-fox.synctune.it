# Content and assets

## How pages are put together

Every page is finished HTML. The shared shell (head metadata, header, docs
navigation, breadcrumb, previous and next links, and footer) is written by
`scripts/layout.mjs` around each page's hand-written content, which sits
between `<!-- content:start -->` and `<!-- content:end -->`.

- Edit text, tables and screenshots inside those markers directly.
- Page titles, descriptions, navigation labels and order live in
  `scripts/site.mjs`. To add a page, add its entry there, create the file with
  the two markers and an `<h1>`, and run `node scripts/layout.mjs`.
- `node scripts/layout.mjs` also rewrites `sitemap.xml`. Commit its output;
  the site is not built during deployment.

`404.html` is standalone with inline styles and absolute links, because GitHub
Pages serves it for any missing path.

## Content source

The manual and self-hosting pages are drawn from the Fiscal Fox README and
documentation at revision `2643c08` (15 November 2026) of its private source
repository. `docs/provenance.json` maps each page to its source files and
records the checksum of every copied asset. The footer states the same date.

Because the source repository is private:

- Do not link to it, quote its repository URL, or invite readers to open it.
- Do not copy contributor material: development setup, test, lint and audit
  commands, dependency overrides, internal file paths, migration names, or
  library internals.
- Self-hosting pages describe how an installation runs. Keep the availability
  note on **Install and run** accurate: Fiscal Fox is in development and has no
  public release yet.

To refresh the content, compare the pinned revision with a newer one in the
source repository, for example
`git diff 2643c08..<new> -- README.md docs/`, apply the user-facing changes to
the matching pages by hand, update screenshots and their checksums, and update
the revision in this file, `docs/provenance.json` and `docsAsOf` in
`scripts/site.mjs`.

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

- broken internal links, missing anchors and missing assets;
- external resources (stylesheets, images, scripts, fonts), root-relative URLs,
  `http://` URLs, any `<script>`, and links that open new windows;
- accessibility basics: `lang`, title, zoomable viewport, one `<main>` with a
  working skip link, exactly one `<h1>`, no skipped heading levels, image
  `alt`, `width` and `height`, link names, `th` scope, labelled scrollable
  regions, duplicate ids and broken ARIA references;
- WCAG AA colour contrast for the text and focus colour pairs in both palettes;
- `CNAME`, `.nojekyll`, `robots.txt`, `sitemap.xml` and canonical URLs that
  disagree with `scripts/site.mjs`, and unused images.

`--external` also requests every external link, with retries.
`node scripts/layout.mjs --check` fails when a page or the sitemap is out of
date. CI runs all three before packaging.

Before publishing a change, also preview narrow and wide screens in light and
dark mode, tab through the page, and open the privacy disclosure with the
keyboard.

## Links

The site links to [Synctune Finance](https://finance.synctune.it) and
[Synctune](https://synctune.it). Keep the hostname in `CNAME`,
`scripts/site.mjs`, `robots.txt` and `404.html` consistent if it changes.
