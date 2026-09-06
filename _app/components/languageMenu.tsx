import { useState, type MouseEvent } from 'react'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import CheckIcon from '@mui/icons-material/Check'
import TranslateIcon from '@mui/icons-material/Translate'

import { languages, useTranslate } from '../i18n'
import { useLanguage } from './language'

// The languages the site is written in, behind one quiet button beside the
// appearance control. Each is named in its own language, so a reader who has
// landed in the wrong one can find their own.
export const LanguageMenu = () => {
  const translate = useTranslate()
  const [code, setCode] = useLanguage()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const close = () => setAnchor(null)

  return (
    <>
      <Tooltip title={translate('locale.label')}>
        <IconButton
          size='small'
          onClick={(event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget)}
          aria-label={translate('locale.label')}
          aria-haspopup='menu'
          sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'divider' } }}
        >
          <TranslateIcon sx={{ fontSize: 20 }}/>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 180, mt: 0.5 } } }}
      >
        {languages.map((language) => (
          <MenuItem key={language.code} selected={language.code === code} onClick={() => { setCode(language.code); close() }}>
            <ListItemIcon>
              { language.code === code ? (<CheckIcon fontSize='small'/>) : (<TranslateIcon fontSize='small' sx={{ opacity: 0 }}/>) }
            </ListItemIcon>
            <ListItemText primary={language.name}/>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
