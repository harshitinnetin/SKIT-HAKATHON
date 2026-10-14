import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import { User, Mail, Shield, Zap, Crown, Check, Key } from 'lucide-react'
import { toast } from 'sonner'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [saving, setSaving] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      updateUser({ fullName })
      setSaving(false)
      toast.success('Profile updated!')
    }, 600)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 32px', background: 'var(--bg-sidebar)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Account & Profile</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manage your personal details and subscription plan</p>
      </div>

      <div style={{ padding: 32, maxWidth: 720, margin: '0 auto' }}>
        {/* User Card Header */}
        <div className="card" style={{ padding: 24, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #6C63FF, #9c58f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'white', fontWeight: 800 }}>
            {user?.fullName?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.fullName || 'User'}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span className="badge badge-brand">{user?.role || 'USER'}</span>
              <span className="badge badge-success">{user?.plan || 'FREE'} PLAN</span>
            </div>
          </div>
        </div>

        {/* Profile Details Form */}
        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Personal Information</h3>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Full Name</label>
              <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Email Address</label>
              <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.7 }} />
            </div>
            <button className="btn btn-primary" style={{ width: 'fit-content', marginTop: 8 }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Upgrade Plan Card */}
        <div className="card" style={{ padding: 28, border: '1px solid rgba(108,99,255,0.3)', background: 'linear-gradient(135deg, rgba(108,99,255,0.05), transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Crown size={24} color="#6C63FF" />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Upgrade to DocMind Pro</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Unlock unlimited PDF uploads, GPT-4o processing, PyMuPDF OCR, and team workspaces.</p>
          <button className="btn btn-primary" onClick={() => toast.success('Pro Subscription Activated!')}>
            Upgrade Now - $19/mo
          </button>
        </div>
      </div>
    </div>
  )
}
