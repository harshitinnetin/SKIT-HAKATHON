import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, BookOpen, Award, QrCode, Clock, CheckSquare,
  BookmarkCheck, Activity, Users, Settings, FolderOpen, FileSpreadsheet,
  ChevronLeft, ChevronRight, AlertTriangle, Database, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';
import { Badge } from '@/components/ui';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeVariant?: 'default' | 'destructive' | 'warning';
  section?: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', to: '/', icon: LayoutDashboard, section: 'main' },
  { label: 'All Documents', to: '/documents', icon: FileText, badge: '4,287', section: 'main' },
  { label: 'Smart Collections', to: '/collections', icon: FolderOpen, section: 'main' },
  { label: 'Certificate Repository', to: '/certificates', icon: Award, section: 'repositories' },
  { label: 'Question Papers', to: '/question-papers', icon: BookOpen, section: 'repositories' },
  { label: 'Invoices & Forms', to: '/invoices', icon: FileSpreadsheet, section: 'repositories' },
  { label: 'QR & Barcode Records', to: '/qr-barcodes', icon: QrCode, badge: '1,234', section: 'repositories' },
  { label: 'Processing Queue', to: '/processing', icon: Clock, badge: 23, badgeVariant: 'default', section: 'workflow' },
  { label: 'Review & Validation', to: '/review', icon: CheckSquare, badge: 142, badgeVariant: 'warning', section: 'workflow' },
  { label: 'Saved Filters', to: '/saved-filters', icon: BookmarkCheck, section: 'workflow' },
  { label: 'Activity & Audit Logs', to: '/audit', icon: Activity, section: 'workflow' },
  { label: 'User Management', to: '/users', icon: Users, section: 'admin', adminOnly: true },
  { label: 'Settings', to: '/settings', icon: Settings, section: 'admin' },
];

const SECTION_LABELS: Record<string, string> = {
  main: 'Workspace',
  repositories: 'Repositories',
  workflow: 'Workflow',
  admin: 'Administration',
};

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const location = useLocation();

  const sections = Array.from(new Set(NAV_ITEMS.map(i => i.section)));

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-white border-r border-border transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-14' : 'w-60',
        className
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-14 border-b border-border px-3 shrink-0', sidebarCollapsed ? 'justify-center' : 'gap-2.5')}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary">
          <Database className="h-3.5 w-3.5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <div className="text-sm font-bold text-foreground leading-tight">DocIntel</div>
            <div className="text-[10px] text-muted-foreground leading-tight">AI Document Platform</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {sections.map(section => {
          const items = NAV_ITEMS.filter(i => i.section === section);
          return (
            <div key={section} className="mb-1">
              {!sidebarCollapsed && (
                <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {SECTION_LABELS[section ?? ''] ?? section}
                </div>
              )}
              {items.map(item => (
                <SidebarItem
                  key={item.to}
                  item={item}
                  collapsed={sidebarCollapsed}
                  active={location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))}
                />
              ))}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2 shrink-0">
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            'flex w-full items-center rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
            sidebarCollapsed ? 'justify-center' : 'gap-2'
          )}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

interface SidebarItemProps {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}

function SidebarItem({ item, collapsed, active }: SidebarItemProps) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      title={collapsed ? item.label : undefined}
      className={cn(
        'relative flex items-center rounded-md mx-1.5 my-0.5 px-2 py-1.5 text-sm transition-colors group',
        collapsed ? 'justify-center' : 'gap-2.5',
        active
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className={cn('shrink-0 h-4 w-4', active ? 'text-primary' : '')} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-xs">{item.label}</span>
          {item.badge !== undefined && (
            <Badge
              variant={item.badgeVariant === 'warning' ? 'warning' : item.badgeVariant === 'destructive' ? 'destructive' : 'secondary'}
              className="ml-auto text-[10px] px-1.5 py-0"
            >
              {item.badge}
            </Badge>
          )}
        </>
      )}
      {collapsed && item.badge !== undefined && (
        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
          {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </NavLink>
  );
}

// ─── Mobile Sidebar Drawer ───────────────────────────────────────────────────
interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-border animate-slide-in-left">
        <div className="flex items-center justify-between h-14 border-b px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Database className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">DocIntel</div>
              <div className="text-[10px] text-muted-foreground leading-tight">AI Document Platform</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="py-2 overflow-y-auto scrollbar-thin h-[calc(100%-56px)]">
          {Array.from(new Set(NAV_ITEMS.map(i => i.section))).map(section => (
            <div key={section} className="mb-1">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {SECTION_LABELS[section ?? ''] ?? section}
              </div>
              {NAV_ITEMS.filter(i => i.section === section).map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2.5 rounded-md mx-1.5 my-0.5 px-2 py-1.5 text-xs transition-colors',
                    isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <Badge variant={item.badgeVariant === 'warning' ? 'warning' : 'secondary'} className="text-[10px] px-1.5 py-0">
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ─── Demo mode banner ────────────────────────────────────────────────────────
export function DemoBanner() {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;
  return (
    <div className="flex items-center justify-between bg-amber-50 border-b border-amber-200 px-4 py-2">
      <div className="flex items-center gap-2 text-xs text-amber-800">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span><strong>Demo Mode:</strong> Showing simulated data. No real OCR or backend processing is active.</span>
      </div>
      <button type="button" onClick={() => setDismissed(true)} className="text-amber-600 hover:text-amber-800">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
