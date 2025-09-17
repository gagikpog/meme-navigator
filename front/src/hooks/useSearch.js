import { useCallback, useEffect, useState } from 'react';
import debounce from '../utils/debounce';
import { useSearchParams } from 'react-router-dom';

function getSearchValue() {
  const search = new URLSearchParams(document.location.search);
  return search.get('search') || '';
}

const setSearchValueDebounce = debounce((func, value) => func(value), 300);

export default function useSearch() {
    const [search, setSearch] = useState(getSearchValue);
    const [searchParams, setSearchParams] = useSearchParams();

    const changeValue = useCallback((value) => {
        setSearch(value);
        // Preserve existing query params and update only `search`
        setSearchValueDebounce((val) => {
            const params = new URLSearchParams(searchParams);
            if (val) {
                params.set('search', val);
            } else {
                params.delete('search');
            }
            setSearchParams(params);
        }, value);
    }, [searchParams, setSearchParams]);

    const currentSearchValue = searchParams.get('search') || '';
    useEffect(() => setSearch(currentSearchValue), [currentSearchValue]);

    return [search, changeValue];
}
