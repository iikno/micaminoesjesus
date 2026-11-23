import { useEffect, useState } from 'react';

// Returns `fallback` (the static data file) until the API answers, and keeps it if the API is
// unavailable, so `npm run dev` without a backend keeps working.
export function useApi(path, fallback) {
  const [data, setData] = useState(fallback);
  useEffect(() => {
    const ac = new AbortController();
    fetch(path, { signal: ac.signal, headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setData)
      .catch(() => {});
    return () => ac.abort();
  }, [path]);
  return data;
}
