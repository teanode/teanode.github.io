import { useMemo, type ReactNode } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'

import { LanguageProvider } from '../i18n'
import { themeFor } from '../theme'
import { Analytics } from './analytics'
import { Canonical } from './canonical'
import { useLanguage } from './language'
import { useResolvedTheme } from './theme'

export const App = ({ children }: { children?: ReactNode }) => {
  const mode = useResolvedTheme()
  const [language] = useLanguage()

  // Rebuilt only when the mode changes: createTheme is not free, and a new
  // theme object on every render remakes every styled component below it.
  const theme = useMemo(() => themeFor(mode), [mode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <Analytics/>
      <Canonical/>
      <LanguageProvider code={language}>{children}</LanguageProvider>
    </ThemeProvider>
  )
}
