export function imageUrlWithCacheBust(url?: string | null, ts?: string | number | null) {
  if (!url) return url ?? '';
  if (!ts) return url;
  try {
    const s = typeof ts === 'number' ? String(ts) : ts;
    const hasQuery = url.includes('?');
    const delim = hasQuery ? '&' : '?';
    return `${url}${delim}t=${encodeURIComponent(s)}`;
  } catch (err) {
    return url;
  }
}

export default imageUrlWithCacheBust;
