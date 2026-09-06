import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type TouchEvent } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Modal from '@mui/material/Modal'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'

import { useLanguageCode, useTranslate } from '../i18n'
import { screenshot, screenshotHeight, screenshotPages, screenshotPaths, screenshotWidth, type ScreenshotPage } from '../screenshots'
import { brand } from '../theme'

// The dashboard, one page at a time.
//
// A picture, a caption saying what it shows, arrows either side and a row of
// dots underneath. It turns its own pages, slowly, until somebody touches it:
// an arrow, a dot, a key, a swipe or a click all stop the turning, because a
// picture that moves while somebody is reading it is a picture they did not
// get to read. Each page fades into the next rather than cutting, and does
// not move at all for a reader who has asked for less motion.
//
// Clicking the picture opens it as large as the window allows, since the
// details are what the picture is for. The same arrows and keys work there.
//
// The picture is the one for the theme being read in and the reader's
// language, so the dashboard looks the way it would look to them.

// How long a page stays before the next one, while nobody has touched it.
const dwell = 5000

// How long the fade between two pages takes.
const fade = 600

export const Carousel = () => {
  const theme = useTheme()
  const translate = useTranslate()
  const language = useLanguageCode()
  const mode = theme.palette.mode === 'dark' ? 'dark' : 'light'
  // Where it is, and where it was a moment ago: the page before stays as the
  // floor the new one fades in on.
  const [position, setPosition] = useState<{ index: number, previous: number | null }>({ index: 0, previous: null })
  const { index, previous } = position
  const [open, setOpen] = useState(false)
  // Whether it is still turning its own pages.
  const [turning, setTurning] = useState(true)
  // Whether it is on screen: pages turned while it is scrolled out of view
  // are pages nobody saw, and a timer for them is work for nothing.
  const [visible, setVisible] = useState(false)
  const frame = useRef<HTMLDivElement>(null)
  const count = screenshotPages.length
  const page: ScreenshotPage = screenshotPages[index]

  const show = useCallback((to: (current: number) => number) => {
    setPosition((current) => ({ index: to(current.index), previous: current.index }))
  }, [])

  const go = useCallback((step: number) => {
    show((current) => (current + step + count) % count)
  }, [count, show])

  // A hand on it stops it turning, for good: somebody who wanted to read a
  // page will want to read the next one too.
  const touched = useCallback(() => setTurning(false), [])

  useEffect(() => {
    const element = frame.current
    if (!element || !('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.4 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!turning || !visible || open) {
      return
    }
    const timer = window.setInterval(() => go(1), dwell)
    return () => window.clearInterval(timer)
  }, [turning, visible, open, go])

  // The neighbours are fetched ahead, so a turn shows a picture rather than
  // a blank slot filling in.
  useEffect(() => {
    for (const step of [1, -1]) {
      const source = screenshot(screenshotPages[(index + step + count) % count], mode, language)
      if (source) {
        new Image().src = source
      }
    }
  }, [index, count, mode, language])

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') { touched(); go(-1); event.preventDefault() }
    if (event.key === 'ArrowRight') { touched(); go(1); event.preventDefault() }
    if (event.key === 'Enter' && !open) { touched(); setOpen(true); event.preventDefault() }
  }

  const [touchStart, setTouchStart] = useState<number | null>(null)
  const onTouchStart = (event: TouchEvent) => setTouchStart(event.touches[0].clientX)
  const onTouchEnd = (event: TouchEvent) => {
    if (touchStart === null) {
      return
    }
    const moved = event.changedTouches[0].clientX - touchStart
    if (Math.abs(moved) > 40) {
      touched()
      go(moved < 0 ? 1 : -1)
    }
    setTouchStart(null)
  }

  const source = screenshot(page, mode, language)
  const previousSource = previous === null ? undefined : screenshot(screenshotPages[previous], mode, language)
  const caption = translate(`welcome.screenshots.${page}`)
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const picture = (fit: 'cover' | 'contain') => source && (
    <Box
      component='img'
      key={source}
      src={source}
      alt={caption}
      width={screenshotWidth}
      height={screenshotHeight}
      sx={{
        position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%', objectFit: fit,
        // The new page fades in over the old one, which stays underneath
        // until the fade is done: a cut is a blink, and a fade is a page
        // turning.
        '@keyframes carousel-fade': { from: { opacity: 0 }, to: { opacity: 1 } },
        animation: reduced ? 'none' : `carousel-fade ${fade}ms ease-out`,
      }}
    />
  )

  const dots = (
    <Stack direction='row' sx={{ gap: 0.75 }} role='tablist'>
      {screenshotPages.map((one, at) => (
        <Box
          key={one}
          component='button'
          type='button'
          role='tab'
          aria-selected={at === index}
          aria-label={translate(`welcome.screenshots.${one}`)}
          onClick={() => { touched(); show(() => at) }}
          sx={{
            width: 8, height: 8, p: 0, border: 0, borderRadius: '50%', cursor: 'pointer',
            bgcolor: at === index ? 'text.primary' : 'divider',
            transition: reduced ? 'none' : 'background-color 300ms',
            '&:hover': { bgcolor: at === index ? 'text.primary' : 'text.secondary' },
          }}
        />
      ))}
    </Stack>
  )

  return (
    <>
      <Box
        ref={frame}
        role='region'
        aria-roledescription='carousel'
        aria-label={translate('welcome.screenshotsHeading')}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        sx={{
          outline: 'none', borderRadius: '12px', position: 'relative',
          // Seen from slightly above, the way a product is photographed, on
          // a wash of the leaf green. Flat on a phone, where there is no
          // room to lose to a tilt.
          perspective: '1800px',
          '&:focus-visible figure': { boxShadow: `0 0 0 2px ${theme.palette.text.primary}` },
        }}
      >
        <Box
          aria-hidden='true'
          sx={{
            position: 'absolute', left: '50%', top: '50%', width: '110%', height: '120%',
            transform: 'translate(-50%, -50%)', pointerEvents: 'none',
            background: `radial-gradient(ellipse at center, ${brand.leaf}${mode === 'dark' ? '2e' : '33'} 0%, ${brand.leaf}00 62%)`,
          }}
        />
        <Box
          component='figure'
          sx={{
            m: 0, borderRadius: '12px', border: 1, borderColor: 'divider', overflow: 'hidden',
            bgcolor: 'background.paper', position: 'relative',
            transform: { md: 'rotateX(3deg)' }, transformOrigin: '50% 0',
            boxShadow: mode === 'dark' ? '0 40px 80px -40px rgb(0 0 0 / 80%)' : '0 40px 80px -40px rgb(0 0 0 / 25%)',
          }}
        >
          {/* The window's own top: three dots and the address, so the picture
              reads as the dashboard open in a browser. */}
          <Stack
            direction='row'
            aria-hidden='true'
            sx={{ alignItems: 'center', gap: 0.75, px: 1.5, height: 36, borderBottom: 1, borderColor: 'divider', bgcolor: mode === 'dark' ? '#0c0c0e' : '#f7f7f6' }}
          >
            {[0, 1, 2].map((dot) => <Box key={dot} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'divider' }}/>)}
            <Box
              sx={{
                ml: 1.5, px: 1.25, py: 0.4, borderRadius: '6px', border: 1, borderColor: 'divider', bgcolor: 'background.paper',
                fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%',
              }}
            >
              mail.example.com{screenshotPaths[page]}
            </Box>
          </Stack>
          <Box
            role='button'
            aria-label={translate('welcome.openPicture')}
            onClick={() => { touched(); setOpen(true) }}
            sx={{
              position: 'relative', aspectRatio: `${screenshotWidth} / ${screenshotHeight}`, cursor: 'zoom-in',
              bgcolor: mode === 'dark' ? '#141416' : '#ffffff',
            }}
          >
            {/* The page before stays as the floor the new one fades in on. */}
            { previousSource && (
              <Box component='img' src={previousSource} alt='' aria-hidden='true' sx={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}/>
            ) }
            {picture('cover')}
            <Arrow side='left' onClick={(event) => { event.stopPropagation(); touched(); go(-1) }} label={translate('welcome.previous')}/>
            <Arrow side='right' onClick={(event) => { event.stopPropagation(); touched(); go(1) }} label={translate('welcome.next')}/>
          </Box>
          <Stack
            component='figcaption'
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ px: 2, py: 1.5, gap: 1.5, borderTop: 1, borderColor: 'divider', alignItems: { sm: 'center' } }}
          >
            <Typography variant='body2' color='text.secondary' sx={{ flex: 1 }}>
              {caption}
            </Typography>
            {dots}
          </Stack>
        </Box>
      </Box>

      {/* The same page, as large as the window allows, on a dark ground so
          the picture is the only bright thing. */}
      <Modal open={open} onClose={() => setOpen(false)} aria-label={caption}>
        <Box
          onKeyDown={onKeyDown}
          sx={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', bgcolor: 'rgb(0 0 0 / 94%)', outline: 'none' }}
        >
          <Stack direction='row' sx={{ p: 1.5, alignItems: 'center', gap: 2, color: '#f4f4f5' }}>
            <Typography variant='body2' sx={{ flex: 1, color: 'inherit', pl: 1 }}>{caption}</Typography>
            <IconButton onClick={() => setOpen(false)} aria-label={translate('welcome.closePicture')} sx={{ color: 'inherit' }}>
              <CloseIcon/>
            </IconButton>
          </Stack>
          <Box
            onClick={() => setOpen(false)}
            sx={{ flex: 1, minHeight: 0, position: 'relative', mx: { xs: 1, md: 4 }, cursor: 'zoom-out' }}
          >
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ position: 'relative', width: '100%', height: '100%', maxWidth: `calc((100vh - 140px) * ${screenshotWidth / screenshotHeight})` }}>
                {picture('contain')}
              </Box>
            </Box>
            <Arrow side='left' large onClick={(event) => { event.stopPropagation(); go(-1) }} label={translate('welcome.previous')}/>
            <Arrow side='right' large onClick={(event) => { event.stopPropagation(); go(1) }} label={translate('welcome.next')}/>
          </Box>
          <Stack direction='row' sx={{ p: 2, justifyContent: 'center' }}>{dots}</Stack>
        </Box>
      </Modal>
    </>
  )
}

// An arrow over the picture's edge, on its own small surface so it reads on
// a light page and a dark one.
const Arrow = ({ side, onClick, label, large }: {
  side: 'left' | 'right'
  onClick: (event: MouseEvent) => void
  label: string
  large?: boolean
}) => (
  <IconButton
    onClick={onClick}
    aria-label={label}
    size={large ? 'large' : 'medium'}
    sx={{
      position: 'absolute', top: '50%', [side]: large ? 0 : 8, transform: 'translateY(-50%)',
      bgcolor: 'background.paper', border: 1, borderColor: 'divider', color: 'text.primary',
      boxShadow: '0 1px 2px rgb(0 0 0 / 6%)',
      '&:hover': { bgcolor: 'background.paper', borderColor: 'text.secondary' },
    }}
  >
    { side === 'left' ? (<ChevronLeftIcon/>) : (<ChevronRightIcon/>) }
  </IconButton>
)
