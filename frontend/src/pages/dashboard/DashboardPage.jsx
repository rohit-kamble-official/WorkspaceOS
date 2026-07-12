import { useQuery } from '@tanstack/react-query'
import { Box, Grid, Card, CardContent, Typography, Avatar, Chip, LinearProgress, Skeleton, Divider } from '@mui/material'
import {
  People, EventNote, Business, AttachMoney, TrendingUp,
  Circle, Schedule, CheckCircle, Cancel, HourglassEmpty,
} from '@mui/icons-material'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { analyticsApi } from '../../services/api'
import { useSelector } from 'react-redux'
import { selectUser, selectTenant } from '../../redux/slices/authSlice'
import StatCard from '../../components/common/StatCard'
import PageHeader from '../../components/common/PageHeader'
import { format } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
      ticks: { color: '#475569', font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
      ticks: { color: '#475569', font: { size: 11 } },
      border: { dash: [4, 4] },
    },
  },
}

const STATUS_CONFIG = {
  CONFIRMED: { color: '#10b981', icon: <CheckCircle sx={{ fontSize: 14 }} />, label: 'Confirmed' },
  PENDING: { color: '#f59e0b', icon: <HourglassEmpty sx={{ fontSize: 14 }} />, label: 'Pending' },
  CANCELLED: { color: '#ef4444', icon: <Cancel sx={{ fontSize: 14 }} />, label: 'Cancelled' },
  COMPLETED: { color: '#6366f1', icon: <CheckCircle sx={{ fontSize: 14 }} />, label: 'Completed' },
}

function ActivityItem({ icon, title, time, color }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.5 }}>
      <Box sx={{
        width: 34, height: 34, borderRadius: 1.5, flexShrink: 0,
        background: `${color}15`, border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        '& svg': { color, fontSize: 16 },
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: '#e2e8f0' }}>{title}</Typography>
        <Typography sx={{ fontSize: '0.72rem', color: '#475569', mt: 0.2 }}>{time}</Typography>
      </Box>
    </Box>
  )
}

