import { PropertyCardSkeleton, ShimmerWrapper } from "@/components/ui/advanced-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

interface PropertyListSkeletonProps {
  count?: number;
  showFilters?: boolean;
}

const PropertyListSkeleton = ({ count = 6, showFilters = false }: PropertyListSkeletonProps) => {
  return (
    <ShimmerWrapper className="space-y-6 w-full">
      {showFilters && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="flex flex-wrap gap-3">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-full" />
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(count)
          .fill(0)
          .map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
      </div>

      {count > 3 && (
        <div className="flex justify-center mt-8">
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      )}
    </ShimmerWrapper>
  );
};

export default PropertyListSkeleton;