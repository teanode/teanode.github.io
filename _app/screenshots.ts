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

// The pages there are pictures of, by the part of the front page that shows
// them, in the order each part shows them.
export const screenshotGroups = {
  chat: ['chatAgent', 'drawerMail', 'circleChat'],
  mail: ['mailbox', 'priority', 'followups', 'subscriptions'],
  calendar: ['calendar', 'drawerCalendar'],
  search: ['search'],
  contacts: ['contacts', 'personCard', 'circles'],
  photos: ['photos', 'photoViewer', 'photoAlbums'],
  location: ['location'],
  health: ['health'],
  coding: ['coding', 'drawerHerdr'],
  knowledge: ['knowledge', 'graph'],
  recordings: ['recording'],
  finance: ['financeSpending', 'financeCategories', 'financeReceipt', 'financeNetWorth'],
  payments: ['drawerPayment', 'payments'],
  passwords: ['passwords', 'passwordsAgent', 'passwordsShare'],
  setup: ['agent', 'agents', 'access', 'programs', 'aliases', 'dns'],
} as const
export type ScreenshotGroup = keyof typeof screenshotGroups
export type ScreenshotPage = typeof screenshotGroups[ScreenshotGroup][number]

// Where each picture was taken, for the address bar drawn over it.
export const screenshotPaths: Record<ScreenshotPage, string> = {
  chatAgent: '/chat',
  drawerMail: '/mailbox/inbox',
  circleChat: '/chat',
  mailbox: '/mailbox/inbox',
  priority: '/mailbox/priority',
  followups: '/mailbox/inbox',
  subscriptions: '/mailbox/subscriptions',
  calendar: '/calendar',
  drawerCalendar: '/calendar',
  contacts: '/contacts',
  circles: '/circles',
  photos: '/photos',
  photoViewer: '/photos',
  photoAlbums: '/photos/albums',
  location: '/location',
  health: '/health',
  coding: '/coding',
  drawerHerdr: '/coding',
  knowledge: '/knowledge/projects/garden-shed',
  graph: '/knowledge/explore',
  recording: '/recordings',
  financeSpending: '/finance/spending',
  financeCategories: '/finance/spending',
  financeReceipt: '/finance/transactions',
  financeNetWorth: '/finance/net-worth',
  drawerPayment: '/chat',
  payments: '/settings/agent/skills',
  passwords: '/passwords',
  passwordsAgent: '/passwords',
  passwordsShare: '/passwords',
  search: '/search?q=harbor',
  personCard: '/people/sam',
  agent: '/settings/agent',
  agents: '/manage/agent',
  access: '/manage/access',
  programs: '/settings/mailbox/devices',
  aliases: '/manage/domains/example.com/aliases',
  dns: '/manage/domains/example.com/settings',
}

// Every dashboard screenshot is this shape, so a slot the size of one can be
// laid out before it loads.
export const screenshotWidth = 1505
export const screenshotHeight = 812
