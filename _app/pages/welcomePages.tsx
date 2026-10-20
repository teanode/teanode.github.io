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
import { useTheme } from '@mui/material/styles'
import type { SvgIconComponent } from '@mui/icons-material'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import BackupOutlinedIcon from '@mui/icons-material/BackupOutlined'
import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CallSplitIcon from '@mui/icons-material/CallSplit'
import CheckIcon from '@mui/icons-material/Check'
import ContactsOutlinedIcon from '@mui/icons-material/ContactsOutlined'
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined'
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined'
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined'
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined'
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import EditLocationAltOutlinedIcon from '@mui/icons-material/EditLocationAltOutlined'
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined'
import FaceOutlinedIcon from '@mui/icons-material/FaceOutlined'
import FamilyRestroomOutlinedIcon from '@mui/icons-material/FamilyRestroomOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import GitHubIcon from '@mui/icons-material/GitHub'
import GraphicEqOutlinedIcon from '@mui/icons-material/GraphicEqOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import HearingOutlinedIcon from '@mui/icons-material/HearingOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import ImageSearchOutlinedIcon from '@mui/icons-material/ImageSearchOutlined'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined'
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined'
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined'
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined'
import MailOutlineIcon from '@mui/icons-material/EmailOutlined'
import MicNoneOutlinedIcon from '@mui/icons-material/MicNoneOutlined'
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined'
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined'
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined'
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import PriceCheckOutlinedIcon from '@mui/icons-material/PriceCheckOutlined'
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined'
import RecordVoiceOverOutlinedIcon from '@mui/icons-material/RecordVoiceOverOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined'
import RemoveIcon from '@mui/icons-material/Remove'
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined'
import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined'
import SortOutlinedIcon from '@mui/icons-material/SortOutlined'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import WebOutlinedIcon from '@mui/icons-material/WebOutlined'
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined'

import { Carousel } from '../components/carousel'
import { Route, Steam } from '../components/decoration'
import { Flow } from '../components/flow'
import { Markdown, renderMarkdown } from '../components/markdown'
import { Mark } from '../components/logo'
import { Phone, PhoneGallery, type PhoneScreen } from '../components/phone'
import { Release } from '../components/release'
import { pageWidth, PublicShell } from '../components/shell'
import { Conversation } from '../components/conversation'
import { installCommand } from './startPages'
import { screenshot, screenshotGroups, type ScreenshotGroup } from '../screenshots'
import { StackComparison } from '../components/stack'
import { T, useLanguageCode, useTranslate } from '../i18n'
import { brand, monospaceFamily } from '../theme'
import routes, { links } from '../routes'

//
// WelcomePage
//
// The front page: a personal assistant on a server of your own. What it looks
// after, the iPhone app it lives in, what it does in each part of a life, what
// it remembers, and then the mail server it can also be. Pictures where a
// picture will do; the words are the documents'.
//

const measure = '60ch'

// The core of it, one section each, in the order the index shows them: the
// conversation first, since everything else is reached through it, then the
// things a day meets, then the things a year does. Each says which of the
// dashboard's pictures it shows, which of the app's screens stands beside
// them, its points, and where to read more.
type CorePoint = { id: string, Icon: SvgIconComponent }
type CoreFeature = {
  key: ScreenshotGroup
  Icon: SvgIconComponent
  phone: PhoneScreen
  points: CorePoint[]
  docId?: string
  href?: string
  chips?: { lead: string, ids: string[] }
}

