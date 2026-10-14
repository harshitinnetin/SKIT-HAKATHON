import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, MobileSidebar, DemoBanner } from './Sidebar';
import { TopNav } from './TopNav';

const ROUTE_BREADCRUMBS: Record<string, { label: string }[]> = {
  '/': [{ label: 'Overview' }],
  '/documents': [{ label: 'All Documents' }],
  '/certificates': [{ label: 'Repositories' }, { label: 'Certificate Repository' }],
  '/question-papers': [{ label: 'Repositories' }, { label: 'Question Papers' }],
  '/invoices': [{ label: 'Repositories' }, { label: 'Invoices & Forms' }],
  '/qr-barcodes': [{ label: 'Repositories' }, { label: 'QR & Barcode Records' }],
  '/processing': [{ label: 'Workflow' }, { label: 'Processing Queue' }],
  '/review': [{ label: 'Workflow' }, { label: 'Review & Validation' }],
  '/saved-filters': [{ label: 'Workflow' }, { label: 'Saved Filters' }],
  '/audit': [{ label: 'Workflow' }, { label: 'Activity & Audit Logs' }],
  '/collections': [{ label: 'Smart Collections' }],
  '/upload': [{ label: 'Upload Documents' }],
  '/users': [{ label: 'Administration' }, { label: 'User Management' }],
  '/settings': [{ label: 'Administration' }, { label: 'Settings' }],
};

export function AppLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const breadcrumbs = ROUTE_BREADCRUMBS[location.pathname] ?? [{ label: 'DocIntel' }];

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Desktop sidebar */}
      <Sidebar className="hidden lg:flex lg:flex-col shrink-0" />

      {/* Mobile sidebar */}
      <MobileSidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DemoBanner />
        <TopNav
          onMenuClick={() => setMobileMenuOpen(true)}
          breadcrumbs={breadcrumbs}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
