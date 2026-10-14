import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, ChevronDown, Menu, Upload, Moon, Sun, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';
import {
  Button, Avatar, Badge, Input,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui';
import { MOCK_CURRENT_USER } from '@/mocks/data';

interface TopNavProps {
  onMenuClick?: () => void;
  breadcrumbs?: { label: string; to?: string }[];
}

export function TopNav({ onMenuClick, breadcrumbs }: TopNavProps) {
  const { theme, setTheme } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/documents?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="flex items-center h-14 border-b border-border bg-white px-4 gap-3 shrink-0">
      {/* Mobile menu button */}
      <button
        type="button"
        className="lg:hidden p-1.5 rounded hover:bg-accent"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Breadcrumbs */}
      {breadcrumbs && (
        <nav className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>/</span>}
              <span className={cn(i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : 'hover:text-foreground cursor-pointer')}>
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Global search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md ml-auto md:ml-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documents, metadata, QR codes…"
            className="pl-8 h-8 text-xs bg-muted/40 border-0 focus-visible:ring-1 focus-visible:bg-background"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            id="global-search-input"
          />
        </div>
      </form>

      <div className="flex items-center gap-1 ml-auto">
        {/* Processing indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>23 processing</span>
        </div>

        {/* Upload quick action */}
        <Button
          variant="default"
          size="sm"
          className="hidden md:flex h-7 text-xs px-2.5 gap-1.5"
          onClick={() => navigate('/upload')}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>

        {/* Theme toggle */}
        <button
          type="button"
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            className="relative p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-0.5 right-0.5 flex h-2 w-2 rounded-full bg-red-500" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 rounded-lg border bg-white shadow-lg z-50 animate-fade-in">
              <div className="p-3 border-b">
                <div className="text-xs font-semibold">Notifications</div>
              </div>
              <div className="divide-y max-h-60 overflow-y-auto">
                {[
                  { title: 'Processing complete', desc: 'Certificate batch (42 files) processed', time: '2m ago', type: 'success' },
                  { title: 'Review required', desc: '14 documents need validation', time: '18m ago', type: 'warning' },
                  { title: 'Job failed', desc: 'Annual Report OCR timeout', time: '1h ago', type: 'error' },
                ].map((n, i) => (
                  <div key={i} className="p-3 hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-start gap-2">
                      <div className={cn('h-2 w-2 rounded-full mt-1 shrink-0', n.type === 'success' ? 'bg-emerald-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-red-500')} />
                      <div>
                        <div className="text-xs font-medium">{n.title}</div>
                        <div className="text-xs text-muted-foreground">{n.desc}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{n.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t">
                <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => { setNotifOpen(false); navigate('/audit'); }}>
                  View all activity
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button type="button" className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-accent transition-colors">
              <Avatar
                fallback={MOCK_CURRENT_USER.name.slice(0, 2)}
                size="sm"
                className="bg-primary/10 text-primary font-semibold"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-medium leading-none">{MOCK_CURRENT_USER.name.split(' ').slice(-1)[0]}</div>
                <div className="text-[10px] text-muted-foreground leading-tight capitalize">{MOCK_CURRENT_USER.role.replace('_', ' ')}</div>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="text-xs font-semibold">{MOCK_CURRENT_USER.name}</div>
              <div className="text-[10px] text-muted-foreground font-normal">{MOCK_CURRENT_USER.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>Profile & Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/audit')}>Activity Log</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
