export default function DonationsListSkeleton() {
  return (
    <div className="mt-4" dir="rtl">
      <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <div className="min-w-full">
          <div className="bg-gray-50 p-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="p-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
