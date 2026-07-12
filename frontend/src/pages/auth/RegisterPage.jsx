import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box, Card, CardContent, Typography, TextField, Button,
  InputAdornment, IconButton, Grid, CircularProgress, Chip,
} from '@mui/material'
import {
  Visibility, VisibilityOff, AutoAwesome, ArrowForward, CheckCircle,
} from '@mui/icons-material'
import { register as registerUser, selectAuth } from '../../redux/slices/authSlice'
import { useSnackbar } from 'notistack'

const schema = z.object({
  firstName: z.string().min(2, 'Min 2 chars'),
  lastName: z.string().min(2, 'Min 2 chars'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 chars').regex(/[A-Z]/, 'Needs uppercase').regex(/[0-9]/, 'Needs number'),
  tenantName: z.string().min(2, 'Company name required'),
})

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const { isLoading } = useSelector(selectAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    const result = await dispatch(registerUser(data))
    if (registerUser.fulfilled.match(result)) {
      setDone(true)
    } else {
      enqueueSnackbar(result.payload || 'Registration failed', { variant: 'error' })
    }
  }

  if (done) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Box sx={{ maxWidth: 400, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Workspace Created!</Typography>
          <Typography sx={{ color: '#64748b', mb: 3 }}>Check your email to verify your account.</Typography>
          <Button variant="contained" onClick={() => navigate('/login')}>Go to Login</Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', py: 4 }}>
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: 2.5,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2.5, boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}>
            <AutoAwesome sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Typography variant="h4" sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
            Start your workspace
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
            Free forever. No credit card required.
          </Typography>
        </Box>

        <Card elevation={0}>
          <CardContent sx={{ p: 3.5 }}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="First name" {...register('firstName')} error={!!errors.firstName} helperText={errors.firstName?.message} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Last name" {...register('lastName')} error={!!errors.lastName} helperText={errors.lastName?.message} />
                </Grid>
              </Grid>
              <TextField fullWidth size="small" label="Work email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
              <TextField fullWidth size="small" label="Company / workspace name" {...register('tenantName')} error={!!errors.tenantName} helperText={errors.tenantName?.message} />
              <TextField
                fullWidth size="small" label="Password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')} error={!!errors.password} helperText={errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)} sx={{ color: '#475569' }}>
                        {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['8+ characters', 'Uppercase', 'Number'].map(r => (
                  <Chip key={r} label={r} size="small" sx={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.04)', color: '#64748b' }} />
                ))}
              </Box>

              <Button
                type="submit" variant="contained" fullWidth size="large"
                disabled={isLoading}
                endIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <ArrowForward />}
                sx={{ mt: 1, py: 1.4, fontSize: '0.95rem' }}
              >
                {isLoading ? 'Creating workspace…' : 'Create free workspace'}
              </Button>
            </Box>

            <Box sx={{ mt: 2.5, textAlign: 'center' }}>
              <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Already have a workspace?{' '}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography component="span" sx={{ color: '#6366f1', fontWeight: 600 }}>Sign in</Typography>
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
