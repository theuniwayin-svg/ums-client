import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LeadFilters {
  status?: string;
  temperature?: string;
  source?: string;
  createdBy?: string;
  q?: string;
  city?: string;
  course?: string;
  preferredCollege?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: string;
}

interface LeadsUiState {
  selectedRows: string[];
  activeFilters: LeadFilters;
  columnVisibility: Record<string, boolean>;
  isQuickEditOpen: boolean;
  quickEditLeadId: string | null;
  isCreateLeadOpen: boolean;

  setSelectedRows: (rows: string[]) => void;
  toggleRowSelection: (id: string) => void;
  clearSelectedRows: () => void;
  setFilter: (key: keyof LeadFilters, value: string | number | null | undefined) => void;
  setFilters: (filters: LeadFilters) => void;
  clearFilters: () => void;
  setColumnVisibility: (col: string, visible: boolean) => void;
  openQuickEdit: (leadId: string) => void;
  closeQuickEdit: () => void;
  openCreateLead: () => void;
  closeCreateLead: () => void;
}

export const useLeadsUiStore = create<LeadsUiState>()(
  persist(
    (set, get) => ({
      selectedRows: [],
      activeFilters: {},
      columnVisibility: {
        phone: true,
        status: true,
        temperature: true,
        source: true,
        followUpDate: true,
        updatedAt: true,
        updatedBy: true,
        actions: true,
      },
      isQuickEditOpen: false,
      quickEditLeadId: null,
      isCreateLeadOpen: false,

      setSelectedRows: (rows) => set({ selectedRows: rows }),

      toggleRowSelection: (id) => {
        const { selectedRows } = get();
        if (selectedRows.includes(id)) {
          set({ selectedRows: selectedRows.filter((r) => r !== id) });
        } else {
          set({ selectedRows: [...selectedRows, id] });
        }
      },

      clearSelectedRows: () => set({ selectedRows: [] }),

      setFilter: (key, value) =>
        set((state) => ({
          activeFilters: { ...state.activeFilters, [key]: value, page: 1 },
        })),

      setFilters: (filters) =>
        set((state) => ({
          activeFilters: { ...state.activeFilters, ...filters, page: 1 },
        })),

      clearFilters: () => set({ activeFilters: {}, selectedRows: [] }),

      setColumnVisibility: (col, visible) =>
        set((state) => ({
          columnVisibility: { ...state.columnVisibility, [col]: visible },
        })),

      openQuickEdit: (leadId) =>
        set({ isQuickEditOpen: true, quickEditLeadId: leadId }),

      closeQuickEdit: () =>
        set({ isQuickEditOpen: false, quickEditLeadId: null }),

      openCreateLead: () => set({ isCreateLeadOpen: true }),
      closeCreateLead: () => set({ isCreateLeadOpen: false }),
    }),
    {
      name: 'leads-ui',
      // Only persist column visibility
      partialize: (state) => ({ columnVisibility: state.columnVisibility }),
    },
  ),
);
