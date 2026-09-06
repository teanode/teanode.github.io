import { useEffect, useMemo } from 'react'
import { NavLink, generatePath } from 'react-router'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import GitHubIcon from '@mui/icons-material/GitHub'

import { Markdown, renderMarkdown } from '../components/markdown'
import { Mark } from '../components/logo'
import { pageWidth, PublicShell } from '../components/shell'
import { T, useTranslate } from '../i18n'
import routes, { links } from '../routes'

//
// WelcomePage
//
// The front page: what TeaNode is, what it looks like, what it does, and how
// to start. The words are the README's, so that the site and the repository
// say the same thing.
//

// The width prose is allowed to get. One number, the dashboard's, because two
// paragraphs on one page wrapping in different places looks like a bug.
const measure = '74ch'

const features = ['authenticates', 'forwards', 'relays', 'shows', 'sends', 'reports', 'extras', 'dashboard']

const install = `curl -L -o /usr/local/bin/teanode-server \\
  https://github.com/ziyan/teanode/releases/latest/download/teanode-server-linux-amd64
curl -L -o /usr/local/bin/teanode \\
  https://github.com/ziyan/teanode/releases/latest/download/teanode-linux-amd64
chmod +x /usr/local/bin/teanode-server /usr/local/bin/teanode

mkdir -p /opt/teanode && cd /opt/teanode
teanode-server config env --output .env \\
  --hostname mail.example.com --domain example.com
# edit .env: a PostgreSQL to reach, an address for certificate expiry warnings

set -a; . ./.env; set +a
teanode-server config init
teanode dkim show example.com
teanode-server run`

export const WelcomePage = () => {
  const translate = useTranslate()
  const dark = useTheme().palette.mode === 'dark'
  const gettingStarted = generatePath(routes.docPath, { docId: 'getting-started' })
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
              <Button component={NavLink} to={gettingStarted} variant='contained' size='large'>
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

        {/* What it looks like. The dashboard is compiled into the binary, so
            this is the whole product, not a separate one. */}
        <Section sx={{ pb: { xs: 4, md: 8 } }}>
          <Box
            component='figure'
            sx={{
              m: 0, borderRadius: '12px', border: 1, borderColor: 'divider', overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            <Box component='img' src={dark ? '/media/mail-list.jpg' : '/media/mail-list-light.jpg'} alt={translate('welcome.screenshotCaption')} width={1505} height={812}
              sx={{ display: 'block', width: '100%', height: 'auto' }}/>
            <Typography component='figcaption' variant='body2' color='text.secondary' sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
              <T id='welcome.screenshotCaption'/>
            </Typography>
          </Box>
        </Section>

        <Section band>
          <Overline><T id='welcome.whyHeading'/></Overline>
          <Typography sx={{ maxWidth: measure, fontSize: 16 }}><T id='welcome.why'/></Typography>
        </Section>

        {/* Each thing it does, on a card of its own: a handful of things,
            each with a name and a line about it, the way the dashboard's
            settings hub lays out its destinations. */}
        <Section>
          <Overline><T id='welcome.featuresHeading'/></Overline>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5 }}>
            {features.map((feature) => (
              <Box key={feature} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: '12px', bgcolor: 'background.paper' }}>
                <Typography sx={{ fontWeight: 600, fontSize: 14.5, mb: 0.5 }}>
                  <T id={`welcome.features.${feature}.title`}/>
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.5 }}>
                  <T id={`welcome.features.${feature}.body`}/>
                </Typography>
              </Box>
            ))}
          </Box>
        </Section>

        <Section band>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 6 } }}>
            <Box>
              <Overline><T id='welcome.startHeading'/></Overline>
              <Typography sx={{ mb: 2 }}><T id='welcome.startLead'/></Typography>
              <Markdown html={snippet.html} compact/>
              <Typography sx={{ mt: 2 }} variant='body2' color='text.secondary'>
                <T id='welcome.startAfter'/>
                {' '}
                <Link component={NavLink} to={gettingStarted} color='text.primary'><T id='welcome.startWalkthrough'/></Link>.
              </Typography>
            </Box>
            <Box>
              <Overline><T id='welcome.needHeading'/></Overline>
              <Stack component='ul' sx={{ m: 0, pl: 2.5, gap: 1, fontSize: 15 }}>
                <li><T id='welcome.needs.domain'/></li>
                <li><T id='welcome.needs.host'/></li>
                <li><T id='welcome.needs.database'/></li>
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
const Section = ({ children, band, sx }: { children: React.ReactNode, band?: boolean, sx?: object }) => (
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
const Overline = ({ children }: { children: React.ReactNode }) => (
  <Typography
    component='h2'
    sx={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary', mb: 2 }}
  >
    {children}
  </Typography>
)
