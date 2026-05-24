/**
 * Resolve a stored photoUrl into an actual <img src>.
 * Convention: if the value is empty, a full URL (http(s):// or data:), or starts with "/",
 * use it as-is. Otherwise treat it as a filename inside /public/photos/.
 *
 * Examples:
 *   "tamar.png"               -> "/photos/tamar.png"
 *   "/photos/tamar.png"       -> "/photos/tamar.png"
 *   "https://x/y.jpg"         -> "https://x/y.jpg"
 *   "data:image/png;base64,…" -> as-is
 */
export function resolvePhotoUrl(value: string | undefined | null): string {
  if (!value) return '';
  const v = value.trim();
  if (!v) return '';
  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:') || v.startsWith('/')) {
    return v;
  }
  return `/photos/${v}`;
}
