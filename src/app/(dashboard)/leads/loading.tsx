import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function LeadsLoading() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between pb-4">
        <div>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Filter skeleton */}
      <Card className="rounded-xl">
        <CardContent className="p-2 sm:p-3">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-full md:max-w-md rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg hidden sm:block" />
            <Skeleton className="h-10 w-10 sm:w-24 rounded-lg" />
          </div>
        </CardContent>
      </Card>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="rounded-xl">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
