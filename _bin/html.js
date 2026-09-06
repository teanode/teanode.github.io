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
// API, so every path other than / is a file GitHub Pages does not have, and
// what it serves for those is 404.html. Handing it the application means a
// deep link opens the page rather than GitHub's own not-found notice. It is
// written from the same string as index.html rather than copied afterwards, so
// the two cannot come to point at different bundles.
//
// This is only how teanode.github.io behaves. teanode.com is fronted by a
// CloudFront distribution that answers any 404 from the origin with / as a
// 200, so there the file is never reached.

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SOURCE = path.join(ROOT, 'static', 'index.html')
const OUTPUTS = [path.join(ROOT, 'index.html'), path.join(ROOT, '404.html')]

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

for (const output of OUTPUTS) {
  fs.writeFileSync(output, html)
}

// Deliberately left where vite wrote it, so this can be run again without a
// rebuild. .gitignore keeps it uncommitted, so nothing serves it.

const names = OUTPUTS.map(output => path.basename(output)).join(' and ')
console.log(`wrote ${names} for ${bundle} (${html.length} bytes)`)
