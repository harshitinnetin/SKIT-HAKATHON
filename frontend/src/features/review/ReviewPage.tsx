import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckSquare, Eye, Edit3, Check, X, Filter, Search
} from 'lucide-react';
import {
  Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead,
  TableCell, EmptyState, Input, SelectNative, Alert, AlertTitle, AlertDescription
} from '@/components/ui';
import { MOCK_DOCUMENTS } from '@/mocks/data';
import {
  getCategoryLabel, getCategoryColor, getConfidenceColor, formatConfidence,
  formatRelativeTime, truncateFilename
} from '@/lib/utils';
import { DocumentPreviewSheet } from '@/components/document-preview/DocumentPreviewSheet';

export function ReviewPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | 'missing' | 'low_confidence' | 'conflicting'>('');
  const [previewId, setPreviewId] = useState<string | null>(null);

  const docsNeedingReview = MOCK_DOCUMENTS.filter(d =>
    d.processingStatus === 'review_required' ||
    d.validationIssues.some(i => i.severity === 'error' || i.severity === 'warning') ||
    (d.confidence !== undefined && d.confidence < 0.75)
  );

  const filtered = docsNeedingReview.filter(d => {
    if (search) {
      const q = search.toLowerCase();
      if (!d.name.toLowerCase().includes(q)) return false;
    }
    if (typeFilter === 'missing') return d.validationIssues.some(i => i.type === 'missing');
    if (typeFilter === 'low_confidence') return d.confidence !== undefined && d.confidence < 0.75;
    if (typeFilter === 'conflicting') return d.validationIssues.some(i => i.type === 'conflicting');
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-4 pb-3 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-amber-100 flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <h1 className="text-base font-semibold">Review & Validation</h1>
              <p className="text-xs text-muted-foreground">{docsNeedingReview.length} documents requiring attention</p>
            </div>
          </div>
        </div>

        <Alert variant="warning" className="mb-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Manual Review Required</AlertTitle>
          <AlertDescription>
            The following documents have validation issues, low-confidence extractions, or missing fields. 
            Review each record against the original document before approving.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-40 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search documents…" className="pl-8 h-8 text-xs"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <SelectNative className="h-8 text-xs w-48" value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
            <option value="">All Issues</option>
            <option value="missing">Missing Fields</option>
            <option value="low_confidence">Low Confidence</option>
            <option value="conflicting">Conflicting Values</option>
          </SelectNative>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-[1]">
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Issues</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(doc => (
              <TableRow key={doc.id} className="cursor-pointer" onClick={() => navigate(`/documents/${doc.id}`)}>
                <TableCell>
                  <div className="text-xs font-medium truncate max-w-[200px]">{truncateFilename(doc.name, 45)}</div>
                </TableCell>
                <TableCell>
                  <Badge className={`text-[10px] border ${getCategoryColor(doc.category)}`} variant="outline">
                    {getCategoryLabel(doc.category)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    {doc.validationIssues.slice(0, 2).map(issue => (
                      <div key={issue.id} className="flex items-center gap-1 text-[10px]">
                        <AlertTriangle className={`h-2.5 w-2.5 shrink-0 ${issue.severity === 'error' ? 'text-red-500' : 'text-amber-500'}`} />
                        <span className="truncate max-w-[180px] text-muted-foreground">{issue.message}</span>
                      </div>
                    ))}
                    {doc.confidence !== undefined && doc.confidence < 0.75 && doc.validationIssues.length === 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-600">
                        <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                        Low extraction confidence
                      </div>
                    )}
                    {doc.validationIssues.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{doc.validationIssues.length - 2} more issues</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {doc.confidence !== undefined ? (
                    <span className={`text-xs font-medium ${getConfidenceColor(doc.confidence)}`}>{formatConfidence(doc.confidence)}</span>
                  ) : '—'}
                </TableCell>
                <TableCell><span className="text-xs text-muted-foreground">{formatRelativeTime(doc.uploadedAt)}</span></TableCell>
                <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2" onClick={() => setPreviewId(doc.id)}>
                      <Eye className="h-3 w-3" /> Review
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2">
                      <Check className="h-3 w-3 mr-0.5" /> Approve
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2">
                      <X className="h-3 w-3 mr-0.5" /> Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <EmptyState
            icon={<CheckSquare className="h-10 w-10 text-emerald-400" />}
            title="All caught up!"
            description="No documents require review at this time."
          />
        )}
      </div>

      {previewId && (
        <DocumentPreviewSheet documentId={previewId} onClose={() => setPreviewId(null)}
          onViewFull={id => { setPreviewId(null); navigate(`/documents/${id}`); }} />
      )}
    </div>
  );
}
