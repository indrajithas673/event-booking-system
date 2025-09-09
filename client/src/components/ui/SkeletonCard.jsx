const SkeletonCard = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col animate-pulse">
      {/* Image placeholder */}
      <div className="h-48 bg-gray-200 dark:bg-gray-700" />

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />

        {/* Date line */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>

        {/* Location line */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>

        {/* Capacity bar */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
