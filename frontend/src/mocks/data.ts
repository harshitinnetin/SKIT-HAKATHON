import type {
  Document, ProcessingJob, QRBarcodeRecord, User, Collection,
  SavedFilter, AuditEvent, DashboardMetrics, DocumentTypeDistribution,
  MetadataField, UploadFile
} from '@/types';

// ─── Mock Current User ────────────────────────────────────────────────────────
export const MOCK_CURRENT_USER: User = {
  id: 'usr_001',
  email: 'admin@skit.ac.in',
  name: 'Dr. Priya Sharma',
  role: 'document_admin',
  department: 'Computer Science',
  isActive: true,
  lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
  createdAt: '2024-08-01T00:00:00Z',
  permissions: [
    { resource: 'documents', actions: ['read', 'write', 'delete', 'export'] },
    { resource: 'collections', actions: ['read', 'write', 'manage'] },
    { resource: 'filters', actions: ['read', 'write'] },
  ],
};

// ─── Mock Documents ───────────────────────────────────────────────────────────
export const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'doc_001', name: 'Certificate_24TEC001_Rahul_Sharma.pdf',
    originalFileName: 'Certificate_24TEC001_Rahul_Sharma.pdf',
    category: 'certificate', mimeType: 'application/pdf', fileSizeBytes: 245780,
    pageCount: 1, uploadedAt: '2026-10-12T09:30:00Z', updatedAt: '2026-10-12T10:15:00Z',
    uploadedBy: 'usr_001', processingStatus: 'completed', confidence: 0.96,
    collectionIds: ['col_001'], hasQrCode: true, hasBarcodes: false,
    reviewStatus: 'approved',
    validationIssues: [],
    metadata: {
      student_name: { fieldName: 'Student Name', value: 'Rahul Sharma', confidence: 0.98, validationState: 'valid' },
      enrollment_number: { fieldName: 'Enrollment Number', value: '24TEC001', confidence: 0.99, validationState: 'valid' },
      department: { fieldName: 'Department', value: 'Computer Science & Engineering', confidence: 0.97, validationState: 'valid' },
      semester: { fieldName: 'Semester', value: '5', confidence: 0.95, validationState: 'valid' },
      academic_year: { fieldName: 'Academic Year', value: '2025-26', confidence: 0.94, validationState: 'valid' },
      certificate_type: { fieldName: 'Certificate Type', value: 'Merit Certificate', confidence: 0.92, validationState: 'valid' },
      certificate_id: { fieldName: 'Certificate ID', value: 'CERT-2025-CSE-001', confidence: 0.99, validationState: 'valid' },
      issue_date: { fieldName: 'Issue Date', value: '2025-10-10', confidence: 0.96, validationState: 'valid' },
      phone_number: { fieldName: 'Phone Number', value: '9876543210', confidence: 0.88, validationState: 'valid' },
      qr_payload: { fieldName: 'QR Payload', value: 'SKIT-CERT-2025-CSE-001-24TEC001', confidence: 0.99, validationState: 'valid' },
    },
    summary: 'Merit Certificate awarded to Rahul Sharma (24TEC001) from CSE department for academic excellence in Semester 5, AY 2025-26. Verified QR code present.',
  },
  {
    id: 'doc_002', name: 'QP_CSE_502_OS_Main_2025.pdf',
    originalFileName: 'QP_CSE_502_OS_Main_2025.pdf',
    category: 'question_paper', mimeType: 'application/pdf', fileSizeBytes: 1245890,
    pageCount: 4, uploadedAt: '2026-10-11T14:00:00Z', updatedAt: '2026-10-11T14:45:00Z',
    uploadedBy: 'usr_002', processingStatus: 'completed', confidence: 0.91,
    collectionIds: ['col_002'], hasQrCode: false, hasBarcodes: true,
    reviewStatus: 'reviewed',
    validationIssues: [],
    metadata: {
      institution: { fieldName: 'Institution', value: 'SKIT Jaipur', confidence: 0.99, validationState: 'valid' },
      department: { fieldName: 'Department', value: 'Computer Science & Engineering', confidence: 0.97, validationState: 'valid' },
      course_code: { fieldName: 'Course Code', value: 'CSE-502', confidence: 0.95, validationState: 'valid' },
      course_name: { fieldName: 'Course Name', value: 'Operating Systems', confidence: 0.94, validationState: 'valid' },
      semester: { fieldName: 'Semester', value: '5', confidence: 0.99, validationState: 'valid' },
      examination_type: { fieldName: 'Examination Type', value: 'Main', confidence: 0.96, validationState: 'valid' },
      examination_year: { fieldName: 'Examination Year', value: '2025', confidence: 0.99, validationState: 'valid' },
      examination_date: { fieldName: 'Examination Date', value: '2025-11-15', confidence: 0.92, validationState: 'valid' },
      duration: { fieldName: 'Duration (Hours)', value: '3', confidence: 0.97, validationState: 'valid' },
      max_marks: { fieldName: 'Maximum Marks', value: '100', confidence: 0.99, validationState: 'valid' },
    },
    summary: 'Main examination question paper for CSE-502 Operating Systems, Semester 5, 2025. Duration: 3 hours, Max Marks: 100.',
  },
  {
    id: 'doc_003', name: 'Certificate_24TEC045_Ananya_Patel.pdf',
    originalFileName: 'Certificate_24TEC045_Ananya_Patel.pdf',
    category: 'certificate', mimeType: 'application/pdf', fileSizeBytes: 198340,
    pageCount: 1, uploadedAt: '2026-10-12T10:00:00Z', updatedAt: '2026-10-12T10:45:00Z',
    uploadedBy: 'usr_001', processingStatus: 'review_required', confidence: 0.68,
    collectionIds: ['col_001'], hasQrCode: false, hasBarcodes: false,
    reviewStatus: 'pending',
    validationIssues: [
      { id: 'vi_001', fieldName: 'enrollment_number', severity: 'warning', type: 'low_confidence', message: 'Enrollment number extracted with low confidence. Manual verification required.', },
      { id: 'vi_002', fieldName: 'phone_number', severity: 'info', type: 'missing', message: 'Phone number field not found in document.' },
    ],
    metadata: {
      student_name: { fieldName: 'Student Name', value: 'Ananya Patel', confidence: 0.95, validationState: 'valid' },
      enrollment_number: { fieldName: 'Enrollment Number', value: '24TEC045', confidence: 0.62, validationState: 'uncertain' },
      department: { fieldName: 'Department', value: 'Electronics & Communication', confidence: 0.91, validationState: 'valid' },
      semester: { fieldName: 'Semester', value: '3', confidence: 0.88, validationState: 'valid' },
      academic_year: { fieldName: 'Academic Year', value: '2024-25', confidence: 0.85, validationState: 'valid' },
      certificate_type: { fieldName: 'Certificate Type', value: 'Participation Certificate', confidence: 0.90, validationState: 'valid' },
      certificate_id: { fieldName: 'Certificate ID', value: 'CERT-2024-ECE-045', confidence: 0.92, validationState: 'valid' },
      issue_date: { fieldName: 'Issue Date', value: '2024-12-20', confidence: 0.88, validationState: 'valid' },
      phone_number: { fieldName: 'Phone Number', value: null, confidence: undefined, validationState: 'missing' },
      qr_payload: { fieldName: 'QR Payload', value: null, confidence: undefined, validationState: 'missing' },
    },
    summary: 'Participation Certificate for Ananya Patel from ECE department. Enrollment number extracted with uncertainty — review required.',
  },
  {
    id: 'doc_004', name: 'QP_ECE_301_Signals_Back_2025.pdf',
    originalFileName: 'QP_ECE_301_Signals_Back_2025.pdf',
    category: 'question_paper', mimeType: 'application/pdf', fileSizeBytes: 987650,
    pageCount: 3, uploadedAt: '2026-10-10T08:00:00Z', updatedAt: '2026-10-10T09:00:00Z',
    uploadedBy: 'usr_002', processingStatus: 'completed', confidence: 0.89,
    collectionIds: ['col_002'], hasQrCode: false, hasBarcodes: false,
    reviewStatus: 'reviewed',
    validationIssues: [],
    metadata: {
      institution: { fieldName: 'Institution', value: 'SKIT Jaipur', confidence: 0.99, validationState: 'valid' },
      department: { fieldName: 'Department', value: 'Electronics & Communication', confidence: 0.95, validationState: 'valid' },
      course_code: { fieldName: 'Course Code', value: 'ECE-301', confidence: 0.93, validationState: 'valid' },
      course_name: { fieldName: 'Course Name', value: 'Signals & Systems', confidence: 0.91, validationState: 'valid' },
      semester: { fieldName: 'Semester', value: '3', confidence: 0.99, validationState: 'valid' },
      examination_type: { fieldName: 'Examination Type', value: 'Back', confidence: 0.94, validationState: 'valid' },
      examination_year: { fieldName: 'Examination Year', value: '2025', confidence: 0.99, validationState: 'valid' },
      duration: { fieldName: 'Duration (Hours)', value: '3', confidence: 0.96, validationState: 'valid' },
      max_marks: { fieldName: 'Maximum Marks', value: '100', confidence: 0.99, validationState: 'valid' },
    },
    summary: 'Back examination paper for ECE-301 Signals & Systems, Semester 3, 2025. Duration: 3 hours, Max Marks: 100.',
  },
  {
    id: 'doc_005', name: 'Certificate_24TEC102_Vikram_Singh.pdf',
    originalFileName: 'Certificate_24TEC102_Vikram_Singh.pdf',
    category: 'certificate', mimeType: 'application/pdf', fileSizeBytes: 312450,
    pageCount: 1, uploadedAt: '2026-10-13T11:00:00Z', updatedAt: '2026-10-13T12:30:00Z',
    uploadedBy: 'usr_001', processingStatus: 'completed', confidence: 0.94,
    collectionIds: ['col_001'], hasQrCode: true, hasBarcodes: false,
    reviewStatus: 'approved',
    validationIssues: [],
    metadata: {
      student_name: { fieldName: 'Student Name', value: 'Vikram Singh', confidence: 0.97, validationState: 'valid' },
      enrollment_number: { fieldName: 'Enrollment Number', value: '24TEC102', confidence: 0.98, validationState: 'valid' },
      department: { fieldName: 'Department', value: 'Mechanical Engineering', confidence: 0.96, validationState: 'valid' },
      semester: { fieldName: 'Semester', value: '7', confidence: 0.97, validationState: 'valid' },
      academic_year: { fieldName: 'Academic Year', value: '2026-27', confidence: 0.93, validationState: 'valid' },
      certificate_type: { fieldName: 'Certificate Type', value: 'Distinction Certificate', confidence: 0.95, validationState: 'valid' },
      certificate_id: { fieldName: 'Certificate ID', value: 'CERT-2026-ME-102', confidence: 0.98, validationState: 'valid' },
      issue_date: { fieldName: 'Issue Date', value: '2026-08-15', confidence: 0.97, validationState: 'valid' },
      qr_payload: { fieldName: 'QR Payload', value: 'SKIT-CERT-2026-ME-102-24TEC102', confidence: 0.99, validationState: 'valid' },
    },
    summary: 'Distinction Certificate for Vikram Singh (24TEC102), ME department, Semester 7. Verified QR code present.',
  },
  {
    id: 'doc_006', name: 'Invoice_IT_Dept_Oct2025.pdf',
    originalFileName: 'Invoice_IT_Dept_Oct2025.pdf',
    category: 'invoice', mimeType: 'application/pdf', fileSizeBytes: 145678,
    pageCount: 2, uploadedAt: '2026-10-09T16:00:00Z', updatedAt: '2026-10-09T17:00:00Z',
    uploadedBy: 'usr_003', processingStatus: 'completed', confidence: 0.93,
    collectionIds: [], hasQrCode: false, hasBarcodes: true,
    reviewStatus: 'reviewed',
    validationIssues: [],
    metadata: {
      invoice_number: { fieldName: 'Invoice Number', value: 'INV-2025-1042', confidence: 0.99, validationState: 'valid' },
      vendor_name: { fieldName: 'Vendor Name', value: 'TechEquip Solutions Pvt. Ltd.', confidence: 0.96, validationState: 'valid' },
      amount: { fieldName: 'Amount', value: '₹1,24,500', confidence: 0.98, validationState: 'valid' },
      invoice_date: { fieldName: 'Invoice Date', value: '2025-10-05', confidence: 0.97, validationState: 'valid' },
      department: { fieldName: 'Department', value: 'Information Technology', confidence: 0.91, validationState: 'valid' },
    },
    summary: 'Invoice INV-2025-1042 from TechEquip Solutions for ₹1,24,500 dated Oct 5, 2025 for IT department.',
  },
  {
    id: 'doc_007', name: 'QP_ME_401_ThermDyn_Main_2026.pdf',
    originalFileName: 'QP_ME_401_ThermDyn_Main_2026.pdf',
    category: 'question_paper', mimeType: 'application/pdf', fileSizeBytes: 876543,
    pageCount: 4, uploadedAt: '2026-10-13T09:00:00Z', updatedAt: '2026-10-13T10:00:00Z',
    uploadedBy: 'usr_002', processingStatus: 'processing', confidence: undefined,
    collectionIds: ['col_002'], hasQrCode: false, hasBarcodes: false,
    reviewStatus: 'pending',
    validationIssues: [],
    metadata: {},
    summary: undefined,
  },
  {
    id: 'doc_008', name: 'Application_Leave_Faculty_Form.pdf',
    originalFileName: 'Application_Leave_Faculty_Form.pdf',
    category: 'form', mimeType: 'application/pdf', fileSizeBytes: 87450,
    pageCount: 2, uploadedAt: '2026-10-08T13:00:00Z', updatedAt: '2026-10-08T14:30:00Z',
    uploadedBy: 'usr_004', processingStatus: 'completed', confidence: 0.87,
    collectionIds: [], hasQrCode: false, hasBarcodes: false,
    reviewStatus: 'reviewed',
    validationIssues: [],
    metadata: {
      form_type: { fieldName: 'Form Type', value: 'Leave Application', confidence: 0.94, validationState: 'valid' },
      applicant_name: { fieldName: 'Applicant Name', value: 'Dr. Suresh Kumar', confidence: 0.93, validationState: 'valid' },
      department: { fieldName: 'Department', value: 'Physics', confidence: 0.89, validationState: 'valid' },
      date_from: { fieldName: 'Leave From', value: '2025-10-20', confidence: 0.91, validationState: 'valid' },
      date_to: { fieldName: 'Leave To', value: '2025-10-25', confidence: 0.90, validationState: 'valid' },
    },
    summary: 'Leave application form submitted by Dr. Suresh Kumar from Physics department for Oct 20-25, 2025.',
  },
  {
    id: 'doc_009', name: 'Annual_Report_SKIT_2025-26.pdf',
    originalFileName: 'Annual_Report_SKIT_2025-26.pdf',
    category: 'report', mimeType: 'application/pdf', fileSizeBytes: 5234567,
    pageCount: 128, uploadedAt: '2026-10-07T10:00:00Z', updatedAt: '2026-10-07T12:00:00Z',
    uploadedBy: 'usr_005', processingStatus: 'failed', confidence: undefined,
    collectionIds: [], hasQrCode: false, hasBarcodes: false,
    reviewStatus: 'pending',
    validationIssues: [
      { id: 'vi_003', fieldName: 'general', severity: 'error', type: 'missing', message: 'OCR processing failed: file exceeds processing limit or is corrupted.' },
    ],
    metadata: {},
    summary: undefined,
  },
  {
    id: 'doc_010', name: 'QR_Student_ID_Card_24TEC078.jpg',
    originalFileName: 'QR_Student_ID_Card_24TEC078.jpg',
    category: 'qr_barcode', mimeType: 'image/jpeg', fileSizeBytes: 45678,
    pageCount: 1, uploadedAt: '2026-10-13T15:00:00Z', updatedAt: '2026-10-13T15:30:00Z',
    uploadedBy: 'usr_001', processingStatus: 'completed', confidence: 0.99,
    collectionIds: ['col_003'], hasQrCode: true, hasBarcodes: false,
    reviewStatus: 'approved',
    validationIssues: [],
    metadata: {
      qr_payload: { fieldName: 'QR Payload', value: 'SKIT-STU-24TEC078-CSE-2024', confidence: 0.99, validationState: 'valid' },
      parsed_identifier: { fieldName: 'Parsed Identifier', value: '24TEC078', confidence: 0.99, validationState: 'valid' },
      enrollment_number: { fieldName: 'Enrollment Number', value: '24TEC078', confidence: 0.99, validationState: 'valid' },
      department: { fieldName: 'Department', value: 'Computer Science & Engineering', confidence: 0.97, validationState: 'valid' },
    },
    summary: 'Student ID card for enrollment 24TEC078 from CSE department. QR code successfully decoded.',
  },
];

