import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from '../../services/api'

const getStoredAuth = () => {
  try {
    const user = localStorage.getItem('wos_user')
    const tenant = localStorage.getItem('wos_tenant')
    const accessToken = localStorage.getItem('wos_access_token')
    return {
      user: user ? JSON.parse(user) : null,
      tenant: tenant ? JSON.parse(tenant) : null,
      accessToken: accessToken || null,
    }
  } catch {
    return { user: null, tenant: null, accessToken: null }
  }
}

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await authApi.login(credentials)
    return res.data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed')
  }
})

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await authApi.register(data)
    return res.data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed')
  }
})

export const logout = createAsyncThunk('auth/logout', async (_, { getState }) => {
  try {
    const refreshToken = localStorage.getItem('wos_refresh_token')
    await authApi.logout({ refreshToken })
  } catch {}
  localStorage.removeItem('wos_user')
  localStorage.removeItem('wos_tenant')
  localStorage.removeItem('wos_access_token')
  localStorage.removeItem('wos_refresh_token')
})

const stored = getStoredAuth()

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: stored.user,
    tenant: stored.tenant,
    accessToken: stored.accessToken,
    isAuthenticated: !!(stored.user && stored.accessToken),
    isLoading: false,
    error: null,
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, tenant, accessToken, refreshToken } = action.payload
      state.user = user
      state.tenant = tenant
      state.accessToken = accessToken
      state.isAuthenticated = true
      localStorage.setItem('wos_user', JSON.stringify(user))
      localStorage.setItem('wos_tenant', JSON.stringify(tenant))
      localStorage.setItem('wos_access_token', accessToken)
      if (refreshToken) localStorage.setItem('wos_refresh_token', refreshToken)
    },
    clearAuth: (state) => {
      state.user = null
      state.tenant = null
      state.accessToken = null
      state.isAuthenticated = false
      localStorage.removeItem('wos_user')
      localStorage.removeItem('wos_tenant')
      localStorage.removeItem('wos_access_token')
      localStorage.removeItem('wos_refresh_token')
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
      localStorage.setItem('wos_user', JSON.stringify(state.user))
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.isLoading = true; state.error = null })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.tenant = action.payload.tenant
        state.accessToken = action.payload.accessToken
        state.isAuthenticated = true
        localStorage.setItem('wos_user', JSON.stringify(action.payload.user))
        localStorage.setItem('wos_tenant', JSON.stringify(action.payload.tenant))
        localStorage.setItem('wos_access_token', action.payload.accessToken)
        localStorage.setItem('wos_refresh_token', action.payload.refreshToken)
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(register.pending, (state) => { state.isLoading = true; state.error = null })
      .addCase(register.fulfilled, (state) => { state.isLoading = false })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.tenant = null
        state.accessToken = null
        state.isAuthenticated = false
      })
  },
})

export const { setCredentials, clearAuth, updateUser } = authSlice.actions
export default authSlice.reducer

export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth.user
export const selectTenant = (state) => state.auth.tenant
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
