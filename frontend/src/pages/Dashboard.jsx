import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { FileText, MessageSquare, HardDrive, Cpu, TrendingUp, Upload, ArrowRight, Clock, Sparkles, BookOpen, Brain, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import { formatDistanceToNow } from 'date-fns'
import ThemeToggle from '../components/ThemeToggle'

const StatCard = ({ icon: Icon, label, value, sub, color, trend }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="stat-card" style={{ cursor: 'default' }}
    whileHover={{ y: -2 }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color={color} />
      </div>
      {trend && (
        <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 6 }}>
          {trend}
        </span>
      )}
    </div>
    <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>{value}</p>
    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</p>
    {sub && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</p>}
  </motion.div>
)

const suggestedPrompts = [
  { icon: '📄', text: 'Summarize this document', action: 'summarize' },
  { icon: '🔍', text: 'What are the key findings?', action: 'key-findings' },
  { icon: '❓', text: 'Explain the main concepts', action: 'explain' },
  { icon: '📊', text: 'Generate a quiz', action: 'quiz' },
]

export default function Dashboard() {
  const { user, isGuest } = useAuth()
  const navigate = useNavigate()

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics'),
  })

  const stats = analyticsData?.stats || {}
  const recentDocs = analyticsData?.recentDocuments || []
  const recentChats = analyticsData?.recentChats || []

  const formatBytes = (bytes) => {
    if (!bytes) return '0 MB'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="header-container" style={{ borderBottom: '1px solid var(--border)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-sidebar)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Here's what's happening with your documents today.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThemeToggle />
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/upload')}>
            <Upload size={14} /> Upload PDF
          </button>
        </div>
      </div>

      <div className="dashboard-container" style={{ padding: '32px' }}>
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32 }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {isGuest
              ? 'Welcome, Guest Explorer 👋'
              : `Welcome back, ${user?.fullName?.split(' ')[0]} 👋`}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            {isGuest ? 'Exploring DocMind AI — no account needed.' : 'Ready to explore your documents with AI?'}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="stat-card">
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 16 }} />
                <div className="skeleton" style={{ width: '60%', height: 28, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '80%', height: 14 }} />
              </div>
            ))
          ) : (
            <>
              <StatCard icon={FileText} label="Total Documents" value={stats.totalDocuments ?? '—'} sub="+12 this week" color="#6C63FF" trend="+12" />
              <StatCard icon={MessageSquare} label="AI Conversations" value={stats.totalChats ?? '—'} sub="+38 this month" color="#9c58f5" trend="+38" />
              <StatCard icon={HardDrive} label="Storage Used" value={formatBytes(stats.storageUsedBytes)} sub={`of 10 GB`} color="#f759ab" />
              <StatCard icon={TrendingUp} label="OCR Success Rate" value={`${stats.ocrSuccessRate ?? 100}%`} sub="Excellent" color="#10b981" trend="▲" />
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 32 }}>
          {/* Recent Documents */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Documents</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/library')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                View all <ArrowRight size={12} />
              </button>
            </div>
            {recentDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                <FileText size={32} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: 13 }}>No documents yet. Upload your first PDF!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentDocs.map(doc => (
                  <div key={doc.id}
                    onClick={() => navigate(`/chat?doc=${doc.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(108,99,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={18} color="#6C63FF" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.pageCount ? `${doc.pageCount} pages · ` : ''}{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</p>
                    </div>
                    <span className={`badge badge-${doc.status === 'READY' ? 'success' : doc.status === 'PROCESSING' ? 'warning' : 'error'}`}>
                      {doc.status.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Chats */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Chats</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/chat')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                View all <ArrowRight size={12} />
              </button>
            </div>
            {recentChats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                <MessageSquare size={32} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: 13 }}>No conversations yet. Start chatting!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentChats.map(chat => (
                  <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(156,88,245,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MessageSquare size={16} color="#9c58f5" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ padding: 24, marginBottom: 32 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="#6C63FF" /> Suggested Prompts
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {suggestedPrompts.map(p => (
              <button key={p.text} onClick={() => navigate('/chat')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-500)'; e.currentTarget.style.background = 'rgba(108,99,255,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-tertiary)' }}
              >
                <span style={{ fontSize: 18 }}>{p.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{p.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { icon: Brain, title: 'AI Summary', desc: 'Get executive summaries instantly', color: '#6C63FF', to: '/summary' },
            { icon: Zap, title: 'Quiz Generator', desc: 'Create MCQs from any document', color: '#9c58f5', to: '/quiz' },
            { icon: BookOpen, title: 'Flashcards', desc: 'Learn key concepts faster', color: '#f759ab', to: '/flashcards' },
          ].map(({ icon: Icon, title, desc, color, to }) => (
            <motion.div key={title} whileHover={{ y: -3, scale: 1.02 }} onClick={() => navigate(to)}
              style={{ padding: 20, borderRadius: 16, background: `${color}0a`, border: `1px solid ${color}22`, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon size={20} color={color} />
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
