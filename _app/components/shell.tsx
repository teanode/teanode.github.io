import { createContext, use, useState, type MouseEvent, type ReactNode } from 'react'
import { NavLink } from 'react-router'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import GitHubIcon from '@mui/icons-material/GitHub'
import MenuIcon from '@mui/icons-material/Menu'

import { T, useTranslate } from '../i18n'
import routes, { links } from '../routes'
import { surfaces } from '../theme'

import { AppearanceMenu } from './appearanceMenu'
import { LanguageMenu } from './languageMenu'
import { Logo } from './logo'

// The frame every page sits in.
//
// Two shapes. The documents get a rail down the left, the way the dashboard
// has one: it sits one step off the page in colour rather than behind a rule,
// and the row you are on is a raised pill rather than a coloured highlight.
// The front page gets a bar across the top and nothing down the side, because
// there is nothing to navigate between yet.
//
// A phone gets the rail behind a drawer, opened from the bar.

const railWidth = 280
const barHeight = 56

const RailContext = createContext<() => void>(() => {})

export const RailFrame = ({ search, navigation, children }: {
  // Shown above the navigation when there is something worth filtering.
  search?: ReactNode
  navigation?: ReactNode
  children?: ReactNode
}) => {
  const translate = useTranslate()
  const theme = useTheme()
  const surface = surfaces(theme.palette.mode === 'dark' ? 'dark' : 'light')
  const wide = useMediaQuery(theme.breakpoints.up('md'))
  const [open, setOpen] = useState(false)

  const inside = (
    <RailContext value={() => setOpen(false)}>
      <Stack sx={{ height: '100%', bgcolor: surface.rail }}>
        <Box sx={{ px: 2, height: barHeight, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Box component={NavLink} to={routes.welcomePath} sx={{ display: 'flex', textDecoration: 'none', '&:hover': { opacity: 0.75 } }} aria-label={translate('title')}>
            <Logo size={22}/>
          </Box>
        </Box>

        { search && (<Box sx={{ px: 2, pb: 1, flexShrink: 0 }}>{search}</Box>) }

        <Box sx={{ flex: 1, overflowY: 'auto', px: 1.25, pb: 2 }}>{navigation}</Box>

        {/* The way out to the source, at the foot of the rail, with the
            appearance control beside it: things somebody chooses once. */}
        <Stack direction='row' sx={{ p: 1.5, flexShrink: 0, borderTop: 1, borderColor: 'divider', alignItems: 'center', gap: 0.5 }}>
          <Button
            variant='text'
            size='small'
            href={links.repository}
            target='_blank'
            rel='noopener'
            startIcon={<GitHubIcon sx={{ fontSize: 18 }}/>}
            sx={{ flex: 1, justifyContent: 'flex-start', px: 1 }}
          >
            <T id='nav.github'/>
          </Button>
          <LanguageMenu/>
          <AppearanceMenu/>
        </Stack>
      </Stack>
    </RailContext>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box component='nav' sx={{ width: { md: railWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={wide ? 'permanent' : 'temporary'}
          open={wide || open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: railWidth, boxSizing: 'border-box',
              bgcolor: surface.rail, borderRight: 1, borderColor: 'divider',
              overflowX: 'hidden',
            },
          }}
        >
          {inside}
        </Drawer>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        { !wide && (
          <Stack
            direction='row'
            spacing={1}
            sx={{
              height: barHeight, flexShrink: 0, alignItems: 'center', px: 2,
              borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, zIndex: 2,
              bgcolor: 'background.default',
            }}
          >
            <IconButton edge='start' onClick={() => setOpen(true)} aria-label={translate('nav.menu')}>
              <MenuIcon/>
            </IconButton>
            <Typography sx={{ fontWeight: 600, flex: 1, minWidth: 0 }} noWrap><T id='docs.title'/></Typography>
          </Stack>
        ) }
        {children}
      </Box>
    </Box>
  )
}

// The small grey label over a group in the rail.
export const GroupLabel = ({ children }: { children?: ReactNode }) => (
  <Typography variant='h2' color='text.secondary' sx={{ px: 1.5, pt: 2.5, pb: 1 }}>
    {children}
  </Typography>
)

// A row in the rail: quiet until you are on it.
export const RailLink = ({ to, here, children }: {
  to: string
  here: string
  children: ReactNode
}) => {
  const closeRail = use(RailContext)
  return (
    <ListItemButton
      component={NavLink}
      to={to}
      onClick={(_event: MouseEvent) => closeRail()}
      selected={here === to}
      sx={{ mb: 0.25, px: 2 }}
    >
      <ListItemText
        primary={children}
        slotProps={{ primary: { noWrap: true, sx: { fontSize: 14.5, fontWeight: 'inherit' } } }}
      />
    </ListItemButton>
  )
}

// The frame around the front page and anything else without a rail: the
// mark on the left, the few places to go on the right.
export const PublicShell = ({ children }: { children?: ReactNode }) => {
  const translate = useTranslate()
  return (
    <Stack sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Stack
        component='header'
        direction='row'
        sx={{ height: barHeight, alignItems: 'center', px: { xs: 2, md: 4 }, gap: 1, borderBottom: 1, borderColor: 'divider' }}
      >
        <Box component={NavLink} to={routes.welcomePath} sx={{ display: 'flex', textDecoration: 'none', '&:hover': { opacity: 0.75 } }} aria-label={translate('title')}>
          <Logo size={22}/>
        </Box>
        <Box sx={{ flex: 1 }}/>
        <Button component={NavLink} to={routes.docsPath} variant='text' size='small'>
          <T id='nav.docs'/>
        </Button>
        <Button variant='text' size='small' href={links.repository} target='_blank' rel='noopener' startIcon={<GitHubIcon sx={{ fontSize: 18 }}/>}>
          <T id='nav.github'/>
        </Button>
        <LanguageMenu/>
        <AppearanceMenu/>
      </Stack>
      <Box component='main' sx={{ flex: 1 }}>{children}</Box>
      <Footer/>
    </Stack>
  )
}

export const Footer = () => (
  <Stack
    component='footer'
    direction={{ xs: 'column', sm: 'row' }}
    sx={{
      px: { xs: 2, md: 4 }, py: 3, gap: { xs: 1, sm: 3 },
      borderTop: 1, borderColor: 'divider',
      alignItems: { sm: 'center' }, fontSize: 13, color: 'text.secondary',
    }}
  >
    <Typography variant='body2' color='text.secondary' sx={{ flex: 1 }}>
      <T id='footer.licence'/>
    </Typography>
    <Link component={NavLink} to={routes.docsPath} variant='body2' color='text.secondary'><T id='nav.docs'/></Link>
    <Link href={links.releases} variant='body2' color='text.secondary' target='_blank' rel='noopener'><T id='nav.releases'/></Link>
    <Link href={links.security} variant='body2' color='text.secondary' target='_blank' rel='noopener'><T id='footer.security'/></Link>
    <Link href={links.repository} variant='body2' color='text.secondary' target='_blank' rel='noopener'><T id='nav.github'/></Link>
  </Stack>
)
