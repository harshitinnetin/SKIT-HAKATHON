import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('docmind_user')
      return cached ? JSON.parse(cached) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('docmind_token')
    const cached = localStorage.getItem('docmind_user')

    if (token && cached) {
      setLoading(false)
      return
    }

    if (token && !cached) {
      api.get('/auth/me')
        .then(data => {
          setUser(data.user)
          localStorage.setItem('docmind_user', JSON.stringify(data.user))
        })
        .catch(() => {
          localStorage.removeItem('docmind_token')
          localStorage.removeItem('docmind_refresh_token')
          localStorage.removeItem('docmind_user')
          setUser(null)
        })
        .finally(() => setLoading(false))
      return
    }

    setLoading(false)
  }, [])

  // ── Guest mode: creates a JWT-backed guest session ──
  const continueAsGuest = useCallback(async () => {
    const data = await api.post('/auth/guest')
    localStorage.setItem('docmind_token', data.token)
    if (data.refreshToken) localStorage.setItem('docmind_refresh_token', data.refreshToken)
    localStorage.setItem('docmind_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  // ── Auth actions ──
  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password })
    localStorage.setItem('docmind_token', data.token)
    if (data.refreshToken) localStorage.setItem('docmind_refresh_token', data.refreshToken)
    localStorage.setItem('docmind_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (email, password, fullName, role = 'USER') => {
    const data = await api.post('/auth/register', { email, password, fullName, role })
    localStorage.setItem('docmind_token', data.token)
    if (data.refreshToken) localStorage.setItem('docmind_refresh_token', data.refreshToken)
    localStorage.setItem('docmind_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  const loginWithGoogle = useCallback(async (googleData) => {
    const data = await api.post('/auth/google', googleData)
    localStorage.setItem('docmind_token', data.token)
    if (data.refreshToken) localStorage.setItem('docmind_refresh_token', data.refreshToken)
    localStorage.setItem('docmind_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('docmind_refresh_token')
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken })
    } catch { /* ignore */ }
    localStorage.removeItem('docmind_token')
    localStorage.removeItem('docmind_refresh_token')
    localStorage.removeItem('docmind_user')
    setUser(null)
  }, [])

  const switchRole = useCallback(async (role) => {
    const data = await api.post('/auth/switch-role', { role })
    localStorage.setItem('docmind_token', data.token)
    localStorage.setItem('docmind_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  const updateUser = useCallback((updates) => {
    const updated = { ...user, ...updates }
    setUser(updated)
    localStorage.setItem('docmind_user', JSON.stringify(updated))
  }, [user])

  const userRole = user?.role || 'USER'

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      userRole,
      isGuest: user?.isGuest === true,
      isAdmin: userRole === 'ADMIN',
      isFaculty: userRole === 'FACULTY',
      isVerifier: userRole === 'VERIFIER',
      isStudent: userRole === 'STUDENT',
      canVerify: ['ADMIN', 'FACULTY', 'VERIFIER'].includes(userRole),
      canExport: ['ADMIN', 'FACULTY', 'VERIFIER'].includes(userRole),
      login,
      register,
      loginWithGoogle,
      logout,
      continueAsGuest,
      switchRole,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
