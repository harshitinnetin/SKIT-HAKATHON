import { useTheme } from '../contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme()
  return (
    <button
      className="btn-icon"
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 34, height: 34, borderRadius: 10,
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      {isDark ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#6C63FF" />}
    </button>
  )
}
