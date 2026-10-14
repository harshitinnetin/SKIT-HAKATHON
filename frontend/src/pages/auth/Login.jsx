import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, UserCircle, Mail, Lock, Shield, ArrowRight, Loader2, KeyRound } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'

const features = [
  'Chat with any PDF document',
  'OCR for scanned documents',
  'AI-powered summaries & quizzes',
  'Secure & private by design',
]

export default function Login() {
  const { continueAsGuest, login, user } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('guest') // 'guest' | 'login'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [user, navigate])

  const handleGuest = async () => {
    setGuestLoading(true)
    try {
      await continueAsGuest()
      toast.success('Welcome, Explorer! 🚀')
    } catch (err) {
      toast.error('Could not start guest session.')
    } finally {
      setGuestLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please enter email and password')
    setLoading(true)
    try {
      const data = await login(email, password)
      toast.success(`Welcome back, ${data.user.fullName || 'User'}! 👋`)
    } catch (err) {
      toast.error(err?.error || err?.message || 'Login failed. Check email and password.')
    } finally {
      setLoading(false)
    }
  }

  const fillAdminCredentials = () => {
    setEmail('admin@docmind.ai')
    setPassword('admin1234')
    setActiveTab('login')
    toast.info('Demo Admin credentials filled! Click "Sign In".')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)' }}>
      {/* ── Left Panel ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hide-mobile"
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #0a0914 0%, #12103f 50%, #1a0933 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 60, position: 'relative', overflow: 'hidden',
        }}
      >
        {[
          { size: 300, color: '#6C63FF', top: '10%', left: '5%', delay: 0 },
          { size: 200, color: '#9c58f5', top: '60%', left: '50%', delay: 0.3 },
          { size: 150, color: '#f759ab', top: '30%', left: '20%', delay: 0.6 },
        ].map((orb, i) => (
          <motion.div key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
            transition={{ delay: orb.delay, duration: 1.5, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: orb.size, height: orb.size,
              borderRadius: '50%', background: orb.color,
              filter: 'blur(80px)',
              top: orb.top, left: orb.left,
            }}
          />
        ))}

        <div style={{ zIndex: 1, textAlign: 'center' }}>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 200 }}
            style={{
              width: 80, height: 80, borderRadius: 22,
              background: 'linear-gradient(135deg, #6C63FF, #9c58f5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 20px 50px rgba(108,99,255,0.4)',
            }}
          >
            <Brain size={42} color="white" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 16, letterSpacing: '-0.02em' }}
          >
            DocMind AI
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, maxWidth: 320, lineHeight: 1.7 }}
          >
            Intelligent document understanding powered by advanced AI and OCR technology.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {features.map((f, i) => (
              <motion.div key={f}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.7)' }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: 'rgba(108,99,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6C63FF' }} />
                </div>
                <span style={{ fontSize: 14 }}>{f}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ── Right Panel ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontSize: 28, fontWeight: 800, color: 'var(--text-primary)',
              marginBottom: 8, letterSpacing: '-0.02em',
            }}>
              Welcome to DocMind AI
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.5 }}>
              Explore as a Guest or Sign In to your account.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex', background: 'var(--bg-secondary)', padding: 4, borderRadius: 14,
            border: '1px solid var(--border)', marginBottom: 28,
          }}>
            <button
              onClick={() => setActiveTab('guest')}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none',
                background: activeTab === 'guest' ? 'linear-gradient(135deg, #6C63FF, #9c58f5)' : 'transparent',
                color: activeTab === 'guest' ? 'white' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <UserCircle size={16} /> Guest Mode
            </button>
            <button
              onClick={() => setActiveTab('login')}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none',
                background: activeTab === 'login' ? 'linear-gradient(135deg, #6C63FF, #9c58f5)' : 'transparent',
                color: activeTab === 'login' ? 'white' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <KeyRound size={16} /> User / Admin Login
            </button>
          </div>

          {/* Tab 1: Guest Mode */}
          {activeTab === 'guest' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 20 }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
                  Experience full platform features instantly without creating an account.
                </p>

                <motion.button
                  id="btn-continue-as-guest"
                  onClick={handleGuest}
                  disabled={guestLoading}
                  whileHover={!guestLoading ? { scale: 1.02 } : {}}
                  whileTap={!guestLoading ? { scale: 0.98 } : {}}
                  style={{
                    width: '100%', padding: '15px 24px', borderRadius: 14, border: 'none',
                    cursor: guestLoading ? 'not-allowed' : 'pointer',
                    background: 'linear-gradient(135deg, #6C63FF 0%, #9c58f5 50%, #f759ab 100%)',
                    color: 'white', fontSize: 15, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: '0 10px 30px rgba(108,99,255,0.35)',
                  }}
                >
                  {guestLoading
                    ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Connecting...</>
                    : <><UserCircle size={18} /> Continue as Guest</>}
                </motion.button>
              </div>

            </motion.div>
          )}

          {/* Tab 2: Login Form */}
          {activeTab === 'login' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      className="input"
                      placeholder="admin@docmind.ai or your email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      style={{ paddingLeft: 40, width: '100%', height: 46 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      className="input"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      style={{ paddingLeft: 40, width: '100%', height: 46 }}
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.01 } : {}}
                  whileTap={!loading ? { scale: 0.99 } : {}}
                  style={{
                    marginTop: 8, width: '100%', padding: '14px 24px', borderRadius: 14, border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    background: 'linear-gradient(135deg, #6C63FF, #9c58f5)',
                    color: 'white', fontSize: 15, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: '0 10px 30px rgba(108,99,255,0.3)',
                  }}
                >
                  {loading
                    ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Signing In...</>
                    : <>Sign In <ArrowRight size={16} /></>}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* Footer note */}
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
            Need an account? <Link to="/signup" style={{ color: '#6C63FF', fontWeight: 600 }}>Create an Account</Link>
          </p>
        </div>
      </motion.div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
