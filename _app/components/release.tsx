import { useEffect, useState } from 'react'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'

import { useTranslate } from '../i18n'
import { links } from '../routes'

// The latest release, the licence and the language, as three small pills
// beside the buttons: enough to say the project is alive and free without a
// sentence about it.
//
// The version is asked of GitHub when the page opens, because writing it
// into the site would mean a site rebuild for every release, and a number
// that is often stale is worse than none. It is the one request this page
// makes off its own host. When it fails, or while it is on its way, the two
// pills that need no request are shown and the version is simply absent.

const latest = 'https://api.github.com/repos/ziyan/teanode/releases/latest'
const cacheKey = 'teanode.latestRelease'
const cacheFor = 60 * 60 * 1000

type Cached = { tag: string, at: number }

const remembered = (): string | undefined => {
  try {
    const raw = window.sessionStorage.getItem(cacheKey)
    if (!raw) {
      return undefined
    }
    const cached = JSON.parse(raw) as Cached
    return Date.now() - cached.at < cacheFor ? cached.tag : undefined
  } catch {
    return undefined
  }
}

const remember = (tag: string) => {
  try {
    window.sessionStorage.setItem(cacheKey, JSON.stringify({ tag, at: Date.now() } satisfies Cached))
  } catch {
    // Site data blocked. The next page load asks again, which is fine.
  }
}

export const Release = () => {
  const translate = useTranslate()
  const [tag, setTag] = useState<string | undefined>(remembered)

  useEffect(() => {
    if (tag) {
      return
    }
    const controller = new AbortController()
    fetch(latest, { signal: controller.signal, headers: { Accept: 'application/vnd.github+json' } })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(response.statusText))))
      .then((release: { tag_name?: string }) => {
        if (typeof release.tag_name === 'string' && /^v?\d/.test(release.tag_name)) {
          remember(release.tag_name)
          setTag(release.tag_name)
        }
      })
      .catch(() => {
        // Offline, rate limited, or blocked. The pill is decoration.
      })
    return () => controller.abort()
  }, [tag])

  const pill = { height: 26, fontSize: 12.5, fontWeight: 600 }

  return (
    <Stack direction='row' sx={{ flexWrap: 'wrap', gap: 1 }}>
      {tag && (
        <Chip
          component='a'
          href={links.releases}
          target='_blank'
          rel='noopener'
          clickable
          variant='outlined'
          label={translate('welcome.release.latest', { version: tag })}
          sx={pill}
        />
      )}
      <Chip variant='outlined' label={translate('welcome.release.licence')} sx={pill}/>
      <Chip variant='outlined' label={translate('welcome.release.language')} sx={pill}/>
    </Stack>
  )
}
