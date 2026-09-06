#!/usr/bin/env node
'use strict'

// Writes sitemap.txt from the document index, so that a document added to
// data/docs.json is listed without anybody remembering a second file.
//
// One address per document, under the canonical host. teanode.github.io
// serves the same pages and is not listed: it is the origin behind
// teanode.com, and components/canonical.tsx says which address is the real
// one.

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SITE = 'https://teanode.com'

const docs = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'docs.json'), 'utf8'))

const addresses = [
  `${SITE}/`,
  ...docs.map((doc) => `${SITE}/doc/${doc.slug}`),
]

fs.writeFileSync(path.join(ROOT, 'sitemap.txt'), addresses.join('\n') + '\n')
console.log(`wrote sitemap.txt with ${addresses.length} addresses`)
