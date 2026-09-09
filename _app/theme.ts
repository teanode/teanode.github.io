import { touchRippleClasses } from '@mui/material/ButtonBase'
import { createTheme, type Theme } from '@mui/material/styles'

// The look: quiet chrome, colour only where it means something.
//
// These are the dashboard's own tokens, from web/src/style.css in the server
// repository, so that the site and the thing it describes are one design.
// Almost nothing is coloured. The rail is a warm grey against a white page,
// the selected row is a raised pill rather than a highlight, and what you
// press is near-black. Colour is kept for the mark, which is the one piece of
// brand here, and for the few states that carry a meaning.
//
// It inverts rather than dims for dark. A near-black button on white becomes
// a near-white button on black; the rail stays one step darker than the page
// in both, so the same shape reads the same way round.

export type Mode = 'light' | 'dark'

const light = {
  page: '#ffffff',
  // The rail, one step off the page so the two read as separate surfaces
  // without a rule between them.
  rail: '#f7f7f6',
  raised: '#ffffff',
  border: '#e7e7e4',
  borderStrong: '#d8d8d4',
  // What you type into inside the rail: filled rather than outlined, because
  // it is a place to type and not a value being edited.
  field: '#eeeeea',
  hover: '#efefec',
  text: '#18181b',
  muted: '#6f6f76',
  // What you press. Near-black rather than true black, which reads as heavy.
  action: '#1f1f22',
  actionText: '#ffffff',
  actionHover: '#000000',
}

const dark = {
  page: '#141416',
  rail: '#0c0c0e',
  raised: '#1a1a1d',
  border: '#2a2a2e',
  borderStrong: '#3a3a40',
  field: '#18181b',
  hover: '#17171a',
  text: '#f4f4f5',
  muted: '#a0a0a8',
  action: '#f4f4f5',
  actionText: '#18181b',
  actionHover: '#ffffff',
}

export const surfaces = (mode: Mode) => (mode === 'dark' ? dark : light)

// The mark's own greens. Used nowhere else: chrome that competed with the
// logo would make it just another coloured thing.
export const brand = {
  leaf: '#729d39',
  light: '#c6e377',
  pale: '#fbfad3',
}

// Syntax colours for a fenced code block, tuned against the page's own field
// colour in each theme rather than vendored from a highlight.js stylesheet
// that would bring its own background with it. Muted on purpose: the page's
// text nudged apart far enough to tell a string from a keyword and no further.
const lightSyntax = {
  comment: '#8a8a93',
  keyword: '#a3306e',
  string: '#2f7a4d',
  number: '#9a5518',
  title: '#2d5fa8',
  type: '#1f7a7a',
  variable: '#6b4bab',
  meta: '#a24a37',
}

const darkSyntax = {
  comment: '#82828d',
  keyword: '#f091bd',
  string: '#8fd4a4',
  number: '#e3b171',
  title: '#8ab6ec',
  type: '#71c8c2',
  variable: '#bda6f0',
  meta: '#eb9a89',
}

export const syntax = (mode: Mode) => (mode === 'dark' ? darkSyntax : lightSyntax)

// The dashboard's typeface: the system's own, so the page looks native on
// every platform and loads nothing from anywhere.
export const fontFamily = [
  '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif',
].join(', ')

export const monospaceFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

