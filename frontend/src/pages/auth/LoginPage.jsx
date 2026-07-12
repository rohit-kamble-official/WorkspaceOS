import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box, Card, CardContent, Typography, TextField, Button,
  InputAdornment, IconButton, Alert, Divider, Chip, CircularProgress,
} from '@mui/material'
import {
  Visibility, VisibilityOff, Email, Lock, AutoAwesome, ArrowForward,
} from '@mui/icons-material'
import { login, selectAuth } from '../../redux/slices/authSlice'
import { useSnackbar } from 'notistack'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
  tenantSlug: z.string().min(1, 'Workspace ID required'),
})

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const { isLoading } = useSelector(selectAuth)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { tenantSlug: 'demo-workspace' },
  })

  const onSubmit = async (data) => {
    const result = await dispatch(login(data))
    if (login.fulfilled.match(result)) {
      enqueueSnackbar('Welcome back! 👋', { variant: 'success' })
      navigate('/dashboard')
    } else {
      enqueueSnackbar(result.payload || 'Login failed', { variant: 'error' })
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: 2.5,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2.5,
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}>
            <AutoAwesome sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Typography variant="h4" sx={{
            fontFamily: "'Plus Jakarta Sans'", fontWeight: 800,
            color: '#f1f5f9', mb: 1, letterSpacing: '-0.02em',
          }}>
            Welcome back
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
            Sign in to your workspace
          </Typography>
        </Box>

        <Card elevation={0}>
          <CardContent sx={{ p: 3.5 }}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

              {/* Workspace Slug */}
              <Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', mb: 0.75, letterSpacing: '0.02em' }}>
                  WORKSPACE ID
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="your-company-slug"
                  {...register('tenantSlug')}
                  error={!!errors.tenantSlug}
                  helperText={errors.tenantSlug?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ color: '#6366f1', fontSize: '0.8rem', fontWeight: 600 }}>
                          wos/
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Divider sx={{ my: -0.5 }}>
                <Chip label="credentials" size="small" sx={{ fontSize: '0.7rem', color: '#475569', background: 'rgba(255,255,255,0.03)' }} />
              </Divider>

              {/* Email */}
              <TextField
                fullWidth
                size="small"
                label="Email address"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Email sx={{ fontSize: 18, color: '#475569' }} /></InputAdornment>,
                }}
              />

              {/* Password */}
              <TextField
                fullWidth
                size="small"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 18, color: '#475569' }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)} sx={{ color: '#475569' }}>
                        {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
                <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: '#6366f1', '&:hover': { color: '#818cf8' }, transition: 'color 0.15s' }}>
                    Forgot password?
                  </Typography>
                </Link>
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading}
                endIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <ArrowForward />}
                sx={{ mt: 0.5, py: 1.4, fontSize: '0.95rem' }}
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                No workspace yet?{' '}
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Typography component="span" sx={{ color: '#6366f1', fontWeight: 600, '&:hover': { color: '#818cf8' } }}>
                    Create one free
                  </Typography>
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Demo hint */}
        <Box sx={{
          mt: 2.5, p: 2, borderRadius: 2,
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.12)',
          textAlign: 'center',
        }}>
          <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
            🎯 Demo: <Typography component="span" sx={{ color: '#818cf8', fontFamily: 'monospace', fontSize: '0.78rem' }}>demo-workspace</Typography>
            {' '}/ <Typography component="span" sx={{ color: '#818cf8', fontFamily: 'monospace', fontSize: '0.78rem' }}>demo@example.com</Typography>
            {' '}/ <Typography component="span" sx={{ color: '#818cf8', fontFamily: 'monospace', fontSize: '0.78rem' }}>Demo1234!</Typography>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
