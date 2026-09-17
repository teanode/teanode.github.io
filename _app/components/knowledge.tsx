import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined'

import { useTranslate } from '../i18n'
import { brand, monospaceFamily, surfaces } from '../theme'

// A page out of the agent's memory, and what the night did to it.
//
// The dashboard keeps what the agent knows as pages at paths, each fact on a
// page numbered and carrying where it came from, and the pages joined by
// links that say how. This draws one such page the way the dashboard draws
// it, then plays the part that is hard to describe in a sentence: while
// nobody is talking to it the agent walks its own graph, finds two pages
// that are connected but not adjacent, and writes down the relation between
// them. A fact and a link appear that nobody typed.
//
// A recording, like the conversation beside it: nothing here reaches a
// server. The prose is in the translation catalogue; the paths and the
// relation words are not, because they are literals the program itself uses
// and a reader who opens the dashboard will see the same ones.

// Where each page sits in the drawing, in the picture's own coordinates. The
// hub is the page being read; the rim is what it is linked to.
const width = 420
const height = 200

const hub = { x: 210, y: 104, path: 'projects/greenfinch' }

const rim = [
  { key: 'self', x: 78, y: 50, path: 'self', relation: 'works_on' },
  { key: 'grace', x: 330, y: 46, path: 'people/grace-hopper', relation: 'works_on' },
  { key: 'osborne', x: 326, y: 158, path: 'orgs/osborne-and-sons', relation: 'uses' },
  { key: 'month', x: 82, y: 158, path: 'time/2026/09', relation: 'about' },
] as const

// The link the night draws: between two pages on the rim, which is the whole
// reason to keep a graph rather than a list. Dashed and lighter, because a
// relation nobody stated starts at half the weight of one somebody did.
const drawn = { from: 'grace', to: 'osborne', relation: 'member_of' }

// The three facts the page already carries, and the fourth the night files.
// Each names the translation key for its sentence and for where it came from.
const facts = [
  { number: 1, id: 'leads', from: 'conversation' },
  { number: 2, id: 'readme', from: 'file' },
  { number: 3, id: 'terms', from: 'thread' },
] as const

const filed = { number: 4, id: 'member', from: 'night' } as const

// The recording: quiet, then the night runs, then what it left behind. Held
// long enough at the end to be read before it starts again.
const beats = { settle: 1800, dreaming: 2600, filed: 9000 }

type Phase = 'quiet' | 'dreaming' | 'filed'

