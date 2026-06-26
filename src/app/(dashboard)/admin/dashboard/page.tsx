'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { cn } from '@/lib/utils';
import {
  useAnalyticsDashboard,
  useStaffPerformance,
  useAnalyticsTrends,
} from '@/hooks/use-admin';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowUpRight,
  Award,
  Clock,
  Flame,
  GraduationCap,
  ListChecks,
  Users,
} from 'lucide-react';

type CountMap = Record<string, number>;

type DashboardAnalytics = {
  leadsByStatus?: CountMap;
  leadsByTemperature?: CountMap;
  leadsBySource?: CountMap;
  admissionsThisMonth?: number;
  totalActiveLeads?: number;
  pendingFollowUps?: number;
};

type TrendPoint = {
  date: string;
  count: number;
};

type TrendsResponse = {
  trends?: TrendPoint[];
  period?: string;
};

type StaffMember = {
  _id: string;
  name: string;
  leadsCreated?: number;
  admissions?: number;
  activitiesThisWeek?: number;
};

type StaffPerformanceResponse = {
  staff?: StaffMember[];
};

type ChartDatum = {
  name: string;
  value: number;
  color: string;
};

const STATUS_ORDER = [
  'New',
  'Called',
  'Interested',
  'Follow Up',
  'Admission Confirmed',
  'Not Interested',
  'Closed',
];

const STATUS_COLORS: Record<string, string> = {
  New: '#4f46e5',
  Called: '#7c3aed',
  Interested: '#d97706',
  'Follow Up': '#ea580c',
  'Admission Confirmed': '#059669',
  'Not Interested': '#64748b',
  Closed: '#dc2626',
};

const TEMP_COLORS: Record<string, string> = {
  Hot: '#dc2626',
  Warm: '#d97706',
  Cold: '#2563eb',
};

const SOURCE_COLORS = [
  '#4f46e5',
  '#0f766e',
  '#d97706',
  '#be123c',
  '#0891b2',
  '#65a30d',
  '#7c3aed',
];

const numberFormatter = new Intl.NumberFormat('en-IN');
const compactNumberFormatter = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const tooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  color: 'var(--card-foreground)',
  boxShadow: '0 14px 40px rgb(15 23 42 / 0.12)',
};

