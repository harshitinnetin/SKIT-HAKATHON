import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setTimeout(() => {
      setSent(true)
      toast.success('Reset link sent to your email!')
      setLoading(false)
    }, 1500)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '40px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #6C63FF, #9c58f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 12px 30px rgba(108,99,255,0.35)' }}>
            <Brain size={30} color="white" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Forgot Password</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Enter your email and we'll send you a reset link</p>
        </div>

        {sent ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={32} color="#10b981" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Check your email</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>We sent a password reset link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong></p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex' }}>Back to Login</Link>
          </motion.div>
        ) : (
          <div className="card" style={{ padding: 28 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="email" className="input" placeholder="hello@docmind.ai" value={email}
                    onChange={e => setEmail(e.target.value)} style={{ paddingLeft: 36 }} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Sending...' : <><Send size={15} /> Send Reset Link</>}
              </button>
            </form>
          </div>
        )}

        <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14 }}>
          <ArrowLeft size={14} /> Back to Login
        </Link>
      </motion.div>
    </div>
  )
}