export const themeFor = (mode: Mode): Theme => {
  const surface = surfaces(mode)

  return createTheme({
    palette: {
      mode,
      primary: { main: surface.action, contrastText: surface.actionText },
      background: { default: surface.page, paper: surface.raised },
      divider: surface.border,
      text: { primary: surface.text, secondary: surface.muted },
      action: { hover: surface.hover },
      success: { main: mode === 'dark' ? '#4ade80' : '#16a34a' },
      warning: { main: mode === 'dark' ? '#fbbf24' : '#d97706' },
      error: { main: mode === 'dark' ? '#f87171' : '#dc2626' },
    },

    // The dashboard's radius scale: 6 for a chip, 8 for a control, 12 for a
    // panel. MUI's one number is the control.
    shape: { borderRadius: 8 },

    typography: {
      fontFamily,
      fontSize: 14,
      // The page's own name, big and first. It is the only large thing on a
      // page, which is what makes it findable without a rule under it.
      h1: { fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
      h5: { fontSize: '1.2rem', fontWeight: 650, letterSpacing: '-0.01em' },
      h6: { fontSize: '1rem', fontWeight: 650, letterSpacing: '-0.005em' },
      // The small grey label over a group in the rail. Not uppercase: at this
      // size the weight and the colour do the separating, and capitals only
      // make it harder to read.
      h2: { fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.01em' },
      body1: { fontSize: 15, lineHeight: 1.6 },
      body2: { fontSize: 14, lineHeight: 1.5 },
      button: { textTransform: 'none', fontWeight: 550, letterSpacing: 0 },
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { colorScheme: mode },
          // Scrollbars that do not draw a grey slab down the side of a quiet
          // page.
          '*::-webkit-scrollbar': { width: 10, height: 10 },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: surface.border,
            borderRadius: 8,
            border: `3px solid ${surface.page}`,
          },
        },
      },

      // The ripple that says a press landed, and where it landed. MUI already
      // draws one on every ButtonBase — the buttons, the icon buttons, the
      // menu items, the rail rows — and it already starts at the point under
      // the finger. The default is only too quiet to notice here: this page is
      // near-monochrome, so a ripple in the current text colour at under a
      // quarter opacity is grey on grey and reads as nothing happening.
      //
      // Raised and slowed until the travel is legible. The colour stays
      // currentColor, which is what makes it work on every surface without a
      // per-variant rule: near-white text on the near-black button gives a
      // pale ripple, grey text in the bar gives a grey one, and the inversion
      // for dark comes free with the palette.
      //
      // Reached through ButtonBase because the ripple is internal to it and
      // MUI keeps no MuiTouchRipple key in the themeable map. The class names
      // come from the package rather than being written out here, so a rename
      // upstream is a build error instead of a rule that quietly stops
      // matching.
      MuiButtonBase: {
        styleOverrides: {
          root: {
            // Our own keyframes, because the opacity is animated rather than
            // set: MUI's enter frames end at 0.3, so overriding the static
            // opacity changes only what is left after the ripple has stopped
            // moving, which is not the part anybody sees.
            '@keyframes rippleEnter': {
              '0%': { transform: 'scale(0)', opacity: 0.12 },
              '100%': { transform: 'scale(1)', opacity: 0.42 },
            },
            // Doubled, for specificity. MUI writes its own rule at the same
            // weight as a single "&" and emotion injects it after ours, so a
            // tie goes to MUI and nothing here would apply.
            [`&& .${touchRippleClasses.rippleVisible}`]: {
              opacity: 0.42,
              animationName: 'rippleEnter',
              animationDuration: '620ms',
              // Quick off the mark and easing out long, so the eye follows
              // the edge travelling outwards rather than seeing the whole
              // target flash at once.
              animationTimingFunction: 'cubic-bezier(0.2, 0.6, 0.3, 1)',
            },
            [`&& .${touchRippleClasses.childLeaving}`]: { animationDuration: '620ms' },
          },
        },
      },

      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: ({ ownerState }) => ({
            borderRadius: 8,
            paddingInline: 14,
            ...(ownerState.variant === 'contained' && (ownerState.color === 'primary' || !ownerState.color) && {
              backgroundColor: surface.action,
              color: surface.actionText,
              '&:hover': { backgroundColor: surface.actionHover },
            }),
            ...(ownerState.variant === 'outlined' && (ownerState.color === 'primary' || !ownerState.color) && {
              borderColor: surface.border,
              color: surface.text,
              backgroundColor: surface.raised,
              '&:hover': { borderColor: surface.borderStrong, backgroundColor: surface.hover },
            }),
            ...(ownerState.variant === 'text' && (ownerState.color === 'primary' || !ownerState.color) && {
              color: surface.muted,
              '&:hover': { color: surface.text, backgroundColor: 'transparent' },
            }),
          }),
        },
      },

      MuiPaper: { defaultProps: { elevation: 0 } },

      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: { root: { borderRadius: 12, borderColor: surface.border } },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: surface.raised,
            '& fieldset': { borderColor: surface.border },
            '&:hover fieldset': { borderColor: surface.borderStrong },
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6, fontWeight: 550, fontSize: '0.75rem' },
          outlined: { borderColor: surface.border },
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            minHeight: 40, borderRadius: 8, paddingInline: 10,
            color: surface.muted,
            '&:hover': { backgroundColor: surface.hover },
            // Selected is a raised pill rather than a wash of colour: it says
            // "you are here" without spending the one accent the page has on
            // navigation.
            '&.Mui-selected': {
              backgroundColor: surface.raised,
              color: surface.text,
              boxShadow: mode === 'dark' ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.06)',
              border: `1px solid ${surface.border}`,
              '&:hover': { backgroundColor: surface.raised },
            },
          },
        },
      },
      MuiListItemIcon: { styleOverrides: { root: { minWidth: 30, color: 'inherit' } } },

      MuiMenuItem: { styleOverrides: { root: { minHeight: 40, borderRadius: 6, marginInline: 6 } } },
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: `1px solid ${surface.border}`, borderRadius: 8,
            boxShadow: '0 8px 28px rgb(0 0 0 / 22%)',
          },
        },
      },

      MuiLink: {
        defaultProps: { underline: 'always' },
        styleOverrides: {
          // A link in running text is the text colour, underlined. The accent
          // is what you press, and painting every link with it turns a page
          // of prose into a page of buttons.
          root: {
            color: surface.text,
            textDecorationColor: surface.borderStrong,
            textUnderlineOffset: 2,
            '&:hover': { textDecorationColor: surface.text },
          },
        },
      },

      MuiTooltip: { defaultProps: { arrow: false } },
    },
  })
}
