import React, { useState } from 'react';
import {
  FileSpreadsheet, Search, Filter, Download, Eye, MoreHorizontal,
  TrendingUp, DollarSign, Clock, CheckCircle2, AlertCircle, Plus,
  Building2, Calendar, Hash, ArrowUpRight
} from 'lucide-react';
import {
  Card, CardContent, Button, Input, Badge, EmptyState,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui';
import { cn, formatRelativeTime } from '@/lib/utils';

// ─── Mock Invoice Data ────────────────────────────────────────────────────────
interface Invoice {
  id: string;
  invoiceNumber: string;
  vendor: string;
  department: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'review';
  dueDate: string;
  uploadedAt: Date;
  confidence: number;
  type: 'invoice' | 'receipt' | 'form' | 'application';
}

const MOCK_INVOICES: Invoice[] = [
  { id: '1', invoiceNumber: 'INV-2024-0847', vendor: 'TechSupplies Ltd.', department: 'IT', amount: 145200, currency: 'INR', status: 'paid', dueDate: '2024-01-15', uploadedAt: new Date(Date.now() - 2 * 86400000), confidence: 97, type: 'invoice' },
  { id: '2', invoiceNumber: 'INV-2024-0831', vendor: 'Campus Stationers', department: 'Admin', amount: 23500, currency: 'INR', status: 'pending', dueDate: '2024-02-10', uploadedAt: new Date(Date.now() - 5 * 86400000), confidence: 92, type: 'invoice' },
  { id: '3', invoiceNumber: 'REC-2024-0219', vendor: 'Canteen Services', department: 'Operations', amount: 8750, currency: 'INR', status: 'paid', dueDate: '2024-01-28', uploadedAt: new Date(Date.now() - 1 * 86400000), confidence: 88, type: 'receipt' },
  { id: '4', invoiceNumber: 'INV-2024-0772', vendor: 'Lab Equipment Co.', department: 'Science', amount: 387000, currency: 'INR', status: 'overdue', dueDate: '2024-01-05', uploadedAt: new Date(Date.now() - 12 * 86400000), confidence: 95, type: 'invoice' },
  { id: '5', invoiceNumber: 'APP-2024-0114', vendor: 'Student Affairs', department: 'HR', amount: 0, currency: 'INR', status: 'review', dueDate: '2024-02-20', uploadedAt: new Date(Date.now() - 3 * 86400000), confidence: 79, type: 'application' },
  { id: '6', invoiceNumber: 'INV-2024-0801', vendor: 'Cloud Hosting Inc.', department: 'IT', amount: 56000, currency: 'INR', status: 'pending', dueDate: '2024-02-15', uploadedAt: new Date(Date.now() - 7 * 86400000), confidence: 98, type: 'invoice' },
  { id: '7', invoiceNumber: 'FORM-2024-0089', vendor: 'Maintenance Dept.', department: 'Facilities', amount: 12300, currency: 'INR', status: 'review', dueDate: '2024-02-05', uploadedAt: new Date(Date.now() - 4 * 86400000), confidence: 84, type: 'form' },
  { id: '8', invoiceNumber: 'INV-2024-0756', vendor: 'PrintMaster Solutions', department: 'Admin', amount: 34800, currency: 'INR', status: 'paid', dueDate: '2024-01-22', uploadedAt: new Date(Date.now() - 9 * 86400000), confidence: 96, type: 'invoice' },
];

const STATUS_CONFIG = {
  paid:     { label: 'Paid',     variant: 'success'     as const, icon: CheckCircle2 },
  pending:  { label: 'Pending',  variant: 'warning'     as const, icon: Clock },
  overdue:  { label: 'Overdue',  variant: 'destructive' as const, icon: AlertCircle },
  review:   { label: 'Review',   variant: 'secondary'   as const, icon: Eye },
};

const TYPE_COLORS: Record<string, string> = {
  invoice:     'text-blue-700 bg-blue-50 border-blue-200',
  receipt:     'text-green-700 bg-green-50 border-green-200',
  form:        'text-purple-700 bg-purple-50 border-purple-200',
  application: 'text-orange-700 bg-orange-50 border-orange-200',
};

const STATS = [
  { label: 'Total Invoices',    value: '342',     sub: '+18 this month',     icon: FileSpreadsheet, color: 'text-blue-600' },
  { label: 'Total Value',       value: '₹24.7L',  sub: 'Across all vendors', icon: DollarSign,     color: 'text-emerald-600' },
  { label: 'Pending Payment',   value: '47',      sub: '₹8.2L outstanding',  icon: Clock,          color: 'text-amber-600' },
  { label: 'Overdue',           value: '12',      sub: 'Needs immediate action', icon: AlertCircle, color: 'text-red-600' },
];

function formatCurrency(amount: number) {
  if (amount === 0) return '—';
  return `₹${(amount / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = MOCK_INVOICES.filter(inv => {
    const matchSearch = !search || inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || inv.vendor.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchType = typeFilter === 'all' || inv.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            Invoices &amp; Forms
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-extracted financial documents, forms, and institutional records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" /> Upload Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </div>
                  <div className={cn('p-2 rounded-lg bg-muted/50', stat.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number or vendor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          {(['all', 'paid', 'pending', 'overdue', 'review'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                statusFilter === s
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white border-border text-muted-foreground hover:bg-accent'
              )}
            >
              {s === 'all' ? 'All Status' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice / Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Vendor / Source</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    <EmptyState
                      icon={<FileSpreadsheet className="h-8 w-8" />}
                      title="No invoices found"
                      description="Try adjusting your search or filters."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(inv => {
                  const StatusIcon = STATUS_CONFIG[inv.status].icon;
                  return (
                    <TableRow key={inv.id} className="hover:bg-muted/30 cursor-pointer">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono text-sm font-medium">{inv.invoiceNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize', TYPE_COLORS[inv.type])}>
                          {inv.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm">{inv.vendor}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{inv.department}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-sm">{formatCurrency(inv.amount)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {inv.dueDate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_CONFIG[inv.status].variant} className="gap-1 text-[10px]">
                          <StatusIcon className="h-3 w-3" />
                          {STATUS_CONFIG[inv.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', inv.confidence >= 90 ? 'bg-emerald-500' : inv.confidence >= 75 ? 'bg-amber-500' : 'bg-red-500')}
                              style={{ width: `${inv.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{inv.confidence}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatRelativeTime(inv.uploadedAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ArrowUpRight className="h-4 w-4 mr-2" /> Open Original
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Footer */}
      <p className="text-xs text-muted-foreground text-center">
        Showing {filtered.length} of {MOCK_INVOICES.length} records · AI-extracted metadata with confidence scoring
      </p>
    </div>
  );
}
