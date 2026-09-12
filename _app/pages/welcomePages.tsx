import { useEffect, useMemo, type ReactNode } from 'react'
import { NavLink, generatePath } from 'react-router'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { SvgIconComponent } from '@mui/icons-material'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import CallSplitIcon from '@mui/icons-material/CallSplit'
import CheckIcon from '@mui/icons-material/Check'
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined'
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined'
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import GitHubIcon from '@mui/icons-material/GitHub'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined'
import MailOutlineIcon from '@mui/icons-material/EmailOutlined'
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined'
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined'
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined'
import RemoveIcon from '@mui/icons-material/Remove'
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined'
import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined'
import SortOutlinedIcon from '@mui/icons-material/SortOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined'

import { Carousel } from '../components/carousel'
import { Route, Steam } from '../components/decoration'
import { Flow } from '../components/flow'
import { Markdown, renderMarkdown } from '../components/markdown'
import { Mark } from '../components/logo'
import { Release } from '../components/release'
import { pageWidth, PublicShell } from '../components/shell'
import { StackComparison } from '../components/stack'
import { T, useTranslate } from '../i18n'
import { brand, monospaceFamily } from '../theme'
import routes, { links } from '../routes'

//
// WelcomePage
//
// The front page: what TeaNode is, what it looks like, what it does, and how
// to start. Pictures where a picture will do; the words are the documents'.
//

const measure = '60ch'

const features: { key: string, Icon: SvgIconComponent }[] = [
  { key: 'mailbox', Icon: InboxOutlinedIcon },
  { key: 'imap', Icon: DevicesOutlinedIcon },
  { key: 'authenticates', Icon: VerifiedUserOutlinedIcon },
  { key: 'forwards', Icon: CallSplitIcon },
  { key: 'subscriptions', Icon: NewspaperOutlinedIcon },
  { key: 'marks', Icon: LabelOutlinedIcon },
  { key: 'access', Icon: GroupsOutlinedIcon },
  { key: 'shows', Icon: VisibilityOutlinedIcon },
]

// What comes with it and is off until asked for: a row of names rather than
// a paragraph about them.
const extras = ['templates', 'contacts', 'cli', 'clamav', 'spamd', 'geoip', 's3', 'socks5', 'dns01']

// What a personal agent does, once somebody turns theirs on. Four things
// rather than the whole list, because the whole list is the documentation.
const agentPoints: { key: string, Icon: SvgIconComponent }[] = [
  { key: 'sorts', Icon: SortOutlinedIcon },
  { key: 'drafts', Icon: ReplyOutlinedIcon },
  { key: 'answers', Icon: AutoAwesomeOutlinedIcon },
  { key: 'asks', Icon: ChatBubbleOutlineOutlinedIcon },
]

// Three addresses and where each one goes, which is the whole idea in the
// form most people first meet it.
const examples: { key: string, Icon: SvgIconComponent }[] = [
  { key: 'you', Icon: MailOutlineIcon },
  { key: 'hello', Icon: RocketLaunchOutlinedIcon },
  { key: 'support', Icon: ConfirmationNumberOutlinedIcon },
  { key: 'noreply', Icon: SmartphoneOutlinedIcon },
]

const needs: { key: string, Icon: SvgIconComponent }[] = [
  { key: 'domain', Icon: LanguageOutlinedIcon },
  { key: 'host', Icon: DnsOutlinedIcon },
  { key: 'docker', Icon: WidgetsOutlinedIcon },
]

// The comparison: what TeaNode does against the things somebody deciding is
// likely weighing it against. The rows are keys into the translations, and
// each cell is one of yes, no, or a short note in the reader's language.
const comparisonColumns = ['teanode', 'cloudflare', 'improvmx', 'provider']
const comparisonRows = ['receive', 'mailbox', 'send', 'domains', 'webhook', 'yours', 'price']