export const Knowledge = () => {
  const theme = useTheme()
  const translate = useTranslate()
  const surface = surfaces(theme.palette.mode)
  // Somebody who has asked for less motion is shown the end of it, which is
  // the state that says the most, and it never moves.
  const still = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [phase, setPhase] = useState<Phase>(still ? 'filed' : 'quiet')
  // Nothing plays until it is on the screen: a drawing animating behind the
  // fold is work nobody sees and a distraction on the way past. Where there
  // is no way to ask, it plays.
  const [playing, setPlaying] = useState(typeof IntersectionObserver === 'undefined')
  const frame = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = frame.current
    if (!element || typeof IntersectionObserver === 'undefined') return
    const watcher = new IntersectionObserver(
      (entries) => entries.some((entry) => entry.isIntersecting) && setPlaying(true),
      { threshold: 0.3 },
    )
    watcher.observe(element)
    return () => watcher.disconnect()
  }, [])

  useEffect(() => {
    if (!playing || still) return
    const wait = phase === 'quiet' ? beats.settle : phase === 'dreaming' ? beats.dreaming : beats.filed
    const next = window.setTimeout(
      () => setPhase(phase === 'quiet' ? 'dreaming' : phase === 'dreaming' ? 'filed' : 'quiet'),
      wait,
    )
    return () => window.clearTimeout(next)
  }, [playing, still, phase])

  const dreaming = phase === 'dreaming'
  const kept = phase === 'filed'

  return (
    <Box
      ref={frame}
      role='img'
      aria-label={translate('welcome.memory.page.label')}
      sx={{
        borderRadius: '14px',
        border: 1,
        borderColor: surface.border,
        bgcolor: surface.raised,
        overflow: 'hidden',
      }}
    >
      {/* The head the dashboard puts on a page: where it lives, and what
          kind of thing it is. The path is the address everywhere — in the
          prompt, in a citation, in the address bar — so it is what the head
          says, rather than a title. */}
      <Stack
        direction='row'
        sx={{
          alignItems: 'center', gap: 1, px: '12px', py: 1,
          borderBottom: 1, borderColor: surface.border,
        }}
      >
        <Typography sx={{ fontFamily: monospaceFamily, fontSize: 12.5, color: surface.muted, minWidth: 0 }} noWrap>
          projects/<Box component='span' sx={{ color: surface.text, fontWeight: 600 }}>greenfinch</Box>
        </Typography>
        <Box sx={{ flex: 1 }}/>
        <Box
          sx={{
            px: '7px', py: '1px', borderRadius: '5px', border: 1, borderColor: surface.border,
            fontFamily: monospaceFamily, fontSize: 10.5, color: surface.muted, letterSpacing: '0.02em',
          }}
        >
          project
        </Box>
      </Stack>

      <Box sx={{ px: '14px', pt: 1.5, pb: 1.75 }}>
        <Typography variant='body2' sx={{ color: surface.text, lineHeight: 1.5, mb: 1.5 }}>
          {translate('welcome.memory.page.opening')}
        </Typography>

        <Stack sx={{ gap: 1 }}>
          {facts.map((fact) => (
            <Fact key={fact.number} fact={fact} surface={surface} translate={translate}/>
          ))}
          {/* The fourth arrives with the night and then stays. It holds its
              own height from the start so nothing under it jumps. */}
          <Box sx={{ opacity: kept ? 1 : 0, transition: 'opacity 600ms ease' }}>
            <Fact fact={filed} surface={surface} translate={translate} fresh/>
          </Box>
        </Stack>
      </Box>

      {/* What the page is linked to. The dashboard draws this and lets you
          walk it by clicking; here it plays once. */}
      <Box sx={{ px: '14px', pb: 0.5, borderTop: 1, borderColor: surface.border, pt: 1.25 }}>
        <Typography
          sx={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: surface.muted, mb: 0.5 }}
        >
          {translate('welcome.memory.page.connections')}
        </Typography>
        <Box
          component='svg'
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden='true'
          focusable='false'
          sx={{ display: 'block', width: '100%', height: 'auto' }}
        >
          {rim.map((node) => (
            <g key={node.key}>
              <line
                x1={node.x} y1={node.y} x2={hub.x} y2={hub.y}
                stroke={surface.borderStrong} strokeWidth={1.25}
              />
              <Relation
                x={hub.x + (node.x - hub.x) * 0.74} y={hub.y + (node.y - hub.y) * 0.74}
                word={node.relation} surface={surface}
              />
            </g>
          ))}

          {/* The one the night drew, between two pages on the rim. Dashed
              and lighter: half the weight of a link somebody stated. */}
          <Drawn surface={surface} shown={kept} drawing={dreaming}/>

          {rim.map((node) => (
            <Page key={node.key} node={node} surface={surface}/>
          ))}
          <Page node={hub} surface={surface} hub/>
        </Box>
      </Box>

      {/* What the night did, in the sentence the agent page puts it in. */}
      <Stack
        direction='row'
        sx={{
          alignItems: 'center', gap: 1, px: '12px', py: '9px',
          borderTop: 1, borderColor: surface.border, bgcolor: surface.rail,
        }}
      >
        <BedtimeOutlinedIcon
          sx={{
            fontSize: 14, flexShrink: 0,
            color: dreaming ? brand.leaf : surface.muted,
            transition: 'color 400ms ease',
          }}
        />
        <Typography sx={{ fontSize: 12, color: surface.muted, minWidth: 0 }} noWrap>
          {translate(dreaming ? 'welcome.memory.page.dreaming' : 'welcome.memory.page.lastNight')}
        </Typography>
      </Stack>
    </Box>
  )
}

