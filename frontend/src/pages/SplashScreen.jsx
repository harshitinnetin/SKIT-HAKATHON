import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'

export default function SplashScreen() {
  const navigate = useNavigate()

  useEffect(() => {
    // Read session directly from localStorage — synchronous, no React state race.
    // This fires once on mount and reliably navigates after the animation.
    const timer = setTimeout(() => {
      try {
        const cached = localStorage.getItem('docmind_user')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed?.role === 'ADMIN') {
            navigate('/admin', { replace: true })
          } else if (parsed) {
            navigate('/dashboard', { replace: true })
          } else {
            navigate('/login', { replace: true })
          }
        } else {
          navigate('/login', { replace: true })
        }
      } catch {
        navigate('/login', { replace: true })
      }
    }, 2400)

    return () => clearTimeout(timer)
  }, [navigate]) // stable ref — runs exactly once on mount

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0914 0%, #12103f 50%, #1a0933 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Animated orbs */}
      {[...Array(3)].map((_, i) => (
        <motion.div key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 1], opacity: [0, 0.15, 0.08] }}
          transition={{ duration: 2, delay: i * 0.3, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: [400, 300, 250][i], height: [400, 300, 250][i],
            borderRadius: '50%',
            background: ['#6C63FF', '#9c58f5', '#f759ab'][i],
            filter: 'blur(80px)',
            top: ['20%', '60%', '10%'][i], left: ['10%', '60%', '70%'][i],
          }}
        />
      ))}

      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 200 }}
          style={{
            width: 100, height: 100, borderRadius: 28, margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #6C63FF, #9c58f5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 60px rgba(108, 99, 255, 0.5)',
          }}
        >
          <Brain size={52} color="white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ fontSize: 40, fontWeight: 800, color: 'white', marginBottom: 8, letterSpacing: '-0.02em' }}
        >
          DocMind AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 48 }}
        >
          Intelligent Document Understanding
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1, duration: 1.5, ease: 'easeInOut' }}
          style={{ width: 200, height: 3, margin: '0 auto', borderRadius: 2, overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}
        >
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg, transparent, #6C63FF, #9c58f5, transparent)' }}
          />
        </motion.div>
      </div>
    </div>
  )
}
