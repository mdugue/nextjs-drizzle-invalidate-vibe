import { Skeleton } from "@/app/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-4 w-80" />
    </div>
  );
}
