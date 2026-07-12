import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'

export default function AuthLayout() {
  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.08) 0%, transparent 50%), #0a0f1e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
    }}>
      {/* Animated grid background */}
      <Box sx={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
