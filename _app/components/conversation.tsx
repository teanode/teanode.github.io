import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { useTranslate } from '../i18n'
import { surfaces } from '../theme'

// The agent's drawer, playing a conversation that already happened.
//
// Nothing here talks to anything: it is a recording, so the front page can
// show what using the agent is like without a server, a model or a key. The
// script is in the translation catalogue, so it plays in the reader's own
// language.
//
// The frame copies the dashboard's own drawer rather than inventing a chat
// window — the measurements are from web/src/style.css: 440 wide, a 14px
// radius, a 10px radius on a line, a line of the reader's own words pushed
// right and inverted, the agent's stretched and on the field colour, tool
// lines small and muted. Somebody who opens the dashboard afterwards should
// recognise the thing they were shown.

// One step of the recording. A `say` is the reader, a `reply` is the agent,
// a `tool` is the grey line that says what it reached for, and a `card` is
// the confirmation that stops it before it does something it cannot undo.
type Step =
  | { kind: 'say' | 'reply' | 'tool', id: string }
  | { kind: 'card', id: string, answered?: boolean }

const script: Step[] = [
  { kind: 'say', id: 'today' },
  { kind: 'tool', id: 'searched' },
  { kind: 'reply', id: 'today' },
  { kind: 'say', id: 'thursday' },
  { kind: 'tool', id: 'calendar' },
  { kind: 'reply', id: 'thursday' },
  { kind: 'say', id: 'reply' },
  { kind: 'tool', id: 'drafted' },
  { kind: 'card', id: 'send' },
]

// How long each kind of step holds the screen before the next arrives. A
// reply is read, so it waits longest; a tool line is glanced at.
const pause: Record<Step['kind'], number> = {
  say: 700,
  tool: 900,
  reply: 2600,
  card: 4000,
}

const typingSpeed = 26 // milliseconds a character, for the reader's own lines

// Where the recording opens, and where it returns to: the first exchange is
// already on screen. An empty box is what a reader sees first otherwise, for
// as long as it takes to type a question and answer it, and an empty box
// looks like something that failed to load.
const opensAt = 3

