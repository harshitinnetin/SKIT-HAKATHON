import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload as UploadIcon, FileText, CheckCircle, XCircle, Loader2,
  Brain, Eye, Cpu, Sparkles, X, QrCode, Award, BookOpen, ArrowRight,
  RefreshCw, Check
} from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api, { BASE_URL } from '../lib/api'
import ThemeToggle from '../components/ThemeToggle'
import RoleSwitcher from '../components/RoleSwitcher'

export default function Upload() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState([])
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Seed Mutation for Demo Testing
  const seedMutation = useMutation({
    mutationFn: () => api.post('/documents/seed-samples'),
    onSuccess: (res) => {
      toast.success(res.message || 'Sample institutional records loaded!')
      queryClient.invalidateQueries(['documents'])
      queryClient.invalidateQueries(['facets'])
      navigate('/library')
    },
    onError: (err) => {
      toast.error('Failed to load demo records: ' + (err.error || err.message))
    }
  })

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error('Some files were rejected. Supported formats: PDF, PNG, JPG, JPEG, TIFF, WebP (up to 50MB)')
    }
    const newItems = accepted.map(f => ({
      file: f,
      title: f.name.replace(/\.(pdf|png|jpg|jpeg|tiff?|webp)$/i, ''),
      id: Math.random().toString(36).slice(2),
      size: (f.size / 1024).toFixed(1) + ' KB',
      status: 'pending' // pending | uploading | success | error
    }))
    setFiles(prev => [...prev, ...newItems])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.tiff']
    },
    maxSize: 50 * 1024 * 1024,
    multiple: true,
  })

  const removeFile = (id) => setFiles(f => f.filter(x => x.id !== id))

  const handleBatchUpload = async () => {
    if (files.length === 0) return
    setUploading(true)

    try {
      const formData = new FormData()
      files.forEach(item => {
        formData.append('files', item.file)
      })

      const token = localStorage.getItem('docmind_token')
      const response = await fetch(`${BASE_URL}/documents/batch-upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Batch upload failed')

      toast.success(`Successfully uploaded ${data.count} documents! AI Intelligence extraction initiated.`)
      queryClient.invalidateQueries(['documents'])
      queryClient.invalidateQueries(['facets'])
      queryClient.invalidateQueries(['analytics'])

      setFiles([])
      setUploadResults(data.documents || [])
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--border)', padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-sidebar)', position: 'sticky', top: 0, zIndex: 10, flexWrap: 'wrap', gap: 12
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            Batch Document Intake & OCR Engine
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Accepts PDF, images & scanned records • Auto OCR • QR detection • Root entity extraction
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RoleSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="dashboard-container" style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>
        
        {/* Quick Demo Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(139,92,246,0.08))',
          border: '1px solid rgba(108,99,255,0.25)', borderRadius: 16, padding: '16px 20px',
          marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'var(--brand-500)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Don't have 1000 PDF certificates or question papers right now?
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Load pre-built realistic SKIT certificates, end-term main & back question papers with QR codes.
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
          >
            <RefreshCw size={14} className={seedMutation.isPending ? 'animate-spin' : ''} />
            {seedMutation.isPending ? 'Seeding...' : 'Load Sample Institutional Records'}
          </button>
        </div>

        {/* Drop Zone */}
        <div {...getRootProps()}
          className={`upload-zone ${isDragActive ? 'drag-over' : ''}`}
          style={{
            padding: '50px 32px', textAlign: 'center', marginBottom: 28,
            border: '2px dashed var(--border-strong)', borderRadius: 20,
            background: isDragActive ? 'rgba(108,99,255,0.08)' : 'var(--bg-secondary)',
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}
        >
          <input {...getInputProps()} />
          <motion.div animate={isDragActive ? { scale: 1.08 } : { scale: 1 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: 'rgba(108,99,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <UploadIcon size={32} color="#6C63FF" />
            </div>
          </motion.div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            {isDragActive ? 'Drop unorganized PDF & document batches here' : 'Drag & drop document batches, or click to browse'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 520, margin: '0 auto 16px' }}>
            Supports single or multi-file uploads (1 to 1000s of files). Compatible with PDF, scanned PDFs, PNG, JPG, JPEG, TIFF, and WebP.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="badge badge-primary">Automatic OCR</span>
            <span className="badge-qr"><QrCode size={12} /> QR & Barcode Detection</span>
            <span className="badge-exam-main">Doc Classification</span>
            <span className="badge-exam-back">Anomaly Check</span>
          </div>
        </div>

        {/* Upload Queue */}
        {files.length > 0 && (
          <div className="card" style={{ padding: 20, marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Upload Queue ({files.length} documents queued)
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Click "Start Batch Upload & Extraction" to ingest all documents into the intelligence pipeline.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setFiles([])}
                  disabled={uploading}
                >
                  Clear Queue
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleBatchUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Ingesting & Extracting...
                    </>
                  ) : (
                    <>
                      <UploadIcon size={14} /> Start Batch Upload & Extraction ({files.length})
                    </>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {files.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10, background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)', fontSize: 13, gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <FileText size={16} color="var(--brand-500)" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                      ({item.size})
                    </span>
                  </div>

                  {!uploading && (
                    <button
                      className="btn-icon"
                      onClick={() => removeFile(item.id)}
                      style={{ padding: 4 }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Success Banner */}
        {uploadResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{
              padding: 24, textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.08))',
              border: '1px solid rgba(16,185,129,0.3)', marginBottom: 28,
            }}
          >
            <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Batch Ingestion In Progress!
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 18px' }}>
              {uploadResults.length} files successfully queued. OCR text recognition, document classification, QR code decoding, and entity extraction are running in the background.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/library')}
              style={{ margin: '0 auto' }}
            >
              Go to Document Intelligence Library & Filters <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {/* Intelligence Features Capabilities Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(108,99,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Award size={18} color="var(--brand-500)" />
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Academic & NPTEL Certificates
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Extracts Candidate Name, Department, Roll/Enrollment number, Passing Year, Semester, Phone, Issue Date, Serial ID, and verification QR codes.
            </p>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <BookOpen size={18} color="#3b82f6" />
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Semester-wise Question Papers
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Detects Course Code (5CS4-02), Course Name, Department, Semester, Exam Type (Main vs Back), Duration in Hours (3 Hours), and Max Marks.
            </p>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <QrCode size={18} color="#8b5cf6" />
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              QR Code & Barcode Inspector
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Decodes 2D QR codes and barcodes to extract serial tokens, URLs, and matches them against extracted text for authenticity validation.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
