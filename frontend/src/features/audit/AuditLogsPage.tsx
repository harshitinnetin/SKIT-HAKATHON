import React from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { MOCK_AUDIT_EVENTS } from '@/mocks/data';
import { formatDate, formatRelativeTime } from '@/lib/utils';

export function AuditLogsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-4 pb-3 border-b bg-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center">
            <Activity className="h-4 w-4 text-slate-700" />
          </div>
          <div>
            <h1 className="text-base font-semibold">Activity & Audit Logs</h1>
            <p className="text-xs text-muted-foreground">Record of all actions performed in the system</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-[1]">
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_AUDIT_EVENTS.map(event => (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-xs capitalize">{event.type.replace(/_/g, ' ')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="text-xs font-medium">{event.resourceName}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{event.resourceType}</div>
                  </div>
                </TableCell>
                <TableCell><span className="text-xs text-muted-foreground">{event.description}</span></TableCell>
                <TableCell><span className="text-xs">{event.userName}</span></TableCell>
                <TableCell>
                  <div>
                    <div className="text-xs">{formatRelativeTime(event.createdAt)}</div>
                    <div className="text-[10px] text-muted-foreground">{formatDate(event.createdAt)}</div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Collections Page ────────────────────────────────────────────────────────
export { CollectionsPage } from './CollectionsPage';
