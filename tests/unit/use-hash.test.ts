import { parseHashId } from '@/lib/use-hash';

describe('parseHashId', () => {
  it('returns id from #/id', () => {
    expect(parseHashId('#/abc-123')).toBe('abc-123');
  });

  it('decodes percent-encoding', () => {
    expect(parseHashId('#/a%2Fb')).toBe('a/b');
  });

  it('returns null for empty hash', () => {
    expect(parseHashId('')).toBe(null);
  });

  it('returns null for # only', () => {
    expect(parseHashId('#')).toBe(null);
  });

  it('returns null for nested path', () => {
    expect(parseHashId('#/a/b')).toBe(null);
  });
});