const coreFeatures: CoreFeature[] = [
  {
    key: 'chat', Icon: ForumOutlinedIcon, phone: 'conversation', docId: 'agents',
    points: [
      { id: 'welcome.agent.points.asks', Icon: ChatBubbleOutlineOutlinedIcon },
      { id: 'welcome.people.points.chats', Icon: ForumOutlinedIcon },
      { id: 'welcome.core.chat.points.call', Icon: PhoneInTalkOutlinedIcon },
      { id: 'welcome.phone.points.notify', Icon: NotificationsActiveOutlinedIcon },
    ],
  },
  {
    key: 'mail', Icon: InboxOutlinedIcon, phone: 'followups', href: '#mail',
    points: [
      { id: 'welcome.agent.points.sorts', Icon: SortOutlinedIcon },
      { id: 'welcome.agent.points.drafts', Icon: ReplyOutlinedIcon },
      { id: 'welcome.agent.points.follows', Icon: TaskAltOutlinedIcon },
      { id: 'welcome.agent.points.answers', Icon: AutoAwesomeOutlinedIcon },
    ],
  },
  {
    key: 'calendar', Icon: CalendarMonthOutlinedIcon, phone: 'calendar',
    points: [
      { id: 'welcome.core.calendar.points.sync', Icon: DevicesOutlinedIcon },
      { id: 'welcome.core.calendar.points.invites', Icon: EventAvailableOutlinedIcon },
      { id: 'welcome.people.points.calendars', Icon: GroupsOutlinedIcon },
      { id: 'welcome.agent.points.nearby', Icon: ExploreOutlinedIcon },
    ],
  },
  {
    key: 'contacts', Icon: ContactsOutlinedIcon, phone: 'contacts', docId: 'circles',
    points: [
      { id: 'welcome.core.contacts.points.sync', Icon: DevicesOutlinedIcon },
      { id: 'welcome.core.contacts.points.circles', Icon: Diversity3OutlinedIcon },
      { id: 'welcome.people.points.relationships', Icon: FamilyRestroomOutlinedIcon },
      { id: 'welcome.core.contacts.points.agent', Icon: AutoAwesomeOutlinedIcon },
    ],
  },
  {
    key: 'photos', Icon: PhotoLibraryOutlinedIcon, phone: 'photos', docId: 'photos',
    points: [
      { id: 'welcome.photos.points.backup', Icon: BackupOutlinedIcon },
      { id: 'welcome.photos.points.find', Icon: ImageSearchOutlinedIcon },
      { id: 'welcome.photos.points.people', Icon: FaceOutlinedIcon },
      { id: 'welcome.photos.points.albums', Icon: PhotoLibraryOutlinedIcon },
      { id: 'welcome.photos.points.places', Icon: EditLocationAltOutlinedIcon },
    ],
  },
  {
    key: 'location', Icon: PlaceOutlinedIcon, phone: 'location', docId: 'location',
    points: [
      { id: 'welcome.core.location.points.visits', Icon: PlaceOutlinedIcon },
      { id: 'welcome.core.location.points.places', Icon: EditLocationAltOutlinedIcon },
      { id: 'welcome.people.points.location', Icon: Diversity3OutlinedIcon },
      { id: 'welcome.core.location.points.agent', Icon: AutoAwesomeOutlinedIcon },
    ],
  },
  {
    key: 'health', Icon: FavoriteBorderOutlinedIcon, phone: 'health', href: '/app/privacy.html',
    points: [
      { id: 'welcome.core.health.points.copied', Icon: BackupOutlinedIcon },
      { id: 'welcome.core.health.points.charts', Icon: ShowChartOutlinedIcon },
      { id: 'welcome.core.health.points.sharing', Icon: Diversity3OutlinedIcon },
      { id: 'welcome.core.health.points.agent', Icon: VerifiedUserOutlinedIcon },
    ],
  },
  {
    key: 'coding', Icon: TerminalOutlinedIcon, phone: 'coding', docId: 'coding-sessions',
    points: [
      { id: 'welcome.coding.points.sees', Icon: TerminalOutlinedIcon },
      { id: 'welcome.coding.points.page', Icon: WebOutlinedIcon },
      { id: 'welcome.coding.points.asks', Icon: HelpOutlineOutlinedIcon },
      { id: 'welcome.coding.points.remembers', Icon: AccountTreeOutlinedIcon },
      { id: 'welcome.coding.points.anywhere', Icon: DirectionsCarOutlinedIcon },
    ],
  },
  {
    key: 'knowledge', Icon: PsychologyOutlinedIcon, phone: 'knowledge', docId: 'memory',
    points: [
      { id: 'welcome.memory.points.writes', Icon: AccountTreeOutlinedIcon },
      { id: 'welcome.memory.points.reads', Icon: LibraryBooksOutlinedIcon },
      { id: 'welcome.memory.points.dreams', Icon: BedtimeOutlinedIcon },
    ],
    chips: { lead: 'welcome.memory.sourcesLead', ids: ['checkout', 'archive', 'notes', 'wiki', 'web', 'sent'].map((key) => `welcome.memory.sources.${key}`) },
  },
  {
    key: 'recordings', Icon: MicNoneOutlinedIcon, phone: 'recording',
    points: [
      { id: 'welcome.meetings.points.live', Icon: GraphicEqOutlinedIcon },
      { id: 'welcome.meetings.points.speakers', Icon: PeopleOutlineOutlinedIcon },
      { id: 'welcome.meetings.points.corrections', Icon: EditNoteOutlinedIcon },
      { id: 'welcome.meetings.points.memory', Icon: AccountTreeOutlinedIcon },
    ],
  },
  {
    key: 'finance', Icon: AccountBalanceOutlinedIcon, phone: 'finance', docId: 'finance',
    points: [
      { id: 'welcome.finance.points.linked', Icon: AccountBalanceOutlinedIcon },
      { id: 'welcome.finance.points.categories', Icon: LabelOutlinedIcon },
      { id: 'welcome.finance.points.receipts', Icon: ReceiptLongOutlinedIcon },
      { id: 'welcome.finance.points.budgets', Icon: SavingsOutlinedIcon },
      { id: 'welcome.finance.points.netWorth', Icon: ShowChartOutlinedIcon },
      { id: 'welcome.core.finance.points.taxes', Icon: RequestQuoteOutlinedIcon },
    ],
  },
  {
    key: 'payments', Icon: PaymentsOutlinedIcon, phone: 'payment', docId: 'circles',
    points: [
      { id: 'welcome.core.payments.points.agent', Icon: PaymentsOutlinedIcon },
      { id: 'welcome.core.payments.points.share', Icon: Diversity3OutlinedIcon },
      { id: 'welcome.core.payments.points.limits', Icon: PriceCheckOutlinedIcon },
      { id: 'welcome.core.payments.points.approve', Icon: NotificationsActiveOutlinedIcon },
    ],
  },
]