export const Conversation = () => {
  const translate = useTranslate()
  const theme = useTheme()
  const surface = surfaces(theme.palette.mode === 'dark' ? 'dark' : 'light')
  // Somebody who asked for less movement gets the whole conversation at once,
  // which is the same information without anything moving.
  const still = useMediaQuery('(prefers-reduced-motion: reduce)')

  const [shown, setShown] = useState(still ? script.length : opensAt)
  const [typed, setTyped] = useState('')
  const [answered, setAnswered] = useState(still)
  const body = useRef<HTMLDivElement>(null)

  // The recording, as one effect: a timer chain that advances the script and
  // starts again at the end. Cleared on unmount, so a reader who scrolls away
  // and comes back does not have two of them running.
  useEffect(() => {
    if (still) {
      return
    }
    let timer: ReturnType<typeof setTimeout>
    let cancelled = false

    const advance = (index: number) => {
      if (cancelled) {
        return
      }
      if (index >= script.length) {
        timer = setTimeout(() => {
          if (cancelled) {
            return
          }
          setShown(opensAt)
          setAnswered(false)
          setTyped('')
          advance(opensAt)
        }, 5200)
        return
      }
      const step = script[index]
      if (step.kind === 'card') {
        // The card is answered a moment after it appears, because the point
        // of the card is that somebody says yes to it.
        setShown(index + 1)
        timer = setTimeout(() => {
          if (!cancelled) {
            setAnswered(true)
          }
        }, 1500)
        timer = setTimeout(() => advance(index + 1), pause.card)
        return
      }
      if (step.kind !== 'say') {
        setShown(index + 1)
        timer = setTimeout(() => advance(index + 1), pause[step.kind])
        return
      }
      // The reader's own line is typed, the way it would be.
      const text = translate(`welcome.agent.conversation.say.${step.id}`)
      let at = 0
      const type = () => {
        if (cancelled) {
          return
        }
        at += 1
        setTyped(text.slice(0, at))
        if (at < text.length) {
          timer = setTimeout(type, typingSpeed)
          return
        }
        setTyped('')
        setShown(index + 1)
        timer = setTimeout(() => advance(index + 1), pause.say)
      }
      type()
    }

    timer = setTimeout(() => advance(opensAt), 1400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [still, translate])

  // Follow the end, the way the drawer does while something is arriving.
  useEffect(() => {
    const element = body.current
    if (element) {
      element.scrollTop = element.scrollHeight
    }
  }, [shown, typed, answered])

  const line = {
    borderRadius: '10px',
    padding: '8px 10px',
    fontSize: 13.5,
    lineHeight: 1.5,
  }

  return (
    <Box
      aria-label={translate('welcome.agent.conversation.label')}
      sx={{
        width: '100%',
        maxWidth: 440,
        height: { xs: 400, md: 470 },
        display: 'flex',
        flexDirection: 'column',
        border: 1,
        borderColor: surface.border,
        borderRadius: '14px',
        bgcolor: surface.page,
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.22)',
        overflow: 'hidden',
      }}
    >
      {/* The head, as the drawer draws it: a button carrying the spark, the
          conversation's name and a chevron; the day's budget as a ring, which
          is what the product shows rather than a count; and the close. The
          measurements are its own — 8px by 10px of padding, 14px icons, a
          16px ring of radius 6 stroked 2.5. */}
      <Stack
        direction='row'
        sx={{
          alignItems: 'center', gap: 1, px: '10px', py: 1,
          borderBottom: 1, borderColor: surface.border, flexShrink: 0,
        }}
      >
        <Stack
          direction='row'
          sx={{ alignItems: 'center', gap: '6px', flex: 1, minWidth: 0, px: '6px', py: '4px' }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 14, flexShrink: 0 }}/>
          <Typography sx={{ fontWeight: 600, fontSize: 13.5, minWidth: 0 }} noWrap>
            {translate('welcome.agent.conversation.title')}
          </Typography>
          <ExpandMoreIcon sx={{ fontSize: 14, flexShrink: 0, color: surface.muted }}/>
        </Stack>
        <BudgetRing surface={surface} colour={theme.palette.success.main}/>
        <Box
          component='span'
          aria-hidden
          sx={{ px: 0.5, color: surface.muted, fontSize: 16, lineHeight: 1 }}
        >
          ×
        </Box>
      </Stack>

      <Stack
        ref={body}
        sx={{
          flex: 1, minHeight: 0, overflowY: 'auto',
          px: 1.25, py: 1.25, gap: 1,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {/* A spacer that takes the slack while the conversation is short, so
            it fills from the bottom the way a chat does, and collapses to
            nothing once there is more than fits — which keeps the scroll to
            the end honest rather than stranding the top. */}
        <Box sx={{ flexGrow: 1, flexShrink: 1, minHeight: 0 }}/>
        {script.slice(0, shown).map((step, index) => {
          if (step.kind === 'tool') {
            return (
              <Typography
                key={`${step.kind}-${step.id}-${index}`}
                sx={{ px: 0.5, fontSize: 12, color: surface.muted }}
              >
                {translate(`welcome.agent.conversation.tool.${step.id}`)}
              </Typography>
            )
          }
          if (step.kind === 'card') {
            return (
              <Box
                key={`${step.kind}-${step.id}-${index}`}
                sx={{
                  ...line,
                  border: 1,
                  borderColor: theme.palette.warning.main,
                  bgcolor: surface.field,
                }}
              >
                <Typography sx={{ fontSize: 13.5, mb: 1 }}>
                  {translate(`welcome.agent.conversation.card.${step.id}`)}
                </Typography>
                {answered ? (
                  <Typography sx={{ fontSize: 12.5, color: surface.muted }}>
                    {translate('welcome.agent.conversation.sent')}
                  </Typography>
                ) : (
                  <Stack direction='row' sx={{ gap: 0.75 }}>
                    <Pill filled surface={surface}>{translate('welcome.agent.conversation.yes')}</Pill>
                    <Pill surface={surface}>{translate('welcome.agent.conversation.no')}</Pill>
                  </Stack>
                )}
              </Box>
            )
          }
          const mine = step.kind === 'say'
          return (
            <Box
              key={`${step.kind}-${step.id}-${index}`}
              sx={{
                ...line,
                alignSelf: mine ? 'flex-end' : 'stretch',
                maxWidth: mine ? '85%' : '100%',
                bgcolor: mine ? surface.action : surface.field,
                color: mine ? surface.actionText : 'inherit',
                whiteSpace: 'pre-line',
              }}
            >
              {translate(`welcome.agent.conversation.${mine ? 'say' : 'reply'}.${step.id}`)}
            </Box>
          )
        })}
      </Stack>

      {/* The box you type in. It carries whatever is being typed, so the
          reader's line is written here and then sent, as it would be. */}
      <Box sx={{ px: 1.25, pb: 1.25, pt: 0.5, flexShrink: 0 }}>
        <Box
          sx={{
            minHeight: 38, display: 'flex', alignItems: 'center',
            px: 1.25, borderRadius: '10px',
            border: 1, borderColor: surface.border, bgcolor: surface.field,
            fontSize: 13.5, color: typed ? surface.text : surface.muted,
          }}
        >
          {typed || translate('welcome.agent.conversation.placeholder')}
          {typed && <Caret colour={surface.text}/>}
        </Box>
      </Box>
    </Box>
  )
}

// The day's budget: a track and a fill, the fill as much of the circle as has
// gone, green while there is room. A little under a fifth here, which is what
// the recording's own usage would come to.
const BudgetRing = ({ surface, colour }: {
  surface: ReturnType<typeof surfaces>
  colour: string
}) => {
  const radius = 6
  const round = 2 * Math.PI * radius
  const fraction = 0.18
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', p: '4px', color: surface.muted }}>
      <svg width='16' height='16' viewBox='0 0 16 16' aria-hidden='true' focusable='false'>
        <circle cx='8' cy='8' r={radius} fill='none' stroke={surface.border} strokeWidth={2.5}/>
        <circle
          cx='8' cy='8' r={radius} fill='none' stroke={colour} strokeWidth={2.5}
          strokeLinecap='round'
          strokeDasharray={`${round * fraction} ${round}`}
          transform='rotate(-90 8 8)'
        />
      </svg>
    </Box>
  )
}

const Pill = ({ children, filled, surface }: {
  children: string
  filled?: boolean
  surface: ReturnType<typeof surfaces>
}) => (
  <Box
    component='span'
    sx={{
      px: 1.25, py: 0.4, borderRadius: '8px', fontSize: 12.5, fontWeight: 550,
      border: 1,
      borderColor: filled ? surface.action : surface.border,
      bgcolor: filled ? surface.action : 'transparent',
      color: filled ? surface.actionText : surface.muted,
    }}
  >
    {children}
  </Box>
)

// The line after the last typed character, blinking the way a terminal's does.
const Caret = ({ colour }: { colour: string }) => (
  <Box
    component='span'
    sx={{
      display: 'inline-block', width: '1.5px', height: 15, ml: '2px',
      bgcolor: colour,
      animation: 'conversationCaret 1s step-end infinite',
      '@keyframes conversationCaret': { '50%': { opacity: 0 } },
      '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
    }}
  />
)
