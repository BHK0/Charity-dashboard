export default function FarmersManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters Skeleton */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Image Skeleton */}
            <div className="h-48 bg-gray-200 animate-pulse"></div>

            {/* Content Skeleton */}
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
              </div>

              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>

              <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 