// ─── Mock Processing Jobs ─────────────────────────────────────────────────────
export const MOCK_PROCESSING_JOBS: ProcessingJob[] = [
  { id: 'job_001', documentId: 'doc_007', documentName: 'QP_ME_401_ThermDyn_Main_2026.pdf', category: 'question_paper', stage: 'ocr_parsing', progress: undefined, status: 'processing', startedAt: new Date(Date.now() - 600000).toISOString(), updatedAt: new Date(Date.now() - 60000).toISOString(), retryCount: 0 },
  { id: 'job_002', documentId: 'doc_011', documentName: 'Certificate_Batch_Oct2026.zip', category: undefined, stage: 'queued', progress: undefined, status: 'queued', startedAt: new Date(Date.now() - 120000).toISOString(), updatedAt: new Date(Date.now() - 30000).toISOString(), retryCount: 0 },
  { id: 'job_003', documentId: 'doc_009', documentName: 'Annual_Report_SKIT_2025-26.pdf', category: 'report', stage: 'ocr_parsing', progress: undefined, status: 'failed', startedAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date(Date.now() - 3000000).toISOString(), durationMs: 120000, errorMessage: 'OCR timeout: document exceeds 100-page limit for single-job processing.', retryCount: 1 },
  { id: 'job_004', documentId: 'doc_001', documentName: 'Certificate_24TEC001_Rahul_Sharma.pdf', category: 'certificate', stage: 'completed', progress: 100, status: 'completed', startedAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date(Date.now() - 6900000).toISOString(), durationMs: 18000, retryCount: 0 },
  { id: 'job_005', documentId: 'doc_005', documentName: 'Certificate_24TEC102_Vikram_Singh.pdf', category: 'certificate', stage: 'completed', progress: 100, status: 'completed', startedAt: new Date(Date.now() - 5400000).toISOString(), updatedAt: new Date(Date.now() - 5100000).toISOString(), durationMs: 15000, retryCount: 0 },
];

