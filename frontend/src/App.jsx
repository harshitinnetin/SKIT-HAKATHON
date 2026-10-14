import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

// Pages
import SplashScreen from './pages/SplashScreen'
import Onboarding from './pages/Onboarding'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Chat from './pages/Chat'
import MultiWorkspace from './pages/MultiWorkspace'
import Summary from './pages/Summary'
import Quiz from './pages/Quiz'
import Flashcards from './pages/Flashcards'
import Library from './pages/Library'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import HelpCenter from './pages/HelpCenter'
import Feedback from './pages/Feedback'
import NotFound from './pages/NotFound'

// Layout
import AppLayout from './components/layout/AppLayout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      // Never retry on 401 (guest users) — only retry on other transient errors
      retry: (failCount, error) => {
        if (error?.status === 401 || error?.response?.status === 401) return false
        return failCount < 1
      },
    },
    mutations: { retry: 0 },
  },
})

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[0,1,2].map(i => <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
      </div>
    </div>
  )

  // Primary check: React state (authoritative)
  if (user) return children

  // Synchronous fallback: check localStorage directly.
  // This handles the brief race window between continueAsGuest() setting
  // localStorage and React's setUser() state update propagating to ProtectedRoute.
  try {
    const cached = localStorage.getItem('docmind_user')
    if (cached && JSON.parse(cached)) return children
  } catch { /* ignore */ }

  return <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  // Redirect logged-in users away from auth pages to their respective home dashboard
  if (user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              {/* Public / splash */}
              <Route path="/" element={<SplashScreen />} />
              <Route path="/onboarding" element={<Onboarding />} />

              {/* Auth */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

              {/* Protected App */}
              <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="upload" element={<Upload />} />
                <Route path="chat" element={<Chat />} />
                <Route path="chat/:chatId" element={<Chat />} />
                <Route path="workspace" element={<MultiWorkspace />} />
                <Route path="summary" element={<Summary />} />
                <Route path="quiz" element={<Quiz />} />
                <Route path="flashcards" element={<Flashcards />} />
                <Route path="library" element={<Library />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="help" element={<HelpCenter />} />
                <Route path="feedback" element={<Feedback />} />
              </Route>

              {/* Admin */}
              <Route path="/admin" element={<AdminRoute><AppLayout isAdmin /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '12px' },
            }}
          />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
