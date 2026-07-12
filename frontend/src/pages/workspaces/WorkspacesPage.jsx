import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, Skeleton, Collapse, Tooltip, Divider,
} from '@mui/material'
import {
  Add, Business, ExpandMore, ExpandLess, MeetingRoom, DeskRounded,
  Edit, Archive, LocationOn, People, AttachMoney, Layers,
} from '@mui/icons-material'
import { buildingApi } from '../../services/api'
import { useSnackbar } from 'notistack'
import PageHeader from '../../components/common/PageHeader'
import { useForm } from 'react-hook-form'

const ROOM_TYPE_CONFIG = {
  HOT_DESK: { color: '#10b981', label: 'Hot Desk' },
  PRIVATE_CABIN: { color: '#6366f1', label: 'Private Cabin' },
  MEETING_ROOM: { color: '#f59e0b', label: 'Meeting Room' },
  CONFERENCE_ROOM: { color: '#3b82f6', label: 'Conference Room' },
  EVENT_SPACE: { color: '#ec4899', label: 'Event Space' },
}

function RoomCard({ room }) {
  const cfg = ROOM_TYPE_CONFIG[room.type] || ROOM_TYPE_CONFIG.HOT_DESK
  return (
    <Box sx={{
      p: 2, borderRadius: 2,
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.06)',
      transition: 'all 0.15s',
      '&:hover': { border: `1px solid ${cfg.color}30`, background: `${cfg.color}05` },
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0' }}>{room.name}</Typography>
          <Chip
            label={cfg.label} size="small"
            sx={{ mt: 0.5, height: 20, fontSize: '0.68rem', fontWeight: 700, background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}25` }}
          />
        </Box>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: room.isActive ? '#10b981' : '#ef4444', mt: 0.5 }} />
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <People sx={{ fontSize: 14, color: '#64748b' }} />
          <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{room.capacity}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AttachMoney sx={{ fontSize: 14, color: '#64748b' }} />
          <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>${room.pricePerHour}/hr</Typography>
        </Box>
        {room.desks && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <DeskRounded sx={{ fontSize: 14, color: '#64748b' }} />
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{room.desks.length} desks</Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

function FloorCard({ floor, buildingId }) {
  const [open, setOpen] = useState(true)
  return (
    <Box sx={{ mb: 2 }}>
      <Box
        onClick={() => setOpen(!open)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
          p: 1.5, borderRadius: 2,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          '&:hover': { background: 'rgba(255,255,255,0.05)' },
        }}
      >
        <Box sx={{ width: 30, height: 30, borderRadius: 1.5, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Layers sx={{ fontSize: 16, color: '#6366f1' }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>{floor.name}</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>Floor {floor.floorNumber} · {floor.rooms?.length || 0} rooms</Typography>
        </Box>
        {open ? <ExpandLess sx={{ color: '#475569' }} /> : <ExpandMore sx={{ color: '#475569' }} />}
      </Box>

      <Collapse in={open}>
        <Box sx={{ pt: 1.5, pl: 2 }}>
          {floor.rooms?.length > 0 ? (
            <Grid container spacing={1.5}>
              {floor.rooms.map(room => (
                <Grid item xs={12} sm={6} xl={4} key={room.id}>
                  <RoomCard room={room} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography sx={{ color: '#475569', fontSize: '0.82rem', py: 2, pl: 1 }}>No rooms on this floor yet.</Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  )
}

function BuildingCard({ building, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  const totalRooms = building.floors?.reduce((a, f) => a + (f.rooms?.length || 0), 0) || 0

  return (
    <Card elevation={0} sx={{ mb: 2.5 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: 2.5, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.1))',
              border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Business sx={{ color: '#6366f1', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '1.05rem', color: '#f1f5f9' }}>
                {building.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
                <LocationOn sx={{ fontSize: 14, color: '#6366f1' }} />
                <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {building.city}, {building.country}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={building.isActive ? 'Active' : 'Inactive'}
              size="small"
              sx={{
                background: building.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: building.isActive ? '#10b981' : '#ef4444',
                fontSize: '0.72rem', fontWeight: 700,
                border: `1px solid ${building.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}
            />
            <Tooltip title="Edit building">
              <IconButton size="small" onClick={() => onEdit(building)} sx={{ color: '#475569' }}>
                <Edit sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Stats row */}
        <Box sx={{ display: 'flex', gap: 3, mb: 2, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {[
            { label: 'Floors', value: building.floors?.length || 0, icon: <Layers sx={{ fontSize: 14 }} /> },
            { label: 'Rooms', value: totalRooms, icon: <MeetingRoom sx={{ fontSize: 14 }} /> },
          ].map(s => (
            <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ color: '#6366f1' }}>{s.icon}</Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* Expand floors */}
        <Button
          size="small" variant="text"
          onClick={() => setExpanded(!expanded)}
          endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
          sx={{ color: '#6366f1', fontSize: '0.8rem', p: 0, '&:hover': { background: 'transparent' } }}
        >
          {expanded ? 'Hide' : 'View'} floors & rooms
        </Button>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            {building.floors?.length > 0 ? (
              building.floors.map(floor => <FloorCard key={floor.id} floor={floor} buildingId={building.id} />)
            ) : (
              <Typography sx={{ color: '#475569', fontSize: '0.85rem', py: 2 }}>No floors added yet.</Typography>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default function WorkspacesPage() {
  const qc = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const [createBuildingOpen, setCreateBuildingOpen] = useState(false)
  const [editBuilding, setEditBuilding] = useState(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => buildingApi.list({ limit: 50 }),
  })

  const buildings = data?.data?.data || []

  const createMutation = useMutation({
    mutationFn: (data) => buildingApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['buildings'])
      enqueueSnackbar('Building created!', { variant: 'success' })
      setCreateBuildingOpen(false)
      reset()
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || 'Failed', { variant: 'error' }),
  })

  return (
    <Box className="fade-in">
      <PageHeader
        title="Workspaces"
        subtitle={`${buildings.length} building${buildings.length !== 1 ? 's' : ''} across your organization`}
        breadcrumbs={['Home', 'Workspaces']}
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateBuildingOpen(true)}>
            Add Building
          </Button>
        }
      />

      {isLoading ? (
        Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} elevation={0} sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Skeleton height={60} />
              <Skeleton height={30} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        ))
      ) : buildings.length === 0 ? (
        <Card elevation={0}>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <Business sx={{ fontSize: 64, color: '#1e293b', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#475569', mb: 1 }}>No buildings yet</Typography>
            <Typography sx={{ color: '#334155', fontSize: '0.875rem', mb: 3 }}>
              Add your first building to start managing workspaces.
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setCreateBuildingOpen(true)}>
              Add your first building
            </Button>
          </CardContent>
        </Card>
      ) : (
        buildings.map(b => <BuildingCard key={b.id} building={b} onEdit={setEditBuilding} />)
      )}

      {/* Create Building Dialog */}
      <Dialog open={createBuildingOpen} onClose={() => setCreateBuildingOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700 }}>Add Building</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField fullWidth size="small" label="Building name" {...register('name', { required: 'Required' })} error={!!errors.name} helperText={errors.name?.message} />
            <TextField fullWidth size="small" label="Address" {...register('address', { required: 'Required' })} error={!!errors.address} helperText={errors.address?.message} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="City" {...register('city', { required: 'Required' })} error={!!errors.city} helperText={errors.city?.message} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Country" {...register('country', { required: 'Required' })} error={!!errors.country} helperText={errors.country?.message} />
              </Grid>
            </Grid>
            <TextField fullWidth size="small" type="number" label="Total floors" defaultValue={1} {...register('totalFloors', { valueAsNumber: true })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setCreateBuildingOpen(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" onClick={handleSubmit(d => createMutation.mutate(d))} disabled={createMutation.isLoading}>
            {createMutation.isLoading ? 'Creating…' : 'Create Building'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