// One numbered line on the page, with where it came from after it. The number
// is the citation: projects/greenfinch#2 is this line, and it keeps that
// number for as long as the line is there.
const Fact = ({ fact, surface, translate, fresh }: {
  fact: { number: number, id: string, from: string }
  surface: ReturnType<typeof surfaces>
  translate: (id: string) => string
  fresh?: boolean
}) => (
  <Stack direction='row' sx={{ gap: 1, alignItems: 'baseline', minWidth: 0 }}>
    <Typography
      sx={{
        fontFamily: monospaceFamily, fontSize: 11, flexShrink: 0, width: 14, textAlign: 'right',
        color: fresh ? brand.leaf : surface.muted,
      }}
    >
      {fact.number}
    </Typography>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant='body2' sx={{ color: surface.text, lineHeight: 1.45, fontSize: 13.5 }}>
        {translate(`welcome.memory.page.facts.${fact.id}`)}
      </Typography>
      <Typography sx={{ fontSize: 11.5, color: surface.muted, lineHeight: 1.4 }}>
        {translate(`welcome.memory.page.from.${fact.from}`)}
      </Typography>
    </Box>
  </Stack>
)

// A page in the drawing: a dot and its path. The one being read is larger and
// in the mark's green, the way the dashboard marks where you are.
const Page = ({ node, surface, hub: isHub }: {
  node: { x: number, y: number, path: string }
  surface: ReturnType<typeof surfaces>
  hub?: boolean
}) => {
  // A label goes on the far side of its dot from the middle of the picture,
  // which is where the lines and their relations are.
  const above = !isHub && node.y < hub.y
  return (
    <g>
      <circle
        cx={node.x} cy={node.y} r={isHub ? 7 : 4.5}
        fill={isHub ? brand.leaf : surface.raised}
        stroke={isHub ? brand.leaf : surface.borderStrong}
        strokeWidth={1.5}
      />
      <text
        x={node.x} y={node.y + (isHub ? 32 : above ? -12 : 19)}
        textAnchor='middle'
        fontFamily={monospaceFamily}
        fontSize={isHub ? 11.5 : 10}
        fontWeight={isHub ? 600 : 400}
        fill={isHub ? surface.text : surface.muted}
      >
        {node.path}
      </text>
    </g>
  )
}

// The relation on a link, in the program's own word for it. Set on a patch of
// the page's own colour so the line does not run through the letters.
const Relation = ({ x, y, word, surface, accent }: {
  x: number
  y: number
  word: string
  surface: ReturnType<typeof surfaces>
  accent?: boolean
}) => (
  <g>
    <rect
      x={x - word.length * 2.6 - 4} y={y - 7} width={word.length * 5.2 + 8} height={14}
      rx={4} fill={surface.raised}
    />
    <text
      x={x} y={y + 3.5} textAnchor='middle'
      fontFamily={monospaceFamily} fontSize={9}
      fill={accent ? brand.leaf : surface.muted}
    >
      {word}
    </text>
  </g>
)

// The link nobody wrote down: considered while the night runs, kept after
// it. Dashed for as long as it is there, because a relation the agent
// inferred is not one the person stated and should not look like one.
const Drawn = ({ surface, shown, drawing }: {
  surface: ReturnType<typeof surfaces>
  shown: boolean
  drawing: boolean
}) => {
  const from = rim.find((node) => node.key === drawn.from)!
  const to = rim.find((node) => node.key === drawn.to)!
  return (
    <g style={{ opacity: shown ? 1 : drawing ? 0.35 : 0, transition: 'opacity 700ms ease' }}>
      <line
        x1={from.x} y1={from.y} x2={to.x} y2={to.y}
        stroke={brand.leaf} strokeWidth={1.5} strokeDasharray='4 3' strokeLinecap='round'
      />
      <g style={{ opacity: shown ? 1 : 0, transition: 'opacity 500ms ease 300ms' }}>
        <Relation
          x={(from.x + to.x) / 2 + 30} y={(from.y + to.y) / 2}
          word={drawn.relation} surface={surface} accent
        />
      </g>
    </g>
  )
}
