import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CheckIcon from '@mui/icons-material/Check'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { useTranslate } from '../i18n'
import { monospaceFamily, surfaces } from '../theme'

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
  | { kind: 'say' | 'reply', id: string }
  // A tool names itself: the drawer writes the tool's own name, not a
  // sentence about it, with whatever it found after a middle dot.
  | { kind: 'tool', id: string, tool: string }
  | { kind: 'card', id: string }

// Three conversations, the way somebody would actually have them: the main
// one, and two named ones kept apart. Each is a recording; pressing the title
// opens the picker and moves between them, which is what the drawer does.
const conversations: { id: string, opensAt: number, script: Step[] }[] = [
  {
    id: 'today',
    opensAt: 3,
    script: [
      { kind: 'say', id: 'today' },
      { kind: 'tool', id: 'searched', tool: 'mail_search' },
      { kind: 'reply', id: 'today' },
      { kind: 'say', id: 'thursday' },
      { kind: 'tool', id: 'calendar', tool: 'calendar' },
      { kind: 'reply', id: 'thursday' },
      { kind: 'say', id: 'reply' },
      { kind: 'tool', id: 'drafted', tool: 'mail_draft' },
      { kind: 'card', id: 'send' },
    ],
  },
  {
    id: 'invoices',
    opensAt: 3,
    script: [
      { kind: 'say', id: 'unpaid' },
      { kind: 'tool', id: 'invoices', tool: 'mail_search' },
      { kind: 'reply', id: 'unpaid' },
      { kind: 'say', id: 'chase' },
      { kind: 'tool', id: 'contact', tool: 'contact_book' },
      { kind: 'reply', id: 'chase' },
      { kind: 'card', id: 'remind' },
    ],
  },
  {
    id: 'trip',
    opensAt: 3,
    script: [
      { kind: 'say', id: 'parcel' },
      { kind: 'tool', id: 'tracking', tool: 'mail_read' },
      { kind: 'reply', id: 'parcel' },
      { kind: 'say', id: 'file' },
      { kind: 'tool', id: 'saved', tool: 'filesystem' },
      { kind: 'reply', id: 'file' },
    ],
  },
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

// How long the dots hold before the answer arrives. The same before a reply
// and before a confirmation card, because a card is an answer too.
const thinkingFor = 900

// A conversation opens on its first exchange rather than on nothing. An empty
// box is what a reader sees first otherwise, for as long as it takes to type a
// question and answer it, and an empty box looks like something that failed to
// load.

export const Conversation = () => {
  const translate = useTranslate()
  const theme = useTheme()
  const surface = surfaces(theme.palette.mode === 'dark' ? 'dark' : 'light')
  // Somebody who asked for less movement gets the whole conversation at once,
  // which is the same information without anything moving.
  const still = useMediaQuery('(prefers-reduced-motion: reduce)')

  // Which conversation is open, whether the picker is, and how far its
  // recording has got.
  const [current, setCurrent] = useState(0)
  const [picking, setPicking] = useState(false)
  const conversation = conversations[current]
  const script = conversation.script
  const opensAt = conversation.opensAt

  const [shown, setShown] = useState(still ? script.length : opensAt)
  const [typed, setTyped] = useState('')
  const [answered, setAnswered] = useState(still)
  // Which step is still working, and whether the agent is thinking between
  // a question and the tool it reaches for.
  const [working, setWorking] = useState(-1)
  const [thinking, setThinking] = useState(false)
  const body = useRef<HTMLDivElement>(null)

  // The recording, as one effect: a timer chain that advances the script and
  // starts again at the end. Cleared on unmount, so a reader who scrolls away
  // and comes back does not have two of them running.
  useEffect(() => {
    if (still) {
      return
    }
    let timer: ReturnType<typeof setTimeout>
    // The card answers itself on a timer of its own, which would otherwise
    // take the handle that clears the next step.
    let answering: ReturnType<typeof setTimeout>
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
          setThinking(false)
          setWorking(-1)
          advance(opensAt)
        }, 5200)
        return
      }
      const step = script[index]
      if (step.kind === 'card') {
        // A card ends the turn the way a reply does, so the dots run up to it
        // and stop when it lands. Then it is answered a moment later, because
        // the point of a card is that somebody says yes to it.
        setThinking(true)
        timer = setTimeout(() => {
          if (cancelled) {
            return
          }
          setThinking(false)
          setShown(index + 1)
          answering = setTimeout(() => {
            if (!cancelled) {
              setAnswered(true)
            }
          }, 1500)
          timer = setTimeout(() => advance(index + 1), pause.card)
        }, thinkingFor)
        return
      }
      if (step.kind === 'tool') {
        // The dots stay up: a tool running is the turn still working, and the
        // drawer keeps them under the tool line until the answer arrives.
        // The tick arrives part way through the line's own time.
        setThinking(true)
        setShown(index + 1)
        setWorking(index)
        timer = setTimeout(() => {
          if (!cancelled) {
            setWorking(-1)
          }
        }, pause.tool * 0.55)
        timer = setTimeout(() => advance(index + 1), pause.tool)
        return
      }
      if (step.kind === 'reply') {
        // The dots have been up since the question; the words replace them.
        setThinking(true)
        timer = setTimeout(() => {
          if (cancelled) {
            return
          }
          setThinking(false)
          setShown(index + 1)
          timer = setTimeout(() => advance(index + 1), pause.reply)
        }, thinkingFor)
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
        setThinking(true)
        timer = setTimeout(() => advance(index + 1), pause.say)
      }
      type()
    }

    timer = setTimeout(() => advance(opensAt), 1400)
    return () => {
      cancelled = true
      clearTimeout(timer)
      clearTimeout(answering)
    }
  }, [still, translate, current, script, opensAt])

  // Opening another conversation starts its recording from the beginning.
  const choose = (index: number) => {
    setCurrent(index)
    setShown(conversations[index].opensAt)
    setAnswered(false)
    setTyped('')
    setThinking(false)
    setWorking(-1)
  }

  // Follow the end, the way the drawer does while something is arriving.
  //
  // `thinking` belongs here as much as the lines do: the dots are an element
  // appended to the transcript, so once it is long enough to scroll they
  // arrive below the fold, and without this nothing goes to look at them —
  // which reads as the dots never having been there at all.
  useEffect(() => {
    const element = body.current
    if (element) {
      element.scrollTop = element.scrollHeight
    }
  }, [shown, typed, answered, thinking, working])

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
        position: 'relative',
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
          component='button'
          type='button'
          direction='row'
          aria-expanded={picking}
          aria-label={translate('welcome.agent.conversation.pick')}
          onClick={() => setPicking((open) => !open)}
          sx={{
            alignItems: 'center', gap: '6px', flex: 1, minWidth: 0,
            px: '6px', py: '4px', border: 0, background: 'none',
            font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer',
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 14, flexShrink: 0 }}/>
          <Typography sx={{ fontWeight: 600, fontSize: 13.5, minWidth: 0 }} noWrap>
            {translate(`welcome.agent.conversation.names.${conversation.id}`)}
          </Typography>
          <ExpandMoreIcon
            sx={{
              fontSize: 14, flexShrink: 0, color: surface.muted,
              transform: picking ? 'rotate(180deg)' : 'none',
              transition: 'transform 120ms ease',
            }}
          />
        </Stack>
        <BudgetRing surface={surface} colour={theme.palette.success.main}/>
        <CloseMark surface={surface}/>
      </Stack>

      {picking && (
        <>
          <Box
            onClick={() => setPicking(false)}
            sx={{ position: 'absolute', inset: 0, zIndex: 4 }}
          />
          <Stack
            role='menu'
            sx={{
              position: 'absolute', top: 44, left: 8, right: 8, zIndex: 5,
              p: '6px', gap: '2px', fontSize: 13,
              border: 1, borderColor: surface.border, borderRadius: '10px',
              bgcolor: surface.page, boxShadow: '0 8px 24px rgb(0 0 0 / 18%)',
            }}
          >
            {conversations.map((entry, index) => (
              <Stack
                key={entry.id}
                component='button'
                type='button'
                role='menuitem'
                direction='row'
                onClick={() => { choose(index); setPicking(false) }}
                sx={{
                  alignItems: 'center', gap: '6px', minHeight: 32, flexShrink: 0,
                  pl: '8px', pr: '4px', borderRadius: '6px',
                  border: 0, background: 'none', font: 'inherit', cursor: 'pointer',
                  color: surface.text, textAlign: 'left',
                  fontWeight: index === current ? 600 : 400,
                  '&:hover': { bgcolor: surface.hover },
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, minWidth: 0 }}>
                  <Box component='span' sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {translate(`welcome.agent.conversation.names.${entry.id}`)}
                  </Box>
                  <Box
                    component='span'
                    sx={{
                      fontSize: 11, fontWeight: 400, color: surface.muted,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {translate(`welcome.agent.conversation.summaries.${entry.id}`)}
                  </Box>
                </Box>
                {index === current && <CheckIcon sx={{ fontSize: 14, flexShrink: 0, color: surface.muted }}/>}
              </Stack>
            ))}
          </Stack>
        </>
      )}

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
            // "✓ mail_search · read 4 messages", which is the drawer's own
            // shape: the mark, the tool's name, then what it found, muted.
            const running = working === index
            return (
              <Typography
                key={`${step.kind}-${step.id}-${index}`}
                sx={{ px: 0.5, fontSize: 12, color: surface.muted }}
              >
                <Box component='span' sx={{ fontFamily: monospaceFamily }}>
                  {running ? '…' : '✓'} {step.tool}
                </Box>
                <Box component='span'> · {translate(`welcome.agent.conversation.tool.${step.id}`)}</Box>
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
        {thinking && (
          <Box
            sx={{
              alignSelf: 'flex-start', px: '14px', py: '10px',
              borderRadius: '10px', bgcolor: surface.field,
            }}
          >
            <Dots colour={surface.muted}/>
          </Box>
        )}
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

// The close, drawn rather than set as a × from the font. Where the glyph sits
// inside its line box is the font's business, and it is not the same font on
// every machine; two circles and two lines are centred wherever they land.
const CloseMark = ({ surface }: { surface: ReturnType<typeof surfaces> }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', px: '1px', color: surface.muted }}>
    <svg width='16' height='16' viewBox='0 0 16 16' aria-hidden='true' focusable='false'>
      <path
        d='M4.8 4.8 L11.2 11.2 M11.2 4.8 L4.8 11.2'
        stroke='currentColor' strokeWidth={1.7} strokeLinecap='round' fill='none'
      />
    </svg>
  </Box>
)

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

// Three dots that rise in turn, at the dashboard's own timing: 1.2s, each a
// fifth of a second behind the one before, and still for a reader who asked
// for less movement.
const Dots = ({ colour }: { colour: string }) => (
  <Box sx={{ display: 'inline-flex', gap: '4px' }}>
    {[0, 1, 2].map((index) => (
      <Box
        key={index}
        sx={{
          width: 6, height: 6, borderRadius: '50%', bgcolor: colour,
          animation: 'conversationDot 1.2s ease-in-out infinite',
          animationDelay: `${index * 0.2}s`,
          '@keyframes conversationDot': {
            '0%, 80%, 100%': { opacity: 0.3, transform: 'translateY(0)' },
            '40%': { opacity: 1, transform: 'translateY(-3px)' },
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0.6 },
        }}
      />
    ))}
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
