import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Search, Trash2, Shield, Edit2, Check } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../lib/api'

export default function UserManagement() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api.get(`/admin/users?search=${search}`),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, role, plan }) => api.patch(`/admin/users/${id}`, { role, plan }),
    onSuccess: () => {
      toast.success('User updated')
      queryClient.invalidateQueries(['admin-users'])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      toast.success('User removed')
      queryClient.invalidateQueries(['admin-users'])
    },
  })

  const users = data?.users || []

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 32px', background: 'var(--bg-sidebar)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>User Management</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>View registered users, change roles, adjust tiers, or ban accounts</p>
      </div>

      <div style={{ padding: 32 }}>
        <div style={{ marginBottom: 20, maxWidth: 360, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search user name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 12px' }}>Name & Email</th>
                  <th style={{ padding: '10px 12px' }}>Role</th>
                  <th style={{ padding: '10px 12px' }}>Subscription Plan</th>
                  <th style={{ padding: '10px 12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.fullName || 'User'}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</p>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <select value={u.role} onChange={e => updateMutation.mutate({ id: u.id, role: e.target.value })}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', fontSize: 12, color: 'var(--text-primary)' }}
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <select value={u.plan} onChange={e => updateMutation.mutate({ id: u.id, plan: e.target.value })}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', fontSize: 12, color: 'var(--text-primary)' }}
                      >
                        <option value="FREE">FREE</option>
                        <option value="PRO">PRO</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button className="btn-icon" onClick={() => deleteMutation.mutate(u.id)} title="Delete user">
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </td>
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
