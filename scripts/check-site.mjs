// Static checks for the published site. Node built-ins only.
//   node scripts/check-site.mjs             internal links, assets, accessibility basics
//   node scripts/check-site.mjs --external  also request every external link
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allPages, canonicalUrl, origin } from './site.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const external = process.argv.includes('--external');
const errors = [];
const fail = (file, message) => errors.push(`${file}: ${message}`);

const publishedHtml = ['404.html', ...allPages.map((page) => page.path)];
const read = (file) => readFileSync(path.join(root, file), 'utf8');

function decode(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function parseAttributes(source) {
  const attributes = {};
  for (const match of source.matchAll(/([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    attributes[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

function tags(html) {
  const result = [];
  const source = html.replace(/<!--[\s\S]*?-->/g, (comment) => ' '.repeat(comment.length));
  for (const match of source.matchAll(/<([a-zA-Z][\w-]*)(\s[^<>]*?)?\s*\/?>/g)) {
    result.push({ name: match[1].toLowerCase(), attrs: parseAttributes(match[2] ?? ''), index: match.index });
  }
  return result;
}

const textContent = (fragment) => decode(fragment.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

const idsCache = new Map();
function idsOf(file) {
  if (!idsCache.has(file)) idsCache.set(file, new Set(tags(read(file)).filter((tag) => tag.attrs.id).map((tag) => tag.attrs.id)));
  return idsCache.get(file);
}

const externalLinks = new Map();

function checkReference(file, value, kind) {
  if (!value || value.startsWith('mailto:') || value.startsWith('data:')) return;
  // Absolute links to this site (used by 404.html) are checked like internal ones.
  const sameOrigin = value === origin || value.startsWith(`${origin}/`) || value.startsWith(`${origin}#`);
  if (!sameOrigin && (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//'))) {
    if (value.startsWith('http://')) fail(file, `insecure URL ${value}`);
    if (kind !== 'link') fail(file, `external resource ${value}; bundle it locally instead`);
    else {
      if (!externalLinks.has(value)) externalLinks.set(value, new Set());
      externalLinks.get(value).add(file);
    }
    return;
  }
  if (!sameOrigin && value.startsWith('/')) {
    fail(file, `root-relative URL ${value}; use a relative path`);
    return;
  }
  const [target, hash] = (sameOrigin ? value.slice(origin.length) : value).split('#');
  let resolved = sameOrigin
    ? path.posix.normalize(`.${target || '/'}`).replace(/^\.\/?/, '')
    : target ? path.posix.normalize(path.posix.join(path.posix.dirname(file), target)) : file;
  if (sameOrigin && (resolved === '' || resolved.endsWith('/'))) resolved = `${resolved}index.html`;
  if (resolved.startsWith('..')) {
    fail(file, `${value} points outside the site`);
    return;
  }
  const absolute = path.join(root, resolved);
  if (existsSync(absolute) && statSync(absolute).isDirectory()) resolved = path.posix.join(resolved, 'index.html');
  if (!existsSync(path.join(root, resolved))) {
    fail(file, `broken ${kind} ${value}`);
    return;
  }
  if (!publishedFile(resolved)) fail(file, `${value} is not part of the published site`);
  if (hash && resolved.endsWith('.html') && !idsOf(resolved).has(hash)) fail(file, `missing anchor ${value}`);
}

function publishedFile(file) {
  return publishedHtml.includes(file) || file.startsWith('assets/') || ['robots.txt', 'sitemap.xml'].includes(file);
}

function checkPage(file) {
  const html = read(file);
  const all = tags(html);
  const byName = (name) => all.filter((tag) => tag.name === name);

  if (!/^<!doctype html>/i.test(html)) fail(file, 'missing <!doctype html>');
  const htmlTag = byName('html')[0];
  if (!htmlTag?.attrs.lang) fail(file, '<html> needs a lang attribute');
  const title = html.match(/<title>([\s\S]*?)<\/title>/);
  if (!title || !textContent(title[1])) fail(file, 'missing <title>');
  const viewport = byName('meta').find((tag) => tag.attrs.name === 'viewport');
  if (!viewport) fail(file, 'missing viewport meta');
  else if (/user-scalable\s*=\s*no|maximum-scale/i.test(viewport.attrs.content)) fail(file, 'viewport must allow zooming');
  if (byName('script').length) fail(file, 'scripts are not allowed; the site has no JavaScript');
  if (all.some((tag) => tag.attrs.target === '_blank')) fail(file, 'do not open links in new windows');

  if (byName('main').length !== 1) fail(file, 'needs exactly one <main>');
  const mainTag = byName('main')[0];
  const skip = byName('a').find((tag) => tag.attrs.class === 'skip-link');
  if (file !== '404.html' && (!skip || skip.attrs.href !== `#${mainTag?.attrs.id}`)) fail(file, 'skip link must target <main>');

  const ids = all.filter((tag) => tag.attrs.id).map((tag) => tag.attrs.id);
  for (const id of new Set(ids.filter((id, index) => ids.indexOf(id) !== index))) fail(file, `duplicate id "${id}"`);
  for (const tag of all) {
    for (const attr of ['aria-labelledby', 'aria-describedby']) {
      for (const ref of (tag.attrs[attr] ?? '').split(/\s+/).filter(Boolean)) {
        if (!ids.includes(ref)) fail(file, `${attr} references missing id "${ref}"`);
      }
    }
  }

  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)];
  if (headings.filter((heading) => heading[1] === '1').length !== 1) fail(file, 'needs exactly one <h1>');
  let previous = 0;
  for (const heading of headings) {
    const level = Number(heading[1]);
    if (previous && level > previous + 1) fail(file, `heading level skips from h${previous} to h${level}: "${textContent(heading[2])}"`);
    if (!textContent(heading[2])) fail(file, `empty h${level}`);
    previous = level;
  }

  for (const img of byName('img')) {
    if (!('alt' in img.attrs)) fail(file, `<img src="${img.attrs.src}"> needs an alt attribute`);
    if (!img.attrs.width || !img.attrs.height) fail(file, `<img src="${img.attrs.src}"> needs width and height`);
  }

  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const attrs = parseAttributes(match[1]);
    const name = attrs['aria-label'] || textContent(match[2]) || [...match[2].matchAll(/alt="([^"]+)"/g)].map((alt) => alt[1]).join(' ');
    if (!name) fail(file, `link to ${attrs.href} has no accessible name`);
    if (!('href' in attrs)) fail(file, 'link without href');
  }

  for (const th of byName('th')) if (!th.attrs.scope) fail(file, '<th> needs a scope attribute');
  for (const region of all.filter((tag) => tag.attrs.tabindex === '0' && tag.name === 'div')) {
    if (region.attrs.role !== 'region' || !region.attrs['aria-label']) fail(file, 'scrollable regions need role="region" and an aria-label');
  }

  for (const tag of all) {
    if (tag.name === 'a' && 'href' in tag.attrs) checkReference(file, tag.attrs.href, 'link');
    if (tag.name === 'link' && tag.attrs.rel !== 'canonical') checkReference(file, tag.attrs.href, 'resource');
    if (['img', 'source', 'script', 'iframe', 'video', 'audio'].includes(tag.name)) {
      if (tag.attrs.src !== undefined) checkReference(file, tag.attrs.src, 'resource');
      for (const candidate of (tag.attrs.srcset ?? '').split(',').map((entry) => entry.trim().split(/\s+/)[0]).filter(Boolean)) {
        checkReference(file, candidate, 'resource');
      }
    }
  }

  const page = allPages.find((entry) => entry.path === file);
  if (page) {
    const canonical = byName('link').find((tag) => tag.attrs.rel === 'canonical');
    if (canonical?.attrs.href !== canonicalUrl(file)) fail(file, `canonical URL must be ${canonicalUrl(file)}`);
  } else if (!byName('meta').some((tag) => tag.attrs.name === 'robots' && tag.attrs.content.includes('noindex'))) {
    fail(file, 'pages outside the sitemap need <meta name="robots" content="noindex">');
  }
}

function checkCss() {
  const css = read('assets/styles.css');
  for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    if (/^(https?:)?\/\//.test(match[1])) fail('assets/styles.css', `external resource ${match[1]}`);
    else if (!match[1].startsWith('data:') && !existsSync(path.join(root, 'assets', match[1]))) fail('assets/styles.css', `missing ${match[1]}`);
  }
  if (/@import/.test(css)) fail('assets/styles.css', '@import is not allowed');

  const tokens = (block) => Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map((match) => [match[1], match[2]]));
  const light = tokens(css.match(/:root\s*\{([\s\S]*?)\n\}/)[1]);
  const dark = { ...light, ...tokens(css.match(/prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([\s\S]*?)\}/)[1]) };
  const pairs = [
    ['ink', 'paper', 4.5], ['ink', 'surface', 4.5], ['muted', 'paper', 4.5], ['muted', 'surface', 4.5],
    ['ember-text', 'paper', 4.5], ['ember-text', 'surface', 4.5], ['ember-text', 'ember-soft', 4.5],
    ['on-ember', 'ember-text', 4.5], ['teal', 'paper', 4.5], ['teal', 'surface', 4.5], ['teal', 'teal-soft', 4.5],
    ['amber-text', 'amber-soft', 4.5], ['crimson', 'crimson-soft', 4.5], ['info', 'info-soft', 4.5],
    ['ink', 'code-bg', 4.5], ['ink', 'info-soft', 4.5], ['ink', 'amber-soft', 4.5], ['ink', 'ember-soft', 4.5],
    ['ink', 'crimson-soft', 4.5], ['ink', 'teal-soft', 4.5], ['focus', 'paper', 3], ['focus', 'surface', 3],
  ];
  const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
      .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
  };
  for (const [scheme, palette] of [['light', light], ['dark', dark]]) {
    for (const [fg, bg, minimum] of pairs) {
      if (!palette[fg] || !palette[bg]) {
        fail('assets/styles.css', `missing colour token --${!palette[fg] ? fg : bg}`);
        continue;
      }
      const value = ratio(palette[fg], palette[bg]);
      if (value < minimum) fail('assets/styles.css', `${scheme}: --${fg} on --${bg} contrast ${value.toFixed(2)} < ${minimum}`);
    }
  }
}

function checkSiteFiles() {
  const host = new URL(origin).host;
  if (read('CNAME').trim() !== host) fail('CNAME', `must contain ${host}`);
  if (!existsSync(path.join(root, '.nojekyll'))) fail('.nojekyll', 'missing');
  if (!read('robots.txt').includes(`Sitemap: ${origin}/sitemap.xml`)) fail('robots.txt', 'must reference the sitemap');
  const sitemap = read('sitemap.xml');
  for (const page of allPages) if (!sitemap.includes(`<loc>${canonicalUrl(page.path)}</loc>`)) fail('sitemap.xml', `missing ${canonicalUrl(page.path)}`);

  const referenced = new Set();
  for (const file of publishedHtml) {
    for (const match of read(file).matchAll(/(?:src|href|srcset)="([^"#]+)/g)) {
      if (!/^[a-z]+:/i.test(match[1])) referenced.add(path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1])));
    }
  }
  referenced.add('assets/social.png');
  const walk = (dir) => readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]);
  for (const asset of walk('assets')) {
    if (/\.(png|svg|jpe?g|webp|avif|gif|css)$/i.test(asset) && !referenced.has(asset)) fail(asset, 'is not used by any page');
  }
}

async function checkExternal() {
  const timeout = 15000;
  const request = async (url, method) => {
    const response = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(timeout), headers: { 'user-agent': 'fiscal-fox-website-link-check' } });
    await response.body?.cancel();
    return response.status;
  };
  for (const [url, files] of externalLinks) {
    let status = 0;
    let error = '';
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        status = await request(url, 'HEAD');
        if (status === 405 || status === 403) status = await request(url, 'GET');
        if (status < 400) break;
      } catch (caught) {
        error = caught.cause?.code ?? caught.name ?? String(caught);
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
    if (status >= 200 && status < 400) console.log(`ok ${status} ${url}`);
    else fail([...files].join(', '), `external link ${url} failed (${status || error})`);
  }
}

for (const file of publishedHtml) checkPage(file);
checkCss();
checkSiteFiles();
if (external) await checkExternal();

if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`);
  console.error(`${errors.length} problem(s) found`);
  process.exit(1);
}
console.log(`site ok: ${publishedHtml.length} pages checked${external ? `, ${externalLinks.size} external links reachable` : ''}`);
