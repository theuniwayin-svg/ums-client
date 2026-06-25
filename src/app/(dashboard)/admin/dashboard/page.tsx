'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import {
  useAnalyticsDashboard,
  useStaffPerformance,
  useAnalyticsTrends,
} from '@/hooks/use-admin';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  New: '#6366f1',
  Called: '#8b5cf6',
  Interested: '#f59e0b',
  'Follow Up': '#f97316',
  'Admission Confirmed': '#22c55e',
  'Not Interested': '#9ca3af',
  Closed: '#ef4444',
};

const TEMP_COLORS: Record<string, string> = {
  Hot: '#ef4444',
  Warm: '#f59e0b',
  Cold: '#3b82f6',
};

export default function AdminDashboardPage() {
  const { data: dashboard, isLoading: dashLoading } = useAnalyticsDashboard();
  const { data: staff, isLoading: staffLoading } = useStaffPerformance();
  const { data: trends, isLoading: trendsLoading } = useAnalyticsTrends('30d');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Team performance and pipeline overview
        </p>
      </div>

      {/* KPI Cards */}
      {dashLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Total Active Leads"
            value={dashboard?.totalActiveLeads ?? 0}
            icon="👥"
            color="indigo"
          />
          <KpiCard
            label="Admissions This Month"
            value={dashboard?.admissionsThisMonth ?? 0}
            icon="🎓"
            color="green"
          />
          <KpiCard
            label="Pending Follow-ups"
            value={dashboard?.pendingFollowUps ?? 0}
            icon="🔔"
            color="amber"
          />
          <KpiCard
            label="Hot Leads"
            value={dashboard?.leadsByTemperature?.Hot ?? 0}
            icon="🔥"
            color="red"
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lead trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Lead Creation (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : !trends?.trends?.length ? (
              <EmptyState
                icon="📈"
                title="Not enough data yet"
                description="Insights will appear as leads are added."
              />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trends.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Lead by status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {dashLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={Object.entries(
                      dashboard?.leadsByStatus || {},
                    ).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {Object.keys(dashboard?.leadsByStatus || {}).map(
                      (key) => (
                        <Cell
                          key={key}
                          fill={
                            STATUS_COLORS[key] || '#9ca3af'
                          }
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Lead by source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {dashLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={Object.entries(
                    dashboard?.leadsBySource || {},
                  ).map(([name, value]) => ({ name, value }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Temperature */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Temperature</CardTitle>
          </CardHeader>
          <CardContent>
            {dashLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={Object.entries(
                      dashboard?.leadsByTemperature || {},
                    ).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {Object.keys(dashboard?.leadsByTemperature || {}).map(
                      (key) => (
                        <Cell key={key} fill={TEMP_COLORS[key] || '#9ca3af'} />
                      ),
                    )}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Staff Performance (Last 7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {staffLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !staff?.staff?.length ? (
            <EmptyState
              icon="👤"
              title="No staff data"
              description="Activity data will appear once staff start using the system."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">
                      Staff
                    </th>
                    <th className="text-right py-2 text-gray-500 font-medium">
                      Leads Created
                    </th>
                    <th className="text-right py-2 text-gray-500 font-medium">
                      Admissions
                    </th>
                    <th className="text-right py-2 text-gray-500 font-medium">
                      Activities
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staff.staff.map((s: any) => (
                    <tr key={s._id} className="border-b border-gray-100">
                      <td className="py-2 font-medium">{s.name}</td>
                      <td className="py-2 text-right">{s.leadsCreated}</td>
                      <td className="py-2 text-right text-green-600">
                        {s.admissions}
                      </td>
                      <td className="py-2 text-right text-gray-500">
                        {s.activitiesThisWeek}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-2xl p-2 rounded-lg ${colorMap[color] || 'bg-gray-50'}`}>
            {icon}
          </span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
