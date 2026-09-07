import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'

import { brand } from '../theme'

// Decoration, in the leaf green and nothing else, drawn behind the words.
//
// Route: a dashed line sweeping across a section with envelopes on their way
// along it. The story of the flow diagram, told as ornament. The envelopes
// move, slowly, and stand still for a reader who has asked for less motion.
//
// Steam: two faint waves across the seam between two bands, from the tea in
// the name.
//
// Both are pure SVG, sized to whatever they sit in, and take no clicks.

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The dashed lines. Each is drawn at one pixel per unit in a box far wider
// than any window, centred on the section and pinned to its top or bottom
// edge, so it stays in the margin however tall the section turns out and
// stays the same size however wide the window is: an envelope is an
// envelope, not a billboard. One line runs above the diagram on the right,
// from the middle out, and one along the foot the whole way across; neither
// crosses a word or a box.
const width = 6000
const centre = width / 2

// A gentle meander from one x to another between two heights: a run of
// curves joined tangent to tangent.
// With a `lead`, the path begins with that (which must end at `from`, at the
// middle height) and the meander carries on from it.
const meander = (from: number, to: number, low: number, high: number, step: number, lead?: string): string => {
  let d = lead ?? `M ${from} ${(low + high) / 2}`
  let x = from
  let up = true
  let first = lead === undefined
  while (x < to) {
    const next = Math.min(x + step, to)
    const y = up ? low : high
    if (first) {
      d += ` C ${x + step * 0.4} ${(low + high) / 2}, ${x + step * 0.6} ${y}, ${next} ${y}`
      first = false
    } else {
      d += ` S ${x + step * 0.6} ${y}, ${next} ${y}`
    }
    x = next
    up = !up
  }
  return d
}

// `overhang` is how far the box reaches past its edge, for a line that
// arrives from beyond the section rather than starting in the middle of it.
type Line = { d: string, height: number, edge: 'top' | 'bottom', overhang?: number, opacity: number, envelopes: { duration: number, begin: number }[], rest: [number, number] }

// The top line comes down from above the section, from under the bar across
// the top of the page, and only then sets off to the right.
const arrival = `M ${centre - 220} 0 C ${centre - 100} 70, ${centre - 20} 130, ${centre + 140} 155`

const routes: Line[] = [
  { d: meander(centre + 140, width + 40, 100, 210, 720, arrival), height: 260, edge: 'top', overhang: 60, opacity: 0.4, envelopes: [{ duration: 70, begin: -8 }, { duration: 70, begin: -43 }], rest: [centre + 500, 156] },
  { d: meander(-40, width + 40, 20, 80, 600), height: 100, edge: 'bottom', opacity: 0.55, envelopes: [0, 1, 2, 3, 4, 5].map((at) => ({ duration: 140, begin: -at * 23 })), rest: [centre - 280, 50] },
]

// A shorter route for the head of a document: one line above the title, one
// envelope. The title sits in a column of fixed width, so this one is sized
// to the column, and rather than stop at the column's edge the line climbs
// out of the top of the page before it gets there.
const shortWidth = 1260
const shortRoutes: Line[] = [
  { d: 'M -20 40 C 200 0, 380 70, 640 30 S 860 60, 980 24 C 1060 0, 1090 -30, 1110 -80', height: 80, edge: 'top', opacity: 0.45, envelopes: [{ duration: 20, begin: -4 }], rest: [700, 22] },
]

const Envelope = ({ paper, still, duration, begin, path }: {
  paper: string
  still: boolean
  duration: number
  begin: number
  path: string
}) => (
  <g opacity={0.8}>
    <g transform='translate(-14 -10)'>
      <rect width='28' height='20' rx='3' fill={paper} stroke={brand.leaf} strokeWidth='1.5'/>
      <path d='M 2 3 L 14 12 L 26 3' fill='none' stroke={brand.leaf} strokeWidth='1.5'/>
    </g>
    { !still && (
      <animateMotion dur={`${duration}s`} begin={`${begin}s`} repeatCount='indefinite' path={path} rotate='auto'/>
    ) }
  </g>
)

