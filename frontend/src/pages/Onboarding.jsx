import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, MessageSquare, FileSearch, Zap, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'

const slides = [
  {
    icon: FileSearch,
    title: 'Chat with Your Documents',
    description: 'Upload any PDF — research papers, contracts, textbooks — and ask questions in plain English. Get instant, accurate answers.',
    gradient: 'linear-gradient(135deg, #6C63FF, #9c58f5)',
    color: '#6C63FF',
  },
  {
    icon: Brain,
    title: 'Extract Text from Scanned PDFs',
    description: 'Our advanced OCR technology automatically detects and extracts text from scanned documents with 98%+ accuracy.',
    gradient: 'linear-gradient(135deg, #9c58f5, #f759ab)',
    color: '#9c58f5',
  },
  {
    icon: Zap,
    title: 'Get Instant AI Answers',
    description: 'Powered by state-of-the-art AI, receive cited answers with exact page numbers and paragraph references.',
    gradient: 'linear-gradient(135deg, #f759ab, #ff6b6b)',
    color: '#f759ab',
  },
]

export default function Onboarding() {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()

  const finish = () => {
    localStorage.setItem('docmind_onboarded', 'true')
    navigate('/login')
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-primary)', overflow: 'hidden',
    }}>
      {/* Skip */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 24px' }}>
        <button className="btn btn-ghost btn-sm" onClick={finish} style={{ color: 'var(--text-muted)' }}>Skip</button>
      </div>

      {/* Slide */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={current}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}
          >
            {/* Illustration */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{
                width: 180, height: 180, borderRadius: 40, margin: '0 auto 40px',
                background: slides[current].gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 30px 80px ${slides[current].color}33`,
                position: 'relative',
              }}
            >
              {/* Orbiting dot */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                style={{ position: 'absolute', width: '100%', height: '100%' }}
              >
                <div style={{
                  width: 12, height: 12, background: 'white', borderRadius: '50%',
                  position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
                  boxShadow: '0 0 12px white',
                }} />
              </motion.div>
              {(() => { const Icon = slides[current].icon; return <Icon size={80} color="white" /> })()}
            </motion.div>

            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              {slides[current].title}
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 360, margin: '0 auto' }}>
              {slides[current].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        {slides.map((_, i) => (
          <motion.div key={i}
            animate={{ width: i === current ? 24 : 8, background: i === current ? '#6C63FF' : 'var(--border-strong)' }}
            transition={{ duration: 0.3 }}
            style={{ height: 8, borderRadius: 4, cursor: 'pointer' }}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px 40px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setCurrent(c => Math.max(0, c - 1))}
          style={{ visibility: current === 0 ? 'hidden' : 'visible' }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        {current < slides.length - 1 ? (
          <button className="btn btn-primary" onClick={() => setCurrent(c => c + 1)}>
            Next <ArrowRight size={14} />
          </button>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={finish}>
            <CheckCircle size={18} /> Get Started
          </button>
        )}
      </div>
    </div>
  )
}