const questions = ['port25', 'mailprogram', 'forwarding', 'outbound', 'team', 'stored']

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
        <Section decoration={<Route/>} sx={{ pt: { xs: 6, md: 9 }, pb: { xs: 4, md: 12 } }}>
          <Box
            sx={{
              position: 'relative',
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
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5 }}>
            {examples.map(({ key, Icon }) => (
              <Card key={key}>
                <Tile><Icon sx={{ fontSize: 22 }}/></Tile>
                <Typography sx={{ fontFamily: monospaceFamily, fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                  {key}@example.com
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.5 }}>
                  <T id={`welcome.examples.${key}`}/>
                </Typography>
              </Card>
            ))}
          </Box>
        </Section>

        {/* Why: the usual pile against the one program, then the table. */}
        <Section>
          <Overline><T id='welcome.whyHeading'/></Overline>
          <StackComparison/>
        </Section>

        <Section sx={{ pt: 0 }}>
          <Overline><T id='welcome.comparison.heading'/></Overline>
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

        {/* Each thing it does on a card of its own, one line each, and the
            extras as a row of names. */}
        <Section band>
          <Overline><T id='welcome.featuresHeading'/></Overline>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 1.5 }}>
            {features.map(({ key, Icon }) => (
              <Card key={key}>
                <Tile><Icon sx={{ fontSize: 22 }}/></Tile>
                <Typography sx={{ fontWeight: 600, fontSize: 14.5, mb: 0.5 }}>
                  <T id={`welcome.features.${key}.title`}/>
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.5 }}>
                  <T id={`welcome.features.${key}.body`}/>
                </Typography>
              </Card>
            ))}
          </Box>
          <Stack direction='row' sx={{ mt: 2.5, flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography variant='body2' color='text.secondary' sx={{ mr: 0.5 }}><T id='welcome.extrasLead'/></Typography>
            {extras.map((key) => (
              <Chip key={key} variant='outlined' label={translate(`welcome.extras.${key}`)} sx={{ height: 26, fontSize: 12.5 }}/>
            ))}
          </Stack>
        </Section>

        {/* The agent. Its own section rather than a ninth card: it is the
            largest thing here since mailboxes, and the sentence that has to
            land is the one about it being off until somebody turns it on. */}
        <Section>
          <Overline><T id='welcome.agent.heading'/></Overline>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 6fr' }, gap: { xs: 3, md: 6 } }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ mb: 2 }}><T id='welcome.agent.lead'/></Typography>
              <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.6 }}>
                <T id='welcome.agent.privacy'/>
              </Typography>
            </Box>
            <Stack sx={{ minWidth: 0, gap: 1.5 }}>
              {agentPoints.map(({ key, Icon }) => (
                <Stack key={key} direction='row' sx={{ gap: 1.5, alignItems: 'flex-start' }}>
                  <Tile sx={{ mb: 0, flexShrink: 0, width: 34, height: 34, borderRadius: '9px' }}>
                    <Icon sx={{ fontSize: 18 }}/>
                  </Tile>
                  <Box sx={{ minWidth: 0, pt: 0.25 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 14.5 }}>
                      <T id={`welcome.agent.points.${key}.title`}/>
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.5 }}>
                      <T id={`welcome.agent.points.${key}.body`}/>
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>
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
              <Stack sx={{ gap: 1.5 }}>
                {needs.map(({ key, Icon }) => (
                  <Stack key={key} direction='row' sx={{ gap: 1.5, alignItems: 'center' }}>
                    <Tile sx={{ mb: 0, flex: 'none' }}><Icon sx={{ fontSize: 22 }}/></Tile>
                    <Typography sx={{ fontSize: 15 }}><T id={`welcome.needs.${key}`}/></Typography>
                  </Stack>
                ))}
              </Stack>
              <Typography sx={{ mt: 2.5 }} variant='body2' color='text.secondary'>
                <T id='welcome.needsAfter'/>
              </Typography>
            </Box>
          </Box>
        </Section>

        {/* The questions that stop people. Folded, so the page shows the
            questions and the reader opens the one that is theirs. */}
        <Section band>
          <Overline><T id='welcome.questionsHeading'/></Overline>
          <Box sx={{ maxWidth: 760 }}>
            {questions.map((key) => (
              <Accordion
                key={key}
                disableGutters
                elevation={0}
                sx={{
                  bgcolor: 'transparent', '&::before': { display: 'none' },
                  borderBottom: 1, borderColor: 'divider',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon/>} sx={{ px: 0, minHeight: 48 }}>
                  <Typography component='h3' sx={{ fontWeight: 600, fontSize: 15 }}>
                    <T id={`welcome.questions.${key}.question`}/>
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 0, pb: 2, fontSize: 14.5, color: 'text.secondary', '& p': { m: 0 } }}>
                  <Markdown html={answers[key]} compact/>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Section>
      </PublicShell>
    </div>
  )
}

// One card in a grid.
const Card = ({ children }: { children: ReactNode }) => (
  <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: '12px', bgcolor: 'background.paper' }}>
    {children}
  </Box>
)

// The small square an icon sits in, the way the dashboard's tiles draw theirs.
const Tile = ({ children, sx }: { children: ReactNode, sx?: object }) => (
  <Box
    sx={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 40, height: 40, mb: 1.5, borderRadius: '10px',
      bgcolor: 'background.default', border: 1, borderColor: 'divider', color: 'text.primary',
      ...sx,
    }}
  >
    {children}
  </Box>
)

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
// A band carries the steam across its top seam; any section can carry a
// decoration of its own behind its content.
const Section = ({ children, band, decoration, sx }: { children: ReactNode, band?: boolean, decoration?: ReactNode, sx?: object }) => (
  <Box
    sx={{
      // Clipped sideways only: the route is drawn wider than the window. Up
      // and down is left alone, so the steam can straddle the seam.
      position: 'relative', overflowX: 'clip',
      ...(band && { bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0c0c0e' : '#f7f7f6'), borderBottom: 1, borderColor: 'divider' }),
    }}
  >
    {band && <Steam/>}
    {decoration}
    <Box sx={{ ...pageWidth, position: 'relative', py: { xs: 4, md: 6 }, ...sx }}>
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
