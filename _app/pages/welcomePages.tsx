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
import CheckIcon from '@mui/icons-material/Check'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import GitHubIcon from '@mui/icons-material/GitHub'
import OutboxOutlinedIcon from '@mui/icons-material/OutboxOutlined'
import RemoveIcon from '@mui/icons-material/Remove'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'

import { Carousel } from '../components/carousel'
import { Flow } from '../components/flow'
import { Markdown, renderMarkdown } from '../components/markdown'
import { Mark } from '../components/logo'
import { Release } from '../components/release'
import { pageWidth, PublicShell } from '../components/shell'
import { T, useTranslate } from '../i18n'
import { brand, monospaceFamily } from '../theme'
import routes, { links } from '../routes'

//
// WelcomePage
//
// The front page: what TeaNode is, what it looks like, what it does, and how
// to start.
//

// The width prose is allowed to get. One number, the dashboard's, because two
// paragraphs on one page wrapping in different places looks like a bug.
const measure = '68ch'

const features: { key: string, Icon: SvgIconComponent }[] = [
  { key: 'authenticates', Icon: VerifiedUserOutlinedIcon },
  { key: 'forwards', Icon: CallSplitIcon },
  { key: 'relays', Icon: OutboxOutlinedIcon },
  { key: 'shows', Icon: VisibilityOutlinedIcon },
  { key: 'sends', Icon: DescriptionOutlinedIcon },
  { key: 'reports', Icon: AssessmentOutlinedIcon },
]

// Three addresses and where each one goes, which is the whole idea in the
// form most people first meet it.
const examples = ['hello', 'support', 'noreply']

// The comparison: what TeaNode does against the things somebody deciding is
// likely weighing it against. The rows are keys into the translations, and
// each cell is one of yes, no, or a short note in the reader's language.
const comparisonColumns = ['teanode', 'cloudflare', 'improvmx', 'provider']
const comparisonRows = ['receive', 'send', 'domains', 'webhook', 'yours', 'price']

const questions = ['port25', 'reply', 'outbound', 'stored']

// The whole installation, with docker compose. The same commands are in the
// quick start document; keep the two the same. Broken across lines so that
// every line fits the block on a phone without scrolling sideways.
const install = `mkdir -p /opt/teanode && cd /opt/teanode
curl -LO \\
  https://raw.githubusercontent.com/ziyan/teanode/main/deploy/docker-compose.yml
docker run --rm ghcr.io/ziyan/teanode:latest \\
  config env --output - \\
  --hostname mail.example.com \\
  --domain example.com > .env
chmod 600 .env
docker compose up -d`

