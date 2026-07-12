import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Typography, Button, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip,
  TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Skeleton,
  TablePagination, Grid,
} from '@mui/material'
import {
  Add, Search, CheckCircle, Cancel, Schedule, HourglassEmpty,
  Visibility, ThumbUp, Close, FilterList, EventNote,
} from '@mui/icons-material'
import { bookingApi, buildingApi } from '../../services/api'
import { useSelector } from 'react-redux'
import { selectUser } from '../../redux/slices/authSlice'
import { useSnackbar } from 'notistack'
import PageHeader from '../../components/common/PageHeader'
import { format, parseISO } from 'date-fns'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const STATUS_CONFIG = {
  PENDING: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', icon: <HourglassEmpty sx={{ fontSize: 12 }} />, label: 'Pending' },
  CONFIRMED: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', icon: <CheckCircle sx={{ fontSize: 12 }} />, label: 'Confirmed' },
  CANCELLED: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', icon: <Cancel sx={{ fontSize: 12 }} />, label: 'Cancelled' },
  COMPLETED: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', icon: <CheckCircle sx={{ fontSize: 12 }} />, label: 'Completed' },
  NO_SHOW: { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)', icon: <Cancel sx={{ fontSize: 12 }} />, label: 'No Show' },
}

const bookingSchema = z.object({
  roomId: z.string().min(1, 'Select a room'),
  startTime: z.string().min(1, 'Start time required'),
  endTime: z.string().min(1, 'End time required'),
  title: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
})

function StatusChip({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.5,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 1.5, px: 1, py: 0.35,
    }}>
      <Box sx={{ color: cfg.color, display: 'flex' }}>{cfg.icon}</Box>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.color }}>{cfg.label}</Typography>
    </Box>
  )
}

