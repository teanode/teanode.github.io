#!/usr/bin/env node
'use strict'

// Turns the page vite emits into the two the site serves.
//
// vite builds static/index.html from _app/index.html, replacing the entry
// module with the hashed bundle it just wrote and adding the stylesheet beside
// it. This strips the comments and indentation, which are there for whoever
// edits the template rather than for the browser, and writes the result to the
// repository root.
//
// 404.html gets the same bytes. Routing is done in the browser by the history
// API, so a path this script has not written a file for is one GitHub Pages
// does not have, and what it serves for those is 404.html. Handing it the
// application means a deep link opens the page rather than GitHub's own
// not-found notice. It is written from the same string as index.html rather
// than copied afterwards, so the two cannot come to point at different
// bundles.
//
// This is only how teanode.github.io behaves. teanode.com is fronted by a
// CloudFront distribution that answers any 404 from the origin with / as a
// 200, so there the file is never reached.
//
// The documents get a page each: doc.html for /doc, and doc/<slug>.html for
// /doc/<slug>, which GitHub Pages serves at the address without the extension.
// Each is the same page again with the title, description and address of that
// document in the head, in English. The application ignores the head and
// renders the document as before; the difference is what a crawler sees. One
// that does not run the application, which is every link unfurler, would
// otherwise show the front page's title and words for a link to any document.
// The files are named with an extension rather than as doc/<slug>/index.html
// because GitHub Pages answers a directory without a trailing slash with a
// redirect to one, and the canonical address has no slash.

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SOURCE = path.join(ROOT, 'static', 'index.html')
const OUTPUTS = [path.join(ROOT, 'index.html'), path.join(ROOT, '404.html')]
const DOCS = path.join(ROOT, 'data', 'docs.json')
// The canonical host, as components/canonical.tsx and sitemap.js have it. A
// preview image has to be an absolute address: the unfurler fetching it is
// not on this site.
const SITE = 'https://teanode.com'

const escape = (text) => text
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

// Rewrites one head tag's value. The tag has to be there already: index.html
// is where the set of tags is decided, and a page that silently lacked one
// would be a page whose preview quietly fell back to the front page's.
const replaceTag = (html, pattern, value) => {
  if (!pattern.test(html)) {
    throw new Error(`static/index.html has no ${pattern}; the head in _app/index.html changed`)
  }
  return html.replace(pattern, (match, before, _old, after) => `${before}${value}${after}`)
}

// The head, with a document's own words in place of the front page's.
const headed = (html, { title, description, url, type }) => {
  let page = html
  page = replaceTag(page, /(<title>)([^<]*)(<\/title>)/, escape(title))
  page = replaceTag(page, /(<meta name="description" content=")([^"]*)(")/, escape(description))
  page = replaceTag(page, /(<link rel="canonical" href=")([^"]*)(")/, url)
  page = replaceTag(page, /(<meta property="og:type" content=")([^"]*)(")/, type)
  page = replaceTag(page, /(<meta property="og:url" content=")([^"]*)(")/, url)
  page = replaceTag(page, /(<meta property="og:title" content=")([^"]*)(")/, escape(title))
  page = replaceTag(page, /(<meta property="og:description" content=")([^"]*)(")/, escape(description))
  page = replaceTag(page, /(<meta name="twitter:title" content=")([^"]*)(")/, escape(title))
  page = replaceTag(page, /(<meta name="twitter:description" content=")([^"]*)(")/, escape(description))
  return page
}

const minify = (html) => html
  // HTML comments explain the markup to whoever edits it, and the browser has
  // no use for them. This only matches <!-- -->, so the // comments inside the
  // inline theme script are left alone; do not widen it to JavaScript comments.
  .replace(/<!--[\s\S]*?-->/g, '')
  // Collapse the indentation, but leave the newlines inside script bodies
  // alone: without semicolon-perfect source, joining those lines can change
  // what they mean.
  .replace(/^[ \t]+/gm, '')
  .replace(/\n{2,}/g, '\n')
  .replace(/>\n</g, '><')
  .trim() + '\n'

if (!fs.existsSync(SOURCE)) {
  throw new Error('no static/index.html; run `npm run build` in _app/, which runs vite before this')
}

const html = minify(fs.readFileSync(SOURCE, 'utf8'))

// Deliberately not anchored to /static/: the check below wants to tell the
// difference between "this page names no bundle at all" and "this page names
// one, but under a prefix we are not looking for", and those want different
// messages.
const bundle = (html.match(/["'][^"']*\/(teanode\.[^"'/]+\.js)["']/) || [])[1]
if (!bundle) {
  throw new Error('static/index.html names no entry bundle')
}

// The page vite wrote is untracked, so checking out another branch swaps the
// tracked files under static/ and leaves it naming what the other branch
// built. Writing that out would produce a site that loads nothing, or loads
// unstyled, and would say it succeeded. Every reference is checked, not just
// the bundle: the stylesheet is named only here.
const referenced = [...html.matchAll(/["'](?:\/static\/)([^"']+)["']/g)].map(match => match[1])

if (!referenced.includes(bundle)) {
  throw new Error(
    'found no /static/ references in static/index.html, so nothing was checked. ' +
    "vite's base is probably no longer /static/; fix the pattern here to match it."
  )
}

const missing = referenced.filter(name => !fs.existsSync(path.join(ROOT, 'static', name)))
if (missing.length) {
  throw new Error(
    `static/index.html names ${missing.join(', ')}, which ${missing.length > 1 ? 'are' : 'is'} ` +
    'not in static/. It is left over from another build; run `npm run build` in _app/.'
  )
}

// vite rewrote the preview image to its hashed name under /static/, as a
// path. Only now, after the check above has seen it as one, does it become
// the absolute address an unfurler needs.
const absolute = html.replace(
  /(<meta (?:property="og:image"|name="twitter:image") content=")(\/static\/[^"]+)(")/g,
  (match, before, href, after) => `${before}${SITE}${href}${after}`,
)
if (absolute === html) {
  throw new Error('static/index.html names no preview image under /static/; _app/index.html should have og:image and twitter:image')
}

for (const output of OUTPUTS) {
  fs.writeFileSync(output, absolute)
}

const docs = JSON.parse(fs.readFileSync(DOCS, 'utf8'))
const pages = [
  {
    output: path.join(ROOT, 'doc.html'),
    title: 'Documentation - TeaNode',
    description: 'How to install, configure and run TeaNode, and what is inside it.',
    url: `${SITE}/doc`,
    type: 'website',
  },
  ...docs.map((doc) => ({
    output: path.join(ROOT, 'doc', `${doc.slug}.html`),
    // The same title the application sets once it has rendered the document.
    title: `${doc.title.en} - TeaNode`,
    description: doc.description.en,
    url: `${SITE}/doc/${doc.slug}`,
    type: 'article',
  })),
]

// A document taken out of the index takes its page with it, so that the
// address does not go on answering with a head for something that is gone.
fs.rmSync(path.join(ROOT, 'doc'), { recursive: true, force: true })
fs.mkdirSync(path.join(ROOT, 'doc'))
for (const page of pages) {
  fs.writeFileSync(page.output, headed(absolute, page))
}

// Deliberately left where vite wrote it, so this can be run again without a
// rebuild. .gitignore keeps it uncommitted, so nothing serves it.

const names = OUTPUTS.map(output => path.basename(output)).join(' and ')
console.log(`wrote ${names} and ${pages.length} document pages for ${bundle} (${absolute.length} bytes)`)
