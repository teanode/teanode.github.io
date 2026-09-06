import { useCallback, useEffect, useState, type KeyboardEvent, type TouchEvent } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

import { useLanguageCode, useTranslate } from '../i18n'
import { screenshot, screenshotHeight, screenshotPages, screenshotWidth, type ScreenshotPage } from '../screenshots'

// The dashboard, one page at a time.
//
// A picture, a caption saying what it shows, arrows either side and a row of
// dots underneath. The arrow keys work when it has focus, and a swipe works
// on a phone. Nothing advances on its own: a picture that moves while
// somebody is reading it is a picture they did not get to read.
//
// The picture is the one for the theme being read in and the reader's
// language, so the dashboard looks the way it would look to them.
export const Carousel = () => {
  const theme = useTheme()
  const translate = useTranslate()
  const language = useLanguageCode()
  const mode = theme.palette.mode === 'dark' ? 'dark' : 'light'
  const [index, setIndex] = useState(0)
  const count = screenshotPages.length
  const page: ScreenshotPage = screenshotPages[index]

  const go = useCallback((step: number) => {
    setIndex((current) => (current + step + count) % count)
  }, [count])

  // The neighbours are fetched ahead, so an arrow press shows a picture
  // rather than a blank slot filling in.
  useEffect(() => {
    for (const step of [1, -1]) {
      const source = screenshot(screenshotPages[(index + step + count) % count], mode, language)
      if (source) {
        new Image().src = source
      }
    }
  }, [index, count, mode, language])

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') { go(-1); event.preventDefault() }
    if (event.key === 'ArrowRight') { go(1); event.preventDefault() }
  }

  const [touchStart, setTouchStart] = useState<number | null>(null)
  const onTouchStart = (event: TouchEvent) => setTouchStart(event.touches[0].clientX)
  const onTouchEnd = (event: TouchEvent) => {
    if (touchStart === null) {
      return
    }
    const moved = event.changedTouches[0].clientX - touchStart
    if (Math.abs(moved) > 40) {
      go(moved < 0 ? 1 : -1)
    }
    setTouchStart(null)
  }

  const source = screenshot(page, mode, language)

  return (
    <Box
      role='region'
      aria-roledescription='carousel'
      aria-label={translate('welcome.screenshotsHeading')}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      sx={{ outline: 'none', '&:focus-visible': { boxShadow: `0 0 0 2px ${theme.palette.text.primary}`, borderRadius: '12px' } }}
    >
      <Box
        component='figure'
        sx={{
          m: 0, borderRadius: '12px', border: 1, borderColor: 'divider', overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ position: 'relative', aspectRatio: `${screenshotWidth} / ${screenshotHeight}`, bgcolor: mode === 'dark' ? '#141416' : '#ffffff' }}>
          { source && (
            <Box
              component='img'
              key={source}
              src={source}
              alt={translate(`welcome.screenshots.${page}`)}
              width={screenshotWidth}
              height={screenshotHeight}
              sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) }
          <Arrow side='left' onClick={() => go(-1)} label={translate('welcome.previous')}/>
          <Arrow side='right' onClick={() => go(1)} label={translate('welcome.next')}/>
        </Box>
        <Stack
          component='figcaption'
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ px: 2, py: 1.5, gap: 1.5, borderTop: 1, borderColor: 'divider', alignItems: { sm: 'center' } }}
        >
          <Typography variant='body2' color='text.secondary' sx={{ flex: 1 }}>
            {translate(`welcome.screenshots.${page}`)}
          </Typography>
          <Stack direction='row' sx={{ gap: 0.75 }} role='tablist'>
            {screenshotPages.map((one, position) => (
              <Box
                key={one}
                component='button'
                type='button'
                role='tab'
                aria-selected={position === index}
                aria-label={translate(`welcome.screenshots.${one}`)}
                onClick={() => setIndex(position)}
                sx={{
                  width: 8, height: 8, p: 0, border: 0, borderRadius: '50%', cursor: 'pointer',
                  bgcolor: position === index ? 'text.primary' : 'divider',
                  '&:hover': { bgcolor: position === index ? 'text.primary' : 'text.secondary' },
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}

// An arrow over the picture's edge: quiet until the pointer is near, and
// always there on a phone, where there is no pointer to be near.
const Arrow = ({ side, onClick, label }: { side: 'left' | 'right', onClick: () => void, label: string }) => (
  <IconButton
    onClick={onClick}
    aria-label={label}
    sx={{
      position: 'absolute', top: '50%', [side]: 8, transform: 'translateY(-50%)',
      bgcolor: 'background.paper', border: 1, borderColor: 'divider', color: 'text.primary',
      boxShadow: '0 1px 2px rgb(0 0 0 / 6%)',
      '&:hover': { bgcolor: 'background.paper', borderColor: 'text.secondary' },
    }}
  >
    { side === 'left' ? (<ChevronLeftIcon/>) : (<ChevronRightIcon/>) }
  </IconButton>
)
