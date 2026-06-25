'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuditLogs } from '@/hooks/use-admin';
import { EmptyState } from '@/components/empty-state';

const ACTION_OPTIONS = [
  'LEAD_CREATED',
  'LEAD_UPDATED',
  'LEAD_CLOSED',
  'LEAD_DELETED',
  'LEADS_ASSIGNED',
  'LEADS_EXPORTED',
  'BULK_UPDATE',
  'DUPLICATE_OVERRIDE',
  'USER_CREATED',
  'USER_DISABLED',
  'USER_ENABLED',
  'USER_UPDATED',
];

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string | undefined>();

  const { data, isLoading } = useAuditLogs({
    page,
    limit: 20,
    action: actionFilter,
  });

  const logs = data?.data?.data || data?.data || [];
  const meta = data?.data?.meta || data?.meta || { total: 0, page: 1, limit: 20 };
  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">
            Admin actions and system events
          </p>
        </div>
        <Select
          value={actionFilter || 'all'}
          onValueChange={(v) =>
            setActionFilter(v === 'all' ? undefined : (v as string))
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by action..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {ACTION_OPTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))
      ) : logs.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No audit logs"
          description="Admin actions will appear here."
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Action
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Performed By
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Details
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr
                      key={log._id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={
                            log.action === 'DUPLICATE_OVERRIDE'
                              ? 'bg-amber-100 text-amber-700'
                              : log.action.includes('DISABLED')
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }
                        >
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {log.performedByName}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {log.action === 'DUPLICATE_OVERRIDE' &&
                        log.metadata?.duplicateLeadId ? (
                          <Link
                            href={`/leads/${log.metadata.duplicateLeadId}`}
                            className="text-indigo-600 hover:underline"
                          >
                            View lead →
                          </Link>
                        ) : log.metadata ? (
                          <span className="font-mono text-xs">
                            {JSON.stringify(log.metadata).slice(0, 80)}
                            {JSON.stringify(log.metadata).length > 80 && '...'}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
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
        </>
      )}
    </div>
  );
}
