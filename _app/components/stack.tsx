import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'

import { T } from '../i18n'
import { Mark } from './logo'
import { brand } from '../theme'

// Why, as a picture: the pile of programs that running mail for a domain
// usually means, beside the one program and one database that TeaNode is.
// The names in the pile are the real ones, which is the point; nobody who
// has assembled them needs the paragraph that used to be here.

const usual = ['Postfix', 'Dovecot', 'OpenDKIM', 'OpenDMARC', 'SpamAssassin', 'policyd']

const Tile = ({ children, accent, icon }: { children: ReactNode, accent?: boolean, icon?: ReactNode }) => (
  <Stack
    direction='row'
    sx={{
      alignItems: 'center', gap: 1, px: 1.5, py: 1.25, borderRadius: '10px', border: 1,
      borderColor: accent ? brand.leaf : 'divider', bgcolor: 'background.paper',
      boxShadow: accent ? `0 0 0 3px ${brand.leaf}22` : 'none',
      fontSize: 14, fontWeight: 600,
    }}
  >
    {icon}
    <span>{children}</span>
  </Stack>
)

const Caption = ({ children }: { children: ReactNode }) => (
  <Typography sx={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary', mb: 1.5 }}>
    {children}
  </Typography>
)

export const StackComparison = () => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '3fr auto 2fr' },
      gap: { xs: 3, md: 4 },
      alignItems: 'center',
    }}
  >
    <Box>
      <Caption><T id='welcome.stack.usual'/></Caption>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1 }}>
        {usual.map((name) => <Tile key={name}>{name}</Tile>)}
      </Box>
      <Typography variant='body2' color='text.secondary' sx={{ mt: 1.5 }}><T id='welcome.stack.usualNote'/></Typography>
    </Box>
    <Typography
      sx={{
        fontSize: 13, fontWeight: 600, color: 'text.secondary', textAlign: 'center',
        px: { md: 1 }, textTransform: 'uppercase', letterSpacing: '0.08em',
      }}
    >
      <T id='welcome.stack.versus'/>
    </Typography>
    <Box>
      <Caption><T id='welcome.stack.teanode'/></Caption>
      <Stack sx={{ gap: 1 }}>
        <Tile accent icon={<Mark size={18}/>}>TeaNode</Tile>
        <Tile icon={<StorageOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }}/>}>PostgreSQL</Tile>
      </Stack>
      <Typography variant='body2' color='text.secondary' sx={{ mt: 1.5 }}><T id='welcome.stack.teanodeNote'/></Typography>
    </Box>
  </Box>
)
