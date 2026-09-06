import { createContext, use, type ReactNode } from 'react'

import translations from '../translations'

// Translation, without a dependency: look a dotted key up in a nested object,
// interpolate a few values, and switch languages. Nothing about it is specific
// to this site except the translations it reads.
//
// There is one language today. The mechanism is here so that adding another
// is a file under translations/ and a line in its index, the same shape the
// dashboard and the documents already use.

export type Language = {
  name: string
  code: string
}

export const languages: Language[] = translations.map((translation) => ({
  name: translation.name,
  code: translation.code,
}))

type TranslationTree = { [key: string]: string | TranslationTree }

const translationsByCode = new Map<string, TranslationTree>(
  translations.map((translation) => [translation.code, translation.translation as TranslationTree]),
)

export type Translate = (id: string, data?: Record<string, unknown>) => string

const lookup = (tree: TranslationTree | undefined, id: string): string | undefined => {
  let node: string | TranslationTree | undefined = tree
  for (const part of id.split('.')) {
    if (node === undefined || typeof node === 'string') {
      return undefined
    }
    node = node[part]
  }
  return typeof node === 'string' ? node : undefined
}

const interpolate = (template: string, data?: Record<string, unknown>): string => {
  if (!data) {
    return template
  }
  return template.replace(/\$\{(\w+)\}/g, (whole, name: string) =>
    name in data ? String(data[name]) : whole,
  )
}

export const makeTranslate = (code: string): Translate => {
  const active = translationsByCode.get(code)
  // The first language is the fallback, so a key missing from a translation
  // shows the original rather than nothing.
  const fallback = translationsByCode.get(languages[0].code)
  return (id, data) => {
    const template = lookup(active, id) ?? lookup(fallback, id)
    // A missing key renders as the key itself. Silent empty text would hide
    // the mistake until someone happened to look at that page.
    return template === undefined ? id : interpolate(template, data)
  }
}

// The language the site falls back to, and the one its keys are authored in.
export const defaultLanguageCode = languages[0].code

type LanguageValue = {
  code: string
  translate: Translate
}

const LanguageContext = createContext<LanguageValue>({
  code: defaultLanguageCode,
  translate: makeTranslate(defaultLanguageCode),
})

export const LanguageProvider = ({ code, children }: {
  code: string
  children: ReactNode
}) => (
  <LanguageContext value={{ code, translate: makeTranslate(code) }}>{children}</LanguageContext>
)

export const useTranslate = (): Translate => use(LanguageContext).translate

// For content that exists per language, a document's markdown, rather than
// for a key in the translation files.
export const useLanguageCode = (): string => use(LanguageContext).code

// Translate as an element, for the common case of a bare string in markup.
export const T = ({ id, data }: { id: string, data?: Record<string, unknown> }) => {
  const translate = useTranslate()
  return <>{translate(id, data)}</>
}
