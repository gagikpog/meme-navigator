import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const VALID = ['all', 'public', 'private'];
const normalize = (val) => (VALID.includes(val) ? val : 'all');

export default function usePermFilter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [perm, setPerm] = useState(() => normalize(searchParams.get('perm') || 'all'));

  // Keep state in sync when navigation changes query
  useEffect(() => {
    const q = normalize(searchParams.get('perm') || 'all');
    if (q !== perm) setPerm(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update query preserving other params
  const changePerm = useCallback(
    (value) => {
      const next = normalize(value || 'all');
      setPerm(next);
      const params = new URLSearchParams(searchParams);
      if (next === 'all') params.delete('perm'); else params.set('perm', next);
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  return [perm, changePerm];
}



