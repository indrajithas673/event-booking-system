const SIZE_MAP = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

const Spinner = ({ size = 'md', fullPage = false, text = '' }) => {
  const spinner = (
    <div className={`${SIZE_MAP[size]} border-gray-300 dark:border-gray-600 border-t-primary-500 rounded-full animate-spin`} />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {spinner}
        {text && (
          <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">{text}</p>
        )}
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      {spinner}
      {text && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
      )}
    </span>
  );
};

export default Spinner;
