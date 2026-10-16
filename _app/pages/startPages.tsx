import { useEffect, useMemo, type ReactNode } from 'react'
import { NavLink, generatePath } from 'react-router'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { Markdown, renderMarkdown } from '../components/markdown'
import { pageWidth, PublicShell } from '../components/shell'
import { T, useTranslate } from '../i18n'
import routes from '../routes'

// The video, its first frame, and the pictures, through the build so each
// is served under a hashed name, as screenshots.ts does for the dashboard's.
const files = import.meta.glob('../assets/start/*', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const asset = (name: string) => files[`../assets/start/${name}`]
const video = asset('teanode-start.mp4')
const poster = asset('poster.jpg')

//
// StartPage
//
// Getting started, for somebody who has decided to try it: the video of the
// whole thing first, then each step again with a picture of only the part of
// the screen that step asks them to use. The assistant alone, because it
// needs nothing but a computer and a key; mail is a link at the end.
//

export const installCommand = 'curl -fsSL https://teanode.com/get.sh | sh'
const tunnelCommand = 'ssh -L 8080:127.0.0.1:8080 you@your-server'

// The pictures were taken at twice their size on the page.
const steps: { key: string, picture: string, width: number, code?: string, isWide?: boolean }[] = [
  { key: 'install', picture: asset('install.png'), width: 1080, code: installCommand, isWide: true },
  { key: 'account', picture: asset('account.png'), width: 448, code: tunnelCommand },
  { key: 'key', picture: asset('key.png'), width: 448 },
  { key: 'hello', picture: asset('hello.png'), width: 448 },
]

export const StartPage = () => {
  const translate = useTranslate()
  const snippets = useMemo(
    () => Object.fromEntries(steps.filter((step) => step.code).map((step) => [step.key, renderMarkdown('```bash\n' + step.code + '\n```').html])),
    [],
  )
  const quickStart = generatePath(routes.docPath, { docId: 'quick-start' })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div>
      <title>{`${translate('start.title')} - ${translate('title')}`}</title>
      <PublicShell>
        <Box sx={{ ...pageWidth, pt: { xs: 5, md: 7 }, pb: { xs: 3, md: 4 } }}>
          <Typography variant='h1' sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, lineHeight: 1.12, mb: 1.5 }}>
            <T id='start.headline'/>
          </Typography>
          <Typography sx={{ maxWidth: '60ch', fontSize: 17, color: 'text.secondary' }}>
            <T id='start.lead'/>
          </Typography>
        </Box>

        {/* The whole of it, about a minute and a half, recorded on a fresh
            server. Muted with its words burned in, so it plays inline on a
            phone without asking. */}
        <Box sx={{ ...pageWidth, pb: { xs: 5, md: 7 } }}>
          <Box
            component='video'
            src={video}
            poster={poster}
            controls
            playsInline
            muted
            preload='metadata'
            aria-label={translate('start.videoLabel')}
            sx={{
              display: 'block', width: '100%', maxWidth: 1000, aspectRatio: '1280 / 800', bgcolor: '#f4f3ee',
              borderRadius: 2, border: 1, borderColor: 'divider', boxShadow: '0 18px 50px rgba(0,0,0,0.12)',
            }}
          />
        </Box>

        <Box
          component='ol'
          sx={{ ...pageWidth, listStyle: 'none', m: '0 auto', pb: { xs: 5, md: 8 }, display: 'flex', flexDirection: 'column', gap: { xs: 6, md: 8 } }}
        >
          {steps.map((step, index) => (
            <Box
              component='li'
              key={step.key}
              sx={{
                display: 'grid', gap: { xs: 2.5, md: 5 }, alignItems: 'start',
                gridTemplateColumns: { xs: '1fr', md: step.isWide ? '1fr' : 'minmax(0, 1fr) minmax(0, 448px)' },
              }}
            >
              <Box sx={{ minWidth: 0, maxWidth: '60ch' }}>
                <Stack direction='row' sx={{ gap: 1.5, alignItems: 'baseline', mb: 1 }}>
                  <Number>{index + 1}</Number>
                  <Typography component='h2' sx={{ fontWeight: 650, fontSize: { xs: 20, md: 22 } }}>
                    <T id={`start.steps.${step.key}.title`}/>
                  </Typography>
                </Stack>
                <Typography sx={{ color: 'text.secondary', lineHeight: 1.6, mb: step.code ? 1.5 : 0 }}>
                  <T id={`start.steps.${step.key}.body`}/>
                </Typography>
                {step.code && <Markdown html={snippets[step.key]} compact/>}
                <Typography variant='body2' sx={{ color: 'text.secondary', lineHeight: 1.6, mt: 1.5 }}>
                  <T id={`start.steps.${step.key}.note`}/>
                </Typography>
              </Box>
              {step.isWide
                ? (
                    // A terminal's text is unreadable at a phone's width, so
                    // it keeps a readable size there and scrolls sideways in
                    // its own box.
                    <Box sx={{ overflowX: 'auto', mx: { xs: -2, md: 0 }, px: { xs: 2, md: 0 }, pb: { xs: 1, md: 0 } }}>
                      <Box sx={{ minWidth: { xs: 640, md: 0 } }}>
                        <Picture src={step.picture} width={step.width} alt={translate(`start.steps.${step.key}.picture`)}/>
                      </Box>
                    </Box>
                  )
                : <Picture src={step.picture} width={step.width} alt={translate(`start.steps.${step.key}.picture`)}/>}
            </Box>
          ))}
        </Box>

        <Box sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0c0c0e' : '#f7f7f6'), borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ ...pageWidth, py: { xs: 4, md: 6 } }}>
            <Typography component='h2' sx={{ fontWeight: 650, fontSize: 20, mb: 1.5 }}><T id='start.nextHeading'/></Typography>
            <Box component='ul' sx={{ m: 0, pl: 2.5, color: 'text.secondary', lineHeight: 1.9 }}>
              <li><Link component={NavLink} to={`${quickStart}#4-reach-it-from-your-phone`} color='text.primary'><T id='start.next.phone'/></Link></li>
              <li><Link component={NavLink} to={`${quickStart}#with-your-own-mail`} color='text.primary'><T id='start.next.mail'/></Link></li>
              <li><Link component={NavLink} to={routes.docsPath} color='text.primary'><T id='start.next.docs'/></Link></li>
            </Box>
          </Box>
        </Box>
      </PublicShell>
    </div>
  )
}

const Number = ({ children }: { children: ReactNode }) => (
  <Box
    aria-hidden
    sx={{
      flex: 'none', width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center',
      bgcolor: 'text.primary', color: 'background.default', fontWeight: 700, fontSize: 15, transform: 'translateY(-2px)',
    }}
  >
    {children}
  </Box>
)

// A picture of the dashboard on the page's own background: it already has
// its card's edge, so it gets no second frame, only a shadow.
const Picture = ({ src, width, alt }: { src: string, width: number, alt: string }) => (
  <Box
    component='img'
    src={src}
    alt={alt}
    loading='lazy'
    sx={{ display: 'block', width: '100%', maxWidth: width, height: 'auto', borderRadius: 2, boxShadow: '0 10px 34px rgba(0,0,0,0.12)' }}
  />
)
