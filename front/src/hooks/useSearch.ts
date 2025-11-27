import { useCallback, useEffect, useState } from 'react';
import debounce from '../utils/debounce';
import { useSearchParams } from 'react-router-dom';

function getSearchValue() {
  const search = new URLSearchParams(document.location.search);
  return search.get('search') || '';
}

const setSearchValueDebounce = debounce((func: (value: string) => void, value: string) => func(value), 300);
    
export default function useSearch(): [string, (value: string) => void] {
    const [search, setSearch] = useState<string>(getSearchValue);
    const [searchParams, setSearchParams] = useSearchParams();

    const changeValue = useCallback((value: string) => {
        setSearch(value);
        // Preserve existing query params and update only `search`
        setSearchValueDebounce((val: string) => {
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
