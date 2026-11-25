// Regenerates the shared page shell (head, header, navigation, footer) and
// sitemap.xml around each page's hand-written content. Node built-ins only.
//   node scripts/layout.mjs          rewrite pages and sitemap.xml
//   node scripts/layout.mjs --check  fail if anything is out of date
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allPages, canonicalUrl, docsAsOf, home, origin, sections } from './site.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const START = '<!-- content:start -->';
const END = '<!-- content:end -->';

const escapeHtml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Relative URL from one site file to another, so pages also work from disk
// and under a repository path.
function to(fromPath, target) {
  const [file, hash] = target.split('#');
  const rel = path.posix.relative(path.posix.dirname(fromPath), file) || path.posix.basename(file);
  return hash ? `${rel}#${hash}` : rel;
}

function currentAttr(linkPath, page) {
  if (linkPath === page.path) return ' aria-current="page"';
  if (page.section && linkPath === page.section.pages[0].path) return ' aria-current="true"';
  return '';
}

function head(page) {
  const asset = (file) => to(page.path, file);
  const title = page === home ? page.title : `${page.title} | Fiscal Fox`;
  const url = canonicalUrl(page.path);
  return `  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#f6f5f2" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#101318" media="(prefers-color-scheme: dark)">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Fiscal Fox">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${origin}/assets/social.png">
  <meta property="og:image:alt" content="The Fiscal Fox logo, a fox with euro signs for eyes, next to the words Fiscal Fox.">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="${asset('assets/favicon.svg')}" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${asset('assets/apple-touch-icon.png')}">
  <link rel="stylesheet" href="${asset('assets/styles.css')}">`;
}

function header(page) {
  const link = (href, label, attrs = '') => `<a href="${href}"${attrs}>${label}</a>`;
  const nav = [
    link(to(page.path, 'index.html#features'), 'Features'),
    ...sections.map((section) => link(to(page.path, section.pages[0].path), section.label, currentAttr(section.pages[0].path, page))),
    link('https://finance.synctune.it', 'Synctune Finance <span class="arrow" aria-hidden="true">&#8599;</span>'),
  ];
  return `  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="${to(page.path, 'index.html')}"${page === home ? ' aria-current="page"' : ''}><img src="${to(page.path, 'assets/favicon.svg')}" alt="" width="40" height="40"><span>Fiscal Fox</span></a>
      <nav class="site-nav" aria-label="Main">
        ${nav.join('\n        ')}
      </nav>
    </div>
  </header>`;
}

function breadcrumb(page) {
  const items = [`<li><a href="${to(page.path, 'index.html')}">Home</a></li>`];
  const sectionIndex = page.section.pages[0];
  if (page.path === sectionIndex.path) {
    items.push(`<li><span aria-current="page">${escapeHtml(page.section.label)}</span></li>`);
  } else {
    items.push(`<li><a href="${to(page.path, sectionIndex.path)}">${escapeHtml(page.section.label)}</a></li>`);
    items.push(`<li><span aria-current="page">${escapeHtml(page.nav ?? page.title)}</span></li>`);
  }
  return `      <nav class="breadcrumb" aria-label="Breadcrumb">
        <ol>
          ${items.join('\n          ')}
        </ol>
      </nav>`;
}

function pager(page) {
  const pages = page.section.pages;
  const index = pages.findIndex((candidate) => candidate.path === page.path);
  const links = [];
  if (index > 0) {
    const prev = pages[index - 1];
    links.push(`<a class="pager-prev" href="${to(page.path, prev.path)}" rel="prev"><span class="pager-label">Previous</span> ${escapeHtml(prev.nav ?? prev.title)}</a>`);
  }
  if (index < pages.length - 1) {
    const next = pages[index + 1];
    links.push(`<a class="pager-next" href="${to(page.path, next.path)}" rel="next"><span class="pager-label">Next</span> ${escapeHtml(next.nav ?? next.title)}</a>`);
  }
  return `      <nav class="pager" aria-label="Previous and next pages">
        ${links.join('\n        ')}
      </nav>`;
}

