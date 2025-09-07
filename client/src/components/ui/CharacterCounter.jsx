const CharacterCounter = ({ current = 0, max }) => {
  const ratio = max > 0 ? current / max : 0;

  const colorClass =
    ratio >= 1
      ? 'text-danger-600 dark:text-danger-400'
      : ratio >= 0.8
        ? 'text-warning-600 dark:text-warning-400'
        : 'text-success-600 dark:text-success-400';

  return (
    <p className={`text-xs mt-1 text-right transition-colors ${colorClass}`}>
      {current} / {max} characters
    </p>
  );
};

export default CharacterCounter;
