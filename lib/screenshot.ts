export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) throw new Error('invalid data url');
  const meta = dataUrl.slice(0, comma);
  const base64 = dataUrl.slice(comma + 1);
  const mime = /:(.*?);/.exec(meta)?.[1] || 'application/octet-stream';
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function copyDataUrlToClipboard(dataUrl: string): Promise<void> {
  const blob = dataUrlToBlob(dataUrl);
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}

// Extension pages (popup, errors.html) can call this directly.
// Content scripts must bridge via background (no chrome.tabs there).
export async function captureToClipboard(): Promise<void> {
  const dataUrl = await browser.tabs.captureVisibleTab({ format: 'png' });
  await copyDataUrlToClipboard(dataUrl);
}
