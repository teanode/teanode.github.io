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
| `static/`, `media/`, `data/` | yes, including every document |
| `_app/`, `_bin/`, `.github/` | no |

Anything added at the root is public. Anything the site fetches at runtime has
to be public, which is why `data/` is.

A markdown file under `data/docs/` must not begin with `---`: Jekyll would
read that as front matter and convert the file rather than copy it.

## No external resources

Nothing on the critical path comes from a third party host. The typeface is
the system's, the icons are bundled, there is no analytics tag. Do not add a
font `<link>`, a CDN script, or a remote stylesheet.

## Build

    cd _app
    npm ci
    npm run dev       # a dev server on 127.0.0.1:8890, serving data/ and media/ too
    npm run lint      # eslint and tsc; vite strips types and never checks them
    npm run build     # vite, then _bin/html.js, then _bin/sitemap.js

The build output is committed. `static/` holds the hashed bundle and
stylesheet; `index.html` and `404.html` at the root are written from the page
vite emits, the same bytes in both so a deep link opens the application. CI
rebuilds and refuses a commit whose committed output does not match.

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
script. `introduction.markdown` and `deploying.markdown` are written here, in every
language, and so is the translated `getting-started.markdown`.

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
    media/             pictures
    static/            build output, committed

## Serving

teanode.com is a CloudFront distribution in the AWS account, with
teanode.github.io as a custom origin over HTTPS. `/static/*` is cached for a
year because every name there carries a content hash; `/media/*` for a day;
everything else for a minute. A 404 from the origin is answered with `/` as a
200, which is what makes client side routing work through the CDN. The
GitHub Pages site itself serves `404.html`, which is the same application.
