import { useCallback, useSyncExternalStore } from 'react'

import { defaultLanguageCode, languages } from '../i18n'

// Which language the site is read in: what the reader chose, and otherwise
// what the browser asks for.
//
// The storage key is the dashboard's, deliberately, so a reader who chose
// Japanese there is not handed English here. The shape is the theme store's:
// one value, applied the moment it is set, read by every component.

const storageKey = 'teanode.language'

const known = (value: string | null | undefined): value is string =>
  !!value && languages.some((language) => language.code === value)

// navigator.language is a tag like "zh-CN" or "ja-JP", so only the part
// before the dash is compared; a reader on zh-TW gets Simplified rather than
// English, which is closer to right than falling back.
const detectLanguage = (): string => {
  try {
    const stored = window.localStorage.getItem(storageKey)
    if (known(stored)) {
      return stored
    }
  } catch {
    // Private browsing refuses local storage.
  }
  for (const tag of navigator.languages ?? [navigator.language]) {
    const code = tag.split('-')[0]
    if (known(code)) {
      return code
    }
  }
  return defaultLanguageCode
}

let current = detectLanguage()
const listeners = new Set<() => void>()

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export const useLanguage = (): [string, (code: string) => void] => {
  const code = useSyncExternalStore(subscribe, () => current)

  const setCode = useCallback((next: string) => {
    if (!known(next)) {
      return
    }
    current = next
    document.documentElement.lang = next
    try {
      window.localStorage.setItem(storageKey, next)
    } catch {
      // Not being able to remember the choice is not a reason to ignore it
      // for this visit.
    }
    for (const listener of listeners) {
      listener()
    }
  }, [])

  return [code, setCode]
}

// Applied once, before React renders, so the document says what language it
// is in from the first paint.
export const initializeLanguage = () => {
  document.documentElement.lang = current
}