// What makes it safe to give an agent all of that: where it runs, which
// model it talks to, what it may do, and whose it is.
const yoursPoints: { key: string, Icon: SvgIconComponent }[] = [
  { key: 'hardware', Icon: DnsOutlinedIcon },
  { key: 'model', Icon: AutoAwesomeOutlinedIcon },
  { key: 'say', Icon: VerifiedUserOutlinedIcon },
  { key: 'open', Icon: GitHubIcon },
]

// The iPhone app: talking to it, hearing from it, calling it, handing it
// things, recording with it, what it keeps from the phone (its photos and
// where it has been), and the phone's own apps it fills in.
const phonePoints: { key: string, Icon: SvgIconComponent }[] = [
  { key: 'chat', Icon: ChatBubbleOutlineOutlinedIcon },
  { key: 'notify', Icon: NotificationsActiveOutlinedIcon },
  { key: 'call', Icon: PhoneInTalkOutlinedIcon },
  { key: 'share', Icon: IosShareOutlinedIcon },
  { key: 'record', Icon: MicNoneOutlinedIcon },
  { key: 'photos', Icon: BackupOutlinedIcon },
  { key: 'location', Icon: PlaceOutlinedIcon },
  { key: 'setup', Icon: SmartphoneOutlinedIcon },
]

const features: { key: string, Icon: SvgIconComponent }[] = [
  { key: 'mailbox', Icon: InboxOutlinedIcon },
  { key: 'imap', Icon: DevicesOutlinedIcon },
  { key: 'authenticates', Icon: VerifiedUserOutlinedIcon },
  { key: 'forwards', Icon: CallSplitIcon },
  { key: 'calendar', Icon: CalendarMonthOutlinedIcon },
  { key: 'subscriptions', Icon: NewspaperOutlinedIcon },
  { key: 'marks', Icon: LabelOutlinedIcon },
  { key: 'access', Icon: GroupsOutlinedIcon },
  { key: 'shows', Icon: VisibilityOutlinedIcon },
]

// What comes with it and is off until asked for: a row of names rather than
// a paragraph about them.
const extras = ['templates', 'cli', 'clamav', 'spamd', 'geoip', 's3', 'socks5', 'dns01']

// What the assistant can be given, in the order somebody would grant it.
const agentReach = ['mail', 'contacts', 'calendar', 'reminders', 'notes', 'photos', 'location', 'finances', 'computer', 'codingSessions', 'browser', 'web']

// A call with the agent: what it is like, in the order somebody notices it
// on their first call, then where the key is, which an operator asks.
const voicePoints: { key: string, Icon: SvgIconComponent }[] = [
  { key: 'call', Icon: PhoneInTalkOutlinedIcon },
  { key: 'ear', Icon: HearingOutlinedIcon },
  { key: 'cutIn', Icon: RecordVoiceOverOutlinedIcon },
  { key: 'key', Icon: KeyOutlinedIcon },
]

