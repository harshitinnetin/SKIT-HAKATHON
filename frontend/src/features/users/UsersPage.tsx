import React, { useState } from 'react';
import {
  Users, Search, Plus, MoreHorizontal, Shield, Mail,
  Clock, CheckCircle2, XCircle, Crown, UserCheck, UserX,
  Building2, Filter
} from 'lucide-react';
import {
  Card, CardContent, Button, Input, Badge,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, Avatar
} from '@/components/ui';
import { cn, formatRelativeTime } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'reviewer' | 'viewer';
  department: string;
  status: 'active' | 'inactive' | 'pending';
  lastSeen: Date;
  documentsProcessed: number;
}

const MOCK_USERS: User[] = [
  { id: '1', name: 'Dr. Ananya Sharma', email: 'ananya.sharma@skit.ac.in', role: 'admin', department: 'Computer Science', status: 'active', lastSeen: new Date(Date.now() - 15 * 60000), documentsProcessed: 1243 },
  { id: '2', name: 'Prof. Rajesh Gupta', email: 'rajesh.gupta@skit.ac.in', role: 'editor', department: 'Mechanical Engg.', status: 'active', lastSeen: new Date(Date.now() - 2 * 3600000), documentsProcessed: 867 },
  { id: '3', name: 'Priya Mehta', email: 'priya.mehta@skit.ac.in', role: 'reviewer', department: 'Admin Office', status: 'active', lastSeen: new Date(Date.now() - 30 * 60000), documentsProcessed: 412 },
  { id: '4', name: 'Arjun Singh', email: 'arjun.singh@skit.ac.in', role: 'viewer', department: 'Library', status: 'inactive', lastSeen: new Date(Date.now() - 7 * 86400000), documentsProcessed: 56 },
  { id: '5', name: 'Dr. Kavita Patel', email: 'kavita.patel@skit.ac.in', role: 'editor', department: 'Electronics', status: 'active', lastSeen: new Date(Date.now() - 1 * 3600000), documentsProcessed: 634 },
  { id: '6', name: 'Rohit Verma', email: 'rohit.verma@skit.ac.in', role: 'reviewer', department: 'Accounts', status: 'pending', lastSeen: new Date(Date.now() - 1 * 86400000), documentsProcessed: 0 },
  { id: '7', name: 'Sneha Joshi', email: 'sneha.joshi@skit.ac.in', role: 'viewer', department: 'HR', status: 'active', lastSeen: new Date(Date.now() - 4 * 3600000), documentsProcessed: 198 },
  { id: '8', name: 'Vikram Agarwal', email: 'vikram.agarwal@skit.ac.in', role: 'admin', department: 'IT Services', status: 'active', lastSeen: new Date(Date.now() - 45 * 60000), documentsProcessed: 2104 },
];

const ROLE_CONFIG = {
  admin: { label: 'Admin', variant: 'default' as const, icon: Crown },
  editor: { label: 'Editor', variant: 'secondary' as const, icon: Shield },
  reviewer: { label: 'Reviewer', variant: 'warning' as const, icon: UserCheck },
  viewer: { label: 'Viewer', variant: 'secondary' as const, icon: Users },
};

const STATUS_CONFIG = {
  active: { label: 'Active', variant: 'success' as const, icon: CheckCircle2 },
  inactive: { label: 'Inactive', variant: 'secondary' as const, icon: XCircle },
  pending: { label: 'Pending', variant: 'warning' as const, icon: Clock },
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const STATS = [
  { label: 'Total Users', value: '8', sub: 'Across all roles', icon: Users, color: 'text-blue-600' },
  { label: 'Active Now', value: '5', sub: 'In last 24 hours', icon: CheckCircle2, color: 'text-emerald-600' },
  { label: 'Admins', value: '2', sub: 'Full access', icon: Crown, color: 'text-violet-600' },
  { label: 'Pending Setup', value: '1', sub: 'Awaiting first login', icon: Clock, color: 'text-amber-600' },
];

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = MOCK_USERS.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage team members, roles and access permissions for DocIntel
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" /> Invite User
        </Button>
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
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          {(['all', 'admin', 'editor', 'reviewer', 'viewer'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border capitalize',
                roleFilter === r
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white border-border text-muted-foreground hover:bg-accent'
              )}
            >
              {r === 'all' ? 'All Roles' : r}
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
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Docs Processed</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(user => {
                const RoleIcon = ROLE_CONFIG[user.role].icon;
                const StatusIcon = STATUS_CONFIG[user.status].icon;
                return (
                  <TableRow key={user.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar fallback={getInitials(user.name)} size="md" className="bg-primary/10 text-primary font-semibold text-xs" />
                        <div>
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ROLE_CONFIG[user.role].variant} className="gap-1 text-[10px]">
                        <RoleIcon className="h-3 w-3" />
                        {ROLE_CONFIG[user.role].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        {user.department}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_CONFIG[user.status].variant} className="gap-1 text-[10px]">
                        <StatusIcon className="h-3 w-3" />
                        {STATUS_CONFIG[user.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold">{user.documentsProcessed.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelativeTime(user.lastSeen)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
                          <DropdownMenuItem>Reset Password</DropdownMenuItem>
                          <DropdownMenuItem>View Activity Log</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === 'active' ? (
                            <DropdownMenuItem className="text-amber-600">
                              <UserX className="h-4 w-4 mr-2" /> Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-emerald-600">
                              <UserCheck className="h-4 w-4 mr-2" /> Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive">Remove User</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        {filtered.length} of {MOCK_USERS.length} users · Role-based access control
      </p>
    </div>
  );
}
