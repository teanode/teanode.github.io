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

// The dashed lines. Each is drawn in a box 1400 wide and pinned to an edge of
// whatever the route sits behind, top or bottom, so it stays in the margin
// however tall the section turns out: one above the diagram on the right, one
// along the foot, and neither across a word or a box.
type Line = { d: string, height: number, edge: 'top' | 'bottom', opacity: number, envelopes: { duration: number, begin: number }[], rest: [number, number] }

const routes: Line[] = [
  { d: 'M 720 30 C 950 150, 1060 50, 1440 150', height: 200, edge: 'top', opacity: 0.4, envelopes: [{ duration: 24, begin: -6 }], rest: [1000, 96] },
  { d: 'M -40 40 C 300 90, 700 0, 1000 45 S 1300 90, 1440 20', height: 100, edge: 'bottom', opacity: 0.55, envelopes: [{ duration: 30, begin: 0 }, { duration: 30, begin: -15 }], rest: [420, 40] },
]

// A shorter route for the head of a document: one line above the title, one
// envelope.
const shortRoutes: Line[] = [
  { d: 'M -20 40 C 200 0, 380 70, 640 30 S 1000 0, 1240 40', height: 80, edge: 'top', opacity: 0.45, envelopes: [{ duration: 20, begin: -4 }], rest: [700, 22] },
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
  return (
    <>
      {lines.map((line) => (
        <Box
          key={line.d}
          component='svg'
          aria-hidden='true'
          viewBox={`0 0 1400 ${line.height}`}
          preserveAspectRatio='xMinYMin meet'
          sx={{
            position: 'absolute', left: 0, width: '100%', [line.edge]: 0, aspectRatio: `1400 / ${line.height}`,
            pointerEvents: 'none', display: { xs: 'none', md: 'block' },
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
const wave = (random: () => number, centre: number): string => {
  let d = `M -20 ${centre}`
  let x = -20
  let up = random() < 0.5
  let first = true
  while (x < 1420) {
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

// With `bleed`, the steam is drawn as wide as the window rather than as wide
// as what it sits in, for a seam inside a column: whatever holds the column
// clips the overhang.
export const Steam = ({ bleed }: { bleed?: boolean }) => {
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31))
  const paths = useMemo(() => {
    const random = seeded(seed)
    return [wave(random, 38), wave(random, 46)]
  }, [seed])
  return (
    <Box
      component='svg'
      aria-hidden='true'
      viewBox='0 0 1400 80'
      preserveAspectRatio='none'
      sx={{
        // The box is taller than the waves so their crests and troughs are
        // drawn whole; it straddles the seam, half above and half below.
        position: 'absolute', top: -40, height: 80, pointerEvents: 'none', opacity: 0.45,
        ...(bleed ? { left: '50%', width: '100vw', transform: 'translateX(-50%)' } : { left: 0, right: 0, width: '100%' }),
      }}
    >
      <path d={paths[0]} fill='none' stroke={brand.leaf} strokeWidth='1.5'/>
      <path d={paths[1]} fill='none' stroke={brand.leaf} strokeWidth='1.5' opacity='0.5'/>
    </Box>
  )
}