// Three addresses and where each one goes, which is the whole idea in the
// form most people first meet it.
const examples: { key: string, Icon: SvgIconComponent }[] = [
  { key: 'you', Icon: MailOutlineIcon },
  { key: 'hello', Icon: RocketLaunchOutlinedIcon },
  { key: 'support', Icon: ConfirmationNumberOutlinedIcon },
  { key: 'noreply', Icon: SmartphoneOutlinedIcon },
]

// What a server needs, the assistant's needs first and mail's last, since
// mail is the one somebody may leave out.
const needs: { key: string, Icon: SvgIconComponent }[] = [
  { key: 'host', Icon: WidgetsOutlinedIcon },
  { key: 'model', Icon: AutoAwesomeOutlinedIcon },
  { key: 'https', Icon: PhoneIphoneOutlinedIcon },
  { key: 'mail', Icon: DnsOutlinedIcon },
]

// The comparison: what TeaNode does as a mail server against the things
// somebody deciding is likely weighing it against. The rows are keys into the
// translations, and each cell is one of yes, no, or a short note in the
// reader's language.
const comparisonColumns = ['teanode', 'cloudflare', 'improvmx', 'provider']
const comparisonRows = ['receive', 'mailbox', 'send', 'domains', 'webhook', 'assistant', 'yours', 'price']

const questions = ['mailserver', 'app', 'family', 'model', 'port25', 'mailprogram', 'forwarding', 'outbound', 'team', 'stored']

// The assistant alone: no domain and no mail ports, one command. The get
// started page has it too, with every step after it.
const installAssistant = installCommand

// The whole installation with mail, with docker compose. The same commands
// are in the quick start document; keep the two the same. Broken across
// lines so that every line fits the block on a phone without scrolling
// sideways.
const installMail = `mkdir -p /opt/teanode && cd /opt/teanode
curl -LO \\
https://raw.githubusercontent.com/ziyan/teanode/main/deploy/docker-compose.yml
docker run --rm ghcr.io/ziyan/teanode:latest \\
  config env --output - \\
  --hostname mail.example.com \\
  --domain example.com > .env
chmod 600 .env
docker compose up -d`

const connect = `# point it at the address, then approve it in your browser
claude mcp add --transport http teanode \\
  https://teanode.example.com/api/v1/mcp

# or, on a machine your command line is signed in on
claude mcp add teanode -- teanode agent mcp serve`


