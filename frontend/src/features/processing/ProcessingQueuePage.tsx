import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, RotateCcw, ExternalLink, AlertTriangle, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import {
  Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Progress, EmptyState, SelectNative
} from '@/components/ui';
import { MOCK_PROCESSING_JOBS } from '@/mocks/data';
import { getStageLabel, getStatusColor, getStatusLabel, formatRelativeTime, truncateFilename, cn } from '@/lib/utils';
import type { ProcessingStatus } from '@/types';

export function ProcessingQueuePage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'' | ProcessingStatus>('');

  const jobs = statusFilter
    ? MOCK_PROCESSING_JOBS.filter(j => j.status === statusFilter)
    : MOCK_PROCESSING_JOBS;

  const stats = {
    total: MOCK_PROCESSING_JOBS.length,
    processing: MOCK_PROCESSING_JOBS.filter(j => j.status === 'processing').length,
    queued: MOCK_PROCESSING_JOBS.filter(j => j.status === 'queued').length,
    completed: MOCK_PROCESSING_JOBS.filter(j => j.status === 'completed').length,
    failed: MOCK_PROCESSING_JOBS.filter(j => j.status === 'failed').length,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-4 pb-3 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-semibold">Processing Queue</h1>
            <p className="text-xs text-muted-foreground">Background document processing jobs</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-3">
          {[
            { label: 'Total Jobs', value: stats.total, icon: Clock },
            { label: 'Processing', value: stats.processing, icon: Loader2, color: 'text-blue-600' },
            { label: 'Queued', value: stats.queued, icon: Clock, color: 'text-amber-600' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600' },
            { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <s.icon className={cn('h-4 w-4', s.color ?? 'text-muted-foreground')} />
              <div>
                <div className={cn('text-sm font-bold leading-none', s.color ?? 'text-foreground')}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <SelectNative className="h-8 text-xs w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
          <option value="">All Statuses</option>
          <option value="processing">Processing</option>
          <option value="queued">Queued</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </SelectNative>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-[1]">
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Job ID</TableHead>
              <TableHead>Current Stage</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Retries</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map(job => (
              <TableRow key={job.id}>
                <TableCell>
                  <div className="text-xs font-medium truncate max-w-[180px]">{truncateFilename(job.documentName, 40)}</div>
                  {job.category && <div className="text-[10px] text-muted-foreground capitalize">{job.category.replace(/_/g, ' ')}</div>}
                </TableCell>
                <TableCell><span className="font-mono text-[11px] text-muted-foreground">{job.id}</span></TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {job.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin text-blue-500 shrink-0" />}
                    <span className="text-xs">{getStageLabel(job.stage)}</span>
                  </div>
                  {job.errorMessage && (
                    <div className="text-[10px] text-red-600 flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate max-w-[200px]">{job.errorMessage}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {job.progress !== undefined ? (
                    <div className="w-20">
                      <Progress value={job.progress} className="h-1.5" />
                      <div className="text-[10px] text-muted-foreground mt-0.5">{job.progress}%</div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <div className="h-1 w-20 bg-muted rounded overflow-hidden">
                        {job.status === 'processing' && (
                          <div className="h-full w-1/3 bg-blue-400 animate-pulse rounded" />
                        )}
                      </div>
                      <span className="text-[10px]">—</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={`text-[10px] border ${getStatusColor(job.status)}`} variant="outline">
                    {getStatusLabel(job.status)}
                  </Badge>
                </TableCell>
                <TableCell><span className="text-xs text-muted-foreground">{formatRelativeTime(job.startedAt)}</span></TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {job.durationMs ? `${(job.durationMs / 1000).toFixed(0)}s` : '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={cn('text-xs', job.retryCount > 0 ? 'text-amber-700 font-medium' : 'text-muted-foreground')}>
                    {job.retryCount}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {job.status === 'failed' && (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2">
                        <RotateCcw className="h-3 w-3" /> Retry
                      </Button>
                    )}
                    {job.documentId && (
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7"
                        onClick={() => navigate(`/documents/${job.documentId}`)}>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {jobs.length === 0 && (
          <EmptyState icon={<Clock className="h-10 w-10" />} title="No jobs found" description="No processing jobs match the current filter." />
        )}
      </div>
    </div>
  );
}
