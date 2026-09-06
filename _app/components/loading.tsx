import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

// Waiting, centred in the space a thing is about to fill.
export const Spinner = ({ size = 32 }: { size?: number }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
    <CircularProgress size={size} color='inherit' sx={{ color: 'text.secondary' }}/>
  </Box>
)
