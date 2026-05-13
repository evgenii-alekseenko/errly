import { useEffect, useState } from 'react';

export function parseHashId(hash: string): string | null {
  const m = hash.match(/^#\/([^/?#]+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function useHashId(): string | null {
  const [id, setId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : parseHashId(window.location.hash),
  );
  useEffect(() => {
    const onChange = () => setId(parseHashId(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return id;
}

export function navigateToId(id: string | null): void {
  window.location.hash = id ? `/${encodeURIComponent(id)}` : '';
}
