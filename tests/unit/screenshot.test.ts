import { dataUrlToBlob } from '@/lib/screenshot';

describe('dataUrlToBlob', () => {
  it('decodes base64 data URL into a Blob with the declared mime', async () => {
    // "PNG" in bytes — base64 'UE5H'
    const dataUrl = 'data:image/png;base64,UE5H';
    const blob = dataUrlToBlob(dataUrl);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBe(3);
    const text = await blob.text();
    expect(text).toBe('PNG');
  });

  it('falls back to octet-stream when mime is missing', () => {
    const dataUrl = 'data:;base64,UE5H';
    const blob = dataUrlToBlob(dataUrl);
    expect(blob.type).toBe('application/octet-stream');
  });

  it('throws on input without a comma separator', () => {
    expect(() => dataUrlToBlob('not-a-data-url')).toThrow();
  });
});
