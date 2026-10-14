import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, User, GraduationCap, CheckCircle, ChevronDown, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

const roles = [
  { id: 'ADMIN', label: 'Admin', icon: Shield, color: '#ef4444', desc: 'Full System & Field Access, User Management' },
  { id: 'FACULTY', label: 'Faculty', icon: GraduationCap, color: '#3b82f6', desc: 'Question Papers, Department Docs, Full Access' },
  { id: 'VERIFIER', label: 'Verifier', icon: CheckCircle, color: '#10b981', desc: 'Document Audit, QR Verification, Field Editing' },
  { id: 'STUDENT', label: 'Student / User', icon: User, color: '#8b5cf6', desc: 'Restricted Access: Masked Phone & PII' },
]

export default function RoleSwitcher() {
  const { user, userRole, switchRole } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const currentRole = roles.find(r => r.id === userRole) || roles[0]
  const Icon = currentRole.icon

  const handleSelectRole = async (roleId) => {
    if (roleId === userRole) {
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      await switchRole(roleId)
      toast.success(`Role switched to ${roleId}! Field visibility updated.`)
      queryClient.invalidateQueries(['documents'])
      queryClient.invalidateQueries(['facets'])
      setOpen(false)
    } catch (err) {
      toast.error('Failed to switch role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-secondary btn-sm"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderColor: currentRole.color,
          background: 'var(--bg-secondary)',
          borderRadius: 10,
          padding: '6px 12px',
          fontWeight: 600,
        }}
        title="Role-Based Access Control (RBAC) Switcher"
      >
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: currentRole.color,
          boxShadow: `0 0 8px ${currentRole.color}`,
        }} />
        <Icon size={14} color={currentRole.color} />
        <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>
          Role: <strong style={{ color: currentRole.color }}>{currentRole.label}</strong>
        </span>
        <ChevronDown size={13} style={{ opacity: 0.7, transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 90 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 290,
                background: 'var(--bg-sidebar)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                boxShadow: 'var(--shadow-lg)',
                padding: 8,
                zIndex: 100,
              }}
            >
              <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  <Sparkles size={13} color="var(--brand-500)" />
                  Role-Based Access Control (RBAC)
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Switch demo roles to see how field-level masking & verification controls dynamically react.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                {roles.map(r => {
                  const RoleIcon = r.icon
                  const isSelected = r.id === userRole
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRole(r.id)}
                      disabled={loading}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: 'none',
                        background: isSelected ? 'rgba(108, 99, 255, 0.12)' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, background: `${r.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
                      }}>
                        <RoleIcon size={15} color={r.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: isSelected ? 'var(--brand-500)' : 'var(--text-primary)' }}>
                            {r.label}
                          </span>
                          {isSelected && <span style={{ fontSize: 10, background: 'var(--brand-500)', color: 'white', padding: '1px 6px', borderRadius: 4 }}>Active</span>}
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3, marginTop: 2 }}>
                          {r.desc}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