function BookingRow({ booking, onApprove, onCancel, onView, user }) {
  const canApprove = ['TENANT_OWNER', 'MANAGER'].some(r => user?.roles?.includes(r))
  return (
    <TableRow>
      <TableCell>
        <Box>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>
            #{booking.id.slice(0, 8).toUpperCase()}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.3 }}>
            {booking.title || 'No title'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', fontSize: '0.75rem', fontWeight: 700 }}>
            {booking.user?.firstName?.[0]}{booking.user?.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: '#e2e8f0' }}>
              {booking.user?.firstName} {booking.user?.lastName}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>{booking.user?.email}</Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Typography sx={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 500 }}>{booking.room?.name}</Typography>
        <Chip label={booking.room?.type?.replace('_', ' ')} size="small" sx={{ mt: 0.4, height: 18, fontSize: '0.65rem', background: 'rgba(255,255,255,0.04)' }} />
      </TableCell>
      <TableCell>
        <Typography sx={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
          {format(parseISO(booking.startTime), 'MMM d, HH:mm')}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
          → {format(parseISO(booking.endTime), 'HH:mm')}
        </Typography>
      </TableCell>
      <TableCell>
        <StatusChip status={booking.status} />
      </TableCell>
      <TableCell>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
          ${parseFloat(booking.totalPrice).toFixed(2)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          <Tooltip title="View details">
            <IconButton size="small" onClick={() => onView(booking)} sx={{ color: '#6366f1', '&:hover': { background: 'rgba(99,102,241,0.1)' } }}>
              <Visibility sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          {canApprove && booking.status === 'PENDING' && (
            <Tooltip title="Approve">
              <IconButton size="small" onClick={() => onApprove(booking.id)} sx={{ color: '#10b981', '&:hover': { background: 'rgba(16,185,129,0.1)' } }}>
                <ThumbUp sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          {['PENDING', 'CONFIRMED'].includes(booking.status) && (
            <Tooltip title="Cancel">
              <IconButton size="small" onClick={() => onCancel(booking.id)} sx={{ color: '#ef4444', '&:hover': { background: 'rgba(239,68,68,0.1)' } }}>
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>
  )
}

export default function BookingsPage() {
  const qc = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const user = useSelector(selectUser)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewBooking, setViewBooking] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page, rowsPerPage, statusFilter],
    queryFn: () => bookingApi.list({ page: page + 1, limit: rowsPerPage, status: statusFilter || undefined }),
  })

  const { data: buildingsData } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => buildingApi.list({ limit: 100 }),
    enabled: createOpen,
  })

  const bookings = data?.data?.data || []
  const total = data?.data?.pagination?.total || 0

  const approveMutation = useMutation({
    mutationFn: (id) => bookingApi.approve(id),
    onSuccess: () => { qc.invalidateQueries(['bookings']); enqueueSnackbar('Booking approved', { variant: 'success' }) },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || 'Failed', { variant: 'error' }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => bookingApi.cancel(id, 'Cancelled by user'),
    onSuccess: () => { qc.invalidateQueries(['bookings']); enqueueSnackbar('Booking cancelled', { variant: 'success' }) },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || 'Failed', { variant: 'error' }),
  })

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(bookingSchema) })

  const createMutation = useMutation({
    mutationFn: (data) => bookingApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['bookings'])
      enqueueSnackbar('Booking created!', { variant: 'success' })
      setCreateOpen(false)
      reset()
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || 'Failed', { variant: 'error' }),
  })

  // Get all rooms from buildings
  const allRooms = buildingsData?.data?.data?.flatMap(b =>
    b.floors?.flatMap(f => f.rooms?.map(r => ({ ...r, buildingName: b.name, floorName: f.name })) || []) || []
  ) || []

  return (
    <Box className="fade-in">
      <PageHeader
        title="Bookings"
        subtitle="Manage workspace reservations across your organization"
        breadcrumbs={['Home', 'Bookings']}
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
            New Booking
          </Button>
        }
      />

      {/* Filters */}
      <Card elevation={0} sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small" placeholder="Search bookings…"
              value={search} onChange={e => setSearch(e.target.value)}
              sx={{ minWidth: 220 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#475569' }} /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} label="Status">
                <MenuItem value="">All statuses</MenuItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ flex: 1 }} />
            <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>
              {total} booking{total !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card elevation={0}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Booking ID', 'Member', 'Space', 'Time', 'Status', 'Price', 'Actions'].map(h => (
                  <TableCell key={h} align={h === 'Actions' ? 'right' : 'left'}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton height={36} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <EventNote sx={{ fontSize: 48, color: '#1e293b', mb: 1 }} />
                    <Typography sx={{ color: '#475569' }}>No bookings found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map(booking => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    user={user}
                    onApprove={(id) => approveMutation.mutate(id)}
                    onCancel={(id) => cancelMutation.mutate(id)}
                    onView={setViewBooking}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0) }}
          rowsPerPageOptions={[10, 20, 50]}
          sx={{ borderTop: '1px solid rgba(255,255,255,0.04)', color: '#64748b' }}
        />
      </Card>

      {/* Create Booking Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '1.1rem' }}>
            New Booking
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Room / Space</InputLabel>
              <Controller
                name="roomId"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Room / Space" error={!!errors.roomId}>
                    {allRooms.map(r => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.buildingName} — {r.floorName} — {r.name}
                        <Typography component="span" sx={{ fontSize: '0.72rem', color: '#64748b', ml: 1 }}>
                          (${r.pricePerHour}/hr)
                        </Typography>
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
            <TextField fullWidth size="small" label="Title (optional)" {...register('title')} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Start time" type="datetime-local" {...register('startTime')} InputLabelProps={{ shrink: true }} error={!!errors.startTime} helperText={errors.startTime?.message} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="End time" type="datetime-local" {...register('endTime')} InputLabelProps={{ shrink: true }} error={!!errors.endTime} helperText={errors.endTime?.message} />
              </Grid>
            </Grid>
            <TextField fullWidth size="small" label="Notes (optional)" multiline rows={3} {...register('notes')} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setCreateOpen(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit((d) => {
  createMutation.mutate({
    ...d,
    startTime: new Date(d.startTime).toISOString(),
    endTime: new Date(d.endTime).toISOString(),
  });
})}
            disabled={createMutation.isLoading}
          >
            {createMutation.isLoading ? 'Creating…' : 'Create Booking'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Booking Dialog */}
      {viewBooking && (
        <Dialog open={!!viewBooking} onClose={() => setViewBooking(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700 }}>
              Booking Details
            </Typography>
            <IconButton size="small" onClick={() => setViewBooking(null)} sx={{ color: '#64748b' }}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>Reference</Typography>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#818cf8', fontWeight: 600 }}>
                  #{viewBooking.id.slice(0, 8).toUpperCase()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>Status</Typography>
                <StatusChip status={viewBooking.status} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>Member</Typography>
                <Typography sx={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 500 }}>
                  {viewBooking.user?.firstName} {viewBooking.user?.lastName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>Room</Typography>
                <Typography sx={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 500 }}>{viewBooking.room?.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>Start</Typography>
                <Typography sx={{ color: '#e2e8f0', fontSize: '0.82rem' }}>{format(parseISO(viewBooking.startTime), 'PPp')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>End</Typography>
                <Typography sx={{ color: '#e2e8f0', fontSize: '0.82rem' }}>{format(parseISO(viewBooking.endTime), 'PPp')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>Total</Typography>
                <Typography sx={{ color: '#10b981', fontSize: '0.95rem', fontWeight: 700 }}>
                  ${parseFloat(viewBooking.totalPrice).toFixed(2)}
                </Typography>
              </Box>
              {viewBooking.notes && (
                <Box sx={{ background: 'rgba(255,255,255,0.03)', borderRadius: 2, p: 1.5 }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.72rem', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</Typography>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.82rem' }}>{viewBooking.notes}</Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  )
}
