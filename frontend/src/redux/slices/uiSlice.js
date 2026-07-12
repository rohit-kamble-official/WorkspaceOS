import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    sidebarMobileOpen: false,
    themeMode: localStorage.getItem('wos_theme') || 'dark',
    pageTitle: 'Dashboard',
    breadcrumbs: [],
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen },
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload },
    toggleMobileSidebar: (state) => { state.sidebarMobileOpen = !state.sidebarMobileOpen },
    setMobileSidebarOpen: (state, action) => { state.sidebarMobileOpen = action.payload },
    setThemeMode: (state, action) => {
      state.themeMode = action.payload
      localStorage.setItem('wos_theme', action.payload)
    },
    setPageTitle: (state, action) => { state.pageTitle = action.payload },
    setBreadcrumbs: (state, action) => { state.breadcrumbs = action.payload },
  },
})

export const {
  toggleSidebar, setSidebarOpen,
  toggleMobileSidebar, setMobileSidebarOpen,
  setThemeMode, setPageTitle, setBreadcrumbs,
} = uiSlice.actions

export default uiSlice.reducer
export const selectSidebarOpen = (state) => state.ui.sidebarOpen
export const selectThemeMode = (state) => state.ui.themeMode
