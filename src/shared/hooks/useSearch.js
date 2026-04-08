import { useState, useCallback } from 'react';
import { debounce } from '../utils/helpers';

export default function useSearch(onSearch) {
  const [query, setQuery] = useState('');

  const debouncedSearch = useCallback(
    debounce((val) => onSearch?.(val), 300),
    [onSearch]
  );

  const handleChange = useCallback((e) => {
    const val = e.target?.value ?? e;
    setQuery(val);
    debouncedSearch(val);
  }, [debouncedSearch]);

  const clear = useCallback(() => {
    setQuery('');
    onSearch?.('');
  }, [onSearch]);

  return { query, handleChange, clear, setQuery };
}