export const WelcomePage = () => {
  const translate = useTranslate()
  const quickStart = generatePath(routes.docPath, { docId: 'quick-start' })
  const snippet = useMemo(() => renderMarkdown('```bash\n' + install + '\n```'), [])
  const answers = useMemo(
    () => Object.fromEntries(questions.map((key) => [key, renderMarkdown(translate(`welcome.questions.${key}.answer`)).html])),
    [translate],
  )

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div>
      <title>{`${translate('title')}: ${translate('tagline')}`}</title>
      <PublicShell>
        {/* The name, the one line that says what it is, and the two things
            worth doing next, with the picture of what happens to a message
            beside them. The mark is large here and nowhere else. */}
        <Section sx={{ pt: { xs: 6, md: 9 }, pb: { xs: 4, md: 6 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
              gap: { xs: 4, md: 6 },
              alignItems: 'center',
            }}
          >
            <Stack sx={{ alignItems: 'flex-start', gap: 3 }}>
              <Mark size={64}/>
              <Box>
                <Typography variant='h1' sx={{ fontSize: { xs: '2.1rem', md: '2.8rem' }, lineHeight: 1.12, mb: 2 }}>
                  <T id='welcome.headline'/>
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
              <Release/>
            </Stack>
            <Flow/>
          </Box>
        </Section>

        {/* What it looks like: the dashboard, one page at a time. */}
        <Section sx={{ pb: { xs: 4, md: 8 } }}>
          <Overline><T id='welcome.screenshotsHeading'/></Overline>
          <Carousel/>
        </Section>

        {/* Three addresses, and where each one goes. */}
        <Section band>
          <Overline><T id='welcome.examplesHeading'/></Overline>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
            {examples.map((key) => (
              <Box key={key} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: '12px', bgcolor: 'background.paper' }}>
                <Typography sx={{ fontFamily: monospaceFamily, fontSize: 14, fontWeight: 600, mb: 0.75 }}>
                  {key}@example.com
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.55 }}>
                  <T id={`welcome.examples.${key}`}/>
                </Typography>
              </Box>
            ))}
          </Box>
        </Section>

        {/* Why, and against what. */}
        <Section>
          <Overline><T id='welcome.whyHeading'/></Overline>
          <Typography sx={{ maxWidth: measure, fontSize: 16, mb: 4 }}><T id='welcome.why'/></Typography>
          <Box sx={{ overflowX: 'auto', border: 1, borderColor: 'divider', borderRadius: '12px' }}>
            <Box
              component='table'
              sx={{
                width: '100%', minWidth: 640, borderCollapse: 'collapse', fontSize: 14,
                '& th, & td': { textAlign: 'left', verticalAlign: 'top', px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' },
                '& tbody tr:last-of-type td': { borderBottom: 0 },
                '& th': { fontWeight: 600, fontSize: 13, color: 'text.secondary', bgcolor: 'background.default' },
                '& tbody th': { color: 'text.primary', fontSize: 14, whiteSpace: 'nowrap' },
                '& td.teanode, & th.teanode': { bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#16200d' : '#f4f9ea') },
                '& thead th.teanode': { color: 'text.primary' },
              }}
            >
              <thead>
                <tr>
                  <th scope='col'/>
                  {comparisonColumns.map((column) => (
                    <th key={column} scope='col' className={column}>
                      <T id={`welcome.comparison.columns.${column}`}/>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row}>
                    <th scope='row'><T id={`welcome.comparison.rows.${row}`}/></th>
                    {comparisonColumns.map((column) => (
                      <td key={column} className={column}>
                        <Cell value={translate(`welcome.comparison.cells.${row}.${column}`)}/>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1.5 }}>
            <T id='welcome.comparison.note'/>
          </Typography>
        </Section>

        {/* Each thing it does on a card of its own, with an icon so the eye
            can tell the cards apart before reading them. */}
        <Section band>
          <Overline><T id='welcome.featuresHeading'/></Overline>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 1.5 }}>
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
          <Typography variant='body2' color='text.secondary' sx={{ mt: 2, maxWidth: measure }}>
            <T id='welcome.featuresAlso'/>
          </Typography>
        </Section>

        <Section>
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

        {/* The questions that stop people, answered in a line or two each
            with a link to the document that says the rest. */}
        <Section band>
          <Overline><T id='welcome.questionsHeading'/></Overline>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: { xs: 2.5, md: 4 } }}>
            {questions.map((key) => (
              <Box key={key}>
                <Typography component='h3' sx={{ fontWeight: 600, fontSize: 15, mb: 0.5 }}>
                  <T id={`welcome.questions.${key}.question`}/>
                </Typography>
                <Box sx={{ fontSize: 14.5, color: 'text.secondary', '& p': { m: 0 } }}>
                  <Markdown html={answers[key]} compact/>
                </Box>
              </Box>
            ))}
          </Box>
        </Section>
      </PublicShell>
    </div>
  )
}

// One cell of the comparison. "yes" and "no" are drawn as a tick and a dash
// so the table can be read from across the room; anything else is a note.
const Cell = ({ value }: { value: string }) => {
  if (value === 'yes') {
    return <CheckIcon sx={{ fontSize: 18, color: brand.leaf, verticalAlign: 'middle' }} titleAccess='yes'/>
  }
  if (value === 'no') {
    return <RemoveIcon sx={{ fontSize: 18, color: 'text.disabled', verticalAlign: 'middle' }} titleAccess='no'/>
  }
  return <>{value}</>
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
