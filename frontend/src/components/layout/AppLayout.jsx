import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar'
import MobileNav from '../MobileNav'

export default function AppLayout({ isAdmin }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Desktop Sidebar */}
      <div className="hide-mobile" style={{
        width: sidebarOpen ? '260px' : '72px',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
      }}>
        <Sidebar collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} isAdmin={isAdmin} />
      </div>

      {/* Main Content */}
      <div className="main-content-wrapper" style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Outlet />
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  )
}
