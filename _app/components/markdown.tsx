import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import { marked, type Tokens } from 'marked'

import { useLanguageCode } from '../i18n'
import { screenshot } from '../screenshots'
import { monospaceFamily, surfaces, syntax } from '../theme'
import { highlight } from './highlight'

// Markdown, rendered once per document, with an id on every heading so the
// list on the right of a document has something to point at.

export interface Heading {
  id: string
  text: string
  depth: number
}

// How far below the top of the window a heading comes to rest, and therefore
// where the line is that decides which section is being read. One number,
// used by the scroll margin, the jump, and the reading of it.
export const headingOffset = 32

export const renderMarkdown = (markdown: string): { html: string, headings: Heading[] } => {
  if (!markdown) {
    return { html: '', headings: [] }
  }
  const headings: Heading[] = []
  const taken = new Map<string, number>()
  const renderer = new marked.Renderer()

  // Coloured here rather than in the browser afterwards: the block is written
  // once per document.
  renderer.code = ({ text, lang }) => {
    const language = (lang ?? '').trim().split(/\s+/)[0]
    const coloured = highlight(text, language)
    const body = coloured || escapeHtml(text)
    const className = ['hljs', language && `language-${language}`].filter(Boolean).join(' ')
    return `<pre><code class="${className}">${body}</code></pre>\n`
  }

  renderer.image = ({ href, title, text }) =>
    `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}" loading="lazy"` +
    `${title ? ` title="${escapeHtml(title)}"` : ''}/>`

  // A paragraph holding one picture and nothing else is a figure, captioned
  // when the markdown gave it a title.
  renderer.paragraph = function paragraph({ tokens }) {
    const body = this.parser.parseInline(tokens)
    const only = tokens.length === 1 ? tokens[0] : undefined
    if (only?.type === 'image') {
      const image = only as Tokens.Image
      const caption = image.title ? `<figcaption>${escapeHtml(image.title)}</figcaption>` : ''
      return `<figure>${body}${caption}</figure>\n`
    }
    return `<p>${body}</p>\n`
  }

  renderer.heading = function heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens)
    const plain = tokens.map((token) => ('raw' in token ? token.raw : '')).join('')
      .replace(/`/g, '')
    const base = slugOf(plain) || `section-${headings.length + 1}`
    // Two headings with the same words would otherwise share an anchor, and
    // the second would be unreachable.
    const seen = taken.get(base) ?? 0
    taken.set(base, seen + 1)
    const id = seen === 0 ? base : `${base}-${seen + 1}`

    if (depth === 2 || depth === 3) {
      headings.push({ id, text: plain, depth })
    }
    return `<h${depth} id="${id}">${text}</h${depth}>\n`
  }

  // A link to another document is written as /doc/<slug> in the markdown and
  // stays a plain anchor: the router picks it up from the click.
  //
  // Rendered from markdown that ships with the site rather than from anything
  // a person submitted, which is why raw HTML is allowed through.
  const html = marked.parse(markdown, { async: false, gfm: true, renderer })
  return { html, headings }
}

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const slugOf = (value: string): string =>
  value.toLowerCase().trim()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)

// The document's own elements, styled from the theme. This is the one place
// the markup is not ours to put classes on.
export const Markdown = ({ html, compact }: { html: string, compact?: boolean }) => {
  const theme = useTheme()
  const language = useLanguageCode()
  const mode = theme.palette.mode === 'dark' ? 'dark' : 'light'
  const surface = surfaces(mode)
  const token = syntax(mode)

  // A document names a picture of the dashboard as `screenshot:<page>`, and
  // the picture shown is the one for the theme and language being read in.
  // Done here, on each render, because the theme can change under a
  // document that was rendered once.
  const resolved = html.replace(/src="screenshot:([\w-]+)"/g, (whole, page: string) => {
    const source = screenshot(page, mode, language)
    return source ? `src="${source}"` : whole
  })

  return (
    <Box
      dangerouslySetInnerHTML={{ __html: resolved }}
      sx={{
        color: 'text.primary',
        lineHeight: 1.7,
        fontSize: 15,
        '& > :first-of-type': { mt: 0 },
        '& > :last-child': { mb: 0 },
        '& h1': { fontSize: '1.6rem', fontWeight: 650, mt: 5, mb: 2, letterSpacing: '-0.01em' },
        '& h2': {
          fontSize: '1.3rem', fontWeight: 650, mt: 5, mb: 1.5, letterSpacing: '-0.01em',
          // Room above the heading a link jumps to, or it lands against the top
          // of the window with nothing above it.
          scrollMarginTop: `${headingOffset}px`,
        },
        '& h3': { fontSize: '1.08rem', fontWeight: 650, mt: 3.5, mb: 1, scrollMarginTop: `${headingOffset}px` },
        '& h4': { fontSize: '1rem', fontWeight: 650, mt: 3, mb: 1 },
        '& p': { my: compact ? 1.5 : 2 },
        '& ul, & ol': { pl: 3, my: 2 },
        '& li': { my: 0.75 },
        '& li > p': { my: 0.5 },
        // A link in running text is the text colour, underlined. The accent is
        // what you press, and painting every link with it turns a page of
        // prose into a page of buttons.
        '& a': {
          color: 'text.primary', textDecorationColor: surface.borderStrong, textUnderlineOffset: 2,
          '&:hover': { textDecorationColor: surface.text },
        },
        '& strong': { fontWeight: 650 },
        '& code': {
          fontFamily: monospaceFamily, fontSize: '0.88em',
          bgcolor: surface.field, px: 0.75, py: 0.25, borderRadius: '6px',
        },
        // The block sits on the page's own field colour and inverts with it,
        // so a document does not have a slab of somebody else's palette in
        // the middle of it.
        '& pre': {
          bgcolor: surface.field, color: 'text.primary',
          p: 2, borderRadius: '8px', overflowX: 'auto',
          border: 1, borderColor: 'divider',
          fontSize: '0.88rem', lineHeight: 1.65, my: 2,
          '& code': { bgcolor: 'transparent', color: 'inherit', px: 0, py: 0, fontSize: 'inherit', borderRadius: 0 },
        },
        '& .hljs-comment, & .hljs-quote': { color: token.comment, fontStyle: 'italic' },
        '& .hljs-keyword, & .hljs-selector-tag, & .hljs-literal, & .hljs-doctag, & .hljs-name':
          { color: token.keyword },
        '& .hljs-string, & .hljs-regexp, & .hljs-addition, & .hljs-attribute': { color: token.string },
        '& .hljs-number, & .hljs-symbol, & .hljs-bullet, & .hljs-link, & .hljs-selector-attr':
          { color: token.number },
        '& .hljs-title, & .hljs-section': { color: token.title },
        '& .hljs-type, & .hljs-built_in, & .hljs-params': { color: token.type },
        '& .hljs-variable, & .hljs-template-variable, & .hljs-attr, & .hljs-selector-id, & .hljs-selector-class':
          { color: token.variable },
        '& .hljs-meta, & .hljs-deletion': { color: token.meta },
        '& .hljs-emphasis': { fontStyle: 'italic' },
        '& .hljs-strong': { fontWeight: 600 },

        // A wide picture fills the measure; a small one is left at its own
        // size rather than blown up to fit and blurred.
        '& img': { maxWidth: '100%', height: 'auto', borderRadius: '8px', verticalAlign: 'middle' },
        '& figure': { m: 0, my: 3, '& img': { display: 'block', border: 1, borderColor: 'divider' } },
        '& figcaption': { mt: 1, fontSize: 13, color: 'text.secondary', lineHeight: 1.5 },
        '& blockquote': {
          borderLeft: 3, borderColor: 'divider', pl: 2, ml: 0, my: 2, color: 'text.secondary',
        },
        '& hr': { border: 0, borderTop: 1, borderColor: 'divider', my: 5 },
        // A table of rules, not a grid of boxes, the way the dashboard draws
        // one. Wide ones scroll inside their own box rather than the page.
        '& table': { borderCollapse: 'collapse', width: '100%', my: 2, fontSize: 14, display: 'block', overflowX: 'auto' },
        '& th, & td': { borderBottom: 1, borderColor: 'divider', px: 1.25, py: 1, textAlign: 'left', verticalAlign: 'top' },
        '& th': { color: 'text.secondary', fontWeight: 550 },
      }}
    />
  )
}
