import { useQuery } from '@tanstack/react-query'
import { Box, Card, CardContent, Typography, Grid, Chip, Skeleton, Select, MenuItem, FormControl } from '@mui/material'
import { useState } from 'react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { analyticsApi } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import { AttachMoney, EventNote, Business, People, TrendingUp } from '@mui/icons-material'
import { format } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler)

const BASE_TOOLTIP = {
  backgroundColor: '#1e293b',
  titleColor: '#f1f5f9',
  bodyColor: '#94a3b8',
  borderColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1,
  padding: 12,
  cornerRadius: 8,
}

const BASE_SCALES = {
  x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { size: 11 } } },
  y: { grid: { color: 'rgba(255,255,255,0.04)', borderDash: [4, 4] }, ticks: { color: '#475569', font: { size: 11 } } },
}

export default function AnalyticsPage() {
  const [revenueMonths, setRevenueMonths] = useState(6)
  const [bookingDays, setBookingDays] = useState(30)

  const { data: dashData, isLoading: dashLoading } = useQuery({ queryKey: ['analytics', 'dashboard'], queryFn: () => analyticsApi.getDashboard() })
  const { data: revenueData, isLoading: revenueLoading } = useQuery({ queryKey: ['analytics', 'revenue', revenueMonths], queryFn: () => analyticsApi.getRevenue(revenueMonths) })
  const { data: dailyData } = useQuery({ queryKey: ['analytics', 'daily', bookingDays], queryFn: () => analyticsApi.getDailyBookings(bookingDays) })
  const { data: statusData } = useQuery({ queryKey: ['analytics', 'status'], queryFn: () => analyticsApi.getBookingsByStatus() })
  const { data: topRoomsData } = useQuery({ queryKey: ['analytics', 'topRooms', 10], queryFn: () => analyticsApi.getTopRooms(10) })

  const stats = dashData?.data?.data
  const revenue = revenueData?.data?.data || []
  const daily = dailyData?.data?.data || []
  const statusCounts = statusData?.data?.data || []
  const topRooms = topRoomsData?.data?.data || []

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6']

  const revenueChart = {
    labels: revenue.map(r => r.month),
    datasets: [{
      label: 'Revenue ($)',
      data: revenue.map(r => r.revenue),
      borderColor: '#6366f1', borderWidth: 2.5,
      backgroundColor: (ctx) => {
        const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 280)
        g.addColorStop(0, 'rgba(99,102,241,0.3)')
        g.addColorStop(1, 'rgba(99,102,241,0)')
        return g
      },
      fill: true, tension: 0.4,
      pointRadius: 5, pointBackgroundColor: '#6366f1', pointBorderColor: '#1e293b', pointBorderWidth: 2,
      pointHoverRadius: 7,
    }],
  }

  const dailyChart = {
    labels: daily.map(d => format(new Date(d.date), 'MMM d')),
    datasets: [{
      label: 'Bookings',
      data: daily.map(d => d.bookings),
      backgroundColor: daily.map((_, i) => i === daily.length - 1 ? '#6366f1' : 'rgba(99,102,241,0.4)'),
      borderRadius: 6, borderSkipped: false,
    }],
  }

  const donutData = {
    labels: statusCounts.map(s => s.status),
    datasets: [{
      data: statusCounts.map(s => s.count),
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#64748b'],
      borderColor: '#0f172a', borderWidth: 3, hoverBorderWidth: 0,
    }],
  }

  const topRoomsChart = {
    labels: topRooms.map(r => r.name),
    datasets: [
      {
        label: 'Bookings',
        data: topRooms.map(r => r.bookings),
        backgroundColor: 'rgba(99,102,241,0.7)',
        borderRadius: 6, borderSkipped: false,
      },
      {
        label: 'Revenue ($)',
        data: topRooms.map(r => r.revenue),
        backgroundColor: 'rgba(16,185,129,0.7)',
        borderRadius: 6, borderSkipped: false,
      },
    ],
  }

  return (
    <Box className="fade-in">
      <PageHeader
        title="Analytics"
        subtitle="Performance insights across your entire workspace"
        breadcrumbs={['Home', 'Analytics']}
      />

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Total Members', value: stats?.totalUsers, icon: <People />, color: '#6366f1', trend: 12 },
          { label: 'Total Bookings', value: stats?.totalBookings, icon: <EventNote />, color: '#10b981', trend: 8 },
          { label: 'Monthly Revenue', value: stats?.monthlyRevenue, icon: <AttachMoney />, color: '#f59e0b', trend: stats?.revenueGrowth, prefix: '$' },
          { label: 'Occupancy Rate', value: stats?.occupancyRate, icon: <Business />, color: '#3b82f6', trend: 5, suffix: '%' },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} xl={3} key={i}>
            <StatCard {...s} loading={dashLoading} />
          </Grid>
        ))}
      </Grid>

      {/* Revenue + Status row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box>
                  <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>Revenue Trend</Typography>
                  <Typography sx={{ color: '#475569', fontSize: '0.78rem' }}>Monthly recurring revenue</Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select value={revenueMonths} onChange={e => setRevenueMonths(e.target.value)}
                    sx={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)' }}>
                    <MenuItem value={3}>3 months</MenuItem>
                    <MenuItem value={6}>6 months</MenuItem>
                    <MenuItem value={12}>12 months</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              {revenueLoading ? (
                <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
              ) : (
                <Box sx={{ height: 250 }}>
                  <Line data={revenueChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: BASE_TOOLTIP }, scales: BASE_SCALES }} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Card elevation={0} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '1rem', color: '#f1f5f9', mb: 2.5 }}>
                Booking Distribution
              </Typography>
              <Box sx={{ height: 180, display: 'flex', justifyContent: 'center' }}>
                {statusCounts.length > 0 ? (
                  <Doughnut data={donutData} options={{
                    responsive: true, maintainAspectRatio: false,
                    cutout: '68%',
                    plugins: {
                      legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 10, padding: 12 } },
                      tooltip: BASE_TOOLTIP,
                    },
                  }} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ color: '#475569' }}>No data</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Daily bookings + Top rooms */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={6}>
          <Card elevation={0}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box>
                  <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>Daily Booking Volume</Typography>
                  <Typography sx={{ color: '#475569', fontSize: '0.78rem' }}>Bookings per day</Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 110 }}>
                  <Select value={bookingDays} onChange={e => setBookingDays(e.target.value)}
                    sx={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)' }}>
                    <MenuItem value={7}>7 days</MenuItem>
                    <MenuItem value={14}>14 days</MenuItem>
                    <MenuItem value={30}>30 days</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ height: 220 }}>
                <Bar data={dailyChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: BASE_TOOLTIP }, scales: BASE_SCALES }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card elevation={0}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '1rem', color: '#f1f5f9', mb: 2.5 }}>
                Top Performing Spaces
              </Typography>
              <Box sx={{ height: 220 }}>
                {topRooms.length > 0 ? (
                  <Bar
                    data={topRoomsChart}
                    options={{
                      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                      plugins: {
                        legend: { display: true, position: 'top', labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12, padding: 12 } },
                        tooltip: BASE_TOOLTIP,
                      },
                      scales: {
                        x: BASE_SCALES.x,
                        y: { ...BASE_SCALES.y, ticks: { color: '#64748b', font: { size: 10 } } },
                      },
                    }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography sx={{ color: '#475569' }}>No booking data yet</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
