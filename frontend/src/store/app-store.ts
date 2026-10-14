import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilterDefinition, SortConfig } from '@/types';

interface AppState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  // Document explorer state
  documentSearch: string;
  setDocumentSearch: (q: string) => void;
  documentFilters: FilterDefinition | null;
  setDocumentFilters: (f: FilterDefinition | null) => void;
  documentSort: SortConfig[];
  setDocumentSort: (s: SortConfig[]) => void;
  documentPage: number;
  setDocumentPage: (p: number) => void;
  documentView: 'table' | 'grid';
  setDocumentView: (v: 'table' | 'grid') => void;
  documentPageSize: number;
  setDocumentPageSize: (size: number) => void;
  selectedDocumentIds: string[];
  setSelectedDocumentIds: (ids: string[]) => void;
  toggleSelectedDocument: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      theme: 'light',
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },
      documentSearch: '',
      setDocumentSearch: (q) => set({ documentSearch: q, documentPage: 1 }),
      documentFilters: null,
      setDocumentFilters: (f) => set({ documentFilters: f, documentPage: 1 }),
      documentSort: [],
      setDocumentSort: (s) => set({ documentSort: s }),
      documentPage: 1,
      setDocumentPage: (p) => set({ documentPage: p }),
      documentView: 'table',
      setDocumentView: (v) => set({ documentView: v }),
      documentPageSize: 25,
      setDocumentPageSize: (size) => set({ documentPageSize: size }),
      selectedDocumentIds: [],
      setSelectedDocumentIds: (ids) => set({ selectedDocumentIds: ids }),
      toggleSelectedDocument: (id) => {
        const { selectedDocumentIds } = get();
        if (selectedDocumentIds.includes(id)) {
          set({ selectedDocumentIds: selectedDocumentIds.filter(i => i !== id) });
        } else {
          set({ selectedDocumentIds: [...selectedDocumentIds, id] });
        }
      },
    }),
    {
      name: 'docintel-app-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        documentView: state.documentView,
        documentPageSize: state.documentPageSize,
      }),
    }
  )
);
