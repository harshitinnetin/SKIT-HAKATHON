import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, FileText, MessageSquare, Shield, Activity, HardDrive, Cpu, AlertTriangle } from 'lucide-react'
import api from '../../lib/api'
import { formatDistanceToNow } from 'date-fns'

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats'),
  })

  const stats = data?.stats || {}
  const recentUsers = data?.recentUsers || []

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 32px', background: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={20} color="#6C63FF" /> System Admin Control Panel
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Platform metrics, document moderation, user base & system health</p>
        </div>
      </div>

      <div style={{ padding: 32 }}>
        {/* System Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Registered Users', val: stats.totalUsers || 0, icon: Users, color: '#6C63FF' },
            { label: 'Total Documents Uploaded', val: stats.totalDocuments || 0, icon: FileText, color: '#9c58f5' },
            { label: 'Total AI Conversations', val: stats.totalChats || 0, icon: MessageSquare, color: '#f759ab' },
            { label: 'System Health', val: '99.9% Normal', icon: Activity, color: '#10b981' },
          ].map(m => (
            <div key={m.label} className="card" style={{ padding: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <m.icon size={20} color={m.color} />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{m.val}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Registrations Table */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Recent User Signups</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 12px' }}>User</th>
                  <th style={{ padding: '10px 12px' }}>Role</th>
                  <th style={{ padding: '10px 12px' }}>Plan</th>
                  <th style={{ padding: '10px 12px' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {u.fullName || 'Anonymous'} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>({u.email})</span>
                    </td>
                    <td style={{ padding: '12px' }}><span className="badge badge-brand">{u.role}</span></td>
                    <td style={{ padding: '12px' }}><span className="badge badge-success">{u.plan}</span></td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
