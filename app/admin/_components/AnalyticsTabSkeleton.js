export default function AnalyticsTabSkeleton() {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="h-[300px] md:h-[600px] bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
  
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-36 mb-4"></div>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="bg-gray-50 p-4">
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="p-4">
                    <div className="grid grid-cols-4 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }