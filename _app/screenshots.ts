// The dashboard, photographed once per page, per theme and per language.
//
// The pictures live in assets/screenshots/ as <page>.<theme>.<language>.jpg
// and go through the build, so each is served from /static/ under a name
// carrying a content hash: cached for a year, and replaced by a new name the
// moment the picture changes. Nothing here is fetched at runtime by a name
// that could go stale.
//
// A page is looked up by its name, and the picture shown is the one for the
// theme being read in and the reader's language, falling back to English
// where the dashboard has not been photographed in that language.

const files = import.meta.glob('./assets/screenshots/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

const byKey = new Map<string, string>()
for (const [path, url] of Object.entries(files)) {
  const name = path.split('/').pop()!.replace(/\.jpg$/, '')
  byKey.set(name, url)
}

export type ScreenshotTheme = 'light' | 'dark'

export const screenshot = (page: string, theme: ScreenshotTheme, language: string): string | undefined =>
  byKey.get(`${page}.${theme}.${language}`) ?? byKey.get(`${page}.${theme}.en`)

// The pages there are pictures of, in the order the front page shows them.
// It opens on the DNS page, which is the one that looks like something, and
// keeps the plain mail list for later.
export const screenshotPages = ['dns', 'aliases', 'message', 'mail', 'report', 'reports', 'templates', 'template', 'layout'] as const
export type ScreenshotPage = typeof screenshotPages[number]

// Every dashboard screenshot is this shape, so a slot the size of one can be
// laid out before it loads.
export const screenshotWidth = 1505
export const screenshotHeight = 812
