import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Layers, MessageSquare, X, Plus, Send, Loader2, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { toast } from 'sonner'

export default function MultiWorkspace() {
  const navigate = useNavigate()
  const [selectedDocs, setSelectedDocs] = useState([])
  const [created, setCreated] = useState(false)

  const { data: docsData } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.get('/documents'),
  })

  const createChat = useMutation({
    mutationFn: (documentIds) => api.post('/chat', { documentIds, title: 'Multi-PDF Workspace' }),
    onSuccess: (data) => {
      toast.success('Workspace created!')
      navigate(`/chat/${data.chat.id}`)
    },
  })

  const docs = docsData?.documents?.filter(d => d.status === 'READY') || []

  const toggle = (id) => {
    setSelectedDocs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 32px', background: 'var(--bg-sidebar)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Multi-PDF Workspace</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Select multiple documents to chat with simultaneously</p>
      </div>

      <div style={{ padding: 32, maxWidth: 860, margin: '0 auto' }}>
        {/* Selected */}
        {selectedDocs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="card" style={{ padding: 20, marginBottom: 24, borderColor: 'rgba(108,99,255,0.3)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Selected ({selectedDocs.length})</p>
              <button className="btn btn-primary btn-sm" onClick={() => createChat.mutate(selectedDocs)} disabled={createChat.isPending}>
                {createChat.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <><MessageSquare size={14} /> Start Chat</>}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selectedDocs.map(id => {
                const doc = docs.find(d => d.id === id)
                if (!doc) return null
                return (
                  <div key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, fontSize: 12, color: '#6C63FF' }}>
                    <FileText size={11} /> {doc.title}
                    <button onClick={() => toggle(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#6C63FF' }}>
                      <X size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Document List */}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
          Select Documents ({docs.length} available)
        </h3>

        {docs.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <Layers size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <p style={{ color: 'var(--text-muted)' }}>No ready documents. Upload PDFs first.</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/upload')} style={{ marginTop: 16 }}>
              <Plus size={14} /> Upload Documents
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {docs.map(doc => {
              const isSelected = selectedDocs.includes(doc.id)
              return (
                <motion.div key={doc.id} whileHover={{ y: -2 }} onClick={() => toggle(doc.id)}
                  style={{
                    padding: 20, borderRadius: 14, border: `2px solid ${isSelected ? '#6C63FF' : 'var(--border)'}`,
                    background: isSelected ? 'rgba(108,99,255,0.06)' : 'var(--bg-secondary)',
                    cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                  }}
                >
                  {isSelected && (
                    <div style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: 6, background: '#6C63FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>
                    </div>
                  )}
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(108,99,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <FileText size={22} color="#6C63FF" />
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{doc.pageCount ? `${doc.pageCount} pages · ` : ''}{(doc.fileSize / 1024 / 1024).toFixed(1)} MB</p>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
