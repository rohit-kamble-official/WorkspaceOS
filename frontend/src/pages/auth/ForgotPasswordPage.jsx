import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Box, Card, CardContent, Typography, TextField, Button, CircularProgress } from '@mui/material'
import { AutoAwesome, MarkEmailRead } from '@mui/icons-material'
import { authApi } from '../../services/api'
import { useSnackbar } from 'notistack'

const schema = z.object({
  email: z.string().email('Invalid email'),
  tenantSlug: z.string().min(1, 'Required'),
})

export default function ForgotPasswordPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authApi.forgotPassword(data)
      setSent(true)
    } catch (e) {
      enqueueSnackbar(e.response?.data?.message || 'Request failed', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ width: 52, height: 52, borderRadius: 2.5, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5, boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
            {sent ? <MarkEmailRead sx={{ color: 'white', fontSize: 24 }} /> : <AutoAwesome sx={{ color: 'white', fontSize: 24 }} />}
          </Box>
          <Typography variant="h5" sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, mb: 1 }}>
            {sent ? 'Check your email' : 'Reset password'}
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
            {sent ? "We've sent a reset link if that email exists." : 'Enter your workspace ID and email'}
          </Typography>
        </Box>

        {!sent && (
          <Card elevation={0}>
            <CardContent sx={{ p: 3.5 }}>
              <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField fullWidth size="small" label="Workspace ID" {...register('tenantSlug')} error={!!errors.tenantSlug} helperText={errors.tenantSlug?.message} />
                <TextField fullWidth size="small" label="Email address" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
                <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} endIcon={loading ? <CircularProgress size={16} color="inherit" /> : null} sx={{ py: 1.4 }}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
              </Box>
              <Box sx={{ mt: 2.5, textAlign: 'center' }}>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography sx={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 600 }}>← Back to sign in</Typography>
                </Link>
              </Box>
            </CardContent>
          </Card>
        )}

        {sent && (
          <Box sx={{ textAlign: 'center' }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button variant="outlined" sx={{ mt: 2 }}>Back to sign in</Button>
            </Link>
          </Box>
        )}
      </Box>
    </Box>
  )
}
