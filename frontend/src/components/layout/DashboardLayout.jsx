import { useState } from 'react'
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, Avatar,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Badge, Menu, MenuItem, Tooltip, Chip, useTheme,
  useMediaQuery, Collapse,
} from '@mui/material'
import {
  Dashboard, EventNote, Business, People, BarChart,
  CreditCard, Settings, Menu as MenuIcon, Notifications,
  Logout, Person, ChevronLeft, KeyboardArrowDown,
  KeyboardArrowRight, Circle, LightMode, DarkMode,
  AutoAwesome,
} from '@mui/icons-material'
import { logout, selectUser, selectTenant } from '../../redux/slices/authSlice'
import { toggleSidebar, selectSidebarOpen } from '../../redux/slices/uiSlice'
import { useQuery } from '@tanstack/react-query'
import { notificationApi } from '../../services/api'

const SIDEBAR_WIDTH = 260
const SIDEBAR_COLLAPSED = 72

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { label: 'Bookings', icon: <EventNote />, path: '/bookings', badge: 3 },
  { label: 'Workspaces', icon: <Business />, path: '/workspaces' },
  { label: 'People', icon: <People />, path: '/users' },
  { label: 'Analytics', icon: <BarChart />, path: '/analytics' },
  { label: 'Billing', icon: <CreditCard />, path: '/billing' },
  { label: 'Settings', icon: <Settings />, path: '/settings' },
]

function SidebarContent({ collapsed, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const tenant = useSelector(selectTenant)

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Logo */}
      <Box sx={{
        px: collapsed ? 1.5 : 2.5, py: 2.5,
        display: 'flex', alignItems: 'center', gap: 1.5,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        minHeight: 72,
      }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2,
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
        }}>
          <AutoAwesome sx={{ fontSize: 18, color: 'white' }} />
        </Box>
        {!collapsed && (
          <Box>
            <Typography sx={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: '1.05rem', color: '#f1f5f9', lineHeight: 1 }}>
              WorkspaceOS
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: '#6366f1', fontWeight: 600, letterSpacing: '0.05em', mt: 0.3 }}>
              {tenant?.name?.toUpperCase() || 'ENTERPRISE'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1.5 }}>
        {!collapsed && (
          <Typography sx={{ px: 2.5, pb: 1, fontSize: '0.68rem', fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Main Menu
          </Typography>
        )}
        <List disablePadding sx={{ px: collapsed ? 1 : 1.5 }}>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={collapsed ? item.label : ''} placement="right">
                  <ListItemButton
                    onClick={() => { navigate(item.path); onClose?.() }}
                    sx={{
                      borderRadius: 2,
                      px: collapsed ? 1.5 : 1.5,
                      py: 1.1,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      minHeight: 44,
                      background: active ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.1))' : 'transparent',
                      border: active ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                      color: active ? '#818cf8' : '#64748b',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        background: active ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(79,70,229,0.15))' : 'rgba(255,255,255,0.04)',
                        color: active ? '#818cf8' : '#94a3b8',
                        border: active ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.06)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{
                      minWidth: collapsed ? 0 : 36, color: 'inherit',
                      '& svg': { fontSize: 20 },
                    }}>
                      {item.badge ? (
                        <Badge badgeContent={item.badge} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 16, height: 16 } }}>
                          {item.icon}
                        </Badge>
                      ) : item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500 }}
                      />
                    )}
                    {!collapsed && active && (
                      <Box sx={{ width: 4, height: 4, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            )
          })}
        </List>
      </Box>

      {/* Bottom status */}
      {!collapsed && (
        <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Box sx={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(16,185,129,0.05))',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 2, p: 1.5,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', position: 'relative' }}>
                <Box sx={{
                  position: 'absolute', inset: -2, borderRadius: '50%',
                  border: '2px solid rgba(16,185,129,0.3)',
                  animation: 'pulse 2s infinite',
                }} />
              </Box>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>BUSINESS PLAN</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#475569' }}>All features active</Typography>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default function DashboardLayout() {
  const dispatch = useDispatch()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))
  const sidebarOpen = useSelector(selectSidebarOpen)
  const user = useSelector(selectUser)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const navigate = useNavigate()

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationApi.list({ unread: true, limit: 5 }),
    refetchInterval: 30000,
    enabled: true,
  })
  const unreadCount = notifData?.data?.pagination?.total || 0

  const effectiveWidth = isMobile ? 0 : (sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#0a0f1e' }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Box sx={{
          width: sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
          flexShrink: 0,
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <Box sx={{
            position: 'fixed', top: 0, left: 0,
            width: sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
            height: '100vh',
            background: '#080d1a',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
            overflow: 'hidden',
            zIndex: 1200,
          }}>
            <SidebarContent collapsed={!sidebarOpen} />
          </Box>
        </Box>
      )}

      {/* Mobile sidebar */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, background: '#080d1a', border: 'none' },
        }}
      >
        <SidebarContent collapsed={false} onClose={() => setMobileOpen(false)} />
      </Drawer>

      {/* Main area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <AppBar position="sticky" elevation={0} sx={{ zIndex: 1100 }}>
          <Toolbar sx={{ gap: 1, minHeight: '64px !important', px: { xs: 2, sm: 3 } }}>
            <IconButton
              size="small"
              onClick={() => isMobile ? setMobileOpen(true) : dispatch(toggleSidebar())}
              sx={{ color: '#64748b', '&:hover': { color: '#f1f5f9', background: 'rgba(255,255,255,0.06)' } }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ flex: 1 }} />

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton size="small" sx={{ color: '#64748b', '&:hover': { color: '#f1f5f9', background: 'rgba(255,255,255,0.06)' } }}>
                <Badge badgeContent={unreadCount} color="error" max={9}>
                  <Notifications sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User menu */}
            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                px: 1.5, py: 0.75, borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.03)',
                transition: 'all 0.15s',
                '&:hover': { background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(99,102,241,0.2)' },
              }}
            >
              <Avatar sx={{ width: 30, height: 30, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', fontSize: '0.8rem', fontWeight: 700 }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9', lineHeight: 1 }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography sx={{ fontSize: '0.68rem', color: '#475569', lineHeight: 1.4 }}>
                  {user?.roles?.[0]?.replace('_', ' ')}
                </Typography>
              </Box>
              <KeyboardArrowDown sx={{ fontSize: 16, color: '#475569' }} />
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              sx={{ mt: 1 }}
            >
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings') }}>
                <Person sx={{ mr: 1.5, fontSize: 18, color: '#6366f1' }} /> Profile
              </MenuItem>
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings') }}>
                <Settings sx={{ mr: 1.5, fontSize: 18, color: '#6366f1' }} /> Settings
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={() => { dispatch(logout()); setAnchorEl(null) }} sx={{ color: '#ef4444' }}>
                <Logout sx={{ mr: 1.5, fontSize: 18 }} /> Sign Out
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            background: 'radial-gradient(ellipse at top right, rgba(99,102,241,0.04) 0%, transparent 60%)',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