export default function DashboardPage() {
  const user = useSelector(selectUser)
  const tenant = useSelector(selectTenant)
  const now = new Date()

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsApi.getDashboard(),
  })

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => analyticsApi.getRevenue(6),
  })

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['analytics', 'daily'],
    queryFn: () => analyticsApi.getDailyBookings(14),
  })

  const { data: statusData } = useQuery({
    queryKey: ['analytics', 'status'],
    queryFn: () => analyticsApi.getBookingsByStatus(),
  })

  const { data: topRoomsData } = useQuery({
    queryKey: ['analytics', 'topRooms'],
    queryFn: () => analyticsApi.getTopRooms(5),
  })

  const stats = dashData?.data?.data
  const revenue = revenueData?.data?.data || []
  const daily = dailyData?.data?.data || []
  const statusCounts = statusData?.data?.data || []
  const topRooms = topRoomsData?.data?.data || []

  const revenueChart = {
    labels: revenue.map(r => r.month),
    datasets: [{
      data: revenue.map(r => r.revenue),
      borderColor: '#6366f1',
      backgroundColor: (ctx) => {
        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200)
        gradient.addColorStop(0, 'rgba(99,102,241,0.25)')
        gradient.addColorStop(1, 'rgba(99,102,241,0)')
        return gradient
      },
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#1e293b',
      pointBorderWidth: 2,
    }],
  }

  const dailyChart = {
    labels: daily.map(d => format(new Date(d.date), 'MMM d')),
    datasets: [{
      data: daily.map(d => d.bookings),
      backgroundColor: (ctx) => {
        const i = ctx.dataIndex
        return i === daily.length - 1 ? '#6366f1' : 'rgba(99,102,241,0.35)'
      },
      borderRadius: 6,
      borderSkipped: false,
    }],
  }

  const donutData = {
    labels: statusCounts.map(s => STATUS_CONFIG[s.status]?.label || s.status),
    datasets: [{
      data: statusCounts.map(s => s.count),
      backgroundColor: statusCounts.map(s => STATUS_CONFIG[s.status]?.color || '#6366f1'),
      borderColor: '#0f172a',
      borderWidth: 3,
      hoverBorderWidth: 0,
    }],
  }

  return (
    <Box className="fade-in">
      {/* Welcome header */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ color: '#475569', fontSize: '0.85rem', mb: 0.5 }}>
          {format(now, 'EEEE, MMMM d yyyy')}
        </Typography>
        <Typography variant="h5" sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
          Good morning, {user?.firstName} 👋
        </Typography>
        <Typography sx={{ color: '#64748b', fontSize: '0.875rem', mt: 0.5 }}>
          Here's what's happening in <Typography component="span" sx={{ color: '#818cf8', fontWeight: 600 }}>{tenant?.name}</Typography> today.
        </Typography>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Total Members', value: stats?.totalUsers, icon: <People />, color: '#6366f1', trend: 12, trendLabel: 'vs last month', prefix: '' },
          { label: 'Total Bookings', value: stats?.totalBookings, icon: <EventNote />, color: '#10b981', trend: 8, trendLabel: 'vs last month' },
          { label: 'Monthly Revenue', value: stats?.monthlyRevenue, icon: <AttachMoney />, color: '#f59e0b', trend: stats?.revenueGrowth, trendLabel: 'vs last month', prefix: '$' },
          { label: 'Occupancy Rate', value: stats?.occupancyRate, icon: <Business />, color: '#3b82f6', trend: 5, trendLabel: 'this week', suffix: '%' },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} xl={3} key={i}>
            <StatCard {...s} loading={dashLoading} />
          </Grid>
        ))}
      </Grid>

      {/* Charts row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Revenue chart */}
        <Grid item xs={12} lg={7}>
          <Card elevation={0} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box>
                  <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                    Revenue Overview
                  </Typography>
                  <Typography sx={{ color: '#475569', fontSize: '0.78rem', mt: 0.3 }}>Last 6 months</Typography>
                </Box>
                <Chip label="Monthly" size="small" sx={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: '0.72rem', fontWeight: 600 }} />
              </Box>
              {revenueLoading ? (
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
              ) : (
                <Box sx={{ height: 200 }}>
                  <Line data={revenueChart} options={CHART_OPTIONS} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Booking status donut */}
        <Grid item xs={12} sm={6} lg={5}>
          <Card elevation={0} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '1rem', color: '#f1f5f9', mb: 2.5 }}>
                Booking Status
              </Typography>
              <Box sx={{ height: 160, display: 'flex', justifyContent: 'center' }}>
                {statusCounts.length > 0 ? (
                  <Doughnut data={donutData} options={{
                    ...CHART_OPTIONS,
                    plugins: {
                      ...CHART_OPTIONS.plugins,
                      legend: {
                        display: true, position: 'right',
                        labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 10, padding: 12, usePointStyle: true },
                      },
                    },
                    cutout: '70%',
                  }} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <Typography sx={{ color: '#475569', fontSize: '0.85rem' }}>No booking data yet</Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1.5 }}>
                {statusCounts.map(s => {
                  const cfg = STATUS_CONFIG[s.status]
                  return (
                    <Box key={s.status} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: cfg?.color }} />
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>{s.count} {cfg?.label}</Typography>
                    </Box>
                  )
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom row */}
      <Grid container spacing={2.5}>
        {/* Daily bookings bar */}
        <Grid item xs={12} lg={8}>
          <Card elevation={0}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box>
                  <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                    Daily Bookings
                  </Typography>
                  <Typography sx={{ color: '#475569', fontSize: '0.78rem', mt: 0.3 }}>Last 14 days</Typography>
                </Box>
              </Box>
              {dailyLoading ? (
                <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
              ) : (
                <Box sx={{ height: 180 }}>
                  <Bar data={dailyChart} options={{ ...CHART_OPTIONS, scales: { ...CHART_OPTIONS.scales, y: { ...CHART_OPTIONS.scales.y, ticks: { ...CHART_OPTIONS.scales.y.ticks, stepSize: 1 } } } }} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top rooms */}
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '1rem', color: '#f1f5f9', mb: 2 }}>
                Top Spaces
              </Typography>
              {topRooms.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography sx={{ color: '#475569', fontSize: '0.85rem' }}>No booking data yet</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {topRooms.map((room, i) => {
                    const max = topRooms[0]?.bookings || 1
                    const pct = Math.round((room.bookings / max) * 100)
                    return (
                      <Box key={room.roomId}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                            <Box sx={{
                              width: 26, height: 26, borderRadius: 1, flexShrink: 0,
                              background: i === 0 ? 'linear-gradient(135deg, #f59e0b20, #f59e0b10)' : 'rgba(255,255,255,0.04)',
                              border: i === 0 ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(255,255,255,0.06)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: i === 0 ? '#f59e0b' : '#475569' }}>
                                #{i + 1}
                              </Typography>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography noWrap sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>{room.name}</Typography>
                              <Box sx={{ mt: 0.5 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={pct}
                                  sx={{
                                    height: 4, borderRadius: 2,
                                    '& .MuiLinearProgress-bar': {
                                      background: i === 0 ? 'linear-gradient(90deg, #6366f1, #818cf8)' : '#334155',
                                      borderRadius: 2,
                                    },
                                  }}
                                />
                              </Box>
                            </Box>
                          </Box>
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', ml: 1.5, flexShrink: 0 }}>
                            {room.bookings}
                          </Typography>
                        </Box>
                        {i < topRooms.length - 1 && <Divider sx={{ opacity: 0.4 }} />}
                      </Box>
                    )
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