// ─── Mock QR/Barcode Records ──────────────────────────────────────────────────
export const MOCK_QR_RECORDS: QRBarcodeRecord[] = [
  { id: 'qr_001', documentId: 'doc_001', documentName: 'Certificate_24TEC001_Rahul_Sharma.pdf', codeType: 'qr_code', rawValue: 'SKIT-CERT-2025-CSE-001-24TEC001', parsedIdentifier: '24TEC001', resolvedEntity: 'Rahul Sharma – CSE Semester 5', sourcePage: 1, detectionConfidence: 0.99, verificationStatus: 'verified', extractionStatus: 'success', createdAt: '2026-10-12T10:15:00Z' },
  { id: 'qr_002', documentId: 'doc_005', documentName: 'Certificate_24TEC102_Vikram_Singh.pdf', codeType: 'qr_code', rawValue: 'SKIT-CERT-2026-ME-102-24TEC102', parsedIdentifier: '24TEC102', resolvedEntity: 'Vikram Singh – ME Semester 7', sourcePage: 1, detectionConfidence: 0.98, verificationStatus: 'verified', extractionStatus: 'success', createdAt: '2026-10-13T12:30:00Z' },
  { id: 'qr_003', documentId: 'doc_010', documentName: 'QR_Student_ID_Card_24TEC078.jpg', codeType: 'qr_code', rawValue: 'SKIT-STU-24TEC078-CSE-2024', parsedIdentifier: '24TEC078', resolvedEntity: 'Student ID — CSE 2024', sourcePage: 1, detectionConfidence: 0.99, verificationStatus: 'verified', extractionStatus: 'success', createdAt: '2026-10-13T15:30:00Z' },
  { id: 'qr_004', documentId: 'doc_006', documentName: 'Invoice_IT_Dept_Oct2025.pdf', codeType: 'barcode_1d', rawValue: 'INV-2025-1042-TEQS', parsedIdentifier: 'INV-2025-1042', resolvedEntity: undefined, sourcePage: 1, detectionConfidence: 0.97, verificationStatus: 'unverified', extractionStatus: 'success', createdAt: '2026-10-09T17:00:00Z' },
  { id: 'qr_005', documentId: 'doc_002', documentName: 'QP_CSE_502_OS_Main_2025.pdf', codeType: 'barcode_1d', rawValue: 'QP-CSE-502-MAIN-2025', parsedIdentifier: 'QP-CSE-502', resolvedEntity: undefined, sourcePage: 1, detectionConfidence: 0.95, verificationStatus: 'unverified', extractionStatus: 'success', createdAt: '2026-10-11T14:45:00Z' },
];

