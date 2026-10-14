import { useState } from 'react'
import { NavLink, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, MessageSquare, Upload, Library,
  BarChart3, Settings, HelpCircle, LogOut, ChevronLeft, ChevronRight,
  Star, Pin, Search, Plus, Brain, BookOpen, Zap, Users, Shield,
  Bell, MessageCircle, Layers, Languages
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import ThemeToggle from './ThemeToggle'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: FileText, label: 'Doc Intelligence', to: '/library' },
  { icon: Upload, label: 'Batch Upload', to: '/upload' },
  { icon: MessageSquare, label: 'Chat', to: '/chat' },
  { icon: Layers, label: 'Workspace', to: '/workspace' },
  { icon: Brain, label: 'AI Summary', to: '/summary' },
  { icon: Zap, label: 'Quiz', to: '/quiz' },
  { icon: BookOpen, label: 'Flashcards', to: '/flashcards' },
  { icon: Languages, label: 'Translate', to: '/summary?tab=translate' },
  { icon: BarChart3, label: 'Analytics', to: '/analytics' },
]

const bottomItems = [
  { icon: Bell, label: 'Notifications', to: '/notifications' },
  { icon: HelpCircle, label: 'Help', to: '/help' },
  { icon: MessageCircle, label: 'Feedback', to: '/feedback' },
  { icon: Settings, label: 'Settings', to: '/settings' },
]

export default function Sidebar({ collapsed, onToggle, isAdmin }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: chatsData } = useQuery({
    queryKey: ['chats-sidebar'],
    queryFn: () => api.get('/chat'),
    enabled: !!user,
  })

  const recentChats = chatsData?.chats?.slice(0, 5) || []
  const pinnedChats = chatsData?.chats?.filter(c => c.isPinned) || []

  return (
    <div style={{
      height: '100vh',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{ padding: collapsed ? '16px 8px' : '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #6C63FF, #9c58f5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={18} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>DocMind AI</span>
          </motion.div>
        )}
        {collapsed && (
          <div style={{
            width: 36, height: 36, borderRadius: 10, margin: '0 auto',
            background: 'linear-gradient(135deg, #6C63FF, #9c58f5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={18} color="white" />
          </div>
        )}
        {!collapsed && (
          <button className="btn-icon" onClick={onToggle} title="Collapse sidebar">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {collapsed && (
        <button className="btn-icon" onClick={onToggle} title="Expand sidebar" style={{ margin: '8px auto', display: 'block' }}>
          <ChevronRight size={16} />
        </button>
      )}

      {/* New Chat Button */}
      {!collapsed && (
        <div style={{ padding: '12px 12px 4px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', fontSize: 13 }}
            onClick={() => navigate('/chat')}
          >
            <Plus size={15} /> New Chat
          </button>
        </div>
      )}

      {/* Search */}
      {!collapsed && (
        <div style={{ padding: '8px 12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 32, fontSize: 13, padding: '7px 10px 7px 30px' }}
            />
          </div>
        </div>
      )}

      {/* Nav Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '4px' : '4px 8px' }}>
        {/* Main nav */}
        <div style={{ marginBottom: 8 }}>
          {!collapsed && <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 4px 4px' }}>Navigation</p>}
          {navItems.map(({ icon: Icon, label, to }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              style={collapsed ? { justifyContent: 'center', padding: '10px' } : {}}
              title={collapsed ? label : undefined}
            >
              <Icon size={17} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Admin */}
        {user?.role === 'ADMIN' && !collapsed && (
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 4px 4px' }}>Admin</p>
            <NavLink to="/admin" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Shield size={17} /><span>Admin Panel</span>
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Users size={17} /><span>Users</span>
            </NavLink>
          </div>
        )}

        {/* Pinned Chats */}
        {!collapsed && pinnedChats.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 4px 4px' }}>Pinned</p>
            {pinnedChats.map(chat => (
              <NavLink key={chat.id} to={`/chat/${chat.id}`} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                style={{ fontSize: 13 }}
              >
                <Pin size={14} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* Recent Chats */}
        {!collapsed && recentChats.length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 4px 4px' }}>Recent Chats</p>
            {recentChats.map(chat => (
              <NavLink key={chat.id} to={`/chat/${chat.id}`} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                style={{ fontSize: 13 }}
              >
                <MessageSquare size={14} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div style={{ padding: collapsed ? '4px' : '4px 8px', borderTop: '1px solid var(--border)' }}>
        {!collapsed && bottomItems.map(({ icon: Icon, label, to }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Icon size={16} /><span>{label}</span>
          </NavLink>
        ))}

        {!collapsed && <div style={{ height: 1, background: 'var(--border)', margin: '8px 4px' }} />}

        {/* Theme toggle + user */}
        <div style={{ padding: collapsed ? '4px' : '4px', display: 'flex', flexDirection: collapsed ? 'column' : 'row', alignItems: 'center', gap: 8 }}>
          <ThemeToggle />
          {!collapsed && (
            <NavLink to="/profile" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 10, color: 'var(--text-secondary)', textDecoration: 'none' }}
              className="sidebar-item"
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6C63FF, #9c58f5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, color: 'white', fontWeight: 700,
              }}>
                {user?.fullName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName || 'User'}</p>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.plan?.toLowerCase() || 'free'} plan</p>
              </div>
            </NavLink>
          )}
          <button className="btn-icon" onClick={logout} title="Logout" style={{ flexShrink: 0 }}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
