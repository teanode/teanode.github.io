import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { generatePath, Navigate, NavLink, useParams } from 'react-router'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import SearchIcon from '@mui/icons-material/Search'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

import { type Doc, fetchDoc, inLanguage, listDocs } from '../docs'
import { Route, Steam } from '../components/decoration'
import { headingOffset, Markdown, renderMarkdown, type Heading } from '../components/markdown'
import { GroupLabel, RailFrame, RailLink } from '../components/shell'
import { Spinner } from '../components/loading'
import { T, useLanguageCode, useTranslate } from '../i18n'
import routes from '../routes'
import { surfaces } from '../theme'

//
// DocPage
//
// The written documents: how to stand the server up, what every setting
// means, and how the code is put together.
//
// The rail is the same shape the dashboard's is. What differs is the list
// inside it, which here is the documents, grouped, with a search over their
// titles and descriptions.
//

const tableOfContentsWidth = 240

export const DocPage = () => {
  const translate = useTranslate()
  const theme = useTheme()
  const language = useLanguageCode()
  const wide = useMediaQuery(theme.breakpoints.up('lg'))
  const surface = surfaces(theme.palette.mode === 'dark' ? 'dark' : 'light')

  const { docId } = useParams()
  const [docs, setDocs] = useState<Doc[] | null>(null)
  // What has been fetched, and for which file. The content shown is derived
  // from the two: a document whose file is not the one loaded is still
  // loading, which is what a spinner is for, and there is no state to reset.
  const [loaded, setLoaded] = useState<{ filename: string, text: string } | null>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    listDocs().then(setDocs, () => setDocs([]))
  }, [])

  // Read in the reader's language, falling back to the original where a
  // translation has not been written.
  const available = useMemo((): ReadableDoc[] =>
    (docs ?? []).map((doc) => ({
      slug: doc.slug,
      group: inLanguage(doc.group, language),
      title: inLanguage(doc.title, language),
      description: inLanguage(doc.description, language),
      filename: inLanguage(doc.filename, language),
    })), [docs, language])

  // Filtered here, in the browser, over what docs.json carries.
  const shown = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    if (!needle) {
      return available
    }
    return available.filter((doc) =>
      `${doc.title} ${doc.description}`.toLowerCase().includes(needle))
  }, [available, filter])

  const current = available.find((doc) => doc.slug === docId)

  // Keyed on the file rather than on the document, so switching language
  // fetches the other translation and switching to a language that has none
  // does not refetch the one already shown.
  const filename = current?.filename
  useEffect(() => {
    if (!filename) {
      return
    }
    let wanted = true
    fetchDoc(filename).then(
      (text) => { if (wanted) { setLoaded({ filename, text }) } },
      () => { if (wanted) { setLoaded({ filename, text: '' }) } },
    )
    // Two documents in flight land in whatever order the network gives them,
    // so the one asked for last is the one allowed to arrive.
    return () => { wanted = false }
  }, [filename])

  const content = loaded && loaded.filename === filename ? loaded.text : null
  const { html, headings } = useMemo(() => renderMarkdown(content ?? ''), [content])
  const active = useActiveHeading(headings)

  // A link to a section arrives before the document it names: the markdown is
  // fetched, so the anchor does not exist when the browser looks for it. Once
  // the document is here, go to it. Otherwise a new document starts at the
  // top, which a route change alone does not do.
  useEffect(() => {
    if (!headings.length) {
      return
    }
    const wanted = window.location.hash.slice(1)
    if (wanted && headings.some((heading) => heading.id === wanted)) {
      document.getElementById(wanted)?.scrollIntoView({ block: 'start' })
    } else {
      window.scrollTo(0, 0)
    }
  }, [headings])

  const groups = useMemo(() => {
    const byGroup = new Map<string, ReadableDoc[]>()
    for (const doc of shown) {
      byGroup.set(doc.group, [...(byGroup.get(doc.group) ?? []), doc])
    }
    return [...byGroup.entries()]
  }, [shown])

  // No document named, so the first one. /doc on its own is a link somebody
  // typed, not a page.
  if (!docId && available.length > 0) {
    return (<Navigate replace to={generatePath(routes.docPath, { docId: available[0].slug })}/>)
  }

  return (
    <div>
      <title>{`${current?.title ?? translate('docs.title')} - ${translate('title')}`}</title>
      <RailFrame
        search={
          <TextField
            size='small'
            fullWidth
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={translate('docs.search')}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }}/>
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: 14, height: 38, bgcolor: surface.field,
                '& fieldset': { borderColor: 'transparent' },
                '&:hover fieldset': { borderColor: surface.border },
              },
            }}
          />
        }
        navigation={
          <>
            {groups.map(([group, entries]) => (
              <Box key={group}>
                <GroupLabel>{group}</GroupLabel>
                <List dense disablePadding>
                  {entries.map((doc) => (
                    <RailLink
                      key={doc.slug}
                      to={generatePath(routes.docPath, { docId: doc.slug })}
                      here={docId ? generatePath(routes.docPath, { docId }) : ''}
                    >
                      {doc.title}
                    </RailLink>
                  ))}
                </List>
              </Box>
            ))}
            { docs !== null && shown.length === 0 && (
              <Typography variant='body2' color='text.secondary' sx={{ px: 1.5, py: 1 }}>
                <T id='docs.noneMatch'/>
              </Typography>
            ) }
          </>
        }
      >
        {/* Clipped sideways, not hidden: the steam at the foot of a document
            is drawn wider than the column and the overhang must go, but a
            scroll container here would stop the contents list sticking. */}
        <Stack direction='row' sx={{ flex: 1, minWidth: 0, position: 'relative', overflowX: 'clip' }}>
          <Box
            component='main'
            sx={{ flex: 1, minWidth: 0, px: { xs: 2.5, md: 6 }, py: { xs: 3, md: 5 }, maxWidth: 820 }}
          >
            { docs === null && (<Spinner/>) }
            { docs !== null && !current && (
              <Typography color='text.secondary'><T id='docs.notFound'/></Typography>
            ) }
            { current && (
              <>
                {/* A letter on its way across the head of the document, behind
                    the title, and nothing more than that. */}
                <Box sx={{ position: 'relative' }}>
                  <Box aria-hidden='true' sx={{ position: 'absolute', left: -48, right: -48, top: -36, bottom: 0, overflow: 'hidden', opacity: 0.7 }}>
                    <Route short/>
                  </Box>
                  <Box sx={{ position: 'relative' }}>
                    <Typography variant='h1'>{current.title}</Typography>
                    <Typography color='text.secondary' sx={{ mt: 1.5, mb: 4 }}>{current.description}</Typography>
                  </Box>
                </Box>
                { content === null && (<Spinner/>) }
                { content === '' && (<Typography color='text.secondary'><T id='docs.failed'/></Typography>) }
                { content && (<Markdown html={html}/>) }
                { content && (<Neighbours docs={available} current={current}/>) }
              </>
            ) }
          </Box>

          {/* Hidden below a wide window: it is a convenience beside the text,
              and stacked above it on a phone it would be a list to scroll
              past before reaching the thing it points into. */}
          { wide && current && headings.length > 0 && (
            <Box component='nav' sx={{ width: tableOfContentsWidth, flexShrink: 0, pt: 14, pb: 5, pr: 4 }}>
              {/* Scrolls when the list is taller than the window, without
                  showing a bar for it: the bar would be the widest thing in
                  the column, and a long entry wraps rather than pushing one
                  out sideways. */}
              <Box
                sx={{
                  position: 'sticky', top: 40, maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', overflowX: 'hidden',
                  scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
                }}
              >
                <Typography variant='h2' color='text.secondary' sx={{ mb: 1.5 }}>
                  <T id='docs.onThisPage'/>
                </Typography>
                {/* A rule down the list, with the section being read holding
                    its own segment of it. */}
                <Stack sx={{ borderLeft: 2, borderColor: 'divider' }}>
                  {headings.map((heading) => (
                    <Typography
                      key={heading.id}
                      component='a'
                      href={`#${heading.id}`}
                      onClick={(event: MouseEvent) => goToHeading(event, heading.id)}
                      variant='body2'
                      sx={{
                        display: 'block', textDecoration: 'none', lineHeight: 1.4, overflowWrap: 'anywhere',
                        py: 0.75, ml: '-2px', borderLeft: 2,
                        pl: heading.depth > 2 ? 3 : 2,
                        fontSize: heading.depth > 2 ? 13 : 14,
                        color: heading.id === active ? 'text.primary' : 'text.secondary',
                        fontWeight: heading.id === active ? 600 : 400,
                        borderColor: heading.id === active ? 'text.primary' : 'transparent',
                        '&:hover': { color: 'text.primary' },
                      }}
                    >
                      {heading.text}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </Box>
          ) }
        </Stack>
      </RailFrame>
    </div>
  )
}

// The documents either side of this one, in the order the index lists them,
// as two cards at the foot of the page. The steam crosses above them, the way
// it crosses the seams of the front page.
const Neighbours = ({ docs, current }: { docs: ReadableDoc[], current: ReadableDoc }) => {
  const at = docs.findIndex((doc) => doc.slug === current.slug)
  const previous = at > 0 ? docs[at - 1] : undefined
  const next = at >= 0 && at < docs.length - 1 ? docs[at + 1] : undefined
  if (!previous && !next) {
    return null
  }
  return (
    <Box component='nav' aria-label='neighbours' sx={{ position: 'relative', mt: 8, pt: 6 }}>
      <Steam bleed/>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        { previous ? (<Neighbour doc={previous} direction='previous'/>) : <span/> }
        { next && (<Neighbour doc={next} direction='next'/>) }
      </Box>
    </Box>
  )
}

const Neighbour = ({ doc, direction }: { doc: ReadableDoc, direction: 'previous' | 'next' }) => (
  <Box
    component={NavLink}
    to={generatePath(routes.docPath, { docId: doc.slug })}
    sx={{
      display: 'flex', flexDirection: 'column', gap: 0.5, p: 2, borderRadius: '12px', border: 1, borderColor: 'divider',
      bgcolor: 'background.paper', textDecoration: 'none', color: 'text.primary',
      alignItems: direction === 'next' ? 'flex-end' : 'flex-start', textAlign: direction === 'next' ? 'right' : 'left',
      '&:hover': { borderColor: 'text.secondary' },
    }}
  >
    <Stack direction='row' sx={{ alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: 12.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      { direction === 'previous' && <ArrowBackIcon sx={{ fontSize: 15 }}/> }
      <T id={`docs.${direction}`}/>
      { direction === 'next' && <ArrowForwardIcon sx={{ fontSize: 15 }}/> }
    </Stack>
    <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{doc.title}</Typography>
  </Box>
)

// Which section is being read, from where the page is scrolled to: the
// heading passed last, which is a comparison against one line and reads the
// same whatever the sections happen to be sized like.
const useActiveHeading = (headings: Heading[]): string => {
  const [active, setActive] = useState('')

  useEffect(() => {
    const read = () => {
      if (headings.length === 0) {
        setActive('')
        return
      }
      let current = headings[0].id
      for (const heading of headings) {
        const element = document.getElementById(heading.id)
        if (element && element.getBoundingClientRect().top <= headingOffset + 4) {
          current = heading.id
        }
      }
      // The last section is usually too short to reach the top of the window.
      // At the bottom, the last one is the one being read.
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        current = headings[headings.length - 1].id
      }
      setActive(current)
    }
    read()
    window.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read, { passive: true })
    return () => {
      window.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
    }
  }, [headings])

  return active
}

// Followed here rather than by the browser, so the page slides to the section
// instead of cutting to it, and so the address bar names it without the jump
// a hash change performs on its own.
const goToHeading = (event: MouseEvent, id: string) => {
  const element = document.getElementById(id)
  if (!element) {
    return
  }
  event.preventDefault()
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  element.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  window.history.replaceState(null, '', `#${id}`)
}

// A document with every field already read in one language, which is all the
// page above deals in.
interface ReadableDoc {
  slug: string
  group: string
  title: string
  description: string
  filename: string
}