// ─── Mock Collections ─────────────────────────────────────────────────────────
export const MOCK_COLLECTIONS: Collection[] = [
  { id: 'col_001', name: 'Student Certificates AY 2025-26', description: 'All student certificates for academic year 2025-26', category: 'certificate', documentCount: 342, createdBy: 'usr_001', createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-10-13T12:30:00Z', isShared: true },
  { id: 'col_002', name: 'Examination Question Papers 2025', description: 'All question papers for examinations held in 2025', category: 'question_paper', documentCount: 876, createdBy: 'usr_002', createdAt: '2025-11-01T08:00:00Z', updatedAt: '2026-10-11T14:45:00Z', isShared: true },
  { id: 'col_003', name: 'QR Code Records', description: 'Documents containing QR codes and barcodes', category: 'qr_barcode', documentCount: 128, createdBy: 'usr_001', createdAt: '2026-03-01T09:00:00Z', updatedAt: '2026-10-13T15:30:00Z', isShared: false },
  { id: 'col_004', name: 'CSE Semester 5 — Certificates', description: 'Filtered: CSE, Semester 5 only', category: 'certificate', documentCount: 67, createdBy: 'usr_001', createdAt: '2026-09-10T11:00:00Z', updatedAt: '2026-10-12T10:00:00Z', isShared: true },
  { id: 'col_005', name: 'Missing Enrollment Numbers', description: 'Certificates where enrollment number is missing or uncertain', category: 'certificate', documentCount: 14, createdBy: 'usr_001', createdAt: '2026-10-01T14:00:00Z', updatedAt: '2026-10-13T08:00:00Z', isShared: false },
];

// ─── Mock Saved Filters ───────────────────────────────────────────────────────
export const MOCK_SAVED_FILTERS: SavedFilter[] = [
  {
    id: 'sf_001', name: 'CSE Semester 5 Certificates', description: 'Department = CSE and Semester = 5',
    category: 'certificate',
    filterDefinition: { rootGroup: { id: 'g1', operator: 'AND', conditions: [{ id: 'c1', fieldId: 'department', fieldLabel: 'Department', fieldType: 'select', operator: 'equals', value: 'Computer Science & Engineering' }, { id: 'c2', fieldId: 'semester', fieldLabel: 'Semester', fieldType: 'select', operator: 'equals', value: '5' }] } },
    createdBy: 'usr_001', createdAt: '2026-09-20T10:00:00Z', updatedAt: '2026-09-20T10:00:00Z', isShared: true, usageCount: 12,
  },
  {
    id: 'sf_002', name: 'Low-Confidence Extractions', description: 'Confidence below 75%',
    filterDefinition: { rootGroup: { id: 'g1', operator: 'AND', conditions: [{ id: 'c1', fieldId: 'confidence', fieldLabel: 'Confidence', fieldType: 'confidence', operator: 'less_than', value: 0.75 }] } },
    createdBy: 'usr_001', createdAt: '2026-10-01T08:00:00Z', updatedAt: '2026-10-01T08:00:00Z', isShared: false, usageCount: 5,
  },
  {
    id: 'sf_003', name: 'Back Exam Papers 2025', description: 'Back examination papers for year 2025',
    category: 'question_paper',
    filterDefinition: { rootGroup: { id: 'g1', operator: 'AND', conditions: [{ id: 'c1', fieldId: 'examination_type', fieldLabel: 'Examination Type', fieldType: 'select', operator: 'equals', value: 'Back' }, { id: 'c2', fieldId: 'examination_year', fieldLabel: 'Examination Year', fieldType: 'number', operator: 'equals', value: 2025 }] } },
    createdBy: 'usr_002', createdAt: '2026-10-05T11:00:00Z', updatedAt: '2026-10-05T11:00:00Z', isShared: true, usageCount: 8,
  },
  {
    id: 'sf_004', name: 'Missing Enrollment Numbers', description: 'Certificates with missing enrollment',
    category: 'certificate',
    filterDefinition: { rootGroup: { id: 'g1', operator: 'AND', conditions: [{ id: 'c1', fieldId: 'enrollment_number', fieldLabel: 'Enrollment Number', fieldType: 'text', operator: 'is_empty', value: null }] } },
    createdBy: 'usr_001', createdAt: '2026-10-08T09:00:00Z', updatedAt: '2026-10-08T09:00:00Z', isShared: false, usageCount: 3,
  },
  {
    id: 'sf_005', name: 'Documents with QR Codes', description: 'All documents containing QR codes',
    filterDefinition: { rootGroup: { id: 'g1', operator: 'AND', conditions: [{ id: 'c1', fieldId: 'has_qr_code', fieldLabel: 'Has QR Code', fieldType: 'boolean', operator: 'true', value: true }] } },
    createdBy: 'usr_001', createdAt: '2026-10-10T14:00:00Z', updatedAt: '2026-10-10T14:00:00Z', isShared: true, usageCount: 7,
  },
];

// ─── Mock Audit Events ────────────────────────────────────────────────────────
export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  { id: 'ae_001', type: 'document_upload', userId: 'usr_001', userName: 'Dr. Priya Sharma', resourceType: 'document', resourceId: 'doc_010', resourceName: 'QR_Student_ID_Card_24TEC078.jpg', description: 'Uploaded 1 document to QR Code Records collection', createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 'ae_002', type: 'metadata_edit', userId: 'usr_001', userName: 'Dr. Priya Sharma', resourceType: 'document', resourceId: 'doc_003', resourceName: 'Certificate_24TEC045_Ananya_Patel.pdf', description: 'Corrected enrollment_number field from uncertain value', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'ae_003', type: 'filter_saved', userId: 'usr_001', userName: 'Dr. Priya Sharma', resourceType: 'filter', resourceId: 'sf_005', resourceName: 'Documents with QR Codes', description: 'Saved new filter configuration', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'ae_004', type: 'export_created', userId: 'usr_002', userName: 'Prof. Rajesh Agarwal', resourceType: 'document', resourceId: 'col_002', resourceName: 'Examination Question Papers 2025', description: 'Exported 23 question papers to CSV', createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: 'ae_005', type: 'job_retried', userId: 'usr_001', userName: 'Dr. Priya Sharma', resourceType: 'job', resourceId: 'job_003', resourceName: 'Annual_Report_SKIT_2025-26.pdf', description: 'Retried failed processing job', createdAt: new Date(Date.now() - 18000000).toISOString() },
];

