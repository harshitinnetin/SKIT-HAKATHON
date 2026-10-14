import { Link } from 'react-router-dom'
import { Brain, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 24, textAlign: 'center' }}>
      <div>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, #6C63FF, #9c58f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 20px 40px rgba(108,99,255,0.3)' }}>
          <Brain size={40} color="white" />
        </div>
        <h1 style={{ fontSize: 72, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.03em' }}>404</h1>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>Page Not Found</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28, maxWidth: 360, margin: '0 auto 28px' }}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard" className="btn btn-primary btn-lg" style={{ display: 'inline-flex' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
