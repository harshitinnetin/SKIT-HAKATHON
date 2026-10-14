import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Search, Filter, Trash2, Plus, CheckCircle, Clock,
  AlertTriangle, ExternalLink, QrCode, Award, BookOpen, Layers,
  FolderTree, RefreshCw, Eye, Grid, List, Shield, Sparkles, Check,
  ChevronDown, X, Building, Calendar, Hash, Phone
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import RoleSwitcher from '../components/RoleSwitcher'
import DocumentInspectorModal from '../components/DocumentInspectorModal'
import SequencerModal from '../components/SequencerModal'

export default function Library() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { userRole, canVerify, canExport } = useAuth()

  // State
  const [search, setSearch] = useState('')
  const [docTypeTab, setDocTypeTab] = useState('ALL') // ALL, CERTIFICATE, QUESTION_PAPER, INVOICE, HAS_QR, HAS_ANOMALY
  const [viewMode, setViewMode] = useState('grid') // grid | table

  // Root-Level Vast Filters
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [examTypeFilter, setExamTypeFilter] = useState('') // MAIN, BACK, RE_EXAM
  const [courseCodeFilter, setCourseCodeFilter] = useState('')
  const [academicYearFilter, setAcademicYearFilter] = useState('')
  const [phoneFilter, setPhoneFilter] = useState('') // '', 'true', 'false'
  const [qrFilter, setQrFilter] = useState('') // '', 'true', 'false'
  const [verifiedFilter, setVerifiedFilter] = useState('') // '', 'true', 'false'
  const [anomalyFilter, setAnomalyFilter] = useState('') // '', 'true'

  // Inspector & Sequencer Modals
  const [inspectDoc, setInspectDoc] = useState(null)
  const [showSequencer, setShowSequencer] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])

  // Fetch Facets for Root Filters
  const { data: facetsData, refetch: refetchFacets } = useQuery({
    queryKey: ['facets', docTypeTab],
    queryFn: () => api.get(`/documents/facets${docTypeTab !== 'ALL' && !['HAS_QR', 'HAS_ANOMALY'].includes(docTypeTab) ? `?docType=${docTypeTab}` : ''}`),
  })

  // Build query string
  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (docTypeTab === 'CERTIFICATE' || docTypeTab === 'QUESTION_PAPER' || docTypeTab === 'INVOICE') {
      params.set('docType', docTypeTab)
    }
    if (docTypeTab === 'HAS_QR' || qrFilter === 'true') params.set('hasQrCode', 'true')
    if (qrFilter === 'false') params.set('hasQrCode', 'false')
    if (docTypeTab === 'HAS_ANOMALY' || anomalyFilter === 'true') params.set('hasMissing', 'true')
    if (departmentFilter) params.set('department', departmentFilter)
    if (semesterFilter) params.set('semester', semesterFilter)
    if (examTypeFilter) params.set('examType', examTypeFilter)
    if (courseCodeFilter) params.set('courseCode', courseCodeFilter)
    if (academicYearFilter) params.set('academicYear', academicYearFilter)
    if (phoneFilter) params.set('hasPhone', phoneFilter)
    if (verifiedFilter) params.set('isVerified', verifiedFilter)
    params.set('limit', '50')
    return params.toString()
  }, [
    search, docTypeTab, departmentFilter, semesterFilter, examTypeFilter,
    courseCodeFilter, academicYearFilter, phoneFilter, qrFilter, verifiedFilter, anomalyFilter
  ])

  // Fetch Documents
  const { data, isLoading, refetch: refetchDocs } = useQuery({
    queryKey: ['documents', queryString, userRole],
    queryFn: () => api.get(`/documents?${queryString}`),
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      toast.success('Document deleted successfully')
      queryClient.invalidateQueries(['documents'])
      queryClient.invalidateQueries(['facets'])
    },
  })

  // Quick Verify Mutation
  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }) => api.patch(`/documents/${id}/verify`, { isVerified }),
    onSuccess: () => {
      toast.success('Verification updated')
      queryClient.invalidateQueries(['documents'])
      queryClient.invalidateQueries(['facets'])
    },
  })

  // Seed Samples Mutation
  const seedMutation = useMutation({
    mutationFn: () => api.post('/documents/seed-samples'),
    onSuccess: (res) => {
      toast.success(res.message || 'Sample institutional documents loaded!')
      queryClient.invalidateQueries(['documents'])
      queryClient.invalidateQueries(['facets'])
    },
    onError: (err) => {
      toast.error('Failed to load sample documents: ' + (err.error || err.message))
    }
  })

  const documents = data?.documents || []
  const facets = facetsData || { departments: [], semesters: [], examTypes: [], courseCodes: [], academicYears: [] }

  const hasActiveFilters = Boolean(
    departmentFilter || semesterFilter || examTypeFilter || courseCodeFilter ||
    academicYearFilter || phoneFilter || qrFilter || verifiedFilter || anomalyFilter || search
  )

  const clearAllFilters = () => {
    setSearch('')
    setDepartmentFilter('')
    setSemesterFilter('')
    setExamTypeFilter('')
    setCourseCodeFilter('')
    setAcademicYearFilter('')
    setPhoneFilter('')
    setQrFilter('')
    setVerifiedFilter('')
    setAnomalyFilter('')
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === documents.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(documents.map(d => d.id))
    }
  }

  const toggleSelectDoc = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Bar */}
      <div style={{
        borderBottom: '1px solid var(--border)', padding: '16px 32px',
        background: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6C63FF, #9c58f5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(108,99,255,0.3)',
          }}>
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Document Intelligence Hub
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Deep extraction, classification, QR scanning & root-level multi-field sequencing
            </p>
          </div>
        </div>

        {/* Header Action Controls & RBAC Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <RoleSwitcher />

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            title="Pre-populate platform with realistic certificates, main/back question papers, and QR codes"
          >
            <RefreshCw size={14} className={seedMutation.isPending ? 'animate-spin' : ''} />
            {seedMutation.isPending ? 'Seeding...' : 'Load Demo Records'}
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowSequencer(true)}
            title="Organize filtered PDFs into sequential folders and download ZIP archive"
          >
            <FolderTree size={14} />
            Sequence & Organize {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
          </button>

          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/upload')}>
            <Plus size={14} /> Upload New
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Category Selector Tabs */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)', paddingBottom: 12, flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Documents', count: facetsData?.total || 0, icon: FileText },
              { id: 'CERTIFICATE', label: 'Certificates', count: facetsData?.docTypes?.find(d => d.value === 'CERTIFICATE')?.count || 0, icon: Award },
              { id: 'QUESTION_PAPER', label: 'Question Papers', count: facetsData?.docTypes?.find(d => d.value === 'QUESTION_PAPER')?.count || 0, icon: BookOpen },
              { id: 'INVOICE', label: 'Invoices & Reports', count: facetsData?.docTypes?.find(d => d.value === 'INVOICE')?.count || 0, icon: FileText },
              { id: 'HAS_QR', label: 'QR & Barcode Docs', count: facetsData?.withQrCount || 0, icon: QrCode },
              { id: 'HAS_ANOMALY', label: 'Missing Info (Anomalies)', count: facetsData?.missingAnomaliesCount || 0, icon: AlertTriangle, isAlert: true },
            ].map(tab => {
              const Icon = tab.icon
              const isActive = docTypeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => { setDocTypeTab(tab.id); clearAllFilters(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10,
                    fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
                    background: isActive ? 'var(--brand-500)' : 'var(--bg-secondary)',
                    color: isActive ? '#ffffff' : tab.isAlert ? '#ef4444' : 'var(--text-secondary)',
                    boxShadow: isActive ? '0 3px 10px rgba(108,99,255,0.3)' : 'none',
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: 11, padding: '1px 6px', borderRadius: 6, fontWeight: 700,
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bg-tertiary)',
                    color: isActive ? '#ffffff' : 'var(--text-muted)'
                  }}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'var(--bg-tertiary)' : 'transparent',
                border: '1px solid var(--border)', borderRadius: 8, padding: 6
              }}
              title="Card Grid View"
            >
              <Grid size={16} color={viewMode === 'grid' ? 'var(--brand-500)' : 'var(--text-muted)'} />
            </button>
            <button
              className={`btn-icon ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? 'var(--bg-tertiary)' : 'transparent',
                border: '1px solid var(--border)', borderRadius: 8, padding: 6
              }}
              title="Dense Data Table View"
            >
              <List size={16} color={viewMode === 'table' ? 'var(--brand-500)' : 'var(--text-muted)'} />
            </button>
          </div>
        </div>

        {/* Root-Level Vast Filter Panel */}
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 14
        }}>
          {/* Top Search + General Actions */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                placeholder={
                  docTypeTab === 'QUESTION_PAPER'
                    ? 'Search Course Code (5CS4-02), Subject Name, Department...'
                    : docTypeTab === 'CERTIFICATE'
                    ? 'Search Candidate Name, Enrollment No, Phone, Serial, QR payload...'
                    : 'Search by title, entity, roll number, course code, department...'
                }
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 36, fontSize: 13 }}
              />
            </div>

            {hasActiveFilters && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={clearAllFilters}
                style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
              >
                <X size={13} /> Clear Filters
              </button>
            )}
          </div>

          {/* Root-Level Facet Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
            
            {/* Row 1: Department Filter */}
            {facets.departments?.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: 90 }}>
                  Department:
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                  <button
                    className={`filter-chip ${!departmentFilter ? 'active' : ''}`}
                    onClick={() => setDepartmentFilter('')}
                  >
                    All Depts
                  </button>
                  {facets.departments.map(d => (
                    <button
                      key={d.value}
                      className={`filter-chip ${departmentFilter === d.value ? 'active' : ''}`}
                      onClick={() => setDepartmentFilter(departmentFilter === d.value ? '' : d.value)}
                    >
                      <span>{d.value}</span>
                      <span style={{ opacity: 0.7, fontSize: 10 }}>({d.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Row 2: Semester & Academic Year */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: 90 }}>
                Semester:
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                <button
                  className={`filter-chip ${!semesterFilter ? 'active' : ''}`}
                  onClick={() => setSemesterFilter('')}
                >
                  All Semesters
                </button>
                {facets.semesters?.map(s => (
                  <button
                    key={s.value}
                    className={`filter-chip ${semesterFilter === s.value ? 'active' : ''}`}
                    onClick={() => setSemesterFilter(semesterFilter === s.value ? '' : s.value)}
                  >
                    <span>{s.value}</span>
                    <span style={{ opacity: 0.7, fontSize: 10 }}>({s.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3 (Specific to Question Papers): Exam Type (MAIN vs BACK) & Course Codes */}
            {(docTypeTab === 'QUESTION_PAPER' || facets.examTypes?.length > 0) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: 90 }}>
                  Exam Type:
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    className={`filter-chip ${!examTypeFilter ? 'active' : ''}`}
                    onClick={() => setExamTypeFilter('')}
                  >
                    All Exams
                  </button>
                  <button
                    className={`filter-chip ${examTypeFilter === 'MAIN' ? 'active' : ''}`}
                    onClick={() => setExamTypeFilter(examTypeFilter === 'MAIN' ? '' : 'MAIN')}
                    style={{ borderColor: 'rgba(16,185,129,0.4)' }}
                  >
                    <span style={{ color: examTypeFilter === 'MAIN' ? 'white' : '#10b981', fontWeight: 700 }}>● MAIN EXAM</span>
                    <span style={{ opacity: 0.7, fontSize: 10 }}>({facets.examTypes?.find(e => e.value === 'MAIN')?.count || 0})</span>
                  </button>
                  <button
                    className={`filter-chip ${examTypeFilter === 'BACK' ? 'active' : ''}`}
                    onClick={() => setExamTypeFilter(examTypeFilter === 'BACK' ? '' : 'BACK')}
                    style={{ borderColor: 'rgba(245,158,11,0.4)' }}
                  >
                    <span style={{ color: examTypeFilter === 'BACK' ? 'white' : '#f59e0b', fontWeight: 700 }}>● BACK PAPER</span>
                    <span style={{ opacity: 0.7, fontSize: 10 }}>({facets.examTypes?.find(e => e.value === 'BACK')?.count || 0})</span>
                  </button>
                </div>

                {/* Course Codes Pills */}
                {facets.courseCodes?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Course Codes:</span>
                    {facets.courseCodes.slice(0, 5).map(c => (
                      <button
                        key={c.value}
                        className={`filter-chip ${courseCodeFilter === c.value ? 'active' : ''}`}
                        onClick={() => setCourseCodeFilter(courseCodeFilter === c.value ? '' : c.value)}
                        style={{ fontSize: 11, padding: '4px 8px' }}
                      >
                        {c.value} ({c.count})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Row 4 (Specific to Certificates): Phone Number, QR Verification & Missing Info */}
            {(docTypeTab === 'CERTIFICATE' || docTypeTab === 'ALL') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: 90 }}>
                  Integrity:
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    className={`filter-chip ${phoneFilter === 'true' ? 'active' : ''}`}
                    onClick={() => setPhoneFilter(phoneFilter === 'true' ? '' : 'true')}
                  >
                    <Phone size={12} />
                    <span>Has Phone No</span>
                    <span style={{ opacity: 0.7, fontSize: 10 }}>({facets.withPhoneCount || 0})</span>
                  </button>
                  <button
                    className={`filter-chip ${phoneFilter === 'false' ? 'active' : ''}`}
                    onClick={() => setPhoneFilter(phoneFilter === 'false' ? '' : 'false')}
                    style={{ borderColor: 'rgba(239,68,68,0.3)' }}
                  >
                    <AlertTriangle size={12} color="#ef4444" />
                    <span style={{ color: phoneFilter === 'false' ? 'white' : '#ef4444' }}>Missing Phone</span>
                  </button>
                  <button
                    className={`filter-chip ${qrFilter === 'true' ? 'active' : ''}`}
                    onClick={() => setQrFilter(qrFilter === 'true' ? '' : 'true')}
                  >
                    <QrCode size={12} />
                    <span>QR Verified</span>
                    <span style={{ opacity: 0.7, fontSize: 10 }}>({facets.withQrCount || 0})</span>
                  </button>
                  <button
                    className={`filter-chip ${verifiedFilter === 'true' ? 'active' : ''}`}
                    onClick={() => setVerifiedFilter(verifiedFilter === 'true' ? '' : 'true')}
                  >
                    <CheckCircle size={12} color="#10b981" />
                    <span>Audited & Verified</span>
                    <span style={{ opacity: 0.7, fontSize: 10 }}>({facets.verifiedCount || 0})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Counter & Batch Actions Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={documents.length > 0 && selectedIds.length === documents.length}
                onChange={toggleSelectAll}
                style={{ width: 16, height: 16, accentColor: 'var(--brand-500)', cursor: 'pointer' }}
              />
              <span>Select All ({documents.length})</span>
            </label>
            {selectedIds.length > 0 && (
              <span style={{ fontSize: 12, background: 'rgba(108,99,255,0.15)', color: 'var(--brand-500)', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                {selectedIds.length} Selected
              </span>
            )}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Showing <strong>{documents.length}</strong> classified documents
          </div>
        </div>

        {/* Document Grid / Table View */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card" style={{ padding: 20 }}>
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 12 }} />
                <div className="skeleton" style={{ width: '80%', height: 20, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '50%', height: 14 }} />
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              No Documents Matching Active Filters
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20, maxWidth: 440, margin: '0 auto 20px' }}>
              Try clearing specific filters, switching category tabs, or load realistic institutional sample documents to test immediately.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={clearAllFilters}>
                Clear All Filters
              </button>
              <button className="btn btn-primary" onClick={() => seedMutation.mutate()}>
                <Sparkles size={16} /> Load Demo Documents
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {documents.map(doc => {
              const isCert = doc.docType === 'CERTIFICATE'
              const isQP = doc.docType === 'QUESTION_PAPER'
              const isSelected = selectedIds.includes(doc.id)

              return (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card doc-card"
                  onClick={(e) => {
                    // Don't trigger modal if clicking on checkbox or buttons
                    if (e.target.closest('input') || e.target.closest('button')) return
                    setInspectDoc(doc)
                  }}
                  style={{
                    padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    position: 'relative', borderColor: isSelected ? 'var(--brand-500)' : 'var(--border)',
                    boxShadow: isSelected ? '0 0 0 2px var(--brand-500)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    {/* Top Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectDoc(doc.id)}
                          style={{ width: 16, height: 16, accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                        />
                        <div style={{
                          width: 40, height: 40, borderRadius: 12,
                          background: isCert ? 'rgba(139,92,246,0.12)' : isQP ? 'rgba(59,130,246,0.12)' : 'rgba(108,99,255,0.12)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {isCert ? <Award size={20} color="#8b5cf6" /> : isQP ? <BookOpen size={20} color="#3b82f6" /> : <FileText size={20} color="#6C63FF" />}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {doc.examType && (
                          <span className={doc.examType === 'MAIN' ? 'badge-exam-main' : 'badge-exam-back'}>
                            {doc.examType}
                          </span>
                        )}
                        <span className="badge badge-primary" style={{ fontSize: 10 }}>
                          {doc.docType}
                        </span>
                      </div>
                    </div>

                    {/* Document Title */}
                    <h3 style={{
                      fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8,
                      lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }} title={doc.title}>
                      {doc.title}
                    </h3>

                    {/* Predefined Root Entities Chips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                      {/* Name or Subject */}
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-500)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isCert ? <Award size={14} /> : <BookOpen size={14} />}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isCert ? (doc.candidateName || 'Candidate Unnamed') : (doc.courseName || doc.courseCode || 'Course Untitled')}
                        </span>
                      </div>

                      {/* Department & Semester */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-secondary)' }}>
                        {doc.department && (
                          <span style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                            {doc.department}
                          </span>
                        )}
                        {doc.semester && (
                          <span style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                            {doc.semester}
                          </span>
                        )}
                        {doc.courseCode && (
                          <span style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                            {doc.courseCode}
                          </span>
                        )}
                        {doc.enrollmentNo && (
                          <span style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                            Roll: {doc.enrollmentNo}
                          </span>
                        )}
                      </div>

                      {/* Contact / Phone (Role-based masked) */}
                      {isCert && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                          <Phone size={12} color="var(--text-muted)" />
                          {doc.phoneNumber ? (
                            <span style={{ color: userRole === 'STUDENT' ? '#8b5cf6' : 'var(--text-primary)', fontWeight: 500 }}>
                              {doc.phoneNumber}
                            </span>
                          ) : (
                            <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Missing Phone</span>
                          )}
                        </div>
                      )}

                      {/* Badges: QR & Anomaly */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                        {doc.hasQrCode && (
                          <span className="badge-qr" title={`Decoded: ${doc.qrCodeData}`}>
                            <QrCode size={11} /> QR Verified
                          </span>
                        )}
                        {doc.isVerified && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)',
                            padding: '2px 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 3
                          }}>
                            <CheckCircle size={11} /> Verified
                          </span>
                        )}
                        {(doc.anomalyScore || 0) > 0 && (
                          <span className="badge-anomaly">
                            <AlertTriangle size={11} /> Missing Data
                          </span>
                        )}
                        <span style={{
                          fontSize: 10, color: '#10b981', fontWeight: 700, marginLeft: 'auto',
                          background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: 4
                        }}>
                          {doc.classificationConfidence || 95}% Conf
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div style={{
                    borderTop: '1px solid var(--border)', paddingTop: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
                  }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setInspectDoc(doc)}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <Eye size={13} /> Inspect Intelligence
                    </button>

                    {canVerify && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => verifyMutation.mutate({ id: doc.id, isVerified: !doc.isVerified })}
                        title={doc.isVerified ? 'Mark unverified' : 'Verify document'}
                        style={{ padding: '6px 10px' }}
                      >
                        <CheckCircle size={14} color={doc.isVerified ? '#10b981' : 'var(--text-muted)'} />
                      </button>
                    )}

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      title="Delete document"
                      style={{ padding: '6px 10px', color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          /* Data Table View (ideal for 1000s of files) */
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', width: 40 }}>
                    <input type="checkbox" checked={selectedIds.length === documents.length} onChange={toggleSelectAll} />
                  </th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Title / Subject</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Department</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Semester</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Exam / Roll</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Contact / Phone</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>QR Status</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Conf</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, idx) => (
                  <tr
                    key={doc.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <input type="checkbox" checked={selectedIds.includes(doc.id)} onChange={() => toggleSelectDoc(doc.id)} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-primary" style={{ fontSize: 10 }}>
                        {doc.docType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: 220 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.title}>
                        {doc.courseName || doc.candidateName || doc.title}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {doc.department || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {doc.semester || '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {doc.examType ? (
                        <span className={doc.examType === 'MAIN' ? 'badge-exam-main' : 'badge-exam-back'}>
                          {doc.examType}
                        </span>
                      ) : doc.enrollmentNo ? (
                        <span style={{ fontSize: 12, color: 'var(--brand-500)', fontWeight: 600 }}>{doc.enrollmentNo}</span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12 }}>
                      {doc.phoneNumber ? (
                        <span style={{ color: userRole === 'STUDENT' ? '#8b5cf6' : 'var(--text-primary)' }}>
                          {doc.phoneNumber}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {doc.hasQrCode ? (
                        <span className="badge-qr">
                          <QrCode size={11} /> Verified
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 700, fontSize: 12 }}>
                      {doc.classificationConfidence || 95}%
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setInspectDoc(doc)}>
                          Inspect
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => deleteMutation.mutate(doc.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspector Modal */}
      {inspectDoc && (
        <DocumentInspectorModal
          document={inspectDoc}
          onClose={() => setInspectDoc(null)}
        />
      )}

      {/* Sequencer / Organization Modal */}
      {showSequencer && (
        <SequencerModal
          selectedDocIds={selectedIds.length > 0 ? selectedIds : undefined}
          docType={docTypeTab === 'CERTIFICATE' ? 'CERTIFICATE' : 'QUESTION_PAPER'}
          onClose={() => setShowSequencer(false)}
        />
      )}
    </div>
  )
}