// ─── Mock Dashboard Metrics ───────────────────────────────────────────────────
export const MOCK_DASHBOARD_METRICS: DashboardMetrics = {
  totalDocuments: 4287,
  processedDocuments: 3948,
  processingDocuments: 23,
  reviewRequired: 142,
  failedJobs: 18,
  detectedCategories: 7,
  qrBarcodeRecords: 1234,
  missingMetadata: 89,
  lastUpdated: new Date().toISOString(),
};

export const MOCK_CATEGORY_DISTRIBUTION: DocumentTypeDistribution[] = [
  { category: 'certificate', label: 'Certificates', count: 1842, percentage: 42.9 },
  { category: 'question_paper', label: 'Question Papers', count: 1245, percentage: 29.0 },
  { category: 'invoice', label: 'Invoices', count: 456, percentage: 10.6 },
  { category: 'form', label: 'Forms / Applications', count: 378, percentage: 8.8 },
  { category: 'report', label: 'Reports', count: 198, percentage: 4.6 },
  { category: 'qr_barcode', label: 'QR/Barcode Records', count: 108, percentage: 2.5 },
  { category: 'general', label: 'General Documents', count: 60, percentage: 1.6 },
];

// ─── Mock Metadata Fields ─────────────────────────────────────────────────────
export const MOCK_CERTIFICATE_FIELDS: MetadataField[] = [
  { id: 'student_name', label: 'Student Name', type: 'text', isSearchable: true, isFilterable: true, isSortable: true, recordCount: 1842, missingCount: 3 },
  { id: 'enrollment_number', label: 'Enrollment Number', type: 'identifier', isSearchable: true, isFilterable: true, isSortable: true, recordCount: 1842, missingCount: 14 },
  { id: 'department', label: 'Department', type: 'multi_select', isSearchable: true, isFilterable: true, isSortable: true, recordCount: 1842, missingCount: 0, availableValues: [{ value: 'Computer Science & Engineering', label: 'CSE', count: 487 }, { value: 'Electronics & Communication', label: 'ECE', count: 342 }, { value: 'Mechanical Engineering', label: 'ME', count: 298 }, { value: 'Civil Engineering', label: 'CE', count: 215 }, { value: 'Information Technology', label: 'IT', count: 312 }, { value: 'Physics', label: 'Physics', count: 188 }] },
  { id: 'semester', label: 'Semester', type: 'select', isSearchable: false, isFilterable: true, isSortable: true, recordCount: 1842, missingCount: 5, availableValues: [1, 2, 3, 4, 5, 6, 7, 8].map(s => ({ value: String(s), label: `Semester ${s}`, count: Math.floor(Math.random() * 280) + 120 })) },
  { id: 'academic_year', label: 'Academic Year', type: 'select', isSearchable: false, isFilterable: true, isSortable: true, recordCount: 1842, missingCount: 8, availableValues: ['2022-23', '2023-24', '2024-25', '2025-26', '2026-27'].map(y => ({ value: y, label: y, count: Math.floor(Math.random() * 400) + 100 })) },
  { id: 'certificate_type', label: 'Certificate Type', type: 'multi_select', isSearchable: false, isFilterable: true, isSortable: false, recordCount: 1842, missingCount: 12, availableValues: ['Merit Certificate', 'Distinction Certificate', 'Participation Certificate', 'Scholarship Certificate', 'Achievement Certificate'].map(t => ({ value: t, label: t, count: Math.floor(Math.random() * 400) + 50 })) },
  { id: 'certificate_id', label: 'Certificate ID', type: 'identifier', isSearchable: true, isFilterable: true, isSortable: false, recordCount: 1842, missingCount: 2 },
  { id: 'issue_date', label: 'Issue Date', type: 'date', isSearchable: false, isFilterable: true, isSortable: true, recordCount: 1834, missingCount: 8 },
  { id: 'phone_number', label: 'Phone Number', type: 'text', isSearchable: false, isFilterable: false, isSortable: false, recordCount: 1012, missingCount: 830 },
  { id: 'qr_payload', label: 'QR Payload', type: 'identifier', isSearchable: true, isFilterable: true, isSortable: false, recordCount: 987, missingCount: 855 },
  { id: 'has_qr_code', label: 'Has QR Code', type: 'boolean', isSearchable: false, isFilterable: true, isSortable: false, recordCount: 1842, missingCount: 0 },
  { id: 'confidence', label: 'Extraction Confidence', type: 'confidence', isSearchable: false, isFilterable: true, isSortable: true, recordCount: 1842, missingCount: 0 },
  { id: 'processingStatus', label: 'Processing Status', type: 'status', isSearchable: false, isFilterable: true, isSortable: false, recordCount: 1842, missingCount: 0, availableValues: ['completed', 'review_required', 'failed', 'processing'].map(s => ({ value: s, label: s, count: 0 })) },
];

