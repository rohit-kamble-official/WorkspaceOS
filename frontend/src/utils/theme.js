import { createTheme } from '@mui/material/styles'

const palette = {
  primary: {
    main: '#6366f1',
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
    contrastText: '#ffffff',
  },
  error: { main: '#ef4444', light: '#f87171', dark: '#dc2626' },
  warning: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
  success: { main: '#10b981', light: '#34d399', dark: '#059669' },
  info: { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
  background: {
    default: '#0a0f1e',
    paper: '#0f172a',
  },
  divider: 'rgba(255,255,255,0.06)',
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    disabled: '#475569',
  },
}

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    ...palette,
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 },
    h5: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 },
    h6: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 },
    button: { fontWeight: 600, letterSpacing: '0.01em', textTransform: 'none' },
    caption: { color: '#64748b', fontSize: '0.75rem' },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.4)',
    '0 4px 12px rgba(0,0,0,0.4)',
    '0 8px 24px rgba(0,0,0,0.4)',
    '0 12px 32px rgba(0,0,0,0.5)',
    '0 16px 48px rgba(0,0,0,0.5)',
    ...Array(19).fill('0 20px 60px rgba(0,0,0,0.5)'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#334155 #0f172a',
          background: '#0a0f1e',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          transition: 'all 0.2s ease',
          '&:hover': {
            border: '1px solid rgba(99,102,241,0.2)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 20px',
          fontWeight: 600,
          transition: 'all 0.2s ease',
        },
        contained: {
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #818cf8, #6366f1)',
            boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: 'rgba(99,102,241,0.4)',
          color: '#818cf8',
          '&:hover': {
            borderColor: '#6366f1',
            background: 'rgba(99,102,241,0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(99,102,241,0.4)' },
            '&.Mui-focused fieldset': { borderColor: '#6366f1' },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, fontSize: '0.75rem' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            background: 'rgba(99,102,241,0.05)',
            color: '#94a3b8',
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { background: 'rgba(255,255,255,0.02)' },
          '& .MuiTableCell-root': { borderBottom: '1px solid rgba(255,255,255,0.04)' },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#0a0f1e',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(10,15,30,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'none',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, background: 'rgba(255,255,255,0.06)' },
        bar: { borderRadius: 4 },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { background: 'rgba(255,255,255,0.05)', borderRadius: 8 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          background: '#1e293b',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        },
      },
    },
  },
})