export const WelcomePage = () => {
  const translate = useTranslate()
  const quickStart = generatePath(routes.docPath, { docId: 'quick-start' })
  const assistantSnippet = useMemo(() => renderMarkdown('```bash\n' + installAssistant + '\n```'), [])
  const mailSnippet = useMemo(() => renderMarkdown('```bash\n' + installMail + '\n```'), [])
  const mcpSnippet = useMemo(() => renderMarkdown('```bash\n' + connect + '\n```'), [])
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
        {/* The name, the one line that says what it is, and the three things
            worth doing next, with the app beside them: the phone is where
            most people will meet it. The mark is large here and nowhere
            else. */}
        <Section sx={{ pt: { xs: 6, md: 8 }, pb: { xs: 5, md: 9 } }}>
          <Box
            sx={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.15fr) minmax(0, 0.85fr)' },
              gap: { xs: 5, md: 6 },
              alignItems: 'center',
            }}
          >
            <Stack sx={{ alignItems: 'flex-start', gap: 3 }}>
              <Mark size={64}/>
              <Box>
                <Typography variant='h1' sx={{ fontSize: { xs: '2.1rem', md: '2.9rem' }, lineHeight: 1.1, mb: 2 }}>
                  <T id='welcome.headline'/>
                </Typography>
                <Typography sx={{ maxWidth: measure, fontSize: 17, color: 'text.secondary' }}>
                  <T id='welcome.lead'/>
                </Typography>
              </Box>
              <Stack direction='row' sx={{ flexWrap: 'wrap', gap: 1.5 }}>
                <Button component={NavLink} to={routes.startPath} variant='contained' size='large'>
                  <T id='welcome.getStarted'/>
                </Button>
                <Button href='#iphone' variant='outlined' size='large' startIcon={<PhoneIphoneOutlinedIcon/>}>
                  <T id='welcome.iphoneButton'/>
                </Button>
                <Button href={links.repository} target='_blank' rel='noopener' variant='text' size='large' startIcon={<GitHubIcon/>}>
                  <T id='welcome.viewSource'/>
                </Button>
              </Stack>
              <Release/>
            </Stack>
            <HeroPhones/>
          </Box>
        </Section>

        {/* The index: each core feature on a card, which jumps to the
            section that shows it. This is the claim the rest of the page
            backs up. */}
        <Section band>
          <Overline><T id='welcome.coreHeading'/></Overline>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5 }}>
            {coreFeatures.map(({ key, Icon }) => (
              <Box
                key={key}
                component='a'
                href={`#${key}`}
                sx={{
                  display: 'flex', gap: 1.5, alignItems: 'flex-start', p: 2, border: 1, borderColor: 'divider', borderRadius: '12px', bgcolor: 'background.paper',
                  color: 'inherit', textDecoration: 'none', transition: 'border-color 120ms',
                  '&:hover': { borderColor: brand.leaf },
                  '&:focus-visible': { outline: 2, outlineColor: brand.leaf, outlineOffset: 2 },
                }}
              >
                <Tile sx={{ mb: 0, flexShrink: 0 }}><Icon sx={{ fontSize: 22 }}/></Tile>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14.5, mb: 0.25 }}>
                    <T id={`welcome.core.${key}.name`}/>
                  </Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.5 }}>
                    <T id={`welcome.core.${key}.tile`}/>
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Section>

        {/* Why an agent that reaches all of that is safe to have: it is
            yours. Said once, plainly, before the parts it reaches. */}
        <Section>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 0.9fr) minmax(0, 1.1fr)' }, gap: { xs: 3, md: 6 }, alignItems: 'start' }}>
            <Box sx={{ minWidth: 0 }}>
              <Overline><T id='welcome.yours.heading'/></Overline>
              <Typography sx={{ fontSize: { xs: 18, md: 20 }, fontWeight: 600, lineHeight: 1.45, maxWidth: measure }}>
                <T id='welcome.yours.lead'/>
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.25 }}>
              {yoursPoints.map(({ key, Icon }) => (
                <Point key={key} Icon={Icon} id={`welcome.yours.points.${key}`}/>
              ))}
            </Box>
          </Box>
        </Section>

        {/* One section for each, the same shape every time, on alternate
            bands so they read as so many things rather than one long one. */}
        {coreFeatures.map((feature, at) => (
          <FeatureSection key={feature.key} feature={feature} band={at % 2 === 0}/>
        ))}

        {/* The agent behind all of it. The words on the left, the thing
            itself on the right: a recording of the drawer, drawn the way
            the dashboard draws it. Then calling it, and reaching it from
            outside TeaNode's own apps. */}
        <Section id='assistant' band={coreFeatures.length % 2 === 0}>
          <Overline><T id='welcome.agent.heading'/></Overline>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: { xs: 4, md: 6 }, alignItems: 'start' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ mb: 2 }}><T id='welcome.agent.lead'/></Typography>
              <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.6, mb: 2.5 }}>
                <T id='welcome.agent.privacy'/>
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                <T id='welcome.agent.reachLead'/>
              </Typography>
              <Stack direction='row' sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                {agentReach.map((key) => (
                  <Chip key={key} variant='outlined' label={translate(`welcome.agent.reach.${key}`)} sx={{ height: 26, fontSize: 12.5 }}/>
                ))}
              </Stack>
            </Box>
            <Box sx={{ minWidth: 0, justifySelf: { xs: 'center', md: 'end' }, width: '100%', maxWidth: 440 }}>
              <Conversation/>
            </Box>
          </Box>

          <PointsBlock section='voice' docId='voice' points={voicePoints}/>

          {/* The same kit reached from outside TeaNode's own apps, which is
              a different claim and reads badly folded into another. */}
          <Box
            sx={{
              display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
              gap: { xs: 2.5, md: 5 }, alignItems: 'start',
              mt: { xs: 4, md: 5 }, pt: { xs: 3, md: 4 }, borderTop: 1, borderColor: 'divider',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Overline><T id='welcome.mcp.heading'/></Overline>
              <Typography sx={{ maxWidth: measure, mb: 1.5 }}><T id='welcome.mcp.lead'/></Typography>
              <Typography variant='body2' color='text.secondary' sx={{ maxWidth: measure, lineHeight: 1.6 }}>
                <T id='welcome.mcp.body'/>
              </Typography>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Markdown html={mcpSnippet.html} compact/>
            </Box>
          </Box>
        </Section>

        {/* The iPhone app: the words and its eight points, then every screen
            in a row the reader scrolls, as wide as the window. */}
        <Section id='iphone' band={coreFeatures.length % 2 === 1} wide={<PhoneGallery/>}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' }, gap: { xs: 3, md: 6 }, alignItems: 'start' }}>
            <Box sx={{ minWidth: 0 }}>
              <Overline><T id='welcome.phone.heading'/></Overline>
              <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 600, lineHeight: 1.3, maxWidth: measure, mb: 2 }}>
                <T id='welcome.phone.lead'/>
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ maxWidth: measure, lineHeight: 1.6, mb: 2 }}>
                <T id='welcome.phone.body'/>
              </Typography>
              <Chip
                icon={<PhoneIphoneOutlinedIcon/>}
                label={translate('welcome.phone.availability')}
                variant='outlined'
                sx={{ borderColor: brand.leaf, color: 'text.primary', '& .MuiChip-icon': { color: brand.leaf } }}
              />
              <Link href='/app/privacy.html' color='text.secondary' variant='body2' sx={{ display: 'block', mt: 1.5 }}>
                <T id='welcome.phone.privacy'/>
              </Link>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.25 }}>
              {phonePoints.map(({ key, Icon }) => (
                <Point key={key} Icon={Icon} id={`welcome.phone.points.${key}`}/>
              ))}
            </Box>
          </Box>
        </Section>

        {/* The mail server it can also be. Everything about mail lives here,
            under one heading, so somebody who came for an assistant can
            skip it and somebody who came for mail finds all of it. */}
        <Section id='mail' band decoration={<Route/>}>
          <Box
            sx={{
              position: 'relative', display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
              gap: { xs: 4, md: 6 }, alignItems: 'center',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Overline><T id='welcome.mailHeading'/></Overline>
              <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 600, lineHeight: 1.3, maxWidth: measure, mb: 2 }}>
                <T id='welcome.headlineMail'/>
              </Typography>
              <Typography color='text.secondary' sx={{ maxWidth: measure }}>
                <T id='welcome.mailLead'/>
              </Typography>
            </Box>
            <Flow/>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5, mt: { xs: 4, md: 6 } }}>
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

        {/* Each thing the mail server does on a card of its own, one line
            each, and the extras as a row of names. */}
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

          {/* The pages set up once: the agent's settings, people and
              access, devices and domains. */}
          <Box sx={{ mt: { xs: 5, md: 7 } }}>
            <Overline><T id='welcome.screenshotsHeading'/></Overline>
            <Typography color='text.secondary' sx={{ maxWidth: measure, mb: 3 }}>
              <T id='welcome.screenshotsLead'/>
            </Typography>
            <Carousel pages={screenshotGroups.setup} label={translate('welcome.screenshotsHeading')}/>
          </Box>
        </Section>

        {/* Getting started: the assistant alone, or with mail, side by side,
            then what a server needs. */}
        <Section id='start'>
          <Overline><T id='welcome.startHeading'/></Overline>
          <Typography sx={{ mb: 3, maxWidth: measure }}><T id='welcome.startLead'/></Typography>
          <Stack sx={{ gap: { xs: 4, md: 3 } }}>
            <InstallRow
              which='assistant'
              snippet={assistantSnippet.html}
              after={<Link component={NavLink} to={routes.startPath} color='text.primary'><T id='welcome.startSteps'/></Link>}
            />
            <InstallRow
              which='mail'
              snippet={mailSnippet.html}
              after={<Link component={NavLink} to={quickStart} color='text.primary'><T id='welcome.startWalkthrough'/></Link>}
            />
          </Stack>
          <Box sx={{ mt: { xs: 4, md: 5 } }}>
            <Overline><T id='welcome.needHeading'/></Overline>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
              {needs.map(({ key, Icon }) => (
                <Stack key={key} direction='row' sx={{ gap: 1.5, alignItems: 'center' }}>
                  <Tile sx={{ mb: 0, flex: 'none' }}><Icon sx={{ fontSize: 22 }}/></Tile>
                  <Typography sx={{ fontSize: 15 }}><T id={`welcome.needs.${key}`}/></Typography>
                </Stack>
              ))}
            </Box>
            <Typography sx={{ mt: 2.5, maxWidth: measure }} variant='body2' color='text.secondary'>
              <T id='welcome.needsAfter'/>
            </Typography>
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

        {/* The end of the page, for whoever read all of it: the same way in
            as at the top. */}
        <Section sx={{ textAlign: 'center', py: { xs: 6, md: 9 } }}>
          <Stack sx={{ alignItems: 'center', gap: 2 }}>
            <Mark size={48}/>
            <Typography component='h2' sx={{ fontWeight: 650, fontSize: { xs: 26, md: 32 }, lineHeight: 1.15 }}>
              <T id='welcome.closingHeading'/>
            </Typography>
            <Typography sx={{ maxWidth: measure, fontSize: 17, color: 'text.secondary' }}>
              <T id='welcome.closingLead'/>
            </Typography>
            <Button component={NavLink} to={routes.startPath} variant='contained' size='large' sx={{ mt: 1 }}>
              <T id='welcome.getStarted'/>
            </Button>
          </Stack>
        </Section>
      </PublicShell>
    </div>
  )
}

