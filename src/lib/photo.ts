/**
 * Resolve a stored photoUrl into an actual <img src>.
 * Convention: if the value is a full URL (http(s):// or data:), use as-is.
 * Otherwise treat it as a filename and look up /photos/<filename> under the app's base path
 * (which is "/" in dev and "/team_plan_view/" on GitHub Pages).
 */
export function resolvePhotoUrl(value: string | undefined | null): string {
  if (!value) return '';
  const v = value.trim();
  if (!v) return '';
  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:')) {
    return v;
  }
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const clean = v.replace(/^\/+/, '').replace(/^photos\//, '');
  return `${base}/photos/${clean}`;
}
