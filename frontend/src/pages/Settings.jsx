import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { Sliders, Moon, Sun, Bell, Shield, Key, Globe, Cpu } from 'lucide-react'
import { toast } from 'sonner'

export default function Settings() {
  const { isDark, toggle } = useTheme()
  const [model, setModel] = useState('openai/gpt-4o')
  const [ocrEngine, setOcrEngine] = useState('tesseract')
  const [notifications, setNotifications] = useState(true)

  const handleSave = () => {
    toast.success('Settings saved successfully!')
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 32px', background: 'var(--bg-sidebar)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Settings & Preferences</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Configure AI model, appearance, OCR engine, and notifications</p>
      </div>

      <div style={{ padding: 32, maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Appearance */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            {isDark ? <Moon size={16} /> : <Sun size={16} />} Appearance Theme
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{isDark ? 'Dark Mode' : 'Light Mode'}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Switch between light and dark visual themes</p>
            </div>
            <button className="btn btn-secondary" onClick={toggle}>
              Toggle Theme
            </button>
          </div>
        </div>

        {/* AI & Engine Config */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={16} color="#6C63FF" /> AI & Engine Preferences
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Default AI Model</label>
              <select className="input" value={model} onChange={e => setModel(e.target.value)}>
                <option value="openai/gpt-4o">OpenAI GPT-4o (Recommended)</option>
                <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini (Fast)</option>
                <option value="google/gemini-2.0-flash">Google Gemini 2.0 Flash</option>
                <option value="anthropic/claude-3.5-sonnet">Anthropic Claude 3.5 Sonnet</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>OCR Extraction Engine</label>
              <select className="input" value={ocrEngine} onChange={e => setOcrEngine(e.target.value)}>
                <option value="tesseract">Tesseract.js OCR (Server-side)</option>
                <option value="paddle">PaddleOCR Service (High Accuracy)</option>
                <option value="pymupdf">PyMuPDF Direct Text Parser</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={16} color="#9c58f5" /> Email Notifications
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>OCR & Processing Alerts</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Receive email when large PDFs finish OCR processing</p>
            </div>
            <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#6C63FF', cursor: 'pointer' }} />
          </div>
        </div>

        <button className="btn btn-primary btn-lg" onClick={handleSave}>
          Save All Settings
        </button>
      </div>
    </div>
  )
}
