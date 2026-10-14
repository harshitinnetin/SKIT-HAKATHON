import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, RotateCcw, ChevronLeft, ChevronRight, Loader2, Sparkles, Check, Flame } from 'lucide-react'
import { toast } from 'sonner'
import api from '../lib/api'

export default function Flashcards() {
  const [selectedDoc, setSelectedDoc] = useState('')
  const [count, setCount] = useState(15)
  const [flashcards, setFlashcards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mastered, setMastered] = useState(new Set())

  const { data: docsData } = useQuery({ queryKey: ['documents'], queryFn: () => api.get('/documents') })
  const docs = docsData?.documents?.filter(d => d.status === 'READY') || []

  const generateFlashcards = async () => {
    if (!selectedDoc) { toast.error('Please select a document'); return }
    setLoading(true)
    setFlashcards([])
    setCurrentIndex(0)
    setIsFlipped(false)
    setMastered(new Set())
    try {
      const data = await api.post('/ai/flashcards', { documentId: selectedDoc, count })
      setFlashcards(data.flashcards)
      toast.success(`Generated ${data.flashcards.length} flashcards!`)
    } catch {
      toast.error('Failed to generate flashcards')
    }
    setLoading(false)
  }

  const card = flashcards[currentIndex]

  const toggleMastered = (id) => {
    setMastered(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div className="header-container" style={{ borderBottom: '1px solid var(--border)', padding: '16px 32px', background: 'var(--bg-sidebar)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Flashcard Deck</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Master key terms, definitions, and concepts from your PDFs</p>
      </div>

      <div className="dashboard-container" style={{ padding: 32, maxWidth: 720, margin: '0 auto' }}>
        {flashcards.length === 0 ? (
          <div className="card" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Create Flashcard Deck</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Document</label>
                <select className="input" value={selectedDoc} onChange={e => setSelectedDoc(e.target.value)}>
                  <option value="">Select document...</option>
                  {docs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Number of Cards</label>
                <select className="input" value={count} onChange={e => setCount(Number(e.target.value))}>
                  {[10, 15, 20, 30].map(n => <option key={n} value={n}>{n} flashcards</option>)}
                </select>
              </div>
              <button className="btn btn-primary btn-lg" onClick={generateFlashcards} disabled={loading}>
                {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Building Deck...</> : <><Sparkles size={16} /> Generate Flashcards</>}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header & Stats */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Card {currentIndex + 1} of {flashcards.length}</span>
                <span className="badge badge-brand"><Flame size={11} style={{ marginRight: 4 }} /> {mastered.size} Mastered</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setFlashcards([])}>New Deck</button>
            </div>

            {/* Flip Card */}
            <div style={{ perspective: 1000, height: 320, cursor: 'pointer', marginBottom: 24 }} onClick={() => setIsFlipped(f => !f)}>
              <motion.div
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                style={{
                  width: '100%', height: '100%', position: 'relative',
                  transformStyle: 'preserve-3d', borderRadius: 24,
                }}
              >
                {/* Front Side */}
                <div className="card" style={{
                  position: 'absolute', width: '100%', height: '100%',
                  backfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center',
                  background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))',
                  boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-strong)',
                }}>
                  <span className="badge badge-brand" style={{ position: 'absolute', top: 20, left: 20 }}>QUESTION / CONCEPT</span>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>{card.front}</h3>
                  <p style={{ position: 'absolute', bottom: 20, fontSize: 12, color: 'var(--text-muted)' }}>Click card to flip 🔄</p>
                </div>

                {/* Back Side */}
                <div className="card" style={{
                  position: 'absolute', width: '100%', height: '100%',
                  backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: 32, textAlign: 'center', background: 'linear-gradient(135deg, rgba(108,99,255,0.1), var(--bg-secondary))',
                  border: '1px solid #6C63FF', boxShadow: 'var(--shadow-md)',
                }}>
                  <span className="badge badge-success" style={{ position: 'absolute', top: 20, left: 20 }}>ANSWER / DEFINITION</span>
                  <p style={{ fontSize: 18, color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>{card.back}</p>
                  <p style={{ position: 'absolute', bottom: 20, fontSize: 12, color: 'var(--text-muted)' }}>Click card to flip 🔄</p>
                </div>
              </motion.div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button className="btn btn-secondary" onClick={() => { setCurrentIndex(i => Math.max(0, i - 1)); setIsFlipped(false) }} disabled={currentIndex === 0}>
                <ChevronLeft size={16} /> Previous
              </button>

              <button
                className={`btn ${mastered.has(card.id) ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => toggleMastered(card.id)}
              >
                <Check size={16} /> {mastered.has(card.id) ? 'Mastered' : 'Mark as Mastered'}
              </button>

              <button className="btn btn-secondary" onClick={() => { setCurrentIndex(i => Math.min(flashcards.length - 1, i + 1)); setIsFlipped(false) }} disabled={currentIndex === flashcards.length - 1}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
