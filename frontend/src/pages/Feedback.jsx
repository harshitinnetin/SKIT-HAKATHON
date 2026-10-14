import { useState } from 'react'
import { Star, Send, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function Feedback() {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    toast.success('Thank you for your feedback!')
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 32px', background: 'var(--bg-sidebar)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Share Feedback</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Help us improve DocMind AI with your suggestions</p>
      </div>

      <div style={{ padding: 32, maxWidth: 540, margin: '0 auto' }}>
        {sent ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: 20, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Star size={30} color="#10b981" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Feedback Submitted!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Your input helps shape the future of DocMind AI.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 28 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Rate your experience</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                      <Star size={24} color={star <= rating ? '#f59e0b' : 'var(--border-strong)'} fill={star <= rating ? '#f59e0b' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Comments or feature requests</label>
                <textarea className="input" rows={5} value={comment} onChange={e => setComment(e.target.value)} placeholder="What do you love or what can we improve?" style={{ resize: 'vertical' }} />
              </div>

              <button className="btn btn-primary btn-lg" type="submit">
                <Send size={16} /> Submit Feedback
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
