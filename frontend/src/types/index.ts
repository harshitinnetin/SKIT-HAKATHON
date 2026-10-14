// ─────────────────────────────────────────────
// Core Domain Types for DocIntel Platform
// ─────────────────────────────────────────────

export type DocumentCategory =
  | 'certificate'
  | 'question_paper'
  | 'invoice'
  | 'form'
  | 'report'
  | 'qr_barcode'
  | 'general';

export type ProcessingStatus =
  | 'ready'
  | 'uploading'
  | 'queued'
  | 'processing'
  | 'ocr_completed'
  | 'extraction_completed'
  | 'review_required'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ValidationState = 'valid' | 'invalid' | 'uncertain' | 'missing' | 'unreviewed';

export type ExaminationType = 'main' | 'back' | 'supplementary' | 'practical';

export interface Document {
  id: string;
  name: string;
  originalFileName: string;
  category: DocumentCategory;
  mimeType: string;
  fileSizeBytes: number;
  pageCount?: number;
  uploadedAt: string;
  updatedAt: string;
  uploadedBy: string;
  processingStatus: ProcessingStatus;
  confidence?: number;
  collectionIds: string[];
  hasQrCode: boolean;
  hasBarcodes: boolean;
  reviewStatus: 'pending' | 'reviewed' | 'approved' | 'rejected';
  validationIssues: ValidationIssue[];
  metadata: Record<string, ExtractedField>;
  summary?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  sourceUrl?: string;
}

export interface ExtractedField {
  fieldName: string;
  canonicalName?: string;
  value: string | number | boolean | null;
  rawValue?: string;
  confidence?: number;
  validationState: ValidationState;
  sourcePage?: number;
  sourceRegion?: BoundingBox;
  editedBy?: string;
  editedAt?: string;
  originalValue?: string | number | boolean | null;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export interface ValidationIssue {
  id: string;
  fieldName: string;
  severity: 'error' | 'warning' | 'info';
  type: 'missing' | 'conflicting' | 'invalid_format' | 'duplicate' | 'low_confidence' | 'unresolved_qr';
  message: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface SourceReference {
  page: number;
  region?: BoundingBox;
  snippet?: string;
  confidence?: number;
}

// ─── Filter Types ───────────────────────────

export type FilterOperator =
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'greater_than' | 'less_than'
  | 'greater_than_or_equal' | 'less_than_or_equal'
  | 'between'
  | 'in' | 'not_in'
  | 'is_empty' | 'is_not_empty'
  | 'before' | 'after'
  | 'true' | 'false';

export type FilterFieldType =
  | 'text' | 'number' | 'date' | 'boolean'
  | 'select' | 'multi_select'
  | 'confidence' | 'status' | 'identifier';

export interface MetadataField {
  id: string;
  label: string;
  canonicalName?: string;
  type: FilterFieldType;
  category?: DocumentCategory;
  isSearchable: boolean;
  isFilterable: boolean;
  isSortable: boolean;
  availableValues?: { value: string; label: string; count: number }[];
  recordCount?: number;
  missingCount?: number;
  description?: string;
}

export interface FilterCondition {
  id: string;
  fieldId: string;
  fieldLabel: string;
  fieldType: FilterFieldType;
  operator: FilterOperator;
  value: string | number | boolean | string[] | [number, number] | [string, string] | null;
  negated?: boolean;
}

export type FilterGroupOperator = 'AND' | 'OR';

export interface FilterGroup {
  id: string;
  operator: FilterGroupOperator;
  conditions: FilterCondition[];
  groups?: FilterGroup[];
}

export interface FilterDefinition {
  rootGroup: FilterGroup;
}

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  category?: DocumentCategory;
  filterDefinition: FilterDefinition;
  sortBy?: SortConfig[];
  groupBy?: string;
  columnConfig?: ColumnConfig[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
  usageCount: number;
}

export interface SortConfig {
  fieldId: string;
  direction: 'asc' | 'desc';
}

export interface ColumnConfig {
  id: string;
  visible: boolean;
  width?: number;
  order: number;
}

// ─── Collection Types ────────────────────────

export interface Collection {
  id: string;
  name: string;
  description?: string;
  category?: DocumentCategory;
  documentCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
  savedFilterId?: string;
  thumbnailUrl?: string;
}

// ─── Upload and Processing Types ────────────

export type UploadFileStatus =
  | 'ready' | 'uploading' | 'upload_complete'
  | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'duplicate_warning';

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  mimeType: string;
  status: UploadFileStatus;
  progress: number;
  errorMessage?: string;
  documentId?: string;
  isDuplicate?: boolean;
}

export interface UploadJob {
  id: string;
  files: UploadFile[];
  category: DocumentCategory | 'auto';
  processingOptions: ProcessingOptions;
  startedAt?: string;
  completedAt?: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
}

export interface ProcessingOptions {
  ocrEnabled: boolean;
  qrDetectionEnabled: boolean;
  classificationEnabled: boolean;
  extractionEnabled: boolean;
  generateSummary: boolean;
}

export type ProcessingStage =
  | 'uploading' | 'queued' | 'pdf_extraction'
  | 'ocr_parsing' | 'qr_barcode_detection'
  | 'classification' | 'metadata_extraction'
  | 'validation' | 'summary_generation'
  | 'indexing' | 'completed';

export interface ProcessingJob {
  id: string;
  documentId: string;
  documentName: string;
  category?: DocumentCategory;
  stage: ProcessingStage;
  progress?: number;
  status: ProcessingStatus;
  startedAt: string;
  updatedAt: string;
  durationMs?: number;
  errorMessage?: string;
  retryCount: number;
}

// ─── QR / Barcode Types ──────────────────────

export type CodeType = 'qr_code' | 'barcode_1d' | 'barcode_2d' | 'data_matrix' | 'pdf417' | 'aztec';

export type CodeVerificationStatus = 'unverified' | 'verified' | 'invalid' | 'unresolved';

export interface QRBarcodeRecord {
  id: string;
  documentId: string;
  documentName: string;
  codeType: CodeType;
  rawValue: string;
  parsedIdentifier?: string;
  resolvedEntity?: string;
  sourcePage: number;
  detectionConfidence?: number;
  verificationStatus: CodeVerificationStatus;
  extractionStatus: 'success' | 'partial' | 'failed';
  createdAt: string;
}

// ─── User / Auth Types ───────────────────────

export type UserRole =
  | 'super_admin' | 'document_admin' | 'faculty' | 'student' | 'auditor';

export interface Permission {
  resource: string;
  actions: ('read' | 'write' | 'delete' | 'export' | 'manage')[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  permissions: Permission[];
}

export interface AuthSession {
  user: User;
  accessToken: string;
  expiresAt: string;
}

// ─── Audit Types ─────────────────────────────

export type AuditEventType =
  | 'document_upload' | 'document_download' | 'document_delete'
  | 'metadata_edit' | 'field_reviewed' | 'filter_saved'
  | 'collection_created' | 'user_invited' | 'role_changed'
  | 'export_created' | 'job_retried';

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  userId: string;
  userName: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── Dashboard Types ─────────────────────────

export interface DashboardMetrics {
  totalDocuments: number;
  processedDocuments: number;
  processingDocuments: number;
  reviewRequired: number;
  failedJobs: number;
  detectedCategories: number;
  qrBarcodeRecords: number;
  missingMetadata: number;
  lastUpdated: string;
}

export interface DocumentTypeDistribution {
  category: DocumentCategory;
  label: string;
  count: number;
  percentage: number;
}

// ─── API Response Types ───────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
