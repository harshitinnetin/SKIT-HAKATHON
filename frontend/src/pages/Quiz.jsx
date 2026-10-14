import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, CheckCircle, XCircle, ChevronRight, ChevronLeft, Loader2, Trophy, RotateCcw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import api from '../lib/api'

export default function Quiz() {
  const [selectedDoc, setSelectedDoc] = useState('')
  const [count, setCount] = useState(10)
  const [difficulty, setDifficulty] = useState('medium')
  const [quiz, setQuiz] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState({})
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(false)

  const { data: docsData } = useQuery({ queryKey: ['documents'], queryFn: () => api.get('/documents') })
  const docs = docsData?.documents?.filter(d => d.status === 'READY') || []

  const generateQuiz = async () => {
    if (!selectedDoc) { toast.error('Select a document'); return }
    setLoading(true)
    setQuiz([]); setSelected({}); setCurrent(0); setShowResult(false)
    try {
      const data = await api.post('/ai/quiz', { documentId: selectedDoc, count, difficulty })
      setQuiz(data.questions)
      toast.success(`${data.questions.length} questions generated!`)
    } catch { toast.error('Quiz generation failed') }
    setLoading(false)
  }

  const handleAnswer = (qId, answer) => {
    if (selected[qId]) return
    setSelected(s => ({ ...s, [qId]: answer }))
  }

  const score = quiz.length > 0 ? quiz.filter(q => selected[q.id] === q.answer[0]).length : 0

  const q = quiz[current]
  const isAnswered = q && !!selected[q.id]
  const isCorrect = q && selected[q.id] === q.answer[0]

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div className="header-container" style={{ borderBottom: '1px solid var(--border)', padding: '16px 32px', background: 'var(--bg-sidebar)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Quiz Generator</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Generate MCQ quizzes from any document</p>
      </div>

      <div className="dashboard-container" style={{ padding: 32, maxWidth: 760, margin: '0 auto' }}>
        {quiz.length === 0 ? (
          <div className="card" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Configure Quiz</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Document</label>
                <select className="input" value={selectedDoc} onChange={e => setSelectedDoc(e.target.value)}>
                  <option value="">Select document...</option>
                  {docs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Number of Questions</label>
                  <select className="input" value={count} onChange={e => setCount(Number(e.target.value))}>
                    {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} questions</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Difficulty</label>
                  <select className="input" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                    {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary btn-lg" onClick={generateQuiz} disabled={loading}>
                {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating Quiz...</> : <><Sparkles size={16} /> Generate Quiz</>}
              </button>
            </div>
          </div>
        ) : showResult ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(108,99,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Trophy size={40} color="#6C63FF" />
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>{score}/{quiz.length}</h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 24 }}>
              {score === quiz.length ? '🎉 Perfect score!' : score >= quiz.length * 0.7 ? '👏 Great job!' : '📚 Keep studying!'}
            </p>
            <div style={{ width: '100%', background: 'var(--bg-tertiary)', borderRadius: 8, height: 12, overflow: 'hidden', marginBottom: 32 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${(score / quiz.length) * 100}%` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #6C63FF, #9c58f5)', borderRadius: 8 }}
              />
            </div>
            <button className="btn btn-secondary" onClick={() => { setQuiz([]); setSelected({}); setCurrent(0); setShowResult(false) }}>
              <RotateCcw size={14} /> Try Again
            </button>
          </motion.div>
        ) : (
          <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{current + 1} / {quiz.length}</span>
              <div className="progress-bar" style={{ flex: 1 }}>
                <div className="progress-fill" style={{ width: `${((current + 1) / quiz.length) * 100}%` }} />
              </div>
              <span className={`badge badge-${difficulty === 'easy' ? 'success' : difficulty === 'medium' ? 'warning' : 'error'}`}>{difficulty}</span>
            </div>

            <div className="card" style={{ padding: 32 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24, lineHeight: 1.5 }}>Q{current + 1}. {q.question}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.options.map((opt, i) => {
                  const letter = opt[0]
                  const isSelected = selected[q.id] === letter
                  const correct = isAnswered && letter === q.answer[0]
                  const wrong = isAnswered && isSelected && !correct

                  return (
                    <motion.button key={i} whileHover={!isAnswered ? { x: 4 } : {}} onClick={() => handleAnswer(q.id, letter)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: `2px solid ${correct ? '#10b981' : wrong ? '#ef4444' : isSelected ? '#6C63FF' : 'var(--border)'}`, background: correct ? 'rgba(16,185,129,0.06)' : wrong ? 'rgba(239,68,68,0.06)' : isSelected ? 'rgba(108,99,255,0.06)' : 'var(--bg-secondary)', cursor: isAnswered ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif', width: '100%', transition: 'all 0.15s' }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: correct ? '#10b981' : wrong ? '#ef4444' : isSelected ? '#6C63FF' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: (correct || wrong || isSelected) ? 'white' : 'var(--text-secondary)', fontSize: 12, fontWeight: 700 }}>
                        {letter}
                      </div>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)', flex: 1 }}>{opt.slice(2)}</span>
                      {correct && <CheckCircle size={18} color="#10b981" />}
                      {wrong && <XCircle size={18} color="#ef4444" />}
                    </motion.button>
                  )
                })}
              </div>

              {isAnswered && q.explanation && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(108,99,255,0.06)', borderRadius: 10, borderLeft: '3px solid #6C63FF' }}
                >
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}><strong>Explanation: </strong>{q.explanation}</p>
                </motion.div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setCurrent(c => c - 1)} disabled={current === 0}>
                  <ChevronLeft size={14} /> Previous
                </button>
                {current === quiz.length - 1 ? (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowResult(true)} disabled={Object.keys(selected).length < quiz.length}>
                    See Results <Trophy size={14} />
                  </button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => setCurrent(c => c + 1)}>
                    Next <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
