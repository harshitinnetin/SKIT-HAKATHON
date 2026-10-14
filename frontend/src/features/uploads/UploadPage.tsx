import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, X, File, CheckCircle2, AlertTriangle, Loader2,
  ChevronRight, ChevronLeft, FolderOpen, Settings2, Play, RotateCcw
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Button, Badge, Progress, SelectNative, Checkbox, Label, Switch, Separator
} from '@/components/ui';
import { formatBytes, getCategoryLabel, getStatusColor, cn } from '@/lib/utils';
import type { UploadFile, DocumentCategory, ProcessingOptions } from '@/types';

type Step = 1 | 2 | 3 | 4 | 5;

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/zip'];
const MAX_FILE_SIZE_MB = 100;

export function UploadPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [category, setCategory] = useState<DocumentCategory | 'auto'>('auto');
  const [options, setOptions] = useState<ProcessingOptions>({
    ocrEnabled: true,
    qrDetectionEnabled: true,
    classificationEnabled: true,
    extractionEnabled: true,
    generateSummary: true,
  });
  const [simulatingUpload, setSimulatingUpload] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(f => {
      const isDuplicate = files.some(ef => ef.name === f.name && ef.sizeBytes === f.size);
      const isInvalid = !ACCEPTED_TYPES.includes(f.type) || f.size > MAX_FILE_SIZE_MB * 1024 * 1024;
      return {
        id: Math.random().toString(36).slice(2),
        file: f,
        name: f.name,
        sizeBytes: f.size,
        mimeType: f.type,
        status: isDuplicate ? 'duplicate_warning' : isInvalid ? 'failed' : 'ready',
        progress: 0,
        errorMessage: isInvalid
          ? (!ACCEPTED_TYPES.includes(f.type) ? 'Unsupported file type' : `File exceeds ${MAX_FILE_SIZE_MB}MB limit`)
          : undefined,
        isDuplicate,
      };
    });
    setFiles(prev => [...prev, ...uploadFiles]);
  }, [files]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  const simulateUpload = () => {
    setSimulatingUpload(true);
    setStep(5);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 8;
      setOverallProgress(Math.min(100, progress));
      setFiles(prev => prev.map(f => ({
        ...f,
        status: f.status === 'ready' ? (progress < 30 ? 'uploading' : progress < 60 ? 'queued' : progress < 90 ? 'processing' : 'completed') : f.status,
        progress: f.status === 'ready' || f.status === 'uploading' ? Math.min(100, progress) : f.progress,
      })));
      if (progress >= 100) {
        clearInterval(interval);
        setSimulatingUpload(false);
      }
    }, 200);
  };

  const readyCount = files.filter(f => f.status === 'ready').length;
  const warningCount = files.filter(f => f.status === 'duplicate_warning').length;
  const errorCount = files.filter(f => f.status === 'failed').length;

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-base font-semibold">Upload Documents</h1>
        <p className="text-xs text-muted-foreground">Add documents for AI classification, OCR and metadata extraction</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-6 overflow-x-auto">
        {[
          { n: 1, label: 'Select Files' },
          { n: 2, label: 'Review & Validate' },
          { n: 3, label: 'Category' },
          { n: 4, label: 'Processing Options' },
          { n: 5, label: 'Upload & Monitor' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            {i > 0 && <div className="h-px flex-1 bg-border min-w-4" />}
            <div className={cn(
              'flex items-center gap-1.5 shrink-0',
              step === s.n ? 'text-primary' : step > s.n ? 'text-emerald-600' : 'text-muted-foreground'
            )}>
              <div className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border-2',
                step === s.n ? 'border-primary bg-primary text-white' :
                step > s.n ? 'border-emerald-500 bg-emerald-500 text-white' :
                'border-border bg-background'
              )}>
                {step > s.n ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.n}
              </div>
              <span className="text-xs font-medium hidden sm:block">{s.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select files */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            className={cn(
              'relative rounded-xl border-2 border-dashed p-10 text-center transition-colors',
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30',
            )}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(',')}
              className="sr-only"
              onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)); }}
              id="file-upload-input"
            />
            <Upload className={cn('h-10 w-10 mx-auto mb-3', isDragging ? 'text-primary' : 'text-muted-foreground/50')} />
            <div className="text-sm font-medium mb-1">Drop files here or click to browse</div>
            <div className="text-xs text-muted-foreground">Supports PDF, JPG, JPEG, PNG, ZIP · Max {MAX_FILE_SIZE_MB}MB per file</div>
          </div>

          {files.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>{files.length} file{files.length !== 1 ? 's' : ''} selected</span>
                <button type="button" className="text-destructive hover:underline" onClick={() => setFiles([])}>Remove all</button>
              </div>
              {files.slice(0, 5).map(f => (
                <FileListItem key={f.id} file={f} onRemove={() => removeFile(f.id)} />
              ))}
              {files.length > 5 && (
                <div className="text-xs text-center text-muted-foreground py-1">
                  + {files.length - 5} more files
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button disabled={files.length === 0} onClick={() => setStep(2)}>
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Selected Files</CardTitle>
              <CardDescription>
                {readyCount} ready · {warningCount} duplicate warnings · {errorCount} errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin">
                {files.map(f => <FileListItem key={f.id} file={f} onRemove={() => removeFile(f.id)} showWarnings />)}
              </div>
            </CardContent>
          </Card>
          {warningCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {warningCount} file{warningCount > 1 ? 's are' : ' is'} potentially duplicate. Review before continuing.
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="h-4 w-4" /> Back</Button>
            <Button onClick={() => setStep(3)}>Continue <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Step 3: Category */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Document Category</CardTitle>
              <CardDescription>Choose a category or let AI classify automatically</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {([
                { value: 'auto', label: 'Auto Classify (recommended)', desc: 'AI will detect the document type automatically' },
                { value: 'certificate', label: 'Student Certificates', desc: 'Academic and achievement certificates' },
                { value: 'question_paper', label: 'Question Papers', desc: 'Examination papers (main/back)' },
                { value: 'invoice', label: 'Invoices & Financial', desc: 'Purchase orders, invoices, receipts' },
                { value: 'form', label: 'Forms & Applications', desc: 'Leave forms, admission applications' },
                { value: 'report', label: 'Reports', desc: 'Annual reports, project reports' },
                { value: 'general', label: 'General Documents', desc: 'Other unclassified documents' },
              ] as { value: DocumentCategory | 'auto'; label: string; desc: string }[]).map(opt => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    category === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'
                  )}
                >
                  <input type="radio" name="category" value={opt.value} checked={category === opt.value}
                    onChange={() => setCategory(opt.value)} className="accent-primary" />
                  <div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="h-4 w-4" /> Back</Button>
            <Button onClick={() => setStep(4)}>Continue <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Step 4: Processing Options */}
      {step === 4 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Options</CardTitle>
              <CardDescription>Configure what AI operations to perform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                { key: 'ocrEnabled', label: 'OCR & Text Extraction', desc: 'Extract text from PDFs and images using Baidu OCR' },
                { key: 'qrDetectionEnabled', label: 'QR / Barcode Detection', desc: 'Detect and decode QR codes and barcodes' },
                { key: 'classificationEnabled', label: 'AI Classification', desc: 'Automatically classify document type' },
                { key: 'extractionEnabled', label: 'Metadata Extraction', desc: 'Extract structured fields (enrollment, dates, etc.)' },
                { key: 'generateSummary', label: 'AI Summary Generation', desc: 'Generate a concise document summary' },
              ] as { key: keyof ProcessingOptions; label: string; desc: string }[]).map(opt => (
                <div key={opt.key} className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.desc}</div>
                  </div>
                  <Switch
                    checked={options[opt.key]}
                    onCheckedChange={v => setOptions(prev => ({ ...prev, [opt.key]: v }))}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            Processing is performed by the backend. Simulated operations below are for demonstration only.
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}><ChevronLeft className="h-4 w-4" /> Back</Button>
            <Button onClick={simulateUpload}>
              <Play className="h-4 w-4 mr-1" /> Start Upload & Processing
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Progress */}
      {step === 5 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload & Processing Status</CardTitle>
              <CardDescription>
                {simulatingUpload ? 'Simulated upload in progress — real processing requires backend connection.' : 'Upload simulation complete.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Overall progress</span>
                  <span className="font-medium">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
                {files.map(f => (
                  <div key={f.id} className="flex items-center gap-2.5 rounded-md border px-3 py-2">
                    <div className={cn('h-2 w-2 rounded-full shrink-0', {
                      'bg-emerald-500': f.status === 'completed',
                      'bg-blue-500 animate-pulse': f.status === 'uploading' || f.status === 'processing',
                      'bg-amber-400': f.status === 'queued',
                      'bg-red-500': f.status === 'failed',
                      'bg-gray-300': f.status === 'ready',
                    })} />
                    <span className="text-xs flex-1 truncate">{f.name}</span>
                    <Badge className={`text-[10px] border ${getStatusColor(
                      f.status === 'completed' ? 'completed' :
                      f.status === 'uploading' ? 'uploading' :
                      f.status === 'processing' ? 'processing' :
                      f.status === 'queued' ? 'queued' :
                      f.status === 'failed' ? 'failed' : 'ready'
                    )}`} variant="outline">
                      {f.status.replace(/_/g, ' ')}
                    </Badge>
                    {f.progress > 0 && f.status !== 'completed' && (
                      <span className="text-[10px] text-muted-foreground w-8 text-right">{f.progress}%</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {!simulatingUpload && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => navigate('/processing')}>View Processing Queue</Button>
              <Button onClick={() => navigate('/documents')}>View All Documents</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface FileListItemProps {
  file: UploadFile;
  onRemove: () => void;
  showWarnings?: boolean;
}

function FileListItem({ file, onRemove, showWarnings }: FileListItemProps) {
  const ext = file.name.split('.').pop()?.toUpperCase() ?? 'FILE';
  return (
    <div className={cn(
      'flex items-center gap-2.5 rounded-md border px-3 py-2',
      file.status === 'duplicate_warning' && showWarnings ? 'border-amber-200 bg-amber-50' :
      file.status === 'failed' ? 'border-red-200 bg-red-50' : 'border-border'
    )}>
      <div className="h-8 w-8 shrink-0 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
        {ext}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{file.name}</div>
        <div className="text-[10px] text-muted-foreground">{formatBytes(file.sizeBytes)}</div>
        {showWarnings && file.status === 'duplicate_warning' && (
          <div className="text-[10px] text-amber-700 flex items-center gap-1 mt-0.5">
            <AlertTriangle className="h-2.5 w-2.5" /> Possible duplicate detected
          </div>
        )}
        {file.errorMessage && (
          <div className="text-[10px] text-red-600 flex items-center gap-1 mt-0.5">
            <AlertTriangle className="h-2.5 w-2.5" /> {file.errorMessage}
          </div>
        )}
      </div>
      <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive p-1 rounded">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
