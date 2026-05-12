import { appendCapped } from '@/lib/cap';
import type { ErrorRecord } from '@/lib/types';

function rec(id: string): ErrorRecord {
  return { id, timestamp: 0, statusCode: 404, method: 'GET', url: '/x' };
}

describe('appendCapped', () => {
  it('appends a record when under cap', () => {
    const result = appendCapped([rec('a')], rec('b'), 20);
    expect(result.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('drops oldest when over cap', () => {
    const initial = Array.from({ length: 20 }, (_, i) => rec(String(i)));
    const result = appendCapped(initial, rec('new'), 20);
    expect(result).toHaveLength(20);
    expect(result[0].id).toBe('1');
    expect(result[19].id).toBe('new');
  });
});
