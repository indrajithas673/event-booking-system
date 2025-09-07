import { useEffect, useCallback } from 'react';
import Spinner from './Spinner';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}) => {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    },
    [onClose, isLoading]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {isDanger && (
            <div className="shrink-0 w-10 h-10 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-danger-600 dark:text-danger-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
          )}
          <div>
            <h3 id="confirm-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {message && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2
              ${isDanger
                ? 'bg-danger-600 hover:bg-danger-700'
                : 'bg-primary-600 hover:bg-primary-700'
              }`}
          >
            {isLoading && <Spinner size="sm" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
