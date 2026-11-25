# Preview and deployment

## No installation or build

The repository contains the finished website. There is no package manager,
framework, generator or runtime service, and no `package.json`. All images
and CSS are local files. Do not run `npm install`.

Open `index.html` in a browser to read the site. Relative links also work from
disk. For an HTTP preview, use any static web server. If Python 3 is already
available:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Visit `http://127.0.0.1:8080`. Stop the server with Ctrl+C.
Python is an optional preview tool, not a website dependency.

## Checks

The scripts in `scripts/` use only Node.js built-in modules (Node 20 or newer):

```sh
node scripts/layout.mjs --check
node scripts/check-site.mjs
node scripts/check-site.mjs --external
```

See [maintenance](maintenance.md#checks) for what they cover.

## GitHub Pages setup

Pages for this repository is configured with:

- **Source:** GitHub Actions (`build_type: workflow`).
- **Custom domain:** `fiscal-fox.synctune.it`, matching the root `CNAME` file.
- **DNS:** a `fiscal-fox` CNAME record to `synctune-finance.github.io` in the
  `synctune.it` zone, which is hosted on Vercel DNS.
- **Enforce HTTPS:** on, once GitHub issued the certificate.

For Actions deployments, the custom domain is set in **Settings > Pages**. The
`CNAME` file records the intended hostname; it does not configure that setting.
Set the custom domain before pointing DNS at GitHub, so the hostname is never
routed to an unclaimed Pages site. See GitHub's
[custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Deployment workflow

`.github/workflows/pages.yml` has two jobs:

- **Check and package static site** runs the layout and site checks, including
  external links, then copies the root HTML files, `manual/`,
  `self-hosting/`, `assets/`, `CNAME`, `.nojekyll`, `robots.txt` and
  `sitemap.xml` into the public artifact. Repository metadata, scripts,
  workflow source, README and `docs/` are not published.
- **Deploy GitHub Pages** deploys that artifact from the same workflow run.
  Only this job receives Pages write and OIDC permissions, and it runs only
  for `main`. The deployment URL appears on the `github-pages` environment.

Site, script and workflow changes run the checks on pull requests targeting
`main`, including drafts. PRs do not upload a deployment artifact or deploy,
and the packaging job has read-only repository permissions. Documentation-only
changes do not trigger the workflow. Older PR runs are canceled by newer
commits on the same PR; production deployments are serialized without
canceling the in-progress run.

Redeploy manually through **Actions > Deploy static site > Run workflow**,
selecting **main**. Dispatching it on another branch skips both jobs.

The workflow uses official GitHub actions pinned to full commit SHAs. Artifacts
expire after one day. No tokens or secrets are needed beyond the standard
`GITHUB_TOKEN` and GitHub's OIDC token.

The workflow does not run Jekyll. Canonical and social-preview URLs use the
final custom domain.

## Other static hosts

Publish the files listed above as static files. Leave the install and build
commands empty. The site needs no environment variables, rewrites, server
functions or network API. `404.html` is a standalone fallback; select it as the
not-found page if the host requires it.