// One core feature: its name, a line that says what it is, a paragraph,
// its points and where to read more across the top; then the dashboard's
// pages of it in a browser window, with the app's screen of it beside them.
// On a phone the app's screen is left out: the window is already as wide as
// the screen, and every app screen is in the iPhone section's row.
const FeatureSection = ({ feature, band }: { feature: CoreFeature, band: boolean }) => {
  const translate = useTranslate()
  const theme = useTheme()
  const language = useLanguageCode()
  const { key, Icon, phone, points, docId, href, chips } = feature
  // A part the dashboard has not been photographed for yet shows the app's
  // screen alone, on a phone too, rather than an empty window.
  const hasPicture = screenshotGroups[key].some((page) => screenshot(page, theme.palette.mode === 'dark' ? 'dark' : 'light', language))
  const more = docId
    ? <Button component={NavLink} to={generatePath(routes.docPath, { docId })} size='small' sx={{ ml: -1 }}><T id={`welcome.core.${key}.more`}/></Button>
    : href && <Button href={href} size='small' sx={{ ml: -1 }}><T id={`welcome.core.${key}.more`}/></Button>
  return (
    <Section id={key} band={band}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' }, gap: { xs: 2.5, md: 6 }, alignItems: 'start' }}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction='row' sx={{ alignItems: 'center', gap: 1, mb: 1.5, color: brand.leaf }}>
            <Icon sx={{ fontSize: 20 }}/>
            <Typography component='span' sx={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary' }}>
              <T id={`welcome.core.${key}.name`}/>
            </Typography>
          </Stack>
          <Typography component='h2' sx={{ fontSize: { xs: 22, md: 27 }, fontWeight: 650, lineHeight: 1.2, maxWidth: measure, mb: 1.5 }}>
            <T id={`welcome.core.${key}.title`}/>
          </Typography>
          <Typography color='text.secondary' sx={{ maxWidth: measure, lineHeight: 1.6, mb: 1.5 }}>
            <T id={`welcome.core.${key}.body`}/>
          </Typography>
          {chips && (
            <Box sx={{ mb: 1.5 }}>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}><T id={chips.lead}/></Typography>
              <Stack direction='row' sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                {chips.ids.map((id) => <Chip key={id} variant='outlined' label={translate(id)} sx={{ height: 26, fontSize: 12.5 }}/>)}
              </Stack>
            </Box>
          )}
          {more}
        </Box>
        <Stack spacing={1.75} sx={{ minWidth: 0 }}>
          {points.map(({ id, Icon: PointIcon }) => <Point key={id} Icon={PointIcon} id={id}/>)}
        </Stack>
      </Box>
      {hasPicture
        ? (
            <Box
              sx={{
                display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
                gap: { xs: 3, md: 5 }, alignItems: 'center', mt: { xs: 3.5, md: 5 },
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Carousel pages={screenshotGroups[key]} label={translate(`welcome.core.${key}.name`)}/>
              </Box>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Phone screen={phone} width={230}/>
              </Box>
            </Box>
          )
        : (
            <Stack sx={{ alignItems: 'center', mt: { xs: 3.5, md: 5 } }}>
              <Phone screen={phone} width={250}/>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1.75, maxWidth: 320, textAlign: 'center' }}>
                {translate(`welcome.phone.captions.${phone}`)}
              </Typography>
            </Stack>
          )}
    </Section>
  )
}

