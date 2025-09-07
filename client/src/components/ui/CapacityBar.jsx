const SIZE_MAP = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const getBarColor = (percentage) => {
  if (percentage >= 90) return 'bg-danger-500';
  if (percentage >= 70) return 'bg-warning-500';
  return 'bg-success-500';
};

const CapacityBar = ({ current, total, showLabel = true, size = 'md' }) => {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const heightClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>{current} / {total}</span>
          <span className={`font-medium ${getBarColor(percentage).replace('bg-', 'text-')}`}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className={`w-full ${heightClass} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getBarColor(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default CapacityBar;
