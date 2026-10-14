import { useState } from 'react'
import { Bell, CheckCircle, FileText, Sparkles, Trash2 } from 'lucide-react'

const initialNotifications = [
  { id: 1, title: 'Document Ready', desc: '"AI Research Paper.pdf" processed successfully (48 pages, OCR 99%).', time: '10m ago', unread: true },
  { id: 2, title: 'Quiz Available', desc: '10 MCQs generated from your textbook chapter.', time: '1h ago', unread: true },
  { id: 3, title: 'Welcome to DocMind AI', desc: 'Start chatting with your documents or extract summaries.', time: '1d ago', unread: false },
]

export default function Notifications() {
  const [list, setList] = useState(initialNotifications)

  const markAllRead = () => {
    setList(l => l.map(n => ({ ...n, unread: false })))
  }

  const remove = (id) => {
    setList(l => l.filter(n => n.id !== id))
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 32px', background: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Notification Center</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Document status updates, system alerts, and activity logs</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={markAllRead}>Mark all read</button>
      </div>

      <div style={{ padding: 32, maxWidth: 640, margin: '0 auto' }}>
        {list.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={40} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 14 }}>No notifications at this time.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {list.map(n => (
              <div key={n.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 14, background: n.unread ? 'rgba(108,99,255,0.04)' : 'var(--bg-secondary)', borderColor: n.unread ? 'rgba(108,99,255,0.3)' : 'var(--border)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(108,99,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={18} color="#6C63FF" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</h4>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.time}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{n.desc}</p>
                </div>
                <button className="btn-icon" onClick={() => remove(n.id)} title="Dismiss">
                  <Trash2 size={14} color="var(--text-muted)" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
