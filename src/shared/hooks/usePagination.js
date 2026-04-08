import { useState, useCallback } from 'react';

export default function usePagination(initialLimit = 50) {
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const pages = Math.ceil(total / limit) || 1;

  const next = useCallback(() => setPage(p => Math.min(p + 1, pages)), [pages]);
  const prev = useCallback(() => setPage(p => Math.max(p - 1, 1)), []);
  const goTo = useCallback((n) => setPage(Math.max(1, Math.min(n, pages))), [pages]);
  const reset = useCallback(() => setPage(1), []);

  return { page, limit, total, pages, setTotal, next, prev, goTo, reset };
}
