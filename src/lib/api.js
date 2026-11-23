import { useCallback, useEffect, useState } from 'react';

// Returns `fallback` (the static data file) until the API answers, and keeps it if the API is
// unavailable, so `npm run dev` without a backend keeps working. Used only where a cheap static copy exists (calendar).
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

// Public data with explicit states: { data, loading, error, retry }. Answers are shared for a minute across pages,
// so moving between pages does not refetch the catalog.
const TTL = 60e3;
const cache = new Map();
function load(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL) return hit.p;
  const p = fetch(path, { headers: { Accept: 'application/json' } }).then((r) => {
    if (!r.ok) throw Object.assign(new Error(String(r.status)), { status: r.status });
    return r.json();
  });
  cache.set(path, { at: Date.now(), p });
  p.catch(() => cache.delete(path));
  return p;
}

export function useData(path) {
  const [s, setS] = useState({ path: null, data: null, error: null });
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    if (n) cache.delete(path);
    load(path).then((data) => live && setS({ path, data, error: null }), (error) => live && setS({ path, data: null, error }));
    return () => { live = false; };
  }, [path, n]);
  const retry = useCallback(() => { setS({ path: null, data: null, error: null }); setN((x) => x + 1); }, []);
  const ready = s.path === path;
  return { data: ready ? s.data : null, error: ready ? s.error : null, loading: !ready, retry };
}
