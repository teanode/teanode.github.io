#!/usr/bin/env node
'use strict'

// Puts each page's words into the page itself, and writes llms.txt.
//
// Every page html.js writes is the application with an empty mount point:
// until the bundle runs there is nothing on it but a title. A reader that
// does not run JavaScript sees exactly that, and those readers include the
// assistants people hand a link to ("install this for me") as well as search
// engines. So this fills the mount point with the same words the application
// will show: on a document's page the document, rendered from its markdown;
// on the front page what TeaNode is and where to start; and on each, the
// list of documents. The application replaces all of it when it mounts.
//
// The words are kept out of sight for the first two seconds, which is ample
// for the application to mount, so a reader with JavaScript never sees them
// flash. They are hidden by opacity, not by display or the hidden attribute,
// because readers that strip what is hidden look for those.
//
// llms.txt is the index an assistant looks for first: the same list of
// documents, each pointing at its markdown, which data/ already serves.
//
// Run after html.js, which writes the pages this fills in.

const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')

const ROOT = path.join(__dirname, '..')
const APP = path.join(ROOT, '_app')
const SITE = 'https://teanode.com'
const MOUNT = '<div id="teanode"></div>'

const yaml = require(path.join(APP, 'node_modules', 'js-yaml'))

const escape = (text) => text
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const STYLE = '<style>.teanode-static{max-width:760px;margin:0 auto;padding:24px 16px 48px;' +
  'font:16px/1.6 system-ui,sans-serif;opacity:0;animation:teanode-static 0s 2s forwards}' +
  '.teanode-static pre{overflow-x:auto}@keyframes teanode-static{to{opacity:1}}' +
  // The theme script in the head may already have darkened the page.
  '@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .teanode-static{color:#e8e8ea}' +
  ':root:not([data-theme=light]) .teanode-static a{color:#9ccc65}}' +
  ':root[data-theme=dark] .teanode-static{color:#e8e8ea}:root[data-theme=dark] .teanode-static a{color:#9ccc65}</style>'

const fill = (file, body) => {
  const html = fs.readFileSync(file, 'utf8')
  if (!html.includes(MOUNT)) {
    throw new Error(`${path.relative(ROOT, file)} has no empty ${MOUNT}; run html.js first, or the mount point in _app/index.html changed`)
  }
  fs.writeFileSync(file, html.replace(MOUNT, `<div id="teanode">${STYLE}<div class="teanode-static">${body}</div></div>`))
}

const main = async () => {
  const { marked } = await import(pathToFileURL(path.join(APP, 'node_modules', 'marked', 'lib', 'marked.esm.js')).href)
  const docs = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'docs.json'), 'utf8'))
  const words = yaml.load(fs.readFileSync(path.join(APP, 'translations', 'en.yaml'), 'utf8'))
  const welcome = words.welcome

  const markdownOf = (doc) => fs.readFileSync(path.join(ROOT, 'data', 'docs', doc.filename.en), 'utf8')
    // A dashboard picture is named by page and resolved by the application
    // for the reader's theme and language; without it there is no file.
    .replace(/<img src="screenshot:[^"]*"[^>]*>\n?/g, '')

  // The documents, in the rail's groups and order.
  const groups = []
  for (const doc of docs) {
    let group = groups.find((each) => each.name === doc.group.en)
    if (!group) {
      group = { name: doc.group.en, docs: [] }
      groups.push(group)
    }
    group.docs.push(doc)
  }
  const index = '<h2>Documentation</h2>' + groups.map((group) =>
    `<h3>${escape(group.name)}</h3><ul>` +
    group.docs.map((doc) => `<li><a href="/doc/${doc.slug}">${escape(doc.title.en)}</a>: ${escape(doc.description.en)}</li>`).join('') +
    '</ul>').join('') +
    '<p>Every document is also plain markdown, listed in <a href="/llms.txt">/llms.txt</a>.</p>'
  const home = `<p><a href="/">TeaNode</a> · <a href="/doc">Documentation</a> · <a href="https://github.com/ziyan/teanode">Source</a></p>`

  for (const doc of docs) {
    fill(path.join(ROOT, 'doc', `${doc.slug}.html`),
      home + `<h1>${escape(doc.title.en)}</h1>` + marked.parse(markdownOf(doc)) + index)
  }
  fill(path.join(ROOT, 'doc.html'), home + '<h1>TeaNode documentation</h1>' + index)

  const front = home +
    `<h1>TeaNode</h1><p><strong>${escape(welcome.headline)}</strong></p><p>${escape(welcome.lead)}</p>` +
    `<h2>${escape(welcome.lifeHeading)}</h2><ul>` +
    Object.values(welcome.life).map((area) => `<li><strong>${escape(area.title)}.</strong> ${escape(area.body)}</li>`).join('') +
    '</ul>' +
    `<h2>${escape(welcome.phone.heading)}</h2><p>${escape(welcome.phone.body)}</p><p>${escape(welcome.phone.availability)}.</p>` +
    `<h2>${escape(welcome.startHeading)}</h2><p>${escape(welcome.startLead)}</p><ul>` +
    `<li><strong>${escape(welcome.start.assistant.title)}.</strong> ${escape(welcome.start.assistant.note)}</li>` +
    `<li><strong>${escape(welcome.start.mail.title)}.</strong> ${escape(welcome.start.mail.note)}</li>` +
    `</ul><p><a href="/start">Get started</a> installs the assistant with one command, <code>curl -fsSL https://teanode.com/install.sh | sh</code>; the commands for both are in the <a href="/doc/quick-start">Quick start</a>.</p>` +
    `<h2>${escape(welcome.needHeading)}</h2><ul>` +
    Object.values(welcome.needs).map((need) => `<li>${escape(need)}</li>`).join('') +
    '</ul>' + index
  for (const name of ['index.html', '404.html']) {
    fill(path.join(ROOT, name), front)
  }

  // The get started page: the steps in words, since the video and the
  // pictures need the application.
  const start = words.start
  fill(path.join(ROOT, 'start.html'), home +
    `<h1>${escape(start.headline)}</h1><p>${escape(start.lead)}</p><ol>` +
    Object.entries(start.steps).map(([key, step]) =>
      `<li><strong>${escape(step.title)}.</strong> ${escape(step.body)}` +
      (key === 'install' ? '<pre><code>curl -fsSL https://teanode.com/install.sh | sh</code></pre>' : '') +
      (key === 'account' ? '<pre><code>ssh -L 8080:127.0.0.1:8080 you@your-server</code></pre>' : '') +
      ` ${escape(step.note)}</li>`).join('') +
    '</ol>' + index)

  const llms = [
    '# TeaNode',
    '',
    `> ${words.tagline}`,
    '',
    welcome.lead,
    '',
    `To install the assistant, run \`curl -fsSL ${SITE}/install.sh | sh\` on the computer it will live on, then follow the [Quick start](${SITE}/data/docs/en/quick-start.markdown) from step 2. The pages under ${SITE}/doc/ show the same documents once JavaScript runs; the links below are the markdown itself.`,
    '',
    ...groups.flatMap((group) => [
      `## ${group.name}`,
      '',
      ...group.docs.map((doc) => `- [${doc.title.en}](${SITE}/data/docs/${doc.filename.en}): ${doc.description.en}`),
      '',
    ]),
    '## Source',
    '',
    '- [github.com/ziyan/teanode](https://github.com/ziyan/teanode): the server, the dashboard and the iPhone app',
    '',
  ].join('\n')
  fs.writeFileSync(path.join(ROOT, 'llms.txt'), llms)

  console.log(`filled ${docs.length + 3} pages with their words and wrote llms.txt`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
