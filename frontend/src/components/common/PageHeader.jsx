import { Box, Typography, Breadcrumbs, Link } from '@mui/material'
import { NavigateNext } from '@mui/icons-material'

export default function PageHeader({ title, subtitle, actions, breadcrumbs }) {
  return (
    <Box sx={{ mb: 3.5 }}>
      {breadcrumbs && (
        <Breadcrumbs separator={<NavigateNext sx={{ fontSize: 16 }} />} sx={{ mb: 1 }}>
          {breadcrumbs.map((b, i) => (
            <Typography key={i} sx={{ fontSize: '0.78rem', color: i === breadcrumbs.length - 1 ? '#6366f1' : '#475569', fontWeight: i === breadcrumbs.length - 1 ? 600 : 400 }}>
              {b}
            </Typography>
          ))}
        </Breadcrumbs>
      )}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" sx={{
            fontFamily: "'Plus Jakarta Sans'", fontWeight: 800,
            color: '#f1f5f9', letterSpacing: '-0.01em', lineHeight: 1.2,
          }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ color: '#64748b', fontSize: '0.875rem', mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>{actions}</Box>}
      </Box>
    </Box>
  )
}