export const MOCK_QP_FIELDS: MetadataField[] = [
  { id: 'institution', label: 'Institution', type: 'text', isSearchable: true, isFilterable: false, isSortable: false, recordCount: 1245, missingCount: 0 },
  { id: 'department', label: 'Department', type: 'multi_select', isSearchable: true, isFilterable: true, isSortable: true, recordCount: 1245, missingCount: 0, availableValues: [{ value: 'Computer Science & Engineering', label: 'CSE', count: 312 }, { value: 'Electronics & Communication', label: 'ECE', count: 245 }, { value: 'Mechanical Engineering', label: 'ME', count: 198 }, { value: 'Civil Engineering', label: 'CE', count: 187 }, { value: 'Information Technology', label: 'IT', count: 178 }, { value: 'Basic Science', label: 'Basic Science', count: 125 }] },
  { id: 'course_code', label: 'Course Code', type: 'identifier', isSearchable: true, isFilterable: true, isSortable: true, recordCount: 1245, missingCount: 18 },
  { id: 'course_name', label: 'Course / Subject Name', type: 'text', isSearchable: true, isFilterable: false, isSortable: true, recordCount: 1245, missingCount: 8 },
  { id: 'semester', label: 'Semester', type: 'select', isSearchable: false, isFilterable: true, isSortable: true, recordCount: 1245, missingCount: 2, availableValues: [1, 2, 3, 4, 5, 6, 7, 8].map(s => ({ value: String(s), label: `Semester ${s}`, count: Math.floor(Math.random() * 200) + 50 })) },
  { id: 'examination_type', label: 'Examination Type', type: 'select', isSearchable: false, isFilterable: true, isSortable: false, recordCount: 1245, missingCount: 5, availableValues: [{ value: 'Main', label: 'Main', count: 876 }, { value: 'Back', label: 'Back', count: 312 }, { value: 'Supplementary', label: 'Supplementary', count: 45 }, { value: 'Practical', label: 'Practical', count: 12 }] },
  { id: 'examination_year', label: 'Examination Year', type: 'number', isSearchable: false, isFilterable: true, isSortable: true, recordCount: 1245, missingCount: 3 },
  { id: 'examination_date', label: 'Examination Date', type: 'date', isSearchable: false, isFilterable: true, isSortable: true, recordCount: 1127, missingCount: 118 },
  { id: 'duration', label: 'Duration (Hours)', type: 'number', isSearchable: false, isFilterable: true, isSortable: true, recordCount: 1245, missingCount: 12, availableValues: [{ value: '2', label: '2 Hours', count: 234 }, { value: '3', label: '3 Hours', count: 978 }, { value: '1.5', label: '1.5 Hours', count: 33 }] },
  { id: 'max_marks', label: 'Maximum Marks', type: 'number', isSearchable: false, isFilterable: true, isSortable: true, recordCount: 1245, missingCount: 8 },
  { id: 'paper_id', label: 'Paper Identifier', type: 'identifier', isSearchable: true, isFilterable: true, isSortable: false, recordCount: 834, missingCount: 411 },
  { id: 'confidence', label: 'Extraction Confidence', type: 'confidence', isSearchable: false, isFilterable: true, isSortable: true, recordCount: 1245, missingCount: 0 },
  { id: 'processingStatus', label: 'Processing Status', type: 'status', isSearchable: false, isFilterable: true, isSortable: false, recordCount: 1245, missingCount: 0 },
];

