import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, MessageSquare, Upload, BarChart3, Settings } from 'lucide-react'

const items = [
  { icon: LayoutDashboard, label: 'Home', to: '/dashboard' },
  { icon: FileText, label: 'Library', to: '/library' },
  { icon: MessageSquare, label: 'Chat', to: '/chat' },
  { icon: Upload, label: 'Upload', to: '/upload' },
  { icon: BarChart3, label: 'Analytics', to: '/analytics' },
  { icon: Settings, label: 'Settings', to: '/settings' },
]

export default function MobileNav() {
  return (
    <nav className="show-mobile-only" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--glass-border)',
      display: 'flex',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {items.map(({ icon: Icon, label, to }) => (
        <NavLink key={to} to={to} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', textDecoration: 'none', gap: 2, color: 'var(--text-muted)' }}
          className={({ isActive }) => isActive ? 'mobile-nav-active' : ''}
        >
          {({ isActive }) => (
            <>
              <div style={{
                width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? 'rgba(108, 99, 255, 0.12)' : 'transparent',
                transition: 'background 0.2s',
              }}>
                <Icon size={18} color={isActive ? '#6C63FF' : 'var(--text-muted)'} />
              </div>
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, color: isActive ? '#6C63FF' : 'var(--text-muted)' }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
