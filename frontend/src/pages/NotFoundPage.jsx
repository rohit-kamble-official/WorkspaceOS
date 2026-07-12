import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Home } from '@mui/icons-material'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0a0f1e', textAlign: 'center', p: 3,
    }}>
      <Typography sx={{
        fontSize: '8rem', fontWeight: 900, lineHeight: 1,
        fontFamily: "'Plus Jakarta Sans'",
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        mb: 2,
      }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#f1f5f9', mb: 1 }}>Page Not Found</Typography>
      <Typography sx={{ color: '#64748b', mb: 4 }}>The page you're looking for doesn't exist or was moved.</Typography>
      <Button variant="contained" startIcon={<Home />} onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </Button>
    </Box>
  )
}
