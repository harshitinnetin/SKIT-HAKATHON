import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, CheckCircle2, Clock, AlertTriangle, XCircle, QrCode,
  Database, AlertCircle, Upload, Search, FolderPlus, Eye,
  TrendingUp, ArrowRight, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Badge, Button, Skeleton
} from '@/components/ui';
import {
  MOCK_DASHBOARD_METRICS, MOCK_CATEGORY_DISTRIBUTION,
  MOCK_DOCUMENTS, MOCK_PROCESSING_JOBS, MOCK_AUDIT_EVENTS
} from '@/mocks/data';
import {
  formatRelativeTime, getCategoryLabel, getCategoryColor,
  getStatusLabel, getStatusColor, formatBytes, truncateFilename
} from '@/lib/utils';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#64748b', '#06b6d4', '#94a3b8'];

const PROCESSING_TREND = [
  { day: 'Mon', completed: 145, failed: 3 },
  { day: 'Tue', completed: 234, failed: 7 },
  { day: 'Wed', completed: 189, failed: 2 },
  { day: 'Thu', completed: 312, failed: 11 },
  { day: 'Fri', completed: 278, failed: 4 },
  { day: 'Sat', completed: 98, failed: 1 },
  { day: 'Sun', completed: 56, failed: 0 },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const metrics = MOCK_DASHBOARD_METRICS;

  return (
    <div className="p-5 space-y-5 max-w-screen-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Repository Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last updated {formatRelativeTime(metrics.lastUpdated)} · Simulated data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => navigate('/upload')}>
            <Upload className="h-3.5 w-3.5" />
            Upload Documents
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Total Documents"
          value={metrics.totalDocuments.toLocaleString()}
          icon={Database}
          iconColor="text-blue-600 bg-blue-50"
          trend="+142 this week"
          onClick={() => navigate('/documents')}
        />
        <MetricCard
          title="Successfully Processed"
          value={metrics.processedDocuments.toLocaleString()}
          icon={CheckCircle2}
          iconColor="text-emerald-600 bg-emerald-50"
          trend={`${((metrics.processedDocuments / metrics.totalDocuments) * 100).toFixed(1)}% success rate`}
          onClick={() => navigate('/documents?status=completed')}
        />
        <MetricCard
          title="Currently Processing"
          value={metrics.processingDocuments.toLocaleString()}
          icon={Clock}
          iconColor="text-blue-500 bg-blue-50"
          trend="Active jobs"
          pulse
          onClick={() => navigate('/processing')}
        />
        <MetricCard
          title="Needs Review"
          value={metrics.reviewRequired.toLocaleString()}
          icon={AlertTriangle}
          iconColor="text-amber-600 bg-amber-50"
          trend="Requires attention"
          onClick={() => navigate('/review')}
        />
        <MetricCard
          title="Failed Jobs"
          value={metrics.failedJobs.toLocaleString()}
          icon={XCircle}
          iconColor="text-red-600 bg-red-50"
          trend="Retry available"
          onClick={() => navigate('/processing?status=failed')}
        />
        <MetricCard
          title="Document Categories"
          value={metrics.detectedCategories.toLocaleString()}
          icon={FileText}
          iconColor="text-purple-600 bg-purple-50"
          trend="Detected by AI"
        />
        <MetricCard
          title="QR/Barcode Records"
          value={metrics.qrBarcodeRecords.toLocaleString()}
          icon={QrCode}
          iconColor="text-cyan-600 bg-cyan-50"
          trend="Machine-readable codes"
          onClick={() => navigate('/qr-barcodes')}
        />
        <MetricCard
          title="Missing Metadata"
          value={metrics.missingMetadata.toLocaleString()}
          icon={AlertCircle}
          iconColor="text-orange-600 bg-orange-50"
          trend="Fields to complete"
          onClick={() => navigate('/review?type=missing')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Processing trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Processing Activity</CardTitle>
                <CardDescription>Documents completed vs failed — last 7 days</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/processing')}>
                View queue <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={PROCESSING_TREND} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="completed" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Completed" />
                <Bar dataKey="failed" fill="#ef4444" radius={[3, 3, 0, 0]} name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Document Categories</CardTitle>
            <CardDescription>Distribution across {metrics.detectedCategories} types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={MOCK_CATEGORY_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="label"
                >
                  {MOCK_CATEGORY_DISTRIBUTION.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid hsl(var(--border))' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {MOCK_CATEGORY_DISTRIBUTION.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="font-medium">{item.count.toLocaleString()}</span>
                </div>
              ))}
              <div className="text-[10px] text-muted-foreground pl-3.5">+ {MOCK_CATEGORY_DISTRIBUTION.length - 4} more categories</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Uploads */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Uploads</CardTitle>
                <CardDescription>Latest documents added to the repository</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/documents')}>
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              {MOCK_DOCUMENTS.slice(0, 6).map(doc => (
                <div key={doc.id} className="flex items-center gap-3 py-2.5 group cursor-pointer hover:bg-muted/30 -mx-5 px-5 rounded"
                  onClick={() => navigate(`/documents/${doc.id}`)}>
                  <div className={`h-7 w-7 shrink-0 rounded flex items-center justify-center text-[10px] font-bold border ${getCategoryColor(doc.category)}`}>
                    {getCategoryLabel(doc.category).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{truncateFilename(doc.name, 45)}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{getCategoryLabel(doc.category)}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{formatRelativeTime(doc.uploadedAt)}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{formatBytes(doc.fileSizeBytes)}</span>
                    </div>
                  </div>
                  <Badge className={`text-[10px] px-1.5 py-0 border ${getStatusColor(doc.processingStatus)}`} variant="outline">
                    {getStatusLabel(doc.processingStatus)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {[
                { label: 'Upload documents', icon: Upload, to: '/upload', color: 'text-blue-600' },
                { label: 'Advanced search', icon: Search, to: '/documents', color: 'text-purple-600' },
                { label: 'Create collection', icon: FolderPlus, to: '/collections', color: 'text-emerald-600' },
                { label: 'Review uncertain extractions', icon: Eye, to: '/review', color: 'text-amber-600' },
                { label: 'View processing queue', icon: Clock, to: '/processing', color: 'text-slate-600' },
              ].map((action, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => navigate(action.to)}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left group"
                >
                  <action.icon className={`h-3.5 w-3.5 shrink-0 ${action.color}`} />
                  <span>{action.label}</span>
                  <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Processing Jobs Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Processing Queue</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7 p-1" onClick={() => navigate('/processing')}>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {MOCK_PROCESSING_JOBS.slice(0, 4).map(job => (
                <div key={job.id} className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    job.status === 'completed' ? 'bg-emerald-500' :
                    job.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                    job.status === 'failed' ? 'bg-red-500' :
                    job.status === 'queued' ? 'bg-amber-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate">{truncateFilename(job.documentName, 35)}</div>
                    <div className="text-[10px] text-muted-foreground">{getStatusLabel(job.status)}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Data Quality + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Data Quality */}
        <Card>
          <CardHeader>
            <CardTitle>Data Quality</CardTitle>
            <CardDescription>Extraction quality and validation status</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {[
              { label: 'High confidence extractions (≥85%)', value: 3124, total: metrics.processedDocuments, color: 'bg-emerald-500' },
              { label: 'Medium confidence (65–85%)', value: 612, total: metrics.processedDocuments, color: 'bg-amber-400' },
              { label: 'Low confidence (<65%)', value: 212, total: metrics.processedDocuments, color: 'bg-red-400' },
              { label: 'Documents with QR/barcode', value: metrics.qrBarcodeRecords, total: metrics.totalDocuments, color: 'bg-cyan-500' },
              { label: 'Missing metadata fields', value: metrics.missingMetadata, total: metrics.totalDocuments, color: 'bg-orange-400' },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all`}
                    style={{ width: `${Math.min(100, (item.value / item.total) * 100).toFixed(1)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your recent actions</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/audit')}>
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {MOCK_AUDIT_EVENTS.map(event => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{event.description}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{event.userName}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{formatRelativeTime(event.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  trend?: string;
  pulse?: boolean;
  onClick?: () => void;
}

function MetricCard({ title, value, icon: Icon, iconColor, trend, pulse, onClick }: MetricCardProps) {
  return (
    <Card
      className={`${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1 leading-none">{value}</p>
            {trend && <p className="text-[11px] text-muted-foreground mt-1">{trend}</p>}
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${iconColor}`}>
            <Icon className={`h-4.5 w-4.5 ${pulse ? 'animate-pulse-subtle' : ''}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