export default function AdminDashboardPage() {
  const { data: dashboardData, isLoading: dashLoading } =
    useAnalyticsDashboard();
  const { data: staffData, isLoading: staffLoading } = useStaffPerformance();
  const { data: trendsData, isLoading: trendsLoading } =
    useAnalyticsTrends('30d');

  const dashboard = dashboardData as DashboardAnalytics | undefined;
  const trendsResponse = trendsData as TrendsResponse | undefined;
  const staffResponse = staffData as StaffPerformanceResponse | undefined;

  const analytics = useMemo(() => {
    const leadsByStatus = dashboard?.leadsByStatus ?? {};
    const leadsByTemperature = dashboard?.leadsByTemperature ?? {};
    const leadsBySource = dashboard?.leadsBySource ?? {};
    const activeLeads = dashboard?.totalActiveLeads ?? 0;
    const admissions = dashboard?.admissionsThisMonth ?? 0;
    const pendingFollowUps = dashboard?.pendingFollowUps ?? 0;

    const statusData = orderedCountData(
      leadsByStatus,
      STATUS_ORDER,
      STATUS_COLORS,
      '#94a3b8',
    );
    const temperatureData = orderedCountData(
      leadsByTemperature,
      ['Hot', 'Warm', 'Cold'],
      TEMP_COLORS,
      '#94a3b8',
    );
    const sourceData = countMapToChartData(leadsBySource, SOURCE_COLORS);

    const pipelineTotal = sumValues(statusData);
    const temperatureTotal = sumValues(temperatureData);
    const hotLeads = leadsByTemperature.Hot ?? 0;

    return {
      activeLeads,
      admissions,
      pendingFollowUps,
      statusData,
      temperatureData,
      sourceData,
      pipelineTotal,
      temperatureTotal,
      hotLeads,
      admissionRate: safeRatio(admissions, Math.max(activeLeads, 1)),
      followUpPressure: safeRatio(pendingFollowUps, Math.max(activeLeads, 1)),
      hotLeadShare: safeRatio(hotLeads, Math.max(temperatureTotal, 1)),
    };
  }, [dashboard]);

  const trends = useMemo(() => trendsResponse?.trends ?? [], [trendsResponse]);
  const trendSummary = useMemo(() => {
    const totalCreated = trends.reduce((sum, item) => sum + item.count, 0);
    const bestDay = trends.reduce<TrendPoint | null>((best, item) => {
      if (!best || item.count > best.count) return item;
      return best;
    }, null);

    return {
      totalCreated,
      averagePerDay: trends.length ? totalCreated / trends.length : 0,
      bestDay,
    };
  }, [trends]);

  const staffRows = useMemo(() => {
    return [...(staffResponse?.staff ?? [])].sort(
      (a, b) => (b.activitiesThisWeek ?? 0) - (a.activitiesThisWeek ?? 0),
    );
  }, [staffResponse?.staff]);

  const staffSummary = useMemo(() => {
    const totals = staffRows.reduce(
      (acc, staff) => {
        acc.leadsCreated += staff.leadsCreated ?? 0;
        acc.admissions += staff.admissions ?? 0;
        acc.activities += staff.activitiesThisWeek ?? 0;
        return acc;
      },
      { leadsCreated: 0, admissions: 0, activities: 0 },
    );

    return {
      ...totals,
      topPerformer: staffRows[0]?.name,
      maxActivities: Math.max(
        1,
        ...staffRows.map((staff) => staff.activitiesThisWeek ?? 0),
      ),
    };
  }, [staffRows]);

  const monthLabel = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-5 md:space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="h-6 rounded-lg">
              Admin analytics
            </Badge>
            <Badge variant="secondary" className="h-6 rounded-lg">
              30-day trend
            </Badge>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              Analytics Dashboard
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Pipeline health, admissions momentum, and staff activity for
              {` ${monthLabel}`}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-card p-2 text-center shadow-sm sm:min-w-[360px]">
          <HeaderMetric
            label="Created"
            value={compactNumberFormatter.format(trendSummary.totalCreated)}
          />
          <HeaderMetric
            label="Avg/day"
            value={trendSummary.averagePerDay.toFixed(1)}
          />
          <HeaderMetric
            label="Best day"
            value={
              trendSummary.bestDay
                ? compactNumberFormatter.format(trendSummary.bestDay.count)
                : '0'
            }
          />
        </div>
      </header>

      {dashLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Active Leads"
            value={analytics.activeLeads}
            detail={`${formatPercent(analytics.admissionRate)} admission rate`}
            Icon={Users}
            tone="indigo"
          />
          <KpiCard
            label="Admissions This Month"
            value={analytics.admissions}
            detail="Confirmed from current pipeline"
            Icon={GraduationCap}
            tone="emerald"
          />
          <KpiCard
            label="Pending Follow-ups"
            value={analytics.pendingFollowUps}
            detail={`${formatPercent(analytics.followUpPressure)} of active leads`}
            Icon={Clock}
            tone="amber"
          />
          <KpiCard
            label="Hot Leads"
            value={analytics.hotLeads}
            detail={`${formatPercent(analytics.hotLeadShare)} of qualified leads`}
            Icon={Flame}
            tone="rose"
          />
        </div>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <AnalyticsCard
          title="Lead Creation Trend"
          description="Daily created leads across the last 30 days."
          action={
            <Badge variant="outline" className="rounded-lg">
              {formatNumber(trendSummary.totalCreated)} total
            </Badge>
          }
        >
          {trendsLoading ? (
            <Skeleton className="h-[286px] w-full rounded-lg" />
          ) : trends.length === 0 ? (
            <EmptyState
              title="Not enough trend data"
              description="Lead creation history will appear as the team adds leads."
              className="min-h-[286px] py-10"
            />
          ) : (
            <div className="h-[286px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trends}
                  margin={{ top: 12, right: 14, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="leadTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="var(--border)"
                    strokeDasharray="4 6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                    tick={{
                      fontSize: 11,
                      fill: 'var(--muted-foreground)',
                    }}
                    tickFormatter={formatShortDate}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={34}
                    tick={{
                      fontSize: 11,
                      fill: 'var(--muted-foreground)',
                    }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(value) => formatLongDate(String(value))}
                    formatter={(value) => [
                      formatNumber(Number(value)),
                      'Leads',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#4f46e5"
                    fill="url(#leadTrend)"
                    strokeWidth={3}
                    isAnimationActive={false}
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#4f46e5' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Pipeline by Status"
          description="Where active and closed leads currently sit."
          action={
            <Badge variant="outline" className="rounded-lg">
              {formatNumber(analytics.pipelineTotal)} leads
            </Badge>
          }
        >
          {dashLoading ? (
            <Skeleton className="h-[286px] w-full rounded-lg" />
          ) : analytics.statusData.length === 0 ? (
            <EmptyState
              title="No pipeline data"
              description="Status distribution will appear once leads exist."
              className="min-h-[286px] py-10"
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(180px,0.75fr)_1fr] xl:grid-cols-1 2xl:grid-cols-[minmax(180px,0.85fr)_1fr]">
              <DonutChart
                data={analytics.statusData}
                total={analytics.pipelineTotal}
                label="Leads"
              />
              <LegendList
                data={analytics.statusData}
                total={analytics.pipelineTotal}
              />
            </div>
          )}
        </AnalyticsCard>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <AnalyticsCard
          title="Acquisition Sources"
          description="Lead volume by source, sorted by contribution."
          action={
            <Badge variant="outline" className="rounded-lg">
              {analytics.sourceData[0]?.name ?? 'No source'}
            </Badge>
          }
        >
          {dashLoading ? (
            <Skeleton className="h-[260px] w-full rounded-lg" />
          ) : analytics.sourceData.length === 0 ? (
            <EmptyState
              title="No source data"
              description="Source performance will appear once leads are tagged."
              className="min-h-[260px] py-10"
            />
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.sourceData}
                  layout="vertical"
                  margin={{ top: 8, right: 22, left: 8, bottom: 4 }}
                  barCategoryGap={16}
                >
                  <CartesianGrid
                    stroke="var(--border)"
                    strokeDasharray="4 6"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    tick={{
                      fontSize: 11,
                      fill: 'var(--muted-foreground)',
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={94}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: 'var(--muted-foreground)',
                    }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [
                      formatNumber(Number(value)),
                      'Leads',
                    ]}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 8, 8, 0]}
                    isAnimationActive={false}
                  >
                    {analytics.sourceData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Lead Temperature"
          description="Qualification mix across hot, warm, and cold leads."
          action={
            <Badge
              variant={analytics.hotLeads > 0 ? 'destructive' : 'outline'}
              className="rounded-lg"
            >
              {formatNumber(analytics.hotLeads)} hot
            </Badge>
          }
        >
          {dashLoading ? (
            <Skeleton className="h-[260px] w-full rounded-lg" />
          ) : analytics.temperatureData.length === 0 ? (
            <EmptyState
              title="No temperature data"
              description="Temperature mix appears after leads are qualified."
              className="min-h-[260px] py-10"
            />
          ) : (
            <div className="grid min-h-[260px] content-center gap-5 sm:grid-cols-[180px_1fr]">
              <DonutChart
                data={analytics.temperatureData}
                total={analytics.temperatureTotal}
                label="Qualified"
              />
              <div className="space-y-3 self-center">
                {analytics.temperatureData.map((entry) => (
                  <ProgressRow
                    key={entry.name}
                    label={entry.name}
                    value={entry.value}
                    total={analytics.temperatureTotal}
                    color={entry.color}
                  />
                ))}
              </div>
            </div>
          )}
        </AnalyticsCard>
      </div>

      <AnalyticsCard
        title="Staff Performance"
        description="Activity, lead creation, and admissions from the last 7 days."
        action={
          <Badge variant="outline" className="rounded-lg">
            {staffSummary.topPerformer ?? 'No activity'}
          </Badge>
        }
      >
        {staffLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : staffRows.length === 0 ? (
          <EmptyState
            title="No staff data"
            description="Team activity appears once staff start working leads."
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryStat
                label="Leads Created"
                value={staffSummary.leadsCreated}
                Icon={ListChecks}
              />
              <SummaryStat
                label="Admissions"
                value={staffSummary.admissions}
                Icon={Award}
              />
              <SummaryStat
                label="Activities"
                value={staffSummary.activities}
                Icon={Activity}
              />
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Staff
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">
                      Leads
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">
                      Admissions
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">
                      Admission Rate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Activity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staffRows.map((staff, index) => {
                    const leadsCreated = staff.leadsCreated ?? 0;
                    const admissions = staff.admissions ?? 0;
                    const activities = staff.activitiesThisWeek ?? 0;
                    const activityWidth = safeRatio(
                      activities,
                      staffSummary.maxActivities,
                    );

                    return (
                      <tr
                        key={staff._id}
                        className="border-b border-border last:border-b-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium text-foreground">
                                {staff.name || 'Unnamed staff'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Last 7 days
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {formatNumber(leadsCreated)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {formatNumber(admissions)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatPercent(safeRatio(admissions, leadsCreated))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${activityWidth * 100}%` }}
                              />
                            </div>
                            <span className="w-10 text-right font-medium text-foreground">
                              {formatNumber(activities)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AnalyticsCard>
    </div>
  );
}

function AnalyticsCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="gap-2 border-b border-border/70 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function KpiCard({
  label,
  value,
  detail,
  Icon,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: 'indigo' | 'emerald' | 'amber' | 'rose';
}) {
  const toneMap = {
    indigo: {
      icon: 'bg-indigo-500/12 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300',
      accent: 'text-indigo-600 dark:text-indigo-300',
    },
    emerald: {
      icon: 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
      accent: 'text-emerald-600 dark:text-emerald-300',
    },
    amber: {
      icon: 'bg-amber-500/14 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
      accent: 'text-amber-700 dark:text-amber-300',
    },
    rose: {
      icon: 'bg-rose-500/12 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300',
      accent: 'text-rose-600 dark:text-rose-300',
    },
  }[tone];

  return (
    <Card className="shadow-sm transition-colors hover:ring-foreground/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold leading-tight text-foreground">
              {formatNumber(value)}
            </p>
          </div>
          <div className={cn('rounded-lg p-2.5', toneMap.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <ArrowUpRight className={cn('h-3.5 w-3.5', toneMap.accent)} />
          <span>{detail}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg px-2 py-2">
      <p className="text-lg font-semibold leading-none text-foreground">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  Icon,
}: {
  label: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="rounded-lg bg-background p-2 text-primary ring-1 ring-border">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">
          {formatNumber(value)}
        </p>
      </div>
    </div>
  );
}

function DonutChart({
  data,
  total,
  label,
}: {
  data: ChartDatum[];
  total: number;
  label: string;
}) {
  return (
    <div className="relative mx-auto h-[190px] w-full max-w-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={82}
            paddingAngle={3}
            stroke="var(--card)"
            strokeWidth={3}
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              formatNumber(Number(value)),
              String(name),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
        <div>
          <p className="text-2xl font-bold leading-none text-foreground">
            {formatNumber(total)}
          </p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function LegendList({ data, total }: { data: ChartDatum[]; total: number }) {
  return (
    <div className="space-y-2">
      {data.map((entry) => (
        <ProgressRow
          key={entry.name}
          label={entry.name}
          value={entry.value}
          total={total}
          color={entry.color}
        />
      ))}
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const ratio = safeRatio(value, total);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="truncate font-medium text-foreground">{label}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          <span>{formatNumber(value)}</span>
          <span>{formatPercent(ratio)}</span>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${ratio * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function orderedCountData(
  counts: CountMap,
  order: string[],
  colors: Record<string, string>,
  fallbackColor: string,
) {
  const known = order
    .map((name) => ({
      name,
      value: counts[name] ?? 0,
      color: colors[name] ?? fallbackColor,
    }))
    .filter((item) => item.value > 0);

  const extras = Object.entries(counts)
    .filter(([name, value]) => !order.includes(name) && value > 0)
    .map(([name, value]) => ({
      name,
      value,
      color: fallbackColor,
    }));

  return [...known, ...extras];
}

function countMapToChartData(counts: CountMap, colors: string[]) {
  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
}

function sumValues(data: Pick<ChartDatum, 'value'>[]) {
  return data.reduce((sum, item) => sum + item.value, 0);
}

function safeRatio(value: number, total: number) {
  if (!total || !Number.isFinite(total)) return 0;
  return Math.max(0, value / total);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value * 100)}%`;
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
