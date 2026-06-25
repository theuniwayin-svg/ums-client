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
import { Users, GraduationCap, Clock, Flame, TrendingUp, User } from 'lucide-react';

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
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
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
            Icon={Users}
            color="indigo"
          />
          <KpiCard
            label="Admissions This Month"
            value={dashboard?.admissionsThisMonth ?? 0}
            Icon={GraduationCap}
            color="green"
          />
          <KpiCard
            label="Pending Follow-ups"
            value={dashboard?.pendingFollowUps ?? 0}
            Icon={Clock}
            color="amber"
          />
          <KpiCard
            label="Hot Leads"
            value={dashboard?.leadsByTemperature?.Hot ?? 0}
            Icon={Flame}
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
                title="Not enough data yet"
                description="Insights will appear as leads are added."
              />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trends.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                  />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
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
              title="No staff data"
              description="Activity data will appear once staff start using the system."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-2 text-muted-foreground font-semibold">
                      Staff
                    </th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-semibold">
                      Leads Created
                    </th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-semibold">
                      Admissions
                    </th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-semibold">
                      Activities
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staff.staff.map((s: any) => (
                    <tr key={s._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 font-medium text-foreground">{s.name}</td>
                      <td className="py-3 px-2 text-right text-foreground">{s.leadsCreated}</td>
                      <td className="py-3 px-2 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        {s.admissions}
                      </td>
                      <td className="py-3 px-2 text-right text-muted-foreground">
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
  Icon,
  color,
}: {
  label: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    indigo: { bg: 'bg-indigo-500/15 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400' },
    green: { bg: 'bg-emerald-500/15 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
    amber: { bg: 'bg-amber-500/15 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
    red: { bg: 'bg-rose-500/15 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400' },
  };

  const colors = colorMap[color] || colorMap.indigo;

  return (
    <Card className="border border-border hover:border-border/80 transition-all duration-200 shadow-sm hover:shadow-md">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-3 rounded-xl ${colors.bg}`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
