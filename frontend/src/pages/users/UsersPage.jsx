import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Typography, Button, Avatar, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
  TextField, InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, Skeleton, TablePagination, Tooltip, Select, MenuItem,
  FormControl, InputLabel, Grid,
} from '@mui/material'
import {
  Add, Search, People, Edit, Block, CheckCircle, Person,
  AdminPanelSettings, Badge, MoreVert,
} from '@mui/icons-material'
import { userApi, tenantApi } from '../../services/api'
import { useSelector } from 'react-redux'
import { selectUser } from '../../redux/slices/authSlice'
import { useSnackbar } from 'notistack'
import PageHeader from '../../components/common/PageHeader'
import { format, parseISO } from 'date-fns'
import { useForm, Controller } from 'react-hook-form'

const ROLE_CONFIG = {
  TENANT_OWNER: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Owner', icon: <AdminPanelSettings sx={{ fontSize: 12 }} /> },
  MANAGER: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', label: 'Manager', icon: <Badge sx={{ fontSize: 12 }} /> },
  EMPLOYEE: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Employee', icon: <Person sx={{ fontSize: 12 }} /> },
}

function RoleChip({ role }) {
  const cfg = ROLE_CONFIG[role] || { color: '#64748b', bg: 'rgba(100,116,139,0.1)', label: role }
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, background: cfg.bg, border: `1px solid ${cfg.color}25`, borderRadius: 1.5, px: 1, py: 0.3 }}>
      <Box sx={{ color: cfg.color }}>{cfg.icon}</Box>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.color }}>{cfg.label}</Typography>
    </Box>
  )
}

export default function UsersPage() {
  const qc = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const currentUser = useSelector(selectUser)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, rowsPerPage, search],
    queryFn: () => userApi.list({ page: page + 1, limit: rowsPerPage, search: search || undefined }),
  })

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => tenantApi.getRoles(),
    enabled: createOpen,
  })

  const users = data?.data?.data || []
  const total = data?.data?.pagination?.total || 0
  const roles = rolesData?.data?.data || []

  const createMutation = useMutation({
    mutationFn: (d) => userApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries(['users'])
      enqueueSnackbar('User invited!', { variant: 'success' })
      setCreateOpen(false)
      reset()
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || 'Failed', { variant: 'error' }),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id) => userApi.deactivate(id),
    onSuccess: () => { qc.invalidateQueries(['users']); enqueueSnackbar('User deactivated', { variant: 'success' }) },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || 'Failed', { variant: 'error' }),
  })

  const canManage = currentUser?.roles?.some(r => ['TENANT_OWNER', 'MANAGER'].includes(r))

  return (
    <Box className="fade-in">
      <PageHeader
        title="People"
        subtitle={`${total} member${total !== 1 ? 's' : ''} in your workspace`}
        breadcrumbs={['Home', 'People']}
        actions={
          canManage && (
            <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
              Invite Member
            </Button>
          )
        }
      />

      {/* Filter */}
      <Card elevation={0} sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <TextField
            size="small" placeholder="Search by name or email…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
            sx={{ minWidth: 280 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#475569' }} /></InputAdornment> }}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card elevation={0}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Member', 'Role', 'Status', 'Last Active', 'Joined', ...(canManage ? ['Actions'] : [])].map(h => (
                  <TableCell key={h} align={h === 'Actions' ? 'right' : 'left'}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: canManage ? 6 : 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton height={36} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 6 : 5} align="center" sx={{ py: 6 }}>
                    <People sx={{ fontSize: 48, color: '#1e293b', mb: 1 }} />
                    <Typography sx={{ color: '#475569' }}>No members found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map(u => {
                  const userRole = u.userRoles?.[0]?.role?.name
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', fontSize: '0.8rem', fontWeight: 700 }}>
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                              {u.firstName} {u.lastName}
                              {u.id === currentUser?.id && (
                                <Chip label="You" size="small" sx={{ ml: 1, height: 16, fontSize: '0.65rem', background: 'rgba(99,102,241,0.15)', color: '#818cf8' }} />
                              )}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {userRole ? <RoleChip role={userRole} /> : <Typography sx={{ color: '#475569', fontSize: '0.8rem' }}>—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: u.isActive ? '#10b981' : '#ef4444' }} />
                          <Typography sx={{ fontSize: '0.78rem', color: u.isActive ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </Typography>
                          {!u.isEmailVerified && (
                            <Chip label="Unverified" size="small" sx={{ height: 18, fontSize: '0.65rem', background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {u.lastLoginAt ? format(parseISO(u.lastLoginAt), 'MMM d, yyyy') : 'Never'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {format(parseISO(u.createdAt), 'MMM d, yyyy')}
                        </Typography>
                      </TableCell>
                      {canManage && (
                        <TableCell align="right">
                          {u.id !== currentUser?.id && (
                            <Tooltip title={u.isActive ? 'Deactivate user' : 'Already inactive'}>
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={!u.isActive}
                                  onClick={() => deactivateMutation.mutate(u.id)}
                                  sx={{ color: '#ef4444', '&:hover': { background: 'rgba(239,68,68,0.1)' } }}
                                >
                                  <Block sx={{ fontSize: 16 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={total} page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0) }}
          rowsPerPageOptions={[10, 20, 50]}
          sx={{ borderTop: '1px solid rgba(255,255,255,0.04)', color: '#64748b' }}
        />
      </Card>

      {/* Invite Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700 }}>Invite Member</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="First name" {...register('firstName', { required: 'Required' })} error={!!errors.firstName} helperText={errors.firstName?.message} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Last name" {...register('lastName', { required: 'Required' })} error={!!errors.lastName} helperText={errors.lastName?.message} />
              </Grid>
            </Grid>
            <TextField fullWidth size="small" label="Email address" type="email" {...register('email', { required: 'Required' })} error={!!errors.email} helperText={errors.email?.message} />
            <TextField fullWidth size="small" label="Temporary password" type="password" {...register('password')} placeholder="Leave blank to auto-generate" />
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Controller
                name="roleId"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Role">
                    {roles.map(r => (
                      <MenuItem key={r.id} value={r.id}>{r.name.replace('_', ' ')}</MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setCreateOpen(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" onClick={handleSubmit(d => createMutation.mutate(d))} disabled={createMutation.isLoading}>
            {createMutation.isLoading ? 'Inviting…' : 'Send Invite'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
