import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Award, QrCode, AlertTriangle, X, Eye, Download } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Button, Input, Badge, Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell, EmptyState, SelectNative, Separator
} from '@/components/ui';
import { MOCK_DOCUMENTS, MOCK_CERTIFICATE_FIELDS } from '@/mocks/data';
import {
  getStatusColor, getStatusLabel, getConfidenceColor, formatConfidence,
  formatRelativeTime, truncateFilename, cn
} from '@/lib/utils';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { DocumentPreviewSheet } from '@/components/document-preview/DocumentPreviewSheet';
import type { Document } from '@/types';

export function CertificatesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const certs = useMemo(() => {
    let docs = MOCK_DOCUMENTS.filter(d => d.category === 'certificate');
    if (search) {
      const q = search.toLowerCase();
      docs = docs.filter(d =>
        d.name.toLowerCase().includes(q) ||
        String(d.metadata.student_name?.value ?? '').toLowerCase().includes(q) ||
        String(d.metadata.enrollment_number?.value ?? '').toLowerCase().includes(q)
      );
    }
    if (departmentFilter) docs = docs.filter(d => String(d.metadata.department?.value ?? '') === departmentFilter);
    if (semesterFilter) docs = docs.filter(d => String(d.metadata.semester?.value ?? '') === semesterFilter);
    if (typeFilter) docs = docs.filter(d => String(d.metadata.certificate_type?.value ?? '') === typeFilter);
    return docs;
  }, [search, departmentFilter, semesterFilter, typeFilter]);

  const deptField = MOCK_CERTIFICATE_FIELDS.find(f => f.id === 'department');
  const semField = MOCK_CERTIFICATE_FIELDS.find(f => f.id === 'semester');
  const typeField = MOCK_CERTIFICATE_FIELDS.find(f => f.id === 'certificate_type');

  const stats = {
    total: MOCK_DOCUMENTS.filter(d => d.category === 'certificate').length,
    withQR: MOCK_DOCUMENTS.filter(d => d.category === 'certificate' && d.hasQrCode).length,
    needsReview: MOCK_DOCUMENTS.filter(d => d.category === 'certificate' && d.processingStatus === 'review_required').length,
    missingEnrollment: MOCK_DOCUMENTS.filter(d => d.category === 'certificate' && d.metadata.enrollment_number?.validationState !== 'valid').length,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-4 pb-3 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center">
              <Award className="h-4 w-4 text-blue-700" />
            </div>
            <div>
              <h1 className="text-base font-semibold">Certificate Repository</h1>
              <p className="text-xs text-muted-foreground">{stats.total.toLocaleString()} certificates · {certs.length} shown</p>
            </div>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mb-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-foreground' },
            { label: 'With QR Code', value: stats.withQR, color: 'text-cyan-700' },
            { label: 'Needs Review', value: stats.needsReview, color: 'text-amber-700' },
            { label: 'Missing Enrollment', value: stats.missingEnrollment, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-lg font-bold leading-none ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-40 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search by name, enrollment…" className="pl-8 h-8 text-xs"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <SelectNative className="h-8 text-xs w-48" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
            <option value="">All Departments</option>
            {deptField?.availableValues?.map(v => <option key={v.value} value={v.value}>{v.label} ({v.count})</option>)}
          </SelectNative>
          <SelectNative className="h-8 text-xs w-32" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)}>
            <option value="">All Semesters</option>
            {semField?.availableValues?.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </SelectNative>
          <SelectNative className="h-8 text-xs w-48" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Certificate Types</option>
            {typeField?.availableValues?.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </SelectNative>
          {(search || departmentFilter || semesterFilter || typeFilter) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground"
              onClick={() => { setSearch(''); setDepartmentFilter(''); setSemesterFilter(''); setTypeFilter(''); }}>
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-[1]">
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Enrollment No.</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Certificate Type</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>QR</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certs.map(doc => {
              const m = doc.metadata;
              return (
                <TableRow key={doc.id} className="cursor-pointer" onClick={() => navigate(`/documents/${doc.id}`)}>
                  <TableCell>
                    <div className="text-xs font-medium">{String(m.student_name?.value ?? '—')}</div>
                  </TableCell>
                  <TableCell>
                    <span className={cn('text-xs font-mono', m.enrollment_number?.validationState === 'uncertain' ? 'text-amber-700' : m.enrollment_number?.validationState === 'missing' ? 'text-red-500 italic' : '')}>
                      {String(m.enrollment_number?.value ?? '—')}
                      {m.enrollment_number?.validationState === 'uncertain' && ' ⚠'}
                    </span>
                  </TableCell>
                  <TableCell><span className="text-xs truncate max-w-[140px] block">{String(m.department?.value ?? '—')}</span></TableCell>
                  <TableCell><span className="text-xs">{String(m.semester?.value ?? '—')}</span></TableCell>
                  <TableCell><span className="text-xs">{String(m.certificate_type?.value ?? '—')}</span></TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{m.issue_date?.value ? formatRelativeTime(String(m.issue_date.value)) : '—'}</span></TableCell>
                  <TableCell>
                    {doc.hasQrCode ? <QrCode className="h-3.5 w-3.5 text-cyan-600" /> : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] border ${getStatusColor(doc.processingStatus)}`} variant="outline">
                      {getStatusLabel(doc.processingStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {doc.confidence !== undefined ? (
                      <span className={`text-xs font-medium ${getConfidenceColor(doc.confidence)}`}>{formatConfidence(doc.confidence)}</span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={() => setPreviewId(doc.id)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {certs.length === 0 && (
          <EmptyState
            icon={<Award className="h-10 w-10" />}
            title="No certificates found"
            description="Try adjusting your filters."
          />
        )}
      </div>

      {previewId && (
        <DocumentPreviewSheet
          documentId={previewId}
          onClose={() => setPreviewId(null)}
          onViewFull={(id) => { setPreviewId(null); navigate(`/documents/${id}`); }}
        />
      )}
    </div>
  );
}
