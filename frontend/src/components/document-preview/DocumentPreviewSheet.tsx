import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText, AlertTriangle, CheckCircle2, Edit3, QrCode } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  Badge, Button, ScrollArea, Separator, Progress
} from '@/components/ui';
import { MOCK_DOCUMENTS } from '@/mocks/data';
import {
  getCategoryLabel, getCategoryColor, getStatusLabel, getStatusColor,
  getConfidenceColor, formatConfidence, formatDate, formatBytes, cn
} from '@/lib/utils';
import type { Document, ExtractedField } from '@/types';

interface DocumentPreviewSheetProps {
  documentId: string;
  onClose: () => void;
  onViewFull: (id: string) => void;
}

export function DocumentPreviewSheet({ documentId, onClose, onViewFull }: DocumentPreviewSheetProps) {
  const [activeTab, setActiveTab] = useState<'metadata' | 'validation' | 'qr'>('metadata');
  const doc = MOCK_DOCUMENTS.find(d => d.id === documentId);

  if (!doc) return null;

  const metadataEntries = Object.entries(doc.metadata);
  const validationIssues = doc.validationIssues;
  const qrEntries = metadataEntries.filter(([k]) => k.includes('qr') || k.includes('barcode'));

  return (
    <Sheet open onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-5 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`text-[10px] border ${getCategoryColor(doc.category)}`} variant="outline">
                  {getCategoryLabel(doc.category)}
                </Badge>
                <Badge className={`text-[10px] border ${getStatusColor(doc.processingStatus)}`} variant="outline">
                  {getStatusLabel(doc.processingStatus)}
                </Badge>
              </div>
              <SheetTitle className="text-sm truncate pr-4">{doc.name}</SheetTitle>
              <div className="text-xs text-muted-foreground mt-0.5">
                {formatBytes(doc.fileSizeBytes)}{doc.pageCount ? ` · ${doc.pageCount} pages` : ''} · Uploaded {formatDate(doc.uploadedAt)}
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1 rounded hover:bg-accent text-muted-foreground shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex border-b">
          {[
            { id: 'metadata', label: 'Extracted Metadata', count: metadataEntries.length },
            { id: 'validation', label: 'Validation', count: validationIssues.length },
            { id: 'qr', label: 'QR/Barcodes', count: qrEntries.length },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  'inline-flex h-4 min-w-4 items-center justify-center rounded-full text-[9px] px-1',
                  tab.id === 'validation' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <ScrollArea className="flex-1">
          {activeTab === 'metadata' && (
            <div className="p-5 space-y-4">
              {/* Document preview placeholder */}
              <div className="h-40 rounded-lg border bg-muted/30 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <FileText className="h-8 w-8 opacity-40" />
                <div className="text-xs">PDF preview loads when backend is connected</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 opacity-60" disabled>
                    <ZoomOut className="h-3 w-3" /> Zoom
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 opacity-60" disabled>
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-xs self-center">p. 1 / {doc.pageCount ?? 1}</span>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 opacity-60" disabled>
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* AI Summary */}
              {doc.summary && (
                <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                  <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">AI Summary</div>
                  <p className="text-xs text-blue-900">{doc.summary}</p>
                  <p className="text-[10px] text-blue-600 mt-1 italic">Generated by AI — verify against original document</p>
                </div>
              )}

              {/* Overall confidence */}
              {doc.confidence !== undefined && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Overall Extraction Confidence</span>
                    <span className={`font-semibold ${getConfidenceColor(doc.confidence)}`}>
                      {formatConfidence(doc.confidence)}
                    </span>
                  </div>
                  <Progress value={doc.confidence * 100} className="h-1.5" />
                </div>
              )}

              <Separator />

              {/* Fields */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Extracted Fields ({metadataEntries.length})</div>
                <div className="space-y-1.5">
                  {metadataEntries.map(([key, field]) => (
                    <FieldRow key={key} fieldKey={key} field={field} />
                  ))}
                  {metadataEntries.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No metadata extracted yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="p-5 space-y-3">
              {validationIssues.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                  <div className="text-sm font-medium">All fields validated</div>
                  <div className="text-xs text-muted-foreground">No validation issues found for this document.</div>
                </div>
              ) : (
                validationIssues.map(issue => (
                  <div
                    key={issue.id}
                    className={cn(
                      'rounded-md border p-3',
                      issue.severity === 'error' ? 'border-red-200 bg-red-50' :
                      issue.severity === 'warning' ? 'border-amber-200 bg-amber-50' :
                      'border-blue-200 bg-blue-50'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={cn(
                        'h-3.5 w-3.5 mt-0.5 shrink-0',
                        issue.severity === 'error' ? 'text-red-600' :
                        issue.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'
                      )} />
                      <div>
                        <div className="text-xs font-medium">{issue.fieldName.replace(/_/g, ' ')}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{issue.message}</div>
                        <div className="flex gap-1 mt-1.5">
                          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
                            <Edit3 className="h-2.5 w-2.5 mr-1" /> Correct
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">
                            Mark as Reviewed
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="p-5 space-y-3">
              {!doc.hasQrCode && !doc.hasBarcodes ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <QrCode className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <div className="text-sm font-medium">No codes detected</div>
                  <div className="text-xs text-muted-foreground">No QR codes or barcodes found in this document.</div>
                </div>
              ) : (
                qrEntries.map(([key, field]) => (
                  <div key={key} className="rounded-md border p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <QrCode className="h-3.5 w-3.5 text-cyan-600" />
                      <span className="text-xs font-medium">{field.fieldName}</span>
                    </div>
                    <div className="font-mono text-xs bg-muted rounded px-2 py-1 break-all">
                      {String(field.value ?? '—')}
                    </div>
                    {field.confidence !== undefined && (
                      <div className="text-[10px] text-muted-foreground">
                        Detection confidence: <span className={getConfidenceColor(field.confidence)}>{formatConfidence(field.confidence)}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-amber-600 italic">
                      Raw decoded value shown. Do not treat as verified URL without backend validation.
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-5 py-3 flex items-center gap-2 bg-white">
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
          <Button size="sm" className="text-xs h-8 gap-1.5 ml-auto" onClick={() => onViewFull(documentId)}>
            View Full Details
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Field Row ─────────────────────────────────────────────────────────────────
interface FieldRowProps {
  fieldKey: string;
  field: ExtractedField;
}

function FieldRow({ fieldKey, field }: FieldRowProps) {
  const isMissing = field.validationState === 'missing' || field.value === null;
  const isUncertain = field.validationState === 'uncertain';

  return (
    <div className={cn(
      'flex items-start justify-between gap-3 rounded px-2 py-1.5 text-xs',
      isMissing ? 'bg-red-50/50' : isUncertain ? 'bg-amber-50/50' : 'hover:bg-muted/30'
    )}>
      <span className="text-muted-foreground shrink-0 w-36 truncate">{field.fieldName}</span>
      <div className="flex-1 min-w-0 text-right">
        {isMissing ? (
          <span className="text-red-500 italic">Missing</span>
        ) : (
          <span className={cn('font-medium break-words', isUncertain ? 'text-amber-700' : 'text-foreground')}>
            {String(field.value)}
          </span>
        )}
        {field.confidence !== undefined && (
          <span className={cn('ml-2 text-[10px]', getConfidenceColor(field.confidence))}>
            {formatConfidence(field.confidence)}
          </span>
        )}
      </div>
    </div>
  );
}
