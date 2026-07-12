import { useQuery } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Typography, Grid, Button, Chip, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Skeleton,
} from '@mui/material'
import { CheckCircle, Star, Business, Groups, Diamond, CreditCard } from '@mui/icons-material'
import { analyticsApi } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import { format, parseISO } from 'date-fns'

const PLANS = [
  {
    name: 'Free', price: 0, color: '#64748b', icon: <Star />,
    features: ['5 users', '1 building', '50 bookings/month', 'Basic analytics'],
  },
  {
    name: 'Basic', price: 49, color: '#10b981', icon: <Business />,
    features: ['25 users', '3 buildings', '500 bookings/month', 'Advanced analytics', 'Email notifications'],
    popular: false,
  },
  {
    name: 'Business', price: 149, color: '#6366f1', icon: <Groups />,
    features: ['100 users', '10 buildings', 'Unlimited bookings', 'Full analytics', 'Priority support', 'API access'],
    popular: true,
  },
  {
    name: 'Enterprise', price: 499, color: '#f59e0b', icon: <Diamond />,
    features: ['Unlimited users', 'Unlimited buildings', 'Unlimited bookings', 'Custom analytics', 'Dedicated support', 'SLA guarantee', 'Custom integrations'],
  },
]

export default function BillingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'subscription'],
    queryFn: () => analyticsApi.getSubscription(),
  })

  const sub = data?.data?.data

  return (
    <Box className="fade-in">
      <PageHeader
        title="Billing"
        subtitle="Manage your subscription and payment history"
        breadcrumbs={['Home', 'Billing']}
      />

      {/* Current subscription */}
      <Card elevation={0} sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(79,70,229,0.05))', border: '1px solid rgba(99,102,241,0.2)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography sx={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                Current Plan
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, color: '#f1f5f9', mb: 0.75 }}>
                {isLoading ? <Skeleton width={120} /> : sub?.plan || 'FREE'}
              </Typography>
              {sub?.endDate && (
                <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>
                  Renews {format(parseISO(sub.endDate), 'MMMM d, yyyy')}
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Chip
                label={sub?.status || 'ACTIVE'}
                sx={{
                  background: 'rgba(16,185,129,0.1)',
                  color: '#10b981',
                  border: '1px solid rgba(16,185,129,0.2)',
                  fontWeight: 700, fontSize: '0.78rem',
                  mb: 1.5,
                }}
              />
              <Box sx={{ display: 'flex', gap: 3 }}>
                {[
                  { label: 'Max Users', value: sub?.maxUsers || '—' },
                  { label: 'Max Buildings', value: sub?.maxBuildings || '—' },
                  { label: 'Monthly Bookings', value: sub?.maxBookings || '—' },
                ].map(s => (
                  <Box key={s.label} sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9' }}>{isLoading ? <Skeleton width={30} /> : s.value}</Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: '#475569' }}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Plans */}
      <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '1.1rem', color: '#f1f5f9', mb: 2 }}>
        Available Plans
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {PLANS.map((plan) => {
          const isCurrent = sub?.plan === plan.name.toUpperCase()
          return (
            <Grid item xs={12} sm={6} xl={3} key={plan.name}>
              <Card elevation={0} sx={{
                height: '100%', position: 'relative',
                border: plan.popular ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.06)',
                background: plan.popular ? 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(79,70,229,0.04))' : undefined,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 16px 40px rgba(0,0,0,0.4)` },
              }}>
                {plan.popular && (
                  <Box sx={{
                    position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: 'white', fontSize: '0.68rem', fontWeight: 700,
                    px: 1.5, py: 0.4, borderRadius: '0 0 8px 8px',
                    letterSpacing: '0.05em',
                  }}>
                    POPULAR
                  </Box>
                )}
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Box sx={{ color: plan.color }}>{plan.icon}</Box>
                    <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                      {plan.name}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', fontFamily: "'Plus Jakarta Sans'", letterSpacing: '-0.02em', lineHeight: 1 }}>
                      ${plan.price}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>/month</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
                    {plan.features.map(f => (
                      <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle sx={{ fontSize: 14, color: plan.color }} />
                        <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>{f}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Button
                    fullWidth
                    variant={isCurrent ? 'outlined' : plan.popular ? 'contained' : 'outlined'}
                    disabled={isCurrent}
                    sx={plan.popular && !isCurrent ? {} : { borderColor: `${plan.color}40`, color: plan.color }}
                  >
                    {isCurrent ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Payment history */}
      {sub?.payments?.length > 0 && (
        <>
          <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '1.1rem', color: '#f1f5f9', mb: 2 }}>
            Payment History
          </Typography>
          <Card elevation={0}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {['Date', 'Amount', 'Status', 'Method'].map(h => (
                      <TableCell key={h}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sub.payments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell><Typography sx={{ fontSize: '0.82rem', color: '#e2e8f0' }}>{format(parseISO(payment.createdAt), 'MMM d, yyyy')}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>${parseFloat(payment.amount).toFixed(2)}</Typography></TableCell>
                      <TableCell>
                        <Chip label={payment.status} size="small" sx={{ fontSize: '0.72rem', background: payment.status === 'COMPLETED' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: payment.status === 'COMPLETED' ? '#10b981' : '#f59e0b' }} />
                      </TableCell>
                      <TableCell><Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>{payment.method || 'Card'}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Box>
  )
}
