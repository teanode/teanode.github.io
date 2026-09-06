import { useState, type MouseEvent } from 'react'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import BrightnessAutoOutlinedIcon from '@mui/icons-material/BrightnessAutoOutlined'
import CheckIcon from '@mui/icons-material/Check'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'

import { useTranslate } from '../i18n'
import { themeChoices, useThemeChoice, type ThemeChoice } from './theme'

// Light, dark, or follow the system: the same three choices the dashboard
// offers, in the same order, behind one quiet button. The icon on the button
// is the choice, not what is painted, so somebody following the system sees
// that they are.
const icons: Record<ThemeChoice, typeof CheckIcon> = {
  system: BrightnessAutoOutlinedIcon,
  light: LightModeOutlinedIcon,
  dark: DarkModeOutlinedIcon,
}

export const AppearanceMenu = () => {
  const translate = useTranslate()
  const [choice, setChoice] = useThemeChoice()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const close = () => setAnchor(null)
  const Icon = icons[choice]

  return (
    <>
      <Tooltip title={translate('theme.label')}>
        <IconButton
          size='small'
          onClick={(event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget)}
          aria-label={translate('theme.label')}
          aria-haspopup='menu'
          sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'divider' } }}
        >
          <Icon sx={{ fontSize: 20 }}/>
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
        {themeChoices.map((option) => {
          const OptionIcon = icons[option]
          return (
            <MenuItem key={option} selected={option === choice} onClick={() => { setChoice(option); close() }}>
              <ListItemIcon>
                { option === choice ? (<CheckIcon fontSize='small'/>) : (<OptionIcon fontSize='small'/>) }
              </ListItemIcon>
              <ListItemText primary={translate(`theme.${option}`)}/>
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}
