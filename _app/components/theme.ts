import { useCallback, useSyncExternalStore } from 'react'

// Theme is what the reader chose, not what they are currently seeing.
// "system" means follow the operating system, which is the default and what
// most people want; the other two are for when it is wrong.
//
// The storage key is the dashboard's, deliberately: somebody who chose dark
// there and opens the documentation from it should not be handed a white
// page. The inline script in index.html reads the same key before first
// paint. Keep the two in step.

export type ThemeChoice = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const themeChoices: ThemeChoice[] = ['system', 'light', 'dark']

const storageKey = 'teanode.theme'

const isChoice = (value: string | null): value is ThemeChoice =>
  value === 'system' || value === 'light' || value === 'dark'

// Tolerates a browser that refuses local storage: private browsing does, and
// the site should still work.
const storedTheme = (): ThemeChoice => {
  try {
    const stored = window.localStorage.getItem(storageKey)
    return isChoice(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

const systemQuery = () =>
  (window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null)

export const resolveTheme = (choice: ThemeChoice): ResolvedTheme => {
  if (choice !== 'system') {
    return choice
  }
  const preference = systemQuery()
  return preference && preference.matches ? 'dark' : 'light'
}

// Stamps the choice on the document. "system" stamps nothing, so the
// prefers-color-scheme rules decide, and keep deciding if the system changes
// while the page is open.
const applyTheme = (choice: ThemeChoice) => {
  const root = document.documentElement
  if (choice === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', choice)
  }
  // index.html paints the root inline before first paint, when no stylesheet
  // exists yet. It is an inline style, so it would outrank the theme for the
  // rest of the page's life; from here the theme owns the colour.
  root.style.background = ''
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    // The strips Safari draws above and below the page are browser UI, so no
    // page CSS reaches them; they have to be told the colour separately.
    meta.setAttribute('content', resolveTheme(choice) === 'dark' ? '#141416' : '#ffffff')
  }
}

// One choice, not one per component: the value lives here, applied the moment
// it is set rather than as a consequence of a render, and every component
// reads the same one.
let current: ThemeChoice = storedTheme()
const listeners = new Set<() => void>()

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  // While the choice is "system", the operating system can change under us,
  // and what is painted has to follow even though the choice did not.
  const preference = systemQuery()
  preference?.addEventListener('change', listener)
  return () => {
    listeners.delete(listener)
    preference?.removeEventListener('change', listener)
  }
}

export const useThemeChoice = (): [ThemeChoice, (choice: ThemeChoice) => void] => {
  const choice = useSyncExternalStore(subscribe, () => current)

  const setChoice = useCallback((next: ThemeChoice) => {
    current = next
    applyTheme(next)
    try {
      if (next === 'system') {
        window.localStorage.removeItem(storageKey)
      } else {
        window.localStorage.setItem(storageKey, next)
      }
    } catch {
      // Not being able to remember the choice is not a reason to ignore it
      // for this visit.
    }
    for (const listener of listeners) {
      listener()
    }
  }, [])

  return [choice, setChoice]
}

// What is actually painted, which is what the MUI theme has to be built for.
// Re-read on every notification, so a system change while on "system" is
// seen.
export const useResolvedTheme = (): ResolvedTheme =>
  useSyncExternalStore(subscribe, () => resolveTheme(current))

// Applied once, before React renders, so the meta tag and the inline
// background from index.html are reconciled with the stored choice.
export const initializeTheme = () => applyTheme(current)
