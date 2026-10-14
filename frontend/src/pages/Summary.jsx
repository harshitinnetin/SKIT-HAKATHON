import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Brain, FileText, Loader2, Download, Copy, ChevronRight, Sparkles, Zap, BookOpen, BarChart2, Languages } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import api from '../lib/api'
import { useNavigate } from 'react-router-dom'

const tabs = [
  { key: 'summary', label: 'Summary', icon: Brain },
  { key: 'executive', label: 'Executive', icon: Zap },
  { key: 'bullets', label: 'Key Points', icon: BookOpen },
  { key: 'insights', label: 'Insights', icon: BarChart2 },
  { key: 'translate', label: 'Translate', icon: Languages },
]

const languages = ['Spanish', 'French', 'German', 'Arabic', 'Hindi', 'Chinese (Simplified)', 'Japanese', 'Portuguese', 'Russian', 'Italian']

export default function Summary() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('summary')
  const [selectedDoc, setSelectedDoc] = useState('')
  const [targetLang, setTargetLang] = useState('Spanish')
  const [result, setResult] = useState('')
  const [streaming, setStreaming] = useState(false)

  const { data: docsData } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.get('/documents'),
  })

  const docs = docsData?.documents?.filter(d => d.status === 'READY') || []

  const handleGenerate = async () => {
    if (!selectedDoc) { toast.error('Please select a document'); return }
    setResult('')
    setStreaming(true)

    const endpoint = activeTab === 'translate' ? '/ai/translate' : '/ai/summarize'
    const body = activeTab === 'translate'
      ? { documentId: selectedDoc, targetLanguage: targetLang }
      : { documentId: selectedDoc, type: activeTab }

    const token = localStorage.getItem('docmind_token')
    const response = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let content = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.token) { content += data.token; setResult(content) }
          } catch {}
        }
      }
    }
    setStreaming(false)
  }

  const copyResult = () => {
    navigator.clipboard.writeText(result)
    toast.success('Copied to clipboard!')
  }

  const downloadResult = () => {
    const blob = new Blob([result], { type: 'text/markdown' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `docmind-${activeTab}.md`; a.click()
    toast.success('Downloaded!')
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div className="header-container" style={{ borderBottom: '1px solid var(--border)', padding: '16px 32px', background: 'var(--bg-sidebar)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>AI Features</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Summarize, translate, and extract insights from your documents</p>
      </div>

      <div className="dashboard-container" style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-tertiary)', padding: 4, borderRadius: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s', background: activeTab === key ? 'var(--bg-primary)' : 'transparent', color: activeTab === key ? '#6C63FF' : 'var(--text-muted)', boxShadow: activeTab === key ? 'var(--shadow-sm)' : 'none' }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Document</h3>
              <select className="input" value={selectedDoc} onChange={e => setSelectedDoc(e.target.value)}
                style={{ fontSize: 13 }}
              >
                <option value="">Select document...</option>
                {docs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>

              {activeTab === 'translate' && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Target Language</label>
                  <select className="input" value={targetLang} onChange={e => setTargetLang(e.target.value)} style={{ fontSize: 13 }}>
                    {languages.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}

              <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 16 }} onClick={handleGenerate} disabled={streaming || !selectedDoc}>
                {streaming ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : <><Sparkles size={14} /> Generate {activeTab === 'translate' ? 'Translation' : 'Summary'}</>}
              </button>
            </div>

            {result && (
              <div className="card" style={{ padding: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Actions</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={copyResult}>
                    <Copy size={13} /> Copy Text
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={downloadResult}>
                    <Download size={13} /> Download .md
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Result */}
          <div className="card" style={{ padding: 28, minHeight: 400 }}>
            {!result && !streaming ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)' }}>
                <Sparkles size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p style={{ fontSize: 14 }}>Select a document and generate to see results here</p>
              </div>
            ) : (
              <div className="prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                {streaming && <span style={{ display: 'inline-block', width: 2, height: 16, background: '#6C63FF', animation: 'blink 1s infinite', marginLeft: 2 }} />}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  )
}
