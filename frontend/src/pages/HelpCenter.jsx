import { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp, Search, BookOpen, MessageSquare, Zap } from 'lucide-react'

const faqs = [
  { q: 'How does DocMind AI handle scanned PDFs?', a: 'DocMind AI detects when a PDF contains image scans rather than raw text. It routes scanned documents to our server-side OCR engine (Tesseract OCR) to extract characters with high confidence before chunking and generating embeddings.' },
  { q: 'How accurate are the page citations?', a: 'Every generated chunk tracks its original page number and paragraph sequence. When the RAG pipeline retrieves relevant snippets, exact page references are attached to each citation card in the chat.' },
  { q: 'Is my document data kept private?', a: 'Yes! All documents are stored securely with role-based access control and file encryption. Your uploaded content is never shared or used to train public foundational models.' },
  { q: 'Can I chat with multiple PDFs at once?', a: 'Absolutely! Use the Multi-PDF Workspace to select any combination of ready documents and ask cross-document comparative questions.' },
]

export default function HelpCenter() {
  const [openIdx, setOpenIdx] = useState(0)

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 32px', background: 'var(--bg-sidebar)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Help & Support Center</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Frequently asked questions, platform documentation, and contact guide</p>
      </div>

      <div style={{ padding: 32, maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((item, i) => (
            <div key={i} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => setOpenIdx(openIdx === i ? null : i)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{item.q}</h4>
                {openIdx === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {openIdx === i && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6 }}>{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
