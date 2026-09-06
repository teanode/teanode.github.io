import { defaultLanguageCode } from './i18n'

// The documents, and the markdown each one is.
//
// Both are static files beside the site rather than anything a server
// answers: data/docs.json is the index and data/docs/<language>/*.markdown
// the content, both at the repository root because that is what GitHub Pages
// serves. Adding a document is one file and one entry in the index.

// A value written once per language it exists in. A document translated into
// one language and not another is the ordinary case, and the shape says so.
export type Localised = Record<string, string>

export interface Doc {
  slug: string
  group: Localised
  title: Localised
  // A sentence saying what is in it. Shown under the title, and the thing the
  // rail's search matches against: searching document bodies would mean
  // fetching every one of them to answer the first keystroke.
  description: Localised
  // The path under /data/docs, spelled out per language rather than derived
  // from one name and a directory, so which languages a document exists in
  // is a fact stated in one place.
  filename: Localised
}

// The reader's language where the document has it, and the original where it
// does not.
export const inLanguage = (values: Localised | string | undefined, language: string): string => {
  if (typeof values === 'string') {
    return values
  }
  return values?.[language] ?? values?.[defaultLanguageCode] ?? Object.values(values ?? {})[0] ?? ''
}

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${url}: ${response.status}`)
  }
  return response.text()
}

export const listDocs = async (): Promise<Doc[]> =>
  JSON.parse(await fetchText('/data/docs.json')) as Doc[]

export const fetchDoc = (filename: string): Promise<string> =>
  fetchText(`/data/docs/${filename}`)
