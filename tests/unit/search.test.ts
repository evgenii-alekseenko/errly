import { matchesSearch } from '@/lib/search';
import { matchesType } from '@/lib/filter';
import type { ErrorRecord } from '@/lib/types';

function net(over: Partial<Extract<ErrorRecord, { kind: 'network' }>> = {}): ErrorRecord {
  return {
    kind: 'network',
    id: 'x',
    timestamp: 0,
    statusCode: 404,
    method: 'GET',
    url: '/api/missing',
    ...over,
  };
}

function runtime(over: Partial<Extract<ErrorRecord, { kind: 'runtime' }>> = {}): ErrorRecord {
  return {
    kind: 'runtime',
    id: 'r',
    timestamp: 0,
    message: 'TypeError: x is not defined',
    source: 'app.js',
    ...over,
  };
}

describe('matchesSearch', () => {
  it('empty query matches anything', () => {
    expect(matchesSearch(net(), '')).toBe(true);
    expect(matchesSearch(net(), '   ')).toBe(true);
  });

  it('matches url substring case-insensitive', () => {
    expect(matchesSearch(net({ url: '/API/Users' }), 'users')).toBe(true);
    expect(matchesSearch(net({ url: '/api/users' }), 'POSTS')).toBe(false);
  });

  it('matches status code as string', () => {
    expect(matchesSearch(net({ statusCode: 503 }), '503')).toBe(true);
    expect(matchesSearch(net({ statusCode: 404 }), '50')).toBe(false);
  });

  it('matches method', () => {
    expect(matchesSearch(net({ method: 'POST' }), 'post')).toBe(true);
  });

  it('matches errorText for network-level failures', () => {
    expect(matchesSearch(net({ statusCode: 0, errorText: 'net::ERR_CONNECTION_REFUSED' }), 'refused')).toBe(true);
  });

  it('matches runtime message + source + stack', () => {
    expect(matchesSearch(runtime({ message: 'Boom!' }), 'boom')).toBe(true);
    expect(matchesSearch(runtime({ source: 'vendor.js' }), 'vendor')).toBe(true);
    expect(matchesSearch(runtime({ stack: 'at Foo (bar.js:1)' }), 'foo')).toBe(true);
  });
});

describe('matchesType', () => {
  it('all matches everything', () => {
    expect(matchesType(net(), 'all')).toBe(true);
    expect(matchesType(runtime(), 'all')).toBe(true);
  });

  it('network only', () => {
    expect(matchesType(net(), 'network')).toBe(true);
    expect(matchesType(runtime(), 'network')).toBe(false);
  });

  it('runtime only', () => {
    expect(matchesType(runtime(), 'runtime')).toBe(true);
    expect(matchesType(net(), 'runtime')).toBe(false);
  });
});
