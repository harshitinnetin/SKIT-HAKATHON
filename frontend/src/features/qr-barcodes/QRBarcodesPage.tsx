import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, QrCode, Eye, X, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import {
  Button, Input, Badge, Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell, EmptyState, SelectNative
} from '@/components/ui';
import { MOCK_QR_RECORDS } from '@/mocks/data';
import { getCodeTypeLabel, getVerificationStatusLabel, formatRelativeTime, cn } from '@/lib/utils';
import type { CodeVerificationStatus } from '@/types';

export function QRBarcodesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | CodeVerificationStatus>('');

  const records = useMemo(() => {
    let items = [...MOCK_QR_RECORDS];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(r =>
        r.rawValue.toLowerCase().includes(q) ||
        (r.parsedIdentifier ?? '').toLowerCase().includes(q) ||
        r.documentName.toLowerCase().includes(q)
      );
    }
    if (typeFilter) items = items.filter(r => r.codeType === typeFilter);
    if (statusFilter) items = items.filter(r => r.verificationStatus === statusFilter);
    return items;
  }, [search, typeFilter, statusFilter]);

  const stats = {
    total: MOCK_QR_RECORDS.length,
    verified: MOCK_QR_RECORDS.filter(r => r.verificationStatus === 'verified').length,
    unverified: MOCK_QR_RECORDS.filter(r => r.verificationStatus === 'unverified').length,
    invalid: MOCK_QR_RECORDS.filter(r => r.verificationStatus === 'invalid').length,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-4 pb-3 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-cyan-100 flex items-center justify-center">
              <QrCode className="h-4 w-4 text-cyan-700" />
            </div>
            <div>
              <h1 className="text-base font-semibold">QR Code & Barcode Records</h1>
              <p className="text-xs text-muted-foreground">{stats.total.toLocaleString()} codes detected · {records.length} shown</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-3">
          {[
            { label: 'Total Codes', value: stats.total },
            { label: 'Verified', value: stats.verified, color: 'text-emerald-700' },
            { label: 'Unverified', value: stats.unverified, color: 'text-amber-700' },
            { label: 'Invalid', value: stats.invalid, color: 'text-red-600' },
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
            <Input placeholder="Search code value or identifier…" className="pl-8 h-8 text-xs"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <SelectNative className="h-8 text-xs w-40" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Code Types</option>
            {['qr_code', 'barcode_1d', 'barcode_2d', 'data_matrix'].map(t => (
              <option key={t} value={t}>{getCodeTypeLabel(t as any)}</option>
            ))}
          </SelectNative>
          <SelectNative className="h-8 text-xs w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
            <option value="">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="invalid">Invalid</option>
            <option value="unresolved">Unresolved</option>
          </SelectNative>
          {(search || typeFilter || statusFilter) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground"
              onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); }}>
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-[1]">
            <TableRow>
              <TableHead>Code Type</TableHead>
              <TableHead>Decoded Value</TableHead>
              <TableHead>Parsed Identifier</TableHead>
              <TableHead>Resolved Entity</TableHead>
              <TableHead>Source Document</TableHead>
              <TableHead>Page</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Detected</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map(rec => (
              <TableRow key={rec.id}>
                <TableCell>
                  <Badge variant="info" className="text-[10px]">{getCodeTypeLabel(rec.codeType)}</Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px]">
                    <div className="font-mono text-[11px] truncate bg-muted px-1.5 py-0.5 rounded" title={rec.rawValue}>
                      {rec.rawValue}
                    </div>
                    <div className="text-[10px] text-amber-600 mt-0.5 italic">Raw decoded — not verified externally</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono font-medium">{rec.parsedIdentifier ?? '—'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs">{rec.resolvedEntity ?? <span className="text-muted-foreground italic">Unresolved</span>}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs truncate max-w-[160px] block text-muted-foreground">{rec.documentName}</span>
                </TableCell>
                <TableCell><span className="text-xs">p. {rec.sourcePage}</span></TableCell>
                <TableCell>
                  {rec.detectionConfidence !== undefined ? (
                    <span className="text-xs text-emerald-700 font-medium">{Math.round(rec.detectionConfidence * 100)}%</span>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {rec.verificationStatus === 'verified' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : rec.verificationStatus === 'invalid' ? (
                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    <span className={cn('text-xs', rec.verificationStatus === 'verified' ? 'text-emerald-700' : rec.verificationStatus === 'invalid' ? 'text-red-600' : 'text-amber-700')}>
                      {getVerificationStatusLabel(rec.verificationStatus)}
                    </span>
                  </div>
                </TableCell>
                <TableCell><span className="text-xs text-muted-foreground">{formatRelativeTime(rec.createdAt)}</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {records.length === 0 && (
          <EmptyState icon={<QrCode className="h-10 w-10" />} title="No QR/barcode records" description="Upload documents with QR codes or barcodes." />
        )}
      </div>
    </div>
  );
}