function docsNav(page) {
  const groups = sections.map((section) => {
    const items = section.pages
      .map((entry) => `<li><a href="${to(page.path, entry.path)}"${entry.path === page.path ? ' aria-current="page"' : ''}>${escapeHtml(entry.nav ?? entry.title)}</a></li>`)
      .join('\n          ');
    return `      <p class="docs-nav-title" id="nav-${section.id}">${escapeHtml(section.label)}</p>
      <ul aria-labelledby="nav-${section.id}">
          ${items}
      </ul>`;
  });
  return `    <nav class="docs-nav" aria-label="Documentation">
${groups.join('\n')}
    </nav>`;
}

function footer(page) {
  const link = (file) => to(page.path, file);
  return `  <footer class="site-footer">
    <div class="wrap footer-top">
      <div class="footer-about">
        <a class="brand" href="${link('index.html')}"><img src="${link('assets/favicon.svg')}" alt="" width="32" height="32"><span>Fiscal Fox</span></a>
        <p>Self-hosted accounting for small businesses. A <a href="https://finance.synctune.it">Synctune Finance</a> project.</p>
      </div>
      <nav class="footer-links" aria-label="Footer">
        <a href="${link('manual/index.html')}">User manual</a>
        <a href="${link('self-hosting/index.html')}">Self-hosting</a>
        <a href="https://synctune.it">Synctune</a>
      </nav>
    </div>
    <div class="wrap footer-bottom">
      <p>Documentation as of ${docsAsOf}. Not financial, tax or legal advice.</p>
      <details class="privacy">
        <summary>No cookies. No tracking.</summary>
        <p>This website uses no analytics, cookies, scripts, web fonts or third-party widgets. Images and styles are local files. The hosting provider may process standard request data. Linked websites have their own privacy policies.</p>
      </details>
    </div>
  </footer>`;
}

function render(page, content) {
  const body =
    page === home
      ? `${header(page)}
  <main id="main" tabindex="-1">
${START}
${content}
${END}
  </main>
${footer(page)}`
      : `${header(page)}
  <div class="wrap docs-layout">
    <main id="main" class="docs-main" tabindex="-1">
${breadcrumb(page)}
      <article class="prose">
${START}
${content}
${END}
      </article>
${pager(page)}
    </main>
${docsNav(page)}
  </div>
${footer(page)}`;
  return `<!doctype html>
<html lang="en">
<head>
${head(page)}
</head>
<body${page === home ? ' class="home"' : ''}>
${body}
</body>
</html>
`;
}

function extractContent(file, page) {
  if (!existsSync(file)) return `<h1>${escapeHtml(page.title)}</h1>`;
  const html = readFileSync(file, 'utf8');
  const start = html.indexOf(START);
  const end = html.indexOf(END);
  if (start === -1 || end === -1 || end < start) throw new Error(`${page.path}: missing ${START} / ${END} markers`);
  return html.slice(start + START.length, end).replace(/^\n/, '').replace(/\n$/, '');
}

function sitemap() {
  const urls = allPages.map((page) => `  <url><loc>${canonicalUrl(page.path)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

const problems = [];
const outputs = new Map();
for (const page of allPages) {
  const file = path.join(root, page.path);
  outputs.set(file, render(page, extractContent(file, page)));
}
outputs.set(path.join(root, 'sitemap.xml'), sitemap());

const listed = new Set(allPages.map((page) => page.path));
for (const dir of ['', ...sections.map((section) => section.id)]) {
  for (const name of readdirSync(path.join(root, dir))) {
    const rel = dir ? `${dir}/${name}` : name;
    if (name.endsWith('.html') && rel !== '404.html' && !listed.has(rel)) {
      problems.push(`${rel} is not listed in scripts/site.mjs`);
    }
  }
}

for (const [file, expected] of outputs) {
  const rel = path.relative(root, file);
  const actual = existsSync(file) ? readFileSync(file, 'utf8') : null;
  if (actual === expected) continue;
  if (check) problems.push(`${rel} is out of date; run node scripts/layout.mjs`);
  else {
    writeFileSync(file, expected);
    console.log(`updated ${rel}`);
  }
}

if (problems.length) {
  for (const problem of problems) console.error(`error: ${problem}`);
  process.exit(1);
}
console.log(check ? `layout ok: ${outputs.size} files up to date` : 'layout done');
