import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wos_access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle token refresh
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('wos_refresh_token')
      if (!refreshToken) {
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefresh } = res.data.data
        localStorage.setItem('wos_access_token', accessToken)
        localStorage.setItem('wos_refresh_token', newRefresh)
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// Auth endpoints
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
  me: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
  refresh: (data) => api.post('/auth/refresh', data),
}

// Analytics endpoints
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getRevenue: (months) => api.get(`/analytics/revenue?months=${months || 6}`),
  getDailyBookings: (days) => api.get(`/analytics/bookings/daily?days=${days || 30}`),
  getBookingsByStatus: () => api.get('/analytics/bookings/status'),
  getTopRooms: (limit) => api.get(`/analytics/rooms/top?limit=${limit || 5}`),
  getSubscription: () => api.get('/analytics/subscription'),
}

// Booking endpoints
export const bookingApi = {
  create: (data) => api.post('/bookings', data),
  list: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  approve: (id) => api.patch(`/bookings/${id}/approve`),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),
  availability: (roomId, date) => api.get(`/bookings/availability/${roomId}?date=${date}`),
}

// Building endpoints
export const buildingApi = {
  list: (params) => api.get('/buildings', { params }),
  create: (data) => api.post('/buildings', data),
  getById: (id) => api.get(`/buildings/${id}`),
  update: (id, data) => api.put(`/buildings/${id}`, data),
  delete: (id) => api.delete(`/buildings/${id}`),
  createFloor: (buildingId, data) => api.post(`/buildings/${buildingId}/floors`, data),
  createRoom: (buildingId, floorId, data) => api.post(`/buildings/${buildingId}/floors/${floorId}/rooms`, data),
}

// User endpoints
export const userApi = {
  list: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.patch(`/users/${id}/deactivate`),
  assignRole: (id, roleId) => api.post(`/users/${id}/roles`, { roleId }),
}

// Tenant endpoints
export const tenantApi = {
  getMe: () => api.get('/tenants/me'),
  update: (data) => api.put('/tenants/me', data),
  getRoles: () => api.get('/tenants/roles'),
}

// Notification endpoints
export const notificationApi = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}

export default api
