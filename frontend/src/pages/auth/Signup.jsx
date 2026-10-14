import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, UserCircle, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'

export default function Signup() {
  const { continueAsGuest, register, user } = useAuth()
  const navigate = useNavigate()
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('VERIFIER')
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

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!fullName || !email || !password) return toast.error('All fields are required')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      const data = await register(email, password, fullName, role)
      toast.success(`Account created! Welcome, ${data.user.fullName}! 🎉`)
    } catch (err) {
      toast.error(err?.error || err?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '40px 24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background orbs */}
      {[
        { size: 400, color: '#6C63FF', top: '-10%', left: '-10%', opacity: 0.06 },
        { size: 300, color: '#9c58f5', top: '60%', left: '60%', opacity: 0.06 },
        { size: 200, color: '#f759ab', top: '40%', left: '80%', opacity: 0.05 },
      ].map((orb, i) => (
        <motion.div key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: orb.opacity }}
          transition={{ delay: i * 0.2, duration: 1.5 }}
          style={{
            position: 'fixed',
            width: orb.size, height: orb.size,
            borderRadius: '50%', background: orb.color,
            filter: 'blur(90px)',
            top: orb.top, left: orb.left,
            pointerEvents: 'none',
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 200 }}
            style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'linear-gradient(135deg, #6C63FF, #9c58f5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 20px 50px rgba(108,99,255,0.4)',
            }}
          >
            <Brain size={32} color="white" />
          </motion.div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Create Your Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Join DocMind AI or continue exploring as a guest.
          </p>
        </div>

        {/* Card Form */}
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  style={{ paddingLeft: 40, width: '100%', height: 44 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: 40, width: '100%', height: 44 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Password (min 6 chars)
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
                  minLength={6}
                  style={{ paddingLeft: 40, width: '100%', height: 44 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Account Role (RBAC System)
              </label>
              <select
                className="input"
                value={role}
                onChange={e => setRole(e.target.value)}
                style={{ width: '100%', height: 44, padding: '0 12px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              >
                <option value="USER">User / General</option>
                <option value="ADMIN">System Administrator (Full Control)</option>
                <option value="FACULTY">Faculty Member (Academic & Question Papers)</option>
                <option value="VERIFIER">Document Verifier & Auditor</option>
                <option value="STUDENT">Student / Viewer (Masked PII)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6, width: '100%', padding: '14px 24px', borderRadius: 12, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #6C63FF, #9c58f5)',
                color: 'white', fontSize: 15, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 10px 30px rgba(108,99,255,0.3)',
              }}
            >
              {loading
                ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Creating Account...</>
                : <>Create Account <ArrowRight size={16} /></>}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <button
            onClick={handleGuest}
            disabled={guestLoading}
            style={{
              width: '100%', padding: '13px 20px', borderRadius: 12,
              border: '1px solid var(--border)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', fontSize: 14, fontWeight: 600,
              cursor: guestLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {guestLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <UserCircle size={18} />}
            Continue as Guest
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: '#6C63FF', fontWeight: 600 }}>Sign In</Link>
        </p>
      </motion.div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
