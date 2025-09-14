export default function DocumentSkeleton() {
  return (
    <div className="flex bg-surface rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="w-3 bg-gray-200"></div>
      <div className="flex-1 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
          <div className="w-24 h-6 bg-gray-200 rounded"></div>
        </div>

        <div className="mb-4 space-y-2">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
          <div className="w-20 h-8 bg-gray-200 rounded"></div>
          <div className="w-20 h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}