// Two phones in the opening: the conversation in front, and the money behind
// it, turned a little, so it reads as an app with more than one screen. On a
// phone-sized window only the front one, since two would not fit side by side.
const HeroPhones = () => (
  <Box sx={{ position: 'relative', justifySelf: 'center', width: { xs: 250, md: 380 }, height: { xs: 'auto', md: 600 } }}>
    <Box
      aria-hidden
      sx={{
        display: { xs: 'none', md: 'block' }, position: 'absolute', right: 0, top: 40,
        transform: 'rotate(6deg)', opacity: 0.92,
      }}
    >
      <Phone screen='finance' width={230}/>
    </Box>
    <Box sx={{ position: { xs: 'static', md: 'absolute' }, left: 0, top: 0 }}>
      <Phone screen='conversation' width={250}/>
    </Box>
  </Box>
)

// One way to install: what it is and what comes after on the left, the
// commands on the right, wide enough that they do not wrap.
const InstallRow = ({ which, snippet, after }: { which: 'assistant' | 'mail', snippet: string, after: ReactNode }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 0.75fr) minmax(0, 1.25fr)' }, gap: { xs: 1.5, md: 4 }, alignItems: 'start' }}>
    <Box sx={{ minWidth: 0 }}>
      <Typography component='h3' sx={{ fontWeight: 600, fontSize: 16, mb: 0.5 }}><T id={`welcome.start.${which}.title`}/></Typography>
      <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.55, mb: 1 }}><T id={`welcome.start.${which}.note`}/></Typography>
      <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.55 }}>
        <T id={`welcome.start.${which}.after`}/>
        {' '}
        {after}.
      </Typography>
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Markdown html={snippet} compact/>
    </Box>
  </Box>
)

