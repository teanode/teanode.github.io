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
// It opens on the mailbox, which is what the dashboard opens on and the thing
// most people are deciding about, and works outwards from there.
export const screenshotPages = [
  'mailbox', 'priority', 'agent', 'subscriptions', 'programs', 'access', 'aliases', 'dns', 'agents',
] as const
export type ScreenshotPage = typeof screenshotPages[number]

// Where each picture was taken, for the address bar drawn over it.
export const screenshotPaths: Record<ScreenshotPage, string> = {
  mailbox: '/mailbox/inbox',
  priority: '/mailbox/priority',
  agent: '/settings/agent',
  agents: '/server/agents',
  subscriptions: '/mailbox/subscriptions',
  programs: '/mailbox/settings/devices',
  access: '/access',
  aliases: '/domains/example.com/aliases',
  dns: '/domains/example.com/settings',
}

// Every dashboard screenshot is this shape, so a slot the size of one can be
// laid out before it loads.
export const screenshotWidth = 1505
export const screenshotHeight = 812
