import { useEffect, useMemo, type ReactNode } from 'react'
import { NavLink, generatePath } from 'react-router'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { SvgIconComponent } from '@mui/icons-material'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import CallSplitIcon from '@mui/icons-material/CallSplit'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import GitHubIcon from '@mui/icons-material/GitHub'
import OutboxOutlinedIcon from '@mui/icons-material/OutboxOutlined'
import TuneIcon from '@mui/icons-material/Tune'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'

import { Carousel } from '../components/carousel'
import { Markdown, renderMarkdown } from '../components/markdown'
import { Mark } from '../components/logo'
import { pageWidth, PublicShell } from '../components/shell'
import { T, useTranslate } from '../i18n'
import routes, { links } from '../routes'

//
// WelcomePage
//
// The front page: what TeaNode is, what it looks like, what it does, and how
// to start.
//

// The width prose is allowed to get. One number, the dashboard's, because two
// paragraphs on one page wrapping in different places looks like a bug.
const measure = '74ch'

const features: { key: string, Icon: SvgIconComponent }[] = [
  { key: 'authenticates', Icon: VerifiedUserOutlinedIcon },
  { key: 'forwards', Icon: CallSplitIcon },
  { key: 'relays', Icon: OutboxOutlinedIcon },
  { key: 'shows', Icon: VisibilityOutlinedIcon },
  { key: 'sends', Icon: DescriptionOutlinedIcon },
  { key: 'reports', Icon: AssessmentOutlinedIcon },
  { key: 'extras', Icon: TuneIcon },
  { key: 'dashboard', Icon: DashboardOutlinedIcon },
]

// The whole installation, with docker compose. The same four commands are in
// the quick start document; keep the two the same.
const install = `mkdir -p /opt/teanode && cd /opt/teanode
curl -LO https://raw.githubusercontent.com/ziyan/teanode/main/deploy/docker-compose.yml
docker run --rm ghcr.io/ziyan/teanode:latest config env --output - \\
  --hostname mail.example.com --domain example.com > .env
chmod 600 .env
docker compose up -d`

export const WelcomePage = () => {
  const translate = useTranslate()
  const quickStart = generatePath(routes.docPath, { docId: 'quick-start' })
  const snippet = useMemo(() => renderMarkdown('```bash\n' + install + '\n```'), [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div>
      <title>{`${translate('title')}: ${translate('tagline')}`}</title>
      <PublicShell>
        {/* The name, the one line that says what it is, and the two things
            worth doing next. The mark is large here and nowhere else. */}
        <Section sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 4, md: 6 } }}>
          <Stack sx={{ alignItems: 'flex-start', gap: 3 }}>
            <Mark size={72}/>
            <Box>
              <Typography variant='h1' sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, mb: 1.5 }}>
                <T id='tagline'/>
              </Typography>
              <Typography sx={{ maxWidth: measure, fontSize: 17, color: 'text.secondary' }}>
                <T id='welcome.lead'/>
              </Typography>
            </Box>
            <Stack direction='row' spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
              <Button component={NavLink} to={quickStart} variant='contained' size='large'>
                <T id='welcome.getStarted'/>
              </Button>
              <Button href={links.repository} target='_blank' rel='noopener' variant='outlined' size='large' startIcon={<GitHubIcon/>}>
                <T id='welcome.viewSource'/>
              </Button>
            </Stack>
            <Typography sx={{ maxWidth: measure }}>
              <T id='welcome.notMailbox'/>
            </Typography>
          </Stack>
        </Section>

        {/* What it looks like: the dashboard, one page at a time. */}
        <Section sx={{ pb: { xs: 4, md: 8 } }}>
          <Overline><T id='welcome.screenshotsHeading'/></Overline>
          <Carousel/>
        </Section>

        <Section band>
          <Overline><T id='welcome.whyHeading'/></Overline>
          <Typography sx={{ maxWidth: measure, fontSize: 16 }}><T id='welcome.why'/></Typography>
        </Section>

        {/* Each thing it does on a card of its own, with an icon so the eye
            can tell the cards apart before reading them. */}
        <Section>
          <Overline><T id='welcome.featuresHeading'/></Overline>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5 }}>
            {features.map(({ key, Icon }) => (
              <Box key={key} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: '12px', bgcolor: 'background.paper' }}>
                <Box
                  sx={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34, mb: 1.5, borderRadius: '8px',
                    bgcolor: 'background.default', border: 1, borderColor: 'divider', color: 'text.primary',
                  }}
                >
                  <Icon sx={{ fontSize: 20 }}/>
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: 14.5, mb: 0.5 }}>
                  <T id={`welcome.features.${key}.title`}/>
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.5 }}>
                  <T id={`welcome.features.${key}.body`}/>
                </Typography>
              </Box>
            ))}
          </Box>
        </Section>

        <Section band>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 6 } }}>
            <Box sx={{ minWidth: 0 }}>
              <Overline><T id='welcome.startHeading'/></Overline>
              <Typography sx={{ mb: 2 }}><T id='welcome.startLead'/></Typography>
              <Markdown html={snippet.html} compact/>
              <Typography sx={{ mt: 2 }} variant='body2' color='text.secondary'>
                <T id='welcome.startAfter'/>
                {' '}
                <Link component={NavLink} to={quickStart} color='text.primary'><T id='welcome.startWalkthrough'/></Link>.
              </Typography>
            </Box>
            <Box>
              <Overline><T id='welcome.needHeading'/></Overline>
              <Stack component='ul' sx={{ m: 0, pl: 2.5, gap: 1, fontSize: 15 }}>
                <li><T id='welcome.needs.domain'/></li>
                <li><T id='welcome.needs.host'/></li>
                <li><T id='welcome.needs.docker'/></li>
              </Stack>
              <Typography sx={{ mt: 2 }} variant='body2' color='text.secondary'>
                <T id='welcome.needsAfter'/>
              </Typography>
            </Box>
          </Box>
        </Section>
      </PublicShell>
    </div>
  )
}

// One band of the page. A band with `band` set sits on the rail colour, one
// step off the page, so the sections read as groups rather than as one long
// column.
const Section = ({ children, band, sx }: { children: ReactNode, band?: boolean, sx?: object }) => (
  <Box
    sx={{
      ...(band && { bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0c0c0e' : '#f7f7f6'), borderTop: 1, borderBottom: 1, borderColor: 'divider' }),
    }}
  >
    <Box sx={{ ...pageWidth, py: { xs: 4, md: 6 }, ...sx }}>
      {children}
    </Box>
  </Box>
)

// The small heading over a band, the way the dashboard labels a row of tiles.
const Overline = ({ children }: { children: ReactNode }) => (
  <Typography
    component='h2'
    sx={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary', mb: 2 }}
  >
    {children}
  </Typography>
)
