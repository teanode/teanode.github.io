# CLAUDE.md

Guidance for Claude Code working in this repository.

This file lives in `_app/` rather than the repository root because GitHub
Pages serves the root. See "What the public can read" below.

## What this is

teanode.com: the front page and the documentation for TeaNode, the mail
server at github.com/ziyan/teanode. A single page React application, built
by Vite, served as static files by GitHub Pages from `main`, and fronted by a
CloudFront distribution that answers for teanode.com with teanode.github.io as
its origin.

The design is the dashboard's. The tokens in `theme.ts` are copied from
`web/src/style.css` in the server repository, and the shape of the
documentation pages — a rail on the left, the document in the middle, "On
this page" on the right — follows the sibling project this frontend was
copied from. When the dashboard's look changes, change `theme.ts` to match;
do not invent a second palette here.

## What the public can read

GitHub Pages runs Jekyll over the repository, and Jekyll omits anything whose
name starts with `_` or `.`. That is the only thing keeping sources out of the
served site:

| Path | Served |
| --- | --- |
| `index.html`, `404.html`, `favicon.*`, `robots.txt`, `sitemap.txt` | yes |
| `doc.html`, `doc/` | yes: the application again, one page per document |
| `static/`, `data/` | yes, including every document |
| `_app/`, `_bin/`, `.github/` | no |

Anything added at the root is public. Anything the site fetches at runtime has
to be public, which is why `data/` is.

A markdown file under `data/docs/` must not begin with `---`: Jekyll would
read that as front matter and convert the file rather than copy it.

## Pictures

Every picture goes through the build, so it is served from `/static/` under
a name carrying a content hash: cached for a year, and replaced by a new name
when it changes. Nothing is served from an unhashed path that could go stale
in a cache. Do not add a `media/` directory back.

The dashboard screenshots are `assets/screenshots/<page>.<theme>.<language>.jpg`,
one per page, theme and language, 1505 by 812 at twice that resolution.
`screenshots.ts` finds them by name and falls back to English for a language
that has not been photographed. The front page's carousel shows them, and a
document names one as `<img src="screenshot:<page>">`, which the markdown
component resolves to the picture for the theme and language being read in.

The five pages are the mailbox with a message open, mailbox settings' mail
programs tab, people and access, a domain's aliases, and a domain's DNS
records.

Take them from a server of your own, never from one somebody is working in:
a released binary against a throwaway database, on ports of its own. The
fixture is one domain, `example.com`; an account with a mailbox named "Ada at
example.com"; aliases of every kind, so the routing story is visible; a
second and third account in a group with the Operator role tied to that
domain; and a mailbox filled over IMAP, because a message cannot be delivered
from a reserved example domain — every one of them publishes a null MX and a
DMARC policy of `reject`, and the server is right to refuse them. An app
password signs the IMAP session in.

Two things are set so the pictures show what a real deployment shows rather
than a development one. Point `resolver.externalAddressServices` at something
that answers with the documentation address 203.0.113.10, so no real address
appears, and restart. Then store the standard ports in `listen` — 993, 143,
587 — after the server has bound its own high ones: the mail programs page
reads the stored configuration, and the running listeners are not disturbed.

Headless Chrome over the DevTools protocol takes them: set the
`teanode_session` cookie and the `teanode.theme` and `teanode.language`
storage keys, navigate, capture at 1505x812 with a device scale factor of 2.

## No external resources

Nothing on the critical path comes from a third party host. The typeface is
the system's, the icons are bundled, there is no analytics tag. Do not add a
font `<link>`, a CDN script, or a remote stylesheet.

The one request the site makes elsewhere is `components/release.tsx` asking
GitHub's API for the latest release tag, to show it as a pill on the front
page. It runs after the page has painted, is cached in session storage for an
hour, and its failure shows nothing rather than an error.

## Build

    cd _app
    npm ci
    npm run dev       # a dev server on 127.0.0.1:8890, serving data/ and media/ too
    npm run lint      # eslint and tsc; vite strips types and never checks them
    npm run build     # vite, then _bin/html.js, then _bin/sitemap.js

The build output is committed. `static/` holds the hashed bundle,
stylesheet and pictures; `index.html` and `404.html` at the root are written
from the page vite emits, the same bytes in both so a deep link opens the
application. `doc.html` and `doc/<slug>.html` are that page once more per
document, with the document's English title, description and address in the
head, so that a link to a document unfurls as that document: an unfurler does
not run the application. The preview picture is `assets/og.png`, 1200×630,
shared by every page; its address in the head is rewritten to the hashed name
under `/static/` by vite and made absolute by `_bin/html.js`. CI rebuilds and
refuses a commit whose committed output does not match.

## Languages

English, Simplified Chinese and Japanese. The interface strings are one YAML
catalogue per language under `translations/`; a key missing from one falls
back to English. The reader's choice is kept under the dashboard's own
storage key (`teanode.language`), and the browser's language is the default.

A document exists per language it has been written in. The index names the
file per language, and a document without a translation shows the English
text under a translated title, which is the honest state of most of them.
The documents copied from the server repository are English only, on
purpose: a translation of a copy would drift from the copy.

## Documents

`data/docs.json` is the index: one entry per document with `group`, `title`,
`description` and `filename`, each keyed by language. `data/docs/<language>/`
holds the content. Adding a document is one file and one entry. The rail
searches over title and description in the browser.

Most documents are copies from the server repository, made by

    node _bin/docs.js          # reads ../../ziyan/teanode, or $TEANODE

which drops each file's H1 and rewrites links between documents to pages
here. Do not edit those copies by hand; edit the repository and run the
script. `introduction.markdown`, `quick-start.markdown` and `deploying.markdown` are
written here, in every language, and so is the translated
`getting-started.markdown`.

Headings get ids from their text, so a link to a section is
`/doc/<slug>#<heading-as-kebab-case>`.

## Layout

    _app/              source; not served
      entry.tsx        mounts the app
      routes.ts        the three routes, and where the site points off itself
      theme.ts         the MUI theme, from the dashboard's tokens
      docs.ts          the document index and content, fetched at runtime
      i18n/            translation without a dependency
      translations/    one YAML catalogue per language
      components/
        shell.tsx      the rail frame for documents, the bar for the front page
        theme.ts       light / dark / system, persisted under the dashboard's key
        language.ts    which language, persisted the same way
        markdown.tsx   marked with highlight.js, and the styles for the result
        logo.tsx       the mark, from the dashboard
      pages/           one file per page
    _bin/              build scripts; not served
    data/              the documents, fetched at runtime
    doc.html, doc/     the application, one page per document, committed
    static/            build output, committed, pictures included

## Serving

teanode.com is a CloudFront distribution in the AWS account, with
teanode.github.io as a custom origin over HTTPS. `/static/*` is cached for a
year because every name there carries a content hash; `/data/*` and
everything else for a minute. A 404 from the origin is answered with `/` as a
200, which is what makes client side routing work through the CDN. The
GitHub Pages site itself serves `404.html`, which is the same application.
