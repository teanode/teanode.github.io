import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

import { useTranslate } from '../i18n'

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

// The screens, in the order the gallery shows them: talking to it first,
// then what it looks after.
export const phoneScreens = ['conversation', 'mail', 'calendar', 'finance', 'recording', 'knowledge', 'contacts'] as const
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

// Every screen side by side, with a caption under each. On a wide window it
// is a row that scrolls sideways; on a phone it snaps one phone at a time.
// It moves only when the reader moves it.
export const PhoneGallery = () => {
  const translate = useTranslate()
  const strip = useRef<HTMLDivElement>(null)
  // Whether there is more to the right, so the fade at the edge says so and
  // goes away once there is not.
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    const element = strip.current
    if (!element) return
    const check = () => setHasMore(element.scrollLeft + element.clientWidth < element.scrollWidth - 8)
    check()
    element.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      element.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        ref={strip}
        role='list'
        aria-label={translate('welcome.phone.galleryLabel')}
        tabIndex={0}
        sx={{
          display: 'flex', gap: { xs: 2.5, md: 3.5 }, overflowX: 'auto', scrollSnapType: 'x mandatory',
          pt: 1, pb: 3, px: 0.5, scrollbarWidth: 'thin',
          '&:focus-visible': { outline: 2, outlineColor: 'primary.main', outlineOffset: 4, borderRadius: 2 },
        }}
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
      <Box
        aria-hidden
        sx={{
          position: 'absolute', top: 0, right: 0, bottom: 24, width: 56, pointerEvents: 'none',
          opacity: hasMore ? 1 : 0, transition: 'opacity 200ms',
          background: (theme) => `linear-gradient(to right, transparent, ${theme.palette.background.default})`,
        }}
      />
    </Box>
  )
}
