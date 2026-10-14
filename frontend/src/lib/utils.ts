import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { DocumentCategory, ProcessingStatus, ProcessingStage, UserRole, FilterFieldType, CodeType, CodeVerificationStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(dateVal: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...opts,
  }).format(new Date(dateVal));
}

export function formatRelativeTime(dateVal: string | Date): string {
  const date = new Date(dateVal);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateVal);
}

export function formatConfidence(confidence: number | undefined): string {
  if (confidence === undefined) return '—';
  return `${Math.round(confidence * 100)}%`;
}

export function getCategoryLabel(category: DocumentCategory | 'auto'): string {
  const labels: Record<string, string> = {
    certificate: 'Certificate',
    question_paper: 'Question Paper',
    invoice: 'Invoice',
    form: 'Form / Application',
    report: 'Report',
    qr_barcode: 'QR / Barcode Record',
    general: 'General Document',
    auto: 'Auto Classify',
  };
  return labels[category] ?? category;
}

export function getCategoryColor(category: DocumentCategory): string {
  const colors: Record<DocumentCategory, string> = {
    certificate: 'bg-blue-100 text-blue-800 border-blue-200',
    question_paper: 'bg-purple-100 text-purple-800 border-purple-200',
    invoice: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    form: 'bg-amber-100 text-amber-800 border-amber-200',
    report: 'bg-slate-100 text-slate-700 border-slate-200',
    qr_barcode: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    general: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return colors[category] ?? 'bg-gray-100 text-gray-700 border-gray-200';
}

export function getStatusLabel(status: ProcessingStatus): string {
  const labels: Record<ProcessingStatus, string> = {
    ready: 'Ready',
    uploading: 'Uploading',
    queued: 'Queued',
    processing: 'Processing',
    ocr_completed: 'OCR Done',
    extraction_completed: 'Extracted',
    review_required: 'Needs Review',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };
  return labels[status] ?? status;
}

export function getStatusColor(status: ProcessingStatus): string {
  switch (status) {
    case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'processing':
    case 'ocr_completed':
    case 'extraction_completed': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'queued': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'review_required': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'failed': return 'bg-red-100 text-red-800 border-red-200';
    case 'cancelled': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getStageLabel(stage: ProcessingStage): string {
  const labels: Record<ProcessingStage, string> = {
    uploading: 'Uploading',
    queued: 'Waiting in Queue',
    pdf_extraction: 'PDF Text Extraction',
    ocr_parsing: 'OCR & Layout Parsing',
    qr_barcode_detection: 'QR/Barcode Detection',
    classification: 'Classification',
    metadata_extraction: 'Metadata Extraction',
    validation: 'Validation',
    summary_generation: 'Summary Generation',
    indexing: 'Indexing',
    completed: 'Completed',
  };
  return labels[stage] ?? stage;
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    document_admin: 'Document Admin',
    faculty: 'Faculty / Staff',
    student: 'Student',
    auditor: 'Auditor / Reviewer',
  };
  return labels[role] ?? role;
}

export function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'super_admin': return 'bg-red-100 text-red-800 border-red-200';
    case 'document_admin': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'faculty': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'student': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'auditor': return 'bg-amber-100 text-amber-800 border-amber-200';
  }
}

export function getFilterFieldTypeLabel(type: FilterFieldType): string {
  const labels: Record<FilterFieldType, string> = {
    text: 'Text',
    number: 'Number',
    date: 'Date',
    boolean: 'Boolean',
    select: 'Select',
    multi_select: 'Multi-Select',
    confidence: 'Confidence',
    status: 'Status',
    identifier: 'Identifier',
  };
  return labels[type] ?? type;
}

export function getCodeTypeLabel(type: CodeType): string {
  const labels: Record<CodeType, string> = {
    qr_code: 'QR Code',
    barcode_1d: '1D Barcode',
    barcode_2d: '2D Barcode',
    data_matrix: 'Data Matrix',
    pdf417: 'PDF417',
    aztec: 'Aztec',
  };
  return labels[type] ?? type;
}

export function getVerificationStatusLabel(status: CodeVerificationStatus): string {
  const labels: Record<CodeVerificationStatus, string> = {
    unverified: 'Unverified',
    verified: 'Verified',
    invalid: 'Invalid',
    unresolved: 'Unresolved',
  };
  return labels[status] ?? status;
}

export function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.65) return 'medium';
  return 'low';
}

export function getConfidenceColor(confidence: number): string {
  const level = getConfidenceLevel(confidence);
  if (level === 'high') return 'text-emerald-600';
  if (level === 'medium') return 'text-amber-600';
  return 'text-red-600';
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function truncateFilename(name: string, maxLength = 40): string {
  if (name.length <= maxLength) return name;
  const ext = name.lastIndexOf('.');
  if (ext > 0) {
    const base = name.slice(0, ext);
    const extension = name.slice(ext);
    const truncated = base.slice(0, maxLength - extension.length - 3) + '…';
    return truncated + extension;
  }
  return name.slice(0, maxLength - 3) + '…';
}

export function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
