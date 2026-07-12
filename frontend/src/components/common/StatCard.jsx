import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material'
import { TrendingUp, TrendingDown } from '@mui/icons-material'

export default function StatCard({ label, value, icon, trend, trendLabel, color = '#6366f1', loading, prefix = '', suffix = '' }) {
  const isPositive = trend >= 0

  return (
    <Card elevation={0} sx={{
      position: 'relative', overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 12px 40px rgba(0,0,0,0.4)` },
    }}>
      {/* Glow orb */}
      <Box sx={{
        position: 'absolute', top: -20, right: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: color, opacity: 0.06, filter: 'blur(30px)',
        pointerEvents: 'none',
      }} />

      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{
            width: 42, height: 42, borderRadius: 2,
            background: `linear-gradient(135deg, ${color}20, ${color}10)`,
            border: `1px solid ${color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            '& svg': { color, fontSize: 20 },
          }}>
            {icon}
          </Box>

          {trend !== undefined && !loading && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 0.4,
              background: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${isPositive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              borderRadius: 1.5, px: 1, py: 0.4,
            }}>
              {isPositive
                ? <TrendingUp sx={{ fontSize: 13, color: '#10b981' }} />
                : <TrendingDown sx={{ fontSize: 13, color: '#ef4444' }} />}
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: isPositive ? '#10b981' : '#ef4444' }}>
                {isPositive ? '+' : ''}{trend}%
              </Typography>
            </Box>
          )}
        </Box>

        {loading ? (
          <>
            <Skeleton width="60%" height={36} />
            <Skeleton width="80%" height={20} sx={{ mt: 0.5 }} />
          </>
        ) : (
          <>
            <Typography sx={{
              fontSize: '1.75rem', fontWeight: 800,
              color: '#f1f5f9', lineHeight: 1,
              fontFamily: "'Plus Jakarta Sans'",
              letterSpacing: '-0.02em',
            }}>
              {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mt: 0.6, fontWeight: 500 }}>
              {label}
            </Typography>
            {trendLabel && (
              <Typography sx={{ fontSize: '0.72rem', color: '#475569', mt: 0.3 }}>
                {trendLabel}
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