// An icon in its tile, a title and a line under it: one point of a section.
const Point = ({ Icon, id }: { Icon: SvgIconComponent, id: string }) => (
  <Stack direction='row' sx={{ gap: 1.5, alignItems: 'flex-start', minWidth: 0 }}>
    <Tile sx={{ flexShrink: 0, width: 34, height: 34, borderRadius: '9px', mb: 0 }}>
      <Icon sx={{ fontSize: 18 }}/>
    </Tile>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontWeight: 600, fontSize: 14.5 }}>
        <T id={`${id}.title`}/>
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.5 }}>
        <T id={`${id}.body`}/>
      </Typography>
    </Box>
  </Stack>
)

// One card in a grid.
const Card = ({ children }: { children: ReactNode }) => (
  <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: '12px', bgcolor: 'background.paper' }}>
    {children}
  </Box>
)

// A block of a section: its heading, a lead, a paragraph and a link to its
// document on the left, and its points on the right. A block after another
// is ruled off from it; the first in a section is not.
const PointsBlock = ({ id, section, docId, docHash, points, first }: {
  id?: string, section: string, docId?: string, docHash?: string, points: { key: string, Icon: SvgIconComponent }[], first?: boolean,
}) => (
  <Box
    id={id}
    sx={{
      display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
      gap: { xs: 2.5, md: 5 }, alignItems: 'start', scrollMarginTop: 16,
      ...(!first && { mt: { xs: 4, md: 5 }, pt: { xs: 3, md: 4 }, borderTop: 1, borderColor: 'divider' }),
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Overline><T id={`welcome.${section}.heading`}/></Overline>
      <Typography sx={{ maxWidth: measure, mb: 1.5 }}><T id={`welcome.${section}.lead`}/></Typography>
      <Typography variant='body2' color='text.secondary' sx={{ maxWidth: measure, lineHeight: 1.6, mb: 1.5 }}>
        <T id={`welcome.${section}.body`}/>
      </Typography>
      {docId && (
        <Button component={NavLink} to={{ pathname: generatePath(routes.docPath, { docId }), hash: docHash ? `#${docHash}` : '' }} size='small' sx={{ ml: -1 }}>
          <T id={`welcome.${section}.more`}/>
        </Button>
      )}
    </Box>
    <Stack spacing={1.75} sx={{ minWidth: 0 }}>
      {points.map(({ key, Icon }) => (
        <Point key={key} Icon={Icon} id={`welcome.${section}.points.${key}`}/>
      ))}
    </Stack>
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
// decoration of its own behind its content, and something under its content
// that runs to the edges of the window.
const Section = ({ id, children, band, decoration, wide, sx }: { id?: string, children: ReactNode, band?: boolean, decoration?: ReactNode, wide?: ReactNode, sx?: object }) => (
  <Box
    id={id}
    sx={{
      scrollMarginTop: 0,
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
    {wide && <Box sx={{ position: 'relative', pb: { xs: 4, md: 6 } }}>{wide}</Box>}
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
