/**
 * Compress an uploaded image File to a JPEG data URL under a max width.
 *
 * Why: storing original-resolution screenshots as base64 in localStorage
 * blows past the ~5MB origin quota and silently wipes the saved state on
 * reload. Resizing + JPEG-encoding typically drops a 2-3MB PNG to <200KB.
 *
 * Returns a data URL ready to put into <img src>. Falls back to the raw
 * data URL if anything goes wrong (e.g. an SVG / GIF where canvas encode
 * isn't ideal).
 */
export async function compressImage(
  file: File,
  opts: { maxWidth?: number; quality?: number } = {},
): Promise<string> {
  const { maxWidth = 1200, quality = 0.82 } = opts;
  const rawDataUrl = await readAsDataUrl(file);
  // Skip work for tiny files
  if (file.size < 200_000) return rawDataUrl;
  try {
    const img = await loadImage(rawDataUrl);
    const ratio = Math.min(maxWidth / img.width, 1);
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return rawDataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return rawDataUrl;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('file read failed'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}
