import { useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import { useTranslate } from '../i18n'
import { pageWidth } from './shell'

// The iPhone app, drawn as a phone.
//
// The pictures are the app's own screenshots, the ones its build takes of
// the demo server's invented conversation, mail and money, in light and in
// dark. They live in assets/phone/ as <screen>.<theme>.jpg with the status
// bar cropped off, because the build's simulators each show their own time
// and signal; the frame draws one status bar for all of them, at 9:41 as
// Apple's own pictures are. They are English only: the app has not been
// photographed in another language yet.

const files = import.meta.glob('../assets/phone/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

const byKey = new Map<string, string>()
for (const [path, url] of Object.entries(files)) {
  byKey.set(path.split('/').pop()!.replace(/\.jpg$/, ''), url)
}

// The screens, in the order the gallery shows them: talking to it and to
// the people it lives with first, then what it looks after.
export const phoneScreens = [
  'conversation', 'chats', 'mail', 'followups', 'calendar', 'contacts', 'photos', 'location', 'health', 'coding', 'knowledge', 'recording', 'finance', 'payment', 'passwords', 'search', 'journal', 'shopping',
] as const
export type PhoneScreen = typeof phoneScreens[number]

// One phone: a rounded frame, the island, a status bar, and the screen.
export const Phone = ({ screen, width = 260 }: { screen: PhoneScreen, width?: number }) => {
  const theme = useTheme()
  const translate = useTranslate()
  const mode = theme.palette.mode === 'dark' ? 'dark' : 'light'
  const source = byKey.get(`${screen}.${mode}`) ?? byKey.get(`${screen}.light`)
  // Everything is drawn in proportion to the width, so a small phone is the
  // same phone and not a cramped one.
  const scale = width / 260
  const screenBackground = mode === 'dark' ? '#000' : '#f2f2f7'
  const ink = mode === 'dark' ? '#fff' : '#000'

  return (
    <Box
      sx={{
        width, flex: 'none', p: `${7 * scale}px`, borderRadius: `${44 * scale}px`,
        bgcolor: mode === 'dark' ? '#2a2a2e' : '#1c1c1e',
        boxShadow: mode === 'dark'
          ? '0 0 0 1px #3a3a3f, 0 24px 48px -12px rgba(0,0,0,0.7)'
          : '0 0 0 1px #0002, 0 24px 48px -16px rgba(20,30,10,0.35)',
      }}
    >
      <Box sx={{ position: 'relative', borderRadius: `${37 * scale}px`, overflow: 'hidden', bgcolor: screenBackground }}>
        {/* The status bar: the time on the left, the island in the middle,
            and the signal and the battery on the right. */}
        <Box sx={{ height: 36 * scale, position: 'relative', display: 'flex', alignItems: 'center', px: `${22 * scale}px`, color: ink }}>
          <Typography component='span' sx={{ fontSize: 12.5 * scale, fontWeight: 600, letterSpacing: '-0.01em', flex: 1 }}>9:41</Typography>
          <Box
            sx={{
              position: 'absolute', left: '50%', top: 8 * scale, transform: 'translateX(-50%)',
              width: 78 * scale, height: 22 * scale, borderRadius: 99, bgcolor: '#000',
            }}
          />
          <Stack direction='row' sx={{ gap: `${4 * scale}px`, alignItems: 'center' }}>
            <Box component='svg' viewBox='0 0 18 12' sx={{ width: 15 * scale, height: 10 * scale, fill: 'currentColor' }}>
              <rect x='0' y='8' width='3' height='4' rx='1'/>
              <rect x='5' y='5.5' width='3' height='6.5' rx='1'/>
              <rect x='10' y='3' width='3' height='9' rx='1'/>
              <rect x='15' y='0' width='3' height='12' rx='1'/>
            </Box>
            <Box sx={{ width: 22 * scale, height: 11 * scale, border: `${1 * scale}px solid`, borderColor: 'currentColor', borderRadius: `${3.5 * scale}px`, p: `${1.5 * scale}px`, opacity: 0.9 }}>
              <Box sx={{ width: '100%', height: '100%', bgcolor: 'currentColor', borderRadius: `${1.5 * scale}px` }}/>
            </Box>
          </Stack>
        </Box>
        {source && (
          <Box
            component='img'
            src={source}
            alt={translate(`welcome.phone.screens.${screen}`)}
            loading='lazy'
            sx={{ display: 'block', width: '100%', height: 'auto' }}
          />
        )}
      </Box>
    </Box>
  )
}

// Every screen side by side, with a caption under each, in a row as wide as
// the window. The first phone lines up with the words above it, and the row
// runs past them to the window's edges, so a phone cut off at the edge is
// what says there is more.
//
// On a wide window the row has no scrollbar: it moves sideways as the page
// scrolls, from the first phone when the row comes up from the bottom of
// the window to the last when it reaches the top. On a phone, or for a
// reader who asked for less motion, it is a row they scroll themselves,
// snapping one phone at a time.
export const PhoneGallery = () => {
  const theme = useTheme()
  const translate = useTranslate()
  const isWide = useMediaQuery(theme.breakpoints.up('md'))
  const isStill = useMediaQuery('(prefers-reduced-motion: reduce)')
  const isDrivenByPage = isWide && !isStill
  const frame = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const frameElement = frame.current
    const trackElement = track.current
    if (!isDrivenByPage || !frameElement || !trackElement) return
    let pending = 0
    const place = () => {
      pending = 0
      const distance = Math.max(0, trackElement.scrollWidth - frameElement.clientWidth)
      const top = frameElement.getBoundingClientRect().top
      const progress = Math.min(1, Math.max(0, 1 - top / window.innerHeight))
      trackElement.style.transform = `translateX(${-Math.round(progress * distance)}px)`
    }
    const schedule = () => { if (!pending) pending = requestAnimationFrame(place) }
    place()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(pending)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      trackElement.style.transform = ''
    }
  }, [isDrivenByPage])

  // Where the page's words start: the page's side padding, or, on a window
  // wider than the page, half of what is left over and then that padding.
  // The percentage is of the row's own width, which is the window's.
  const inset = (padding: number) => `max(${padding}px, calc((100% - ${pageWidth.maxWidth}px) / 2 + ${padding}px))`

  return (
    <Box
      ref={frame}
      role='list'
      aria-label={translate('welcome.phone.galleryLabel')}
      tabIndex={isDrivenByPage ? undefined : 0}
      sx={isDrivenByPage
        ? { overflow: 'hidden', pt: 1, pb: 3 }
        : {
            display: 'flex', gap: 2.5, overflowX: 'auto', scrollSnapType: 'x mandatory',
            pt: 1, pb: 3, px: inset(16), scrollPaddingInline: inset(16), scrollbarWidth: 'thin',
            '&:focus-visible': { outline: 2, outlineColor: 'primary.main', outlineOffset: -2 },
          }}
    >
      {/* On a wide window the phones sit in a track the page moves. A
          padding percentage is of the frame's width, as wide as the row. */}
      <Box
        ref={track}
        sx={isDrivenByPage
          ? { display: 'flex', gap: 3.5, width: 'max-content', willChange: 'transform', px: inset(32) }
          : { display: 'contents' }}
      >
        {phoneScreens.map((screen) => (
          <Box key={screen} role='listitem' sx={{ flex: 'none', width: { xs: 220, md: 236 }, scrollSnapAlign: 'start' }}>
            <Phone screen={screen} width={220}/>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1.75, lineHeight: 1.45, pr: 1 }}>
              {translate(`welcome.phone.captions.${screen}`)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
