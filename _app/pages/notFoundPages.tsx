import { NavLink } from 'react-router'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { T, useTranslate } from '../i18n'
import { PublicShell } from '../components/shell'
import routes from '../routes'

// Where a path nobody serves lands. It stays put and says so, rather than
// redirecting: the address in the bar is the one piece of evidence about what
// went wrong, and a redirect would take it away.
export const NotFoundPage = () => {
  const translate = useTranslate()

  return (
    <div>
      <title>{`${translate('notFound.title')} - ${translate('title')}`}</title>
      <PublicShell>
        <Stack
          spacing={2}
          sx={{ alignItems: 'flex-start', maxWidth: 520, mx: 'auto', px: { xs: 2, md: 0 }, py: { xs: 6, md: 12 } }}
        >
          <Typography variant='h1'><T id='notFound.title'/></Typography>
          <Typography color='text.secondary'><T id='notFound.body'/></Typography>
          <Stack direction='row' spacing={1.5} sx={{ pt: 1 }}>
            <Button component={NavLink} to={routes.welcomePath} variant='contained'>
              <T id='notFound.toHome'/>
            </Button>
            <Button component={NavLink} to={routes.docsPath} variant='outlined'>
              <T id='notFound.toDocs'/>
            </Button>
          </Stack>
        </Stack>
      </PublicShell>
    </div>
  )
}
