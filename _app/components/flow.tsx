import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ForwardToInboxOutlinedIcon from '@mui/icons-material/ForwardToInboxOutlined'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import MailOutlineIcon from '@mui/icons-material/EmailOutlined'
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined'
import WebhookOutlinedIcon from '@mui/icons-material/WebhookOutlined'

import { T } from '../i18n'
import { Mark } from './logo'
import { brand, monospaceFamily } from '../theme'

// What happens to a message, drawn: it arrives at your domain, TeaNode checks
// it, and it lands in a mailbox here, in an inbox somebody already has, or at
// a webhook; a reply goes back out signed as the domain. The picture says in
// a glance what the lead paragraph says in three sentences, which is why it
// sits beside it.
//
// Boxes and arrows in markup rather than an SVG, so the words in it are
// translated like any others and wrap the way the rest of the page does. It
// reads left to right on a wide screen and top to bottom on a phone.

const Node = ({ icon, title, children, accent }: {
  icon: ReactNode
  title: ReactNode
  children?: ReactNode
  accent?: boolean
}) => (
  <Box
    sx={{
      p: 1.25, borderRadius: '12px', border: 1, minWidth: 0,
      borderColor: accent ? brand.leaf : 'divider',
      bgcolor: 'background.paper',
      boxShadow: accent ? `0 0 0 3px ${brand.leaf}22` : 'none',
    }}
  >
    <Box sx={{ display: 'flex', color: accent ? brand.leaf : 'text.secondary', mb: 0.75 }}>{icon}</Box>
    <Typography sx={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.3, mb: children ? 0.5 : 0 }}>{title}</Typography>
    {children && (
      <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.45, fontSize: 13 }}>{children}</Typography>
    )}
  </Box>
)

const Address = ({ children }: { children: ReactNode }) => (
  <Box component='span' sx={{ fontFamily: monospaceFamily, fontSize: 11.5, letterSpacing: '-0.01em', color: 'text.primary', overflowWrap: 'anywhere' }}>{children}</Box>
)

// The arrow between two steps: pointing right in a row, down in a column.
const Arrow = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', py: { xs: 0.5, md: 0 } }}>
    <ArrowForwardIcon sx={{ fontSize: 20, display: { xs: 'none', md: 'block' } }}/>
    <ArrowDownwardIcon sx={{ fontSize: 20, display: { xs: 'block', md: 'none' } }}/>
  </Box>
)

export const Flow = () => (
  <Box aria-hidden='true' sx={{ width: '100%' }}>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.05fr) auto minmax(0, 1.2fr) auto minmax(0, 0.95fr)' },
        alignItems: 'center',
        gap: { xs: 0, md: 0.5 },
      }}
    >
      <Node icon={<MailOutlineIcon sx={{ fontSize: 20 }}/>} title={<T id='welcome.flow.arrives'/>}>
        <Address>hello@example.com</Address>
      </Node>
      <Arrow/>
      <Node accent icon={<Mark size={20}/>} title='TeaNode'>
        <T id='welcome.flow.checks'/>
      </Node>
      <Arrow/>
      <Stack sx={{ gap: 1 }}>
        <Node accent icon={<InboxOutlinedIcon sx={{ fontSize: 20 }}/>} title={<T id='welcome.flow.mailbox'/>}/>
        <Node icon={<ForwardToInboxOutlinedIcon sx={{ fontSize: 20 }}/>} title={<T id='welcome.flow.inbox'/>}/>
        <Node icon={<WebhookOutlinedIcon sx={{ fontSize: 20 }}/>} title={<T id='welcome.flow.webhook'/>}/>
      </Stack>
    </Box>
    <Stack
      direction='row'
      sx={{ mt: 1.5, alignItems: 'center', gap: 1, color: 'text.secondary', justifyContent: { md: 'center' } }}
    >
      <ReplyOutlinedIcon sx={{ fontSize: 18 }}/>
      <Typography variant='body2' color='text.secondary'><T id='welcome.flow.reply'/></Typography>
    </Stack>
  </Box>
)
