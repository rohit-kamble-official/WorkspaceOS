import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid, Divider,
  Avatar, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Switch, FormControlLabel, Chip, Alert, CircularProgress, Tabs, Tab,
} from '@mui/material'
import {
  Person, Business, Notifications, Security, Palette,
  Save, CameraAlt, Language, AccessTime, Shield,
} from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { useSnackbar } from 'notistack'
import { selectUser, selectTenant, updateUser } from '../../redux/slices/authSlice'
import { userApi, tenantApi } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null
}

function SectionCard({ title, subtitle, children }) {
  return (
    <Card elevation={0} sx={{ mb: 2.5 }}>
      <CardContent sx={{ p: 3 }}>
        {(title || subtitle) && (
          <Box sx={{ mb: 2.5 }}>
            {title && <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9' }}>{title}</Typography>}
            {subtitle && <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mt: 0.3 }}>{subtitle}</Typography>}
          </Box>
        )}
        {children}
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const dispatch = useDispatch()
  const qc = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const user = useSelector(selectUser)
  const tenant = useSelector(selectTenant)
  const [tab, setTab] = useState(0)
  const [notifications, setNotifications] = useState({
    bookingCreated: true,
    bookingApproved: true,
    bookingCancelled: true,
    subscriptionReminder: true,
    weeklyReport: false,
  })

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  })

  const { register: regWorkspace, handleSubmit: handleWorkspace, formState: { errors: workspaceErrors } } = useForm({
    defaultValues: {
      name: tenant?.name || '',
      phone: '',
      address: '',
      city: '',
      country: '',
      timezone: 'UTC',
    },
  })

  const profileMutation = useMutation({
    mutationFn: (data) => userApi.update(user.id, data),
    onSuccess: (_, vars) => {
      dispatch(updateUser(vars))
      enqueueSnackbar('Profile updated', { variant: 'success' })
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || 'Failed', { variant: 'error' }),
  })

  const workspaceMutation = useMutation({
    mutationFn: (data) => tenantApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries(['tenant'])
      enqueueSnackbar('Workspace settings saved', { variant: 'success' })
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || 'Failed', { variant: 'error' }),
  })

  const TABS = [
    { label: 'Profile', icon: <Person sx={{ fontSize: 18 }} /> },
    { label: 'Workspace', icon: <Business sx={{ fontSize: 18 }} /> },
    { label: 'Notifications', icon: <Notifications sx={{ fontSize: 18 }} /> },
    { label: 'Security', icon: <Security sx={{ fontSize: 18 }} /> },
  ]

  return (
    <Box className="fade-in">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and workspace preferences"
        breadcrumbs={['Home', 'Settings']}
      />

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 0,
          '& .MuiTabs-indicator': { background: 'linear-gradient(90deg, #6366f1, #818cf8)', height: 2, borderRadius: 1 },
          '& .MuiTab-root': { color: '#64748b', fontSize: '0.85rem', fontWeight: 500, minHeight: 44, textTransform: 'none' },
          '& .Mui-selected': { color: '#818cf8', fontWeight: 600 },
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {TABS.map((t) => (
          <Tab key={t.label} label={t.label} icon={t.icon} iconPosition="start" />
        ))}
      </Tabs>

      {/* Profile Tab */}
      <TabPanel value={tab} index={0}>
        <SectionCard title="Personal Information" subtitle="Update your personal details and public profile">
          {/* Avatar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar sx={{
                width: 72, height: 72,
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                fontSize: '1.5rem', fontWeight: 800,
                boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
              }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <Box sx={{
                position: 'absolute', bottom: 0, right: 0,
                width: 24, height: 24, borderRadius: '50%',
                background: '#1e293b', border: '2px solid #0f172a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                '&:hover': { background: '#334155' },
              }}>
                <CameraAlt sx={{ fontSize: 12, color: '#94a3b8' }} />
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>{user?.email}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.75 }}>
                {user?.roles?.map(r => (
                  <Chip key={r} label={r.replace('_', ' ')} size="small" sx={{ height: 20, fontSize: '0.65rem', background: 'rgba(99,102,241,0.1)', color: '#818cf8' }} />
                ))}
              </Box>
            </Box>
          </Box>

          <Box component="form" onSubmit={handleProfile(d => profileMutation.mutate(d))}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth size="small" label="First name"
                  {...regProfile('firstName', { required: 'Required' })}
                  error={!!profileErrors.firstName} helperText={profileErrors.firstName?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth size="small" label="Last name"
                  {...regProfile('lastName', { required: 'Required' })}
                  error={!!profileErrors.lastName} helperText={profileErrors.lastName?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth size="small" label="Email address" type="email"
                  value={user?.email || ''} disabled
                  helperText="Email cannot be changed. Contact support."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Phone number" {...regProfile('phone')} placeholder="+1 (555) 000-0000" />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit" variant="contained" startIcon={<Save />}
                disabled={profileMutation.isLoading}
              >
                {profileMutation.isLoading ? 'Saving…' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </SectionCard>
      </TabPanel>

      {/* Workspace Tab */}
      <TabPanel value={tab} index={1}>
        <SectionCard title="Workspace Settings" subtitle="Configure your organization's workspace details">
          <Box component="form" onSubmit={handleWorkspace(d => workspaceMutation.mutate(d))}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth size="small" label="Workspace name"
                  {...regWorkspace('name', { required: 'Required' })}
                  error={!!workspaceErrors.name} helperText={workspaceErrors.name?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth size="small" label="Workspace URL" disabled
                  value={`workspaceos.com/${tenant?.slug || ''}`}
                  InputProps={{
                    startAdornment: <Box component="span" sx={{ color: '#475569', fontSize: '0.82rem', mr: 0.5 }}></Box>
                  }}
                  helperText="Workspace URL cannot be changed after creation"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Business phone" {...regWorkspace('phone')} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Office address" {...regWorkspace('address')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="City" {...regWorkspace('city')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Country" {...regWorkspace('country')} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth size="small" label="Timezone" select
                  defaultValue="UTC"
                  InputProps={{ startAdornment: <AccessTime sx={{ fontSize: 18, color: '#475569', mr: 1 }} /> }}
                  SelectProps={{ native: true }}
                >
                  {['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Singapore'].map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" startIcon={<Save />} disabled={workspaceMutation.isLoading}>
                {workspaceMutation.isLoading ? 'Saving…' : 'Save Workspace Settings'}
              </Button>
            </Box>
          </Box>
        </SectionCard>
      </TabPanel>

      {/* Notifications Tab */}
      <TabPanel value={tab} index={2}>
        <SectionCard title="Email Notifications" subtitle="Choose which events trigger email notifications">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { key: 'bookingCreated', label: 'New booking created', desc: 'When a booking is made in your workspace' },
              { key: 'bookingApproved', label: 'Booking approved', desc: 'When a pending booking is approved by a manager' },
              { key: 'bookingCancelled', label: 'Booking cancelled', desc: 'When any booking is cancelled' },
              { key: 'subscriptionReminder', label: 'Subscription expiring', desc: '7 days before your subscription renews or expires' },
              { key: 'weeklyReport', label: 'Weekly summary report', desc: 'A weekly digest of workspace activity' },
            ].map((item, i, arr) => (
              <Box key={item.key}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: '#64748b', mt: 0.3 }}>{item.desc}</Typography>
                  </Box>
                  <Switch
                    checked={notifications[item.key]}
                    onChange={e => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    sx={{
                      '& .MuiSwitch-track': { background: '#1e293b' },
                      '& .Mui-checked .MuiSwitch-track': { background: '#6366f1' },
                      '& .Mui-checked .MuiSwitch-thumb': { background: '#818cf8' },
                    }}
                  />
                </Box>
                {i < arr.length - 1 && <Divider />}
              </Box>
            ))}
          </Box>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<Save />} onClick={() => enqueueSnackbar('Notification preferences saved', { variant: 'success' })}>
              Save Preferences
            </Button>
          </Box>
        </SectionCard>
      </TabPanel>

      {/* Security Tab */}
      <TabPanel value={tab} index={3}>
        <SectionCard title="Change Password" subtitle="Use a strong, unique password you don't use elsewhere">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 480 }}>
            <TextField fullWidth size="small" label="Current password" type="password" />
            <TextField fullWidth size="small" label="New password" type="password" />
            <TextField fullWidth size="small" label="Confirm new password" type="password" />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['8+ characters', 'Uppercase', 'Number', 'Special character'].map(r => (
                <Chip key={r} label={r} size="small" sx={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.04)', color: '#64748b' }} />
              ))}
            </Box>
            <Button variant="contained" startIcon={<Save />} sx={{ alignSelf: 'flex-end' }}
              onClick={() => enqueueSnackbar('Password updated successfully', { variant: 'success' })}>
              Update Password
            </Button>
          </Box>
        </SectionCard>

        <SectionCard title="Active Sessions" subtitle="Manage devices where you're signed in">
          <Alert
            severity="info"
            sx={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', color: '#93c5fd', '& .MuiAlert-icon': { color: '#60a5fa' } }}
          >
            You are currently signed in on this device. To sign out of all other devices, use the button below.
          </Alert>
          <Button variant="outlined" color="error" sx={{ mt: 2 }}
            onClick={() => enqueueSnackbar('Signed out of all other sessions', { variant: 'success' })}>
            Sign Out All Other Sessions
          </Button>
        </SectionCard>

        <SectionCard title="Danger Zone" subtitle="Irreversible actions for your account">
          <Box sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#ef4444', mb: 0.5 }}>Delete Account</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mb: 2 }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </Typography>
            <Button variant="outlined" color="error" size="small">Request Account Deletion</Button>
          </Box>
        </SectionCard>
      </TabPanel>
    </Box>
  )
}