// ─── Mock Users ───────────────────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  { id: 'usr_001', email: 'admin@skit.ac.in', name: 'Dr. Priya Sharma', role: 'document_admin', department: 'Computer Science', isActive: true, lastLoginAt: new Date(Date.now() - 3600000).toISOString(), createdAt: '2024-08-01T00:00:00Z', permissions: [] },
  { id: 'usr_002', email: 'rajesh.agarwal@skit.ac.in', name: 'Prof. Rajesh Agarwal', role: 'faculty', department: 'Electronics & Communication', isActive: true, lastLoginAt: new Date(Date.now() - 86400000).toISOString(), createdAt: '2024-08-01T00:00:00Z', permissions: [] },
  { id: 'usr_003', email: 'accounts@skit.ac.in', name: 'Meena Verma', role: 'document_admin', department: 'Finance', isActive: true, lastLoginAt: new Date(Date.now() - 172800000).toISOString(), createdAt: '2024-09-01T00:00:00Z', permissions: [] },
  { id: 'usr_004', email: 'suresh.kumar@skit.ac.in', name: 'Dr. Suresh Kumar', role: 'faculty', department: 'Physics', isActive: true, lastLoginAt: new Date(Date.now() - 604800000).toISOString(), createdAt: '2024-08-01T00:00:00Z', permissions: [] },
  { id: 'usr_005', email: 'principal@skit.ac.in', name: 'Prof. A.K. Joshi', role: 'super_admin', department: 'Administration', isActive: true, lastLoginAt: new Date(Date.now() - 259200000).toISOString(), createdAt: '2024-07-01T00:00:00Z', permissions: [] },
  { id: 'usr_006', email: '24tec001@skit.ac.in', name: 'Rahul Sharma', role: 'student', department: 'Computer Science', isActive: true, lastLoginAt: new Date(Date.now() - 432000000).toISOString(), createdAt: '2024-08-15T00:00:00Z', permissions: [] },
];

// Upload files mock for the upload page
export const createMockUploadFiles = (files: File[]): UploadFile[] =>
  files.map(f => ({
    id: Math.random().toString(36).slice(2),
    file: f,
    name: f.name,
    sizeBytes: f.size,
    mimeType: f.type,
    status: 'ready',
    progress: 0,
  }));
