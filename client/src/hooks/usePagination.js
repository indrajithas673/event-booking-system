import { useState, useCallback, useMemo } from 'react';

const usePagination = (totalPages) => {
  const [page, setPage] = useState(1);

  const nextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback(
    (targetPage) => {
      const clamped = Math.max(1, Math.min(targetPage, totalPages));
      setPage(clamped);
    },
    [totalPages]
  );

  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages]);
  const hasPrevPage = useMemo(() => page > 1, [page]);

  return { page, nextPage, prevPage, goToPage, hasNextPage, hasPrevPage };
};

export default usePagination;
