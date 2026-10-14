import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { DocumentsPage } from '@/features/documents/DocumentsPage';
import { CertificatesPage } from '@/features/certificates/CertificatesPage';
import { QuestionPapersPage } from '@/features/question-papers/QuestionPapersPage';
import { QRBarcodesPage } from '@/features/qr-barcodes/QRBarcodesPage';
import { ProcessingQueuePage } from '@/features/processing/ProcessingQueuePage';
import { ReviewPage } from '@/features/review/ReviewPage';
import { SavedFiltersPage } from '@/features/saved-filters/SavedFiltersPage';
import { AuditLogsPage } from '@/features/audit/AuditLogsPage';
import { CollectionsPage } from '@/features/audit/CollectionsPage';
import { UploadPage } from '@/features/uploads/UploadPage';
import { InvoicesPage } from '@/features/invoices/InvoicesPage';
import { UsersPage } from '@/features/users/UsersPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/question-papers" element={<QuestionPapersPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/qr-barcodes" element={<QRBarcodesPage />} />
          <Route path="/processing" element={<ProcessingQueuePage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/saved-filters" element={<SavedFiltersPage />} />
          <Route path="/audit" element={<AuditLogsPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
