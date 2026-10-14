import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, FolderTree, Download, FileText, CheckCircle,
  Layers, ArrowRight, Sparkles, Folder, FileCheck, Check
} from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import api, { BASE_URL } from '../lib/api'

export default function SequencerModal({ selectedDocIds, docType = 'QUESTION_PAPER', onClose }) {
  const [sequencePattern, setSequencePattern] = useState(
    docType === 'CERTIFICATE' ? 'cert_hierarchy' : 'exam_hierarchy'
  )
  const [downloading, setDownloading] = useState(false)

  const sequenceFields = sequencePattern === 'cert_hierarchy'
    ? ['department', 'academicYear', 'semester', 'enrollmentNo']
    : ['department', 'semester', 'examType', 'courseCode']

  const { data, isLoading } = useQuery({
    queryKey: ['organize-preview', selectedDocIds, sequenceFields],
    queryFn: () => api.post('/documents/organize', {
      docIds: selectedDocIds,
      sequenceBy: sequenceFields,
    }),
  })

  const organizedList = data?.sequence || []
  const hierarchy = data?.hierarchy || {}

  const handleDownloadZip = async () => {
    setDownloading(true)
    try {
      const token = localStorage.getItem('docmind_token')
      const response = await fetch(`${BASE_URL}/documents/export-zip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          docIds: selectedDocIds,
          namingTemplate: sequencePattern,
        }),
      })

      if (!response.ok) throw new Error('ZIP generation failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `DocMind_Sequenced_${docType}_Archive.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Sequenced ZIP archive downloaded successfully!')
    } catch (err) {
      toast.error('Failed to export ZIP archive: ' + err.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        style={{
          width: '100%', maxWidth: 900, maxHeight: '90vh',
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 20, boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, background: 'rgba(108,99,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FolderTree size={22} color="var(--brand-500)" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                Batch Sequencing & Organization Engine
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Automatically classify, sort, and organize unorganized PDF batches into sequential directories
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Pattern Selector */}
          <div style={{
            background: 'var(--bg-tertiary)', padding: 16, borderRadius: 14,
            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Active Sequencing Schema
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {sequencePattern === 'exam_hierarchy'
                  ? 'Hierarchy: Department ➔ Semester ➔ Exam Type (Main before Back) ➔ Course Code'
                  : 'Hierarchy: Department ➔ Academic Year ➔ Semester ➔ Roll / Enrollment No'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={`btn ${sequencePattern === 'exam_hierarchy' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setSequencePattern('exam_hierarchy')}
              >
                Question Paper Schema
              </button>
              <button
                className={`btn ${sequencePattern === 'cert_hierarchy' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setSequencePattern('cert_hierarchy')}
              >
                Certificate Schema
              </button>
            </div>
          </div>

          {/* Sequence Preview Tree */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={16} color="var(--brand-500)" />
                Organized Target Sequence ({organizedList.length} Files Ready)
              </h3>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Standardized naming applied automatically
              </span>
            </div>

            {isLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                Computing optimal sequence hierarchy...
              </div>
            ) : organizedList.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                No documents selected. Select documents from the library or clear filters.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
                {organizedList.map((doc, idx) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 10, background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)', fontSize: 12, gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: 6, background: 'rgba(108,99,255,0.15)',
                        color: 'var(--brand-500)', fontWeight: 700, fontSize: 11,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        #{idx + 1}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Folder size={13} color="var(--brand-500)" />
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                            {doc.folderPath} /
                          </span>
                          <strong style={{ color: 'var(--text-primary)', fontSize: 12 }}>
                            {doc.standardizedName}
                          </strong>
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                          Original: {doc.fileName}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {doc.examType && (
                        <span className={doc.examType === 'MAIN' ? 'badge-exam-main' : 'badge-exam-back'}>
                          {doc.examType}
                        </span>
                      )}
                      {doc.hasQrCode && (
                        <span className="badge-qr">QR</span>
                      )}
                      {doc.isVerified && (
                        <CheckCircle size={15} color="#10b981" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border)',
          background: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            ZIP includes structured subdirectories and auto-generated <strong>manifest.json</strong>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleDownloadZip}
              disabled={downloading || organizedList.length === 0}
            >
              <Download size={14} />
              {downloading ? 'Packaging ZIP Archive...' : 'Download Sequenced ZIP Package'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
