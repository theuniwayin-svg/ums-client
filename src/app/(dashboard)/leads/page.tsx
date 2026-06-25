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
import { motion } from 'framer-motion';
import { toast } from 'sonner';
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
        <div className="font-medium text-gray-900">
          {row.original.studentName}
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="text-gray-600 font-mono text-sm">
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
        <span className="text-gray-600 text-sm">{row.original.source}</span>
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
        return <span className="text-gray-500 text-sm">{name}</span>;
      },
    },
    {
      id: 'assignedTo',
      header: 'Assigned To',
      cell: ({ row }) => {
        const assignedTo = row.original.assignedTo;
        const name = typeof assignedTo === 'object' ? assignedTo?.name : '—';
        return <span className="text-gray-500 text-sm">{name}</span>;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openQuickEdit(row.original._id);
          }}
        >
          ✏️
        </Button>
      ),
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
    return <MobileLeadsList leads={leads} isLoading={isLoading} onOpenCreate={openCreateLead} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">
            {meta.total} total leads
          </p>
        </div>
        <Button
          onClick={openCreateLead}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          + Add Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Search and sort</p>
            <p className="text-xs text-gray-500">Find leads quickly, then narrow by status, source, or college.</p>
          </div>
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
                ⚙️ Columns
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

        <div className="px-4 py-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="space-y-1.5 lg:col-span-4">
              <Label htmlFor="search-input" className="text-xs uppercase tracking-wide text-gray-500">
                Search
              </Label>
              <Input
                id="search-input"
                placeholder="Name, phone, email, or college"
                value={searchValue}
                onChange={handleSearchChange}
              />
              <p className="text-xs text-gray-500">Search runs across student, phone, email, and college fields.</p>
            </div>

            <div className="space-y-1.5 lg:col-span-3">
              <Label className="text-xs uppercase tracking-wide text-gray-500">
                College
              </Label>
              <CollegePicker
                value={collegeValue}
                onValueChange={handleCollegeChange}
                placeholder={COLLEGE_QUERY_PLACEHOLDER}
              />
              <p className="text-xs text-gray-500">Type to filter by any existing college name.</p>
            </div>

            {isAdmin && (
              <div className="space-y-1.5 lg:col-span-3">
                <Label className="text-xs uppercase tracking-wide text-gray-500">
                  Assigned to
                </Label>
                <Select
                  value={assignedToValue || 'all'}
                  onValueChange={(value) => handleAssignedToChange(value === 'all' ? '' : value)}
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

            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-xs uppercase tracking-wide text-gray-500">
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
              <p className="text-xs text-gray-500">Pipeline stage for the lead.</p>
            </div>

            <div className="space-y-1.5 lg:col-span-1">
              <Label className="text-xs uppercase tracking-wide text-gray-500">
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
              <p className="text-xs text-gray-500">Lead interest level.</p>
            </div>

            <div className="space-y-1.5 lg:col-span-1">
              <Label className="text-xs uppercase tracking-wide text-gray-500">
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
              <p className="text-xs text-gray-500">Original lead source.</p>
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-xs uppercase tracking-wide text-gray-500">
                Sort by
              </Label>
              <Select value={sortBy} onValueChange={(value) => handleSortChange(value, sortOrder)}>
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
              <p className="text-xs text-gray-500">Which field controls ordering.</p>
            </div>

            <div className="space-y-1.5 lg:col-span-1">
              <Label className="text-xs uppercase tracking-wide text-gray-500">
                Order
              </Label>
              <Select value={sortOrder} onValueChange={(value) => handleSortChange(sortBy, value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Dir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest first</SelectItem>
                  <SelectItem value="asc">Oldest first</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Ascending or descending.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="font-medium text-gray-700">Active filters:</span>
            {activeFilters.status && <span className="rounded-full bg-gray-100 px-3 py-1">Status: {activeFilters.status}</span>}
            {activeFilters.temperature && <span className="rounded-full bg-gray-100 px-3 py-1">Temp: {activeFilters.temperature}</span>}
            {activeFilters.source && <span className="rounded-full bg-gray-100 px-3 py-1">Source: {activeFilters.source}</span>}
            {activeFilters.q && <span className="rounded-full bg-gray-100 px-3 py-1">Search: {activeFilters.q}</span>}
            {activeFilters.preferredCollege && <span className="rounded-full bg-gray-100 px-3 py-1">College: {activeFilters.preferredCollege}</span>}
            {activeFilters.assignedTo && <span className="rounded-full bg-gray-100 px-3 py-1">Assigned to: {staffUsers.find((staff: any) => staff._id === activeFilters.assignedTo)?.name || 'Selected staff'}</span>}
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">Sort: {sortBy} · {sortOrder}</span>
          </div>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
          <span className="text-sm font-medium text-indigo-700">
            {selectedRows.length} selected
          </span>
          <div className="w-40">
            <Select onValueChange={handleBulkStatusChange}>
              <SelectTrigger className="w-full h-9 text-xs bg-white">
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
              <div className="w-52">
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className="w-full h-9 text-xs bg-white">
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
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Assign
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelectedRows}
            className="text-xs text-gray-500"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No leads yet"
            description="Add your first student to get started."
            cta={{ label: 'Add Lead', onClick: openCreateLead }}
          />
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-gray-50">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-xs font-semibold uppercase text-gray-500"
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
                  className={`cursor-pointer border-l-4 transition-colors hover:bg-gray-50 ${temperatureBorderClass(
                    row.original.temperature,
                  )}`}
                  onClick={() => router.push(`/leads/${row.original._id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} · {meta.total} leads
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
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
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {group.title}
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {group.items
                    .filter((item) => item.context === 'Everywhere' || item.context === 'Leads page')
                    .map((item) => (
                      <div key={`${group.title}-${item.key}`} className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <div>
                          <p className="font-medium text-gray-900">{item.description}</p>
                          <p className="text-xs text-gray-500">{item.context}</p>
                        </div>
                        <kbd className="rounded border border-gray-200 bg-white px-2 py-0.5 font-mono text-xs">
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
      <div className="fixed bottom-6 right-6 text-xs text-gray-400">
        Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">?</kbd> for shortcuts
      </div>
    </div>
  );
}

function MobileLeadsList({
  leads,
  isLoading,
  onOpenCreate,
}: {
  leads: Lead[];
  isLoading: boolean;
  onOpenCreate: () => void;
}) {
  const router = useRouter();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <Button onClick={onOpenCreate} size="sm" className="bg-indigo-600">
          + Add
        </Button>
      </div>
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))
      ) : leads.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No leads yet"
          description="Add your first student."
          cta={{ label: 'Add Lead', onClick: onOpenCreate }}
        />
      ) : (
        leads.map((lead, index) => (
          <motion.div
            key={lead._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-xl border border-gray-200 border-l-4 p-4 cursor-pointer active:opacity-80 ${temperatureBorderClass(lead.temperature)}`}
            onClick={() => router.push(`/leads/${lead._id}`)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">
                  {lead.studentName}
                </p>
                <p className="text-sm text-gray-500 font-mono">{lead.phone}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={lead.status} />
                <TemperatureBadge temperature={lead.temperature} />
              </div>
            </div>
            {lead.followUp?.scheduledFor && (
              <div className="mt-2 text-xs text-gray-500">
                Follow-up: <FollowUpDateBadge date={lead.followUp.scheduledFor} />
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );
}
