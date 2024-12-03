export default function OrgCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse" dir="rtl">
      <div className="flex items-center space-x-reverse space-x-4 mb-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
        </div>
      </div>

      <div className="mt-4 flex space-x-reverse space-x-2">
        <div className="h-8 bg-gray-200 rounded w-24"></div>
        <div className="h-8 bg-gray-200 rounded w-20"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