export const Route = ({ short }: { short?: boolean }) => {
  const theme = useTheme()
  const paper = theme.palette.background.paper
  const still = reducedMotion()
  const lines = short ? shortRoutes : routes
  const box = short ? shortWidth : width
  return (
    <>
      {lines.map((line) => (
        <Box
          key={line.d}
          component='svg'
          aria-hidden='true'
          viewBox={`0 0 ${box} ${line.height}`}
          preserveAspectRatio='xMidYMin meet'
          sx={{
            position: 'absolute', [line.edge]: -(line.overhang ?? 0), height: line.height,
            pointerEvents: 'none', display: { xs: 'none', md: 'block' },
            ...(short
              ? { left: 0, width: '100%', height: 'auto', aspectRatio: `${box} / ${line.height}` }
              : { left: '50%', width: box, ml: `${-box / 2}px` }),
          }}
        >
          <path d={line.d} fill='none' stroke={brand.leaf} strokeWidth='1.5' strokeDasharray='6 8' opacity={line.opacity}/>
          {line.envelopes.map((envelope, at) => (
            // A still envelope sits at a point along the line rather than at
            // the origin, so the picture is not one of a letter nowhere.
            <g key={at} transform={still ? `translate(${line.rest[0] + at * 400} ${line.rest[1]})` : undefined}>
              <Envelope paper={paper} still={still} duration={envelope.duration} begin={envelope.begin} path={line.d}/>
            </g>
          ))}
        </Box>
      ))}
    </>
  )
}

// A wave across the box: a run of smooth curves whose lengths and heights are
// drawn from the seed, so no two seams on a page rise and fall alike. The
// curves join tangent to tangent, which is what keeps it a wave rather than a
// scribble.
const wave = (random: () => number, centre: number, to: number): string => {
  let d = `M -20 ${centre}`
  let x = -20
  let up = random() < 0.5
  let first = true
  while (x < to) {
    const length = 160 + random() * 240
    const height = 8 + random() * 22
    const y = centre + (up ? -height : height)
    if (first) {
      d += ` C ${(x + length * 0.4).toFixed(0)} ${centre.toFixed(0)}, ${(x + length * 0.6).toFixed(0)} ${y.toFixed(0)}, ${(x + length).toFixed(0)} ${y.toFixed(0)}`
      first = false
    } else {
      d += ` S ${(x + length * 0.6).toFixed(0)} ${y.toFixed(0)}, ${(x + length).toFixed(0)} ${y.toFixed(0)}`
    }
    x += length
    up = !up
  }
  return d
}

// A small seeded generator, so a seam drawn once is drawn the same way again
// for as long as it is on the page.
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// With `bleed`, the steam is drawn twice as wide as the window rather than
// as wide as what it sits in, for a seam inside a column that is nowhere near
// the middle of the window: whatever holds the column clips the overhang.
export const Steam = ({ bleed }: { bleed?: boolean }) => {
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31))
  const span = bleed ? 2800 : 1400
  const paths = useMemo(() => {
    const random = seeded(seed)
    return [wave(random, 38, span + 20), wave(random, 46, span + 20)]
  }, [seed, span])
  return (
    <Box
      component='svg'
      aria-hidden='true'
      viewBox={`0 0 ${span} 80`}
      preserveAspectRatio='none'
      sx={{
        // The box is taller than the waves so their crests and troughs are
        // drawn whole; it straddles the seam, half above and half below.
        position: 'absolute', top: -40, height: 80, pointerEvents: 'none', opacity: 0.45,
        ...(bleed ? { left: '50%', width: '200vw', transform: 'translateX(-50%)' } : { left: 0, right: 0, width: '100%' }),
      }}
    >
      <path d={paths[0]} fill='none' stroke={brand.leaf} strokeWidth='1.5'/>
      <path d={paths[1]} fill='none' stroke={brand.leaf} strokeWidth='1.5' opacity='0.5'/>
    </Box>
  )
}
