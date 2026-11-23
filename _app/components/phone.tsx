import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import { useTranslate } from '../i18n'
import { pageWidth } from './shell'

// The phone apps, each drawn as its phone.
//
// The pictures are the apps' own screenshots, the ones their builds take of
// the demo server's invented conversation, mail and money, in light and in
// dark. The iPhone's live in assets/phone/ as <screen>.<theme>.jpg with the
// status bar cropped off, because the build's simulators each show their own
// time and signal; the Android app's, in assets/phone/android/, are drawn
// without one. The frame draws one status bar for all of them, at 9:41 as
// Apple's own pictures are. They are English only: the apps have not been
// photographed in another language yet.

const byPath = (files: Record<string, string>) => {
  const byKey = new Map<string, string>()
  for (const [path, url] of Object.entries(files)) {
    byKey.set(path.split('/').pop()!.replace(/\.jpg$/, ''), url)
  }
  return byKey
}

const iphoneFiles = byPath(import.meta.glob('../assets/phone/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>)
const androidFiles = byPath(import.meta.glob('../assets/phone/android/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>)

// The screens, in the order the gallery shows them: talking to it and to
// the people it lives with first, then what it looks after.
export const phoneScreens = [
  'conversation', 'chats', 'call', 'mail', 'followups', 'calendar', 'contacts', 'photos', 'location', 'travel', 'health', 'coding', 'knowledge', 'recording', 'finance', 'payment', 'passwords', 'search', 'journal', 'shopping',
] as const
export type PhoneScreen = typeof phoneScreens[number]

export const androidScreens = [
  'conversation', 'cards', 'chat', 'call', 'actions', 'mail', 'thread', 'contacts', 'photos', 'location', 'travel', 'health', 'coding', 'knowledge', 'recording', 'finance', 'passwords', 'journal', 'shopping', 'setup',
] as const
export type AndroidScreen = typeof androidScreens[number]

export type PhonePlatform = 'iphone' | 'android'

// What each platform's frame and pictures are like. The Android app paints
// its own background behind the status bar and the gesture bar, so the frame
// draws them in that color.
const platforms = {
  iphone: {
    files: iphoneFiles, pictureHeight: 1232, captions: 'welcome.phone.captions',
    frameRadius: 44, screenRadius: 37, padding: 7, statusHeight: 36,
    screenBackground: { light: '#f2f2f7', dark: '#000' },
  },
  android: {
    files: androidFiles, pictureHeight: 1301, captions: 'welcome.phone.androidCaptions',
    frameRadius: 34, screenRadius: 28, padding: 6, statusHeight: 30,
    screenBackground: { light: '#fafef6', dark: '#121210' },
  },
} as const

type PhoneProps = { width?: number, isLoadedAhead?: boolean }
  & ({ platform?: 'iphone', screen: PhoneScreen } | { platform: 'android', screen: AndroidScreen })

// One phone: a rounded frame, the island or the camera, a status bar, and
// the screen, with the gesture bar under an Android one.
//
// The picture's size is given so the phone is full height before it arrives,
// and its alt text is transparent so a screen reader has it but nobody sees
// the words in the phone while the picture loads. A browser waits for a lazy
// picture until it is near the window; isLoadedAhead asks for it right away.
export const Phone = ({ screen, width = 260, isLoadedAhead = false, platform = 'iphone' }: PhoneProps) => {
  const theme = useTheme()
  const translate = useTranslate()
  const mode = theme.palette.mode === 'dark' ? 'dark' : 'light'
  const look = platforms[platform]
  const source = look.files.get(`${screen}.${mode}`) ?? look.files.get(`${screen}.light`)
  const isAndroid = platform === 'android'
  // Everything is drawn in proportion to the width, so a small phone is the
  // same phone and not a cramped one.
  const scale = width / 260
  const screenBackground = look.screenBackground[mode]
  const ink = mode === 'dark' ? '#fff' : '#000'

  return (
    <Box
      sx={{
        width, flex: 'none', p: `${look.padding * scale}px`, borderRadius: `${look.frameRadius * scale}px`,
        bgcolor: mode === 'dark' ? '#2a2a2e' : '#1c1c1e',
        boxShadow: mode === 'dark'
          ? '0 0 0 1px #3a3a3f, 0 24px 48px -12px rgba(0,0,0,0.7)'
          : '0 0 0 1px #0002, 0 24px 48px -16px rgba(20,30,10,0.35)',
      }}
    >
      <Box sx={{ position: 'relative', borderRadius: `${look.screenRadius * scale}px`, overflow: 'hidden', bgcolor: screenBackground }}>
        {/* The status bar: the time on the left, the island or the camera
            in the middle, and the signal and the battery on the right. */}
        <Box sx={{ height: look.statusHeight * scale, position: 'relative', display: 'flex', alignItems: 'center', px: `${(isAndroid ? 18 : 22) * scale}px`, color: ink }}>
          <Typography component='span' sx={{ fontSize: 12.5 * scale, fontWeight: isAndroid ? 500 : 600, letterSpacing: '-0.01em', flex: 1 }}>9:41</Typography>
          <Box
            sx={isAndroid
              ? {
                  position: 'absolute', left: '50%', top: 9 * scale, transform: 'translateX(-50%)',
                  width: 12 * scale, height: 12 * scale, borderRadius: 99, bgcolor: '#000',
                }
              : {
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
            alt={translate(`${look.captions}.${screen}`)}
            width={600}
            height={look.pictureHeight}
            loading={isLoadedAhead ? 'eager' : 'lazy'}
            decoding={isLoadedAhead ? 'sync' : 'async'}
            sx={{ display: 'block', width: '100%', height: 'auto', color: 'transparent' }}
          />
        )}
        {isAndroid && (
          <Box sx={{ height: 16 * scale, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ width: 64 * scale, height: 4 * scale, borderRadius: 99, bgcolor: ink, opacity: 0.45 }}/>
          </Box>
        )}
      </Box>
    </Box>
  )
}

// Every screen side by side, with a caption under each, in a row as wide as
// the window. The first phone lines up with the words above it, and the row
// runs past them to the window's edges, so a phone cut off at the edge is
// what says there is more. A switch above it shows the iPhone app or the
// Android one, starting with Android on an Android phone.
//
// On a wide window the row has no scrollbar: it moves sideways as the page
// scrolls, from the first phone when the row comes up from the bottom of
// the window to the last when it reaches the top. On a phone, or for a
// reader who asked for less motion, it is a row they scroll themselves,
// snapping one phone at a time.
//
// Either way the row clips its phones, and a browser's early start for lazy
// pictures stops at that clip: a phone further along the row would only start
// loading as it slid into view. So the whole row is asked for at once, as the
// page comes within a few screens of it.
const loadAheadMargin = '2000px 0px'

const isAndroidVisitor = () => typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)

export const PhoneGallery = () => {
  const theme = useTheme()
  const translate = useTranslate()
  const isWide = useMediaQuery(theme.breakpoints.up('md'))
  const isStill = useMediaQuery('(prefers-reduced-motion: reduce)')
  const isDrivenByPage = isWide && !isStill
  const frame = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [isLoadedAhead, setIsLoadedAhead] = useState(false)
  const [platform, setPlatform] = useState<PhonePlatform>(isAndroidVisitor() ? 'android' : 'iphone')

  useEffect(() => {
    const frameElement = frame.current
    if (!frameElement) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setIsLoadedAhead(true)
      observer.disconnect()
    }, { rootMargin: loadAheadMargin })
    observer.observe(frameElement)
    return () => observer.disconnect()
  }, [])

  // Another platform starts the row again from its first phone.
  useEffect(() => {
    frame.current?.scrollTo({ left: 0 })
  }, [platform])

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
  }, [isDrivenByPage, platform])

  // Where the page's words start: the page's side padding, or, on a window
  // wider than the page, half of what is left over and then that padding.
  // The percentage is of the row's own width, which is the window's.
  const inset = (padding: number) => `max(${padding}px, calc((100% - ${pageWidth.maxWidth}px) / 2 + ${padding}px))`
  const phones = platform === 'android'
    ? androidScreens.map((screen) => ({ screen, phone: <Phone platform='android' screen={screen} width={220} isLoadedAhead={isLoadedAhead}/>, caption: `welcome.phone.androidCaptions.${screen}` }))
    : phoneScreens.map((screen) => ({ screen, phone: <Phone screen={screen} width={220} isLoadedAhead={isLoadedAhead}/>, caption: `welcome.phone.captions.${screen}` }))

  return (
    <Box>
      <Box sx={{ px: { xs: inset(16), md: inset(32) }, pb: 2 }}>
        <ToggleButtonGroup
          exclusive
          size='small'
          value={platform}
          onChange={(_event, value: PhonePlatform | null) => { if (value) setPlatform(value) }}
          aria-label={translate('welcome.phone.platformLabel')}
        >
          <ToggleButton value='iphone' sx={{ px: 2 }}>{translate('welcome.phone.platforms.iphone')}</ToggleButton>
          <ToggleButton value='android' sx={{ px: 2 }}>{translate('welcome.phone.platforms.android')}</ToggleButton>
        </ToggleButtonGroup>
      </Box>
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
            ? { display: 'flex', gap: 3.5, width: 'max-content', willChange: 'transform', px: inset(32), alignItems: 'flex-start' }
            : { display: 'contents' }}
        >
          {phones.map(({ screen, phone, caption }) => (
            <Box key={`${platform}.${screen}`} role='listitem' sx={{ flex: 'none', width: { xs: 220, md: 236 }, scrollSnapAlign: 'start' }}>
              {phone}
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1.75, lineHeight: 1.45, pr: 1 }}>
                {translate(caption)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
