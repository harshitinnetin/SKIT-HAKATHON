import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Filter, SlidersHorizontal, LayoutGrid, LayoutList,
  Download, Trash2, Plus, X, ChevronLeft, ChevronRight,
  Eye, MoreHorizontal, RotateCcw, RefreshCw, FolderPlus,
  QrCode, CheckCircle2, Columns3
} from 'lucide-react';
import {
  Card, CardContent, Button, Input, Badge, Checkbox,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel, EmptyState, SelectNative, Tooltip
} from '@/components/ui';
import { MOCK_DOCUMENTS } from '@/mocks/data';
import { useAppStore } from '@/store/app-store';
import {
  getCategoryColor, getCategoryLabel, getStatusColor, getStatusLabel,
  getConfidenceColor, formatConfidence, formatBytes, formatRelativeTime,
  truncateFilename, cn
} from '@/lib/utils';
import type { Document, DocumentCategory, ProcessingStatus } from '@/types';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { ActiveFilterChips } from '@/components/filters/ActiveFilterChips';
import { DocumentPreviewSheet } from '@/components/document-preview/DocumentPreviewSheet';

const VISIBLE_COLUMNS_DEFAULT = ['name', 'category', 'department', 'status', 'confidence', 'uploadedAt', 'actions'];

export function DocumentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    documentSearch, setDocumentSearch,
    documentFilters, setDocumentFilters,
    documentSort, setDocumentSort,
    documentPage, setDocumentPage,
    documentView, setDocumentView,
    documentPageSize, setDocumentPageSize,
    selectedDocumentIds, setSelectedDocumentIds, toggleSelectedDocument,
  } = useAppStore();

  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(VISIBLE_COLUMNS_DEFAULT);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  // Read search from URL param too
  const urlSearch = searchParams.get('q') ?? '';
  const effectiveSearch = urlSearch || documentSearch;

  const statusFilter = searchParams.get('status') as ProcessingStatus | null;
  const categoryFilter = searchParams.get('category') as DocumentCategory | null;

  // ── Filter + search documents locally (mock) ───────────────────────────────
  const filteredDocs = useMemo(() => {
    let docs = [...MOCK_DOCUMENTS];

    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      docs = docs.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.category.includes(q) ||
        Object.values(d.metadata).some(f => String(f.value ?? '').toLowerCase().includes(q))
      );
    }
    if (statusFilter) docs = docs.filter(d => d.processingStatus === statusFilter);
    if (categoryFilter) docs = docs.filter(d => d.category === categoryFilter);

    return docs;
  }, [effectiveSearch, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / documentPageSize));
  const pagedDocs = filteredDocs.slice((documentPage - 1) * documentPageSize, documentPage * documentPageSize);

  const isAllSelected = pagedDocs.length > 0 && pagedDocs.every(d => selectedDocumentIds.includes(d.id));
  const isIndeterminate = !isAllSelected && pagedDocs.some(d => selectedDocumentIds.includes(d.id));

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedDocumentIds(selectedDocumentIds.filter(id => !pagedDocs.find(d => d.id === id)));
    } else {
      setSelectedDocumentIds([...new Set([...selectedDocumentIds, ...pagedDocs.map(d => d.id)])]);
    }
  };

  const activeFilterCount = documentFilters?.rootGroup.conditions.length ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-5 pt-4 pb-3 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-semibold">All Documents</h1>
            <p className="text-xs text-muted-foreground">
              {filteredDocs.length.toLocaleString()} documents
              {effectiveSearch && ` matching "${effectiveSearch}"`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
            <Button size="sm" className="h-7 text-xs gap-1.5" onClick={() => navigate('/upload')}>
              <Plus className="h-3 w-3" />
              Upload
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, metadata, enrollment…"
              className="pl-8 h-8 text-xs"
              value={documentSearch}
              onChange={e => { setDocumentSearch(e.target.value); setSearchParams({}); }}
              id="documents-search-input"
            />
            {documentSearch && (
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setDocumentSearch('')}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter */}
          <Button
            variant="outline"
            size="sm"
            className={cn('h-8 text-xs gap-1.5', filterPanelOpen && 'bg-primary/10 border-primary/30 text-primary')}
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="default" className="h-4 min-w-4 px-1 text-[9px]">{activeFilterCount}</Badge>
            )}
          </Button>

          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => navigate('/documents/query-builder')}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Query Builder
          </Button>

          {/* Sort */}
          <div className="hidden md:flex items-center gap-1">
            <SelectNative
              className="h-8 text-xs w-40"
              value={documentSort[0]?.fieldId ?? ''}
              onChange={e => setDocumentSort(e.target.value ? [{ fieldId: e.target.value, direction: 'desc' }] : [])}
            >
              <option value="">Sort by…</option>
              <option value="uploadedAt">Upload Date</option>
              <option value="name">Name</option>
              <option value="confidence">Confidence</option>
              <option value="processingStatus">Status</option>
            </SelectNative>
          </div>

          {/* View toggle */}
          <div className="flex items-center border rounded-md overflow-hidden ml-auto">
            <button
              type="button"
              className={cn('px-2 py-1.5 text-xs transition-colors', documentView === 'table' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50')}
              onClick={() => setDocumentView('table')}
              aria-label="Table view"
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={cn('px-2 py-1.5 text-xs transition-colors', documentView === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50')}
              onClick={() => setDocumentView('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Columns toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="icon-sm" className="h-8 w-8" aria-label="Configure columns">
                <Columns3 className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
              {['name', 'category', 'department', 'enrollment_number', 'status', 'confidence', 'uploadedAt', 'qr_code', 'actions'].map(col => (
                <DropdownMenuItem key={col} onClick={() => {
                  setVisibleColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
                }}>
                  <Checkbox checked={visibleColumns.includes(col)} className="mr-2" readOnly />
                  {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active filters */}
        {activeFilterCount > 0 && (
          <ActiveFilterChips
            filters={documentFilters!}
            onRemoveCondition={(condId) => {
              if (!documentFilters) return;
              const newConditions = documentFilters.rootGroup.conditions.filter(c => c.id !== condId);
              setDocumentFilters(newConditions.length > 0 ? { ...documentFilters, rootGroup: { ...documentFilters.rootGroup, conditions: newConditions } } : null);
            }}
            onClearAll={() => setDocumentFilters(null)}
          />
        )}
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Filter panel */}
        {filterPanelOpen && (
          <FilterPanel
            onClose={() => setFilterPanelOpen(false)}
            filters={documentFilters}
            onFiltersChange={setDocumentFilters}
          />
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-0">
          {/* Bulk action bar */}
          {selectedDocumentIds.length > 0 && (
            <div className="sticky top-0 z-10 flex items-center gap-3 bg-primary text-primary-foreground px-5 py-2.5 text-sm">
              <span className="font-medium">{selectedDocumentIds.length} selected</span>
              <div className="flex items-center gap-1.5 ml-2">
                <Button variant="secondary" size="sm" className="h-7 text-xs bg-white/20 hover:bg-white/30 border-0 text-white">
                  <Download className="h-3.5 w-3.5 mr-1" /> Export
                </Button>
                <Button variant="secondary" size="sm" className="h-7 text-xs bg-white/20 hover:bg-white/30 border-0 text-white">
                  <FolderPlus className="h-3.5 w-3.5 mr-1" /> Add to Collection
                </Button>
                <Button variant="secondary" size="sm" className="h-7 text-xs bg-white/20 hover:bg-white/30 border-0 text-white">
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reprocess
                </Button>
                <Button variant="secondary" size="sm" className="h-7 text-xs bg-red-500/80 hover:bg-red-500 border-0 text-white ml-2">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </div>
              <button type="button" className="ml-auto" onClick={() => setSelectedDocumentIds([])}>
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {documentView === 'table' ? (
            <DocumentTable
              documents={pagedDocs}
              selectedIds={selectedDocumentIds}
              onToggleAll={toggleAll}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
              onToggleRow={toggleSelectedDocument}
              onPreview={(id) => setPreviewDocId(id)}
              onViewDetail={(id) => navigate(`/documents/${id}`)}
              visibleColumns={visibleColumns}
            />
          ) : (
            <DocumentGrid
              documents={pagedDocs}
              onPreview={(id) => setPreviewDocId(id)}
              onViewDetail={(id) => navigate(`/documents/${id}`)}
            />
          )}

          {filteredDocs.length === 0 && (
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="No documents found"
              description={effectiveSearch ? `No results for "${effectiveSearch}". Try adjusting your search or filters.` : 'Upload documents to get started.'}
              action={
                <Button size="sm" onClick={() => navigate('/upload')}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Upload Documents
                </Button>
              }
            />
          )}

          {/* Pagination */}
          {filteredDocs.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t bg-white sticky bottom-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Showing {Math.min((documentPage - 1) * documentPageSize + 1, filteredDocs.length)}–{Math.min(documentPage * documentPageSize, filteredDocs.length)} of {filteredDocs.length}
                </span>
                <SelectNative
                  className="h-7 text-xs w-20"
                  value={String(documentPageSize)}
                  onChange={e => { setDocumentPageSize(Number(e.target.value)); setDocumentPage(1); }}
                >
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
                </SelectNative>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon-sm" className="h-7 w-7" onClick={() => setDocumentPage(Math.max(1, documentPage - 1))} disabled={documentPage === 1}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      type="button"
                      className={cn('h-7 w-7 text-xs rounded border transition-colors', page === documentPage ? 'bg-primary text-white border-primary' : 'border-input hover:bg-accent')}
                      onClick={() => setDocumentPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="text-xs text-muted-foreground px-1">…</span>}
                <Button variant="outline" size="icon-sm" className="h-7 w-7" onClick={() => setDocumentPage(Math.min(totalPages, documentPage + 1))} disabled={documentPage === totalPages}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview drawer */}
      {previewDocId && (
        <DocumentPreviewSheet
          documentId={previewDocId}
          onClose={() => setPreviewDocId(null)}
          onViewFull={(id) => { setPreviewDocId(null); navigate(`/documents/${id}`); }}
        />
      )}
    </div>
  );
}

// ─── Document Table ───────────────────────────────────────────────────────────
interface DocumentTableProps {
  documents: Document[];
  selectedIds: string[];
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onToggleAll: () => void;
  onToggleRow: (id: string) => void;
  onPreview: (id: string) => void;
  onViewDetail: (id: string) => void;
  visibleColumns: string[];
}

function DocumentTable({ documents, selectedIds, isAllSelected, isIndeterminate, onToggleAll, onToggleRow, onPreview, onViewDetail, visibleColumns }: DocumentTableProps) {
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-white z-[1]">
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={isAllSelected}
              ref={el => { if (el) (el as HTMLInputElement).indeterminate = isIndeterminate; }}
              onCheckedChange={onToggleAll}
              aria-label="Select all"
            />
          </TableHead>
          {visibleColumns.includes('name') && <TableHead>Document</TableHead>}
          {visibleColumns.includes('category') && <TableHead className="hidden md:table-cell">Category</TableHead>}
          {visibleColumns.includes('department') && <TableHead className="hidden lg:table-cell">Department</TableHead>}
          {visibleColumns.includes('enrollment_number') && <TableHead className="hidden xl:table-cell">Enrollment</TableHead>}
          {visibleColumns.includes('status') && <TableHead>Status</TableHead>}
          {visibleColumns.includes('confidence') && <TableHead className="hidden lg:table-cell">Confidence</TableHead>}
          {visibleColumns.includes('qr_code') && <TableHead className="hidden xl:table-cell">QR/BC</TableHead>}
          {visibleColumns.includes('uploadedAt') && <TableHead className="hidden md:table-cell">Uploaded</TableHead>}
          {visibleColumns.includes('actions') && <TableHead className="w-24 text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map(doc => (
          <TableRow
            key={doc.id}
            data-state={selectedIds.includes(doc.id) ? 'selected' : undefined}
            className="cursor-pointer"
          >
            <TableCell onClick={e => e.stopPropagation()}>
              <Checkbox
                checked={selectedIds.includes(doc.id)}
                onCheckedChange={() => onToggleRow(doc.id)}
                aria-label={`Select ${doc.name}`}
              />
            </TableCell>
            {visibleColumns.includes('name') && (
              <TableCell onClick={() => onViewDetail(doc.id)}>
                <div className="flex items-center gap-2.5">
                  <div className={`h-7 w-7 shrink-0 rounded text-[10px] font-bold flex items-center justify-center border ${getCategoryColor(doc.category)}`}>
                    {getCategoryLabel(doc.category).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate max-w-xs">{truncateFilename(doc.name, 50)}</div>
                    <div className="text-[10px] text-muted-foreground">{formatBytes(doc.fileSizeBytes)}{doc.pageCount ? ` · ${doc.pageCount}p` : ''}</div>
                  </div>
                </div>
              </TableCell>
            )}
            {visibleColumns.includes('category') && (
              <TableCell className="hidden md:table-cell" onClick={() => onViewDetail(doc.id)}>
                <Badge className={`text-[10px] border ${getCategoryColor(doc.category)}`} variant="outline">
                  {getCategoryLabel(doc.category)}
                </Badge>
              </TableCell>
            )}
            {visibleColumns.includes('department') && (
              <TableCell className="hidden lg:table-cell" onClick={() => onViewDetail(doc.id)}>
                <span className="text-xs text-muted-foreground truncate max-w-[140px] block">
                  {(doc.metadata.department?.value as string) ?? '—'}
                </span>
              </TableCell>
            )}
            {visibleColumns.includes('enrollment_number') && (
              <TableCell className="hidden xl:table-cell" onClick={() => onViewDetail(doc.id)}>
                <span className="text-xs font-mono">{(doc.metadata.enrollment_number?.value as string) ?? '—'}</span>
              </TableCell>
            )}
            {visibleColumns.includes('status') && (
              <TableCell onClick={() => onViewDetail(doc.id)}>
                <Badge className={`text-[10px] border ${getStatusColor(doc.processingStatus)}`} variant="outline">
                  {getStatusLabel(doc.processingStatus)}
                </Badge>
              </TableCell>
            )}
            {visibleColumns.includes('confidence') && (
              <TableCell className="hidden lg:table-cell" onClick={() => onViewDetail(doc.id)}>
                {doc.confidence !== undefined ? (
                  <span className={`text-xs font-medium ${getConfidenceColor(doc.confidence)}`}>
                    {formatConfidence(doc.confidence)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            )}
            {visibleColumns.includes('qr_code') && (
              <TableCell className="hidden xl:table-cell" onClick={() => onViewDetail(doc.id)}>
                {doc.hasQrCode || doc.hasBarcodes ? (
                  <Tooltip content={doc.hasQrCode ? 'Has QR code' : 'Has barcode'}>
                    <QrCode className="h-3.5 w-3.5 text-cyan-600" />
                  </Tooltip>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            )}
            {visibleColumns.includes('uploadedAt') && (
              <TableCell className="hidden md:table-cell" onClick={() => onViewDetail(doc.id)}>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(doc.uploadedAt)}</span>
              </TableCell>
            )}
            {visibleColumns.includes('actions') && (
              <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-0.5">
                  <Tooltip content="Preview">
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                      onClick={() => onPreview(doc.id)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </Tooltip>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <button type="button" className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetail(doc.id)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Metadata</DropdownMenuItem>
                      <DropdownMenuItem>Reprocess</DropdownMenuItem>
                      <DropdownMenuItem>Add to Collection</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Download</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Document Grid ─────────────────────────────────────────────────────────────
interface DocumentGridProps {
  documents: Document[];
  onPreview: (id: string) => void;
  onViewDetail: (id: string) => void;
}

function DocumentGrid({ documents, onPreview, onViewDetail }: DocumentGridProps) {
  return (
    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {documents.map(doc => (
        <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => onViewDetail(doc.id)}>
          <CardContent className="p-3">
            <div className={`h-20 rounded-md mb-2.5 flex items-center justify-center text-2xl font-bold border ${getCategoryColor(doc.category)}`}>
              {getCategoryLabel(doc.category).slice(0, 2).toUpperCase()}
            </div>
            <div className="text-[11px] font-medium truncate">{truncateFilename(doc.name, 30)}</div>
            <div className="flex items-center justify-between mt-1.5">
              <Badge className={`text-[9px] border ${getStatusColor(doc.processingStatus)}`} variant="outline">
                {getStatusLabel(doc.processingStatus)}
              </Badge>
              {doc.confidence !== undefined && (
                <span className={`text-[10px] font-medium ${getConfidenceColor(doc.confidence)}`}>{formatConfidence(doc.confidence)}</span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(doc.uploadedAt)}</div>
            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1 px-1" onClick={e => { e.stopPropagation(); onPreview(doc.id); }}>
                <Eye className="h-3 w-3 mr-0.5" /> Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
