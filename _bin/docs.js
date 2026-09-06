#!/usr/bin/env node
'use strict'

// Copies the documents that come from the server repository into data/docs,
// so that the site says what the repository says.
//
// The repository is the source of truth for everything it documents. This
// script reads a checkout of it -- TEANODE names the directory, and it
// defaults to the sibling checkout -- and writes each document listed below
// into data/docs/en/, with two changes:
//
//   - the H1 is dropped, because the page shows the title from docs.json
//   - links between documents become links between pages here
//
// Documents not listed here are written by hand in data/docs/en/ and are
// left alone: introduction.markdown and deploying.markdown.
//
// Run it after pulling the repository, then `npm run build` and commit.

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SOURCE = process.env.TEANODE || path.join(ROOT, '..', '..', 'ziyan', 'teanode')
const OUTPUT = path.join(ROOT, 'data', 'docs', 'en')

// Repository path -> page slug. The slug is also the output filename.
const documents = {
  'docs/getting-started.md': 'getting-started',
  'docs/configuration.md': 'configuration',
  'docs/reference/command-line.md': 'command-line',
  'SECURITY.md': 'security',
  'docs/security/security-review.md': 'security-review',
  'CONTRIBUTING.md': 'contributing',
  'docs/reference/local-development.md': 'local-development',
  'docs/reference/project-structure.md': 'project-structure',
}

// Where a mention of a repository file should point on the site. Both the
// markdown links and the backticked paths the documents use in prose.
const pages = {
  'docs/getting-started.md': '/doc/getting-started',
  'docs/configuration.md': '/doc/configuration',
  'docs/reference/command-line.md': '/doc/command-line',
  'docs/reference/local-development.md': '/doc/local-development',
  'docs/reference/project-structure.md': '/doc/project-structure',
  'docs/security/security-review.md': '/doc/security-review',
  'SECURITY.md': '/doc/security',
  'CONTRIBUTING.md': '/doc/contributing',
}

const repository = 'https://github.com/ziyan/teanode/blob/main/'

// A link written relative to the document's own directory, resolved against
// the repository root, so `reference/command-line.md` in docs/ is found.
const resolveLink = (from, target) => {
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(from), target))
  return resolved.startsWith('../') ? target : resolved
}

const rewrite = (from, markdown) => {
  let text = markdown

  // The H1, and the blank line after it.
  text = text.replace(/^# .*\n+/, '')

  // Markdown links to a file in the repository: to a page here when there is
  // one, and to the file on GitHub when there is not.
  text = text.replace(/\]\(([^)\s#]+\.md)(#[^)]*)?\)/g, (whole, target, hash) => {
    const file = resolveLink(from, target)
    const page = pages[file]
    return page ? `](${page}${hash || ''})` : `](${repository}${file}${hash || ''})`
  })

  // A path in backticks that names another document becomes a link to it.
  // Written as `[`path`](page)` so the reader still sees where it lives in
  // the repository.
  text = text.replace(/`((?:docs\/[\w./-]+\.md)|SECURITY\.md|CONTRIBUTING\.md|AGENTS\.md)`/g, (whole, file) => {
    const page = pages[file]
    return page ? `[${whole}](${page})` : `[${whole}](${repository}${file})`
  })

  return text
}

if (!fs.existsSync(path.join(SOURCE, 'docs'))) {
  throw new Error(`no server checkout at ${SOURCE}; set TEANODE to one`)
}

fs.mkdirSync(OUTPUT, { recursive: true })

for (const [file, slug] of Object.entries(documents)) {
  const source = path.join(SOURCE, file)
  const markdown = fs.readFileSync(source, 'utf8')
  const output = path.join(OUTPUT, `${slug}.markdown`)
  fs.writeFileSync(output, rewrite(file, markdown))
  console.log(`${file} -> data/docs/en/${slug}.markdown`)
}
