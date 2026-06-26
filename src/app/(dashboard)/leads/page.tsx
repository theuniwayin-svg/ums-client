'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronDown, Settings, Phone, MessageSquare, Edit, SlidersHorizontal, X, Plus, Search, ArrowUpDown, Flame, Sun, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeads, useCreateNote, useBulkUpdateLeads } from '@/hooks/use-leads';
import { useLeadsUiStore } from '@/store/leads-ui.store';
import type { LeadFilters } from '@/store/leads-ui.store';
import { useDebouncedCallback } from '@/hooks/use-debounce';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useMediaQuery } from '@/hooks/use-media-query';
import { EmptyState } from '@/components/empty-state';
import {
  StatusBadge,
  TemperatureBadge,
  FollowUpDateBadge,
  temperatureBorderClass,
} from '@/components/leads/status-badges';
import { CreateLeadModal } from '@/components/leads/create-lead-modal';
import { QuickEditDrawer } from '@/components/leads/quick-edit-drawer';
import type { Lead } from '@/schemas/lead.schema';
import { useAuthStore } from '@/store/auth.store';
import { useUsers } from '@/hooks/use-admin';
import { useBulkAssignLeads } from '@/hooks/use-leads';
import { CollegePicker } from '@/components/college-picker';
import { SHORTCUT_GROUPS } from '@/lib/keyboard-shortcuts';

const STATUS_OPTIONS = [
  'New', 'Called', 'Interested', 'Follow Up',
  'Admission Confirmed', 'Not Interested', 'Closed',
];
const TEMPERATURE_OPTIONS = ['Hot', 'Warm', 'Cold'];
const SOURCE_OPTIONS = [
  'Meta Ads', 'Google Ads', 'Walk-In', 'Referral',
  'WhatsApp', 'Website', 'Other',
];
const COLLEGE_QUERY_PLACEHOLDER = 'Filter by college...';

