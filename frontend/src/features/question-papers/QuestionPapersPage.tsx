import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Eye, Download, X } from 'lucide-react';
import {
  Button, Input, Badge, Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell, EmptyState, SelectNative
} from '@/components/ui';
import { MOCK_DOCUMENTS, MOCK_QP_FIELDS } from '@/mocks/data';
import {
  getStatusColor, getStatusLabel, getConfidenceColor, formatConfidence,
  formatRelativeTime, cn
} from '@/lib/utils';
import { DocumentPreviewSheet } from '@/components/document-preview/DocumentPreviewSheet';

export function QuestionPapersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);

  const papers = useMemo(() => {
    let docs = MOCK_DOCUMENTS.filter(d => d.category === 'question_paper');
    if (search) {
      const q = search.toLowerCase();
      docs = docs.filter(d =>
        d.name.toLowerCase().includes(q) ||
        String(d.metadata.course_code?.value ?? '').toLowerCase().includes(q) ||
        String(d.metadata.course_name?.value ?? '').toLowerCase().includes(q)
      );
    }
    if (deptFilter) docs = docs.filter(d => String(d.metadata.department?.value ?? '') === deptFilter);
    if (semFilter) docs = docs.filter(d => String(d.metadata.semester?.value ?? '') === semFilter);
    if (typeFilter) docs = docs.filter(d => String(d.metadata.examination_type?.value ?? '') === typeFilter);
    if (yearFilter) docs = docs.filter(d => String(d.metadata.examination_year?.value ?? '') === yearFilter);
    return docs;
  }, [search, deptFilter, semFilter, typeFilter, yearFilter]);

  const deptField = MOCK_QP_FIELDS.find(f => f.id === 'department');
  const semField = MOCK_QP_FIELDS.find(f => f.id === 'semester');
  const examTypeField = MOCK_QP_FIELDS.find(f => f.id === 'examination_type');

  const stats = {
    total: MOCK_DOCUMENTS.filter(d => d.category === 'question_paper').length,
    main: MOCK_DOCUMENTS.filter(d => d.category === 'question_paper' && d.metadata.examination_type?.value === 'Main').length,
    back: MOCK_DOCUMENTS.filter(d => d.category === 'question_paper' && d.metadata.examination_type?.value === 'Back').length,
    missingCode: MOCK_DOCUMENTS.filter(d => d.category === 'question_paper' && !d.metadata.course_code?.value).length,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-4 pb-3 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-purple-100 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-purple-700" />
            </div>
            <div>
              <h1 className="text-base font-semibold">Question Paper Repository</h1>
              <p className="text-xs text-muted-foreground">{stats.total.toLocaleString()} papers · {papers.length} shown</p>
            </div>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-3">
          {[
            { label: 'Total Papers', value: stats.total },
            { label: 'Main Exam', value: stats.main, color: 'text-blue-700' },
            { label: 'Back Exam', value: stats.back, color: 'text-amber-700' },
            { label: 'Missing Course Code', value: stats.missingCode, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-lg font-bold leading-none ${s.color ?? 'text-foreground'}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-40 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search course code, subject…" className="pl-8 h-8 text-xs"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <SelectNative className="h-8 text-xs w-48" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {deptField?.availableValues?.map(v => <option key={v.value} value={v.value}>{v.label} ({v.count})</option>)}
          </SelectNative>
          <SelectNative className="h-8 text-xs w-32" value={semFilter} onChange={e => setSemFilter(e.target.value)}>
            <option value="">All Semesters</option>
            {semField?.availableValues?.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </SelectNative>
          <SelectNative className="h-8 text-xs w-32" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {examTypeField?.availableValues?.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </SelectNative>
          <SelectNative className="h-8 text-xs w-24" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
            <option value="">All Years</option>
            {['2023', '2024', '2025', '2026'].map(y => <option key={y} value={y}>{y}</option>)}
          </SelectNative>
          {(search || deptFilter || semFilter || typeFilter || yearFilter) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground"
              onClick={() => { setSearch(''); setDeptFilter(''); setSemFilter(''); setTypeFilter(''); setYearFilter(''); }}>
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-[1]">
            <TableRow>
              <TableHead>Course Code</TableHead>
              <TableHead>Subject Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Exam Type</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Max Marks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {papers.map(doc => {
              const m = doc.metadata;
              const examType = String(m.examination_type?.value ?? '');
              return (
                <TableRow key={doc.id} className="cursor-pointer" onClick={() => navigate(`/documents/${doc.id}`)}>
                  <TableCell>
                    <span className={cn('text-xs font-mono font-medium', !m.course_code?.value ? 'text-red-500 italic' : '')}>
                      {String(m.course_code?.value ?? 'Missing')}
                    </span>
                  </TableCell>
                  <TableCell><span className="text-xs truncate max-w-[160px] block">{String(m.course_name?.value ?? '—')}</span></TableCell>
                  <TableCell><span className="text-xs truncate max-w-[120px] block">{String(m.department?.value ?? '—')}</span></TableCell>
                  <TableCell><span className="text-xs">{String(m.semester?.value ?? '—')}</span></TableCell>
                  <TableCell>
                    {examType ? (
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] border', examType === 'Back' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-blue-200 bg-blue-50 text-blue-800')}
                      >
                        {examType}
                      </Badge>
                    ) : '—'}
                  </TableCell>
                  <TableCell><span className="text-xs">{String(m.examination_year?.value ?? '—')}</span></TableCell>
                  <TableCell><span className="text-xs">{m.duration?.value ? `${m.duration.value}h` : '—'}</span></TableCell>
                  <TableCell><span className="text-xs">{String(m.max_marks?.value ?? '—')}</span></TableCell>
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
        {papers.length === 0 && (
          <EmptyState icon={<BookOpen className="h-10 w-10" />} title="No question papers found" description="Adjust filters or upload papers." />
        )}
      </div>

      {previewId && (
        <DocumentPreviewSheet documentId={previewId} onClose={() => setPreviewId(null)}
          onViewFull={id => { setPreviewId(null); navigate(`/documents/${id}`); }} />
      )}
    </div>
  );
}