export default function LeadsPage() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const {
    activeFilters,
    setFilter,
    clearFilters,
    selectedRows,
    setSelectedRows,
    clearSelectedRows,
    columnVisibility,
    setColumnVisibility,
    isCreateLeadOpen,
    openCreateLead,
    closeCreateLead,
    isQuickEditOpen,
    quickEditLeadId,
    openQuickEdit,
    closeQuickEdit,
  } = useLeadsUiStore();

  const [searchValue, setSearchValue] = useState('');
  const [collegeValue, setCollegeValue] = useState(activeFilters.preferredCollege || '');
  const [assignedToValue, setAssignedToValue] = useState(activeFilters.assignedTo || '');
  const [assigneeId, setAssigneeId] = useState('');
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState(activeFilters.sortBy || 'updatedAt');
  const [sortOrder, setSortOrder] = useState(activeFilters.order || 'desc');
  const [isFilterOpen, setIsFilterOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('leadsFilterOpen') !== 'false';
    }
    return true;
  });

  const { data, isLoading } = useLeads({ ...activeFilters, page, limit: 20 });
  const leads: Lead[] = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 20 };
  const totalPages = Math.ceil(meta.total / meta.limit);

  useEffect(() => {
    if (activeFilters.page && activeFilters.page !== page) {
      setPage(activeFilters.page);
    }
  }, [activeFilters.page, page]);

  useEffect(() => {
    setSearchValue(activeFilters.q || '');
    setCollegeValue(activeFilters.preferredCollege || '');
    setAssignedToValue(activeFilters.assignedTo || '');
    setSortBy(activeFilters.sortBy || 'updatedAt');
    setSortOrder(activeFilters.order || 'desc');
  }, [activeFilters.assignedTo, activeFilters.order, activeFilters.preferredCollege, activeFilters.q, activeFilters.sortBy]);

  useEffect(() => {
    localStorage.setItem('leadsFilterOpen', String(isFilterOpen));
  }, [isFilterOpen]);

  const bulkUpdate = useBulkUpdateLeads();
  const bulkAssign = useBulkAssignLeads();
  const { data: staffUsersData } = useUsers({ limit: 100 }, isAdmin);
  const staffUsers = (() => {
    const maybeRows = staffUsersData?.data?.data;
    const rows = Array.isArray(maybeRows)
      ? maybeRows
      : Array.isArray(staffUsersData?.data)
        ? staffUsersData.data
        : Array.isArray(staffUsersData)
          ? staffUsersData
          : [];

    return rows.filter((staff: any) =>
      ['admin', 'staff', 'superadmin'].includes(staff.role),
    );
  })();

  const debouncedSearch = useDebouncedCallback((value: string) => {
    if (value.length >= 2 || value.length === 0) {
      setFilter('q', value || undefined);
    }
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleCollegeChange = (value: string) => {
    setCollegeValue(value);
    setFilter('preferredCollege', value || undefined);
  };

  const handleAssignedToChange = (value: string) => {
    setAssignedToValue(value);
    setFilter('assignedTo', value || undefined);
  };

  const handleSortChange = (nextSortBy: string, nextSortOrder: string) => {
    setSortBy(nextSortBy);
    setSortOrder(nextSortOrder);
    setFilter('sortBy', nextSortBy);
    setFilter('order', nextSortOrder);
  };

  const handleBulkStatusChange = async (newStatus: string | null) => {
    if (!newStatus || selectedRows.length === 0) return;
    try {
      await bulkUpdate.mutateAsync({
        leadIds: selectedRows,
        action: 'status',
        value: newStatus,
      });
      toast.success(`Updated ${selectedRows.length} leads`);
      clearSelectedRows();
    } catch {
      toast.error('Failed to update leads');
    }
  };

  const handleBulkAssign = async () => {
    if (!isAdmin || !assigneeId || selectedRows.length === 0) return;
    try {
      await bulkAssign.mutateAsync({ leadIds: selectedRows, assignedTo: assigneeId });
      toast.success(`Assigned ${selectedRows.length} leads`);
      clearSelectedRows();
      setAssigneeId('');
    } catch {
      toast.error('Failed to assign leads');
    }
  };

  const handleClearFilters = () => {
    setSearchValue('');
    setCollegeValue('');
    setAssignedToValue('');
    setAssigneeId('');
    setSortBy('updatedAt');
    setSortOrder('desc');
    clearFilters();
  };

  const visibleLeadIds = leads.map((lead) => lead._id);

  const getFocusedLeadIndex = () => {
    if (visibleLeadIds.length === 0) return -1;

    const selectedLeadId = selectedRows[0];
    const selectedIndex = visibleLeadIds.findIndex((leadId) => leadId === selectedLeadId);
    return selectedIndex >= 0 ? selectedIndex : 0;
  };

  const focusLeadByIndex = useCallback((index: number) => {
    if (visibleLeadIds.length === 0) return;

    const nextIndex = Math.max(0, Math.min(index, visibleLeadIds.length - 1));
    setSelectedRows([visibleLeadIds[nextIndex]]);
  }, [setSelectedRows, visibleLeadIds]);

  const openFocusedLead = useCallback(() => {
    if (visibleLeadIds.length === 0) return;

    const focusedIndex = getFocusedLeadIndex();
    const leadId = focusedIndex >= 0 ? visibleLeadIds[focusedIndex] : visibleLeadIds[0];
    if (leadId) {
      router.push(`/leads/${leadId}`);
    }
  }, [router, visibleLeadIds, selectedRows]);

  useKeyboardShortcuts({
    n: openCreateLead,
    '/': () => document.getElementById('search-input')?.focus(),
    '?': () => setIsShortcutHelpOpen(true),
    c: handleClearFilters,
    j: () => focusLeadByIndex(getFocusedLeadIndex() + 1),
    k: () => focusLeadByIndex(getFocusedLeadIndex() - 1),
    Enter: openFocusedLead,
    Escape: () => {
      closeCreateLead();
      closeQuickEdit();
      setIsShortcutHelpOpen(false);
    },
  });

  const columns: ColumnDef<Lead>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <div
          data-row-interactive="true"
          className="inline-flex"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              const ids = table.getRowModel().rows.map((r) => r.original._id);
              setSelectedRows(value ? ids : []);
            }}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div
          data-row-interactive="true"
          className="inline-flex"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={selectedRows.includes(row.original._id)}
            onCheckedChange={(value) => {
              const id = row.original._id;
              if (value) {
                setSelectedRows([...selectedRows, id]);
              } else {
                setSelectedRows(selectedRows.filter((r) => r !== id));
              }
            }}
          />
        </div>
      ),
      size: 40,
    },
    {
      accessorKey: 'studentName',
      header: 'Student Name',
      cell: ({ row }) => (
        <div className="font-medium text-foreground">
          {row.original.studentName}
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-sm">
          {row.original.phone}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'temperature',
      header: 'Temp',
      cell: ({ row }) => (
        <TemperatureBadge temperature={row.original.temperature} />
      ),
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.source}</span>
      ),
    },
    {
      id: 'followUpDate',
      header: 'Follow-up',
      cell: ({ row }) => (
        <FollowUpDateBadge date={row.original.followUp?.scheduledFor} />
      ),
    },
    {
      id: 'createdBy',
      header: 'Created By',
      cell: ({ row }) => {
        const cb = row.original.createdBy;
        const name = typeof cb === 'object' ? cb?.name : '—';
        return <span className="text-muted-foreground text-sm">{name}</span>;
      },
    },
    {
      id: 'assignedTo',
      header: 'Assigned To',
      cell: ({ row }) => {
        const assignedTo = row.original.assignedTo;
        const name = typeof assignedTo === 'object' ? assignedTo?.name : '—';
        return <span className="text-muted-foreground text-sm">{name}</span>;
      },
    },
    {
      id: 'actions',
        header: '',
        cell: ({ row }) => {
          const phone = row.original.phone || '';
          const phoneDigits = phone.replace(/[^0-9+]/g, '');
          const waUrl = `https://wa.me/${phoneDigits.replace(/^\+/, '')}`;
          return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                title="Call"
                onClick={() => window.open(`tel:${phoneDigits}`)}
                aria-label="Call lead"
              >
                <Phone className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="WhatsApp"
                onClick={() => window.open(waUrl, '_blank')}
                aria-label="WhatsApp lead"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openQuickEdit(row.original._id);
                }}
                title="Edit lead"
                aria-label="Edit lead"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          );
        },
    },
  ];

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility: columnVisibility as VisibilityState,
    },
    onColumnVisibilityChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater(columnVisibility as VisibilityState);
        Object.entries(newState).forEach(([col, visible]) => {
          setColumnVisibility(col, visible);
        });
      }
    },
  });

  if (isMobile) {
    return (
      <>
        <MobileLeadsList
          leads={leads}
          isLoading={isLoading}
          onOpenCreate={openCreateLead}
          openQuickEdit={openQuickEdit}
          activeFilters={activeFilters}
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          onFilterChange={setFilter}
          onClearFilters={handleClearFilters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          page={page}
          totalPages={totalPages}
          meta={meta}
          onPageChange={setPage}
        />
        <CreateLeadModal open={isCreateLeadOpen} onClose={closeCreateLead} />
        <QuickEditDrawer
          open={isQuickEditOpen}
          leadId={quickEditLeadId}
          onClose={closeQuickEdit}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta.total} total leads
          </p>
        </div>
        <Button
          onClick={openCreateLead}
          variant="default"
          size="default"
        >
          + Add Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border shadow-soft">
        <div className="border-b border-border px-4 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center justify-between lg:flex-row gap-3 w-full lg:w-auto"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Search and sort</p>
              <p className="text-xs text-muted-foreground">Find leads quickly, then narrow by status, source, or college.</p>
            </div>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-muted-foreground transition-transform duration-200',
                isFilterOpen && 'rotate-180',
              )}
            />
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {(activeFilters.status ||
              activeFilters.temperature ||
              activeFilters.source ||
              activeFilters.q ||
              activeFilters.preferredCollege ||
              activeFilters.assignedTo) && (
              <Button variant="ghost" onClick={handleClearFilters} size="sm">
                Clear filters
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground h-9">
                <Settings className="w-4 h-4" /> Columns
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {table.getAllColumns().map((column) => {
                  if (!column.getCanHide()) return null;
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
            <div className="space-y-1.5 lg:col-span-4">
              <Label htmlFor="search-input" className="text-xs uppercase tracking-wide text-muted-foreground">
                Search
              </Label>
              <Input
                id="search-input"
                placeholder="Name, phone, email, or college"
                value={searchValue}
                onChange={handleSearchChange}
              />
              <p className="text-xs text-muted-foreground">Search runs across student, phone, email, and college fields.</p>
            </div>

            <div className="space-y-1.5 md:col-span-1 lg:col-span-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                College
              </Label>
              <CollegePicker
                value={collegeValue}
                onValueChange={handleCollegeChange}
                placeholder={COLLEGE_QUERY_PLACEHOLDER}
              />
              <p className="text-xs text-muted-foreground">Type to filter by any existing college name.</p>
            </div>

            {isAdmin && (
              <div className="space-y-1.5 md:col-span-1 lg:col-span-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Assigned to
                </Label>
                <Select
                  value={assignedToValue || 'all'}
                  onValueChange={(value) => handleAssignedToChange(value === 'all' ? '' : (value ?? ''))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All assignees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All assignees</SelectItem>
                    {staffUsers.map((staff: any) => (
                      <SelectItem key={staff._id} value={staff._id}>
                        {staff.name} · {staff.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Admin-only filter by lead owner.</p>
              </div>
            )}

            <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </Label>
              <Select
                value={activeFilters.status || 'all'}
                onValueChange={(v) => setFilter('status', v === 'all' ? undefined : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Pipeline stage for the lead.</p>
            </div>

            <div className="space-y-1.5 md:col-span-1 lg:col-span-1">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Temp
              </Label>
              <Select
                value={activeFilters.temperature || 'all'}
                onValueChange={(v) => setFilter('temperature', v === 'all' ? undefined : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  {TEMPERATURE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Lead interest level.</p>
            </div>

            <div className="space-y-1.5 md:col-span-1 lg:col-span-1">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Source
              </Label>
              <Select
                value={activeFilters.source || 'all'}
                onValueChange={(v) => setFilter('source', v === 'all' ? undefined : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  {SOURCE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Original lead source.</p>
            </div>

            <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Sort by
              </Label>
              <Select value={sortBy} onValueChange={(value) => value && handleSortChange(value, sortOrder)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">Last updated</SelectItem>
                  <SelectItem value="createdAt">Newest created</SelectItem>
                  <SelectItem value="studentName">Student name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="temperature">Temperature</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Which field controls ordering.</p>
            </div>

            <div className="space-y-1.5 lg:col-span-1">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Order
              </Label>
              <Select value={sortOrder} onValueChange={(value) => value && handleSortChange(sortBy, value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Dir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest first</SelectItem>
                  <SelectItem value="asc">Oldest first</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Ascending or descending.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Active filters:</span>
            {activeFilters.status && <span className="rounded-full bg-muted px-3 py-1">Status: {activeFilters.status}</span>}
            {activeFilters.temperature && <span className="rounded-full bg-muted px-3 py-1">Temp: {activeFilters.temperature}</span>}
            {activeFilters.source && <span className="rounded-full bg-muted px-3 py-1">Source: {activeFilters.source}</span>}
            {activeFilters.q && <span className="rounded-full bg-muted px-3 py-1">Search: {activeFilters.q}</span>}
            {activeFilters.preferredCollege && <span className="rounded-full bg-muted px-3 py-1">College: {activeFilters.preferredCollege}</span>}
            {activeFilters.assignedTo && <span className="rounded-full bg-muted px-3 py-1">Assigned to: {staffUsers.find((staff: any) => staff._id === activeFilters.assignedTo)?.name || 'Selected staff'}</span>}
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Sort: {sortBy} · {sortOrder}</span>
          </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk actions bar */}
      {selectedRows.length > 0 && (
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium text-primary">
            {selectedRows.length} selected
          </span>
          <div className="w-full sm:w-40">
            <Select onValueChange={(v) => handleBulkStatusChange(typeof v === 'string' ? v : null)}>
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="Bulk status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isAdmin && (
            <>
              <div className="w-full sm:w-52">
                <Select value={assigneeId} onValueChange={(v) => v && setAssigneeId(v)}>
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="Assign to staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffUsers.map((staff: any) => (
                      <SelectItem key={staff._id} value={staff._id}>
                        {staff.name} · {staff.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                onClick={handleBulkAssign}
                disabled={!assigneeId || bulkAssign.isPending}
              >
                Assign
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelectedRows}
            className="text-xs"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            title="No leads yet"
            description="Add your first student to get started."
            cta={{ label: 'Add Lead', onClick: openCreateLead }}
          />
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-gradient-to-r from-muted/40 to-muted/20 border-b border-border hover:bg-muted/50 transition-colors">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-xs font-bold uppercase text-foreground tracking-wide py-3"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row, index) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className={cn(
                    'cursor-pointer border-l-4 transition-all duration-200 group',
                    'hover:bg-accent/50 dark:hover:bg-accent/20',
                    'border-b border-border last:border-b-0',
                    temperatureBorderClass(row.original.temperature),
                  )}
                  onClick={() => router.push(`/leads/${row.original._id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 sm:px-4 py-4 text-xs sm:text-sm group-hover:text-foreground transition-colors">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {meta.total} leads
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex-1 sm:flex-none"
            >
              ← Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex-1 sm:flex-none"
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateLeadModal open={isCreateLeadOpen} onClose={closeCreateLead} />
      <QuickEditDrawer
        open={isQuickEditOpen}
        leadId={quickEditLeadId}
        onClose={closeQuickEdit}
      />
      <Dialog open={isShortcutHelpOpen} onOpenChange={setIsShortcutHelpOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
            <DialogDescription>
              Fast actions for navigating the leads page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.title}
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {group.items
                    .filter((item) => item.context === 'Everywhere' || item.context === 'Leads page')
                    .map((item) => (
                      <div key={`${group.title}-${item.key}`} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2">
                        <div>
                          <p className="font-medium text-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground">{item.context}</p>
                        </div>
                        <kbd className="rounded border border-border bg-card px-2 py-0.5 font-mono text-xs">
                          {item.key}
                        </kbd>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShortcutHelpOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard shortcut hint */}
      <div className="fixed bottom-6 right-6 text-xs text-muted-foreground hidden md:block">
        Press <kbd className="px-1 py-0.5 bg-muted border border-border rounded">?</kbd> for shortcuts
      </div>
    </div>
  );
}

// ─── Mobile Leads List ────────────────────────────────────────────────────────

const STATUS_OPTIONS_MOBILE = [
  'New', 'Called', 'Interested', 'Follow Up',
  'Admission Confirmed', 'Not Interested', 'Closed',
];
const TEMP_OPTIONS_MOBILE = ['Hot', 'Warm', 'Cold'];
const SOURCE_OPTIONS_MOBILE = [
  'Meta Ads', 'Google Ads', 'Walk-In', 'Referral', 'WhatsApp', 'Website', 'Other',
];

const TEMP_ICONS: Record<string, React.ReactNode> = {
  Hot:  <Flame className="w-3 h-3" />,
  Warm: <Sun className="w-3 h-3" />,
  Cold: <Snowflake className="w-3 h-3" />,
};

function MobileLeadsList({
  leads,
  isLoading,
  onOpenCreate,
  openQuickEdit,
  activeFilters,
  searchValue,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  sortBy,
  sortOrder,
  onSortChange,
  page,
  totalPages,
  meta,
  onPageChange,
}: {
  leads: Lead[];
  isLoading: boolean;
  onOpenCreate: () => void;
  openQuickEdit: (id: string) => void;
  activeFilters: Record<string, any>;
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterChange: (key: keyof LeadFilters, value: string | undefined) => void;
  onClearFilters: () => void;
  sortBy: string;
  sortOrder: string;
  onSortChange: (field: string, order: string) => void;
  page: number;
  totalPages: number;
  meta: { total: number; page: number; limit: number };
  onPageChange: React.Dispatch<React.SetStateAction<number>>;
}) {
  const router = useRouter();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const hasActiveFilters = !!(activeFilters.status || activeFilters.temperature || activeFilters.source || activeFilters.q || activeFilters.preferredCollege);

  return (
    <div className="flex flex-col h-full">
      {/* ── Top: title + search ────────────────────────────── */}
      <div className="space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Leads</h1>
            <p className="text-xs text-muted-foreground">{meta.total} total</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="search-input"
            placeholder="Search name, phone, email…"
            value={searchValue}
            onChange={onSearchChange}
            className="pl-9 h-10 text-sm bg-card border-border"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange({ target: { value: '' } } as any)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground touch-target"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5">
            {activeFilters.status && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-medium px-2 py-1 rounded-full">
                {activeFilters.status}
                <button onClick={() => onFilterChange('status', undefined)}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {activeFilters.temperature && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-medium px-2 py-1 rounded-full">
                {TEMP_ICONS[activeFilters.temperature]} {activeFilters.temperature}
                <button onClick={() => onFilterChange('temperature', undefined)}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {activeFilters.source && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-medium px-2 py-1 rounded-full">
                {activeFilters.source}
                <button onClick={() => onFilterChange('source', undefined)}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            <button
              onClick={onClearFilters}
              className="text-[10px] text-muted-foreground underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Lead cards ────────────────────────────────────── */}
      <div className="space-y-2 scroll-ios pb-28">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))
        ) : leads.length === 0 ? (
          <EmptyState
            title="No leads found"
            description={hasActiveFilters ? 'Try clearing your filters.' : 'Add your first student to get started.'}
            cta={hasActiveFilters ? { label: 'Clear filters', onClick: onClearFilters } : { label: 'Add Lead', onClick: onOpenCreate }}
          />
        ) : (
          leads.map((lead, index) => {
            const phone = lead.phone || '';
            const phoneDigits = phone.replace(/[^0-9+]/g, '');
            const waUrl = `https://wa.me/${phoneDigits.replace(/^\+/, '')}`;
            return (
              <motion.div
                key={lead._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={cn(
                  'bg-card rounded-xl border border-border border-l-4 p-3 cursor-pointer',
                  'active:opacity-75 transition-opacity',
                  temperatureBorderClass(lead.temperature),
                )}
                onClick={() => router.push(`/leads/${lead._id}`)}
              >
                {/* Row 1: name + status badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground truncate leading-snug">
                      {lead.studentName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{lead.phone}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={cn(
                        'badge-compact',
                        {
                          New: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
                          Called: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
                          Interested: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                          'Follow Up': 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
                          'Admission Confirmed': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                          'Not Interested': 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
                          Closed: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
                        }[lead.status] || 'bg-muted text-muted-foreground'
                      )}
                    >
                      {lead.status}
                    </span>
                    <span
                      className={cn(
                        'badge-compact inline-flex items-center gap-0.5',
                        {
                          Hot: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
                          Warm: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                          Cold: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
                        }[lead.temperature] || 'bg-muted text-muted-foreground'
                      )}
                    >
                      {TEMP_ICONS[lead.temperature]}
                      {lead.temperature}
                    </span>
                  </div>
                </div>

                {/* Row 2: source + follow-up + quick actions */}
                <div className="flex items-center justify-between mt-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {lead.source && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[90px]">
                        {lead.source}
                      </span>
                    )}
                    {lead.followUp?.scheduledFor && (
                      <span className="text-[10px] text-muted-foreground">
                        <FollowUpDateBadge date={lead.followUp.scheduledFor} />
                      </span>
                    )}
                  </div>

                  {/* Quick action buttons */}
                  <div
                    className="flex items-center gap-0.5 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => window.open(`tel:${phoneDigits}`)}
                      className="touch-target rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => window.open(waUrl, '_blank')}
                      className="touch-target rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openQuickEdit(lead._id)}
                      className="touch-target rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Quick edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange((p) => p - 1)} className="h-8 text-xs">
                ← Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange((p) => p + 1)} className="h-8 text-xs">
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── FAB: Add Lead ─────────────────────────────────── */}
      <button
        onClick={onOpenCreate}
        className="fab-lg shadow-xl"
        style={{ right: 'calc(1rem + env(safe-area-inset-right, 0px))' }}
        aria-label="Add lead"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ── FAB: Filters ──────────────────────────────────── */}
      <button
        onClick={() => setIsFilterSheetOpen(true)}
        className={cn(
          'fab-md shadow-xl',
          hasActiveFilters ? 'bg-primary ring-2 ring-primary/50' : 'bg-card text-foreground border border-border',
        )}
        style={{ right: 'calc(5rem + env(safe-area-inset-right, 0px))' }}
        aria-label="Filters and sort"
      >
        <SlidersHorizontal className="w-5 h-5" />
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-destructive rounded-full text-[8px] text-white flex items-center justify-center font-bold">
            !
          </span>
        )}
      </button>

      {/* ── Filter Bottom Sheet ───────────────────────────── */}
      <AnimatePresence>
        {isFilterSheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="sheet-backdrop"
              onClick={() => setIsFilterSheetOpen(false)}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl border-t border-border shadow-xl scroll-ios"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            >
              {/* Sheet handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <div className="px-4 pt-2 pb-4 flex items-center justify-between">
                <p className="font-semibold text-foreground text-base">Filters &amp; Sort</p>
                <button onClick={() => setIsFilterSheetOpen(false)} className="touch-target text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 space-y-4 max-h-[65vh] overflow-y-auto scroll-ios">
                {/* Status */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS_MOBILE.map((s) => (
                      <button
                        key={s}
                        onClick={() => onFilterChange('status', activeFilters.status === s ? undefined : s)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                          activeFilters.status === s
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted text-muted-foreground border-border hover:border-primary hover:text-primary',
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Temperature</p>
                  <div className="flex gap-2">
                    {TEMP_OPTIONS_MOBILE.map((t) => (
                      <button
                        key={t}
                        onClick={() => onFilterChange('temperature', activeFilters.temperature === t ? undefined : t)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-colors',
                          activeFilters.temperature === t
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted text-muted-foreground border-border',
                        )}
                      >
                        {TEMP_ICONS[t]} {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</p>
                  <div className="flex flex-wrap gap-2">
                    {SOURCE_OPTIONS_MOBILE.map((s) => (
                      <button
                        key={s}
                        onClick={() => onFilterChange('source', activeFilters.source === s ? undefined : s)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                          activeFilters.source === s
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted text-muted-foreground border-border hover:border-primary hover:text-primary',
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sort</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'updatedAt', label: 'Last updated' },
                      { value: 'createdAt', label: 'Newest created' },
                      { value: 'studentName', label: 'Name' },
                      { value: 'temperature', label: 'Temperature' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => onSortChange(opt.value, sortOrder)}
                        className={cn(
                          'py-2 px-3 rounded-xl text-xs font-medium border transition-colors text-left',
                          sortBy === opt.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted text-muted-foreground border-border',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSortChange(sortBy, 'desc')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-colors',
                        sortOrder === 'desc' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border',
                      )}
                    >
                      <ArrowUpDown className="w-3 h-3" /> Newest first
                    </button>
                    <button
                      onClick={() => onSortChange(sortBy, 'asc')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-colors',
                        sortOrder === 'asc' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border',
                      )}
                    >
                      <ArrowUpDown className="w-3 h-3" /> Oldest first
                    </button>
                  </div>
                </div>

                {/* Clear all */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { onClearFilters(); setIsFilterSheetOpen(false); }}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
